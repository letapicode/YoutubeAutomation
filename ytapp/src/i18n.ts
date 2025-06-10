import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from '../public/locales/en/translation.json';
import ne from '../public/locales/ne/translation.json';
import hi from '../public/locales/hi/translation.json';
import es from '../public/locales/es/translation.json';
import fr from '../public/locales/fr/translation.json';
import zh from '../public/locales/zh/translation.json';
import ar from '../public/locales/ar/translation.json';
import pt from '../public/locales/pt/translation.json';
import ru from '../public/locales/ru/translation.json';
import ja from '../public/locales/ja/translation.json';
import de from '../public/locales/de/translation.json';
import it from '../public/locales/it/translation.json';
import ko from '../public/locales/ko/translation.json';
import vi from '../public/locales/vi/translation.json';
import tr from '../public/locales/tr/translation.json';
import id from '../public/locales/id/translation.json';
import { languages } from './features/languages';

const translations: Record<string, any> = {
  en,
  ne,
  hi,
  es,
  fr,
  zh,
  ar,
  pt,
  ru,
  ja,
  de,
  it,
  ko,
  vi,
  tr,
  id,
};

const resources = languages.reduce<Record<string, { translation: any }>>((acc, l) => {
  const t = translations[l.value];
  if (t) acc[l.value] = { translation: t };
  return acc;
}, {});

i18n.use(initReactI18next).init({
  resources,
  lng: 'en',
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
});

export default i18n;
