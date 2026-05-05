import { StockPage } from '@/features/production/stock/StockPage';
import type {
  DashboardMetricResponse,
  StockBalanceResponse,
  StockFacilityResponse,
  WarehouseResponse,
} from '@/features/production/stock/types';
import { serverGetJson } from '@/lib/server-http';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

type FacilityScopeResponse = {
  isCentralHub?: boolean;
};

export default async function StockPageWrapper() {
  const cookieStore = await cookies();
  const currentFacilityIdRaw = cookieStore.get('current_facility_id')?.value;
  const currentFacilityCode = cookieStore.get('current_facility_code')?.value;
  const currentFacilityId = Number(currentFacilityIdRaw);

  const currentFacility =
    Number.isFinite(currentFacilityId) && currentFacilityId > 0
      ? await serverGetJson<FacilityScopeResponse>(`/api/Facilities/${currentFacilityId}`).catch(() => null)
      : null;
  const isCentral = currentFacility?.isCentralHub === true;
  const facilityScopeQuery =
    Number.isFinite(currentFacilityId) && currentFacilityId > 0
      ? {
          facilityId: currentFacilityId,
          facilityCode: currentFacilityCode ?? undefined,
        }
      : undefined;

  const [initialDashboard, initialStockBalances, initialStockFacilities] = isCentral
    ? await Promise.all([
        serverGetJson<DashboardMetricResponse>('/api/Inventories/dashboard', {
          query: facilityScopeQuery,
        }).catch(() => null),
        serverGetJson<StockBalanceResponse[]>('/api/Inventories/balance', {
          query: facilityScopeQuery,
        }).catch(() => []),
        Promise.resolve([] as StockFacilityResponse[]),
      ])
    : await Promise.all([
        serverGetJson<DashboardMetricResponse>('/api/Inventories/dashboard', {
          query: facilityScopeQuery,
        }).catch(() => null),
        Promise.resolve([] as StockBalanceResponse[]),
        serverGetJson<StockFacilityResponse[]>('/api/StockFacilities', {
          query: facilityScopeQuery,
        }).catch(() => []),
      ]);
  const initialWarehouses = await serverGetJson<WarehouseResponse[]>('/api/Warehouses', {
    query: facilityScopeQuery,
  }).catch(() => []);

  return (
    <StockPage
      initialDashboard={initialDashboard}
      initialStockBalances={initialStockBalances}
      initialStockFacilities={initialStockFacilities}
      initialWarehouses={initialWarehouses}
      initialReceivablePRs={[]}
    />
  );
}
