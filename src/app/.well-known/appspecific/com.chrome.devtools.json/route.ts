import { NextResponse } from 'next/server';

export function GET() {
  // Chrome DevTools probes this optional endpoint. Return 204 to avoid
  // noisy 500s during local development when no config is required.
  return new NextResponse(null, { status: 204 });
}

