import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { financeAPI } from '@shared/api';
import { CategoryIcon, categoryColorMap } from '@shared/ui';
import { getCategoryLabel } from '@shared/lib/category-labels';
import { useCurrencyPreference } from '@shared/lib/use-currency-preference';
import { currencySymbols } from '@shared/lib/currency';
import styles from './CategoryExpenses.module.scss';

interface CategoryExpensesProps {
  roomId?: string;
}

const CategoryExpenses: React.FC<CategoryExpensesProps> = ({ roomId }) => {
  const { t } = useTranslation();
  const [currency] = useCurrencyPreference();
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
  const total = sortedStats.reduce((s, stat) => s + Math.abs(stat.total), 0);
  const symbol = currencySymbols[currency];

  return (
    <section className={styles['category-expenses']}>
      <div className={styles['category-expenses__list']}>
        {sortedStats.map((stat) => {
          const value = Math.abs(stat.total);
          const pct = total > 0 ? (value / total) * 100 : 0;
          const color = categoryColorMap[stat.category] || '#848e9c';
          return (
            <div key={stat.category} className={styles['category-expenses__card']}>
              <div
                className={styles['category-expenses__icon']}
                style={{ backgroundColor: `${color}20` }}
              >
                <CategoryIcon category={stat.category} size={24} />
              </div>
              <div className={styles['category-expenses__content']}>
                <div className={styles['category-expenses__row']}>
                  <span className={styles['category-expenses__category']}>
                    {getCategoryLabel(t, 'expense', stat.category)}
                  </span>
                  <span className={styles['category-expenses__amount']}>
                    {value.toLocaleString()} {symbol}
                  </span>
                </div>
                <div className={styles['category-expenses__barTrack']}>
                  <div
                    className={styles['category-expenses__barFill']}
                    style={{ width: `${pct}%`, backgroundColor: color }}
                  >
                    <span className={styles['category-expenses__barDot']} style={{ backgroundColor: color }} />
                  </div>
                </div>
                <div className={styles['category-expenses__pct']}>{pct.toFixed(0)} %</div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};

export default CategoryExpenses;
