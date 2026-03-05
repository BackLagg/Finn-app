import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal, Dropdown } from '@shared/ui';
import { getCategoryLabel } from '@shared/lib/category-labels';
import type { Plan } from '@entities/planner';
import styles from './PlanFormModal.module.scss';

const EXPENSE_CATEGORIES = [
  'Семья', 'Образование', 'Питомцы', 'Кино', 'Здоровье', 'Транспорт',
  'Одежда', 'Еда', 'Игры', 'Книги', 'Спорт', 'Кафе', 'Покупки', 'Другое',
];

interface PlanFormModalProps {
  initialPlan?: Plan;
  title?: string;
  onSave: (name: string, amount: number, category?: string, deadline?: string) => void;
  onClose: () => void;
}

export const PlanFormModal: React.FC<PlanFormModalProps> = ({
  initialPlan,
  title,
  onSave,
  onClose,
}) => {
  const { t } = useTranslation();
  const [name, setName] = useState(initialPlan?.name ?? '');
  const [amount, setAmount] = useState(initialPlan?.amount?.toString() ?? '');
  const [category, setCategory] = useState(initialPlan?.category ?? '');
  const [deadline, setDeadline] = useState(initialPlan?.deadline ?? '');

  useEffect(() => {
    if (initialPlan) {
      setName(initialPlan.name);
      setAmount(initialPlan.amount.toString());
      setCategory(initialPlan.category ?? '');
      setDeadline(initialPlan.deadline ?? '');
    }
  }, [initialPlan]);

  const handleSubmit = () => {
    const num = parseFloat(amount.replace(',', '.'));
    if (name.trim() && num > 0) {
      onSave(name.trim(), num, category.trim() || undefined, deadline.trim() || undefined);
    }
  };

  const isValid = name.trim().length > 0 && parseFloat(amount.replace(',', '.')) > 0;

  const categoryOptions = [
    { value: '', label: t('statistics.planner.categoryOptional', '— Не выбрано') },
    ...EXPENSE_CATEGORIES.map((cat) => ({
      value: cat,
      label: getCategoryLabel(t, 'expense', cat),
    })),
  ];

  return (
    <Modal isOpen onClose={onClose} title={title ?? t('statistics.planner.addPlan')}>
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

        <label className={styles['plan-form__label']}>{t('statistics.planner.categoryOptionalLabel', 'Категория (необязательно)')}</label>
        <Dropdown
          options={categoryOptions}
          value={category}
          onChange={setCategory}
          placeholder={t('statistics.planner.categoryOptional', '— Не выбрано')}
        />

        <label className={styles['plan-form__label']}>{t('statistics.planner.deadline', 'Дедлайн (необязательно)')}</label>
        <input
          type="date"
          className={styles['plan-form__input']}
          value={deadline}
          onChange={(e) => setDeadline(e.target.value)}
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
