import type {
  AdminRoleScope,
  FacilityNodeResponse,
  FeedSiloResponse,
  SaveFarmPayload,
  SaveHousePayload,
  SavePenPayload,
  SaveRolePayload,
  SaveSiloPayload,
  SaveUserAssignmentPayload,
  SaveZonePayload,
  ScopeNodeType,
  UserAssignmentAggregateResponse,
  UserAssignmentAggregateUpsertRequest,
  UserResponse,
  UserAssignmentWorkspaceData,
  UsersWorkspaceMode,
  CompanyResponse,
  PermissionResponse,
  RoleResponse,
} from '../types';
import {
  buildGeneratedCode,
  isBlankScopeValue,
  matchByName,
  matchesNormalizedText,
  normalizeRoleCode,
  normalizePermissionCode,
  normalizeScopeValue,
  parseApiId,
  resolveFacilityNodeIdFromScope,
  userViewAdapter,
} from './user-assignment.shared';

export interface UserAssignmentServiceDeps {
  users: {
    getAll(): Promise<UserResponse[]>;
    update(id: number, data: { email?: string; firstName?: string; lastName?: string; companyId?: number }): Promise<void>;
    deactivate(id: number): Promise<void>;
  };
  companies: {
    getAll(): Promise<CompanyResponse[]>;
  };
  roles: {
    getAll(options?: { includeInactive?: boolean }): Promise<RoleResponse[]>;
    create(data: { code?: string; name: string; description?: string; permissionIds?: number[] }): Promise<RoleResponse>;
    update(id: number, data: { code?: string; name: string; description?: string; permissionIds?: number[] }): Promise<void>;
    deactivate(id: number): Promise<void>;
  };
  permissions: {
    getAll(options?: { includeInactive?: boolean }): Promise<PermissionResponse[]>;
  };
  userAssignments: {
    getSummary(): Promise<UserAssignmentAggregateResponse[]>;
    upsertForUser(userId: number, data: UserAssignmentAggregateUpsertRequest): Promise<void>;
  };
  facilities: {
    getAll(query?: { type?: 'farm' | 'zone' | 'house' | 'pen'; includeInactive?: boolean }): Promise<FacilityNodeResponse[]>;
    create(data: { parentId?: number | null; code: string; name: string; description?: string; type: 'farm' | 'zone' | 'house' | 'pen' }): Promise<FacilityNodeResponse>;
    update(id: number, data: { parentId?: number | null; code: string; name: string; description?: string; type: 'farm' | 'zone' | 'house' | 'pen' }): Promise<void>;
    setStatus(id: number, isActive: boolean): Promise<void>;
    deactivate(id: number): Promise<void>;
  };
  feedSilos: {
    getAll(options?: { includeInactive?: boolean }): Promise<FeedSiloResponse[]>;
    create(data: { facilityNodeId: number; houseId: number; code: string; name: string; description?: string; capacityKg: number }): Promise<FeedSiloResponse>;
    update(id: number, data: { facilityNodeId: number; houseId: number; code: string; name: string; description?: string; capacityKg: number }): Promise<void>;
    setStatus(id: number, isActive: boolean): Promise<void>;
    deactivate(id: number): Promise<void>;
  };
  scopeCatalog: {
    getFacilities(options?: { includeInactive?: boolean }): Promise<FacilityNodeResponse[]>;
  };
}

function resolveCompanyId(
  companiesService: UserAssignmentServiceDeps['companies'],
  companyName: string,
): Promise<number> {
  return companiesService.getAll().then((companies) => {
    const matched = companies.find((company) => matchByName(company.name, companyName));
    if (matched) {
      return matched.id;
    }

    if (!companies.length) {
      throw new Error('No active company available.');
    }

    return companies[0].id;
  });
}

function createWorkspaceHelpers(deps: UserAssignmentServiceDeps) {
  async function loadFacilities(): Promise<FacilityNodeResponse[]> {
    try {
      return await deps.scopeCatalog.getFacilities({ includeInactive: true });
    } catch (scopeCatalogError) {
      console.warn(
        'Unable to load facilities from auth scope catalog endpoint. Falling back to /api/Facilities.',
        scopeCatalogError,
      );
      return deps.facilities.getAll({ includeInactive: true });
    }
  }

  async function resolveRoleScopeRequests(
    roleScopes: AdminRoleScope[],
  ): Promise<UserAssignmentAggregateUpsertRequest['roleScopes']> {
    const facilities = await loadFacilities().catch(() => null);
    if (!facilities) {
      throw new Error('ไม่สามารถโหลดข้อมูล scope ได้');
    }

    const roles = await deps.roles.getAll();
    const roleIdByName = new Map(roles.map((role) => [normalizeScopeValue(role.name), role.id] as const));

    const resolvedScopes = roleScopes.map((scope) => {
      const resolvedRoleId =
        typeof scope.roleId === 'number' && scope.roleId > 0
          ? scope.roleId
          : roleIdByName.get(normalizeScopeValue(scope.role)) ?? null;
      const facilityNodeId = resolveFacilityNodeIdFromScope(scope, facilities);
      return {
        scope,
        roleId: resolvedRoleId,
        facilityNodeId,
      };
    });

    const invalidRoles = resolvedScopes.filter(({ roleId }) => !roleId || roleId <= 0);
    if (invalidRoles.length > 0) {
      const detail = invalidRoles
        .slice(0, 3)
        .map(({ scope }) => scope.role)
        .join(', ');
      throw new Error(`ไม่พบบทบาทที่ใช้งานได้: ${detail}`);
    }

    const unresolvedScopes = resolvedScopes.filter(
      ({ scope, facilityNodeId }) =>
        !isBlankScopeValue(scope.farm) && (facilityNodeId === null || facilityNodeId <= 0),
    );
    if (unresolvedScopes.length > 0) {
      const detail = unresolvedScopes
        .slice(0, 3)
        .map(({ scope }) => {
          const segments = [scope.farm, scope.zone, scope.house].filter(
            (segment) => !isBlankScopeValue(segment),
          );
          return segments.join(' / ') || scope.farm;
        })
        .join(', ');
      throw new Error(`ไม่พบขอบเขตที่ใช้งานได้หรือถูกปิดการใช้งาน: ${detail}`);
    }

    return Array.from(
      new Map(
        resolvedScopes.map(({ roleId, facilityNodeId }) => [
          `${roleId}:${facilityNodeId ?? 'global'}`,
          {
            roleId: roleId as number,
            facilityNodeId: facilityNodeId ?? null,
          },
        ]),
      ).values(),
    );
  }

  async function normalizePermissionOverridesForAssignment(
    permissionOverrides: SaveUserAssignmentPayload['permissionOverrides'],
  ): Promise<UserAssignmentAggregateUpsertRequest['permissionOverrides']> {
    if (!permissionOverrides?.length) {
      return [];
    }

    const facilities = await loadFacilities().catch(() => null);
    if (!facilities) {
      throw new Error('ไม่สามารถโหลดข้อมูล scope ได้');
    }

    const roles = await deps.roles.getAll();
    const roleIdByName = new Map(
      roles.map((role) => [normalizeScopeValue(role.name), role.id] as const),
    );

    const permissions = await deps.permissions.getAll({ includeInactive: true });
    const permissionIdByCode = new Map(
      permissions.map((permission) => [normalizePermissionCode(permission.code), permission.id] as const),
    );

    const items = permissionOverrides.flatMap((item) => {
      const roleId =
        typeof item.roleId === 'number' && item.roleId > 0
          ? item.roleId
          : roleIdByName.get(normalizeScopeValue(item.role)) ?? null;
      const facilityNodeId = resolveFacilityNodeIdFromScope(item, facilities);

      return [
        ...item.allowPermissionCodes.map((code) => ({
          roleId,
          facilityNodeId,
          permissionCode: normalizePermissionCode(code),
          effect: 'allow' as const,
        })),
        ...item.denyPermissionCodes.map((code) => ({
          roleId,
          facilityNodeId,
          permissionCode: normalizePermissionCode(code),
          effect: 'deny' as const,
        })),
      ];
    });

    const invalidRole = items.find((item) => !item.roleId || item.roleId <= 0);
    if (invalidRole) {
      throw new Error('ไม่พบบทบาทสำหรับ permission override');
    }

    const invalidPermission = items.find((item) => !permissionIdByCode.has(item.permissionCode));
    if (invalidPermission) {
      throw new Error(`ไม่พบ permission สำหรับสิทธิ ${invalidPermission.permissionCode}`);
    }

    return Array.from(
      new Map(
        items.map((item) => [
          `${item.roleId}:${item.facilityNodeId ?? 'global'}:${item.permissionCode}:${item.effect}`,
          {
            roleId: item.roleId as number,
            facilityNodeId: item.facilityNodeId ?? null,
            permissionId: permissionIdByCode.get(item.permissionCode) as number,
            effect: item.effect,
          },
        ]),
      ).values(),
    );
  }

  async function getWorkspaceData(mode: UsersWorkspaceMode = 'full'): Promise<UserAssignmentWorkspaceData> {
    if (mode === 'scope') {
      return getScopeWorkspaceData();
    }

    const [users, roles, facilitiesResult, silosResult] = await Promise.all([
      deps.users.getAll(),
      deps.roles.getAll(),
      loadFacilities()
        .then((items) => ({ ok: true as const, items }))
        .catch((error) => {
          console.error('Failed to load facilities for user-assignment workspace.', error);
          return { ok: false as const, items: [] as FacilityNodeResponse[] };
        }),
      deps.feedSilos
        .getAll({ includeInactive: true })
        .then((items) => ({ ok: true as const, items }))
        .catch((error) => {
          console.error('Failed to load feed silos for user-assignment workspace.', error);
          return { ok: false as const, items: [] as FeedSiloResponse[] };
        }),
    ]);
    const facilities = facilitiesResult.items;
    const silos = silosResult.items;
    const activeUsers = users.filter((user) => user.isActive);

    const assignments = await deps.userAssignments.getSummary().catch(() => []);
    const assignmentsByUserId = new Map<number, UserAssignmentAggregateResponse>(
      assignments.map((assignment) => [assignment.userId, assignment]),
    );
    const scopeCatalog = userViewAdapter.toScopeCatalog(facilities);

    return {
      roles: userViewAdapter.toAdminRoles(roles),
      ...scopeCatalog,
      silos: userViewAdapter.toAdminSilos(silos),
      assignments: activeUsers.map((user) =>
        userViewAdapter.toAdminUserAssignment(
          user,
          assignmentsByUserId.get(user.id) ?? {
            userId: user.id,
            username: user.username,
            roleScopes: [],
            permissionOverrides: [],
          },
          facilities,
          roles,
        ),
      ),
      rolePermissions: {},
    };
  }

  async function getScopeWorkspaceData(): Promise<UserAssignmentWorkspaceData> {
    const [facilities, silos] = await Promise.all([
      loadFacilities(),
      deps.feedSilos.getAll({ includeInactive: true }).catch(() => []),
    ]);
    const scopeCatalog = userViewAdapter.toScopeCatalog(facilities);

    return {
      roles: [],
      ...scopeCatalog,
      silos: userViewAdapter.toAdminSilos(silos),
      assignments: [],
      rolePermissions: {},
    };
  }

  async function saveUserAssignment(payload: SaveUserAssignmentPayload) {
    const companyId = await resolveCompanyId(deps.companies, payload.organization.company);

    const firstName = payload.firstName.trim();
    const lastName = payload.lastName.trim();
    const email = payload.email.trim();
    const normalizedUsername = payload.username.trim().toLowerCase();
    const normalizedEmail = email.toLowerCase();

    const findExistingByIdentity = (users: UserResponse[]) =>
      users.find(
        (item) =>
          item.username.trim().toLowerCase() === normalizedUsername ||
          item.email.trim().toLowerCase() === normalizedEmail,
      );

    const resolvedUserId =
      typeof payload.userId === 'number' && Number.isFinite(payload.userId) && payload.userId > 0
        ? payload.userId
        : payload.id
          ? parseApiId(payload.id, 'user')
          : null;

    if (resolvedUserId) {
      await deps.users.update(resolvedUserId, {
        email,
        firstName,
        lastName,
        companyId,
      });
      await deps.userAssignments.upsertForUser(resolvedUserId, {
        roleScopes: await resolveRoleScopeRequests(payload.roleScopes),
        permissionOverrides: await normalizePermissionOverridesForAssignment(payload.permissionOverrides ?? []),
      });
      return getWorkspaceData();
    }

    let existingBeforeCreate: UserResponse | null = null;
    try {
      const users = await deps.users.getAll();
      existingBeforeCreate = findExistingByIdentity(users) ?? null;
    } catch {
      existingBeforeCreate = null;
    }

    if (existingBeforeCreate) {
      await deps.users.update(existingBeforeCreate.id, {
        email,
        firstName,
        lastName,
        companyId,
      });
      await deps.userAssignments.upsertForUser(existingBeforeCreate.id, {
        roleScopes: await resolveRoleScopeRequests(payload.roleScopes),
        permissionOverrides: await normalizePermissionOverridesForAssignment(payload.permissionOverrides ?? []),
      });
      return getWorkspaceData();
    }

    throw new Error('ไม่พบผู้ใช้งานที่เลือก กรุณาสร้างผู้ใช้จากหน้าจัดการผู้ใช้ก่อน');
  }

  async function deleteUserAssignment(assignmentId: number) {
    const userId = parseApiId(assignmentId, 'assignment');
    await deps.users.deactivate(userId);
    return getWorkspaceData();
  }

  async function saveRole(payload: SaveRolePayload) {
    const code = normalizeRoleCode(payload.code || payload.name);
    if (payload.id) {
      await deps.roles.update(parseApiId(payload.id, 'role'), {
        code,
        name: payload.name.trim(),
        description: payload.description.trim(),
      });
    } else {
      await deps.roles.create({
        code,
        name: payload.name.trim(),
        description: payload.description.trim(),
      });
    }

    return getWorkspaceData();
  }

  async function deleteRole(roleId: string) {
    await deps.roles.deactivate(parseApiId(roleId, 'role'));
    return getWorkspaceData();
  }

  async function saveFarm(payload: SaveFarmPayload) {
    if (payload.id) {
      const farmId = parseApiId(payload.id, 'farm');
      const facilities = await loadFacilities();
      const existing = facilities.find(
        (facility) => facility.id === farmId && facility.type === 'farm',
      );
      if (!existing) {
        throw new Error('Farm not found.');
      }

      const nextCode = payload.code.trim().toUpperCase();
      const nextName = payload.name.trim();
      const nextDescription = payload.location.trim();
      const needsMetadataUpdate =
        existing.parentId !== null ||
        !matchesNormalizedText(existing.code, nextCode) ||
        !matchesNormalizedText(existing.name, nextName) ||
        !matchesNormalizedText(existing.description, nextDescription) ||
        existing.type !== 'farm';

      if (needsMetadataUpdate) {
        await deps.facilities.update(farmId, {
          parentId: null,
          code: nextCode,
          name: nextName,
          description: nextDescription,
          type: 'farm',
        });
      }
      await deps.facilities.setStatus(farmId, payload.status === 'Active');
      return getWorkspaceData();
    }

    const created = await deps.facilities.create({
      parentId: null,
      code: payload.code.trim().toUpperCase(),
      name: payload.name.trim(),
      description: payload.location.trim(),
      type: 'farm',
    });
    if (payload.status === 'Inactive') {
      await deps.facilities.setStatus(created.id, false);
    }
    return getWorkspaceData();
  }

  async function saveZone(payload: SaveZonePayload) {
    const facilities = await loadFacilities();
    const farm = facilities.find(
      (facility) => facility.id === payload.farmId && facility.type === 'farm',
    );
    if (!farm) {
      throw new Error('Farm not found.');
    }

    if (payload.id) {
      const zoneId = parseApiId(payload.id, 'zone');
      const existing = facilities.find(
        (facility) => facility.id === zoneId && facility.type === 'zone',
      );
      if (!existing) {
        throw new Error('Zone not found.');
      }
      const nextName = payload.name.trim();
      const needsMetadataUpdate =
        existing.parentId !== payload.farmId ||
        !matchesNormalizedText(existing.name, nextName) ||
        existing.type !== 'zone';

      if (needsMetadataUpdate) {
        await deps.facilities.update(zoneId, {
          parentId: payload.farmId,
          code: existing.code,
          name: nextName,
          description: existing.description,
          type: 'zone',
        });
      }
      await deps.facilities.setStatus(zoneId, payload.status === 'Active');
      return getWorkspaceData();
    }

    const siblingCodes = facilities
      .filter((facility) => facility.type === 'zone' && facility.parentId === payload.farmId)
      .map((facility) => facility.code);
    const generatedCode = buildGeneratedCode(farm.code, siblingCodes, 'Z');

    const created = await deps.facilities.create({
      parentId: payload.farmId,
      code: generatedCode,
      name: payload.name.trim(),
      description: `Zone in ${farm.name}`,
      type: 'zone',
    });
    if (payload.status === 'Inactive') {
      await deps.facilities.setStatus(created.id, false);
    }
    return getWorkspaceData();
  }

  async function saveHouse(payload: SaveHousePayload) {
    const facilities = await loadFacilities();
    const farm = facilities.find(
      (facility) => facility.id === payload.farmId && facility.type === 'farm',
    );
    if (!farm) {
      throw new Error('Farm not found.');
    }

    const resolvedZoneId =
      typeof payload.zoneId === 'number' && Number.isFinite(payload.zoneId) && payload.zoneId > 0
        ? payload.zoneId
        : null;
    const zone = resolvedZoneId
      ? facilities.find((facility) => facility.id === resolvedZoneId && facility.type === 'zone')
      : undefined;
    if (resolvedZoneId && !zone) {
      throw new Error('Zone not found.');
    }

    if (zone && zone.parentId !== farm.id) {
      throw new Error('Selected zone does not belong to selected farm.');
    }

    const parentNode = zone ?? farm;

    if (payload.id) {
      const houseId = parseApiId(payload.id, 'house');
      const existing = facilities.find(
        (facility) => facility.id === houseId && facility.type === 'house',
      );
      if (!existing) {
        throw new Error('House not found.');
      }
      const nextName = payload.name.trim();
      const needsMetadataUpdate =
        existing.parentId !== parentNode.id ||
        !matchesNormalizedText(existing.name, nextName) ||
        existing.type !== 'house';

      if (needsMetadataUpdate) {
        await deps.facilities.update(houseId, {
          parentId: parentNode.id,
          code: existing.code,
          name: nextName,
          description: existing.description,
          type: 'house',
        });
      }
      await deps.facilities.setStatus(houseId, payload.status === 'Active');
      return getWorkspaceData();
    }

    const siblingCodes = facilities
      .filter((facility) => facility.type === 'house' && facility.parentId === parentNode.id)
      .map((facility) => facility.code);
    const generatedCode = buildGeneratedCode(parentNode.code, siblingCodes, 'H');

    const created = await deps.facilities.create({
      parentId: parentNode.id,
      code: generatedCode,
      name: payload.name.trim(),
      description: `House in ${parentNode.name}`,
      type: 'house',
    });
    if (payload.status === 'Inactive') {
      await deps.facilities.setStatus(created.id, false);
    }
    return getWorkspaceData();
  }

  async function savePen(payload: SavePenPayload) {
    const facilities = await loadFacilities();
    const house = facilities.find(
      (facility) => facility.id === payload.houseId && facility.type === 'house',
    );
    if (!house) {
      throw new Error('House not found.');
    }

    if (payload.id) {
      const penId = parseApiId(payload.id, 'pen');
      const existing = facilities.find(
        (facility) => facility.id === penId && facility.type === 'pen',
      );
      if (!existing) {
        throw new Error('Pen not found.');
      }
      const nextName = payload.name.trim();
      const needsMetadataUpdate =
        existing.parentId !== payload.houseId ||
        !matchesNormalizedText(existing.name, nextName) ||
        existing.type !== 'pen';

      if (needsMetadataUpdate) {
        await deps.facilities.update(penId, {
          parentId: payload.houseId,
          code: existing.code,
          name: nextName,
          description: existing.description,
          type: 'pen',
        });
      }
      await deps.facilities.setStatus(penId, payload.status === 'Active');
      return getWorkspaceData();
    }

    const siblingCodes = facilities
      .filter((facility) => facility.type === 'pen' && facility.parentId === payload.houseId)
      .map((facility) => facility.code);
    const generatedCode = buildGeneratedCode(house.code, siblingCodes, 'P');

    const created = await deps.facilities.create({
      parentId: payload.houseId,
      code: generatedCode,
      name: payload.name.trim(),
      description: `Pen in ${house.name}`,
      type: 'pen',
    });
    if (payload.status === 'Inactive') {
      await deps.facilities.setStatus(created.id, false);
    }
    return getWorkspaceData();
  }

  async function saveSilo(payload: SaveSiloPayload) {
    const facilities = await loadFacilities();
    const farm = facilities.find(
      (facility) => facility.id === payload.farmId && facility.type === 'farm',
    );
    if (!farm) {
      throw new Error('Farm not found.');
    }

    const house = facilities.find(
      (facility) => facility.id === payload.houseId && facility.type === 'house',
    );
    if (!house) {
      throw new Error('House not found.');
    }

    const parent = house.parentId ? facilities.find((facility) => facility.id === house.parentId) : undefined;
    const houseFarmId =
      parent?.type === 'zone'
        ? parent.parentId ?? null
        : parent?.type === 'farm'
          ? parent.id
          : null;

    if (houseFarmId !== farm.id) {
      throw new Error('Selected house does not belong to selected farm.');
    }

    const nextPayload = {
      facilityNodeId: payload.farmId,
      houseId: payload.houseId,
      code: payload.code.trim().toUpperCase(),
      name: payload.name.trim(),
      description: '',
      capacityKg: payload.capacityKg,
    };

    if (payload.id) {
      await deps.feedSilos.update(parseApiId(payload.id, 'silo'), nextPayload);
      await deps.feedSilos.setStatus(parseApiId(payload.id, 'silo'), payload.status === 'Active');
      return getWorkspaceData();
    }

    const created = await deps.feedSilos.create(nextPayload);
    if (payload.status === 'Inactive') {
      await deps.feedSilos.setStatus(created.id, false);
    }
    return getWorkspaceData();
  }

  async function deleteScopeNode(type: ScopeNodeType, id: number) {
    const nodeId = parseApiId(id, type);
    await deps.facilities.deactivate(nodeId);
    return getWorkspaceData();
  }

  async function deleteSilo(id: number) {
    await deps.feedSilos.deactivate(parseApiId(id, 'silo'));
    return getWorkspaceData();
  }

  return {
    source: 'server' as const,
    getWorkspaceData,
    saveUserAssignment,
    deleteUserAssignment,
    saveRole,
    deleteRole,
    saveFarm,
    saveZone,
    saveHouse,
    savePen,
    saveSilo,
    deleteScopeNode,
    deleteSilo,
  };
}

export const createUsersApi = (deps: UserAssignmentServiceDeps) => createWorkspaceHelpers(deps);
