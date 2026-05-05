import { API_SERVER_URL } from '@/lib/server-api';
import dayjs from '@/lib/dayjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { clearAuthCookies, setAuthCookie } from '../cookies';

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const refreshTokenFromCookie = cookieStore.get('refreshToken')?.value;
    const refreshToken = refreshTokenFromCookie;

    if (!refreshToken) {
      return NextResponse.json(
        { message: 'Refresh token is required.' },
        { status: 400 },
      );
    }

    const upstream = await fetch(`${API_SERVER_URL}/api/Auth/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refreshToken }),
      cache: 'no-store',
    });

    const text = await upstream.text();
    if (!upstream.ok) {
      if (upstream.status === 401 || upstream.status === 403) {
        clearAuthCookies(cookieStore, request);
      }

      return new NextResponse(text || 'Refresh failed', {
        status: upstream.status,
        headers: {
          'Content-Type': upstream.headers.get('content-type') || 'text/plain',
        },
      });
    }

    const data = JSON.parse(text);
    const expiresAt = dayjs().add(data.expiresIn || 0, 'second').toDate();

    setAuthCookie(cookieStore, 'accessToken', data.token, request, expiresAt);
    setAuthCookie(
      cookieStore,
      'refreshToken',
      data.refreshToken,
      request,
      dayjs().add(7, 'day').toDate(),
    );
    setAuthCookie(cookieStore, 'auth_status', '1', request, expiresAt);

    const safeData = {
      ...data,
      token: undefined,
      refreshToken: undefined,
    };

    return NextResponse.json(safeData);
  } catch {
    return NextResponse.json(
      { message: 'Unable to refresh token.' },
      { status: 500 },
    );
  }
}
