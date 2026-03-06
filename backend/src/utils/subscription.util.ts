import { UserProfileDocument } from '../schemas/user-profile.schema';

export function hasActiveSubscription(
  profile: UserProfileDocument | null | undefined,
  minTier?: 'finn' | 'finn_plus',
): boolean {
  if (!profile || !profile.subscriptionTier || profile.subscriptionTier === 'none') {
    return false;
  }

  if (profile.subscriptionExpiresAt && profile.subscriptionExpiresAt < new Date()) {
    return false;
  }

  if (minTier) {
    const tierLevel = {
      none: 0,
      finn: 1,
      finn_plus: 2,
    };
    const userLevel = tierLevel[profile.subscriptionTier];
    const requiredLevel = tierLevel[minTier];
    return userLevel >= requiredLevel;
  }

  return true;
}
