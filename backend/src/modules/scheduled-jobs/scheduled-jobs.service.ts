import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { User, UserDocument } from '../../schemas/user.schema';
import { NotificationSettingsService } from '../notification-settings/notification-settings.service';
import { BudgetLimitService } from '../budget-limit/budget-limit.service';
import { RecurringTransactionService } from '../recurring-transaction/recurring-transaction.service';
import { TransactionService } from '../transaction/transaction.service';
import { GoalService } from '../goal/goal.service';
import { TelegramBotService } from '../telegram-bot/telegram-bot.service';
import { ExportService } from '../export/export.service';
import { getAmountInCurrency } from '../../utils/amount-currency.util';

const MILESTONES = [25, 50, 75, 100];

/**
 * Cron-driven reminders, recurring postings, budget/goal alerts, export cleanup.
 */
@Injectable()
export class ScheduledJobsService {
  private readonly logger = new Logger(ScheduledJobsService.name);

  constructor(
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
    private readonly notificationSettingsService: NotificationSettingsService,
    private readonly budgetLimitService: BudgetLimitService,
    private readonly recurringTransactionService: RecurringTransactionService,
    private readonly transactionService: TransactionService,
    private readonly goalService: GoalService,
    private readonly telegramBotService: TelegramBotService,
    private readonly exportService: ExportService,
  ) {}

  @Cron(CronExpression.EVERY_HOUR)
  async cleanupExpiredExports(): Promise<void> {
    try {
      const n = await this.exportService.deleteExpiredJobs();
      if (n > 0) this.logger.log(`Removed ${n} expired export jobs`);
    } catch (e) {
      this.logger.warn('cleanupExpiredExports failed', e);
    }
  }

  @Cron('*/5 * * * *')
  async dailyRemindersUtc(): Promise<void> {
    try {
      const list =
        await this.notificationSettingsService.findAllWithDailyReminder();
      const now = new Date();
      const hh = String(now.getUTCHours()).padStart(2, '0');
      const mm = String(now.getUTCMinutes()).padStart(2, '0');
      const slot = `${hh}:${mm}`;
      const today = now.toISOString().slice(0, 10);
      for (const s of list) {
        const t = s.dailyReminderTime?.trim();
        if (!t || t !== slot) continue;
        if (s.lastDailyReminderUtcDay === today) continue;
        const user = await this.userModel.findById(s.userId).exec();
        if (!user?.telegramID) continue;
        await this.telegramBotService.sendMessage(
          user.telegramID,
          'Finn: time to review your budget and transactions.',
        );
        await this.notificationSettingsService.setLastDailyReminderDay(
          s.userId as Types.ObjectId,
          today,
        );
      }
    } catch (e) {
      this.logger.warn('dailyRemindersUtc failed', e);
    }
  }

  @Cron('25 2 * * *')
  async processRecurringAndAlerts(): Promise<void> {
    try {
      const n = await this.recurringTransactionService.processDueRecurring();
      if (n > 0) this.logger.log(`Posted ${n} recurring transactions`);
    } catch (e) {
      this.logger.warn('processDueRecurring failed', e);
    }
    await this.budgetThresholdAlerts();
    await this.goalMilestoneAlerts();
  }

  private async budgetThresholdAlerts(): Promise<void> {
    try {
      const list =
        await this.notificationSettingsService.findAllWithBudgetAlerts();
      const today = new Date().toISOString().slice(0, 10);
      for (const s of list) {
        if (s.lastBudgetAlertUtcDay === today) continue;
        const user = await this.userModel.findById(s.userId).exec();
        if (!user?.telegramID) continue;
        const status = await this.budgetLimitService.getStatus(
          s.userId as Types.ObjectId,
          undefined,
        );
        const thr = s.budgetAlertThreshold ?? 80;
        const hit = status.some(
          (row) => row.percentage >= thr && row.spent > 0,
        );
        if (!hit) continue;
        await this.telegramBotService.sendMessage(
          user.telegramID,
          `Finn: you have categories at or above ${thr}% of the budget limit.`,
        );
        await this.notificationSettingsService.setLastBudgetAlertDay(
          s.userId as Types.ObjectId,
          today,
        );
      }
    } catch (e) {
      this.logger.warn('budgetThresholdAlerts failed', e);
    }
  }

  private async goalMilestoneAlerts(): Promise<void> {
    try {
      const list =
        await this.notificationSettingsService.findAllWithGoalProgress();
      for (const s of list) {
        const user = await this.userModel.findById(s.userId).exec();
        if (!user?.telegramID) continue;
        const goals = await this.goalService.findAll(s.userId as Types.ObjectId);
        for (const g of goals) {
          const cur = g.currency || 'USD';
          const current = getAmountInCurrency(g.currentAmount, cur);
          const target = getAmountInCurrency(g.targetAmount, cur);
          if (target <= 0) continue;
          const pct = (current / target) * 100;
          const notified = new Set(g.milestonesNotified ?? []);
          for (const m of MILESTONES) {
            if (pct < m || notified.has(m)) continue;
            await this.telegramBotService.sendMessage(
              user.telegramID,
              `Finn: goal "${g.title}" reached ${m}% progress.`,
            );
            await this.goalService.addMilestoneNotified(g._id as Types.ObjectId, m);
            notified.add(m);
          }
        }
      }
    } catch (e) {
      this.logger.warn('goalMilestoneAlerts failed', e);
    }
  }

  @Cron('15 8 * * 1')
  async weeklyReports(): Promise<void> {
    try {
      const list =
        await this.notificationSettingsService.findAllWithWeeklyReport();
      const now = new Date();
      const monday = new Date(now);
      monday.setUTCDate(now.getUTCDate() - ((now.getUTCDay() + 6) % 7));
      const weekKey = monday.toISOString().slice(0, 10);
      const from = new Date(monday);
      const to = new Date(now);
      for (const s of list) {
        if (s.lastWeeklyReportIsoWeek === weekKey) continue;
        const user = await this.userModel.findById(s.userId).exec();
        if (!user?.telegramID) continue;
        const agg = await this.transactionService.aggregateIncomeExpenseSavings(
          s.userId as Types.ObjectId,
          { from, to },
          'USD',
        );
        await this.telegramBotService.sendMessage(
          user.telegramID,
          `Finn weekly: income ${agg.income} USD, expense ${agg.expense} USD, savings ${agg.savings} USD.`,
        );
        await this.notificationSettingsService.setLastWeeklyReportWeek(
          s.userId as Types.ObjectId,
          weekKey,
        );
      }
    } catch (e) {
      this.logger.warn('weeklyReports failed', e);
    }
  }
}
