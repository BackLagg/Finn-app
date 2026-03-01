export type Currency = 'USD' | 'EUR' | 'RUB' | 'BYN';

export interface MultiCurrencyAmount {
  USD: number;
  EUR: number;
  RUB: number;
  BYN: number;
}

export interface CurrencyRates {
  EUR_to_USD: number;
  RUB_to_USD: number;
  BYN_to_USD: number;
  USD_to_EUR: number;
  USD_to_RUB: number;
  USD_to_BYN: number;
}

export const convertAmount = (
  amount: number,
  fromCurrency: Currency,
  toCurrency: Currency,
  rates: CurrencyRates
): number => {
  if (fromCurrency === toCurrency) return amount;

  if (fromCurrency === 'USD') {
    switch (toCurrency) {
      case 'EUR': return amount * rates.USD_to_EUR;
      case 'RUB': return amount * rates.USD_to_RUB;
      case 'BYN': return amount * rates.USD_to_BYN;
      default: return amount;
    }
  }

  const amountInUSD = 
    fromCurrency === 'EUR' ? amount / rates.EUR_to_USD :
    fromCurrency === 'RUB' ? amount / rates.RUB_to_USD :
    fromCurrency === 'BYN' ? amount / rates.BYN_to_USD :
    amount;

  return convertAmount(amountInUSD, 'USD', toCurrency, rates);
};

export const createMultiCurrencyAmount = (
  amount: number,
  currency: Currency,
  rates: CurrencyRates
): MultiCurrencyAmount => {
  return {
    USD: convertAmount(amount, currency, 'USD', rates),
    EUR: convertAmount(amount, currency, 'EUR', rates),
    RUB: convertAmount(amount, currency, 'RUB', rates),
    BYN: convertAmount(amount, currency, 'BYN', rates),
  };
};

export const currencySymbols: Record<Currency, string> = {
  USD: '$',
  EUR: '€',
  RUB: '₽',
  BYN: 'Br',
};
