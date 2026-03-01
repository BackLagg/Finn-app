import { useState, useCallback, useEffect } from 'react';
import type { Plan } from '@entities/planner';

const STORAGE_KEY = 'finance-planner-plans';

function getMonthKey(year: number, month: number): string {
  return `${year}-${String(month + 1).padStart(2, '0')}`;
}

function loadPlans(year: number, month: number): Plan[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) return [];
    const parsed: Record<string, Plan[]> = JSON.parse(data);
    return parsed[getMonthKey(year, month)] ?? [];
  } catch {
    return [];
  }
}

function savePlans(year: number, month: number, plans: Plan[]): void {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    const parsed: Record<string, Plan[]> = data ? JSON.parse(data) : {};
    parsed[getMonthKey(year, month)] = plans;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
  } catch {}
}

export function usePlans(year: number, month: number) {
  const [plans, setPlans] = useState<Plan[]>(() => loadPlans(year, month));

  useEffect(() => {
    setPlans(loadPlans(year, month));
  }, [year, month]);

  const addPlan = useCallback(
    (plan: Omit<Plan, 'id'>) => {
      const newPlan: Plan = {
        ...plan,
        id: crypto.randomUUID(),
      };
      setPlans((prev) => {
        const next = [...prev, newPlan];
        savePlans(year, month, next);
        return next;
      });
      return newPlan.id;
    },
    [year, month]
  );

  const updatePlan = useCallback(
    (id: string, data: Partial<Omit<Plan, 'id'>>) => {
      setPlans((prev) => {
        const next = prev.map((p) => (p.id === id ? { ...p, ...data } : p));
        savePlans(year, month, next);
        return next;
      });
    },
    [year, month]
  );

  const removePlan = useCallback(
    (id: string) => {
      setPlans((prev) => {
        const next = prev.filter((p) => p.id !== id);
        savePlans(year, month, next);
        return next;
      });
    },
    [year, month]
  );

  return { plans, addPlan, updatePlan, removePlan };
}
