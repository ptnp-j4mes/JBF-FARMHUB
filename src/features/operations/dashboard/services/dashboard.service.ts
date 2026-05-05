import { apiClient } from '@/lib/api/client';
import type { CommandCenterFilters, CommandCenterResponse } from '../types';

const BASE_URL = '/api/Operations/Dashboard';

export const dashboardService = {
  getCommandCenter: async (filters?: CommandCenterFilters): Promise<CommandCenterResponse> => {
    return apiClient.get<CommandCenterResponse>(`${BASE_URL}/command-center`, {
      params: filters,
    });
  },
};
