import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import { ReminderService } from './reminder.service';
import { CreateReminderDto } from '../../dto/reminder.dto';
import { UserGuard } from '../../guards/user.guard';
import { AuthenticatedRequest } from '../../interfaces/request.interface';
import { Types } from 'mongoose';
import { parseLocalDate, parseQueryDate } from '../../utils/date.util';

@Controller('reminder')
@UseGuards(UserGuard)
export class ReminderController {
  constructor(private readonly reminderService: ReminderService) {}

  private getUserId(req: AuthenticatedRequest): Types.ObjectId {
    const u = req.user as { _id?: Types.ObjectId };
    return u!._id!;
  }

  @Post()
  async create(@Body() dto: CreateReminderDto, @Req() req: AuthenticatedRequest) {
    const userId = this.getUserId(req);
    const roomId = dto.roomId ? new Types.ObjectId(dto.roomId) : undefined;
    return this.reminderService.create(userId, {
      amount: dto.amount,
      currency: dto.currency,
      description: dto.description,
      date: parseLocalDate(dto.date),
      dayOfMonth: dto.dayOfMonth,
      isRecurring: dto.isRecurring,
      roomId,
    });
  }

  @Get()
  async findAll(
    @Query('roomId') roomId: string | undefined,
    @Query('from') from: string | undefined,
    @Query('to') to: string | undefined,
    @Req() req: AuthenticatedRequest,
  ) {
    const userId = this.getUserId(req);
    return this.reminderService.findAll(userId, {
      roomId: roomId ? new Types.ObjectId(roomId) : undefined,
      from: from ? parseQueryDate(from) : undefined,
      to: to ? parseQueryDate(to) : undefined,
    });
  }

  @Delete(':id')
  async delete(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    const userId = this.getUserId(req);
    await this.reminderService.delete(id, userId);
    return { ok: true };
  }
}
