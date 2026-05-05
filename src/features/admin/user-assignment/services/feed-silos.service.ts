import { apiClient } from '@/lib/api/client';
import type { FeedSiloResponse, FeedSiloUpsertRequest, IncludeInactiveQuery } from '../types';
import { userAssignmentEndpoints, withIncludeInactive } from './user-assignment.shared';

export const feedSilosService = {
  getAll: async (options: IncludeInactiveQuery = {}): Promise<FeedSiloResponse[]> =>
    apiClient.get<FeedSiloResponse[]>(userAssignmentEndpoints.feedSilos.list, {
      params: withIncludeInactive(options),
    }),

  getById: async (id: number, options: IncludeInactiveQuery = {}): Promise<FeedSiloResponse> =>
    apiClient.get<FeedSiloResponse>(userAssignmentEndpoints.feedSilos.detail(id), {
      params: withIncludeInactive(options),
    }),

  create: async (data: FeedSiloUpsertRequest): Promise<FeedSiloResponse> =>
    apiClient.post<FeedSiloResponse>(userAssignmentEndpoints.feedSilos.list, data),

  update: async (id: number, data: FeedSiloUpsertRequest): Promise<void> =>
    apiClient.put<void>(userAssignmentEndpoints.feedSilos.detail(id), data),

  setStatus: async (id: number, isActive: boolean): Promise<void> =>
    apiClient.patch<void>(userAssignmentEndpoints.feedSilos.status(id), { isActive }),

  deactivate: async (id: number): Promise<void> =>
    apiClient.delete<void>(userAssignmentEndpoints.feedSilos.detail(id)),
};
