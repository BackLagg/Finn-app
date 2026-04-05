import { RecurringFrequency } from '../schemas/recurring-transaction.schema';

/**
 * Advances an anchor date by one interval in UTC.
 */
export function addFrequencyUtc(date: Date, frequency: RecurringFrequency): Date {
  const d = new Date(date.getTime());
  switch (frequency) {
    case 'daily':
      d.setUTCDate(d.getUTCDate() + 1);
      break;
    case 'weekly':
      d.setUTCDate(d.getUTCDate() + 7);
      break;
    case 'monthly':
      d.setUTCMonth(d.getUTCMonth() + 1);
      break;
    case 'yearly':
      d.setUTCFullYear(d.getUTCFullYear() + 1);
      break;
    default:
      break;
  }
  return d;
}

/**
 * Returns start of current UTC day for comparing recurring due dates.
 */
export function startOfUtcDay(d: Date): Date {
  return new Date(
    Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 0, 0, 0, 0),
  );
}
