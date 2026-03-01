import React from 'react';
import styles from './Switch.module.scss';

interface SwitchProps {
  checked: boolean;
  onChange: () => void;
  leftLabel?: string;
  rightLabel?: string;
  size?: 'sm' | 'md';
}

const Switch: React.FC<SwitchProps> = ({
  checked,
  onChange,
  leftLabel,
  rightLabel,
  size = 'md',
}) => (
  <div className={`${styles.switchWrap} ${styles[size]}`}>
    {leftLabel && (
      <span className={!checked ? styles.active : ''}>{leftLabel}</span>
    )}
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      className={styles.switch}
      onClick={onChange}
    >
      <span className={styles.thumb} />
    </button>
    {rightLabel && (
      <span className={checked ? styles.active : ''}>{rightLabel}</span>
    )}
  </div>
);

export default Switch;
