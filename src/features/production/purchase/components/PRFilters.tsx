/**
 * PRFilters Component
 * 
 * Search controls for purchase requests
 */

'use client';

import { useEffect, useRef, useState } from 'react';
import { Box, TextField, InputAdornment, MenuItem, Button, Typography } from '@mui/material';
import { Search as SearchIcon } from '@mui/icons-material';
import { PurchaseFilterParams } from '../types';
import { toPurchaseStatusLabel } from '../utils/purchase-status.util';

interface PRFiltersProps {
  filters: PurchaseFilterParams;
  onChange: (filters: PurchaseFilterParams) => void;
  onSearch: (filters: PurchaseFilterParams) => void;
}

const statusOptions = [
  { value: '', label: 'ทั้งหมด' },
  { value: 'Draft', label: toPurchaseStatusLabel('Draft') },
  { value: 'Pending', label: toPurchaseStatusLabel('Pending') },
  { value: 'Returned', label: toPurchaseStatusLabel('Returned') },
  { value: 'Approved', label: toPurchaseStatusLabel('Approved') },
  { value: 'Rejected', label: toPurchaseStatusLabel('Rejected') },
  { value: 'PartiallyReceived', label: toPurchaseStatusLabel('PartiallyReceived') },
  { value: 'Completed', label: toPurchaseStatusLabel('Completed') },
  { value: 'Cancelled', label: toPurchaseStatusLabel('Cancelled') },
];

export function PRFilters({
  filters,
  onChange,
  onSearch,
}: PRFiltersProps) {
  const [localFilters, setLocalFilters] = useState<PurchaseFilterParams>(filters);
  const dateFromInputRef = useRef<HTMLInputElement | null>(null);
  const dateToInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    setLocalFilters(filters);
  }, [filters]);

  const handleChange = (next: Partial<PurchaseFilterParams>) => {
    setLocalFilters((prev) => ({ ...prev, ...next }));
  };

  const handleSearch = () => {
    onChange(localFilters);
    onSearch(localFilters);
  };

  return (
    <Box
      sx={{
        mb: 3,
        display: 'grid',
        gap: 1.5,
        gridTemplateColumns: {
          xs: '1fr',
          sm: '1fr 1fr',
          md: 'minmax(320px,1fr) 160px minmax(220px,1fr) minmax(330px,1.2fr) auto',
        },
        alignItems: 'center',
      }}
    >
      <TextField
        placeholder="ค้นหาเลขที่เอกสาร"
        value={localFilters.searchTerm}
        onChange={(e) => handleChange({ searchTerm: e.target.value })}
        size="small"
        sx={{
          width: '100%',
          '& .MuiOutlinedInput-root': { height: 40 },
        }}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon />
            </InputAdornment>
          ),
        }}
      />
      <TextField
        select
        placeholder="สถานะ"
        value={localFilters.status}
        onChange={(e) => handleChange({ status: e.target.value })}
        size="small"
        SelectProps={{
          displayEmpty: true,
          renderValue: (value) => (value ? String(value) : 'สถานะ'),
        }}
        sx={{
          '& .MuiOutlinedInput-root': { height: 40, width: '100%' },
          '& .MuiSelect-select': {
            color: localFilters.status ? 'inherit' : 'text.secondary',
          },
        }}
      >
        {statusOptions.map((option) => (
          <MenuItem key={option.value} value={option.value}>
            {option.label}
          </MenuItem>
        ))}
      </TextField>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <TextField
          type="date"
          value={localFilters.requestDateFrom}
          onChange={(e) => handleChange({ requestDateFrom: e.target.value })}
          onClick={() => {
            const input = dateFromInputRef.current as (HTMLInputElement & { showPicker?: () => void }) | null;
            input?.focus();
            input?.showPicker?.();
          }}
          inputRef={dateFromInputRef}
          size="small"
          sx={{
            flex: 1,
            '& .MuiOutlinedInput-root': { height: 40, cursor: 'pointer' },
            '& input': { cursor: 'pointer' },
          }}
        />
        <Typography variant="body2" color="text.secondary" sx={{ minWidth: 20, textAlign: 'center' }}>
          ถึง
        </Typography>
        <TextField
          type="date"
          value={localFilters.requestDateTo}
          onChange={(e) => handleChange({ requestDateTo: e.target.value })}
          onClick={() => {
            const input = dateToInputRef.current as (HTMLInputElement & { showPicker?: () => void }) | null;
            input?.focus();
            input?.showPicker?.();
          }}
          inputRef={dateToInputRef}
          size="small"
          sx={{
            flex: 1,
            '& .MuiOutlinedInput-root': { height: 40, cursor: 'pointer' },
            '& input': { cursor: 'pointer' },
          }}
        />
      </Box>
      <Box sx={{ display: 'flex', justifyContent: { xs: 'stretch', md: 'flex-end' } }}>
        <Button
          variant="contained"
          onClick={handleSearch}
          sx={{ height: 40, width: { xs: '100%', md: '120px' }, minWidth: '120px' }}
        >
          ค้นหา
        </Button>
      </Box>
    </Box>

  );
}
