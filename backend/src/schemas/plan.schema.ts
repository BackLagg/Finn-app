import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type PlanDocument = Plan &
  Document & {
    createdAt: Date;
    updatedAt: Date;
  };

@Schema({ timestamps: true })
export class Plan {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  userId!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'PartnerRoom', required: false, index: true })
  roomId?: Types.ObjectId;

  @Prop({ required: true })
  name!: string;

  @Prop({ required: true, default: 0 })
  amount!: number;

  @Prop({ required: false })
  dayOfMonth?: number;

  @Prop({ required: false })
  savingFor?: string;

  @Prop({ required: false })
  category?: string;

  @Prop({ required: false })
  deadline?: Date;

  @Prop({ required: false, default: 0 })
  savingsPercent?: number;

  @Prop({ required: false })
  completedAt?: Date;
}

export const PlanSchema = SchemaFactory.createForClass(Plan);
