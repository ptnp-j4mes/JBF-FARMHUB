'use client';

import type { ReactNode } from 'react';
import { Box, Chip, Typography } from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import Image from 'next/image';
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
  borderRadius: '10px',
  border: '1px solid',
  borderColor: 'divider',
  bgcolor: 'background.paper',
  boxShadow: 2,
};

const workspaceHeaderDefaultBackground = '/branding/banner-farmhub-title.png';

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
      position: 'relative',
      overflow: 'hidden',
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
      <Box
        sx={{
          position: 'absolute',
          inset: 0,
          zIndex: 0,
          pointerEvents: 'none',
          overflow: 'hidden',
        }}
      >
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            right: 0,
            bottom: 0,
            width: { xs: '100%', lg: '56%' },
            opacity: 0.28,
            transform: { lg: 'translateX(-18px)' },
            overflow: 'hidden',
            maskImage: 'linear-gradient(90deg, transparent 0%, #000 16%, #000 84%, transparent 100%)',
            WebkitMaskImage: 'linear-gradient(90deg, transparent 0%, #000 16%, #000 84%, transparent 100%)',
          }}
        >
          <Image
            src={workspaceHeaderDefaultBackground}
            alt=""
            fill
            priority
            sizes="(min-width: 1200px) 56vw, 100vw"
            style={{
              objectFit: 'cover',
              objectPosition: 'center center',
            }}
          />
        </Box>
        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            background:
              'linear-gradient(90deg, rgba(255,255,255,0.98) 0%, rgba(255,255,255,0.92) 30%, rgba(255,255,255,0.48) 58%, rgba(255,255,255,0.12) 82%, rgba(255,255,255,0) 100%)',
          }}
        />
      </Box>

      <Box
        sx={{
          position: 'relative',
          zIndex: 1,
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          flexWrap: 'wrap',
        }}
      >
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
          position: 'relative',
          zIndex: 1,
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
