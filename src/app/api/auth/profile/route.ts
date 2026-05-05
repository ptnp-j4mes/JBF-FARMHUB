import { API_SERVER_URL } from '@/lib/server-api';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function PUT(request: Request) {
  try {
    const cookieStore = await cookies();
    const body = await request.json();
    const authorizationHeader = request.headers.get('authorization');
    const accessTokenFromCookie = cookieStore.get('accessToken')?.value;
    const accessToken =
      authorizationHeader?.trim() ||
      (accessTokenFromCookie ? `Bearer ${accessTokenFromCookie}` : null);

    if (!accessToken) {
      return NextResponse.json(
        { message: 'Authentication is required.' },
        { status: 401 },
      );
    }

    const upstream = await fetch(`${API_SERVER_URL}/api/Auth/profile`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: accessToken,
      },
      body: JSON.stringify(body),
      cache: 'no-store',
    });

    const text = await upstream.text();
    return new NextResponse(text, {
      status: upstream.status,
      headers: {
        'Content-Type': upstream.headers.get('content-type') || 'application/json',
      },
    });
  } catch {
    return NextResponse.json(
      { message: 'Unable to update profile.' },
      { status: 500 },
    );
  }
}
