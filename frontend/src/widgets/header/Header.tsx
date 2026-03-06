import React, { memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from '@app/store';
import { FiSun, FiMoon } from 'react-icons/fi';
import { useTheme } from '@features/theme';
import { useLanguage } from '@features/i18n';
import { HeaderToggle } from './HeaderToggle';
import styles from './Header.module.scss';

const Header: React.FC = memo(() => {
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();
  const { language, setLanguage } = useLanguage();
  const user = useSelector((state: RootState) => state.user);

  const getUserData = () => {
    const telegramUser = window.Telegram?.WebApp?.initDataUnsafe?.user;
    if (!telegramUser) return { photo: null, name: '' };
    const name = [telegramUser.first_name, telegramUser.last_name].filter(Boolean).join(' ') || telegramUser.username || '';
    return {
      photo: telegramUser.photo_url || null,
      name,
    };
  };

  const { photo: profilePhoto, name: userName } = getUserData();

  const handleProfileClick = () => {
    navigate('/profile');
  };

  const getSubscriptionBadge = () => {
    if (user?.subscriptionTier === 'finn_plus') return 'Finn+';
    if (user?.subscriptionTier === 'finn') return 'Finn';
    return null;
  };

  const subscriptionBadge = getSubscriptionBadge();

  const languageOptions = [
    { value: 'ru', label: 'RU' },
    { value: 'en', label: 'EN' },
  ];

  const themeOptions = [
    { value: 'light', icon: <FiSun size={18} /> },
    { value: 'dark', icon: <FiMoon size={18} /> },
  ];

  return (
    <header className={styles.header}>
      <div
        className={styles['header__avatar-wrap']}
        onClick={handleProfileClick}
      >
        <div className={styles.header__avatar}>
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
          {userName && (
            <span className={styles.header__name}>{userName}</span>
          )}
          {subscriptionBadge && (
            <span className={`${styles['header__subscription-badge']} ${user?.subscriptionTier === 'finn_plus' ? styles['header__subscription-badge--plus'] : ''}`}>
              {subscriptionBadge}
            </span>
          )}
        </div>
      </div>
      <div className={styles.header__controls}>
        <div title="RU / EN">
          <HeaderToggle
            options={languageOptions}
            value={language}
            onChange={(val) => setLanguage(val as 'ru' | 'en')}
          />
        </div>
        <div title="Theme">
          <HeaderToggle
            options={themeOptions}
            value={theme}
            onChange={(val) => setTheme(val as 'light' | 'dark')}
          />
        </div>
      </div>
    </header>
  );
});

Header.displayName = 'Header';

export default Header;
