import { API_SERVER_URL } from '@/lib/server-api';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const cookieStore = await cookies();
    const authorizationHeader =
      request.headers.get('authorization')?.trim() ||
      (cookieStore.get('accessToken')?.value
        ? `Bearer ${cookieStore.get('accessToken')?.value}`
        : null);
    const upstream = await fetch(`${API_SERVER_URL}/api/Auth/bootstrap`, {
      method: 'GET',
      headers: {
        ...(authorizationHeader ? { Authorization: authorizationHeader } : {}),
      },
      cache: 'no-store',
    });

    const text = await upstream.text();
    if (!upstream.ok) {
      return new NextResponse(text || 'Bootstrap failed', {
        status: upstream.status,
        headers: {
          'Content-Type': upstream.headers.get('content-type') || 'text/plain',
        },
      });
    }

    return new NextResponse(text, {
      status: upstream.status,
      headers: {
        'Content-Type': upstream.headers.get('content-type') || 'application/json',
      },
    });
  } catch {
    return NextResponse.json(
      { message: 'Unable to load auth bootstrap.' },
      { status: 500 },
    );
  }
}
