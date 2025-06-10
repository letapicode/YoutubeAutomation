// Minimal i18next setup loading translations from the locales directory.
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { languages } from './features/languages';

interface TranslationModule {
  default: any;
}

// Load all translation files under `public/locales`.
const modules = import.meta.glob('../public/locales/*/translation.json', { eager: true }) as Record<string, TranslationModule>;
const translations: Record<string, any> = {};
for (const [path, mod] of Object.entries(modules)) {
  const parts = path.split('/');
  const code = parts[parts.length - 2];
  translations[code] = mod.default;
}

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
