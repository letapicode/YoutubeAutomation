export const languageOptions = [
  { value: 'auto', label: 'Auto' },
  { value: 'ne', label: 'Nepali' },
  { value: 'hi', label: 'Hindi' },
  { value: 'en', label: 'English' },
  { value: 'es', label: 'Spanish' },
  { value: 'fr', label: 'French' },
] as const;

export type Language = typeof languageOptions[number]['value'];

export function isLanguage(value: string): value is Language {
  return languageOptions.some(opt => opt.value === value);
}
