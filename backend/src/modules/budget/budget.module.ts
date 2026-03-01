import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { BudgetSettings, BudgetSettingsSchema } from '../../schemas/budget-settings.schema';
import { BudgetService } from './budget.service';
import { BudgetController } from './budget.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: BudgetSettings.name, schema: BudgetSettingsSchema },
    ]),
  ],
  controllers: [BudgetController],
  providers: [BudgetService],
  exports: [BudgetService],
})
export class BudgetModule {}
