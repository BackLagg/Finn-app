import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import WalletIcon from '@shared/assets/navigation/wallet.svg';
import UserIcon from '@shared/assets/navigation/user.svg';
import UsersIcon from '@shared/assets/navigation/users.svg';
import styles from './Navigation.module.scss';

const navItems = [
  { path: '/home', icon: WalletIcon, labelKey: 'home.title' },
  { path: '/profile', icon: UserIcon, labelKey: 'profile.title' },
  { path: '/partners', icon: UsersIcon, labelKey: 'partners.title' },
];

const BottomNavigation: React.FC = () => {
  const location = useLocation();
  const { t } = useTranslation();

  return (
    <div className={styles.bottomNavigation}>
      {navItems.map(({ path, icon, labelKey }) => {
        const isActive = location.pathname === path;
        const label = t(labelKey);
        return (
          <NavLink
            key={path}
            to={path}
            className={`${styles.navButton}${isActive ? ` ${styles.active}` : ''}`}
          >
            <div className={styles.navIconWrapper}>
              <img src={icon} alt={label} className={styles.navIcon} />
            </div>
            <span className={styles.navLabel}>{label}</span>
          </NavLink>
        );
      })}
    </div>
  );
};

export default BottomNavigation;
