import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import CalendarIcon from '@shared/assets/navigation/calendar.svg';
import ChartIcon from '@shared/assets/navigation/chart.svg';
import SettingsIcon from '@shared/assets/navigation/settings.svg';
import UsersIcon from '@shared/assets/navigation/users.svg';
import styles from './Navigation.module.scss';

const navItems = [
  { path: '/planner', icon: CalendarIcon, labelKey: 'statistics.planner.title' },
  { path: '/statistics', icon: ChartIcon, labelKey: 'statistics.title' },
  { path: '/settings', icon: SettingsIcon, labelKey: 'settings.title' },
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
