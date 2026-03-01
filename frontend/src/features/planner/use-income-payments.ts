import { useState, useCallback, useEffect } from 'react';
import type { IncomePayment } from '@entities/planner';

const STORAGE_KEY = 'finance-planner-income';

function getMonthKey(year: number, month: number): string {
  return `${year}-${String(month + 1).padStart(2, '0')}`;
}

function loadPayments(year: number, month: number): IncomePayment[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) return [];
    const parsed: Record<string, IncomePayment[]> = JSON.parse(data);
    return (parsed[getMonthKey(year, month)] ?? []).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  } catch {
    return [];
  }
}

function savePayments(year: number, month: number, payments: IncomePayment[]): void {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    const parsed: Record<string, IncomePayment[]> = data ? JSON.parse(data) : {};
    parsed[getMonthKey(year, month)] = payments;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
  } catch {}
}

export function useIncomePayments(year: number, month: number) {
  const [payments, setPayments] = useState<IncomePayment[]>(() => loadPayments(year, month));

  useEffect(() => {
    setPayments(loadPayments(year, month));
  }, [year, month]);

  const addPayment = useCallback(
    (amount: number, comment: string) => {
      const newPayment: IncomePayment = {
        id: crypto.randomUUID(),
        amount,
        comment: comment.trim() || '-',
        createdAt: new Date().toISOString(),
      };
      setPayments((prev) => {
        const next = [newPayment, ...prev];
        savePayments(year, month, next);
        return next;
      });
      return newPayment.id;
    },
    [year, month]
  );

  const removePayment = useCallback(
    (id: string) => {
      setPayments((prev) => {
        const next = prev.filter((p) => p.id !== id);
        savePayments(year, month, next);
        return next;
      });
    },
    [year, month]
  );

  const totalIncome = payments.reduce((s, p) => s + p.amount, 0);

  return { payments, addPayment, removePayment, totalIncome };
}
