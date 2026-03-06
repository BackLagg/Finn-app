import { apiClient } from './base-api';
import type { User } from '@shared/types';
import type { Currency } from '@shared/lib/currency';
import type { Distribution } from '@shared/lib/distribution';

const getStartParam = (): string | null => {
  return (window?.Telegram?.WebApp?.initDataUnsafe as any)?.start_param || null;
};

export interface CompleteOnboardingPayload {
  fullName?: string;
  currency?: Currency;
  monthlyIncome?: number;
  savingsOnly?: boolean;
  distribution?: Distribution;
}

export interface UpdateProfilePayload {
  name?: string;
  currency?: Currency;
  monthlyIncome?: number;
  savingsOnly?: boolean;
  distribution?: Distribution;
}

export const authAPI = {
  authenticate: async (initData: string): Promise<{ success: boolean; user: User }> => {
    const startParam = getStartParam();
    const response = await apiClient.post<{ success: boolean; user: User }>('/auth', {
      initData,
      tgWebAppStartParam: startParam,
    });
    return response.data;
  },

  completeOnboarding: async (
    initData: string,
    data: CompleteOnboardingPayload
  ): Promise<{ success: boolean; user: User }> => {
    const startParam = getStartParam();
    const response = await apiClient.post<{ success: boolean; user: User }>('/auth/complete-onboarding', {
      initData,
      tgWebAppStartParam: startParam,
      ...data,
    });
    return response.data;
  },

  updateProfile: async (
    initData: string,
    data: UpdateProfilePayload
  ): Promise<{ success: boolean; user: User }> => {
    const startParam = getStartParam();
    const response = await apiClient.put<{ success: boolean; user: User }>('/auth/update-profile', {
      initData,
      tgWebAppStartParam: startParam,
      ...data,
    });
    return response.data;
  },

  activateSubscription: async (
    initData: string,
    tier: 'finn' | 'finn_plus'
  ): Promise<{ success: boolean; user: User }> => {
    const response = await apiClient.post<{ success: boolean; user: User }>('/subscription/activate', {
      tier,
    });
    return response.data;
  },
};

