import React from 'react';
import axios from 'axios';
import { CurrencyRates } from '@shared/lib/currency';

const EXCHANGE_RATE_API = 'https://api.exchangerate-api.com/v4/latest/USD';
const CACHE_KEY = 'currency_rates';
const CACHE_DURATION = 3600000;

interface ExchangeRateResponse {
  rates: {
    EUR: number;
    RUB: number;
    BYN: number;
    USD: number;
  };
  date: string;
}

export const fetchCurrencyRates = async (): Promise<CurrencyRates> => {
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (cached) {
      const { rates, timestamp } = JSON.parse(cached);
      if (Date.now() - timestamp < CACHE_DURATION) {
        return rates;
      }
    }

    const response = await axios.get<ExchangeRateResponse>(EXCHANGE_RATE_API);
    const { rates } = response.data;

    const currencyRates: CurrencyRates = {
      EUR_to_USD: 1 / rates.EUR,
      RUB_to_USD: 1 / rates.RUB,
      BYN_to_USD: 1 / rates.BYN,
      USD_to_EUR: rates.EUR,
      USD_to_RUB: rates.RUB,
      USD_to_BYN: rates.BYN,
    };

    localStorage.setItem(
      CACHE_KEY,
      JSON.stringify({
        rates: currencyRates,
        timestamp: Date.now(),
      })
    );

    return currencyRates;
  } catch (error) {
    console.error('Failed to fetch currency rates:', error);
    
    const fallbackRates: CurrencyRates = {
      EUR_to_USD: 1.09,
      RUB_to_USD: 0.011,
      BYN_to_USD: 0.31,
      USD_to_EUR: 0.92,
      USD_to_RUB: 91.5,
      USD_to_BYN: 3.2,
    };
    
    return fallbackRates;
  }
};

export const useCurrencyRates = () => {
  const [rates, setRates] = React.useState<CurrencyRates | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    fetchCurrencyRates()
      .then((fetchedRates) => {
        setRates(fetchedRates);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  return { rates, loading, error };
};
