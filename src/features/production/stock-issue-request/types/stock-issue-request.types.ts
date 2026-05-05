import type { WarehouseType } from '@/features/production/stock/types';

export interface StockIssueRequestFacilityOption {
  id: number;
  code: string;
  name: string;
  type: string;
}

export interface StockIssueRequestHouseOption {
  id: number;
  facilityNodeId: number;
  zoneName: string;
  houseCode: string;
  houseName: string;
}

export interface StockIssueRequestWarehouseOption {
  id: number;
  code: string;
  name: string;
  warehouseType: WarehouseType;
  facilityNodeId?: number | null;
  facilityNodeName?: string;
  isCentralHub?: boolean;
}

export interface StockIssueRequestUomOption {
  id: number;
  code: string;
  name: string;
}

export interface StockIssueRequestCreateOptionsResponse {
  facilities: StockIssueRequestFacilityOption[];
  houses: StockIssueRequestHouseOption[];
  warehouses: StockIssueRequestWarehouseOption[];
  uoms: StockIssueRequestUomOption[];
}

export interface StockIssueRequestLineResponse {
  id: number;
  itemId: number;
  itemCode: string;
  itemName: string;
  warehouseId: number;
  warehouseName: string;
  stockLotId?: number | null;
  lotNumber?: string | null;
  feedSiloId?: number | null;
  feedSiloCode?: string;
  feedSiloName?: string;
  uomId: number;
  uomName: string;
  requestedQuantity: number;
  reservedQuantity: number;
  availableQuantity: number;
  isBagDisplay?: boolean;
  displayUomName?: string;
  kgPerDisplayUnit?: number;
  displayRequestedQuantity?: number;
  displayAvailableQuantity?: number;
  remarks?: string;
}

export interface StockIssueRequestResponse {
  id: number;
  documentNumber: string;
  requestDate: string;
  facilityId: number;
  facilityName: string;
  status: string;
  issuePurpose: string;
  usageTargetType: string;
  usageZone?: string;
  usageHouseId?: number | null;
  usageHouseName?: string;
  requestorId: number;
  requestorName: string;
  approvedById?: number | null;
  approvedByName?: string;
  approvedDate?: string | null;
  confirmedById?: number | null;
  confirmedByName?: string;
  confirmedDate?: string | null;
  referenceDetail?: string;
  remarks?: string;
  rejectionReason?: string;
  sourcePurchaseRequestId?: number | null;
  sourcePurchaseRequestNumber?: string;
  stockTransactionId?: number | null;
  stockTransactionNumber?: string | null;
  lines: StockIssueRequestLineResponse[];
}

export interface CreateStockIssueRequestLinePayload {
  itemId: number;
  warehouseId: number;
  stockLotId?: number | null;
  feedSiloId?: number | null;
  uomId: number;
  quantity: number;
  remarks?: string;
}

export interface CreateStockIssueRequestPayload {
  requestDate: string;
  facilityId: number;
  issuePurpose: string;
  usageTargetType: string;
  usageZone?: string;
  usageHouseId?: number | null;
  referenceDetail?: string;
  remarks?: string;
  sourcePurchaseRequestId?: number | null;
  lines: CreateStockIssueRequestLinePayload[];
}
