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

// Insert the automatic detection option at the beginning.
export const languages = [{ value: 'auto', label: 'Auto', rtl: false }, ...loaded] as const;

export type Language = typeof languages[number]['value'];

export function isLanguage(value: string): value is Language {
  return languages.some(l => l.value === value);
}
