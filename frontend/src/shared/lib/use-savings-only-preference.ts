import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '@app/store';

const STORAGE_KEY = 'app_savings_only';

export const useSavingsOnlyPreference = (): [boolean, (value: boolean) => void] => {
  const user = useSelector((state: RootState) => state.user);
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

  const value = user?.savingsOnly !== undefined ? user.savingsOnly : savingsOnly;

  useEffect(() => {
    if (user?.savingsOnly !== undefined) {
      setSavingsOnlyState(user.savingsOnly);
      try {
        localStorage.setItem(STORAGE_KEY, String(user.savingsOnly));
      } catch {
        // ignore
      }
    }
  }, [user?.savingsOnly]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, String(value));
    } catch {
      // ignore
    }
  }, [value]);

  return [value, setSavingsOnlyState];
};
