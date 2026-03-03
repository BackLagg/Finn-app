import type { Currency } from './currency';

export interface Distribution {
  savings: number;
  investments: number;
  purchases: number;
}

const USD_BRACKETS = [
  { threshold: 0, savings: 0, investments: 0, purchases: 100 },
  { threshold: 500, savings: 10, investments: 5, purchases: 85 },
  { threshold: 1000, savings: 15, investments: 5, purchases: 80 },
  { threshold: 2000, savings: 20, investments: 10, purchases: 70 },
  { threshold: 3500, savings: 25, investments: 15, purchases: 60 },
  { threshold: 5000, savings: 30, investments: 20, purchases: 50 },
];

const CURRENCY_TO_USD_APPROX: Record<Currency, number> = {
  USD: 1,
  EUR: 1.1,
  RUB: 0.011,
  BYN: 0.31,
};

export function getProgressiveDistribution(amount: number, currency: Currency = 'USD'): Distribution {
  const amountUSD = amount * CURRENCY_TO_USD_APPROX[currency];
  for (let i = USD_BRACKETS.length - 1; i >= 0; i--) {
    if (amountUSD >= USD_BRACKETS[i].threshold) {
      return {
        savings: USD_BRACKETS[i].savings,
        investments: USD_BRACKETS[i].investments,
        purchases: USD_BRACKETS[i].purchases,
      };
    }
  }
  return { savings: 0, investments: 0, purchases: 100 };
}

export function normalizeDistribution(savings: number, investments: number, purchases: number): Distribution {
  const total = savings + investments + purchases;
  if (total <= 0) return { savings: 34, investments: 33, purchases: 33 };
  const scale = 100 / total;
  return {
    savings: Math.round(savings * scale),
    investments: Math.round(investments * scale),
    purchases: Math.round(purchases * scale),
  };
}

export function clampDistribution(
  current: Distribution,
  key: keyof Distribution,
  value: number,
  savingsOnly: boolean
): Distribution {
  const clamped = Math.max(0, Math.min(100, Math.round(value)));
  const rest = 100 - clamped;
  if (savingsOnly) {
    const next: Distribution = {
      savings: key === 'savings' ? clamped : rest,
      investments: 0,
      purchases: key === 'purchases' ? clamped : rest,
    };
    return normalizeDistribution(next.savings, next.investments, next.purchases);
  }
  const others: (keyof Distribution)[] = (['savings', 'investments', 'purchases'] as const).filter((k) => k !== key);
  const otherSum = others.reduce((s, k) => s + current[k], 0);
  const next = { ...current, [key]: clamped };
  if (otherSum <= 0) {
    const perOther = Math.floor(rest / others.length);
    others.forEach((k, i) => {
      next[k] = i === others.length - 1 ? rest - perOther * (others.length - 1) : perOther;
    });
  } else {
    others.forEach((k) => {
      next[k] = Math.round((current[k] / otherSum) * rest);
    });
  }
  return normalizeDistribution(next.savings, next.investments, next.purchases);
}
