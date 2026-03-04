import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { financeAPI } from '@shared/api';
import { CategoryIcon, categoryColorMap } from '@shared/ui';
import styles from './CategoryExpenses.module.scss';

interface CategoryExpensesProps {
  roomId?: string;
}

const CategoryExpenses: React.FC<CategoryExpensesProps> = ({ roomId }) => {
  const { t } = useTranslation();
  const [currentDate] = useState(new Date());
  
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

  const sortedStats = [...stats].sort((a, b) => Math.abs(b.total) - Math.abs(a.total));

  return (
    <section className={styles['category-expenses']}>
      <div className={styles['category-expenses__grid']}>
        {sortedStats.map((stat) => (
          <div key={stat.category} className={styles['category-expenses__card']}>
            <div 
              className={styles['category-expenses__icon']}
              style={{ backgroundColor: `${categoryColorMap[stat.category] || '#848e9c'}20` }}
            >
              <CategoryIcon category={stat.category} size={24} />
            </div>
            <div className={styles['category-expenses__info']}>
              <div className={styles['category-expenses__category']}>{stat.category}</div>
              <div className={styles['category-expenses__amount']}>{Math.abs(stat.total)} $</div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default CategoryExpenses;
