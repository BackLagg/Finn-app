import React from 'react';
import { useTranslation } from 'react-i18next';
import { useTransactions } from '@features/transactions/use-transactions';
import styles from './ExpenseList.module.scss';

interface ExpenseListProps {
  roomId?: string;
}

const ExpenseList: React.FC<ExpenseListProps> = ({ roomId }) => {
  const { t } = useTranslation();
  const { transactions } = useTransactions(roomId);

  return (
    <section className={styles['expense-list']}>
      <h2 className={styles['expense-list__title']}>{t('home.expenseList')}</h2>
      <ul className={styles['expense-list__items']}>
        {transactions.slice(0, 20).map((tx) => (
          <li key={tx._id} className={styles['expense-list__item']}>
            <span className={styles['expense-list__item-desc']}>
              {tx.category} {tx.description ? `– ${tx.description}` : ''}
            </span>
            <span className={`${styles['expense-list__item-amount']} ${tx.type === 'expense' ? styles['expense-list__item-amount--expense'] : styles['expense-list__item-amount--income']}`}>
              {tx.type === 'expense' ? '−' : '+'}{tx.amount.toLocaleString()}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
};

export default ExpenseList;
