import React from 'react';
import { Chip } from '@mui/material';
import { Place } from '@mui/icons-material';
import { UI } from '../constants';

export default function LocationChip({ houseCode }) {
  return (
    <Chip
      size="small"
      icon={<Place sx={{ fontSize: 16 }} />}
      label={`โรงเรือน: ${houseCode || '-'}`}
      sx={{
        bgcolor: UI.accent,
        color: '#fff',
        fontWeight: 700,
        '& .MuiChip-icon': { color: '#fff' },
      }}
    />
  );
}
