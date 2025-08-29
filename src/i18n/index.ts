import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import Backend from 'i18next-http-backend';

// Import translation files
import enTranslations from './locales/en.json';
import hiTranslations from './locales/hi.json';
import taTranslations from './locales/ta.json';
import teTranslations from './locales/te.json';
import bnTranslations from './locales/bn.json';
import guTranslations from './locales/gu.json';
import mrTranslations from './locales/mr.json';

const resources = {
  en: { translation: enTranslations },
  hi: { translation: hiTranslations },
  ta: { translation: taTranslations },
  te: { translation: teTranslations },
  bn: { translation: bnTranslations },
  gu: { translation: guTranslations },
  mr: { translation: mrTranslations },
};

i18n
  .use(Backend)
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    debug: false,
    
    interpolation: {
      escapeValue: false,
    },
    
    detection: {
      order: ['localStorage', 'navigator', 'htmlTag'],
      caches: ['localStorage'],
    },
    
    react: {
      useSuspense: false,
    },
  });

export default i18n;