import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FiPlus, FiTrash2 } from 'react-icons/fi';
import { usePlans, useIncomePayments } from '@features/planner';
import { useCurrencyPreference } from '@shared/lib/use-currency-preference';
import { currencySymbols } from '@shared/lib/currency';
import { Toggle } from '@shared/ui';
import {
  CalendarWithReminders,
  MonthlyBalance,
  BudgetSection,
  ScheduledPayments,
  GoalsSection,
  ExpenseList,
} from '@widgets/home';
import { ExpenseIncomeDonutChart } from '@widgets/statistics';
import { IncomeExpensesBlock } from './IncomeExpensesBlock';
import { PlanFormModal } from './PlanFormModal';
import styles from './PlannerTab.module.scss';

const PLAN_COLORS = ['#8b5cf6', '#ec4899', '#06b6d4', '#f59e0b', '#10b981', '#3b82f6'];

function getProgressiveDistribution(available: number) {
  if (available <= 0) return { savings: 0, investments: 0, purchases: 100 };
  if (available < 30000) return { savings: 15, investments: 5, purchases: 80 };
  if (available < 70000) return { savings: 20, investments: 10, purchases: 70 };
  if (available < 120000) return { savings: 25, investments: 15, purchases: 60 };
  return { savings: 30, investments: 20, purchases: 50 };
}

interface PlannerTabProps {
  roomId?: string;
}

export const PlannerTab: React.FC<PlannerTabProps> = ({ roomId }) => {
  const { t } = useTranslation();
  const [currency] = useCurrencyPreference();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [savingsOnly, setSavingsOnly] = useState(false);
  const [showPlanModal, setShowPlanModal] = useState(false);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const today = new Date().getDate();

  const { plans, addPlan, removePlan } = usePlans(year, month);
  const { payments, addPayment, removePayment, totalIncome } = useIncomePayments(year, month);

  const futurePlans = plans.filter((p) => p.dayOfMonth >= today);
  const plansTotal = futurePlans.reduce((s, p) => s + p.amount, 0);
  const available = Math.max(0, totalIncome - plansTotal);

  const distribution = savingsOnly
    ? { savings: 100, investments: 0, purchases: 0 }
    : getProgressiveDistribution(available);

  const savingsAmount = Math.round((available * distribution.savings) / 100);
  const investmentsAmount = Math.round((available * distribution.investments) / 100);
  const purchasesAmount = Math.round((available * distribution.purchases) / 100);

  const markedDatesWithColors = plans.map((p, i) => ({
    date: new Date(year, month, p.dayOfMonth),
    color: PLAN_COLORS[i % PLAN_COLORS.length],
  }));

  const toggleOptions = [
    { value: 'full', label: t('statistics.planner.withInvestments') },
    { value: 'savings', label: t('statistics.planner.savingsOnly') },
  ];

  const handleAddPlan = (name: string, amount: number, dayOfMonth: number, savingFor?: string) => {
    addPlan({ name, amount, dayOfMonth: Math.min(dayOfMonth, 31), savingFor });
    setShowPlanModal(false);
  };

  return (
    <div className={styles.planner}>
      <div className={styles.planner__calendar}>
        <CalendarWithReminders
          roomId={roomId}
          currency={currency}
          additionalMarkedDates={markedDatesWithColors}
          viewDate={currentDate}
          onMonthChange={(y, m) => setCurrentDate(new Date(y, m, 1))}
          pinnable
        />
      </div>

      <IncomeExpensesBlock
        roomId={roomId}
        year={year}
        month={month}
      />

      <MonthlyBalance roomId={roomId} />

      <div className={styles.planner__summary}>
        <div className={styles['planner__summary-row']}>
          <span className={styles['planner__summary-label']}>{t('statistics.planner.plansTotal')}</span>
          <span className={styles['planner__summary-value']}>
            {plansTotal.toLocaleString()} {currencySymbols[currency]}
          </span>
        </div>
        <div className={styles['planner__summary-row']}>
          <span className={styles['planner__summary-label']}>{t('statistics.planner.available')}</span>
          <span className={`${styles['planner__summary-value']} ${styles['planner__summary-value--accent']}`}>
            {available.toLocaleString()} {currencySymbols[currency]}
          </span>
        </div>
      </div>

      <div className={styles.planner__toggle}>
        <Toggle
          options={toggleOptions}
          value={savingsOnly ? 'savings' : 'full'}
          onChange={(v) => setSavingsOnly(v === 'savings')}
        />
      </div>

      <div className={styles.planner__distribution}>
        <h3 className={styles['planner__distribution-title']}>{t('statistics.planner.distribution')}</h3>
        <div className={styles['planner__distribution-items']}>
          <div className={styles['planner__distribution-item']}>
            <span className={styles['planner__distribution-label']}>{t('home.savings')}</span>
            <span className={styles['planner__distribution-value']}>
              {savingsAmount.toLocaleString()} ({distribution.savings}%)
            </span>
          </div>
          {!savingsOnly && (
            <>
              <div className={styles['planner__distribution-item']}>
                <span className={styles['planner__distribution-label']}>{t('home.investments')}</span>
                <span className={styles['planner__distribution-value']}>
                  {investmentsAmount.toLocaleString()} ({distribution.investments}%)
                </span>
              </div>
              <div className={styles['planner__distribution-item']}>
                <span className={styles['planner__distribution-label']}>{t('home.purchases')}</span>
                <span className={styles['planner__distribution-value']}>
                  {purchasesAmount.toLocaleString()} ({distribution.purchases}%)
                </span>
              </div>
            </>
          )}
        </div>
      </div>

      <ExpenseIncomeDonutChart roomId={roomId} />
      <BudgetSection roomId={roomId} />
      <ScheduledPayments roomId={roomId} />
      <GoalsSection roomId={roomId} />
      <ExpenseList roomId={roomId} />

      <div className={styles['planner__plans']}>
        <div className={styles['planner__plans-header']}>
          <h3 className={styles['planner__plans-title']}>{t('statistics.planner.plans')}</h3>
          <button
            type="button"
            className={styles['planner__plans-add']}
            onClick={() => setShowPlanModal(true)}
          >
            <FiPlus size={20} />
            {t('common.add')}
          </button>
        </div>

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
