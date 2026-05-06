'use client';

import type { ReactNode } from 'react';
import { Box, Chip, Typography } from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import type { SxProps, Theme } from '@mui/material/styles';

export type WorkspaceHeaderProps = {
  chipLabel: string;
  title: ReactNode;
  subtitle?: ReactNode;
  meta?: ReactNode;
  rightContent?: ReactNode;
  sx?: SxProps<Theme>;
};

const workspaceHeaderSx = {
  borderRadius: 3.5,
  border: '1px solid',
  borderColor: 'divider',
  bgcolor: 'background.paper',
  boxShadow: 2,
};

export default function WorkspaceHeader({
  chipLabel,
  title,
  subtitle,
  meta,
  rightContent,
  sx,
}: WorkspaceHeaderProps) {
  const theme = useTheme();
  const mergedSx: SxProps<Theme> = [
    {
      ...workspaceHeaderSx,
      background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.06)} 0%, ${theme.palette.background.paper} 58%)`,
      px: { xs: 2, md: 2.6 },
      py: { xs: 2, md: 2.4 },
      display: 'grid',
      gap: 1.4,
      mb: 2,
    },
    ...(Array.isArray(sx) ? sx : sx ? [sx] : []),
  ];

  return (
    <Box
      sx={mergedSx}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
        <Chip
          size="small"
          label={chipLabel}
          sx={{
            bgcolor: 'background.paper',
            color: 'primary.main',
            fontWeight: 800,
            border: '1px solid',
            borderColor: 'divider',
            height: 28,
          }}
        />
        {subtitle ? (
          <Typography sx={{ fontSize: '0.9rem', color: 'text.secondary' }}>
            {subtitle}
          </Typography>
        ) : null}
      </Box>

      <Box
        sx={{
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'space-between',
          gap: 1.5,
          flexWrap: 'wrap',
        }}
      >
        <Box sx={{ minWidth: 0 }}>
          <Typography
            sx={{
              fontSize: { xs: '1.9rem', md: '2.35rem' },
              fontWeight: 900,
              lineHeight: 1.02,
              color: 'text.primary',
              letterSpacing: '-0.03em',
              wordBreak: 'break-word',
            }}
          >
            {title}
          </Typography>
        </Box>

        {rightContent || meta ? (
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-end',
              gap: 0.5,
              textAlign: 'right',
              minWidth: 0,
            }}
          >
            {rightContent}
            {meta ? (
              <Typography sx={{ fontSize: '0.95rem', color: 'text.secondary', fontWeight: 700 }}>
                {meta}
              </Typography>
            ) : null}
          </Box>
        ) : null}
      </Box>
    </Box>
  );
}
