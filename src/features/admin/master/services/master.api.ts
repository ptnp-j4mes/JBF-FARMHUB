import axiosInstance from '@/lib/axios';
import { apiClient } from '@/lib/api/client';
import type { MasterDto } from '../types/master.dto';
import type { MasterQueryParams } from '../types/master.query';
import type {
  FeedProgramDto,
  FeedProgramUpsert,
} from '../types/feed-program';
import { MASTER_CONSTANTS } from '../utils/master.constants';

export interface MasterLookups {
  farms?: unknown[];
  zones?: unknown[];
  houses?: unknown[];
  items?: unknown[];
  partners?: unknown[];
  alertRules?: unknown[];
}

function normalizeMasterOverviewPayload(payload: unknown): MasterDto[] {
  if (Array.isArray(payload)) {
    return payload as MasterDto[];
  }

  if (!payload || typeof payload !== 'object') {
    return [];
  }

  const objectPayload = payload as {
    data?: unknown;
    items?: unknown;
  };

  if (Array.isArray(objectPayload.data)) {
    return objectPayload.data as MasterDto[];
  }

  if (Array.isArray(objectPayload.items)) {
    return objectPayload.items as MasterDto[];
  }

  return [];
}

export const masterApi = {
  getOverview: async (params = {}): Promise<MasterDto[]> => {
    const overviewPath = MASTER_CONSTANTS.apiBasePath + '/overview';
    const response = await apiClient.get<unknown>(overviewPath, { params });
    return normalizeMasterOverviewPayload(response);
  },
  getItems: async () => {
    const response = await apiClient.get('/api/Items', {
      params: { includeInactive: true },
    });
    return normalizeMasterOverviewPayload(response);
  },
  getCentralWarehouseItems: async () => {
    const response = await apiClient.get('/api/CentralWarehouseItems', {
      params: { includeInactive: true },
    });
    return normalizeMasterOverviewPayload(response);
  },
  getCategories: async () => {
    const response = await apiClient.get('/api/ItemCategories', {
      params: { includeInactive: true },
    });
    return normalizeMasterOverviewPayload(response);
  },
  getUOMs: async () => {
    const response = await apiClient.get('/api/UOMs', {
      params: { includeInactive: true },
    });
    return normalizeMasterOverviewPayload(response);
  },
  getItemUOMs: async () => {
    const response = await apiClient.get('/api/ItemUOMs', {
      params: { includeInactive: true },
    });
    return normalizeMasterOverviewPayload(response);
  },
  getUomConversions: async () => {
    const response = await apiClient.get('/api/UomConversions', {
      params: { includeInactive: true },
    });
    return normalizeMasterOverviewPayload(response);
  },
  getLotPolicies: async () => {
    const response = await apiClient.get('/api/ItemLotPolicies', {
      params: { includeInactive: true },
    });
    return normalizeMasterOverviewPayload(response);
  },
  getPartners: async () => {
    const response = await apiClient.get('/api/BusinessPartners', {
      params: { includeInactive: true },
    });
    return normalizeMasterOverviewPayload(response);
  },
  getFiStandardOptions: async (facilityId?: number) => {
    const response = await axiosInstance.get('/api/FiStandards/options', {
      params: facilityId ? { facilityId } : undefined,
    });
    return response.data;
  },
  getFiStandardRecords: async (params: {
    profileId?: string;
    gender?: 'ALL' | 'MALE' | 'FEMALE';
    facilityId?: number;
    houseId?: number;
    search?: string;
    page?: number;
    pageSize?: number;
  }) => {
    const response = await axiosInstance.get('/api/FiStandards/records', { params });
    return response.data;
  },
  getFarmInformationDashboard: async (facilityId?: number) => {
    const response = await axiosInstance.get('/api/FiStandards/farm-dashboard', {
      params: facilityId ? { facilityId } : undefined,
    });
    return response.data;
  },
  getFarmHouseDetail: async (buildingOpeningId: number) => {
    const response = await axiosInstance.get(`/api/FiStandards/farm-dashboard/house/${buildingOpeningId}`);
    return response.data;
  },
  previewFiManagement: async (payload: unknown) => {
    const response = await axiosInstance.post('/api/FiStandards/manage/preview', payload);
    return response.data;
  },
  upsertFiManagementDraft: async (payload: unknown) => {
    const response = await axiosInstance.post('/api/FiStandards/manage/drafts', payload);
    return response.data;
  },
  listFiManagementDrafts: async (profileId?: string) => {
    const response = await axiosInstance.get('/api/FiStandards/manage/drafts', {
      params: profileId ? { profileId } : undefined,
    });
    return response.data;
  },
  getFiManagementDraft: async (draftId: string) => {
    const response = await axiosInstance.get(`/api/FiStandards/manage/drafts/${draftId}`);
    return response.data;
  },
  validateFiManagementDraft: async (draftId: string) => {
    const response = await axiosInstance.post(`/api/FiStandards/manage/drafts/${draftId}/validate`);
    return response.data;
  },
  publishFiManagementDraft: async (draftId: string, payload?: { idempotencyKey?: string; effectiveDate?: string }) => {
    const response = await axiosInstance.post(`/api/FiStandards/manage/drafts/${draftId}/publish`, payload ?? {});
    return response.data;
  },
  getPigTypes: async () => {
    const response = await axiosInstance.get('/api/PigTypes', {
      params: { includeInactive: true },
    });
    return normalizeMasterOverviewPayload(response.data);
  },
  getBreeds: async () => {
    const response = await axiosInstance.get('/api/Breeds', {
      params: { includeInactive: true },
    });
    return normalizeMasterOverviewPayload(response.data);
  },
  getDiseases: async () => {
    const response = await axiosInstance.get('/api/Diseases', {
      params: { includeInactive: true },
    });
    return normalizeMasterOverviewPayload(response.data);
  },
  getTreatmentTypes: async () => {
    const response = await axiosInstance.get('/api/TreatmentTypes', {
      params: { includeInactive: true },
    });
    return normalizeMasterOverviewPayload(response.data);
  },
  getMortalityTypes: async () => {
    const response = await axiosInstance.get('/api/MortalityTypes', {
      params: { includeInactive: true },
    });
    return normalizeMasterOverviewPayload(response.data);
  },
  getMortalityCauses: async () => {
    const response = await axiosInstance.get('/api/MortalityCauses', {
      params: { includeInactive: true },
    });
    return normalizeMasterOverviewPayload(response.data);
  },
  getNotificationRules: async () => {
    const response = await axiosInstance.get('/api/NotificationRules', {
      params: { includeInactive: true },
    });
    return normalizeMasterOverviewPayload(response.data);
  },
  getPrefixCategories: async () => {
    const response = await axiosInstance.get('/api/PrefixCategories', {
      params: { includeInactive: true },
    });
    return normalizeMasterOverviewPayload(response.data);
  },
  getPrefixes: async () => {
    const response = await axiosInstance.get('/api/Prefixes', {
      params: { includeInactive: true },
    });
    return normalizeMasterOverviewPayload(response.data);
  },
  getFeedPrograms: async (includeInactive = false): Promise<FeedProgramDto[]> => {
    const response = await axiosInstance.get<FeedProgramDto[]>('/api/FeedPrograms', {
      params: includeInactive ? { includeInactive } : undefined,
    });
    return Array.isArray(response.data) ? response.data : [];
  },
  getFeedProgram: async (id: number, includeInactive = false): Promise<FeedProgramDto> => {
    const response = await axiosInstance.get<FeedProgramDto>(`/api/FeedPrograms/${id}`, {
      params: includeInactive ? { includeInactive } : undefined,
    });
    return response.data;
  },
  createFeedProgram: async (payload: FeedProgramUpsert): Promise<FeedProgramDto> => {
    const response = await axiosInstance.post<FeedProgramDto>('/api/FeedPrograms', payload);
    return response.data;
  },
  updateFeedProgram: async (id: number, payload: FeedProgramUpsert): Promise<FeedProgramDto> => {
    const response = await axiosInstance.put<FeedProgramDto>(`/api/FeedPrograms/${id}`, payload);
    return response.data;
  },
  setFeedProgramStatus: async (id: number, isActive: boolean): Promise<void> => {
    await axiosInstance.patch(`/api/FeedPrograms/${id}/status`, { isActive });
  },
  deleteFeedProgram: async (id: number): Promise<void> => {
    try {
      await axiosInstance.delete(`/api/FeedPrograms/${id}/hard`);
      return;
    } catch (error: any) {
      const statusCode = error?.response?.status;
      if (statusCode !== 404 && statusCode !== 405) {
        throw error;
      }
    }

    await axiosInstance.delete(`/api/FeedPrograms/${id}`);
  },

  // Generic CRUD mutations
  createData: async <T>(endpoint: string, data: any): Promise<T> => {
    const response = await axiosInstance.post(`/api/${endpoint}`, data);
    return response.data;
  },
  updateData: async <T>(endpoint: string, id: number | string, data: any): Promise<T> => {
    const response = await axiosInstance.put(`/api/${endpoint}/${id}`, data);
    return response.data;
  },
  setDataStatus: async (
    endpoint: string,
    id: number | string,
    isActive: boolean,
  ): Promise<void> => {
    await axiosInstance.patch(`/api/${endpoint}/${id}/status`, { isActive });
  },
  deleteData: async (endpoint: string, id: number | string): Promise<void> => {
    try {
      await axiosInstance.delete(`/api/${endpoint}/${id}/hard`);
      return;
    } catch (error: any) {
      const statusCode = error?.response?.status;
      // Backward compatibility for controllers that still have only legacy DELETE route.
      if (statusCode !== 404 && statusCode !== 405) {
        throw error;
      }
    }

    await axiosInstance.delete(`/api/${endpoint}/${id}`);
  }
};
