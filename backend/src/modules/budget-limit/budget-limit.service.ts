import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { BudgetLimit, BudgetLimitDocument } from '../../schemas/budget-limit.schema';
import { PartnerRoomService } from '../partner-room/partner-room.service';
import { TransactionService } from '../transaction/transaction.service';
import { getCurrentBudgetPeriodBounds } from '../../utils/budget-period.util';

@Injectable()
export class BudgetLimitService {
  constructor(
    @InjectModel(BudgetLimit.name)
    private budgetLimitModel: Model<BudgetLimitDocument>,
    private partnerRoomService: PartnerRoomService,
    private transactionService: TransactionService,
  ) {}

  private async ensureRoomAccess(
    userId: Types.ObjectId,
    roomId?: Types.ObjectId,
  ): Promise<void> {
    if (!roomId) return;
    const room = await this.partnerRoomService.findById(roomId.toString(), userId);
    if (!room) throw new ForbiddenException('Room not found or access denied');
  }

  async create(
    userId: Types.ObjectId,
    data: {
      category: string;
      limit: number;
      currency?: string;
      period: 'daily' | 'weekly' | 'monthly';
      roomId?: Types.ObjectId;
    },
  ): Promise<BudgetLimitDocument & { spent: number }> {
    await this.ensureRoomAccess(userId, data.roomId);
    const doc = await this.budgetLimitModel.create({
      userId,
      category: data.category,
      limit: data.limit,
      currency: (data.currency ?? 'USD').toUpperCase(),
      period: data.period,
      roomId: data.roomId,
    });
    const spent = await this.computeSpent(userId, doc);
    return Object.assign(doc.toObject(), { spent });
  }

  async findAll(
    userId: Types.ObjectId,
    roomId?: Types.ObjectId,
  ): Promise<
    (BudgetLimitDocument & { spent: number })[]
  > {
    await this.ensureRoomAccess(userId, roomId);
    const filter: Record<string, unknown> = { userId };
    if (roomId) filter.roomId = roomId;
    else filter.$or = [{ roomId: { $exists: false } }, { roomId: null }];
    const docs = await this.budgetLimitModel.find(filter).sort({ createdAt: -1 }).exec();
    const out: (BudgetLimitDocument & { spent: number })[] = [];
    for (const doc of docs) {
      const spent = await this.computeSpent(userId, doc);
      out.push(Object.assign(doc.toObject(), { spent }));
    }
    return out;
  }

  async update(
    id: string,
    userId: Types.ObjectId,
    data: Partial<{ limit: number; period: 'daily' | 'weekly' | 'monthly' }>,
  ): Promise<BudgetLimitDocument & { spent: number }> {
    const doc = await this.budgetLimitModel
      .findOne({ _id: new Types.ObjectId(id), userId })
      .exec();
    if (!doc) throw new NotFoundException('Budget limit not found');
    await this.ensureRoomAccess(userId, doc.roomId);
    if (data.limit !== undefined) doc.limit = data.limit;
    if (data.period !== undefined) doc.period = data.period;
    await doc.save();
    const spent = await this.computeSpent(userId, doc);
    return Object.assign(doc.toObject(), { spent });
  }

  async delete(id: string, userId: Types.ObjectId): Promise<boolean> {
    const doc = await this.budgetLimitModel
      .findOne({ _id: new Types.ObjectId(id), userId })
      .exec();
    if (!doc) throw new NotFoundException('Budget limit not found');
    await this.ensureRoomAccess(userId, doc.roomId);
    const r = await this.budgetLimitModel.deleteOne({ _id: doc._id }).exec();
    return r.deletedCount === 1;
  }

  private async computeSpent(
    userId: Types.ObjectId,
    doc: BudgetLimitDocument,
  ): Promise<number> {
    const { from, to } = getCurrentBudgetPeriodBounds(doc.period);
    return this.transactionService.sumExpenseForCategory(userId, {
      roomId: doc.roomId,
      category: doc.category,
      from,
      to,
      outputCurrency: doc.currency,
    });
  }

  async getStatus(
    userId: Types.ObjectId,
    roomId?: Types.ObjectId,
  ): Promise<
    {
      category: string;
      limit: number;
      spent: number;
      percentage: number;
      isOver: boolean;
    }[]
  > {
    const list = await this.findAll(userId, roomId);
    return list.map((row) => {
      const limit = row.limit;
      const spent = row.spent;
      const percentage =
        limit > 0 ? Math.min(100, Math.round((spent / limit) * 10000) / 100) : 0;
      return {
        category: row.category,
        limit,
        spent,
        percentage,
        isOver: spent > limit,
      };
    });
  }

  async findAllDocumentsForUser(userId: Types.ObjectId): Promise<BudgetLimitDocument[]> {
    return this.budgetLimitModel.find({ userId }).exec();
  }
}
