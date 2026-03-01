import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import Backend from 'i18next-http-backend';

const storedLng =
  typeof window !== 'undefined'
    ? (localStorage.getItem('finance-app-language') as 'ru' | 'en' | null)
    : null;

i18n
  .use(Backend)
  .use(initReactI18next)
  .init({
    fallbackLng: 'ru',
    lng: storedLng === 'en' || storedLng === 'ru' ? storedLng : 'ru',
    ns: ['translation'],
    defaultNS: 'translation',
    backend: {
      loadPath: '/locales/{{lng}}/{{ns}}.json',
    },
    interpolation: {
      escapeValue: false,
    },
    react: {
      useSuspense: false,
    },
  });

export default i18n;
