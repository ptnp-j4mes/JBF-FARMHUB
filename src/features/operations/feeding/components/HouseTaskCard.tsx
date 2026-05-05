'use client';

import { Box, LinearProgress, Stack, Typography } from '@mui/material';
import { alpha } from '@mui/material/styles';
import { StockActionButton } from '@/features/production/stock/components/StockActionButton';
import {
  HomeWork as HouseIcon,
} from '@mui/icons-material';
import { UI, primaryButtonSx, secondaryButtonSx } from '../constants';
import StatusChip from './StatusChip';

export type HouseTodayBoardItem = {
  houseId: number;
  houseCode: string;
  houseName: string;
  fiDay: number | null;
  stockHead: number;
  feedCodes: Set<string>;
  targetFeedKg: number;
  roundCount: number;
  plannedKg: number;
  actualKg: number;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';
};

type HouseTaskCardProps = {
  house: HouseTodayBoardItem;
  onViewExecution: () => void;
};

export default function HouseTaskCard({ house, onViewExecution }: HouseTaskCardProps) {
  const completionPct = house.targetFeedKg > 0
    ? Math.min(100, (house.actualKg / house.targetFeedKg) * 100)
    : 0;

  const statusColor = house.status === 'COMPLETED'
    ? '#15803D'
    : house.status === 'IN_PROGRESS'
      ? '#B45309'
      : UI.muted;

  return (
    <Box
      sx={{
        position: 'relative',
        p: 0,
        borderRadius: 3,
        border: `1px solid ${UI.border}`,
        bgcolor: '#FFFFFF',
        boxShadow: UI.shadowSoft,
        overflow: 'hidden',
        transition: 'transform 180ms ease, box-shadow 180ms ease, border-color 180ms ease',
        '&:hover': {
          transform: 'translateY(-1px)',
          boxShadow: UI.shadow,
          borderColor: alpha(statusColor, 0.2),
        },
      }}
    >
      {/* Color accent bar */}
      <Box sx={{ height: 4, bgcolor: statusColor }} />

      <Box sx={{ px: { xs: 1.6, md: 2 }, py: { xs: 1.5, md: 1.75 } }}>
        {/* Header row */}
        <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" alignItems={{ xs: 'flex-start', md: 'center' }} mb={1.1} spacing={1.2}>
          <Stack direction="row" spacing={1.1} alignItems="center">
            <Box
              sx={{
                width: 40,
                height: 40,
                borderRadius: 2.2,
                bgcolor: house.status === 'COMPLETED' ? '#F0FDF4' : house.status === 'IN_PROGRESS' ? '#FFFBEB' : UI.accentSurface,
                color: statusColor,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: `inset 0 0 0 1px ${alpha(statusColor, 0.08)}`,
              }}
            >
              <HouseIcon sx={{ fontSize: 20 }} />
            </Box>
            <Box>
              <Typography sx={{ fontWeight: 900, fontSize: '0.96rem', lineHeight: 1.2, letterSpacing: '-0.01em' }}>
                {house.houseCode} {house.houseName}
              </Typography>
              <Typography variant="caption" sx={{ color: UI.muted }}>
                Day {house.fiDay ?? '-'} • {house.stockHead.toLocaleString()} ตัว
              </Typography>
            </Box>
          </Stack>
          <Stack direction="row" spacing={1} alignItems="center">
            <StatusChip status={house.status} />
            {house.status !== 'COMPLETED' && (
              <StockActionButton
                tone={house.status === 'PENDING' ? 'success' : 'info'}
                size="small"
                onClick={() => onViewExecution()}
              >
                {house.status === 'PENDING' ? 'เริ่มงาน' : 'ทำต่อ'}
              </StockActionButton>
            )}
          </Stack>
        </Stack>

        {/* Feed codes */}
        {house.feedCodes.size > 0 && (
          <Typography variant="caption" sx={{ color: UI.muted, mb: 1, display: 'block', lineHeight: 1.4 }}>
            Feed: {Array.from(house.feedCodes).join(', ')}
          </Typography>
        )}

        {/* Metrics grid */}
        <Box
          sx={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 1,
          mt: 1,
        }}
        >
          <Box sx={{ textAlign: 'center', py: 0.95, borderRadius: 1.8, bgcolor: UI.accentSurface }}>
            <Typography variant="caption" sx={{ color: UI.muted, display: 'block', fontWeight: 600 }}>เป้าหมาย</Typography>
            <Typography sx={{ fontWeight: 800, color: UI.accent, fontSize: '0.95rem' }}>
              {house.targetFeedKg.toLocaleString()} <Typography component="span" variant="caption">กก.</Typography>
            </Typography>
          </Box>
          <Box sx={{ textAlign: 'center', py: 0.95, borderRadius: 1.8, bgcolor: '#EFF6FF' }}>
            <Typography variant="caption" sx={{ color: UI.muted, display: 'block', fontWeight: 600 }}>แผน</Typography>
            <Typography sx={{ fontWeight: 800, color: '#1D4ED8', fontSize: '0.95rem' }}>
              {house.plannedKg.toLocaleString()} <Typography component="span" variant="caption">กก.</Typography>
            </Typography>
          </Box>
          <Box sx={{ textAlign: 'center', py: 0.95, borderRadius: 1.8, bgcolor: '#F0FDF4' }}>
            <Typography variant="caption" sx={{ color: UI.muted, display: 'block', fontWeight: 600 }}>จริง</Typography>
            <Typography sx={{ fontWeight: 800, color: '#15803D', fontSize: '0.95rem' }}>
              {house.actualKg.toLocaleString()} <Typography component="span" variant="caption">กก.</Typography>
            </Typography>
          </Box>
        </Box>

        {/* Progress bar */}
        <Box sx={{ mt: 1.2 }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center" mb={0.4}>
            <Typography variant="caption" sx={{ color: UI.muted, fontWeight: 600 }}>
              ความคืบหน้า
            </Typography>
            <Typography variant="caption" sx={{ color: statusColor, fontWeight: 700 }}>
              {completionPct.toFixed(0)}% • {house.roundCount} รอบรถ
            </Typography>
          </Stack>
          <LinearProgress
            variant="determinate"
            value={completionPct}
            sx={{
              height: 6,
              borderRadius: 99,
              bgcolor: '#E5E7EB',
              '& .MuiLinearProgress-bar': {
                bgcolor: statusColor,
                borderRadius: 99,
              },
            }}
          />
        </Box>
      </Box>
    </Box>
  );
}
