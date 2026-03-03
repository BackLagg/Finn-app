import { useState, useEffect } from 'react';
import type { Distribution } from './distribution';

const STORAGE_KEY = 'app_distribution';

const defaultDistribution: Distribution = { savings: 20, investments: 10, purchases: 70 };

function parseStored(value: string | null): Distribution | null {
  if (!value) return null;
  try {
    const o = JSON.parse(value);
    if (typeof o?.savings === 'number' && typeof o?.investments === 'number' && typeof o?.purchases === 'number') {
      const sum = o.savings + o.investments + o.purchases;
      if (sum === 100) return o as Distribution;
    }
  } catch {
    // ignore
  }
  return null;
}

export const useDistributionPreference = (): [Distribution, (value: Distribution) => void] => {
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

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(distribution));
    } catch {
      // ignore
    }
  }, [distribution]);

  return [distribution, setDistributionState];
};
