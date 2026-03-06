import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '@app/store';

const STORAGE_KEY = 'app_monthly_income';

export const useMonthlyIncomePreference = (): [number, (value: number) => void] => {
  const user = useSelector((state: RootState) => state.user);
  const [amount, setAmountState] = useState<number>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored != null) {
        const n = Number(stored);
        if (Number.isFinite(n) && n >= 0) return n;
      }
    } catch {
      // ignore
    }
    return 0;
  });

  const value = user?.monthlyIncome != null && Number.isFinite(user.monthlyIncome) && user.monthlyIncome >= 0
    ? user.monthlyIncome
    : amount;

  useEffect(() => {
    if (user?.monthlyIncome != null && Number.isFinite(user.monthlyIncome) && user.monthlyIncome >= 0) {
      setAmountState(user.monthlyIncome);
      try {
        localStorage.setItem(STORAGE_KEY, String(user.monthlyIncome));
      } catch {
        // ignore
      }
    }
  }, [user?.monthlyIncome]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored != null) {
        const n = Number(stored);
        if (Number.isFinite(n) && n >= 0) setAmountState(n);
      }
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, String(value));
    } catch {
      // ignore
    }
  }, [value]);

  return [value, setAmountState];
};
