'use client';

import { Box, Chip, Stack, Typography } from '@mui/material';
import { Restaurant as FeedingIcon } from '@mui/icons-material';
import { alpha } from '@mui/material/styles';
import { UI } from './constants';
import type { FeedingPlanSummaryResponse } from './types';

type FeedingHeaderProps = {
  activeViewLabel: string;
  dateLabel: string;
  facilityLabel: string;
  roleLabel: string;
  summary: FeedingPlanSummaryResponse;
};

export default function FeedingHeader({
  activeViewLabel,
  dateLabel,
  facilityLabel,
  roleLabel,
  summary,
}: FeedingHeaderProps) {
  const completionRate = Math.max(0, Math.min(100, summary?.completionRatePct ?? 0));

  return (
    <Box
      sx={{
        position: 'relative',
        overflow: 'hidden',
        borderRadius: 4,
        border: `1px solid ${UI.border}`,
        bgcolor: UI.panel,
        background: `linear-gradient(135deg, rgba(237, 246, 242, 0.98) 0%, rgba(255,255,255,0.98) 45%, rgba(231, 241, 236, 0.96) 100%)`,
        boxShadow: UI.shadowLift,
        px: { xs: 2, md: 3 },
        py: { xs: 2, md: 2.4 },
        mb: 2,
        display: 'grid',
        gap: 2,
        '&::before': {
          content: '""',
          position: 'absolute',
          inset: 'auto -12% -34% auto',
          width: 240,
          height: 240,
          borderRadius: '50%',
          bgcolor: alpha(UI.accent, 0.08),
          filter: 'blur(10px)',
        },
        '&::after': {
          content: '""',
          position: 'absolute',
          inset: '-28% auto auto -10%',
          width: 200,
          height: 200,
          borderRadius: '50%',
          bgcolor: alpha('#9dc3b7', 0.18),
          filter: 'blur(18px)',
        },
      }}
    >
      <Stack direction={{ xs: 'column', lg: 'row' }} spacing={2} justifyContent="space-between" position="relative" zIndex={1}>
        <Stack spacing={1.5} sx={{ maxWidth: 760 }}>
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap alignItems="center">
            <Chip
              size="small"
              label="Feeding Operations"
              sx={{
                bgcolor: alpha(UI.accent, 0.08),
                color: UI.accent,
                border: `1px solid ${alpha(UI.accent, 0.14)}`,
                fontWeight: 800,
                height: 28,
              }}
            />
            <Chip
              size="small"
              label={activeViewLabel}
              sx={{
                bgcolor: '#fff',
                color: UI.text,
                border: `1px solid ${UI.border}`,
                fontWeight: 700,
                height: 28,
              }}
            />
          </Stack>

          <Stack direction="row" spacing={1.5} alignItems="flex-start">
            <Box
              sx={{
                width: { xs: 48, md: 56 },
                height: { xs: 48, md: 56 },
                borderRadius: 2.5,
                bgcolor: UI.accent,
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: `0 12px 24px ${alpha(UI.accent, 0.22)}`,
                flexShrink: 0,
              }}
            >
              <FeedingIcon sx={{ fontSize: { xs: 26, md: 30 } }} />
            </Box>
            <Box>
              <Typography
                sx={{
                  fontSize: { xs: '1.7rem', md: '2.15rem' },
                  fontWeight: 900,
                  lineHeight: 1.04,
                  color: UI.text,
                  letterSpacing: '-0.03em',
                }}
              >
                การให้อาหาร
              </Typography>
              <Typography sx={{ fontSize: { xs: '0.88rem', md: '0.96rem' }, color: UI.muted, mt: 0.7, maxWidth: 620 }}>
                วางแผน ติดตาม และปิดงานในหน้าเดียว พร้อมมุมมองที่เหมาะทั้ง manager และ worker
              </Typography>
            </Box>
          </Stack>
        </Stack>

        <Stack spacing={1} sx={{ minWidth: { xs: '100%', lg: 300 }, alignSelf: 'flex-start' }}>
          <Box
            sx={{
              borderRadius: 2.6,
              border: `1px solid ${UI.border}`,
              bgcolor: alpha('#fff', 0.85),
              px: 1.5,
              py: 1.2,
              boxShadow: UI.shadowSoft,
            }}
          >
            <Typography variant="caption" sx={{ color: UI.muted, fontWeight: 700, letterSpacing: '0.02em' }}>
              สรุปบริบท
            </Typography>
            <Stack direction="row" spacing={1} mt={1} flexWrap="wrap" useFlexGap>
              <Chip size="small" label={dateLabel} sx={{ bgcolor: UI.accentSurface, color: UI.accent, fontWeight: 700 }} />
              <Chip size="small" label={facilityLabel} sx={{ bgcolor: '#fff', color: UI.text, border: `1px solid ${UI.border}`, fontWeight: 700 }} />
              <Chip size="small" label={roleLabel} sx={{ bgcolor: alpha('#f4f7f5', 1), color: UI.muted, fontWeight: 700 }} />
            </Stack>
            <Stack direction="row" spacing={1} mt={1.3} flexWrap="wrap" useFlexGap>
              <Box sx={{ minWidth: 88 }}>
                <Typography variant="caption" sx={{ color: UI.muted, display: 'block' }}>ปริมาณวันนี้</Typography>
                <Typography sx={{ fontWeight: 900, color: UI.text, lineHeight: 1.1 }}>
                  {(summary?.totalPlannedKg ?? 0).toLocaleString(undefined, { maximumFractionDigits: 1 })} กก.
                </Typography>
              </Box>
              <Box sx={{ minWidth: 88 }}>
                <Typography variant="caption" sx={{ color: UI.muted, display: 'block' }}>เสร็จแล้ว</Typography>
                <Typography sx={{ fontWeight: 900, color: UI.accent, lineHeight: 1.1 }}>
                  {summary?.completedCount ?? 0}/{summary?.totalCount ?? 0}
                </Typography>
              </Box>
              <Box sx={{ minWidth: 88 }}>
                <Typography variant="caption" sx={{ color: UI.muted, display: 'block' }}>FCR MTD</Typography>
                <Typography sx={{ fontWeight: 900, color: UI.accentWarm, lineHeight: 1.1 }}>
                  {summary?.fcrMtd != null ? summary.fcrMtd.toFixed(2) : '-'}
                </Typography>
              </Box>
            </Stack>
          </Box>
        </Stack>
      </Stack>

      <Box
        sx={{
          position: 'relative',
          zIndex: 1,
          height: 8,
          borderRadius: 999,
          bgcolor: alpha(UI.accentSoft, 0.72),
          overflow: 'hidden',
        }}
      >
        <Box
          sx={{
            height: '100%',
            width: `${completionRate}%`,
            borderRadius: 999,
            background: `linear-gradient(90deg, ${UI.accent} 0%, #2d7a6f 100%)`,
          }}
        />
      </Box>
    </Box>
  );
}
