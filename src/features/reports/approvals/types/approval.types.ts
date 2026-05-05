/**
 * Reports Module - Approval Types
 * 
 * Types for approval workflow and requests
 * Matches backend Models/Workflow/*.cs
 */

import type { BaseEntity } from '@/types';

/**
 * Approval Workflow - Matches backend ApprovalWorkflow.cs
 */
export interface ApprovalWorkflow extends BaseEntity {
  name: string;
  description?: string;
  documentType: string; // "PurchaseRequest", "WorkRequest", etc.
  steps: ApprovalWorkflowStep[];
}

/**
 * Approval Workflow Step - Matches backend ApprovalWorkflowStep.cs
 */
export interface ApprovalWorkflowStep extends BaseEntity {
  workflowId: number;
  stepOrder: number;
  stepName: string;
  approverRoleId: number;
  approverRole?: string;
  requiresAll: boolean; // true = all approvers must approve, false = any one
  isActive: boolean;
}

/**
 * Approval Request - Matches backend ApprovalRequest.cs
 */
export interface ApprovalRequest extends BaseEntity {
  workflowId: number;
  workflow?: ApprovalWorkflow;
  documentType: string;
  documentId: number;
  currentStepOrder: number;
  status: ApprovalStatus;
  requesterId: number;
  requester?: string;
  actions: ApprovalAction[];
}

/**
 * Approval Action - Matches backend ApprovalAction.cs
 */
export interface ApprovalAction extends BaseEntity {
  approvalRequestId: number;
  stepOrder: number;
  approverId: number;
  approver?: string;
  action: ApprovalActionType;
  actionDate: string;
  comments?: string;
}

/**
 * Approval Status
 */
export enum ApprovalStatus {
  Pending = 'Pending',
  Approved = 'Approved',
  Rejected = 'Rejected',
  Returned = 'Returned',
}

/**
 * Approval Action Type
 */
export enum ApprovalActionType {
  Approve = 'Approve',
  Reject = 'Reject',
  Return = 'Return',
}

/**
 * Approval Action Request - Matches backend ApprovalActionRequest.cs
 */
export interface ApprovalActionRequest {
  action: ApprovalActionType;
  comments?: string;
}

/**
 * Approval Request Response - Matches backend ApprovalRequestResponse.cs
 */
export interface ApprovalRequestResponse {
  id: number;
  documentType: string;
  documentId: number;
  documentNumber: string;
  currentStepOrder: number;
  currentStepName: string;
  status: string;
  requesterName: string;
  requestDate: string;
  actions: ApprovalActionResponse[];
}

/**
 * Approval Action Response
 */
export interface ApprovalActionResponse {
  id: number;
  stepOrder: number;
  stepName: string;
  approverName: string;
  action: string;
  actionDate: string;
  comments?: string;
}

/**
 * Approval List Response
 */
export interface ApprovalListResponse {
  items: ApprovalRequestResponse[];
  totalCount: number;
  pendingCount: number;
}
