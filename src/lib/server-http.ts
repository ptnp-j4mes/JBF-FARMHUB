import { cookies } from 'next/headers';
import { API_SERVER_URL } from '@/lib/server-api';

type QueryValue = string | number | boolean | null | undefined;

export class ServerHttpError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'ServerHttpError';
    this.status = status;
  }
}

function buildUrl(path: string, query?: Record<string, QueryValue>): string {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  const url = new URL(`${API_SERVER_URL}${normalizedPath}`);

  if (query) {
    Object.entries(query).forEach(([key, value]) => {
      if (value === undefined || value === null || value === '') return;
      url.searchParams.set(key, String(value));
    });
  }

  return url.toString();
}

export async function serverGetJson<T>(
  path: string,
  options?: {
    query?: Record<string, QueryValue>;
    allowStatuses?: number[];
    timeoutMs?: number;
  },
): Promise<T> {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get('accessToken')?.value;
  const facilityId = cookieStore.get('current_facility_id')?.value;
  const timeoutMs = Math.max(1_000, options?.timeoutMs ?? 12_000);
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  let response: Response;
  try {
    response = await fetch(buildUrl(path, options?.query), {
      method: 'GET',
      cache: 'no-store',
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        ...(facilityId ? { 'X-Facility-Id': facilityId } : {}),
      },
    });
  } catch (error) {
    if ((error as Error)?.name === 'AbortError') {
      throw new ServerHttpError(`Request timeout after ${timeoutMs} ms`, 504);
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }

  if (!response.ok) {
    if (options?.allowStatuses?.includes(response.status)) {
      return [] as T;
    }

    const fallbackMessage = `Request failed with status ${response.status}`;
    const contentType = response.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
      throw new ServerHttpError(fallbackMessage, response.status);
    }

    const payload = (await response.json().catch(() => null)) as
      | { message?: string }
      | null;
    throw new ServerHttpError(payload?.message || fallbackMessage, response.status);
  }

  return (await response.json()) as T;
}
