import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  ChartsSection,
  ExpenseCalculator,
  ExpenseList,
  GoalsSection,
  ReceiptScanner,
  ShoppingLists,
} from '@widgets/home';
import styles from './HomePage.module.scss';

const HomePage: React.FC = () => {
  const { t } = useTranslation();

  return (
    <div className={styles.homePage}>
      <h1>{t('home.title')}</h1>
      <ReceiptScanner />
      <ChartsSection />
      <ExpenseCalculator />
      <ExpenseList />
      <GoalsSection />
      <ShoppingLists />
    </div>
  );
};

export default HomePage;
