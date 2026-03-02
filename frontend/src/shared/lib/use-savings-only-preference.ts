import { useState, useEffect } from 'react';

const STORAGE_KEY = 'app_savings_only';

export const useSavingsOnlyPreference = (): [boolean, (value: boolean) => void] => {
  const [savingsOnly, setSavingsOnlyState] = useState<boolean>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored === 'true') return true;
      if (stored === 'false') return false;
    } catch {
      // ignore
    }
    return false;
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, String(savingsOnly));
    } catch {
      // ignore
    }
  }, [savingsOnly]);

  return [savingsOnly, setSavingsOnlyState];
};
