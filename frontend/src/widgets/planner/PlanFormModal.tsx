import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal } from '@shared/ui';
import type { Plan } from '@entities/planner';
import styles from './PlanFormModal.module.scss';

interface PlanFormModalProps {
  initialPlan?: Plan;
  onSave: (name: string, amount: number, dayOfMonth: number, savingFor?: string) => void;
  onClose: () => void;
  maxDay: number;
}

export const PlanFormModal: React.FC<PlanFormModalProps> = ({
  initialPlan,
  onSave,
  onClose,
  maxDay,
}) => {
  const { t } = useTranslation();
  const [name, setName] = useState(initialPlan?.name ?? '');
  const [amount, setAmount] = useState(initialPlan?.amount?.toString() ?? '');
  const [dayOfMonth, setDayOfMonth] = useState(initialPlan?.dayOfMonth ?? 1);
  const [savingFor, setSavingFor] = useState(initialPlan?.savingFor ?? '');

  useEffect(() => {
    if (initialPlan) {
      setName(initialPlan.name);
      setAmount(initialPlan.amount.toString());
      setDayOfMonth(initialPlan.dayOfMonth);
      setSavingFor(initialPlan.savingFor ?? '');
    }
  }, [initialPlan]);

  const handleSubmit = () => {
    const num = parseFloat(amount.replace(',', '.'));
    if (name.trim() && num > 0 && dayOfMonth >= 1 && dayOfMonth <= maxDay) {
      onSave(name.trim(), num, Math.min(dayOfMonth, maxDay), savingFor.trim() || undefined);
    }
  };

  const isValid = name.trim().length > 0 && parseFloat(amount.replace(',', '.')) > 0;

  return (
    <Modal isOpen onClose={onClose} title={t('statistics.planner.addPlan')}>
      <form
        className={styles['plan-form']}
        onSubmit={(e) => {
          e.preventDefault();
          handleSubmit();
        }}
      >
        <label className={styles['plan-form__label']}>{t('statistics.planner.planName')}</label>
        <input
          type="text"
          className={styles['plan-form__input']}
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={t('statistics.planner.planNamePlaceholder')}
        />

        <label className={styles['plan-form__label']}>{t('common.amount')}</label>
        <input
          type="text"
          inputMode="decimal"
          className={styles['plan-form__input']}
          value={amount}
          onChange={(e) => setAmount(e.target.value.replace(/[^\d.,]/g, ''))}
        />

        <label className={styles['plan-form__label']}>{t('statistics.planner.dayOfMonth')}</label>
        <input
          type="number"
          min={1}
          max={maxDay}
          className={styles['plan-form__input']}
          value={dayOfMonth}
          onChange={(e) => setDayOfMonth(Math.min(maxDay, Math.max(1, parseInt(e.target.value, 10) || 1)))}
        />

        <label className={styles['plan-form__label']}>{t('statistics.planner.savingFor')}</label>
        <input
          type="text"
          className={styles['plan-form__input']}
          value={savingFor}
          onChange={(e) => setSavingFor(e.target.value)}
          placeholder={t('statistics.planner.savingForPlaceholder')}
        />

        <div className={styles['plan-form__actions']}>
          <button
            type="button"
            className={styles['plan-form__cancel']}
            onClick={onClose}
          >
            {t('common.cancel')}
          </button>
          <button
            type="submit"
            className={styles['plan-form__save']}
            disabled={!isValid}
          >
            {t('common.save')}
          </button>
        </div>
      </form>
    </Modal>
  );
};
