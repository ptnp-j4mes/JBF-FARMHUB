import { API_SERVER_URL } from '@/lib/server-api';
import dayjs from '@/lib/dayjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { setAuthCookie } from '../cookies';

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const upstream = await fetch(`${API_SERVER_URL}/api/Auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
      cache: 'no-store',
    });

    const text = await upstream.text();
    if (!upstream.ok) {
      return new NextResponse(text || 'Login failed', {
        status: upstream.status,
        headers: {
          'Content-Type': upstream.headers.get('content-type') || 'text/plain',
        },
      });
    }

    const data = JSON.parse(text);
    const cookieStore = await cookies();
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
      { message: 'Unable to process login request.' },
      { status: 500 },
    );
  }
}
