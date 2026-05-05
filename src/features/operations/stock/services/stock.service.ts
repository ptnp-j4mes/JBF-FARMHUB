/**
 * Operations Module - Pig Stock Service
 *
 * API source: /api/PigBatches
 */

import axiosInstance from '@/lib/axios';
import type {
  PigBatchItemOption,
  PigBatchPagedResponse,
  PigBatchQueryParams,
  PigBatchRow,
  PigBatchTraceDetail,
} from '../types';

const PIG_BATCHES_URL = '/api/PigBatches';
const inFlightPagedRequests = new Map<string, Promise<PigBatchPagedResponse>>();

function toArrayPayload<T>(payload: unknown): T[] {
  if (Array.isArray(payload)) return payload as T[];
  if (payload && typeof payload === 'object' && Array.isArray((payload as { data?: unknown }).data)) {
    return (payload as { data: T[] }).data;
  }
  return [];
}

function toObjectPayload<T extends object>(payload: unknown): T {
  if (payload && typeof payload === 'object' && 'data' in payload) {
    const nested = (payload as { data?: unknown }).data;
    if (nested && typeof nested === 'object' && !Array.isArray(nested)) {
      return nested as T;
    }
  }
  return (payload ?? {}) as T;
}

export const stockService = {
  getPaged: async (params?: PigBatchQueryParams): Promise<PigBatchPagedResponse> => {
    const normalizedEntries = Object.entries(params ?? {})
      .filter(([, value]) => value !== undefined && value !== null && value !== '')
      .sort(([a], [b]) => a.localeCompare(b));
    const key = `${PIG_BATCHES_URL}?${new URLSearchParams(
      normalizedEntries.map(([k, v]) => [k, String(v)]),
    ).toString()}`;

    const existing = inFlightPagedRequests.get(key);
    if (existing) {
      return existing;
    }

    const request = (async (): Promise<PigBatchPagedResponse> => {
    try {
      const response = await axiosInstance.get<PigBatchPagedResponse>(PIG_BATCHES_URL, { params });

      if (response.data && typeof response.data === 'object' && 'data' in response.data) {
        return response.data;
      }

      return {
        data: toArrayPayload<PigBatchRow>(response.data),
        totalCount: 0,
        page: params?.page ?? 1,
        pageSize: params?.pageSize ?? 20,
        totalPages: 0,
      };
    } catch (error: unknown) {
      const status =
        typeof error === 'object' &&
        error !== null &&
        'response' in error &&
        typeof (error as { response?: { status?: number } }).response?.status === 'number'
          ? (error as { response: { status: number } }).response.status
          : undefined;
      if (status === 400 || status === 404) {
        return {
          data: [],
          totalCount: 0,
          page: params?.page ?? 1,
          pageSize: params?.pageSize ?? 20,
          totalPages: 0,
        };
      }
      throw error;
    }
    })();

    inFlightPagedRequests.set(key, request);
    try {
      return await request;
    } finally {
      inFlightPagedRequests.delete(key);
    }
  },

  getById: async (id: number, includeInactive = false): Promise<PigBatchRow> => {
    const response = await axiosInstance.get<PigBatchRow>(`${PIG_BATCHES_URL}/${id}`, {
      params: { includeInactive },
    });
    return toObjectPayload<PigBatchRow>(response.data);
  },

  getTrace: async (id: number): Promise<PigBatchTraceDetail> => {
    const response = await axiosInstance.get<PigBatchTraceDetail>(`${PIG_BATCHES_URL}/${id}/trace`);
    return toObjectPayload<PigBatchTraceDetail>(response.data);
  },

  getItemOptions: async (facilityCode?: string): Promise<PigBatchItemOption[]> => {
    const response = await axiosInstance.get<PigBatchItemOption[]>(`${PIG_BATCHES_URL}/item-options`, {
      params: { facilityCode },
    });
    return toArrayPayload<PigBatchItemOption>(response.data);
  },
};
