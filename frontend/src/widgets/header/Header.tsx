import React, { memo } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { RootState } from '@app/store';
import { useTheme } from '@features/theme';
import { useLanguage } from '@features/i18n';
import { Switch } from '@shared/ui';
import styles from './Header.module.scss';

const Header: React.FC = memo(() => {
  const user = useSelector((state: RootState) => state.user);
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { theme, toggleTheme } = useTheme();
  const { language, setLanguage } = useLanguage();

  const truncateText = (text: string, maxLength: number = 16): string => {
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
  };

  const getProfilePhoto = () => {
    if (window.Telegram?.WebApp?.initDataUnsafe?.user?.photo_url) {
      return window.Telegram.WebApp.initDataUnsafe.user.photo_url;
    }
    return null;
  };

  const profilePhoto = getProfilePhoto();

  const handleProfileClick = () => {
    navigate('/profile');
  };

  return (
    <header className={styles.header}>
      <div
        className={styles.header__user}
        onClick={handleProfileClick}
      >
        <div className={styles['header__avatar']}>
          {profilePhoto ? (
            <img
              src={profilePhoto}
              alt="Profile"
              className={styles['header__avatar-img']}
            />
          ) : (
            <div className={styles['header__avatar-placeholder']} />
          )}
        </div>
        <div className={styles['header__user-info']}>
          <span
            className={styles['header__name']}
            title={user.name || user.username || 'User'}
          >
            {truncateText(user.name || user.username || 'User')}
          </span>
        </div>
      </div>
      <div className={styles.header__controls}>
        <div className={styles.header__switch}>
          <Switch
            checked={language === 'en'}
            onChange={() => setLanguage(language === 'ru' ? 'en' : 'ru')}
            leftLabel="RU"
            rightLabel="EN"
            size="sm"
          />
        </div>
        <div className={styles.header__switch}>
          <Switch
            checked={theme === 'dark'}
            onChange={toggleTheme}
            leftLabel={t('profile.themeLight')}
            rightLabel={t('profile.themeDark')}
            size="sm"
          />
        </div>
      </div>
    </header>
  );
});

Header.displayName = 'Header';

export default Header;
