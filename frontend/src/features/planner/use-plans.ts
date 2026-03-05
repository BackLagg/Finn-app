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
        const next = [...prev, newPlan];
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
        savePlans(roomId, next);
        return next;
      });
    },
    [roomId]
  );

  return { plans, addPlan, updatePlan, removePlan };
}
