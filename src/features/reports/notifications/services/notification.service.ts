/**
 * Reports Module - Notification Service
 * 
 * API service for notification management
 */

import { apiClient } from '@/lib/api/client';
import type {
  NotificationResponse,
  NotificationListResponse,
  MarkAsReadRequest,
} from '../types';

const BASE_URL = '/api/Notifications';

export const notificationService = {
  /**
   * Get all notifications for current user
   */
  getAll: async (): Promise<NotificationListResponse> => {
    return apiClient.get<NotificationListResponse>(BASE_URL);
  },

  /**
   * Get unread notifications
   */
  getUnread: async (): Promise<NotificationResponse[]> => {
    return apiClient.get<NotificationResponse[]>(`${BASE_URL}/unread`);
  },

  /**
   * Get notification by ID
   */
  getById: async (id: number): Promise<NotificationResponse> => {
    return apiClient.get<NotificationResponse>(`${BASE_URL}/${id}`);
  },

  /**
   * Mark notification as read
   */
  markAsRead: async (id: number): Promise<void> => {
    await apiClient.post<void>(`${BASE_URL}/${id}/read`);
  },

  /**
   * Mark multiple notifications as read
   */
  markMultipleAsRead: async (data: MarkAsReadRequest): Promise<void> => {
    await apiClient.post<void>(`${BASE_URL}/mark-read`, data);
  },

  /**
   * Mark all as read
   */
  markAllAsRead: async (): Promise<void> => {
    await apiClient.post<void>(`${BASE_URL}/mark-all-read`);
  },

  /**
   * Delete notification
   */
  delete: async (id: number): Promise<void> => {
    await apiClient.delete<void>(`${BASE_URL}/${id}`);
  },

  /**
   * Get unread count
   */
  getUnreadCount: async (): Promise<number> => {
    const response = await apiClient.get<{ count: number }>(`${BASE_URL}/unread-count`);
    return response.count;
  },
};
