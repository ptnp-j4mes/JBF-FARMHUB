import axios, {
  type AxiosInstance,
  type AxiosRequestConfig,
  type AxiosResponse,
} from 'axios';
import { attachInterceptors } from './interceptors';

const baseURL = '';

export const httpClient = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
});

const inFlightGetRequests = new Map<string, Promise<AxiosResponse>>();

function stableSerialize(value: unknown): string {
  if (value === null) return 'null';
  if (value === undefined) return 'undefined';
  if (typeof value !== 'object') return String(value);
  if (Array.isArray(value)) return `[${value.map(stableSerialize).join(',')}]`;

  const entries = Object.entries(value as Record<string, unknown>)
    .filter(([, v]) => v !== undefined)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}:${stableSerialize(v)}`);
  return `{${entries.join(',')}}`;
}

function createGetRequestKey(url: string, config?: AxiosRequestConfig): string {
  const base = config?.baseURL ?? '';
  const params = config?.params ? stableSerialize(config.params) : '';
  return `GET|${base}|${url}|${params}`;
}

function attachGetDedupe(instance: AxiosInstance): void {
  const originalGet = instance.get.bind(instance);

  instance.get = function dedupedGet<T = unknown, R = AxiosResponse<T>, D = unknown>(
    url: string,
    config?: AxiosRequestConfig<D>,
  ): Promise<R> {
    const dedupeEnabled = (config as AxiosRequestConfig & { dedupe?: boolean } | undefined)?.dedupe !== false;
    if (!dedupeEnabled) {
      return originalGet<T, R, D>(url, config);
    }

    const key = createGetRequestKey(url, config);
    const existing = inFlightGetRequests.get(key);
    if (existing) {
      return existing as Promise<R>;
    }

    const request = originalGet<T, R, D>(url, config) as Promise<AxiosResponse>;
    inFlightGetRequests.set(key, request);

    return request.finally(() => {
      inFlightGetRequests.delete(key);
    }) as Promise<R>;
  };
}

attachGetDedupe(httpClient);
attachInterceptors(httpClient);

export default httpClient;
