import type { ReactNode } from 'react';
import { Box, Stack, Typography } from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import { ReceiptLongOutlined } from '@mui/icons-material';
import { StatusBadge } from '@/design-system';

interface StockReplenishmentSectionLayoutProps {
  scope: 'farm' | 'central';
  centralHubName: string;
  currentFacilityName: string;
  children: ReactNode;
}

export default function StockReplenishmentSectionLayout({
  scope,
  centralHubName,
  currentFacilityName,
  children,
}: StockReplenishmentSectionLayoutProps) {
  const theme = useTheme();

  return (
    <Box sx={{ color: 'text.primary' }}>
      <Box
        sx={{
          px: { xs: 2, md: 2.6 },
          py: { xs: 2, md: 2.4 },
          borderBottom: '1px solid',
          borderColor: 'divider',
          background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.06)} 0%, ${theme.palette.background.paper} 58%)`,
        }}
      >
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5} justifyContent="space-between">
          <Box>
            <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
              <ReceiptLongOutlined sx={{ fontSize: 22 }} />
              <Typography
                sx={{
                  fontSize: { xs: '1.9rem', md: '2.35rem' },
                  fontWeight: 900,
                  lineHeight: 1.02,
                  color: 'text.primary',
                  letterSpacing: '-0.03em',
                }}
              >
                ใบแจ้งเติมสต็อกคลังกลาง
              </Typography>
              <StatusBadge
                label={scope === 'central' ? 'Central scope' : 'Farm scope'}
                type={scope === 'central' ? 'success' : 'info'}
                size="small"
              />
            </Stack>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.75, fontWeight: 600 }}>
              {scope === 'central'
                ? `ดูและจัดการคำขอที่ส่งเข้า ${centralHubName}`
                : `สร้างคำขอจาก ${currentFacilityName} เพื่อแจ้งให้ ${centralHubName} เติม stock กลาง`}
            </Typography>
          </Box>

          <Stack direction="row" spacing={1} flexWrap="wrap" />
        </Stack>
      </Box>

      <Box>
        {children}
      </Box>
    </Box>
  );
}
