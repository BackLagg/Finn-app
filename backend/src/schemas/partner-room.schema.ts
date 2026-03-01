import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { PartnerRoomMemberSchema } from './partner-room-member.schema';

export type PartnerRoomDocument = PartnerRoom &
  Document & {
    createdAt: Date;
    updatedAt: Date;
  };

@Schema({ timestamps: true })
export class PartnerRoom {
  @Prop({ required: true })
  name!: string;

  @Prop({ required: true, unique: true, index: true })
  inviteCode!: string;

  @Prop({ type: [PartnerRoomMemberSchema], default: [] })
  members!: { userId: Types.ObjectId; role: string; contributionPercent: number }[];

  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  createdBy!: Types.ObjectId;
}

export const PartnerRoomSchema = SchemaFactory.createForClass(PartnerRoom);
