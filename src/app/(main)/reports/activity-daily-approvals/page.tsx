import {
  ActivityDailyApprovalPage,
  type ActivityDailyApprovalRow,
} from '@/features/reports/activity-daily-approvals/ActivityDailyApprovalPage';
import { serverGetJson } from '@/lib/server-http';

export const dynamic = 'force-dynamic';

export default async function ActivityDailyApprovalsRoute() {
  let initialData: ActivityDailyApprovalRow[] = [];

  try {
    initialData = await serverGetJson<ActivityDailyApprovalRow[]>('/api/ProductionActivities/pending-approvals', {
      allowStatuses: [401, 403],
    });
  } catch {
    initialData = [];
  }

  return <ActivityDailyApprovalPage initialData={initialData} />;
}
