import React from 'react';
import { Chip } from '@mui/material';
import { alpha } from '@mui/material/styles';
import { Place } from '@mui/icons-material';
import { UI } from '../constants';

export default function LocationChip({ houseCode }) {
  return (
    <Chip
      size="small"
      icon={<Place sx={{ fontSize: 16 }} />}
      label={`โรงเรือน: ${houseCode || '-'}`}
      sx={{
        bgcolor: alpha(UI.accent, 0.08),
        color: UI.accent,
        fontWeight: 700,
        border: `1px solid ${alpha(UI.accent, 0.14)}`,
        '& .MuiChip-icon': { color: UI.accent },
      }}
    />
  );
}
