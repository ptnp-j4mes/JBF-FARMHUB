import { apiClient } from '@/lib/api/client';
import {
  buildAccessAssignmentsFromUser,
  type AccessAssignmentContext,
} from '@/lib/access-context';
import {
  normalizePermissionCode,
  normalizePermissionResource,
} from '@/lib/access/permission-code';
import type { UserInfoResponse } from '@/features/auth/types';

interface RoleResponseLite {
  id: number;
  name: string;
}

interface RolePermissionResponseLite {
  permissionCode: string;
}

interface PermissionResponseLite {
  id: number;
  code: string;
  module?: string;
  resource?: string | null;
  resourcePath?: string;
}

interface MenuTreeNodeResponseLite {
  id: number;
  code: string;
  labelTh: string;
  nodeType: string;
  children?: MenuTreeNodeResponseLite[];
}

interface AccessBootstrapResponse {
  rolePermissionMap: Record<string, string[]>;
  assignablePermissionCodes: string[];
  permissionResourceByCode: Record<string, string>;
  menuListLabelBySlug: Record<string, string>;
  menuGroupLabelByMenuListSlug: Record<string, string>;
}

interface AccessPermissionContext {
  rolePermissionMap: Record<string, string[]>;
  assignablePermissionCodes: string[];
  permissionResourceByCode: Record<string, string>;
  menuListLabelBySlug: Record<string, string>;
  menuGroupLabelByMenuListSlug: Record<string, string>;
}

type BootstrapCacheEntry = {
  signature: string;
  expiresAt: number;
  payload: AccessPermissionContext;
};

const ACCESS_BOOTSTRAP_CACHE_TTL_MS = 3 * 60 * 1000;
let accessBootstrapCache: BootstrapCacheEntry | null = null;

export const ACCESS_SCOPE_TYPE_LABEL: Record<AccessAssignmentContext['scopeType'], string> = {
  system: 'ระบบ',
  farm: 'ฟาร์ม',
  zone: 'โซน',
  house: 'โรงเรือน',
  pen: 'คอก',
};

function normalizeName(value: string): string {
  return value.trim().toLowerCase();
}

function normalizeMenuLookupKey(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[.\-\s]+/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_+|_+$/g, '');
}

function normalizePermissionPart(value: string | null | undefined): string {
  return (value ?? '').trim();
}

function buildPermissionResourcePath(permission: PermissionResponseLite): string {
  const explicitResourcePath = normalizePermissionPart(permission.resourcePath);
  if (explicitResourcePath) {
    return explicitResourcePath;
  }

  const module = normalizePermissionPart(permission.module);
  const resource = normalizePermissionPart(permission.resource);
  if (module) {
    return resource ? `${module}.${resource}` : module;
  }

  return resource;
}

function normalizePermissionCodeForScope(code: string): string | null {
  return normalizePermissionCode(code);
}

export function invalidateAccessBootstrapCache(): void {
  accessBootstrapCache = null;
}

function buildBootstrapSignature(user: UserInfoResponse): string {
  const roleSignature = (user.roles ?? []).map((role) => role.trim()).filter(Boolean).join('|');
  const permissionSignature = (user.permissions ?? []).map((permission) => permission.trim()).filter(Boolean).join('|');
  const scopeSignature = (user.scopes ?? []).map((scope) => String(scope)).join('|');
  const scopeNodeSignature = (user.scopeNodes ?? [])
    .map((node) => `${node.facilityNodeId}:${node.facilityType}:${node.facilityCode}`)
    .join('|');
  const farmNodeSignature = (user.accessibleFarmNodes ?? [])
    .map((node) => `${node.facilityNodeId}:${node.facilityType}:${node.facilityCode}`)
    .join('|');

  return [
    user.id,
    user.isSuperAdmin ? '1' : '0',
    roleSignature,
    permissionSignature,
    scopeSignature,
    scopeNodeSignature,
    farmNodeSignature,
  ].join('::');
}

function getCachedBootstrap(user: UserInfoResponse): AccessPermissionContext | null {
  if (!accessBootstrapCache) return null;
  if (Date.now() > accessBootstrapCache.expiresAt) {
    accessBootstrapCache = null;
    return null;
  }

  if (accessBootstrapCache.signature !== buildBootstrapSignature(user)) {
    return null;
  }

  return accessBootstrapCache.payload;
}

function setCachedBootstrap(user: UserInfoResponse, payload: AccessPermissionContext): void {
  accessBootstrapCache = {
    signature: buildBootstrapSignature(user),
    expiresAt: Date.now() + ACCESS_BOOTSTRAP_CACHE_TTL_MS,
    payload,
  };
}

function normalizeBootstrapContext(payload: AccessBootstrapResponse): AccessPermissionContext {
  const rolePermissionMap = Object.entries(payload.rolePermissionMap ?? {}).reduce<Record<string, string[]>>(
    (accumulator, [roleName, permissionCodes]) => {
      const normalizedRoleName = roleName.trim();
      if (!normalizedRoleName) {
        return accumulator;
      }

      accumulator[normalizedRoleName] = Array.from(
        new Set(
          (permissionCodes ?? [])
            .map((code) => normalizePermissionCodeForScope(code))
            .filter((code): code is string => Boolean(code)),
        ),
      ).sort((left, right) => left.localeCompare(right));
      return accumulator;
    },
    {},
  );

  const assignablePermissionCodes = Array.from(
    new Set(
      (payload.assignablePermissionCodes ?? [])
        .map((code) => normalizePermissionCodeForScope(code))
        .filter((code): code is string => Boolean(code)),
    ),
  ).sort((left, right) => left.localeCompare(right));

  const permissionResourceByCode = Object.entries(payload.permissionResourceByCode ?? {}).reduce<Record<string, string>>(
    (accumulator, [code, resource]) => {
      const normalizedCode = normalizePermissionCodeForScope(code);
      const normalizedResource = normalizeMenuLookupKey(resource);
      if (!normalizedCode || !normalizedResource) {
        return accumulator;
      }

      accumulator[normalizedCode] = normalizedResource;
      return accumulator;
    },
    {},
  );

  const menuListLabelBySlug = Object.entries(payload.menuListLabelBySlug ?? {}).reduce<Record<string, string>>(
    (accumulator, [slug, label]) => {
      const normalizedSlug = normalizeMenuLookupKey(slug);
      if (!normalizedSlug || !label?.trim()) {
        return accumulator;
      }

      accumulator[normalizedSlug] = label;
      return accumulator;
    },
    {},
  );

  const menuGroupLabelByMenuListSlug = Object.entries(
    payload.menuGroupLabelByMenuListSlug ?? {},
  ).reduce<Record<string, string>>((accumulator, [slug, label]) => {
    const normalizedSlug = normalizeMenuLookupKey(slug);
    if (!normalizedSlug || !label?.trim()) {
      return accumulator;
    }

    accumulator[normalizedSlug] = label;
    return accumulator;
  }, {});

  return {
    rolePermissionMap,
    assignablePermissionCodes,
    permissionResourceByCode,
    menuListLabelBySlug,
    menuGroupLabelByMenuListSlug,
  };
}

function scopeTypeOrder(scopeType: AccessAssignmentContext['scopeType']): number {
  switch (scopeType) {
    case 'system':
      return 0;
    case 'farm':
      return 1;
    case 'zone':
      return 2;
    case 'house':
      return 3;
    case 'pen':
      return 4;
    default:
      return 99;
  }
}

function sortAssignments(assignments: AccessAssignmentContext[]): AccessAssignmentContext[] {
  return [...assignments].sort((left, right) => {
    const roleCompare = left.roleName.localeCompare(right.roleName);
    if (roleCompare !== 0) return roleCompare;

    const scopeTypeCompare = scopeTypeOrder(left.scopeType) - scopeTypeOrder(right.scopeType);
    if (scopeTypeCompare !== 0) return scopeTypeCompare;

    return left.scopeLabel.localeCompare(right.scopeLabel);
  });
}

async function loadAccessPermissionContext(
  user: UserInfoResponse,
): Promise<AccessPermissionContext> {
  const cachedBootstrap = getCachedBootstrap(user);
  if (cachedBootstrap) {
    return cachedBootstrap;
  }

  try {
    const bootstrapResponse = await apiClient.get<AccessBootstrapResponse>(
      '/api/AuthModels/bootstrap',
      {
        params: { includeInactive: false },
      },
    );

    const nextContext = normalizeBootstrapContext(bootstrapResponse);
    setCachedBootstrap(user, nextContext);
    return nextContext;
  } catch {
    // Fall back to legacy multi-request loading if the bootstrap endpoint is unavailable.
  }

  const roleNames = Array.from(
    new Set((user.roles ?? []).map((roleName) => roleName.trim()).filter(Boolean)),
  );

  const [rolesResponse, permissionsResponse, menuTreeResponse] = await Promise.all([
    apiClient.get<RoleResponseLite[]>('/api/AuthModels/roles').catch(() => [] as RoleResponseLite[]),
    apiClient
      .get<PermissionResponseLite[]>('/api/AuthModels/permissions', {
        params: { includeInactive: false },
      })
      .catch(() => [] as PermissionResponseLite[]),
    apiClient
      .get<MenuTreeNodeResponseLite[]>('/api/MenuModels/tree', {
        params: { includeInactive: false },
      })
      .catch(() => [] as MenuTreeNodeResponseLite[]),
  ]);

  const roleIdByName = new Map<string, number>();
  rolesResponse.forEach((role) => {
    roleIdByName.set(normalizeName(role.name), role.id);
  });

  const rolePermissionEntries = await Promise.all(
    roleNames.map(async (roleName) => {
      const roleId = roleIdByName.get(normalizeName(roleName));
      if (!roleId) {
        return [roleName, []] as const;
      }

      try {
        const permissionResponse = await apiClient.get<RolePermissionResponseLite[]>(
          `/api/AuthModels/roles/${roleId}/permissions`,
        );
        return [
          roleName,
          permissionResponse
            .map((item) => normalizePermissionCodeForScope(item.permissionCode ?? ''))
            .filter((item): item is string => Boolean(item)),
        ] as const;
      } catch {
        return [roleName, []] as const;
      }
    }),
  );

  const rolePermissionMap: Record<string, string[]> = {};
  const assignablePermissionCodes = permissionsResponse
    .filter((permission) => permission.id > 0 && permission.code?.trim().length > 0)
    .map((permission) => normalizePermissionCodeForScope(permission.code ?? ''))
    .filter((permissionCode): permissionCode is string => Boolean(permissionCode));
  const assignableSet = new Set(assignablePermissionCodes);

  rolePermissionEntries.forEach(([roleName, permissionCodes]) => {
    const filtered = permissionCodes.filter((code) => assignableSet.has(code));
    if (filtered.length > 0) {
      rolePermissionMap[roleName] = filtered;
    }
    // Roles with zero filtered permissions are intentionally omitted so that
    // resolveRolePermissionSet() falls back to user.permissions instead.
  });

  const permissionResourceEntries = permissionsResponse
    .filter((permission) => permission.code?.trim())
      .map((permission) => [
      normalizePermissionCodeForScope(permission.code)?.trim(),
      normalizeMenuLookupKey(
        normalizePermissionResource(buildPermissionResourcePath(permission)),
      ),
    ] as const);

  const permissionResourceByCode = permissionResourceEntries.reduce<Record<string, string>>(
    (accumulator, [code, resource]) => {
      if (!code) {
        return accumulator;
      }
      accumulator[code] = resource;
      return accumulator;
    },
    {},
  );

  const normalizedPermissionResourceByCode = Object.fromEntries(
    permissionsResponse
      .filter((permission) => permission.code?.trim())
      .map((permission) => normalizePermissionCodeForScope(permission.code ?? ''))
      .filter((code): code is string => Boolean(code))
      .map((code) => [code, permissionResourceByCode[code] ?? ''] as const)
      .filter(([, resource]) => Boolean(resource)),
  );

  const flattenNodes = (nodes: MenuTreeNodeResponseLite[], parentLabel?: string): { code: string; label: string; groupLabel?: string }[] => {
    return nodes.flatMap(node => {
      const current = { code: node.code, label: node.labelTh, groupLabel: parentLabel };
      const children = node.children ? flattenNodes(node.children, parentLabel ?? (node.nodeType === 'Folder' ? node.labelTh : undefined)) : [];
      return [current, ...children];
    });
  };

  const allNodes = flattenNodes(menuTreeResponse);

  const menuListLabelBySlug = Object.fromEntries(
    allNodes.map((node) => [normalizeMenuLookupKey(node.code), node.label] as const),
  );

  const menuGroupLabelByMenuListSlug = Object.fromEntries(
    allNodes
      .filter(node => node.groupLabel)
      .map((node) => [normalizeMenuLookupKey(node.code), node.groupLabel!] as const),
  );

  const nextContext: AccessPermissionContext = {
    rolePermissionMap,
    assignablePermissionCodes,
    permissionResourceByCode: normalizedPermissionResourceByCode,
    menuListLabelBySlug,
    menuGroupLabelByMenuListSlug,
  };

  setCachedBootstrap(user, nextContext);
  return nextContext;
}

export async function loadAccessAssignmentsForUser(
  user: UserInfoResponse,
): Promise<AccessAssignmentContext[]> {
  const permissionContext = await loadAccessPermissionContext(user);
  return sortAssignments(buildAccessAssignmentsFromUser(user, permissionContext));
}
