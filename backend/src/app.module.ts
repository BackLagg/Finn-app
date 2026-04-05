import {
  Module,
  NestModule,
  MiddlewareConsumer,
  Logger,
  RequestMethod,
} from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from './modules/auth/auth.module';
import { FileModule } from './modules/file/file.module';
import { TransactionModule } from './modules/transaction/transaction.module';
import { BudgetModule } from './modules/budget/budget.module';
import { GoalModule } from './modules/goal/goal.module';
import { PlanModule } from './modules/plan/plan.module';
import { ShoppingListModule } from './modules/shopping-list/shopping-list.module';
import { PartnerRoomModule } from './modules/partner-room/partner-room.module';
import { ReminderModule } from './modules/reminder/reminder.module';
import { ReceiptAIModule } from './modules/receipt-ai/receipt-ai.module';
import { SubscriptionModule } from './modules/subscription/subscription.module';
import { CacheModule } from './modules/cache/cache.module';
import { CurrencyModule } from './modules/currency/currency.module';
import { BudgetLimitModule } from './modules/budget-limit/budget-limit.module';
import { NotificationSettingsModule } from './modules/notification-settings/notification-settings.module';
import { RecurringTransactionModule } from './modules/recurring-transaction/recurring-transaction.module';
import { AnalyticsModule } from './modules/analytics/analytics.module';
import { ExportModule } from './modules/export/export.module';
import { ScheduledJobsModule } from './modules/scheduled-jobs/scheduled-jobs.module';
import { TelegramAuthMiddleware } from './middleware/telegram-auth.middleware';
import { User, UserSchema } from './schemas/user.schema';
import { SuperUser, SuperUserSchema } from './schemas/superuser.schema';
import { UserProfile, UserProfileSchema } from './schemas/user-profile.schema';
import appConfig from './config/app.config';
import databaseConfig from './config/database.config';
import { RouteConstants } from './constants/routes.constants';

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig, databaseConfig],
      envFilePath: '../.env',
    }),

    // Database
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        uri: configService.get<string>('database.uri'),
      }),
      inject: [ConfigService],
    }),

    // MongoDB Models for TelegramAuthMiddleware
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: SuperUser.name, schema: SuperUserSchema },
      { name: UserProfile.name, schema: UserProfileSchema },
    ]),

    ScheduleModule.forRoot(),
    CacheModule,
    CurrencyModule,
    BudgetLimitModule,
    NotificationSettingsModule,
    RecurringTransactionModule,
    AnalyticsModule,
    ExportModule,
    ScheduledJobsModule,
    AuthModule,
    FileModule,
    TransactionModule,
    BudgetModule,
    GoalModule,
    PlanModule,
    ShoppingListModule,
    PartnerRoomModule,
    ReminderModule,
    ReceiptAIModule,
    SubscriptionModule,
  ],
})
export class AppModule implements NestModule {
  private readonly logger = new Logger(AppModule.name);

  constructor(private configService: ConfigService) {
    this.validateConfiguration();
  }

  private validateConfiguration(): void {
    const missingVars: string[] = [];

    // Проверяем BOT_TOKEN
    const botToken = this.configService.get<string>('app.botToken');
    if (!botToken) {
      missingVars.push('BOT_TOKEN');
    }

    // Проверяем database.uri (может быть из MONGO_URI или fallback на localhost)
    const databaseUri = this.configService.get<string>('database.uri');
    if (!databaseUri) {
      missingVars.push('MONGO_URI (or database.uri)');
    }

    if (missingVars.length > 0) {
      this.logger.error(
        `❌ Missing required configuration: ${missingVars.join(', ')}`,
      );
      throw new Error(
        `Missing required configuration: ${missingVars.join(', ')}`,
      );
    }

    this.logger.log('✅ Configuration validation passed');
  }

  configure(consumer: MiddlewareConsumer): void {
    consumer
      .apply(TelegramAuthMiddleware)
      .forRoutes(
        ...(RouteConstants.PROTECTED_ROUTES as readonly string[]),
        { path: 'export/generate', method: RequestMethod.POST },
        { path: 'export/history', method: RequestMethod.GET },
      );
  }
}
