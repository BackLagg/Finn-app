import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type RecurringFrequency = 'daily' | 'weekly' | 'monthly' | 'yearly';
export type RecurringTransactionType = 'income' | 'expense';

export type RecurringTransactionDocument = RecurringTransaction &
  Document & {
    createdAt: Date;
    updatedAt: Date;
  };

@Schema({ timestamps: true, collection: 'recurringtransactions' })
export class RecurringTransaction {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  userId!: Types.ObjectId;

  @Prop({ required: true })
  amount!: number;

  @Prop({ required: true, enum: ['income', 'expense'] })
  type!: RecurringTransactionType;

  @Prop({ required: true })
  category!: string;

  @Prop({ required: false })
  description?: string;

  @Prop({ required: true, enum: ['daily', 'weekly', 'monthly', 'yearly'] })
  frequency!: RecurringFrequency;

  @Prop({ type: Date, required: true })
  nextDate!: Date;

  @Prop({ type: Date, required: false })
  lastTriggered?: Date;

  @Prop({ default: true })
  isActive!: boolean;

  @Prop({ type: Types.ObjectId, ref: 'PartnerRoom', required: false, index: true })
  roomId?: Types.ObjectId;

  @Prop({ default: 'USD' })
  currency!: string;
}

export const RecurringTransactionSchema =
  SchemaFactory.createForClass(RecurringTransaction);
