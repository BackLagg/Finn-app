import React, { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { FiPlus, FiTrash2 } from 'react-icons/fi';
import { financeAPI } from '@shared/api';
import { getTransactionAmount } from '@shared/lib/transaction';
import { usePlans, useIncomePayments } from '@features/planner';
import { useCurrencyPreference } from '@shared/lib/use-currency-preference';
import { currencySymbols } from '@shared/lib/currency';
import type { DayBalance } from '@shared/ui';
import { CollapsibleSection } from '@shared/ui';
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

  const { plans, addPlan, removePlan } = usePlans(year, month);
  const { payments, addPayment, removePayment, totalIncome } = useIncomePayments(year, month);

  const firstDay = new Date(year, month, 1).toISOString().slice(0, 10);
  const lastDay = new Date(year, month + 1, 0).toISOString().slice(0, 10);
  const { data: monthTransactions = [] } = useQuery({
    queryKey: ['transactions', roomId, firstDay, lastDay],
    queryFn: async () => {
      const res = await financeAPI.transactions.list({ roomId, from: firstDay, to: lastDay });
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

  const markedDatesWithColors = plans.map((p, i) => ({
    date: new Date(year, month, p.dayOfMonth),
    color: PLAN_COLORS[i % PLAN_COLORS.length],
  }));

  const futurePlans = plans.filter((p) => p.dayOfMonth >= today);
  const plansTotal = futurePlans.reduce((s, p) => s + p.amount, 0);
  const available = Math.max(0, totalIncome - plansTotal);

  const handleAddPlan = (name: string, amount: number, dayOfMonth: number, savingFor?: string) => {
    addPlan({ name, amount, dayOfMonth: Math.min(dayOfMonth, 31), savingFor });
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
        <div className={styles['planner__plans-list']}>
          {plans
            .sort((a, b) => a.dayOfMonth - b.dayOfMonth)
            .map((plan, idx) => {
              const color = PLAN_COLORS[idx % PLAN_COLORS.length];
              const isPast = plan.dayOfMonth < today;
              const allocated =
                available > 0 && plansTotal > 0
                  ? Math.round((plan.amount / plansTotal) * available)
                  : 0;
              const progress = plan.amount > 0 ? Math.min(100, (allocated / plan.amount) * 100) : 0;

              return (
                <div key={plan.id} className={styles['planner__plan']}>
                  <div
                    className={styles['planner__plan-icon']}
                    style={{ backgroundColor: `${color}25` }}
                  >
                    <span style={{ color, fontWeight: 700 }}>{plan.dayOfMonth}</span>
                  </div>
                  <div className={styles['planner__plan-content']}>
                    <div className={styles['planner__plan-header']}>
                      <span className={styles['planner__plan-name']}>{plan.name}</span>
                      <span className={styles['planner__plan-amount']}>
                        {plan.amount.toLocaleString()} {currencySymbols[currency]}
                      </span>
                    </div>
                    {plan.savingFor && (
                      <div className={styles['planner__plan-saving']}>{plan.savingFor}</div>
                    )}
                    <div className={styles['planner__plan-progress']}>
                      <div
                        className={styles['planner__plan-progressFill']}
                        style={{ width: `${progress}%`, backgroundColor: color }}
                      />
                    </div>
                    {!isPast && (
                      <div className={styles['planner__plan-allocated']}>
                        {allocated.toLocaleString()} / {plan.amount.toLocaleString()} {currencySymbols[currency]}
                      </div>
                    )}
                  </div>
                  <button
                    type="button"
                    className={styles['planner__plan-remove']}
                    onClick={() => removePlan(plan.id)}
                    title={t('common.delete')}
                  >
                    <FiTrash2 size={16} />
                  </button>
                </div>
              );
            })}
        </div>
      </div>
      </CollapsibleSection>

      {showPlanModal && (
        <PlanFormModal
          onSave={handleAddPlan}
          onClose={() => setShowPlanModal(false)}
          maxDay={new Date(year, month + 1, 0).getDate()}
        />
      )}
    </div>
  );
};
