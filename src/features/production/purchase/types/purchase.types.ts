/**
 * Production Module - Purchase Types
 * 
 * Types for purchase request management
 * Matches backend Models/Purchase/*.cs
 */

import type { BaseEntity } from '@/types';
import { DocumentStatus } from '@/types/status.types';

/**
 * Purchase Request - Matches backend PurchaseRequest.cs
 */
export interface PurchaseRequest extends BaseEntity {
  documentNumber: string;
  requestDate: string;
  requestorId: number;
  requestor?: string;
  facilityId: number;
  facility?: string;
  status: DocumentStatus;
  urgency: UrgencyLevel;
  routeType: PurchaseRequestRouteType;
  remarks: string;
  lines: PurchaseRequestLine[];
}

export const PURCHASE_REQUEST_SOURCE = {
  ExternalPurchase: 'ExternalPurchase',
  CentralBooking: 'CentralBooking',
} as const;

export type PurchaseRequestSource =
  (typeof PURCHASE_REQUEST_SOURCE)[keyof typeof PURCHASE_REQUEST_SOURCE];

export const PURCHASE_REQUEST_ROUTE_TYPE = {
  CentralOnly: 'CentralOnly',
  ExternalOnly: 'ExternalOnly',
  Mixed: 'Mixed',
} as const;

export type PurchaseRequestRouteType =
  (typeof PURCHASE_REQUEST_ROUTE_TYPE)[keyof typeof PURCHASE_REQUEST_ROUTE_TYPE];

/**
 * Purchase Request Line - Matches backend PurchaseRequestLine.cs
 */
export interface PurchaseRequestLine extends BaseEntity {
  purchaseRequestId: number;
  itemId?: number | null;
  item?: string;
  quantity: number;
  uomId: number;
  uom?: string;
  estimatedPrice: number;
  remarks: string;
  requestSource: PurchaseRequestSource;
  isCenter: boolean;
  reservedQuantity: number;
  issuedQuantity: number;
  sourceWarehouseId?: number | null;
  sourceWarehouseName?: string;
}

/**
 * Purchase Request Status
 */
export enum PurchaseRequestStatus {
  Draft = 'Draft',
  Pending = 'Pending',
  Returned = 'Returned',
  Approved = 'Approved',
  Rejected = 'Rejected',
  Cancelled = 'Cancelled',
  Completed = 'Completed',
}

/**
 * Urgency Level
 */
export enum UrgencyLevel {
  Normal = 'Normal',
  High = 'High',
  Urgent = 'Urgent',
}

export enum PurchaseRequestType {
  Material = 'Material',
  Pig = 'Pig',
}

/**
 * Create Purchase Request - Matches backend CreatePurchaseRequest.cs
 */
export interface CreatePurchaseRequest {
  facilityId: number;
  destinationWarehouseId?: number;
  requestType?: PurchaseRequestType;
  department: string;
  urgency: UrgencyLevel;
  remarks?: string;
  lines: PurchaseRequestLineRequest[];
}

/**
 * Purchase Request Line Request
 */
export interface PurchaseRequestLineRequest {
  itemId?: number | null;
  pigItemId?: number;
  quantity: number;
  uomId: number;
  estimatedPrice: number;
  remarks?: string;
}

/**
 * Purchase Request Response - Matches backend PurchaseRequestResponse.cs
 */
export interface PurchaseRequestResponse {
  id: number;
  documentNumber: string;
  requestDate: string;
  status: string;
  requestType: PurchaseRequestType;
  urgency: string;
  routeType: PurchaseRequestRouteType;
  requestorId: number;
  requestorName: string;
  facilityId: number;
  facilityName: string;
  destinationWarehouseId?: number | null;
  destinationWarehouseName: string;
  destinationWarehouseType: string;
  department: string;
  remarks: string;
  approval?: PurchaseRequestApprovalInfo;
  lines: PurchaseRequestLineResponse[];
}

/**
 * Purchase Request Line Response
 */
export interface PurchaseRequestLineResponse {
  id: number;
  itemId?: number | null;
  itemName: string;
  itemCode: string;
  pigItemId?: number | null;
  pigItemName?: string;
  pigItemCode?: string;
  quantity: number;
  receivedQuantity: number;
  uomId: number;
  uomName: string;
  estimatedPrice: number;
  remarks: string;
  requestSource: PurchaseRequestSource;
  isCenter: boolean;
  reservedQuantity: number;
  issuedQuantity: number;
  sourceWarehouseId?: number | null;
  sourceWarehouseName?: string;
}

export interface PurchaseRequestApprovalInfo {
  approvalRequestId: number;
  status: string;
  currentStepOrder: number;
  currentStepName: string;
  currentApproverRole: string;
  steps: PurchaseRequestApprovalStepInfo[];
  actions: PurchaseRequestApprovalActionInfo[];
}

export interface PurchaseRequestApprovalStepInfo {
  stepOrder: number;
  stepName: string;
  approverRole: string;
  isFinalStep: boolean;
}

export interface PurchaseRequestApprovalActionInfo {
  stepOrder: number;
  action: string;
  comment: string;
  actionDate: string;
  approverId: number;
  approverName: string;
}

/**
 * Purchase Request List Response
 */
export interface PurchaseRequestListResponse {
  items: PurchaseRequestResponse[];
  totalCount: number;
}

/**
 * Purchase Filter Params
 */
export interface PurchaseFilterParams {
  searchTerm: string;
  requestDateFrom: string;
  requestDateTo: string;
  requestDate?: string;
  status: string;
  facilityId?: number | null;
}

export interface ApprovalPendingItem {
  id: number;
  documentType: string;
  documentId: number;
  status: string;
  currentStepOrder: number;
  currentStepName: string;
  currentApproverRole?: string;
  requesterName: string;
  requestedDate: string;
}

export interface PurchaseRequestCreateOptionsResponse {
  departments: PurchaseRequestDepartmentOption[];
  facilities: PurchaseRequestFacilityOption[];
  warehouses: PurchaseRequestWarehouseOption[];
  items: PurchaseRequestItemOption[];
  pigItems: PurchaseRequestItemOption[];
  pigItemCategories: PurchaseRequestItemCategoryOption[];
  breeds: PurchaseRequestBreedOption[];
  uoms: PurchaseRequestUomOption[];
  centralWarehouseItems: CentralWarehouseItemOption[];
}

export interface PurchaseRequestDepartmentOption {
  id: number;
  departmentCode: string;
  departmentName: string;
}

export interface PurchaseRequestFacilityOption {
  id: number;
  code: string;
  name: string;
  type: string;
  isCentralHub: boolean;
}

export interface PurchaseRequestItemOption {
  id: number;
  code: string;
  name: string;
  baseUomId: number;
  baseUomName: string;
  cost: number;
  allowedUoms: PurchaseRequestUomOption[];
}

export interface PurchaseRequestItemCategoryOption {
  id: number;
  code: string;
  name: string;
}

export interface PurchaseRequestUomOption {
  id: number;
  code: string;
  name: string;
}

export interface PurchaseRequestBreedOption {
  id: number;
  code: string;
  name: string;
  description: string;
}

export interface PurchaseRequestWarehouseOption {
  id: number;
  code: string;
  name: string;
  warehouseType: string;
  facilityNodeId?: number | null;
  facilityNodeName?: string | null;
  isCentralHub?: boolean;
}

export interface CentralWarehouseItemOption {
  id: number;
  warehouseId: number;
  warehouseName: string;
  itemId: number;
  isCenterItem: boolean;
  minBookingQuantity?: number;
  maxBookingQuantity?: number;
}
