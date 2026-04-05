import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { BudgetLimit, BudgetLimitSchema } from '../../schemas/budget-limit.schema';
import { BudgetLimitService } from './budget-limit.service';
import { BudgetLimitController } from './budget-limit.controller';
import { PartnerRoomModule } from '../partner-room/partner-room.module';
import { TransactionModule } from '../transaction/transaction.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: BudgetLimit.name, schema: BudgetLimitSchema }]),
    PartnerRoomModule,
    TransactionModule,
  ],
  controllers: [BudgetLimitController],
  providers: [BudgetLimitService],
  exports: [BudgetLimitService],
})
export class BudgetLimitModule {}
