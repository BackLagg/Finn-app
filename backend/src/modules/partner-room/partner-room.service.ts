import { Injectable } from '@nestjs/common';
import { Inject } from '@nestjs/common';
import { Model, Types } from 'mongoose';
import { PartnerRoomDocument } from '../../schemas/partner-room.schema';
import { TransactionDocument } from '../../schemas/transaction.schema';
import { BudgetSettingsDocument } from '../../schemas/budget-settings.schema';
import { GoalDocument } from '../../schemas/goal.schema';
import { ShoppingListDocument } from '../../schemas/shopping-list.schema';
import { ReminderDocument } from '../../schemas/reminder.schema';
import * as crypto from 'crypto';

@Injectable()
export class PartnerRoomService {
  constructor(
    @Inject('PartnerRoomModel')
    private partnerRoomModel: Model<PartnerRoomDocument>,
    @Inject('TransactionModel')
    private transactionModel: Model<TransactionDocument>,
    @Inject('BudgetSettingsModel')
    private budgetModel: Model<BudgetSettingsDocument>,
    @Inject('GoalModel')
    private goalModel: Model<GoalDocument>,
    @Inject('ShoppingListModel')
    private shoppingListModel: Model<ShoppingListDocument>,
    @Inject('ReminderModel')
    private reminderModel: Model<ReminderDocument>,
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

    return this.enrichMembersWithUsernames(rooms as unknown as PartnerRoomDocument[]);
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
    const [enriched] = await this.enrichMembersWithUsernames([room as unknown as PartnerRoomDocument]);
    return enriched;
  }

  private getMemberUserId(m: { userId: Types.ObjectId | { _id?: Types.ObjectId } }): Types.ObjectId {
    const u = m.userId;
    if (typeof u === 'object' && u && (u as { _id?: Types.ObjectId })._id) {
      return (u as { _id: Types.ObjectId })._id;
    }
    return u as Types.ObjectId;
  }

  async getOwnerId(roomId: string): Promise<Types.ObjectId | null> {
    const room = await this.partnerRoomModel.findById(roomId).lean().exec();
    if (!room?.members?.length) return null;
    const owner = room.members.find((m) => m.role === 'owner');
    return owner ? this.getMemberUserId(owner) : null;
  }

  async deleteRoom(roomId: string, userId: Types.ObjectId): Promise<boolean> {
    const ownerId = await this.getOwnerId(roomId);
    if (!ownerId || !ownerId.equals(userId)) return false;
    const id = new Types.ObjectId(roomId);
    await this.transactionModel.deleteMany({ roomId: id }).exec();
    await this.budgetModel.deleteMany({ roomId: id }).exec();
    await this.goalModel.deleteMany({ roomId: id }).exec();
    await this.shoppingListModel.deleteMany({ roomId: id }).exec();
    await this.reminderModel.deleteMany({ roomId: id }).exec();
    const result = await this.partnerRoomModel.deleteOne({ _id: id }).exec();
    return (result?.deletedCount ?? 0) > 0;
  }

  async regenerateInviteCode(roomId: string, userId: Types.ObjectId): Promise<string | null> {
    const ownerId = await this.getOwnerId(roomId);
    if (!ownerId || !ownerId.equals(userId)) return null;
    let code = this.generateInviteCode();
    let exists = await this.partnerRoomModel.findOne({ inviteCode: code }).exec();
    while (exists) {
      code = this.generateInviteCode();
      exists = await this.partnerRoomModel.findOne({ inviteCode: code }).exec();
    }
    const room = await this.partnerRoomModel
      .findOneAndUpdate(
        { _id: new Types.ObjectId(roomId) },
        { $set: { inviteCode: code } },
        { new: true },
      )
      .exec();
    return room?.inviteCode ?? null;
  }

  async updateRoom(roomId: string, userId: Types.ObjectId, name: string): Promise<boolean> {
    const ownerId = await this.getOwnerId(roomId);
    if (!ownerId || !ownerId.equals(userId)) return false;
    const result = await this.partnerRoomModel
      .updateOne({ _id: new Types.ObjectId(roomId) }, { $set: { name: name.trim() } })
      .exec();
    return (result?.modifiedCount ?? 0) > 0;
  }

  async removeMember(
    roomId: string,
    userId: Types.ObjectId,
    memberUserId: string,
  ): Promise<boolean> {
    const ownerId = await this.getOwnerId(roomId);
    if (!ownerId || !ownerId.equals(userId)) return false;
    const memberId = new Types.ObjectId(memberUserId);
    if (ownerId.equals(memberId)) return false;
    const room = await this.partnerRoomModel.findById(roomId).exec();
    if (!room) return false;
    const before = room.members.length;
    room.members = room.members.filter((m) => !this.getMemberUserId(m).equals(memberId));
    if (room.members.length === before) return false;
    await room.save();
    return true;
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
      const name = p.name || p.username;
      if (name) profileMap.set(p.userId.toString(), name);
    }

    for (const room of rooms) {
      for (const m of room.members || []) {
        const id =
          typeof m.userId === 'object' && (m.userId as { _id?: Types.ObjectId })?._id
            ? (m.userId as { _id: Types.ObjectId })._id.toString()
            : (m.userId as Types.ObjectId).toString();
        const displayName = profileMap.get(id);
        (m as unknown as Record<string, unknown>).displayName = displayName || null;
        if (displayName) {
          (m.userId as unknown as Record<string, unknown>).username = displayName;
        }
      }
    }
    return rooms;
  }
}
