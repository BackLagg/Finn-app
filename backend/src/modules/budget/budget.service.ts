import { Inject, Injectable } from '@nestjs/common';
import { Model, Types } from 'mongoose';
import { BudgetSettingsDocument } from '../../schemas/budget-settings.schema';

@Injectable()
export class BudgetService {
  constructor(
    @Inject('BudgetSettingsModel')
    private budgetModel: Model<BudgetSettingsDocument>,
  ) {}

  async findForUser(
    userId: Types.ObjectId,
    roomId?: Types.ObjectId,
  ): Promise<BudgetSettingsDocument | null> {
    const filter: Record<string, unknown> = { userId };
    if (roomId) {
      filter.roomId = roomId;
    } else {
      filter.$or = [{ roomId: { $exists: false } }, { roomId: null }];
    }
    return this.budgetModel.findOne(filter).exec();
  }

  async upsert(
    userId: Types.ObjectId,
    data: {
      currency: string;
      monthlyIncome: number;
      fixedExpenses: { name: string; amount: number }[];
      savingsPercent: number;
      investmentsPercent: number;
      purchasesPercent: number;
      roomId?: Types.ObjectId;
    },
  ): Promise<BudgetSettingsDocument> {
    const sum = data.savingsPercent + data.investmentsPercent + data.purchasesPercent;
    if (Math.abs(sum - 100) > 0.01) {
      throw new Error('Distribution must sum to 100');
    }

    const filter: Record<string, unknown> = { userId };
    if (data.roomId) {
      filter.roomId = data.roomId;
    } else {
      filter.$or = [{ roomId: { $exists: false } }, { roomId: null }];
    }

    const amount = data.monthlyIncome ?? 0;
    const monthlyIncome = {
      USD: data.currency === 'USD' ? amount : 0,
      EUR: data.currency === 'EUR' ? amount : 0,
      RUB: data.currency === 'RUB' ? amount : 0,
      BYN: data.currency === 'BYN' ? amount : 0,
    };

    const doc = await this.budgetModel.findOneAndUpdate(
      filter,
      {
        $set: {
          currency: data.currency,
          monthlyIncome,
          fixedExpenses: data.fixedExpenses,
          distribution: {
            savings: data.savingsPercent,
            investments: data.investmentsPercent,
            purchases: data.purchasesPercent,
          },
          roomId: data.roomId,
        },
      },
      { upsert: true, new: true },
    );
    return doc;
  }
}
