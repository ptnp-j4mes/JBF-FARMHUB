'use client';

import { Alert, Box, Chip, Stack, Typography } from '@mui/material';
import { alpha } from '@mui/material/styles';
import {
  BarChart as ReportsIcon,
} from '@mui/icons-material';
import { UI, panelSx } from '../constants';
import FcrBar from '../components/FcrBar';
import type { FeedingFarmFcrRow } from '../types';

type ReportsTabProps = {
  farmFcr: FeedingFarmFcrRow[];
};

export default function ReportsTab({ farmFcr }: ReportsTabProps) {
  return (
    <Box sx={{ ...panelSx, p: 0, overflow: 'hidden' }}>
      {/* Section header */}
      <Box sx={{ px: { xs: 1.6, md: 2.2 }, py: 1.4, bgcolor: alpha(UI.accentSurface, 0.82), display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: `1px solid ${UI.border}`, flexWrap: 'wrap', gap: 1.2 }}>
        <Stack direction="row" spacing={1} alignItems="center">
          <Box sx={{ width: 36, height: 36, borderRadius: 10, bgcolor: '#fff', color: UI.accent, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: UI.shadowSoft }}>
            <ReportsIcon sx={{ fontSize: 20 }} />
          </Box>
          <Box>
            <Typography sx={{ fontWeight: 900, fontSize: '0.98rem', letterSpacing: '-0.01em' }}>FCR รายฟาร์ม</Typography>
            <Typography variant="caption" sx={{ color: UI.muted, display: 'block', mt: 0.1 }}>ข้อมูลเดือนปัจจุบัน</Typography>
          </Box>
        </Stack>
        <Chip size="small" label={`${farmFcr.length} ฟาร์ม`} sx={{ fontWeight: 800, height: 30, bgcolor: '#fff', border: `1px solid ${UI.border}`, color: UI.accent }} />
      </Box>

      {/* Content */}
      <Box sx={{ p: { xs: 1.2, md: 1.6 }, bgcolor: 'rgba(255,255,255,0.7)' }}>
        <Stack spacing={1.3}>
          {farmFcr.length === 0 && (
            <Alert severity="info" sx={{ borderRadius: 10, border: `1px solid ${UI.border}` }}>ยังไม่มีข้อมูล FCR เดือนนี้</Alert>
          )}
          {farmFcr.map((farm) => (
            <FcrBar
              key={farm.facilityId}
              facilityName={farm.facilityName}
              fcrActual={farm.fcrActual}
            />
          ))}
        </Stack>
      </Box>
    </Box>
  );
}
