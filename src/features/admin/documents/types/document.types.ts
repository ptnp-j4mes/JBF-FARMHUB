/**
 * Admin Module - Document Types
 * 
 * Types for document management system
 */

import type { BaseEntity } from '@/types';

/**
 * Document Model
 */
export interface Document extends BaseEntity {
  documentNumber: string;
  title: string;
  description?: string;
  documentType: DocumentType;
  category: string;
  fileUrl: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  version: number;
  status: DocumentStatus;
  uploadedById: number;
  uploadedBy?: string;
  tags: string[];
  relatedEntityType?: string;
  relatedEntityId?: number;
}

/**
 * Document Type
 */
export enum DocumentType {
  Policy = 'Policy',
  Procedure = 'Procedure',
  Form = 'Form',
  Report = 'Report',
  Certificate = 'Certificate',
  Contract = 'Contract',
  Other = 'Other',
}

/**
 * Document Status
 */
export enum DocumentStatus {
  Draft = 'Draft',
  Active = 'Active',
  Archived = 'Archived',
  Obsolete = 'Obsolete',
}

/**
 * Document Upload Request
 */
export interface DocumentUploadRequest {
  title: string;
  description?: string;
  documentType: DocumentType;
  category: string;
  file: File;
  tags?: string[];
  relatedEntityType?: string;
  relatedEntityId?: number;
}

/**
 * Document Update Request
 */
export interface DocumentUpdateRequest {
  title?: string;
  description?: string;
  category?: string;
  tags?: string[];
  status?: DocumentStatus;
}

/**
 * Document Response
 */
export interface DocumentResponse {
  id: number;
  documentNumber: string;
  title: string;
  description?: string;
  documentType: string;
  category: string;
  fileUrl: string;
  fileName: string;
  fileSize: number;
  version: number;
  status: string;
  uploadedBy: string;
  uploadedDate: string;
  tags: string[];
}
/**
 * Document Filter Params
 */
export interface DocumentFilterParams {
  documentType: string;
  status: string;
  search: string;
}
