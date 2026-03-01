import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ShoppingList, ShoppingListSchema } from '../../schemas/shopping-list.schema';
import { ShoppingListService } from './shopping-list.service';
import { ShoppingListController } from './shopping-list.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: ShoppingList.name, schema: ShoppingListSchema },
    ]),
  ],
  controllers: [ShoppingListController],
  providers: [ShoppingListService],
  exports: [ShoppingListService],
})
export class ShoppingListModule {}
