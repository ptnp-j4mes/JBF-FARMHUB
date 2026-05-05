import type { ReactNode } from 'react';
import { Box, Chip, Stack, Typography } from '@mui/material';
import { ReceiptLongOutlined } from '@mui/icons-material';

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
  return (
    <Box sx={{ color: 'text.primary' }}>
      <Box
        sx={{
          px: { xs: 2, md: 3 },
          py: 2,
          borderBottom: '1px solid',
          borderColor: 'divider',
          background: 'linear-gradient(135deg, #F3FAF5 0%, #FFFFFF 62%, #E9F5EE 100%)',
        }}
      >
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5} justifyContent="space-between">
          <Box>
            <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
              <ReceiptLongOutlined sx={{ fontSize: 22 }} />
              <Typography variant="h5" sx={{ fontWeight: 950 }}>
                ใบแจ้งเติมสต็อกคลังกลาง
              </Typography>
              <Chip
                label={scope === 'central' ? 'Central scope' : 'Farm scope'}
                color={scope === 'central' ? 'success' : 'info'}
                variant="outlined"
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
