export interface PigMovementRow {
  id: number;
  pigBatchId?: number | null;
  transactionType: string;
  detail: string;
  quantity: number;
  facilityName: string;
  warehouseName: string;
  houseName: string;
  batchNo: string;
  transactionDate: string;
}

export interface PigMovementPagedResponse {
  data: PigMovementRow[];
  totalCount: number;
}

export interface TransferPigRequest {
  pigBatchId: number;
  toFacilityId: number;
  toHouseId: number;
  reason: string;
}

export interface ExportPigRequest {
  pigBatchId: number;
  quantity: number;
  destination: string;
  priceTotal?: number;
  remarks?: string;
}

export interface RecordMortalityRequest {
  pigBatchId: number;
  quantity: number;
  type: string;
  mortalityCauseId: number;
  diseaseId?: number;
  remarks?: string;
}
