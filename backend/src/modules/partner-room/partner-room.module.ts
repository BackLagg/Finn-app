import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PartnerRoom, PartnerRoomSchema } from '../../schemas/partner-room.schema';
import { Transaction, TransactionSchema } from '../../schemas/transaction.schema';
import { BudgetSettings, BudgetSettingsSchema } from '../../schemas/budget-settings.schema';
import { Goal, GoalSchema } from '../../schemas/goal.schema';
import { ShoppingList, ShoppingListSchema } from '../../schemas/shopping-list.schema';
import { Reminder, ReminderSchema } from '../../schemas/reminder.schema';
import { PartnerRoomService } from './partner-room.service';
import { PartnerRoomController } from './partner-room.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: PartnerRoom.name, schema: PartnerRoomSchema },
      { name: Transaction.name, schema: TransactionSchema },
      { name: BudgetSettings.name, schema: BudgetSettingsSchema },
      { name: Goal.name, schema: GoalSchema },
      { name: ShoppingList.name, schema: ShoppingListSchema },
      { name: Reminder.name, schema: ReminderSchema },
    ]),
  ],
  controllers: [PartnerRoomController],
  providers: [PartnerRoomService],
  exports: [PartnerRoomService],
})
export class PartnerRoomModule {}
