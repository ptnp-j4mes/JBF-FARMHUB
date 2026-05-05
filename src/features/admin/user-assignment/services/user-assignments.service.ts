import { apiClient } from '@/lib/api/client';
import type {
  AccessPreviewRequest,
  AccessPreviewResponse,
  UserAssignmentAggregateResponse,
  UserAssignmentAggregateUpsertRequest,
  UserAssignmentPermissionQueryRequest,
  UserAssignmentPermissionQueryResponse,
} from '../types';
import { userAssignmentEndpoints } from './user-assignment.shared';

export const userAssignmentsService = {
  getByUserId: async (userId: number): Promise<UserAssignmentAggregateResponse> =>
    apiClient.get<UserAssignmentAggregateResponse>(userAssignmentEndpoints.authModels.userAssignment(userId)),

  upsertForUser: async (
    userId: number,
    data: UserAssignmentAggregateUpsertRequest,
  ): Promise<void> =>
    apiClient.put<void>(userAssignmentEndpoints.authModels.userAssignment(userId), data),

  getSummary: async (): Promise<UserAssignmentAggregateResponse[]> =>
    apiClient.get<UserAssignmentAggregateResponse[]>(userAssignmentEndpoints.authModels.assignmentsSummary),

  previewAccess: async (data: AccessPreviewRequest): Promise<AccessPreviewResponse> =>
    apiClient.post<AccessPreviewResponse>(userAssignmentEndpoints.authModels.accessPreview, data),

  queryPermissions: async (
    userId: number,
    data: UserAssignmentPermissionQueryRequest,
  ): Promise<UserAssignmentPermissionQueryResponse> =>
    apiClient.post<UserAssignmentPermissionQueryResponse>(
      userAssignmentEndpoints.authModels.userAssignment(userId),
      data,
    ),
};
