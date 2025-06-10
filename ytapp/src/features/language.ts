import allLanguages from '../../shared/languages.json';

export const languageOptions = ([
  { value: 'auto', label: 'Auto' },
  ...allLanguages.map(l => ({ value: l.code, label: l.label })),
] as const);

export type Language = typeof languageOptions[number]['value'];

export function isLanguage(value: string): value is Language {
  return languageOptions.some(opt => opt.value === value);
}
