import React from 'react';
import { FiChevronDown, FiChevronUp } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import { useCollapsedStorage } from '@shared/lib/use-collapsed-storage';
import styles from './CollapsibleSection.module.scss';

interface CollapsibleSectionProps {
  id: string;
  title: string;
  children: React.ReactNode;
  defaultExpanded?: boolean;
  headerAction?: React.ReactNode;
}

export const CollapsibleSection: React.FC<CollapsibleSectionProps> = ({
  id,
  title,
  children,
  defaultExpanded = true,
  headerAction,
}) => {
  const [isCollapsed, toggle] = useCollapsedStorage(id, defaultExpanded);

  return (
    <section className={styles.section}>
      <header className={styles.section__header}>
        <button
          type="button"
          className={styles.section__trigger}
          onClick={toggle}
          aria-expanded={!isCollapsed}
        >
          <h3 className={styles.section__title}>{title}</h3>
          <span className={styles.section__chevron}>
            {isCollapsed ? <FiChevronDown size={20} /> : <FiChevronUp size={20} />}
          </span>
        </button>
        {headerAction && <div className={styles.section__action}>{headerAction}</div>}
      </header>
      <AnimatePresence initial={false}>
        {!isCollapsed && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
            className={styles.section__content}
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
};
