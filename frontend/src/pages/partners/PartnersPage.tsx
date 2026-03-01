import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { financeAPI } from '@shared/api';
import { toast } from 'react-toastify';
import styles from './PartnersPage.module.scss';

const PartnersPage: React.FC = () => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [roomName, setRoomName] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);

  const { data: rooms = [] } = useQuery({
    queryKey: ['partnerRooms'],
    queryFn: async () => {
      const res = await financeAPI.partnerRooms.list();
      return res.data;
    },
  });

  const createMutation = useMutation({
    mutationFn: (name: string) => financeAPI.partnerRooms.create(name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['partnerRooms'] });
      toast.success(t('partners.createRoom'));
    },
    onError: () => toast.error(t('errors.generic')),
  });

  const joinMutation = useMutation({
    mutationFn: (code: string) => financeAPI.partnerRooms.join(code),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['partnerRooms'] });
      setInviteCode('');
      toast.success(t('partners.invite'));
    },
    onError: () => toast.error(t('errors.generic')),
  });

  const handleCreate = () => {
    if (roomName.trim()) createMutation.mutate(roomName.trim());
  };

  const handleJoin = () => {
    if (inviteCode.trim()) joinMutation.mutate(inviteCode.trim().toUpperCase());
  };

  const activeRoom = rooms[activeIndex];

  return (
    <div className={styles.partnersPage}>
      <h1>{t('partners.title')}</h1>
      <section className={styles.actions}>
        <div>
          <input
            value={roomName}
            onChange={(e) => setRoomName(e.target.value)}
            placeholder={t('partners.createRoom')}
          />
          <button type="button" onClick={handleCreate} disabled={createMutation.isPending}>
            {t('partners.createRoom')}
          </button>
        </div>
        <div>
          <input
            value={inviteCode}
            onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
            placeholder={t('partners.inviteCode')}
          />
          <button type="button" onClick={handleJoin} disabled={joinMutation.isPending}>
            {t('partners.invite')}
          </button>
        </div>
      </section>
      {rooms.length > 0 && (
        <section className={styles.rooms}>
          <div className={styles.tabs}>
            {rooms.map((r, i) => (
              <button
                key={r._id}
                type="button"
                className={activeIndex === i ? styles.activeTab : ''}
                onClick={() => setActiveIndex(i)}
              >
                {r.name}
              </button>
            ))}
          </div>
          {activeRoom && (
            <div className={styles.roomDetail}>
              <h2>{activeRoom.name}</h2>
              <p>{t('partners.inviteCode')}: <strong>{activeRoom.inviteCode}</strong></p>
              <p>{t('partners.members')}: {activeRoom.members?.length ?? 0}</p>
            </div>
          )}
        </section>
      )}
    </div>
  );
};

export default PartnersPage;
