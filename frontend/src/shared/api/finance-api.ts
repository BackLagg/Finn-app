import { apiClient } from './base-api';

export interface Transaction {
  _id: string;
  amount: number;
  type: 'income' | 'expense';
  category: string;
  date: string;
  description?: string;
  source?: string;
  receiptImageUrl?: string;
  userId?: string;
  savingsAmount?: number;
}

export interface BudgetSettings {
  currency: string;
  monthlyIncome: number;
  fixedExpenses: { name: string; amount: number }[];
  distribution: { savings: number; investments: number; purchases: number };
}

export interface Goal {
  _id: string;
  title: string;
  targetAmount: number;
  currentAmount: number;
  currency: string;
  deadline?: string;
}

export interface ShoppingListItem {
  name: string;
  checked: boolean;
  estimatedPrice?: number;
}

export interface ShoppingList {
  _id: string;
  title: string;
  items: ShoppingListItem[];
  isPinned: boolean;
  order: number;
}

export interface Reminder {
  _id: string;
  amount: number;
  currency: string;
  description: string;
  date: string;
  dayOfMonth: number;
  isRecurring: boolean;
  roomId?: string;
  createdAt: string;
}

export interface PartnerRoom {
  _id: string;
  name: string;
  inviteCode: string;
  members: {
    userId: { _id?: string; telegramID?: string; username?: string; name?: string };
    role: string;
    contributionPercent: number;
    displayName?: string | null;
  }[];
  isFrozen?: boolean;
}

export interface PlanResponse {
  _id: string;
  name: string;
  amount: number;
  dayOfMonth?: number;
  savingFor?: string;
  category?: string;
  roomId?: string;
  deadline?: string;
  savingsPercent?: number;
  completedAt?: string;
}

export interface BudgetLimit {
  _id: string;
  category: string;
  limit: number;
  currency: string;
  period: 'daily' | 'weekly' | 'monthly';
  spent: number;
  roomId?: string;
}

export interface NotificationSettings {
  _id: string;
  dailyReminder: boolean;
  dailyReminderTime?: string;
  budgetAlerts: boolean;
  budgetAlertThreshold: number;
  weeklyReport: boolean;
  goalProgress: boolean;
}

export interface RecurringTransaction {
  _id: string;
  amount: number;
  type: 'income' | 'expense';
  category: string;
  description?: string;
  frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
  nextDate: string;
  isActive: boolean;
  roomId?: string;
}

export interface AnalyticsTrend {
  period: string;
  income: number;
  expense: number;
  savings: number;
  change: number;
}

export interface ExportOptions {
  format: 'csv' | 'pdf' | 'json';
  from?: string;
  to?: string;
  includeCategories?: boolean;
  includeReceipts?: boolean;
  roomId?: string;
}

export const financeAPI = {
  transactions: {
    list: (params?: { roomId?: string; from?: string; to?: string; limit?: number }) =>
      apiClient.get<Transaction[]>('/transaction', { params }),
    create: (data: { amount: number; currency?: string; type: 'income' | 'expense'; category: string; date?: string; description?: string; roomId?: string; receiptImageUrl?: string }) =>
      apiClient.post<Transaction>('/transaction', data),
    update: (id: string, data: Partial<{ amount: number; type: string; category: string; date: string; description: string; receiptImageUrl: string }>) =>
      apiClient.put<Transaction>(`/transaction/${id}`, data),
    delete: (id: string) => apiClient.delete(`/transaction/${id}`),
    stats: (params?: { roomId?: string; from?: string; to?: string }) =>
      apiClient.get<{ category: string; total: number }[]>('/transaction/stats', { params }),
    statsByMember: (params: { roomId: string; from?: string; to?: string }) =>
      apiClient.get<{ userId: string; total: number }[]>('/transaction/stats/by-member', { params }),
    totalSavings: (params?: { roomId?: string }) =>
      apiClient.get<{ totalSavings: number }>('/transaction/total-savings', { params }),
  },
  budget: {
    get: (roomId?: string) => apiClient.get<BudgetSettings | null>('/budget', { params: { roomId } }),
    upsert: (data: {
      currency: string;
      monthlyIncome: number;
      fixedExpenses: { name: string; amount: number }[];
      savingsPercent: number;
      investmentsPercent: number;
      purchasesPercent: number;
      roomId?: string;
    }) => apiClient.post<BudgetSettings>('/budget', data),
  },
  goals: {
    list: (roomId?: string) => apiClient.get<Goal[]>('/goal', { params: { roomId } }),
    create: (data: { title: string; targetAmount: number; currency?: string; deadline?: string; roomId?: string }) =>
      apiClient.post<Goal>('/goal', data),
    update: (id: string, data: Partial<{ title: string; targetAmount: number; currentAmount: number; deadline: string }>) =>
      apiClient.put<Goal>(`/goal/${id}`, data),
    delete: (id: string) => apiClient.delete(`/goal/${id}`),
  },
  plans: {
    list: (roomId?: string) => apiClient.get<PlanResponse[]>('/plan', { params: roomId ? { roomId } : undefined }),
    create: (data: {
      name: string;
      amount: number;
      dayOfMonth?: number;
      savingFor?: string;
      category?: string;
      roomId?: string;
      deadline?: string;
      savingsPercent?: number;
    }) => apiClient.post<PlanResponse>('/plan', data),
    update: (
      id: string,
      data: Partial<{
        name: string;
        amount: number;
        dayOfMonth: number;
        savingFor: string;
        category: string;
        deadline: string;
        savingsPercent: number;
        completedAt: string;
      }>
    ) => apiClient.put<PlanResponse>(`/plan/${id}`, data),
    delete: (id: string) => apiClient.delete(`/plan/${id}`),
  },
  shoppingLists: {
    list: (roomId?: string) => apiClient.get<ShoppingList[]>('/shopping-list', { params: { roomId } }),
    create: (data: { title: string; items: { name: string; checked?: boolean; estimatedPrice?: number }[]; roomId?: string }) =>
      apiClient.post<ShoppingList>('/shopping-list', data),
    update: (id: string, data: Partial<{ title: string; items: ShoppingListItem[]; isPinned: boolean; order: number }>) =>
      apiClient.put<ShoppingList>(`/shopping-list/${id}`, data),
    delete: (id: string) => apiClient.delete(`/shopping-list/${id}`),
  },
  reminders: {
    list: (params?: { roomId?: string; from?: string; to?: string }) =>
      apiClient.get<Reminder[]>('/reminder', { params }),
    create: (data: { amount: number; currency?: string; description?: string; date: string; dayOfMonth: number; isRecurring?: boolean; roomId?: string }) =>
      apiClient.post<Reminder>('/reminder', data),
    delete: (id: string) => apiClient.delete(`/reminder/${id}`),
  },
  partnerRooms: {
    list: () => apiClient.get<PartnerRoom[]>('/partner-room'),
    create: (name: string) => apiClient.post<PartnerRoom>('/partner-room', { name }),
    join: (inviteCode: string) => apiClient.post<PartnerRoom>('/partner-room/join', { inviteCode }),
    get: (id: string) => apiClient.get<PartnerRoom>(`/partner-room/${id}`),
    update: (id: string, name: string) =>
      apiClient.patch<{ updated: boolean }>(`/partner-room/${id}`, { name }),
    delete: (id: string) => apiClient.delete<{ deleted: boolean }>(`/partner-room/${id}`),
    regenerateCode: (id: string) =>
      apiClient.post<{ inviteCode: string }>(`/partner-room/${id}/regenerate-code`),
    removeMember: (id: string, memberUserId: string) =>
      apiClient.delete<{ removed: boolean }>(`/partner-room/${id}/members`, {
        data: { memberUserId },
      }),
  },
  receiptScan: (file: File, language?: string, roomId?: string) => {
    const fd = new FormData();
    fd.append('file', file);
    return apiClient.post<{ parsed: { amount: number; category: string; description: string }; transaction: Transaction }>(
      '/receipt-ai/scan',
      fd,
      { params: { language, roomId }, headers: { 'Content-Type': 'multipart/form-data' } },
    );
  },
  receiptParse: (file: File, language?: string) => {
    const fd = new FormData();
    fd.append('file', file);
    return apiClient.post<{ amount: number; category: string; description: string }>(
      '/receipt-ai/parse',
      fd,
      { params: { language }, headers: { 'Content-Type': 'multipart/form-data' } },
    );
  },

  // Budget Limits API
  budgetLimits: {
    list: (roomId?: string) => 
      apiClient.get<BudgetLimit[]>('/budget-limit', { params: { roomId } }),
    create: (data: { category: string; limit: number; currency?: string; period: 'daily' | 'weekly' | 'monthly'; roomId?: string }) =>
      apiClient.post<BudgetLimit>('/budget-limit', data),
    update: (id: string, data: Partial<{ limit: number; period: 'daily' | 'weekly' | 'monthly' }>) =>
      apiClient.put<BudgetLimit>(`/budget-limit/${id}`, data),
    delete: (id: string) => apiClient.delete(`/budget-limit/${id}`),
    checkStatus: (roomId?: string) =>
      apiClient.get<{ category: string; limit: number; spent: number; percentage: number; isOver: boolean }[]>(
        '/budget-limit/status',
        { params: { roomId } }
      ),
  },

  // Notification Settings API
  notifications: {
    get: () => apiClient.get<NotificationSettings>('/notification-settings'),
    update: (data: Partial<NotificationSettings>) =>
      apiClient.put<NotificationSettings>('/notification-settings', data),
    testPush: () => apiClient.post('/notification-settings/test'),
  },

  // Recurring Transactions API
  recurring: {
    list: (roomId?: string) =>
      apiClient.get<RecurringTransaction[]>('/recurring-transaction', { params: { roomId } }),
    create: (data: {
      amount: number;
      type: 'income' | 'expense';
      category: string;
      description?: string;
      frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
      startDate: string;
      roomId?: string;
    }) => apiClient.post<RecurringTransaction>('/recurring-transaction', data),
    update: (id: string, data: Partial<{ amount: number; category: string; frequency: string; isActive: boolean }>) =>
      apiClient.put<RecurringTransaction>(`/recurring-transaction/${id}`, data),
    delete: (id: string) => apiClient.delete(`/recurring-transaction/${id}`),
    trigger: (id: string) => apiClient.post<Transaction>(`/recurring-transaction/${id}/trigger`),
  },

  // Analytics API
  analytics: {
    trends: (params: { period: 'week' | 'month' | 'quarter' | 'year'; roomId?: string }) =>
      apiClient.get<AnalyticsTrend[]>('/analytics/trends', { params }),
    compare: (params: { from1: string; to1: string; from2: string; to2: string; roomId?: string }) =>
      apiClient.get<{ period1: { income: number; expense: number }; period2: { income: number; expense: number }; change: number }>(
        '/analytics/compare',
        { params }
      ),
    forecast: (params: { months: number; roomId?: string }) =>
      apiClient.get<{ month: string; predictedIncome: number; predictedExpense: number; predictedSavings: number }[]>(
        '/analytics/forecast',
        { params }
      ),
    categoryBreakdown: (params: { from?: string; to?: string; roomId?: string }) =>
      apiClient.get<{ category: string; amount: number; percentage: number; trend: 'up' | 'down' | 'stable' }[]>(
        '/analytics/category-breakdown',
        { params }
      ),
  },

  // Export API
  export: {
    generate: (options: ExportOptions) =>
      apiClient.post<{ downloadUrl: string; expiresAt: string }>('/export/generate', options),
    download: (token: string) =>
      apiClient.get<Blob>(`/export/download/${token}`, { responseType: 'blob' }),
    history: () =>
      apiClient.get<{ _id: string; format: string; createdAt: string; downloadUrl: string }[]>('/export/history'),
  },

  // Currency Converter API
  currency: {
    rates: (base?: string) =>
      apiClient.get<{ base: string; rates: Record<string, number>; updatedAt: string }>('/currency/rates', { params: { base } }),
    convert: (params: { amount: number; from: string; to: string }) =>
      apiClient.get<{ amount: number; from: string; to: string; result: number; rate: number }>('/currency/convert', { params }),
  },
};
