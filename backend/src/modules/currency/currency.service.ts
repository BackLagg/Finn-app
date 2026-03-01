import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';

export interface CurrencyRates {
  EUR_to_USD: number;
  RUB_to_USD: number;
  BYN_to_USD: number;
  USD_to_EUR: number;
  USD_to_RUB: number;
  USD_to_BYN: number;
}

export interface MultiCurrencyAmount {
  USD: number;
  EUR: number;
  RUB: number;
  BYN: number;
}

@Injectable()
export class CurrencyService {
  private readonly logger = new Logger(CurrencyService.name);
  private cachedRates: CurrencyRates | null = null;
  private lastFetch: number = 0;
  private readonly CACHE_DURATION = 3600000;
  private readonly API_URL = 'https://api.exchangerate-api.com/v4/latest/USD';

  async getCurrencyRates(): Promise<CurrencyRates> {
    if (
      this.cachedRates &&
      Date.now() - this.lastFetch < this.CACHE_DURATION
    ) {
      return this.cachedRates;
    }

    try {
      const response = await axios.get(this.API_URL);
      const { rates } = response.data;

      this.cachedRates = {
        EUR_to_USD: 1 / rates.EUR,
        RUB_to_USD: 1 / rates.RUB,
        BYN_to_USD: 1 / rates.BYN,
        USD_to_EUR: rates.EUR,
        USD_to_RUB: rates.RUB,
        USD_to_BYN: rates.BYN,
      };

      this.lastFetch = Date.now();
      this.logger.log('Currency rates updated successfully');

      return this.cachedRates;
    } catch (error) {
      this.logger.error('Failed to fetch currency rates', error);

      if (this.cachedRates) {
        return this.cachedRates;
      }

      return {
        EUR_to_USD: 1.09,
        RUB_to_USD: 0.011,
        BYN_to_USD: 0.31,
        USD_to_EUR: 0.92,
        USD_to_RUB: 91.5,
        USD_to_BYN: 3.2,
      };
    }
  }

  async convertAmount(
    amount: number,
    fromCurrency: string,
    toCurrency: string,
  ): Promise<number> {
    if (fromCurrency === toCurrency) return amount;

    const rates = await this.getCurrencyRates();

    if (fromCurrency === 'USD') {
      switch (toCurrency) {
        case 'EUR':
          return amount * rates.USD_to_EUR;
        case 'RUB':
          return amount * rates.USD_to_RUB;
        case 'BYN':
          return amount * rates.USD_to_BYN;
        default:
          return amount;
      }
    }

    const amountInUSD =
      fromCurrency === 'EUR'
        ? amount / rates.EUR_to_USD
        : fromCurrency === 'RUB'
        ? amount / rates.RUB_to_USD
        : fromCurrency === 'BYN'
        ? amount / rates.BYN_to_USD
        : amount;

    return this.convertAmount(amountInUSD, 'USD', toCurrency);
  }

  async createMultiCurrencyAmount(
    amount: number,
    currency: string,
  ): Promise<MultiCurrencyAmount> {
    return {
      USD: await this.convertAmount(amount, currency, 'USD'),
      EUR: await this.convertAmount(amount, currency, 'EUR'),
      RUB: await this.convertAmount(amount, currency, 'RUB'),
      BYN: await this.convertAmount(amount, currency, 'BYN'),
    };
  }
}
