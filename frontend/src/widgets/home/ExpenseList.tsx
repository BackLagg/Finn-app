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
    <section className={styles.expenseList}>
      <h2>{t('home.expenseList')}</h2>
      <ul>
        {transactions.slice(0, 20).map((tx) => (
          <li key={tx._id}>
            <span>{tx.category}</span>
            <span>{tx.type === 'expense' ? '-' : '+'}{tx.amount}</span>
          </li>
        ))}
      </ul>
    </section>
  );
};

export default ExpenseList;
