import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { financeAPI } from '@shared/api';
import { useCurrencyPreference } from '@shared/lib/use-currency-preference';
import { currencySymbols } from '@shared/lib/currency';
import { getCategoryLabel } from '@shared/lib/category-labels';
import { CategoryDonutChart, CategoryDataItem, Toggle, categoryColorMap } from '@shared/ui';
import { useTransactionStats } from '@features/transactions/use-transaction-stats';
import { useIncomePayments } from '@features/planner';
import styles from './ExpenseIncomeDonutChart.module.scss';

interface ExpenseIncomeDonutChartProps {
  roomId?: string;
  year?: number;
  month?: number;
}

function getAmount(tx: { amount: number | { USD?: number; EUR?: number; RUB?: number; BYN?: number }; inputCurrency?: string }): number {
  let n: number;
  if (typeof tx.amount === 'number') n = tx.amount;
  else {
    const a = tx.amount as { USD?: number; EUR?: number; RUB?: number; BYN?: number };
    n = a.USD ?? a.EUR ?? a.RUB ?? a.BYN ?? 0;
  }
  return Math.abs(n);
}

function getMemberDisplayName(m: {
  displayName?: string | null;
  userId?: { name?: string; username?: string; telegramID?: string };
}): string {
  const display = (m as { displayName?: string | null }).displayName;
  if (display && typeof display === 'string') return display.trim();
  const u = m.userId;
  if (!u || typeof u !== 'object') return '';
  const name = (u as { name?: string }).name;
  const username = (u as { username?: string }).username;
  const telegramID = (u as { telegramID?: string }).telegramID;
  return (name && String(name).trim()) || (username && String(username).trim()) || (telegramID && String(telegramID).trim()) || '';
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

  const { data: room } = useQuery({
    queryKey: ['partnerRoom', roomId],
    queryFn: () => financeAPI.partnerRooms.get(roomId!),
    enabled: !!roomId,
  });

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
    value: Math.abs(s.total),
    type: 'expense',
  }));

  const incomeByCategory = transactions
    .filter((tx) => tx.type === 'income')
    .reduce<Record<string, number>>((acc, tx) => {
      const amt = getAmount(tx);
      const cat = tx.category || tx.source || t('categories.income.other', 'Другое');
      acc[cat] = (acc[cat] || 0) + amt;
      return acc;
    }, {});

  if (!roomId) {
    payments.forEach((p) => {
      const cat = p.comment?.trim() || t('statistics.planner.incomePayments', 'Доходы');
      incomeByCategory[cat] = (incomeByCategory[cat] || 0) + Math.abs(p.amount);
    });
  }

  const incomeData: CategoryDataItem[] = Object.entries(incomeByCategory).map(([category, value]) => ({
    category,
    value,
    type: 'income',
  }));

  const data = activeTab === 'expense' ? expenseData : incomeData;
  const total = data.reduce((s, d) => s + d.value, 0);
  const dataWithPct = data.map((d) => ({
    ...d,
    percentage: total > 0 ? (d.value / total) * 100 : 0,
  }));

  const getCategoryLabelFn = (category: string) =>
    getCategoryLabel(t, activeTab, category);

  const toggleOptions = [
    { value: 'expense', label: t('common.expense') },
    { value: 'income', label: t('common.income') },
  ];

  const memberNames = room?.members?.map(getMemberDisplayName).filter(Boolean) ?? [];

  return (
    <div className={styles.chart}>
      {roomId && room && (
        <div className={styles.chart__room}>
          <div className={styles.chart__roomName}>{room.name}</div>
          {memberNames.length > 0 && (
            <div className={styles.chart__members}>
              <span className={styles.chart__membersLabel}>{t('partners.members')}:</span>
              <span className={styles.chart__membersList}>{memberNames.join(', ')}</span>
            </div>
          )}
        </div>
      )}
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
        getCategoryLabel={getCategoryLabelFn}
        emptyMessage={data.length === 0 ? (activeTab === 'income' ? t('statistics.planner.noIncome') : t('statistics.planner.noExpenses')) : undefined}
      />
      {dataWithPct.length > 0 ? (
        <div className={styles.chart__barRow}>
          <div className={styles.chart__barRowTrack}>
            {dataWithPct.map((d, i) => (
              <div
                key={d.category}
                className={styles.chart__barRowSegment}
                style={{
                  width: `${d.percentage}%`,
                  backgroundColor: categoryColorMap[d.category] || (d.type === 'income' ? '#10b981' : ['#8b5cf6', '#ec4899', '#06b6d4', '#f59e0b', '#10b981', '#3b82f6', '#f97316', '#84cc16'][i % 8]),
                }}
                title={`${getCategoryLabelFn(d.category)}: ${d.percentage.toFixed(1)}%`}
              />
            ))}
          </div>
          <div className={styles.chart__barRowLegend}>
            {dataWithPct.map((d, i) => (
              <span key={d.category} className={styles.chart__barRowLegendItem}>
                <span
                  className={styles.chart__barRowLegendDot}
                  style={{
                    backgroundColor: categoryColorMap[d.category] || (d.type === 'income' ? '#10b981' : ['#8b5cf6', '#ec4899', '#06b6d4', '#f59e0b', '#10b981', '#3b82f6', '#f97316', '#84cc16'][i % 8]),
                  }}
                />
                {getCategoryLabelFn(d.category)} ({d.percentage.toFixed(0)}%)
              </span>
            ))}
          </div>
        </div>
      ) : data.length === 0 ? (
        <div className={styles.chart__empty}>
          {activeTab === 'income' ? t('statistics.planner.noIncome') : t('statistics.planner.noExpenses')}
        </div>
      ) : null}
    </div>
  );
};
