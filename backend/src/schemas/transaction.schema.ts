import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { MultiCurrencyAmount, MultiCurrencyAmountSchema } from './multi-currency-amount.schema';

export type TransactionDocument = Transaction &
  Document & {
    createdAt: Date;
    updatedAt: Date;
  };

export type TransactionType = 'income' | 'expense';
export type TransactionSource = 'manual' | 'receipt_ai';

@Schema({ timestamps: true })
export class Transaction {
  @Prop({ type: MultiCurrencyAmountSchema, required: true })
  amount!: MultiCurrencyAmount;

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

  @Prop({ required: true, default: 'USD' })
  inputCurrency!: string;
}

export const TransactionSchema = SchemaFactory.createForClass(Transaction);

TransactionSchema.index({ userId: 1, date: -1 });
TransactionSchema.index({ roomId: 1, date: -1 });
