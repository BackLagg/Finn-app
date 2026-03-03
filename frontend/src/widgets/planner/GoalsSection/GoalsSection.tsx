import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { financeAPI } from '@shared/api';
import { CategoryIcon } from '@shared/ui';
import styles from './GoalsSection.module.scss';

interface GoalsSectionProps {
  roomId?: string;
}

const goalColors = [
  '#ec4899',
  '#8b5cf6',
  '#f59e0b',
  '#ef4444',
  '#3b82f6',
];

const GoalsSection: React.FC<GoalsSectionProps> = ({ roomId }) => {
  const { t } = useTranslation();
  const { data: goals = [] } = useQuery({
    queryKey: ['goals', roomId],
    queryFn: async () => {
      const res = await financeAPI.goals.list(roomId);
      return res.data;
    },
  });

  const totalSavings = goals.reduce((s, g) => s + g.currentAmount, 0);

  return (
    <section className={styles['goals-section']}>
      <div className={styles['goals-section__header']}>
        <h2 className={styles['goals-section__title']}>{t('home.goals.title')}</h2>
        <button className={styles['goals-section__add-btn']}>+</button>
      </div>

      <div className={styles['goals-section__tabs']}>
        <button className={`${styles['goals-section__tab']} ${styles['goals-section__tab--active']}`}>
          {t('home.goals.accounts')}
        </button>
        <button className={styles['goals-section__tab']}>
          {t('home.goals.debts')}
        </button>
        <button className={styles['goals-section__tab']}>
          {t('home.goals.all')}
        </button>
      </div>

      <div className={styles['goals-section__summary']}>
        <div className={styles['goals-section__summary-label']}>{t('home.goals.savings')}</div>
        <div className={styles['goals-section__summary-amount']}>{totalSavings} $</div>
      </div>

      <div className={styles['goals-section__list']}>
        {goals.map((g, idx) => {
          const pct = g.targetAmount > 0 ? Math.min(100, (g.currentAmount / g.targetAmount) * 100) : 0;
          const remaining = g.targetAmount - g.currentAmount;
          const color = goalColors[idx % goalColors.length];

          return (
            <div key={g._id} className={styles['goals-section__card']}>
              <div className={styles['goals-section__card-header']}>
                <div 
                  className={styles['goals-section__card-icon']}
                  style={{ backgroundColor: `${color}20` }}
                >
                  <CategoryIcon category={g.title} size={24} color={color} />
                </div>
                <div className={styles['goals-section__card-info']}>
                  <div className={styles['goals-section__card-title']}>{g.title}</div>
                  <div className={styles['goals-section__card-amounts']}>
                    <span className={styles['goals-section__card-current']}>{g.currentAmount} $</span>
                    <span className={styles['goals-section__card-target']}> / {g.targetAmount} $</span>
                  </div>
                </div>
                <div className={styles['goals-section__card-percentage']}>
                  <span style={{ color }}>{pct.toFixed(0)}%</span>
                </div>
              </div>
              <div className={styles['goals-section__progress']}>
                <div className={styles['goals-section__progress-bar']}>
                  <div 
                    className={styles['goals-section__progress-fill']} 
                    style={{ width: `${pct}%`, backgroundColor: color }} 
                  />
                </div>
              </div>
              <div className={styles['goals-section__card-remaining']}>
                <span className={styles['goals-section__card-remaining-label']}>{t('home.goals.remaining')}</span>
                <span className={styles['goals-section__card-remaining-amount']}>{remaining} $</span>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};

export default GoalsSection;
