import React from 'react';
import styles from './ProgressBar.module.scss';

export interface ProgressBarProps {
  value: number;
  max?: number;
  color?: string;
  height?: 'sm' | 'md' | 'lg';
  className?: string;
  label?: string;
  showValue?: boolean;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  value,
  max = 100,
  color,
  height = 'md',
  className,
  label,
  showValue = false,
}) => {
  const percent = max > 0 ? Math.min(100, Math.max(0, (value / max) * 100)) : 0;

  return (
    <div className={`${styles.root} ${styles[height]} ${className ?? ''}`}>
      {(label || showValue) && (
        <div className={styles.header}>
          {label && <span className={styles.label}>{label}</span>}
          {showValue && (
            <span className={styles.value}>{Math.round(percent)}%</span>
          )}
        </div>
      )}
      <div className={styles.track}>
        <div
          className={styles.fill}
          style={{
            width: `${percent}%`,
            ...(color ? { backgroundColor: color } : {}),
          }}
        />
      </div>
    </div>
  );
};
