import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { FiX, FiChevronUp, FiChevronDown } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import { Currency, currencySymbols } from '@shared/lib/currency';
import { getRemindersForDate } from '@shared/lib/reminders';
import type { Reminder } from '@shared/api';
import { Modal, Toggle } from '@shared/ui';
import styles from './ReminderFormModal.module.scss';

type ViewMode = 'form' | 'list';

interface ReminderFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedDate: Date;
  currency: Currency;
  roomId?: string;
  reminders: (Reminder & { id: string })[];
  onCreate: (data: { amount: number; currency?: string; description?: string; date: string; dayOfMonth: number; isRecurring?: boolean; roomId?: string }) => void;
  onDelete: (id: string) => void;
}

const SWIPE_THRESHOLD = 40;

export const ReminderFormModal: React.FC<ReminderFormModalProps> = ({
  isOpen,
  onClose,
  selectedDate,
  currency,
  roomId,
  reminders,
  onCreate,
  onDelete,
}) => {
  const { t } = useTranslation();
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [isRecurring, setIsRecurring] = useState(false);

  const dayOfMonth = selectedDate.getDate();
  const year = selectedDate.getFullYear();
  const month = selectedDate.getMonth();
  const day = selectedDate.getDate();

  const remindersForDate = useMemo(
    () => getRemindersForDate(reminders, year, month, day),
    [reminders, year, month, day]
  );

  const hasReminders = remindersForDate.length > 0;

  const [view, setView] = useState<ViewMode>('form');
  useEffect(() => {
    setView(hasReminders ? 'list' : 'form');
  }, [isOpen, hasReminders]);

  const handleDelete = useCallback(
    (id: string) => {
      onDelete(id);
    },
    [onDelete]
  );

  const toggleOptions = [
    { value: 'once', label: t('home.reminder.once', 'Один раз') },
    { value: 'recurring', label: t('home.reminder.recurring', 'Ежемесячно') },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseFloat(amount.replace(',', '.'));
    if (isNaN(numAmount) || numAmount <= 0) return;

    onCreate({
      amount: numAmount,
      currency,
      description: description.trim() || undefined,
      date: selectedDate.toISOString().slice(0, 10),
      dayOfMonth,
      isRecurring,
      roomId,
    });
    setAmount('');
    setDescription('');
    setIsRecurring(false);
    onClose();
  };

  const handleClose = () => {
    setAmount('');
    setDescription('');
    setIsRecurring(false);
    onClose();
  };

  const recurringHint =
    dayOfMonth >= 29
      ? t('home.reminder.recurringHint', 'В коротких месяцах будет последний день')
      : null;

  const canSubmit = amount && parseFloat(amount) > 0;

  const handleDragEnd = useCallback(
    (_e: MouseEvent | TouchEvent | PointerEvent, info: { offset: { y: number }; velocity: { y: number } }) => {
      const { offset, velocity } = info;
      if (offset.y < -SWIPE_THRESHOLD || velocity.y < -0.3) {
        setView('list');
      } else if (offset.y > SWIPE_THRESHOLD || velocity.y > 0.3) {
        setView('form');
      }
    },
    []
  );

  const modalTitle =
    view === 'list'
      ? t('home.reminder.forDate', 'Напоминания на этот день')
      : t('home.reminder.createTitle', 'Создать напоминание');

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={modalTitle}
      height="fill"
      aboveContent={
        view === 'list' ? (
          <div className={styles.swipeHint}>
            <button
              type="button"
              className={styles.swipeHint__btn}
              onClick={() => setView('form')}
              aria-label={t('home.reminder.swipeDown', 'Свайп вниз — форма')}
            >
              <motion.span animate={{ y: [0, -3, 0] }} transition={{ repeat: Infinity, duration: 1.5 }}>
                <FiChevronDown size={20} />
              </motion.span>
              <span>{t('home.reminder.swipeDown', 'Свайп вниз — форма')}</span>
            </button>
          </div>
        ) : null
      }
      belowContent={
        view === 'form' ? (
          <div className={styles.swipeHint}>
            <button
              type="button"
              className={styles.swipeHint__btn}
              onClick={() => setView('list')}
              aria-label={t('home.reminder.swipeUp', 'Свайп вверх — задачи')}
            >
              <motion.span animate={{ y: [0, 3, 0] }} transition={{ repeat: Infinity, duration: 1.5 }}>
                <FiChevronUp size={20} />
              </motion.span>
              <span>{t('home.reminder.swipeUp', 'Свайп вверх — задачи')}</span>
            </button>
          </div>
        ) : null
      }
      footer={
        view === 'form' ? (
          <>
            <button
              type="button"
              className={styles.form__cancel}
              onClick={handleClose}
            >
              {t('common.cancel', 'Отмена')}
            </button>
            <button
              type="submit"
              form="reminder-form"
              className={styles.form__submit}
              disabled={!canSubmit}
            >
              {t('home.reminder.create', 'Создать')}
            </button>
          </>
        ) : undefined
      }
    >
      <motion.div
        className={styles.swipeArea}
        drag="y"
        dragConstraints={{ top: 0, bottom: 0 }}
        dragElastic={0.2}
        onDragEnd={handleDragEnd}
      >
        <div className={styles.swipeHandle} />

        <AnimatePresence mode="wait">
          {view === 'form' ? (
            <motion.div
              key="form"
              className={styles.viewContent}
              initial={{ opacity: 0, y: 60 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -60 }}
              transition={{ type: 'spring', damping: 28, stiffness: 320 }}
            >
              <form id="reminder-form" className={styles.form} onSubmit={handleSubmit}>
                <div className={styles.form__field}>
                  <label className={styles.form__label}>{t('common.amount', 'Сумма')}</label>
                  <div className={styles.form__amount}>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder="0"
                      className={styles.form__input}
                      required
                    />
                    <span className={styles.form__currency}>
                      {currencySymbols[currency]}
                    </span>
                  </div>
                </div>

                <div className={styles.form__field}>
                  <label className={styles.form__label}>{t('common.description')}</label>
                  <input
                    type="text"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder={t('home.reminder.descriptionPlaceholder', 'Описание платежа')}
                    className={styles.form__input}
                  />
                </div>

                <div className={styles.form__field}>
                  <label className={styles.form__label}>
                    {t('home.reminder.repeat', 'Повторять')}
                  </label>
                  <div className={styles.form__toggle}>
                    <Toggle
                      options={toggleOptions}
                      value={isRecurring ? 'recurring' : 'once'}
                      onChange={(val) => setIsRecurring(val === 'recurring')}
                    />
                  </div>
                  {recurringHint && isRecurring && (
                    <p className={styles.form__hint}>{recurringHint}</p>
                  )}
                </div>

                <div className={styles.form__date}>
                  {selectedDate.toLocaleDateString('ru', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                    weekday: 'long',
                  })}
                </div>
              </form>
            </motion.div>
          ) : (
            <motion.div
              key="list"
              className={styles.viewContent}
              initial={{ opacity: 0, y: -60 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 60 }}
              transition={{ type: 'spring', damping: 28, stiffness: 320 }}
            >
              {remindersForDate.length > 0 ? (
                <ul className={styles.form__reminderList}>
                  {remindersForDate.map((r) => (
                    <li key={r.id} className={styles.form__reminderItem}>
                      <span className={styles.form__reminderText}>
                        {r.amount} {currencySymbols[r.currency]}
                        {r.description && ` — ${r.description}`}
                      </span>
                      <button
                        type="button"
                        className={styles.form__removeBtn}
                        onClick={() => handleDelete(r.id)}
                        aria-label={t('common.delete', 'Удалить')}
                      >
                        <FiX size={18} />
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className={styles.emptyState}>
                  {t('home.reminder.noReminders', 'Нет напоминаний на этот день')}
                </p>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </Modal>
  );
};
