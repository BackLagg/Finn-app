import React, { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { FiPlus, FiTrash2, FiEdit2, FiCheck } from 'react-icons/fi';
import { financeAPI } from '@shared/api';
import { getTransactionAmount } from '@shared/lib/transaction';
import { usePlans } from '@features/planner';
import { useCurrencyPreference } from '@shared/lib/use-currency-preference';
import { currencySymbols } from '@shared/lib/currency';
import { getCategoryLabel } from '@shared/lib/category-labels';
import type { Plan } from '@entities/planner';
import type { DayBalance } from '@shared/ui';
import { CollapsibleSection, CategoryIcon, categoryColorMap, Slider, Toggle } from '@shared/ui';
import { CalendarWithReminders } from '../CalendarWithReminders';
import { ExpenseList } from '../ExpenseList';
import { IncomeExpensesBlock } from '../IncomeExpensesBlock';
import { PlanFormModal } from '../PlanFormModal';
import styles from './PlannerTab.module.scss';

const PLAN_COLORS = ['#8b5cf6', '#ec4899', '#06b6d4', '#f59e0b', '#10b981', '#3b82f6'];

interface PlannerTabProps {
  roomId?: string;
  hasRoomSelector?: boolean;
}

export const PlannerTab: React.FC<PlannerTabProps> = ({ roomId, hasRoomSelector }) => {
  const { t } = useTranslation();
  const [currency] = useCurrencyPreference();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [showPlanModal, setShowPlanModal] = useState(false);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const today = new Date().getDate();

  const { plans, addPlan, updatePlan, removePlan, setPlanSavingsPercent, completePlan } = usePlans(roomId);
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null);
  type PlanFilter = 'all' | 'active' | 'completed';
  const [planFilter, setPlanFilter] = useState<PlanFilter>('all');

  const activePlans = useMemo(() => plans.filter((p) => !p.completedAt), [plans]);
  const activeCount = activePlans.length;
  const getSavingsPercent = (plan: Plan) =>
    plan.savingsPercent ?? (activeCount > 0 ? Math.round(100 / activeCount) : 100);

  const firstDay = new Date(year, month, 1).toISOString().slice(0, 10);
  const lastDay = new Date(year, month + 1, 0).toISOString().slice(0, 10);
  const { data: monthTransactions = [] } = useQuery({
    queryKey: ['transactions', roomId, firstDay, lastDay],
    queryFn: async () => {
      const res = await financeAPI.transactions.list({ roomId, from: firstDay, to: lastDay });
      return res.data;
    },
  });

  const { data: totalSavingsData } = useQuery({
    queryKey: ['transactions', 'total-savings', roomId],
    queryFn: async () => {
      const res = await financeAPI.transactions.totalSavings({ roomId });
      return res.data;
    },
  });

  const dayBalance = useMemo((): DayBalance[] => {
    const byDay = new Map<number, { income: number; expense: number }>();
    let totalMonthIncome = 0;
    let totalMonthExpense = 0;
    for (const tx of monthTransactions) {
      const d = new Date(tx.date).getDate();
      const cur = byDay.get(d) ?? { income: 0, expense: 0 };
      const amount = Math.abs(getTransactionAmount(tx));
      if (tx.type === 'income') {
        cur.income += amount;
        totalMonthIncome += amount;
      } else {
        cur.expense += amount;
        totalMonthExpense += amount;
      }
      byDay.set(d, cur);
    }
    return Array.from(byDay.entries())
      .filter(([, v]) => v.income !== v.expense)
      .map(([day, v]) => {
        const direction = v.income > v.expense ? ('income' as const) : ('expense' as const);
        const dayAmount = direction === 'income' ? v.income : v.expense;
        const total = direction === 'income' ? totalMonthIncome : totalMonthExpense;
        const percent = total > 0 ? (dayAmount / total) * 100 : undefined;
        return {
          date: new Date(year, month, day),
          direction,
          percent,
        };
      });
  }, [monthTransactions, year, month]);

  const totalSavingsCumulative = totalSavingsData?.totalSavings ?? 0;
  const completedTotal = useMemo(
    () => plans.filter((p) => p.completedAt).reduce((s, p) => s + p.amount, 0),
    [plans]
  );
  const availableSavings = Math.max(0, totalSavingsCumulative - completedTotal);

  const filteredPlans = useMemo(() => {
    if (planFilter === 'active') return plans.filter((p) => !p.completedAt);
    if (planFilter === 'completed') return plans.filter((p) => p.completedAt);
    return plans;
  }, [plans, planFilter]);

  const planFilterOptions = [
    { value: 'all' as const, label: t('statistics.planner.filterAll', 'Все') },
    { value: 'active' as const, label: t('statistics.planner.filterActive', 'Активные') },
    { value: 'completed' as const, label: t('statistics.planner.filterCompleted', 'Завершённые') },
  ];

  const planDeadlineDates = useMemo(() => {
    return plans
      .filter((p) => p.deadline)
      .map((p) => {
        const d = new Date(p.deadline!);
        return { date: d, color: '#ef4444' };
      })
      .filter(({ date }) => date.getFullYear() === year && date.getMonth() === month);
  }, [plans, year, month]);

  const markedDatesWithColors = [...planDeadlineDates];

  const handleAddPlan = (name: string, amount: number, category?: string, deadline?: string) => {
    addPlan({ name, amount, category, deadline });
    setShowPlanModal(false);
  };

  const handleUpdatePlan = (name: string, amount: number, category?: string, deadline?: string) => {
    if (editingPlan) {
      updatePlan(editingPlan.id, { name, amount, category, deadline });
      setEditingPlan(null);
    }
    setShowPlanModal(false);
  };

  return (
    <div className={styles.planner}>
      <div className={`${styles.planner__calendar} ${hasRoomSelector ? styles['planner__calendar--withRoomSelector'] : ''}`}>
        <CalendarWithReminders
          roomId={roomId}
          currency={currency}
          additionalMarkedDates={markedDatesWithColors}
          dayBalance={dayBalance}
          viewDate={currentDate}
          onMonthChange={(y, m) => setCurrentDate(new Date(y, m, 1))}
          pinnable
          pinTopOffsetExtra={hasRoomSelector ? 40 : 0}
          plansWithDeadline={plans.filter((p) => p.deadline)}
        />
      </div>

      <CollapsibleSection id="incomeExpenses" title={t('home.finances', 'Финансы')} defaultExpanded>
        <IncomeExpensesBlock
          roomId={roomId}
          year={year}
          month={month}
        />
      </CollapsibleSection>

      <CollapsibleSection id="financeList" title={t('home.financeList', 'Список финансов')} defaultExpanded>
        <ExpenseList roomId={roomId} />
      </CollapsibleSection>

      <CollapsibleSection
        id="plans"
        title={t('statistics.planner.plans')}
        defaultExpanded
        headerAction={
          <button
            type="button"
            className={styles['planner__plans-add']}
            onClick={() => setShowPlanModal(true)}
          >
            <FiPlus size={20} />
            {t('common.add')}
          </button>
        }
      >
      <div className={styles['planner__plans']}>
        <div className={styles['planner__plans-tabs']}>
          <Toggle
            options={planFilterOptions}
            value={planFilter}
            onChange={(v) => setPlanFilter(v as PlanFilter)}
          />
        </div>
        <div className={styles['planner__plans-list']}>
          {filteredPlans.map((plan, idx) => {
            const isCompleted = !!plan.completedAt;
            const color = isCompleted
              ? '#10b981'
              : plan.category
                ? (categoryColorMap[plan.category] || PLAN_COLORS[idx % PLAN_COLORS.length])
                : PLAN_COLORS[idx % PLAN_COLORS.length];
            const savingsPercent = getSavingsPercent(plan);
            const currentForPlan = isCompleted ? plan.amount : (availableSavings * savingsPercent) / 100;
            const current = Math.min(currentForPlan, plan.amount);
            const remaining = Math.max(0, plan.amount - current);
            const progress = plan.amount > 0 ? (current / plan.amount) * 100 : 0;
            const isOverdue =
              !isCompleted &&
              plan.deadline &&
              new Date(plan.deadline).setHours(0, 0, 0, 0) < new Date().setHours(0, 0, 0, 0);

            return (
              <div
                key={plan.id}
                className={`${styles['planner__plan']} ${isCompleted ? styles['planner__plan--completed'] : ''} ${isOverdue ? styles['planner__plan--overdue'] : ''}`}
              >
                <div
                  className={styles['planner__plan-icon']}
                  style={{ backgroundColor: `${color}20` }}
                >
                  {plan.category ? (
                    <CategoryIcon category={plan.category} size={24} />
                  ) : (
                    <span style={{ color, fontWeight: 700, fontSize: 14 }}>?</span>
                  )}
                </div>
                <div className={styles['planner__plan-content']}>
                  <div className={styles['planner__plan-header']}>
                    <span className={styles['planner__plan-name']}>{plan.name}</span>
                    <div className={styles['planner__plan-actions']}>
                      {!isCompleted && progress >= 100 && (
                        <button
                          type="button"
                          className={styles['planner__plan-complete']}
                          onClick={() => completePlan(plan.id)}
                          title={t('statistics.planner.markCompleted', 'Отметить выполненным')}
                        >
                          <FiCheck size={16} />
                        </button>
                      )}
                      {!isCompleted && (
                        <button
                          type="button"
                          className={styles['planner__plan-edit']}
                          onClick={() => { setEditingPlan(plan); setShowPlanModal(true); }}
                          title={t('common.edit', 'Редактировать')}
                        >
                          <FiEdit2 size={16} />
                        </button>
                      )}
                      {isCompleted && (
                        <span className={styles['planner__plan-completedBadge']} title={t('statistics.planner.completed', 'Выполнен')}>
                          <FiCheck size={16} />
                        </span>
                      )}
                      <button
                        type="button"
                        className={styles['planner__plan-remove']}
                        onClick={() => removePlan(plan.id)}
                        title={t('common.delete')}
                      >
                        <FiTrash2 size={16} />
                      </button>
                    </div>
                  </div>
                  {plan.category && (
                    <div className={styles['planner__plan-category']}>
                      {getCategoryLabel(t, 'expense', plan.category)}
                    </div>
                  )}
                  <div className={styles['planner__plan-currentTarget']}>
                    {Math.round(current).toLocaleString()} {currencySymbols[currency]} / {plan.amount.toLocaleString()} {currencySymbols[currency]}
                  </div>
                  {!isCompleted && (
                    <Slider
                      className={styles['planner__plan-slider']}
                      label={t('statistics.planner.savingsPercent', '% сбережений')}
                      value={savingsPercent}
                      min={0}
                      max={100}
                      step={1}
                      valueSuffix="%"
                      debounceMs={4000}
                      onChange={(v) => setPlanSavingsPercent(plan.id, v)}
                    />
                  )}
                  {!isCompleted && (
                    <div className={styles['planner__plan-remaining']}>
                      {Math.round(remaining).toLocaleString()} {currencySymbols[currency]}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
      </CollapsibleSection>

      {showPlanModal && (
        <PlanFormModal
          initialPlan={editingPlan ?? undefined}
          title={editingPlan ? t('statistics.planner.editPlan', 'Редактировать план') : t('statistics.planner.addPlan')}
          onSave={editingPlan ? handleUpdatePlan : handleAddPlan}
          onClose={() => { setShowPlanModal(false); setEditingPlan(null); }}
        />
      )}
    </div>
  );
};
