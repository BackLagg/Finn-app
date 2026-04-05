import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  RecurringTransaction,
  RecurringTransactionDocument,
} from '../../schemas/recurring-transaction.schema';
import { PartnerRoomService } from '../partner-room/partner-room.service';
import { TransactionService } from '../transaction/transaction.service';
import { BudgetService } from '../budget/budget.service';
import { toMultiCurrencyAmount } from '../../utils/amount-currency.util';
import { addFrequencyUtc } from '../../utils/recurring-date.util';
import { parseLocalDate } from '../../utils/date.util';
import { TransactionDocument } from '../../schemas/transaction.schema';

const MAX_CATCH_UP = 100;

@Injectable()
export class RecurringTransactionService {
  constructor(
    @InjectModel(RecurringTransaction.name)
    private recurringModel: Model<RecurringTransactionDocument>,
    private partnerRoomService: PartnerRoomService,
    private transactionService: TransactionService,
    private budgetService: BudgetService,
  ) {}

  private async ensureRoomAccess(
    userId: Types.ObjectId,
    roomId?: Types.ObjectId,
  ): Promise<void> {
    if (!roomId) return;
    const room = await this.partnerRoomService.findById(roomId.toString(), userId);
    if (!room) throw new ForbiddenException('Room not found or access denied');
  }

  private async resolveCurrency(
    userId: Types.ObjectId,
    roomId?: Types.ObjectId,
    explicit?: string,
  ): Promise<string> {
    if (explicit) return explicit.toUpperCase();
    const budget = await this.budgetService.findForUser(userId, roomId);
    return (budget?.currency ?? 'USD').toUpperCase();
  }

  async create(
    userId: Types.ObjectId,
    data: {
      amount: number;
      type: 'income' | 'expense';
      category: string;
      description?: string;
      frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
      startDate: string;
      roomId?: Types.ObjectId;
      currency?: string;
    },
  ): Promise<RecurringTransactionDocument> {
    await this.ensureRoomAccess(userId, data.roomId);
    const currency = await this.resolveCurrency(userId, data.roomId, data.currency);
    const nextDate = parseLocalDate(data.startDate.slice(0, 10));
    return this.recurringModel.create({
      userId,
      amount: data.amount,
      type: data.type,
      category: data.category,
      description: data.description,
      frequency: data.frequency,
      nextDate,
      isActive: true,
      roomId: data.roomId,
      currency,
    });
  }

  async findAll(
    userId: Types.ObjectId,
    roomId?: Types.ObjectId,
  ): Promise<RecurringTransactionDocument[]> {
    await this.ensureRoomAccess(userId, roomId);
    const filter: Record<string, unknown> = { userId };
    if (roomId) filter.roomId = roomId;
    else filter.$or = [{ roomId: { $exists: false } }, { roomId: null }];
    return this.recurringModel.find(filter).sort({ nextDate: 1 }).exec();
  }

  async update(
    id: string,
    userId: Types.ObjectId,
    data: Partial<{
      amount: number;
      category: string;
      frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
      isActive: boolean;
    }>,
  ): Promise<RecurringTransactionDocument> {
    const doc = await this.recurringModel
      .findOne({ _id: new Types.ObjectId(id), userId })
      .exec();
    if (!doc) throw new NotFoundException('Recurring transaction not found');
    await this.ensureRoomAccess(userId, doc.roomId);
    if (data.amount !== undefined) doc.amount = data.amount;
    if (data.category !== undefined) doc.category = data.category;
    if (data.frequency !== undefined) doc.frequency = data.frequency;
    if (data.isActive !== undefined) doc.isActive = data.isActive;
    await doc.save();
    return doc;
  }

  async delete(id: string, userId: Types.ObjectId): Promise<boolean> {
    const doc = await this.recurringModel
      .findOne({ _id: new Types.ObjectId(id), userId })
      .exec();
    if (!doc) throw new NotFoundException('Recurring transaction not found');
    await this.ensureRoomAccess(userId, doc.roomId);
    const r = await this.recurringModel.deleteOne({ _id: doc._id }).exec();
    return r.deletedCount === 1;
  }

  async triggerManual(
    id: string,
    userId: Types.ObjectId,
  ): Promise<TransactionDocument> {
    const doc = await this.recurringModel
      .findOne({ _id: new Types.ObjectId(id), userId })
      .exec();
    if (!doc) throw new NotFoundException('Recurring transaction not found');
    await this.ensureRoomAccess(userId, doc.roomId);
    const tx = await this.createTransactionFromRecurring(doc);
    doc.lastTriggered = new Date();
    doc.nextDate = addFrequencyUtc(doc.nextDate, doc.frequency);
    await doc.save();
    return tx;
  }

  private async createTransactionFromRecurring(
    doc: RecurringTransactionDocument,
  ): Promise<TransactionDocument> {
    const currency = doc.currency || 'USD';
    return this.transactionService.create(doc.userId, {
      amount: toMultiCurrencyAmount(doc.amount, currency),
      inputCurrency: currency,
      type: doc.type,
      category: doc.category,
      date: new Date(),
      description: doc.description,
      roomId: doc.roomId,
      source: 'manual',
    });
  }

  async processDueRecurring(): Promise<number> {
    const now = new Date();
    const due = await this.recurringModel
      .find({ isActive: true, nextDate: { $lte: now } })
      .exec();
    let created = 0;
    for (const doc of due) {
      let guard = 0;
      while (doc.isActive && doc.nextDate <= now && guard < MAX_CATCH_UP) {
        guard++;
        await this.createTransactionFromRecurring(doc);
        doc.lastTriggered = new Date();
        doc.nextDate = addFrequencyUtc(doc.nextDate, doc.frequency);
        created++;
      }
      await doc.save();
    }
    return created;
  }
}
