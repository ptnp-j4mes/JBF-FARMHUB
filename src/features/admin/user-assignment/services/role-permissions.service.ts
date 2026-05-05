import { apiClient } from '@/lib/api/client';
import type { IncludeInactiveQuery, RolePermissionResponse, SetRolePermissionsRequest } from '../types';
import { userAssignmentEndpoints, withIncludeInactive } from './user-assignment.shared';

export const rolePermissionsService = {
  getByRoleId: async (
    roleId: number,
    options: IncludeInactiveQuery = {},
  ): Promise<RolePermissionResponse[]> =>
    apiClient.get<RolePermissionResponse[]>(userAssignmentEndpoints.authModels.roles.permissions(roleId), {
      params: withIncludeInactive(options),
    }),

  setForRole: async (roleId: number, data: SetRolePermissionsRequest): Promise<void> =>
    apiClient.put<void>(userAssignmentEndpoints.authModels.roles.permissions(roleId), data),

  addToRole: async (roleId: number, permissionId: number): Promise<void> =>
    apiClient.post<void>(userAssignmentEndpoints.authModels.roles.permissionItem(roleId, permissionId)),

  removeFromRole: async (roleId: number, permissionId: number): Promise<void> =>
    apiClient.delete<void>(userAssignmentEndpoints.authModels.roles.permissionItem(roleId, permissionId)),
};
