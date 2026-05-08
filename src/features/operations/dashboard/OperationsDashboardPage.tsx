'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import {
  Alert,
  Box,
  Chip,
  InputAdornment,
  Skeleton,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import {
  Activity,
  BarChart3,
  Bell,
  CheckCircle2,
  ChevronRight,
  PiggyBank,
  Scale,
  Search,
  ShieldCheck,
  OctagonAlert,
  TrendingUp,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { dashboardService } from './services/dashboard.service';
import type {
  CommandCenterAlert,
  CommandCenterFeedUsageRow,
  CommandCenterFarmTableRow,
  CommandCenterResponse,
} from './types';

type DashboardUI = ReturnType<typeof buildDashboardUI>;

const EMPTY_DASHBOARD: CommandCenterResponse = {
  hasFarmAccess: true,
  accessMessage: '',
  lastUpdatedAt: new Date().toISOString(),
  summaryCards: {
    totalStockHead: 0,
    mortalityRatePct: 0,
    fcrAverage: 0,
    feedCostMonth: 0,
    budgetMonth: 0,
    budgetUsagePct: 0,
    momDeltaPct: 0,
  },
  alerts: [],
  farmTable: [],
  feedUsageByNumber: [],
};

function buildDashboardUI(mode: 'light' | 'dark') {
  const isDark = mode === 'dark';
  return {
    page: isDark ? '#0f172a' : '#f4f4f1',
    card: isDark ? '#111827' : '#ffffff',
    cardSoft: isDark ? '#172033' : '#f6f6f4',
    border: isDark ? 'rgba(148, 163, 184, 0.18)' : 'rgba(17, 24, 39, 0.08)',
    borderStrong: isDark ? 'rgba(148, 163, 184, 0.26)' : 'rgba(17, 24, 39, 0.12)',
    text: isDark ? '#f8fafc' : '#1f2937',
    muted: isDark ? '#cbd5e1' : '#6b7280',
    label: isDark ? '#94a3b8' : '#7a7a7a',
    green: '#219655',
    greenSoft: isDark ? 'rgba(33, 150, 85, 0.16)' : '#e8f5ee',
    amber: '#c58d10',
    amberSoft: isDark ? 'rgba(197, 141, 16, 0.16)' : '#fbf2dd',
    red: '#b42318',
    redSoft: isDark ? 'rgba(180, 35, 24, 0.16)' : '#fdecec',
    blue: '#3778c2',
    blueSoft: isDark ? 'rgba(55, 120, 194, 0.16)' : '#ebf3ff',
    shadow: isDark
      ? '0 18px 38px rgba(15, 23, 42, 0.35)'
      : '0 10px 28px rgba(17, 24, 39, 0.05)',
    panelShadow: isDark ? '0 10px 24px rgba(15, 23, 42, 0.28)' : '0 8px 20px rgba(17, 24, 39, 0.04)',
  };
}

function formatNumber(value: number, digits = 0) {
  return value.toLocaleString('th-TH', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}

function formatMaybeNumber(value: number, digits = 0) {
  if (!Number.isFinite(value) || value <= 0) {
    return '—';
  }
  return formatNumber(value, digits);
}

function statusTone(status: CommandCenterAlert['severity'], ui: DashboardUI) {
  if (status === 'critical') {
    return { color: ui.red, soft: ui.redSoft, label: 'วิกฤต' };
  }
  if (status === 'warning') {
    return { color: ui.amber, soft: ui.amberSoft, label: 'เฝ้าระวัง' };
  }
  return { color: ui.green, soft: ui.greenSoft, label: 'ข้อมูล' };
}

function farmTone(status: CommandCenterFarmTableRow['statusDot'], ui: DashboardUI) {
  if (status === 'critical') {
    return { color: ui.red, soft: ui.redSoft, label: 'วิกฤต' };
  }
  if (status === 'warning') {
    return { color: ui.amber, soft: ui.amberSoft, label: 'เฝ้าระวัง' };
  }
  return { color: ui.green, soft: ui.greenSoft, label: 'ปกติ' };
}

function feedTone(status: CommandCenterFeedUsageRow['status'], ui: DashboardUI) {
  if (status === 'over') {
    return { color: ui.amber, soft: ui.amberSoft, label: 'เกิน' };
  }
  if (status === 'under') {
    return { color: ui.blue, soft: ui.blueSoft, label: 'ต่ำกว่าแผน' };
  }
  return { color: ui.green, soft: ui.greenSoft, label: 'ปกติ' };
}

function topValue(rows: CommandCenterFeedUsageRow[]) {
  const values = rows.flatMap((row) => [row.actualTon, row.targetTon]);
  return Math.max(1, ...values);
}

function useDashboardData() {
  const [data, setData] = useState<CommandCenterResponse>(EMPTY_DASHBOARD);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await dashboardService.getCommandCenter();
      setData(response);
    } catch {
      setError('ไม่สามารถโหลดข้อมูล dashboard ได้ชั่วคราว กรุณาลองใหม่อีกครั้ง');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return { data, loading, error, reload: load };
}

function DashboardCard({
  children,
  sx,
}: {
  children: ReactNode;
  sx?: Record<string, unknown>;
}) {
  return (
    <Box
      sx={{
        borderRadius: '10px',
        border: '1px solid',
        borderColor: 'rgba(17, 24, 39, 0.08)',
        bgcolor: '#ffffff',
        boxShadow: '0 8px 20px rgba(17, 24, 39, 0.04)',
        overflow: 'hidden',
        ...sx,
      }}
    >
      {children}
    </Box>
  );
}

function SectionHeader({
  title,
  subtitle,
  meta,
}: {
  title: string;
  subtitle: string;
  meta?: ReactNode;
}) {
  return (
    <Stack spacing={0.45}>
      <Stack direction="row" alignItems="start" justifyContent="space-between" gap={2}>
        <Typography
          sx={{
            color: 'text.primary',
            fontSize: { xs: '1rem', md: '1.05rem' },
            fontWeight: 800,
            letterSpacing: '-0.02em',
            lineHeight: 1.2,
          }}
        >
          {title}
        </Typography>
        {meta ? (
          <Box sx={{ flexShrink: 0, lineHeight: 1 }}>{meta}</Box>
        ) : null}
      </Stack>
      <Typography
        sx={{
          color: 'text.secondary',
          fontSize: '0.88rem',
          lineHeight: 1.55,
        }}
      >
        {subtitle}
      </Typography>
    </Stack>
  );
}

function HeroBadge({
  icon: Icon,
  label,
  value,
  accent,
}: {
  icon: LucideIcon;
  label: string;
  value: number;
  accent: string;
}) {
  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: 'auto minmax(0, 1fr)',
        alignItems: 'center',
        columnGap: 1,
        px: 1,
        py: 0.9,
        borderRadius: '10px',
        border: '1px solid',
        borderColor: 'rgba(17, 24, 39, 0.10)',
        bgcolor: 'background.paper',
        boxShadow: '0 4px 12px rgba(17, 24, 39, 0.03)',
        minHeight: 62,
        width: '100%',
      }}
    >
      <Box
        sx={{
          width: 42,
          height: 42,
          borderRadius: '10px',
          display: 'grid',
          placeItems: 'center',
          bgcolor: accent,
          color: '#fff',
          flexShrink: 0,
          boxShadow: `inset 0 -1px 0 rgba(255,255,255,0.18)`,
        }}
      >
        <Icon size={19} strokeWidth={2.6} />
      </Box>
      <Box sx={{ minWidth: 0, display: 'grid', gap: 0.22, alignContent: 'center' }}>
        <Typography sx={{ color: accent, fontWeight: 800, fontSize: '0.83rem', lineHeight: 1.08 }}>
          {label}
        </Typography>
        <Stack direction="row" alignItems="baseline" spacing={0.55} sx={{ minWidth: 0 }}>
          <Typography
            sx={{
              color: 'text.primary',
              fontSize: '1.58rem',
              fontWeight: 900,
              letterSpacing: '-0.03em',
              lineHeight: 1,
              fontVariantNumeric: 'tabular-nums',
              whiteSpace: 'nowrap',
            }}
          >
            {formatNumber(value, 0)}
          </Typography>
          <Typography
            sx={{
              color: 'text.secondary',
              fontSize: '0.74rem',
              fontWeight: 600,
              lineHeight: 1,
              whiteSpace: 'nowrap',
              pb: 0.1,
            }}
          >
            ฟาร์ม
          </Typography>
        </Stack>
      </Box>
    </Box>
  );
}

function MetricCard({
  title,
  value,
  unit,
  note,
  footnote,
  icon: Icon,
  accent,
  soft,
  chipLabel = 'ปกติ',
}: {
  title: string;
  value: string;
  unit?: string;
  note: string;
  footnote: string;
  icon: LucideIcon;
  accent: string;
  soft: string;
  chipLabel?: string;
}) {
  return (
    <DashboardCard sx={{ minHeight: 178 }}>
      <Box sx={{ p: { xs: 2.25, md: 2.5 }, height: '100%', display: 'grid', gap: 1.1 }}>
        <Stack direction="row" alignItems="start" justifyContent="space-between" gap={1.5}>
          <Typography
            sx={{
              color: 'text.secondary',
              fontWeight: 800,
              fontSize: '0.93rem',
              lineHeight: 1.2,
            }}
          >
            {title}
          </Typography>
          <Chip
            label={chipLabel}
            size="small"
            sx={{
              height: 26,
              bgcolor: 'rgba(34, 197, 94, 0.10)',
              color: '#1d8a49',
              border: '1px solid rgba(34, 197, 94, 0.18)',
              fontWeight: 800,
              borderRadius: '10px',
              '& .MuiChip-label': { px: 1.1 },
            }}
          />
        </Stack>

        <Stack direction="row" alignItems="center" gap={1.5} sx={{ mt: 0.1 }}>
          <Box
            sx={{
              width: 54,
              height: 54,
              borderRadius: '50%',
              display: 'grid',
              placeItems: 'center',
              bgcolor: soft,
              color: accent,
              flexShrink: 0,
            }}
          >
            <Icon size={25} strokeWidth={2.2} />
          </Box>
          <Stack spacing={0.2} sx={{ minWidth: 0 }}>
            <Stack direction="row" alignItems="baseline" spacing={0.6}>
              <Typography
                sx={{
                  color: 'text.primary',
                  fontSize: { xs: '2rem', md: '2.15rem' },
                  fontWeight: 900,
                  letterSpacing: '-0.04em',
                  lineHeight: 1,
                  fontVariantNumeric: 'tabular-nums',
                }}
              >
                {value}
              </Typography>
              {unit ? (
                <Typography sx={{ color: 'text.secondary', fontSize: '0.92rem', fontWeight: 700 }}>
                  {unit}
                </Typography>
              ) : null}
            </Stack>
          </Stack>
        </Stack>

        <Box sx={{ mt: 'auto' }}>
          <Typography sx={{ color: 'text.secondary', fontSize: '0.85rem', lineHeight: 1.55 }}>
            {note}
          </Typography>
          <Typography
            sx={{
              color: accent,
              fontWeight: 800,
              fontSize: '0.85rem',
              lineHeight: 1.4,
              mt: 0.15,
            }}
          >
            {footnote}
          </Typography>
        </Box>
      </Box>
    </DashboardCard>
  );
}

function DashboardSkeleton() {
  return (
    <Box
      sx={{
        minHeight: '100vh',
        px: { xs: 1.5, md: 2.5 },
        py: { xs: 1.5, md: 2.5 },
        display: 'grid',
        gap: 2,
        maxWidth: 1440,
        width: '100%',
        mx: 'auto',
        bgcolor: '#f4f4f1',
      }}
    >
      <Skeleton variant="rounded" height={262} sx={{ borderRadius: '10px'}} animation="wave" />
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))', xl: 'repeat(4, minmax(0, 1fr))' },
          gap: 2,
        }}
      >
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={index} variant="rounded" height={178} sx={{ borderRadius: '10px'}} animation="wave" />
        ))}
      </Box>
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', lg: '1.45fr 0.95fr' },
          gap: 2,
        }}
      >
        <Skeleton variant="rounded" height={372} sx={{ borderRadius: '10px'}} animation="wave" />
        <Skeleton variant="rounded" height={372} sx={{ borderRadius: '10px'}} animation="wave" />
      </Box>
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', lg: '0.9fr 1.6fr' },
          gap: 2,
        }}
      >
        <Skeleton variant="rounded" height={418} sx={{ borderRadius: '10px'}} animation="wave" />
        <Skeleton variant="rounded" height={418} sx={{ borderRadius: '10px'}} animation="wave" />
      </Box>
    </Box>
  );
}

function FeedUsagePanel({
  rows,
  ui,
}: {
  rows: CommandCenterFeedUsageRow[];
  ui: DashboardUI;
}) {
  const maxValue = topValue(rows);
  const visibleRows = rows.slice(0, 10);
  const statusCounts = visibleRows.reduce(
    (acc, row) => {
      acc[row.status] += 1;
      return acc;
    },
    { normal: 0, over: 0, under: 0 } as Record<CommandCenterFeedUsageRow['status'], number>,
  );

  return (
    <DashboardCard sx={{ height: '100%' }}>
      <Box sx={{ p: { xs: 2.25, md: 2.5 }, height: '100%', display: 'grid', gap: 1.8 }}>
        <SectionHeader
          title="การใช้อาหารตามรหัส"
          subtitle="เทียบเป้าหมายกับการใช้งานใน 10 รายการล่าสุด เพื่อลดจุดที่น่าจับตาให้ทีมมองเห็นได้ทันที"
          meta={
            <Chip
              label={`${formatNumber(visibleRows.length, 0)} รายการ`}
              size="small"
              sx={{
                bgcolor: 'rgba(17, 24, 39, 0.06)',
                color: 'text.secondary',
                fontWeight: 800,
                borderRadius: '10px',
                height: 26,
                '& .MuiChip-label': { px: 1.1 },
              }}
            />
          }
        />

        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
          <Chip
            label={
              <Stack direction="row" alignItems="center" gap={0.9}>
                <Box sx={{ width: 8, height: 8, borderRadius: '10px', bgcolor: ui.green }} />
                <span>ปกติ</span>
                <strong>{statusCounts.normal}</strong>
              </Stack>
            }
              sx={{
                bgcolor: '#f3f7f4',
                border: '1px solid rgba(33, 150, 85, 0.14)',
                color: ui.green,
                fontWeight: 800,
                borderRadius: '10px',
                '& .MuiChip-label': { px: 1.35, py: 0.55 },
              }}
          />
          <Chip
            label={
              <Stack direction="row" alignItems="center" gap={0.9}>
                <Box sx={{ width: 8, height: 8, borderRadius: '10px', bgcolor: ui.amber }} />
                <span>เฝ้าระวัง</span>
                <strong>{statusCounts.over}</strong>
              </Stack>
            }
              sx={{
                bgcolor: '#fbf7ee',
                border: '1px solid rgba(197, 141, 16, 0.16)',
                color: ui.amber,
                fontWeight: 800,
                borderRadius: '10px',
                '& .MuiChip-label': { px: 1.35, py: 0.55 },
              }}
          />
          <Chip
            label={
              <Stack direction="row" alignItems="center" gap={0.9}>
                <Box sx={{ width: 8, height: 8, borderRadius: '10px', bgcolor: ui.blue }} />
                <span>ต่ำกว่าแผน</span>
                <strong>{statusCounts.under}</strong>
              </Stack>
            }
              sx={{
                bgcolor: '#eef4fc',
                border: '1px solid rgba(55, 120, 194, 0.16)',
                color: ui.blue,
                fontWeight: 800,
                borderRadius: '10px',
                '& .MuiChip-label': { px: 1.35, py: 0.55 },
              }}
          />
        </Stack>

        {visibleRows.length === 0 ? (
          <Box
            sx={{
              flex: 1,
              minHeight: 220,
              display: 'grid',
              placeItems: 'center',
              textAlign: 'center',
              py: 3,
            }}
          >
            <Stack spacing={1.1} alignItems="center">
              <Box
                sx={{
                  width: 62,
                  height: 62,
                  borderRadius: '10px',
                  display: 'grid',
                  placeItems: 'center',
                  bgcolor: '#f7edd0',
                  border: '1px solid rgba(197, 141, 16, 0.18)',
                }}
              >
                <BarChart3 size={28} color={ui.amber} strokeWidth={1.85} />
              </Box>
              <Typography sx={{ fontWeight: 800, color: 'text.primary' }}>ยังไม่มีข้อมูลการใช้อาหาร</Typography>
              <Typography sx={{ color: 'text.secondary', fontSize: '0.88rem', lineHeight: 1.55, maxWidth: 360 }}>
                รอข้อมูลผลลดบน็อตสำหรับโครงสารการใช้อาหารเข้าระบบ
              </Typography>
            </Stack>
          </Box>
        ) : (
          <Stack spacing={1.35} sx={{ flex: 1 }}>
            {visibleRows.map((row) => {
              const tone = feedTone(row.status, ui);
              const actualWidth = `${Math.max(6, (row.actualTon / maxValue) * 100)}%`;
              const targetWidth = `${Math.max(6, (row.targetTon / maxValue) * 100)}%`;

              return (
                <Box key={row.feedCode} sx={{ display: 'grid', gap: 0.72 }}>
                  <Stack direction="row" alignItems="center" justifyContent="space-between" gap={1.5}>
                    <Stack direction="row" alignItems="center" gap={1}>
                      <Box
                        sx={{
                          width: 10,
                          height: 10,
                          borderRadius: '10px',
                          bgcolor: tone.color,
                          boxShadow: `0 0 0 4px ${tone.soft}`,
                          flexShrink: 0,
                        }}
                      />
                      <Typography sx={{ fontWeight: 800, color: 'text.primary', fontSize: '0.92rem' }}>
                        {row.feedCode}
                      </Typography>
                    </Stack>
                    <Chip
                      label={tone.label}
                      size="small"
                      sx={{
                        height: 24,
                        bgcolor: tone.soft,
                        color: tone.color,
                        fontWeight: 800,
                        borderRadius: '10px',
                        border: `1px solid ${alpha(tone.color, 0.16)}`,
                        '& .MuiChip-label': { px: 1 },
                      }}
                    />
                  </Stack>

                  <Box sx={{ display: 'grid', gap: 0.6 }}>
                    <Box
                      sx={{
                        height: 10,
                        borderRadius: '10px',
                        bgcolor: 'rgba(17, 24, 39, 0.06)',
                        overflow: 'hidden',
                        position: 'relative',
                      }}
                    >
                      <Box
                        sx={{
                          position: 'absolute',
                          inset: 0,
                          width: targetWidth,
                          borderRadius: '10px',
                          bgcolor: alpha(ui.green, 0.18),
                        }}
                      />
                      <Box
                        sx={{
                          position: 'absolute',
                          inset: 0,
                          width: actualWidth,
                          borderRadius: '10px',
                          bgcolor: tone.color,
                        }}
                      />
                    </Box>
                    <Stack direction="row" alignItems="center" justifyContent="space-between" gap={1}>
                      <Typography sx={{ color: 'text.secondary', fontSize: '0.8rem' }}>
                        ใช้จริง {formatNumber(row.actualTon, 1)} t
                      </Typography>
                      <Typography sx={{ color: 'text.secondary', fontSize: '0.8rem' }}>
                        เป้าหมาย {formatNumber(row.targetTon, 1)} t
                      </Typography>
                    </Stack>
                  </Box>
                </Box>
              );
            })}
          </Stack>
        )}
      </Box>
    </DashboardCard>
  );
}

function DonutChart({
  value,
  total,
  color,
  size = 180,
  strokeWidth = 18,
}: {
  value: number;
  total: number;
  color: string;
  size?: number;
  strokeWidth?: number;
}) {
  const radius = (size - strokeWidth) / 2;
  const center = size / 2;
  const circumference = 2 * Math.PI * radius;
  const ratio = total > 0 ? value / total : 0;
  const dash = ratio * circumference;
  const gap = circumference - dash;

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true">
      <circle cx={center} cy={center} r={radius} fill="none" stroke="rgba(17, 24, 39, 0.08)" strokeWidth={strokeWidth} />
      <circle
        cx={center}
        cy={center}
        r={radius}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeDasharray={`${dash} ${gap}`}
        strokeLinecap="round"
        style={{ transform: 'rotate(-90deg)', transformOrigin: '50% 50%' }}
      />
    </svg>
  );
}

function FarmStatusPanel({
  rows,
  ui,
}: {
  rows: CommandCenterFarmTableRow[];
  ui: DashboardUI;
}) {
  const counts = rows.reduce(
    (acc, row) => {
      acc[row.statusDot] += 1;
      return acc;
    },
    { normal: 0, warning: 0, critical: 0 } as Record<CommandCenterFarmTableRow['statusDot'], number>,
  );
  const total = Math.max(counts.normal + counts.warning + counts.critical, 1);

  return (
    <DashboardCard sx={{ height: '100%' }}>
      <Box sx={{ p: { xs: 2.25, md: 2.5 }, height: '100%', display: 'grid', gap: 1.8 }}>
        <SectionHeader
          title="สัดส่วนสถานะฟาร์ม"
          subtitle="สรุปฟาร์มที่อยู่ในเกณฑ์ปกติ เฝ้าระวัง และวิกฤต เพื่อจัดลำดับการติดตาม"
        />

        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: '180px minmax(0, 1fr)',
            alignItems: 'center',
            gap: 2,
            '@media (max-width: 600px)': {
              gridTemplateColumns: '1fr',
              justifyItems: 'center',
            },
          }}
        >
          <Box sx={{ position: 'relative', width: 180, height: 180 }}>
            <DonutChart value={counts.normal} total={total} color={ui.green} />
            <Box
              sx={{
                position: 'absolute',
                inset: '50% auto auto 50%',
                transform: 'translate(-50%, -50%)',
                textAlign: 'center',
                lineHeight: 1.05,
              }}
            >
              <Typography sx={{ fontSize: '1.98rem', fontWeight: 900, letterSpacing: '-0.03em' }}>
                {formatNumber(total, 0)}
              </Typography>
              <Typography sx={{ color: 'text.secondary', fontSize: '0.84rem' }}>ฟาร์ม</Typography>
            </Box>
          </Box>

          <Stack spacing={1}>
            {[
              { label: 'ปกติ', value: counts.normal, tone: ui.green },
              { label: 'เฝ้าระวัง', value: counts.warning, tone: ui.amber },
              { label: 'วิกฤต', value: counts.critical, tone: ui.red },
            ].map((item) => (
              <Box
                key={item.label}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 2,
                  borderRadius: '10px',
                  px: 1.5,
                  py: 1.25,
                  border: '1px solid',
                  borderColor: 'divider',
                  bgcolor: alpha(item.tone, 0.05),
                }}
              >
                <Stack direction="row" alignItems="center" gap={1.2}>
                  <Box sx={{ width: 10, height: 10, borderRadius: '10px', bgcolor: item.tone }} />
                  <Typography sx={{ color: 'text.secondary', fontWeight: 800 }}>{item.label}</Typography>
                </Stack>
                <Typography sx={{ color: item.tone, fontWeight: 900, fontSize: '1rem' }}>
                  {formatNumber(item.value, 0)}
                </Typography>
              </Box>
            ))}
          </Stack>
        </Box>

        <Box
          sx={{
            mt: 'auto',
            borderRadius: '10px',
            p: 1.8,
            display: 'flex',
            alignItems: 'center',
            gap: 1.35,
            bgcolor: alpha(ui.green, 0.07),
            border: `1px solid ${alpha(ui.green, 0.14)}`,
          }}
        >
          <ShieldCheck size={22} color={ui.green} />
          <Box>
            <Typography sx={{ color: ui.green, fontWeight: 900 }}>ไม่มีเหตุการณ์เร่งด่วน</Typography>
            <Typography sx={{ color: 'text.secondary', fontSize: '0.88rem', lineHeight: 1.55 }}>
              ระบบทำงานปกติ ไม่พบเหตุการณ์ที่ต้องติดตาม
            </Typography>
          </Box>
        </Box>
      </Box>
    </DashboardCard>
  );
}

function AttentionPanel({
  alerts,
  ui,
}: {
  alerts: CommandCenterAlert[];
  ui: DashboardUI;
}) {
  const visible = alerts.slice(0, 6);

  return (
    <DashboardCard sx={{ height: '100%' }}>
      <Box sx={{ p: { xs: 2.25, md: 2.5 }, height: '100%', display: 'grid', gap: 1.8 }}>
        <SectionHeader
          title="รายการที่ต้องติดตาม"
          subtitle="แสดงเหตุการณ์ที่ควรตรวจสอบก่อน เพื่อจัดลำดับงานประจำวัน"
        />

        {visible.length === 0 ? (
          <Box
            sx={{
              flex: 1,
              minHeight: 250,
              display: 'grid',
              placeItems: 'center',
              textAlign: 'center',
              py: 4,
            }}
          >
            <Stack spacing={1.1} alignItems="center">
              <Box
                sx={{
                  width: 56,
                  height: 56,
                  borderRadius: '10px',
                  display: 'grid',
                  placeItems: 'center',
                  bgcolor: '#f7edd0',
                  border: '1px solid rgba(197, 141, 16, 0.18)',
                }}
              >
                <Bell size={24} color={ui.amber} strokeWidth={1.9} />
              </Box>
              <Typography sx={{ color: ui.red, fontWeight: 900 }}>ไม่มีแจ้งเตือนสำคัญ</Typography>
              <Typography sx={{ color: 'text.secondary', fontSize: '0.88rem', lineHeight: 1.55, maxWidth: 260 }}>
                ระบบทำงานปกติ ไม่พบเหตุการณ์ที่ต้องติดตาม
              </Typography>
            </Stack>
          </Box>
        ) : (
          <Stack spacing={1.1}>
            {visible.map((alert) => {
              const tone = statusTone(alert.severity, ui);
              return (
                <Box
                  key={alert.id}
                  sx={{
                    borderRadius: '10px',
                    px: 1.5,
                    py: 1.25,
                    border: '1px solid',
                    borderColor: 'divider',
                    borderLeft: `4px solid ${tone.color}`,
                    bgcolor: tone.soft,
                  }}
                >
                  <Stack spacing={0.75}>
                    <Stack direction="row" alignItems="start" justifyContent="space-between" gap={1.2}>
                      <Stack direction="row" alignItems="start" gap={1} sx={{ minWidth: 0 }}>
                        <Activity size={18} color={tone.color} />
                        <Box sx={{ minWidth: 0 }}>
                          <Typography sx={{ fontWeight: 900, color: 'text.primary', fontSize: '0.93rem' }}>
                            {alert.title}
                          </Typography>
                          <Typography sx={{ color: 'text.secondary', fontSize: '0.82rem', mt: 0.15 }}>
                            {alert.facilityName}
                            {alert.houseName ? ` • ${alert.houseName}` : ''}
                          </Typography>
                        </Box>
                      </Stack>
                      <Chip
                        size="small"
                        label={tone.label}
                        sx={{
                          bgcolor: 'background.paper',
                          color: tone.color,
                          fontWeight: 800,
                          border: `1px solid ${alpha(tone.color, 0.16)}`,
                          borderRadius: '10px',
                        }}
                      />
                    </Stack>
                    <Typography
                      sx={{
                        color: 'text.secondary',
                        fontSize: '0.86rem',
                        lineHeight: 1.55,
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                      }}
                    >
                      {alert.description}
                    </Typography>
                  </Stack>
                </Box>
              );
            })}
          </Stack>
        )}
      </Box>
    </DashboardCard>
  );
}

function FarmTablePanel({
  rows,
  ui,
}: {
  rows: CommandCenterFarmTableRow[];
  ui: DashboardUI;
}) {
  const [search, setSearch] = useState('');

  const filteredRows = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    if (!keyword) return rows;
    return rows.filter((row) => row.farmName.toLowerCase().includes(keyword));
  }, [rows, search]);

  return (
    <DashboardCard sx={{ height: '100%' }}>
      <Box sx={{ p: { xs: 2.25, md: 2.5 }, height: '100%', display: 'grid', gap: 1.6 }}>
        <Stack
          direction={{ xs: 'column', md: 'row' }}
          alignItems={{ xs: 'stretch', md: 'start' }}
          justifyContent="space-between"
          gap={1.5}
        >
          <SectionHeader
            title="สถานะรายฟาร์ม"
            subtitle="สรุปผลสต็อก การสูญเสีย และความเสี่ยงรายฟาร์ม พร้อมค้นหาได้ทันที"
          />

          <TextField
            size="small"
            placeholder="ค้นหาฟาร์ม"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            aria-label="ค้นหาฟาร์ม"
            sx={{
              minWidth: { xs: '100%', md: 180 },
              maxWidth: { xs: '100%', md: 210 },
              '& .MuiOutlinedInput-root': {
                borderRadius: '10px',
                bgcolor: '#f6f6f4',
                '& fieldset': {
                  borderColor: 'rgba(17, 24, 39, 0.08)',
                },
                '&:hover fieldset': {
                  borderColor: 'rgba(55, 120, 194, 0.22)',
                },
                '&.Mui-focused fieldset': {
                  borderColor: ui.green,
                },
              },
            }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search size={15} color={ui.label} />
                </InputAdornment>
              ),
            }}
          />
        </Stack>

        <TableContainer
          sx={{
            border: `1px solid ${ui.border}`,
            borderRadius: '10px',
            overflowX: 'auto',
            bgcolor: '#fff',
          }}
        >
          <Table
            size="small"
            sx={{
              minWidth: 860,
              '& thead th': {
                bgcolor: '#fafafa',
                color: ui.label,
                fontWeight: 900,
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                fontSize: '0.75rem',
                borderBottom: `1px solid ${ui.border}`,
                py: 1.45,
              },
              '& tbody td': {
                borderBottom: `1px solid rgba(17, 24, 39, 0.06)`,
                py: 1.55,
                fontSize: '0.9rem',
              },
              '& tbody tr:hover td': {
                bgcolor: alpha(ui.green, 0.03),
              },
            }}
          >
            <TableHead>
              <TableRow>
                <TableCell sx={{ width: 38 }}>#</TableCell>
                <TableCell>ฟาร์ม</TableCell>
                <TableCell sx={{ width: 104 }} align="right">
                  สต็อก
                </TableCell>
                <TableCell sx={{ width: 92 }} align="right">
                  ตาย
                </TableCell>
                <TableCell sx={{ width: 102 }} align="right">
                  สูญเสีย
                </TableCell>
                <TableCell sx={{ width: 116 }} align="right">
                  เป้าหมาย
                </TableCell>
                <TableCell sx={{ width: 120 }} align="right">
                  สถานะ
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredRows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 7.5, borderBottom: 'none' }}>
                    <Stack spacing={1.15} alignItems="center">
                      <Box
                        sx={{
                          width: 60,
                          height: 60,
                          borderRadius: '10px',
                          display: 'grid',
                          placeItems: 'center',
                          bgcolor: '#f6f6f4',
                          border: `1px solid ${ui.border}`,
                        }}
                      >
                        <BarChart3 size={24} color={ui.label} strokeWidth={1.6} />
                      </Box>
                      <Typography sx={{ color: 'text.primary', fontWeight: 900 }}>ไม่พบข้อมูลฟาร์ม</Typography>
                      <Typography sx={{ color: 'text.secondary', fontSize: '0.88rem', lineHeight: 1.55, maxWidth: 360 }}>
                        ลองเปลี่ยนคำค้นเพื่อดูฟาร์มอื่นในระบบ
                      </Typography>
                    </Stack>
                  </TableCell>
                </TableRow>
              ) : (
                filteredRows.map((row, index) => {
                  const tone = farmTone(row.statusDot, ui);
                  return (
                    <TableRow key={row.farmId} hover>
                      <TableCell sx={{ color: 'text.secondary', fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>
                        {index + 1}
                      </TableCell>
                      <TableCell sx={{ minWidth: 0 }}>
                        <Typography
                          sx={{
                            fontWeight: 700,
                            color: 'text.primary',
                            fontSize: '0.9rem',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                          }}
                        >
                          {row.farmName}
                        </Typography>
                      </TableCell>
                      <TableCell align="right" sx={{ fontVariantNumeric: 'tabular-nums' }}>
                        {formatNumber(row.stockHead, 0)}
                      </TableCell>
                      <TableCell align="right" sx={{ fontVariantNumeric: 'tabular-nums' }}>
                        {formatNumber(row.deathHead, 0)}
                      </TableCell>
                      <TableCell align="right" sx={{ fontVariantNumeric: 'tabular-nums' }}>
                        {formatNumber(row.deathHead, 0)}
                      </TableCell>
                      <TableCell align="right" sx={{ fontVariantNumeric: 'tabular-nums' }}>
                        100%
                      </TableCell>
                      <TableCell align="right">
                        <Chip
                          size="small"
                          label={tone.label}
                          sx={{
                            bgcolor: alpha(tone.color, 0.1),
                            color: tone.color,
                            fontWeight: 800,
                            borderRadius: '10px',
                            border: `1px solid ${alpha(tone.color, 0.16)}`,
                          }}
                        />
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </TableContainer>

        <Stack direction="row" alignItems="center" justifyContent="flex-end">
          <Typography
            sx={{
              color: ui.red,
              fontWeight: 800,
              fontSize: '0.9rem',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 0.4,
            }}
          >
            ดูรายละเอียดเพิ่มเติม
            <ChevronRight size={16} />
          </Typography>
        </Stack>
      </Box>
    </DashboardCard>
  );
}

function HeroPanel({
  ui,
  data,
  lastUpdatedText,
}: {
  ui: DashboardUI;
  data: CommandCenterResponse;
  lastUpdatedText: string;
}) {
  const farmCounts = useMemo(() => {
    const counts = data.farmTable.reduce(
      (acc, row) => {
        acc[row.statusDot] += 1;
        return acc;
      },
      { normal: 0, warning: 0, critical: 0 } as Record<CommandCenterFarmTableRow['statusDot'], number>,
    );
    const total = Math.max(counts.normal + counts.warning + counts.critical, 1);
    return { ...counts, total };
  }, [data.farmTable]);

  return (
    <DashboardCard
      sx={{
        position: 'relative',
        background: `linear-gradient(180deg, ${alpha(ui.card, 0.98)} 0%, ${alpha(ui.cardSoft, 0.94)} 100%)`,
      }}
    >
      <Box sx={{ p: { xs: 2.25, md: 2.75 }, position: 'relative', zIndex: 1 }}>
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', lg: 'minmax(0, 1.58fr) minmax(300px, 0.82fr)' },
            gap: { xs: 2.4, md: 2.8 },
            alignItems: 'start',
          }}
        >
          <Stack spacing={1.45}>
            <Stack direction="row" alignItems="center" gap={1.2} flexWrap="wrap">
              <Chip
                label={
                  <Stack direction="row" alignItems="center" gap={0.75}>
                    <Box sx={{ width: 8, height: 8, borderRadius: '10px', bgcolor: '#fff' }} />
                    <span>Operations Dashboard</span>
                  </Stack>
                }
                sx={{
                  bgcolor: ui.red,
                  color: '#fff',
                  fontWeight: 800,
                  height: 36,
                  borderRadius: '10px',
                  px: 0.35,
                  '& .MuiChip-label': { px: 1.3 },
                  boxShadow: `0 8px 18px ${alpha(ui.red, 0.14)}`,
                }}
              />
              <Typography sx={{ color: 'text.secondary', fontSize: '0.84rem', fontWeight: 600 }}>
                อัปเดตล่าสุด {lastUpdatedText}
              </Typography>
            </Stack>

            <Box sx={{ borderLeft: `4px solid ${ui.red}`, pl: 1.35 }}>
              <Typography
                sx={{
                  color: 'text.primary',
                  fontSize: { xs: '1.9rem', md: '2.25rem' },
                  fontWeight: 900,
                  letterSpacing: '-0.03em',
                  lineHeight: 1.08,
                }}
              >
                ศูนย์ควบคุมการดำเนินงาน
              </Typography>
              <Typography
                sx={{
                  mt: 0.35,
                  color: 'text.secondary',
                  fontSize: '0.96rem',
                  lineHeight: 1.55,
                  maxWidth: 720,
                }}
              >
                ติดตามสต็อกสุกร สุขภาพฟาร์ม ประสิทธิภาพการใช้อาหาร และรายการที่ต้องเฝ้าระวัง
              </Typography>
            </Box>

            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
              <Chip
                icon={<CheckCircle2 size={16} />}
                label="ภาพรวมอยู่ในเกณฑ์ปกติ"
                sx={{
                  bgcolor: '#edf7f1',
                  color: ui.green,
                  fontWeight: 800,
                  borderRadius: '10px',
                  border: `1px solid ${alpha(ui.green, 0.18)}`,
                  '& .MuiChip-icon': { color: ui.green },
                }}
              />
              <Chip
                label={`ฟาร์มทั้งหมด ${formatNumber(data.farmTable.length, 0)} แห่ง`}
                sx={{
                  bgcolor: '#f3f3f3',
                  color: 'text.primary',
                  fontWeight: 800,
                  borderRadius: '10px',
                  border: `1px solid ${ui.border}`,
                }}
              />
              <Chip
                label={`แจ้งเตือน ${formatNumber(data.alerts.length, 0)} รายการ`}
                sx={{
                  bgcolor: '#f3f3f3',
                  color: 'text.primary',
                  fontWeight: 800,
                  borderRadius: '10px',
                  border: `1px solid ${ui.border}`,
                }}
              />
            </Stack>
          </Stack>

          <Box
            sx={{
              display: 'grid',
              gap: 0.82,
              alignContent: 'start',
              width: 'fit-content',
              maxWidth: 310,
              justifySelf: 'end',
            }}
          >
            <Typography
              sx={{
                color: 'text.primary',
                fontWeight: 900,
                fontSize: '1.05rem',
                textAlign: 'center',
              }}
            >
              แนวโน้มของฟาร์มเดือนนี้
            </Typography>
            <HeroBadge icon={ShieldCheck} label="ปกติ" value={farmCounts.normal} accent={ui.green} />
            <HeroBadge icon={OctagonAlert} label="เฝ้าระวัง" value={farmCounts.warning} accent={ui.amber} />
            <HeroBadge icon={OctagonAlert} label="วิกฤต" value={farmCounts.critical} accent={ui.red} />
          </Box>
        </Box>
      </Box>
    </DashboardCard>
  );
}

export default function OperationsDashboardPage() {
  const theme = useTheme();
  const ui = useMemo(
    () => buildDashboardUI(theme.palette.mode === 'dark' ? 'dark' : 'light'),
    [theme.palette.mode],
  );
  const { data, loading, error } = useDashboardData();

  const lastUpdatedText = useMemo(() => {
    const date = new Date(data.lastUpdatedAt);
    return Number.isNaN(date.getTime())
      ? '-'
      : date.toLocaleString('th-TH', {
          dateStyle: 'long',
          timeStyle: 'short',
        });
  }, [data.lastUpdatedAt]);

  const totalDeaths = useMemo(
    () => data.farmTable.reduce((sum, row) => sum + row.deathHead, 0),
    [data.farmTable],
  );

  const summaryMetrics = useMemo(
    () => [
      {
        title: 'สต็อกสุกรรวม',
        value: formatMaybeNumber(data.summaryCards.totalStockHead, 0),
        unit: 'ตัว',
        note: `จาก ${formatNumber(data.farmTable.length, 0)} ฟาร์ม`,
        footnote: 'อ้างอิงจากข้อมูลล่าสุด',
        icon: Scale,
        accent: '#3579d8',
        soft: '#e9f1ff',
      },
      {
        title: 'อัตราสูญเสีย',
        value: formatMaybeNumber(data.summaryCards.mortalityRatePct, 2),
        unit: '%',
        note: `ตายสะสม ${formatNumber(totalDeaths, 0)} ตัว`,
        footnote: data.summaryCards.mortalityRatePct > 0 ? 'อ้างอิงจากข้อมูลล่าสุด' : 'รอข้อมูลเข้าระบบ',
        icon: Activity,
        accent: ui.red,
        soft: ui.redSoft,
      },
      {
        title: 'FCR เฉลี่ย',
        value: formatMaybeNumber(data.summaryCards.fcrAverage, 2),
        unit: '',
        note: 'Feed Conversion Ratio',
        footnote: 'ค่าเป้าหมายอ้างอิง 2.45',
        icon: TrendingUp,
        accent: '#c58d10',
        soft: ui.amberSoft,
      },
      {
        title: 'ต้นทุนอาหารเดือนนี้',
        value: formatMaybeNumber(data.summaryCards.feedCostMonth / 1_000_000, 1),
        unit: 'M',
        note: `งบรวม ${formatNumber(data.summaryCards.budgetMonth / 1_000_000, 1)}M`,
        footnote: `ใช้จ่ายไป ${formatNumber(data.summaryCards.budgetUsagePct, 0)}%`,
        icon: PiggyBank,
        accent: ui.green,
        soft: ui.greenSoft,
      },
    ],
    [
      data.farmTable.length,
      data.summaryCards.budgetMonth,
      data.summaryCards.budgetUsagePct,
      data.summaryCards.fcrAverage,
      data.summaryCards.feedCostMonth,
      data.summaryCards.mortalityRatePct,
      data.summaryCards.totalStockHead,
      totalDeaths,
      ui.amberSoft,
      ui.green,
      ui.greenSoft,
      ui.red,
      ui.redSoft,
    ],
  );

  if (loading) {
    return <DashboardSkeleton />;
  }

  if (error) {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          px: { xs: 1.5, md: 2.5 },
          py: { xs: 1.5, md: 2.5 },
          maxWidth: 1440,
          mx: 'auto',
          width: '100%',
          bgcolor: ui.page,
        }}
      >
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  if (!data.hasFarmAccess) {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          px: { xs: 1.5, md: 2.5 },
          py: { xs: 1.5, md: 2.5 },
          maxWidth: 1440,
          mx: 'auto',
          width: '100%',
          bgcolor: ui.page,
        }}
      >
        <Alert severity="warning">{data.accessMessage || 'คุณยังไม่มีสิทธิ์เข้าถึงฟาร์ม'}</Alert>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        px: { xs: 1.5, md: 2.5 },
        py: { xs: 1.5, md: 2.5 },
        maxWidth: 1440,
        width: '100%',
        mx: 'auto',
        display: 'grid',
        gap: 2,
        bgcolor: ui.page,
        fontFamily: '"Sarabun", "Bai Jamjuree", sans-serif',
      }}
    >
      <HeroPanel ui={ui} data={data} lastUpdatedText={lastUpdatedText} />

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))', xl: 'repeat(4, minmax(0, 1fr))' },
          gap: 2,
        }}
      >
        {summaryMetrics.map((metric) => (
          <MetricCard
            key={metric.title}
            title={metric.title}
            value={metric.value}
            unit={metric.unit || undefined}
            note={metric.note}
            footnote={metric.footnote}
            icon={metric.icon}
            accent={metric.accent}
            soft={metric.soft}
          />
        ))}
      </Box>

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', lg: '1.45fr 0.95fr' },
          gap: 2,
        }}
      >
        <FeedUsagePanel rows={data.feedUsageByNumber} ui={ui} />
        <FarmStatusPanel rows={data.farmTable} ui={ui} />
      </Box>

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', lg: '0.9fr 1.6fr' },
          gap: 2,
        }}
      >
        <Box id="alerts-panel" sx={{ minWidth: 0 }}>
          <AttentionPanel alerts={data.alerts} ui={ui} />
        </Box>
        <Box id="farm-table" sx={{ minWidth: 0 }}>
          <FarmTablePanel rows={data.farmTable} ui={ui} />
        </Box>
      </Box>
    </Box>
  );
}
