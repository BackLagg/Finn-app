import React, { useLayoutEffect, useRef, useState } from 'react';
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
  const trackRef = useRef<HTMLDivElement | null>(null);
  const [step, setStep] = useState(0);

  const selectedIndex = Math.max(
    0,
    options.findIndex((opt) => opt.value === value),
  );

  useLayoutEffect(() => {
    if (!trackRef.current || options.length === 0) return;
    const rect = trackRef.current.getBoundingClientRect();
    const horizontalPadding = 8; // padding: 4px left + 4px right
    const availableWidth = rect.width - horizontalPadding;
    if (availableWidth <= 0) return;
    setStep(availableWidth / options.length);
  }, [options.length]);

  const handleToggleClick = () => {
    if (options.length < 2) return;
    const nextIndex = (selectedIndex + 1) % options.length;
    onChange(options[nextIndex].value);
  };

  return (
    <div
      ref={trackRef}
      className={styles.track}
      onClick={handleToggleClick}
    >
      <motion.div
        className={styles.indicator}
        layout
        initial={false}
        animate={{ x: selectedIndex * step }}
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
        >
          {option.label ?? option.icon}
        </button>
      ))}
    </div>
  );
};
