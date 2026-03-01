import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { Portal } from '@shared/ui';
import { financeAPI } from '@shared/api';
import styles from './PinnedShoppingList.module.scss';

interface PinnedShoppingListProps {
  visible: boolean;
}

const PinnedShoppingList: React.FC<PinnedShoppingListProps> = ({ visible }) => {
  const [collapsed, setCollapsed] = useState(false);
  const { data: lists = [] } = useQuery({
    queryKey: ['shoppingLists'],
    queryFn: async () => {
      const res = await financeAPI.shoppingLists.list();
      return res.data;
    },
  });
  const pinned = lists.find((l) => l.isPinned);
  if (!visible || !pinned) return null;

  return (
    <Portal>
      <div className={`${styles.pinned} ${collapsed ? styles.collapsed : ''}`}>
        <div className={styles.header}>
          <span>{pinned.title}</span>
          <button type="button" onClick={() => setCollapsed(!collapsed)}>
            {collapsed ? '+' : '-'}
          </button>
        </div>
        {!collapsed && (
          <ul>
            {pinned.items.map((item, i) => (
              <li key={i}>
                <input type="checkbox" checked={item.checked} readOnly />
                <span>{item.name}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </Portal>
  );
};

export default PinnedShoppingList;
