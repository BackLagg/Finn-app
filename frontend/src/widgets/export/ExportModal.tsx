import React, { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useMutation } from '@tanstack/react-query';
import { financeAPI, type ExportOptions } from '@shared/api';
import { Modal, Toggle } from '@shared/ui';
import { toast } from 'react-toastify';
import styles from './ExportModal.module.scss';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  roomId?: string;
}

const ExportModal: React.FC<ExportModalProps> = ({ isOpen, onClose, roomId }) => {
  const { t } = useTranslation();
  const [format, setFormat] = useState<'csv' | 'pdf' | 'json'>('csv');
  const [dateRange, setDateRange] = useState<'all' | 'month' | 'quarter' | 'year' | 'custom'>('month');
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');
  const [includeCategories, setIncludeCategories] = useState(true);
  const [includeReceipts, setIncludeReceipts] = useState(false);

  const getDateRange = useCallback(() => {
    const now = new Date();
    let from: string | undefined;
    let to: string | undefined = now.toISOString().split('T')[0];

    switch (dateRange) {
      case 'month':
        from = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
        break;
      case 'quarter':
        const quarterStart = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1);
        from = quarterStart.toISOString().split('T')[0];
        break;
      case 'year':
        from = new Date(now.getFullYear(), 0, 1).toISOString().split('T')[0];
        break;
      case 'custom':
        from = customFrom || undefined;
        to = customTo || undefined;
        break;
      default:
        from = undefined;
        to = undefined;
    }

    return { from, to };
  }, [dateRange, customFrom, customTo]);

  const exportMutation = useMutation({
    mutationFn: (options: ExportOptions) => financeAPI.export.generate(options),
    onSuccess: async (response) => {
      const { downloadUrl } = response.data;
      // Trigger download
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = `finn-export-${new Date().toISOString().split('T')[0]}.${format}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success(t('export.success'));
      onClose();
    },
    onError: () => toast.error(t('errors.generic')),
  });

  const handleExport = useCallback(() => {
    const { from, to } = getDateRange();
    
    exportMutation.mutate({
      format,
      from,
      to,
      includeCategories,
      includeReceipts,
      roomId,
    });
  }, [format, getDateRange, includeCategories, includeReceipts, roomId, exportMutation]);

  const formatOptions = [
    { value: 'csv', label: 'CSV', icon: '📊' },
    { value: 'pdf', label: 'PDF', icon: '📄' },
    { value: 'json', label: 'JSON', icon: '{ }' },
  ];

  const periodOptions = [
    { value: 'all', label: t('export.allTime') },
    { value: 'month', label: t('export.thisMonth') },
    { value: 'quarter', label: t('export.thisQuarter') },
    { value: 'year', label: t('export.thisYear') },
    { value: 'custom', label: t('export.customRange') },
  ];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={t('export.title')}>
      <div className={styles.export}>
        <div className={styles.export__section}>
          <label className={styles.export__label}>{t('export.format')}</label>
          <div className={styles.export__formats}>
            {formatOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setFormat(option.value as 'csv' | 'pdf' | 'json')}
                className={`${styles.export__formatBtn} ${format === option.value ? styles['export__formatBtn--active'] : ''}`}
              >
                <span className={styles.export__formatIcon}>{option.icon}</span>
                <span className={styles.export__formatLabel}>{option.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className={styles.export__section}>
          <label className={styles.export__label}>{t('export.period')}</label>
          <div className={styles.export__periods}>
            {periodOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setDateRange(option.value as typeof dateRange)}
                className={`${styles.export__periodBtn} ${dateRange === option.value ? styles['export__periodBtn--active'] : ''}`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {dateRange === 'custom' && (
          <div className={styles.export__customDates}>
            <div className={styles.export__dateField}>
              <label className={styles.export__dateLabel}>{t('export.from')}</label>
              <input
                type="date"
                value={customFrom}
                onChange={(e) => setCustomFrom(e.target.value)}
                className={styles.export__dateInput}
              />
            </div>
            <div className={styles.export__dateField}>
              <label className={styles.export__dateLabel}>{t('export.to')}</label>
              <input
                type="date"
                value={customTo}
                onChange={(e) => setCustomTo(e.target.value)}
                className={styles.export__dateInput}
              />
            </div>
          </div>
        )}

        <div className={styles.export__options}>
          <label className={styles.export__optionRow}>
            <span className={styles.export__optionLabel}>{t('export.includeCategories')}</span>
            <input
              type="checkbox"
              checked={includeCategories}
              onChange={(e) => setIncludeCategories(e.target.checked)}
              className={styles.export__checkbox}
            />
          </label>
          <label className={styles.export__optionRow}>
            <span className={styles.export__optionLabel}>{t('export.includeReceipts')}</span>
            <input
              type="checkbox"
              checked={includeReceipts}
              onChange={(e) => setIncludeReceipts(e.target.checked)}
              className={styles.export__checkbox}
            />
          </label>
        </div>

        <div className={styles.export__actions}>
          <button
            type="button"
            onClick={onClose}
            className={styles.export__cancelBtn}
          >
            {t('common.cancel')}
          </button>
          <button
            type="button"
            onClick={handleExport}
            disabled={exportMutation.isPending}
            className={styles.export__submitBtn}
          >
            {exportMutation.isPending ? t('export.generating') : t('export.download')}
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default ExportModal;
