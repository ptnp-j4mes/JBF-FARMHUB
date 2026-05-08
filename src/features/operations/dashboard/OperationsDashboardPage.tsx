'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Chip,
  Divider,
  Grid,
  LinearProgress,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
  keyframes,
  useTheme,
} from '@mui/material';
import {
  Activity,
  AlertTriangle,
  BarChart3,
  ChevronRight,
  CircleDollarSign,
  Scale,
  Skull,
  TrendingDown,
  TrendingUp,
} from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { dashboardService } from './services/dashboard.service';
import type { CommandCenterFeedUsageRow, CommandCenterResponse } from './types';
import { getThemeTokens } from '@/core/theme/tokens';

/* ═══════════════════════════════════════════════════════════════════
   ANIMATION KEYFRAMES
   ═══════════════════════════════════════════════════════════════════ */
const fadeInUp = keyframes`
  from {
    opacity: 0;
    transform: translateY(18px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

const fadeIn = keyframes`
  from { opacity: 0; }
  to { opacity: 1; }
`;

/* ═══════════════════════════════════════════════════════════════════
   DESIGN TOKENS (theme-aware, solid panel pattern)
   ═══════════════════════════════════════════════════════════════════ */
function buildDashboardUI(isDark: boolean) {
  const tokens = getThemeTokens(isDark ? 'dark' : 'light');

  return {
    // Panel backgrounds — solid, matching feeding/stock pattern
    panel: tokens.background.surface,
    panelSoft: tokens.background.surfaceMuted,
    panelMuted: isDark ? '#1E2D25' : '#edf3ef',
    panelElevated: tokens.background.surfaceStrong,

    // Borders — green-tinted, matching feeding/stock
    border: tokens.border,
    borderStrong: isDark ? '#2E4A3C' : '#c6d2cb',
    borderLight: isDark ? '#1E3028' : '#e8efeb',
    borderAccent: tokens.primary.soft,

    // Text colors — from theme tokens
    text: tokens.text.primary,
    muted: tokens.text.secondary,
    softText: tokens.text.secondary,
    label: tokens.text.muted,

    // Semantic colors — from theme tokens
    deepGreen: tokens.primary.dark,
    deepGreenSoft: tokens.primary.soft,
    deepGreenMuted: tokens.primary.soft,
    amber: tokens.warning.main,
    amberSoft: tokens.warning.soft,
    amberMuted: tokens.warning.soft,
    red: tokens.danger.main,
    redSoft: tokens.danger.soft,
    redMuted: tokens.danger.soft,
    blue: tokens.info.main,
    blueSoft: tokens.info.soft,

    // Shadows — solid panel shadows
    shadow: tokens.shadow.card,
    shadowSoft: isDark
      ? '0 10px 24px rgba(0, 0, 0, 0.18)'
      : '0 10px 24px rgba(18, 38, 33, 0.06), 0 2px 6px rgba(18, 38, 33, 0.04)',
    shadowStrong: tokens.shadow.raised,
    shadowHover: tokens.shadow.raised,

    // Background
    bg: tokens.background.page,
  };
}

type DashboardUI = ReturnType<typeof buildDashboardUI>;

/* ═══════════════════════════════════════════════════════════════════
   EMPTY DATA
   ═══════════════════════════════════════════════════════════════════ */
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

/* ═══════════════════════════════════════════════════════════════════
   UTILITIES
   ═══════════════════════════════════════════════════════════════════ */
function formatNumber(value: number, digits = 0): string {
  return value.toLocaleString('en-US', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}

function statusColor(status: string, ui: DashboardUI): string {
  if (status === 'critical') return ui.red;
  if (status === 'warning') return ui.amber;
  return ui.deepGreen;
}

function statusSoftColor(status: string, ui: DashboardUI): string {
  if (status === 'critical') return ui.redSoft;
  if (status === 'warning') return ui.amberSoft;
  return ui.deepGreenSoft;
}

function barColor(status: CommandCenterFeedUsageRow['status'], ui: DashboardUI): string {
  if (status === 'over') return ui.amber;
  if (status === 'under') return ui.blue;
  return ui.deepGreen;
}

/* ═══════════════════════════════════════════════════════════════════
   PANEL STYLES — solid panel pattern matching feeding/stock pages
   ═══════════════════════════════════════════════════════════════════ */
function panelSx(ui: DashboardUI, accent?: string) {
  return {
    bgcolor: ui.panel,
    borderRadius: 3.5,
    border: `1px solid ${accent || ui.border}`,
    boxShadow: ui.shadow,
    overflow: 'hidden',
  } as const;
}

function metricPanelSx(ui: DashboardUI, accent: string, soft: string) {
  return {
    bgcolor: ui.panel,
    borderRadius: 3,
    border: `1px solid ${ui.border}`,
    boxShadow: ui.shadow,
    overflow: 'hidden',
    position: 'relative',
    '&::before': {
      content: '""',
      position: 'absolute',
      inset: 0,
      background: `linear-gradient(145deg, ${soft} 0%, rgba(255,255,255,0) 45%)`,
      pointerEvents: 'none',
    },
  } as const;
}

/* ═══════════════════════════════════════════════════════════════════
   ANIMATED SECTION WRAPPER
   ═══════════════════════════════════════════════════════════════════ */
function AnimatedSection({
  children,
  delay = 0,
}: {
  children: React.ReactNode;
  delay?: number;
}) {
  const theme = useTheme();
  const prefersReducedMotion = theme.breakpoints.down('sm');

  return (
    <Box
      sx={{
        animation: `${fadeInUp} 0.5s cubic-bezier(0.22, 1, 0.36, 1) ${delay}ms both`,
        [prefersReducedMotion]: { animation: 'none' },
      }}
    >
      {children}
    </Box>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   LOADING SKELETON
   ═══════════════════════════════════════════════════════════════════ */
function DashboardSkeleton() {
  return (
    <Box
      sx={{
        p: { xs: 1.5, md: 2.5 },
        minHeight: '100vh',
        display: 'grid',
        gap: 2.25,
        maxWidth: '1440px',
        mx: 'auto',
        width: '100%',
      }}
    >
      {/* Hero skeleton */}
      <Skeleton
        variant="rounded"
        sx={{ height: 220, borderRadius: 3.5 }}
        animation="wave"
      />

      {/* KPI cards skeleton */}
      <Grid container spacing={2}>
        {[0, 1, 2, 3].map((i) => (
          <Grid key={i} size={{ xs: 12, sm: 6, md: 6, xl: 3 }}>
            <Skeleton
              variant="rounded"
              sx={{ height: 200, borderRadius: 3.5 }}
              animation="wave"
            />
          </Grid>
        ))}
      </Grid>

      {/* Charts skeleton */}
      <Grid container spacing={2}>
        <Grid size={{ xs: 12, md: 8 }}>
          <Skeleton
            variant="rounded"
            sx={{ height: 400, borderRadius: 3.5 }}
            animation="wave"
          />
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <Skeleton
            variant="rounded"
            sx={{ height: 400, borderRadius: 3.5 }}
            animation="wave"
          />
        </Grid>
      </Grid>

      {/* Alerts + Table skeleton */}
      <Grid container spacing={2}>
        <Grid size={{ xs: 12, md: 4 }}>
          <Skeleton
            variant="rounded"
            sx={{ height: 480, borderRadius: 3.5 }}
            animation="wave"
          />
        </Grid>
        <Grid size={{ xs: 12, md: 8 }}>
          <Skeleton
            variant="rounded"
            sx={{ height: 480, borderRadius: 3.5 }}
            animation="wave"
          />
        </Grid>
      </Grid>
    </Box>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   CUSTOM TOOLTIP FOR CHARTS
   ═══════════════════════════════════════════════════════════════════ */
function CustomTooltip({
  active,
  payload,
  label,
  ui,
}: {
  active?: boolean;
  payload?: Array<{ value: number; name: string; color: string }>;
  label?: string;
  ui: DashboardUI;
}) {
  if (!active || !payload) return null;

  return (
    <Box
      sx={{
        bgcolor: ui.panel,
        border: `1px solid ${ui.border}`,
        borderRadius: 1.5,
        boxShadow: ui.shadowStrong,
        p: 1.8,
        minWidth: 180,
        animation: `${fadeIn} 0.2s ease`,
      }}
    >
      <Typography
        sx={{
          fontWeight: 900,
          fontSize: '0.88rem',
          color: ui.text,
          mb: 1,
          letterSpacing: '-0.01em',
        }}
      >
        {label}
      </Typography>
      {payload.map((entry) => (
        <Box
          key={entry.name}
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 2,
            py: 0.3,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
            <Box
              sx={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                bgcolor: entry.color,
              }}
            />
            <Typography sx={{ color: ui.muted, fontSize: '0.82rem', fontWeight: 600 }}>
              {entry.name === 'actualTon' ? 'ใช้จริง' : 'เป้าหมาย'}
            </Typography>
          </Box>
          <Typography sx={{ color: ui.text, fontWeight: 800, fontSize: '0.88rem' }}>
            {formatNumber(Number(entry.value), 1)} t
          </Typography>
        </Box>
      ))}
    </Box>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   MAIN DASHBOARD
   ═══════════════════════════════════════════════════════════════════ */
export default function OperationsDashboardPage() {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const UI = useMemo(() => buildDashboardUI(isDark), [isDark]);
  const prefersReducedMotion =
    typeof window !== 'undefined' &&
    window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [data, setData] = useState<CommandCenterResponse>(EMPTY_DASHBOARD);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const response = await dashboardService.getCommandCenter();
        setData(response);
      } catch {
        setError(
          'ไม่สามารถโหลดข้อมูล dashboard ได้ชั่วคราว กรุณาลองใหม่อีกครั้ง',
        );
      } finally {
        setLoading(false);
      }
    };

    void load();
    // Trigger entrance animation after mount
    const timer = setTimeout(() => setMounted(true), 50);
    return () => clearTimeout(timer);
  }, []);

  /* ─── Computed Values ─── */
  const lastUpdatedText = useMemo(() => {
    const date = new Date(data.lastUpdatedAt);
    return Number.isNaN(date.getTime())
      ? '-'
      : date.toLocaleString('th-TH', { dateStyle: 'long', timeStyle: 'short' });
  }, [data.lastUpdatedAt]);

  const farmStatusCounts = useMemo(() => {
    const normal = data.farmTable.filter((row) => row.statusDot === 'normal').length;
    const warning = data.farmTable.filter((row) => row.statusDot === 'warning').length;
    const critical = data.farmTable.filter((row) => row.statusDot === 'critical').length;
    const total = Math.max(normal + warning + critical, 1);
    return { normal, warning, critical, total };
  }, [data.farmTable]);

  const usageRows = useMemo(() => [...data.feedUsageByNumber].slice(0, 10), [data.feedUsageByNumber]);

  const usageChartRows = useMemo(
    () =>
      usageRows.map((row) => ({
        feedCode: row.feedCode,
        actualTon: Number(row.actualTon || 0),
        targetTon: Number(row.targetTon || 0),
        color: barColor(row.status, UI),
      })),
    [usageRows, UI],
  );

  const farmPieRows = useMemo(
    () => [
      { name: 'ปกติ', value: farmStatusCounts.normal, color: UI.deepGreen },
      { name: 'เฝ้าระวัง', value: farmStatusCounts.warning, color: UI.amber },
      { name: 'วิกฤต', value: farmStatusCounts.critical, color: UI.red },
    ],
    [farmStatusCounts.critical, farmStatusCounts.normal, farmStatusCounts.warning, UI],
  );

  const filteredFarmRows = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    if (!keyword) return data.farmTable;
    return data.farmTable.filter((row) => row.farmName.toLowerCase().includes(keyword));
  }, [data.farmTable, search]);

  const totalDeathHead = useMemo(() => {
    return data.farmTable.reduce((sum, row) => sum + row.deathHead, 0);
  }, [data.farmTable]);

  const stockRetentionPct = useMemo(() => {
    if (data.summaryCards.totalStockHead <= 0) return 0;
    const base = data.summaryCards.totalStockHead + totalDeathHead;
    if (base <= 0) return 0;
    return Math.max(0, Math.min(100, (data.summaryCards.totalStockHead / base) * 100));
  }, [data.summaryCards.totalStockHead, totalDeathHead]);

  const healthTone = useMemo(() => {
    if (farmStatusCounts.critical > 0)
      return { label: 'ต้องติดตามใกล้ชิด', color: UI.red, soft: UI.redSoft, border: UI.redMuted };
    if (farmStatusCounts.warning > 0)
      return { label: 'มีบางฟาร์มต้องเฝ้าระวัง', color: UI.amber, soft: UI.amberSoft, border: UI.amberMuted };
    return { label: 'ภาพรวมอยู่ในเกณฑ์ปกติ', color: UI.deepGreen, soft: UI.deepGreenSoft, border: UI.deepGreenMuted };
  }, [farmStatusCounts.critical, farmStatusCounts.warning, UI]);

  const summaryMetrics = useMemo(
    () => [
      {
        key: 'stock',
        title: 'สต๊อกสุกรรวม',
        value: formatNumber(data.summaryCards.totalStockHead, 0),
        unit: 'ตัว',
        note: `จาก ${formatNumber(data.farmTable.length, 0)} ฟาร์ม`,
        detail: `อัตราคงเหลือ ${formatNumber(stockRetentionPct, 1)}%`,
        tone: 'positive' as const,
        accent: UI.deepGreen,
        soft: UI.deepGreenSoft,
        icon: Scale,
      },
      {
        key: 'mortality',
        title: 'อัตราสูญเสีย',
        value: formatNumber(data.summaryCards.mortalityRatePct, 2),
        unit: '%',
        note: `ตายสะสม ${formatNumber(totalDeathHead, 0)} ตัว`,
        detail: 'เป้าหมายควรต่ำกว่า 3%',
        tone: data.summaryCards.mortalityRatePct > 3 ? ('danger' as const) : ('positive' as const),
        accent: data.summaryCards.mortalityRatePct > 3 ? UI.red : UI.deepGreen,
        soft: data.summaryCards.mortalityRatePct > 3 ? UI.redSoft : UI.deepGreenSoft,
        icon: Skull,
      },
      {
        key: 'fcr',
        title: 'FCR เฉลี่ย',
        value: formatNumber(data.summaryCards.fcrAverage, 2),
        unit: '',
        note: 'Feed Conversion Ratio',
        detail: 'ค่าเป้าหมายอ้างอิง 2.45',
        tone: data.summaryCards.fcrAverage <= 2.45 ? ('positive' as const) : ('warning' as const),
        accent: data.summaryCards.fcrAverage <= 2.45 ? UI.deepGreen : UI.amber,
        soft: data.summaryCards.fcrAverage <= 2.45 ? UI.deepGreenSoft : UI.amberSoft,
        icon: Activity,
      },
      {
        key: 'cost',
        title: 'ต้นทุนอาหารเดือนนี้',
        value: formatNumber(data.summaryCards.feedCostMonth / 1_000_000, 1),
        unit: 'M',
        note: `งบรวม ${formatNumber(data.summaryCards.budgetMonth / 1_000_000, 1)}M`,
        detail: `ใช้งบไป ${formatNumber(data.summaryCards.budgetUsagePct, 0)}%`,
        tone: data.summaryCards.budgetUsagePct > 85 ? ('warning' as const) : ('positive' as const),
        accent: data.summaryCards.budgetUsagePct > 85 ? UI.amber : UI.deepGreen,
        soft: data.summaryCards.budgetUsagePct > 85 ? UI.amberSoft : UI.deepGreenSoft,
        icon: CircleDollarSign,
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
      stockRetentionPct,
      totalDeathHead,
      UI,
    ],
  );

  /* ─── Loading State ─── */
  if (loading) {
    return <DashboardSkeleton />;
  }

  if (error) {
    return (
      <Box sx={{ p: 2 }}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  if (!data.hasFarmAccess) {
    return (
      <Box sx={{ p: 2 }}>
        <Alert severity="warning">{data.accessMessage || 'คุณยังไม่มีสิทธิ์เข้าถึงฟาร์ม'}</Alert>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        p: { xs: 1.5, md: 2.5 },
        minHeight: '100vh',
        display: 'grid',
        gap: 2.25,
        maxWidth: '1440px',
        mx: 'auto',
        width: '100%',
      }}
    >
      {/* ═══════════════════════════════════════════════════════════
          HERO / OVERVIEW BLOCK
          ═══════════════════════════════════════════════════════════ */}
      <AnimatedSection delay={0}>
        <Box
          sx={{
            borderRadius: 3.5,
            border: `1px solid ${UI.border}`,
            bgcolor: UI.panel,
            boxShadow: UI.shadow,
            p: { xs: 2.5, md: 3.5 },
            position: 'relative',
            overflow: 'hidden',
            borderLeft: `4px solid ${healthTone.color}`,
            '&::before': {
              content: '""',
              position: 'absolute',
              inset: 0,
              background: `linear-gradient(140deg, ${healthTone.soft} 0%, transparent 55%)`,
              pointerEvents: 'none',
            },
          }}
        >
          <Grid container spacing={3} alignItems="stretch">
            <Grid size={{ xs: 12, md: 7 }} sx={{ minWidth: 0 }}>
              <Box sx={{ display: 'grid', gap: 1.6, height: '100%', position: 'relative', zIndex: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                  <Chip
                    size="small"
                    label="Operations Dashboard"
                    sx={{
                      bgcolor: UI.panelSoft,
                      color: UI.deepGreen,
                      border: `1px solid ${UI.deepGreenSoft}`,
                      fontWeight: 800,
                      height: 28,
                      letterSpacing: '0.02em',
                    }}
                  />
                  <Typography sx={{ color: UI.label, fontSize: '0.86rem', fontWeight: 600 }}>
                    อัปเดตล่าสุด {lastUpdatedText}
                  </Typography>
                </Box>

                <Box>
                  <Typography
                    sx={{
                      color: UI.text,
                      fontWeight: 900,
                      fontSize: { xs: '1.6rem', sm: '1.9rem', md: '2.2rem', lg: '2.5rem' },
                      lineHeight: 1.05,
                      letterSpacing: '-0.03em',
                      maxWidth: '100%',
                    }}
                  >
                    ศูนย์ควบคุมการดำเนินงาน
                  </Typography>
                  <Typography
                    sx={{
                      mt: 1.2,
                      color: UI.muted,
                      fontSize: '0.98rem',
                      maxWidth: { xs: '100%', md: 700 },
                      lineHeight: 1.6,
                    }}
                  >
                    ติดตามสต๊อกสุกร สุขภาพฟาร์ม ประสิทธิภาพการใช้อาหาร
                    และรายการที่ต้องเฝ้าระวัง
                  </Typography>
                </Box>

                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', pt: 0.5 }}>
                  <Chip
                    label={healthTone.label}
                    sx={{
                      bgcolor: healthTone.color,
                      color: '#fff',
                      fontWeight: 800,
                      borderRadius: 999,
                      px: 0.5,
                      boxShadow: `0 4px 12px ${healthTone.color}33`,
                    }}
                  />
                  <Chip
                    label={`ฟาร์มทั้งหมด ${formatNumber(data.farmTable.length, 0)} แห่ง`}
                    sx={{
                      bgcolor: UI.panelSoft,
                      color: UI.text,
                      border: `1px solid ${UI.border}`,
                      fontWeight: 600,
                    }}
                  />
                  <Chip
                    label={`แจ้งเตือน ${formatNumber(data.alerts.length, 0)} รายการ`}
                    sx={{
                      bgcolor: UI.panelSoft,
                      color: data.alerts.length > 0 ? UI.amber : UI.text,
                      border: `1px solid ${data.alerts.length > 0 ? UI.amberSoft : UI.border}`,
                      fontWeight: 600,
                    }}
                  />
                </Box>
              </Box>
            </Grid>

            <Grid size={{ xs: 12, md: 5 }} sx={{ minWidth: 0 }}>
              <Box sx={{ height: '100%', display: 'grid', alignContent: 'center', gap: 2, position: 'relative', zIndex: 1 }}>
                {/* Budget trend row */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 1 }}>
                  <Box>
                    <Typography sx={{ color: UI.text, fontWeight: 800, fontSize: '1.04rem' }}>
                      แนวโน้มงบอาหารเดือนนี้
                    </Typography>
                    <Typography sx={{ color: UI.muted, fontSize: '0.86rem', mt: 0.15 }}>
                      {data.farmTable.length === 0
                        ? 'ยังไม่มีข้อมูลการใช้งบ'
                        : <>เทียบกับเดือนก่อน {data.summaryCards.momDeltaPct >= 0 ? '+' : ''}
                          {formatNumber(data.summaryCards.momDeltaPct, 2)}%</>}
                    </Typography>
                  </Box>
                  <Chip
                    label={
                      data.summaryCards.budgetUsagePct === 0
                        ? '—'
                        : `${formatNumber(data.summaryCards.budgetUsagePct, 0)}%`
                    }
                    sx={{
                      bgcolor: data.summaryCards.budgetUsagePct > 85 ? UI.amberSoft : UI.deepGreenSoft,
                      color: data.summaryCards.budgetUsagePct > 85 ? UI.amber : UI.deepGreen,
                      fontWeight: 900,
                      border: `1px solid ${data.summaryCards.budgetUsagePct > 85 ? UI.amberSoft : UI.deepGreenSoft}`,
                    }}
                  />
                </Box>

                {/* Farm status mini cards */}
                <Grid container spacing={1.2}>
                  {[
                    { label: 'ปกติ', value: farmStatusCounts.normal, color: UI.deepGreen, soft: UI.deepGreenSoft },
                    { label: 'เฝ้าระวัง', value: farmStatusCounts.warning, color: UI.amber, soft: UI.amberSoft },
                    { label: 'วิกฤต', value: farmStatusCounts.critical, color: UI.red, soft: UI.redSoft },
                  ].map((item) => (
                    <Grid key={item.label} size={{ xs: 4 }}>
                      <Box
                        sx={{
                          borderRadius: 2,
                          bgcolor: item.soft,
                          border: `1px solid ${UI.border}`,
                          borderLeft: `3px solid ${item.color}`,
                          p: 1.35,
                          minHeight: { xs: 70, sm: 80 },
                          display: 'grid',
                          alignContent: 'space-between',
                        }}
                      >
                        <Typography
                          sx={{ color: item.color, fontWeight: 800, fontSize: '0.84rem', letterSpacing: '0.01em' }}
                        >
                          {item.label}
                        </Typography>
                        <Typography
                          sx={{
                            color: item.value === 0 ? UI.label : UI.text,
                            fontWeight: 900,
                            fontSize: '1.7rem',
                            lineHeight: 1,
                            ...(item.value === 0 ? { fontStyle: 'italic' } : {}),
                          }}
                        >
                          {item.value === 0 ? '—' : formatNumber(item.value, 0)}
                        </Typography>
                        <Typography sx={{ color: UI.label, fontSize: '0.78rem' }}>ฟาร์ม</Typography>
                      </Box>
                    </Grid>
                  ))}
                </Grid>
              </Box>
            </Grid>
          </Grid>
        </Box>
      </AnimatedSection>

      {/* ═══════════════════════════════════════════════════════════
          KPI METRIC CARDS
          ═══════════════════════════════════════════════════════════ */}
      <Grid container spacing={2}>
        {summaryMetrics.map((metric, index) => {
          const Icon = metric.icon;
          const isNegative = metric.tone === 'danger';
          const showTrendDown =
            metric.key === 'stock' || metric.key === 'fcr' || metric.key === 'mortality';
          const isZero =
            metric.key === 'stock'
              ? data.summaryCards.totalStockHead === 0
              : metric.key === 'mortality'
                ? data.summaryCards.mortalityRatePct === 0
                : metric.key === 'fcr'
                  ? data.summaryCards.fcrAverage === 0
                  : data.summaryCards.feedCostMonth === 0;

          return (
            <Grid key={metric.key} size={{ xs: 12, sm: 6, md: 6, xl: 3 }} sx={{ minWidth: 0 }}>
              <AnimatedSection delay={120 + index * 60}>
                <Box
                  sx={{
                    ...metricPanelSx(UI, metric.accent, metric.soft),
                    p: 2.35,
                    height: '100%',
                    ...(isZero ? { opacity: 0.75, '&:hover': { opacity: 1 } } : {}),
                  }}
                >
                  <Box sx={{ position: 'relative', zIndex: 1, display: 'grid', gap: 1.35 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 1 }}>
                      <Box
                        sx={{
                          width: { xs: 40, sm: 46 },
                          height: { xs: 40, sm: 46 },
                          borderRadius: 1.5,
                          bgcolor: UI.panelSoft,
                          border: `1px solid ${metric.accent}30`,
                          display: 'grid',
                          placeItems: 'center',
                          boxShadow: `0 2px 8px ${metric.accent}12`,
                        }}
                      >
                        <Icon size={20} color={metric.accent} />
                      </Box>
                      <Chip
                        size="small"
                        label={
                          metric.tone === 'danger' ? 'ติดตาม' : metric.tone === 'warning' ? 'เฝ้าระวัง' : 'ปกติ'
                        }
                        sx={{
                          bgcolor: `${metric.accent}14`,
                          color: metric.accent,
                          fontWeight: 800,
                          borderRadius: 999,
                          border: `1px solid ${metric.accent}22`,
                        }}
                      />
                    </Box>

                    <Box>
                      <Typography
                        sx={{
                          color: UI.muted,
                          fontWeight: 700,
                          fontSize: '0.86rem',
                          mb: 0.5,
                          letterSpacing: '0.01em',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {metric.title}
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 0.5, flexWrap: 'wrap', minWidth: 0 }}>
                        <Typography
                          sx={{
                            color: isZero ? UI.label : UI.text,
                            fontWeight: 900,
                            fontSize: { xs: '1.6rem', sm: '2rem', md: '2.2rem', xl: '2.4rem' },
                            lineHeight: 1,
                            letterSpacing: '-0.02em',
                            ...(isZero ? { fontStyle: 'italic' } : {}),
                          }}
                        >
                          {isZero
                            ? '—'
                            : metric.key === 'cost'
                              ? `${metric.value} ฿`
                              : metric.value}
                        </Typography>
                        {metric.unit ? (
                          <Typography sx={{ color: UI.muted, fontWeight: 700, fontSize: '1rem' }}>
                            {metric.unit}
                          </Typography>
                        ) : null}
                      </Box>
                    </Box>

                    <Box>
                      <Typography sx={{ color: UI.muted, fontSize: '0.86rem', lineHeight: 1.5, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {metric.note}
                      </Typography>
                      <Typography sx={{ color: UI.text, fontSize: '0.9rem', fontWeight: 700, mt: 0.4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {metric.detail}
                      </Typography>
                    </Box>

                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, pt: 0.3 }}>
                      {isZero ? (
                        <Activity size={15} color={UI.label} strokeWidth={1.5} />
                      ) : showTrendDown ? (
                        <TrendingDown size={15} color={isNegative ? UI.red : metric.accent} />
                      ) : (
                        <TrendingUp size={15} color={metric.accent} />
                      )}
                      <Typography
                        sx={{
                          color: isZero ? UI.muted : metric.accent,
                          fontWeight: 800,
                          fontSize: '0.86rem',
                        }}
                      >
                        {isZero
                          ? 'รอข้อมูลเข้าระบบ'
                          : metric.key === 'cost'
                            ? `${data.summaryCards.momDeltaPct >= 0 ? '+' : ''}${formatNumber(data.summaryCards.momDeltaPct, 2)}%`
                            : metric.key === 'mortality'
                              ? 'ต่ำกว่า 3% คือเกณฑ์ดี'
                              : metric.key === 'fcr'
                                ? 'ยิ่งต่ำยิ่งดี'
                                : 'อ้างอิงจากข้อมูลล่าสุด'}
                      </Typography>
                    </Box>
                  </Box>
                </Box>
              </AnimatedSection>
            </Grid>
          );
        })}
      </Grid>

      {/* ═══════════════════════════════════════════════════════════
          CHARTS ROW: FEED USAGE + FARM PIE
          ═══════════════════════════════════════════════════════════ */}
      <Grid container spacing={2}>
        <Grid size={{ xs: 12, md: 8 }} sx={{ minWidth: 0 }}>
          <AnimatedSection delay={420}>
            <Box
              sx={{
                ...panelSx(UI),
                p: 2.5,
                height: '100%',
                borderLeft: `3px solid ${UI.deepGreen}`,
              }}
            >
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  gap: 1.5,
                  mb: 2,
                  flexWrap: 'wrap',
                }}
              >
                <Box>
                  <Typography
                    sx={{ fontSize: '1.3rem', fontWeight: 900, color: UI.text, letterSpacing: '-0.01em' }}
                  >
                    การใช้อาหารตามรหัส
                  </Typography>
                  <Typography sx={{ color: UI.muted, fontSize: '0.88rem', mt: 0.3, lineHeight: 1.5 }}>
                    เทียบเป้าหมายกับการใช้จริงใน 10 รายการล่าสุด
                    เพื่อดูจุดที่ใช้เกินหรือต่ำกว่าแผน
                  </Typography>
                </Box>
                <Chip
                  icon={<BarChart3 size={14} />}
                  label={`${formatNumber(usageRows.length, 0)} รายการ`}
                  sx={{
                    bgcolor: UI.panelSoft,
                    color: UI.deepGreen,
                    fontWeight: 800,
                    border: `1px solid ${UI.border}`,
                  }}
                />
              </Box>

              <Box sx={{ height: { xs: 240, sm: 280, md: 320 }, position: 'relative' }}>
                {usageChartRows.length === 0 ||
                usageChartRows.every((r) => r.actualTon === 0 && r.targetTon === 0) ? (
                  <Box
                    sx={{
                      height: '100%',
                      display: 'grid',
                      placeItems: 'center',
                      gap: 1.5,
                    }}
                  >
                    <Box
                      sx={{
                        width: 72,
                        height: 72,
                        borderRadius: '50%',
                        bgcolor: UI.panelSoft,
                        border: `1px solid ${UI.border}`,
                        display: 'grid',
                        placeItems: 'center',
                      }}
                    >
                      <BarChart3 size={28} color={UI.label} strokeWidth={1.5} />
                    </Box>
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography sx={{ color: UI.text, fontWeight: 800, fontSize: '1.05rem' }}>
                        ยังไม่มีข้อมูลการใช้อาหาร
                      </Typography>
                      <Typography sx={{ color: UI.muted, fontSize: '0.88rem', mt: 0.4, lineHeight: 1.5 }}>
                        ข้อมูลจะแสดงเมื่อมีการบันทึกการใช้อาหารในระบบ
                      </Typography>
                    </Box>
                  </Box>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={usageChartRows}
                      margin={{ top: 8, right: 12, left: 0, bottom: 2 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={UI.border} />
                      <XAxis dataKey="feedCode" tick={{ fill: UI.muted, fontSize: 12 }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fill: UI.muted, fontSize: 12 }} axisLine={false} tickLine={false} width={38} />
                      <RechartsTooltip
                        cursor={{ fill: 'rgba(22, 90, 80, 0.04)' }}
                        content={<CustomTooltip ui={UI} />}
                      />
                      <Bar dataKey="targetTon" fill={UI.deepGreenSoft} radius={[8, 8, 0, 0]} />
                      <Bar dataKey="actualTon" radius={[8, 8, 0, 0]}>
                        {usageChartRows.map((entry) => (
                          <Cell key={`actual-${entry.feedCode}`} fill={entry.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </Box>
            </Box>
          </AnimatedSection>
        </Grid>

        <Grid size={{ xs: 12, md: 4 }} sx={{ minWidth: 0 }}>
          <AnimatedSection delay={480}>
            <Box
              sx={{
                ...panelSx(UI),
                p: 2.5,
                height: '100%',
                borderLeft: `3px solid ${UI.deepGreenSoft}`,
              }}
            >
              <Typography
                sx={{ fontSize: '1.3rem', fontWeight: 900, color: UI.text, letterSpacing: '-0.01em' }}
              >
                สัดส่วนสถานะฟาร์ม
              </Typography>
              <Typography sx={{ color: UI.muted, fontSize: '0.88rem', mb: 1.6, mt: 0.3, lineHeight: 1.5 }}>
                สรุปฟาร์มที่อยู่ในเกณฑ์ปกติ เฝ้าระวัง และวิกฤต เพื่อจัดลำดับการติดตาม
              </Typography>

              <Box sx={{ display: 'grid', placeItems: 'center', py: 0.5 }}>
                {farmStatusCounts.normal === 0 &&
                farmStatusCounts.warning === 0 &&
                farmStatusCounts.critical === 0 ? (
                  <Box
                    sx={{
                      width: { xs: 180, sm: 200, md: 220 },
                      height: { xs: 180, sm: 200, md: 220 },
                      display: 'grid',
                      placeItems: 'center',
                      borderRadius: '50%',
                      border: `2px dashed ${UI.border}`,
                      bgcolor: UI.panelSoft,
                    }}
                  >
                    <Box sx={{ textAlign: 'center' }}>
                      <Activity size={28} color={UI.label} strokeWidth={1.5} />
                      <Typography sx={{ color: UI.text, fontWeight: 800, fontSize: '0.95rem', mt: 1 }}>
                        ยังไม่มีฟาร์ม
                      </Typography>
                      <Typography sx={{ color: UI.muted, fontSize: '0.82rem', mt: 0.3 }}>
                        สถานะจะแสดงเมื่อมีฟาร์มในระบบ
                      </Typography>
                    </Box>
                  </Box>
                ) : (
                  <Box
                    sx={{
                      width: { xs: 180, sm: 200, md: 220 },
                      height: { xs: 180, sm: 200, md: 220 },
                      position: 'relative',
                    }}
                  >
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={farmPieRows}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          innerRadius={58}
                          outerRadius={100}
                          paddingAngle={2}
                          stroke="none"
                        >
                          {farmPieRows.map((entry) => (
                            <Cell key={`farm-pie-${entry.name}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <RechartsTooltip formatter={(value: number) => `${formatNumber(Number(value), 0)} ฟาร์ม`} />
                      </PieChart>
                    </ResponsiveContainer>
                    <Box
                      sx={{
                        position: 'absolute',
                        inset: 0,
                        display: 'grid',
                        placeItems: 'center',
                        pointerEvents: 'none',
                      }}
                    >
                      <Box
                        sx={{
                          width: { xs: 100, sm: 112, md: 124 },
                          height: { xs: 100, sm: 112, md: 124 },
                          borderRadius: '50%',
                          bgcolor: UI.panel,
                          border: `1px solid ${UI.border}`,
                          display: 'grid',
                          placeItems: 'center',
                        }}
                      >
                        <Typography sx={{ color: UI.label, fontSize: '0.82rem' }}>รวมทั้งหมด</Typography>
                        <Typography sx={{ color: UI.text, fontWeight: 900, fontSize: '1.8rem', lineHeight: 1 }}>
                          {formatNumber(farmStatusCounts.total, 0)}
                        </Typography>
                        <Typography sx={{ color: UI.muted, fontSize: '0.78rem' }}>ฟาร์ม</Typography>
                      </Box>
                    </Box>
                  </Box>
                )}
              </Box>

              <Box sx={{ display: 'grid', gap: 0.8, mt: 1 }}>
                {farmPieRows.map((item) => (
                  <Box
                    key={item.name}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      borderRadius: 1.5,
                      bgcolor: UI.panelSoft,
                      border: `1px solid ${UI.border}`,
                      borderLeft: `3px solid ${item.color}`,
                      px: 1.3,
                      py: 1.05,
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: item.color }} />
                      <Typography sx={{ color: UI.text, fontWeight: 700, fontSize: '0.9rem' }}>{item.name}</Typography>
                    </Box>
                    <Typography sx={{ color: UI.text, fontWeight: 900, fontSize: '0.95rem' }}>
                      {formatNumber(item.value, 0)}
                    </Typography>
                  </Box>
                ))}
              </Box>
            </Box>
          </AnimatedSection>
        </Grid>
      </Grid>

      {/* ═══════════════════════════════════════════════════════════
          ALERTS + FARM TABLE ROW
          ═══════════════════════════════════════════════════════════ */}
      <Box sx={{ display: 'flex', gap: 2, flexWrap: { xs: 'wrap', md: 'nowrap' } }}>
        {/* Alerts */}
        <Box sx={{ flex: { xs: '1 1 100%', md: '0 0 380px' }, minWidth: 0 }}>
          <AnimatedSection delay={540}>
            <Box
              sx={{
                ...panelSx(UI),
                p: 2.5,
                height: '100%',
                borderLeft: `3px solid ${UI.amber}`,
              }}
            >
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  gap: 1,
                  mb: 1.6,
                }}
              >
                <Box>
                  <Typography
                    sx={{ fontSize: '1.3rem', fontWeight: 900, color: UI.text, letterSpacing: '-0.01em' }}
                  >
                    รายการที่ต้องติดตาม
                  </Typography>
                  <Typography sx={{ color: UI.muted, fontSize: '0.88rem', mt: 0.3, lineHeight: 1.5 }}>
                    แสดงเหตุการณ์ที่ควรตรวจสอบก่อน เพื่อช่วยตัดสินใจประจำวันได้เร็วขึ้น
                  </Typography>
                </Box>
                <Box
                  sx={{
                    width: 42,
                    height: 42,
                    borderRadius: 1.5,
                    bgcolor: UI.amberSoft,
                    border: `1px solid ${UI.amberSoft}`,
                    display: 'grid',
                    placeItems: 'center',
                  }}
                >
                  <AlertTriangle size={18} color={UI.amber} />
                </Box>
              </Box>

              {data.alerts.length === 0 ? (
                <Box
                  sx={{
                    borderRadius: 1.5,
                    bgcolor: UI.deepGreenSoft,
                    border: `1px solid ${UI.deepGreenSoft}`,
                    p: 2.5,
                    display: 'grid',
                    placeItems: 'center',
                    gap: 1,
                    textAlign: 'center',
                  }}
                >
                  <Box
                    sx={{
                      width: 48,
                      height: 48,
                      borderRadius: '50%',
                      bgcolor: UI.panel,
                      border: `1px solid ${UI.deepGreenSoft}`,
                      display: 'grid',
                      placeItems: 'center',
                    }}
                  >
                    <Activity size={22} color={UI.deepGreen} strokeWidth={1.8} />
                  </Box>
                  <Typography sx={{ color: UI.deepGreen, fontWeight: 800, fontSize: '0.95rem' }}>
                    ไม่มีแจ้งเตือนสำคัญ
                  </Typography>
                  <Typography sx={{ color: UI.muted, fontSize: '0.84rem', lineHeight: 1.5 }}>
                    ระบบทำงานปกติ ไม่พบเหตุการณ์ที่ต้องติดตาม
                  </Typography>
                </Box>
              ) : (
                <Box sx={{ display: 'grid', gap: 1 }}>
                  {data.alerts.slice(0, 6).map((alert) => (
                    <Box
                      key={alert.id}
                      sx={{
                        borderRadius: 1.5,
                        border: `1px solid ${UI.border}`,
                        borderLeft: `3px solid ${statusColor(alert.severity, UI)}`,
                        bgcolor: statusSoftColor(alert.severity, UI),
                        px: 1.35,
                        py: 1.2,
                      }}
                    >
                      <Box
                        sx={{
                          display: 'flex',
                          alignItems: 'flex-start',
                          justifyContent: 'space-between',
                          gap: 1,
                          mb: 0.4,
                        }}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 0.8, minWidth: 0 }}>
                          {alert.severity === 'critical' && (
                            <Box
                              sx={{
                                width: 8,
                                height: 8,
                                borderRadius: '50%',
                                bgcolor: UI.red,
                                mt: 0.5,
                                flexShrink: 0,
                              }}
                            />
                          )}
                          <Typography
                            sx={{
                              fontWeight: 900,
                              color: UI.text,
                              fontSize: '0.92rem',
                              lineHeight: 1.35,
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                              minWidth: 0,
                            }}
                          >
                            {alert.title}
                          </Typography>
                        </Box>
                        <Chip
                          size="small"
                          label={alert.severity}
                          sx={{
                            bgcolor: UI.panel,
                            color: statusColor(alert.severity, UI),
                            fontWeight: 800,
                            border: `1px solid ${statusColor(alert.severity, UI)}30`,
                            fontSize: '0.75rem',
                            flexShrink: 0,
                          }}
                        />
                      </Box>
                      <Typography sx={{ color: UI.muted, fontSize: '0.84rem', lineHeight: 1.55, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                        {alert.description}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              )}
            </Box>
          </AnimatedSection>
        </Box>

        {/* Farm Table */}
        <Box sx={{ flex: { xs: '1 1 100%', md: '1 1 0%' }, minWidth: 0 }}>
          <AnimatedSection delay={600}>
            <Box sx={{ ...panelSx(UI), p: 0, borderLeft: `3px solid ${UI.deepGreen}` }}>
              <Box
                sx={{
                  px: 2.5,
                  pt: 2.5,
                  pb: 1.5,
                  display: 'flex',
                  alignItems: 'flex-start',
                  justifyContent: 'space-between',
                  gap: 1.2,
                  flexWrap: 'wrap',
                }}
              >
                <Box>
                  <Typography
                    sx={{ fontSize: '1.3rem', fontWeight: 900, color: UI.text, letterSpacing: '-0.01em' }}
                  >
                    สถานะรายฟาร์ม
                  </Typography>
                  <Typography sx={{ color: UI.muted, fontSize: '0.88rem', mt: 0.3, lineHeight: 1.5 }}>
                    สแกนสต๊อก การสูญเสีย และความเสี่ยงรายฟาร์มจากตารางเดียว พร้อมค้นหาได้ทันที
                  </Typography>
                </Box>
                <TextField
                  size="small"
                  placeholder="ค้นหาฟาร์ม"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  sx={{
                    minWidth: { xs: '100%', sm: 200, md: 240 },
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 999,
                      bgcolor: UI.panelSoft,
                      fontSize: '0.88rem',
                      transition: 'all 200ms ease',
                      '&:hover': {
                        bgcolor: UI.panelMuted,
                      },
                      '&.Mui-focused': {
                        bgcolor: UI.panel,
                        boxShadow: `0 0 0 2px ${UI.deepGreen}25`,
                      },
                    },
                  }}
                />
              </Box>

              <TableContainer sx={{ px: 1.2, pb: 1.2, overflowX: 'auto' }}>
                <Table size="small" sx={{ tableLayout: 'fixed', minWidth: { xs: 640, md: 760 } }}>
                  <TableHead>
                    <TableRow>
                      {[
                        { label: 'ฟาร์ม', width: '28%', align: 'left' as const },
                        { label: 'สต็อก', width: '14%', align: 'right' as const },
                        { label: 'ตาย', width: '12%', align: 'right' as const },
                        { label: 'สูญเสีย', width: '16%', align: 'right' as const },
                        { label: 'เป้าหมาย', width: '18%', align: 'right' as const },
                        { label: 'สถานะ', width: '12%', align: 'right' as const },
                      ].map((col) => (
                        <TableCell
                          key={col.label}
                          align={col.align}
                          sx={{
                            width: col.width,
                            color: UI.muted,
                            fontWeight: 900,
                            bgcolor: UI.panelSoft,
                            borderBottom: `2px solid ${UI.deepGreenSoft}`,
                            fontSize: '0.8rem',
                            letterSpacing: '0.02em',
                          }}
                        >
                          {col.label}
                        </TableCell>
                      ))}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredFarmRows.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} align="center" sx={{ py: 6, borderBottom: 'none' }}>
                          <Box sx={{ display: 'grid', placeItems: 'center', gap: 1.2 }}>
                            <Box
                              sx={{
                                width: 56,
                                height: 56,
                                borderRadius: '50%',
                                bgcolor: UI.panelSoft,
                                border: `1px solid ${UI.border}`,
                                display: 'grid',
                                placeItems: 'center',
                                mx: 'auto',
                              }}
                            >
                              <BarChart3 size={24} color={UI.label} strokeWidth={1.5} />
                            </Box>
                            <Typography sx={{ color: UI.text, fontWeight: 800, fontSize: '0.98rem' }}>
                              ไม่พบข้อมูลฟาร์ม
                            </Typography>
                            <Typography
                              sx={{ color: UI.muted, fontSize: '0.84rem', lineHeight: 1.5, maxWidth: 320 }}
                            >
                              ข้อมูลฟาร์มจะแสดงที่นี่เมื่อมีการเพิ่มฟาร์มในระบบ
                            </Typography>
                          </Box>
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredFarmRows.map((row) => {
                        const goal = Math.max(0, Math.min(100, 100 - row.mortalityRatePct * 10));
                        const rowAccent =
                          row.statusDot === 'critical'
                            ? UI.red
                            : row.statusDot === 'warning'
                              ? UI.amber
                              : UI.deepGreen;
                        const statusLabel =
                          row.statusDot === 'critical'
                            ? 'วิกฤต'
                            : row.statusDot === 'warning'
                              ? 'เฝ้าระวัง'
                              : 'ปกติ';
                        return (
                          <TableRow
                            key={row.farmId}
                            hover
                            sx={{
                              '& td': { borderColor: UI.border },
                              '&:hover': { bgcolor: UI.panelSoft },
                              transition: 'background-color 180ms ease',
                            }}
                          >
                            <TableCell>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 0 }}>
                                <Box
                                  sx={{
                                    width: 8,
                                    height: 8,
                                    borderRadius: '50%',
                                    bgcolor: rowAccent,
                                    boxShadow: `0 0 0 2px ${rowAccent}22`,
                                    flexShrink: 0,
                                  }}
                                />
                                <Typography
                                  sx={{ fontWeight: 800, color: UI.text, fontSize: '0.88rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', minWidth: 0 }}
                                >
                                  {row.farmName}
                                </Typography>
                              </Box>
                            </TableCell>
                            <TableCell
                              align="right"
                              sx={{ whiteSpace: 'nowrap', color: UI.text, fontWeight: 700, fontSize: '0.88rem' }}
                            >
                              {formatNumber(row.stockHead, 0)}
                            </TableCell>
                            <TableCell
                              align="right"
                              sx={{ whiteSpace: 'nowrap', color: UI.red, fontWeight: 700, fontSize: '0.88rem' }}
                            >
                              {formatNumber(row.deathHead, 0)}
                            </TableCell>
                            <TableCell
                              align="right"
                              sx={{ whiteSpace: 'nowrap', color: UI.text, fontSize: '0.88rem' }}
                            >
                              {formatNumber(row.mortalityRatePct, 2)}%
                            </TableCell>
                            <TableCell align="right">
                              <Box
                                sx={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: 1,
                                  minWidth: { xs: 120, sm: 150 },
                                  justifyContent: 'flex-end',
                                }}
                              >
                                <LinearProgress
                                  variant="determinate"
                                  value={goal}
                                  sx={{
                                    width: 96,
                                    height: 7,
                                    borderRadius: 999,
                                    bgcolor: UI.panelSoft,
                                    '& .MuiLinearProgress-bar': {
                                      bgcolor: rowAccent,
                                      borderRadius: 999,
                                      transition: 'width 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
                                    },
                                  }}
                                />
                                <Typography
                                  sx={{
                                    minWidth: 34,
                                    textAlign: 'right',
                                    fontWeight: 800,
                                    color: UI.text,
                                    fontSize: '0.86rem',
                                  }}
                                >
                                  {formatNumber(goal, 0)}%
                                </Typography>
                              </Box>
                            </TableCell>
                            <TableCell align="right">
                              <Chip
                                size="small"
                                label={statusLabel}
                                sx={{
                                  bgcolor: `${rowAccent}14`,
                                  color: rowAccent,
                                  fontWeight: 800,
                                  minWidth: 78,
                                  border: `1px solid ${rowAccent}22`,
                                  fontSize: '0.78rem',
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

              <Box
                sx={{
                  px: 2.2,
                  pb: 1.8,
                  pt: 0.4,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: 1,
                  flexWrap: 'wrap',
                }}
              >
                <Typography sx={{ color: UI.muted, fontSize: '0.85rem' }}>
                  แสดง {formatNumber(filteredFarmRows.length, 0)} จาก{' '}
                  {formatNumber(data.farmTable.length, 0)} ฟาร์ม
                </Typography>
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 0.6,
                    color: UI.deepGreen,
                    transition: 'gap 200ms ease',
                    '&:hover': { gap: 1 },
                  }}
                >
                  <Typography sx={{ fontWeight: 800, fontSize: '0.88rem' }}>ดูรายละเอียดเพิ่มเติม</Typography>
                  <ChevronRight size={16} />
                </Box>
              </Box>
            </Box>
          </AnimatedSection>
        </Box>
      </Box>
    </Box>
  );
}
