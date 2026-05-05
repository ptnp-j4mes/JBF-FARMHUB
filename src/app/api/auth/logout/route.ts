import { API_SERVER_URL } from '@/lib/server-api';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { clearAuthCookies } from '../cookies';

export async function POST(request: Request) {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get('accessToken')?.value;
  const refreshToken = cookieStore.get('refreshToken')?.value;

  if (!refreshToken) {
    clearAuthCookies(cookieStore, request);
    return NextResponse.json(
      { message: 'Refresh token is required.' },
      { status: 400 },
    );
  }

  try {
    const upstream = await fetch(`${API_SERVER_URL}/api/Auth/logout`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      },
      body: JSON.stringify({ refreshToken }),
      cache: 'no-store',
    });

    const text = await upstream.text();
    clearAuthCookies(cookieStore, request);

    if (!upstream.ok) {
      return new NextResponse(text || 'Logout failed', {
        status: upstream.status,
        headers: {
          'Content-Type': upstream.headers.get('content-type') || 'text/plain',
        },
      });
    }

    return NextResponse.json({ success: true });
  } catch {
    clearAuthCookies(cookieStore, request);
    return NextResponse.json(
      { message: 'Unable to logout.' },
      { status: 500 },
    );
  }
}
