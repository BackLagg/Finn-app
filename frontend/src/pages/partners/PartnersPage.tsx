import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSelector } from 'react-redux';
import type { RootState } from '@app/store';
import { financeAPI, type PartnerRoom } from '@shared/api';
import { hasActiveSubscription } from '@shared/lib/subscription';
import { toast } from 'react-toastify';
import QRCode from 'qrcode';
import jsQR from 'jsqr';
import styles from './PartnersPage.module.scss';

const TG_BOT_USERNAME = (import.meta.env as Record<string, string | undefined>).VITE_TG_BOT_USERNAME || 'fabricbotbot';
const TG_APP_NAME = (import.meta.env as Record<string, string | undefined>).VITE_TG_APP_NAME || 'app';

function parseInviteFromQrPayload(data: string): string | null {
  try {
    const u = data.startsWith('http') ? new URL(data) : null;
    if (u) {
      const invite = u.searchParams.get('invite') || u.searchParams.get('startapp');
      if (invite) return invite.trim().toUpperCase();
    }
    if (/^[A-Za-z0-9]{8,20}$/.test(data.trim())) return data.trim().toUpperCase();
  } catch {}
  return null;
}

function getMemberId(member: PartnerRoom['members'][0]): string {
  const u = member.userId;
  if (typeof u === 'object' && u && '_id' in u && u._id) return String(u._id);
  return String(u);
}

function getMemberDisplayName(member: PartnerRoom['members'][0]): string {
  const u = member.userId;
  if (typeof u !== 'object') return String(u);
  return (
    (u as { username?: string; name?: string; telegramID?: string }).username ||
    (u as { name?: string }).name ||
    (u as { telegramID?: string }).telegramID ||
    'User'
  );
}

const PartnersPage: React.FC = () => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const user = useSelector((state: RootState) => state.user);
  const userId = user?.id ?? null;
  const [roomName, setRoomName] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);

  const scanInputRef = useRef<HTMLInputElement>(null);

  const canCreateJoinRooms = hasActiveSubscription(user, 'finn');

  useEffect(() => {
    const invite = searchParams.get('invite');
    if (invite) {
      setInviteCode(invite.trim().toUpperCase());
      setSearchParams({}, { replace: true });
      return;
    }
    const startParam = (window?.Telegram?.WebApp?.initDataUnsafe as { start_param?: string } | undefined)?.start_param;
    if (startParam) {
      setInviteCode(startParam.trim().toUpperCase());
    }
  }, [searchParams, setSearchParams]);

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
      toast.success(t('partners.joinedSuccess'));
    },
    onError: () => toast.error(t('errors.generic')),
  });

  const deleteRoomMutation = useMutation({
    mutationFn: (id: string) => financeAPI.partnerRooms.delete(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['partnerRooms'] });
      setActiveIndex((i) => (rooms.findIndex((r) => r._id === id) <= i && i > 0 ? i - 1 : i));
      toast.success(t('partners.roomDeleted'));
    },
    onError: () => toast.error(t('errors.generic')),
  });

  const regenerateCodeMutation = useMutation({
    mutationFn: (id: string) => financeAPI.partnerRooms.regenerateCode(id),
    onSuccess: (res, id) => {
      queryClient.invalidateQueries({ queryKey: ['partnerRooms'] });
      if (res.data?.inviteCode) toast.success(t('partners.codeRegenerated'));
    },
    onError: () => toast.error(t('errors.generic')),
  });

  const removeMemberMutation = useMutation({
    mutationFn: ({ roomId, memberUserId }: { roomId: string; memberUserId: string }) =>
      financeAPI.partnerRooms.removeMember(roomId, memberUserId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['partnerRooms'] });
      toast.success(t('partners.memberRemoved'));
    },
    onError: () => toast.error(t('errors.generic')),
  });

  const updateRoomMutation = useMutation({
    mutationFn: ({ id, name }: { id: string; name: string }) => financeAPI.partnerRooms.update(id, name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['partnerRooms'] });
      toast.success(t('partners.roomUpdated'));
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
  const isOwner =
    activeRoom && userId && activeRoom.members.some((m) => getMemberId(m) === userId && m.role === 'owner');

  const [editRoomName, setEditRoomName] = useState('');
  useEffect(() => {
    if (activeRoom) setEditRoomName(activeRoom.name);
  }, [activeRoom?._id, activeRoom?.name]);

  const handleSaveRoomName = () => {
    if (!activeRoom || !isOwner || editRoomName.trim() === activeRoom.name) return;
    updateRoomMutation.mutate({ id: activeRoom._id, name: editRoomName.trim() });
  };

  const inviteUrl =
    activeRoom
      ? `https://t.me/${TG_BOT_USERNAME}/${TG_APP_NAME}?startapp=${encodeURIComponent(activeRoom.inviteCode)}`
      : '';

  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  useEffect(() => {
    if (!inviteUrl) {
      setQrDataUrl('');
      return;
    }
    QRCode.toDataURL(inviteUrl, { width: 120, margin: 1 }).then(setQrDataUrl).catch(() => setQrDataUrl(''));
  }, [inviteUrl]);

  const handleDeleteRoom = () => {
    if (!activeRoom || !isOwner) return;
    if (!window.confirm(t('partners.confirmDeleteRoom'))) return;
    deleteRoomMutation.mutate(activeRoom._id);
  };

  const handleScanQR = () => scanInputRef.current?.click();

  const handleScanFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file || !file.type.startsWith('image/')) return;
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.drawImage(img, 0, 0);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const result = jsQR(imageData.data, imageData.width, imageData.height);
      if (result?.data) {
        const code = parseInviteFromQrPayload(result.data);
        if (code) {
          setInviteCode(code);
          toast.success(t('partners.codeScanned'));
        }
      }
    };
    img.onerror = () => URL.revokeObjectURL(url);
    img.src = url;
  };

  return (
    <div className={styles['partners-page']}>
      <section className={styles['partners-page__actions']}>
        {!canCreateJoinRooms && (
          <div className={styles['partners-page__warning']}>
            {t('partners.subscriptionRequired')}
          </div>
        )}
        <div className={styles['partners-page__action-group']}>
          <input
            className={styles['partners-page__input']}
            value={roomName}
            onChange={(e) => setRoomName(e.target.value)}
            placeholder={t('partners.createRoom')}
            disabled={!canCreateJoinRooms}
          />
          <button
            type="button"
            onClick={handleCreate}
            disabled={createMutation.isPending || !canCreateJoinRooms}
            className={styles['partners-page__btn']}
            title={!canCreateJoinRooms ? t('partners.subscriptionRequired') : undefined}
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
            disabled={!canCreateJoinRooms}
          />
          <button
            type="button"
            onClick={handleJoin}
            disabled={joinMutation.isPending || !canCreateJoinRooms}
            className={styles['partners-page__btn']}
            title={!canCreateJoinRooms ? t('partners.subscriptionRequired') : undefined}
          >
            {t('partners.join')}
          </button>
        </div>
        <div className={styles['partners-page__action-group']}>
          <input
            ref={scanInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            aria-hidden
            className={styles['partners-page__file-hidden']}
            onChange={handleScanFile}
          />
          <button
            type="button"
            onClick={handleScanQR}
            className={styles['partners-page__btn-secondary']}
            disabled={!canCreateJoinRooms}
            title={!canCreateJoinRooms ? t('partners.subscriptionRequired') : undefined}
          >
            {t('partners.scanQR')}
          </button>
        </div>
      </section>

      {rooms.length > 0 && (
        <>
          <div className={styles['partners-page__tabs-wrap']}>
            <div className={styles['partners-page__tabs']}>
              {rooms.map((r, i) => (
                <button
                  key={r._id}
                  type="button"
                  className={`${styles['partners-page__tab']} ${activeIndex === i ? styles['partners-page__tab--active'] : ''} ${r.isFrozen ? styles['partners-page__tab--frozen'] : ''}`}
                  onClick={() => setActiveIndex(i)}
                  disabled={r.isFrozen}
                  title={r.isFrozen ? t('partners.roomFrozen') : undefined}
                >
                  {r.name} {r.isFrozen && '(🔒)'}
                </button>
              ))}
            </div>
          </div>

          <section className={styles['partners-page__rooms']}>
          {activeRoom && (
            <div className={styles['partners-page__room-detail']}>
              {activeRoom.isFrozen && (
                <div className={styles['partners-page__frozen-warning']}>
                  {t('partners.roomFrozenMessage')}
                </div>
              )}
              <div className={styles['partners-page__two-col']}>
                <div className={styles['partners-page__left-col']}>
                  {isOwner ? (
                    <>
                      <label className={styles['partners-page__field-label']}>
                        {t('partners.roomNamePlaceholder')}
                      </label>
                      <input
                        type="text"
                        className={styles['partners-page__name-input']}
                        value={editRoomName}
                        onChange={(e) => setEditRoomName(e.target.value)}
                        onBlur={handleSaveRoomName}
                        placeholder={t('partners.roomNamePlaceholder')}
                      />
                      <button
                        type="button"
                        onClick={() => regenerateCodeMutation.mutate(activeRoom._id)}
                        disabled={regenerateCodeMutation.isPending}
                        className={styles['partners-page__btn']}
                      >
                        {t('partners.regenerateCode')}
                      </button>
                    </>
                  ) : (
                    <span className={styles['partners-page__room-name-readonly']}>{activeRoom.name}</span>
                  )}
                </div>
                <div className={styles['partners-page__qr-section']}>
                  <span className={styles['partners-page__qr-label']}>{t('partners.inviteCodeQR')}</span>
                  {qrDataUrl ? (
                    <img src={qrDataUrl} alt="QR" width={120} height={120} className={styles['partners-page__qr']} />
                  ) : null}
                </div>
              </div>

              <div className={styles['partners-page__code-block']}>
                <button
                  type="button"
                  className={styles['partners-page__invite-code-btn']}
                  onClick={() => {
                    navigator.clipboard.writeText(activeRoom.inviteCode);
                    toast.success(t('partners.copied'));
                  }}
                  title={t('partners.inviteCode')}
                >
                  <span className={styles['partners-page__code-label']}>{t('partners.inviteCode')}</span>
                  <span className={styles['partners-page__code-value']}>{activeRoom.inviteCode}</span>
                </button>
                {isOwner && (
                  <button
                    type="button"
                    onClick={handleDeleteRoom}
                    disabled={deleteRoomMutation.isPending}
                    className={styles['partners-page__btn-danger']}
                  >
                    {t('partners.deleteRoom')}
                  </button>
                )}
              </div>

              <div className={styles['partners-page__members']}>
                <div className={styles['partners-page__members-list']}>
                  {activeRoom.members?.map((member, idx) => (
                    <div
                      key={idx}
                      className={`${styles['partners-page__member']} ${styles['partners-page__member--static']} ${member.role === 'owner' ? styles['partners-page__member--owner'] : ''}`}
                    >
                      <span className={styles['partners-page__member-name']}>
                        {getMemberDisplayName(member)}
                      </span>
                      <div className={styles['partners-page__member-right']}>
                        {member.contributionPercent != null && (
                          <span className={styles['partners-page__member-contribution']}>
                            {member.contributionPercent}%
                          </span>
                        )}
                        {isOwner && member.role !== 'owner' && (
                          <button
                            type="button"
                            onClick={() =>
                              removeMemberMutation.mutate({
                                roomId: activeRoom._id,
                                memberUserId: getMemberId(member),
                              })
                            }
                            disabled={removeMemberMutation.isPending}
                            className={styles['partners-page__btn-remove']}
                            title={t('partners.removeMember')}
                          >
                            {t('partners.removeMember')}
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
          </section>
        </>
      )}
    </div>
  );
};

export default PartnersPage;
