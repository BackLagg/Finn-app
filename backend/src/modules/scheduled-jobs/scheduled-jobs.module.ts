import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from '../../schemas/user.schema';
import { ScheduledJobsService } from './scheduled-jobs.service';
import { NotificationSettingsModule } from '../notification-settings/notification-settings.module';
import { BudgetLimitModule } from '../budget-limit/budget-limit.module';
import { RecurringTransactionModule } from '../recurring-transaction/recurring-transaction.module';
import { TransactionModule } from '../transaction/transaction.module';
import { GoalModule } from '../goal/goal.module';
import { TelegramBotModule } from '../telegram-bot/telegram-bot.module';
import { ExportModule } from '../export/export.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
    TelegramBotModule,
    NotificationSettingsModule,
    BudgetLimitModule,
    RecurringTransactionModule,
    TransactionModule,
    GoalModule,
    ExportModule,
  ],
  providers: [ScheduledJobsService],
})
export class ScheduledJobsModule {}
