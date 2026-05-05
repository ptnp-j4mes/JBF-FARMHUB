import { apiClient } from '@/lib/api/client';
import type { FacilityNodeResponse, IncludeInactiveQuery, FacilityNodeType } from '../types';
import { userAssignmentEndpoints, withIncludeInactive } from './user-assignment.shared';

type ScopeCatalogApiResponse = {
  farms: Array<{
    id: number;
    name: string;
    code: string;
    location?: string | null;
    status: string;
  }>;
  zones: Array<{
    id: number;
    name: string;
    farmId: number;
    farmName: string;
    status: string;
  }>;
  houses: Array<{
    id: number;
    name: string;
    zoneId: number;
    zoneName: string;
    farmName: string;
    status: string;
  }>;
  pens: Array<{
    id: number;
    name: string;
    houseId: number;
    houseName: string;
    zoneName: string;
    farmName: string;
    status: string;
  }>;
};

function toFacilityStatus(status: string): boolean {
  return status.trim().toLowerCase() === 'active' || status.trim() === 'ใช้งาน';
}

export const scopeCatalogService = {
  getFacilities: async (options: IncludeInactiveQuery = {}): Promise<FacilityNodeResponse[]> =>
    apiClient
      .get<ScopeCatalogApiResponse>(userAssignmentEndpoints.authModels.scopeCatalogFacilities, {
        params: withIncludeInactive(options),
      })
      .then((catalog) => {
        const facilities: FacilityNodeResponse[] = [
          ...catalog.farms.map((farm) => ({
            id: farm.id,
            parentId: null,
            parentName: null,
            code: farm.code,
            name: farm.name,
            description: farm.location ?? '',
            type: 'farm' as FacilityNodeType,
            isActive: toFacilityStatus(farm.status),
            childrenCount: 0,
          })),
          ...catalog.zones.map((zone) => ({
            id: zone.id,
            parentId: zone.farmId,
            parentName: zone.farmName,
            code: zone.name,
            name: zone.name,
            description: '',
            type: 'zone' as FacilityNodeType,
            isActive: toFacilityStatus(zone.status),
            childrenCount: 0,
          })),
          ...catalog.houses.map((house) => ({
            id: house.id,
            parentId: house.zoneId,
            parentName: house.zoneName,
            code: house.name,
            name: house.name,
            description: house.farmName ?? '',
            type: 'house' as FacilityNodeType,
            isActive: toFacilityStatus(house.status),
            childrenCount: 0,
          })),
          ...catalog.pens.map((pen) => ({
            id: pen.id,
            parentId: pen.houseId,
            parentName: pen.houseName,
            code: pen.name,
            name: pen.name,
            description: `${pen.zoneName ?? ''} ${pen.farmName ?? ''}`.trim(),
            type: 'pen' as FacilityNodeType,
            isActive: toFacilityStatus(pen.status),
            childrenCount: 0,
          })),
        ];

        return facilities;
      }),
};
