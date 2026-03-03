import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import type { StepContent } from '../types';
import type { Distribution } from '@shared/lib/distribution';
import type { Currency } from '@shared/lib/currency';
import { Dropdown, Toggle, DistributionSliders } from '@shared/ui';
import { currencySymbols } from '@shared/lib/currency';
import styles from './OnboardingStep.module.scss';

import lockImage from '@shared/assets/onboarding/lock.svg';
import coinImage from '@shared/assets/onboarding/coin.svg';
import lightningImage from '@shared/assets/onboarding/lightning.svg';
import cardImage from '@shared/assets/onboarding/card.svg';

interface OnboardingStepProps {
  currentStep: number;
  totalSteps: number;
  onNext: () => void;
  onBack: () => void;
  onClose: () => void;
  stepContent: StepContent;
  isLastStep?: boolean;
  isLoading?: boolean;
  fullName?: string;
  onFullNameChange?: (name: string) => void;
  monthlySalary?: number;
  onMonthlySalaryChange?: (value: number) => void;
  currency?: Currency;
  onCurrencyChange?: (c: Currency) => void;
  savingsOnly?: boolean;
  onSavingsOnlyChange?: (value: boolean) => void;
  distribution?: Distribution;
  onDistributionChange?: (d: Distribution) => void;
  onApplyStandard?: () => void;
}

const getImageSource = (imageName: string): string => {
  switch (imageName) {
    case 'lock':
      return lockImage;
    case 'coin':
      return coinImage;
    case 'lightning':
      return lightningImage;
    case 'card':
      return cardImage;
    default:
      return lockImage;
  }
};

const OnboardingStep: React.FC<OnboardingStepProps> = ({
  currentStep,
  onNext,
  onBack,
  stepContent,
  isLastStep = false,
  isLoading = false,
  fullName = '',
  onFullNameChange,
  monthlySalary = 0,
  onMonthlySalaryChange,
  currency = 'USD',
  onCurrencyChange,
  savingsOnly = false,
  onSavingsOnlyChange,
  distribution,
  onDistributionChange,
  onApplyStandard,
}) => {
  const { t } = useTranslation();
  const isFirstStep = currentStep === 1;
  const [imageLoading, setImageLoading] = useState(true);
  const isFormStep = stepContent.isForm;

  const isFormValid = isFormStep ? fullName.trim().length >= 2 : true;

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && isFormValid && !isLoading) {
      onNext();
    }
  };

  useEffect(() => {
    const imageSource = getImageSource(stepContent.image);
    const img = new Image();
    img.onload = () => {
      setImageLoading(false);
    };
    img.onerror = () => {
      setImageLoading(false);
    };
    img.src = imageSource;
  }, [currentStep, stepContent.image]);

  const renderImage = () => {
    const imageSource = getImageSource(stepContent.image);
    
    return (
      <div className={styles.imagePlaceholder}>
        {imageLoading ? (
          <div className={styles.skeleton}>
            <div className={styles.skeletonContent}></div>
          </div>
        ) : (
          <img
            src={imageSource}
            alt={`Image for step ${currentStep}`}
            className={styles.image}
          />
        )}
      </div>
    );
  };

  return (
    <div className={styles.onboardingStep}>
      <div className={styles.content}>
        {!isLastStep && (
          <div className={styles.imageContainer}>
            {renderImage()}
          </div>
        )}

        <div className={styles.textContent}>
          <h2 className={styles.title}>
            {stepContent.title.split('\n').map((line, index) => (
              <React.Fragment key={index}>
                {line}
                {index < stepContent.title.split('\n').length - 1 && <br />}
              </React.Fragment>
            ))}
          </h2>

          {!isLastStep && (
            <>
              {Array.isArray(stepContent.description) ? (
                <ul className={styles.list}>
                  {stepContent.description.map((item, index) => (
                    <li key={index} className={styles.listItem}>
                      {item}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className={styles.description}>
                  {(stepContent.description as string).split('\n').map((line, index) => (
                    <React.Fragment key={index}>
                      {line}
                      {index < (stepContent.description as string).split('\n').length - 1 && <br />}
                    </React.Fragment>
                  ))}
                </p>
              )}
            </>
          )}

          {isFormStep && onFullNameChange && (
            <div className={styles.form}>
              <input
                type="text"
                placeholder={t('onboarding.namePlaceholder')}
                value={fullName}
                onChange={(e) => onFullNameChange(e.target.value)}
                onKeyDown={handleKeyDown}
                className={styles.input}
                disabled={isLoading}
              />
              {onMonthlySalaryChange && onCurrencyChange && (
                <div className={styles.formGroup}>
                  <span className={styles.formLabel}>{t('onboarding.salary')}</span>
                  <div className={styles.formRow}>
                    <input
                    type="number"
                    min={0}
                    step={1}
                    placeholder={t('onboarding.salaryPlaceholder')}
                    value={monthlySalary || ''}
                    onChange={(e) => onMonthlySalaryChange(Number(e.target.value) || 0)}
                    className={styles.input}
                    disabled={isLoading}
                  />
                  <Dropdown
                    options={[
                      { value: 'USD', label: `${currencySymbols.USD} USD` },
                      { value: 'EUR', label: `${currencySymbols.EUR} EUR` },
                      { value: 'RUB', label: `${currencySymbols.RUB} RUB` },
                      { value: 'BYN', label: `${currencySymbols.BYN} BYN` },
                    ]}
                    value={currency}
                    onChange={(v) => onCurrencyChange(v as Currency)}
                    className={styles.currencyDropdown}
                  />
                  </div>
                </div>
              )}
              {onSavingsOnlyChange && (
                <div className={styles.toggleWrap}>
                  <Toggle
                    options={[
                      { value: 'full', label: t('statistics.planner.withInvestments') },
                      { value: 'savings', label: t('statistics.planner.savingsOnly') },
                    ]}
                    value={savingsOnly ? 'savings' : 'full'}
                    onChange={(v) => onSavingsOnlyChange(v === 'savings')}
                  />
                </div>
              )}
              {distribution && onDistributionChange && (
                <div className={styles.slidersWrap}>
                  <DistributionSliders
                    distribution={distribution}
                    onChange={onDistributionChange}
                    savingsOnly={!!savingsOnly}
                    savingsLabel={t('home.savings')}
                    investmentsLabel={t('home.investments')}
                    purchasesLabel={t('home.purchases')}
                    monthlyAmount={monthlySalary}
                    currencySymbol={currencySymbols[currency]}
                    onReset={onApplyStandard}
                    resetLabel={t('statistics.planner.applyStandard')}
                  />
                </div>
              )}
            </div>
          )}
        </div>

        <div className={styles.navigation}>
          {isFirstStep ? (
            <button
              onClick={onNext}
              disabled={isLoading}
              className={styles.startButton}
            >
              {isLoading ? t('onboarding.starting') : t('onboarding.getStarted')}
              </button>
          ) : (
            <>
              <button
                onClick={onBack}
                disabled={isLoading}
                className={styles.backButton}
              >
                {t('onboarding.back')}
              </button>
              <button
                onClick={onNext}
                disabled={isLoading || !isFormValid}
                className={styles.nextButton}
              >
                {isLastStep ? (isLoading ? t('onboarding.completing') : t('onboarding.complete')) : t('onboarding.next')}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default OnboardingStep;

