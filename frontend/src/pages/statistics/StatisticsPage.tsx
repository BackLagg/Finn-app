import React, { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { financeAPI } from '@shared/api';
import { useTranslation } from 'react-i18next';
import { Toggle, Dropdown } from '@shared/ui';
import { useRoomPreference } from '@shared/lib/use-room-preference';
import { StatisticsTab } from '@widgets/statistics';
import styles from './StatisticsPage.module.scss';

const StatisticsPage: React.FC = () => {
  const { t } = useTranslation();
  const [context, setContext, selectedRoomId, setSelectedRoomId] = useRoomPreference();

  const { data: rooms = [] } = useQuery({
    queryKey: ['partnerRooms'],
    queryFn: async () => {
      const res = await financeAPI.partnerRooms.list();
      return res.data;
    },
  });

  const currentRoomId = context === 'partner' ? selectedRoomId : undefined;

  useEffect(() => {
    if (context === 'partner' && rooms.length > 0 && !selectedRoomId) {
      setSelectedRoomId(rooms[0]._id);
    }
  }, [context, rooms, selectedRoomId]);

  const roomOptions = rooms
    .filter((room) => !room.isFrozen)
    .map((room) => ({
      value: room._id,
      label: room.name,
    }));

  const toggleOptions = [
    { value: 'personal', label: t('home.personal') },
    { value: 'partner', label: t('home.withPartner') },
  ];

  return (
    <div className={styles['statistics-page']}>
      <div className={styles['statistics-page__header']}>
        <div className={styles['statistics-page__header-inner']}>
          <div className={styles['statistics-page__context']}>
            <Toggle
              options={toggleOptions}
              value={context}
              onChange={(val) => setContext(val as 'personal' | 'partner')}
            />
          </div>
          {context === 'partner' && roomOptions.length > 0 && (
            <Dropdown
              options={roomOptions}
              value={selectedRoomId || ''}
              onChange={(val) => setSelectedRoomId(val || undefined)}
              placeholder={t('partners.selectRoom')}
              className={styles['statistics-page__room']}
            />
          )}
        </div>
      </div>
      <div
        className={`${styles['statistics-page__header-spacer']} ${context === 'partner' && roomOptions.length > 0 ? styles['statistics-page__header-spacer--with-room'] : ''}`}
        aria-hidden
      />
      <div className={styles['statistics-page__content']}>
        {context === 'partner' && roomOptions.length === 0 ? (
          <div className={styles['statistics-page__no-rooms']}>
            {t('statistics.planner.noRooms')}
          </div>
        ) : (
          <StatisticsTab roomId={currentRoomId} />
        )}
      </div>
    </div>
  );
};

export default StatisticsPage;
