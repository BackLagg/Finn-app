import { Injectable } from '@nestjs/common';
import { AuthResponseDto } from '../../dto/auth.dto';
import { UpdateUserProfileDto } from '../../dto/user-profile.dto';
import { TelegramUserData } from '../../middleware/telegram-auth.middleware';
import { UserDocument } from '../../schemas/user.schema';
import { SuperUserDocument } from '../../schemas/superuser.schema';
import { UserProfileDocument } from '../../schemas/user-profile.schema';
import { UserFullData } from '../../interfaces/user-data.interface';
import { CacheService } from '../cache/cache.service';
import { UserService } from './services/user.service';
import { UserProfileService } from './services/user-profile.service';
import { OnboardingService } from './services/onboarding.service';

interface CompleteOnboardingData {
  fullName?: string;
  currency?: string;
  monthlyIncome?: number;
  savingsOnly?: boolean;
  distribution?: { savings: number; investments: number; purchases: number };
}

@Injectable()
export class AuthService {
  constructor(
    private cacheService: CacheService,
    private userService: UserService,
    private userProfileService: UserProfileService,
    private onboardingService: OnboardingService,
  ) {}

  async buildAuthResponse(
    telegramUser: TelegramUserData,
    user: UserDocument | UserFullData | null,
    profile: UserProfileDocument | null,
    superUser: SuperUserDocument | null,
  ): Promise<AuthResponseDto> {
    let needsCacheInvalidation = false;

    if (!profile) {
      profile = await this.userProfileService.findOrCreateProfile(telegramUser);
      needsCacheInvalidation = true;
    }

    if (!user) {
      user = await this.userService.findOrCreateUser(telegramUser);
      needsCacheInvalidation = true;
    }

    if (needsCacheInvalidation && user) {
      const userId =
        (user as UserDocument)._id?.toString?.() ??
        (user as UserFullData).id ??
        (user as UserFullData)._id;
      if (userId) {
        await this.cacheService.invalidateByTags([
          `user:${userId}`,
          'new_users',
          'recent_registrations',
        ]);
      }
    }

    const userId = user
      ? ((user as UserDocument)._id?.toString?.() ??
        (user as UserFullData).id ??
        (user as UserFullData)._id ??
        '')
      : '';
    return {
      success: true,
      user: {
        id: userId || telegramUser.id.toString(),
        telegramId: telegramUser.id,
        username: profile?.username || '',
        name: profile?.name || '',
        role: superUser ? 'superuser' : 'user',
        isNew: profile?.isNew || false,
        isAccepted: user?.isAccepted || false,
        createdAt: this.formatDate(profile?.createdAt),
        updatedAt: this.formatDate(profile?.updatedAt),
        currency: profile?.currency,
        monthlyIncome: profile?.monthlyIncome,
        savingsOnly: profile?.savingsOnly,
        distribution: profile?.distribution,
        subscriptionTier: profile?.subscriptionTier || 'none',
        subscriptionExpiresAt: profile?.subscriptionExpiresAt
          ? this.formatDate(profile.subscriptionExpiresAt)
          : undefined,
      },
    };
  }

  async completeOnboarding(
    telegramUser: TelegramUserData,
    user: UserDocument | UserFullData | null,
    profile: UserProfileDocument | null,
    superUser: SuperUserDocument | null,
    onboardingData: CompleteOnboardingData & { initData?: string },
  ): Promise<AuthResponseDto> {
    profile = await this.onboardingService.completeOnboarding(
      telegramUser,
      user,
      profile,
      onboardingData,
    );

    if (!user) {
      user = await this.userService.findOrCreateUser(telegramUser);
    }

    const userId = user
      ? ((user as UserDocument)._id?.toString?.() ??
        (user as UserFullData).id ??
        (user as UserFullData)._id ??
        '')
      : '';
    return {
      success: true,
      user: {
        id: userId || telegramUser.id.toString(),
        telegramId: telegramUser.id,
        username: profile?.username || '',
        name: profile?.name || '',
        role: superUser ? 'superuser' : 'user',
        isNew: false,
        isAccepted: user?.isAccepted || false,
        createdAt: this.formatDate(profile?.createdAt),
        updatedAt: this.formatDate(profile?.updatedAt),
        currency: profile?.currency,
        monthlyIncome: profile?.monthlyIncome,
        savingsOnly: profile?.savingsOnly,
        distribution: profile?.distribution,
        subscriptionTier: profile?.subscriptionTier || 'none',
        subscriptionExpiresAt: profile?.subscriptionExpiresAt
          ? this.formatDate(profile.subscriptionExpiresAt)
          : undefined,
      },
    };
  }

  async updateLastLogin(telegramUser: TelegramUserData): Promise<void> {
    const telegramID = telegramUser.id.toString();
    await this.userService.updateLastLogin(telegramID);
  }

  async updateUserProfile(
    telegramUser: TelegramUserData,
    updateProfileDto: UpdateUserProfileDto,
    existingProfile?: UserProfileDocument | null,
  ): Promise<UserProfileDocument> {
    return this.userProfileService.updateUserProfile(
      telegramUser,
      updateProfileDto,
      existingProfile,
    );
  }

  /**
   * Преобразует дату в ISO строку, обрабатывая случаи когда дата может быть строкой или объектом Date
   */
  private formatDate(
    date: Date | string | number | undefined | unknown,
  ): string {
    try {
      // Если значение отсутствует
      if (!date) {
        return new Date().toISOString();
      }

      // Если это уже объект Date JavaScript
      if (date instanceof Date) {
        const result = isNaN(date.getTime())
          ? new Date().toISOString()
          : date.toISOString();
        return result;
      }

      // Если это строка
      if (typeof date === 'string') {
        const parsed = new Date(date);
        const result = isNaN(parsed.getTime())
          ? new Date().toISOString()
          : parsed.toISOString();
        return result;
      }

      // Если это число (timestamp)
      if (typeof date === 'number') {
        const parsed = new Date(date);
        const result = isNaN(parsed.getTime())
          ? new Date().toISOString()
          : parsed.toISOString();
        return result;
      }

      // Если это объект, пытаемся преобразовать через new Date
      // Это обработает случаи с MongoDB Date и другими объектами даты
      if (date && typeof date === 'object') {
        try {
          const d = date as { toISOString?: () => string };
          if (typeof d.toISOString === 'function') {
            const result = d.toISOString();
            if (typeof result === 'string') {
              return result;
            }
          }
        } catch {
          // ignore
        }

        try {
          const parsed = new Date(date as string | number | Date);
          if (!isNaN(parsed.getTime())) {
            return parsed.toISOString();
          }
        } catch {
          // ignore
        }
      }

      // Если ничего не помогло, возвращаем текущую дату
      return new Date().toISOString();
    } catch {
      return new Date().toISOString();
    }
  }
}
