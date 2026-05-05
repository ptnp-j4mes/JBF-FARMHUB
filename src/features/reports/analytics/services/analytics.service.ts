import { apiClient } from '@/lib/api/client';
import type { AnalyticsFilters, AnalyticsOverviewResponse } from '../types';

const BASE_URL = '/api/Operations/Analytics/overview';

export const analyticsService = {
  getOverview: async (filters?: AnalyticsFilters): Promise<AnalyticsOverviewResponse> => {
    return apiClient.get<AnalyticsOverviewResponse>(BASE_URL, {
      params: filters,
    });
  },
};
