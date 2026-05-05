/**
 * Operations Module - Pig Stock Types
 *
 * Backed by: GET /api/PigBatches
 */

export interface PigBatchRow {
  id: number;
  batchNo: string;
  itemId?: number | null;
  itemCode: string;
  itemName: string;
  pigItemId?: number | null;
  pigItemCode?: string;
  pigItemName?: string;
  initialQuantity: number;
  currentQuantity: number;
  unitCost?: number | null;
  uomId: number;
  uomName: string;
  warehouseId: number;
  warehouseCode: string;
  warehouseName: string;
  currentHouseCode?: string | null;
  currentHouseName?: string | null;
  facilityNodeId: number;
  facilityCode: string;
  facilityName: string;
  stockLotId: number;
  lotNumber: string;
  sourcePurchaseRequestId?: number | null;
  sourcePurchaseRequestNumber?: string | null;
  sourcePurchaseRequestLineId?: number | null;
  receivedDate: string;
  status: string;
  remarks: string;
  isActive: boolean;
  createdDate: string;
  updatedDate?: string | null;
}

export interface PigBatchPagedResponse {
  data: PigBatchRow[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface PigBatchQueryParams {
  facilityId?: number;
  facilityCode?: string;
  batchNo?: string;
  warehouseId?: number;
  itemId?: number;
  status?: string;
  keyword?: string;
  includeInactive?: boolean;
  sortBy?: string;
  sortDir?: 'asc' | 'desc';
  page?: number;
  pageSize?: number;
}

export interface PigBatchItemOption {
  id: number;
  code: string;
  name: string;
  pigItemId?: number | null;
}

export interface PigBatchHouseAssignment {
  buildingOpeningId: number;
  buildingOpeningDocumentNumber: string;
  status: string;
  zone?: string | null;
  houseCode: string;
  houseName: string;
  actualReceivedQuantity?: number | null;
  receivedDate?: string | null;
  issueTransactionId?: number | null;
  issueTransactionDate?: string | null;
  issueByName?: string | null;
}

export interface PigBatchTraceDetail {
  pigBatchId: number;
  batchNo: string;
  itemId?: number | null;
  itemCode: string;
  itemName: string;
  pigItemId?: number | null;
  pigItemCode?: string;
  pigItemName?: string;
  unitCost?: number | null;
  sourcePurchaseRequestId?: number | null;
  sourcePurchaseRequestNumber?: string | null;
  warehouseId: number;
  warehouseCode: string;
  warehouseName: string;
  currentHouseCode?: string | null;
  currentHouseName?: string | null;
  facilityNodeId: number;
  facilityCode: string;
  facilityName: string;
  receivedDate: string;
  receivedByName?: string | null;
  receiveTransactionId?: number | null;
  receiveDocumentNumber?: string | null;
  receiveTransactionDate?: string | null;
  houseAssignments: PigBatchHouseAssignment[];
}
