import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import styles from './Calendar.module.scss';

export interface MarkedDateWithColor {
  date: Date;
  color: string;
}

interface CalendarProps {
  selectedDate?: Date;
  viewDate?: Date;
  collapsed?: boolean;
  headerActions?: React.ReactNode;
  onDateSelect?: (date: Date) => void;
  onMonthChange?: (year: number, month: number) => void;
  markedDates?: Date[];
  markedDatesWithColors?: MarkedDateWithColor[];
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
  markedDates = [],
  markedDatesWithColors = [],
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

  const handlePrevMonth = () => {
    const next = new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1);
    if (!viewDate) setInternalMonth(next);
    onMonthChange?.(next.getFullYear(), next.getMonth());
  };

  const handleNextMonth = () => {
    const next = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1);
    if (!viewDate) setInternalMonth(next);
    onMonthChange?.(next.getFullYear(), next.getMonth());
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
  const days = collapsed ? allDays.slice(0, 7) : allDays;

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
            {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
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
          {weekDays.map((day) => (
            <div key={day} className={styles.calendar__weekday}>
              {day}
            </div>
          ))}
        </div>

        <div className={styles.calendar__days}>
        {days.map((date, index) => {
          const markColor = getMarkColor(date);
          const isMarked = isDateMarked(date);
          return (
            <button
              key={index}
              type="button"
              className={`${styles.calendar__day} ${
                !date ? styles['calendar__day--empty'] : ''
              } ${isDateSelected(date) ? styles['calendar__day--selected'] : ''} ${
                isMarked ? styles['calendar__day--marked'] : ''
              } ${isMarked && markColor ? styles['calendar__day--colored'] : ''} ${
                isDateDisabled(date) ? styles['calendar__day--disabled'] : ''
              }`}
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
              {date ? date.getDate() : ''}
            </button>
          );
        })}
        </div>
      </motion.div>
    </div>
  );
};

export default Calendar;
