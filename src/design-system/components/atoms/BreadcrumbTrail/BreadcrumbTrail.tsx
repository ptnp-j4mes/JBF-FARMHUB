'use client';

import { Box, Typography, type SxProps, type Theme } from '@mui/material';

interface BreadcrumbTrailProps {
  items: string[];
  mutedTextColor: string;
  activeColor?: string;
  sx?: SxProps<Theme>;
}

export default function BreadcrumbTrail({
  items,
  mutedTextColor,
  activeColor = '#B42318',
  sx,
}: BreadcrumbTrailProps) {
  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 0.75,
        px: { xs: 0.5, md: 0.75 },
        mb: 0.5,
        ...sx,
      }}
    >
      {items.map((label, index) => {
        const isLast = index === items.length - 1;
        return (
          <Box key={`${label}-${index}`} sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
            <Typography
              sx={{
                fontSize: '12px',
                fontWeight: isLast ? 700 : 600,
                color: isLast ? activeColor : mutedTextColor,
                lineHeight: '16px',
              }}
            >
              {label}
            </Typography>
            {!isLast && (
              <Typography sx={{ fontSize: '12px', color: mutedTextColor, lineHeight: '16px' }}>
                /
              </Typography>
            )}
          </Box>
        );
      })}
    </Box>
  );
}
