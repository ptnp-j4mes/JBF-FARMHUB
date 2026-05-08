'use client';

import { Box, Chip, LinearProgress, Stack, Typography } from '@mui/material';
import { alpha } from '@mui/material/styles';
import type { FeedingFarmFcrRow } from '../types';

type FcrBarProps = Pick<FeedingFarmFcrRow, 'facilityName' | 'fcrActual'>;

export default function FcrBar({ facilityName, fcrActual }: FcrBarProps) {
  return (
    <Box sx={{ p: 1.1, borderRadius: 10, border: '1px solid', borderColor: 'rgba(217, 226, 220, 0.9)', bgcolor: '#fff' }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={0.5}>
        <Typography variant="body2" sx={{ fontWeight: 700, color: '#21312c' }}>{facilityName}</Typography>
        <Chip size="small" label={fcrActual.toFixed(2)} sx={{ fontWeight: 800, bgcolor: '#FEF3F2', color: '#912018', height: 26 }} />
      </Stack>
      <LinearProgress
        variant="determinate"
        value={Math.max(0, Math.min(100, (3 - fcrActual) * 50))}
        sx={{
          height: 8,
          borderRadius: 10,
          bgcolor: alpha('#FEE4E2', 0.8),
          '& .MuiLinearProgress-bar': { bgcolor: '#15803D' },
        }}
      />
    </Box>
  );
}
