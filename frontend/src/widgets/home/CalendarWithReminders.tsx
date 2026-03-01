import React, { useState, useCallback } from 'react';
import { Calendar } from '@shared/ui';
import { ReminderFormModal } from './ReminderFormModal';
import { getReminders, getMarkedDatesWithColors, Reminder } from '@shared/lib/reminders';
import { Currency } from '@shared/lib/currency';
import styles from './CalendarWithReminders.module.scss';

interface CalendarWithRemindersProps {
  roomId?: string;
  currency: Currency;
}

export const CalendarWithReminders: React.FC<CalendarWithRemindersProps> = ({
  roomId,
  currency,
}) => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [viewYear, setViewYear] = useState(() => new Date().getFullYear());
  const [viewMonth, setViewMonth] = useState(() => new Date().getMonth());
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [reminders, setReminders] = useState<Reminder[]>(() =>
    getReminders(roomId)
  );

  const handleMonthChange = useCallback((year: number, month: number) => {
    setViewYear(year);
    setViewMonth(month);
  }, []);

  const year = viewYear;
  const month = viewMonth;

  const markedDatesWithColors = getMarkedDatesWithColors(reminders, year, month);

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
    <div className={styles['calendar-reminders']}>
      <Calendar
        selectedDate={selectedDate}
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
  );
};

export default CalendarWithReminders;
