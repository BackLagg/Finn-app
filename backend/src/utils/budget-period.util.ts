export type BudgetPeriod = 'daily' | 'weekly' | 'monthly';

/**
 * Returns UTC bounds for the current rolling budget window: [start of period, now].
 */
export function getCurrentBudgetPeriodBounds(
  period: BudgetPeriod,
  now: Date = new Date(),
): { from: Date; to: Date } {
  const to = now;
  let from: Date;
  if (period === 'daily') {
    from = new Date(
      Date.UTC(
        now.getUTCFullYear(),
        now.getUTCMonth(),
        now.getUTCDate(),
        0,
        0,
        0,
        0,
      ),
    );
  } else if (period === 'weekly') {
    const dow = now.getUTCDay();
    const mondayOffset = dow === 0 ? 6 : dow - 1;
    from = new Date(now);
    from.setUTCDate(now.getUTCDate() - mondayOffset);
    from.setUTCHours(0, 0, 0, 0);
  } else {
    from = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1, 0, 0, 0, 0),
    );
  }
  return { from, to };
}
