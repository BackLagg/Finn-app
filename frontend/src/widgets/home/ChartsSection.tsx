import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { useTranslation } from 'react-i18next';
import { useTransactionStats } from '@features/transactions/use-transaction-stats';
import styles from './ChartsSection.module.scss';

const COLORS = ['#ff6b35', '#ff8c42', '#0ecb81', '#f6465d', '#3861fb', '#848e9c'];

interface ChartsSectionProps {
  roomId?: string;
}

const ChartsSection: React.FC<ChartsSectionProps> = ({ roomId }) => {
  const { t } = useTranslation();
  const now = new Date();
  const from = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
  const to = now.toISOString().slice(0, 10);
  const { data: stats } = useTransactionStats(roomId, from, to);
  const pieData = (stats ?? []).map((s, i) => ({
    name: s.category,
    value: s.total,
    fill: COLORS[i % COLORS.length],
  }));

  return (
    <section className={styles['charts-section']}>
      <h2 className={styles['charts-section__title']}>{t('home.charts')}</h2>
      <div className={styles['charts-section__wrapper']}>
        <ResponsiveContainer width="100%" height={240}>
          <PieChart>
            <Pie
              data={pieData}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={90}
              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
            >
              {pieData.map((entry) => (
                <Cell key={entry.name} fill={entry.fill} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
};

export default ChartsSection;
