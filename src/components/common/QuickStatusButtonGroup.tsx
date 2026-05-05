'use client';

import type { ReactNode } from 'react';
import { Box, Button, Typography } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import {
  getQuickStatusButtonSx,
  getQuickStatusCountSx,
  getQuickStatusTone,
  type QuickStatusTone,
} from '@/lib/utils/quick-status.util';

export type QuickStatusButtonItem = {
  value: string;
  label: ReactNode;
  count: number;
  tone?: QuickStatusTone;
};

export type QuickStatusButtonGroupProps = {
  items: QuickStatusButtonItem[];
  selectedValue: string;
  onChange: (value: string) => void;
};

export default function QuickStatusButtonGroup({
  items,
  selectedValue,
  onChange,
}: QuickStatusButtonGroupProps) {
  const theme = useTheme();

  return (
    <Box
      sx={{
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        gap: 1,
      }}
    >
      {items.map((item) => {
        const selected = selectedValue === item.value;
        const tone = item.tone ?? getQuickStatusTone(item.value);

        return (
          <Button
            key={`quick-status-${item.value || 'all'}`}
            onClick={() => onChange(item.value)}
            sx={getQuickStatusButtonSx(theme, tone, selected)}
          >
            <Typography
              sx={{
                fontSize: '0.9rem',
                fontWeight: selected ? 700 : 500,
                mr: 0.8,
              }}
            >
              {item.label}
            </Typography>
            <Box sx={getQuickStatusCountSx(theme, tone, selected)}>
              {item.count}
            </Box>
          </Button>
        );
      })}
    </Box>
  );
}
