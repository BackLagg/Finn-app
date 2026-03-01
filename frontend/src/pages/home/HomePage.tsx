import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { financeAPI } from '@shared/api';
import { Dropdown } from '@shared/ui';
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

      <div className={styles['home-page__content']} />
    </div>
  );
};

export default HomePage;
