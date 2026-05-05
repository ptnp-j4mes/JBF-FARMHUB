import axiosInstance from '@/lib/axios';
import type {
  CreateStockIssueRequestPayload,
  StockIssueRequestCreateOptionsResponse,
  StockIssueRequestResponse,
} from '../types/stock-issue-request.types';

const STOCK_ISSUE_REQUEST_URL = '/api/StockIssueRequests';

function toArrayPayload<T>(payload: unknown): T[] {
  if (Array.isArray(payload)) return payload as T[];
  if (payload && typeof payload === 'object' && Array.isArray((payload as { data?: unknown }).data)) {
    return (payload as { data: T[] }).data;
  }
  return [];
}

export const stockIssueRequestService = {
  async getCreateOptions(params?: { facilityId?: number; facilityCode?: string }): Promise<StockIssueRequestCreateOptionsResponse> {
    const response = await axiosInstance.get<StockIssueRequestCreateOptionsResponse>(`${STOCK_ISSUE_REQUEST_URL}/options`, { params });
    return response.data;
  },

  async create(payload: CreateStockIssueRequestPayload): Promise<StockIssueRequestResponse> {
    const response = await axiosInstance.post<StockIssueRequestResponse>(STOCK_ISSUE_REQUEST_URL, payload);
    return response.data;
  },

  async getMy(params?: { facilityId?: number; facilityCode?: string }): Promise<StockIssueRequestResponse[]> {
    const response = await axiosInstance.get<StockIssueRequestResponse[]>(`${STOCK_ISSUE_REQUEST_URL}/my`, { params });
    return toArrayPayload<StockIssueRequestResponse>(response.data);
  },

  async getPendingApprovals(): Promise<StockIssueRequestResponse[]> {
    const response = await axiosInstance.get<StockIssueRequestResponse[]>(`${STOCK_ISSUE_REQUEST_URL}/pending-approvals`);
    return toArrayPayload<StockIssueRequestResponse>(response.data);
  },

  async getReadyToConfirm(params?: { facilityId?: number; facilityCode?: string }): Promise<StockIssueRequestResponse[]> {
    const response = await axiosInstance.get<StockIssueRequestResponse[]>(`${STOCK_ISSUE_REQUEST_URL}/ready-to-confirm`, { params });
    return toArrayPayload<StockIssueRequestResponse>(response.data);
  },

  async getCompleted(params?: { facilityId?: number; facilityCode?: string }): Promise<StockIssueRequestResponse[]> {
    const response = await axiosInstance.get<StockIssueRequestResponse[]>(`${STOCK_ISSUE_REQUEST_URL}/completed`, { params });
    return toArrayPayload<StockIssueRequestResponse>(response.data);
  },

  async getById(id: number): Promise<StockIssueRequestResponse> {
    const response = await axiosInstance.get<StockIssueRequestResponse>(`${STOCK_ISSUE_REQUEST_URL}/${id}`);
    return response.data;
  },

  async approve(id: number, comment = ''): Promise<void> {
    await axiosInstance.post(`${STOCK_ISSUE_REQUEST_URL}/${id}/approve`, { comment });
  },

  async reject(id: number, comment = ''): Promise<void> {
    await axiosInstance.post(`${STOCK_ISSUE_REQUEST_URL}/${id}/reject`, { comment });
  },

  async confirm(id: number): Promise<void> {
    await axiosInstance.post(`${STOCK_ISSUE_REQUEST_URL}/${id}/confirm`);
  },
};
