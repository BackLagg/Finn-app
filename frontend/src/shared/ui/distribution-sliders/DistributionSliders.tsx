import React from 'react';
import { IoRefreshOutline } from 'react-icons/io5';
import type { Distribution } from '@shared/lib/distribution';
import { clampDistribution } from '@shared/lib/distribution';
import styles from './DistributionSliders.module.scss';

export interface DistributionSlidersProps {
  distribution: Distribution;
  onChange: (d: Distribution) => void;
  savingsOnly: boolean;
  savingsLabel?: string;
  investmentsLabel?: string;
  purchasesLabel?: string;
  monthlyAmount?: number;
  currencySymbol?: string;
  onReset?: () => void;
  resetLabel?: string;
}

function formatAmount(value: number): string {
  return value.toLocaleString('ru-RU', { maximumFractionDigits: 0 });
}

export const DistributionSliders: React.FC<DistributionSlidersProps> = ({
  distribution,
  onChange,
  savingsOnly,
  savingsLabel = 'Savings',
  investmentsLabel = 'Investments',
  purchasesLabel = 'Purchases',
  monthlyAmount = 0,
  currencySymbol = '',
  onReset,
  resetLabel = 'Reset',
}) => {
  const handleChange = (key: keyof Distribution, value: number) => {
    onChange(clampDistribution(distribution, key, value, savingsOnly));
  };

  const renderValue = (percent: number) => {
    const amount =
      monthlyAmount > 0 && currencySymbol
        ? formatAmount(Math.round((monthlyAmount * percent) / 100))
        : null;
    return (
      <span className={styles.value}>
        {percent}%
        {amount != null && (
          <span className={styles.amount}> ({amount} {currencySymbol})</span>
        )}
      </span>
    );
  };

  return (
    <div className={styles.root}>
      {onReset && (
        <div className={styles.header}>
          <button
            type="button"
            onClick={onReset}
            className={styles.resetBtn}
            title={resetLabel}
          >
            <IoRefreshOutline size={20} />
          </button>
        </div>
      )}
      <div className={styles.row}>
        <label className={styles.label}>{savingsLabel}</label>
        {renderValue(distribution.savings)}
        <input
          type="range"
          min={0}
          max={100}
          value={distribution.savings}
          onChange={(e) => handleChange('savings', Number(e.target.value))}
          className={styles.slider}
        />
      </div>
      <div className={savingsOnly ? `${styles.row} ${styles.rowDisabled}` : styles.row}>
        <label className={styles.label}>{investmentsLabel}</label>
        {renderValue(distribution.investments)}
        <input
          type="range"
          min={0}
          max={100}
          value={distribution.investments}
          onChange={(e) => handleChange('investments', Number(e.target.value))}
          className={styles.slider}
          disabled={savingsOnly}
        />
      </div>
      <div className={styles.row}>
        <label className={styles.label}>{purchasesLabel}</label>
        {renderValue(distribution.purchases)}
        <input
          type="range"
          min={0}
          max={100}
          value={distribution.purchases}
          onChange={(e) => handleChange('purchases', Number(e.target.value))}
          className={styles.slider}
        />
      </div>
    </div>
  );
};
