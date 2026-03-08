import React, { useState, useRef, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import { RootState } from '@app/store';
import { FiPlus, FiTrash2, FiChevronUp, FiChevronDown, FiImage, FiCamera } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { financeAPI, fileAPI } from '@shared/api';
import { useCurrencyPreference } from '@shared/lib/use-currency-preference';
import { currencySymbols } from '@shared/lib/currency';
import { getTransactionAmount } from '@shared/lib/transaction';
import { getCategoryLabel } from '@shared/lib/category-labels';
import { hasActiveSubscription } from '@shared/lib/subscription';
import { Dropdown, Modal } from '@shared/ui';
import { useTransactionStats } from '@features/transactions/use-transaction-stats';
import { useExpenseCategoryAccordion } from '@features/expense-category';
import { useIncomeCategoryAccordion } from '@features/income-category';
import { toast } from 'react-toastify';
import { ExpenseCategoryCard } from '../ExpenseCategoryCard';
import { IncomeCategoryCard } from '../IncomeCategoryCard';
import styles from './IncomeExpensesBlock.module.scss';

const SWIPE_THRESHOLD = 50;
type AddModalTab = 'expense' | 'income';

const EXPENSE_CATEGORIES = [
  'Семья', 'Образование', 'Питомцы', 'Кино', 'Здоровье', 'Транспорт',
  'Одежда', 'Еда', 'Игры', 'Книги', 'Спорт', 'Кафе', 'Покупки', 'Другое',
];

const INCOME_CATEGORIES = [
  'Зарплата', 'Подработка', 'Подарки', 'Инвестиции', 'Другое',
];

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
  const { toggleCategory, isExpanded } = useExpenseCategoryAccordion();
  const { toggleCategory: toggleIncomeCategory, isExpanded: isIncomeExpanded } = useIncomeCategoryAccordion();
  const [showAddModal, setShowAddModal] = useState(false);
  const [addModalTab, setAddModalTab] = useState<AddModalTab>('expense');
  const receiptInputRef = useRef<HTMLInputElement>(null);

  const firstDay = formatLocalDate(new Date(year, month, 1));
  const lastDay = formatLocalDate(new Date(year, month + 1, 0));

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
  const totalIncome = incomeTransactions.reduce((s, tx) => s + getTransactionAmount(tx), 0);

  const incomeStats = useMemo(() => {
    const m = new Map<string, number>();
    for (const tx of incomeTransactions) {
      const cat = tx.category || 'Другое';
      m.set(cat, (m.get(cat) || 0) + getTransactionAmount(tx));
    }
    return Array.from(m.entries()).map(([category, total]) => ({ category, total }));
  }, [incomeTransactions]);

  const createIncomeMutation = useMutation({
    mutationFn: (data: { amount: number; source: string; date: string; description?: string; receiptImageUrl?: string }) =>
      financeAPI.transactions.create({
        amount: Math.abs(data.amount),
        type: 'income',
        category: data.source || t('statistics.planner.incomePayments'),
        date: data.date,
        description: data.description ?? data.source ?? undefined,
        roomId,
        currency,
        receiptImageUrl: data.receiptImageUrl,
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
  const handleAddModalClose = useCallback(() => {
    setShowAddModal(false);
    setAddModalTab('expense');
  }, []);

  const handleAddSuccess = useCallback(() => {
    setShowAddModal(false);
    setAddModalTab('expense');
    queryClient.invalidateQueries({ queryKey: ['transactions', roomId] });
    queryClient.invalidateQueries({ queryKey: ['transaction-stats', roomId] });
  }, [queryClient, roomId]);

  const handleSwipeEnd = useCallback(
    (_e: MouseEvent | TouchEvent | PointerEvent, info: { offset: { y: number }; velocity: { y: number } }) => {
      const { offset, velocity } = info;
      if (offset.y < -SWIPE_THRESHOLD || velocity.y < -0.25) setAddModalTab('income');
      else if (offset.y > SWIPE_THRESHOLD || velocity.y > 0.25) setAddModalTab('expense');
    },
    []
  );

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
        <div className={styles.block__expenses}>
          <button
            type="button"
            className={styles.block__addExpenseBtn}
            onClick={() => {
              setShowAddModal(true);
              setAddModalTab('income');
            }}
          >
            <FiPlus size={20} />
            {t('common.add')} {t('common.income')}
          </button>
          <div className={styles.block__grid}>
            {incomeStats.map((stat) => (
              <motion.div
                key={stat.category}
                className={isIncomeExpanded(stat.category) ? styles.block__expandedCard : undefined}
                layout
                transition={{
                  layout: {
                    type: 'spring',
                    damping: 28,
                    stiffness: 320,
                  },
                }}
              >
                <IncomeCategoryCard
                  category={stat.category}
                  total={stat.total}
                  transactions={incomeTransactions.filter((tx) => (tx.category || 'Другое') === stat.category)}
                  isExpanded={isIncomeExpanded(stat.category)}
                  onToggle={() => toggleIncomeCategory(stat.category)}
                  currency={currency}
                  onDelete={(id) => {
                    deleteTransactionMutation.mutate(id);
                    queryClient.invalidateQueries({ queryKey: ['transactions', roomId] });
                    queryClient.invalidateQueries({ queryKey: ['transaction-stats', roomId] });
                  }}
                  onReceiptAttach={(txId) => {
                    receiptInputRef.current?.setAttribute('data-tx-id', txId);
                    receiptInputRef.current?.click();
                  }}
                />
              </motion.div>
            ))}
            {incomeStats.length === 0 && (
              <p className={styles.block__empty}>{t('statistics.planner.noIncome', 'Нет доходов')}</p>
            )}
          </div>
        </div>
      )}

      {showAddModal && (
        <Modal
          isOpen
          onClose={handleAddModalClose}
          title={`${t('common.add')} ${addModalTab === 'expense' ? t('common.expense') : t('common.income')}`}
          aboveContent={
            addModalTab === 'income' ? (
              <div className={styles.addModalSwipeHint}>
                <button
                  type="button"
                  className={styles.addModalSwipeHint__btn}
                  onClick={() => setAddModalTab('expense')}
                  aria-label={t('statistics.planner.swipeExpense', 'Свайп вниз — расход')}
                >
                  <motion.span animate={{ y: [0, 3, 0] }} transition={{ repeat: Infinity, duration: 1.5 }}>
                    <FiChevronDown size={20} />
                  </motion.span>
                  <span>{t('statistics.planner.swipeExpense', 'Свайп вниз — расход')}</span>
                </button>
              </div>
            ) : null
          }
          belowContent={
            addModalTab === 'expense' ? (
              <div className={styles.addModalSwipeHint}>
                <button
                  type="button"
                  className={styles.addModalSwipeHint__btn}
                  onClick={() => setAddModalTab('income')}
                  aria-label={t('statistics.planner.swipeIncome', 'Свайп вверх — доход')}
                >
                  <motion.span animate={{ y: [0, -3, 0] }} transition={{ repeat: Infinity, duration: 1.5 }}>
                    <FiChevronUp size={20} />
                  </motion.span>
                  <span>{t('statistics.planner.swipeIncome', 'Свайп вверх — доход')}</span>
                </button>
              </div>
            ) : null
          }
        >
          <motion.div
            className={styles.addModalSwipe}
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={0.2}
            onDragEnd={handleSwipeEnd}
          >
            <div className={styles.addModalSwipe__handle} />
            <AnimatePresence mode="wait">
              {addModalTab === 'expense' ? (
                <motion.div
                  key="expense"
                  className={styles.addModalSwipe__panel}
                  initial={{ opacity: 0, y: 40 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -40 }}
                  transition={{ type: 'spring', damping: 28, stiffness: 320 }}
                >
                  <AddExpenseForm
                    roomId={roomId}
                    categories={EXPENSE_CATEGORIES}
                    currency={currency}
                    year={year}
                    month={month}
                    onClose={handleAddModalClose}
                    onSuccess={handleAddSuccess}
                  />
                </motion.div>
              ) : (
                <motion.div
                  key="income"
                  className={styles.addModalSwipe__panel}
                  initial={{ opacity: 0, y: -40 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 40 }}
                  transition={{ type: 'spring', damping: 28, stiffness: 320 }}
                >
                  <AddIncomeForm
                    categories={INCOME_CATEGORIES}
                    currency={currency}
                    year={year}
                    month={month}
                    onCreate={createIncomeMutation.mutate}
                    onClose={handleAddModalClose}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </Modal>
      )}

      {activeTab === 'expense' && (
        <div className={styles.block__expenses}>
          <button
            type="button"
            className={styles.block__addExpenseBtn}
            onClick={() => setShowAddModal(true)}
          >
            <FiPlus size={20} />
            {t('common.add')} {t('common.expense')}
          </button>
          <div className={styles.block__grid}>
            {stats.map((stat) => (
              <motion.div
                key={stat.category}
                className={isExpanded(stat.category) ? styles.block__expandedCard : undefined}
                layout
                transition={{
                  layout: {
                    type: 'spring',
                    damping: 28,
                    stiffness: 320,
                  },
                }}
              >
                <ExpenseCategoryCard
                  category={stat.category}
                  total={stat.total}
                  transactions={expenseTransactions.filter((tx) => tx.category === stat.category)}
                  isExpanded={isExpanded(stat.category)}
                  onToggle={() => toggleCategory(stat.category)}
                  currency={currency}
                  onDelete={(id) => {
                    deleteTransactionMutation.mutate(id);
                    queryClient.invalidateQueries({ queryKey: ['transactions', roomId] });
                    queryClient.invalidateQueries({ queryKey: ['transaction-stats', roomId] });
                  }}
                  onReceiptAttach={(txId) => {
                    receiptInputRef.current?.setAttribute('data-tx-id', txId);
                    receiptInputRef.current?.click();
                  }}
                />
              </motion.div>
            ))}
            {stats.length === 0 && (
              <p className={styles.block__empty}>{t('statistics.planner.noExpenses')}</p>
            )}
          </div>
        </div>
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

interface AddIncomeFormProps {
  categories: string[];
  currency: string;
  year: number;
  month: number;
  onCreate: (data: { amount: number; source: string; date: string; description?: string; receiptImageUrl?: string }) => void;
  onClose: () => void;
}

const AddIncomeForm: React.FC<AddIncomeFormProps> = ({
  categories,
  currency,
  year,
  month,
  onCreate,
  onClose,
}) => {
  const { t } = useTranslation();
  const user = useSelector((state: RootState) => state.user);
  const canUseScanner = hasActiveSubscription(user, 'finn_plus');
  const maxDay = new Date(year, month + 1, 0).getDate();
  const today = new Date().getDate();
  const monthStr = `${year}-${String(month + 1).padStart(2, '0')}`;
  const dateMin = `${monthStr}-01`;
  const dateMax = `${monthStr}-${String(maxDay).padStart(2, '0')}`;
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState(categories[0] || '');
  const [description, setDescription] = useState('');
  const [dateStr, setDateStr] = useState(() => {
    const d = Math.min(today, maxDay);
    return `${monthStr}-${String(d).padStart(2, '0')}`;
  });
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const receiptInputRef = useRef<HTMLInputElement>(null);
  const scanInputRef = useRef<HTMLInputElement>(null);

  const handleScan = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setIsScanning(true);
    try {
      const res = await financeAPI.receiptParse(file, 'ru');
      setAmount(String(res.data.amount || ''));
      setDescription(res.data.description || '');
      setReceiptFile(file);
      toast.success(t('statistics.planner.receiptScanned'));
    } catch {
      toast.error(t('errors.scanFailed'));
    } finally {
      setIsScanning(false);
      if (scanInputRef.current) {
        scanInputRef.current.value = '';
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const num = Math.max(0, parseFloat(amount.replace(',', '.')) || 0);
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
    onCreate({
      amount: num,
      source: category || t('statistics.planner.incomePayments'),
      date: dateStr,
      description: description.trim() || undefined,
      receiptImageUrl: receiptUrl,
    });
    setAmount('');
    setDescription('');
    setCategory(categories[0] || '');
    setReceiptFile(null);
    onClose();
  };

  const valid = amount && (parseFloat(amount.replace(',', '.')) || 0) > 0;
  const categoryOptions = categories.map((c) => ({ value: c, label: getCategoryLabel(t, 'income', c) }));

  return (
    <form className={styles.addForm} onSubmit={handleSubmit}>
      <div className={styles.addForm__row}>
        <Dropdown
          options={categoryOptions}
          value={category}
          onChange={setCategory}
          placeholder={t('statistics.planner.sourcePlaceholder')}
          className={styles.addForm__dropdown}
        />
      </div>
      <div className={styles.addForm__row}>
        <label className={styles.addForm__label}>{t('common.date')}</label>
        <input
          type="date"
          className={styles.addForm__dateInput}
          value={dateStr}
          min={dateMin}
          max={dateMax}
          onChange={(e) => setDateStr(e.target.value)}
          aria-label={t('common.date')}
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
        <input
          ref={scanInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className={styles.addForm__fileInput}
          onChange={handleScan}
        />
        <button
          type="button"
          className={styles.addForm__scanBtn}
          onClick={() => scanInputRef.current?.click()}
          disabled={!canUseScanner || isScanning}
          title={!canUseScanner ? t('statistics.planner.finnPlusRequired') : undefined}
        >
          {isScanning ? t('statistics.planner.scanning') : t('statistics.planner.scanReceipt')}
        </button>
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
        <button type="submit" className={styles.addForm__submit} disabled={!valid}>
          {t('common.add')}
        </button>
      </div>
    </form>
  );
};

interface AddExpenseFormProps {
  roomId?: string;
  categories: string[];
  currency: string;
  year: number;
  month: number;
  onClose: () => void;
  onSuccess: () => void;
}

const AddExpenseForm: React.FC<AddExpenseFormProps> = ({
  roomId,
  categories,
  currency,
  year,
  month,
  onClose,
  onSuccess,
}) => {
  const { t } = useTranslation();
  const user = useSelector((state: RootState) => state.user);
  const canUseScanner = hasActiveSubscription(user, 'finn_plus');
  const maxDay = new Date(year, month + 1, 0).getDate();
  const today = new Date().getDate();
  const monthStr = `${year}-${String(month + 1).padStart(2, '0')}`;
  const dateMin = `${monthStr}-01`;
  const dateMax = `${monthStr}-${String(maxDay).padStart(2, '0')}`;
  const [category, setCategory] = useState(categories[0] || '');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [dateStr, setDateStr] = useState(() => {
    const d = Math.min(today, maxDay);
    return `${monthStr}-${String(d).padStart(2, '0')}`;
  });
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const receiptInputRef = useRef<HTMLInputElement>(null);
  const scanInputRef = useRef<HTMLInputElement>(null);

  const handleScan = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setIsScanning(true);
    try {
      const res = await financeAPI.receiptParse(file, 'ru');
      setAmount(String(res.data.amount || ''));
      setCategory(res.data.category || categories[0] || '');
      setDescription(res.data.description || '');
      setReceiptFile(file);
      toast.success(t('planner.receiptScanned'));
    } catch {
      toast.error(t('errors.scanFailed'));
    } finally {
      setIsScanning(false);
      if (scanInputRef.current) {
        scanInputRef.current.value = '';
      }
    }
  };

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
        amount: -Math.abs(num),
        currency,
        type: 'expense',
        category,
        date: dateStr,
        description: description.trim() || undefined,
        roomId,
        receiptImageUrl: receiptUrl,
      });
      onSuccess();
    } catch {
      toast.error(t('errors.generic'));
    }
  };

  const categoryOptions = categories.map((c) => ({ value: c, label: getCategoryLabel(t, 'expense', c) }));

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
        <label className={styles.addForm__label}>{t('common.date')}</label>
        <input
          type="date"
          className={styles.addForm__dateInput}
          value={dateStr}
          min={dateMin}
          max={dateMax}
          onChange={(e) => setDateStr(e.target.value)}
          aria-label={t('common.date')}
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
        <input
          ref={scanInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className={styles.addForm__fileInput}
          onChange={handleScan}
        />
        <button
          type="button"
          className={styles.addForm__scanBtn}
          onClick={() => scanInputRef.current?.click()}
          disabled={!canUseScanner || isScanning}
          title={!canUseScanner ? t('statistics.planner.finnPlusRequired') : undefined}
        >
          <FiCamera size={18} />
          {isScanning ? t('statistics.planner.scanning') : t('statistics.planner.scanReceipt')}
        </button>
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
