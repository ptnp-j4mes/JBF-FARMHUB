'use client';

import React, { useEffect, useState } from 'react';
import { FilterList } from '@mui/icons-material';
import { DialogTitleWithClose } from '@/components/common';
import {
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  Divider,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Typography,
} from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import type { FilterState } from '../types';
import { EMPTY_FILTERS } from '../utils';

type AssignmentFilterDialogProps = {
  open: boolean;
  onClose: () => void;
  onApply: (state: FilterState) => void;
  filterState: FilterState;
  companies: string[];
  roles: string[];
  farms: string[];
  zones: string[];
  houses: string[];
};

export default function AssignmentFilterDialog({
  open,
  onClose,
  onApply,
  filterState,
  companies,
  roles,
  farms,
  zones,
  houses,
}: AssignmentFilterDialogProps) {
  const theme = useTheme();
  const pageBg = theme.palette.background.default;
  const surface = theme.palette.background.paper;
  const surfaceMuted = alpha(
    theme.palette.background.paper,
    theme.palette.mode === 'dark' ? 0.74 : 0.96,
  );
  const borderStrong = alpha(theme.palette.divider, 0.92);
  const textPrimary = theme.palette.text.primary;
  const modalPaperBg = alpha(surface, theme.palette.mode === 'dark' ? 0.98 : 1);
  const modalHeaderBg = alpha(surfaceMuted, theme.palette.mode === 'dark' ? 0.6 : 0.96);
  const modalInputBg = alpha(pageBg, theme.palette.mode === 'dark' ? 0.78 : 0.9);
  const fieldSx = {
    '& .MuiOutlinedInput-root': {
      bgcolor: modalInputBg,
      borderRadius: 10,
      '& fieldset': { borderColor: borderStrong },
    },
  } as const;

  const [filters, setFilters] = useState<FilterState>(filterState);

  useEffect(() => {
    if (open) {
      setFilters(filterState);
    }
  }, [open, filterState]);

  const activeFilterCount = Object.values(filters).filter((value) => value !== '').length;

  const handleFilterChange = (field: keyof FilterState, value: string) => {
    setFilters((previous) => ({
      ...previous,
      [field]: value,
    }));
  };

  const handleClearAll = () => {
    setFilters(EMPTY_FILTERS);
  };

  const handleApply = () => {
    onApply(filters);
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 10,
          bgcolor: modalPaperBg,
          border: `1px solid ${borderStrong}`,
          color: textPrimary,
        },
      }}
    >
      <DialogTitleWithClose onClose={onClose} component="div" sx={{ pb: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <FilterList sx={{ color: 'primary.main' }} />
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            Filter Assignments
          </Typography>
          {activeFilterCount > 0 && (
            <Chip
              label={`${activeFilterCount} active`}
              size="small"
              color="primary"
              sx={{ height: 22, fontSize: '0.75rem' }}
            />
          )}
        </Box>
      </DialogTitleWithClose>

      <Divider />

      <DialogContent sx={{ pt: 3, bgcolor: modalPaperBg }}>
        <Stack spacing={3}>
          <Box>
            <Typography variant="subtitle2" sx={{ mb: 1.5, fontWeight: 700 }}>
              องค์กร
            </Typography>
            <Stack spacing={2}>
              <FormControl fullWidth size="small" sx={fieldSx}>
                <InputLabel>บริษัท</InputLabel>
                <Select
                  value={filters.company}
                  label="บริษัท"
                  onChange={(event) => handleFilterChange('company', event.target.value)}
                >
                  <MenuItem value="">
                    <em>ทั้งหมด</em>
                  </MenuItem>
                  {companies.map((item) => (
                    <MenuItem key={item} value={item}>
                      {item}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Stack>
          </Box>

          <Box>
            <Typography variant="subtitle2" sx={{ mb: 1.5, fontWeight: 700 }}>
              บทบาทและขอบเขต
            </Typography>
            <Stack spacing={2}>
              <FormControl fullWidth size="small" sx={fieldSx}>
                <InputLabel>บทบาท</InputLabel>
                <Select
                  value={filters.role}
                  label="บทบาท"
                  onChange={(event) => handleFilterChange('role', event.target.value)}
                >
                  <MenuItem value="">
                    <em>ทั้งหมด</em>
                  </MenuItem>
                  {roles.map((item) => (
                    <MenuItem key={item} value={item}>
                      {item}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <FormControl fullWidth size="small" sx={fieldSx}>
                <InputLabel>ฟาร์ม</InputLabel>
                <Select
                  value={filters.farm}
                  label="ฟาร์ม"
                  onChange={(event) => handleFilterChange('farm', event.target.value)}
                >
                  <MenuItem value="">
                    <em>ทั้งหมด</em>
                  </MenuItem>
                  {farms.map((item) => (
                    <MenuItem key={item} value={item}>
                      {item}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <FormControl fullWidth size="small" sx={fieldSx}>
                <InputLabel>โซน</InputLabel>
                <Select
                  value={filters.zone}
                  label="โซน"
                  onChange={(event) => handleFilterChange('zone', event.target.value)}
                >
                  <MenuItem value="">
                    <em>ทั้งหมด</em>
                  </MenuItem>
                  {zones.map((item) => (
                    <MenuItem key={item} value={item}>
                      {item}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <FormControl fullWidth size="small" sx={fieldSx}>
                <InputLabel>โรงเรือน</InputLabel>
                <Select
                  value={filters.house}
                  label="โรงเรือน"
                  onChange={(event) => handleFilterChange('house', event.target.value)}
                >
                  <MenuItem value="">
                    <em>ทั้งหมด</em>
                  </MenuItem>
                  {houses.map((item) => (
                    <MenuItem key={item} value={item}>
                      {item}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Stack>
          </Box>
        </Stack>
      </DialogContent>

      <Divider />

      <DialogActions sx={{ p: 2, gap: 1, bgcolor: modalHeaderBg }}>
        <Button onClick={handleClearAll} variant="text" sx={{ textTransform: 'none', mr: 'auto' }}>
          ล้างทั้งหมด
        </Button>
        <Button onClick={handleApply} variant="contained" sx={{ textTransform: 'none' }}>
          ใช้ตัวกรอง
        </Button>
      </DialogActions>
    </Dialog>
  );
}
