import React from 'react';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import { RootState } from '@app/store';
import { Dropdown, Toggle } from '@shared/ui';
import { useCurrencyPreference } from '@shared/lib/use-currency-preference';
import { useSavingsOnlyPreference } from '@shared/lib/use-savings-only-preference';
import { Currency, currencySymbols } from '@shared/lib/currency';
import styles from './ProfilePage.module.scss';

const ProfilePage: React.FC = () => {
  const { t } = useTranslation();
  const user = useSelector((state: RootState) => state.user);
  const [currency, setCurrency] = useCurrencyPreference();
  const [savingsOnly, setSavingsOnly] = useSavingsOnlyPreference();

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
          <Toggle
            options={[
              { value: 'full', label: t('statistics.planner.withInvestments') },
              { value: 'savings', label: t('statistics.planner.savingsOnly') },
            ]}
            value={savingsOnly ? 'savings' : 'full'}
            onChange={(v) => setSavingsOnly(v === 'savings')}
            className={styles['profile-page__toggle']}
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
