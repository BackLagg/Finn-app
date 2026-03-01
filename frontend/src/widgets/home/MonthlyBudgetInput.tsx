import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { financeAPI } from '@shared/api';
import { Currency, currencySymbols } from '@shared/lib/currency';
import { Dropdown } from '@shared/ui';
import styles from './MonthlyBudgetInput.module.scss';

interface MonthlyBudgetInputProps {
  roomId?: string;
  defaultCurrency?: Currency;
}

export const MonthlyBudgetInput: React.FC<MonthlyBudgetInputProps> = ({ 
  roomId,
  defaultCurrency = 'USD'
}) => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState<Currency>(defaultCurrency);
  const [selectedMonth, setSelectedMonth] = useState(new Date());

  const currencyOptions = [
    { value: 'USD', label: `${currencySymbols.USD} USD` },
    { value: 'EUR', label: `${currencySymbols.EUR} EUR` },
    { value: 'RUB', label: `${currencySymbols.RUB} RUB` },
    { value: 'BYN', label: `${currencySymbols.BYN} BYN` },
  ];

  const saveMutation = useMutation({
    mutationFn: async () => {
      return financeAPI.budget.upsert({
        currency,
        monthlyIncome: parseFloat(amount),
        fixedExpenses: [],
        savingsPercent: 20,
        investmentsPercent: 10,
        purchasesPercent: 70,
        roomId,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budget', roomId] });
      setAmount('');
    },
  });

  const handleSave = () => {
    if (parseFloat(amount) > 0) {
      saveMutation.mutate();
    }
  };

  return (
    <div className={styles['budget-input']}>
      <h3 className={styles['budget-input__title']}>
        {t('home.budget.monthlyIncome')}
      </h3>
      <div className={styles['budget-input__form']}>
        <div className={styles['budget-input__amount-wrapper']}>
          <input
            type="number"
            className={styles['budget-input__amount']}
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0"
          />
          <span className={styles['budget-input__currency-symbol']}>
            {currencySymbols[currency]}
          </span>
        </div>
        <Dropdown
          options={currencyOptions}
          value={currency}
          onChange={(val) => setCurrency(val as Currency)}
          className={styles['budget-input__currency']}
        />
      </div>
      <button
        type="button"
        className={styles['budget-input__save']}
        onClick={handleSave}
        disabled={!amount || parseFloat(amount) <= 0 || saveMutation.isPending}
      >
        {t('common.save')}
      </button>
    </div>
  );
};

export default MonthlyBudgetInput;
