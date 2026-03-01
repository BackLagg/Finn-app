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
    <nav className={styles.navigation}>
      {navItems.map(({ path, icon, labelKey }) => {
        const isActive = location.pathname === path;
        const label = t(labelKey);
        return (
          <NavLink
            key={path}
            to={path}
            className={`${styles.navigation__item}${isActive ? ` ${styles['navigation__item--active']}` : ''}`}
          >
            <div className={styles.navigation__icon}>
              <img src={icon} alt={label} />
            </div>
            <span className={styles.navigation__label}>{label}</span>
          </NavLink>
        );
      })}
    </nav>
  );
};

export default BottomNavigation;
