export interface UserDistribution {
  savings: number;
  investments: number;
  purchases: number;
}

export interface User {
  id: string | null;
  telegramId: number | null;
  username: string;
  name: string;
  profession?: string;
  description?: string;
  avatarPath?: string;
  role: 'user' | 'superuser' | '';
  isNew: boolean;
  isAccepted: boolean;
  createdAt: string | null;
  updatedAt: string | null;
  lastLoginAt?: string | null;
  donationLevel?: number;
  totalDonated?: number;
  currency?: string;
  monthlyIncome?: number;
  savingsOnly?: boolean;
  distribution?: UserDistribution;
  subscriptionTier?: 'none' | 'finn' | 'finn_plus';
  subscriptionExpiresAt?: string | null;
}

export interface UserProfile {
  userId: string;
  profession?: string;
  description?: string;
  avatarPath?: string;
  createdAt: Date;
  updatedAt: Date;
}

