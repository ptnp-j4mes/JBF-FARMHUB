import type { WarehouseResponse } from '../types';

export type WarehouseScope = 'farm' | 'central';

export type InventoryActionKind = 'issue' | 'transfer' | 'adjust';

export type InventoryActionAvailability = {
  canOpen: boolean;
  blockedReason: string | null;
};

export type ResolvedInventoryContext = {
  accessibleWarehouses: WarehouseResponse[];
  scopedWarehouses: WarehouseResponse[];
  resolvedFarmFacilityId: number | null;
  defaultIssueWarehouseId: number;
  defaultScopedWarehouseId: number;
  scopeResolutionMessage: string | null;
  issue: InventoryActionAvailability;
  transfer: InventoryActionAvailability;
  adjust: InventoryActionAvailability;
};

function isActiveWarehouse(warehouse: WarehouseResponse): boolean {
  return warehouse.isActive;
}

function isFarmWarehouse(warehouse: WarehouseResponse): boolean {
  return String(warehouse.warehouseType ?? '').toLowerCase() === 'farm';
}

function isCentralWarehouse(warehouse: WarehouseResponse): boolean {
  return warehouse.isCentralHub === true;
}

export function resolveInventoryContext(
  warehouseScope: WarehouseScope,
  warehouses: WarehouseResponse[],
  currentFacilityId: number | null,
): ResolvedInventoryContext {
  const accessibleWarehouses = warehouses.filter(isActiveWarehouse);
  const accessibleFarmWarehouses = accessibleWarehouses.filter(isFarmWarehouse);
  const accessibleCentralWarehouses = accessibleWarehouses.filter(isCentralWarehouse);

  const resolvedFarmFacilityId =
    currentFacilityId ??
    accessibleFarmWarehouses.find((warehouse) => warehouse.facilityNodeId != null)?.facilityNodeId ??
    null;

  const scopedWarehouses =
    warehouseScope === 'central'
      ? accessibleCentralWarehouses
      : accessibleFarmWarehouses.filter((warehouse) =>
          resolvedFarmFacilityId == null
            ? true
            : warehouse.facilityNodeId === resolvedFarmFacilityId,
        );

  const fallbackScopedWarehouses =
    warehouseScope === 'farm' && scopedWarehouses.length === 0
      ? accessibleFarmWarehouses
      : scopedWarehouses;

  const defaultIssueWarehouseId = fallbackScopedWarehouses[0]?.id ?? 0;
  const defaultScopedWarehouseId = fallbackScopedWarehouses[0]?.id ?? 0;

  const scopeResolutionMessage =
    warehouseScope === 'farm' && currentFacilityId == null && accessibleFarmWarehouses.length > 0
      ? 'ยังไม่ระบุฟาร์มปัจจุบัน ระบบจะใช้คลังฟาร์มที่เข้าถึงได้แทน'
      : warehouseScope === 'farm' && currentFacilityId != null && scopedWarehouses.length === 0 && accessibleFarmWarehouses.length > 0
        ? 'ฟาร์มปัจจุบันไม่มีคลังใช้งานได้ ระบบจะใช้คลังฟาร์มที่เข้าถึงได้แทน'
        : null;

  const issue: InventoryActionAvailability = {
    canOpen: fallbackScopedWarehouses.length > 0,
    blockedReason:
      fallbackScopedWarehouses.length > 0
        ? null
        : 'ไม่พบคลังที่ใช้งานได้ใน scope ปัจจุบัน',
  };

  const transferAndAdjustBlockedReason =
    fallbackScopedWarehouses.length > 0
      ? null
      : 'ไม่พบคลังที่ใช้งานได้ใน scope ปัจจุบัน';

  const transfer: InventoryActionAvailability = {
    canOpen: fallbackScopedWarehouses.length > 0,
    blockedReason: transferAndAdjustBlockedReason,
  };

  const adjust: InventoryActionAvailability = {
    canOpen: fallbackScopedWarehouses.length > 0,
    blockedReason: transferAndAdjustBlockedReason,
  };

  return {
    accessibleWarehouses,
    scopedWarehouses: fallbackScopedWarehouses,
    resolvedFarmFacilityId,
    defaultIssueWarehouseId,
    defaultScopedWarehouseId,
    scopeResolutionMessage,
    issue,
    transfer,
    adjust,
  };
}
