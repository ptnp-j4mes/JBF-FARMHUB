/**
 * Operations Module - Facility Types
 * 
 * Types for facility/farm structure management
 * Matches backend Models/Facility/FacilityNode.cs
 */

import type { BaseEntity } from '@/types';

/**
 * Facility Node - Hierarchical structure (Farm > Zone > Building > Room > Pen)
 * Matches backend FacilityNode.cs
 */
export interface FacilityNode extends BaseEntity {
  parentId: number | null;
  parent?: FacilityNode;
  children: FacilityNode[];
  code: string;
  name: string;
  description: string;
  type: FacilityType;
  capacity?: number; // For pens/rooms
  currentOccupancy?: number;
  status?: FacilityStatus;
}

/**
 * Facility Type
 */
export enum FacilityType {
  Farm = 'Farm',
  Zone = 'Zone',
  Building = 'Building',
  Room = 'Room',
  Pen = 'Pen',
}

/**
 * Facility Status
 */
export enum FacilityStatus {
  Active = 'Active',
  Inactive = 'Inactive',
  Maintenance = 'Maintenance',
  Closed = 'Closed',
}

/**
 * Facility Node Request - Matches backend FacilityNodeRequest.cs
 */
export interface FacilityNodeRequest {
  parentId?: number;
  code: string;
  name: string;
  description?: string;
  type: FacilityType;
  capacity?: number;
}

/**
 * Facility Node Response - Matches backend FacilityNodeResponse.cs
 */
export interface FacilityNodeResponse {
  id: number;
  parentId: number | null;
  parentName?: string;
  code: string;
  name: string;
  description: string;
  type: string;
  capacity?: number;
  currentOccupancy?: number;
  status: string;
  children: FacilityNodeResponse[];
  isActive: boolean;
}

/**
 * Facility Tree Response (for hierarchical display)
 */
export interface FacilityTreeResponse {
  nodes: FacilityNodeResponse[];
  totalCount: number;
}
