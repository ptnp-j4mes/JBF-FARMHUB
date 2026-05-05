import { apiClient } from '@/lib/api/client';
import type { IncludeInactiveQuery, PermissionResponse, PermissionUpsertRequest } from '../types';
import { normalizePermissionResponse, userAssignmentEndpoints, withIncludeInactive } from './user-assignment.shared';

export const permissionsService = {
  getAll: async (options: IncludeInactiveQuery = {}): Promise<PermissionResponse[]> =>
    apiClient
      .get<PermissionResponse[]>(userAssignmentEndpoints.authModels.permissions.list, {
        params: withIncludeInactive(options),
      })
      .then((permissions) => permissions.map((permission) => normalizePermissionResponse(permission))),

  getById: async (id: number, options: IncludeInactiveQuery = {}): Promise<PermissionResponse> =>
    apiClient
      .get<PermissionResponse>(userAssignmentEndpoints.authModels.permissions.detail(id), {
        params: withIncludeInactive(options),
      })
      .then((permission) => normalizePermissionResponse(permission)),

  create: async (data: PermissionUpsertRequest): Promise<PermissionResponse> =>
    apiClient
      .post<PermissionResponse>(userAssignmentEndpoints.authModels.permissions.list, data)
      .then((permission) => normalizePermissionResponse(permission)),

  update: async (id: number, data: PermissionUpsertRequest): Promise<void> =>
    apiClient.put<void>(userAssignmentEndpoints.authModels.permissions.detail(id), data),

  setStatus: async (id: number, isActive: boolean): Promise<void> =>
    apiClient.patch<void>(userAssignmentEndpoints.authModels.permissions.status(id), { isActive }),

  deactivate: async (id: number): Promise<void> =>
    apiClient.delete<void>(userAssignmentEndpoints.authModels.permissions.detail(id)),
};
