import { Injectable } from '@nestjs/common';
import { Types } from 'mongoose';
import { TransactionService } from '../transaction/transaction.service';
import { BudgetService } from '../budget/budget.service';

const MS_DAY = 86400000;

/**
 * Analytics over transactions; amounts use the user's budget currency when set, else USD.
 */
@Injectable()
export class AnalyticsService {
  constructor(
    private readonly transactionService: TransactionService,
    private readonly budgetService: BudgetService,
  ) {}

  private async resolveCurrency(
    userId: Types.ObjectId,
    roomId?: Types.ObjectId,
  ): Promise<string> {
    const b = await this.budgetService.findForUser(userId, roomId);
    return (b?.currency ?? 'USD').toUpperCase();
  }

  private pctChange(prev: number, curr: number): number {
    if (prev === 0) return curr === 0 ? 0 : 100;
    return Math.round(((curr - prev) / Math.abs(prev)) * 10000) / 100;
  }

  /**
   * Time series buckets; change is percent vs previous bucket (savings series).
   */
  async trends(
    userId: Types.ObjectId,
    period: 'week' | 'month' | 'quarter' | 'year',
    roomId?: Types.ObjectId,
  ): Promise<
    {
      period: string;
      income: number;
      expense: number;
      savings: number;
      change: number;
    }[]
  > {
    const currency = await this.resolveCurrency(userId, roomId);
    const now = new Date();
    let bucketSpecs: { from: Date; to: Date; label: string }[];

    if (period === 'week') {
      bucketSpecs = [];
      for (let w = 7; w >= 0; w--) {
        const to = new Date(now.getTime() - w * 7 * MS_DAY);
        const from = new Date(to.getTime() - 7 * MS_DAY);
        bucketSpecs.push({
          from,
          to,
          label: from.toISOString().slice(0, 10),
        });
      }
    } else if (period === 'month') {
      bucketSpecs = [];
      for (let i = 11; i >= 0; i--) {
        const ref = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i, 1));
        const from = new Date(ref);
        const to = new Date(
          Date.UTC(ref.getUTCFullYear(), ref.getUTCMonth() + 1, 0, 23, 59, 59, 999),
        );
        bucketSpecs.push({
          from,
          to,
          label: from.toISOString().slice(0, 7),
        });
      }
    } else if (period === 'quarter') {
      bucketSpecs = [];
      const y0 = now.getUTCFullYear();
      const q0 = Math.floor(now.getUTCMonth() / 3);
      for (let i = 7; i >= 0; i--) {
        let tq = q0 - i;
        let ty = y0;
        while (tq < 0) {
          tq += 4;
          ty -= 1;
        }
        const qStartMonth = tq * 3;
        const from = new Date(Date.UTC(ty, qStartMonth, 1));
        const to = new Date(Date.UTC(ty, qStartMonth + 3, 0, 23, 59, 59, 999));
        bucketSpecs.push({
          from,
          to,
          label: `${ty}-Q${tq + 1}`,
        });
      }
    } else {
      bucketSpecs = [];
      for (let i = 4; i >= 0; i--) {
        const y = now.getUTCFullYear() - i;
        const from = new Date(Date.UTC(y, 0, 1));
        const to = new Date(Date.UTC(y, 11, 31, 23, 59, 59, 999));
        bucketSpecs.push({
          from,
          to,
          label: String(y),
        });
      }
    }

    const rows: {
      period: string;
      income: number;
      expense: number;
      savings: number;
      change: number;
    }[] = [];

    let prevSavings = 0;
    for (let i = 0; i < bucketSpecs.length; i++) {
      const { from, to, label } = bucketSpecs[i];
      const { income, expense, savings } =
        await this.transactionService.aggregateIncomeExpenseSavings(
          userId,
          { roomId, from, to },
          currency,
        );
      const change = i === 0 ? 0 : this.pctChange(prevSavings, savings);
      prevSavings = savings;
      rows.push({
        period: label,
        income,
        expense,
        savings,
        change,
      });
    }
    return rows;
  }

  /**
   * Compares two intervals; change is percent difference of savings between period2 and period1.
   */
  async compare(
    userId: Types.ObjectId,
    from1: Date,
    to1: Date,
    from2: Date,
    to2: Date,
    roomId?: Types.ObjectId,
  ): Promise<{
    period1: { income: number; expense: number };
    period2: { income: number; expense: number };
    change: number;
  }> {
    const currency = await this.resolveCurrency(userId, roomId);
    const p1 = await this.transactionService.aggregateIncomeExpenseSavings(
      userId,
      { roomId, from: from1, to: to1 },
      currency,
    );
    const p2 = await this.transactionService.aggregateIncomeExpenseSavings(
      userId,
      { roomId, from: from2, to: to2 },
      currency,
    );
    const change = this.pctChange(p1.savings, p2.savings);
    return {
      period1: { income: p1.income, expense: p1.expense },
      period2: { income: p2.income, expense: p2.expense },
      change,
    };
  }

  /**
   * Forecasts next months using simple linear regression on monthly savings totals.
   */
  async forecast(
    userId: Types.ObjectId,
    months: number,
    roomId?: Types.ObjectId,
  ): Promise<
    {
      month: string;
      predictedIncome: number;
      predictedExpense: number;
      predictedSavings: number;
    }[]
  > {
    const currency = await this.resolveCurrency(userId, roomId);
    const now = new Date();
    const historyMonths = 12;
    const monthlyIncome: number[] = [];
    const monthlyExpense: number[] = [];
    for (let i = historyMonths - 1; i >= 0; i--) {
      const ref = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i, 1));
      const from = new Date(ref);
      const to = new Date(
        Date.UTC(ref.getUTCFullYear(), ref.getUTCMonth() + 1, 0, 23, 59, 59, 999),
      );
      const agg = await this.transactionService.aggregateIncomeExpenseSavings(
        userId,
        { roomId, from, to },
        currency,
      );
      monthlyIncome.push(agg.income);
      monthlyExpense.push(agg.expense);
    }

    const predict = (series: number[], horizon: number): number[] => {
      const n = series.length;
      if (n === 0) return Array(horizon).fill(0);
      const xs = series.map((_, i) => i);
      const meanX = xs.reduce((a, b) => a + b, 0) / n;
      const meanY = series.reduce((a, b) => a + b, 0) / n;
      let num = 0;
      let den = 0;
      for (let i = 0; i < n; i++) {
        num += (xs[i] - meanX) * (series[i] - meanY);
        den += (xs[i] - meanX) ** 2;
      }
      const slope = den === 0 ? 0 : num / den;
      const intercept = meanY - slope * meanX;
      const out: number[] = [];
      for (let h = 1; h <= horizon; h++) {
        const x = n - 1 + h;
        out.push(Math.max(0, slope * x + intercept));
      }
      return out;
    };

    const incPred = predict(monthlyIncome, months);
    const expPred = predict(monthlyExpense, months);
    const result: {
      month: string;
      predictedIncome: number;
      predictedExpense: number;
      predictedSavings: number;
    }[] = [];

    for (let h = 0; h < months; h++) {
      const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + h + 1, 1));
      const predictedIncome = Math.round(incPred[h] * 100) / 100;
      const predictedExpense = Math.round(expPred[h] * 100) / 100;
      const predictedSavings = Math.round((predictedIncome - predictedExpense) * 100) / 100;
      result.push({
        month: d.toISOString().slice(0, 7),
        predictedIncome,
        predictedExpense,
        predictedSavings,
      });
    }
    return result;
  }

  /**
   * Expense share by category; trend vs previous period of equal length (expense delta).
   */
  async categoryBreakdown(
    userId: Types.ObjectId,
    from?: Date,
    to?: Date,
    roomId?: Types.ObjectId,
  ): Promise<
    {
      category: string;
      amount: number;
      percentage: number;
      trend: 'up' | 'down' | 'stable';
    }[]
  > {
    const currency = await this.resolveCurrency(userId, roomId);
    const end = to ?? new Date();
    const start =
      from ??
      new Date(end.getTime() - 30 * MS_DAY);
    const duration = end.getTime() - start.getTime();
    const prevEnd = new Date(start.getTime());
    const prevStart = new Date(start.getTime() - duration);

    const curMap = await this.transactionService.sumExpenseByCategoryMap(
      userId,
      { roomId, from: start, to: end },
      currency,
    );
    const prevMap = await this.transactionService.sumExpenseByCategoryMap(
      userId,
      { roomId, from: prevStart, to: prevEnd },
      currency,
    );

    const total = Object.values(curMap).reduce((a, b) => a + b, 0);
    const EPS = 0.01;
    const cats = new Set([...Object.keys(curMap), ...Object.keys(prevMap)]);
    const out: {
      category: string;
      amount: number;
      percentage: number;
      trend: 'up' | 'down' | 'stable';
    }[] = [];

    for (const category of cats) {
      const amount = curMap[category] ?? 0;
      const prev = prevMap[category] ?? 0;
      const percentage =
        total > 0 ? Math.round((amount / total) * 10000) / 100 : 0;
      let trend: 'up' | 'down' | 'stable' = 'stable';
      if (amount - prev > EPS) trend = 'up';
      else if (prev - amount > EPS) trend = 'down';
      out.push({ category, amount, percentage, trend });
    }
    out.sort((a, b) => b.amount - a.amount);
    return out;
  }
}
