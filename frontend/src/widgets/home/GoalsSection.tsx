import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { financeAPI } from '@shared/api';
import styles from './GoalsSection.module.scss';

interface GoalsSectionProps {
  roomId?: string;
}

const GoalsSection: React.FC<GoalsSectionProps> = ({ roomId }) => {
  const { t } = useTranslation();
  const { data: goals = [] } = useQuery({
    queryKey: ['goals', roomId],
    queryFn: async () => {
      const res = await financeAPI.goals.list(roomId);
      return res.data;
    },
  });

  return (
    <section className={styles.goalsSection}>
      <h2>{t('home.goals')}</h2>
      <div className={styles.goalsList}>
        {goals.map((g) => {
          const pct = g.targetAmount > 0 ? Math.min(100, (g.currentAmount / g.targetAmount) * 100) : 0;
          return (
            <div key={g._id} className={styles.goalCard}>
              <div className={styles.goalTitle}>{g.title}</div>
              <div className={styles.progressBar}>
                <div className={styles.progressFill} style={{ width: `${pct}%` }} />
              </div>
              <div className={styles.goalAmount}>
                {g.currentAmount} / {g.targetAmount} {g.currency}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};

export default GoalsSection;
