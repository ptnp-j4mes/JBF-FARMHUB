'use client';

import { Box, Chip, Divider, Stack, Typography } from '@mui/material';
import { alpha } from '@mui/material/styles';
import {
  LocalCafe as FeedIcon,
  ShoppingCart as CartIcon,
} from '@mui/icons-material';
import { UI } from '../constants';
import { formatFeedQuantityWithSecondaryKg } from '../utils';
import type { FeedingFiScheduleRowResponse } from '../types';

type FiScheduleRowProps = {
  row: FeedingFiScheduleRowResponse;
};

export default function FiScheduleRow({ row }: FiScheduleRowProps) {
  return (
    <Box
      sx={{
        borderRadius: 10,
        border: `1px solid ${UI.border}`,
        bgcolor: '#FFFFFF',
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
      {/* Header */}
      <Box sx={{ px: { xs: 1.6, md: 2 }, py: 1.3, bgcolor: alpha(UI.accentSurface, 0.82), display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 1.2, flexWrap: 'wrap' }}>
        <Stack direction="row" spacing={1} alignItems="center">
          <Box sx={{ width: 34, height: 34, borderRadius: 10, bgcolor: '#fff', color: UI.accent, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: UI.shadowSoft }}>
            <FeedIcon sx={{ fontSize: 18 }} />
          </Box>
          <Box>
            <Typography sx={{ fontWeight: 900, fontSize: '0.94rem', letterSpacing: '-0.01em' }}>
              {row.houseCode} {row.houseName}
            </Typography>
            <Typography variant="caption" sx={{ color: UI.muted }}>
              {row.stockHead.toLocaleString()} ตัว • Day {row.targetDay ?? '-'}
            </Typography>
          </Box>
        </Stack>
        <Stack direction="row" spacing={0.8} alignItems="center">
          {row.feedingFormat && <Chip size="small" label={row.feedingFormat} sx={{ fontWeight: 700, bgcolor: '#fff', height: 24 }} />}
          <Chip
            size="small"
            color="primary"
            icon={<CartIcon sx={{ fontSize: '14px !important' }} />}
            label={`${row.roundCount} รอบ`}
            sx={{ fontWeight: 700, height: 24 }}
          />
        </Stack>
      </Box>

        {/* Feed info */}
      <Box sx={{ px: { xs: 1.6, md: 2 }, py: 1.3 }}>
        <Typography sx={{ fontWeight: 800, fontSize: '0.92rem', color: UI.text }}>
          {row.feedCode || '-'} {row.feedItemName || ''}
        </Typography>
        <Typography variant="caption" sx={{ color: UI.muted }}>
          FI {row.fiGramPerHead != null ? `${row.fiGramPerHead.toLocaleString()} กรัม/ตัว` : 'ยังไม่มีค่า'}
        </Typography>
        <Stack direction="row" spacing={0.8} flexWrap="wrap" useFlexGap sx={{ mt: 1 }}>
          <Chip
            size="small"
            label={`รถเข็น ${row.cartWeightKg != null ? `${row.cartWeightKg.toLocaleString()} กก./เที่ยว` : '-'}`}
            sx={{
              fontWeight: 700,
              height: 24,
              bgcolor: alpha('#1D4ED8', 0.08),
              color: '#1D4ED8',
            }}
          />
          {row.cartPlanText && (
            <Chip
              size="small"
              label={row.cartPlanText}
              sx={{
                fontWeight: 700,
                height: 24,
                bgcolor: alpha(UI.accent, 0.08),
                color: UI.accent,
              }}
            />
          )}
        </Stack>

        {/* Metric columns */}
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr 1fr', md: 'repeat(4, 1fr)' },
          gap: 1,
          mt: 1.2,
        }}
        >
          <Box sx={{ textAlign: 'center', py: 0.85, borderRadius: 10, bgcolor: '#F0FDF4' }}>
            <Typography variant="caption" sx={{ color: UI.muted, display: 'block', fontWeight: 600 }}>แนะนำ</Typography>
            <Typography sx={{ fontWeight: 800, color: '#15803D', fontSize: '0.88rem' }}>
              {formatFeedQuantityWithSecondaryKg(row.suggestedKg ?? row.targetFeedKg, row)}
            </Typography>
          </Box>
          <Box sx={{ textAlign: 'center', py: 0.85, borderRadius: 10, bgcolor: '#FEF3C7' }}>
            <Typography variant="caption" sx={{ color: UI.muted, display: 'block', fontWeight: 600 }}>Backlog</Typography>
            <Typography sx={{ fontWeight: 800, color: '#B45309', fontSize: '0.88rem' }}>
              {(row.backlogKg ?? 0).toLocaleString(undefined, { maximumFractionDigits: 3 })} กก.
            </Typography>
          </Box>
          <Box sx={{ textAlign: 'center', py: 0.85, borderRadius: 10, bgcolor: UI.accentSurface }}>
            <Typography variant="caption" sx={{ color: UI.muted, display: 'block', fontWeight: 600 }}>แผน</Typography>
            <Typography sx={{ fontWeight: 800, color: UI.accent, fontSize: '0.88rem' }}>
              {formatFeedQuantityWithSecondaryKg(row.plannedKg ?? row.targetFeedKg, row)}
            </Typography>
          </Box>
          <Box sx={{ textAlign: 'center', py: 0.85, borderRadius: 10, bgcolor: '#EFF6FF' }}>
            <Typography variant="caption" sx={{ color: UI.muted, display: 'block', fontWeight: 600 }}>รถเข็น</Typography>
            <Typography sx={{ fontWeight: 800, color: '#1D4ED8', fontSize: '0.88rem' }}>
              {row.cartWeightKg != null ? `${row.cartWeightKg.toLocaleString()} กก./เที่ยว` : '-'}
            </Typography>
          </Box>
        </Box>

        {/* Cart round chips */}
        {row.plannedRounds.length > 0 && (
          <>
            <Divider sx={{ my: 1.2 }} />
            <Stack direction="row" spacing={0.6} flexWrap="wrap" useFlexGap>
              {row.plannedRounds.map((round) => (
                <Chip
                  key={`${row.houseId}-${round.roundNo}`}
                  size="small"
                  variant="outlined"
                  label={`คัน ${round.roundNo}: ${(round.displayQty ?? round.plannedKg).toLocaleString()} ${round.displayUomName || row.displayUomName || 'กก.'}`}
                  sx={{
                    borderColor: UI.accentSoft,
                    color: UI.accent,
                    fontWeight: 600,
                    height: 26,
                    fontSize: '0.75rem',
                    bgcolor: '#fff',
                  }}
                />
              ))}
            </Stack>
            {row.cartPlanText && (
              <Typography variant="caption" sx={{ color: UI.muted, mt: 0.6, display: 'block' }}>
                {row.cartPlanText}
              </Typography>
            )}
          </>
        )}
      </Box>
    </Box>
  );
}
