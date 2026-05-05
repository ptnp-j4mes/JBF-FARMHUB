'use client';

type CacheEntry<T> = {
  value?: T;
  promise?: Promise<T>;
};

const clientQueryCache = new Map<string, CacheEntry<unknown>>();

function getEntry<T>(key: string): CacheEntry<T> | undefined {
  return clientQueryCache.get(key) as CacheEntry<T> | undefined;
}

export function readClientQueryCache<T>(key: string): T | undefined {
  return getEntry<T>(key)?.value;
}

export function writeClientQueryCache<T>(key: string, value: T): T {
  clientQueryCache.set(key, { value });
  return value;
}

export function updateClientQueryCache<T>(
  key: string,
  updater: (currentValue: T | undefined) => T,
): T {
  const nextValue = updater(readClientQueryCache<T>(key));
  clientQueryCache.set(key, { value: nextValue });
  return nextValue;
}

export function invalidateClientQueryCache(key: string): void {
  clientQueryCache.delete(key);
}

export function invalidateClientQueryCacheByPrefix(prefix: string): void {
  clientQueryCache.forEach((_value, key) => {
    if (key.startsWith(prefix)) {
      clientQueryCache.delete(key);
    }
  });
}

export async function getOrLoadClientQueryCache<T>(
  key: string,
  loader: () => Promise<T>,
  options?: { force?: boolean },
): Promise<T> {
  const existingEntry = getEntry<T>(key);

  if (!options?.force && existingEntry?.value !== undefined) {
    return existingEntry.value;
  }

  if (!options?.force && existingEntry?.promise) {
    return existingEntry.promise;
  }

  const request = loader()
    .then((value) => {
      clientQueryCache.set(key, { value });
      return value;
    })
    .catch((error) => {
      if (clientQueryCache.get(key)?.promise === request) {
        clientQueryCache.delete(key);
      }
      throw error;
    });

  clientQueryCache.set(key, { value: existingEntry?.value, promise: request });
  return request;
}
