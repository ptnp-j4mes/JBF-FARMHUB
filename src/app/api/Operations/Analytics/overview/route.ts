import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

function resolveApiBase(): string {
  const value = process.env.NEXT_PUBLIC_API_URL?.trim();
  if (!value) {
    throw new Error('Missing NEXT_PUBLIC_API_URL');
  }
  return value.replace(/\/$/, '');
}

function buildEmptyAnalyticsOverview() {
  return {
    lastUpdatedAt: new Date().toISOString(),
    totalStockHead: 0,
    totalDeathHead: 0,
    mortalityRatePct: 0,
    fcrAverage: 0,
    feedCostMonth: 0,
    farmCount: 0,
    monthlyTrends: [],
    farmPerformance: [],
  };
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const cookieStore = await cookies();
    const apiBase = resolveApiBase();
    const target = new URL(`${apiBase}/api/Operations/Analytics/overview`);

    request.nextUrl.searchParams.forEach((value, key) => {
      target.searchParams.append(key, value);
    });

    const authorizationHeader =
      request.headers.get('authorization')?.trim() ||
      (cookieStore.get('accessToken')?.value
        ? `Bearer ${cookieStore.get('accessToken')?.value}`
        : null);

    const response = await fetch(target.toString(), {
      method: 'GET',
      headers: {
        cookie: request.headers.get('cookie') ?? '',
        ...(authorizationHeader ? { authorization: authorizationHeader } : {}),
        ...(request.headers.get('x-facility-id')
          ? { 'x-facility-id': request.headers.get('x-facility-id') ?? '' }
          : {}),
        ...(request.headers.get('x-facility-code')
          ? { 'x-facility-code': request.headers.get('x-facility-code') ?? '' }
          : {}),
      },
      cache: 'no-store',
    });

    const bodyText = await response.text();
    if (response.status >= 500) {
      return NextResponse.json(buildEmptyAnalyticsOverview(), { status: 200 });
    }

    return new NextResponse(bodyText, {
      status: response.status,
      headers: {
        'content-type': response.headers.get('content-type') ?? 'application/json',
      },
    });
  } catch {
    return NextResponse.json(
      {
        ...buildEmptyAnalyticsOverview(),
      },
      { status: 200 },
    );
  }
}
