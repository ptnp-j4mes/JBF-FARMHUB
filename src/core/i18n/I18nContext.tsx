'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { resources } from '@/core/i18n/resources';
import type { AppLocale, I18nContextValue, TranslationTree } from '@/core/i18n/types';

const DEFAULT_LOCALE: AppLocale = 'th';
const STORAGE_KEY = 'jbfarmhub_locale';

const I18nContext = createContext<I18nContextValue>({
  locale: DEFAULT_LOCALE,
  setLocale: () => undefined,
  t: (key) => key,
});

const resolvePath = (tree: TranslationTree, key: string): string | undefined => {
  const value = key
    .split('.')
    .reduce<unknown>((acc, current) => {
      if (!acc || typeof acc === 'string') return undefined;
      return (acc as TranslationTree)[current];
    }, tree);

  return typeof value === 'string' ? value : undefined;
};

const interpolate = (
  value: string,
  params?: Record<string, string | number>,
): string => {
  if (!params) return value;
  return value.replace(/\{(\w+)\}/g, (_, key: string) => {
    const param = params[key];
    return param === undefined ? `{${key}}` : String(param);
  });
};

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<AppLocale>(DEFAULT_LOCALE);

  useEffect(() => {
    const savedLocale = localStorage.getItem(STORAGE_KEY) as AppLocale | null;
    if (savedLocale === 'th' || savedLocale === 'en') {
      setLocaleState(savedLocale);
      document.documentElement.lang = savedLocale;
      return;
    }
    document.documentElement.lang = DEFAULT_LOCALE;
  }, []);

  const setLocale = useCallback((nextLocale: AppLocale) => {
    setLocaleState(nextLocale);
    localStorage.setItem(STORAGE_KEY, nextLocale);
    document.documentElement.lang = nextLocale;
  }, []);

  const t = useCallback(
    (key: string, params?: Record<string, string | number>) => {
      const currentResource = resources[locale];
      const fallbackResource = resources[DEFAULT_LOCALE];

      const translated =
        resolvePath(currentResource, key) ?? resolvePath(fallbackResource, key);

      if (!translated) return key;
      return interpolate(translated, params);
    },
    [locale],
  );

  const value = useMemo(
    () => ({
      locale,
      setLocale,
      t,
    }),
    [locale, setLocale, t],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export const useI18n = () => useContext(I18nContext);

