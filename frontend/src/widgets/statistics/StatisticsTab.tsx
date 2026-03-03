import React from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { financeAPI } from '@shared/api';
import { CategoryIcon, categoryColorMap } from '@shared/ui';
import { getCategoryLabel } from '@shared/lib/category-labels';
import { useCurrencyPreference } from '@shared/lib/use-currency-preference';
import { currencySymbols } from '@shared/lib/currency';
import { useIncomePayments } from '@features/planner';
import { ChartsSection, CategoryExpenses } from '@widgets/home';
import { ExpenseIncomeDonutChart } from './ExpenseIncomeDonutChart';
import styles from './StatisticsTab.module.scss';

function getAmount(tx: { amount: number | { USD?: number; EUR?: number; RUB?: number; BYN?: number } }): number {
  if (typeof tx.amount === 'number') return tx.amount;
  const a = tx.amount as { USD?: number; EUR?: number; RUB?: number; BYN?: number };
  return a.USD ?? a.EUR ?? a.RUB ?? a.BYN ?? 0;
}

interface StatisticsTabProps {
  roomId?: string;
}

export const StatisticsTab: React.FC<StatisticsTabProps> = ({ roomId }) => {
  const { t } = useTranslation();
  const [currency] = useCurrencyPreference();
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth();
  const from = new Date(y, m, 1).toISOString().slice(0, 10);
  const to = new Date(y, m + 1, 0).toISOString().slice(0, 10);

  const { data: expenseStats = [] } = useQuery({
    queryKey: ['profileStats', roomId, from, to],
    queryFn: async () => {
      const res = await financeAPI.transactions.stats({ roomId, from, to });
      return res.data;
    },
  });

  const { data: transactions = [] } = useQuery({
    queryKey: ['transactions', roomId, from, to],
    queryFn: async () => {
      const res = await financeAPI.transactions.list({ roomId, from, to });
      return res.data;
    },
  });

  const { payments } = useIncomePayments(y, m);

  const mostExpensive = expenseStats.length
    ? expenseStats.reduce((a, b) => (a.total >= b.total ? a : b))
    : null;

  const incomeByCategory = transactions
    .filter((tx) => tx.type === 'income')
    .reduce<Record<string, number>>((acc, tx) => {
      const amt = getAmount(tx);
      const cat = tx.category || tx.source || t('categories.income.other', 'Другое');
      acc[cat] = (acc[cat] || 0) + amt;
      return acc;
    }, {});

  payments.forEach((p) => {
    const cat = p.comment?.trim() || t('statistics.planner.incomePayments', 'Доходы');
    incomeByCategory[cat] = (incomeByCategory[cat] || 0) + p.amount;
  });

  const topIncomeEntry = Object.entries(incomeByCategory).length
    ? Object.entries(incomeByCategory).reduce((a, b) => (a[1] >= b[1] ? a : b))
    : null;
  const mostProfitable = topIncomeEntry
    ? { category: topIncomeEntry[0], total: topIncomeEntry[1] }
    : null;

  const symbol = currencySymbols[currency];
  const monthName = new Date().toLocaleString(undefined, { month: 'long' });

  return (
    <div className={styles.statistics}>
      <div className={styles.statistics__summary}>
        <div className={styles.statistics__card}>
          <div className={styles.statistics__cardLabel}>
            {t('statistics.mostExpensiveCategory')} ({monthName})
          </div>
          {mostExpensive ? (
            <>
              <div className={styles.statistics__cardRow}>
                <span
                  className={styles.statistics__cardIcon}
                  style={{ backgroundColor: `${categoryColorMap[mostExpensive.category] || '#848e9c'}20` }}
                >
                  <CategoryIcon category={mostExpensive.category} size={24} />
                </span>
                <div className={styles.statistics__cardContent}>
                  <div className={styles.statistics__cardValue}>
                    {getCategoryLabel(t, 'expense', mostExpensive.category)}
                  </div>
                  <div className={styles.statistics__cardAmount}>
                    −{mostExpensive.total.toLocaleString()} {symbol}
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className={styles.statistics__cardValue}>{'—'}</div>
          )}
        </div>
        <div className={styles.statistics__card}>
          <div className={styles.statistics__cardLabel}>
            {t('statistics.mostProfitableCategory')} ({monthName})
          </div>
          {mostProfitable ? (
            <>
              <div className={styles.statistics__cardRow}>
                <span
                  className={styles.statistics__cardIcon}
                  style={{ backgroundColor: `${categoryColorMap[mostProfitable.category] || '#10b981'}20` }}
                >
                  <CategoryIcon category={mostProfitable.category} size={24} />
                </span>
                <div className={styles.statistics__cardContent}>
                  <div className={styles.statistics__cardValue}>
                    {getCategoryLabel(t, 'income', mostProfitable.category)}
                  </div>
                  <div className={styles.statistics__cardAmount}>
                    +{mostProfitable.total.toLocaleString()} {symbol}
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className={styles.statistics__cardValue}>{'—'}</div>
          )}
        </div>
      </div>

      <ExpenseIncomeDonutChart roomId={roomId} />
      <CategoryExpenses roomId={roomId} />
      <ChartsSection roomId={roomId} />
    </div>
  );
};
