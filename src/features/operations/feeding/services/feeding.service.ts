import axiosInstance from '@/lib/axios';
import type {
  CompleteFeedingPlanLineRequest,
  CreateFeedingPlanLineBulkRequest,
  CreateFeedingPlanLineRequest,
  FeedingFiScheduleRowResponse,
  FeedingOptionHouse,
  FeedingPendingPlanResponse,
  FeedingPlanLineResponse,
  FeedingPlanOptionsResponse,
  FeedingPlanSummaryResponse,
} from '../types';

const BASE_URL = '/api/Feeding';

export const feedingService = {
  getOptions: async (facilityId?: number): Promise<FeedingPlanOptionsResponse> => {
    const response = await axiosInstance.get<FeedingPlanOptionsResponse>(`${BASE_URL}/options`, {
      params: facilityId ? { facilityId } : undefined,
    });
    return response.data;
  },

  getPlanLines: async (date: string, facilityId?: number): Promise<FeedingPlanLineResponse[]> => {
    const response = await axiosInstance.get<FeedingPlanLineResponse[]>(BASE_URL, {
      params: {
        date,
        ...(facilityId ? { facilityId } : {}),
      },
    });
    return response.data;
  },

  getSummary: async (date: string, facilityId?: number): Promise<FeedingPlanSummaryResponse> => {
    const response = await axiosInstance.get<FeedingPlanSummaryResponse>(`${BASE_URL}/summary`, {
      params: {
        date,
        ...(facilityId ? { facilityId } : {}),
      },
    });
    return response.data;
  },

  getFiSchedule: async (date: string, facilityId: number, houseId?: number): Promise<FeedingFiScheduleRowResponse[]> => {
    const response = await axiosInstance.get<FeedingFiScheduleRowResponse[]>(`${BASE_URL}/fi-schedule`, {
      params: {
        date,
        facilityId,
        ...(houseId ? { houseId } : {}),
      },
    });
    return response.data;
  },

  getOpenHouses: async (facilityId: number): Promise<FeedingOptionHouse[]> => {
    const response = await axiosInstance.get<FeedingOptionHouse[]>(`${BASE_URL}/open-houses`, {
      params: { facilityId },
    });
    return response.data;
  },

  createPlanLine: async (request: CreateFeedingPlanLineRequest): Promise<FeedingPlanLineResponse> => {
    const response = await axiosInstance.post<FeedingPlanLineResponse>(`${BASE_URL}/plan-lines`, request);
    return response.data;
  },

  createPlanLinesBulk: async (request: CreateFeedingPlanLineBulkRequest): Promise<FeedingPlanLineResponse[]> => {
    const response = await axiosInstance.post<FeedingPlanLineResponse[]>(`${BASE_URL}/plan-lines/bulk`, request);
    return response.data;
  },

  completePlanLine: async (
    lineId: number,
    request: CompleteFeedingPlanLineRequest,
  ): Promise<FeedingPlanLineResponse> => {
    const response = await axiosInstance.post<FeedingPlanLineResponse>(`${BASE_URL}/plan-lines/${lineId}/complete`, request);
    return response.data;
  },

  getPendingPlans: async (
    date: string,
    facilityId: number,
    houseId?: number,
    houseCode?: string,
  ): Promise<FeedingPendingPlanResponse[]> => {
    const response = await axiosInstance.get<FeedingPendingPlanResponse[]>(`${BASE_URL}/pending-plans`, {
      params: {
        date,
        facilityId,
        ...(houseId ? { houseId } : {}),
        ...(houseCode?.trim() ? { houseCode: houseCode.trim() } : {}),
      },
    });
    return response.data;
  },
};
