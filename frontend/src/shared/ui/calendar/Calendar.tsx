import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FiChevronLeft, FiChevronRight, FiTrendingUp, FiTrendingDown } from 'react-icons/fi';
import styles from './Calendar.module.scss';

export interface MarkedDateWithColor {
  date: Date;
  color: string;
}

export type DayBalanceDirection = 'income' | 'expense';

export interface DayBalance {
  date: Date;
  direction: DayBalanceDirection;
  percent?: number;
}

interface CalendarProps {
  selectedDate?: Date;
  viewDate?: Date;
  collapsed?: boolean;
  headerActions?: React.ReactNode;
  onDateSelect?: (date: Date) => void;
  onMonthChange?: (year: number, month: number) => void;
  onViewDateChange?: (date: Date) => void;
  markedDates?: Date[];
  markedDatesWithColors?: MarkedDateWithColor[];
  dayBalance?: DayBalance[];
  minDate?: Date;
  maxDate?: Date;
  className?: string;
}

export const Calendar: React.FC<CalendarProps> = ({
  selectedDate,
  viewDate,
  collapsed = false,
  headerActions,
  onDateSelect,
  onMonthChange,
  onViewDateChange,
  markedDates = [],
  markedDatesWithColors = [],
  dayBalance = [],
  minDate,
  maxDate,
  className,
}) => {
  const [internalMonth, setInternalMonth] = useState(selectedDate || new Date());
  const currentMonth = viewDate ?? internalMonth;

  const monthNames = [
    'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
    'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'
  ];

  const weekDays = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();

    let firstDayOfWeek = firstDay.getDay() - 1;
    if (firstDayOfWeek === -1) firstDayOfWeek = 6;

    const days: (Date | null)[] = [];

    for (let i = 0; i < firstDayOfWeek; i++) {
      days.push(null);
    }

    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i));
    }

    return days;
  };

  const getCurrentWeekDates = (baseDate: Date): Date[] => {
    const dayOfWeek = baseDate.getDay();
    const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const monday = new Date(baseDate);
    monday.setDate(baseDate.getDate() + mondayOffset);
    const out: Date[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(d.getDate() + i);
      out.push(d);
    }
    return out;
  };

  const isWeekend = (date: Date | null) => {
    if (!date) return false;
    const d = date.getDay();
    return d === 0 || d === 6;
  };

  const formatWeekRange = (dates: Date[]) => {
    if (dates.length < 2) return '';
    const first = dates[0];
    const last = dates[dates.length - 1];
    const mon = first.getMonth();
    const monName = monthNames[mon];
    return `${first.getDate()} – ${last.getDate()} ${monName}`;
  };

  const handlePrevMonth = () => {
    if (collapsed) {
      const next = new Date(currentMonth);
      next.setDate(currentMonth.getDate() - 7);
      if (!viewDate) setInternalMonth(next);
      if (onViewDateChange) {
        onViewDateChange(next);
      } else {
        onMonthChange?.(next.getFullYear(), next.getMonth());
      }
    } else {
      const next = new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1);
      if (!viewDate) setInternalMonth(next);
      onMonthChange?.(next.getFullYear(), next.getMonth());
    }
  };

  const handleNextMonth = () => {
    if (collapsed) {
      const next = new Date(currentMonth);
      next.setDate(currentMonth.getDate() + 7);
      if (!viewDate) setInternalMonth(next);
      if (onViewDateChange) {
        onViewDateChange(next);
      } else {
        onMonthChange?.(next.getFullYear(), next.getMonth());
      }
    } else {
      const next = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1);
      if (!viewDate) setInternalMonth(next);
      onMonthChange?.(next.getFullYear(), next.getMonth());
    }
  };

  const isDateSelected = (date: Date | null) => {
    if (!date || !selectedDate) return false;
    return (
      date.getDate() === selectedDate.getDate() &&
      date.getMonth() === selectedDate.getMonth() &&
      date.getFullYear() === selectedDate.getFullYear()
    );
  };

  const getMarkColor = (date: Date | null): string | null => {
    if (!date) return null;
    const found = markedDatesWithColors.find(
      (m) =>
        m.date.getDate() === date.getDate() &&
        m.date.getMonth() === date.getMonth() &&
        m.date.getFullYear() === date.getFullYear()
    );
    return found?.color || null;
  };

  const getDayBalance = (date: Date | null): DayBalance | null => {
    if (!date) return null;
    const found = dayBalance.find(
      (d) =>
        d.date.getDate() === date.getDate() &&
        d.date.getMonth() === date.getMonth() &&
        d.date.getFullYear() === date.getFullYear()
    );
    return found ?? null;
  };

  const isDateMarked = (date: Date | null) => {
    if (!date) return false;
    if (markedDatesWithColors.length > 0) {
      return getMarkColor(date) !== null;
    }
    return markedDates.some(
      (markedDate) =>
        date.getDate() === markedDate.getDate() &&
        date.getMonth() === markedDate.getMonth() &&
        date.getFullYear() === markedDate.getFullYear()
    );
  };

  const isDateDisabled = (date: Date | null) => {
    if (!date) return true;
    if (minDate && date < minDate) return true;
    if (maxDate && date > maxDate) return true;
    return false;
  };

  const handleDateClick = (date: Date | null) => {
    if (date && !isDateDisabled(date) && onDateSelect) {
      onDateSelect(date);
    }
  };

  const allDays = getDaysInMonth(currentMonth);
  const currentWeekDays = getCurrentWeekDates(currentMonth);
  const days = collapsed ? currentWeekDays : allDays;
  const weekRangeTitle = collapsed ? formatWeekRange(currentWeekDays) : null;

  return (
    <div className={`${styles.calendar} ${className || ''}`}>
      <div className={styles.calendar__header}>
        <div className={styles.calendar__headerNav}>
          <button
            type="button"
            className={styles.calendar__nav}
            onClick={handlePrevMonth}
          >
            <FiChevronLeft />
          </button>
          <div className={styles.calendar__title}>
            {weekRangeTitle ?? `${monthNames[currentMonth.getMonth()]} ${currentMonth.getFullYear()}`}
          </div>
          <button
            type="button"
            className={styles.calendar__nav}
            onClick={handleNextMonth}
          >
            <FiChevronRight />
          </button>
        </div>
        {headerActions}
      </div>

      <motion.div
        className={styles.calendar__body}
        initial={false}
        animate={{ height: collapsed ? 90 : 360 }}
        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
      >
        <div className={styles.calendar__weekdays}>
          {weekDays.map((day, i) => (
            <div
              key={day}
              className={`${styles.calendar__weekday} ${i >= 5 ? styles['calendar__weekday--weekend'] : ''}`}
            >
              {day}
            </div>
          ))}
        </div>

        <div className={styles.calendar__days}>
        {days.map((date, index) => {
          const markColor = getMarkColor(date);
          const isMarked = isDateMarked(date);
          const balance = getDayBalance(date);
          const balanceDir = balance?.direction ?? null;
          return (
            <button
              key={index}
              type="button"
              className={`${styles.calendar__day} ${
                !date ? styles['calendar__day--empty'] : ''
              } ${date && isWeekend(date) ? styles['calendar__day--weekend'] : ''} ${
                isDateSelected(date) ? styles['calendar__day--selected'] : ''
              } ${isMarked ? styles['calendar__day--marked'] : ''} ${
                isMarked && markColor ? styles['calendar__day--colored'] : ''
              } ${balanceDir === 'income' ? styles['calendar__day--balanceIncome'] : ''} ${
                balanceDir === 'expense' ? styles['calendar__day--balanceExpense'] : ''
              } ${isDateDisabled(date) ? styles['calendar__day--disabled'] : ''}`}
              onClick={() => handleDateClick(date)}
              disabled={!date || isDateDisabled(date)}
              style={
                isMarked && markColor
                  ? {
                      backgroundColor: `${markColor}25`,
                      borderColor: markColor,
                      color: markColor,
                    }
                  : undefined
              }
            >
              {date ? (
                <>
                  <span className={styles.calendar__dayNum}>{date.getDate()}</span>
                  {balanceDir === 'income' && (
                    <span className={styles.calendar__dayBalance}>
                      <FiTrendingUp className={styles.calendar__dayArrow} size={12} aria-hidden />
                      {balance?.percent != null && (
                        <span className={styles.calendar__dayPercent}>+{Math.round(balance.percent)}%</span>
                      )}
                    </span>
                  )}
                  {balanceDir === 'expense' && (
                    <span className={styles.calendar__dayBalance}>
                      <FiTrendingDown className={styles.calendar__dayArrow} size={12} aria-hidden />
                      {balance?.percent != null && (
                        <span className={styles.calendar__dayPercent}>−{Math.round(balance.percent)}%</span>
                      )}
                    </span>
                  )}
                </>
              ) : (
                ''
              )}
            </button>
          );
        })}
        </div>
      </motion.div>
    </div>
  );
};

export default Calendar;
