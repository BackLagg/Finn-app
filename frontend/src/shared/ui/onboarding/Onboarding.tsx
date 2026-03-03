import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useAuth } from '@features/auth/api';
import { OnboardingStep } from './onboarding-step';
import type { StepContent } from './types';
import type { Distribution } from '@shared/lib/distribution';
import type { Currency } from '@shared/lib/currency';
import { getProgressiveDistribution, normalizeDistribution, useDebounce } from '@shared/lib';
import styles from './Onboarding.module.scss';

const STORAGE_KEYS = {
  currency: 'app_currency',
  savingsOnly: 'app_savings_only',
  distribution: 'app_distribution',
  monthlyIncome: 'app_monthly_income',
};

interface OnboardingProps {
  onComplete: () => void;
}

const Onboarding: React.FC<OnboardingProps> = ({ onComplete }) => {
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

  const steps: StepContent[] = [
    {
      title: 'WELCOME TO THE\nFABRICBOT ECOSYSTEM',
      description: 'Your gateway to building\nand monetizing digital products\nwith advanced referral systems',
      image: 'lock'
    },
    {
      title: 'ALREADY\nAVAILABLE',
      description: [
        'Create personal product pages',
        'Launch a referral system in 60 seconds',
        'Share payouts with referrals and track statistics'
      ],
      image: 'lightning'
    },
    {
      title: 'COMING\nSOON',
      description: [
        'Connect your TG wallet and pay in TON',
        'Integrate the payment system with your services via API',
        'Enable your clients to pay through P2P'
      ],
      image: 'coin'
    },
    {
      title: 'TELL US ABOUT\nYOURSELF',
      description: 'Help your profile become more recognizable\nby sharing your full name with us',
      image: 'card',
      isForm: true
    }
  ];

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
        try {
          localStorage.setItem(STORAGE_KEYS.currency, currency);
          localStorage.setItem(STORAGE_KEYS.savingsOnly, String(savingsOnly));
          localStorage.setItem(STORAGE_KEYS.distribution, JSON.stringify(distribution));
          localStorage.setItem(STORAGE_KEYS.monthlyIncome, String(monthlySalary));
        } catch {
          // ignore
        }
        completeOnboarding({ fullName: fullName.trim() });
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

