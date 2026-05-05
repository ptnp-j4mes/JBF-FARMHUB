/**
 * Reports Module - Approval Service
 * 
 * API service for approval workflow management
 */

import { apiClient } from '@/lib/api/client';
import type {
  ApprovalActionRequest,
  ApprovalRequestResponse,
  ApprovalListResponse,
} from '../types';

const BASE_URL = '/api/Approvals';

export const approvalService = {
  /**
   * Get all approval requests
   */
  getAll: async (): Promise<ApprovalListResponse> => {
    return apiClient.get<ApprovalListResponse>(BASE_URL);
  },

  /**
   * Get approval request by ID
   */
  getById: async (id: number): Promise<ApprovalRequestResponse> => {
    return apiClient.get<ApprovalRequestResponse>(`${BASE_URL}/${id}`);
  },

  /**
   * Get pending approvals for current user
   */
  getPending: async (): Promise<ApprovalRequestResponse[]> => {
    return apiClient.get<ApprovalRequestResponse[]>(`${BASE_URL}/pending`);
  },

  /**
   * Get approval history
   */
  getHistory: async (): Promise<ApprovalRequestResponse[]> => {
    return apiClient.get<ApprovalRequestResponse[]>(`${BASE_URL}/history`);
  },

  /**
   * Get document approval history
   */
  getDocumentHistory: async (documentType: string, documentId: number): Promise<any> => {
    const response = await axiosInstance.get(`${BASE_URL}/${documentType}/${documentId}/history`);
    return response.data;
  },

  /**
   * Approve request
   */
  approve: async (id: number, data: ApprovalActionRequest): Promise<ApprovalRequestResponse> => {
    return apiClient.post<ApprovalRequestResponse>(`${BASE_URL}/${id}/approve`, data);
  },

  /**
   * Reject request
   */
  reject: async (id: number, data: ApprovalActionRequest): Promise<ApprovalRequestResponse> => {
    return apiClient.post<ApprovalRequestResponse>(`${BASE_URL}/${id}/reject`, data);
  },

  /**
   * Return request
   */
  return: async (id: number, data: ApprovalActionRequest): Promise<ApprovalRequestResponse> => {
    return apiClient.post<ApprovalRequestResponse>(`${BASE_URL}/${id}/return`, data);
  },
};
