import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { financeAPI } from '@shared/api';
import {
  ChartsSection,
  ExpenseCalculator,
  ExpenseList,
  GoalsSection,
  ReceiptScanner,
  ShoppingLists,
  PinnedShoppingList,
} from '@widgets/home';
import styles from './HomePage.module.scss';

const HomePage: React.FC = () => {
  const { t } = useTranslation();
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

  return (
    <div className={styles['home-page']}>
      <div className={styles['home-page__header']}>
        <h1 className={styles['home-page__title']}>{t('home.title')}</h1>
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
          <select
            className={styles['home-page__room-select']}
            value={selectedRoomId || ''}
            onChange={(e) => setSelectedRoomId(e.target.value || undefined)}
          >
            <option value="">{t('partners.selectRoom')}</option>
            {rooms.map((room) => (
              <option key={room._id} value={room._id}>
                {room.name}
              </option>
            ))}
          </select>
        )}
      </div>

      <div className={styles['home-page__content']}>
        <ReceiptScanner roomId={currentRoomId} />
        <ChartsSection roomId={currentRoomId} />
        <ExpenseCalculator roomId={currentRoomId} />
        <ExpenseList roomId={currentRoomId} />
        <GoalsSection roomId={currentRoomId} />
        <ShoppingLists roomId={currentRoomId} />
      </div>

      <PinnedShoppingList />
    </div>
  );
};

export default HomePage;
