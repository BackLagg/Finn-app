import { WEEKDAY_COLORS } from './weekday-colors';
import type { Currency } from './currency';
import { parseLocalDate as parseDate } from './date-utils';

export type { Currency };

export interface ReminderLike {
  id?: string;
  _id?: string;
  amount: number;
  currency: string;
  description: string;
  date: string;
  dayOfMonth: number;
  isRecurring: boolean;
  roomId?: string;
}

const getDaysInMonth = (year: number, month: number): number => {
  return new Date(year, month + 1, 0).getDate();
};

export const getEffectiveDay = (dayOfMonth: number, year: number, month: number): number => {
  const daysInMonth = getDaysInMonth(year, month);
  return Math.min(dayOfMonth, daysInMonth);
};

export const getRemindersForDate = (
  reminders: ReminderLike[],
  year: number,
  month: number,
  day: number
): ReminderLike[] => {
  return reminders.filter((r) => {
    if (r.isRecurring) {
      const effectiveDay = getEffectiveDay(r.dayOfMonth, year, month);
      return effectiveDay === day;
    }
    const d = parseDate(r.date);
    return d.getFullYear() === year && d.getMonth() === month && d.getDate() === day;
  });
};

export interface DateWithColor {
  date: Date;
  color: string;
}

export const getMarkedDatesWithColors = (
  reminders: ReminderLike[],
  year: number,
  month: number
): DateWithColor[] => {
  const result: DateWithColor[] = [];
  const added = new Set<string>();

  for (const r of reminders) {
    let date: Date;
    if (r.isRecurring) {
      const effectiveDay = getEffectiveDay(r.dayOfMonth, year, month);
      date = new Date(year, month, effectiveDay);
    } else {
      const d = parseDate(r.date);
      if (d.getFullYear() !== year || d.getMonth() !== month) continue;
      date = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    }

    const key = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
    if (!added.has(key)) {
      added.add(key);
      const dayOfWeek = date.getDay();
      result.push({
        date,
        color: WEEKDAY_COLORS[dayOfWeek] || '#848e9c',
      });
    }
  }

  return result;
};
