import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { ShoppingListItemSchema } from './shopping-list-item.schema';

export type ShoppingListDocument = ShoppingList &
  Document & {
    createdAt: Date;
    updatedAt: Date;
  };

@Schema({ timestamps: true })
export class ShoppingList {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  userId!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'PartnerRoom', required: false, index: true })
  roomId?: Types.ObjectId;

  @Prop({ required: true })
  title!: string;

  @Prop({ type: [ShoppingListItemSchema], default: [] })
  items!: { name: string; checked: boolean; estimatedPrice?: number }[];

  @Prop({ default: false })
  isPinned!: boolean;

  @Prop({ default: 0 })
  order!: number;
}

export const ShoppingListSchema = SchemaFactory.createForClass(ShoppingList);
