import { MultiCurrencyAmount } from '../schemas/multi-currency-amount.schema';

/**
 * Builds a single-currency multi-currency document from an amount and ISO currency code.
 */
export function toMultiCurrencyAmount(
  value: number,
  currency: string,
): MultiCurrencyAmount {
  const curr = currency.toUpperCase();
  return {
    USD: curr === 'USD' ? value : 0,
    EUR: curr === 'EUR' ? value : 0,
    RUB: curr === 'RUB' ? value : 0,
    BYN: curr === 'BYN' ? value : 0,
  };
}

/**
 * Reads the stored amount in the given currency code (USD, EUR, RUB, BYN).
 */
export function getAmountInCurrency(
  amount: MultiCurrencyAmount,
  currency: string,
): number {
  const c = (currency || 'USD').toUpperCase();
  if (c === 'USD') return amount.USD ?? 0;
  if (c === 'EUR') return amount.EUR ?? 0;
  if (c === 'RUB') return amount.RUB ?? 0;
  if (c === 'BYN') return amount.BYN ?? 0;
  return amount.USD ?? amount.EUR ?? amount.RUB ?? amount.BYN ?? 0;
}
