import { apiClient } from '@/lib/api/client';
import type { IncludeInactiveQuery, RoleResponse, RoleUpsertRequest } from '../types';
import { normalizeRoleResponse, userAssignmentEndpoints, withIncludeInactive } from './user-assignment.shared';

export const rolesService = {
  getAll: async (options: IncludeInactiveQuery = {}): Promise<RoleResponse[]> =>
    apiClient
      .get<RoleResponse[]>(userAssignmentEndpoints.authModels.roles.list, {
        params: withIncludeInactive(options),
      })
      .then((roles) => roles.map((role) => normalizeRoleResponse(role))),

  getById: async (id: number, options: IncludeInactiveQuery = {}): Promise<RoleResponse> =>
    apiClient
      .get<RoleResponse>(userAssignmentEndpoints.authModels.roles.detail(id), {
        params: withIncludeInactive(options),
      })
      .then((role) => normalizeRoleResponse(role)),

  create: async (data: RoleUpsertRequest): Promise<RoleResponse> =>
    apiClient
      .post<RoleResponse>(userAssignmentEndpoints.authModels.roles.list, data)
      .then((role) => normalizeRoleResponse(role)),

  update: async (id: number, data: RoleUpsertRequest): Promise<void> =>
    apiClient.put<void>(userAssignmentEndpoints.authModels.roles.detail(id), data),

  setStatus: async (id: number, isActive: boolean): Promise<void> =>
    apiClient.patch<void>(userAssignmentEndpoints.authModels.roles.status(id), { isActive }),

  deactivate: async (id: number): Promise<void> =>
    apiClient.delete<void>(userAssignmentEndpoints.authModels.roles.detail(id)),
};
