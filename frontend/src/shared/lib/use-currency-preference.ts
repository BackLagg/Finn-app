import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '@app/store';
import { Currency } from './currency';

const STORAGE_KEY = 'app_currency';

export const useCurrencyPreference = (): [Currency, (currency: Currency) => void] => {
  const user = useSelector((state: RootState) => state.user);
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

  const value = (user?.currency && ['USD', 'EUR', 'RUB', 'BYN'].includes(user.currency))
    ? (user.currency as Currency)
    : currency;

  useEffect(() => {
    if (user?.currency && ['USD', 'EUR', 'RUB', 'BYN'].includes(user.currency)) {
      setCurrencyState(user.currency as Currency);
      try {
        localStorage.setItem(STORAGE_KEY, user.currency);
      } catch {
        // ignore
      }
    }
  }, [user?.currency]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, value);
    } catch {
      // ignore
    }
  }, [value]);

  return [value, setCurrencyState];
};
