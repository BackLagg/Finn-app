import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { financeAPI } from '@shared/api';
import { FiChevronLeft, FiChevronRight, FiEdit2 } from 'react-icons/fi';
import styles from './MonthlyBalance.module.scss';

interface MonthlyBalanceProps {
  roomId?: string;
}

const MonthlyBalance: React.FC<MonthlyBalanceProps> = ({ roomId }) => {
  const { t } = useTranslation();
  const [currentDate, setCurrentDate] = useState(new Date());
  
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  
  const firstDay = new Date(year, month, 1).toISOString().slice(0, 10);
  const lastDay = new Date(year, month + 1, 0).toISOString().slice(0, 10);

  const { data: transactions = [] } = useQuery({
    queryKey: ['transactions', roomId, firstDay, lastDay],
    queryFn: async () => {
      const res = await financeAPI.transactions.list({ roomId, from: firstDay, to: lastDay });
      return res.data;
    },
  });

  const { data: stats = [] } = useQuery({
    queryKey: ['transaction-stats', roomId, firstDay, lastDay],
    queryFn: async () => {
      const res = await financeAPI.transactions.stats({ roomId, from: firstDay, to: lastDay });
      return res.data;
    },
  });

  const income = transactions.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const expenses = transactions.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  const balance = income - expenses;

  const monthName = currentDate.toLocaleDateString('ru', { month: 'long', year: 'numeric' });

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  return (
    <section className={styles['monthly-balance']}>
      <div className={styles['monthly-balance__header']}>
        <h2 className={styles['monthly-balance__title']}>{t('home.monthlyBalance.title')}</h2>
        <button className={styles['monthly-balance__edit-btn']}>
          <FiEdit2 />
        </button>
      </div>

      <div className={styles['monthly-balance__total']}>
        <div className={styles['monthly-balance__total-label']}>{t('home.monthlyBalance.totalBalance')}</div>
        <div className={styles['monthly-balance__total-amount']}>{balance.toLocaleString()} $</div>
      </div>

      <div className={styles['monthly-balance__month-nav']}>
        <button className={styles['monthly-balance__nav-btn']} onClick={handlePrevMonth}>
          <FiChevronLeft />
        </button>
        <span className={styles['monthly-balance__month-name']}>{monthName}</span>
        <button className={styles['monthly-balance__nav-btn']} onClick={handleNextMonth}>
          <FiChevronRight />
        </button>
      </div>

      <div className={styles['monthly-balance__summary']}>
        <div className={styles['monthly-balance__summary-card']}>
          <div className={styles['monthly-balance__summary-label']}>{t('home.monthlyBalance.expenses')}</div>
          <div className={`${styles['monthly-balance__summary-amount']} ${styles['monthly-balance__summary-amount--expense']}`}>
            {expenses.toLocaleString()} $
          </div>
        </div>
        <div className={styles['monthly-balance__summary-card']}>
          <div className={styles['monthly-balance__summary-label']}>{t('home.monthlyBalance.income')}</div>
          <div className={`${styles['monthly-balance__summary-amount']} ${styles['monthly-balance__summary-amount--income']}`}>
            {income.toLocaleString()} $
          </div>
        </div>
      </div>
    </section>
  );
};

export default MonthlyBalance;
