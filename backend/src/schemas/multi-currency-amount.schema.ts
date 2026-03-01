import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

@Schema({ _id: false })
export class MultiCurrencyAmount {
  @Prop({ required: true, default: 0 })
  USD!: number;

  @Prop({ required: true, default: 0 })
  EUR!: number;

  @Prop({ required: true, default: 0 })
  RUB!: number;

  @Prop({ required: true, default: 0 })
  BYN!: number;
}

export const MultiCurrencyAmountSchema = SchemaFactory.createForClass(MultiCurrencyAmount);
