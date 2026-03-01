import React, { memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiSun, FiMoon } from 'react-icons/fi';
import { useTheme } from '@features/theme';
import { useLanguage } from '@features/i18n';
import { HeaderToggle } from './HeaderToggle';
import styles from './Header.module.scss';

const Header: React.FC = memo(() => {
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();
  const { language, setLanguage } = useLanguage();

  const getUserData = () => {
    const user = window.Telegram?.WebApp?.initDataUnsafe?.user;
    if (!user) return { photo: null, name: '' };
    const name = [user.first_name, user.last_name].filter(Boolean).join(' ') || user.username || '';
    return {
      photo: user.photo_url || null,
      name,
    };
  };

  const { photo: profilePhoto, name: userName } = getUserData();

  const handleProfileClick = () => {
    navigate('/profile');
  };

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
        {userName && (
          <span className={styles.header__name}>{userName}</span>
        )}
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
