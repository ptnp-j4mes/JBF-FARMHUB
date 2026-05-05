/**
 * Common Types - Shared across all features
 * 
 * This file contains base types and utility types used throughout the application.
 * These types match the backend C# models and provide type safety for API interactions.
 */

/**
 * Base Entity - Matches backend BaseEntity.cs
 * All entity models extend this interface
 */
export interface BaseEntity {
  id: number;
  createdDate: string; // ISO 8601 date string
  createdBy: string;
  updatedDate: string | null;
  updatedBy: string | null;
  isActive: boolean;
}

/**
 * Audit Log - Matches backend AuditLog.cs
 */
export interface AuditLog {
  id: number;
  userId: string | null;
  userDisplayName: string;
  type: 'Create' | 'Update' | 'Delete';
  tableName: string;
  dateTime: string;
  oldValues: string | null;
  newValues: string | null;
  affectedColumns: string | null;
  primaryKey: string;
}

/**
 * Paginated Response - Generic wrapper for paginated API responses
 */
export interface PaginatedResponse<T> {
  items: T[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

/**
 * API Response - Generic wrapper for API responses
 */
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  errors?: string[];
}

/**
 * API Error Response
 */
export interface ApiError {
  message: string;
  statusCode: number;
  errors?: Record<string, string[]>;
}

/**
 * Select Option - For dropdowns and select inputs
 */
export interface SelectOption<T = string | number> {
  label: string;
  value: T;
  disabled?: boolean;
}

/**
 * Sort Order
 */
export type SortOrder = 'asc' | 'desc';

/**
 * Sort Configuration
 */
export interface SortConfig {
  field: string;
  order: SortOrder;
}

/**
 * Filter Configuration
 */
export interface FilterConfig {
  field: string;
  operator: 'eq' | 'ne' | 'gt' | 'gte' | 'lt' | 'lte' | 'contains' | 'startsWith' | 'endsWith';
  value: unknown;
}

/**
 * Query Parameters for list endpoints
 */
export interface QueryParams {
  pageNumber?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: SortOrder;
  search?: string;
  filters?: FilterConfig[];
}
