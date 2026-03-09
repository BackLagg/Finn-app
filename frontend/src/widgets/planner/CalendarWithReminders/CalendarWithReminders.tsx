import React, { useState, useCallback, useEffect } from 'react';
import { FiChevronDown, FiChevronUp, FiMapPin } from 'react-icons/fi';
import { useTranslation } from 'react-i18next';
import { Calendar, type DayBalance } from '@shared/ui';
import type { Plan } from '@entities/planner';
import { ReminderFormModal } from '../ReminderFormModal';
import { useReminders } from '@features/reminders/use-reminders';
import { getMarkedDatesWithColors, DateWithColor } from '@shared/lib/reminders';
import { Currency } from '@shared/lib/currency';
import { useCollapsedStorage } from '@shared/lib/use-collapsed-storage';
import styles from './CalendarWithReminders.module.scss';

const PIN_TOP_OFFSET = 156;

interface CalendarWithRemindersProps {
  roomId?: string;
  currency: Currency;
  additionalMarkedDates?: DateWithColor[];
  dayBalance?: DayBalance[];
  viewDate?: Date;
  onMonthChange?: (year: number, month: number) => void;
  pinnable?: boolean;
  pinTopOffsetExtra?: number;
  plansWithDeadline?: Plan[];
}

export const CalendarWithReminders: React.FC<CalendarWithRemindersProps> = ({
  roomId,
  currency,
  additionalMarkedDates = [],
  dayBalance = [],
  viewDate,
  onMonthChange,
  pinnable = false,
  pinTopOffsetExtra = 0,
  plansWithDeadline = [],
}) => {
  const { t } = useTranslation();
  const [isCollapsed, toggleCollapsed] = useCollapsedStorage('calendar', true);
  const [isPinned, setIsPinnedState] = useState(() => {
    try {
      const raw = localStorage.getItem('planner-collapsed');
      if (!raw) return false;
      const obj = JSON.parse(raw) as Record<string, boolean>;
      return obj.calendarPinned ?? false;
    } catch {
      return false;
    }
  });

  useEffect(() => {
    try {
      const raw = localStorage.getItem('planner-collapsed');
      const obj: Record<string, boolean> = raw ? JSON.parse(raw) : {};
      obj.calendarPinned = isPinned;
      localStorage.setItem('planner-collapsed', JSON.stringify(obj));
    } catch {}
  }, [isPinned]);

  const setIsPinned = useCallback((v: boolean | ((prev: boolean) => boolean)) => {
    setIsPinnedState((prev) => {
      const next = typeof v === 'function' ? v(prev) : v;
      try {
        const raw = localStorage.getItem('planner-collapsed');
        const obj: Record<string, boolean> = raw ? JSON.parse(raw) : {};
        obj.calendarPinned = next;
        localStorage.setItem('planner-collapsed', JSON.stringify(obj));
      } catch {}
      return next;
    });
  }, []);

  const [selectedDate, setSelectedDate] = useState(new Date());
  const viewYear = viewDate ? viewDate.getFullYear() : new Date().getFullYear();
  const viewMonth = viewDate ? viewDate.getMonth() : new Date().getMonth();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const { reminders, create: createReminder, deleteReminder } = useReminders(
    roomId,
    viewYear,
    viewMonth
  );

  const handleMonthChange = useCallback(
    (year: number, month: number) => {
      onMonthChange?.(year, month);
    },
    [onMonthChange]
  );

  const markedDatesWithColors = [
    ...getMarkedDatesWithColors(reminders, viewYear, viewMonth),
    ...additionalMarkedDates,
  ];

  const handleDateSelect = useCallback((date: Date) => {
    setSelectedDate(date);
    setIsFormOpen(true);
  }, []);

  const handleFormClose = useCallback(() => {
    setIsFormOpen(false);
  }, []);

  return (
    <>
      <div
        className={`${styles['calendar-reminders']} ${isPinned ? styles['calendar-reminders--pinned'] : ''}`}
        style={isPinned ? { top: PIN_TOP_OFFSET + pinTopOffsetExtra } : undefined}
      >
        <Calendar
          selectedDate={selectedDate}
          viewDate={viewDate}
          collapsed={isCollapsed}
          headerActions={
            <div className={styles['calendar-reminders__toolbar']}>
              <button
                type="button"
                className={styles['calendar-reminders__btn']}
                onClick={toggleCollapsed}
                title={isCollapsed ? t('common.expand') : t('common.collapse')}
              >
                {isCollapsed ? (
                  <FiChevronDown size={18} />
                ) : (
                  <FiChevronUp size={18} />
                )}
              </button>
              {pinnable && (
                <button
                  type="button"
                  className={`${styles['calendar-reminders__btn']} ${isPinned ? styles['calendar-reminders__btn--active'] : ''}`}
                  onClick={() => setIsPinned((v) => !v)}
                  title={isPinned ? t('home.unpinList') : t('home.pinList')}
                >
                  <FiMapPin size={18} />
                </button>
              )}
            </div>
          }
          className={styles['calendar-reminders__calendar']}
          onDateSelect={handleDateSelect}
          onMonthChange={handleMonthChange}
          markedDatesWithColors={markedDatesWithColors}
          dayBalance={dayBalance}
        />
      <ReminderFormModal
        isOpen={isFormOpen}
        onClose={handleFormClose}
        selectedDate={selectedDate}
        currency={currency}
        roomId={roomId}
        reminders={reminders}
        onCreate={createReminder}
        onDelete={deleteReminder}
        plansWithDeadline={plansWithDeadline}
      />
      </div>
      {isPinned && (
        <div
          className={`${styles['calendar-reminders__spacer']} ${isCollapsed ? styles['calendar-reminders__spacer--collapsed'] : styles['calendar-reminders__spacer--expanded']}`}
        />
      )}
    </>
  );
};
