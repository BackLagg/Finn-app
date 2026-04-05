import React, { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { financeAPI, type Goal } from '@shared/api';
import { useCurrencyPreference } from '@shared/lib';
import { currencySymbols } from '@shared/lib/currency';
import { Modal, ProgressBar } from '@shared/ui';
import { toast } from 'react-toastify';
import styles from './GoalsWidget.module.scss';

interface GoalsWidgetProps {
  roomId?: string;
}

interface GoalFormData {
  title: string;
  targetAmount: number;
  currentAmount: number;
  deadline: string;
}

const GoalsWidget: React.FC<GoalsWidgetProps> = ({ roomId }) => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [currency] = useCurrencyPreference();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [formData, setFormData] = useState<GoalFormData>({
    title: '',
    targetAmount: 0,
    currentAmount: 0,
    deadline: '',
  });

  const { data: goals = [], isLoading } = useQuery({
    queryKey: ['goals', roomId],
    queryFn: async () => {
      const res = await financeAPI.goals.list(roomId);
      return res.data;
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: { title: string; targetAmount: number; deadline?: string; roomId?: string }) =>
      financeAPI.goals.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals', roomId] });
      handleCloseModal();
      toast.success(t('goals.created'));
    },
    onError: () => toast.error(t('errors.generic')),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Goal> }) =>
      financeAPI.goals.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals', roomId] });
      handleCloseModal();
      toast.success(t('goals.updated'));
    },
    onError: () => toast.error(t('errors.generic')),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => financeAPI.goals.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals', roomId] });
      toast.success(t('goals.deleted'));
    },
    onError: () => toast.error(t('errors.generic')),
  });

  const handleOpenModal = useCallback((goal?: Goal) => {
    if (goal) {
      setEditingGoal(goal);
      setFormData({
        title: goal.title,
        targetAmount: goal.targetAmount,
        currentAmount: goal.currentAmount,
        deadline: goal.deadline ? goal.deadline.split('T')[0] : '',
      });
    } else {
      setEditingGoal(null);
      setFormData({ title: '', targetAmount: 0, currentAmount: 0, deadline: '' });
    }
    setIsModalOpen(true);
  }, []);

  const handleCloseModal = useCallback(() => {
    setIsModalOpen(false);
    setEditingGoal(null);
    setFormData({ title: '', targetAmount: 0, currentAmount: 0, deadline: '' });
  }, []);

  const handleSubmit = useCallback(() => {
    if (!formData.title.trim() || formData.targetAmount <= 0) {
      toast.error(t('goals.fillRequired'));
      return;
    }

    if (editingGoal) {
      updateMutation.mutate({
        id: editingGoal._id,
        data: {
          title: formData.title,
          targetAmount: formData.targetAmount,
          currentAmount: formData.currentAmount,
          deadline: formData.deadline || undefined,
        },
      });
    } else {
      createMutation.mutate({
        title: formData.title,
        targetAmount: formData.targetAmount,
        deadline: formData.deadline || undefined,
        roomId,
      });
    }
  }, [formData, editingGoal, roomId, createMutation, updateMutation, t]);

  const handleAddProgress = useCallback((goal: Goal, amount: number) => {
    const newAmount = Math.min(goal.currentAmount + amount, goal.targetAmount);
    updateMutation.mutate({
      id: goal._id,
      data: { currentAmount: newAmount },
    });
  }, [updateMutation]);

  const handleDelete = useCallback((id: string) => {
    if (window.confirm(t('goals.confirmDelete'))) {
      deleteMutation.mutate(id);
    }
  }, [deleteMutation, t]);

  const getProgress = (goal: Goal) => {
    if (goal.targetAmount <= 0) return 0;
    return Math.min((goal.currentAmount / goal.targetAmount) * 100, 100);
  };

  const getDaysRemaining = (deadline?: string) => {
    if (!deadline) return null;
    const diff = new Date(deadline).getTime() - Date.now();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    return days;
  };

  const formatCurrency = (amount: number) => {
    return `${currencySymbols[currency]} ${amount.toLocaleString()}`;
  };

  if (isLoading) {
    return <div className={styles.loading}>{t('common.loading')}</div>;
  }

  return (
    <div className={styles.goals}>
      <div className={styles.goals__header}>
        <h2 className={styles.goals__title}>{t('goals.title')}</h2>
        <button
          type="button"
          onClick={() => handleOpenModal()}
          className={styles.goals__addBtn}
        >
          {t('goals.add')}
        </button>
      </div>

      <div className={styles.goals__list}>
        <AnimatePresence mode="popLayout">
          {goals.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className={styles.goals__empty}
            >
              {t('goals.empty')}
            </motion.div>
          ) : (
            goals.map((goal) => {
              const progress = getProgress(goal);
              const daysRemaining = getDaysRemaining(goal.deadline);
              const isCompleted = progress >= 100;

              return (
                <motion.div
                  key={goal._id}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className={`${styles.goals__card} ${isCompleted ? styles['goals__card--completed'] : ''}`}
                >
                  <div className={styles.goals__cardHeader}>
                    <h3 className={styles.goals__cardTitle}>{goal.title}</h3>
                    <div className={styles.goals__cardActions}>
                      <button
                        type="button"
                        onClick={() => handleOpenModal(goal)}
                        className={styles.goals__editBtn}
                        title={t('common.edit')}
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                        </svg>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(goal._id)}
                        className={styles.goals__deleteBtn}
                        title={t('common.delete')}
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <polyline points="3,6 5,6 21,6" />
                          <path d="M19,6v14a2,2,0,0,1-2,2H7a2,2,0,0,1-2-2V6m3,0V4a2,2,0,0,1,2-2h4a2,2,0,0,1,2,2V6" />
                        </svg>
                      </button>
                    </div>
                  </div>

                  <div className={styles.goals__amounts}>
                    <span className={styles.goals__current}>{formatCurrency(goal.currentAmount)}</span>
                    <span className={styles.goals__separator}>/</span>
                    <span className={styles.goals__target}>{formatCurrency(goal.targetAmount)}</span>
                  </div>

                  <ProgressBar
                    value={progress}
                    color={isCompleted ? '#10b981' : '#6366f1'}
                  />

                  <div className={styles.goals__footer}>
                    {daysRemaining !== null && (
                      <span className={`${styles.goals__deadline} ${daysRemaining < 0 ? styles['goals__deadline--overdue'] : ''}`}>
                        {daysRemaining > 0 
                          ? t('goals.daysRemaining', { days: daysRemaining })
                          : daysRemaining === 0
                            ? t('goals.dueToday')
                            : t('goals.overdue', { days: Math.abs(daysRemaining) })
                        }
                      </span>
                    )}
                    {!isCompleted && (
                      <div className={styles.goals__quickAdd}>
                        {[100, 500, 1000].map((amount) => (
                          <button
                            key={amount}
                            type="button"
                            onClick={() => handleAddProgress(goal, amount)}
                            className={styles.goals__quickAddBtn}
                            disabled={updateMutation.isPending}
                          >
                            +{amount}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })
          )}
        </AnimatePresence>
      </div>

      <Modal isOpen={isModalOpen} onClose={handleCloseModal} title={editingGoal ? t('goals.edit') : t('goals.add')}>
        <div className={styles.goals__form}>
          <div className={styles.goals__formGroup}>
            <label className={styles.goals__label}>{t('goals.titleLabel')}</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder={t('goals.titlePlaceholder')}
              className={styles.goals__input}
            />
          </div>

          <div className={styles.goals__formGroup}>
            <label className={styles.goals__label}>{t('goals.targetAmount')}</label>
            <div className={styles.goals__inputWithCurrency}>
              <input
                type="number"
                min={0}
                value={formData.targetAmount || ''}
                onChange={(e) => setFormData({ ...formData, targetAmount: Number(e.target.value) })}
                placeholder="0"
                className={styles.goals__input}
              />
              <span className={styles.goals__currencyBadge}>{currencySymbols[currency]}</span>
            </div>
          </div>

          {editingGoal && (
            <div className={styles.goals__formGroup}>
              <label className={styles.goals__label}>{t('goals.currentAmount')}</label>
              <div className={styles.goals__inputWithCurrency}>
                <input
                  type="number"
                  min={0}
                  max={formData.targetAmount}
                  value={formData.currentAmount || ''}
                  onChange={(e) => setFormData({ ...formData, currentAmount: Number(e.target.value) })}
                  placeholder="0"
                  className={styles.goals__input}
                />
                <span className={styles.goals__currencyBadge}>{currencySymbols[currency]}</span>
              </div>
            </div>
          )}

          <div className={styles.goals__formGroup}>
            <label className={styles.goals__label}>{t('goals.deadline')}</label>
            <input
              type="date"
              value={formData.deadline}
              onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
              min={new Date().toISOString().split('T')[0]}
              className={styles.goals__input}
            />
          </div>

          <div className={styles.goals__formActions}>
            <button
              type="button"
              onClick={handleCloseModal}
              className={styles.goals__cancelBtn}
            >
              {t('common.cancel')}
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={createMutation.isPending || updateMutation.isPending}
              className={styles.goals__submitBtn}
            >
              {editingGoal ? t('common.save') : t('goals.create')}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default GoalsWidget;
