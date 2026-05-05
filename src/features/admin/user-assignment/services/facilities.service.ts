import { apiClient } from '@/lib/api/client';
import type {
  FacilitiesQuery,
  FacilityNodeRequest,
  FacilityNodeResponse,
  FacilityTreeResponse,
  IncludeInactiveQuery,
} from '../types';
import { userAssignmentEndpoints, withIncludeInactive } from './user-assignment.shared';

function withFacilitiesQuery(query: FacilitiesQuery = {}): { type?: string; includeInactive?: boolean } {
  return {
    ...(query.type ? { type: query.type } : {}),
    ...(query.includeInactive !== undefined ? { includeInactive: query.includeInactive } : {}),
  };
}

export const facilitiesService = {
  getAll: async (query: FacilitiesQuery = {}): Promise<FacilityNodeResponse[]> =>
    apiClient.get<FacilityNodeResponse[]>(userAssignmentEndpoints.facilities.list, {
      params: withFacilitiesQuery(query),
    }),

  getTree: async (): Promise<FacilityTreeResponse[]> =>
    apiClient.get<FacilityTreeResponse[]>(userAssignmentEndpoints.facilities.tree),

  getById: async (id: number, options: IncludeInactiveQuery = {}): Promise<FacilityNodeResponse> =>
    apiClient.get<FacilityNodeResponse>(userAssignmentEndpoints.facilities.detail(id), {
      params: withIncludeInactive(options),
    }),

  create: async (data: FacilityNodeRequest): Promise<FacilityNodeResponse> =>
    apiClient.post<FacilityNodeResponse>(userAssignmentEndpoints.facilities.list, data),

  update: async (id: number, data: FacilityNodeRequest): Promise<void> =>
    apiClient.put<void>(userAssignmentEndpoints.facilities.detail(id), data),

  setStatus: async (id: number, isActive: boolean): Promise<void> =>
    apiClient.patch<void>(userAssignmentEndpoints.facilities.status(id), { isActive }),

  deactivate: async (id: number): Promise<void> => {
    try {
      await apiClient.delete<void>(userAssignmentEndpoints.facilities.hardDetail(id));
      return;
    } catch (error: unknown) {
      const statusCode =
        typeof error === 'object' && error !== null
          ? ((error as { status?: number }).status ??
              (error as { response?: { status?: number } }).response?.status)
          : undefined;
      if (statusCode !== 400 && statusCode !== 404 && statusCode !== 405) {
        throw error;
      }
    }

    await apiClient.delete<void>(userAssignmentEndpoints.facilities.detail(id));
  },
};
