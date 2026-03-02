import React, { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { FiPlus, FiTrash2, FiChevronLeft, FiChevronRight, FiImage } from 'react-icons/fi';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { financeAPI, fileAPI, getReceiptImageUrl } from '@shared/api';
import { useCurrencyPreference } from '@shared/lib/use-currency-preference';
import { currencySymbols } from '@shared/lib/currency';
import { CategoryIcon, categoryColorMap, Dropdown } from '@shared/ui';
import { Modal } from '@shared/ui';
import { useTransactionStats } from '@features/transactions/use-transaction-stats';
import type { Transaction } from '@shared/api';
import { toast } from 'react-toastify';
import styles from './IncomeExpensesBlock.module.scss';

const EXPENSE_CATEGORIES = [
  'Семья', 'Образование', 'Питомцы', 'Кино', 'Здоровье', 'Транспорт',
  'Одежда', 'Еда', 'Игры', 'Книги', 'Спорт', 'Кафе', 'Покупки',
];

function getAmount(tx: Transaction): number {
  if (typeof tx.amount === 'number') return tx.amount;
  const a = tx.amount as { USD?: number; EUR?: number; RUB?: number; BYN?: number };
  return a.USD || a.EUR || a.RUB || a.BYN || 0;
}

interface IncomeExpensesBlockProps {
  roomId?: string;
  year: number;
  month: number;
}

export const IncomeExpensesBlock: React.FC<IncomeExpensesBlockProps> = ({
  roomId,
  year,
  month,
}) => {
  const { t } = useTranslation();
  const [currency] = useCurrencyPreference();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'expense' | 'income'>('expense');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showAddExpense, setShowAddExpense] = useState(false);
  const receiptInputRef = useRef<HTMLInputElement>(null);

  const firstDay = new Date(year, month, 1).toISOString().slice(0, 10);
  const lastDay = new Date(year, month + 1, 0).toISOString().slice(0, 10);

  const { data: stats = [] } = useTransactionStats(roomId, firstDay, lastDay);
  const { data: transactions = [] } = useQuery({
    queryKey: ['transactions', roomId, firstDay, lastDay],
    queryFn: async () => {
      const res = await financeAPI.transactions.list({ roomId, from: firstDay, to: lastDay });
      return res.data;
    },
  });

  const totalExpenses = stats.reduce((s, st) => s + st.total, 0);
  const expenseTransactions = transactions.filter((tx) => tx.type === 'expense');
  const incomeTransactions = transactions.filter((tx) => tx.type === 'income');
  const totalIncome = incomeTransactions.reduce((s, tx) => s + getAmount(tx), 0);
  const categoryTransactions = selectedCategory
    ? expenseTransactions.filter((tx) => tx.category === selectedCategory)
    : [];

  const createIncomeMutation = useMutation({
    mutationFn: (data: { amount: number; source: string }) =>
      financeAPI.transactions.create({
        amount: data.amount,
        type: 'income',
        category: data.source || t('statistics.planner.incomePayments'),
        date: new Date(year, month, new Date().getDate()).toISOString().slice(0, 10),
        description: data.source || undefined,
        roomId,
        currency,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions', roomId] });
      queryClient.invalidateQueries({ queryKey: ['transaction-stats', roomId] });
    },
  });
  const deleteTransactionMutation = useMutation({
    mutationFn: (id: string) => financeAPI.transactions.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions', roomId] });
      queryClient.invalidateQueries({ queryKey: ['transaction-stats', roomId] });
    },
  });
  const [incomeAmount, setIncomeAmount] = useState('');
  const [incomeSource, setIncomeSource] = useState('');
  const handleAddIncome = () => {
    const num = Math.max(0, parseFloat(incomeAmount.replace(',', '.')) || 0);
    if (num > 0) {
      createIncomeMutation.mutate({ amount: num, source: incomeSource.trim() || t('statistics.planner.incomePayments') });
      setIncomeAmount('');
      setIncomeSource('');
    }
  };

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString(undefined, {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const closeCategoryDetail = () => setSelectedCategory(null);

  return (
    <div className={styles.block}>
      <div className={styles.block__summary}>
        <button
          type="button"
          className={`${styles.block__summaryCard} ${
            activeTab === 'expense' ? styles['block__summaryCard--active'] : ''
          }`}
          onClick={() => setActiveTab('expense')}
        >
          <span className={styles.block__summaryLabel}>{t('home.expenses')}</span>
          <span className={styles.block__summaryValueExpense}>
            {totalExpenses.toLocaleString()} {currencySymbols[currency]}
          </span>
        </button>
        <button
          type="button"
          className={`${styles.block__summaryCard} ${
            activeTab === 'income' ? styles['block__summaryCard--active'] : ''
          }`}
          onClick={() => setActiveTab('income')}
        >
          <span className={styles.block__summaryLabel}>{t('common.income')}</span>
          <span className={styles.block__summaryValueIncome}>
            {totalIncome.toLocaleString()} {currencySymbols[currency as keyof typeof currencySymbols]}
          </span>
        </button>
      </div>

      {activeTab === 'income' && (
        <div className={styles.block__income}>
          <div className={styles.block__incomeForm}>
            <input
              type="text"
              inputMode="decimal"
              className={styles.block__input}
              value={incomeAmount}
              onChange={(e) => setIncomeAmount(e.target.value.replace(/[-]/g, '').replace(/[^\d.,]/g, ''))}
              placeholder={t('common.amount')}
            />
            <input
              type="text"
              className={styles.block__input}
              value={incomeSource}
              onChange={(e) => setIncomeSource(e.target.value)}
              placeholder={t('statistics.planner.sourcePlaceholder')}
            />
            <button
              type="button"
              className={styles.block__addBtn}
              onClick={handleAddIncome}
              disabled={
                !incomeAmount ||
                (parseFloat(incomeAmount.replace(',', '.')) || 0) <= 0
              }
            >
              <FiPlus size={18} />
              {t('common.add')}
            </button>
          </div>
          <div className={styles.block__incomeList}>
            {incomeTransactions
              .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
              .map((tx) => (
                <div key={tx._id} className={styles.block__incomeItem}>
                  <div className={styles.block__incomeItemInfo}>
                    <span className={styles.block__incomeAmount}>
                      +{getAmount(tx).toLocaleString()} {currencySymbols[currency]}
                    </span>
                    <span className={styles.block__incomeSource}>{tx.category}</span>
                    <span className={styles.block__incomeDate}>{formatDate(tx.date)}</span>
                  </div>
                  <button
                    type="button"
                    className={styles.block__removeBtn}
                    onClick={() => deleteTransactionMutation.mutate(tx._id)}
                    title={t('common.delete')}
                  >
                    <FiTrash2 size={16} />
                  </button>
                </div>
              ))}
          </div>
        </div>
      )}

      {activeTab === 'expense' && !selectedCategory && (
        <div className={styles.block__expenses}>
          <button
            type="button"
            className={styles.block__addExpenseBtn}
            onClick={() => setShowAddExpense(true)}
          >
            <FiPlus size={18} />
            {t('common.add')} {t('common.expense')}
          </button>
          <div className={styles.block__grid}>
            {stats.map((stat) => (
              <button
                key={stat.category}
                type="button"
                className={styles.block__card}
                onClick={() => setSelectedCategory(stat.category)}
              >
                <div
                  className={styles.block__cardIcon}
                  style={{
                    backgroundColor: `${categoryColorMap[stat.category] || '#848e9c'}20`,
                  }}
                >
                  <CategoryIcon category={stat.category} size={24} />
                </div>
                <div className={styles.block__cardInfo}>
                  <span className={styles.block__cardCategory}>{stat.category}</span>
                  <span className={styles.block__cardAmount}>
                    {stat.total.toLocaleString()} {currencySymbols[currency as keyof typeof currencySymbols]}
                  </span>
                </div>
              </button>
            ))}
            {stats.length === 0 && (
              <p className={styles.block__empty}>{t('statistics.planner.noExpenses')}</p>
            )}
          </div>
        </div>
      )}

      {showAddExpense && (
        <Modal
          isOpen
          onClose={() => setShowAddExpense(false)}
          title={`${t('common.add')} ${t('common.expense')}`}
        >
          <AddExpenseForm
            roomId={roomId}
            categories={EXPENSE_CATEGORIES}
            currency={currency}
            onClose={() => setShowAddExpense(false)}
            onSuccess={() => {
              setShowAddExpense(false);
              queryClient.invalidateQueries({ queryKey: ['transactions', roomId] });
              queryClient.invalidateQueries({ queryKey: ['transaction-stats', roomId] });
            }}
          />
        </Modal>
      )}

      {activeTab === 'expense' && selectedCategory && (
        <CategoryExpenseDetail
          category={selectedCategory}
          transactions={categoryTransactions}
          currency={currency}
          onClose={closeCategoryDetail}
          onReceiptAttach={(txId) => {
            receiptInputRef.current?.setAttribute('data-tx-id', txId);
            receiptInputRef.current?.click();
          }}
          onUpdate={() => {
            queryClient.invalidateQueries({ queryKey: ['transactions', roomId] });
          }}
        />
      )}

      <input
        ref={receiptInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className={styles.block__fileInput}
        onChange={async (e) => {
          const txId = receiptInputRef.current?.getAttribute('data-tx-id');
          const file = e.target.files?.[0];
          if (!txId || !file) {
            e.target.value = '';
            return;
          }
          try {
            const res = await fileAPI.uploadReceipt(file);
            if (res.data?.imageUrl) {
              await financeAPI.transactions.update(txId, {
                receiptImageUrl: res.data.imageUrl,
              });
              queryClient.invalidateQueries({ queryKey: ['transactions', roomId] });
              toast.success(t('common.save'));
            }
          } catch {
            toast.error(t('errors.generic'));
          }
          e.target.value = '';
          receiptInputRef.current?.removeAttribute('data-tx-id');
        }}
      />
    </div>
  );
};

interface AddExpenseFormProps {
  roomId?: string;
  categories: string[];
  currency: string;
  onClose: () => void;
  onSuccess: () => void;
}

const AddExpenseForm: React.FC<AddExpenseFormProps> = ({
  roomId,
  categories,
  currency,
  onClose,
  onSuccess,
}) => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [category, setCategory] = useState(categories[0] || '');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const receiptInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = async () => {
    const num = parseFloat(amount.replace(',', '.'));
    if (num <= 0) return;
    let receiptUrl: string | undefined;
    if (receiptFile) {
      try {
        const res = await fileAPI.uploadReceipt(receiptFile);
        receiptUrl = res.data?.imageUrl;
      } catch {
        toast.error(t('errors.generic'));
        return;
      }
    }
    try {
      await financeAPI.transactions.create({
        amount: num,
        currency,
        type: 'expense',
        category,
        date: new Date().toISOString().slice(0, 10),
        description: description.trim() || undefined,
        roomId,
        receiptImageUrl: receiptUrl,
      });
      onSuccess();
    } catch {
      toast.error(t('errors.generic'));
    }
  };

  const categoryOptions = categories.map((c) => ({ value: c, label: c }));

  return (
    <form
      className={styles.addForm}
      onSubmit={(e) => {
        e.preventDefault();
        handleSubmit();
      }}
    >
      <div className={styles.addForm__row}>
        <Dropdown
          options={categoryOptions}
          value={category}
          onChange={setCategory}
          placeholder={t('common.category')}
          className={styles.addForm__dropdown}
        />
      </div>
      <div className={styles.addForm__row}>
        <input
          type="text"
          inputMode="decimal"
          className={styles.addForm__input}
          value={amount}
          onChange={(e) => setAmount(e.target.value.replace(/[-]/g, '').replace(/[^\d.,]/g, ''))}
          placeholder={t('common.amount')}
        />
        <span className={styles.addForm__currency}>{currencySymbols[currency as keyof typeof currencySymbols]}</span>
      </div>
      <div className={styles.addForm__row}>
        <input
          type="text"
          className={styles.addForm__input}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder={t('common.description')}
        />
      </div>
      <div className={styles.addForm__receipt}>
        <input
          ref={receiptInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className={styles.addForm__fileInput}
          onChange={(e) => setReceiptFile(e.target.files?.[0] || null)}
        />
        <button
          type="button"
          className={styles.addForm__receiptBtn}
          onClick={() => receiptInputRef.current?.click()}
        >
          <FiImage size={18} />
          {receiptFile ? receiptFile.name : t('home.attachReceipt')}
        </button>
      </div>
      <div className={styles.addForm__actions}>
        <button type="button" className={styles.addForm__cancel} onClick={onClose}>
          {t('common.cancel')}
        </button>
        <button
          type="submit"
          className={styles.addForm__submit}
          disabled={!amount || (parseFloat(amount.replace(',', '.')) || 0) <= 0}
        >
          {t('common.add')}
        </button>
      </div>
    </form>
  );
};

interface CategoryExpenseDetailProps {
  category: string;
  transactions: Transaction[];
  currency: string;
  onClose: () => void;
  onReceiptAttach: (txId: string) => void;
  onUpdate: () => void;
}

const CategoryExpenseDetail: React.FC<CategoryExpenseDetailProps> = ({
  category,
  transactions,
  currency,
  onClose,
  onReceiptAttach,
}) => {
  const { t } = useTranslation();
  const color = categoryColorMap[category] || '#848e9c';
  const total = transactions.reduce((s, tx) => s + getAmount(tx), 0);

  return (
    <div className={styles.detail}>
      <div className={styles.detail__header}>
        <button type="button" className={styles.detail__back} onClick={onClose}>
          <FiChevronLeft size={20} />
          {category}
        </button>
        <span className={styles.detail__total}>
          {total.toLocaleString()} {currencySymbols[currency as keyof typeof currencySymbols]}
        </span>
      </div>
      <ul className={styles.detail__list}>
        {transactions.map((tx) => (
          <li key={tx._id} className={styles.detail__item}>
            <div
              className={styles.detail__itemIcon}
              style={{ backgroundColor: `${color}20` }}
            >
              <CategoryIcon category={tx.category} size={20} color={color} />
            </div>
            <div className={styles.detail__itemContent}>
              <span className={styles.detail__itemAmount}>
                −{getAmount(tx).toLocaleString()} {currencySymbols[currency as keyof typeof currencySymbols]}
              </span>
              <span className={styles.detail__itemDesc}>{tx.description || '-'}</span>
              <span className={styles.detail__itemDate}>
                {new Date(tx.date).toLocaleDateString(undefined, {
                  day: 'numeric',
                  month: 'short',
                })}
              </span>
            </div>
            <button
              type="button"
              className={styles.detail__attachBtn}
              onClick={() => onReceiptAttach(tx._id)}
              title={t('home.attachReceipt')}
            >
              {tx.receiptImageUrl ? (
                <img
                  src={getReceiptImageUrl(tx.receiptImageUrl)}
                  alt=""
                  className={styles.detail__receiptThumb}
                />
              ) : (
                <FiImage size={18} />
              )}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
};
