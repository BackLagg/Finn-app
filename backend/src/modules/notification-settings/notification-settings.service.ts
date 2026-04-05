import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  NotificationSettings,
  NotificationSettingsDocument,
} from '../../schemas/notification-settings.schema';
import { TelegramBotService } from '../telegram-bot/telegram-bot.service';

const DEFAULTS: Partial<NotificationSettings> = {
  dailyReminder: false,
  budgetAlerts: false,
  budgetAlertThreshold: 80,
  weeklyReport: false,
  goalProgress: false,
};

@Injectable()
export class NotificationSettingsService {
  constructor(
    @InjectModel(NotificationSettings.name)
    private notificationModel: Model<NotificationSettingsDocument>,
    private readonly telegramBotService: TelegramBotService,
  ) {}

  async findOrCreate(userId: Types.ObjectId): Promise<NotificationSettingsDocument> {
    let doc = await this.notificationModel.findOne({ userId }).exec();
    if (!doc) {
      doc = await this.notificationModel.create({
        userId,
        ...DEFAULTS,
      });
    }
    return doc;
  }

  async update(
    userId: Types.ObjectId,
    data: Partial<{
      dailyReminder: boolean;
      dailyReminderTime?: string;
      budgetAlerts: boolean;
      budgetAlertThreshold: number;
      weeklyReport: boolean;
      goalProgress: boolean;
    }>,
  ): Promise<NotificationSettingsDocument> {
    await this.findOrCreate(userId);
    return this.notificationModel
      .findOneAndUpdate({ userId }, { $set: data }, { new: true })
      .exec() as Promise<NotificationSettingsDocument>;
  }

  async sendTest(telegramUserId: number): Promise<{ sent: boolean }> {
    const sent = await this.telegramBotService.sendMessage(
      telegramUserId,
      'Finn: test notification',
    );
    return { sent };
  }

  async findAllWithDailyReminder(): Promise<NotificationSettingsDocument[]> {
    return this.notificationModel
      .find({ dailyReminder: true, dailyReminderTime: { $exists: true, $ne: '' } })
      .exec();
  }

  async findAllWithBudgetAlerts(): Promise<NotificationSettingsDocument[]> {
    return this.notificationModel.find({ budgetAlerts: true }).exec();
  }

  async findAllWithWeeklyReport(): Promise<NotificationSettingsDocument[]> {
    return this.notificationModel.find({ weeklyReport: true }).exec();
  }

  async findAllWithGoalProgress(): Promise<NotificationSettingsDocument[]> {
    return this.notificationModel.find({ goalProgress: true }).exec();
  }

  async setLastDailyReminderDay(userId: Types.ObjectId, day: string): Promise<void> {
    await this.notificationModel
      .updateOne({ userId }, { $set: { lastDailyReminderUtcDay: day } })
      .exec();
  }

  async setLastWeeklyReportWeek(userId: Types.ObjectId, weekKey: string): Promise<void> {
    await this.notificationModel
      .updateOne({ userId }, { $set: { lastWeeklyReportIsoWeek: weekKey } })
      .exec();
  }

  async setLastBudgetAlertDay(userId: Types.ObjectId, day: string): Promise<void> {
    await this.notificationModel
      .updateOne({ userId }, { $set: { lastBudgetAlertUtcDay: day } })
      .exec();
  }
}
