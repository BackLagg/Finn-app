import { Injectable } from '@nestjs/common';
import { Inject } from '@nestjs/common';
import { Model, Types } from 'mongoose';
import { TransactionDocument } from '../../schemas/transaction.schema';
import { MultiCurrencyAmount } from '../../schemas/multi-currency-amount.schema';
import { PartnerRoomService } from '../partner-room/partner-room.service';
import { BudgetService } from '../budget/budget.service';
import { getAmountInCurrency } from '../../utils/amount-currency.util';

@Injectable()
export class TransactionService {
  constructor(
    @Inject('TransactionModel')
    private transactionModel: Model<TransactionDocument>,
    private partnerRoomService: PartnerRoomService,
    private budgetService: BudgetService,
  ) {}

  async create(
    userId: Types.ObjectId,
    data: {
      amount: MultiCurrencyAmount;
      inputCurrency: string;
      type: 'income' | 'expense';
      category: string;
      date?: Date;
      description?: string;
      roomId?: Types.ObjectId;
      source?: 'manual' | 'receipt_ai';
      receiptImageUrl?: string;
    },
  ): Promise<TransactionDocument> {
    let savingsAmount: number | undefined;
    if (data.type === 'income') {
      const budget = await this.budgetService.findForUser(userId, data.roomId);
      const savingsPercent = budget?.distribution?.savings ?? 20;
      const amountNum = Math.abs(
        getAmountInCurrency(data.amount, data.inputCurrency ?? 'USD'),
      );
      savingsAmount = Math.round((amountNum * savingsPercent) / 100 * 100) / 100;
    }
    const doc = await this.transactionModel.create({
      ...data,
      userId,
      date: data.date ?? new Date(),
      source: data.source ?? 'manual',
      inputCurrency: data.inputCurrency ?? 'USD',
      ...(savingsAmount !== undefined && { savingsAmount }),
    });
    return doc;
  }

  async findAll(
    userId: Types.ObjectId,
    options: { roomId?: Types.ObjectId; from?: Date; to?: Date; limit?: number } = {},
  ): Promise<TransactionDocument[]> {
    const filter: Record<string, unknown> = {};
    if (options.roomId) {
      const room = await this.partnerRoomService.findById(options.roomId.toString(), userId);
      if (!room) return [];
      const memberIds = room.members.map((m: any) =>
        typeof m.userId === 'object' && (m.userId as { _id?: Types.ObjectId })?._id
          ? (m.userId as { _id: Types.ObjectId })._id
          : (m.userId as Types.ObjectId),
      );
      filter.roomId = options.roomId;
      filter.userId = { $in: memberIds };
    } else {
      filter.userId = userId;
      filter.$or = [{ roomId: { $exists: false } }, { roomId: null }];
    }
    if (options.from || options.to) {
      filter.date = {};
      if (options.from) (filter.date as Record<string, Date>).$gte = options.from;
      if (options.to) (filter.date as Record<string, Date>).$lte = options.to;
    }
    const docs = await this.transactionModel
      .find(filter)
      .sort({ date: -1 })
      .limit(options.limit ?? 100)
      .exec();
    return docs;
  }

  async findById(
    id: string,
    userId: Types.ObjectId,
  ): Promise<TransactionDocument | null> {
    const doc = await this.transactionModel
      .findOne({ _id: new Types.ObjectId(id), userId })
      .exec();
    return doc;
  }

  async update(
    id: string,
    userId: Types.ObjectId,
    data: Partial<{ amount: MultiCurrencyAmount; inputCurrency: string; type: string; category: string; date: Date; description: string; receiptImageUrl: string }>,
  ): Promise<TransactionDocument | null> {
    return this.transactionModel
      .findOneAndUpdate({ _id: new Types.ObjectId(id), userId }, { $set: data }, { new: true })
      .exec();
  }

  async delete(id: string, userId: Types.ObjectId): Promise<boolean> {
    const result = await this.transactionModel
      .deleteOne({ _id: new Types.ObjectId(id), userId })
      .exec();
    return result.deletedCount === 1;
  }

  async getStatsByCategory(
    userId: Types.ObjectId,
    options: { roomId?: Types.ObjectId; from?: Date; to?: Date },
  ): Promise<{ category: string; total: number }[]> {
    const match = await this.buildRoomMatch(userId, options);
    if (!match) return [];
    match.type = 'expense';
    const result = await this.transactionModel.aggregate<{ _id: string; total: number }>([
      { $match: match },
      {
        $group: {
          _id: '$category',
          total: {
            $sum: {
              $add: [
                { $ifNull: ['$amount.USD', 0] },
                { $ifNull: ['$amount.EUR', 0] },
                { $ifNull: ['$amount.RUB', 0] },
                { $ifNull: ['$amount.BYN', 0] },
              ],
            },
          },
        },
      },
      { $sort: { total: -1 } },
    ]).exec();
    return result.map((r) => ({ category: r._id, total: r.total }));
  }

  async getTotalSavings(
    userId: Types.ObjectId,
    roomId?: Types.ObjectId,
  ): Promise<number> {
    const match = await this.buildRoomMatch(userId, { roomId });
    if (!match) return 0;
    (match as Record<string, unknown>).type = 'income';
    const result = await this.transactionModel.aggregate<{ total: number }>([
      { $match: match },
      {
        $group: {
          _id: null,
          total: { $sum: { $ifNull: ['$savingsAmount', 0] } },
        },
      },
    ]).exec();
    return result[0]?.total ?? 0;
  }

  async getStatsByMember(
    userId: Types.ObjectId,
    options: { roomId: Types.ObjectId; from?: Date; to?: Date },
  ): Promise<{ userId: string; total: number }[]> {
    const match = await this.buildRoomMatch(userId, options);
    if (!match) return [];
    match.type = 'expense';
    const result = await this.transactionModel.aggregate<{ _id: Types.ObjectId; total: number }>([
      { $match: match },
      {
        $group: {
          _id: '$userId',
          total: {
            $sum: {
              $add: [
                { $ifNull: ['$amount.USD', 0] },
                { $ifNull: ['$amount.EUR', 0] },
                { $ifNull: ['$amount.RUB', 0] },
                { $ifNull: ['$amount.BYN', 0] },
              ],
            },
          },
        },
      },
      { $sort: { total: -1 } },
    ]).exec();
    return result.map((r) => ({ userId: r._id.toString(), total: r.total }));
  }

  /**
   * Sums expense transactions for a category in a date window; amounts are read in outputCurrency.
   */
  async sumExpenseForCategory(
    userId: Types.ObjectId,
    params: {
      roomId?: Types.ObjectId;
      category: string;
      from: Date;
      to: Date;
      outputCurrency: string;
    },
  ): Promise<number> {
    const match = await this.buildRoomMatch(userId, {
      roomId: params.roomId,
      from: params.from,
      to: params.to,
    });
    if (!match) return 0;
    match.type = 'expense';
    match.category = params.category;
    const docs = await this.transactionModel.find(match).exec();
    let sum = 0;
    for (const doc of docs) {
      sum += getAmountInCurrency(doc.amount, params.outputCurrency);
    }
    return Math.round(sum * 100) / 100;
  }

  /**
   * Aggregates income, expense, and savings (income minus expense) in the given currency.
   */
  async aggregateIncomeExpenseSavings(
    userId: Types.ObjectId,
    options: { roomId?: Types.ObjectId; from: Date; to: Date },
    currency: string,
  ): Promise<{ income: number; expense: number; savings: number }> {
    const match = await this.buildRoomMatch(userId, options);
    if (!match) return { income: 0, expense: 0, savings: 0 };
    const docs = await this.transactionModel.find(match).exec();
    let income = 0;
    let expense = 0;
    for (const d of docs) {
      const v = getAmountInCurrency(d.amount, currency);
      if (d.type === 'income') income += v;
      else expense += v;
    }
    const r = (n: number) => Math.round(n * 100) / 100;
    return {
      income: r(income),
      expense: r(expense),
      savings: r(income - expense),
    };
  }

  /**
   * Expense totals per category in outputCurrency for analytics/breakdown.
   */
  async sumExpenseByCategoryMap(
    userId: Types.ObjectId,
    options: { roomId?: Types.ObjectId; from: Date; to: Date },
    outputCurrency: string,
  ): Promise<Record<string, number>> {
    const match = await this.buildRoomMatch(userId, options);
    if (!match) return {};
    match.type = 'expense';
    const docs = await this.transactionModel.find(match).exec();
    const map: Record<string, number> = {};
    for (const doc of docs) {
      const cat = doc.category;
      const v = getAmountInCurrency(doc.amount, outputCurrency);
      map[cat] = (map[cat] ?? 0) + v;
    }
    for (const k of Object.keys(map)) {
      map[k] = Math.round(map[k] * 100) / 100;
    }
    return map;
  }

  private async buildRoomMatch(
    userId: Types.ObjectId,
    options: { roomId?: Types.ObjectId; from?: Date; to?: Date },
  ): Promise<Record<string, unknown> | null> {
    const match: Record<string, unknown> = {};
    if (options.roomId) {
      const room = await this.partnerRoomService.findById(options.roomId.toString(), userId);
      if (!room) return null;
      const memberIds = room.members.map((m: any) =>
        typeof m.userId === 'object' && (m.userId as { _id?: Types.ObjectId })?._id
          ? (m.userId as { _id: Types.ObjectId })._id
          : (m.userId as Types.ObjectId),
      );
      match.roomId = options.roomId;
      match.userId = { $in: memberIds };
    } else {
      match.userId = userId;
      match.$or = [{ roomId: { $exists: false } }, { roomId: null }];
    }
    if (options.from || options.to) {
      match.date = {};
      if (options.from) (match.date as Record<string, Date>).$gte = options.from;
      if (options.to) (match.date as Record<string, Date>).$lte = options.to;
    }
    return match;
  }
}
