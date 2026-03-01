import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

@Schema({ _id: false })
export class ShoppingListItem {
  @Prop({ required: true })
  name!: string;

  @Prop({ default: false })
  checked!: boolean;

  @Prop({ required: false })
  estimatedPrice?: number;
}

export const ShoppingListItemSchema =
  SchemaFactory.createForClass(ShoppingListItem);
