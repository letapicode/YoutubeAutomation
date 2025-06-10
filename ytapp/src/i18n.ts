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
import nl from '../public/locales/nl/translation.json';
import th from '../public/locales/th/translation.json';
import pl from '../public/locales/pl/translation.json';
import sv from '../public/locales/sv/translation.json';
import fi from '../public/locales/fi/translation.json';
import he from '../public/locales/he/translation.json';
import uk from '../public/locales/uk/translation.json';
import el from '../public/locales/el/translation.json';
import ms from '../public/locales/ms/translation.json';
import cs from '../public/locales/cs/translation.json';
import ro from '../public/locales/ro/translation.json';
import da from '../public/locales/da/translation.json';
import hu from '../public/locales/hu/translation.json';
import no from '../public/locales/no/translation.json';
import ur from '../public/locales/ur/translation.json';
import hr from '../public/locales/hr/translation.json';
import bg from '../public/locales/bg/translation.json';
import lt from '../public/locales/lt/translation.json';
import lv from '../public/locales/lv/translation.json';
import sk from '../public/locales/sk/translation.json';
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
  nl,
  th,
  pl,
  sv,
  fi,
  he,
  uk,
  el,
  ms,
  cs,
  ro,
  da,
  hu,
  no,
  ur,
  hr,
  bg,
  lt,
  lv,
  sk,
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
