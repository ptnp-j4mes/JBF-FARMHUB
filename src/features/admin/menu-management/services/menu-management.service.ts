import { apiClient } from '@/lib/api/client';
import type {
  MenuGroupResponse,
  MenuListResponse,
  MenuListUpsertRequest,
} from '../types';

const MENU_MODELS_URL = '/api/MenuModels';

export const menuManagementEndpoints = {
  groups: `${MENU_MODELS_URL}/groups`,
  lists: `${MENU_MODELS_URL}/lists`,
  listDetail: (id: number) => `${MENU_MODELS_URL}/lists/${id}`,
} as const;

export const menuManagementService = {
  getGroups: async (options: { includeInactive?: boolean } = {}): Promise<MenuGroupResponse[]> => {
    return apiClient.get<MenuGroupResponse[]>(menuManagementEndpoints.groups, { params: options });
  },

  getLists: async (
    params: { includeInactive?: boolean; menuGroupId?: number } = {},
  ): Promise<MenuListResponse[]> => {
    return apiClient.get<MenuListResponse[]>(menuManagementEndpoints.lists, { params });
  },

  createList: async (data: MenuListUpsertRequest): Promise<MenuListResponse> => {
    return apiClient.post<MenuListResponse>(menuManagementEndpoints.lists, data);
  },

  updateList: async (id: number, data: MenuListUpsertRequest): Promise<void> => {
    await apiClient.put(menuManagementEndpoints.listDetail(id), data);
  },

  deactivateList: async (id: number): Promise<void> => {
    await apiClient.delete(menuManagementEndpoints.listDetail(id));
  },
} as const;
