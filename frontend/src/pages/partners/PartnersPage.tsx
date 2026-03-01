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
      setRoomName('');
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

  const handleSwipe = (direction: 'left' | 'right') => {
    if (direction === 'left' && activeIndex < rooms.length - 1) {
      setActiveIndex(activeIndex + 1);
    } else if (direction === 'right' && activeIndex > 0) {
      setActiveIndex(activeIndex - 1);
    }
  };

  return (
    <div className={styles['partners-page']}>
      <h1 className={styles['partners-page__title']}>{t('partners.title')}</h1>
      
      <section className={styles['partners-page__actions']}>
        <div className={styles['partners-page__action-group']}>
          <input
            className={styles['partners-page__input']}
            value={roomName}
            onChange={(e) => setRoomName(e.target.value)}
            placeholder={t('partners.createRoom')}
          />
          <button
            type="button"
            onClick={handleCreate}
            disabled={createMutation.isPending}
            className={styles['partners-page__btn']}
          >
            {t('partners.createRoom')}
          </button>
        </div>
        <div className={styles['partners-page__action-group']}>
          <input
            className={styles['partners-page__input']}
            value={inviteCode}
            onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
            placeholder={t('partners.inviteCode')}
          />
          <button
            type="button"
            onClick={handleJoin}
            disabled={joinMutation.isPending}
            className={styles['partners-page__btn']}
          >
            {t('partners.invite')}
          </button>
        </div>
      </section>

      {rooms.length > 0 && (
        <section className={styles['partners-page__rooms']}>
          <div className={styles['partners-page__tabs']}>
            {rooms.map((r, i) => (
              <button
                key={r._id}
                type="button"
                className={`${styles['partners-page__tab']} ${activeIndex === i ? styles['partners-page__tab--active'] : ''}`}
                onClick={() => setActiveIndex(i)}
              >
                {r.name}
              </button>
            ))}
          </div>

          {activeRoom && (
            <div className={styles['partners-page__room-detail']}>
              <div className={styles['partners-page__room-header']}>
                <h2 className={styles['partners-page__room-name']}>{activeRoom.name}</h2>
              </div>
              
              <div className={styles['partners-page__room-info']}>
                <div className={styles['partners-page__info-item']}>
                  <span className={styles['partners-page__info-label']}>
                    {t('partners.inviteCode')}:
                  </span>
                  <span className={styles['partners-page__info-value']}>
                    {activeRoom.inviteCode}
                  </span>
                </div>
                <div className={styles['partners-page__info-item']}>
                  <span className={styles['partners-page__info-label']}>
                    {t('partners.members')}:
                  </span>
                  <span className={styles['partners-page__info-value']}>
                    {activeRoom.members?.length ?? 0}
                  </span>
                </div>
              </div>

              {activeRoom.members && activeRoom.members.length > 0 && (
                <div className={styles['partners-page__members']}>
                  <h3 className={styles['partners-page__members-title']}>
                    {t('partners.members')}
                  </h3>
                  <ul className={styles['partners-page__members-list']}>
                    {activeRoom.members.map((member, idx) => (
                      <li key={idx} className={styles['partners-page__member']}>
                        <span className={styles['partners-page__member-name']}>
                          {typeof member.userId === 'object' 
                            ? member.userId?.telegramID || member.userId?._id || 'User'
                            : member.userId || 'User'}
                        </span>
                        {member.contributionPercent && (
                          <span className={styles['partners-page__member-contribution']}>
                            {member.contributionPercent}%
                          </span>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </section>
      )}
    </div>
  );
};

export default PartnersPage;
