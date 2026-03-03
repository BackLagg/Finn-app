import React, { useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '@features/auth';
import { useTheme } from '@features/theme';
import { ErrorBoundary } from '@shared/ui';
import { getErrorType } from '@shared/lib';

import { ErrorScreen, Onboarding } from '@shared/ui';
import { MainLayout } from './layouts';
import { LoadingPage } from '@pages/loading';
import { EmptyPage } from '@pages/empty';
import { ProfilePage } from '@pages/profile';
import { PartnersPage } from '@pages/partners';
import { PlannerPage } from '@pages/planner';
import { StatisticsPage } from '@pages/statistics';

import '@shared/styles/index.scss';

const App: React.FC = () => {
  useTheme();
  const { user, isLoading, error, isNewUser } = useAuth();
  const [showLoading, setShowLoading] = useState(true);

  if (error) {
    const errorType = !user ? 'noData' : getErrorType(error);
    return <ErrorScreen errorType={errorType} />;
  }

  if (isLoading || showLoading) {
    return (
      <LoadingPage
        onComplete={() => {
          setShowLoading(false);
        }}
      />
    );
  }

  if (isNewUser) {
    return (
      <Onboarding
        onComplete={() => {}}
      />
    );
  }

  return (
    <ErrorBoundary>
      <MainLayout>
        <Routes>
          <Route path="/" element={<Navigate to="/planner" replace />} />
          <Route path="/planner" element={<PlannerPage />} />
          <Route path="/statistics" element={<StatisticsPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/partners" element={<PartnersPage />} />
        </Routes>
      </MainLayout>
    </ErrorBoundary>
  );
};

export default App;
