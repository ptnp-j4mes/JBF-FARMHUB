import axiosInstance from '@/lib/axios';
import type {
  CreateStockAdjustmentRequestPayload,
  StockAdjustmentRequestResponse,
} from '../types/stock-adjustment-request.types';

const STOCK_ADJUSTMENT_REQUEST_URL = '/api/StockAdjustmentRequests';

function toArrayPayload<T>(payload: unknown): T[] {
  if (Array.isArray(payload)) return payload as T[];
  if (payload && typeof payload === 'object' && Array.isArray((payload as { data?: unknown }).data)) {
    return (payload as { data: T[] }).data;
  }
  return [];
}

export const stockAdjustmentRequestService = {
  async create(payload: CreateStockAdjustmentRequestPayload): Promise<StockAdjustmentRequestResponse> {
    const response = await axiosInstance.post<StockAdjustmentRequestResponse>(STOCK_ADJUSTMENT_REQUEST_URL, payload);
    return response.data;
  },

  async getMy(params?: { facilityId?: number; facilityCode?: string }): Promise<StockAdjustmentRequestResponse[]> {
    const response = await axiosInstance.get<StockAdjustmentRequestResponse[]>(`${STOCK_ADJUSTMENT_REQUEST_URL}/my`, { params });
    return toArrayPayload<StockAdjustmentRequestResponse>(response.data);
  },

  async getPendingApprovals(params?: { facilityId?: number; facilityCode?: string }): Promise<StockAdjustmentRequestResponse[]> {
    const response = await axiosInstance.get<StockAdjustmentRequestResponse[]>(`${STOCK_ADJUSTMENT_REQUEST_URL}/pending-approvals`, { params });
    return toArrayPayload<StockAdjustmentRequestResponse>(response.data);
  },

  async approve(id: number, comment = ''): Promise<void> {
    await axiosInstance.post(`${STOCK_ADJUSTMENT_REQUEST_URL}/${id}/approve`, { comment });
  },

  async reject(id: number, comment: string): Promise<void> {
    await axiosInstance.post(`${STOCK_ADJUSTMENT_REQUEST_URL}/${id}/reject`, { comment });
  },
};
