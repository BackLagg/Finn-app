import { Controller, Get, Put, Post, Body, UseGuards, Req } from '@nestjs/common';
import { NotificationSettingsService } from './notification-settings.service';
import { UpdateNotificationSettingsDto } from '../../dto/notification-settings.dto';
import { UserGuard } from '../../guards/user.guard';
import { AuthenticatedRequest } from '../../interfaces/request.interface';
import { Types } from 'mongoose';

@Controller('notification-settings')
@UseGuards(UserGuard)
export class NotificationSettingsController {
  constructor(private readonly notificationSettingsService: NotificationSettingsService) {}

  private getUserId(req: AuthenticatedRequest): Types.ObjectId {
    const u = req.user as { _id?: Types.ObjectId };
    return u!._id!;
  }

  @Get()
  async get(@Req() req: AuthenticatedRequest) {
    const userId = this.getUserId(req);
    return this.notificationSettingsService.findOrCreate(userId);
  }

  @Put()
  async put(@Body() dto: UpdateNotificationSettingsDto, @Req() req: AuthenticatedRequest) {
    const userId = this.getUserId(req);
    return this.notificationSettingsService.update(userId, dto);
  }

  @Post('test')
  async test(@Req() req: AuthenticatedRequest) {
    const telegramUserId = req.telegramUser?.id;
    if (telegramUserId === undefined) {
      return { sent: false };
    }
    return this.notificationSettingsService.sendTest(telegramUserId);
  }
}
