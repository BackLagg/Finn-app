import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@features/auth/api';
import { OnboardingStep } from './onboarding-step';
import type { StepContent } from './types';
import type { Distribution } from '@shared/lib/distribution';
import type { Currency } from '@shared/lib/currency';
import { getProgressiveDistribution, normalizeDistribution, useDebounce } from '@shared/lib';
import styles from './Onboarding.module.scss';

interface OnboardingProps {
  onComplete: () => void;
}

const Onboarding: React.FC<OnboardingProps> = ({ onComplete }) => {
  const { t } = useTranslation();
  const { completeOnboarding, isCompletingOnboarding } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [fullName, setFullName] = useState('');
  const [monthlySalary, setMonthlySalary] = useState(0);
  const [currency, setCurrency] = useState<Currency>('USD');
  const [savingsOnly, setSavingsOnly] = useState(false);
  const [distribution, setDistribution] = useState<Distribution>(() =>
    getProgressiveDistribution(0, 'USD')
  );

  const debouncedSalary = useDebounce(monthlySalary, 800);
  const isInitialMount = useRef(true);

  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    if (debouncedSalary >= 0 && !savingsOnly) {
      setDistribution(getProgressiveDistribution(debouncedSalary, currency));
    }
  }, [debouncedSalary, currency, savingsOnly]);

  const handleSavingsOnlyChange = useCallback((value: boolean) => {
    setSavingsOnly(value);
    setDistribution((prev) => {
      if (value) {
        const next = normalizeDistribution(
          prev.savings + prev.investments,
          0,
          prev.purchases
        );
        return next;
      }
      return getProgressiveDistribution(monthlySalary, currency);
    });
  }, [monthlySalary, currency]);

  const handleApplyStandard = useCallback(() => {
    setDistribution(getProgressiveDistribution(monthlySalary || 0, currency));
  }, [monthlySalary, currency]);

  const steps: StepContent[] = useMemo(
    () => [
      {
        title: t('onboarding.step1Title'),
        description: t('onboarding.step1Description'),
        image: 'lock'
      },
      {
        title: t('onboarding.step2Title'),
        description: [
          t('onboarding.step2Line1'),
          t('onboarding.step2Line2'),
          t('onboarding.step2Line3'),
          t('onboarding.step2Line4')
        ],
        image: 'lightning'
      },
      {
        title: t('onboarding.step3Title'),
        description: [
          t('onboarding.step3Line1'),
          t('onboarding.step3Line2'),
          t('onboarding.step3Line3')
        ],
        image: 'coin'
      },
      {
        title: t('onboarding.step4Title'),
        description: t('onboarding.step4Description'),
        image: 'card',
        isForm: true
      }
    ],
    [t]
  );

  const totalSteps = steps.length;
  const isLastStep = currentStep === totalSteps;

  const handleNext = async () => {
    if (isLastStep) {
      await handleComplete();
    } else {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleComplete = async () => {
    try {
      if (isLastStep && fullName.trim()) {
        completeOnboarding({
          fullName: fullName.trim(),
          currency,
          monthlyIncome: monthlySalary,
          savingsOnly,
          distribution,
        });
      }
      onComplete();
    } catch (error) {
      console.error('Error completing onboarding:', error);
    }
  };

  const currentStepContent = steps[currentStep - 1];

  return (
    <div className={styles.onboarding}>
      <OnboardingStep
        currentStep={currentStep}
        totalSteps={totalSteps}
        onNext={handleNext}
        onBack={handleBack}
        onClose={onComplete}
        stepContent={currentStepContent}
        isLastStep={isLastStep}
        isLoading={isCompletingOnboarding}
        fullName={fullName}
        onFullNameChange={setFullName}
        monthlySalary={monthlySalary}
        onMonthlySalaryChange={setMonthlySalary}
        currency={currency}
        onCurrencyChange={setCurrency}
        savingsOnly={savingsOnly}
        onSavingsOnlyChange={handleSavingsOnlyChange}
        distribution={distribution}
        onDistributionChange={setDistribution}
        onApplyStandard={handleApplyStandard}
      />
    </div>
  );
};

export default Onboarding;

