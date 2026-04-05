import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  RecurringTransaction,
  RecurringTransactionSchema,
} from '../../schemas/recurring-transaction.schema';
import { RecurringTransactionService } from './recurring-transaction.service';
import { RecurringTransactionController } from './recurring-transaction.controller';
import { PartnerRoomModule } from '../partner-room/partner-room.module';
import { TransactionModule } from '../transaction/transaction.module';
import { BudgetModule } from '../budget/budget.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: RecurringTransaction.name, schema: RecurringTransactionSchema },
    ]),
    PartnerRoomModule,
    TransactionModule,
    BudgetModule,
  ],
  controllers: [RecurringTransactionController],
  providers: [RecurringTransactionService],
  exports: [RecurringTransactionService],
})
export class RecurringTransactionModule {}
