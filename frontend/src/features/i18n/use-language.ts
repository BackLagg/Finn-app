import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';

export type Language = 'ru' | 'en';

const STORAGE_KEY = 'finance-app-language';

export function useLanguage() {
  const { i18n, t } = useTranslation();

  const language = (i18n.language === 'en' ? 'en' : 'ru') as Language;

  const setLanguage = useCallback(
    (lng: Language) => {
      i18n.changeLanguage(lng);
      if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_KEY, lng);
      }
    },
    [i18n],
  );

  return { language, setLanguage, t };
}
