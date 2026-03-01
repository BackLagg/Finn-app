import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FiPlus, FiTrash2 } from 'react-icons/fi';
import { useCurrencyPreference } from '@shared/lib/use-currency-preference';
import { currencySymbols } from '@shared/lib/currency';
import type { IncomePayment } from '@entities/planner';
import styles from './IncomePaymentsForm.module.scss';

interface IncomePaymentsFormProps {
  payments: IncomePayment[];
  totalIncome: number;
  onAdd: (amount: number, comment: string) => void;
  onRemove: (id: string) => void;
}

export const IncomePaymentsForm: React.FC<IncomePaymentsFormProps> = ({
  payments,
  totalIncome,
  onAdd,
  onRemove,
}) => {
  const { t } = useTranslation();
  const [currency] = useCurrencyPreference();
  const [amount, setAmount] = useState('');
  const [comment, setComment] = useState('');

  const handleAdd = () => {
    const num = parseFloat(amount.replace(',', '.'));
    if (num > 0) {
      onAdd(num, comment);
      setAmount('');
      setComment('');
    }
  };

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString(undefined, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className={styles['income-payments']}>
      <h3 className={styles['income-payments__title']}>{t('statistics.planner.incomePayments')}</h3>
      <div className={styles['income-payments__form']}>
        <div className={styles['income-payments__row']}>
          <input
            type="text"
            inputMode="decimal"
            className={styles['income-payments__amount']}
            value={amount}
            onChange={(e) => setAmount(e.target.value.replace(/[^\d.,]/g, ''))}
            placeholder={t('common.amount')}
          />
          <span className={styles['income-payments__currency']}>{currencySymbols[currency]}</span>
        </div>
        <input
          type="text"
          className={styles['income-payments__comment']}
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder={t('statistics.planner.commentPlaceholder')}
        />
        <button
          type="button"
          className={styles['income-payments__add']}
          onClick={handleAdd}
          disabled={!amount || parseFloat(amount.replace(',', '.')) <= 0}
        >
          <FiPlus size={18} />
          {t('common.add')}
        </button>
      </div>
      <div className={styles['income-payments__total']}>
        {t('statistics.planner.totalIncome')}: {totalIncome.toLocaleString()} {currencySymbols[currency]}
      </div>
      <div className={styles['income-payments__list']}>
        {payments.map((p) => (
          <div key={p.id} className={styles['income-payments__item']}>
            <div className={styles['income-payments__item-info']}>
              <span className={styles['income-payments__item-amount']}>
                +{p.amount.toLocaleString()} {currencySymbols[currency]}
              </span>
              <span className={styles['income-payments__item-comment']}>{p.comment}</span>
              <span className={styles['income-payments__item-date']}>{formatDate(p.createdAt)}</span>
            </div>
            <button
              type="button"
              className={styles['income-payments__item-remove']}
              onClick={() => onRemove(p.id)}
              title={t('common.delete')}
            >
              <FiTrash2 size={16} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};
