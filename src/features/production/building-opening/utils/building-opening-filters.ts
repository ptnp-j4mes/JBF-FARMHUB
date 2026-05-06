import type { QuickStatusButtonItem } from '@/components/common';
import type { QuickStatusTone } from '@/lib/utils/quick-status.util';
import type { BuildingOpeningFilterParams, BuildingOpeningResponse } from '../types';

type HouseLookup = Map<number, { houseCode?: string | null }>;

export const BUILDING_OPENING_STATUS_ORDER = ['all', 'Draft', 'Submitted', 'Approved', 'Returned'] as const;

export type BuildingOpeningStatusFilter = (typeof BUILDING_OPENING_STATUS_ORDER)[number];

export function matchesBuildingOpeningFilters(
  row: Pick<BuildingOpeningResponse, 'documentNumber' | 'requestDate' | 'facilityId' | 'houseCode' | 'status'>,
  filters: BuildingOpeningFilterParams,
  houseOptionById: HouseLookup,
  includeStatus = true,
) {
  if (includeStatus && filters.status !== 'all' && row.status !== filters.status) {
    return false;
  }

  if (filters.requestDateFrom || filters.requestDateTo) {
    const rowDate = (row.requestDate || '').slice(0, 10);
    if (filters.requestDateFrom && rowDate < filters.requestDateFrom) {
      return false;
    }
    if (filters.requestDateTo && rowDate > filters.requestDateTo) {
      return false;
    }
  }

  if (filters.facilityId && row.facilityId !== filters.facilityId) {
    return false;
  }

  if (filters.houseId) {
    const house = houseOptionById.get(filters.houseId);
    if (house && row.houseCode !== house.houseCode) {
      return false;
    }
  }

  const keyword = filters.searchTerm.trim().toLowerCase();
  if (keyword && !row.documentNumber.toLowerCase().includes(keyword)) {
    return false;
  }

  return true;
}

export function buildBuildingOpeningStatusItems(
  rows: BuildingOpeningResponse[],
): QuickStatusButtonItem[] {
  const counts = {
    all: rows.length,
    Draft: rows.filter((row) => row.status === 'Draft').length,
    Submitted: rows.filter((row) => row.status === 'Submitted').length,
    Approved: rows.filter((row) => row.status === 'Approved').length,
    Returned: rows.filter((row) => row.status === 'Returned').length,
  };

  const items: Array<{
    value: BuildingOpeningStatusFilter;
    label: string;
    count: number;
    tone: QuickStatusTone;
  }> = [
    { value: 'all', label: 'ทั้งหมด', count: counts.all, tone: 'neutral' },
    { value: 'Draft', label: 'ฉบับร่าง', count: counts.Draft, tone: 'neutral' },
    { value: 'Submitted', label: 'รออนุมัติ', count: counts.Submitted, tone: 'warning' },
    { value: 'Approved', label: 'อนุมัติแล้ว', count: counts.Approved, tone: 'success' },
    { value: 'Returned', label: 'ตีกลับ', count: counts.Returned, tone: 'danger' },
  ];

  return items;
}
