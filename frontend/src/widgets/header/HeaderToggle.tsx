import React from 'react';
import { motion } from 'framer-motion';
import styles from './HeaderToggle.module.scss';

interface HeaderToggleOption {
  value: string;
  icon?: React.ReactNode;
  label?: string;
}

interface HeaderToggleProps {
  options: HeaderToggleOption[];
  value: string;
  onChange: (value: string) => void;
}

export const HeaderToggle: React.FC<HeaderToggleProps> = ({
  options,
  value,
  onChange,
}) => {
  const selectedIndex = options.findIndex((opt) => opt.value === value);

  return (
    <div className={styles.track}>
      <motion.div
        className={styles.indicator}
        layout
        initial={false}
        animate={{ x: selectedIndex * 32 }}
        transition={{
          type: 'tween',
          duration: 0.2,
          ease: 'easeInOut',
        }}
      />
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          className={`${styles.option} ${option.value === value ? styles['option--active'] : ''}`}
          onClick={() => onChange(option.value)}
        >
          {option.label ?? option.icon}
        </button>
      ))}
    </div>
  );
};
