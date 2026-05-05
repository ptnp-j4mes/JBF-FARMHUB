import { BuildingOpeningApprovalPage } from '@/features/production/building-opening-approvals/BuildingOpeningApprovalPage';
import type { BuildingOpeningResponse } from '@/features/production/building-opening/types';
import { serverGetJson } from '@/lib/server-http';

export const dynamic = 'force-dynamic';

export default async function BuildingOpeningApprovalsReportPage() {
  let initialData: BuildingOpeningResponse[] = [];

  try {
    initialData = await serverGetJson<BuildingOpeningResponse[]>('/api/BuildingOpenings');
  } catch {
    initialData = [];
  }

  return <BuildingOpeningApprovalPage initialData={initialData} mode="report" />;
}
