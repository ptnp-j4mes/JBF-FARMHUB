import { NextRequest, NextResponse } from 'next/server';
import { CURRENT_ACCESS_CONTEXT_COOKIE_KEY } from '@/lib/access/storage';

const PROTECTED_PREFIXES = [
  '/operations',
  '/production',
  '/reports',
  '/admin',
  '/data',
  '/profile',
] as const;

const AUTH_PATHS = new Set(['/auth/login', '/auth/register']);

function isStaticAsset(pathname: string): boolean {
  return (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon') ||
    pathname.startsWith('/assets') ||
    pathname.startsWith('/images') ||
    /\.[^/]+$/.test(pathname)
  );
}

function isProtectedPath(pathname: string): boolean {
  return PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

export function proxy(request: NextRequest): NextResponse {
  const { pathname, search } = request.nextUrl;

  if (
    pathname.startsWith('/api/') ||
    pathname.startsWith('/api-proxy/') ||
    isStaticAsset(pathname)
  ) {
    return NextResponse.next();
  }

  const hasAuthStatus = request.cookies.get('auth_status')?.value === '1';
  const hasAccessToken = Boolean(request.cookies.get('accessToken')?.value);
  const hasRefreshToken = Boolean(request.cookies.get('refreshToken')?.value);
  const hasLocalAccessToken = Boolean(request.cookies.get('access_token')?.value);
  const hasLocalRefreshToken = Boolean(request.cookies.get('refresh_token')?.value);
  const isAuthenticated =
    hasAuthStatus ||
    hasAccessToken ||
    hasRefreshToken ||
    hasLocalAccessToken ||
    hasLocalRefreshToken;
  const hasCurrentAccessContext = Boolean(
    request.cookies.get(CURRENT_ACCESS_CONTEXT_COOKIE_KEY)?.value,
  );

  if (pathname === '/') {
    const redirectPath = isAuthenticated ? '/access' : '/auth/login';
    return NextResponse.redirect(new URL(redirectPath, request.url));
  }

  if (AUTH_PATHS.has(pathname)) {
    if (isAuthenticated) {
      return NextResponse.redirect(new URL('/access', request.url));
    }
    return NextResponse.next();
  }

  if (isProtectedPath(pathname) && !isAuthenticated) {
    const loginUrl = new URL('/auth/login', request.url);
    const nextParams = new URLSearchParams(search);
    // Prevent Next.js internal RSC token from polluting redirect URLs on failed auth.
    nextParams.delete('_rsc');
    const nextQuery = nextParams.toString();
    const nextPath = `${pathname}${nextQuery ? `?${nextQuery}` : ''}`;
    if (nextPath !== '/') {
      loginUrl.searchParams.set('next', nextPath);
    }
    return NextResponse.redirect(loginUrl);
  }

  if (isProtectedPath(pathname) && isAuthenticated && !hasCurrentAccessContext) {
    const accessUrl = new URL('/access', request.url);
    const nextParams = new URLSearchParams(search);
    nextParams.delete('_rsc');
    const nextQuery = nextParams.toString();
    const nextPath = `${pathname}${nextQuery ? `?${nextQuery}` : ''}`;
    if (nextPath !== '/' && nextPath !== '/access') {
      accessUrl.searchParams.set('next', nextPath);
    }
    return NextResponse.redirect(accessUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
