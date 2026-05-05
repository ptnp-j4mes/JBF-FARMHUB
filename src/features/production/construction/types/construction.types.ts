/**
 * Production Module - Construction Types
 * 
 * Types for construction project management
 */

import type { BaseEntity } from '@/types';

/**
 * Construction Project
 */
export interface ConstructionProject extends BaseEntity {
  projectNumber: string;
  projectName: string;
  projectType: ConstructionType;
  facilityId?: number;
  facility?: string;
  startDate: string;
  expectedEndDate: string;
  actualEndDate?: string;
  budget: number;
  actualCost: number;
  status: ConstructionStatus;
  contractorName?: string;
  contractorContact?: string;
  managerId?: number;
  manager?: string;
  description?: string;
  remarks?: string;
}

/**
 * Construction Type
 */
export enum ConstructionType {
  NewBuilding = 'NewBuilding',
  Renovation = 'Renovation',
  Expansion = 'Expansion',
  Repair = 'Repair',
  Infrastructure = 'Infrastructure',
}

/**
 * Construction Status
 */
export enum ConstructionStatus {
  Planning = 'Planning',
  Approved = 'Approved',
  InProgress = 'InProgress',
  OnHold = 'OnHold',
  Completed = 'Completed',
  Canceled = 'Canceled',
}

/**
 * Construction Request
 */
export interface ConstructionRequest {
  projectName: string;
  projectType: ConstructionType;
  facilityId?: number;
  startDate: string;
  expectedEndDate: string;
  budget: number;
  contractorName?: string;
  contractorContact?: string;
  managerId?: number;
  description?: string;
  remarks?: string;
}

/**
 * Construction Response
 */
export interface ConstructionResponse {
  id: number;
  projectNumber: string;
  projectName: string;
  projectType: string;
  facilityName?: string;
  startDate: string;
  expectedEndDate: string;
  actualEndDate?: string;
  budget: number;
  actualCost: number;
  status: string;
  contractorName?: string;
  manager?: string;
  createdDate: string;
}
