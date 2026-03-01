import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { financeAPI } from '@shared/api';
import { Toggle, Dropdown } from '@shared/ui';
import { ChartsSection, CategoryExpenses } from '@widgets/home';
import { ExpenseIncomeDonutChart } from './ExpenseIncomeDonutChart';
import styles from './StatisticsTab.module.scss';

interface StatisticsTabProps {
  roomId?: string;
}

export const StatisticsTab: React.FC<StatisticsTabProps> = ({ roomId }) => {
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

  const { data: stats = [] } = useQuery({
    queryKey: ['profileStats', currentRoomId],
    queryFn: async () => {
      const now = new Date();
      const from = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
      const to = now.toISOString().slice(0, 10);
      const res = await financeAPI.transactions.stats({ roomId: currentRoomId, from, to });
      return res.data;
    },
  });

  const totalExpenses = stats.reduce((sum, s) => sum + s.total, 0);
  const topCategory = stats[0];

  const roomOptions = rooms.map((room) => ({
    value: room._id,
    label: room.name,
  }));

  const toggleOptions = [
    { value: 'personal', label: t('home.personal') },
    { value: 'partner', label: t('home.withPartner') },
  ];

  return (
    <div className={styles.statistics}>
      <h2 className={styles.statistics__title}>{t('profile.statistics')}</h2>

      <div className={styles.statistics__context}>
        <Toggle
          options={toggleOptions}
          value={context}
          onChange={(val) => setContext(val as 'personal' | 'partner')}
        />
      </div>

      {context === 'partner' && rooms.length > 0 && (
        <div className={styles.statistics__room}>
          <Dropdown
            options={roomOptions}
            value={selectedRoomId || ''}
            onChange={(val) => setSelectedRoomId(val || undefined)}
            placeholder={t('partners.selectRoom')}
          />
        </div>
      )}

      <div className={styles.statistics__summary}>
        <div className={styles.statistics__card}>
          <div className={styles.statistics__cardLabel}>
            {t('home.expenses')} ({new Date().toLocaleString(undefined, { month: 'long' })})
          </div>
          <div className={styles.statistics__cardValue}>{totalExpenses.toLocaleString()} $</div>
        </div>
        {topCategory && (
          <div className={styles.statistics__card}>
            <div className={styles.statistics__cardLabel}>{t('common.category')}</div>
            <div className={styles.statistics__cardValue}>{topCategory.category}</div>
          </div>
        )}
      </div>

      <ExpenseIncomeDonutChart roomId={currentRoomId} />
      <CategoryExpenses roomId={currentRoomId} />
      <ChartsSection roomId={currentRoomId} />
    </div>
  );
};
