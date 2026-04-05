import { Inject, Injectable } from '@nestjs/common';
import { Model, Types } from 'mongoose';
import { GoalDocument } from '../../schemas/goal.schema';
import { toMultiCurrencyAmount } from '../../utils/amount-currency.util';

@Injectable()
export class GoalService {
  constructor(
    @Inject('GoalModel')
    private goalModel: Model<GoalDocument>,
  ) {}

  async create(
    userId: Types.ObjectId,
    data: {
      title: string;
      targetAmount: number;
      currentAmount?: number;
      currency?: string;
      deadline?: Date;
      roomId?: Types.ObjectId;
    },
  ): Promise<GoalDocument> {
    const currency = (data.currency ?? 'USD').toUpperCase();
    return this.goalModel.create({
      userId,
      title: data.title,
      targetAmount: toMultiCurrencyAmount(data.targetAmount, currency),
      currentAmount: toMultiCurrencyAmount(data.currentAmount ?? 0, currency),
      currency,
      deadline: data.deadline,
      roomId: data.roomId,
      milestonesNotified: [],
    });
  }

  async findAll(
    userId: Types.ObjectId,
    roomId?: Types.ObjectId,
  ): Promise<GoalDocument[]> {
    const filter: Record<string, unknown> = { userId };
    if (roomId) filter.roomId = roomId;
    else filter.$or = [{ roomId: { $exists: false } }, { roomId: null }];
    return this.goalModel.find(filter).sort({ createdAt: -1 }).exec();
  }

  async update(
    id: string,
    userId: Types.ObjectId,
    data: Partial<{ title: string; targetAmount: number; currentAmount: number; deadline: Date }>,
  ): Promise<GoalDocument | null> {
    const existing = await this.goalModel
      .findOne({ _id: new Types.ObjectId(id), userId })
      .exec();
    if (!existing) return null;
    const currency = existing.currency || 'USD';
    const $set: Record<string, unknown> = {};
    if (data.title !== undefined) $set.title = data.title;
    if (data.targetAmount !== undefined) {
      $set.targetAmount = toMultiCurrencyAmount(data.targetAmount, currency);
    }
    if (data.currentAmount !== undefined) {
      $set.currentAmount = toMultiCurrencyAmount(data.currentAmount, currency);
    }
    if (data.deadline !== undefined) $set.deadline = data.deadline;
    return this.goalModel
      .findOneAndUpdate({ _id: existing._id }, { $set }, { new: true })
      .exec();
  }

  async delete(id: string, userId: Types.ObjectId): Promise<boolean> {
    const result = await this.goalModel
      .deleteOne({ _id: new Types.ObjectId(id), userId })
      .exec();
    return result.deletedCount === 1;
  }

  async addMilestoneNotified(goalId: Types.ObjectId, milestonePercent: number): Promise<void> {
    await this.goalModel
      .updateOne(
        { _id: goalId },
        { $addToSet: { milestonesNotified: milestonePercent } },
      )
      .exec();
  }
}
