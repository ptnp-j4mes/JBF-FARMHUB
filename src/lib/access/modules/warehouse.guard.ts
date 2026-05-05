import { PermissionAction } from '@/features/auth/types/enums';
import {
  createModuleGuard,
  findRouteConfigByPath,
  type ModuleRouteConfig,
} from './module-guard';

type WarehouseRouteKey =
  | 'materialStock'
  | 'stockReplenishment'
  | 'stockBooking'
  | 'stockIssueRequest'
  | 'stockAdjustmentRequest'
  | 'purchaseRequest';

type WarehouseResourceKey =
  | 'material_stock'
  | 'stock_replenishment'
  | 'stock_booking'
  | 'stock_issue_request'
  | 'stock_adjustment_request'
  | 'purchase_request';

type WarehouseRouteConfig = ModuleRouteConfig<WarehouseResourceKey> & {
  key: WarehouseRouteKey;
};

const WAREHOUSE_MODULE = 'warehouse' as const;
const warehouseGuard = createModuleGuard<WarehouseResourceKey>(WAREHOUSE_MODULE);
const STOCK_ADJUSTMENT_COMPAT_RESOURCE = 'material_stock' as const;

const WAREHOUSE_ROUTE_CONFIGS = [
  {
    key: 'materialStock',
    resource: 'material_stock',
    routePrefixes: ['/warehouse/material-stock'],
  },
  {
    key: 'stockReplenishment',
    resource: 'stock_replenishment',
    routePrefixes: ['/warehouse/stock-replenishment'],
  },
  {
    key: 'stockBooking',
    resource: 'stock_booking',
    routePrefixes: ['/warehouse/stock-booking'],
  },
  {
    key: 'stockIssueRequest',
    resource: 'stock_issue_request',
    routePrefixes: ['/warehouse/stock-issue-request'],
  },
  {
    key: 'stockAdjustmentRequest',
    resource: 'stock_adjustment_request',
    routePrefixes: ['/warehouse/stock-adjustment-request'],
  },
  {
    key: 'purchaseRequest',
    resource: 'purchase_request',
    routePrefixes: ['/warehouse/purchase-request'],
  },
] as const satisfies readonly WarehouseRouteConfig[];

function findWarehouseRouteConfig(routePath: string): WarehouseRouteConfig | null {
  return findRouteConfigByPath(WAREHOUSE_ROUTE_CONFIGS, routePath);
}

export async function canAccessWarehouseRoute(
  routePath: string,
  facilityId?: number | null,
): Promise<boolean> {
  const matchedConfig = findWarehouseRouteConfig(routePath);
  if (!matchedConfig) {
    return true;
  }

  await warehouseGuard.warmCatalog();
  if (matchedConfig.resource === 'stock_adjustment_request') {
    return (
      warehouseGuard.canAccessResource('stock_adjustment_request', facilityId) ||
      warehouseGuard.canAccessResource(STOCK_ADJUSTMENT_COMPAT_RESOURCE, facilityId)
    );
  }

  return warehouseGuard.canAccessResource(matchedConfig.resource, facilityId);
}

export function canViewWarehouseMaterialStock(
  facilityId?: number | null,
): boolean {
  return warehouseGuard.canAccessResource('material_stock', facilityId);
}

export function canViewWarehouseStockReplenishment(
  facilityId?: number | null,
): boolean {
  return warehouseGuard.canAccessResource('stock_replenishment', facilityId);
}

export function canManageWarehouseStockReplenishment(
  facilityId?: number | null,
): boolean {
  return warehouseGuard.canRunResourceAction(
    'stock_replenishment',
    PermissionAction.Manage,
    facilityId,
  );
}

export function canManageWarehouseMaterialStock(
  facilityId?: number | null,
): boolean {
  return warehouseGuard.canRunResourceAction(
    'material_stock',
    PermissionAction.Manage,
    facilityId,
  );
}

export function canApproveWarehouseMaterialStock(
  facilityId?: number | null,
): boolean {
  return warehouseGuard.canRunResourceAction(
    'material_stock',
    PermissionAction.Approve,
    facilityId,
  );
}

export function canViewWarehouseIssueRequests(facilityId?: number | null): boolean {
  return warehouseGuard.canAccessResource('stock_issue_request', facilityId);
}

export function canViewWarehouseStockBookings(facilityId?: number | null): boolean {
  return warehouseGuard.canAccessResource('stock_booking', facilityId);
}

export function canManageWarehouseStockBookings(
  facilityId?: number | null,
): boolean {
  return warehouseGuard.canRunResourceAction(
    'stock_booking',
    PermissionAction.Manage,
    facilityId,
  );
}

export function canApproveWarehouseStockBookings(
  facilityId?: number | null,
): boolean {
  return warehouseGuard.canRunResourceAction(
    'stock_booking',
    PermissionAction.Approve,
    facilityId,
  );
}

export function canManageWarehouseIssueRequests(
  facilityId?: number | null,
): boolean {
  return warehouseGuard.canRunResourceAction(
    'stock_issue_request',
    PermissionAction.Manage,
    facilityId,
  );
}

export function canApproveWarehouseIssueRequests(
  facilityId?: number | null,
): boolean {
  return warehouseGuard.canRunResourceAction(
    'stock_issue_request',
    PermissionAction.Approve,
    facilityId,
  );
}

export function canViewWarehouseAdjustmentRequests(
  facilityId?: number | null,
): boolean {
  return (
    warehouseGuard.canAccessResource('stock_adjustment_request', facilityId) ||
    warehouseGuard.canAccessResource(STOCK_ADJUSTMENT_COMPAT_RESOURCE, facilityId)
  );
}

export function canManageWarehouseAdjustmentRequests(
  facilityId?: number | null,
): boolean {
  return (
    warehouseGuard.canRunResourceAction(
      'stock_adjustment_request',
      PermissionAction.Manage,
      facilityId,
    ) ||
    warehouseGuard.canRunResourceAction(
      STOCK_ADJUSTMENT_COMPAT_RESOURCE,
      PermissionAction.Manage,
      facilityId,
    )
  );
}

export function canApproveWarehouseAdjustmentRequests(
  facilityId?: number | null,
): boolean {
  return (
    warehouseGuard.canRunResourceAction(
      'stock_adjustment_request',
      PermissionAction.Approve,
      facilityId,
    ) ||
    warehouseGuard.canRunResourceAction(
      STOCK_ADJUSTMENT_COMPAT_RESOURCE,
      PermissionAction.Approve,
      facilityId,
    )
  );
}

export function canViewWarehousePurchaseRequests(
  facilityId?: number | null,
): boolean {
  return warehouseGuard.canAccessResource('purchase_request', facilityId);
}

export function canManageWarehousePurchaseRequests(
  facilityId?: number | null,
): boolean {
  return warehouseGuard.canRunResourceAction(
    'purchase_request',
    PermissionAction.Manage,
    facilityId,
  );
}

export function canCreateWarehousePurchaseRequests(
  facilityId?: number | null,
): boolean {
  return warehouseGuard.canRunResourceAction(
    'purchase_request',
    PermissionAction.Add,
    facilityId,
  );
}

export function canEditWarehousePurchaseRequests(
  facilityId?: number | null,
): boolean {
  return warehouseGuard.canRunResourceAction(
    'purchase_request',
    PermissionAction.Edit,
    facilityId,
  );
}

export function canSubmitWarehousePurchaseRequests(
  facilityId?: number | null,
): boolean {
  return warehouseGuard.canRunResourceAction(
    'purchase_request',
    PermissionAction.Submit,
    facilityId,
  );
}

export function canApproveWarehousePurchaseRequests(
  facilityId?: number | null,
): boolean {
  return warehouseGuard.canRunResourceAction(
    'purchase_request',
    PermissionAction.Approve,
    facilityId,
  );
}

export function canRejectWarehousePurchaseRequests(
  facilityId?: number | null,
): boolean {
  return warehouseGuard.canRunResourceAction(
    'purchase_request',
    PermissionAction.Reject,
    facilityId,
  );
}

export function canRenderWarehouseUi(
  routeKey: WarehouseRouteKey,
  facilityId?: number | null,
): boolean {
  const matchedConfig = WAREHOUSE_ROUTE_CONFIGS.find(
    (config) => config.key === routeKey,
  );
  if (!matchedConfig) {
    return true;
  }

  return warehouseGuard.canRenderResource(matchedConfig.resource, facilityId);
}
