import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types } from 'mongoose';

@Schema({ _id: false })
export class PartnerRoomMember {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId!: Types.ObjectId;

  @Prop({ default: 'member' })
  role!: string;

  @Prop({ default: 100 })
  contributionPercent!: number;
}

export const PartnerRoomMemberSchema =
  SchemaFactory.createForClass(PartnerRoomMember);
