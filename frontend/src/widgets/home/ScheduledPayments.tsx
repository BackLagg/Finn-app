import React from 'react';
import { useTranslation } from 'react-i18next';
import { CategoryIcon, categoryColorMap } from '@shared/ui';
import { FiCreditCard, FiRepeat, FiClock } from 'react-icons/fi';
import styles from './ScheduledPayments.module.scss';

interface ScheduledPaymentsProps {
  roomId?: string;
}

interface ScheduledPayment {
  id: string;
  title: string;
  amount: number;
  currency: string;
  date: string;
  frequency: 'once' | 'daily' | 'weekly' | 'monthly' | 'yearly';
  category: string;
  paymentMethod: 'card' | 'cash';
}

const ScheduledPayments: React.FC<ScheduledPaymentsProps> = ({ roomId }) => {
  const { t } = useTranslation();

  const scheduledPayments: ScheduledPayment[] = [
    {
      id: '1',
      title: 'Питомцы',
      amount: 6,
      currency: '$',
      date: '20 января 2026, вторник',
      frequency: 'monthly',
      category: 'Питомцы',
      paymentMethod: 'card',
    },
    {
      id: '2',
      title: 'Еда',
      amount: 25,
      currency: '$',
      date: '21 января 2026, среда',
      frequency: 'once',
      category: 'Еда',
      paymentMethod: 'card',
    },
  ];

  const totalScheduled = scheduledPayments.reduce((s, p) => s + p.amount, 0);

  const getFrequencyText = (frequency: string) => {
    switch (frequency) {
      case 'once':
        return t('home.scheduledPayments.once');
      case 'daily':
        return t('home.scheduledPayments.daily');
      case 'weekly':
        return t('home.scheduledPayments.weekly');
      case 'monthly':
        return t('home.scheduledPayments.monthly');
      case 'yearly':
        return t('home.scheduledPayments.yearly');
      default:
        return '';
    }
  };

  const getFrequencyDetails = (frequency: string, date: string) => {
    if (frequency === 'monthly') {
      return t('home.scheduledPayments.everyMonth');
    } else if (frequency === 'once') {
      return t('home.scheduledPayments.oneTime');
    }
    return '';
  };

  return (
    <section className={styles['scheduled-payments']}>
      <div className={styles['scheduled-payments__header']}>
        <h2 className={styles['scheduled-payments__title']}>{t('home.scheduledPayments.title')}</h2>
        <button className={styles['scheduled-payments__sort-btn']}>
          <FiRepeat />
        </button>
      </div>

      <div className={styles['scheduled-payments__summary']}>
        <div className={styles['scheduled-payments__summary-label']}>
          {t('home.scheduledPayments.totalScheduled')}
        </div>
        <div className={styles['scheduled-payments__summary-amount']}>
          {totalScheduled} $
        </div>
        <div className={styles['scheduled-payments__summary-items']}>
          {scheduledPayments.map((payment) => {
            const color = categoryColorMap[payment.category] || '#848e9c';
            return (
              <div key={payment.id} className={styles['scheduled-payments__summary-item']}>
                <div 
                  className={styles['scheduled-payments__summary-icon']}
                  style={{ backgroundColor: `${color}20` }}
                >
                  <CategoryIcon category={payment.category} size={20} />
                </div>
                <div className={styles['scheduled-payments__summary-info']}>
                  <span className={styles['scheduled-payments__summary-category']}>{payment.category}</span>
                  <div className={styles['scheduled-payments__summary-progress']}>
                    <div 
                      className={styles['scheduled-payments__summary-progress-bar']}
                      style={{ backgroundColor: color }}
                    />
                    <span className={styles['scheduled-payments__summary-percentage']}>
                      {Math.round((payment.amount / totalScheduled) * 100)} %
                    </span>
                  </div>
                </div>
                <div className={styles['scheduled-payments__summary-value']}>
                  {payment.amount} $
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className={styles['scheduled-payments__list']}>
        {scheduledPayments.map((payment) => {
          const color = categoryColorMap[payment.category] || '#848e9c';
          return (
            <div key={payment.id} className={styles['scheduled-payments__item']}>
              <div className={styles['scheduled-payments__item-date']}>{payment.date}</div>
              <div className={styles['scheduled-payments__item-content']}>
                <div 
                  className={styles['scheduled-payments__item-icon']}
                  style={{ backgroundColor: `${color}20` }}
                >
                  <CategoryIcon category={payment.category} size={24} />
                </div>
                <div className={styles['scheduled-payments__item-info']}>
                  <div className={styles['scheduled-payments__item-title']}>{payment.title}</div>
                  <div className={styles['scheduled-payments__item-meta']}>
                    <FiCreditCard className={styles['scheduled-payments__item-meta-icon']} />
                    <span>{t('home.scheduledPayments.card')}</span>
                  </div>
                  <div className={styles['scheduled-payments__item-meta']}>
                    <FiRepeat className={styles['scheduled-payments__item-meta-icon']} />
                    <span>{getFrequencyText(payment.frequency)}</span>
                  </div>
                  <div className={styles['scheduled-payments__item-meta']}>
                    <FiClock className={styles['scheduled-payments__item-meta-icon']} />
                    <span>{getFrequencyDetails(payment.frequency, payment.date)}</span>
                  </div>
                </div>
                <div className={styles['scheduled-payments__item-amount']}>
                  {payment.amount} {payment.currency}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};

export default ScheduledPayments;
