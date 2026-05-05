export type StockStatusFilter = 'all' | 'normal' | 'low' | 'out';
export type StockLotFilter = 'all' | 'withLot' | 'withoutLot';
export type WarehouseType = 'Farm' | 'Central' | string;
export type WarehouseTransactionMode =
  | 'receive'
  | 'transfer'
  | 'issue'
  | 'adjust';
export type IssueUsageTargetType = 'Production' | 'Vaccine' | 'Maintenance';

export interface ApiErrorResponse {
  code?: string;
  message?: string;
  traceId?: string;
}

export interface WarehouseResponse {
  id: number;
  code: string;
  name: string;
  description: string;
  warehouseType: WarehouseType;
  facilityNodeId: number | null;
  facilityNodeName: string | null;
  isCentralHub: boolean;
  isSystemWarehouse: boolean;
  isActive: boolean;
}

export interface ItemOption {
  id: number;
  code: string;
  name: string;
  cost?: number;
  minStockQty?: number | null;
  maxStockQty?: number | null;
  baseUomId: number;
  baseUomName?: string;
  itemCategoryName?: string;
  receiveUomId?: number;
  receiveUomName?: string;
  uomConversionId?: number;
  conversionFactor?: number;
  itemCategoryId: number;
  isActive: boolean;
  allowedUoms?: Array<{
    id: number;
    code: string;
    name: string;
    conversionFactor?: number;
  }>;
}

export interface CentralWarehouseItemOption {
  id: number;
  warehouseId: number;
  warehouseCode: string;
  warehouseName: string;
  itemId: number;
  itemCode: string;
  itemName: string;
  isCenterItem: boolean;
  isActive: boolean;
  minBookingQuantity?: number | null;
  maxBookingQuantity?: number | null;
}

export interface UomOption {
  id: number;
  code: string;
  name: string;
  isActive: boolean;
}

export interface ItemCategoryOption {
  id: number;
  code: string;
  name: string;
  isActive: boolean;
}

export interface FeedSiloOption {
  id: number;
  code: string;
  name: string;
  description: string;
  capacityKg: number;
  currentQuantityKg: number;
  availableCapacityKg: number;
  facilityNodeId: number;
  facilityName: string;
  houseId: number;
  houseCode: string;
  houseName: string;
  phaseZone: string;
}

export interface StockBalanceResponse {
  warehouseId: number;
  warehouseName: string;
  warehouseType: WarehouseType;
  itemId?: number | null;
  itemCode?: string;
  itemName?: string;
  pigItemId?: number | null;
  pigItemCode?: string;
  pigItemName?: string;
  stockLotId?: number;
  lotNumber: string;
  expiryDate?: string | null;
  lotCreatedDate?: string | null;
  feedSiloId?: number | null;
  feedSiloCode?: string;
  feedSiloName?: string;
  itemLotPolicyName?: string;
  itemLotStrategy?: string;
  isLotRequired?: boolean;
  isExpiryRequired?: boolean;
  quantity: number;
  uomId: number;
  reservedQuantity?: number;
  availableQuantity?: number;
  uomName: string;
  requestType?: string;
  id?: number | string;
  layers?: StockBalanceLayerResponse[];
}

export interface StockBalanceLayerResponse {
  id: number;
  stockBalanceId: number;
  stockLotId?: number | null;
  stockTransactionLineId?: number | null;
  stockReceiveRequestLineId?: number | null;
  stockReceiveLineExpiryId?: number | null;
  expiryDate?: string | null;
  receivedAt: string;
  receivedQuantity: number;
  remainingQuantity: number;
  unitCost: number;
  sourceDocumentType?: string;
  sourceDocumentId?: number | null;
}

export interface StockBalancePagedRow {
  warehouseId: number;
  warehouseName: string;
  warehouseType: WarehouseType;
  itemId?: number | null;
  itemCode?: string;
  itemName?: string;
  pigItemId?: number | null;
  pigItemCode?: string;
  pigItemName?: string;
  stockLotId?: number;
  lotNumber: string;
  feedSiloId?: number | null;
  feedSiloCode?: string;
  feedSiloName?: string;
  quantity: number;
  uomId: number;
  reservedQuantity?: number;
  availableQuantity?: number;
  uomName: string;
  requestType?: string;
  unitCost: number;
  stockValue: number;
  updatedDate?: string;
}

export interface StockBalancePagedResponse {
  data: StockBalancePagedRow[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
  totalStockValue: number;
}

export interface StockFacilityResponse {
  id: number;
  facilityNodeId: number;
  facilityCode: string;
  facilityName: string;
  itemId: number;
  itemCode: string;
  itemName: string;
  stockUomId: number;
  stockUomCode: string;
  stockUomName: string;
  onHandQuantity: number;
  reservedQuantity: number;
  status: string;
  lastAggregatedAt: string;
}

export interface StockFacilityRevisionResponse {
  revision: number | null;
  lastAggregatedAt: string | null;
  facilityNodeId: number | null;
}

export interface DashboardMetricResponse {
  totalStockValue: number;
  criticalStockCount: number;
  nearEmptyStockCount: number;
  pendingPRCount: number;
  pendingPrCount?: number;
  pendingReceiptCount: number;
  nearExpiryCount: number;
  expiredCount: number;
}

export interface ReceivablePurchaseRequestLine {
  purchaseRequestLineId: number;
  itemId?: number | null;
  itemCode: string;
  itemName: string;
  itemCategoryId?: number | null;
  itemCategoryCode?: string;
  itemCategoryName?: string;
  pigItemId?: number | null;
  pigItemCode?: string;
  pigItemName?: string;
  uomId: number;
  uomName: string;
  quantity: number;
  receivedQuantity: number;
  remainingQuantity: number;
  estimatedPrice: number;
  actualUnitPrice?: number | null;
  itemLotPolicyId?: number | null;
  itemLotPolicyName?: string;
  isLotRequired?: boolean;
  isExpiryRequired?: boolean;
  lotStrategy?: string;
  remarks?: string;
}

export interface ReceivablePurchaseRequestRow {
  id: number;
  documentNumber: string;
  requestDate: string;
  status: string;
  requestType?: string;
  urgency: string;
  facilityId: number;
  facilityName: string;
  destinationWarehouseId?: number | null;
  destinationWarehouseName: string;
  destinationWarehouseType: WarehouseType;
  requestorId: number;
  requestorName: string;
  totalQuantity: number;
  totalReceivedQuantity: number;
  totalRemainingQuantity: number;
  receiptStatus: 'NotReceived' | 'PartiallyReceived' | 'Completed' | string;
  pendingActivationStatus?: string;
  receiveCount: number;
  lastReceiveDate?: string | null;
  lines: ReceivablePurchaseRequestLine[];
}

export interface ReceivablePurchaseRequestPagedResponse {
  data: ReceivablePurchaseRequestRow[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface StockTransactionLineExpiryResponse {
  id: number;
  expiryDate: string;
  quantity: number;
}

export interface StockTransactionLineRow {
  id: number;
  itemId?: number | null;
  itemCode?: string;
  itemName?: string;
  pigItemId?: number | null;
  pigItemCode?: string;
  pigItemName?: string;
  lotNumber?: string | null;
  expiryDate?: string | null;
  expiryAllocations?: StockTransactionLineExpiryResponse[];
  feedSiloId?: number | null;
  feedSiloCode?: string;
  feedSiloName?: string;
  fromWarehouseId?: number | null;
  fromWarehouseName?: string | null;
  fromWarehouseType?: WarehouseType | null;
  toWarehouseId?: number | null;
  toWarehouseName?: string | null;
  toWarehouseType?: WarehouseType | null;
  quantity: number;
  uomName: string;
  isBagDisplay?: boolean;
  displayUomName?: string;
  kgPerDisplayUnit?: number;
  displayQuantity?: number;
  unitCost: number;
  remarks?: string | null;
}

export interface StockTransactionRow {
  id: number;
  documentNumber: string;
  transactionType: string;
  requestType?: string | null;
  sourceDocumentType?: string | null;
  sourceDocumentId?: number | null;
  sourceDocumentNumber?: string | null;
  sourceDocumentStatus?: string | null;
  issuePurpose?: string | null;
  usageTargetType?: string | null;
  usageFacilityNodeId?: number | null;
  usageFacilityName?: string | null;
  usageZone?: string | null;
  usageHouseId?: number | null;
  usageHouseName?: string | null;
  requestedByName?: string | null;
  receivedByName?: string | null;
  referenceDetail?: string | null;
  freightCost?: number | null;
  transactionDate: string;
  remarks: string;
  createdByUsername: string;
  lines: StockTransactionLineRow[];
}

export interface StockTransactionPagedResponse {
  data: StockTransactionRow[];
  totalCount: number;
  page: number;
  pageSize: number;
}

export interface StockWarehouseOption {
  warehouseId: number;
  warehouseName: string;
}

export interface StockFilterParams {
  search: string;
  warehouseId?: number;
  categoryId?: number;
  stockStatus: StockStatusFilter;
  lotFilter: StockLotFilter;
  includeZero: boolean;
  sortBy:
    | 'updatedDate'
    | 'itemCode'
    | 'itemName'
    | 'warehouseName'
    | 'quantity'
    | 'stockValue';
  sortDir: 'asc' | 'desc';
}

export interface StockPagedQueryParams {
  warehouseId?: number;
  itemId?: number;
  facilityId?: number;
  facilityCode?: string;
  type?: WarehouseType;
  keyword?: string;
  stockStatus?: StockStatusFilter;
  lotFilter?: StockLotFilter;
  includeZero?: boolean;
  includePig?: boolean;
  sortBy?: StockFilterParams['sortBy'];
  sortDir?: StockFilterParams['sortDir'];
  page?: number;
  pageSize?: number;
}

export interface ReceiveStockRequest {
  transactionType: 'Receive';
  transactionDate: string;
  sourceDocumentType?: string;
  sourceDocumentId?: number;
  remarks?: string;
  freightCost?: number;
  lines: ReceiveStockLineRequest[];
}

export interface ReceiveStockLineRequest {
  sourceDocumentLineId?: number;
  itemId?: number;
  pigItemId?: number;
  lotNumber?: string;
  expiryDate?: string;
  supplierLotNumber?: string;
  toWarehouseId: number;
  feedSiloId?: number;
  quantity: number;
  uomId: number;
  unitCost: number;
  remarks?: string;
}

export interface CreateStockReceiveRequestLineAllocation {
  feedSiloId: number;
  quantity: number;
}

export interface CreateStockReceiveRequestLineExpiry {
  expiryDate: string;
  quantity: number;
}

export interface CreateStockReceiveRequestLine {
  purchaseRequestLineId: number;
  itemId?: number;
  pigItemId?: number;
  uomId: number;
  receiveQuantity: number;
  unitCost?: number | null;
  lotNumber: string;
  expiryDate?: string;
  expiryAllocations?: CreateStockReceiveRequestLineExpiry[];
  remarks?: string;
  allocations?: CreateStockReceiveRequestLineAllocation[];
}

export interface CreateStockReceiveRequest {
  requestDate: string;
  purchaseRequestId: number;
  facilityId: number;
  warehouseId: number;
  receiverName: string;
  referenceDetail?: string;
  remarks?: string;
  freightCost?: number | null;
  lines: CreateStockReceiveRequestLine[];
}

export interface StockReceiveRequestLineAllocationResponse {
  id: number;
  feedSiloId: number;
  feedSiloCode: string;
  feedSiloName: string;
  quantity: number;
}

export interface StockReceiveRequestLineExpiryResponse {
  id: number;
  expiryDate: string;
  quantity: number;
}

export interface UpdateStockReceiveRequestLine {
  id: number;
  unitCost?: number | null;
  lotNumber: string;
  expiryDate?: string | null;
  expiryAllocations?: UpdateStockReceiveRequestLineExpiry[];
  remarks?: string;
  allocations?: UpdateStockReceiveRequestLineAllocation[];
}

export interface UpdateStockReceiveRequestLineAllocation {
  feedSiloId: number;
  quantity: number;
}

export interface UpdateStockReceiveRequestLineExpiry {
  expiryDate: string;
  quantity: number;
}

export interface UpdateStockReceiveRequest {
  receiverName: string;
  referenceDetail?: string;
  remarks?: string;
  freightCost?: number | null;
  lines: UpdateStockReceiveRequestLine[];
}

export interface StockReceiveRequestLineResponse {
  id: number;
  purchaseRequestLineId: number;
  itemId?: number | null;
  itemCode: string;
  itemName: string;
  itemCategoryCode?: string;
  itemCategoryName?: string;
  itemLotPolicyId?: number | null;
  itemLotPolicyName?: string;
  isLotRequired?: boolean | null;
  isExpiryRequired?: boolean | null;
  lotStrategy?: string;
  pigItemId?: number | null;
  pigItemCode?: string;
  pigItemName?: string;
  uomId: number;
  uomName: string;
  receiveQuantity: number;
  unitCost?: number | null;
  lockedUnitCost?: number | null;
  lotNumber: string;
  expiryDate?: string | null;
  remarks?: string;
  status: string;
  allocations: StockReceiveRequestLineAllocationResponse[];
  expiryAllocations: StockReceiveRequestLineExpiryResponse[];
}

export interface StockReceiveRequestResponse {
  id: number;
  documentNumber: string;
  requestDate: string;
  purchaseRequestId: number;
  purchaseRequestNumber: string;
  facilityId: number;
  facilityName: string;
  warehouseId: number;
  warehouseName: string;
  requestType: string;
  status: string;
  requestorId: number;
  requestorName: string;
  receiverName: string;
  freightCost?: number | null;
  referenceDetail?: string;
  remarks?: string;
  completedById?: number | null;
  completedByName?: string;
  completedDate?: string | null;
  stockTransactionId?: number | null;
  stockTransactionNumber?: string;
  lines: StockReceiveRequestLineResponse[];
}

export interface TransferStockRequest {
  transactionType: 'Transfer';
  transactionDate: string;
  remarks?: string;
  lines: TransferStockLineRequest[];
}

export interface TransferStockLineRequest {
  itemId: number;
  stockLotId?: number;
  fromWarehouseId: number;
  toWarehouseId: number;
  quantity: number;
  uomId: number;
  remarks?: string;
}

export interface IssueStockRequest {
  transactionType: 'Issue';
  transactionDate: string;
  issueType?: string;
  usageTargetType?: IssueUsageTargetType | string;
  targetFacilityNodeId?: number;
  targetZone?: string;
  targetHouseId?: number;
  remarks?: string;
  requestedByName: string;
  receivedByName: string;
  targetType?: string;
  referenceId?: number;
  referenceDetail?: string;
  lines: IssueStockLineRequest[];
}

export interface IssueStockLineRequest {
  itemId: number;
  stockLotId?: number;
  feedSiloId?: number;
  fromWarehouseId: number;
  quantity: number;
  uomId: number;
  remarks?: string;
}

export interface AdjustmentStockRequest {
  transactionType: 'Adjustment';
  transactionDate: string;
  remarks?: string;
  lines: AdjustmentStockLineRequest[];
}

export interface AdjustmentStockLineRequest {
  warehouseId: number;
  itemId: number;
  stockLotId?: number;
  uomId: number;
  newQuantity: number;
  reason?: string;
}
