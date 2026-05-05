'use client';

import React from 'react';
import { Chip } from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import type { ScopeStatus } from '../types';

type StatusChipProps = {
  status: ScopeStatus;
};

export default function StatusChip({ status }: StatusChipProps) {
  const theme = useTheme();
  const isActive = status === 'Active';

  return (
    <Chip
      size="small"
      label={isActive ? 'ใช้งาน' : 'ไม่ใช้งาน'}
      sx={{
        fontWeight: 600,
        borderRadius: 1,
        px: 0.5,
        border: `1px solid ${alpha(
          isActive ? theme.palette.success.main : theme.palette.error.main,
          0.45,
        )}`,
        bgcolor: alpha(isActive ? theme.palette.success.main : theme.palette.error.main, 0.14),
        color: alpha(isActive ? theme.palette.success.light : theme.palette.error.light, 0.98),
      }}
    />
  );
}
