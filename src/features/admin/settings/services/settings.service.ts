/**
 * Admin Module - Settings Service
 * 
 * API service for system settings management
 */

import { apiClient } from '@/lib/api/client';
import type {
  SystemSettings,
  UpdateSettingsRequest,
} from '../types';

const BASE_URL = '/api/Settings';

export const settingsService = {
  /**
   * Get all system settings
   */
  getAll: async (): Promise<SystemSettings> => {
    return apiClient.get<SystemSettings>(BASE_URL);
  },

  /**
   * Update system settings
   */
  update: async (data: UpdateSettingsRequest): Promise<SystemSettings> => {
    return apiClient.put<SystemSettings>(BASE_URL, data);
  },

  /**
   * Get general settings
   */
  getGeneral: async () => {
    return apiClient.get(`${BASE_URL}/general`);
  },

  /**
   * Get security settings
   */
  getSecurity: async () => {
    return apiClient.get(`${BASE_URL}/security`);
  },

  /**
   * Get notification settings
   */
  getNotification: async () => {
    return apiClient.get(`${BASE_URL}/notification`);
  },

  /**
   * Get display settings
   */
  getDisplay: async () => {
    return apiClient.get(`${BASE_URL}/display`);
  },
};
