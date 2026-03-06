import {
  Controller,
  Post,
  Put,
  HttpStatus,
  HttpCode,
  UseGuards,
  Req,
  Body,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthResponseDto } from '../../dto/auth.dto';
import { UpdateUserProfileDto } from '../../dto/user-profile.dto';
import { CompleteOnboardingDto } from '../../dto/onboarding.dto';
import { UserGuard } from '../../guards/user.guard';
import { AuthenticatedRequest } from '../../interfaces/request.interface';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post()
  @HttpCode(HttpStatus.OK)
  async authenticate(
    @Req() req: AuthenticatedRequest,
  ): Promise<AuthResponseDto> {
    if (!req.telegramUser) {
      throw new Error('Telegram user not found');
    }
    // Обновляем время последнего входа
    await this.authService.updateLastLogin(req.telegramUser);

    return this.authService.buildAuthResponse(
      req.telegramUser,
      req.user || null,
      req.profile || null,
      req.superUser || null,
    );
  }

  @Post('complete-onboarding')
  @HttpCode(HttpStatus.OK)
  @UseGuards(UserGuard)
  async completeOnboarding(
    @Req() req: AuthenticatedRequest,
    @Body() completeOnboardingDto: CompleteOnboardingDto,
  ): Promise<AuthResponseDto> {
    const result = await this.authService.completeOnboarding(
      req.telegramUser!,
      req.user || null,
      req.profile || null,
      req.superUser || null,
      completeOnboardingDto,
    );

    // Обновляем время последнего входа ПОСЛЕ завершения онбординга
    await this.authService.updateLastLogin(req.telegramUser!);

    return result;
  }

  @Put('update-profile')
  @HttpCode(HttpStatus.OK)
  @UseGuards(UserGuard)
  async updateProfile(
    @Req() req: AuthenticatedRequest,
    @Body() updateProfileDto: UpdateUserProfileDto,
  ): Promise<AuthResponseDto> {
    const profile = await this.authService.updateUserProfile(
      req.telegramUser!,
      updateProfileDto,
      req.profile || null,
    );

    return this.authService.buildAuthResponse(
      req.telegramUser!,
      req.user || null,
      profile,
      req.superUser || null,
    );
  }
}
