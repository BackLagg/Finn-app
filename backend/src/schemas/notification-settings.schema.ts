import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type NotificationSettingsDocument = NotificationSettings &
  Document & {
    createdAt: Date;
    updatedAt: Date;
  };

@Schema({ timestamps: true, collection: 'notificationsettings' })
export class NotificationSettings {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, unique: true, index: true })
  userId!: Types.ObjectId;

  @Prop({ default: false })
  dailyReminder!: boolean;

  @Prop({ required: false })
  dailyReminderTime?: string;

  @Prop({ default: false })
  budgetAlerts!: boolean;

  @Prop({ default: 80, min: 0, max: 100 })
  budgetAlertThreshold!: number;

  @Prop({ default: false })
  weeklyReport!: boolean;

  @Prop({ default: false })
  goalProgress!: boolean;

  @Prop({ required: false })
  lastDailyReminderUtcDay?: string;

  @Prop({ required: false })
  lastWeeklyReportIsoWeek?: string;

  @Prop({ required: false })
  lastBudgetAlertUtcDay?: string;
}

export const NotificationSettingsSchema =
  SchemaFactory.createForClass(NotificationSettings);
