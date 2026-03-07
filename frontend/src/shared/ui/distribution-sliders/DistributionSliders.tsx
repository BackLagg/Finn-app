import React, { useState, useEffect, useRef, useCallback } from 'react';
import { IoRefreshOutline } from 'react-icons/io5';
import type { Distribution } from '@shared/lib/distribution';
import { clampDistribution } from '@shared/lib/distribution';
import { Slider } from '../slider';
import styles from './DistributionSliders.module.scss';

const DEBOUNCE_MS = 4000;

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
  /** Distribution to show immediately on reset (should match what onReset applies). */
  resetDistribution?: Distribution;
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
  resetDistribution,
  resetLabel = 'Reset',
}) => {
  const [localDistribution, setLocalDistribution] = useState(distribution);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  useEffect(() => {
    setLocalDistribution(distribution);
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
      debounceRef.current = null;
    }
  }, [distribution.savings, distribution.investments, distribution.purchases]);

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  const handleResetClick = useCallback(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
      debounceRef.current = null;
    }
    if (resetDistribution != null) {
      setLocalDistribution(resetDistribution);
    }
    onReset?.();
  }, [onReset, resetDistribution]);

  const handleChange = useCallback(
    (key: keyof Distribution, value: number) => {
      const next = clampDistribution(localDistribution, key, value, savingsOnly);
      setLocalDistribution(next);

      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
      debounceRef.current = setTimeout(() => {
        debounceRef.current = null;
        onChangeRef.current(next);
      }, DEBOUNCE_MS);
    },
    [localDistribution, savingsOnly]
  );

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
            onClick={handleResetClick}
            className={styles.resetBtn}
            title={resetLabel}
          >
            <IoRefreshOutline size={20} />
          </button>
        </div>
      )}
      <div className={styles.row}>
        <label className={styles.label}>{savingsLabel}</label>
        {renderValue(localDistribution.savings)}
        <Slider
          value={localDistribution.savings}
          min={0}
          max={100}
          step={1}
          onChange={(v) => handleChange('savings', v)}
          showValue={false}
          className={styles.slider}
        />
      </div>
      <div className={savingsOnly ? `${styles.row} ${styles.rowDisabled}` : styles.row}>
        <label className={styles.label}>{investmentsLabel}</label>
        {renderValue(localDistribution.investments)}
        <Slider
          value={localDistribution.investments}
          min={0}
          max={100}
          step={1}
          onChange={(v) => handleChange('investments', v)}
          showValue={false}
          disabled={savingsOnly}
          className={styles.slider}
        />
      </div>
      <div className={styles.row}>
        <label className={styles.label}>{purchasesLabel}</label>
        {renderValue(localDistribution.purchases)}
        <Slider
          value={localDistribution.purchases}
          min={0}
          max={100}
          step={1}
          onChange={(v) => handleChange('purchases', v)}
          showValue={false}
          className={styles.slider}
        />
      </div>
    </div>
  );
};
