import { useState, useEffect } from 'react';
import { Currency } from './currency';

const STORAGE_KEY = 'app_currency';

export const useCurrencyPreference = (): [Currency, (currency: Currency) => void] => {
  const [currency, setCurrencyState] = useState<Currency>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored && ['USD', 'EUR', 'RUB', 'BYN'].includes(stored)) {
        return stored as Currency;
      }
    } catch {
      // ignore
    }
    return 'USD';
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, currency);
    } catch {
      // ignore
    }
  }, [currency]);

  return [currency, setCurrencyState];
};
