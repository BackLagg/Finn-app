import type { Transaction } from '@shared/api/finance-api';

export function getTransactionAmount(tx: Transaction): number {
  if (typeof tx.amount === 'number') return tx.amount;
  const a = tx.amount as { USD?: number; EUR?: number; RUB?: number; BYN?: number };
  return a.USD ?? a.EUR ?? a.RUB ?? a.BYN ?? 0;
}
