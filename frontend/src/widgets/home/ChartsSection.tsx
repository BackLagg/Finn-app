import React, { useState } from 'react';
import { ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid, LineChart, Line, Legend } from 'recharts';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { financeAPI } from '@shared/api';
import styles from './ChartsSection.module.scss';

interface ChartsSectionProps {
  roomId?: string;
}

function getTxAmount(tx: { amount: number | { USD?: number; EUR?: number; RUB?: number; BYN?: number } }): number {
  let n: number;
  if (typeof tx.amount === 'number') n = tx.amount;
  else {
    const a = tx.amount as { USD?: number; EUR?: number; RUB?: number; BYN?: number };
    n = a.USD || a.EUR || a.RUB || a.BYN || 0;
  }
  return Math.abs(n);
}

/** Формат осей и подписей: 60k, 100k, 1kk (миллион) */
function formatShortNumber(n: number): string {
  if (n >= 1_000_000) {
    const m = n / 1_000_000;
    return m % 1 === 0 ? `${m}kk` : `${m.toFixed(1)}kk`;
  }
  if (n >= 1000) {
    const k = n / 1000;
    return k % 1 === 0 ? `${k}k` : `${k.toFixed(1)}k`;
  }
  return String(Math.round(n));
}

const ChartsSection: React.FC<ChartsSectionProps> = ({ roomId }) => {
  const { t } = useTranslation();
  const [currentDate] = useState(new Date());

  const now = new Date();
  const from = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
  const to = now.toISOString().slice(0, 10);

  const { data: transactions = [] } = useQuery({
    queryKey: ['transactions', roomId, from, to],
    queryFn: async () => {
      const res = await financeAPI.transactions.list({ roomId, from, to });
      return res.data;
    },
  });

  const monthShort = new Date(now.getFullYear(), now.getMonth(), 1).toLocaleString(undefined, { month: 'short' });
  const dailyData = Array.from({ length: 31 }, (_, i) => {
    const day = i + 1;
    const dayTransactions = transactions.filter(tx => {
      const txDay = new Date(tx.date).getDate();
      return txDay === day && tx.type === 'expense';
    });
    const total = dayTransactions.reduce((s, tx) => s + getTxAmount(tx), 0);
    return { day, amount: total, label: `${day} ${monthShort}` };
  });

  const monthlyIncomeExpenseData = Array.from({ length: 31 }, (_, i) => {
    const day = i + 1;
    const dayIncome = transactions.filter(tx => {
      const txDay = new Date(tx.date).getDate();
      return txDay === day && tx.type === 'income';
    }).reduce((s, tx) => s + getTxAmount(tx), 0);

    const dayExpense = transactions.filter(tx => {
      const txDay = new Date(tx.date).getDate();
      return txDay === day && tx.type === 'expense';
    }).reduce((s, tx) => s + getTxAmount(tx), 0);

    return { day, income: dayIncome, expense: dayExpense, label: `${day} ${monthShort}` };
  });

  return (
    <section className={styles['charts-section']}>
      <h2 className={styles['charts-section__title']}>{t('home.charts.title')}</h2>
      
      <div className={styles['charts-section__grid']}>
        <div className={styles['charts-section__card']}>
          <h3 className={styles['charts-section__card-title']}>{t('home.charts.dailyExpenses')}</h3>
          <div className={styles['charts-section__wrapper']}>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={dailyData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                <XAxis
                  dataKey="day"
                  tickFormatter={(_, i) => (i === 0 || i === 30 ? dailyData[i]?.label ?? '' : '')}
                  stroke="var(--color-text-tertiary)"
                  tick={{ fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  stroke="var(--color-text-tertiary)"
                  tick={{ fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  width={40}
                  tickFormatter={formatShortNumber}
                />
                <Tooltip
                  contentStyle={{
                    background: 'var(--color-surface)',
                    border: '1px solid var(--color-border)',
                    borderRadius: 12,
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                  }}
                  labelFormatter={(_, payload) => payload?.[0]?.payload?.label ?? ''}
                  formatter={(value: number) => formatShortNumber(value)}
                />
                <Bar dataKey="amount" fill="var(--color-success)" radius={[8, 8, 0, 0]} maxBarSize={24} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className={styles['charts-section__card']}>
          <h3 className={styles['charts-section__card-title']}>{t('home.charts.incomeVsExpense')}</h3>
          <div className={styles['charts-section__wrapper']}>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={monthlyIncomeExpenseData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                <XAxis
                  dataKey="day"
                  tickFormatter={(_, i) => (i === 0 || i === 30 ? monthlyIncomeExpenseData[i]?.label ?? '' : '')}
                  stroke="var(--color-text-tertiary)"
                  tick={{ fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  stroke="var(--color-text-tertiary)"
                  tick={{ fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  width={40}
                  tickFormatter={formatShortNumber}
                />
                <Tooltip
                  contentStyle={{
                    background: 'var(--color-surface)',
                    border: '1px solid var(--color-border)',
                    borderRadius: 12,
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                  }}
                  labelFormatter={(_, payload) => payload?.[0]?.payload?.label ?? ''}
                  formatter={(value: number) => formatShortNumber(value)}
                />
                <Line
                  type="monotone"
                  dataKey="income"
                  stroke="var(--color-success)"
                  strokeWidth={2}
                  dot={false}
                  name={t('common.income')}
                />
                <Line
                  type="monotone"
                  dataKey="expense"
                  stroke="var(--color-danger)"
                  strokeWidth={2}
                  dot={false}
                  name={t('common.expense')}
                />
                <Legend wrapperStyle={{ paddingTop: 12 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ChartsSection;
