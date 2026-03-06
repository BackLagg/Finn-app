import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '@app/store';
import type { Distribution } from './distribution';

const STORAGE_KEY = 'app_distribution';

const defaultDistribution: Distribution = { savings: 20, investments: 10, purchases: 70 };

function isValidDistribution(o: unknown): o is Distribution {
  if (!o || typeof o !== 'object') return false;
  const d = o as Record<string, unknown>;
  return (
    typeof d.savings === 'number' &&
    typeof d.investments === 'number' &&
    typeof d.purchases === 'number' &&
    (d.savings + d.investments + d.purchases) === 100
  );
}

function parseStored(value: string | null): Distribution | null {
  if (!value) return null;
  try {
    const o = JSON.parse(value);
    return isValidDistribution(o) ? o : null;
  } catch {
    return null;
  }
}

export const useDistributionPreference = (): [Distribution, (value: Distribution) => void] => {
  const user = useSelector((state: RootState) => state.user);
  const [distribution, setDistributionState] = useState<Distribution>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      const parsed = parseStored(stored);
      if (parsed) return parsed;
    } catch {
      // ignore
    }
    return defaultDistribution;
  });

  const value = user?.distribution && isValidDistribution(user.distribution)
    ? user.distribution
    : distribution;

  useEffect(() => {
    if (user?.distribution && isValidDistribution(user.distribution)) {
      setDistributionState(user.distribution);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(user.distribution));
      } catch {
        // ignore
      }
    }
  }, [user?.distribution?.savings, user?.distribution?.investments, user?.distribution?.purchases]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
    } catch {
      // ignore
    }
  }, [value]);

  return [value, setDistributionState];
};
