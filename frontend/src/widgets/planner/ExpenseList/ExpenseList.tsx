import React, { useMemo, useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { FiImage, FiX, FiTrendingUp, FiTrendingDown, FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import { useTransactions } from '@features/transactions/use-transactions';
import { CategoryIcon, Tooltip, categoryColorMap } from '@shared/ui';
import { fileAPI, getReceiptImageUrl } from '@shared/api';
import { useCurrencyPreference } from '@shared/lib/use-currency-preference';
import { currencySymbols } from '@shared/lib/currency';
import { getCategoryLabel } from '@shared/lib/category-labels';
import { toast } from 'react-toastify';
import type { Transaction } from '@shared/api/finance-api';
import styles from './ExpenseList.module.scss';

const PAGE_SIZE = 6;

function getAmount(tx: Transaction): number {
  if (typeof tx.amount === 'number') return tx.amount;
  const a = tx.amount as { USD?: number; EUR?: number; RUB?: number; BYN?: number };
  return a.USD || a.EUR || a.RUB || a.BYN || 0;
}

interface ExpenseListProps {
  roomId?: string;
}

const ExpenseList: React.FC<ExpenseListProps> = ({ roomId }) => {
  const { t } = useTranslation();
  const [currency] = useCurrencyPreference();
  const { transactions, update } = useTransactions(roomId);
  const symbol = currencySymbols[currency as keyof typeof currencySymbols] ?? currency;
  const [expandedReceiptId, setExpandedReceiptId] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const receiptInputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const balanceBarWrapRef = useRef<HTMLDivElement>(null);

  const totalPages = Math.max(1, Math.ceil(transactions.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const paginatedTransactions = useMemo(
    () =>
      transactions.slice(
        (currentPage - 1) * PAGE_SIZE,
        currentPage * PAGE_SIZE
      ),
    [transactions, currentPage]
  );

  const goPrev = () => setPage((p) => Math.max(1, p - 1));
  const goNext = () => setPage((p) => Math.min(totalPages, p + 1));

  const isFirstRender = useRef(true);
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    listRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [currentPage]);

  const { totalIncome, totalExpense, incomePercent, paymentsPercent, segments } = useMemo(() => {
    let income = 0;
    let expense = 0;
    const incomeByCategory = new Map<string, number>();
    const expenseByCategory = new Map<string, number>();
    for (const tx of transactions) {
      const a = Math.abs(getAmount(tx));
      if (!a) continue;
      const cat = tx.category || t('common.other', 'Другое');
      if (tx.type === 'income') {
        income += a;
        incomeByCategory.set(cat, (incomeByCategory.get(cat) || 0) + a);
      } else {
        expense += a;
        expenseByCategory.set(cat, (expenseByCategory.get(cat) || 0) + a);
      }
    }
    const total = income + expense;
    const segs: {
      key: string;
      type: 'income' | 'expense';
      category: string;
      amount: number;
      percent: number;
      color: string;
    }[] = [];
    if (total > 0) {
      const incomePalette = ['#4ade80', '#22c55e', '#16a34a', '#15803d', '#22c55e', '#4ade80', '#16a34a'];
      const expensePalette = ['#f97373', '#ef4444', '#dc2626', '#b91c1c', '#ef4444', '#f97373', '#dc2626'];

      let incomeIndex = 0;
      incomeByCategory.forEach((amount, category) => {
        const color = incomePalette[incomeIndex % incomePalette.length];
        incomeIndex += 1;
        segs.push({
          key: `income-${category}`,
          type: 'income',
          category,
          amount,
          percent: (amount / total) * 100,
          color,
        });
      });

      let expenseIndex = 0;
      expenseByCategory.forEach((amount, category) => {
        const color = expensePalette[expenseIndex % expensePalette.length];
        expenseIndex += 1;
        segs.push({
          key: `expense-${category}`,
          type: 'expense',
          category,
          amount,
          percent: (amount / total) * 100,
          color,
        });
      });
    }
    return {
      totalIncome: income,
      totalExpense: expense,
      incomePercent: total > 0 ? (income / total) * 100 : 0,
      paymentsPercent: total > 0 ? (expense / total) * 100 : 0,
      segments: segs,
    };
  }, [transactions, t]);

  const [hoveredSegment, setHoveredSegment] = useState<
    | {
        key: string;
        label: string;
        amount: number;
        percent: number;
        type: 'income' | 'expense';
        color: string;
        centerPercent: number;
        x: number;
        y: number;
      }
    | null
  >(null);

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

  const balanceTotal = totalIncome + totalExpense;

  return (
    <section className={styles['expense-list']}>
      {balanceTotal > 0 && (
        <div className={styles['expense-list__balance']}>
          <div className={styles['expense-list__balance-label']}>
            {t('home.scheduledPayments.monthlyBalance')}
          </div>
          <div
            className={styles['expense-list__balance-bar-wrap']}
            ref={balanceBarWrapRef}
          >
            <div className={styles['expense-list__balance-bar']}>
              {(() => {
                let offset = 0;
                return segments.map((segment) => {
                  const isIncome = segment.type === 'income';
                  const baseColor = segment.color;
                  const centerPercent = offset + segment.percent / 2;
                  const label =
                    getCategoryLabel(
                      t,
                      isIncome ? 'income' : 'expense',
                      segment.category
                    ) || segment.category;
                  const element = (
                    <div
                      key={segment.key}
                      className={`${styles['expense-list__balance-bar-segment']} ${
                        isIncome
                          ? styles['expense-list__balance-bar-segment--income']
                          : styles['expense-list__balance-bar-segment--expense']
                      }`}
                      style={{
                        width: `${segment.percent}%`,
                        backgroundColor: baseColor,
                      }}
                      onMouseEnter={() => {
                        const rect = balanceBarWrapRef.current?.getBoundingClientRect();
                        const x =
                          rect != null
                            ? rect.left + (centerPercent / 100) * rect.width
                            : 0;
                        const y = rect != null ? rect.top - 46 : 0;

                        setHoveredSegment({
                          key: segment.key,
                          label,
                          amount: segment.amount,
                          percent: segment.percent,
                          type: segment.type,
                          color: baseColor,
                          centerPercent,
                          x,
                          y,
                        });
                      }}
                      onMouseLeave={() =>
                        setHoveredSegment((prev) =>
                          prev?.key === segment.key ? null : prev
                        )
                      }
                    />
                  );
                  offset += segment.percent;
                  return element;
                });
              })()}
            </div>
            {hoveredSegment && (
              <Tooltip
                className={styles['expense-list__balance-tooltip']}
                style={{
                  left: `${hoveredSegment.x}px`,
                  top: `${hoveredSegment.y}px`,
                  borderColor: hoveredSegment.color,
                }}
              >
                <div
                  className={styles['expense-list__balance-tooltip-dot']}
                  style={{ backgroundColor: hoveredSegment.color }}
                />
                <div className={styles['expense-list__balance-tooltip-text']}>
                  <div className={styles['expense-list__balance-tooltip-title']}>
                    {hoveredSegment.label}
                  </div>
                  <div className={styles['expense-list__balance-tooltip-value']}>
                    {hoveredSegment.amount.toLocaleString()} {symbol} (
                    {Math.round(hoveredSegment.percent)}%)
                  </div>
                </div>
              </Tooltip>
            )}
          </div>
          <div className={styles['expense-list__balance-legend']}>
            <span className={styles['expense-list__balance-legend-income']}>
              <FiTrendingUp size={14} />
              {t('home.scheduledPayments.incomeShare')} {totalIncome.toLocaleString()} {symbol} ({Math.round(incomePercent)}%)
            </span>
            <span className={styles['expense-list__balance-legend-payments']}>
              <FiTrendingDown size={14} />
              {t('home.scheduledPayments.paymentsShare')} {totalExpense.toLocaleString()} {symbol} ({Math.round(paymentsPercent)}%)
            </span>
          </div>
        </div>
      )}
      <input
        ref={receiptInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleReceiptFileChange}
        className={styles['expense-list__file-input']}
      />
      <ul ref={listRef} className={styles['expense-list__items']}>
        {paginatedTransactions.map((tx) => {
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
                  {Math.abs(getAmount(tx)).toLocaleString()}
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
      {transactions.length > PAGE_SIZE && (
        <div className={styles['expense-list__pagination']}>
          <button
            type="button"
            className={styles['expense-list__pagination-btn']}
            onClick={goPrev}
            disabled={currentPage <= 1}
            aria-label={t('common.prev', 'Назад')}
          >
            <FiChevronLeft size={20} />
          </button>
          <span className={styles['expense-list__pagination-info']}>
            {currentPage} / {totalPages}
          </span>
          <button
            type="button"
            className={styles['expense-list__pagination-btn']}
            onClick={goNext}
            disabled={currentPage >= totalPages}
            aria-label={t('common.next', 'Вперёд')}
          >
            <FiChevronRight size={20} />
          </button>
        </div>
      )}
    </section>
  );
};

export default ExpenseList;
