import React, { useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useLanguage } from '@features/i18n';
import { financeAPI } from '@shared/api';
import { toast } from 'react-toastify';
import styles from './ReceiptScanner.module.scss';

interface ReceiptScannerProps {
  roomId?: string;
}

const ReceiptScanner: React.FC<ReceiptScannerProps> = ({ roomId }) => {
  const { t } = useTranslation();
  const { language } = useLanguage();
  const queryClient = useQueryClient();
  const inputRef = useRef<HTMLInputElement>(null);

  const scanMutation = useMutation({
    mutationFn: (file: File) => financeAPI.receiptScan(file, language, roomId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions', roomId] });
      toast.success(t('common.save'));
    },
    onError: () => toast.error(t('errors.generic')),
  });

  const handleClick = () => inputRef.current?.click();
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) scanMutation.mutate(f);
    e.target.value = '';
  };

  return (
    <section className={styles['receipt-scanner']}>
      <h2 className={styles['receipt-scanner__title']}>{t('home.aiScanner')}</h2>
      <input ref={inputRef} type="file" accept="image/*" capture="environment" onChange={handleChange} hidden />
      <button
        type="button"
        onClick={handleClick}
        className={styles['receipt-scanner__btn']}
        disabled={scanMutation.isPending}
      >
        <span className={styles['receipt-scanner__btn-icon']}>📸</span>
        <span className={styles['receipt-scanner__btn-text']}>
          {scanMutation.isPending ? t('common.loading') : t('home.aiScanner')}
        </span>
      </button>
    </section>
  );
};

export default ReceiptScanner;
