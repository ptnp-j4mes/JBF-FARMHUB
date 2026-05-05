import { apiClient } from '@/lib/api/client';
import type { IncludeInactiveQuery, MenuTreeGroupResponse } from '../types';
import { userAssignmentEndpoints, withIncludeInactive } from './user-assignment.shared';

export const permissionMenusService = {
  getTree: async (options: IncludeInactiveQuery = {}): Promise<MenuTreeGroupResponse[]> =>
    apiClient.get<MenuTreeGroupResponse[]>(userAssignmentEndpoints.permissionMenus.tree, {
      params: withIncludeInactive(options),
    }),
};
