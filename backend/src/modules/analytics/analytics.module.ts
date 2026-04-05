import { Module } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { AnalyticsController } from './analytics.controller';
import { TransactionModule } from '../transaction/transaction.module';
import { BudgetModule } from '../budget/budget.module';

@Module({
  imports: [TransactionModule, BudgetModule],
  controllers: [AnalyticsController],
  providers: [AnalyticsService],
})
export class AnalyticsModule {}
