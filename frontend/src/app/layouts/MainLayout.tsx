import React from 'react';
import { Header } from '@widgets/header';
import { Navigation } from '@widgets/navigation';
import { ToastContainer, Slide } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import styles from './MainLayout.module.scss';

interface MainLayoutProps {
  children?: React.ReactNode;
  className?: string;
  showNavigation?: boolean;
  showHeader?: boolean;
}

const MainLayout: React.FC<MainLayoutProps> = ({
  children,
  showNavigation = true,
  showHeader = true,
  className = '',
}) => {
  return (
    <div className={`${styles['main-layout']} ${className}`}>
      {showHeader && (
        <header className={styles['main-layout__header']}>
          <Header />
        </header>
      )}
      <main className={styles['main-layout__content']}>
        {children || null}
      </main>
      {showNavigation && (
        <nav className={styles['main-layout__navigation']}>
          <Navigation />
        </nav>
      )}
      
      <ToastContainer 
        position="top-right"
        autoClose={3000}
        hideProgressBar={true}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable={false}
        pauseOnHover
        theme="dark"
        style={{ zIndex: 9999 }}
        transition={Slide}
        limit={3}
        toastStyle={{
          borderRadius: '4px',
          fontSize: '14px',
          padding: '16px 20px',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
          border: 'none',
          minHeight: 'auto',
          lineHeight: '1.4'
        }}
      />
    </div>
  );
};

export default MainLayout;

