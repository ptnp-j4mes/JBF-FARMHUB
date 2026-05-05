import axiosInstance from '@/lib/axios';

const BASE_URL = '/api/StockReplenishmentRequests';

export type StockReplenishmentBackendUrgency = 'Normal' | 'High' | 'Urgent';

export interface StockReplenishmentRequestLineResponse {
  id: number;
  lineNo: number;
  centralWarehouseItemId: number;
  itemId: number;
  itemCode: string;
  itemName: string;
  uomId: number;
  uomCode: string;
  uomName: string;
  sourceNotificationId?: number | null;
  requestedQuantity: number;
  approvedQuantity?: number | null;
  estimatedUnitPrice: number;
  lineStatus: string;
  remarks: string;
  linkedPurchaseRequestLineId?: number | null;
}

export interface StockReplenishmentRequestResponse {
  id: number;
  documentNumber: string;
  requestDate: string;
  requiredByDate?: string | null;
  status: string;
  urgency: StockReplenishmentBackendUrgency;
  remarks: string;
  sourceFacilityId: number;
  sourceFacilityCode: string;
  sourceFacilityName: string;
  targetWarehouseId: number;
  targetWarehouseCode: string;
  targetWarehouseName: string;
  targetFacilityId?: number | null;
  targetFacilityCode: string;
  targetFacilityName: string;
  requestorId: number;
  requestorName: string;
  reviewedByName?: string | null;
  reviewedAt?: string | null;
  reviewComment?: string | null;
  linkedPurchaseRequestId?: number | null;
  linkedPurchaseRequestNumber?: string | null;
  updatedDate?: string | null;
  lines: StockReplenishmentRequestLineResponse[];
}

export interface StockReplenishmentCentralItemOption {
  id: number;
  warehouseId: number;
  warehouseCode: string;
  warehouseName: string;
  itemId: number;
  itemCode: string;
  itemName: string;
  category: string;
  uomId: number;
  uomCode: string;
  uomName: string;
  stockOnHand: number;
  reservedQuantity: number;
  availableQuantity: number;
  reorderPoint: number;
  targetLevel: number;
  estimatedUnitPrice: number;
  isCentralItem: boolean;
}

export interface StockReplenishmentFacilityOption {
  id: number;
  code: string;
  name: string;
  isCentralHub: boolean;
}

export interface StockReplenishmentCreateOptionsResponse {
  scope: 'farm' | 'central';
  currentFacility?: StockReplenishmentFacilityOption | null;
  centralHub?: StockReplenishmentFacilityOption | null;
  items: StockReplenishmentCentralItemOption[];
}

export interface CreateStockReplenishmentRequestPayload {
  sourceFacilityId?: number;
  sourceFacilityCode?: string;
  targetWarehouseId?: number;
  requiredByDate?: string;
  urgency: StockReplenishmentBackendUrgency;
  remarks: string;
  lines: Array<{
    centralWarehouseItemId: number;
    requestedQuantity: number;
    estimatedUnitPrice: number;
    remarks?: string;
  }>;
}

export interface CreateStockReplenishmentPrPayload {
  requestIds?: number[];
  targetWarehouseId?: number;
  department?: string;
  urgency?: StockReplenishmentBackendUrgency;
  remarks?: string;
  lines?: Array<{
    itemId: number;
    uomId: number;
    quantity: number;
    estimatedPrice: number;
    remarks?: string;
  }>;
}

export interface StockReplenishmentPurchaseRequestLinkResponse {
  purchaseRequestId: number;
  purchaseRequestNumber: string;
  linkedRequestCount: number;
  linkedLineCount: number;
}

export interface StockReplenishmentPurchaseRequestPreviewLineResponse {
  itemId: number;
  itemCode: string;
  itemName: string;
  uomId: number;
  uomCode: string;
  uomName: string;
  requestedQuantity: number;
  quantity: number;
  estimatedUnitPrice: number;
  estimatedPrice: number;
  remarks: string;
  sourceDocumentNumbers: string[];
}

export interface StockReplenishmentPurchaseRequestPreviewResponse {
  targetWarehouseId: number;
  targetWarehouseCode: string;
  targetWarehouseName: string;
  targetFacilityId?: number | null;
  targetFacilityCode: string;
  targetFacilityName: string;
  requestIds: number[];
  sourceDocumentNumbers: string[];
  lines: StockReplenishmentPurchaseRequestPreviewLineResponse[];
}

export const stockReplenishmentService = {
  getOptions: async (params?: { facilityId?: number; facilityCode?: string }) => {
    const response = await axiosInstance.get<StockReplenishmentCreateOptionsResponse>(`${BASE_URL}/options`, { params });
    return response.data;
  },

  getAll: async (params?: { scope?: 'farm' | 'central'; facilityId?: number; facilityCode?: string }) => {
    const response = await axiosInstance.get<StockReplenishmentRequestResponse[]>(BASE_URL, { params });
    return response.data;
  },

  create: async (payload: CreateStockReplenishmentRequestPayload) => {
    const response = await axiosInstance.post<StockReplenishmentRequestResponse>(BASE_URL, payload);
    return response.data;
  },

  submit: async (id: number) => {
    await axiosInstance.post(`${BASE_URL}/${id}/submit`);
  },

  approve: async (id: number, comment = '') => {
    await axiosInstance.post(`${BASE_URL}/${id}/approve`, { comment });
  },

  reject: async (id: number, comment = '') => {
    await axiosInstance.post(`${BASE_URL}/${id}/reject`, { comment });
  },

  returnForEdit: async (id: number, comment = '') => {
    await axiosInstance.post(`${BASE_URL}/${id}/return`, { comment });
  },

  cancel: async (id: number, comment = '') => {
    await axiosInstance.post(`${BASE_URL}/${id}/cancel`, { comment });
  },

  createPurchaseRequest: async (payload: CreateStockReplenishmentPrPayload = {}) => {
    const response = await axiosInstance.post<StockReplenishmentPurchaseRequestLinkResponse>(
      `${BASE_URL}/create-purchase-request`,
      payload,
    );
    return response.data;
  },

  previewPurchaseRequest: async (payload: CreateStockReplenishmentPrPayload = {}) => {
    const response = await axiosInstance.post<StockReplenishmentPurchaseRequestPreviewResponse>(
      `${BASE_URL}/purchase-request-preview`,
      payload,
    );
    return response.data;
  },
};
