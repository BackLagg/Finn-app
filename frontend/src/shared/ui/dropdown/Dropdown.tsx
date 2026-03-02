import React, { useState, useRef, useEffect, useCallback } from 'react';
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
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((opt) => opt.value === value);
  const currentIndex = options.findIndex((opt) => opt.value === value);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = useCallback(
    (optionValue: string) => {
      onChange(optionValue);
      setIsOpen(false);
      setFocusedIndex(-1);
    },
    [onChange]
  );

  useEffect(() => {
    if (isOpen) setFocusedIndex(currentIndex >= 0 ? currentIndex : 0);
  }, [isOpen, currentIndex]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        setIsOpen(true);
      }
      return;
    }
    if (e.key === 'Escape') {
      e.preventDefault();
      e.stopPropagation();
      setIsOpen(false);
      setFocusedIndex(-1);
      return;
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setFocusedIndex((i) => (i < options.length - 1 ? i + 1 : 0));
      return;
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      setFocusedIndex((i) => (i > 0 ? i - 1 : options.length - 1));
      return;
    }
    if (e.key === 'Enter') {
      e.preventDefault();
      const opt = options[focusedIndex >= 0 ? focusedIndex : 0];
      if (opt) handleSelect(opt.value);
      return;
    }
  };

  useEffect(() => {
    if (isOpen && focusedIndex >= 0 && menuRef.current) {
      const item = menuRef.current.children[focusedIndex] as HTMLElement;
      item?.scrollIntoView({ block: 'nearest' });
    }
  }, [isOpen, focusedIndex]);

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
        <div className={styles.dropdown__menu} ref={menuRef} role="listbox">
          {options.map((option, idx) => (
            <button
              key={option.value}
              type="button"
              role="option"
              aria-selected={option.value === value}
              tabIndex={-1}
              className={`${styles.dropdown__item} ${
                option.value === value ? styles['dropdown__item--active'] : ''
              } ${idx === focusedIndex ? styles['dropdown__item--focused'] : ''}`}
              onClick={() => handleSelect(option.value)}
              onMouseEnter={() => setFocusedIndex(idx)}
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
