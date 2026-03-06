export class AuthResponseDto {
  success!: boolean;
  user?: {
    id: string;
    telegramId: number;
    username: string;
    name?: string;
    role: string;
    isNew: boolean;
    isAccepted: boolean;
    createdAt: string;
    updatedAt: string;
    currency?: string;
    monthlyIncome?: number;
    savingsOnly?: boolean;
    distribution?: { savings: number; investments: number; purchases: number };
    subscriptionTier?: 'none' | 'finn' | 'finn_plus';
    subscriptionExpiresAt?: string;
  };
  error?: string;
}
