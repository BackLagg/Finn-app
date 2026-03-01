import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { FixedExpenseSchema } from './fixed-expense.schema';

export type BudgetSettingsDocument = BudgetSettings &
  Document & {
    createdAt: Date;
    updatedAt: Date;
  };

@Schema({ timestamps: true })
export class BudgetSettings {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  userId!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'PartnerRoom', required: false, index: true })
  roomId?: Types.ObjectId;

  @Prop({ default: 'RUB' })
  currency!: string;

  @Prop({ required: true })
  monthlyIncome!: number;

  @Prop({ type: [FixedExpenseSchema], default: [] })
  fixedExpenses!: { name: string; amount: number }[];

  @Prop({
    type: {
      savings: Number,
      investments: Number,
      purchases: Number,
    },
    default: { savings: 20, investments: 10, purchases: 70 },
  })
  distribution!: { savings: number; investments: number; purchases: number };

  @Prop({ default: 'ru' })
  language!: string;
}

export const BudgetSettingsSchema = SchemaFactory.createForClass(BudgetSettings);

BudgetSettingsSchema.index({ userId: 1, roomId: 1 }, { unique: true, sparse: true });
