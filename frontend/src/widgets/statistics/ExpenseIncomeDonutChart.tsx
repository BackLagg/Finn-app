import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { financeAPI } from '@shared/api';
import { useCurrencyPreference } from '@shared/lib/use-currency-preference';
import { currencySymbols } from '@shared/lib/currency';
import { CategoryDonutChart, CategoryDataItem, Toggle } from '@shared/ui';
import { useTransactionStats } from '@features/transactions/use-transaction-stats';
import { useIncomePayments } from '@features/planner';
import styles from './ExpenseIncomeDonutChart.module.scss';

interface ExpenseIncomeDonutChartProps {
  roomId?: string;
  year?: number;
  month?: number;
}

function getAmount(tx: { amount: number | { USD?: number; EUR?: number; RUB?: number; BYN?: number }; inputCurrency?: string }): number {
  if (typeof tx.amount === 'number') return tx.amount;
  const a = tx.amount as { USD?: number; EUR?: number; RUB?: number; BYN?: number };
  return a.USD || a.EUR || a.RUB || a.BYN || 0;
}

export const ExpenseIncomeDonutChart: React.FC<ExpenseIncomeDonutChartProps> = ({ roomId, year, month }) => {
  const { t } = useTranslation();
  const [currency] = useCurrencyPreference();
  const [activeTab, setActiveTab] = useState<'expense' | 'income'>('expense');

  const now = new Date();
  const y = year ?? now.getFullYear();
  const m = month ?? now.getMonth();
  const from = new Date(y, m, 1).toISOString().slice(0, 10);
  const to = new Date(y, m + 1, 0).toISOString().slice(0, 10);

  const { data: expenseStats = [] } = useTransactionStats(roomId, from, to);

  const { data: transactions = [] } = useQuery({
    queryKey: ['transactions', roomId, from, to],
    queryFn: async () => {
      const res = await financeAPI.transactions.list({ roomId, from, to });
      return res.data;
    },
  });

  const { payments } = useIncomePayments(y, m);

  const expenseData: CategoryDataItem[] = expenseStats.map((s) => ({
    category: s.category,
    value: s.total,
    type: 'expense',
  }));

  const incomeByCategory = transactions
    .filter((tx) => tx.type === 'income')
    .reduce<Record<string, number>>((acc, tx) => {
      const amt = getAmount(tx);
      acc[tx.category] = (acc[tx.category] || 0) + amt;
      return acc;
    }, {});

  payments.forEach((p) => {
    const cat = p.comment?.trim() || t('statistics.planner.incomePayments', 'Доходы');
    incomeByCategory[cat] = (incomeByCategory[cat] || 0) + p.amount;
  });

  const incomeData: CategoryDataItem[] = Object.entries(incomeByCategory).map(([category, value]) => ({
    category,
    value,
    type: 'income',
  }));

  const data = activeTab === 'expense' ? expenseData : incomeData;

  const toggleOptions = [
    { value: 'expense', label: t('common.expense') },
    { value: 'income', label: t('common.income') },
  ];

  return (
    <div className={styles.chart}>
      <div className={styles.chart__tabs}>
        <Toggle
          options={toggleOptions}
          value={activeTab}
          onChange={(v) => setActiveTab(v as 'expense' | 'income')}
        />
      </div>
      <CategoryDonutChart
        data={data}
        currencySymbol={currencySymbols[currency]}
        title={t('home.charts.categoryBreakdown')}
        showLegend
      />
    </div>
  );
};
