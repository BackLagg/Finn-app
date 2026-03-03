import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ReminderDocument = Reminder &
  Document & {
    createdAt: Date;
    updatedAt: Date;
  };

@Schema({ timestamps: true })
export class Reminder {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  userId!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'PartnerRoom', required: false, index: true })
  roomId?: Types.ObjectId;

  @Prop({ required: true })
  amount!: number;

  @Prop({ default: 'USD' })
  currency!: string;

  @Prop({ default: '' })
  description!: string;

  @Prop({ type: Date, required: true })
  date!: Date;

  @Prop({ required: true })
  dayOfMonth!: number;

  @Prop({ default: false })
  isRecurring!: boolean;
}

export const ReminderSchema = SchemaFactory.createForClass(Reminder);

ReminderSchema.index({ userId: 1, date: -1 });
ReminderSchema.index({ roomId: 1, date: -1 });
