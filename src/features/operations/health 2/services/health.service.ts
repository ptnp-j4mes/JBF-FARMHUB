/**
 * Operations Module - Health Service
 * 
 * API service for health and treatment management
 */

import axiosInstance from '@/lib/axios';
import type {
  HealthRequest,
  HealthResponse,
  HealthSummary,
} from '../types';

const BASE_URL = '/api/Health';

export const healthService = {
  /**
   * Get all health records
   */
  getAll: async (): Promise<HealthResponse[]> => {
    const response = await axiosInstance.get<HealthResponse[]>(BASE_URL);
    return response.data;
  },

  /**
   * Get health record by ID
   */
  getById: async (id: number): Promise<HealthResponse> => {
    const response = await axiosInstance.get<HealthResponse>(`${BASE_URL}/${id}`);
    return response.data;
  },

  /**
   * Get health records by pig ID
   */
  getByPigId: async (pigId: string): Promise<HealthResponse[]> => {
    const response = await axiosInstance.get<HealthResponse[]>(`${BASE_URL}/pig/${pigId}`);
    return response.data;
  },

  /**
   * Get health records by facility
   */
  getByFacility: async (facilityId: number): Promise<HealthResponse[]> => {
    const response = await axiosInstance.get<HealthResponse[]>(`${BASE_URL}/facility/${facilityId}`);
    return response.data;
  },

  /**
   * Get health summary
   */
  getSummary: async (): Promise<HealthSummary> => {
    const response = await axiosInstance.get<HealthSummary>(`${BASE_URL}/summary`);
    return response.data;
  },

  /**
   * Create health record
   */
  create: async (data: HealthRequest): Promise<HealthResponse> => {
    const response = await axiosInstance.post<HealthResponse>(BASE_URL, data);
    return response.data;
  },

  /**
   * Update health record
   */
  update: async (id: number, data: HealthRequest): Promise<HealthResponse> => {
    const response = await axiosInstance.put<HealthResponse>(`${BASE_URL}/${id}`, data);
    return response.data;
  },

  /**
   * Delete health record
   */
  delete: async (id: number): Promise<void> => {
    await axiosInstance.delete(`${BASE_URL}/${id}`);
  },

  /**
   * Get active cases
   */
  getActiveCases: async (): Promise<HealthResponse[]> => {
    const response = await axiosInstance.get<HealthResponse[]>(`${BASE_URL}/active-cases`);
    return response.data;
  },
};
