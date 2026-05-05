/**
 * Operations Module - Facility Service
 * 
 * API service for facility management
 */

import { apiClient } from '@/lib/api/client';
import type {
  FacilityNodeRequest,
  FacilityNodeResponse,
  FacilityTreeResponse,
} from '../types';

const BASE_URL = '/api/Facilities';

export const facilityService = {
  /**
   * Get all facilities as tree structure
   */
  getTree: async (): Promise<FacilityTreeResponse> => {
    return apiClient.get<FacilityTreeResponse>(`${BASE_URL}/tree`);
  },

  /**
   * Get all facilities (flat list)
   */
  getAll: async (): Promise<FacilityNodeResponse[]> => {
    return apiClient.get<FacilityNodeResponse[]>(BASE_URL);
  },

  /**
   * Get facility by ID
   */
  getById: async (id: number): Promise<FacilityNodeResponse> => {
    return apiClient.get<FacilityNodeResponse>(`${BASE_URL}/${id}`);
  },

  /**
   * Get children of a facility
   */
  getChildren: async (parentId: number): Promise<FacilityNodeResponse[]> => {
    return apiClient.get<FacilityNodeResponse[]>(`${BASE_URL}/${parentId}/children`);
  },

  /**
   * Create new facility
   */
  create: async (data: FacilityNodeRequest): Promise<FacilityNodeResponse> => {
    return apiClient.post<FacilityNodeResponse>(BASE_URL, data);
  },

  /**
   * Update facility
   */
  update: async (id: number, data: FacilityNodeRequest): Promise<FacilityNodeResponse> => {
    return apiClient.put<FacilityNodeResponse>(`${BASE_URL}/${id}`, data);
  },

  /**
   * Delete facility
   */
  delete: async (id: number): Promise<void> => {
    await apiClient.delete<void>(`${BASE_URL}/${id}`);
  },
};
