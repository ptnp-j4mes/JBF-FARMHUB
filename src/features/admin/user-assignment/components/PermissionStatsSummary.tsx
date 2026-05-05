'use client';

import React from 'react';
import { ArrowRightAlt } from '@mui/icons-material';
import { Box } from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';

type PermissionStatsSummaryProps = {
  base: number;
  added: number;
  removed: number;
  effective: number;
};

export default function PermissionStatsSummary({
  base,
  added,
  removed,
  effective,
}: PermissionStatsSummaryProps) {
  const theme = useTheme();
  const textPrimary = theme.palette.text.primary;
  const textSecondary = alpha(theme.palette.text.secondary, 0.9);

  return (
    <Box
      sx={{
        display: 'flex',
        flexWrap: 'nowrap',
        alignItems: 'center',
        gap: 1,
        fontSize: '0.75rem',
        mt: 0,
        maxWidth: { xs: '100%', lg: 'calc(100% - 290px)' },
        overflowX: 'auto',
        pb: 0.2,
        '&::-webkit-scrollbar': { height: 4 },
        '&::-webkit-scrollbar-thumb': {
          borderRadius: 999,
          backgroundColor: alpha(theme.palette.divider, 0.55),
        },
      }}
    >
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          width: '135px',
          px: 1.5,
          py: 0.75,
          borderRadius: 1.5,
          bgcolor:
            theme.palette.mode === 'dark'
              ? alpha(theme.palette.common.white, 0.08)
              : alpha(theme.palette.grey[700], 0.14),
          border: 1,
          borderColor:
            theme.palette.mode === 'dark'
              ? alpha(theme.palette.common.white, 0.2)
              : alpha(theme.palette.grey[700], 0.28),
        }}
      >
        <Box
          component="span"
          sx={{
            display: 'inline-block',
            maxWidth: 64,
            lineHeight: 1.15,
            whiteSpace: 'normal',
            color:
              theme.palette.mode === 'dark'
                ? alpha(theme.palette.common.white, 0.78)
                : alpha(textPrimary, 0.74),
          }}
        >
          ก่อนปรับแต่ง:
        </Box>
        <Box
          component="span"
          sx={{
            minWidth: 22,
            textAlign: 'right',
            fontWeight: 700,
            fontSize: '0.875rem',
            color:
              theme.palette.mode === 'dark'
                ? theme.palette.common.white
                : alpha(textPrimary, 0.96),
          }}
        >
          {base}
        </Box>
      </Box>

      <ArrowRightAlt sx={{ color: textSecondary, fontSize: '1rem', flexShrink: 0 }} />

      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          width: '135px',
          px: 1.5,
          py: 0.75,
          borderRadius: 1.5,
          border: 1,
          borderColor:
            added > 0
              ? alpha(theme.palette.success.main, 0.42)
              : alpha(theme.palette.success.main, 0.24),
          bgcolor:
            added > 0
              ? alpha(theme.palette.success.main, 0.12)
              : alpha(theme.palette.success.main, 0.06),
          color:
            added > 0
              ? alpha(theme.palette.success.light, 0.88)
              : alpha(theme.palette.success.light, 0.66),
        }}
      >
        <Box component="span">เพิ่ม:</Box>
        <Box component="span" sx={{ fontWeight: 700, fontSize: '0.875rem' }}>
          +{added}
        </Box>
      </Box>

      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          width: '135px',
          px: 1.5,
          py: 0.75,
          borderRadius: 1.5,
          border: 1,
          borderColor:
            removed > 0
              ? alpha(theme.palette.error.main, 0.55)
              : alpha(theme.palette.error.main, 0.3),
          bgcolor:
            removed > 0
              ? alpha(theme.palette.error.main, 0.18)
              : alpha(theme.palette.error.main, 0.08),
          color:
            removed > 0
              ? theme.palette.error.light
              : alpha(theme.palette.error.light, 0.75),
        }}
      >
        <Box component="span">ลด:</Box>
        <Box component="span" sx={{ fontWeight: 700, fontSize: '0.875rem' }}>
          -{removed}
        </Box>
      </Box>

      <ArrowRightAlt sx={{ color: textSecondary, fontSize: '1rem', flexShrink: 0 }} />

      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          width: '135px',
          px: 1.5,
          py: 0.75,
          borderRadius: 1.5,
          border: 1,
          borderColor:
            added > 0 || removed > 0
              ? alpha(theme.palette.primary.main, 0.55)
              : theme.palette.mode === 'dark'
                ? alpha(theme.palette.common.white, 0.2)
                : alpha(theme.palette.grey[700], 0.28),
          bgcolor:
            added > 0 || removed > 0
              ? alpha(theme.palette.primary.main, 0.2)
              : theme.palette.mode === 'dark'
                ? alpha(theme.palette.common.white, 0.08)
                : alpha(theme.palette.grey[700], 0.14),
          color:
            added > 0 || removed > 0
              ? theme.palette.mode === 'dark'
                ? theme.palette.primary.light
                : theme.palette.primary.dark
              : theme.palette.mode === 'dark'
                ? alpha(theme.palette.common.white, 0.94)
                : alpha(textPrimary, 0.96),
        }}
      >
        <Box
          component="span"
          sx={{
            display: 'inline-block',
            maxWidth: 64,
            lineHeight: 1.15,
            whiteSpace: 'normal',
            color: 'inherit',
          }}
        >
          หลังปรับแต่ง:
        </Box>
        <Box component="span" sx={{ minWidth: 22, textAlign: 'right', fontWeight: 700, fontSize: '0.875rem' }}>
          {effective}
        </Box>
      </Box>
    </Box>
  );
}
