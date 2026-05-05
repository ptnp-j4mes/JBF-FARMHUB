/**
 * Production Module - Construction Service
 * 
 * API service for construction project management
 */

import axiosInstance from '@/lib/axios';
import type {
  ConstructionRequest,
  ConstructionResponse,
} from '../types';

const BASE_URL = '/api/Construction';

export const constructionService = {
  /**
   * Get all construction projects
   */
  getAll: async (): Promise<ConstructionResponse[]> => {
    const response = await axiosInstance.get<ConstructionResponse[]>(BASE_URL);
    return response.data;
  },

  /**
   * Get construction project by ID
   */
  getById: async (id: number): Promise<ConstructionResponse> => {
    const response = await axiosInstance.get<ConstructionResponse>(`${BASE_URL}/${id}`);
    return response.data;
  },

  /**
   * Get construction projects by status
   */
  getByStatus: async (status: string): Promise<ConstructionResponse[]> => {
    const response = await axiosInstance.get<ConstructionResponse[]>(`${BASE_URL}/status/${status}`);
    return response.data;
  },

  /**
   * Create construction project
   */
  create: async (data: ConstructionRequest): Promise<ConstructionResponse> => {
    const response = await axiosInstance.post<ConstructionResponse>(BASE_URL, data);
    return response.data;
  },

  /**
   * Update construction project
   */
  update: async (id: number, data: ConstructionRequest): Promise<ConstructionResponse> => {
    const response = await axiosInstance.put<ConstructionResponse>(`${BASE_URL}/${id}`, data);
    return response.data;
  },

  /**
   * Delete construction project
   */
  delete: async (id: number): Promise<void> => {
    await axiosInstance.delete(`${BASE_URL}/${id}`);
  },

  /**
   * Start project
   */
  start: async (id: number): Promise<ConstructionResponse> => {
    const response = await axiosInstance.post<ConstructionResponse>(`${BASE_URL}/${id}/start`);
    return response.data;
  },

  /**
   * Complete project
   */
  complete: async (id: number): Promise<ConstructionResponse> => {
    const response = await axiosInstance.post<ConstructionResponse>(`${BASE_URL}/${id}/complete`);
    return response.data;
  },

  /**
   * Cancel project
   */
  cancel: async (id: number): Promise<ConstructionResponse> => {
    const response = await axiosInstance.post<ConstructionResponse>(`${BASE_URL}/${id}/cancel`);
    return response.data;
  },
};
