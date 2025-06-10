// List of languages supported across the application. Each entry contains the
// language code, human readable label and whether the language is written from
// right-to-left.
export const languages = [
  { value: 'auto', label: 'Auto', rtl: false },
  { value: 'ne', label: 'Nepali', rtl: false },
  { value: 'hi', label: 'Hindi', rtl: false },
  { value: 'en', label: 'English', rtl: false },
  { value: 'es', label: 'Spanish', rtl: false },
  { value: 'fr', label: 'French', rtl: false },
  { value: 'zh', label: 'Chinese', rtl: false },
  { value: 'ar', label: 'Arabic', rtl: true },
  { value: 'pt', label: 'Portuguese', rtl: false },
  { value: 'ru', label: 'Russian', rtl: false },
  { value: 'ja', label: 'Japanese', rtl: false },
  { value: 'de', label: 'German', rtl: false },
  { value: 'it', label: 'Italian', rtl: false },
  { value: 'ko', label: 'Korean', rtl: false },
  { value: 'vi', label: 'Vietnamese', rtl: false },
  { value: 'tr', label: 'Turkish', rtl: false },
  { value: 'id', label: 'Indonesian', rtl: false },
  { value: 'nl', label: 'Dutch', rtl: false },
  { value: 'th', label: 'Thai', rtl: false },
  { value: 'pl', label: 'Polish', rtl: false },
  { value: 'sv', label: 'Swedish', rtl: false },
  { value: 'fi', label: 'Finnish', rtl: false },
  { value: 'he', label: 'Hebrew', rtl: true },
  { value: 'uk', label: 'Ukrainian', rtl: false },
  { value: 'el', label: 'Greek', rtl: false },
  { value: 'ms', label: 'Malay', rtl: false },
  { value: 'cs', label: 'Czech', rtl: false },
  { value: 'ro', label: 'Romanian', rtl: false },
  { value: 'da', label: 'Danish', rtl: false },
  { value: 'hu', label: 'Hungarian', rtl: false },
  { value: 'no', label: 'Norwegian', rtl: false },
  { value: 'ur', label: 'Urdu', rtl: true },
  { value: 'hr', label: 'Croatian', rtl: false },
  { value: 'bg', label: 'Bulgarian', rtl: false },
  { value: 'lt', label: 'Lithuanian', rtl: false },
  { value: 'lv', label: 'Latvian', rtl: false },
  { value: 'sk', label: 'Slovak', rtl: false },
] as const;

/** Language code union derived from the languages list. */
export type Language = typeof languages[number]['value'];

/**
 * Checks whether the provided value is one of the supported language codes.
 */
export function isLanguage(value: string): value is Language {
  return languages.some(l => l.value === value);
}
