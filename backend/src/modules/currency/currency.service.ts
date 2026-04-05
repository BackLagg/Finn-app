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

/**
 * Fetches FX rates (USD-based) with hourly cache; supports table/convert for arbitrary ISO codes from API.
 */
@Injectable()
export class CurrencyService {
  private readonly logger = new Logger(CurrencyService.name);
  private cachedUsdRates: Record<string, number> | null = null;
  private lastFetch = 0;
  private readonly CACHE_DURATION = 3600000;
  private readonly API_URL = 'https://api.exchangerate-api.com/v4/latest/USD';

  private async fetchUsdRates(): Promise<Record<string, number>> {
    if (
      this.cachedUsdRates &&
      Date.now() - this.lastFetch < this.CACHE_DURATION
    ) {
      return this.cachedUsdRates;
    }
    try {
      const response = await axios.get<{ rates: Record<string, number> }>(
        this.API_URL,
      );
      this.cachedUsdRates = { USD: 1, ...response.data.rates };
      this.lastFetch = Date.now();
      this.logger.log('Currency rates updated successfully');
      return this.cachedUsdRates;
    } catch (error) {
      this.logger.error('Failed to fetch currency rates', error);
      if (this.cachedUsdRates) return this.cachedUsdRates;
      return {
        USD: 1,
        EUR: 0.92,
        RUB: 91.5,
        BYN: 3.2,
      };
    }
  }

  /**
   * Legacy shape used by receipt/multi-currency helpers (subset of currencies).
   */
  async getCurrencyRates(): Promise<CurrencyRates> {
    const r = await this.fetchUsdRates();
    const eur = r.EUR ?? 0.92;
    const rub = r.RUB ?? 91.5;
    const byn = r.BYN ?? 3.2;
    return {
      EUR_to_USD: 1 / eur,
      RUB_to_USD: 1 / rub,
      BYN_to_USD: 1 / byn,
      USD_to_EUR: eur,
      USD_to_RUB: rub,
      USD_to_BYN: byn,
    };
  }

  /**
   * API contract: rates[C] = units of C per 1 base (same formula as exchangerate-api with USD base).
   */
  async getRatesTable(base = 'USD'): Promise<{
    base: string;
    rates: Record<string, number>;
    updatedAt: string;
  }> {
    const usdTable = await this.fetchUsdRates();
    const b = (base || 'USD').toUpperCase();
    const basePerUsd = usdTable[b];
    if (!basePerUsd) {
      return {
        base: b,
        rates: usdTable,
        updatedAt: new Date(this.lastFetch).toISOString(),
      };
    }
    const out: Record<string, number> = {};
    for (const [code, perUsd] of Object.entries(usdTable)) {
      out[code] = perUsd / basePerUsd;
    }
    out[b] = 1;
    return {
      base: b,
      rates: out,
      updatedAt: new Date(this.lastFetch).toISOString(),
    };
  }

  async convertAmount(
    amount: number,
    fromCurrency: string,
    toCurrency: string,
  ): Promise<number> {
    if (fromCurrency === toCurrency) return amount;
    const rates = await this.fetchUsdRates();
    const f = fromCurrency.toUpperCase();
    const t = toCurrency.toUpperCase();
    const rf = rates[f];
    const rt = rates[t];
    if (rf === undefined || rt === undefined) {
      this.logger.warn(`Missing FX rate for ${f} or ${t}`);
      return Math.round(amount * 10000) / 10000;
    }
    const inUsd = f === 'USD' ? amount : amount / rf;
    const out = t === 'USD' ? inUsd : inUsd * rt;
    return Math.round(out * 10000) / 10000;
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
