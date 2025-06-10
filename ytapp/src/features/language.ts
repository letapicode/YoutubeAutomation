import { languages, Language, isLanguage } from './languages';

// Backwards compatibility: expose the languages array under the old name.
export const languageOptions = languages;

export type { Language };
export { isLanguage };
