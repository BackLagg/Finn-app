import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQueryClient } from '@tanstack/react-query';
import { financeAPI } from '@shared/api';
import styles from './ExpenseCalculator.module.scss';

interface ExpenseCalculatorProps {
  roomId?: string;
}

const ExpenseCalculator: React.FC<ExpenseCalculatorProps> = ({ roomId }) => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [monthlyIncome, setMonthlyIncome] = useState('');
  const [fixedTotal, setFixedTotal] = useState('');
  const [savings, setSavings] = useState(20);
  const [investments, setInvestments] = useState(10);
  const [purchases, setPurchases] = useState(70);
  const [result, setResult] = useState<{ savings: number; investments: number; purchases: number } | null>(null);

  const handleCalculate = () => {
    const income = parseFloat(monthlyIncome) || 0;
    const fixed = parseFloat(fixedTotal) || 0;
    const available = income - fixed;
    if (available <= 0) {
      setResult(null);
      return;
    }
    const sum = savings + investments + purchases;
    const k = sum > 0 ? 100 / sum : 1;
    setResult({
      savings: Math.round((available * (savings * k)) / 100),
      investments: Math.round((available * (investments * k)) / 100),
      purchases: Math.round((available * (purchases * k)) / 100),
    });
  };

  const handleSave = async () => {
    const income = parseFloat(monthlyIncome) || 0;
    const fixed = parseFloat(fixedTotal) || 0;
    if (income <= 0) return;
    const sum = savings + investments + purchases;
    const k = sum > 0 ? 100 / sum : 1;
    await financeAPI.budget.upsert({
      currency: 'RUB',
      monthlyIncome: income,
      fixedExpenses: fixed > 0 ? [{ name: 'Fixed', amount: fixed }] : [],
      savingsPercent: savings * k,
      investmentsPercent: investments * k,
      purchasesPercent: purchases * k,
      roomId,
    });
    queryClient.invalidateQueries({ queryKey: ['budget', roomId] });
  };

  return (
    <section className={styles.calculator}>
      <h2>{t('home.calculator')}</h2>
      <div className={styles.form}>
        <label>{t('home.monthlyIncome')}</label>
        <input
          type="number"
          value={monthlyIncome}
          onChange={(e) => setMonthlyIncome(e.target.value)}
          placeholder="0"
        />
        <label>{t('home.fixedExpenses')}</label>
        <input
          type="number"
          value={fixedTotal}
          onChange={(e) => setFixedTotal(e.target.value)}
          placeholder="0"
        />
        <label>{t('home.savings')} %</label>
        <input type="number" min={0} max={100} value={savings} onChange={(e) => setSavings(Number(e.target.value))} />
        <label>{t('home.investments')} %</label>
        <input type="number" min={0} max={100} value={investments} onChange={(e) => setInvestments(Number(e.target.value))} />
        <label>{t('home.purchases')} %</label>
        <input type="number" min={0} max={100} value={purchases} onChange={(e) => setPurchases(Number(e.target.value))} />
        <div className={styles.actions}>
          <button type="button" onClick={handleCalculate} className={styles.btn}>
            {t('common.calculate')}
          </button>
          <button type="button" onClick={handleSave} className={styles.btnPrimary}>
            {t('common.save')}
          </button>
        </div>
      </div>
      {result && (
        <div className={styles.result}>
          <div>{t('home.savings')}: {result.savings}</div>
          <div>{t('home.investments')}: {result.investments}</div>
          <div>{t('home.purchases')}: {result.purchases}</div>
        </div>
      )}
    </section>
  );
};

export default ExpenseCalculator;
