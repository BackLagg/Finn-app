import { Inject, Injectable } from '@nestjs/common';
import { Model, Types } from 'mongoose';
import { ShoppingListDocument } from '../../schemas/shopping-list.schema';

@Injectable()
export class ShoppingListService {
  constructor(
    @Inject('ShoppingListModel')
    private shoppingListModel: Model<ShoppingListDocument>,
  ) {}

  async create(
    userId: Types.ObjectId,
    data: {
      title: string;
      items: { name: string; checked?: boolean; estimatedPrice?: number }[];
      roomId?: Types.ObjectId;
    },
  ): Promise<ShoppingListDocument> {
    const items = data.items.map((i) => ({
      name: i.name,
      checked: i.checked ?? false,
      estimatedPrice: i.estimatedPrice,
    }));
    return this.shoppingListModel.create({
      userId,
      title: data.title,
      items,
      roomId: data.roomId,
    });
  }

  async findAll(
    userId: Types.ObjectId,
    roomId?: Types.ObjectId,
  ): Promise<ShoppingListDocument[]> {
    const filter: Record<string, unknown> = { userId };
    if (roomId) filter.roomId = roomId;
    else filter.$or = [{ roomId: { $exists: false } }, { roomId: null }];
    return this.shoppingListModel.find(filter).sort({ order: 1, createdAt: -1 }).exec();
  }

  async update(
    id: string,
    userId: Types.ObjectId,
    data: Partial<{
      title: string;
      items: { name: string; checked: boolean; estimatedPrice?: number }[];
      isPinned: boolean;
      order: number;
    }>,
  ): Promise<ShoppingListDocument | null> {
    const update: Record<string, unknown> = {};
    if (data.title !== undefined) update.title = data.title;
    if (data.items !== undefined) update.items = data.items;
    if (data.isPinned !== undefined) update.isPinned = data.isPinned;
    if (data.order !== undefined) update.order = data.order;
    return this.shoppingListModel
      .findOneAndUpdate({ _id: new Types.ObjectId(id), userId }, { $set: update }, { new: true })
      .exec();
  }

  async delete(id: string, userId: Types.ObjectId): Promise<boolean> {
    const result = await this.shoppingListModel
      .deleteOne({ _id: new Types.ObjectId(id), userId })
      .exec();
    return result.deletedCount === 1;
  }
}
