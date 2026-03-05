import React from 'react';
import styles from './Slider.module.scss';

export interface SliderProps {
  value: number;
  min?: number;
  max?: number;
  step?: number;
  onChange: (value: number) => void;
  label?: string;
  showValue?: boolean;
  valueSuffix?: string;
  color?: string;
  className?: string;
  disabled?: boolean;
}

export const Slider: React.FC<SliderProps> = ({
  value,
  min = 0,
  max = 100,
  step = 1,
  onChange,
  label,
  showValue = true,
  valueSuffix = '',
  color,
  className,
  disabled = false,
}) => {
  const percent = max > min ? ((value - min) / (max - min)) * 100 : 0;

  return (
    <div className={`${styles.root} ${disabled ? styles.disabled : ''} ${className ?? ''}`}>
      {(label || showValue) && (
        <div className={styles.header}>
          {label && <span className={styles.label}>{label}</span>}
          {showValue && (
            <span className={styles.value}>
              {value}{valueSuffix}
            </span>
          )}
        </div>
      )}
      <div className={styles.trackWrap}>
        <div
          className={styles.trackFill}
          style={{
            width: `${percent}%`,
            ...(color ? { backgroundColor: color } : {}),
          }}
        />
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          disabled={disabled}
          className={styles.input}
          onChange={(e) => onChange(Number(e.target.value))}
          aria-label={label}
        />
      </div>
    </div>
  );
};
