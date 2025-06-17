// Minimal i18next setup loading translations from the locales directory.
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { languages } from './features/languages';

interface TranslationModule {
  default: any;
}

// Load all translation files under `public/locales`.
const modules = import.meta.glob('../public/locales/*/translation.json', { eager: true }) as Record<string, TranslationModule>;
const helpModules = import.meta.glob('../public/locales/*/help.json', { eager: true }) as Record<string, TranslationModule>;
const translations: Record<string, any> = {};
const helpTranslations: Record<string, any> = {};
for (const [path, mod] of Object.entries(modules)) {
  const parts = path.split('/');
  const code = parts[parts.length - 2];
  translations[code] = mod.default;
}
for (const [path, mod] of Object.entries(helpModules)) {
  const parts = path.split('/');
  const code = parts[parts.length - 2];
  helpTranslations[code] = mod.default;
}

const resources = languages.reduce<Record<string, { translation: any; help: any }>>((acc, l) => {
  const t = translations[l.value];
  const h = helpTranslations[l.value];
  if (t) {
    acc[l.value] = { translation: t, help: h || {} };
  }
  return acc;
}, {});

// Choose the initial language based on the browser locale when available.
const browserLang = typeof navigator !== 'undefined'
  ? navigator.language.split('-')[0]
  : 'en';
const initialLang = translations[browserLang] ? browserLang : 'en';

i18n.use(initReactI18next).init({
  resources,
  lng: initialLang,
  fallbackLng: 'en',
  ns: ['translation', 'help'],
  defaultNS: 'translation',
  interpolation: { escapeValue: false },
});

export default i18n;
