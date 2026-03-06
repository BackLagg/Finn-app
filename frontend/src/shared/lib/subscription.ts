import type { User } from '@shared/types';

export function hasActiveSubscription(
  user: User | null | undefined,
  minTier?: 'finn' | 'finn_plus',
): boolean {
  if (!user || !user.subscriptionTier || user.subscriptionTier === 'none') {
    return false;
  }

  if (user.subscriptionExpiresAt) {
    const expiryDate = new Date(user.subscriptionExpiresAt);
    if (expiryDate < new Date()) {
      return false;
    }
  }

  if (minTier) {
    const tierLevel = {
      none: 0,
      finn: 1,
      finn_plus: 2,
    };
    const userLevel = tierLevel[user.subscriptionTier];
    const requiredLevel = tierLevel[minTier];
    return userLevel >= requiredLevel;
  }

  return true;
}
