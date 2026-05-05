'use client';

import {
  Box,
  Button,
  Divider,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import { StockActionButton } from '@/features/production/stock/components/StockActionButton';
import {
  Add as AddIcon,
  CalendarToday as CalendarIcon,
  Agriculture as FarmIcon,
} from '@mui/icons-material';
import { UI, inputSx } from './constants';
import type { FeedingOptionFacility } from './types';

type FeedingFilterBarProps = {
  roleMode: 'manager' | 'worker';
  onRoleModeChange: (mode: 'manager' | 'worker') => void;
  date: string;
  onDateChange: (date: string) => void;
  facilityId: number | '';
  onFacilityChange: (facilityId: number) => void;
  facilities: FeedingOptionFacility[];
  showAddButton: boolean;
  onOpenCreate: () => void;
};

const roleButtonHeight = 36;

export default function FeedingFilterBar({
  roleMode,
  onRoleModeChange,
  date,
  onDateChange,
  facilityId,
  onFacilityChange,
  facilities,
  showAddButton,
  onOpenCreate,
}: FeedingFilterBarProps) {
  return (
    <Box
      sx={{
        borderRadius: 3.4,
        border: `1px solid ${UI.border}`,
        bgcolor: alpha('#fff', 0.94),
        boxShadow: UI.shadow,
        mb: 2,
        px: { xs: 1.5, md: 2.2 },
        py: { xs: 1.5, md: 1.7 },
        display: 'grid',
        gap: 1.5,
        backdropFilter: 'blur(10px)',
      }}
    >
      <Stack direction={{ xs: 'column', xl: 'row' }} spacing={1.5} alignItems={{ xs: 'stretch', xl: 'center' }}>
        <Box sx={{ minWidth: 0, flex: 1 }}>
          <Typography variant="caption" sx={{ color: UI.muted, fontWeight: 800, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
            Scope
          </Typography>
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.2} alignItems={{ xs: 'stretch', md: 'center' }} mt={0.8}>
            <Stack direction="row" spacing={0.8} alignItems="center">
              <CalendarIcon sx={{ fontSize: 18, color: UI.muted }} />
              <TextField
                type="date"
                size="small"
                value={date}
                onChange={(event) => onDateChange(event.target.value)}
                sx={{ ...inputSx, minWidth: 168, '& .MuiOutlinedInput-root': { bgcolor: '#fff' } }}
              />
            </Stack>

            <Stack direction="row" spacing={0.8} alignItems="center" sx={{ minWidth: 0, flex: 1 }}>
              <FarmIcon sx={{ fontSize: 18, color: UI.muted }} />
              <FormControl size="small" sx={{ minWidth: { xs: '100%', md: 260 }, flex: 1 }}>
                <InputLabel>ฟาร์ม</InputLabel>
                <Select
                  label="ฟาร์ม"
                  value={facilityId}
                  onChange={(event) => onFacilityChange(Number(event.target.value))}
                  sx={{ ...inputSx, '& .MuiOutlinedInput-root': { bgcolor: '#fff' } }}
                >
                  {facilities.map((facility) => (
                    <MenuItem key={facility.id} value={facility.id}>{facility.name}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Stack>
          </Stack>
        </Box>

        <Divider orientation="vertical" flexItem sx={{ borderColor: UI.border, display: { xs: 'none', xl: 'block' } }} />

        <Box sx={{ minWidth: { xs: '100%', xl: 320 } }}>
          <Typography variant="caption" sx={{ color: UI.muted, fontWeight: 800, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
            Role
          </Typography>
          <Stack direction="row" spacing={1.2} alignItems="center" mt={0.8}>
            <ToggleButtonGroup
              size="small"
              exclusive
              value={roleMode}
              onChange={(_, value) => {
                if (value) onRoleModeChange(value);
              }}
              sx={{
                height: roleButtonHeight,
                borderRadius: '999px',
                overflow: 'hidden',
                '& .MuiToggleButton-root': {
                  height: roleButtonHeight,
                  borderRadius: '999px',
                  border: `1px solid ${UI.borderStrong}`,
                  color: UI.muted,
                  textTransform: 'none',
                  fontWeight: 800,
                  bgcolor: '#fff',
                  fontSize: '0.84rem',
                  minWidth: 100,
                  px: 1.6,
                  py: 0,
                  boxShadow: 'none',
                  '&:hover': {
                    boxShadow: 'none',
                    bgcolor: alpha(UI.accent, 0.06),
                  },
                },
                '& .MuiToggleButton-root.Mui-selected': {
                  bgcolor: UI.accent,
                  color: '#fff',
                  borderColor: UI.accent,
                  boxShadow: 'none',
                  '&:hover': {
                    bgcolor: UI.accentDark,
                    boxShadow: 'none',
                  },
                },
              }}
            >
              <ToggleButton value="manager">Manager</ToggleButton>
              <ToggleButton value="worker">Worker</ToggleButton>
            </ToggleButtonGroup>

            {showAddButton && (
              <StockActionButton
                tone="success"
                size="small"
                shape="pill"
                startIcon={<AddIcon />}
                onClick={onOpenCreate}
              >
                เพิ่มรายการ
              </StockActionButton>
            )}
          </Stack>
        </Box>
      </Stack>
    </Box>
  );
}
