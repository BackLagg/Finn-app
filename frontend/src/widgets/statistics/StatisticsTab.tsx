import React from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { financeAPI } from '@shared/api';
import { ChartsSection, CategoryExpenses } from '@widgets/home';
import { ExpenseIncomeDonutChart } from './ExpenseIncomeDonutChart';
import styles from './StatisticsTab.module.scss';

interface StatisticsTabProps {
  roomId?: string;
}

export const StatisticsTab: React.FC<StatisticsTabProps> = ({ roomId }) => {
  const { t } = useTranslation();

  const { data: stats = [] } = useQuery({
    queryKey: ['profileStats', roomId],
    queryFn: async () => {
      const now = new Date();
      const from = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
      const to = now.toISOString().slice(0, 10);
      const res = await financeAPI.transactions.stats({ roomId, from, to });
      return res.data;
    },
  });

  const totalExpenses = stats.reduce((sum, s) => sum + s.total, 0);
  const topCategory = stats[0];

  return (
    <div className={styles.statistics}>
      <h2 className={styles.statistics__title}>{t('profile.statistics')}</h2>

      <div className={styles.statistics__summary}>
        <div className={styles.statistics__card}>
          <div className={styles.statistics__cardLabel}>
            {t('home.expenses')} ({new Date().toLocaleString(undefined, { month: 'long' })})
          </div>
          <div className={styles.statistics__cardValue}>{totalExpenses.toLocaleString()} $</div>
        </div>
        {topCategory && (
          <div className={styles.statistics__card}>
            <div className={styles.statistics__cardLabel}>{t('common.category')}</div>
            <div className={styles.statistics__cardValue}>{topCategory.category}</div>
          </div>
        )}
      </div>

      <ExpenseIncomeDonutChart roomId={roomId} />
      <CategoryExpenses roomId={roomId} />
      <ChartsSection roomId={roomId} />
    </div>
  );
};
