import { Injectable } from '@nestjs/common';
import { Inject } from '@nestjs/common';
import { Model, Types } from 'mongoose';
import { PartnerRoomDocument } from '../../schemas/partner-room.schema';
import * as crypto from 'crypto';

@Injectable()
export class PartnerRoomService {
  constructor(
    @Inject('PartnerRoomModel')
    private partnerRoomModel: Model<PartnerRoomDocument>,
  ) {}

  private generateInviteCode(): string {
    return crypto.randomBytes(6).toString('hex').toUpperCase();
  }

  async create(
    userId: Types.ObjectId,
    name: string,
  ): Promise<PartnerRoomDocument> {
    let code = this.generateInviteCode();
    let exists = await this.partnerRoomModel.findOne({ inviteCode: code }).exec();
    while (exists) {
      code = this.generateInviteCode();
      exists = await this.partnerRoomModel.findOne({ inviteCode: code }).exec();
    }
    return this.partnerRoomModel.create({
      name,
      inviteCode: code,
      members: [{ userId, role: 'owner', contributionPercent: 100 }],
      createdBy: userId,
    });
  }

  async join(
    userId: Types.ObjectId,
    inviteCode: string,
  ): Promise<PartnerRoomDocument | null> {
    const room = await this.partnerRoomModel.findOne({ inviteCode }).exec();
    if (!room) return null;
    const alreadyMember = room.members.some(
      (m) => m.userId.toString() === userId.toString(),
    );
    if (alreadyMember) return room;
    room.members.push({
      userId,
      role: 'member',
      contributionPercent: 0,
    } as { userId: Types.ObjectId; role: string; contributionPercent: number });
    await room.save();
    return room;
  }

  async findForUser(userId: Types.ObjectId): Promise<PartnerRoomDocument[]> {
    return this.partnerRoomModel
      .find({ 'members.userId': userId })
      .populate('members.userId', 'telegramID')
      .sort({ createdAt: -1 })
      .exec();
  }

  async findById(
    id: string,
    userId: Types.ObjectId,
  ): Promise<PartnerRoomDocument | null> {
    const room = await this.partnerRoomModel
      .findOne({
        _id: new Types.ObjectId(id),
        'members.userId': userId,
      })
      .populate('members.userId', 'telegramID')
      .exec();
    return room;
  }
}
