import React, { useState, useRef, useEffect } from 'react';
import { FiChevronDown } from 'react-icons/fi';
import styles from './Dropdown.module.scss';

export interface DropdownOption {
  value: string;
  label: string;
  icon?: React.ReactNode;
}

interface DropdownProps {
  options: DropdownOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
  className?: string;
}

export const Dropdown: React.FC<DropdownProps> = ({
  options,
  value,
  onChange,
  placeholder = 'Выберите...',
  label,
  className,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((opt) => opt.value === value);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (optionValue: string) => {
    onChange(optionValue);
    setIsOpen(false);
  };

  return (
    <div className={`${styles.dropdown} ${className || ''}`} ref={dropdownRef}>
      {label && <label className={styles.dropdown__label}>{label}</label>}
      <button
        type="button"
        className={styles.dropdown__trigger}
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className={styles.dropdown__selected}>
          {selectedOption?.icon && (
            <span className={styles.dropdown__icon}>{selectedOption.icon}</span>
          )}
          <span>{selectedOption?.label || placeholder}</span>
        </div>
        <FiChevronDown
          className={`${styles.dropdown__arrow} ${isOpen ? styles['dropdown__arrow--open'] : ''}`}
        />
      </button>
      {isOpen && (
        <div className={styles.dropdown__menu}>
          {options.map((option) => (
            <button
              key={option.value}
              type="button"
              className={`${styles.dropdown__item} ${
                option.value === value ? styles['dropdown__item--active'] : ''
              }`}
              onClick={() => handleSelect(option.value)}
            >
              {option.icon && (
                <span className={styles.dropdown__icon}>{option.icon}</span>
              )}
              <span>{option.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default Dropdown;
