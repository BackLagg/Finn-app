import { useState, useEffect } from 'react';

const STORAGE_KEY = 'app_monthly_income';

export const useMonthlyIncomePreference = (): [number, (value: number) => void] => {
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

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, String(amount));
    } catch {
      // ignore
    }
  }, [amount]);

  return [amount, setAmountState];
};
