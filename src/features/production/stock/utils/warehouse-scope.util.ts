import type { WarehouseResponse } from '../types';

export type WarehouseScope = 'farm' | 'central';

export type WarehouseScopeContext = {
  accessibleWarehouses: WarehouseResponse[];
  farmWarehouses: WarehouseResponse[];
  centralWarehouses: WarehouseResponse[];
  scopedWarehouses: WarehouseResponse[];
  resolvedFarmFacilityId: number | null;
  centralWarehouseIds: Set<number>;
  farmWarehouseIds: Set<number>;
  scopedWarehouseIds: Set<number>;
  hasCentralWarehouse: boolean;
  isCentralWarehouseId: (warehouseId: number) => boolean;
  isFarmWarehouseId: (warehouseId: number) => boolean;
  isScopedWarehouseId: (warehouseId: number) => boolean;
};

export function isCentralWarehouse(warehouse: WarehouseResponse | null | undefined): boolean {
  if (!warehouse) return false;
  return warehouse.isCentralHub === true;
}

export function isFarmWarehouse(warehouse: WarehouseResponse | null | undefined): boolean {
  if (!warehouse) return false;
  return String(warehouse.warehouseType ?? '').trim().toLowerCase() === 'farm';
}

export function belongsToFacility(
  warehouse: WarehouseResponse | null | undefined,
  facilityId: number | null | undefined,
): boolean {
  if (!warehouse || !facilityId || facilityId <= 0) {
    return false;
  }
  return warehouse.facilityNodeId === facilityId;
}

export function isWarehouseInScope(
  warehouse: WarehouseResponse | null | undefined,
  scope: WarehouseScope,
  facilityId?: number | null,
): boolean {
  if (scope === 'central') {
    return isCentralWarehouse(warehouse);
  }

  if (!isFarmWarehouse(warehouse)) {
    return false;
  }

  if (!facilityId || facilityId <= 0) {
    return true;
  }

  return belongsToFacility(warehouse, facilityId);
}

export function filterWarehousesByScope(
  warehouses: WarehouseResponse[],
  scope: WarehouseScope,
  facilityId?: number | null,
): WarehouseResponse[] {
  return warehouses.filter((warehouse) => isWarehouseInScope(warehouse, scope, facilityId));
}

export function filterFarmWarehousesByFacility(
  warehouses: WarehouseResponse[],
  facilityId?: number | null,
): WarehouseResponse[] {
  return warehouses.filter((warehouse) => {
    if (!isFarmWarehouse(warehouse)) return false;
    if (!facilityId || facilityId <= 0) return true;
    return belongsToFacility(warehouse, facilityId);
  });
}

export function filterCentralWarehouses(warehouses: WarehouseResponse[]): WarehouseResponse[] {
  return warehouses.filter((warehouse) => isCentralWarehouse(warehouse));
}

export function isWarehouseForFacility(
  warehouse: WarehouseResponse | null | undefined,
  facilityId?: number | null,
  includeCentral = false,
): boolean {
  if (!warehouse) return false;
  if (includeCentral && isCentralWarehouse(warehouse)) {
    return true;
  }
  return isFarmWarehouse(warehouse) && belongsToFacility(warehouse, facilityId);
}

export function filterWarehousesForFacility(
  warehouses: WarehouseResponse[],
  facilityId?: number | null,
  includeCentral = false,
): WarehouseResponse[] {
  return warehouses.filter((warehouse) => isWarehouseForFacility(warehouse, facilityId, includeCentral));
}

export function createWarehouseScopeContext(
  warehouses: WarehouseResponse[],
  scope: WarehouseScope,
  facilityId?: number | null,
): WarehouseScopeContext {
  const accessibleWarehouses = warehouses.filter((warehouse) => warehouse.isActive);
  const farmWarehouses = accessibleWarehouses.filter(isFarmWarehouse);
  const centralWarehouses = accessibleWarehouses.filter(isCentralWarehouse);
  const resolvedFarmFacilityId =
    facilityId ??
    farmWarehouses.find((warehouse) => warehouse.facilityNodeId != null)?.facilityNodeId ??
    null;

  const scopedWarehouses =
    scope === 'central'
      ? centralWarehouses
      : farmWarehouses.filter((warehouse) =>
          resolvedFarmFacilityId == null ? true : warehouse.facilityNodeId === resolvedFarmFacilityId,
        );

  const fallbackScopedWarehouses =
    scope === 'farm' && scopedWarehouses.length === 0
      ? farmWarehouses
      : scopedWarehouses;

  const centralWarehouseIds = new Set(centralWarehouses.map((warehouse) => warehouse.id));
  const farmWarehouseIds = new Set(farmWarehouses.map((warehouse) => warehouse.id));
  const scopedWarehouseIds = new Set(fallbackScopedWarehouses.map((warehouse) => warehouse.id));

  return {
    accessibleWarehouses,
    farmWarehouses,
    centralWarehouses,
    scopedWarehouses: fallbackScopedWarehouses,
    resolvedFarmFacilityId,
    centralWarehouseIds,
    farmWarehouseIds,
    scopedWarehouseIds,
    hasCentralWarehouse: centralWarehouses.length > 0,
    isCentralWarehouseId: (warehouseId: number) => centralWarehouseIds.has(warehouseId),
    isFarmWarehouseId: (warehouseId: number) => farmWarehouseIds.has(warehouseId),
    isScopedWarehouseId: (warehouseId: number) => scopedWarehouseIds.has(warehouseId),
  };
}
