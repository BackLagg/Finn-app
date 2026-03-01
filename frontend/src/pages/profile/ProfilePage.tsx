import React from 'react';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import { RootState } from '@app/store';
import { useTheme } from '@features/theme';
import { useLanguage } from '@features/i18n';
import { useQuery } from '@tanstack/react-query';
import { financeAPI } from '@shared/api';
import { Switch } from '@shared/ui';
import styles from './ProfilePage.module.scss';

const ProfilePage: React.FC = () => {
  const { t } = useTranslation();
  const user = useSelector((state: RootState) => state.user);
  const { theme, toggleTheme } = useTheme();
  const { language, setLanguage } = useLanguage();

  const { data: stats } = useQuery({
    queryKey: ['profileStats'],
    queryFn: async () => {
      const now = new Date();
      const from = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
      const to = now.toISOString().slice(0, 10);
      const res = await financeAPI.transactions.stats(undefined, from, to);
      return res.data;
    },
  });

  const getProfilePhoto = () => {
    if (window.Telegram?.WebApp?.initDataUnsafe?.user?.photo_url) {
      return window.Telegram.WebApp.initDataUnsafe.user.photo_url;
    }
    return null;
  };

  const totalExpenses = stats?.reduce((sum, s) => sum + s.total, 0) || 0;
  const topCategory = stats?.[0];

  return (
    <div className={styles['profile-page']}>
      <section className={styles['profile-page__user']}>
        <div className={styles['profile-page__avatar']}>
          {getProfilePhoto() ? (
            <img
              src={getProfilePhoto()!}
              alt="Profile"
              className={styles['profile-page__avatar-img']}
            />
          ) : (
            <div className={styles['profile-page__avatar-placeholder']}>
              {(user?.name || user?.username || 'U')[0].toUpperCase()}
            </div>
          )}
        </div>
        <h1 className={styles['profile-page__name']}>
          {user?.name || user?.username || 'User'}
        </h1>
      </section>

      <section className={styles['profile-page__summary']}>
        <h2 className={styles['profile-page__section-title']}>{t('profile.summary')}</h2>
        <div className={styles['profile-page__stats']}>
          <div className={styles['profile-page__stat-card']}>
            <div className={styles['profile-page__stat-label']}>
              {t('home.expenses')} ({new Date().toLocaleString('default', { month: 'long' })})
            </div>
            <div className={styles['profile-page__stat-value']}>
              {totalExpenses.toLocaleString()}
            </div>
          </div>
          {topCategory && (
            <div className={styles['profile-page__stat-card']}>
              <div className={styles['profile-page__stat-label']}>
                {t('common.category')}
              </div>
              <div className={styles['profile-page__stat-value']}>
                {topCategory.category}
              </div>
            </div>
          )}
        </div>
      </section>

      <section className={styles['profile-page__settings']}>
        <h2 className={styles['profile-page__section-title']}>{t('profile.settings')}</h2>
        <div className={styles['profile-page__setting-item']}>
          <span className={styles['profile-page__setting-label']}>{t('profile.language')}</span>
          <Switch
            checked={language === 'en'}
            onChange={() => setLanguage(language === 'ru' ? 'en' : 'ru')}
            leftLabel="RU"
            rightLabel="EN"
            size="md"
          />
        </div>
        <div className={styles['profile-page__setting-item']}>
          <span className={styles['profile-page__setting-label']}>{t('profile.theme')}</span>
          <Switch
            checked={theme === 'dark'}
            onChange={toggleTheme}
            leftLabel={t('profile.themeLight')}
            rightLabel={t('profile.themeDark')}
            size="md"
          />
        </div>
      </section>

      <section className={styles['profile-page__subscriptions']}>
        <h2 className={styles['profile-page__section-title']}>{t('profile.subscriptions')}</h2>
        <div className={styles['profile-page__placeholder']}>
          {t('common.coming_soon')}
        </div>
      </section>
    </div>
  );
};

export default ProfilePage;
