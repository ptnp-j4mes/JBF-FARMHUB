/**
 * Reports Module - Notification Types
 * 
 * Types for notification management
 * Matches backend Models/MasterData/Notification.cs
 */

import type { BaseEntity } from '@/types';

/**
 * Notification - Matches backend Notification.cs
 */
export interface Notification extends BaseEntity {
  title: string;
  message: string;
  userId: number;
  isRead: boolean;
  relatedEntityId?: number;
  relatedEntityType?: string;
  notificationType: NotificationType;
  priority: NotificationPriority;
}

/**
 * Notification Type
 */
export enum NotificationType {
  System = 'System',
  Approval = 'Approval',
  Alert = 'Alert',
  Reminder = 'Reminder',
  Info = 'Info',
}

/**
 * Notification Priority
 */
export enum NotificationPriority {
  Low = 'Low',
  Normal = 'Normal',
  High = 'High',
  Urgent = 'Urgent',
}

/**
 * Notification Response
 */
export interface NotificationResponse {
  id: number;
  title: string;
  message: string;
  isRead: boolean;
  notificationType: string;
  priority: string;
  relatedEntityType?: string;
  relatedEntityId?: number;
  createdDate: string;
}

/**
 * Notification List Response
 */
export interface NotificationListResponse {
  items: NotificationResponse[];
  totalCount: number;
  unreadCount: number;
}

/**
 * Mark as Read Request
 */
export interface MarkAsReadRequest {
  notificationIds: number[];
}

/**
 * Notification Settings
 */
export interface NotificationSettings {
  emailEnabled: boolean;
  pushEnabled: boolean;
  smsEnabled: boolean;
  notificationTypes: Array<{
    type: NotificationType;
    enabled: boolean;
    channels: ('email' | 'push' | 'sms')[];
  }>;
}
