import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { financeAPI } from '@shared/api';
import styles from './ExpenseCalculator.module.scss';

const DEFAULT_SAVINGS = 20;
const DEFAULT_INVESTMENTS = 10;
const DEFAULT_PURCHASES = 70;

interface ExpenseCalculatorProps {
  roomId?: string;
}

interface FixedExpense {
  id: string;
  name: string;
  amount: string;
}

const ExpenseCalculator: React.FC<ExpenseCalculatorProps> = ({ roomId }) => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [monthlyIncome, setMonthlyIncome] = useState('');
  const [fixedExpenses, setFixedExpenses] = useState<FixedExpense[]>([]);

  const { data: budget } = useQuery({
    queryKey: ['budget', roomId],
    queryFn: async () => {
      const res = await financeAPI.budget.get(roomId);
      return res.data;
    },
  });

  useEffect(() => {
    if (budget) {
      setMonthlyIncome(budget.monthlyIncome?.toString() || '');
      if (budget.fixedExpenses && budget.fixedExpenses.length > 0) {
        setFixedExpenses(
          budget.fixedExpenses.map((exp: any) => ({
            id: crypto.randomUUID(),
            name: exp.name || '',
            amount: exp.amount?.toString() || '',
          }))
        );
      }
    }
  }, [budget]);

  const fixedTotal = fixedExpenses.reduce((s, e) => s + (parseFloat(e.amount) || 0), 0);
  const income = parseFloat(monthlyIncome) || 0;
  const available = Math.max(0, income - fixedTotal);
  const savings = Math.round((available * DEFAULT_SAVINGS) / 100);
  const investments = Math.round((available * DEFAULT_INVESTMENTS) / 100);
  const purchases = Math.round((available * DEFAULT_PURCHASES) / 100);

  const addFixedExpense = () => {
    setFixedExpenses((prev) => [
      ...prev,
      { id: crypto.randomUUID(), name: '', amount: '' },
    ]);
  };

  const updateFixedExpense = (id: string, field: 'name' | 'amount', value: string) => {
    setFixedExpenses((prev) =>
      prev.map((e) => (e.id === id ? { ...e, [field]: value } : e)),
    );
  };

  const removeFixedExpense = (id: string) => {
    setFixedExpenses((prev) => prev.filter((e) => e.id !== id));
  };

  const handleSave = async () => {
    if (income <= 0) return;
    const expenses = fixedExpenses
      .filter((e) => e.name.trim() && parseFloat(e.amount) > 0)
      .map((e) => ({ name: e.name.trim(), amount: parseFloat(e.amount) }));
    await financeAPI.budget.upsert({
      currency: 'RUB',
      monthlyIncome: income,
      fixedExpenses: expenses,
      savingsPercent: DEFAULT_SAVINGS,
      investmentsPercent: DEFAULT_INVESTMENTS,
      purchasesPercent: DEFAULT_PURCHASES,
      roomId,
    });
    queryClient.invalidateQueries({ queryKey: ['budget', roomId] });
  };

  return (
    <section className={styles['expense-calculator']}>
      <h2 className={styles['expense-calculator__title']}>{t('home.calculator')}</h2>
      <div className={styles['expense-calculator__form']}>
        <label className={styles['expense-calculator__label']}>{t('home.monthlyIncome')}</label>
        <input
          className={styles['expense-calculator__input']}
          type="number"
          value={monthlyIncome}
          onChange={(e) => setMonthlyIncome(e.target.value)}
          placeholder="0"
        />
        <div className={styles['expense-calculator__fixed-header']}>
          <label className={styles['expense-calculator__label']}>{t('home.fixedExpenses')}</label>
          <button type="button" onClick={addFixedExpense} className={styles['expense-calculator__add-btn']}>
            + {t('common.add')}
          </button>
        </div>
        {fixedExpenses.map((e) => (
          <div key={e.id} className={styles['expense-calculator__fixed-row']}>
            <input
              className={styles['expense-calculator__input']}
              placeholder={t('common.description')}
              value={e.name}
              onChange={(ev) => updateFixedExpense(e.id, 'name', ev.target.value)}
            />
            <input
              className={styles['expense-calculator__input']}
              type="number"
              placeholder="0"
              value={e.amount}
              onChange={(ev) => updateFixedExpense(e.id, 'amount', ev.target.value)}
            />
            <button
              type="button"
              onClick={() => removeFixedExpense(e.id)}
              className={styles['expense-calculator__remove-btn']}
            >
              ×
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={handleSave}
          className={styles['expense-calculator__save-btn']}
          disabled={income <= 0}
        >
          {t('common.save')}
        </button>
      </div>
      {income > 0 && (
        <div className={styles['expense-calculator__result']}>
          <div className={styles['expense-calculator__available']}>
            {t('home.available')}: <span>{available.toLocaleString()}</span>
          </div>
          <div className={styles['expense-calculator__distribution']}>
            <div className={styles['expense-calculator__dist-item']}>
              <span className={styles['expense-calculator__dist-amount--success']}>{savings}</span> {t('home.savings')}
            </div>
            <div className={styles['expense-calculator__dist-item']}>
              <span className={styles['expense-calculator__dist-amount--success']}>{investments}</span> {t('home.investments')}
            </div>
            <div className={styles['expense-calculator__dist-item']}>
              <span className={styles['expense-calculator__dist-amount--accent']}>{purchases}</span> {t('home.purchases')}
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default ExpenseCalculator;
