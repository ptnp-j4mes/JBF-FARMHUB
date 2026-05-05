/**
 * Production Module - Purchase Service
 * 
 * API service for purchase request management
 */

import axiosInstance from '@/lib/axios';
import type {
  ApprovalPendingItem,
  CreatePurchaseRequest,
  PurchaseRequestCreateOptionsResponse,
  PurchaseRequestListResponse,
  PurchaseRequestResponse,
} from '../types';

const BASE_URL = '/api/PurchaseRequests';

export const purchaseService = {
  /**
   * Get my purchase requests (current user)
   */
  getAll: async (params?: { facilityId?: number; facilityCode?: string }): Promise<{ items: PurchaseRequestResponse[] }> => {
    const response = await axiosInstance.get<PurchaseRequestResponse[]>(`${BASE_URL}/my`, {
      params,
    });
    // Wrap in items array to match expected response format
    return { items: response.data };
  },

  /**
   * Get purchase request by ID
   */
  getById: async (id: number): Promise<PurchaseRequestResponse> => {
    const response = await axiosInstance.get<PurchaseRequestResponse>(`${BASE_URL}/${id}`);
    return response.data;
  },

  /**
   * Create purchase request
   */
  create: async (data: CreatePurchaseRequest): Promise<PurchaseRequestResponse> => {
    const response = await axiosInstance.post<PurchaseRequestResponse>(BASE_URL, data);
    return response.data;
  },

  /**
   * Get dropdown options for creating purchase request
   */
  getCreateOptions: async (params?: { facilityId?: number; facilityCode?: string }): Promise<PurchaseRequestCreateOptionsResponse> => {
    const response = await axiosInstance.get<PurchaseRequestCreateOptionsResponse>(`${BASE_URL}/options`, {
      params,
    });
    return response.data;
  },

  /**
   * Update purchase request
   */
  update: async (id: number, data: CreatePurchaseRequest): Promise<PurchaseRequestResponse> => {
    const response = await axiosInstance.put<PurchaseRequestResponse>(`${BASE_URL}/${id}`, data);
    return response.data;
  },

  /**
   * Submit purchase request for approval
   */
  submit: async (id: number): Promise<void> => {
    await axiosInstance.post(`${BASE_URL}/${id}/submit`);
  },

  approve: async (id: number, comment: string): Promise<void> => {
    await axiosInstance.post(`${BASE_URL}/${id}/approve`, { comment });
  },

  reject: async (id: number, reason: string): Promise<void> => {
    await axiosInstance.post(`${BASE_URL}/${id}/reject`, { reason });
  },

  returnForEdit: async (id: number, comment: string): Promise<void> => {
    await axiosInstance.post(`${BASE_URL}/${id}/return`, { comment });
  },
  
  cancel: async (id: number, reason: string): Promise<void> => {
    await axiosInstance.post(`${BASE_URL}/${id}/cancel`, { reason });
  },

  getPendingApprovals: async (): Promise<ApprovalPendingItem[]> => {
    const response = await axiosInstance.get<ApprovalPendingItem[]>('/api/Approvals/pending');
    return response.data;
  },

  getReportList: async (params?: {
    status?: string;
    dateFrom?: string;
    dateTo?: string;
    facilityId?: number;
    facilityCode?: string;
    page?: number;
    pageSize?: number;
  }): Promise<PurchaseRequestListResponse> => {
    const response = await axiosInstance.get<{
      data: PurchaseRequestResponse[];
      totalCount: number;
      page: number;
      pageSize: number;
      totalPages: number;
    }>(BASE_URL, { params });

    return {
      items: response.data.data ?? [],
      totalCount: response.data.totalCount ?? 0,
    };
  },
};
