import React, { useState, useCallback } from 'react';
import { FiChevronDown, FiChevronUp, FiMapPin } from 'react-icons/fi';
import { useTranslation } from 'react-i18next';
import { Calendar } from '@shared/ui';
import { ReminderFormModal } from './ReminderFormModal';
import { getReminders, getMarkedDatesWithColors, Reminder, DateWithColor } from '@shared/lib/reminders';
import { Currency } from '@shared/lib/currency';
import styles from './CalendarWithReminders.module.scss';

const PIN_TOP_OFFSET = 156;

interface CalendarWithRemindersProps {
  roomId?: string;
  currency: Currency;
  additionalMarkedDates?: DateWithColor[];
  viewDate?: Date;
  onMonthChange?: (year: number, month: number) => void;
  pinnable?: boolean;
}

export const CalendarWithReminders: React.FC<CalendarWithRemindersProps> = ({
  roomId,
  currency,
  additionalMarkedDates = [],
  viewDate,
  onMonthChange,
  pinnable = false,
}) => {
  const { t } = useTranslation();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isPinned, setIsPinned] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const viewYear = viewDate ? viewDate.getFullYear() : new Date().getFullYear();
  const viewMonth = viewDate ? viewDate.getMonth() : new Date().getMonth();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [reminders, setReminders] = useState<Reminder[]>(() =>
    getReminders(roomId)
  );

  const handleMonthChange = useCallback(
    (year: number, month: number) => {
      onMonthChange?.(year, month);
    },
    [onMonthChange]
  );

  const year = viewYear;
  const month = viewMonth;

  const markedDatesWithColors = [
    ...getMarkedDatesWithColors(reminders, year, month),
    ...additionalMarkedDates,
  ];

  const handleDateSelect = useCallback((date: Date) => {
    setSelectedDate(date);
    setIsFormOpen(true);
  }, []);

  const handleReminderCreated = useCallback((reminder: Reminder) => {
    setReminders((prev) => [...prev, reminder]);
  }, []);

  const handleReminderDeleted = useCallback((id: string) => {
    setReminders((prev) => prev.filter((r) => r.id !== id));
  }, []);

  const handleFormClose = useCallback(() => {
    setIsFormOpen(false);
    setReminders(getReminders(roomId));
  }, [roomId]);

  return (
    <>
      <div
        className={`${styles['calendar-reminders']} ${isPinned ? styles['calendar-reminders--pinned'] : ''}`}
        style={isPinned ? { top: PIN_TOP_OFFSET } : undefined}
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
                onClick={() => setIsCollapsed((v) => !v)}
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
          onDateSelect={handleDateSelect}
          onMonthChange={handleMonthChange}
          markedDatesWithColors={markedDatesWithColors}
        />
      <ReminderFormModal
        isOpen={isFormOpen}
        onClose={handleFormClose}
        selectedDate={selectedDate}
        currency={currency}
        roomId={roomId}
        reminders={reminders}
        onCreated={handleReminderCreated}
        onDeleted={handleReminderDeleted}
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

export default CalendarWithReminders;
