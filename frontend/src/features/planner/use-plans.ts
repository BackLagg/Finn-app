import { useState, useCallback, useEffect } from 'react';
import type { Plan } from '@entities/planner';

const STORAGE_KEY = 'finance-planner-plans';

function getStorageKey(roomId?: string): string {
  return roomId ? `room-${roomId}` : 'personal';
}

function loadPlans(roomId?: string): Plan[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) return [];
    const parsed: Record<string, Plan[]> = JSON.parse(data);
    return parsed[getStorageKey(roomId)] ?? [];
  } catch {
    return [];
  }
}

function savePlans(roomId: string | undefined, plans: Plan[]): void {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    const parsed: Record<string, Plan[]> = data ? JSON.parse(data) : {};
    parsed[getStorageKey(roomId)] = plans;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
  } catch {}
}

function isActive(p: Plan): boolean {
  return !p.completedAt;
}

function redistributePercentAmongActive(plans: Plan[]): Plan[] {
  const active = plans.filter(isActive);
  if (active.length === 0) return plans;
  const equalPercent = Math.round(100 / active.length);
  const activeIds = new Set(active.map((p) => p.id));
  return plans.map((p) => {
    if (!activeIds.has(p.id)) return p;
    const idx = active.findIndex((a) => a.id === p.id);
    const percent = idx === active.length - 1 ? 100 - equalPercent * (active.length - 1) : equalPercent;
    return { ...p, savingsPercent: percent };
  });
}

export function usePlans(roomId?: string) {
  const [plans, setPlans] = useState<Plan[]>(() => loadPlans(roomId));

  useEffect(() => {
    setPlans(loadPlans(roomId));
  }, [roomId]);

  const addPlan = useCallback(
    (plan: Omit<Plan, 'id'>) => {
      const newPlan: Plan = {
        ...plan,
        id: crypto.randomUUID(),
        roomId,
      };
      setPlans((prev) => {
        const activeWithNew = [...prev.filter(isActive), newPlan];
        const rebalanced = redistributePercentAmongActive(activeWithNew);
        const completed = prev.filter((p) => p.completedAt);
        const next = [...rebalanced, ...completed];
        savePlans(roomId, next);
        return next;
      });
      return newPlan.id;
    },
    [roomId]
  );

  const updatePlan = useCallback(
    (id: string, data: Partial<Omit<Plan, 'id'>>) => {
      setPlans((prev) => {
        const next = prev.map((p) => (p.id === id ? { ...p, ...data } : p));
        savePlans(roomId, next);
        return next;
      });
    },
    [roomId]
  );

  const removePlan = useCallback(
    (id: string) => {
      setPlans((prev) => {
        const next = prev.filter((p) => p.id !== id);
        if (next.length === 0) {
          savePlans(roomId, next);
          return next;
        }
        const updated = redistributePercentAmongActive(next);
        savePlans(roomId, updated);
        return updated;
      });
    },
    [roomId]
  );

  const setPlanSavingsPercent = useCallback(
    (id: string, percent: number) => {
      const clamped = Math.max(0, Math.min(100, Math.round(percent)));
      setPlans((prev) => {
        const active = prev.filter(isActive);
        if (active.length <= 1) {
          const next = prev.map((p) => (p.id === id ? { ...p, savingsPercent: 100 } : p));
          savePlans(roomId, next);
          return next;
        }
        const rest = 100 - clamped;
        const otherActive = active.filter((q) => q.id !== id);
        const otherCount = otherActive.length;
        const perOther = otherCount > 0 ? Math.round(rest / otherCount) : 0;
        const lastOther = rest - perOther * (otherCount - 1);
        const next = prev.map((p) => {
          if (p.id === id) return { ...p, savingsPercent: clamped };
          if (p.completedAt) return p;
          const idx = otherActive.indexOf(p);
          return { ...p, savingsPercent: idx === otherCount - 1 ? lastOther : perOther };
        });
        savePlans(roomId, next);
        return next;
      });
    },
    [roomId]
  );

  const completePlan = useCallback(
    (id: string) => {
      setPlans((prev) => {
        const next = prev.map((p) =>
          p.id === id ? { ...p, completedAt: new Date().toISOString() } : p
        );
        const rebalanced = redistributePercentAmongActive(next);
        savePlans(roomId, rebalanced);
        return rebalanced;
      });
    },
    [roomId]
  );

  return { plans, addPlan, updatePlan, removePlan, setPlanSavingsPercent, completePlan };
}
