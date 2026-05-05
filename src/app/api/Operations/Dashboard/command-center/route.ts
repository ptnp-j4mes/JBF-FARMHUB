import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

function resolveApiBase(): string {
  const value = process.env.NEXT_PUBLIC_API_URL?.trim();
  if (!value) {
    throw new Error('Missing NEXT_PUBLIC_API_URL');
  }
  return value.replace(/\/$/, '');
}

function buildEmptyDashboard() {
  return {
    hasFarmAccess: false,
    accessMessage: 'ไม่สามารถโหลดข้อมูลแดชบอร์ดได้ชั่วคราว',
    lastUpdatedAt: new Date().toISOString(),
    summaryCards: {
      totalStockHead: 0,
      mortalityRatePct: 0,
      fcrAverage: 0,
      feedCostMonth: 0,
      budgetMonth: 0,
      budgetUsagePct: 0,
      momDeltaPct: 0,
    },
    alerts: [],
    farmTable: [],
    feedUsageByNumber: [],
  };
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const cookieStore = await cookies();
    const apiBase = resolveApiBase();
    const target = new URL(`${apiBase}/api/Operations/Dashboard/command-center`);

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
      return NextResponse.json(buildEmptyDashboard(), { status: 200 });
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
        ...buildEmptyDashboard(),
      },
      { status: 200 },
    );
  }
}
