export interface BuildingOpeningChecklistResponse {
  id: number;
  checklistCode: string;
  checklistLabel: string;
  category: string;
  isChecked: boolean;
  sortOrder: number;
  checkedByUserId?: number | null;
  checkedByName?: string | null;
  checkedDate?: string | null;
}

export interface BuildingOpeningResponse {
  id: number;
  documentNumber: string;
  requestDate: string;
  facilityId: number;
  facilityName: string;
  houseCode: string;
  houseName: string;
  zone?: string | null;
  generation?: string | null;
  pigSource: string;
  quantity: number;
  expectedReceiveDate?: string | null;
  avgWeight?: number | null;
  pricePerHead?: number | null;
  totalAmount: number;
  status: string;
  checklistTotal: number;
  checklistCompleted: number;
  actualReceivedQuantity?: number | null;
  receivedDate?: string | null;
  pigBatchId?: number | null;
  pigBatchNo?: string | null;
  sourceWarehouseId?: number | null;
  sourceWarehouseName?: string | null;
  issueTransactionId?: number | null;
  remarks?: string | null;
  requestorId: number;
  requestorName: string;
  checklists: BuildingOpeningChecklistResponse[];
  receiveLines?: BuildingOpeningReceiveLineResponse[];
}

export interface BuildingOpeningReceiveLineResponse {
  id: number;
  lineNo: number;
  pigBatchId: number;
  pigBatchNo: string;
  sourceWarehouseId: number;
  sourceWarehouseName: string;
  sourceFacilityId: number;
  sourceFacilityName: string;
  actualReceivedQuantity: number;
  receivedDate: string;
  unitCost: number;
  lineAmount: number;
  issueTransactionId?: number | null;
  remarks?: string | null;
}

export interface CreateBuildingOpeningRequest {
  facilityId: number;
  houseCode: string;
  houseName: string;
  zone?: string;
  generation?: string;
  pigSource: string;
  quantity: number;
  expectedReceiveDate?: string;
  avgWeight?: number;
  pricePerHead?: number;
  remarks?: string;
}

export interface CompleteBuildingOpeningRequest {
  receivedDate?: string;
  receiveLines: Array<{
    pigBatchId: number;
    actualReceivedQuantity: number;
    receivedDate?: string;
    remarks?: string;
  }>;
}

export interface UpdateBuildingOpeningChecklistsRequest {
  checklists: Array<{
    id: number;
    isChecked: boolean;
  }>;
}

export interface BuildingOpeningApprovalActionRequest {
  comment?: string;
}

export interface BuildingOpeningPigBatchOptionResponse {
  pigBatchId: number;
  pigBatchNo: string;
  facilityId: number;
  facilityName: string;
  warehouseId: number;
  warehouseName: string;
  availableQuantity: number;
  receivedDate: string;
  unitCost?: number | null;
  itemCode: string;
  itemName: string;
}

export interface BuildingOpeningFacilityOption {
  id: number;
  code: string;
  name: string;
  type: string;
}

export interface BuildingOpeningCreateOptionsResponse {
  facilities: BuildingOpeningFacilityOption[];
  pigSources: BuildingOpeningPigSourceOption[];
  houses: BuildingOpeningHouseOption[];
}

export interface BuildingOpeningPigSourceOption {
  id: number;
  sourceCode: string;
  sourceName: string;
}

export interface BuildingOpeningHouseOption {
  id: number;
  facilityNodeId: number;
  zoneName?: string | null;
  houseCode: string;
  houseName: string;
  sortOrder: number;
}

export interface BuildingOpeningFilterParams {
  searchTerm: string;
  requestDateFrom?: string;
  requestDateTo?: string;
  requestDate?: string;
  facilityId?: number | null;
  houseId?: number | null;
  status: 'all' | 'Draft' | 'Submitted' | 'Returned' | 'Rejected' | 'InProgress' | 'AwaitingReceive' | 'Completed' | 'Cancelled';
}
