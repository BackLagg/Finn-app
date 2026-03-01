import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { financeAPI } from '@shared/api';
import { FiChevronLeft, FiChevronRight, FiPlus } from 'react-icons/fi';
import styles from './BudgetSection.module.scss';

interface BudgetSectionProps {
  roomId?: string;
}

interface BudgetCategory {
  category: string;
  budgetAmount: number;
  spentAmount: number;
  color: string;
}

const BudgetSection: React.FC<BudgetSectionProps> = ({ roomId }) => {
  const { t } = useTranslation();
  const [currentDate, setCurrentDate] = useState(new Date());
  
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  
  const firstDay = new Date(year, month, 1).toISOString().slice(0, 10);
  const lastDay = new Date(year, month + 1, 0).toISOString().slice(0, 10);

  const { data: stats = [] } = useQuery({
    queryKey: ['transaction-stats', roomId, firstDay, lastDay],
    queryFn: async () => {
      const res = await financeAPI.transactions.stats({ roomId, from: firstDay, to: lastDay });
      return res.data;
    },
  });

  const { data: budget } = useQuery({
    queryKey: ['budget', roomId],
    queryFn: async () => {
      const res = await financeAPI.budget.get(roomId);
      return res.data;
    },
  });

  const budgetCategories: BudgetCategory[] = [
    { category: t('home.budget.allExpenses'), budgetAmount: 900, spentAmount: stats.reduce((s, st) => s + st.total, 0), color: 'var(--color-success)' },
    { category: 'Образование', budgetAmount: 175, spentAmount: stats.find(s => s.category === 'Образование')?.total || 0, color: 'var(--color-accent)' },
  ];

  const monthName = currentDate.toLocaleDateString('ru', { month: 'long', year: 'numeric' });

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const totalBudget = budgetCategories.reduce((s, b) => s + b.budgetAmount, 0);
  const totalSpent = budgetCategories.reduce((s, b) => s + b.spentAmount, 0);
  const remaining = totalBudget - totalSpent;

  return (
    <section className={styles['budget-section']}>
      <div className={styles['budget-section__header']}>
        <h2 className={styles['budget-section__title']}>{t('home.budget.title')}</h2>
        <button className={styles['budget-section__add-btn']}>
          <FiPlus />
        </button>
      </div>

      <div className={styles['budget-section__month-nav']}>
        <button className={styles['budget-section__nav-btn']} onClick={handlePrevMonth}>
          <FiChevronLeft />
        </button>
        <span className={styles['budget-section__month-name']}>{monthName}</span>
        <button className={styles['budget-section__nav-btn']} onClick={handleNextMonth}>
          <FiChevronRight />
        </button>
      </div>

      <div className={styles['budget-section__summary']}>
        <div className={styles['budget-section__summary-label']}>{t('home.budget.monthly')}</div>
        <div className={styles['budget-section__summary-date']}>{t('home.budget.monthlyDate')}</div>
        <div className={styles['budget-section__summary-amounts']}>
          <span className={styles['budget-section__summary-spent']}>{totalSpent} $</span>
          <span className={styles['budget-section__summary-total']}> / {totalBudget} $</span>
        </div>
        <div className={styles['budget-section__summary-remaining']}>{remaining} $</div>
      </div>

      <div className={styles['budget-section__overall']}>
        <div className={styles['budget-section__overall-header']}>
          <span className={styles['budget-section__overall-title']}>{t('home.budget.overall')}</span>
          <span className={styles['budget-section__overall-subtitle']}>{t('home.budget.allCategories')}</span>
        </div>
        <div className={styles['budget-section__overall-amounts']}>
          <span className={styles['budget-section__overall-spent']}>{totalSpent} $</span>
          <span className={styles['budget-section__overall-total']}> / {totalBudget} $</span>
        </div>
        <div className={styles['budget-section__progress-bar']}>
          <div 
            className={styles['budget-section__progress-fill']} 
            style={{ width: `${Math.min(100, (totalSpent / totalBudget) * 100)}%` }}
          />
        </div>
        <div className={styles['budget-section__overall-remaining']}>{remaining} $</div>
      </div>

      <div className={styles['budget-section__categories']}>
        {budgetCategories.map((cat) => {
          const percentage = cat.budgetAmount > 0 ? (cat.spentAmount / cat.budgetAmount) * 100 : 0;
          const remaining = cat.budgetAmount - cat.spentAmount;

          return (
            <div key={cat.category} className={styles['budget-section__category']}>
              <div className={styles['budget-section__category-header']}>
                <span className={styles['budget-section__category-name']}>{cat.category}</span>
                <div className={styles['budget-section__category-amounts']}>
                  <span className={styles['budget-section__category-spent']}>{cat.spentAmount} $</span>
                  <span className={styles['budget-section__category-total']}> / {cat.budgetAmount} $</span>
                </div>
              </div>
              <div className={styles['budget-section__progress-bar']}>
                <div 
                  className={styles['budget-section__progress-fill']} 
                  style={{ 
                    width: `${Math.min(100, percentage)}%`,
                    backgroundColor: cat.color
                  }}
                />
              </div>
              <div className={styles['budget-section__category-remaining']}>{remaining} $</div>
            </div>
          );
        })}
      </div>
    </section>
  );
};

export default BudgetSection;
