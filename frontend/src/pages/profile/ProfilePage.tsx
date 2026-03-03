import React, { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import { RootState } from '@app/store';
import { Dropdown, Toggle, DistributionSliders } from '@shared/ui';
import {
  useCurrencyPreference,
  useSavingsOnlyPreference,
  useDistributionPreference,
  useMonthlyIncomePreference,
  getProgressiveDistribution,
  normalizeDistribution,
} from '@shared/lib';
import { Currency, currencySymbols } from '@shared/lib/currency';
import styles from './ProfilePage.module.scss';

const ProfilePage: React.FC = () => {
  const { t } = useTranslation();
  const user = useSelector((state: RootState) => state.user);
  const [currency, setCurrency] = useCurrencyPreference();
  const [savingsOnly, setSavingsOnly] = useSavingsOnlyPreference();
  const [distribution, setDistribution] = useDistributionPreference();
  const [monthlyIncome, setMonthlyIncome] = useMonthlyIncomePreference();

  const handleSavingsOnlyChange = useCallback(
    (value: boolean) => {
      setSavingsOnly(value);
      if (value) {
        setDistribution(
          normalizeDistribution(
            distribution.savings + distribution.investments,
            0,
            distribution.purchases
          )
        );
      } else {
        setDistribution(getProgressiveDistribution(monthlyIncome || 0, currency));
      }
    },
    [distribution, monthlyIncome, setDistribution, setSavingsOnly, currency]
  );

  const handleResetDistribution = useCallback(() => {
    setDistribution(getProgressiveDistribution(monthlyIncome || 0, currency));
  }, [monthlyIncome, setDistribution, currency]);

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
            onChange={(v) => handleSavingsOnlyChange(v === 'savings')}
            className={styles['profile-page__toggle']}
          />
        </div>
      </section>

      <section className={styles['profile-page__distribution-block']}>
        <h2 className={styles['profile-page__section-title']}>
          {t('statistics.planner.distribution')}
        </h2>
        <div className={styles['profile-page__distribution-row']}>
          <label className={styles['profile-page__setting-label']}>
            {t('home.monthlyIncome')}
          </label>
          <div className={styles['profile-page__salary-input-wrap']}>
            <input
              type="number"
              min={0}
              step={1}
              value={monthlyIncome || ''}
              onChange={(e) => setMonthlyIncome(Number(e.target.value) || 0)}
              className={styles['profile-page__salary-input']}
              placeholder="0"
            />
            <span className={styles['profile-page__currency-badge']}>
              {currencySymbols[currency]} {currency}
            </span>
          </div>
        </div>
        <div className={styles['profile-page__distribution']}>
          <DistributionSliders
            distribution={distribution}
            onChange={setDistribution}
            savingsOnly={savingsOnly}
            savingsLabel={t('home.savings')}
            investmentsLabel={t('home.investments')}
            purchasesLabel={t('home.purchases')}
            monthlyAmount={monthlyIncome}
            currencySymbol={currencySymbols[currency]}
            onReset={handleResetDistribution}
            resetLabel={t('statistics.planner.applyStandard')}
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
