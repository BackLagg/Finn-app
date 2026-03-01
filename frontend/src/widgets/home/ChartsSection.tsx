import React, { useState } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid, LineChart, Line, Legend } from 'recharts';
import { useTranslation } from 'react-i18next';
import { useTransactionStats } from '@features/transactions/use-transaction-stats';
import { useQuery } from '@tanstack/react-query';
import { financeAPI } from '@shared/api';
import styles from './ChartsSection.module.scss';

const COLORS = ['#8b5cf6', '#ec4899', '#06b6d4', '#f59e0b', '#10b981', '#3b82f6', '#f97316', '#84cc16'];

interface ChartsSectionProps {
  roomId?: string;
}

const ChartsSection: React.FC<ChartsSectionProps> = ({ roomId }) => {
  const { t } = useTranslation();
  const [currentDate] = useState(new Date());
  
  const now = new Date();
  const from = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
  const to = now.toISOString().slice(0, 10);
  const { data: stats } = useTransactionStats(roomId, from, to);
  
  const { data: transactions = [] } = useQuery({
    queryKey: ['transactions', roomId, from, to],
    queryFn: async () => {
      const res = await financeAPI.transactions.list({ roomId, from, to });
      return res.data;
    },
  });

  const pieData = (stats ?? []).map((s, i) => ({
    name: s.category,
    value: s.total,
    fill: COLORS[i % COLORS.length],
  }));

  const dailyData = Array.from({ length: 31 }, (_, i) => {
    const day = i + 1;
    const dayTransactions = transactions.filter(t => {
      const txDay = new Date(t.date).getDate();
      return txDay === day && t.type === 'expense';
    });
    const total = dayTransactions.reduce((s, t) => s + t.amount, 0);
    return { day, amount: total };
  });

  const monthlyIncomeExpenseData = Array.from({ length: 31 }, (_, i) => {
    const day = i + 1;
    const dayIncome = transactions.filter(t => {
      const txDay = new Date(t.date).getDate();
      return txDay === day && t.type === 'income';
    }).reduce((s, t) => s + t.amount, 0);
    
    const dayExpense = transactions.filter(t => {
      const txDay = new Date(t.date).getDate();
      return txDay === day && t.type === 'expense';
    }).reduce((s, t) => s + t.amount, 0);
    
    return { day, income: dayIncome, expense: dayExpense };
  });

  const categoryPercentages = (stats ?? []).map((s, i) => {
    const total = (stats ?? []).reduce((sum, st) => sum + st.total, 0);
    const percentage = total > 0 ? (s.total / total) * 100 : 0;
    return {
      category: s.category,
      percentage: percentage.toFixed(0),
      amount: s.total,
      color: COLORS[i % COLORS.length],
    };
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
          <h3 className={styles['charts-section__card-title']}>{t('home.charts.categoryBreakdown')}</h3>
          <div className={styles['charts-section__wrapper']}>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={pieData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                >
                  {pieData.map((entry) => (
                    <Cell key={entry.name} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    background: 'var(--color-surface)', 
                    border: '1px solid var(--color-border)',
                    borderRadius: 'var(--radius)'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className={styles['charts-section__legend']}>
            {categoryPercentages.map((item) => (
              <div key={item.category} className={styles['charts-section__legend-item']}>
                <div 
                  className={styles['charts-section__legend-color']}
                  style={{ backgroundColor: item.color }}
                />
                <span className={styles['charts-section__legend-text']}>
                  {item.category}
                </span>
                <span className={styles['charts-section__legend-percentage']}>
                  {item.percentage}%
                </span>
              </div>
            ))}
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
