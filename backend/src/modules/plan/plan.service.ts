import { Inject, Injectable } from '@nestjs/common';
import { Model, Types } from 'mongoose';
import { PlanDocument } from '../../schemas/plan.schema';

@Injectable()
export class PlanService {
  constructor(
    @Inject('PlanModel')
    private planModel: Model<PlanDocument>,
  ) {}

  async create(
    userId: Types.ObjectId,
    data: {
      name: string;
      amount: number;
      dayOfMonth?: number;
      savingFor?: string;
      category?: string;
      roomId?: Types.ObjectId;
      deadline?: Date;
      savingsPercent?: number;
    },
  ): Promise<PlanDocument> {
    return this.planModel.create({
      ...data,
      userId,
      savingsPercent: data.savingsPercent ?? 0,
    });
  }

  async findAll(
    userId: Types.ObjectId,
    roomId?: Types.ObjectId,
  ): Promise<PlanDocument[]> {
    const filter: Record<string, unknown> = { userId };
    if (roomId) {
      filter.roomId = roomId;
    } else {
      filter.$or = [{ roomId: { $exists: false } }, { roomId: null }];
    }
    return this.planModel.find(filter).sort({ createdAt: -1 }).exec();
  }

  async update(
    id: string,
    userId: Types.ObjectId,
    data: Partial<{
      name: string;
      amount: number;
      dayOfMonth: number;
      savingFor: string;
      category: string;
      deadline: Date;
      savingsPercent: number;
      completedAt: Date;
    }>,
  ): Promise<PlanDocument | null> {
    const set: Record<string, unknown> = { ...data };
    if (data.deadline !== undefined) set.deadline = data.deadline;
    return this.planModel
      .findOneAndUpdate(
        { _id: new Types.ObjectId(id), userId },
        { $set: set },
        { new: true },
      )
      .exec();
  }

  async delete(id: string, userId: Types.ObjectId): Promise<boolean> {
    const result = await this.planModel
      .deleteOne({ _id: new Types.ObjectId(id), userId })
      .exec();
    return result.deletedCount === 1;
  }
}
