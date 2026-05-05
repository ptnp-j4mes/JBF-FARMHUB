import axiosInstance from '@/lib/axios';
import type {
  BuildingOpeningApprovalActionRequest,
  BuildingOpeningCreateOptionsResponse,
  BuildingOpeningPigBatchOptionResponse,
  BuildingOpeningResponse,
  CompleteBuildingOpeningRequest,
  CreateBuildingOpeningRequest,
  UpdateBuildingOpeningChecklistsRequest,
} from '../types';

const BASE_URL = '/api/BuildingOpenings';

function normalizeBuildingOpening(row: any): BuildingOpeningResponse {
  return {
    ...row,
    zone: row?.zone ?? null,
  } as BuildingOpeningResponse;
}

function normalizeBuildingOpeningOptions(row: any): BuildingOpeningCreateOptionsResponse {
  const houses = Array.isArray(row?.houses)
    ? row.houses.map((house: any) => ({
      ...house,
      zoneName: house?.zoneName ?? null,
    }))
    : [];

  return {
    ...(row ?? {}),
    houses,
  } as BuildingOpeningCreateOptionsResponse;
}

function toBuildingOpeningRequestPayload(data: CreateBuildingOpeningRequest): Record<string, unknown> {
  return {
    ...data,
    zone: data.zone,
  };
}

export const buildingOpeningService = {
  getAll: async (params?: {
    status?: string;
    facilityId?: number;
    facilityCode?: string;
    q?: string;
  }): Promise<BuildingOpeningResponse[]> => {
    const response = await axiosInstance.get<any[]>(BASE_URL, { params });
    return (response.data ?? []).map((row) => normalizeBuildingOpening(row));
  },

  getById: async (id: number): Promise<BuildingOpeningResponse> => {
    const response = await axiosInstance.get<any>(`${BASE_URL}/${id}`);
    return normalizeBuildingOpening(response.data);
  },

  getPendingApprovals: async (params?: {
    facilityId?: number;
    facilityCode?: string;
    q?: string;
  }): Promise<BuildingOpeningResponse[]> => {
    const response = await axiosInstance.get<any[]>(`${BASE_URL}/pending-approvals`, { params });
    return (response.data ?? []).map((row) => normalizeBuildingOpening(row));
  },

  getCreateOptions: async (): Promise<BuildingOpeningCreateOptionsResponse> => {
    const response = await axiosInstance.get<any>(`${BASE_URL}/options`);
    return normalizeBuildingOpeningOptions(response.data);
  },

  create: async (data: CreateBuildingOpeningRequest): Promise<BuildingOpeningResponse> => {
    const response = await axiosInstance.post<any>(BASE_URL, toBuildingOpeningRequestPayload(data));
    return normalizeBuildingOpening(response.data);
  },

  update: async (id: number, data: CreateBuildingOpeningRequest): Promise<BuildingOpeningResponse> => {
    const response = await axiosInstance.put<any>(`${BASE_URL}/${id}`, toBuildingOpeningRequestPayload(data));
    return normalizeBuildingOpening(response.data);
  },

  submit: async (id: number): Promise<BuildingOpeningResponse> => {
    const response = await axiosInstance.post<any>(`${BASE_URL}/${id}/submit`);
    return normalizeBuildingOpening(response.data);
  },

  complete: async (id: number, payload: CompleteBuildingOpeningRequest): Promise<BuildingOpeningResponse> => {
    const response = await axiosInstance.post<any>(`${BASE_URL}/${id}/complete`, payload);
    return normalizeBuildingOpening(response.data);
  },

  updateChecklists: async (id: number, payload: UpdateBuildingOpeningChecklistsRequest): Promise<BuildingOpeningResponse> => {
    const response = await axiosInstance.post<any>(`${BASE_URL}/${id}/checklists/update`, payload);
    return normalizeBuildingOpening(response.data);
  },

  toggleChecklist: async (id: number, checklistId: number): Promise<BuildingOpeningResponse> => {
    const response = await axiosInstance.post<any>(`${BASE_URL}/${id}/checklists/${checklistId}/toggle`);
    return normalizeBuildingOpening(response.data);
  },

  getReceiveOptions: async (id: number): Promise<BuildingOpeningPigBatchOptionResponse[]> => {
    const response = await axiosInstance.get<BuildingOpeningPigBatchOptionResponse[]>(`${BASE_URL}/${id}/receive-options`);
    return response.data;
  },

  approve: async (id: number, payload?: BuildingOpeningApprovalActionRequest): Promise<BuildingOpeningResponse> => {
    const response = await axiosInstance.post<any>(`${BASE_URL}/${id}/approve`, payload ?? {});
    return normalizeBuildingOpening(response.data);
  },

  returnForRevision: async (id: number, payload: BuildingOpeningApprovalActionRequest): Promise<BuildingOpeningResponse> => {
    const response = await axiosInstance.post<any>(`${BASE_URL}/${id}/return`, payload);
    return normalizeBuildingOpening(response.data);
  },

  reject: async (id: number, payload: BuildingOpeningApprovalActionRequest): Promise<BuildingOpeningResponse> => {
    const response = await axiosInstance.post<any>(`${BASE_URL}/${id}/reject`, payload);
    return normalizeBuildingOpening(response.data);
  },
};
