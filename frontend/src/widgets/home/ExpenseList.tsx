import React, { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { FiImage, FiX } from 'react-icons/fi';
import { useTransactions } from '@features/transactions/use-transactions';
import { CategoryIcon, categoryColorMap } from '@shared/ui';
import { fileAPI, getReceiptImageUrl } from '@shared/api';
import { toast } from 'react-toastify';
import type { Transaction } from '@shared/api';
import styles from './ExpenseList.module.scss';

function getAmount(tx: Transaction): number {
  if (typeof tx.amount === 'number') return tx.amount;
  const a = tx.amount as { USD?: number; EUR?: number; RUB?: number; BYN?: number };
  return a.USD ?? a.EUR ?? a.RUB ?? a.BYN ?? 0;
}

interface ExpenseListProps {
  roomId?: string;
}

const ExpenseList: React.FC<ExpenseListProps> = ({ roomId }) => {
  const { t } = useTranslation();
  const { transactions, update } = useTransactions(roomId);
  const [expandedReceiptId, setExpandedReceiptId] = useState<string | null>(null);
  const receiptInputRef = useRef<HTMLInputElement>(null);

  const handleAttachReceipt = (txId: string) => {
    receiptInputRef.current?.setAttribute('data-tx-id', txId);
    receiptInputRef.current?.click();
  };

  const handleReceiptFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const txId = receiptInputRef.current?.getAttribute('data-tx-id');
    const file = e.target.files?.[0];
    if (!txId || !file) {
      e.target.value = '';
      return;
    }
    try {
      const res = await fileAPI.uploadReceipt(file);
      if (res.data?.imageUrl) {
        update({ id: txId, data: { receiptImageUrl: res.data.imageUrl } });
        toast.success(t('common.save'));
      }
    } catch {
      toast.error(t('errors.generic'));
    }
    e.target.value = '';
    receiptInputRef.current?.removeAttribute('data-tx-id');
  };

  return (
    <section className={styles['expense-list']}>
      <h2 className={styles['expense-list__title']}>{t('home.expenseList')}</h2>
      <input
        ref={receiptInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleReceiptFileChange}
        className={styles['expense-list__file-input']}
      />
      <ul className={styles['expense-list__items']}>
        {transactions.slice(0, 20).map((tx) => {
          const color = categoryColorMap[tx.category] || '#848e9c';
          const hasReceipt = !!tx.receiptImageUrl;
          const isExpanded = expandedReceiptId === tx._id;

          return (
            <li key={tx._id} className={styles['expense-list__item']}>
              <div className={styles['expense-list__item-main']}>
                <div
                  className={styles['expense-list__item-icon']}
                  style={{ backgroundColor: `${color}20` }}
                >
                  <CategoryIcon category={tx.category} size={20} color={color} />
                </div>
                <div className={styles['expense-list__item-content']}>
                  <span className={styles['expense-list__item-category']}>{tx.category}</span>
                  <span className={styles['expense-list__item-desc']}>
                    {tx.description || ''}
                  </span>
                </div>
                <span
                  className={`${styles['expense-list__item-amount']} ${
                    tx.type === 'expense' ? styles['expense-list__item-amount--expense'] : styles['expense-list__item-amount--income']
                  }`}
                >
                  {tx.type === 'expense' ? '−' : '+'}
                  {getAmount(tx).toLocaleString()}
                </span>
              </div>
              <div className={styles['expense-list__item-receipt']}>
                {hasReceipt ? (
                  <div className={styles['expense-list__receipt-wrap']}>
                    <button
                      type="button"
                      className={styles['expense-list__receipt-thumb']}
                      onClick={() => setExpandedReceiptId(isExpanded ? null : tx._id)}
                    >
                      <img
                        src={getReceiptImageUrl(tx.receiptImageUrl)}
                        alt="Receipt"
                      />
                    </button>
                    <button
                      type="button"
                      className={styles['expense-list__receipt-replace']}
                      onClick={() => handleAttachReceipt(tx._id)}
                      title={t('common.edit')}
                    >
                      <FiImage size={14} />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    className={styles['expense-list__attach-btn']}
                    onClick={() => handleAttachReceipt(tx._id)}
                    title={t('home.attachReceipt')}
                  >
                    <FiImage size={16} />
                  </button>
                )}
              </div>
              {isExpanded && hasReceipt && (
                <div
                  className={styles['expense-list__receipt-fullscreen']}
                  onClick={() => setExpandedReceiptId(null)}
                >
                  <button
                    type="button"
                    className={styles['expense-list__receipt-close']}
                    onClick={() => setExpandedReceiptId(null)}
                  >
                    <FiX size={24} />
                  </button>
                  <img
                    src={getReceiptImageUrl(tx.receiptImageUrl)}
                    alt="Receipt"
                    onClick={(e) => e.stopPropagation()}
                  />
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
};

export default ExpenseList;
