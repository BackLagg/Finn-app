import React from 'react';
import { motion } from 'framer-motion';
import styles from './Toggle.module.scss';

export interface ToggleOption {
  value: string;
  label: string;
  icon?: React.ReactNode;
}

interface ToggleProps {
  options: ToggleOption[];
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

export const Toggle: React.FC<ToggleProps> = ({
  options,
  value,
  onChange,
  className,
}) => {
  const selectedIndex = options.findIndex((opt) => opt.value === value);

  return (
    <div className={`${styles.toggle} ${className || ''}`}>
      <div className={styles.toggle__track}>
        <motion.div
          className={styles.toggle__indicator}
          initial={false}
          animate={{
            x: `${selectedIndex * 100}%`,
          }}
          transition={{
            type: 'spring',
            stiffness: 300,
            damping: 30,
          }}
        />
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            className={`${styles.toggle__option} ${
              option.value === value ? styles['toggle__option--active'] : ''
            }`}
            onClick={() => onChange(option.value)}
          >
            {option.icon && (
              <span className={styles.toggle__icon}>{option.icon}</span>
            )}
            <span className={styles.toggle__label}>{option.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default Toggle;
