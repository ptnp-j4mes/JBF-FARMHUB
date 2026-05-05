/**
 * Reports Module - Report Service
 * 
 * API service for report generation and management
 */

import { apiClient } from '@/lib/api/client';
import type {
  ReportDefinition,
  ReportRequest,
  ReportResponse,
  ReportHistoryListResponse,
  ScheduledReport,
} from '../types';

const BASE_URL = '/api/Reports';

export const reportService = {
  /**
   * Get all available report definitions
   */
  getDefinitions: async (): Promise<ReportDefinition[]> => {
    return apiClient.get<ReportDefinition[]>(`${BASE_URL}/definitions`);
  },

  /**
   * Get report definition by ID
   */
  getDefinition: async (reportId: string): Promise<ReportDefinition> => {
    return apiClient.get<ReportDefinition>(`${BASE_URL}/definitions/${reportId}`);
  },

  /**
   * Generate report
   */
  generate: async (data: ReportRequest): Promise<ReportResponse> => {
    return apiClient.post<ReportResponse>(`${BASE_URL}/generate`, data);
  },

  /**
   * Download report
   */
  download: async (reportId: string, fileUrl: string): Promise<Blob> => {
    return apiClient.get<Blob>(fileUrl, {
      responseType: 'blob',
    });
  },

  /**
   * Get report history
   */
  getHistory: async (): Promise<ReportHistoryListResponse> => {
    return apiClient.get<ReportHistoryListResponse>(`${BASE_URL}/history`);
  },

  /**
   * Delete report from history
   */
  deleteHistory: async (id: number): Promise<void> => {
    await apiClient.delete<void>(`${BASE_URL}/history/${id}`);
  },

  /**
   * Get scheduled reports
   */
  getScheduled: async (): Promise<ScheduledReport[]> => {
    return apiClient.get<ScheduledReport[]>(`${BASE_URL}/scheduled`);
  },

  /**
   * Create scheduled report
   */
  createSchedule: async (data: Omit<ScheduledReport, 'id' | 'lastRunDate' | 'nextRunDate'>): Promise<ScheduledReport> => {
    return apiClient.post<ScheduledReport>(`${BASE_URL}/scheduled`, data);
  },

  /**
   * Update scheduled report
   */
  updateSchedule: async (id: number, data: Partial<ScheduledReport>): Promise<ScheduledReport> => {
    return apiClient.put<ScheduledReport>(`${BASE_URL}/scheduled/${id}`, data);
  },

  /**
   * Delete scheduled report
   */
  deleteSchedule: async (id: number): Promise<void> => {
    await apiClient.delete<void>(`${BASE_URL}/scheduled/${id}`);
  },
};
