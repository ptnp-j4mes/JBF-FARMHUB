/**
 * Production Module - Open House Service
 * 
 * API service for open house management
 */

import axiosInstance from '@/lib/axios';
import type {
  OpenHouseRequest,
  OpenHouseResponse,
} from '../types';

const BASE_URL = '/api/OpenHouse';

export const openhouseService = {
  /**
   * Get all open house records
   */
  getAll: async (): Promise<OpenHouseResponse[]> => {
    const response = await axiosInstance.get<OpenHouseResponse[]>(BASE_URL);
    return response.data;
  },

  /**
   * Get open house record by ID
   */
  getById: async (id: number): Promise<OpenHouseResponse> => {
    const response = await axiosInstance.get<OpenHouseResponse>(`${BASE_URL}/${id}`);
    return response.data;
  },

  /**
   * Get open house records by facility
   */
  getByFacility: async (facilityId: number): Promise<OpenHouseResponse[]> => {
    const response = await axiosInstance.get<OpenHouseResponse[]>(`${BASE_URL}/facility/${facilityId}`);
    return response.data;
  },

  /**
   * Create open house record
   */
  create: async (data: OpenHouseRequest): Promise<OpenHouseResponse> => {
    const response = await axiosInstance.post<OpenHouseResponse>(BASE_URL, data);
    return response.data;
  },

  /**
   * Update open house record
   */
  update: async (id: number, data: OpenHouseRequest): Promise<OpenHouseResponse> => {
    const response = await axiosInstance.put<OpenHouseResponse>(`${BASE_URL}/${id}`, data);
    return response.data;
  },

  /**
   * Delete open house record
   */
  delete: async (id: number): Promise<void> => {
    await axiosInstance.delete(`${BASE_URL}/${id}`);
  },

  /**
   * Mark as ready
   */
  markAsReady: async (id: number): Promise<OpenHouseResponse> => {
    const response = await axiosInstance.post<OpenHouseResponse>(`${BASE_URL}/${id}/ready`);
    return response.data;
  },

  /**
   * Mark as occupied
   */
  markAsOccupied: async (id: number): Promise<OpenHouseResponse> => {
    const response = await axiosInstance.post<OpenHouseResponse>(`${BASE_URL}/${id}/occupied`);
    return response.data;
  },
};
