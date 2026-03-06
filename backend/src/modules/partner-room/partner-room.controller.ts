import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
  Delete,
  UseGuards,
  Req,
} from '@nestjs/common';
import { PartnerRoomService } from './partner-room.service';
import { CreatePartnerRoomDto, JoinPartnerRoomDto, RemoveMemberDto, UpdatePartnerRoomDto } from '../../dto/partner-room.dto';
import { UserGuard } from '../../guards/user.guard';
import { SubscriptionGuard, RequireSubscription } from '../../guards/subscription.guard';
import { AuthenticatedRequest } from '../../interfaces/request.interface';
import { Types } from 'mongoose';

@Controller('partner-room')
@UseGuards(UserGuard)
export class PartnerRoomController {
  constructor(private readonly partnerRoomService: PartnerRoomService) {}

  private getUserId(req: AuthenticatedRequest): Types.ObjectId {
    const u = req.user as { _id?: Types.ObjectId };
    return u!._id!;
  }

  @Post()
  @UseGuards(SubscriptionGuard)
  @RequireSubscription('finn')
  async create(@Body() dto: CreatePartnerRoomDto, @Req() req: AuthenticatedRequest) {
    const userId = this.getUserId(req);
    return this.partnerRoomService.create(userId, dto.name);
  }

  @Post('join')
  @UseGuards(SubscriptionGuard)
  @RequireSubscription('finn')
  async join(@Body() dto: JoinPartnerRoomDto, @Req() req: AuthenticatedRequest) {
    const userId = this.getUserId(req);
    const room = await this.partnerRoomService.join(userId, dto.inviteCode);
    if (!room) {
      throw new Error('Invalid invite code');
    }
    return room;
  }

  @Get()
  async findAll(@Req() req: AuthenticatedRequest) {
    const userId = this.getUserId(req);
    return this.partnerRoomService.findForUser(userId);
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    const userId = this.getUserId(req);
    return this.partnerRoomService.findById(id, userId);
  }

  @Delete(':id/members')
  async removeMember(
    @Param('id') id: string,
    @Body() dto: RemoveMemberDto,
    @Req() req: AuthenticatedRequest,
  ) {
    const userId = this.getUserId(req);
    const ok = await this.partnerRoomService.removeMember(id, userId, dto.memberUserId);
    if (!ok) throw new Error('Forbidden or member not found');
    return { removed: true };
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() dto: UpdatePartnerRoomDto, @Req() req: AuthenticatedRequest) {
    const userId = this.getUserId(req);
    const ok = await this.partnerRoomService.updateRoom(id, userId, dto.name);
    if (!ok) throw new Error('Forbidden or room not found');
    return { updated: true };
  }

  @Post(':id/regenerate-code')
  async regenerateCode(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    const userId = this.getUserId(req);
    const code = await this.partnerRoomService.regenerateInviteCode(id, userId);
    if (!code) throw new Error('Forbidden or room not found');
    return { inviteCode: code };
  }

  @Delete(':id')
  async deleteRoom(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    const userId = this.getUserId(req);
    const ok = await this.partnerRoomService.deleteRoom(id, userId);
    if (!ok) throw new Error('Forbidden or room not found');
    return { deleted: true };
  }
}
