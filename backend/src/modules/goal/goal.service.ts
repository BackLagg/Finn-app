import { Inject, Injectable } from '@nestjs/common';
import { Model, Types } from 'mongoose';
import { GoalDocument } from '../../schemas/goal.schema';

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
    return this.goalModel.create({
      ...data,
      userId,
      currentAmount: data.currentAmount ?? 0,
      currency: data.currency ?? 'RUB',
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
    return this.goalModel
      .findOneAndUpdate({ _id: new Types.ObjectId(id), userId }, { $set: data }, { new: true })
      .exec();
  }

  async delete(id: string, userId: Types.ObjectId): Promise<boolean> {
    const result = await this.goalModel
      .deleteOne({ _id: new Types.ObjectId(id), userId })
      .exec();
    return result.deletedCount === 1;
  }
}
