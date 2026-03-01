import React from 'react';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import { RootState } from '@app/store';
import { useTheme } from '@features/theme';
import { useLanguage } from '@features/i18n';
import { Switch, Dropdown } from '@shared/ui';
import { useCurrencyPreference } from '@shared/lib/use-currency-preference';
import { Currency, currencySymbols } from '@shared/lib/currency';
import styles from './ProfilePage.module.scss';

const ProfilePage: React.FC = () => {
  const { t } = useTranslation();
  const user = useSelector((state: RootState) => state.user);
  const { theme, toggleTheme } = useTheme();
  const { language, setLanguage } = useLanguage();
  const [currency, setCurrency] = useCurrencyPreference();

  const getProfilePhoto = () => {
    if (window.Telegram?.WebApp?.initDataUnsafe?.user?.photo_url) {
      return window.Telegram.WebApp.initDataUnsafe.user.photo_url;
    }
    return null;
  };

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

      <section className={styles['profile-page__settings']}>
        <h2 className={styles['profile-page__section-title']}>{t('profile.settings')}</h2>
        <div className={styles['profile-page__setting-item']}>
          <span className={styles['profile-page__setting-label']}>{t('profile.currency')}</span>
          <Dropdown
            options={[
              { value: 'USD', label: `${currencySymbols.USD} USD` },
              { value: 'EUR', label: `${currencySymbols.EUR} EUR` },
              { value: 'RUB', label: `${currencySymbols.RUB} RUB` },
              { value: 'BYN', label: `${currencySymbols.BYN} BYN` },
            ]}
            value={currency}
            onChange={(val) => setCurrency(val as Currency)}
            className={styles['profile-page__dropdown']}
          />
        </div>
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
