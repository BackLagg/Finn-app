import { Injectable } from '@nestjs/common';
import { UserDocument } from '../../../schemas/user.schema';
import { UserProfileDocument } from '../../../schemas/user-profile.schema';
import { TelegramUserData } from '../../../middleware/telegram-auth.middleware';
import { UserFullData } from '../../../interfaces/user-data.interface';
import { CacheService } from '../../cache/cache.service';
import { UserService } from './user.service';
import { UserProfileService } from './user-profile.service';

interface CompleteOnboardingData {
  fullName?: string;
  currency?: string;
  monthlyIncome?: number;
  savingsOnly?: boolean;
  distribution?: { savings: number; investments: number; purchases: number };
}

@Injectable()
export class OnboardingService {
  constructor(
    private userService: UserService,
    private userProfileService: UserProfileService,
    private cacheService: CacheService,
  ) { }

  async completeOnboarding(
    telegramUser: TelegramUserData,
    user: UserDocument | UserFullData | null,
    profile: UserProfileDocument | null,
    onboardingData: CompleteOnboardingData,
  ): Promise<UserProfileDocument> {
    if (!profile) {
      profile = await this.userProfileService.findOrCreateProfile(telegramUser);
    }

    if (!user) {
      user = await this.userService.findOrCreateUser(telegramUser);
    }

    const isNewUser = profile?.isNew || false;
    const updateData: Partial<{
      isNew: boolean;
      name: string;
      username: string;
      avatarPath: string;
      currency: string;
      monthlyIncome: number;
      savingsOnly: boolean;
      distribution: { savings: number; investments: number; purchases: number };
    }> = {};

    if (isNewUser) {
      updateData.isNew = false;
    }

    if (onboardingData.fullName && onboardingData.fullName.trim()) {
      updateData.name = onboardingData.fullName.trim();
    }

    if (onboardingData.currency !== undefined) {
      updateData.currency = onboardingData.currency;
    }
    if (onboardingData.monthlyIncome !== undefined) {
      updateData.monthlyIncome = onboardingData.monthlyIncome;
    }
    if (onboardingData.savingsOnly !== undefined) {
      updateData.savingsOnly = onboardingData.savingsOnly;
    }
    if (onboardingData.distribution !== undefined) {
      updateData.distribution = onboardingData.distribution;
    }

    if (telegramUser.username) {
      if (isNewUser || !profile.username) {
        updateData.username = telegramUser.username;
      }
    }

    const avatarPath = await this.userProfileService.processUserAvatar(
      telegramUser,
      profile,
    );
    if (avatarPath) {
      updateData.avatarPath = avatarPath;
    }

    const userId = (user as UserDocument)._id ?? (user as UserFullData)._id;
    if (Object.keys(updateData).length > 0 && userId) {
      profile = await this.userProfileService.updateProfile(userId, updateData);
    }
    const userIdStr =
      typeof userId === 'string'
        ? userId
        : ((userId as { toString: () => string }).toString?.() ?? '');
    await this.cacheService.invalidateByTags([
      `user:${userIdStr}`,
      'onboarding_completed',
    ]);

    return profile;
  }
}
