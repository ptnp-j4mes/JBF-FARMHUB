import type { UserInfoResponse, UserScopeNodeResponse } from '@/features/auth/types';
import type { UserPermissionScopeResponse } from '@/features/auth/types/responses';
import {
  CURRENT_ACCESS_CONTEXT_COOKIE_KEY,
  CURRENT_ACCESS_CONTEXT_STORAGE_KEY,
  CURRENT_ACCESS_CONTEXT_STORAGE_VERSION,
  CURRENT_ACCESS_CONTEXT_STORAGE_VERSION_KEY,
} from '@/lib/access/storage';
import {
  normalizePermissionCode as normalizeCanonicalPermissionCode,
  normalizePermissionResource,
} from '@/lib/access/permission-code';

export type AccessScopeType = 'system' | 'farm' | 'zone' | 'house' | 'pen';

export interface AccessAssignmentContext {
  assignmentId: string;
  roleName: string;
  roleCode: string;
  scopeType: AccessScopeType;
  scopeNodeId: number | null;
  scopeLabel: string;
  scopeCode: string | null;
  permissionCodes: string[];
  permissionCount: number;
}

export const ACCESS_CONTEXT_CHANGED_EVENT = 'jbfarmhub:access-context-changed';

const EMPTY_SCOPE_LABEL = '-';
const UNASSIGNED_ROLE_LABEL = 'Unassigned';

type RolePermissionMap = Record<string, string[]>;
type AccessAssignmentBuildOptions = {
  rolePermissionMap?: RolePermissionMap;
  assignablePermissionCodes?: string[];
  permissionResourceByCode?: Record<string, string>;
  menuListLabelBySlug?: Record<string, string>;
  menuGroupLabelByMenuListSlug?: Record<string, string>;
};

function isBrowser(): boolean {
  return typeof window !== 'undefined';
}

function syncCurrentAccessCookie(assignmentId: string | null): void {
  if (!isBrowser()) return;

  if (!assignmentId) {
    window.document.cookie = `${CURRENT_ACCESS_CONTEXT_COOKIE_KEY}=; Path=/; Max-Age=0; SameSite=Lax`;
    return;
  }

  window.document.cookie = `${CURRENT_ACCESS_CONTEXT_COOKIE_KEY}=${encodeURIComponent(
    assignmentId,
  )}; Path=/; SameSite=Lax`;
}

function normalizePermissionCode(permission: string): string | null {
  return normalizeCanonicalPermissionCode(permission);
}

function normalizeRoleCode(roleName: string): string {
  return roleName
    .trim()
    .toUpperCase()
    .replace(/\s+/g, '_')
    .replace(/[^A-Z0-9_]/g, '');
}

function normalizeMenuLookupKey(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[.\-\s]+/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_+|_+$/g, '');
}

// Resource mapping helper tokens to discover menu entries.
const RESOURCE_MENU_ALIAS_TOKENS: Record<string, string[]> = {
  item: ['items', 'item'],
  items: ['items', 'item'],
  purchase: ['purchase_request', 'purchase'],
  purchasing: ['purchase_request', 'purchase'],
  warehouse: ['material_stock', 'warehouse', 'stock'],
};

function mapScopeType(
  rawScopeType: string | null | undefined,
): AccessScopeType {
  const normalized = rawScopeType?.trim().toLowerCase();
  if (normalized === 'farm') return 'farm';
  if (normalized === 'zone') return 'zone';
  if (normalized === 'house') return 'house';
  if (normalized === 'pen') return 'pen';
  return 'system';
}

function normalizeFarmScopeNodes(
  nodes: UserInfoResponse['scopeNodes'] | UserInfoResponse['accessibleFarmNodes'],
): Array<{
  scopeNodeId: number;
  scopeType: AccessScopeType;
  scopeLabel: string;
  scopeCode: string | null;
}> {
  return (nodes ?? [])
    .filter((scopeNode) => scopeNode && Number(scopeNode.facilityNodeId) > 0)
    .filter((scopeNode) => (scopeNode.facilityType || '').trim().toLowerCase() === 'farm')
    .map((scopeNode) => ({
      scopeNodeId: scopeNode.facilityNodeId,
      scopeType: 'farm' as AccessScopeType,
      scopeLabel:
        scopeNode.facilityName?.trim() ||
        scopeNode.facilityCode ||
        EMPTY_SCOPE_LABEL,
      scopeCode: scopeNode.facilityCode?.trim() || null,
    }));
}

function buildFarmScopeNodesFromUser(user: UserInfoResponse): Array<{
  scopeNodeId: number;
  scopeType: AccessScopeType;
  scopeLabel: string;
  scopeCode: string | null;
}> {
  const accessibleFarmNodes = normalizeFarmScopeNodes(user.accessibleFarmNodes);
  if (accessibleFarmNodes.length > 0) {
    const unique = new Map<number, (typeof accessibleFarmNodes)[number]>();
    accessibleFarmNodes.forEach((node) => {
      if (!unique.has(node.scopeNodeId)) {
        unique.set(node.scopeNodeId, node);
      }
    });
    return Array.from(unique.values()).sort((left, right) =>
      `${left.scopeCode ?? ''} ${left.scopeLabel}`.localeCompare(
        `${right.scopeCode ?? ''} ${right.scopeLabel}`,
      ),
    );
  }

  const scopeNodes = normalizeFarmScopeNodes(user.scopeNodes);
  if (scopeNodes.length > 0) {
    const unique = new Map<number, (typeof scopeNodes)[number]>();
    scopeNodes.forEach((node) => {
      if (!unique.has(node.scopeNodeId)) {
        unique.set(node.scopeNodeId, node);
      }
    });
    return Array.from(unique.values()).sort((left, right) =>
      `${left.scopeCode ?? ''} ${left.scopeLabel}`.localeCompare(
        `${right.scopeCode ?? ''} ${right.scopeLabel}`,
      ),
    );
  }

  return Array.from(
    new Set(
      (user.scopes ?? [])
        .map((scopeId) => Number(scopeId))
        .filter((scopeId) => Number.isFinite(scopeId) && scopeId > 0),
    ),
  ).map((scopeId) => ({
    scopeNodeId: scopeId,
    scopeType: 'farm' as AccessScopeType,
    scopeLabel: `FARM-${scopeId}`,
    scopeCode: `FARM-${scopeId}`,
  }));
}

function collectAccessibleScopeIds(user: UserInfoResponse): Set<number> {
  const scopeIds = new Set<number>();

  buildFarmScopeNodesFromUser(user).forEach((scopeNode) => {
    if (scopeNode.scopeNodeId > 0) {
      scopeIds.add(scopeNode.scopeNodeId);
    }
  });

  return scopeIds;
}

function normalizeScopeType(rawScopeType: unknown): AccessScopeType {
  const normalized =
    typeof rawScopeType === 'string' ? rawScopeType.trim().toLowerCase() : '';
  if (normalized === 'farm') return 'farm';
  if (normalized === 'zone') return 'zone';
  if (normalized === 'house') return 'house';
  if (normalized === 'pen') return 'pen';
  return 'system';
}

function normalizePermissionList(values: string[]): string[] {
  return Array.from(
    new Set(
      values
        .map((value) => normalizePermissionCodeForScope(value))
        .filter((value): value is string => Boolean(value)),
    ),
  ).sort((left, right) => left.localeCompare(right));
}

function resolveCanonicalModuleSlug(
  moduleSlug: string,
  _menuListLabelBySlug: Record<string, string>,
): string {
  return normalizeMenuLookupKey(moduleSlug);
}

function normalizePermissionCodeForScope(code: string): string | null {
  const normalized = normalizePermissionCode(code);
  if (!normalized) {
    return null;
  }

  const segments = normalized
    .split('.')
    .map((segment) => segment.trim())
    .filter(Boolean);
  if (segments.length < 2) {
    return null;
  }

  return normalized;
}

function resolveMenuSlugByResource(
  normalizedLookupKey: string,
  menuListLabelBySlug: Record<string, string>,
): string | null {
  if (!normalizedLookupKey) {
    return null;
  }

  if (menuListLabelBySlug[normalizedLookupKey]) {
    return resolveCanonicalModuleSlug(normalizedLookupKey, menuListLabelBySlug);
  }

  const baseToken = normalizedLookupKey.replace(/s$/, '');
  const lookupTokens = Array.from(
    new Set([
      normalizedLookupKey,
      baseToken,
      ...(RESOURCE_MENU_ALIAS_TOKENS[normalizedLookupKey] ?? []),
      ...(RESOURCE_MENU_ALIAS_TOKENS[baseToken] ?? []),
    ]),
  ).filter(Boolean);

  const menuEntries = Object.entries(menuListLabelBySlug);

  for (const token of lookupTokens) {
    const exact = menuEntries.find(([slug]) => slug === token);
    if (exact) {
      return resolveCanonicalModuleSlug(exact[0], menuListLabelBySlug);
    }
  }

  for (const token of lookupTokens) {
    const suffix = menuEntries.find(([slug]) => slug.endsWith(`_${token}`));
    if (suffix) {
      return resolveCanonicalModuleSlug(suffix[0], menuListLabelBySlug);
    }
  }

  for (const token of lookupTokens) {
    const contains = menuEntries.find(
      ([slug]) => slug.includes(`_${token}_`) || slug.includes(token),
    );
    if (contains) {
      return resolveCanonicalModuleSlug(contains[0], menuListLabelBySlug);
    }
  }

  return null;
}

function applyOverrides(
  basePermissions: string[],
  permissionScopes: UserPermissionScopeResponse[],
  scopeNodeId: number | null,
): string[] {
  const granted = new Set(
    basePermissions
      .map((permission) => normalizePermissionCodeForScope(permission))
      .filter((permission): permission is string => Boolean(permission)),
  );

  const applySingleOverride = (overrideItem: UserPermissionScopeResponse) => {
    const permissionCode = normalizePermissionCodeForScope(
      overrideItem.permissionCode,
    );
    const effect = overrideItem.effect?.trim().toLowerCase();
    if (!permissionCode || (effect !== 'allow' && effect !== 'deny')) {
      return;
    }

    if (effect === 'deny') {
      granted.delete(permissionCode);
      return;
    }

    granted.add(permissionCode);
  };

  permissionScopes.forEach((overrideItem) => {
    if (overrideItem.facilityNodeId === null) {
      applySingleOverride(overrideItem);
    }
  });

  if (scopeNodeId) {
    permissionScopes.forEach((overrideItem) => {
      if (overrideItem.facilityNodeId === scopeNodeId) {
        applySingleOverride(overrideItem);
      }
    });
  }

  return Array.from(granted.values()).sort((left, right) =>
    left.localeCompare(right),
  );
}

function collectScopedOverrideCodes(
  permissionScopes: UserPermissionScopeResponse[],
  scopeNodeId: number | null,
  effect: 'allow' | 'deny',
): string[] {
  return normalizePermissionList(
    permissionScopes
      .filter((item) => item.effect?.trim().toLowerCase() === effect)
      .filter(
        (item) =>
          item.facilityNodeId === null ||
          (typeof scopeNodeId === 'number' &&
            scopeNodeId > 0 &&
            item.facilityNodeId === scopeNodeId),
      )
      .map((item) => normalizePermissionCodeForScope(item.permissionCode))
      .filter((item): item is string => Boolean(item)),
  );
}

function toEffectiveMenuPermissionSlotCount(
  effectivePermissionCodes: string[],
  options: AccessAssignmentBuildOptions,
): number {
  const menuListLabelBySlug = options.menuListLabelBySlug ?? {};
  const menuGroupLabelByMenuListSlug =
    options.menuGroupLabelByMenuListSlug ?? {};
  const permissionResourceByCode = options.permissionResourceByCode ?? {};
  const effectiveSet = new Set<string>(
    effectivePermissionCodes
      .map((item) => normalizePermissionCodeForScope(item))
      .filter((item): item is string => Boolean(item)),
  );
  if (effectiveSet.size === 0) {
    return 0;
  }

  const slotSet = new Set<string>();

  effectiveSet.forEach((code) => {
    const parts = code.split('.').filter(Boolean);
    if (parts.length < 2) {
      return;
    }
    const action = parts[parts.length - 1];

    const fallbackResource = parts.slice(0, -1).join('.');
    const mappedResource =
      permissionResourceByCode[code] ||
      permissionResourceByCode[code.trim()] ||
      fallbackResource;
    const normalizedLookupKey = normalizeMenuLookupKey(mappedResource);
    const resolvedMenuSlug = resolveMenuSlugByResource(
      normalizedLookupKey,
      menuListLabelBySlug,
    );
    if (!resolvedMenuSlug) {
      return;
    }
    if (!menuGroupLabelByMenuListSlug[resolvedMenuSlug]) {
      return;
    }

    slotSet.add(`${resolvedMenuSlug}::${action}`);
  });

  return slotSet.size;
}

function resolveScopePermissionCount(
  roleBasePermissions: string[],
  permissionScopes: UserPermissionScopeResponse[],
  scopeNodeId: number | null,
  fallbackEffectivePermissionCodes: string[],
  options: AccessAssignmentBuildOptions,
): number {
  const fallbackCount = normalizePermissionList(
    fallbackEffectivePermissionCodes,
  ).length;
  const menuListLabelBySlug = options.menuListLabelBySlug ?? {};
  const menuGroupLabelByMenuListSlug =
    options.menuGroupLabelByMenuListSlug ?? {};
  const hasMenuContext =
    Object.keys(menuListLabelBySlug).length > 0 &&
    Object.keys(menuGroupLabelByMenuListSlug).length > 0;
  if (!hasMenuContext) {
    return fallbackCount;
  }

  const assignableSet = new Set<string>(
    (options.assignablePermissionCodes ?? [])
      .map((item) => normalizePermissionCodeForScope(item))
      .filter((item): item is string => Boolean(item)),
  );

  const rolePermissions = normalizePermissionList(
    roleBasePermissions
      .map((item) => normalizePermissionCodeForScope(item))
      .filter((item): item is string => Boolean(item))
      .filter((item) =>
        assignableSet.size > 0 ? assignableSet.has(item) : true,
      ),
  );
  const rolePermissionSet = new Set<string>(rolePermissions);
  const allowCodes = collectScopedOverrideCodes(
    permissionScopes,
    scopeNodeId,
    'allow',
  )
    .filter((item) => (assignableSet.size > 0 ? assignableSet.has(item) : true))
    .filter((item) => !rolePermissionSet.has(item));
  const denyCodes = collectScopedOverrideCodes(
    permissionScopes,
    scopeNodeId,
    'deny',
  )
    .filter((item) => (assignableSet.size > 0 ? assignableSet.has(item) : true))
    .filter((item) => rolePermissionSet.has(item));

  const effectiveSet = new Set<string>(rolePermissions);
  denyCodes.forEach((item) => {
    effectiveSet.delete(item);
  });
  allowCodes.forEach((item) => {
    effectiveSet.add(item);
  });

  return effectiveSet.size;
}

function resolveRolePermissionSet(
  roleName: string,
  user: UserInfoResponse | null,
  rolePermissionMap?: RolePermissionMap,
): string[] {
  if (!rolePermissionMap) {
    return normalizePermissionList(user?.permissions ?? []);
  }

  const lookup = Object.entries(rolePermissionMap).find(
    ([name]) => name.trim().toLowerCase() === roleName.trim().toLowerCase(),
  );
  if (!lookup) {
    return normalizePermissionList(user?.permissions ?? []);
  }

  return normalizePermissionList(lookup[1]);
}

function dedupeAssignments(
  assignments: AccessAssignmentContext[],
): AccessAssignmentContext[] {
  const unique = new Map<string, AccessAssignmentContext>();
  assignments.forEach((item) => {
    if (!unique.has(item.assignmentId)) {
      unique.set(item.assignmentId, item);
    }
  });
  return Array.from(unique.values());
}

export function buildAccessAssignmentsFromUser(
  user: UserInfoResponse | null,
  options: AccessAssignmentBuildOptions = {},
): AccessAssignmentContext[] {
  if (!user) return [];

  const roleNames = user.roles.length ? user.roles : [UNASSIGNED_ROLE_LABEL];
  const scopeNodes = buildFarmScopeNodesFromUser(user);

  const normalizedOverrides = user.permissionScopes ?? [];
  const scopedNodes = scopeNodes.length
    ? scopeNodes
    : [
        {
          scopeNodeId: null,
          scopeType: 'system' as AccessScopeType,
          scopeLabel: user.companyName?.trim() || EMPTY_SCOPE_LABEL,
          scopeCode: null,
        },
      ];

  const assignments = roleNames.flatMap((roleName) => {
    const roleCode = normalizeRoleCode(roleName);
    const roleBasePermissions = resolveRolePermissionSet(
      roleName,
      user,
      options.rolePermissionMap,
    );

    return scopedNodes.map((scopeNode) => {
      const permissionCodes = applyOverrides(
        roleBasePermissions,
        normalizedOverrides,
        scopeNode.scopeNodeId,
      );
      const permissionCount = resolveScopePermissionCount(
        roleBasePermissions,
        normalizedOverrides,
        scopeNode.scopeNodeId,
        permissionCodes,
        options,
      );

      const scopeIdText =
        typeof scopeNode.scopeNodeId === 'number' && scopeNode.scopeNodeId > 0
          ? String(scopeNode.scopeNodeId)
          : 'system';

      return {
        assignmentId: `${roleCode}:${scopeIdText}`,
        roleName,
        roleCode,
        scopeType: scopeNode.scopeType,
        scopeNodeId: scopeNode.scopeNodeId,
        scopeLabel: scopeNode.scopeLabel,
        scopeCode: scopeNode.scopeCode,
        permissionCodes,
        permissionCount,
      } satisfies AccessAssignmentContext;
    });
  });

  // Hierarchy-aware deduplication: If a user has a higher-level assignment (e.g., Farm)
  // for a given role, we remove lower-level assignments (e.g., Zone, House) that
  // are children of that farm for the same role.
  const filteredAssignments = assignments.filter((assignment) => {
    // If it's a system-level assignment, it's never redundant (unless there's another system one, which is deduped later)
    if (!assignment.scopeNodeId) return true;

    const hasHigherLevelCover = assignments.some((other) => {
      // Must be same role
      if (other.roleCode !== assignment.roleCode) return false;
      // Must be different assignment
      if (other.assignmentId === assignment.assignmentId) return false;
      // Other must be higher level (null is system, which is highest)
      if (other.scopeNodeId === null) return true;

      // Hierarchy-aware check using paths:
      const currentScopeNode = user.scopeNodes?.find(n => n.facilityNodeId === assignment.scopeNodeId);
      const otherScopeNode = user.scopeNodes?.find(n => n.facilityNodeId === other.scopeNodeId);

      if (currentScopeNode && otherScopeNode && currentScopeNode.path && otherScopeNode.path) {
        return currentScopeNode.path.startsWith(otherScopeNode.path) && currentScopeNode.depth > otherScopeNode.depth;
      }

      // Fallback to recursive check if paths are missing
      return isWithinScope(assignment.scopeNodeId!, other.scopeNodeId, user.scopeNodes ?? []);
    });

    return !hasHigherLevelCover;
  });

  return dedupeAssignments(filteredAssignments);
}

export function isWithinScope(
  targetId: number,
  scopeId: number | null,
  scopeNodes: UserScopeNodeResponse[],
): boolean {
  if (scopeId === null) return true; // System scope covers everything
  if (targetId === scopeId) return true;

  const targetNode = scopeNodes.find((n) => n.facilityNodeId === targetId);
  const scopeNode = scopeNodes.find((n) => n.facilityNodeId === scopeId);

  // If we have path info, use prefix matching for performance
  if (targetNode?.path && scopeNode?.path) {
    return targetNode.path.startsWith(scopeNode.path);
  }

  // Fallback to recursive parent check if path info is missing
  const node = scopeNodes.find((n) => n.facilityNodeId === targetId);
  if (!node || !node.parentId) return false;

  return isWithinScope(node.parentId, scopeId, scopeNodes);
}

export function readCurrentAccessContext(): AccessAssignmentContext | null {
  if (!isBrowser()) return null;

  const storageVersion = window.localStorage.getItem(
    CURRENT_ACCESS_CONTEXT_STORAGE_VERSION_KEY,
  );
  if (storageVersion !== CURRENT_ACCESS_CONTEXT_STORAGE_VERSION) {
    // One-time cache bust for legacy context payloads before zone rename.
    window.localStorage.removeItem(CURRENT_ACCESS_CONTEXT_STORAGE_KEY);
    window.localStorage.setItem(
      CURRENT_ACCESS_CONTEXT_STORAGE_VERSION_KEY,
      CURRENT_ACCESS_CONTEXT_STORAGE_VERSION,
    );
    return null;
  }

  const raw = window.localStorage.getItem(CURRENT_ACCESS_CONTEXT_STORAGE_KEY);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as Partial<AccessAssignmentContext>;
    if (!parsed || typeof parsed !== 'object') return null;
    if (!parsed.assignmentId || typeof parsed.assignmentId !== 'string')
      return null;
    if (!parsed.roleName || typeof parsed.roleName !== 'string') return null;

    return {
      assignmentId: parsed.assignmentId,
      roleName: parsed.roleName,
      roleCode:
        typeof parsed.roleCode === 'string'
          ? parsed.roleCode
          : normalizeRoleCode(parsed.roleName),
      scopeType: normalizeScopeType(parsed.scopeType),
      scopeNodeId:
        typeof parsed.scopeNodeId === 'number' &&
        Number.isFinite(parsed.scopeNodeId)
          ? parsed.scopeNodeId
          : null,
      scopeLabel:
        typeof parsed.scopeLabel === 'string'
          ? parsed.scopeLabel
          : EMPTY_SCOPE_LABEL,
      scopeCode: typeof parsed.scopeCode === 'string' ? parsed.scopeCode : null,
      permissionCodes: normalizePermissionList(parsed.permissionCodes ?? []),
      permissionCount:
        typeof parsed.permissionCount === 'number' &&
        Number.isFinite(parsed.permissionCount)
          ? parsed.permissionCount
          : normalizePermissionList(parsed.permissionCodes ?? []).length,
    };
  } catch {
    return null;
  }
}

export function setCurrentAccessContext(
  accessContext: AccessAssignmentContext | null,
): void {
  if (!isBrowser()) return;
  window.localStorage.setItem(
    CURRENT_ACCESS_CONTEXT_STORAGE_VERSION_KEY,
    CURRENT_ACCESS_CONTEXT_STORAGE_VERSION,
  );

  if (!accessContext) {
    window.localStorage.removeItem(CURRENT_ACCESS_CONTEXT_STORAGE_KEY);
    syncCurrentAccessCookie(null);
    window.dispatchEvent(
      new CustomEvent(ACCESS_CONTEXT_CHANGED_EVENT, {
        detail: { assignmentId: null },
      }),
    );
    return;
  }

  const normalizedPermissionCodes = normalizePermissionList(
    accessContext.permissionCodes,
  );
  const normalized: AccessAssignmentContext = {
    ...accessContext,
    permissionCodes: normalizedPermissionCodes,
    permissionCount:
      typeof accessContext.permissionCount === 'number' &&
      Number.isFinite(accessContext.permissionCount) &&
      accessContext.permissionCount >= 0
        ? Math.floor(accessContext.permissionCount)
        : normalizedPermissionCodes.length,
  };
  window.localStorage.setItem(
    CURRENT_ACCESS_CONTEXT_STORAGE_KEY,
    JSON.stringify(normalized),
  );
  syncCurrentAccessCookie(normalized.assignmentId);
  window.dispatchEvent(
    new CustomEvent(ACCESS_CONTEXT_CHANGED_EVENT, {
      detail: { assignmentId: normalized.assignmentId },
    }),
  );
}

export function isAccessContextApplicable(
  accessContext: AccessAssignmentContext | null,
  user: UserInfoResponse | null,
): boolean {
  if (!accessContext || !user) return false;

  const hasRole = (user.roles ?? []).some(
    (roleName) =>
      roleName.trim().toLowerCase() ===
      accessContext.roleName.trim().toLowerCase(),
  );
  if (!hasRole) return false;

  if (!accessContext.scopeNodeId) {
    return true;
  }

  const scopeIds = collectAccessibleScopeIds(user);

  if (scopeIds.size === 0) {
    return true;
  }

  return scopeIds.has(accessContext.scopeNodeId);
}
