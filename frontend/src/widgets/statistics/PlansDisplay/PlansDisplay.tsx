import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FiCheck } from 'react-icons/fi';
import { usePlans } from '@features/planner';
import { useQuery } from '@tanstack/react-query';
import { financeAPI } from '@shared/api';
import { useCurrencyPreference } from '@shared/lib/use-currency-preference';
import { currencySymbols } from '@shared/lib/currency';
import { getCategoryLabel } from '@shared/lib/category-labels';
import { CategoryIcon, categoryColorMap, ProgressBar, Toggle } from '@shared/ui';
import type { Plan } from '@entities/planner';
import styles from './PlansDisplay.module.scss';

const PLAN_COLORS = ['#8b5cf6', '#ec4899', '#06b6d4', '#f59e0b', '#10b981', '#3b82f6'];
const COMPLETED_GREEN = '#10b981';

type PlanFilter = 'all' | 'active' | 'completed';

interface PlansDisplayProps {
  roomId?: string;
}

function getSavingsPercent(plan: Plan, activeCount: number): number {
  if (plan.savingsPercent != null) return plan.savingsPercent;
  return activeCount > 0 ? Math.round(100 / activeCount) : 0;
}

export const PlansDisplay: React.FC<PlansDisplayProps> = ({ roomId }) => {
  const { t } = useTranslation();
  const [currency] = useCurrencyPreference();
  const [filter, setFilter] = useState<PlanFilter>('all');
  const { plans, completePlan } = usePlans(roomId);
  const { data: totalSavingsData } = useQuery({
    queryKey: ['transactions', 'total-savings', roomId],
    queryFn: async () => {
      const res = await financeAPI.transactions.totalSavings({ roomId });
      return res.data;
    },
  });

  const totalSavingsCumulative = totalSavingsData?.totalSavings ?? 0;
  const completedTotal = useMemo(
    () => plans.filter((p) => p.completedAt).reduce((s, p) => s + p.amount, 0),
    [plans]
  );
  const availableSavings = Math.max(0, totalSavingsCumulative - completedTotal);
  const activePlans = useMemo(() => plans.filter((p) => !p.completedAt), [plans]);
  const activeCount = activePlans.length;

  const filteredPlans = useMemo(() => {
    if (filter === 'active') return plans.filter((p) => !p.completedAt);
    if (filter === 'completed') return plans.filter((p) => p.completedAt);
    return plans;
  }, [plans, filter]);

  if (plans.length === 0) return null;

  const filterOptions = [
    { value: 'all', label: t('statistics.planner.filterAll', 'Все') },
    { value: 'active', label: t('statistics.planner.filterActive', 'Активные') },
    { value: 'completed', label: t('statistics.planner.filterCompleted', 'Завершённые') },
  ] as const;

  return (
    <section className={styles.plans}>
      <div className={styles.plans__header}>
        <h2 className={styles.plans__title}>{t('statistics.planner.plans')}</h2>
        <Toggle
          options={filterOptions}
          value={filter}
          onChange={(v) => setFilter(v as PlanFilter)}
        />
      </div>
      <div className={styles.plans__list}>
        {filteredPlans.map((plan, idx) => {
          const isCompleted = !!plan.completedAt;
          const color = isCompleted
            ? COMPLETED_GREEN
            : plan.category
              ? (categoryColorMap[plan.category] || PLAN_COLORS[idx % PLAN_COLORS.length])
              : PLAN_COLORS[idx % PLAN_COLORS.length];
          const savingsPercent = getSavingsPercent(plan, activeCount);
          const current = isCompleted ? plan.amount : (availableSavings * savingsPercent) / 100;
          const planCurrent = Math.min(current, plan.amount);
          const remaining = Math.max(0, plan.amount - planCurrent);
          const progress = plan.amount > 0 ? (planCurrent / plan.amount) * 100 : 0;
          const isOverdue =
            !isCompleted &&
            plan.deadline &&
            new Date(plan.deadline).setHours(0, 0, 0, 0) < new Date().setHours(0, 0, 0, 0);

          return (
            <div
              key={plan.id}
              className={`${styles.plans__card} ${isCompleted ? styles['plans__card--completed'] : ''} ${isOverdue ? styles['plans__card--overdue'] : ''}`}
            >
              <div
                className={styles.plans__cardIcon}
                style={{ backgroundColor: `${color}20` }}
              >
                {plan.category ? (
                  <CategoryIcon category={plan.category} size={24} />
                ) : (
                  <span style={{ color, fontWeight: 700, fontSize: 14 }}>?</span>
                )}
              </div>
              <div className={styles.plans__cardContent}>
                <div className={styles.plans__cardRow}>
                  <div>
                    <div className={styles.plans__cardName}>{plan.name}</div>
                    {plan.category && (
                      <div className={styles.plans__cardCategory}>
                        {getCategoryLabel(t, 'expense', plan.category)}
                      </div>
                    )}
                  </div>
                  {!isCompleted && progress >= 100 && (
                    <button
                      type="button"
                      className={styles.plans__completeBtn}
                      onClick={() => completePlan(plan.id)}
                      title={t('statistics.planner.markCompleted', 'Отметить выполненным')}
                      aria-label={t('statistics.planner.markCompleted', 'Отметить выполненным')}
                    >
                      <FiCheck size={22} />
                    </button>
                  )}
                  {isCompleted && (
                    <span className={styles.plans__completedBadge} aria-hidden>
                      <FiCheck size={18} />
                    </span>
                  )}
                </div>
                <div className={styles.plans__cardCurrentTarget}>
                  {Math.round(planCurrent).toLocaleString()} {currencySymbols[currency]} / {plan.amount.toLocaleString()} {currencySymbols[currency]}
                </div>
                <ProgressBar
                  value={progress}
                  max={100}
                  color={color}
                  height="md"
                  showValue
                />
                {!isCompleted && (
                  <div className={styles.plans__cardRemaining}>
                    {Math.round(remaining).toLocaleString()} {currencySymbols[currency]}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};
