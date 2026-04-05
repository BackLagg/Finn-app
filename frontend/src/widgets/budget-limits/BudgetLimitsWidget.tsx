import React, { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { financeAPI, type BudgetLimit } from '@shared/api';
import { useCurrencyPreference } from '@shared/lib';
import { currencySymbols } from '@shared/lib/currency';
import { getCategoryLabel } from '@shared/lib/category-labels';
import { Modal, ProgressBar } from '@shared/ui';
import { toast } from 'react-toastify';
import styles from './BudgetLimitsWidget.module.scss';

interface BudgetLimitsWidgetProps {
  roomId?: string;
  compact?: boolean;
}

const EXPENSE_CATEGORIES = [
  'food',
  'transport',
  'housing',
  'utilities',
  'healthcare',
  'entertainment',
  'shopping',
  'education',
  'other',
];

const PERIODS = ['daily', 'weekly', 'monthly'] as const;

const BudgetLimitsWidget: React.FC<BudgetLimitsWidgetProps> = ({ roomId, compact = false }) => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [currency] = useCurrencyPreference();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLimit, setEditingLimit] = useState<BudgetLimit | null>(null);
  const [formData, setFormData] = useState({
    category: EXPENSE_CATEGORIES[0],
    limit: 0,
    period: 'monthly' as 'daily' | 'weekly' | 'monthly',
  });

  const { data: limits = [], isLoading } = useQuery({
    queryKey: ['budgetLimits', roomId],
    queryFn: async () => {
      const res = await financeAPI.budgetLimits.list(roomId);
      return res.data;
    },
  });

  const { data: limitStatus = [] } = useQuery({
    queryKey: ['budgetLimitStatus', roomId],
    queryFn: async () => {
      const res = await financeAPI.budgetLimits.checkStatus(roomId);
      return res.data;
    },
    refetchInterval: 30000,
  });

  const createMutation = useMutation({
    mutationFn: (data: { category: string; limit: number; period: 'daily' | 'weekly' | 'monthly'; roomId?: string }) =>
      financeAPI.budgetLimits.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budgetLimits', roomId] });
      queryClient.invalidateQueries({ queryKey: ['budgetLimitStatus', roomId] });
      handleCloseModal();
      toast.success(t('budgetLimits.created'));
    },
    onError: () => toast.error(t('errors.generic')),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<BudgetLimit> }) =>
      financeAPI.budgetLimits.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budgetLimits', roomId] });
      queryClient.invalidateQueries({ queryKey: ['budgetLimitStatus', roomId] });
      handleCloseModal();
      toast.success(t('budgetLimits.updated'));
    },
    onError: () => toast.error(t('errors.generic')),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => financeAPI.budgetLimits.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budgetLimits', roomId] });
      queryClient.invalidateQueries({ queryKey: ['budgetLimitStatus', roomId] });
      toast.success(t('budgetLimits.deleted'));
    },
    onError: () => toast.error(t('errors.generic')),
  });

  const handleOpenModal = useCallback((limit?: BudgetLimit) => {
    if (limit) {
      setEditingLimit(limit);
      setFormData({
        category: limit.category,
        limit: limit.limit,
        period: limit.period,
      });
    } else {
      setEditingLimit(null);
      setFormData({ category: EXPENSE_CATEGORIES[0], limit: 0, period: 'monthly' });
    }
    setIsModalOpen(true);
  }, []);

  const handleCloseModal = useCallback(() => {
    setIsModalOpen(false);
    setEditingLimit(null);
    setFormData({ category: EXPENSE_CATEGORIES[0], limit: 0, period: 'monthly' });
  }, []);

  const handleSubmit = useCallback(() => {
    if (formData.limit <= 0) {
      toast.error(t('budgetLimits.invalidAmount'));
      return;
    }

    if (editingLimit) {
      updateMutation.mutate({
        id: editingLimit._id,
        data: { limit: formData.limit, period: formData.period },
      });
    } else {
      createMutation.mutate({
        category: formData.category,
        limit: formData.limit,
        period: formData.period,
        roomId,
      });
    }
  }, [formData, editingLimit, roomId, createMutation, updateMutation, t]);

  const handleDelete = useCallback((id: string) => {
    if (window.confirm(t('budgetLimits.confirmDelete'))) {
      deleteMutation.mutate(id);
    }
  }, [deleteMutation, t]);

  const getStatusForCategory = (category: string) => {
    return limitStatus.find((s) => s.category === category);
  };

  const formatCurrency = (amount: number) => {
    return `${currencySymbols[currency]} ${amount.toLocaleString()}`;
  };

  const getPeriodLabel = (period: string) => {
    return t(`budgetLimits.period.${period}`);
  };

  const getProgressVariant = (percentage: number) => {
    if (percentage >= 100) return 'danger';
    if (percentage >= 80) return 'warning';
    return 'primary';
  };

  const existingCategories = limits.map((l) => l.category);
  const availableCategories = EXPENSE_CATEGORIES.filter(
    (cat) => !existingCategories.includes(cat) || editingLimit?.category === cat
  );

  if (isLoading) {
    return <div className={styles.loading}>{t('common.loading')}</div>;
  }

  // Compact mode for dashboard
  if (compact) {
    const overBudgetLimits = limitStatus.filter((s) => s.isOver);
    const warningLimits = limitStatus.filter((s) => s.percentage >= 80 && !s.isOver);

    if (overBudgetLimits.length === 0 && warningLimits.length === 0) {
      return null;
    }

    return (
      <div className={styles.compact}>
        {overBudgetLimits.length > 0 && (
          <div className={styles.compact__alert}>
            <span className={styles.compact__alertIcon}>!</span>
            <span className={styles.compact__alertText}>
              {t('budgetLimits.overBudgetCount', { count: overBudgetLimits.length })}
            </span>
          </div>
        )}
        {warningLimits.length > 0 && (
          <div className={styles.compact__warning}>
            {t('budgetLimits.warningCount', { count: warningLimits.length })}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={styles.limits}>
      <div className={styles.limits__header}>
        <h2 className={styles.limits__title}>{t('budgetLimits.title')}</h2>
        {availableCategories.length > 0 && (
          <button
            type="button"
            onClick={() => handleOpenModal()}
            className={styles.limits__addBtn}
          >
            {t('budgetLimits.add')}
          </button>
        )}
      </div>

      <div className={styles.limits__list}>
        <AnimatePresence mode="popLayout">
          {limits.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className={styles.limits__empty}
            >
              {t('budgetLimits.empty')}
            </motion.div>
          ) : (
            limits.map((limit) => {
              const status = getStatusForCategory(limit.category);
              const percentage = status?.percentage || 0;
              const isOver = status?.isOver || false;

              return (
                <motion.div
                  key={limit._id}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className={`${styles.limits__card} ${isOver ? styles['limits__card--over'] : ''}`}
                >
                  <div className={styles.limits__cardHeader}>
                    <div className={styles.limits__categoryInfo}>
                      <h3 className={styles.limits__category}>
                        {getCategoryLabel(limit.category, t)}
                      </h3>
                      <span className={styles.limits__period}>
                        {getPeriodLabel(limit.period)}
                      </span>
                    </div>
                    <div className={styles.limits__cardActions}>
                      <button
                        type="button"
                        onClick={() => handleOpenModal(limit)}
                        className={styles.limits__editBtn}
                        title={t('common.edit')}
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                        </svg>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(limit._id)}
                        className={styles.limits__deleteBtn}
                        title={t('common.delete')}
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <polyline points="3,6 5,6 21,6" />
                          <path d="M19,6v14a2,2,0,0,1-2,2H7a2,2,0,0,1-2-2V6m3,0V4a2,2,0,0,1,2-2h4a2,2,0,0,1,2,2V6" />
                        </svg>
                      </button>
                    </div>
                  </div>

                  <div className={styles.limits__amounts}>
                    <span className={`${styles.limits__spent} ${isOver ? styles['limits__spent--over'] : ''}`}>
                      {formatCurrency(status?.spent || 0)}
                    </span>
                    <span className={styles.limits__separator}>/</span>
                    <span className={styles.limits__limit}>{formatCurrency(limit.limit)}</span>
                  </div>

                  <ProgressBar 
                    value={Math.min(percentage, 100)} 
                    variant={getProgressVariant(percentage)}
                  />

                  {isOver && (
                    <div className={styles.limits__overAlert}>
                      {t('budgetLimits.overBy', { amount: formatCurrency((status?.spent || 0) - limit.limit) })}
                    </div>
                  )}
                </motion.div>
              );
            })
          )}
        </AnimatePresence>
      </div>

      <Modal isOpen={isModalOpen} onClose={handleCloseModal} title={editingLimit ? t('budgetLimits.edit') : t('budgetLimits.add')}>
        <div className={styles.limits__form}>
          {!editingLimit && (
            <div className={styles.limits__formGroup}>
              <label className={styles.limits__label}>{t('budgetLimits.category')}</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className={styles.limits__select}
              >
                {availableCategories.map((cat) => (
                  <option key={cat} value={cat}>
                    {getCategoryLabel(cat, t)}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className={styles.limits__formGroup}>
            <label className={styles.limits__label}>{t('budgetLimits.limitAmount')}</label>
            <div className={styles.limits__inputWithCurrency}>
              <input
                type="number"
                min={0}
                value={formData.limit || ''}
                onChange={(e) => setFormData({ ...formData, limit: Number(e.target.value) })}
                placeholder="0"
                className={styles.limits__input}
              />
              <span className={styles.limits__currencyBadge}>{currencySymbols[currency]}</span>
            </div>
          </div>

          <div className={styles.limits__formGroup}>
            <label className={styles.limits__label}>{t('budgetLimits.periodLabel')}</label>
            <div className={styles.limits__periods}>
              {PERIODS.map((period) => (
                <button
                  key={period}
                  type="button"
                  onClick={() => setFormData({ ...formData, period })}
                  className={`${styles.limits__periodBtn} ${formData.period === period ? styles['limits__periodBtn--active'] : ''}`}
                >
                  {getPeriodLabel(period)}
                </button>
              ))}
            </div>
          </div>

          <div className={styles.limits__formActions}>
            <button
              type="button"
              onClick={handleCloseModal}
              className={styles.limits__cancelBtn}
            >
              {t('common.cancel')}
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={createMutation.isPending || updateMutation.isPending}
              className={styles.limits__submitBtn}
            >
              {editingLimit ? t('common.save') : t('budgetLimits.create')}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default BudgetLimitsWidget;
