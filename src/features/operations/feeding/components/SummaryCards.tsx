'use client';

import type { ReactNode } from 'react';
import { Box, Grid, LinearProgress, Typography } from '@mui/material';
import { alpha } from '@mui/material/styles';
import {
  Scale as ScaleIcon,
  TrendingUp as TrendingUpIcon,
  AttachMoney as MoneyIcon,
  Speed as SpeedIcon,
} from '@mui/icons-material';
import { UI } from '../constants';
import type { FeedingPlanSummaryResponse } from '../types';

type CardConfig = {
  key: string;
  icon: ReactNode;
  color: string;
  bgLight: string;
  label: string;
  getValue: (summary: FeedingPlanSummaryResponse) => string;
  getSub: (summary: FeedingPlanSummaryResponse) => string | null;
  getProgress: (summary: FeedingPlanSummaryResponse) => number | null;
};

const FCR_TARGET = 2.45;
const COST_TARGET = 25;

const CARDS: CardConfig[] = [
  {
    key: 'feed',
    icon: <ScaleIcon sx={{ fontSize: 28 }} />,
    color: '#0f766e',
    bgLight: '#edfaf7',
    label: 'ปริมาณอาหารวันนี้',
    getValue: (s) => `${s.totalPlannedKg.toFixed(1)} กก.`,
    getSub: (s) => `เสร็จแล้ว ${s.completedCount}/${s.totalCount}`,
    getProgress: (s) => s.completionRatePct,
  },
  {
    key: 'fcr',
    icon: <TrendingUpIcon sx={{ fontSize: 28 }} />,
    color: '#6d28d9',
    bgLight: '#f5f1ff',
    label: 'FCR เฉลี่ย (MTD)',
    getValue: (s) => s.fcrMtd?.toFixed(2) ?? '-',
    getSub: () => `เป้าหมาย ≤ ${FCR_TARGET}`,
    getProgress: (s) => {
      if (s.fcrMtd == null || s.fcrMtd <= 0) return null;
      return Math.min(100, Math.max(0, (FCR_TARGET / s.fcrMtd) * 100));
    },
  },
  {
    key: 'cost',
    icon: <MoneyIcon sx={{ fontSize: 28 }} />,
    color: '#b45309',
    bgLight: '#fff7ed',
    label: 'ต้นทุนอาหาร/กก.',
    getValue: (s) => `${s.costPerKg.toFixed(2)} ฿`,
    getSub: () => `เป้าหมาย ≤ ${COST_TARGET.toFixed(0)} ฿`,
    getProgress: (s) => {
      if (s.costPerKg <= 0) return null;
      return Math.min(100, Math.max(0, (COST_TARGET / s.costPerKg) * 100));
    },
  },
  {
    key: 'efficiency',
    icon: <SpeedIcon sx={{ fontSize: 28 }} />,
    color: '#15803d',
    bgLight: '#effdf2',
    label: 'ประสิทธิภาพการให้อาหาร',
    getValue: (s) => `${s.efficiencyPct.toFixed(1)}%`,
    getSub: () => null,
    getProgress: (s) => s.efficiencyPct,
  },
];

type SummaryCardsProps = {
  summary: FeedingPlanSummaryResponse;
};

export default function SummaryCards({ summary }: SummaryCardsProps) {
  return (
    <Grid container spacing={1.5} mb={2}>
      {CARDS.map((card) => (
        <Grid key={card.key} size={{ xs: 12, sm: 6, md: 3 }}>
          <Box
            sx={{
              position: 'relative',
              overflow: 'hidden',
              borderRadius: 3,
              border: `1px solid ${UI.border}`,
              bgcolor: '#fff',
              px: 2,
              py: 1.8,
              height: '100%',
              display: 'flex',
              alignItems: 'flex-start',
              gap: 1.4,
              '&::before': {
                content: '""',
                position: 'absolute',
                inset: 0,
                background: `linear-gradient(145deg, ${alpha(card.bgLight, 0.85)} 0%, rgba(255,255,255,0) 45%)`,
                pointerEvents: 'none',
              },
            }}
          >
            <Box
              sx={{
                width: 48,
                height: 48,
                borderRadius: 2.4,
                bgcolor: card.bgLight,
                color: card.color,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                boxShadow: `inset 0 0 0 1px ${alpha(card.color, 0.08)}`,
              }}
            >
              {card.icon}
            </Box>
            <Box sx={{ minWidth: 0, flex: 1 }}>
              <Typography variant="caption" sx={{ color: UI.muted, fontWeight: 700, fontSize: '0.77rem', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                {card.label}
              </Typography>
              <Typography variant="h5" sx={{ fontWeight: 900, color: card.color, lineHeight: 1.15, mt: 0.2, letterSpacing: '-0.02em' }}>
                {card.getValue(summary)}
              </Typography>
              {card.getSub(summary) && (
                <Typography variant="caption" sx={{ color: UI.muted, mt: 0.35, display: 'block' }}>
                  {card.getSub(summary)}
                </Typography>
              )}
              {card.getProgress(summary) != null && (
                <LinearProgress
                  variant="determinate"
                  value={Math.min(100, card.getProgress(summary) ?? 0)}
                  sx={{
                    mt: 0.8,
                    height: 6,
                    borderRadius: 99,
                    bgcolor: alpha(card.color, 0.1),
                    '& .MuiLinearProgress-bar': {
                      bgcolor: card.color,
                      borderRadius: 99,
                    },
                  }}
                />
              )}
            </Box>
          </Box>
        </Grid>
      ))}
    </Grid>
  );
}
