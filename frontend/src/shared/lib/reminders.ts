import { WEEKDAY_COLORS } from './weekday-colors';
import type { Currency } from './currency';

export type { Currency };

export interface Reminder {
  id: string;
  amount: number;
  currency: Currency;
  description: string;
  date: string;
  dayOfMonth: number;
  isRecurring: boolean;
  roomId?: string;
  createdAt: string;
}

const STORAGE_KEY = 'finance_reminders';

export const getReminders = (roomId?: string): Reminder[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const all: Reminder[] = raw ? JSON.parse(raw) : [];
    return roomId
      ? all.filter((r) => r.roomId === roomId)
      : all.filter((r) => !r.roomId);
  } catch {
    return [];
  }
};

export const saveReminder = (reminder: Omit<Reminder, 'id' | 'createdAt'>): Reminder => {
  const raw = localStorage.getItem(STORAGE_KEY);
  const all: Reminder[] = raw ? JSON.parse(raw) : [];
  const newReminder: Reminder = {
    ...reminder,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
  };
  all.push(newReminder);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
  return newReminder;
};

export const deleteReminder = (id: string): void => {
  const raw = localStorage.getItem(STORAGE_KEY);
  const all: Reminder[] = raw ? JSON.parse(raw) : [];
  const filtered = all.filter((r) => r.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
};

const getDaysInMonth = (year: number, month: number): number => {
  return new Date(year, month + 1, 0).getDate();
};

export const getEffectiveDay = (dayOfMonth: number, year: number, month: number): number => {
  const daysInMonth = getDaysInMonth(year, month);
  return Math.min(dayOfMonth, daysInMonth);
};

export const getRemindersForDate = (
  reminders: Reminder[],
  year: number,
  month: number,
  day: number
): Reminder[] => {
  return reminders.filter((r) => {
    if (r.isRecurring) {
      const effectiveDay = getEffectiveDay(r.dayOfMonth, year, month);
      return effectiveDay === day;
    }
    const d = new Date(r.date);
    return d.getFullYear() === year && d.getMonth() === month && d.getDate() === day;
  });
};

export interface DateWithColor {
  date: Date;
  color: string;
}

export const getMarkedDatesWithColors = (
  reminders: Reminder[],
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
      const d = new Date(r.date);
      if (d.getFullYear() !== year || d.getMonth() !== month) continue;
      date = d;
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
