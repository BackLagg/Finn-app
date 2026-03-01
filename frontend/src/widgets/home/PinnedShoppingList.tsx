import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { Portal } from '@shared/ui';
import { financeAPI } from '@shared/api';
import styles from './PinnedShoppingList.module.scss';

const PinnedShoppingList: React.FC = () => {
  const { t } = useTranslation();
  const [collapsed, setCollapsed] = useState(false);
  const [hidden, setHidden] = useState(false);

  const { data: lists = [] } = useQuery({
    queryKey: ['shoppingLists'],
    queryFn: async () => {
      const res = await financeAPI.shoppingLists.list();
      return res.data;
    },
  });

  const pinned = lists.find((l) => l.isPinned);

  useEffect(() => {
    if (!pinned) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          setHidden(entry.isIntersecting);
        });
      },
      { threshold: 0.1 }
    );

    const shoppingListsSection = document.querySelector('[data-section="shopping-lists"]');
    if (shoppingListsSection) {
      observer.observe(shoppingListsSection);
    }

    return () => {
      if (shoppingListsSection) {
        observer.unobserve(shoppingListsSection);
      }
    };
  }, [pinned]);

  if (!pinned || hidden) return null;

  return (
    <Portal>
      <div className={`${styles['pinned-list']} ${collapsed ? styles['pinned-list--collapsed'] : ''}`}>
        <div className={styles['pinned-list__header']}>
          <span className={styles['pinned-list__title']}>{pinned.title}</span>
          <button
            type="button"
            className={styles['pinned-list__toggle']}
            onClick={() => setCollapsed(!collapsed)}
          >
            {collapsed ? '▲' : '▼'}
          </button>
        </div>
        {!collapsed && (
          <ul className={styles['pinned-list__items']}>
            {pinned.items.map((item, i) => (
              <li key={i} className={styles['pinned-list__item']}>
                <input
                  type="checkbox"
                  className={styles['pinned-list__checkbox']}
                  checked={item.checked}
                  readOnly
                />
                <span className={styles['pinned-list__item-name']}>
                  {item.name}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </Portal>
  );
};

export default PinnedShoppingList;
