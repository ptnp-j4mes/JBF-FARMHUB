export interface CreateStockAdjustmentRequestLinePayload {
  warehouseId: number;
  itemId: number;
  stockLotId?: number | null;
  uomId: number;
  newQuantity: number;
  reason: string;
}

export interface CreateStockAdjustmentRequestPayload {
  requestDate: string;
  facilityId: number;
  remarks?: string;
  lines: CreateStockAdjustmentRequestLinePayload[];
}

export interface StockAdjustmentRequestLineResponse {
  id: number;
  warehouseId: number;
  warehouseName: string;
  itemId: number;
  itemCode: string;
  itemName: string;
  stockLotId?: number | null;
  lotNumber?: string | null;
  uomId: number;
  uomName: string;
  reason: string;
  oldQuantitySnapshot: number;
  newQuantityRequested: number;
  deltaQuantitySnapshot: number;
  unitCostSnapshot: number;
  deltaValueSnapshot: number;
}

export interface StockAdjustmentRequestResponse {
  id: number;
  documentNumber: string;
  requestDate: string;
  facilityId: number;
  facilityName: string;
  status: string;
  requesterId: number;
  requesterName: string;
  approvedById?: number | null;
  approvedByName?: string;
  approvedDate?: string | null;
  remarks?: string;
  rejectionReason?: string;
  stockTransactionId?: number | null;
  stockTransactionNumber?: string | null;
  totalDeltaValue: number;
  lines: StockAdjustmentRequestLineResponse[];
}
