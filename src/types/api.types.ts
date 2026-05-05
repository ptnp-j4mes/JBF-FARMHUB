/**
 * API Utility Types
 * 
 * Types specific to API interactions and HTTP requests
 */

import type { AxiosRequestConfig } from 'axios';

/**
 * HTTP Methods
 */
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

/**
 * API Request Config - Extends Axios config with custom properties
 */
export interface ApiRequestConfig extends AxiosRequestConfig {
  skipAuth?: boolean; // Skip authentication for this request
  skipErrorHandling?: boolean; // Skip global error handling
}

/**
 * API Endpoint Configuration
 */
export interface ApiEndpoint {
  method: HttpMethod;
  url: string;
  config?: ApiRequestConfig;
}

/**
 * Upload Progress Event
 */
export interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

/**
 * File Upload Response
 */
export interface FileUploadResponse {
  fileName: string;
  fileUrl: string;
  fileSize: number;
  mimeType: string;
}

/**
 * Batch Operation Request
 */
export interface BatchOperationRequest<T> {
  items: T[];
  operation: 'create' | 'update' | 'delete';
}

/**
 * Batch Operation Response
 */
export interface BatchOperationResponse {
  successCount: number;
  failureCount: number;
  errors: Array<{
    index: number;
    message: string;
  }>;
}
