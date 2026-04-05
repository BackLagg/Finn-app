import React, { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { financeAPI } from '@shared/api';
import { BudgetLimitsWidget } from '@widgets/budget-limits';
import { ExportModal } from '@widgets/export';
import { Toggle, Dropdown } from '@shared/ui';
import { toast } from 'react-toastify';
import { useRoomPreference } from '@shared/lib/use-room-preference';
import styles from './SettingsPage.module.scss';

const SettingsPage: React.FC = () => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [context, setContext, selectedRoomId, setSelectedRoomId] = useRoomPreference();
  const [showExport, setShowExport] = useState(false);
  const [activeTab, setActiveTab] = useState<'budgetLimits' | 'notifications' | 'recurring' | 'export'>('budgetLimits');

  const currentRoomId = context === 'partner' ? selectedRoomId : undefined;

  const { data: rooms = [] } = useQuery({
    queryKey: ['partnerRooms'],
    queryFn: async () => {
      const res = await financeAPI.partnerRooms.list();
      return res.data;
    },
  });

  const { data: notificationSettings } = useQuery({
    queryKey: ['notificationSettings'],
    queryFn: async () => {
      const res = await financeAPI.notifications.get();
      return res.data;
    },
  });

  const { data: recurring = [] } = useQuery({
    queryKey: ['recurring', currentRoomId],
    queryFn: async () => {
      const res = await financeAPI.recurring.list(currentRoomId);
      return res.data;
    },
  });

  const updateNotificationsMutation = useMutation({
    mutationFn: (data: any) => financeAPI.notifications.update(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notificationSettings'] });
      toast.success(t('settings.updated', 'Settings updated'));
    },
    onError: () => toast.error(t('errors.generic')),
  });

  const testNotificationMutation = useMutation({
    mutationFn: () => financeAPI.notifications.testPush(),
    onSuccess: () => toast.success(t('settings.testSent', 'Test notification sent')),
    onError: () => toast.error(t('errors.generic')),
  });

  const deleteRecurringMutation = useMutation({
    mutationFn: (id: string) => financeAPI.recurring.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recurring'] });
      toast.success(t('recurring.deleted', 'Deleted'));
    },
    onError: () => toast.error(t('errors.generic')),
  });

  const handleNotificationToggle = useCallback(
    (field: string, value: boolean) => {
      updateNotificationsMutation.mutate({ [field]: value });
    },
    [updateNotificationsMutation]
  );

  const roomOptions = rooms
    .filter((room) => !room.isFrozen)
    .map((room) => ({
      value: room._id,
      label: room.name,
    }));

  const toggleOptions = [
    { value: 'personal', label: t('home.personal', 'Personal') },
    { value: 'partner', label: t('home.withPartner', 'Partner') },
  ];

  const tabs = [
    { id: 'budgetLimits', label: t('budgetLimits.title', 'Budget Limits') },
    { id: 'notifications', label: t('settings.notifications', 'Notifications') },
    { id: 'recurring', label: t('recurring.title', 'Recurring') },
    { id: 'export', label: t('export.title', 'Export') },
  ] as const;

  return (
    <div className={styles.settings}>
      <div className={styles.settings__header}>
        <h1 className={styles.settings__title}>{t('settings.title', 'Settings')}</h1>
        
        <div className={styles.settings__context}>
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
            placeholder={t('partners.selectRoom', 'Select room')}
          />
        )}
      </div>

      <div className={styles.settings__tabs}>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`${styles.settings__tab} ${activeTab === tab.id ? styles['settings__tab--active'] : ''}`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className={styles.settings__content}>
        {activeTab === 'budgetLimits' && (
          <section className={styles.settings__section}>
            <BudgetLimitsWidget roomId={currentRoomId} />
          </section>
        )}

        {activeTab === 'notifications' && (
          <section className={styles.settings__section}>
            <div className={styles.settings__notificationsList}>
              <div className={styles.settings__notificationItem}>
                <div className={styles.settings__notificationInfo}>
                  <h3>{t('notifications.dailyReminder', 'Daily Reminder')}</h3>
                  <p>{t('notifications.dailyReminderDesc', 'Receive daily budget reminders')}</p>
                </div>
                <label className={styles.settings__switch}>
                  <input
                    type="checkbox"
                    checked={notificationSettings?.dailyReminder || false}
                    onChange={(e) => handleNotificationToggle('dailyReminder', e.target.checked)}
                  />
                  <span className={styles.settings__slider} />
                </label>
              </div>

              <div className={styles.settings__notificationItem}>
                <div className={styles.settings__notificationInfo}>
                  <h3>{t('notifications.budgetAlerts', 'Budget Alerts')}</h3>
                  <p>{t('notifications.budgetAlertsDesc', 'Alerts when approaching budget limit')}</p>
                </div>
                <label className={styles.settings__switch}>
                  <input
                    type="checkbox"
                    checked={notificationSettings?.budgetAlerts || false}
                    onChange={(e) => handleNotificationToggle('budgetAlerts', e.target.checked)}
                  />
                  <span className={styles.settings__slider} />
                </label>
              </div>

              <div className={styles.settings__notificationItem}>
                <div className={styles.settings__notificationInfo}>
                  <h3>{t('notifications.weeklyReport', 'Weekly Report')}</h3>
                  <p>{t('notifications.weeklyReportDesc', 'Weekly spending summary')}</p>
                </div>
                <label className={styles.settings__switch}>
                  <input
                    type="checkbox"
                    checked={notificationSettings?.weeklyReport || false}
                    onChange={(e) => handleNotificationToggle('weeklyReport', e.target.checked)}
                  />
                  <span className={styles.settings__slider} />
                </label>
              </div>

              <div className={styles.settings__notificationItem}>
                <div className={styles.settings__notificationInfo}>
                  <h3>{t('notifications.goalProgress', 'Goal Progress')}</h3>
                  <p>{t('notifications.goalProgressDesc', 'Milestone notifications')}</p>
                </div>
                <label className={styles.settings__switch}>
                  <input
                    type="checkbox"
                    checked={notificationSettings?.goalProgress || false}
                    onChange={(e) => handleNotificationToggle('goalProgress', e.target.checked)}
                  />
                  <span className={styles.settings__slider} />
                </label>
              </div>

              <button
                type="button"
                onClick={() => testNotificationMutation.mutate()}
                className={styles.settings__testBtn}
                disabled={testNotificationMutation.isPending}
              >
                {t('notifications.sendTest', 'Send test notification')}
              </button>
            </div>
          </section>
        )}

        {activeTab === 'recurring' && (
          <section className={styles.settings__section}>
            <div className={styles.settings__recurringList}>
              <h2>{t('recurring.title', 'Recurring Transactions')}</h2>
              {recurring.length === 0 ? (
                <p className={styles.settings__empty}>
                  {t('recurring.empty', 'No recurring transactions yet')}
                </p>
              ) : (
                recurring.map((item) => (
                  <div key={item._id} className={styles.settings__recurringItem}>
                    <div className={styles.settings__recurringInfo}>
                      <h3>{item.description || item.category}</h3>
                      <p>
                        {item.amount} • {item.frequency} • {item.type}
                      </p>
                      <p className={styles.settings__recurringNext}>
                        {t('recurring.nextDate', 'Next')}: {new Date(item.nextDate).toLocaleDateString()}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        if (confirm(t('recurring.confirmDelete', 'Delete this recurring transaction?'))) {
                          deleteRecurringMutation.mutate(item._id);
                        }
                      }}
                      className={styles.settings__deleteBtn}
                    >
                      ✕
                    </button>
                  </div>
                ))
              )}
            </div>
          </section>
        )}

        {activeTab === 'export' && (
          <section className={styles.settings__section}>
            <div className={styles.settings__exportSection}>
              <h2>{t('export.title', 'Export Data')}</h2>
              <p className={styles.settings__exportDesc}>
                {t('export.description', 'Download your transaction data in various formats')}
              </p>
              <button
                type="button"
                onClick={() => setShowExport(true)}
                className={styles.settings__exportBtn}
              >
                📤 {t('export.openModal', 'Open Export')}
              </button>
            </div>
          </section>
        )}
      </div>

      <ExportModal
        isOpen={showExport}
        onClose={() => setShowExport(false)}
        roomId={currentRoomId}
      />
    </div>
  );
};

export default SettingsPage;
