'use client';

import { buildDisplayName } from './user-assignment.shared';
import { companiesService } from './companies.service';
import { facilitiesService } from './facilities.service';
import { rolesService } from './roles.service';
import { scopeCatalogService } from './scope-catalog.service';
import { userAssignmentsService } from './user-assignments.service';
import { usersService } from './users.service';
import { userRolesService } from './user-roles.service';
import type {
  FacilityNodeResponse,
  UserAssignmentDetail,
  UserAssignmentEditorFormState,
  UserAssignmentRoleOption,
  UserAssignmentSavePayload,
  UserAssignmentUserSummary,
  UserAssignmentWorkspace,
  CompanyResponse,
  RoleResponse,
  UserResponse,
} from '../types';

function sortByName(left: { name: string }, right: { name: string }): number {
  return left.name.localeCompare(right.name);
}

function buildFacilityPathLabel(node: FacilityNodeResponse, facilityMap: Map<number, FacilityNodeResponse>): string {
  const parts: string[] = [];
  let current: FacilityNodeResponse | undefined = node;

  while (current) {
    parts.unshift(current.name);
    current = current.parentId ? facilityMap.get(current.parentId) : undefined;
  }

  return parts.join(' / ');
}

function toUserSummary(user: UserResponse): UserAssignmentUserSummary {
  return {
    id: user.id,
    username: user.username,
    email: user.email,
    prefix: user.prefix ?? null,
    firstName: user.firstName,
    lastName: user.lastName,
    displayName: buildDisplayName(user),
    companyId: user.companyId,
    companyName: user.companyName,
    isActive: user.isActive,
    createdDate: user.createdDate,
    roleNames: Array.isArray(user.roles) ? user.roles : [],
  };
}

function toCompanyOption(company: CompanyResponse) {
  return {
    id: company.id,
    code: company.code,
    name: company.name,
    isActive: company.isActive,
  };
}

function toRoleOption(role: RoleResponse): UserAssignmentRoleOption {
  return {
    id: role.id,
    code: role.code,
    name: role.name,
    description: role.description,
    isActive: role.isActive,
    permissionCount: role.permissionCount,
  };
}

async function loadFacilities(): Promise<FacilityNodeResponse[]> {
  try {
    return await scopeCatalogService.getFacilities({ includeInactive: true });
  } catch {
    return facilitiesService.getAll({ includeInactive: true });
  }
}

export async function loadUserAssignmentWorkspace(): Promise<UserAssignmentWorkspace> {
  const [users, companies, roles, facilities] = await Promise.all([
    usersService.getAll(),
    companiesService.getAll({ includeInactive: true }),
    rolesService.getAll({ includeInactive: true }),
    loadFacilities(),
  ]);

  const facilityMap = new Map<number, FacilityNodeResponse>(
    facilities.map((facility) => [facility.id, facility]),
  );

  return {
    users: users.map(toUserSummary).sort((left, right) => {
      if (left.username === right.username) {
        return left.id - right.id;
      }
      return left.username.localeCompare(right.username);
    }),
    companies: companies.map(toCompanyOption).sort(sortByName),
    roles: roles.map(toRoleOption).sort(sortByName),
    facilities: facilities
      .map((facility) => ({
        id: facility.id,
        parentId: facility.parentId,
        code: facility.code,
        name: facility.name,
        type: facility.type,
        isActive: facility.isActive,
        pathLabel: buildFacilityPathLabel(facility, facilityMap),
      }))
      .sort((left, right) => left.pathLabel.localeCompare(right.pathLabel)),
  };
}

export async function loadUserAssignmentDetail(
  userId: number,
  workspace: UserAssignmentWorkspace,
): Promise<UserAssignmentDetail> {
  const assignment = await userAssignmentsService.getByUserId(userId);
  const user =
    workspace.users.find((item) => item.id === userId) ?? null;
  if (!user) {
    throw new Error('User not found in workspace.');
  }

  const roleNameById = new Map(workspace.roles.map((role) => [role.id, role.name] as const));
  const facilityById = new Map(workspace.facilities.map((facility) => [facility.id, facility] as const));

  const resolveFarmFacility = (facilityNodeId: number | null) => {
    if (!facilityNodeId) {
      return null;
    }

    const facility = facilityById.get(facilityNodeId);
    if (!facility) {
      return null;
    }

    if (facility.type === 'farm') {
      return facility;
    }

    const parent = facility.parentId ? facilityById.get(facility.parentId) : undefined;
    if (parent?.type === 'farm') {
      return parent;
    }

    const grandParent = parent?.parentId ? facilityById.get(parent.parentId) : undefined;
    if (grandParent?.type === 'farm') {
      return grandParent;
    }

    return null;
  };

  const roleScopes = assignment.roleScopes.map((scope) => ({
    roleId: scope.roleId,
    roleName: roleNameById.get(scope.roleId) ?? scope.roleName,
    facilityNodeId: resolveFarmFacility(scope.facilityNodeId)?.id ?? null,
    facilityCode: scope.facilityCode ?? null,
    facilityName:
      resolveFarmFacility(scope.facilityNodeId)?.pathLabel ?? scope.facilityName ?? null,
    remark: scope.remark ?? null,
  })) as UserAssignmentDetail['roleScopes'];

  const roleIdsFromAssignment = Array.from(new Set(roleScopes.map((item) => item.roleId)));
  const fallbackRoleIds =
    roleIdsFromAssignment.length > 0
      ? roleIdsFromAssignment
      : user.roleNames
          .map((roleName) =>
            workspace.roles.find(
              (role) => role.name.trim().toLowerCase() === roleName.trim().toLowerCase(),
            )?.id,
          )
          .filter((roleId): roleId is number => typeof roleId === 'number' && roleId > 0);

  return {
    user,
    roleScopes:
      roleScopes.length > 0
        ? roleScopes
        : fallbackRoleIds.map((roleId) => ({
            roleId,
            roleName: roleNameById.get(roleId) ?? 'Unassigned',
            facilityNodeId: null,
            facilityName: null,
            remark: null,
          })),
    permissionOverrides: [],
  };
}

function buildRoleScopesFromState(state: UserAssignmentEditorFormState): Array<{
  roleId: number;
  facilityNodeId: number | null;
  remark?: string | null;
}> {
  const roleIds = state.selectedRoleIds.filter((roleId) => roleId > 0);
  const facilityIds = state.selectedFacilityNodeIds.filter((facilityId) => facilityId > 0);

  if (!roleIds.length) {
    return [];
  }

  if (!facilityIds.length) {
    return roleIds.map((roleId) => ({ roleId, facilityNodeId: null, remark: null }));
  }

  return roleIds.flatMap((roleId) =>
    facilityIds.map((facilityNodeId) => ({
      roleId,
      facilityNodeId,
      remark: null,
    })),
  );
}

function buildPermissionOverridesFromState(state: UserAssignmentEditorFormState): Array<{
  roleId: number;
  facilityNodeId: number | null;
  permissionId: number;
  effect: 'allow' | 'deny';
  remark?: string | null;
}> {
  const fallbackRoleId = state.selectedRoleIds.find((roleId) => roleId > 0) ?? null;
  return state.permissionOverrides.flatMap((item) => {
    const roleId = item.roleId ?? fallbackRoleId;
    if (typeof roleId !== 'number' || roleId <= 0 || !item.permissionId || item.permissionId <= 0) {
      return [];
    }

    return [
      {
        roleId,
        facilityNodeId: item.facilityNodeId,
        permissionId: item.permissionId,
        effect: item.effect,
        remark: item.note.trim() ? item.note.trim() : null,
      },
    ];
  });
}

export async function saveUserAssignment(
  payload: UserAssignmentSavePayload,
): Promise<{ userId: number }> {
  const companyId = payload.identity.companyId;
  const selectedRoleIds = payload.selectedRoleIds.filter((roleId) => roleId > 0);
  const selectedFacilityNodeIds = payload.selectedFacilityNodeIds.filter((facilityId) => facilityId > 0);

  if (payload.mode === 'create') {
    if (!payload.identity.password.trim()) {
      throw new Error('Password is required for new users.');
    }
  }

  if (companyId === null) {
    throw new Error('Please select a company.');
  }

  if (!selectedRoleIds.length) {
    throw new Error('Please select at least one role.');
  }

  const roleScopes = buildRoleScopesFromState({
    ...payload,
    selectedRoleIds,
    selectedFacilityNodeIds,
    permissionOverrides: payload.permissionOverrides,
  });
  const permissionOverrides = buildPermissionOverridesFromState({
    ...payload,
    selectedRoleIds,
    selectedFacilityNodeIds,
    permissionOverrides: payload.permissionOverrides,
  });

  let userId = payload.userId;

  if (payload.mode === 'create') {
    const created = await usersService.create({
      username: payload.identity.username.trim(),
      password: payload.identity.password,
      email: payload.identity.email.trim(),
      prefix: payload.identity.prefix.trim() || null,
      firstName: payload.identity.firstName.trim(),
      lastName: payload.identity.lastName.trim(),
      companyId,
      roleIds: selectedRoleIds,
    });
    userId = created.id;
    if (!payload.identity.isActive) {
      await usersService.update(userId, {
        isActive: false,
        roleIds: selectedRoleIds,
      });
    }
  } else if (userId) {
    await usersService.update(userId, {
      email: payload.identity.email.trim(),
      prefix: payload.identity.prefix.trim() || null,
      firstName: payload.identity.firstName.trim(),
      lastName: payload.identity.lastName.trim(),
      companyId,
      isActive: payload.identity.isActive,
      roleIds: selectedRoleIds,
    });
  }

  if (!userId) {
    throw new Error('Unable to resolve the saved user id.');
  }

  await userRolesService.setForUser(userId, { roleIds: selectedRoleIds });
  await userAssignmentsService.upsertForUser(userId, {
    roleScopes,
    permissionOverrides,
  });

  return { userId };
}

export async function deleteUserAssignment(userId: number): Promise<void> {
  await usersService.deactivate(userId);
}
