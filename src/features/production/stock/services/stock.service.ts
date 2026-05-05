import axiosInstance from '@/lib/axios';
import type {
  AdjustmentStockRequest,
  CreateStockReceiveRequest,
  DashboardMetricResponse,
  FeedSiloOption,
  IssueStockRequest,
  ItemCategoryOption,
  ItemOption,
  CentralWarehouseItemOption,
  ReceiveStockRequest,
  ReceivablePurchaseRequestPagedResponse,
  StockReceiveRequestResponse,
  StockBalanceResponse,
  StockBalancePagedResponse,
  StockFacilityResponse,
  StockFacilityRevisionResponse,
  StockPagedQueryParams,
  StockTransactionPagedResponse,
  TransferStockRequest,
  UpdateStockReceiveRequest,
  UomOption,
  WarehouseResponse,
  WarehouseType,
} from '../types';

const INVENTORY_URL = '/api/Inventories';
const STOCK_RECEIVE_REQUESTS_URL = '/api/StockReceiveRequests';
const STOCK_FACILITIES_URL = '/api/StockFacilities';
const WAREHOUSE_URL = '/api/Warehouses';
const ITEMS_URL = '/api/Items';
const UOMS_URL = '/api/UOMs';
const ITEM_CATEGORIES_URL = '/api/ItemCategories';

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
  getStockBalances: async (
    warehouseId?: number,
    itemId?: number,
    facilityCode?: string,
    skipFacilityContext = false,
  ): Promise<{ items: StockBalanceResponse[] }> => {
    const response = await axiosInstance.get<StockBalanceResponse[]>(`${INVENTORY_URL}/balance`, {
      params: { warehouseId, itemId, facilityCode },
      skipFacilityContext,
    } as any);
    return { items: toArrayPayload<StockBalanceResponse>(response.data) };
  },

  getDashboard: async (
    warehouseId?: number,
    facilityCode?: string,
    skipFacilityContext = false,
  ): Promise<DashboardMetricResponse> => {
    const response = await axiosInstance.get<DashboardMetricResponse>(`${INVENTORY_URL}/dashboard`, {
      params: { warehouseId, facilityCode },
      skipFacilityContext,
    } as any);
    return toObjectPayload<DashboardMetricResponse>(response.data);
  },

  getPagedBalances: async (
    params: StockPagedQueryParams,
    skipFacilityContext = false,
  ): Promise<StockBalancePagedResponse> => {
    const response = await axiosInstance.get<StockBalancePagedResponse>(`${INVENTORY_URL}/balance/paged`, {
      params,
      skipFacilityContext,
    } as any);
    return response.data;
  },

  getStockFacilities: async (
    params?: { facilityId?: number; facilityCode?: string },
    skipFacilityContext = false,
  ): Promise<StockFacilityResponse[]> => {
    const response = await axiosInstance.get<StockFacilityResponse[]>(
      STOCK_FACILITIES_URL,
      { params, skipFacilityContext } as any,
    );
    return toArrayPayload<StockFacilityResponse>(response.data);
  },

  getStockFacilitiesRevision: async (
    params?: { facilityId?: number; facilityCode?: string },
    skipFacilityContext = false,
  ): Promise<StockFacilityRevisionResponse> => {
    const response = await axiosInstance.get<StockFacilityRevisionResponse>(
      `${STOCK_FACILITIES_URL}/revision`,
      { params, skipFacilityContext } as any,
    );
    return toObjectPayload<StockFacilityRevisionResponse>(response.data);
  },

  rebuildStockFacilities: async (
    params?: { facilityId?: number; facilityCode?: string },
    skipFacilityContext = false,
  ): Promise<StockFacilityResponse[]> => {
    const response = await axiosInstance.post<StockFacilityResponse[]>(
      `${STOCK_FACILITIES_URL}/rebuild`,
      {},
      { params, skipFacilityContext } as any,
    );
    return toArrayPayload<StockFacilityResponse>(response.data);
  },

  getWarehouses: async (
    facilityCode?: string,
    type?: WarehouseType,
    skipFacilityContext = false,
  ): Promise<WarehouseResponse[]> => {
    const response = await axiosInstance.get<WarehouseResponse[]>(WAREHOUSE_URL, {
      params: { facilityCode, type },
      skipFacilityContext,
    } as any);
    return toArrayPayload<WarehouseResponse>(response.data);
  },

  getItems: async (): Promise<ItemOption[]> => {
    const response = await axiosInstance.get<ItemOption[]>(ITEMS_URL);
    return toArrayPayload<ItemOption>(response.data);
  },

  getCentralWarehouseItems: async (): Promise<CentralWarehouseItemOption[]> => {
    const response = await axiosInstance.get<CentralWarehouseItemOption[]>('/api/CentralWarehouseItems', {
      params: { includeInactive: false },
    });
    return toArrayPayload<CentralWarehouseItemOption>(response.data);
  },

  getUoms: async (): Promise<UomOption[]> => {
    const response = await axiosInstance.get<UomOption[]>(UOMS_URL);
    return toArrayPayload<UomOption>(response.data);
  },

  getItemCategories: async (): Promise<ItemCategoryOption[]> => {
    const response = await axiosInstance.get<ItemCategoryOption[]>(ITEM_CATEGORIES_URL);
    return toArrayPayload<ItemCategoryOption>(response.data);
  },

  getFeedSiloOptions: async (
    params?: { facilityId?: number; facilityCode?: string; houseId?: number },
    skipFacilityContext = false,
  ): Promise<FeedSiloOption[]> => {
    const response = await axiosInstance.get<FeedSiloOption[]>(`${INVENTORY_URL}/feed-silos/options`, {
      params,
      skipFacilityContext,
    } as any);
    return toArrayPayload<FeedSiloOption>(response.data);
  },

  receiveStock: async (data: ReceiveStockRequest, idempotencyKey?: string, skipFacilityContext = false): Promise<void> => {
    await axiosInstance.post(`${INVENTORY_URL}/receive`, data, {
      headers: idempotencyKey ? { 'Idempotency-Key': idempotencyKey } : undefined,
      skipFacilityContext,
    } as any);
  },

  createStockReceiveRequest: async (
    data: CreateStockReceiveRequest,
    idempotencyKey?: string,
    skipFacilityContext = false,
  ): Promise<StockReceiveRequestResponse> => {
    const response = await axiosInstance.post<StockReceiveRequestResponse>(STOCK_RECEIVE_REQUESTS_URL, data, {
      headers: idempotencyKey ? { 'Idempotency-Key': idempotencyKey } : undefined,
      skipFacilityContext,
    } as any);
    return toObjectPayload<StockReceiveRequestResponse>(response.data);
  },

  updateStockReceiveRequest: async (
    id: number,
    data: UpdateStockReceiveRequest,
    skipFacilityContext = false,
  ): Promise<StockReceiveRequestResponse> => {
    const response = await axiosInstance.put<StockReceiveRequestResponse>(
      `${STOCK_RECEIVE_REQUESTS_URL}/${id}`,
      data,
      { skipFacilityContext } as any,
    );
    return toObjectPayload<StockReceiveRequestResponse>(response.data);
  },

  finalizeStockReceiveRequest: async (
    id: number,
    skipFacilityContext = false,
  ): Promise<StockReceiveRequestResponse> => {
    const response = await axiosInstance.post<StockReceiveRequestResponse>(
      `${STOCK_RECEIVE_REQUESTS_URL}/${id}/finalize`,
      {},
      { skipFacilityContext } as any,
    );
    return toObjectPayload<StockReceiveRequestResponse>(response.data);
  },

  getAwaitingCompletionStockReceiveRequests: async (
    params?: { facilityId?: number; facilityCode?: string },
    skipFacilityContext = false,
  ): Promise<StockReceiveRequestResponse[]> => {
    const response = await axiosInstance.get<StockReceiveRequestResponse[]>(
      `${STOCK_RECEIVE_REQUESTS_URL}/awaiting-completion`,
      { params, skipFacilityContext } as any,
    );
    return toArrayPayload<StockReceiveRequestResponse>(response.data);
  },

  getPendingStockReceiveRequests: async (
    params?: { facilityId?: number; facilityCode?: string },
    skipFacilityContext = false,
  ): Promise<StockReceiveRequestResponse[]> => {
    const response = await axiosInstance.get<StockReceiveRequestResponse[]>(
      `${STOCK_RECEIVE_REQUESTS_URL}/pending`,
      { params, skipFacilityContext } as any,
    );
    return toArrayPayload<StockReceiveRequestResponse>(response.data);
  },

  getStockReceiveRequestById: async (
    id: number,
    skipFacilityContext = false,
  ): Promise<StockReceiveRequestResponse> => {
    const response = await axiosInstance.get<StockReceiveRequestResponse>(
      `${STOCK_RECEIVE_REQUESTS_URL}/${id}`,
      { skipFacilityContext } as any,
    );
    return toObjectPayload<StockReceiveRequestResponse>(response.data);
  },

  transferStock: async (
    data: TransferStockRequest,
    idempotencyKey?: string,
    skipFacilityContext = false,
  ): Promise<void> => {
    await axiosInstance.post(`${INVENTORY_URL}/transfer`, data, {
      headers: idempotencyKey ? { 'Idempotency-Key': idempotencyKey } : undefined,
      skipFacilityContext,
    } as any);
  },

  issueStock: async (
    data: IssueStockRequest,
    idempotencyKey?: string,
    skipFacilityContext = false,
  ): Promise<void> => {
    await axiosInstance.post(`${INVENTORY_URL}/issue`, data, {
      headers: idempotencyKey ? { 'Idempotency-Key': idempotencyKey } : undefined,
      skipFacilityContext,
    } as any);
  },

  adjustStock: async (
    data: AdjustmentStockRequest,
    idempotencyKey?: string,
    skipFacilityContext = false,
  ): Promise<void> => {
    await axiosInstance.post(`${INVENTORY_URL}/adjust`, data, {
      headers: idempotencyKey ? { 'Idempotency-Key': idempotencyKey } : undefined,
      skipFacilityContext,
    } as any);
  },

  getStockBalanceByWarehouse: async (
    warehouseId: number,
    skipFacilityContext = false,
  ): Promise<StockBalanceResponse[]> => {
    const response = await axiosInstance.get<StockBalanceResponse[]>(`${INVENTORY_URL}/balance`, {
      params: { warehouseId },
      skipFacilityContext,
    } as any);
    return toArrayPayload<StockBalanceResponse>(response.data);
  },

  getStockBalanceByItem: async (itemId: number): Promise<StockBalanceResponse[]> => {
    const response = await axiosInstance.get<StockBalanceResponse[]>(`${INVENTORY_URL}/balance`, {
      params: { itemId },
    });
    return toArrayPayload<StockBalanceResponse>(response.data);
  },

  getReceivablePurchaseRequests: async (params?: {
    warehouseId?: number;
    facilityId?: number;
    facilityCode?: string;
    keyword?: string;
    page?: number;
    pageSize?: number;
  }, skipFacilityContext = false): Promise<ReceivablePurchaseRequestPagedResponse> => {
    const response = await axiosInstance.get<ReceivablePurchaseRequestPagedResponse>(
      `${INVENTORY_URL}/receivable-purchase-requests`,
      { params, skipFacilityContext } as any,
    );
    if (response.data && typeof response.data === 'object' && 'data' in response.data) {
      return response.data;
    }
    return {
      data: toArrayPayload(response.data),
      totalCount: 0,
      page: params?.page ?? 1,
      pageSize: params?.pageSize ?? 20,
      totalPages: 0,
    };
  },

  getTransactions: async (params?: {
    warehouseId?: number;
    itemId?: number;
    type?: string;
    facilityId?: number;
    facilityCode?: string;
    includePig?: boolean;
    page?: number;
    pageSize?: number;
  }, skipFacilityContext = false): Promise<StockTransactionPagedResponse> => {
    const response = await axiosInstance.get<StockTransactionPagedResponse>(
      `${INVENTORY_URL}/transactions`,
      { params, skipFacilityContext } as any,
    );
    return response.data;
  },
};
