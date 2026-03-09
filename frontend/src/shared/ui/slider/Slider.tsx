import React, { useState, useEffect, useRef, useCallback } from 'react';
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
  /** Debounce onChange by this many ms; value updates immediately in UI */
  debounceMs?: number;
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
  debounceMs,
}) => {
  const [localValue, setLocalValue] = useState(value);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  useEffect(() => {
    setLocalValue(value);
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
      debounceRef.current = null;
    }
  }, [value]);

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  const handleInputChange = useCallback(
    (raw: number) => {
      setLocalValue(raw);
      if (debounceMs != null && debounceMs > 0) {
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => {
          debounceRef.current = null;
          onChangeRef.current(raw);
        }, debounceMs);
      } else {
        onChangeRef.current(raw);
      }
    },
    [debounceMs]
  );

  const displayValue = debounceMs != null && debounceMs > 0 ? localValue : value;
  const percent = max > min ? ((displayValue - min) / (max - min)) * 100 : 100;

  return (
    <div className={`${styles.root} ${disabled ? styles.disabled : ''} ${className ?? ''}`}>
      {(label || showValue) && (
        <div className={styles.header}>
          {label && <span className={styles.label}>{label}</span>}
          {showValue && (
            <span className={styles.value}>
              {displayValue}{valueSuffix}
            </span>
          )}
        </div>
      )}
      <div className={styles.trackWrap}>
        <div
          className={styles.trackFill}
          style={{
            width: `${percent}%`,
            borderRadius: percent >= 99.5 ? '999px' : '999px 0 0 999px',
            ...(color ? { backgroundColor: color } : {}),
          }}
        />
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={displayValue}
          disabled={disabled}
          className={styles.input}
          onChange={(e) => handleInputChange(Number(e.target.value))}
          aria-label={label}
        />
      </div>
    </div>
  );
};
