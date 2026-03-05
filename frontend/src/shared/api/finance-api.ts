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
  members: { userId: { telegramID?: string; username?: string; name?: string }; role: string; contributionPercent: number; displayName?: string | null }[];
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
};
