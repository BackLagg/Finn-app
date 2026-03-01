import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type TransactionDocument = Transaction &
  Document & {
    createdAt: Date;
    updatedAt: Date;
  };

export type TransactionType = 'income' | 'expense';
export type TransactionSource = 'manual' | 'receipt_ai';

@Schema({ timestamps: true })
export class Transaction {
  @Prop({ required: true })
  amount!: number;

  @Prop({ required: true, enum: ['income', 'expense'] })
  type!: TransactionType;

  @Prop({ required: true })
  category!: string;

  @Prop({ type: Date, default: Date.now })
  date!: Date;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  userId!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'PartnerRoom', required: false, index: true })
  roomId?: Types.ObjectId;

  @Prop({ required: false })
  description?: string;

  @Prop({ required: true, enum: ['manual', 'receipt_ai'], default: 'manual' })
  source!: TransactionSource;

  @Prop({ required: false })
  receiptImageUrl?: string;
}

export const TransactionSchema = SchemaFactory.createForClass(Transaction);

TransactionSchema.index({ userId: 1, date: -1 });
TransactionSchema.index({ roomId: 1, date: -1 });
