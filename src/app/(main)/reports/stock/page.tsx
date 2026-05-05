import { StockReportPage } from '@/features/reports/stock/StockReportPage';
import type { StockBalancePagedResponse } from '@/features/production/stock/types';
import { serverGetJson } from '@/lib/server-http';

export const dynamic = 'force-dynamic';

export default async function StockReportRoute() {
  let initialRows: StockBalancePagedResponse['data'] = [];

  try {
    const payload = await serverGetJson<StockBalancePagedResponse>('/api/Inventories/balance/paged', {
      query: {
        page: 1,
        pageSize: 10,
        includeZero: true,
        sortBy: 'itemCode',
        sortDir: 'asc',
      },
      allowStatuses: [401, 403],
    });

    initialRows = payload?.data ?? [];
  } catch {
    initialRows = [];
  }

  return <StockReportPage initialRows={initialRows} />;
}
