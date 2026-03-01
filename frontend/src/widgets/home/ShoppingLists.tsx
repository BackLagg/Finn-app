import React from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { financeAPI } from '@shared/api';
import styles from './ShoppingLists.module.scss';

interface ShoppingListsProps {
  roomId?: string;
}

const ShoppingLists: React.FC<ShoppingListsProps> = ({ roomId }) => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const { data: lists = [] } = useQuery({
    queryKey: ['shoppingLists', roomId],
    queryFn: async () => {
      const res = await financeAPI.shoppingLists.list(roomId);
      return res.data;
    },
  });

  const pinMutation = useMutation({
    mutationFn: (listId: string) => financeAPI.shoppingLists.togglePin(listId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shoppingLists'] });
    },
  });

  return (
    <section className={styles['shopping-lists']} data-section="shopping-lists">
      <h2 className={styles['shopping-lists__title']}>{t('home.shoppingLists')}</h2>
      <div className={styles['shopping-lists__grid']}>
        {lists.map((list) => (
          <div key={list._id} className={styles['shopping-lists__card']}>
            <div className={styles['shopping-lists__card-header']}>
              <h3 className={styles['shopping-lists__card-title']}>{list.title}</h3>
              <button
                type="button"
                className={styles['shopping-lists__pin-btn']}
                onClick={() => pinMutation.mutate(list._id)}
              >
                {list.isPinned ? '📌' : '📍'}
              </button>
            </div>
            <ul className={styles['shopping-lists__items']}>
              {list.items.map((item, i) => (
                <li key={i} className={styles['shopping-lists__item']}>
                  <input
                    type="checkbox"
                    className={styles['shopping-lists__checkbox']}
                    checked={item.checked}
                    readOnly
                  />
                  <span className={styles['shopping-lists__item-name']}>
                    {item.name}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
};

export default ShoppingLists;
