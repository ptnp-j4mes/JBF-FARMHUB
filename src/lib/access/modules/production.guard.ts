import { PermissionAction } from '@/features/auth/types/enums';
import { createModuleGuard } from './module-guard';

type ProductionResourceKey =
  | 'activity'
  | 'building_opening'
  | 'construction';

const PRODUCTION_MODULE = 'production' as const;
const productionGuard = createModuleGuard<ProductionResourceKey>(PRODUCTION_MODULE);

export async function warmProductionPermissionCatalog(): Promise<void> {
  await productionGuard.warmCatalog();
}

export function canViewProductionActivity(
  facilityId?: number | null,
): boolean {
  return productionGuard.canAccessResource('activity', facilityId);
}

export function canManageProductionActivity(
  facilityId?: number | null,
): boolean {
  return productionGuard.canRunResourceAction(
    'activity',
    PermissionAction.Manage,
    facilityId,
  );
}

export function canApproveProductionActivity(
  facilityId?: number | null,
): boolean {
  return productionGuard.canRunResourceAction(
    'activity',
    PermissionAction.Approve,
    facilityId,
  );
}

export function canViewProductionBuildingOpening(
  facilityId?: number | null,
): boolean {
  return productionGuard.canAccessResource('building_opening', facilityId);
}

export function canManageProductionBuildingOpening(
  facilityId?: number | null,
): boolean {
  return productionGuard.canRunResourceAction(
    'building_opening',
    PermissionAction.Manage,
    facilityId,
  );
}

export function canApproveProductionBuildingOpening(
  facilityId?: number | null,
): boolean {
  return productionGuard.canRunResourceAction(
    'building_opening',
    PermissionAction.Approve,
    facilityId,
  );
}

export function canViewProductionConstruction(
  facilityId?: number | null,
): boolean {
  return productionGuard.canAccessResource('construction', facilityId);
}
