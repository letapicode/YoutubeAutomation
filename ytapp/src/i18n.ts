import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from '../public/locales/en/translation.json';
import ne from '../public/locales/ne/translation.json';
import hi from '../public/locales/hi/translation.json';
import es from '../public/locales/es/translation.json';
import fr from '../public/locales/fr/translation.json';
import zh from '../public/locales/zh/translation.json';
import ar from '../public/locales/ar/translation.json';

i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    ne: { translation: ne },
    hi: { translation: hi },
    es: { translation: es },
    fr: { translation: fr },
    zh: { translation: zh },
    ar: { translation: ar },
  },
  lng: 'en',
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
});

export default i18n;
