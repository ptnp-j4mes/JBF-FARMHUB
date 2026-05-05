'use client';

import { Paper, Stack, Typography } from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';

interface MetricCardProps {
  label: string;
  value: number;
  accentColor?: 'primary' | 'success' | 'error';
}

export default function MetricCard({
  label,
  value,
  accentColor = 'primary',
}: MetricCardProps) {
  const theme = useTheme();
  const color = theme.palette[accentColor].main;
  const accentSoft =
    accentColor === 'primary'
      ? alpha(theme.palette.primary.main, theme.palette.mode === 'dark' ? 0.14 : 0.1)
      : alpha(color, theme.palette.mode === 'dark' ? 0.14 : 0.1);

  return (
    <Paper
      sx={{
        p: 2.25,
        borderRadius: 2,
        border: '1px solid',
        borderColor: 'divider',
        boxShadow: 'none',
        background: `linear-gradient(180deg, ${accentSoft} 0%, ${theme.palette.background.paper} 62%)`,
      }}
    >
      <Stack spacing={0.5}>
        <Typography variant="body2" color="text.secondary">
          {label}
        </Typography>
        <Typography variant="h5" fontWeight={800} color="text.primary">
          {value.toLocaleString()}
        </Typography>
      </Stack>
    </Paper>
  );
}
