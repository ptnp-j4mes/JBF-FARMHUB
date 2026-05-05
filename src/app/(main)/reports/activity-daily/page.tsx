import { ActivityDailyReportPage } from '@/features/reports/activity-daily/ActivityDailyReportPage';

export const dynamic = 'force-dynamic';

export default async function ActivityDailyReportRoute() {
  return <ActivityDailyReportPage initialItems={[]} />;
}
