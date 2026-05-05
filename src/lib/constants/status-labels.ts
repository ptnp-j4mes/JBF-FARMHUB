import { DocumentStatus } from '@/types/status.types';

/**
 * Centralized Thai labels for document statuses.
 * Maps 1:1 with DocumentStatus enum.
 */
export const DOCUMENT_STATUS_THAI: Record<string, string> = {
  [DocumentStatus.Draft]: 'ฉบับร่าง',
  [DocumentStatus.Pending]: 'รอดำเนินการ',
  [DocumentStatus.Approved]: 'อนุมัติ',
  [DocumentStatus.Rejected]: 'ไม่อนุมัติ',
  [DocumentStatus.Cancelled]: 'ยกเลิกคำขอ',
  [DocumentStatus.PartiallyReceived]: 'กำลังดำเนินการ',
  [DocumentStatus.Completed]: 'เสร็จสิ้น',
  [DocumentStatus.Returned]: 'ตีกลับ',
};

/**
 * Tones for status chips.
 */
export const STATUS_TONE_MAP: Record<string, string> = {
  [DocumentStatus.Draft]: 'Draft',
  [DocumentStatus.Pending]: 'Pending',
  [DocumentStatus.Returned]: 'Returned',
  [DocumentStatus.Approved]: 'Approved',
  [DocumentStatus.PartiallyReceived]: 'PartiallyReceived',
  [DocumentStatus.Completed]: 'Completed',
  [DocumentStatus.Rejected]: 'Rejected',
  [DocumentStatus.Cancelled]: 'Cancelled',
};

/**
 * Centralized Thai labels for urgency levels.
 */
export const URGENCY_LABELS_THAI: Record<string, string> = {
  'Normal': 'ปกติ',
  'High': 'ด่วน',
  'Urgent': 'เร่งด่วน',
};
