export type AppLocale = 'th' | 'en';

export type TranslationValue = string | TranslationTree;

export interface TranslationTree {
  [key: string]: TranslationValue;
}

export interface I18nContextValue {
  locale: AppLocale;
  setLocale: (locale: AppLocale) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
}

