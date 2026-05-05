import { apiClient } from '@/lib/api/client';
import {
  normalizePermissionCode,
  normalizePermissionPart,
} from '@/lib/access/permission-code';

export interface PermissionCatalogRow {
  id: number;
  module?: string | null;
  resource?: string | null;
  resourcePath?: string | null;
  action?: string | null;
  code?: string | null;
  isActive?: boolean;
}

export interface PermissionCatalogGroup {
  module: string;
  moduleResource: string;
  resource: string | null;
  actions: string[];
  codes: string[];
  codesByAction: Record<string, string>;
  rows: PermissionCatalogRow[];
}

export interface PermissionCatalog {
  rows: PermissionCatalogRow[];
  groupsByModule: Record<string, Record<string, PermissionCatalogGroup>>;
  groupsByModuleResource: Record<string, PermissionCatalogGroup>;
}

let permissionCatalogSnapshot: PermissionCatalog | null = null;
let permissionCatalogPromise: Promise<PermissionCatalog | null> | null = null;

export function buildModuleResource(
  module: string,
  resource: string | null | undefined,
): string {
  const normalizedModule = normalizePermissionPart(module).trim().toLowerCase();
  const normalizedResource = normalizePermissionPart(resource).trim().toLowerCase();
  return normalizedResource
    ? `${normalizedModule}.${normalizedResource}`
    : normalizedModule;
}

export function buildPermissionCode(
  moduleResource: string,
  action: string,
): string {
  return `${normalizePermissionPart(moduleResource).trim().toLowerCase()}.${normalizePermissionPart(action)
    .trim()
    .toLowerCase()}`;
}

function normalizeLookupKey(value: string | null | undefined): string {
  return normalizePermissionPart(value).trim().toLowerCase();
}

function buildPermissionCatalog(
  rows: PermissionCatalogRow[],
): PermissionCatalog {
  const groupsByModule: Record<string, Record<string, PermissionCatalogGroup>> = {};
  const groupsByModuleResource: Record<string, PermissionCatalogGroup> = {};
  const normalizedRows: PermissionCatalogRow[] = [];

  rows.forEach((row) => {
    const module = normalizeLookupKey(row.module);
    if (!module) {
      return;
    }

    const action = normalizeLookupKey(row.action);
    if (!action) {
      return;
    }

    const resourcePath = normalizeLookupKey(row.resourcePath);
    const resourceFromRow = normalizeLookupKey(row.resource);
    const resource =
      resourceFromRow ||
      (resourcePath.startsWith(`${module}.`)
        ? resourcePath.slice(module.length + 1)
        : '');
    const moduleResource = resourcePath || buildModuleResource(module, resource || null);
    const code = normalizePermissionCode(row.code) ?? buildPermissionCode(moduleResource, action);

    const normalizedRow: PermissionCatalogRow = {
      ...row,
      module,
      resource: resource || null,
      resourcePath: moduleResource,
      action: action || null,
      code,
      isActive: row.isActive === true,
    };
    normalizedRows.push(normalizedRow);

    const moduleGroups = groupsByModule[module] ?? {};
    groupsByModule[module] = moduleGroups;

    const group = moduleGroups[moduleResource] ?? {
      module,
      moduleResource,
      resource: resource || null,
      actions: [],
      codes: [],
      codesByAction: {},
      rows: [],
    };

    if (!moduleGroups[moduleResource]) {
      moduleGroups[moduleResource] = group;
      groupsByModuleResource[moduleResource] = group;
    }

    group.rows.push(normalizedRow);

    if (action && !group.actions.includes(action)) {
      group.actions.push(action);
    }

    if (code && !group.codes.includes(code)) {
      group.codes.push(code);
    }

    if (action && code) {
      group.codesByAction[action] = code;
    }
  });

  Object.values(groupsByModule).forEach((moduleGroups) => {
    Object.values(moduleGroups).forEach((group) => {
      group.actions.sort((left, right) => left.localeCompare(right));
      group.codes.sort((left, right) => left.localeCompare(right));
      group.rows.sort((left, right) => {
        const actionCompare = (left.action ?? '').localeCompare(right.action ?? '');
        if (actionCompare !== 0) {
          return actionCompare;
        }
        return (left.code ?? '').localeCompare(right.code ?? '');
      });
    });
  });

  return {
    rows: normalizedRows,
    groupsByModule,
    groupsByModuleResource,
  };
}

async function fetchPermissionCatalogOnce(): Promise<PermissionCatalog | null> {
  if (permissionCatalogPromise) {
    return permissionCatalogPromise;
  }

  permissionCatalogPromise = apiClient
    .get<PermissionCatalogRow[]>('/api/AuthModels/permissions', {
      params: { includeInactive: false },
    })
    .then((response) => {
      const catalog = buildPermissionCatalog(response ?? []);
      permissionCatalogSnapshot = catalog;
      return catalog;
    })
    .catch(() => null)
    .finally(() => {
      permissionCatalogPromise = null;
    });

  return permissionCatalogPromise;
}

export async function loadPermissionCatalog(
  forceRefresh = false,
): Promise<PermissionCatalog | null> {
  if (forceRefresh) {
    permissionCatalogSnapshot = null;
    permissionCatalogPromise = null;
  }

  if (permissionCatalogSnapshot) {
    return permissionCatalogSnapshot;
  }

  return fetchPermissionCatalogOnce();
}

export function getPermissionCatalogSnapshot(): PermissionCatalog | null {
  return permissionCatalogSnapshot;
}

export function findPermissionGroup(
  catalog: PermissionCatalog | null,
  module: string,
  resource?: string | null,
): PermissionCatalogGroup | null {
  if (!catalog) {
    return null;
  }

  const moduleKey = normalizeLookupKey(module);
  if (!moduleKey) {
    return null;
  }

  const moduleResource = buildModuleResource(moduleKey, resource ?? null);
  return catalog.groupsByModule[moduleKey]?.[moduleResource] ?? null;
}

export function getPermissionCodesForModuleResource(
  catalog: PermissionCatalog | null,
  module: string,
  resource?: string | null,
): string[] {
  return findPermissionGroup(catalog, module, resource)?.codes ?? [];
}
