import React from 'react';
import { useTranslation } from 'react-i18next';
import { FiImage, FiTrash2 } from 'react-icons/fi';
import { motion } from 'framer-motion';
import { CategoryIcon } from '@shared/ui';
import { getReceiptImageUrl } from '@shared/api/file-api';
import { getTransactionAmount } from '@shared/lib/transaction';
import type { Transaction } from '@shared/api/finance-api';
import { currencySymbols } from '@shared/lib/currency';
import styles from './ExpenseTransactionItem.module.scss';

interface ExpenseTransactionItemProps {
  transaction: Transaction;
  categoryColor: string;
  currency: string;
  onReceiptAttach: (txId: string) => void;
  onDelete: (txId: string) => void;
  index?: number;
}

const STAGGER_DELAY = 0.05;

export const ExpenseTransactionItem: React.FC<ExpenseTransactionItemProps> = ({
  transaction,
  categoryColor,
  currency,
  onReceiptAttach,
  onDelete,
  index = 0,
}) => {
  const { t } = useTranslation();
  const amount = getTransactionAmount(transaction);

  return (
    <motion.li
      className={styles.item}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', damping: 28, stiffness: 320, delay: index * STAGGER_DELAY }}
    >
      <div
        className={styles.itemIcon}
        style={{ backgroundColor: `${categoryColor}20` }}
      >
        <CategoryIcon category={transaction.category} size={20} color={categoryColor} />
      </div>
      <div className={styles.itemContent}>
        <span className={styles.itemAmount}>
          −{amount.toLocaleString()} {currencySymbols[currency as keyof typeof currencySymbols]}
        </span>
        <span className={styles.itemDesc}>{transaction.description || '-'}</span>
        <span className={styles.itemDate}>
          {new Date(transaction.date).toLocaleDateString(undefined, {
            day: 'numeric',
            month: 'short',
          })}
        </span>
      </div>
      <button
        type="button"
        className={styles.attachBtn}
        onClick={() => onReceiptAttach(transaction._id)}
        title={t('home.attachReceipt')}
      >
        {transaction.receiptImageUrl ? (
          <img
            src={getReceiptImageUrl(transaction.receiptImageUrl)}
            alt=""
            className={styles.receiptThumb}
          />
        ) : (
          <FiImage size={18} />
        )}
      </button>
      <button
        type="button"
        className={styles.removeBtn}
        onClick={() => onDelete(transaction._id)}
        title={t('common.delete')}
      >
        <FiTrash2 size={16} />
      </button>
    </motion.li>
  );
};
