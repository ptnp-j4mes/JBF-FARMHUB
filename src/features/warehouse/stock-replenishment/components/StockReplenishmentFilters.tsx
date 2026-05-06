import { Box, Button, InputAdornment, MenuItem, TextField } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import { DocumentStatus } from '@/types/status.types';
import { toThaiWorkflowStatus } from '@/lib/utils/status.util';

type Urgency = 'normal' | 'important' | 'critical';

interface Props {
  searchText: string;
  statusFilter: 'all' | DocumentStatus;
  urgencyFilter: 'all' | Urgency;
  onSearchTextChange: (value: string) => void;
  onStatusFilterChange: (value: 'all' | DocumentStatus) => void;
  onUrgencyFilterChange: (value: 'all' | Urgency) => void;
  onClear: () => void;
}

const urgencyCopy: Record<Urgency, string> = {
  normal: 'ปกติ',
  important: 'ด่วน',
  critical: 'เร่งด่วน',
};

export default function StockReplenishmentFilters({
  searchText,
  statusFilter,
  urgencyFilter,
  onSearchTextChange,
  onStatusFilterChange,
  onUrgencyFilterChange,
  onClear,
}: Props) {
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
        value={searchText}
        onChange={(event) => onSearchTextChange(event.target.value)}
        placeholder="เลขที่ใบแจ้ง, ฟาร์ม, item"
        size="small"
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
        onChange={(event) => onStatusFilterChange(event.target.value as 'all' | DocumentStatus)}
        size="small"
        SelectProps={{
          displayEmpty: true,
          renderValue: (value) => (value === 'all' ? 'ทุกสถานะ' : toThaiWorkflowStatus(value as string)),
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
        <MenuItem value="all">ทุกสถานะ</MenuItem>
        {Object.values(DocumentStatus)
          .filter((status) => status !== DocumentStatus.PartiallyReceived && status !== DocumentStatus.Completed)
          .map((status) => (
            <MenuItem key={status} value={status}>
              {toThaiWorkflowStatus(status)}
            </MenuItem>
          ))}
      </TextField>
      <TextField
        select
        label="ความเร่งด่วน"
        value={urgencyFilter}
        onChange={(event) => onUrgencyFilterChange(event.target.value as 'all' | Urgency)}
        size="small"
        SelectProps={{
          displayEmpty: true,
          renderValue: (value) => (value === 'all' ? 'ทั้งหมด' : urgencyCopy[value as Urgency]),
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
        <MenuItem value="all">ทั้งหมด</MenuItem>
        {Object.entries(urgencyCopy).map(([value, label]) => (
          <MenuItem key={value} value={value}>
            {label}
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
