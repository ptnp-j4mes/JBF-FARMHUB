import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET() {
  const cookieStore = await cookies();
  const isAuthenticated = cookieStore.get('auth_status')?.value === '1';

  return NextResponse.json({ isAuthenticated });
}

