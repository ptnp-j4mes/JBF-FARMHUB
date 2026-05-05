import { alpha } from '@mui/material/styles';
import { DOCUMENT_STATUS_THAI, STATUS_TONE_MAP } from '../constants/status-labels';

/**
 * Convert internal workflow status to Thai label for UI display.
 * Do not use this for API payloads; keep original status codes for backend operations.
 */
export const toThaiWorkflowStatus = (status?: string | null): string => {
  if (!status) return '-';
  
  const normalized = String(status).trim();
  
  // Try direct map lookup
  if (DOCUMENT_STATUS_THAI[normalized]) {
    return DOCUMENT_STATUS_THAI[normalized];
  }

  // Case-insensitive lookup as fallback
  const upper = normalized.toUpperCase();
  const entry = Object.entries(DOCUMENT_STATUS_THAI).find(
    ([key]) => key.toUpperCase() === upper
  );

  if (entry) return entry[1];

  return normalized;
};

const toWorkflowTone = (status?: string | null): string => {
  if (!status) return 'pending';
  
  const normalized = String(status).trim();
  
  // Direct lookup
  if (STATUS_TONE_MAP[normalized]) {
    return STATUS_TONE_MAP[normalized];
  }

  // Case-insensitive lookup
  const upper = normalized.toUpperCase();
  const entry = Object.entries(STATUS_TONE_MAP).find(
    ([key]) => key.toUpperCase() === upper
  );

  if (entry) return entry[1];

  return 'Pending';
};

export const getWorkflowStatusChipSx = (status?: string | null) => {
  const tone = toWorkflowTone(status);

  const palette: Record<string, { bg: string; text: string }> = {
    Draft: { bg: '#f9fafb', text: '#4b5563' }, // Softer Gray
    Pending: { bg: '#fffbeb', text: '#92400e' }, // Softer Amber/Orange
    Approved: { bg: '#FEF3F2', text: '#912018' }, // Primary red soft
    Rejected: { bg: '#fef2f2', text: '#991b1b' }, // Softer Red
    Cancelled: { bg: '#fff1f2', text: '#be123c' }, // Softer Crimson
    PartiallyReceived: { bg: '#eff6ff', text: '#1e40af' }, // Softer Blue
    Completed: { bg: '#FEF3F2', text: '#912018' }, // Primary red soft
    Returned: { bg: '#f5f3ff', text: '#5b21b6' }, // Softer Purple
  };

  const defaultPalette = { bg: '#fef3c7', text: '#b45309' };
  const currentPalette = palette[tone] || defaultPalette;

  return {
    bgcolor: `${currentPalette.bg} !important`,
    color: `${currentPalette.text} !important`,
    fontWeight: 600,
    borderRadius: '999px',
    height: 28,
    border: `1px solid ${alpha(currentPalette.text, 0.2)} !important`,
    '& .MuiChip-label': {
      px: 1.25,
    },
  };
};

const CHECKLIST_EDITABLE_STATUSES = ['SUBMITTED', 'RETURNED', 'INPROGRESS', 'AWAITINGRECEIVE'] as const;

export const canEditBuildingOpeningChecklist = (status?: string | null): boolean => {
  const upper = String(status ?? '').trim().toUpperCase();
  return (CHECKLIST_EDITABLE_STATUSES as readonly string[]).includes(upper);
};

export const isWorkflowStatus = (status: string | null | undefined, ...expected: string[]): boolean => {
  const upper = String(status ?? '').trim().toUpperCase();
  return expected.some((item) => upper === String(item ?? '').trim().toUpperCase());
};
