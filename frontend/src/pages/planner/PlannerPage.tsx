import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { financeAPI } from '@shared/api';
import { useTranslation } from 'react-i18next';
import { Toggle, Dropdown } from '@shared/ui';
import { PlannerTab } from '@widgets/planner';
import styles from './PlannerPage.module.scss';

const PlannerPage: React.FC = () => {
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

  const toggleOptions = [
    { value: 'personal', label: t('home.personal') },
    { value: 'partner', label: t('home.withPartner') },
  ];

  return (
    <div className={styles['planner-page']}>
      <div className={styles['planner-page__header']}>
        <div className={styles['planner-page__header-inner']}>
          <div className={styles['planner-page__context']}>
            <Toggle
              options={toggleOptions}
              value={context}
              onChange={(val) => setContext(val as 'personal' | 'partner')}
            />
          </div>
          <AnimatePresence initial={false}>
            {context === 'partner' && rooms.length > 0 && (
              <motion.div
                key="room-select"
                initial={{ opacity: 0, y: -16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -16 }}
                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              >
                <Dropdown
                  options={roomOptions}
                  value={selectedRoomId || ''}
                  onChange={(val) => setSelectedRoomId(val || undefined)}
                  placeholder={t('partners.selectRoom')}
                  className={styles['planner-page__room']}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
      <div className={styles['planner-page__header-spacer']} aria-hidden />
      <PlannerTab roomId={currentRoomId} />
    </div>
  );
};

export default PlannerPage;
