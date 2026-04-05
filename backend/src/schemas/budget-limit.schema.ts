import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type BudgetLimitPeriod = 'daily' | 'weekly' | 'monthly';

export type BudgetLimitDocument = BudgetLimit &
  Document & {
    createdAt: Date;
    updatedAt: Date;
  };

@Schema({ timestamps: true, collection: 'budgetlimits' })
export class BudgetLimit {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  userId!: Types.ObjectId;

  @Prop({ required: true })
  category!: string;

  @Prop({ required: true, min: 0 })
  limit!: number;

  @Prop({ default: 'USD' })
  currency!: string;

  @Prop({ required: true, enum: ['daily', 'weekly', 'monthly'] })
  period!: BudgetLimitPeriod;

  @Prop({ type: Types.ObjectId, ref: 'PartnerRoom', required: false, index: true })
  roomId?: Types.ObjectId;
}

export const BudgetLimitSchema = SchemaFactory.createForClass(BudgetLimit);

BudgetLimitSchema.index({ userId: 1, category: 1, roomId: 1 });
