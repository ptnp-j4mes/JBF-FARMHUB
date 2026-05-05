'use client';

import { Box, Button, Chip, Divider, Stack, Typography } from '@mui/material';
import { alpha } from '@mui/material/styles';
import { StockActionButton } from '@/features/production/stock/components/StockActionButton';
import {
  AccessTime as TimeIcon,
  LocalCafe as FeedIcon,
} from '@mui/icons-material';
import { UI, secondaryButtonSx } from '../constants';
import StatusChip from './StatusChip';
import {
  formatFeedQuantity,
  formatFeedQuantityWithSecondaryKg,
  formatSignedKg,
} from '../utils';
import type { FeedingFiScheduleRowResponse, FeedingPlanLineResponse } from '../types';

type DiffBadgeProps = {
  label: string;
  value: number | null;
};

function DiffBadge({ label, value }: DiffBadgeProps) {
  if (value == null) return null;
  const isPositive = value > 0;
  const isNegative = value < 0;
  const color = isPositive ? '#B45309' : isNegative ? '#DC2626' : '#15803D';
  const bg = isPositive ? '#FFFBEB' : isNegative ? '#FEF2F2' : '#F0FDF4';
  return (
    <Box sx={{ px: 1, py: 0.3, borderRadius: 1, bgcolor: bg, display: 'inline-flex', alignItems: 'center', gap: 0.3 }}>
      <Typography variant="caption" sx={{ color: UI.muted, fontWeight: 600 }}>{label}</Typography>
      <Typography variant="caption" sx={{ color, fontWeight: 800 }}>{formatSignedKg(value)}</Typography>
    </Box>
  );
}

type PlanLineCardProps = {
  row: FeedingPlanLineResponse;
  cartDetail: FeedingFiScheduleRowResponse | null;
  roleMode: 'manager' | 'worker';
  onComplete: (line: FeedingPlanLineResponse) => void;
};

export default function PlanLineCard({ row, cartDetail, roleMode, onComplete }: PlanLineCardProps) {
  const fiTargetKg = cartDetail?.targetFeedKg ?? null;
  const fiDiffPlanKg = fiTargetKg != null ? row.plannedQtyKg - fiTargetKg : null;
  const actualKg = row.actualQtyKg ?? null;
  const fiDiffActualKg = fiTargetKg != null && actualKg != null ? actualKg - fiTargetKg : null;
  const planDiffActualKg = actualKg != null ? actualKg - row.plannedQtyKg : null;
  const isCompleted = row.status === 'COMPLETED';

  return (
    <Box
      sx={{
        borderRadius: 3,
        border: `1px solid ${UI.border}`,
        bgcolor: isCompleted ? '#F0FDF4' : '#FFFFFF',
        boxShadow: UI.shadowSoft,
        overflow: 'hidden',
        transition: 'transform 180ms ease, box-shadow 180ms ease, border-color 180ms ease',
        '&:hover': {
          transform: 'translateY(-1px)',
          boxShadow: UI.shadow,
          borderColor: alpha(UI.accent, 0.2),
        },
      }}
    >
      {/* Status bar */}
      <Box sx={{ height: 4, bgcolor: isCompleted ? '#15803D' : row.status === 'IN_PROGRESS' ? '#B45309' : UI.accent }} />

      <Box sx={{ px: { xs: 1.6, md: 2 }, py: { xs: 1.5, md: 1.75 } }}>
        {/* Header row */}
        <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" alignItems={{ xs: 'flex-start', md: 'center' }} spacing={1.2}>
          <Stack direction="row" spacing={1.2} alignItems="center">
            <Box
              sx={{
                width: 40,
                height: 40,
                borderRadius: 2.2,
                bgcolor: isCompleted ? '#DCFCE7' : UI.accentSurface,
                color: isCompleted ? '#15803D' : UI.accent,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: `inset 0 0 0 1px ${alpha(UI.accent, 0.08)}`,
              }}
            >
              <TimeIcon sx={{ fontSize: 20 }} />
            </Box>
            <Box>
              <Typography sx={{ fontWeight: 900, fontSize: '0.96rem', letterSpacing: '-0.01em' }}>
                {row.scheduledTime} • {row.houseCode || '-'} {row.houseName}
              </Typography>
              <Stack direction="row" spacing={0.5} alignItems="center">
                <FeedIcon sx={{ fontSize: 14, color: UI.muted }} />
                <Typography variant="caption" sx={{ color: UI.muted, fontWeight: 600 }}>
                  {row.feedItemName}
                </Typography>
              </Stack>
            </Box>
          </Stack>
          <Stack direction="row" spacing={1} alignItems="center">
            <StatusChip status={row.status} />
            {!isCompleted && (
              <StockActionButton
                tone="success"
                size="small"
                onClick={() => onComplete(row)}
              >
                บันทึกเสร็จสิ้น
              </StockActionButton>
            )}
          </Stack>
        </Stack>

        {/* Metrics */}
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr 1fr', md: 'repeat(3, 1fr)' },
          gap: 1,
          mt: 1.2,
        }}
        >
          <Box sx={{ textAlign: 'center', py: 0.9, borderRadius: 1.7, bgcolor: UI.accentSurface }}>
            <Typography variant="caption" sx={{ color: UI.muted, display: 'block', fontWeight: 600 }}>แผน</Typography>
            <Typography sx={{ fontWeight: 800, color: UI.accent, fontSize: '0.9rem' }}>
              {formatFeedQuantityWithSecondaryKg(row.plannedQtyKg, row)}
            </Typography>
          </Box>
          <Box sx={{ textAlign: 'center', py: 0.9, borderRadius: 1.7, bgcolor: isCompleted ? '#DCFCE7' : '#EFF6FF' }}>
            <Typography variant="caption" sx={{ color: UI.muted, display: 'block', fontWeight: 600 }}>จริง</Typography>
            <Typography sx={{ fontWeight: 800, color: isCompleted ? '#15803D' : '#1D4ED8', fontSize: '0.9rem' }}>
              {row.actualQtyKg != null ? formatFeedQuantityWithSecondaryKg(row.actualQtyKg, row) : '-'}
            </Typography>
          </Box>
          {fiTargetKg != null && (
            <Box sx={{ textAlign: 'center', py: 0.9, borderRadius: 1.7, bgcolor: '#F5F3FF' }}>
              <Typography variant="caption" sx={{ color: UI.muted, display: 'block', fontWeight: 600 }}>FI Std</Typography>
              <Typography sx={{ fontWeight: 800, color: '#7C3AED', fontSize: '0.9rem' }}>
                {fiTargetKg.toLocaleString()} กก.
              </Typography>
            </Box>
          )}
        </Box>

        {/* Diff badges (manager mode) */}
        {roleMode === 'manager' && (
          <Stack direction="row" spacing={0.8} mt={1} flexWrap="wrap" useFlexGap>
            <DiffBadge label="แผน vs FI" value={fiDiffPlanKg} />
            <DiffBadge label="จริง vs FI" value={fiDiffActualKg} />
            <DiffBadge label="จริง vs แผน" value={planDiffActualKg} />
          </Stack>
        )}

        {/* Worker mode - task summary */}
        {roleMode === 'worker' && (
          <Box sx={{ mt: 1, p: 1, borderRadius: 1.5, bgcolor: UI.accentSurface, border: `1px solid ${UI.accentSoft}` }}>
            <Typography variant="caption" sx={{ color: UI.accent, fontWeight: 800, display: 'block', mb: 0.3 }}>
              🎯 งานที่ต้องทำ
            </Typography>
            <Typography sx={{ fontSize: '0.88rem', fontWeight: 700, color: UI.accent }}>
              {cartDetail?.plannedRounds.map((round) => `${(round.displayQty ?? round.plannedKg).toLocaleString()} ${round.displayUomName || row.displayUomName || 'กก.'}`).join(' / ') || formatFeedQuantity(row.plannedQtyKg, row)}
            </Typography>
          </Box>
        )}

        {/* Cart detail */}
        {cartDetail && (
          <>
            <Divider sx={{ my: 1 }} />
            <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
            <Typography variant="caption" sx={{ color: '#14532D', fontWeight: 700 }}>
              🚛 {cartDetail.feedCode || '-'} • {cartDetail.roundCount} คัน
              {cartDetail.cartWeightKg != null ? ` (คันละ ${cartDetail.cartWeightKg.toLocaleString()} กก.)` : ''}
            </Typography>
          </Stack>
            {cartDetail.plannedRounds.length > 0 && (
              <Stack direction="row" spacing={0.5} mt={0.6} flexWrap="wrap" useFlexGap>
                {cartDetail.plannedRounds.slice(0, 4).map((round) => (
                  <Chip
                    key={`${row.id}-${round.roundNo}`}
                    size="small"
                    variant="outlined"
                    label={`คัน ${round.roundNo}: ${(round.displayQty ?? round.plannedKg).toLocaleString()} ${round.displayUomName || row.displayUomName || 'กก.'}`}
                    sx={{ height: 24, fontSize: '0.72rem', borderColor: UI.accentSoft, color: UI.accent, fontWeight: 600 }}
                  />
                ))}
                {cartDetail.plannedRounds.length > 4 && (
                  <Chip size="small" variant="outlined" label={`+${cartDetail.plannedRounds.length - 4}`} sx={{ height: 24, fontSize: '0.72rem' }} />
                )}
              </Stack>
            )}
          </>
        )}
      </Box>
    </Box>
  );
}
