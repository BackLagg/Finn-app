import {
  Controller,
  Post,
  Body,
  UseGuards,
  Req,
  HttpCode,
  HttpStatus,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { SubscriptionService } from './subscription.service';
import {
  ActivateSubscriptionDto,
  GrantSubscriptionDto,
  RevokeSubscriptionDto,
} from '../../dto/subscription.dto';
import { UserGuard } from '../../guards/user.guard';
import { SuperUserGuard } from '../../guards/super-user.guard';
import { AuthenticatedRequest } from '../../interfaces/request.interface';
import { AuthService } from '../auth/auth.service';
import { Types } from 'mongoose';

@Controller('subscription')
export class SubscriptionController {
  constructor(
    private readonly subscriptionService: SubscriptionService,
    private readonly authService: AuthService,
  ) {}

  @Post('activate')
  @HttpCode(HttpStatus.OK)
  @UseGuards(UserGuard)
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

  /** Выдача подписки пользователю (только супер-админ). Логика начисления как в activate. */
  @Post('admin/grant')
  @HttpCode(HttpStatus.OK)
  @UseGuards(SuperUserGuard)
  async grant(@Body() dto: GrantSubscriptionDto) {
    if (!Types.ObjectId.isValid(dto.userId)) {
      throw new BadRequestException('Invalid userId');
    }
    const userId = new Types.ObjectId(dto.userId);
    const days = dto.days ?? 30;
    const profile = await this.subscriptionService.grantSubscription(
      userId,
      dto.tier,
      days,
    );
    if (!profile) {
      throw new NotFoundException('User profile not found');
    }
    return {
      success: true,
      userId: dto.userId,
      tier: profile.subscriptionTier,
      subscriptionExpiresAt: profile.subscriptionExpiresAt,
    };
  }

  /** Снятие подписки у пользователя (только супер-админ). */
  @Post('admin/revoke')
  @HttpCode(HttpStatus.OK)
  @UseGuards(SuperUserGuard)
  async revoke(@Body() dto: RevokeSubscriptionDto) {
    if (!Types.ObjectId.isValid(dto.userId)) {
      throw new BadRequestException('Invalid userId');
    }
    const userId = new Types.ObjectId(dto.userId);
    const profile = await this.subscriptionService.revokeSubscription(userId);
    if (!profile) {
      throw new NotFoundException('User profile not found');
    }
    return {
      success: true,
      userId: dto.userId,
      subscriptionTier: 'none',
    };
  }
}
