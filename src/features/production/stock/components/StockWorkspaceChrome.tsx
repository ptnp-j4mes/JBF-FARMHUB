'use client';

import { Box, Card, CardContent, Chip, Stack, Typography } from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import type { ReactNode } from 'react';

export const stockPanelSx = {
  borderRadius: 3.5,
  border: '1px solid',
  borderColor: 'divider',
  bgcolor: 'background.paper',
  boxShadow: 2,
};

type StockWorkspaceHeaderProps = {
  chipLabel: string;
  title: string;
  subtitle: string;
  meta?: string;
};

type StockSummaryCardProps = {
  title: string;
  value: string;
  subtitle: string;
  icon: ReactNode;
  iconBg: string;
  bar: string;
};

type StockSectionProps = {
  title: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
};

export function StockWorkspaceHeader({ chipLabel, title, subtitle, meta }: StockWorkspaceHeaderProps) {
  const theme = useTheme();

  return (
    <Box
      sx={{
        ...stockPanelSx,
        background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.06)} 0%, ${theme.palette.background.paper} 58%)`,
        px: { xs: 2, md: 2.6 },
        py: { xs: 2, md: 2.4 },
        display: 'grid',
        gap: 1.4,
        mb: 2,
      }}
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
        <Typography sx={{ fontSize: '0.9rem', color: 'text.secondary' }}>
          {subtitle}
        </Typography>
      </Box>
      <Box sx={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 1.5, flexWrap: 'wrap' }}>
        <Box>
          <Typography sx={{ fontSize: { xs: '1.9rem', md: '2.35rem' }, fontWeight: 900, lineHeight: 1.02, color: 'text.primary', letterSpacing: '-0.03em' }}>
            {title}
          </Typography>
        </Box>
        {meta ? (
          <Typography sx={{ fontSize: '0.95rem', color: 'text.secondary', fontWeight: 700 }}>
            {meta}
          </Typography>
        ) : null}
      </Box>
    </Box>
  );
}

export function StockSummaryCard({ title, value, subtitle, icon, iconBg, bar }: StockSummaryCardProps) {
  const theme = useTheme();

  return (
    <Card
      variant="outlined"
      sx={{
        position: 'relative',
        overflow: 'hidden',
        p: 0,
        borderColor: 'divider',
        bgcolor: 'background.paper',
        boxShadow: 2,
        borderRadius: 3,
        '&::before': {
          content: '""',
          position: 'absolute',
          inset: 0,
          background: `linear-gradient(135deg, ${alpha(iconBg, 0.8)} 0%, ${alpha(theme.palette.background.paper, 0)} 55%)`,
          pointerEvents: 'none',
        },
      }}
    >
      <CardContent sx={{ position: 'relative', zIndex: 1, p: 1.5 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 700, lineHeight: 1.1, color: 'text.primary' }}>
              {value}
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.primary', mt: 0.45, fontWeight: 800 }}>
              {title}
            </Typography>
          </Box>
          <Box
            sx={{
              width: 42,
              height: 42,
              borderRadius: 1.75,
              bgcolor: 'background.paper',
              border: `1px solid ${alpha(bar, 0.15)}`,
              boxShadow: 1,
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            {icon}
          </Box>
        </Box>
        <Box sx={{ width: 96, height: 6, borderRadius: 999, bgcolor: alpha(bar, 0.2) }}>
          <Box sx={{ width: 54, height: '100%', borderRadius: 999, bgcolor: bar }} />
        </Box>
        <Typography variant="caption" sx={{ display: 'block', color: 'text.secondary', mt: 0.8 }}>
          {subtitle}
        </Typography>
      </CardContent>
    </Card>
  );
}

export function StockSection({ title, description, action, children }: StockSectionProps) {
  const theme = useTheme();

  return (
    <Box
      component="fieldset"
      sx={{
        ...stockPanelSx,
        borderRadius: 3,
        p: { xs: 1.5, md: 2 },
      }}
    >
      <Stack spacing={1.5}>
        <Box sx={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 1.5, flexWrap: 'wrap' }}>
          <Box>
            <Typography component="legend" sx={{ px: 1, color: 'primary.main', fontWeight: 800, fontSize: '0.98rem' }}>
              {title}
            </Typography>
            {description ? (
              <Typography sx={{ mt: 0.4, color: 'text.secondary', fontSize: '0.9rem' }}>
                {description}
              </Typography>
            ) : null}
          </Box>
          {action}
        </Box>
        {children}
      </Stack>
    </Box>
  );
}
