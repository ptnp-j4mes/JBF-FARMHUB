import { getWorkflowStatusChipSx } from '@/lib/utils/status.util';

import { DOCUMENT_STATUS_THAI } from '@/lib/constants/status-labels';

export const toPurchaseStatusLabel = (status?: string | null): string => {
  if (!status) return '-';
  const normalized = String(status).trim();
  
  // Try exact match or case-insensitive match from centralized labels
  return DOCUMENT_STATUS_THAI[normalized] || 
         Object.entries(DOCUMENT_STATUS_THAI).find(
           ([key]) => key.toLowerCase() === normalized.toLowerCase()
         )?.[1] || 
         normalized;
};

export const getPurchaseStatusChipSx = (status?: string | null) => {
  const normalized = String(status ?? '').trim().toUpperCase();

  if (normalized === 'DRAFT') {
    return {
      bgcolor: '#e5e7eb !important',
      color: '#4b5563 !important',
      fontWeight: 700,
      borderRadius: 10,
      height: 28,
      '& .MuiChip-label': {
        px: 1.25,
      },
    };
  }

  if (normalized === 'RETURNED') {
    return {
      bgcolor: '#fef3c7 !important',
      color: '#92400e !important',
      fontWeight: 700,
      borderRadius: 10,
      height: 28,
      '& .MuiChip-label': {
        px: 1.25,
      },
    };
  }

  return getWorkflowStatusChipSx(status);
};
