import { normalizePermissionCode as normalizeCanonicalPermissionCode } from '@/lib/access/permission-code';
import { formatUserDisplayName } from '@/lib/user-display';
import type {
  AdminRole,
  AdminRoleScope,
  AdminScopeCatalog,
  AdminUserAssignment,
  FacilityNodeResponse,
  IncludeInactiveQuery,
  MenuTreeGroupResponse,
  PermissionResponse,
  RoleResponse,
  UserResponse,
} from '../types';

const USERS_URL = '/api/Users';
const AUTH_MODELS_URL = '/api/AuthModels';
const FACILITIES_URL = '/api/Facilities';
const FEED_SILOS_URL = '/api/FeedSilos';
const MENU_MODELS_URL = '/api/MenuModels';

export const EMPTY_SCOPE_LABEL = '-';
export const UNASSIGNED_ROLE_LABEL = 'Unassigned';

export type ScopePath = Pick<AdminRoleScope, 'farm' | 'zone' | 'house'>;

export const EMPTY_SCOPE_PATH: ScopePath = {
  farm: EMPTY_SCOPE_LABEL,
  zone: EMPTY_SCOPE_LABEL,
  house: EMPTY_SCOPE_LABEL,
};

function normalizePermissionPart(value: string | null | undefined): string {
  return (value ?? '').trim();
}

export function normalizeRoleCode(roleName: string): string {
  return roleName
    .trim()
    .toUpperCase()
    .replace(/\s+/g, '_')
    .replace(/[^A-Z0-9_-]/g, '')
    .replace(/_+/g, '_')
    .replace(/-+/g, '-')
    .replace(/^[-_]+|[-_]+$/g, '');
}

export function resolveRoleCode(role: Pick<RoleResponse, 'name' | 'code'>): string {
  const canonicalCode = role.code?.trim();
  if (canonicalCode) {
    return canonicalCode;
  }
  return normalizeRoleCode(role.name);
}

export function normalizeRoleResponse(role: RoleResponse): RoleResponse {
  return {
    ...role,
    code: resolveRoleCode(role),
  };
}

export function normalizePermissionCode(value: string | null | undefined): string {
  return normalizeCanonicalPermissionCode(value) ?? '';
}

export function normalizeScopeValue(value: string | null | undefined): string {
  return (value ?? '').trim().toLowerCase();
}

function parsePermissionCode(
  code: string | null | undefined,
): { module: string; resource: string | null; action: string } | null {
  const normalizedCode = normalizePermissionPart(code);
  if (!normalizedCode) {
    return null;
  }

  const segments = normalizedCode
    .split('.')
    .map((segment) => segment.trim())
    .filter(Boolean);
  if (segments.length < 2) {
    return null;
  }

  return {
    module: segments[0],
    resource: segments.length > 2 ? segments.slice(1, -1).join('_') : null,
    action: segments[segments.length - 1],
  };
}

function parsePermissionResourcePath(
  resourcePath: string | null | undefined,
): { module: string; resource: string | null } | null {
  const normalizedPath = normalizePermissionPart(resourcePath);
  if (!normalizedPath) {
    return null;
  }

  const segments = normalizedPath
    .split('.')
    .map((segment) => segment.trim())
    .filter(Boolean);
  if (segments.length === 0) {
    return null;
  }

  return {
    module: segments[0],
    resource: segments.length > 1 ? segments.slice(1).join('_') : null,
  };
}

function buildPermissionResourcePath(module: string, resource: string | null): string {
  return resource ? `${module}.${resource}` : module;
}

export function normalizePermissionResponse(permission: PermissionResponse): PermissionResponse {
  const parsedCode = parsePermissionCode(permission.code);
  const explicitModule = normalizePermissionPart(permission.module);
  const explicitResource = normalizePermissionPart(permission.resource);
  const explicitResourcePath = normalizePermissionPart(permission.resourcePath);
  const parsedExplicitResourcePath =
    parsePermissionResourcePath(explicitResourcePath) ??
    (!explicitModule && explicitResource
      ? parsePermissionResourcePath(explicitResource)
      : null);

  const normalizedModule =
    explicitModule || parsedExplicitResourcePath?.module || parsedCode?.module || '';
  const normalizedResource =
    explicitModule && explicitResource && !explicitResource.includes('.')
      ? explicitResource
      : parsedExplicitResourcePath?.resource ?? parsedCode?.resource ?? null;
  const normalizedAction = normalizePermissionPart(permission.action) || parsedCode?.action || '';
  const normalizedCode =
    normalizePermissionPart(permission.code) ||
    (normalizedModule && normalizedAction
      ? buildPermissionResourcePath(normalizedModule, normalizedResource).concat(`.${normalizedAction}`)
      : '');
  const normalizedResourcePath =
    explicitResourcePath ||
    (explicitModule
      ? buildPermissionResourcePath(explicitModule, normalizedResource)
      : parsedExplicitResourcePath
        ? buildPermissionResourcePath(
            parsedExplicitResourcePath.module,
            parsedExplicitResourcePath.resource,
          )
        : '') ||
    (normalizedModule
      ? buildPermissionResourcePath(normalizedModule, normalizedResource)
      : parsedCode
        ? buildPermissionResourcePath(parsedCode.module, parsedCode.resource)
        : '');

  return {
    ...permission,
    module: normalizedModule,
    resource: normalizedResource,
    resourcePath: normalizedResourcePath,
    action: normalizedAction,
    code: normalizedCode,
    description: permission.description ?? '',
  };
}

export function buildDisplayName(user: UserResponse): string {
  return formatUserDisplayName(user, user.username);
}

export function buildInitials(user: Pick<UserResponse, 'firstName' | 'lastName' | 'username'>): string {
  const firstName = user.firstName.trim();
  const lastName = user.lastName.trim();

  if (firstName && lastName) {
    return `${firstName[0]}${lastName[0]}`.toUpperCase();
  }

  const nameWithoutPrefix = `${firstName}${lastName}`.trim();
  if (nameWithoutPrefix) {
    return nameWithoutPrefix.slice(0, 2).toUpperCase();
  }

  const username = user.username.trim();
  if (username) {
    return username.slice(0, 2).toUpperCase();
  }

  return 'NA';
}

export function toScopeStatus(isActive: boolean): 'Active' | 'Inactive' {
  return isActive ? 'Active' : 'Inactive';
}

function buildDefaultScopePathFromFacilities(facilities: FacilityNodeResponse[]): ScopePath {
  const activeFarm = facilities
    .filter((facility) => facility.type === 'farm' && facility.isActive)
    .sort((left, right) => left.name.localeCompare(right.name))[0];
  const fallbackFarm = activeFarm ?? facilities
    .filter((facility) => facility.type === 'farm')
    .sort((left, right) => left.name.localeCompare(right.name))[0];

  if (!fallbackFarm) {
    return EMPTY_SCOPE_PATH;
  }

  return {
    farm: fallbackFarm.name,
    zone: EMPTY_SCOPE_LABEL,
    house: EMPTY_SCOPE_LABEL,
  };
}

function mapFacilityScopePath(
  facilityNodeId: number | null,
  facilityMap: Map<number, FacilityNodeResponse>,
): ScopePath {
  if (!facilityNodeId) {
    return EMPTY_SCOPE_PATH;
  }

  const node = facilityMap.get(facilityNodeId);
  if (!node) {
    return EMPTY_SCOPE_PATH;
  }

  const parent = node.parentId ? facilityMap.get(node.parentId) : undefined;

  const resolveHouseHierarchy = (houseNode: FacilityNodeResponse) => {
    const directParent = houseNode.parentId ? facilityMap.get(houseNode.parentId) : undefined;
    if (!directParent) {
      return { farm: undefined, zone: undefined };
    }

    if (directParent.type === 'zone') {
      const farmNode = directParent.parentId ? facilityMap.get(directParent.parentId) : undefined;
      return { farm: farmNode, zone: directParent };
    }

    if (directParent.type === 'farm') {
      return { farm: directParent, zone: undefined };
    }

    return { farm: undefined, zone: undefined };
  };

  if (node.type === 'farm') {
    return {
      farm: node.name,
      zone: EMPTY_SCOPE_LABEL,
      house: EMPTY_SCOPE_LABEL,
    };
  }

  if (node.type === 'zone') {
    return {
      farm: parent?.name ?? EMPTY_SCOPE_LABEL,
      zone: node.name,
      house: EMPTY_SCOPE_LABEL,
    };
  }

  if (node.type === 'house') {
    const houseHierarchy = resolveHouseHierarchy(node);
    return {
      farm: houseHierarchy.farm?.name ?? EMPTY_SCOPE_LABEL,
      zone: houseHierarchy.zone?.name ?? EMPTY_SCOPE_LABEL,
      house: node.name,
    };
  }

  const houseHierarchy = parent ? resolveHouseHierarchy(parent) : { farm: undefined, zone: undefined };
  return {
    farm: houseHierarchy.farm?.name ?? EMPTY_SCOPE_LABEL,
    zone: houseHierarchy.zone?.name ?? EMPTY_SCOPE_LABEL,
    house: parent?.name ?? node.name,
  };
}

function dedupeRoleScopes(roleScopes: AdminRoleScope[]): AdminRoleScope[] {
  const unique = new Map<string, AdminRoleScope>();

  roleScopes.forEach((item) => {
    const key = `${item.role}|${item.farm}|${item.zone}|${item.house}`;
    if (!unique.has(key)) {
      unique.set(key, item);
    }
  });

  return Array.from(unique.values());
}

export function withIncludeInactive(query: IncludeInactiveQuery): { includeInactive?: boolean } {
  return query.includeInactive !== undefined ? { includeInactive: query.includeInactive } : {};
}

export const userAssignmentEndpoints = {
  users: {
    list: USERS_URL,
    detail: (id: number) => `${USERS_URL}/${id}`,
    resetPassword: (id: number) => `${USERS_URL}/${id}/reset-password`,
  },
  authModels: {
    companies: {
      list: `${AUTH_MODELS_URL}/companies`,
      detail: (id: number) => `${AUTH_MODELS_URL}/companies/${id}`,
      status: (id: number) => `${AUTH_MODELS_URL}/companies/${id}/status`,
    },
    roles: {
      list: `${AUTH_MODELS_URL}/roles`,
      detail: (id: number) => `${AUTH_MODELS_URL}/roles/${id}`,
      status: (id: number) => `${AUTH_MODELS_URL}/roles/${id}/status`,
      permissions: (roleId: number) => `${AUTH_MODELS_URL}/roles/${roleId}/permissions`,
      permissionItem: (roleId: number, permissionId: number) =>
        `${AUTH_MODELS_URL}/roles/${roleId}/permissions/${permissionId}`,
    },
    permissions: {
      list: `${AUTH_MODELS_URL}/permissions`,
      detail: (id: number) => `${AUTH_MODELS_URL}/permissions/${id}`,
      status: (id: number) => `${AUTH_MODELS_URL}/permissions/${id}/status`,
    },
    userRoles: {
      list: (userId: number) => `${AUTH_MODELS_URL}/users/${userId}/roles`,
      item: (userId: number, roleId: number) =>
        `${AUTH_MODELS_URL}/users/${userId}/roles/${roleId}`,
    },
    userAssignment: (userId: number) => `${AUTH_MODELS_URL}/users/${userId}/assignment`,
    assignmentsSummary: `${AUTH_MODELS_URL}/assignments/summary`,
    accessPreview: `${AUTH_MODELS_URL}/access-preview`,
    scopeCatalogFacilities: `${AUTH_MODELS_URL}/scope-catalog/facilities`,
  },
  facilities: {
    list: FACILITIES_URL,
    tree: `${FACILITIES_URL}/tree`,
    detail: (id: number) => `${FACILITIES_URL}/${id}`,
    hardDetail: (id: number) => `${FACILITIES_URL}/${id}/hard`,
    status: (id: number) => `${FACILITIES_URL}/${id}/status`,
  },
  feedSilos: {
    list: FEED_SILOS_URL,
    detail: (id: number) => `${FEED_SILOS_URL}/${id}`,
    status: (id: number) => `${FEED_SILOS_URL}/${id}/status`,
  },
  permissionMenus: {
    tree: `${MENU_MODELS_URL}/tree`,
  },
} as const;

export const userViewAdapter = {
  toAdminRole: (role: RoleResponse): AdminRole => ({
    id: String(role.id),
    code: resolveRoleCode(role),
    name: role.name,
    description: role.description ?? '',
    permissionCount: role.permissionCount ?? 0,
    isActive: role.isActive,
  }),

  toAdminRoles: (roles: RoleResponse[]): AdminRole[] =>
    roles.map((role) => userViewAdapter.toAdminRole(role)),

  toScopeCatalog: (facilities: FacilityNodeResponse[]): AdminScopeCatalog => {
    const facilityMap = new Map<number, FacilityNodeResponse>(
      facilities.map((facility) => [facility.id, facility]),
    );

    const farms = facilities
      .filter((facility) => facility.type === 'farm')
      .map((farm) => ({
        id: farm.id,
        name: farm.name,
        code: farm.code,
        location: farm.description || '-',
        status: toScopeStatus(farm.isActive),
      }))
      .sort((left, right) => left.name.localeCompare(right.name));

    const zones = facilities
      .filter((facility) => facility.type === 'zone')
      .map((zone) => {
        const farm = zone.parentId ? facilityMap.get(zone.parentId) : undefined;
        return {
          id: zone.id,
          name: zone.name,
          farmId: farm?.id ?? 0,
          farmName: farm?.name ?? EMPTY_SCOPE_LABEL,
          status: toScopeStatus(zone.isActive),
        };
      })
      .sort((left, right) => left.name.localeCompare(right.name));

    const houses = facilities
      .filter((facility) => facility.type === 'house')
      .map((house) => {
        const parent = house.parentId ? facilityMap.get(house.parentId) : undefined;
        const zone = parent?.type === 'zone' ? parent : undefined;
        const farm =
          zone?.parentId
            ? facilityMap.get(zone.parentId)
            : parent?.type === 'farm'
              ? parent
              : undefined;
        return {
          id: house.id,
          name: house.name,
          zoneId: zone?.id ?? 0,
          zoneName: zone?.name ?? EMPTY_SCOPE_LABEL,
          farmName: farm?.name ?? EMPTY_SCOPE_LABEL,
          status: toScopeStatus(house.isActive),
        };
      })
      .sort((left, right) => left.name.localeCompare(right.name));

    const pens = facilities
      .filter((facility) => facility.type === 'pen')
      .map((pen) => {
        const house = pen.parentId ? facilityMap.get(pen.parentId) : undefined;
        const houseParent = house?.parentId ? facilityMap.get(house.parentId) : undefined;
        const zone = houseParent?.type === 'zone' ? houseParent : undefined;
        const farm =
          zone?.parentId
            ? facilityMap.get(zone.parentId)
            : houseParent?.type === 'farm'
              ? houseParent
              : undefined;
        return {
          id: pen.id,
          name: pen.name,
          houseId: house?.id ?? 0,
          houseName: house?.name ?? EMPTY_SCOPE_LABEL,
          zoneName: zone?.name ?? EMPTY_SCOPE_LABEL,
          farmName: farm?.name ?? EMPTY_SCOPE_LABEL,
          status: toScopeStatus(pen.isActive),
        };
      })
      .sort((left, right) => left.name.localeCompare(right.name));

    return { farms, zones, houses, pens, silos: [] };
  },

  toAdminSilos: (silos: { id: number; code: string; name: string; facilityNodeId: number; facilityNodeName: string; zoneName?: string | null; houseId: number; houseName: string; capacityKg: number; isActive: boolean; }[]) =>
    silos
      .map((silo) => ({
        id: silo.id,
        code: silo.code,
        name: silo.name,
        facilityNodeId: silo.facilityNodeId,
        farmName: silo.facilityNodeName,
        zoneName: silo.zoneName?.trim() ? silo.zoneName : EMPTY_SCOPE_LABEL,
        houseId: silo.houseId,
        houseName: silo.houseName,
        capacityKg: Number(silo.capacityKg),
        status: toScopeStatus(silo.isActive),
      }))
      .sort((left, right) => left.name.localeCompare(right.name)),

  toAdminUserAssignment: (
    user: UserResponse,
    assignmentAggregate: {
      userId: number;
      roleScopes: { assignmentId?: number | null; roleId: number; facilityNodeId: number | null; }[];
      permissionOverrides?: { assignmentId?: number | null; roleId: number; facilityNodeId: number | null; permissionId: number; permissionCode?: string; effect: 'allow' | 'deny'; }[];
    },
    facilities: FacilityNodeResponse[],
    roles: RoleResponse[],
  ): AdminUserAssignment => {
    const displayName = buildDisplayName(user);
    const facilityMap = new Map<number, FacilityNodeResponse>(
      facilities.map((facility) => [facility.id, facility]),
    );
    const roleMap = new Map<number, RoleResponse>(roles.map((role) => [role.id, role]));
    const defaultScopePath = buildDefaultScopePathFromFacilities(facilities);
    const aggregateRoleScopes = assignmentAggregate.roleScopes.length
      ? assignmentAggregate.roleScopes
      : [];

    const roleScopes = dedupeRoleScopes(
      (aggregateRoleScopes.length
        ? aggregateRoleScopes.map((scope) => {
            const mappedScope = mapFacilityScopePath(scope.facilityNodeId ?? null, facilityMap);
            const role = roleMap.get(scope.roleId);
            return {
              assignmentId: scope.assignmentId ?? null,
              role: role?.name ?? UNASSIGNED_ROLE_LABEL,
              roleId: scope.roleId,
              facilityNodeId: scope.facilityNodeId ?? null,
              farm: mappedScope.farm,
              zone: mappedScope.zone,
              house: mappedScope.house,
            };
          })
        : (user.roles.length ? user.roles : [UNASSIGNED_ROLE_LABEL]).map((role) => ({
            role,
            farm: defaultScopePath.farm,
            zone: defaultScopePath.zone,
            house: defaultScopePath.house,
          }))),
    );

    return {
      id: user.id,
      userId: user.id,
      username: user.username,
      prefix: user.prefix ?? null,
      firstName: user.firstName,
      lastName: user.lastName,
      name: displayName,
      email: user.email,
      avatar: buildInitials(user),
      organization: {
        company: user.companyName,
      },
      roleScopes,
      permissionOverrides: (assignmentAggregate.permissionOverrides ?? []).map((override) => ({
        assignmentId: override.assignmentId ?? null,
        roleId: override.roleId,
        facilityNodeId: override.facilityNodeId,
        permissionId: override.permissionId,
        permissionCode: override.permissionCode,
        effect: override.effect,
      })),
    };
  },
};

export function parseApiId(id: string | number | undefined, label: string): number {
  const numeric = Number(id);
  if (!Number.isFinite(numeric) || numeric <= 0) {
    throw new Error(`Invalid ${label} id.`);
  }
  return numeric;
}

export function normalizeText(value: string): string {
  return value.trim().toLowerCase();
}

export function isBlankScopeValue(value: string | undefined): boolean {
  if (!value) {
    return true;
  }
  const normalized = value.trim();
  return normalized.length === 0 || normalized === '-';
}

export function makeFacilityMap(facilities: FacilityNodeResponse[]): Map<number, FacilityNodeResponse> {
  return new Map(facilities.map((facility) => [facility.id, facility]));
}

export function matchByName(value: string, target: string): boolean {
  return normalizeText(value) === normalizeText(target);
}

export function matchesNormalizedText(source: string | null | undefined, target: string): boolean {
  return (source ?? '').trim() === target.trim();
}

export function resolveFacilityNodeIdFromScope(
  scope: AdminRoleScope,
  facilities: FacilityNodeResponse[],
): number | null {
  if (typeof scope.facilityNodeId === 'number' && scope.facilityNodeId > 0) {
    return scope.facilityNodeId;
  }

  const facilityMap = makeFacilityMap(facilities);
  const rankCandidate = (candidate: FacilityNodeResponse): number => {
    const parent = candidate.parentId ? facilityMap.get(candidate.parentId) : undefined;
    const grandParent = parent?.parentId ? facilityMap.get(parent.parentId) : undefined;

    let score = candidate.isActive ? 100 : 0;
    if (parent) {
      score += parent.isActive ? 10 : -10;
    }
    if (grandParent) {
      score += grandParent.isActive ? 1 : -1;
    }
    return score;
  };
  const pickBestCandidate = (candidates: FacilityNodeResponse[]): FacilityNodeResponse | undefined =>
    [...candidates].sort((left, right) => {
      const scoreDelta = rankCandidate(right) - rankCandidate(left);
      if (scoreDelta !== 0) {
        return scoreDelta;
      }
      return left.id - right.id;
    })[0];
  const farmName = scope.farm?.trim() ?? '';
  const zoneName = scope.zone?.trim() ?? '';
  const houseName = scope.house?.trim() ?? '';

  if (!isBlankScopeValue(houseName)) {
    const candidates = facilities.filter(
      (facility) => facility.type === 'house' && matchByName(facility.name, houseName),
    );
    const matchedCandidates = candidates.filter((candidate) => {
      const parent = candidate.parentId ? facilityMap.get(candidate.parentId) : undefined;
      const zone = parent?.type === 'zone' ? parent : undefined;
      const farm =
        zone?.parentId
          ? facilityMap.get(zone.parentId)
          : parent?.type === 'farm'
            ? parent
            : undefined;
      const zoneMatched = isBlankScopeValue(zoneName)
        ? true
        : Boolean(zone && matchByName(zone.name, zoneName));
      const farmMatched = isBlankScopeValue(farmName)
        ? true
        : Boolean(farm && matchByName(farm.name, farmName));
      return zoneMatched && farmMatched;
    });
    const matched = pickBestCandidate(matchedCandidates);
    return matched?.isActive ? matched.id : null;
  }

  if (!isBlankScopeValue(zoneName)) {
    const candidates = facilities.filter(
      (facility) => facility.type === 'zone' && matchByName(facility.name, zoneName),
    );
    const matchedCandidates = candidates.filter((candidate) => {
      const farm = candidate.parentId ? facilityMap.get(candidate.parentId) : undefined;
      return isBlankScopeValue(farmName)
        ? true
        : Boolean(farm && matchByName(farm.name, farmName));
    });
    const matched = pickBestCandidate(matchedCandidates);
    return matched?.isActive ? matched.id : null;
  }

  if (!isBlankScopeValue(farmName)) {
    const matched = pickBestCandidate(
      facilities.filter(
        (facility) => facility.type === 'farm' && matchByName(facility.name, farmName),
      ),
    );
    return matched?.isActive ? matched.id : null;
  }

  return null;
}

export function buildGeneratedCode(parentCode: string, siblingCodes: string[], suffix: string): string {
  const normalizedParent = parentCode.trim().toUpperCase() || 'NODE';
  let serial = siblingCodes.length + 1;
  let candidate = `${normalizedParent}-${suffix}${String(serial).padStart(2, '0')}`;

  while (siblingCodes.some((code) => normalizeText(code) === normalizeText(candidate))) {
    serial += 1;
    candidate = `${normalizedParent}-${suffix}${String(serial).padStart(2, '0')}`;
  }

  return candidate;
}
