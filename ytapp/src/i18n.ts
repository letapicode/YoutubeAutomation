// i18next setup using HTTP backend to load JSON from /public/locales at runtime.
// This removes fragile ESM imports from the public folder (which Vite forbids),
// keeps the bundle lean, and makes it easy to add new languages without rebuilds.
import i18n from 'i18next';
import HttpBackend from 'i18next-http-backend';
import { initReactI18next } from 'react-i18next';
import { languages } from './features/languages';

/**
 * Interface language is fixed to English in the desktop UI.
 */
function detectInitialLanguage(): string {
  return 'en';
}

/**
 * Initialize i18next with:
 * - HTTP backend for JSON files (served from /public/locales)
 * - Two namespaces: 'translation' and 'help'
 * - Supported languages from features/languages
 */
export function setupI18n() {
  const initialLang = detectInitialLanguage();
  i18n
    .use(HttpBackend)
    .use(initReactI18next)
    .init({
      // Load from /public/locales/{{lng}}/{{ns}}.json
      backend: {
        loadPath: '/locales/{{lng}}/{{ns}}.json',
      },
      lng: initialLang,
      fallbackLng: 'en',
      supportedLngs: languages.map(l => l.value),
      ns: ['translation', 'help'],
      defaultNS: 'translation',
      interpolation: { escapeValue: false },
      // Avoid preloading everything; fetch on demand when language/namespace is used
      partialBundledLanguages: true,
    });
  return i18n;
}

// Initialize immediately for app startup; callers can import the configured instance.
setupI18n();
export default i18n;
