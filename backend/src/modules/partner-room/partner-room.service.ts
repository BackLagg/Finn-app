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
    const rooms = await this.partnerRoomModel
      .find({ 'members.userId': userId })
      .populate({
        path: 'members.userId',
        select: 'telegramID',
        model: 'User',
      })
      .sort({ createdAt: -1 })
      .lean()
      .exec();

    return this.enrichMembersWithUsernames(rooms as PartnerRoomDocument[]);
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
      .lean()
      .exec();

    if (!room) return null;
    const [enriched] = await this.enrichMembersWithUsernames([room as PartnerRoomDocument]);
    return enriched;
  }

  private async enrichMembersWithUsernames(
    rooms: PartnerRoomDocument[],
  ): Promise<PartnerRoomDocument[]> {
    const userIds: Types.ObjectId[] = [];
    for (const room of rooms) {
      for (const m of room.members || []) {
        const id =
          typeof m.userId === 'object' && (m.userId as { _id?: Types.ObjectId })?._id
            ? (m.userId as { _id: Types.ObjectId })._id
            : (m.userId as Types.ObjectId);
        userIds.push(id);
      }
    }
    const profiles = await this.partnerRoomModel.db
      .collection('userprofiles')
      .find({ userId: { $in: userIds } })
      .project({ userId: 1, username: 1, name: 1 })
      .toArray();

    const profileMap = new Map<string, string>();
    for (const p of profiles as { userId: Types.ObjectId; username?: string; name?: string }[]) {
      const name = p.username || p.name;
      if (name) profileMap.set(p.userId.toString(), name);
    }

    for (const room of rooms) {
      for (const m of room.members || []) {
        const id =
          typeof m.userId === 'object' && (m.userId as { _id?: Types.ObjectId })?._id
            ? (m.userId as { _id: Types.ObjectId })._id.toString()
            : (m.userId as Types.ObjectId).toString();
        const displayName = profileMap.get(id);
        if (displayName) {
          (m.userId as Record<string, unknown>).username = displayName;
        }
      }
    }
    return rooms;
  }
}
