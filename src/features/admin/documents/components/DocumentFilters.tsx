/**
 * DocumentFilters Component
 * 
 * Filter controls for documents
 */

'use client';

import { Box, Grid } from '@mui/material';
import { FormSelect, FormField } from '@/components/forms';
import { DocumentType, DocumentStatus, DocumentFilterParams } from '../types';

interface DocumentFiltersProps {
  filters: DocumentFilterParams;
  onChange: (filters: DocumentFilterParams) => void;
}

export function DocumentFilters({ filters, onChange }: DocumentFiltersProps) {
  return (
    <Box sx={{ mb: 3 }}>
      <Grid container spacing={2}>
        <Grid size={{ xs: 12, md: 4 }}>
          <FormField
            label="ค้นหา"
            placeholder="ค้นหาชื่อเอกสาร..."
            value={filters.search || ''}
            onChange={(e) => onChange({ ...filters, search: e.target.value })}
          />
        </Grid>

        <Grid size={{ xs: 12, md: 4 }}>
          <FormSelect
            label="ประเภทเอกสาร"
            value={filters.documentType || ''}
            onChange={(e) => onChange({ ...filters, documentType: e.target.value as string })}
            options={[
              { value: '', label: 'ทั้งหมด' },
              ...Object.values(DocumentType).map((type) => ({
                value: type,
                label: type,
              })),
            ]}
          />
        </Grid>

        <Grid size={{ xs: 12, md: 4 }}>
          <FormSelect
            label="สถานะ"
            value={filters.status || ''}
            onChange={(e) => onChange({ ...filters, status: e.target.value as string })}
            options={[
              { value: '', label: 'ทั้งหมด' },
              ...Object.values(DocumentStatus).map((status) => ({
                value: status,
                label: status,
              })),
            ]}
          />
        </Grid>
      </Grid>
    </Box>
  );
}
