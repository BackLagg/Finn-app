import React from 'react';
import { useTranslation } from 'react-i18next';
import { FiChevronDown } from 'react-icons/fi';
import { motion } from 'framer-motion';
import { CategoryIcon, categoryColorMap } from '@shared/ui';
import { currencySymbols } from '@shared/lib/currency';
import { getCategoryLabel } from '@shared/lib/category-labels';
import type { Transaction } from '@shared/api/finance-api';
import { IncomeTransactionItem } from '../IncomeTransactionItem';
import styles from './IncomeCategoryCard.module.scss';

interface IncomeCategoryCardProps {
  category: string;
  total: number;
  transactions: Transaction[];
  isExpanded: boolean;
  onToggle: () => void;
  currency: string;
  onDelete: (txId: string) => void;
  onReceiptAttach: (txId: string) => void;
}

export const IncomeCategoryCard: React.FC<IncomeCategoryCardProps> = ({
  category,
  total,
  transactions,
  isExpanded,
  onToggle,
  currency,
  onDelete,
  onReceiptAttach,
}) => {
  const { t } = useTranslation();
  const color = categoryColorMap[category] || '#10b981';

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
          <CategoryIcon category={category} size={24} color={color} />
        </div>
        <div className={styles.cardInfo}>
          <span className={styles.cardCategory}>{getCategoryLabel(t, 'income', category)}</span>
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
            transition={{ duration: 0.15 }}
          >
            <ul className={styles.list}>
              {transactions.map((tx, i) => (
                <IncomeTransactionItem
                  key={tx._id}
                  transaction={tx}
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
