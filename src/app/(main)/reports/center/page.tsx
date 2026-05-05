import { PRReportPage } from '@/features/reports/pr-report/PRReportPage';
import type { PurchaseRequestResponse } from '@/features/production/purchase/types';
import { serverGetJson } from '@/lib/server-http';

export const dynamic = 'force-dynamic';

type PurchaseRequestReportResponse = {
  data: PurchaseRequestResponse[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

export default async function Page() {
  let initialItems: PurchaseRequestResponse[] = [];
  try {
    const payload = await serverGetJson<PurchaseRequestReportResponse>('/api/PurchaseRequests', {
      query: { page: 1, pageSize: 500 },
      allowStatuses: [401, 403],
    });
    initialItems = payload?.data ?? [];
  } catch {
    initialItems = [];
  }

  return <PRReportPage initialItems={initialItems} />;
}
