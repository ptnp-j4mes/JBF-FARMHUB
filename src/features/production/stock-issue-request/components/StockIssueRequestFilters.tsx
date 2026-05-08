'use client';

import { Box, Button, InputAdornment, MenuItem, TextField, Typography } from '@mui/material';
import { Search as SearchIcon } from '@mui/icons-material';
import { toThaiWorkflowStatus } from '@/lib/utils/status.util';

interface StockIssueRequestFiltersProps {
  searchTerm: string;
  statusFilter: string;
  dateFrom: string;
  dateTo: string;
  onSearchTermChange: (value: string) => void;
  onStatusChange: (value: string) => void;
  onDateFromChange: (value: string) => void;
  onDateToChange: (value: string) => void;
  onClear: () => void;
}

const statusOptions = [
  { value: '', label: 'ทั้งหมด' },
  { value: 'Pending', label: toThaiWorkflowStatus('Pending') },
  { value: 'Approved', label: toThaiWorkflowStatus('Approved') },
  { value: 'Rejected', label: toThaiWorkflowStatus('Rejected') },
  { value: 'Completed', label: toThaiWorkflowStatus('Completed') },
  { value: 'Cancelled', label: toThaiWorkflowStatus('Cancelled') },
];

export function StockIssueRequestFilters({
  searchTerm,
  statusFilter,
  dateFrom,
  dateTo,
  onSearchTermChange,
  onStatusChange,
  onDateFromChange,
  onDateToChange,
  onClear,
}: StockIssueRequestFiltersProps) {
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
        placeholder="เลขที่ใบขอ, ผู้ขอ, คลังต้นทาง"
        size="small"
        value={searchTerm}
        onChange={(event) => onSearchTermChange(event.target.value)}
        sx={{
          width: '100%',
          '& .MuiOutlinedInput-root': {
            height: 40,
            borderRadius: 10,
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
          renderValue: (value) => (value ? toThaiWorkflowStatus(String(value)) : 'ทั้งหมด'),
        }}
        sx={{
          '& .MuiOutlinedInput-root': {
            height: 40,
            minHeight: 40,
            borderRadius: 10,
            bgcolor: 'background.paper',
            boxShadow: 1,
          },
          '& .MuiSelect-select': {
            color: statusFilter ? 'inherit' : 'text.secondary',
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
          label="จากวันที่"
          type="date"
          value={dateFrom}
          onChange={(event) => onDateFromChange(event.target.value)}
          size="small"
          InputLabelProps={{ shrink: true }}
          sx={{
            flex: 1,
            '& .MuiOutlinedInput-root': {
              height: 40,
              borderRadius: 10,
              bgcolor: 'background.paper',
              boxShadow: 1,
              cursor: 'pointer',
            },
            '& input': { cursor: 'pointer' },
          }}
        />
        <Typography sx={{ minWidth: 20, textAlign: 'center', color: 'text.secondary' }}>ถึง</Typography>
        <TextField
          label="ถึงวันที่"
          type="date"
          value={dateTo}
          onChange={(event) => onDateToChange(event.target.value)}
          size="small"
          InputLabelProps={{ shrink: true }}
          sx={{
            flex: 1,
            '& .MuiOutlinedInput-root': {
              height: 40,
              borderRadius: 10,
              bgcolor: 'background.paper',
              boxShadow: 1,
              cursor: 'pointer',
            },
            '& input': { cursor: 'pointer' },
          }}
        />
      </Box>

      <Button
        variant="contained"
        onClick={onClear}
        sx={{
          height: 40,
          minWidth: 110,
          borderRadius: 10,
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
