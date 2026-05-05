import { apiClient } from '@/lib/api/client';
import type { IncludeInactiveQuery, SetUserRolesRequest, UserRoleAssignRequest, UserRoleResponse } from '../types';
import { userAssignmentEndpoints, withIncludeInactive } from './user-assignment.shared';

export const userRolesService = {
  getByUserId: async (userId: number, options: IncludeInactiveQuery = {}): Promise<UserRoleResponse[]> =>
    apiClient.get<UserRoleResponse[]>(userAssignmentEndpoints.authModels.userRoles.list(userId), {
      params: withIncludeInactive(options),
    }),

  setForUser: async (userId: number, data: SetUserRolesRequest): Promise<void> =>
    apiClient.put<void>(userAssignmentEndpoints.authModels.userRoles.list(userId), data),

  assignToUser: async (userId: number, data: UserRoleAssignRequest): Promise<void> =>
    apiClient.post<void>(userAssignmentEndpoints.authModels.userRoles.list(userId), data),

  removeFromUser: async (userId: number, roleId: number): Promise<void> =>
    apiClient.delete<void>(userAssignmentEndpoints.authModels.userRoles.item(userId, roleId)),
};
