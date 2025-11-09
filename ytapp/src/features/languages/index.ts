// Dynamically load language definitions from the `defs` folder. Each definition
// is a small JSON module with `value`, `label` and `rtl` flags. This allows
// contributors to add new languages by simply adding a file.

export interface LanguageInfo {
  value: string;
  label: string;
  rtl: boolean;
}

const modules = import.meta.glob('./defs/*.json', { eager: true }) as Record<string, { default: LanguageInfo }>;
const loaded = Object.values(modules).map(m => m.default);

// Sort alphabetically for predictable dropdown order.
loaded.sort((a, b) => a.label.localeCompare(b.label));

const PINNED_CODES = ['en', 'hi', 'ne'];
const pinned = PINNED_CODES
  .map(code => loaded.find(lang => lang.value === code))
  .filter((lang): lang is LanguageInfo => Boolean(lang));

const remaining = loaded.filter(lang => !PINNED_CODES.includes(lang.value));

// Insert the automatic detection option at the beginning.
export const languages = [{ value: 'auto', label: 'Auto', rtl: false }, ...pinned, ...remaining] as const;

export const pinnedLanguages = PINNED_CODES as readonly string[];

export type Language = typeof languages[number]['value'];

/**
 * Type guard ensuring a string is a supported language code.
 */
export function isLanguage(value: string): value is Language {
  return languages.some(l => l.value === value);
}
