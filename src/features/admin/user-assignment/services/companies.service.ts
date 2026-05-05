import { apiClient } from '@/lib/api/client';
import type { CompanyResponse, CompanyUpsertRequest, IncludeInactiveQuery } from '../types';
import { userAssignmentEndpoints, withIncludeInactive } from './user-assignment.shared';

export const companiesService = {
  getAll: async (options: IncludeInactiveQuery = {}): Promise<CompanyResponse[]> =>
    apiClient.get<CompanyResponse[]>(userAssignmentEndpoints.authModels.companies.list, {
      params: withIncludeInactive(options),
    }),

  getById: async (id: number, options: IncludeInactiveQuery = {}): Promise<CompanyResponse> =>
    apiClient.get<CompanyResponse>(userAssignmentEndpoints.authModels.companies.detail(id), {
      params: withIncludeInactive(options),
    }),

  create: async (data: CompanyUpsertRequest): Promise<CompanyResponse> =>
    apiClient.post<CompanyResponse>(userAssignmentEndpoints.authModels.companies.list, data),

  update: async (id: number, data: CompanyUpsertRequest): Promise<void> =>
    apiClient.put<void>(userAssignmentEndpoints.authModels.companies.detail(id), data),

  setStatus: async (id: number, isActive: boolean): Promise<void> =>
    apiClient.patch<void>(userAssignmentEndpoints.authModels.companies.status(id), { isActive }),

  deactivate: async (id: number): Promise<void> =>
    apiClient.delete<void>(userAssignmentEndpoints.authModels.companies.detail(id)),
};
