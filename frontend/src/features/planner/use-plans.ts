import { useCallback, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { financeAPI } from '@shared/api';
import type { Plan } from '@entities/planner';

function toPlan(r: { _id: string; name: string; amount: number; dayOfMonth?: number; savingFor?: string; category?: string; roomId?: string; deadline?: string; savingsPercent?: number; completedAt?: string }): Plan {
  return {
    id: r._id,
    name: r.name,
    amount: r.amount,
    dayOfMonth: r.dayOfMonth,
    savingFor: r.savingFor,
    category: r.category,
    roomId: r.roomId,
    deadline: r.deadline,
    savingsPercent: r.savingsPercent,
    completedAt: r.completedAt,
  };
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

/** Set one plan's percent and distribute the remaining 100% evenly among other active plans. Single active plan is always 100%. */
function setOneAndRedistribute(plans: Plan[], targetId: string, newPercent: number): Plan[] {
  const active = plans.filter(isActive);
  if (active.length <= 1) {
    return plans.map((p) => (p.id === targetId ? { ...p, savingsPercent: 100 } : p));
  }
  const clamped = Math.max(0, Math.min(100, Math.round(newPercent)));
  const others = active.filter((p) => p.id !== targetId);
  const rest = 100 - clamped;
  const perOther = Math.floor(rest / others.length);
  const remainder = rest - perOther * others.length;
  return plans.map((p) => {
    if (p.id === targetId) return { ...p, savingsPercent: clamped };
    if (!isActive(p)) return p;
    const idx = others.findIndex((o) => o.id === p.id);
    const percent = idx === others.length - 1 ? perOther + remainder : perOther;
    return { ...p, savingsPercent: percent };
  });
}

const SAVE_PERCENT_DEBOUNCE_MS = 4000;

export function usePlans(roomId?: string) {
  const queryClient = useQueryClient();
  const queryKey = ['plans', roomId ?? 'personal'];
  const savePercentTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { data: list = [], isLoading } = useQuery({
    queryKey,
    queryFn: async () => {
      const res = await financeAPI.plans.list(roomId);
      return (res.data ?? []).map(toPlan);
    },
  });

  const createMutation = useMutation({
    mutationFn: (plan: Omit<Plan, 'id'>) =>
      financeAPI.plans.create({
        name: plan.name,
        amount: plan.amount,
        dayOfMonth: plan.dayOfMonth,
        savingFor: plan.savingFor,
        category: plan.category,
        roomId: plan.roomId ?? roomId,
        deadline: plan.deadline,
        savingsPercent: plan.savingsPercent,
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Parameters<typeof financeAPI.plans.update>[1] }) =>
      financeAPI.plans.update(id, data),
    onSuccess: (_data, _variables, context?: { skipInvalidate?: boolean }) => {
      if (context?.skipInvalidate) return;
      queryClient.invalidateQueries({ queryKey });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => financeAPI.plans.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey }),
  });

  const plans = list;

  const addPlan = useCallback(
    (plan: Omit<Plan, 'id'>) => {
      const activeWithNew = [...plans.filter(isActive), { ...plan, id: '', roomId }];
      const rebalanced = redistributePercentAmongActive(activeWithNew);
      const newPlan = rebalanced.find((p) => !p.id);
      const savingsPercent = newPlan?.savingsPercent ?? 100;
      createMutation.mutate({
        ...plan,
        roomId: plan.roomId ?? roomId,
        savingsPercent,
      });
      return '';
    },
    [plans, roomId, createMutation]
  );

  const updatePlan = useCallback(
    (id: string, data: Partial<Omit<Plan, 'id'>>) => {
      const payload: Parameters<typeof financeAPI.plans.update>[1] = {};
      if (data.name !== undefined) payload.name = data.name;
      if (data.amount !== undefined) payload.amount = data.amount;
      if (data.dayOfMonth !== undefined) payload.dayOfMonth = data.dayOfMonth;
      if (data.savingFor !== undefined) payload.savingFor = data.savingFor;
      if (data.category !== undefined) payload.category = data.category;
      if (data.deadline !== undefined) payload.deadline = data.deadline;
      if (data.savingsPercent !== undefined) payload.savingsPercent = data.savingsPercent;
      updateMutation.mutate({ id, data: payload });
    },
    [updateMutation]
  );

  const removePlan = useCallback(
    (id: string) => {
      deleteMutation.mutate(id);
    },
    [deleteMutation]
  );

  useEffect(() => {
    return () => {
      if (savePercentTimerRef.current) clearTimeout(savePercentTimerRef.current);
    };
  }, []);

  const setPlanSavingsPercent = useCallback(
    (id: string, percent: number) => {
      const nextPlans = setOneAndRedistribute(plans, id, percent);
      queryClient.setQueryData(queryKey, nextPlans);

      if (savePercentTimerRef.current) clearTimeout(savePercentTimerRef.current);
      savePercentTimerRef.current = setTimeout(async () => {
        savePercentTimerRef.current = null;
        const currentPlans = queryClient.getQueryData<Plan[]>(queryKey) ?? [];
        const active = currentPlans.filter(isActive);
        try {
          await Promise.all(
            active.map((p) =>
              updateMutation.mutateAsync({
                id: p.id,
                data: { savingsPercent: p.savingsPercent ?? 0 },
              })
            )
          );
        } finally {
          queryClient.invalidateQueries({ queryKey });
        }
      }, SAVE_PERCENT_DEBOUNCE_MS);
    },
    [plans, queryClient, queryKey, updateMutation]
  );

  const completePlan = useCallback(
    (id: string) => {
      updateMutation.mutate({
        id,
        data: { completedAt: new Date().toISOString() },
      });
    },
    [updateMutation]
  );

  return {
    plans,
    isLoading,
    addPlan,
    updatePlan,
    removePlan,
    setPlanSavingsPercent,
    completePlan,
  };
}
