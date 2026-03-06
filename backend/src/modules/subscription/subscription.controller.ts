import {
  Controller,
  Post,
  Body,
  UseGuards,
  Req,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { SubscriptionService } from './subscription.service';
import { ActivateSubscriptionDto } from '../../dto/subscription.dto';
import { UserGuard } from '../../guards/user.guard';
import { AuthenticatedRequest } from '../../interfaces/request.interface';
import { AuthService } from '../auth/auth.service';
import { Types } from 'mongoose';

@Controller('subscription')
@UseGuards(UserGuard)
export class SubscriptionController {
  constructor(
    private readonly subscriptionService: SubscriptionService,
    private readonly authService: AuthService,
  ) {}

  @Post('activate')
  @HttpCode(HttpStatus.OK)
  async activate(
    @Body() dto: ActivateSubscriptionDto,
    @Req() req: AuthenticatedRequest,
  ) {
    const userId = (req.user as any)?._id as Types.ObjectId;
    const profile = await this.subscriptionService.activateSubscription(
      userId,
      dto.tier,
    );

    return this.authService.buildAuthResponse(
      req.telegramUser!,
      req.user!,
      profile,
      req.superUser || null,
    );
  }
}
