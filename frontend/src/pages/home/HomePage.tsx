import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { financeAPI } from '@shared/api';
import { Dropdown } from '@shared/ui';
import { useCurrencyPreference } from '@shared/lib/use-currency-preference';
import {
  ExpenseList,
  GoalsSection,
  BudgetSection,
  ScheduledPayments,
  MonthlyBalance,
  CalendarWithReminders,
} from '@widgets/home';
import MonthlyBudgetInput from '@widgets/home/MonthlyBudgetInput';
import styles from './HomePage.module.scss';

const HomePage: React.FC = () => {
  const { t } = useTranslation();
  const [currency] = useCurrencyPreference();
  const [context, setContext] = useState<'personal' | 'partner'>('personal');
  const [selectedRoomId, setSelectedRoomId] = useState<string | undefined>();

  const { data: rooms = [] } = useQuery({
    queryKey: ['partnerRooms'],
    queryFn: async () => {
      const res = await financeAPI.partnerRooms.list();
      return res.data;
    },
  });

  const currentRoomId = context === 'partner' ? selectedRoomId : undefined;

  const roomOptions = rooms.map((room) => ({
    value: room._id,
    label: room.name,
  }));

  return (
    <div className={styles['home-page']}>
      <div className={styles['home-page__header']}>
        <div className={styles['home-page__context-filter']}>
          <button
            className={`${styles['home-page__tab']} ${context === 'personal' ? styles['home-page__tab--active'] : ''}`}
            onClick={() => setContext('personal')}
          >
            {t('home.personal')}
          </button>
          <button
            className={`${styles['home-page__tab']} ${context === 'partner' ? styles['home-page__tab--active'] : ''}`}
            onClick={() => setContext('partner')}
          >
            {t('home.withPartner')}
          </button>
        </div>
        {context === 'partner' && rooms.length > 0 && (
          <Dropdown
            options={roomOptions}
            value={selectedRoomId || ''}
            onChange={(val) => setSelectedRoomId(val || undefined)}
            placeholder={t('partners.selectRoom')}
            className={styles['home-page__room-select']}
          />
        )}
      </div>

      <div className={styles['home-page__content']}>
        <MonthlyBudgetInput roomId={currentRoomId} />

        <div className={styles['home-page__calendar-section']}>
          <CalendarWithReminders roomId={currentRoomId} currency={currency} />
        </div>

        <MonthlyBalance roomId={currentRoomId} />
        <BudgetSection roomId={currentRoomId} />
        <ScheduledPayments roomId={currentRoomId} />
        <GoalsSection roomId={currentRoomId} />
        <ExpenseList roomId={currentRoomId} />
      </div>
    </div>
  );
};

export default HomePage;
