import { BuildingOpeningPage } from '@/features/production/building-opening/BuildingOpeningPage';
import type { BuildingOpeningResponse } from '@/features/production/building-opening/types';
import { serverGetJson } from '@/lib/server-http';

export const dynamic = 'force-dynamic';

export default async function BuildingOpeningPageWrapper() {
  let initialData: BuildingOpeningResponse[] = [];

  try {
    initialData = await serverGetJson<BuildingOpeningResponse[]>('/api/BuildingOpenings');
  } catch {
    initialData = [];
  }

  return <BuildingOpeningPage initialData={initialData} />;
}
