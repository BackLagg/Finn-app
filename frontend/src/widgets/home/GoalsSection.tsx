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
    <section className={styles['goals-section']}>
      <h2 className={styles['goals-section__title']}>{t('home.goals')}</h2>
      <div className={styles['goals-section__list']}>
        {goals.map((g) => {
          const pct = g.targetAmount > 0 ? Math.min(100, (g.currentAmount / g.targetAmount) * 100) : 0;
          return (
            <div key={g._id} className={styles['goals-section__card']}>
              <div className={styles['goals-section__card-title']}>{g.title}</div>
              <div className={styles['goals-section__progress']}>
                <div className={styles['goals-section__progress-bar']}>
                  <div className={styles['goals-section__progress-fill']} style={{ width: `${pct}%` }} />
                </div>
                <span className={styles['goals-section__progress-text']}>{pct.toFixed(0)}%</span>
              </div>
              <div className={styles['goals-section__amount']}>
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
