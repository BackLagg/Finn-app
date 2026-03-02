import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import styles from './Modal.module.scss';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  height?: string | number | 'fill';
  aboveContent?: React.ReactNode;
  belowContent?: React.ReactNode;
}

const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  footer,
  height = 'auto',
  aboveContent,
  belowContent,
}) => {
  const isFill = height === 'fill';
  const heightStyle = typeof height === 'number' ? `${height}px` : height;
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = prev;
      };
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'Tab') {
        const el = contentRef.current;
        if (!el) return;
        const focusables = Array.from(el.querySelectorAll<HTMLElement>('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'));
        if (focusables.length === 0) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last?.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first?.focus();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (isOpen && contentRef.current) {
      const focusable = contentRef.current.querySelector<HTMLElement>('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
      focusable?.focus();
    }
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className={styles.modalOverlay}
          onClick={onClose}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
        >
          <div className={styles.modalWrapper}>
          {aboveContent && (
            <div className={styles.modalAbove} onClick={(e) => e.stopPropagation()}>
              {aboveContent}
            </div>
          )}
          <motion.div
            ref={contentRef}
            className={`${styles.modalContent} ${isFill ? styles.modalContent_fill : ''}`}
            style={!isFill ? { maxHeight: heightStyle, height: height === 'auto' ? 'auto' : heightStyle } : undefined}
            onClick={(e) => e.stopPropagation()}
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.2, ease: [0.25, 0.46, 0.45, 0.94] }}
          >
            <header className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>{title}</h3>
              <button
                type="button"
                className={styles.modalClose}
                onClick={onClose}
                aria-label="Close"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M18 6L6 18M6 6L18 18"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
            </header>
            <div className={styles.modalBody}>{children}</div>
            {footer && <footer className={styles.modalFooter}>{footer}</footer>}
          </motion.div>
          {belowContent && (
            <div className={styles.modalBelow} onClick={(e) => e.stopPropagation()}>
              {belowContent}
            </div>
          )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default Modal;
