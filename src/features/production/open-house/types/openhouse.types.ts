/**
 * Production Module - Open House Types
 * 
 * Types for opening/preparing pig houses
 */

import type { BaseEntity } from '@/types';

/**
 * Open House Record
 */
export interface OpenHouseRecord extends BaseEntity {
  documentNumber: string;
  openDate: string;
  facilityId: number;
  facility?: string;
  expectedPigCount: number;
  expectedStartDate: string;
  batchNumber?: string;
  breedId?: number;
  breed?: string;
  pigTypeId?: number;
  pigType?: string;
  status: OpenHouseStatus;
  preparedById: number;
  preparedBy?: string;
  remarks?: string;
}

/**
 * Open House Status
 */
export enum OpenHouseStatus {
  Planned = 'Planned',
  Preparing = 'Preparing',
  Ready = 'Ready',
  Occupied = 'Occupied',
  Closed = 'Closed',
}

/**
 * Open House Request
 */
export interface OpenHouseRequest {
  openDate: string;
  facilityId: number;
  expectedPigCount: number;
  expectedStartDate: string;
  batchNumber?: string;
  breedId?: number;
  pigTypeId?: number;
  remarks?: string;
}

/**
 * Open House Response
 */
export interface OpenHouseResponse {
  id: number;
  documentNumber: string;
  openDate: string;
  facilityName: string;
  expectedPigCount: number;
  expectedStartDate: string;
  batchNumber?: string;
  breedName?: string;
  pigTypeName?: string;
  status: string;
  preparedBy: string;
  createdDate: string;
}
