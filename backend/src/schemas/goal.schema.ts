import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { MultiCurrencyAmount, MultiCurrencyAmountSchema } from './multi-currency-amount.schema';

export type GoalDocument = Goal &
  Document & {
    createdAt: Date;
    updatedAt: Date;
  };

@Schema({ timestamps: true })
export class Goal {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  userId!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'PartnerRoom', required: false, index: true })
  roomId?: Types.ObjectId;

  @Prop({ required: true })
  title!: string;

  @Prop({ type: MultiCurrencyAmountSchema, required: true })
  targetAmount!: MultiCurrencyAmount;

  @Prop({ type: MultiCurrencyAmountSchema, required: true })
  currentAmount!: MultiCurrencyAmount;

  @Prop({ default: 'USD' })
  currency!: string;

  @Prop({ required: false })
  deadline?: Date;
}

export const GoalSchema = SchemaFactory.createForClass(Goal);
