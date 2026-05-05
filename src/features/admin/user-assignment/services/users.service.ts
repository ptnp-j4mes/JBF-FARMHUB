import { apiClient } from '@/lib/api/client';
import type {
  CreateUserRequest,
  ResetPasswordRequest,
  ResetPasswordResponse,
  UpdateUserRequest,
  UserResponse,
} from '../types';
import { userAssignmentEndpoints } from './user-assignment.shared';

export const usersService = {
  getAll: async (): Promise<UserResponse[]> =>
    apiClient.get<UserResponse[]>(userAssignmentEndpoints.users.list),

  getById: async (id: number): Promise<UserResponse> =>
    apiClient.get<UserResponse>(userAssignmentEndpoints.users.detail(id)),

  create: async (data: CreateUserRequest): Promise<UserResponse> =>
    apiClient.post<UserResponse>(userAssignmentEndpoints.users.list, data),

  update: async (id: number, data: UpdateUserRequest): Promise<void> =>
    apiClient.put<void>(userAssignmentEndpoints.users.detail(id), data),

  deactivate: async (id: number): Promise<void> =>
    apiClient.delete<void>(userAssignmentEndpoints.users.detail(id)),

  resetPassword: async (id: number, data: ResetPasswordRequest): Promise<ResetPasswordResponse> =>
    apiClient.post<ResetPasswordResponse>(userAssignmentEndpoints.users.resetPassword(id), data),
};
