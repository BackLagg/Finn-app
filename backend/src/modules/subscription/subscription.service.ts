import { Injectable, Inject } from '@nestjs/common';
import { Model, Types } from 'mongoose';
import { UserProfileDocument } from '../../schemas/user-profile.schema';
import { CacheService } from '../cache/cache.service';

@Injectable()
export class SubscriptionService {
  constructor(
    @Inject('UserProfileModel')
    private userProfileModel: Model<UserProfileDocument>,
    private cacheService: CacheService,
  ) {}

  async activateSubscription(
    userId: Types.ObjectId,
    tier: 'finn' | 'finn_plus',
  ): Promise<UserProfileDocument | null> {
    return this.grantSubscription(userId, tier, 30);
  }

  /** Выдача подписки (админ): та же логика начисления, с указанием срока в днях */
  async grantSubscription(
    userId: Types.ObjectId,
    tier: 'finn' | 'finn_plus',
    days: number = 30,
  ): Promise<UserProfileDocument | null> {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + days);

    const profile = await this.userProfileModel.findOneAndUpdate(
      { userId },
      {
        subscriptionTier: tier,
        subscriptionExpiresAt: expiresAt,
      },
      { new: true },
    );

    if (profile) {
      await this.cacheService.invalidateByTags([`user:${userId.toString()}`]);
    }

    return profile;
  }

  /** Снятие подписки (админ) */
  async revokeSubscription(
    userId: Types.ObjectId,
  ): Promise<UserProfileDocument | null> {
    const profile = await this.userProfileModel.findOneAndUpdate(
      { userId },
      {
        $set: { subscriptionTier: 'none' },
        $unset: { subscriptionExpiresAt: 1 },
      },
      { new: true },
    );

    if (profile) {
      await this.cacheService.invalidateByTags([`user:${userId.toString()}`]);
    }

    return profile;
  }
}
