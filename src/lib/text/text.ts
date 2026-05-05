import { thaiTextResources } from './resources';
import type { TextParams, TextTree } from './types';

function resolvePath(tree: TextTree, key: string): string | undefined {
  const value = key
    .split('.')
    .reduce<unknown>((acc, current) => {
      if (!acc || typeof acc === 'string') return undefined;
      return (acc as TextTree)[current];
    }, tree);

  return typeof value === 'string' ? value : undefined;
}

function interpolate(value: string, params?: TextParams): string {
  if (!params) return value;

  return value.replace(/\{(\w+)\}/g, (_, key: string) => {
    const param = params[key];
    return param === undefined ? `{${key}}` : String(param);
  });
}

export function translateText(key: string, params?: TextParams): string {
  const translated = resolvePath(thaiTextResources, key) ?? key;
  return interpolate(translated, params);
}
