import { Inject, Injectable } from '@nestjs/common';
import { Model, Types } from 'mongoose';
import { ReminderDocument } from '../../schemas/reminder.schema';

@Injectable()
export class ReminderService {
  constructor(
    @Inject('ReminderModel')
    private reminderModel: Model<ReminderDocument>,
  ) {}

  async create(
    userId: Types.ObjectId,
    data: {
      amount: number;
      currency?: string;
      description?: string;
      date: Date;
      dayOfMonth: number;
      isRecurring?: boolean;
      roomId?: Types.ObjectId;
    },
  ): Promise<ReminderDocument> {
    return this.reminderModel.create({
      ...data,
      userId,
      currency: data.currency ?? 'USD',
      description: data.description ?? '',
      isRecurring: data.isRecurring ?? false,
    });
  }

  async findAll(
    userId: Types.ObjectId,
    options: { roomId?: Types.ObjectId; from?: Date; to?: Date } = {},
  ): Promise<ReminderDocument[]> {
    const baseFilter: Record<string, unknown> = { userId };
    if (options.roomId) {
      baseFilter.roomId = options.roomId;
    } else {
      baseFilter.$or = [{ roomId: { $exists: false } }, { roomId: null }];
    }
    let filter: Record<string, unknown>;
    if (options.from || options.to) {
      const dateRange: Record<string, Date> = {};
      if (options.from) dateRange.$gte = options.from;
      if (options.to) dateRange.$lte = options.to;
      filter = {
        ...baseFilter,
        $or: [
          { date: dateRange },
          { isRecurring: true },
        ],
      };
    } else {
      filter = baseFilter;
    }
    return this.reminderModel.find(filter).sort({ date: -1 }).exec();
  }

  async delete(id: string, userId: Types.ObjectId): Promise<boolean> {
    const result = await this.reminderModel
      .deleteOne({ _id: new Types.ObjectId(id), userId })
      .exec();
    return result.deletedCount === 1;
  }
}
