import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useInView } from 'react-intersection-observer';
import { useQuery } from '@tanstack/react-query';
import { financeAPI } from '@shared/api';
import PinnedShoppingList from './PinnedShoppingList';
import styles from './ShoppingLists.module.scss';

const ShoppingLists: React.FC = () => {
  const { t } = useTranslation();
  const [showPinned, setShowPinned] = useState(true);
  const { ref, inView } = useInView({ threshold: 0.5 });
  const { data: lists = [] } = useQuery({
    queryKey: ['shoppingLists'],
    queryFn: async () => {
      const res = await financeAPI.shoppingLists.list();
      return res.data;
    },
  });
  const hasPinned = lists.some((l) => l.isPinned);

  useEffect(() => {
    if (inView && hasPinned) setShowPinned(false);
    else if (!inView && hasPinned) setShowPinned(true);
  }, [inView, hasPinned]);

  return (
    <>
      <section ref={ref} className={styles.shoppingLists}>
        <h2>{t('home.shoppingLists')}</h2>
        <ul>
          {lists.map((list) => (
            <li key={list._id}>
              <strong>{list.title}</strong>
              <ul>
                {list.items.map((item, i) => (
                  <li key={i}>
                    <input type="checkbox" checked={item.checked} readOnly />
                    {item.name}
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      </section>
      <PinnedShoppingList visible={showPinned} />
    </>
  );
};

export default ShoppingLists;
