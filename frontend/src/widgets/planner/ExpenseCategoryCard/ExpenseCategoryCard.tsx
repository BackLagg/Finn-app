import React from 'react';
import { FiChevronDown } from 'react-icons/fi';
import { motion } from 'framer-motion';
import { CategoryIcon, categoryColorMap } from '@shared/ui';
import { currencySymbols } from '@shared/lib/currency';
import type { Transaction } from '@shared/api/finance-api';
import { ExpenseTransactionItem } from '../ExpenseTransactionItem';
import styles from './ExpenseCategoryCard.module.scss';

interface ExpenseCategoryCardProps {
  category: string;
  total: number;
  transactions: Transaction[];
  isExpanded: boolean;
  onToggle: () => void;
  currency: string;
  onDelete: (txId: string) => void;
  onReceiptAttach: (txId: string) => void;
}

export const ExpenseCategoryCard: React.FC<ExpenseCategoryCardProps> = ({
  category,
  total,
  transactions,
  isExpanded,
  onToggle,
  currency,
  onDelete,
  onReceiptAttach,
}) => {
  const color = categoryColorMap[category] || '#848e9c';

  return (
    <div className={styles.accordion}>
      <button
        type="button"
        className={styles.header}
        onClick={onToggle}
      >
        <div
          className={styles.cardIcon}
          style={{ backgroundColor: `${color}20` }}
        >
          <CategoryIcon category={category} size={24} />
        </div>
        <div className={styles.cardInfo}>
          <span className={styles.cardCategory}>{category}</span>
          <span className={styles.cardAmount}>
            {total.toLocaleString()} {currencySymbols[currency as keyof typeof currencySymbols]}
          </span>
        </div>
        <FiChevronDown
          size={20}
          className={`${styles.chevron} ${isExpanded ? styles.chevronExpanded : ''}`}
        />
      </button>
      <motion.div
        className={styles.content}
        initial={false}
        animate={{ height: isExpanded ? 'auto' : 0 }}
        transition={{
          type: 'spring',
          damping: 28,
          stiffness: 320,
        }}
      >
        {isExpanded && (
          <motion.div
            className={styles.contentInner}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{
              duration: 0.15,
            }}
          >
            <ul className={styles.list}>
              {transactions.map((tx, i) => (
                <ExpenseTransactionItem
                  key={tx._id}
                  transaction={tx}
                  categoryColor={color}
                  currency={currency}
                  onReceiptAttach={onReceiptAttach}
                  onDelete={onDelete}
                  index={i}
                />
              ))}
            </ul>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
};
