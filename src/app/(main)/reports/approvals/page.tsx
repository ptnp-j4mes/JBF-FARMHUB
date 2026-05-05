import { ApprovalsPage as ReportsApprovalsPage } from '@/features/reports/approvals/ApprovalsPage';
import type { ApprovalPendingItem } from '@/features/production/purchase/types';
import { serverGetJson } from '@/lib/server-http';

export const dynamic = 'force-dynamic';

export default async function ApprovalsPage() {
  let initialPendingItems: ApprovalPendingItem[] = [];
  try {
    initialPendingItems = await serverGetJson<ApprovalPendingItem[]>(
      '/api/Approvals/pending',
      { allowStatuses: [401, 403] },
    );
  } catch {
    initialPendingItems = [];
  }

  return <ReportsApprovalsPage initialPendingItems={initialPendingItems} />;
}
