import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

@Schema({ _id: false })
export class FixedExpense {
  @Prop({ required: true })
  name!: string;

  @Prop({ required: true })
  amount!: number;
}

export const FixedExpenseSchema = SchemaFactory.createForClass(FixedExpense);
