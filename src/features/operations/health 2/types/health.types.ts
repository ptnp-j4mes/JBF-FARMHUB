/**
 * Operations Module - Health Types
 * 
 * Types for health monitoring and treatment records
 */

import type { BaseEntity } from '@/types';

/**
 * Health Record
 */
export interface HealthRecord extends BaseEntity {
  pigId: string;
  facilityId: number;
  facility?: string;
  recordDate: string;
  recordType: HealthRecordType;
  diseaseId?: number;
  disease?: string;
  symptoms?: string;
  diagnosis?: string;
  treatmentTypeId?: number;
  treatmentType?: string;
  medication?: string;
  dosage?: string;
  veterinarianId?: number;
  veterinarian?: string;
  nextFollowUpDate?: string;
  status: HealthRecordStatus;
  remarks?: string;
}

/**
 * Health Record Type
 */
export enum HealthRecordType {
  Checkup = 'Checkup',
  Vaccination = 'Vaccination',
  Treatment = 'Treatment',
  Surgery = 'Surgery',
  Quarantine = 'Quarantine',
}

/**
 * Health Record Status
 */
export enum HealthRecordStatus {
  Ongoing = 'Ongoing',
  Recovered = 'Recovered',
  Monitoring = 'Monitoring',
  Deceased = 'Deceased',
}

/**
 * Mortality Record
 */
export interface MortalityRecord extends BaseEntity {
  pigId: string;
  facilityId: number;
  facility?: string;
  deathDate: string;
  mortalityTypeId: number;
  mortalityType?: string;
  mortalityCauseId: number;
  mortalityCause?: string;
  age: number; // in days
  weight: number;
  reportedById: number;
  reportedBy?: string;
  remarks?: string;
}

/**
 * Health Request
 */
export interface HealthRequest {
  pigId: string;
  facilityId: number;
  recordDate: string;
  recordType: HealthRecordType;
  diseaseId?: number;
  symptoms?: string;
  diagnosis?: string;
  treatmentTypeId?: number;
  medication?: string;
  dosage?: string;
  veterinarianId?: number;
  nextFollowUpDate?: string;
  remarks?: string;
}

/**
 * Health Response
 */
export interface HealthResponse {
  id: number;
  pigId: string;
  facilityName: string;
  recordDate: string;
  recordType: string;
  diseaseName?: string;
  symptoms?: string;
  diagnosis?: string;
  treatmentTypeName?: string;
  medication?: string;
  veterinarian?: string;
  status: string;
  createdDate: string;
}

/**
 * Health Summary
 */
export interface HealthSummary {
  totalRecords: number;
  activeCase: number;
  recovered: number;
  deceased: number;
  byRecordType: Array<{
    type: string;
    count: number;
  }>;
  byDisease: Array<{
    diseaseId: number;
    diseaseName: string;
    count: number;
  }>;
  mortalityRate: number; // percentage
}
