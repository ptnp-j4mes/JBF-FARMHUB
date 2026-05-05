import { cookies } from 'next/headers';

export type AuthCookieStore = Awaited<ReturnType<typeof cookies>>;

function parseForwardedProto(value: string | null): string | null {
  if (!value) return null;
  return value.split(',')[0]?.trim().toLowerCase() || null;
}

export function isSecureRequest(request: Request): boolean {
  const forwardedProto = parseForwardedProto(request.headers.get('x-forwarded-proto'));
  if (forwardedProto) {
    return forwardedProto === 'https';
  }

  return new URL(request.url).protocol === 'https:';
}

export function setAuthCookie(
  cookieStore: AuthCookieStore,
  name: 'accessToken' | 'refreshToken' | 'auth_status',
  value: string,
  request: Request,
  expires: Date,
): void {
  cookieStore.set(name, value, {
    httpOnly: name !== 'auth_status',
    path: '/',
    sameSite: 'lax',
    secure: isSecureRequest(request),
    expires,
  });
}

export function clearAuthCookies(cookieStore: AuthCookieStore, request: Request): void {
  const expiredAt = new Date(0);

  setAuthCookie(cookieStore, 'accessToken', '', request, expiredAt);
  setAuthCookie(cookieStore, 'refreshToken', '', request, expiredAt);
  setAuthCookie(cookieStore, 'auth_status', '', request, expiredAt);
}
