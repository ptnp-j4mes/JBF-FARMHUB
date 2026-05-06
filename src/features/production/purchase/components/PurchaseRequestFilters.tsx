'use client';

import { Box, Button, InputAdornment, MenuItem, TextField } from '@mui/material';
import { Search as SearchIcon } from '@mui/icons-material';
import { DocumentStatus } from '@/types/status.types';
import { toPurchaseStatusLabel } from '../utils/purchase-status.util';
import { URGENCY_LABELS_THAI } from '@/lib/constants/status-labels';

interface PurchaseRequestFiltersProps {
  searchTerm: string;
  statusFilter: string;
  urgencyFilter: string;
  onSearchTermChange: (value: string) => void;
  onStatusChange: (value: string) => void;
  onUrgencyChange: (value: string) => void;
  onClear: () => void;
}

const statusOptions = [
  { value: 'all', label: 'ทุกสถานะ' },
  { value: DocumentStatus.Draft, label: toPurchaseStatusLabel(DocumentStatus.Draft) },
  { value: DocumentStatus.Pending, label: toPurchaseStatusLabel(DocumentStatus.Pending) },
  { value: DocumentStatus.Returned, label: toPurchaseStatusLabel(DocumentStatus.Returned) },
  { value: DocumentStatus.Approved, label: toPurchaseStatusLabel(DocumentStatus.Approved) },
  { value: DocumentStatus.Rejected, label: toPurchaseStatusLabel(DocumentStatus.Rejected) },
  { value: DocumentStatus.PartiallyReceived, label: toPurchaseStatusLabel(DocumentStatus.PartiallyReceived) },
  { value: DocumentStatus.Completed, label: toPurchaseStatusLabel(DocumentStatus.Completed) },
  { value: DocumentStatus.Cancelled, label: toPurchaseStatusLabel(DocumentStatus.Cancelled) },
];

const urgencyOptions = [
  { value: 'all', label: 'ทั้งหมด' },
  { value: 'Normal', label: URGENCY_LABELS_THAI['Normal'] },
  { value: 'High', label: URGENCY_LABELS_THAI['High'] },
  { value: 'Urgent', label: URGENCY_LABELS_THAI['Urgent'] },
];

export function PurchaseRequestFilters({
  searchTerm,
  statusFilter,
  urgencyFilter,
  onSearchTermChange,
  onStatusChange,
  onUrgencyChange,
  onClear,
}: PurchaseRequestFiltersProps) {
  return (
    <Box
      sx={{
        display: 'grid',
        gap: 1.2,
        gridTemplateColumns: {
          xs: '1fr',
          md: 'minmax(280px,1fr) 170px minmax(220px,1.1fr) auto',
        },
        alignItems: 'center',
      }}
    >
      <TextField
        label="ค้นหา"
        placeholder="เลขที่ใบขอซื้อ, ผู้ขอ, ฟาร์ม"
        size="small"
        value={searchTerm}
        onChange={(event) => onSearchTermChange(event.target.value)}
        sx={{
          width: '100%',
          '& .MuiOutlinedInput-root': {
            height: 40,
            borderRadius: 2,
            bgcolor: 'background.paper',
            boxShadow: 1,
          },
        }}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
            </InputAdornment>
          ),
        }}
      />

      <TextField
        select
        label="สถานะ"
        value={statusFilter}
        onChange={(event) => onStatusChange(event.target.value)}
        size="small"
        SelectProps={{
          displayEmpty: true,
          renderValue: (value) => (value === 'all' ? 'ทุกสถานะ' : toPurchaseStatusLabel(value as string)),
        }}
        sx={{
          '& .MuiOutlinedInput-root': {
            height: 40,
            minHeight: 40,
            borderRadius: 2,
            bgcolor: 'background.paper',
            boxShadow: 1,
          },
          '& .MuiSelect-select': {
            color: statusFilter === 'all' ? 'text.secondary' : 'inherit',
          },
        }}
      >
        {statusOptions.map((option) => (
          <MenuItem key={option.value} value={option.value}>
            {option.label}
          </MenuItem>
        ))}
      </TextField>

      <TextField
        select
        label="ความเร่งด่วน"
        value={urgencyFilter}
        onChange={(event) => onUrgencyChange(event.target.value)}
        size="small"
        SelectProps={{
          displayEmpty: true,
          renderValue: (value) => {
            const normalized = String(value ?? '');
            if (normalized === 'all') {
              return 'ทั้งหมด';
            }
            return urgencyOptions.find((option) => option.value === normalized)?.label ?? normalized;
          },
        }}
        sx={{
          '& .MuiOutlinedInput-root': {
            height: 40,
            minHeight: 40,
            borderRadius: 2,
            bgcolor: 'background.paper',
            boxShadow: 1,
          },
          '& .MuiSelect-select': {
            color: urgencyFilter === 'all' ? 'text.secondary' : 'inherit',
          },
        }}
      >
        {urgencyOptions.map((option) => (
          <MenuItem key={option.value} value={option.value}>
            {option.label}
          </MenuItem>
        ))}
      </TextField>

      <Button
        variant="contained"
        onClick={onClear}
        sx={{
          height: 40,
          minWidth: 110,
          borderRadius: 2,
          bgcolor: 'primary.main',
          boxShadow: 1,
          '&:hover': { bgcolor: 'primary.dark' },
        }}
      >
        ล้างตัวกรอง
      </Button>
    </Box>
  );
}
