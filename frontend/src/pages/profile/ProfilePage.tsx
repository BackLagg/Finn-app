import React from 'react';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import { RootState } from '@app/store';
import { useTheme } from '@features/theme';
import { useLanguage } from '@features/i18n';
import styles from './ProfilePage.module.scss';

const ProfilePage: React.FC = () => {
  const { t } = useTranslation();
  const user = useSelector((state: RootState) => state.user);
  const { theme, toggleTheme } = useTheme();
  const { language, setLanguage } = useLanguage();

  return (
    <div className={styles.profilePage}>
      <h1>{t('profile.title')}</h1>
      <section className={styles.section}>
        <h2>{t('profile.summary')}</h2>
        <p>{user?.name || user?.username || 'User'}</p>
      </section>
      <section className={styles.section}>
        <h2>{t('profile.settings')}</h2>
        <div className={styles.setting}>
          <span>{t('profile.theme')}</span>
          <button type="button" onClick={toggleTheme}>
            {theme === 'dark' ? 'Light' : 'Dark'}
          </button>
        </div>
        <div className={styles.setting}>
          <span>{t('profile.language')}</span>
          <button
            type="button"
            onClick={() => setLanguage(language === 'ru' ? 'en' : 'ru')}
          >
            {language === 'ru' ? 'EN' : 'RU'}
          </button>
        </div>
      </section>
    </div>
  );
};

export default ProfilePage;
