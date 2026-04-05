import { Controller, Get, Query, UseGuards, Req } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { UserGuard } from '../../guards/user.guard';
import { AuthenticatedRequest } from '../../interfaces/request.interface';
import { Types } from 'mongoose';
import { parseQueryDate, parseQueryDateEnd } from '../../utils/date.util';

@Controller('analytics')
@UseGuards(UserGuard)
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  private getUserId(req: AuthenticatedRequest): Types.ObjectId {
    const u = req.user as { _id?: Types.ObjectId };
    return u!._id!;
  }

  @Get('trends')
  async trends(
    @Query('period') period: 'week' | 'month' | 'quarter' | 'year',
    @Query('roomId') roomId: string | undefined,
    @Req() req: AuthenticatedRequest,
  ) {
    const userId = this.getUserId(req);
    return this.analyticsService.trends(
      userId,
      period,
      roomId ? new Types.ObjectId(roomId) : undefined,
    );
  }

  @Get('compare')
  async compare(
    @Query('from1') from1: string,
    @Query('to1') to1: string,
    @Query('from2') from2: string,
    @Query('to2') to2: string,
    @Query('roomId') roomId: string | undefined,
    @Req() req: AuthenticatedRequest,
  ) {
    const userId = this.getUserId(req);
    return this.analyticsService.compare(
      userId,
      parseQueryDate(from1),
      parseQueryDateEnd(to1),
      parseQueryDate(from2),
      parseQueryDateEnd(to2),
      roomId ? new Types.ObjectId(roomId) : undefined,
    );
  }

  @Get('forecast')
  async forecast(
    @Query('months') months: string,
    @Query('roomId') roomId: string | undefined,
    @Req() req: AuthenticatedRequest,
  ) {
    const userId = this.getUserId(req);
    const m = Math.min(36, Math.max(1, parseInt(months, 10) || 3));
    return this.analyticsService.forecast(
      userId,
      m,
      roomId ? new Types.ObjectId(roomId) : undefined,
    );
  }

  @Get('category-breakdown')
  async categoryBreakdown(
    @Query('from') from: string | undefined,
    @Query('to') to: string | undefined,
    @Query('roomId') roomId: string | undefined,
    @Req() req: AuthenticatedRequest,
  ) {
    const userId = this.getUserId(req);
    return this.analyticsService.categoryBreakdown(
      userId,
      from ? parseQueryDate(from) : undefined,
      to ? parseQueryDateEnd(to) : undefined,
      roomId ? new Types.ObjectId(roomId) : undefined,
    );
  }
}
