import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import MuffinIcon from '@shared/assets/muffin.svg?react';
import { RootState } from '@app/store';
import styles from './LoadingPage.module.scss';

interface LoadingPageProps {
  onComplete: () => void;
}

const LoadingPage: React.FC<LoadingPageProps> = ({ onComplete }) => {
  const [loadingPhase, setLoadingPhase] = useState<'mirror' | 'greeting'>('mirror');
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [displayPhase, setDisplayPhase] = useState<'mirror' | 'greeting'>('mirror');
  const [isSlidingUp, setIsSlidingUp] = useState(false);
  
  const user = useSelector((state: RootState) => state.user);
  const userName = user?.name || user?.username || 'User';

  useEffect(() => {
    const mirrorTimer = setTimeout(() => {
      setLoadingPhase('greeting');
    }, 3000);

    return () => clearTimeout(mirrorTimer);
  }, []);

  useEffect(() => {
    if (displayPhase !== loadingPhase) {
      let transitionTimer: ReturnType<typeof setTimeout> | null = null;
      
      const rafId = requestAnimationFrame(() => {
        setIsTransitioning(true);
        transitionTimer = setTimeout(() => {
          setDisplayPhase(loadingPhase);
          setIsTransitioning(false);
        }, 500);
      });

      return () => {
        cancelAnimationFrame(rafId);
        if (transitionTimer) {
          clearTimeout(transitionTimer);
        }
      };
    }
  }, [loadingPhase, displayPhase]);

  useEffect(() => {
    if (loadingPhase === 'greeting') {
      const greetingTimer = setTimeout(() => {
        setIsSlidingUp(true);
        const completeTimer = setTimeout(() => {
          onComplete();
        }, 500);

        return () => clearTimeout(completeTimer);
      }, 2000);

      return () => clearTimeout(greetingTimer);
    }
  }, [loadingPhase, onComplete]);

  return (
    <div className={`${styles.loadingPage} ${isSlidingUp ? styles.slideUp : ''}`}>
      <div className={styles.content}>
        {displayPhase === 'mirror' ? (
          <h1 
            className={`${styles.mirror} ${isTransitioning ? styles.fadeOut : styles.fadeIn}`}
          >
            <span className={styles.titleBrand}>MuFinn</span>
          </h1>
        ) : (
          <h1 
            className={`${styles.greeting} ${isTransitioning ? styles.fadeOut : styles.fadeIn}`}
          >
            <span className={styles.greetingBrand}>Hello</span>,<br />
            <span className={styles.greetingName}>{userName}</span>
          </h1>
        )}
        
        <div className={styles.loadingSection}>
          <p className={styles.loadingText}>Loading...</p>
          <div className={styles.loadingIndicator}>
            <MuffinIcon className={styles.muffinIcon} aria-hidden />
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoadingPage;

