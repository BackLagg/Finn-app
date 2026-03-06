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
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

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
}
