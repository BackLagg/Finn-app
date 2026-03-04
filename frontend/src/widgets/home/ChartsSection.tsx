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
    n = a.USD ?? a.EUR ?? a.RUB ?? a.BYN ?? 0;
  }
  return Math.abs(n);
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

  const dailyData = Array.from({ length: 31 }, (_, i) => {
    const day = i + 1;
    const dayTransactions = transactions.filter(tx => {
      const txDay = new Date(tx.date).getDate();
      return txDay === day && tx.type === 'expense';
    });
    const total = dayTransactions.reduce((s, tx) => s + getTxAmount(tx), 0);
    return { day, amount: total };
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

    return { day, income: dayIncome, expense: dayExpense };
  });

  return (
    <section className={styles['charts-section']}>
      <h2 className={styles['charts-section__title']}>{t('home.charts.title')}</h2>
      
      <div className={styles['charts-section__grid']}>
        <div className={styles['charts-section__card']}>
          <h3 className={styles['charts-section__card-title']}>{t('home.charts.dailyExpenses')}</h3>
          <div className={styles['charts-section__wrapper']}>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={dailyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis 
                  dataKey="day" 
                  stroke="var(--color-text-tertiary)"
                  tick={{ fontSize: 11 }}
                  interval="preserveStartEnd"
                />
                <YAxis 
                  stroke="var(--color-text-tertiary)"
                  tick={{ fontSize: 11 }}
                />
                <Tooltip 
                  contentStyle={{ 
                    background: 'var(--color-surface)', 
                    border: '1px solid var(--color-border)',
                    borderRadius: 'var(--radius)'
                  }}
                />
                <Bar dataKey="amount" fill="var(--color-success)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className={styles['charts-section__card']}>
          <h3 className={styles['charts-section__card-title']}>{t('home.charts.incomeVsExpense')}</h3>
          <div className={styles['charts-section__wrapper']}>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={monthlyIncomeExpenseData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis 
                  dataKey="day" 
                  stroke="var(--color-text-tertiary)"
                  tick={{ fontSize: 11 }}
                  interval="preserveStartEnd"
                />
                <YAxis 
                  stroke="var(--color-text-tertiary)"
                  tick={{ fontSize: 11 }}
                />
                <Tooltip 
                  contentStyle={{ 
                    background: 'var(--color-surface)', 
                    border: '1px solid var(--color-border)',
                    borderRadius: 'var(--radius)'
                  }}
                />
                <Line 
                  type="monotone" 
                  dataKey="income" 
                  stroke="var(--color-success)" 
                  strokeWidth={2}
                  name={t('common.income')}
                />
                <Line 
                  type="monotone" 
                  dataKey="expense" 
                  stroke="var(--color-danger)" 
                  strokeWidth={2}
                  name={t('common.expense')}
                />
                <Legend />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ChartsSection;
