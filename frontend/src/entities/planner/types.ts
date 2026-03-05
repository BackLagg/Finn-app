export interface Plan {
  id: string;
  name: string;
  amount: number;
  dayOfMonth?: number;
  savingFor?: string;
  category?: string;
  roomId?: string;
  deadline?: string;
}

export interface IncomePayment {
  id: string;
  amount: number;
  comment: string;
  createdAt: string;
}
