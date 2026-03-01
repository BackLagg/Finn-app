import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Req,
} from '@nestjs/common';
import { PartnerRoomService } from './partner-room.service';
import { CreatePartnerRoomDto } from '../../dto/partner-room.dto';
import { JoinPartnerRoomDto } from '../../dto/partner-room.dto';
import { UserGuard } from '../../guards/user.guard';
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
  async create(@Body() dto: CreatePartnerRoomDto, @Req() req: AuthenticatedRequest) {
    const userId = this.getUserId(req);
    return this.partnerRoomService.create(userId, dto.name);
  }

  @Post('join')
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
}
