/**
 * Reports Module - Report Types
 * 
 * Types for report center and report generation
 */

/**
 * Report Definition
 */
export interface ReportDefinition {
  id: string;
  name: string;
  description: string;
  category: ReportCategory;
  icon?: string;
  parameters: ReportParameter[];
  supportedFormats: ExportFormat[];
}

/**
 * Report Category
 */
export enum ReportCategory {
  Financial = 'Financial',
  Operational = 'Operational',
  Inventory = 'Inventory',
  Health = 'Health',
  Production = 'Production',
  Custom = 'Custom',
}

/**
 * Report Parameter
 */
export interface ReportParameter {
  name: string;
  label: string;
  type: ParameterType;
  required: boolean;
  defaultValue?: unknown;
  options?: Array<{ label: string; value: unknown }>;
}

/**
 * Parameter Type
 */
export enum ParameterType {
  Text = 'Text',
  Number = 'Number',
  Date = 'Date',
  DateRange = 'DateRange',
  Select = 'Select',
  MultiSelect = 'MultiSelect',
  Boolean = 'Boolean',
}

/**
 * Export Format
 */
export enum ExportFormat {
  PDF = 'PDF',
  Excel = 'Excel',
  CSV = 'CSV',
  JSON = 'JSON',
}

/**
 * Report Request
 */
export interface ReportRequest {
  reportId: string;
  parameters: Record<string, unknown>;
  format: ExportFormat;
}

/**
 * Report Response
 */
export interface ReportResponse {
  reportId: string;
  reportName: string;
  generatedDate: string;
  fileUrl: string;
  fileName: string;
  fileSize: number;
  format: string;
}

/**
 * Report History
 */
export interface ReportHistory {
  id: number;
  reportId: string;
  reportName: string;
  generatedBy: string;
  generatedDate: string;
  parameters: Record<string, unknown>;
  format: string;
  fileUrl: string;
  fileSize: number;
}

/**
 * Report History List Response
 */
export interface ReportHistoryListResponse {
  items: ReportHistory[];
  totalCount: number;
}

/**
 * Scheduled Report
 */
export interface ScheduledReport {
  id: number;
  reportId: string;
  reportName: string;
  schedule: ReportSchedule;
  parameters: Record<string, unknown>;
  format: ExportFormat;
  recipients: string[];
  isActive: boolean;
  lastRunDate?: string;
  nextRunDate?: string;
}

/**
 * Report Schedule
 */
export interface ReportSchedule {
  frequency: ScheduleFrequency;
  time: string; // HH:mm format
  dayOfWeek?: number; // 0-6 for weekly
  dayOfMonth?: number; // 1-31 for monthly
}

/**
 * Schedule Frequency
 */
export enum ScheduleFrequency {
  Daily = 'Daily',
  Weekly = 'Weekly',
  Monthly = 'Monthly',
}
