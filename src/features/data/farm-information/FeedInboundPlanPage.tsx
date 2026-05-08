'use client';

import {
  ArrowBack,
  Inventory2Outlined,
  LocalShippingOutlined,
  PetsOutlined,
  QueryStatsOutlined,
  WarningAmberOutlined,
} from '@mui/icons-material';
import {
  Alert,
  Box,
  Button,
  Chip,
  FormControl,
  MenuItem,
  Select,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Paper,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import axiosInstance from '@/lib/axios';
import { masterApi } from '@/features/admin/master/services/master.api';
import { stockService as inventoryStockService } from '@/features/production/stock/services/stock.service';
import type { StockBalanceResponse } from '@/features/production/stock/types';
import {
  FACILITY_CHANGED_EVENT,
  getCurrentFacilityId,
} from '@/lib/facility-context';

type FiProfileOption = {
  id: string;
  name: string;
  referenceCode: string;
};

type FacilityOption = {
  id: number;
  code: string;
  name: string;
};

type FiOptionsResponse = {
  profiles: FiProfileOption[];
  facilities: FacilityOption[];
};

type FiRecordRow = {
  day: number;
  feedCode: string;
  dailyFiKg: number;
};

type FiRecordsResponse = {
  rows: FiRecordRow[];
};

type ProductionHouseRow = {
  id: number;
  facilityNodeId: number;
  houseCode: string;
  houseName: string;
  ageDays?: number | null;
  currentQuantity?: number | null;
};

type ProductionOptionsResponse = {
  houses: ProductionHouseRow[];
};

type MasterItemRow = {
  id: number;
  code: string;
  name: string;
};

type FeedBandRow = {
  feedCode: string;
  itemCodes: string[];
  itemNames: string[];
  currentStockKg: number;
};

type FeedPlanRow = {
  feedCode: string;
  itemCodesText: string;
  itemNamesText: string;
  currentStockKg: number;
  pigHeadCount: number;
  dailyUsageKg: number;
  safetyDays: number;
  cartWeightKg: number;
  demand3DaysKg: number;
  demand7DaysKg: number;
  demand14DaysKg: number;
  safetyStockKg: number;
  stockCoverDays: number;
  suggestedOrderKg: number;
  suggestedCartCount: number;
  status: 'OK' | 'WATCH' | 'CRITICAL';
};

const FEED_SEQUENCE = ['110G', '111G', '112GI', '112G', '113G', '114G', '115G'];
const FORECAST_DAYS = 14;

const FEED_COLOR_MAP: Record<string, string> = {
  '110G': '#f7d3e8',
  '111G': '#e5e7eb',
  '112GI': '#c7efc7',
  '112G': '#d8efbc',
  '113G': '#fdf1ad',
  '114G': '#cfe3fb',
  '115G': '#fff86a',
};

const FEED_CART_WEIGHT_KG: Record<string, number> = {
  '110G': 0,
  '111G': 133,
  '112GI': 129,
  '112G': 129,
  '113G': 129,
  '114G': 139,
  '115G': 143,
};

const FEED_SAFETY_DAYS: Record<string, number> = {
  '110G': 2,
  '111G': 2,
  '112GI': 2,
  '112G': 2,
  '113G': 2,
  '114G': 2,
  '115G': 2,
};

const UI = {
  panel: '#ffffff',
  panelSoft: '#f8faf8',
  panelMuted: '#f2f6f3',
  field: '#fbfcfb',
  border: '#dde2de',
  borderStrong: '#cad4cf',
  text: '#2f3a37',
  muted: '#7d8783',
  accent: 'rgb(22, 90, 80)',
  accentSoft: '#dce8e4',
  accentSurface: '#edf5f1',
  shadow: '0 18px 40px rgba(22, 35, 31, 0.08), 0 3px 10px rgba(22, 35, 31, 0.05)',
  shadowSoft: '0 10px 24px rgba(22, 35, 31, 0.06), 0 2px 6px rgba(22, 35, 31, 0.04)',
};

const panelSx = {
  borderRadius: 10,
  border: `1px solid ${UI.border}`,
  bgcolor: UI.panel,
  boxShadow: UI.shadow,
};

const inputSx = {
  '& .MuiOutlinedInput-root': {
    borderRadius: 10,
    bgcolor: UI.panelSoft,
    boxShadow: UI.shadowSoft,
    '& fieldset': {
      borderColor: UI.border,
    },
    '&:hover fieldset': {
      borderColor: UI.borderStrong,
    },
    '&.Mui-focused fieldset': {
      borderColor: UI.accent,
    },
  },
};

const FEED_ALIASES: Record<string, string[]> = {
  '110G': ['110G'],
  '111G': ['111G'],
  '112GI': ['112GI'],
  '112G': ['112G'],
  '113G': ['113G'],
  '114G': ['114G'],
  '115G': ['115G'],
};

function fmt(n?: number | null, digits = 2): string {
  if (n == null || Number.isNaN(n)) return '-';
  return n.toLocaleString('en-US', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}

function normalizeCode(code?: string | null): string {
  return (code || '').trim().toUpperCase();
}

function extractTail(code: string): string {
  const normalized = normalizeCode(code);
  const chunks = normalized.split('-');
  return chunks[chunks.length - 1] || normalized;
}

function isFeedCodeMatch(bandCode: string, itemCode: string): boolean {
  const tail = extractTail(itemCode);
  const aliases = FEED_ALIASES[bandCode] ?? [bandCode];
  return aliases.some((alias) => {
    if (!tail.startsWith(alias)) return false;
    const suffix = tail.slice(alias.length);
    return suffix === '' || suffix === '0' || suffix === 'L';
  });
}

function resolveStatus(coverDays: number): FeedPlanRow['status'] {
  if (coverDays < 3) return 'CRITICAL';
  if (coverDays < 7) return 'WATCH';
  return 'OK';
}

function renderStatusChip(status: FeedPlanRow['status']) {
  if (status === 'CRITICAL') return <Chip size="small" color="error" label="วิกฤต (< 3 วัน)" />;
  if (status === 'WATCH') return <Chip size="small" color="warning" label="เฝ้าระวัง (< 7 วัน)" />;
  return <Chip size="small" color="success" label="เพียงพอ" />;
}

function choosePriorityRows<T extends { code: string }>(rows: T[]): T[] {
  const semiRows = rows.filter((row) => normalizeCode(row.code).startsWith('SEMI-'));
  const fgRows = rows.filter((row) => normalizeCode(row.code).startsWith('FG-'));
  const fallbackRows = rows.filter((row) => {
    const code = normalizeCode(row.code);
    return !code.startsWith('SEMI-') && !code.startsWith('FG-');
  });
  return semiRows.length > 0 ? semiRows : (fgRows.length > 0 ? fgRows : fallbackRows);
}

function buildBandsFromMasterAndStocks(masterItems: MasterItemRow[], stockRows: StockBalanceResponse[]): FeedBandRow[] {
  const masterByBand = new Map<string, Array<{ code: string; name: string }>>();
  const stockByBand = new Map<string, Array<{ code: string; name: string; quantity: number }>>();
  const stockByCode = new Map<string, number>();

  FEED_SEQUENCE.forEach((feedCode) => {
    masterByBand.set(feedCode, []);
    stockByBand.set(feedCode, []);
  });

  stockRows.forEach((row) => {
    const code = normalizeCode(row.itemCode || '');
    if (!code) return;
    stockByCode.set(code, (stockByCode.get(code) ?? 0) + (Number(row.quantity) || 0));
  });

  masterItems.forEach((item) => {
    const code = normalizeCode(item.code);
    if (!code) return;
    FEED_SEQUENCE.forEach((feedCode) => {
      if (!isFeedCodeMatch(feedCode, code)) return;
      masterByBand.get(feedCode)?.push({ code, name: item.name || '' });
    });
  });

  stockRows.forEach((row) => {
    const code = normalizeCode(row.itemCode || '');
    if (!code) return;
    const quantity = Number(row.quantity) || 0;
    const itemName = (row.itemName || row.pigItemName || '').trim();

    FEED_SEQUENCE.forEach((feedCode) => {
      if (!isFeedCodeMatch(feedCode, code)) return;
      stockByBand.get(feedCode)?.push({ code, name: itemName, quantity });
    });
  });

  return FEED_SEQUENCE.map((feedCode) => {
    const masterCandidates = masterByBand.get(feedCode) ?? [];
    const chosenMasterRows = choosePriorityRows(masterCandidates);
    const chosenRows = chosenMasterRows.length > 0 ? chosenMasterRows : choosePriorityRows(stockByBand.get(feedCode) ?? []);
    const itemCodes = Array.from(new Set(chosenRows.map((row) => row.code)));
    const itemNames = Array.from(new Set(chosenRows.map((row) => row.name).filter(Boolean)));
    const currentStockKg = itemCodes.reduce((sum, code) => sum + (stockByCode.get(code) ?? 0), 0);
    return { feedCode, itemCodes, itemNames, currentStockKg };
  });
}

function buildMasterFiByDay(rows: FiRecordRow[]): Map<number, FiRecordRow> {
  const sorted = [...rows].sort((left, right) => left.day - right.day);
  const byDay = new Map<number, FiRecordRow>();
  sorted.forEach((row) => {
    byDay.set(Math.max(1, Number(row.day) || 1), row);
  });
  return byDay;
}

function resolveFiRowForDay(byDay: Map<number, FiRecordRow>, day: number): FiRecordRow | null {
  if (byDay.size === 0) return null;
  const safeDay = Math.max(1, day);
  if (byDay.has(safeDay)) return byDay.get(safeDay) ?? null;
  for (let d = safeDay; d >= 1; d -= 1) {
    if (byDay.has(d)) return byDay.get(d) ?? null;
  }
  const firstDay = Array.from(byDay.keys()).sort((a, b) => a - b)[0];
  return byDay.get(firstDay) ?? null;
}

export default function FeedInboundPlanPage() {
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [infoMessage, setInfoMessage] = useState('');
  const [activeFacilityId, setActiveFacilityId] = useState<number | null>(null);

  const [facilities, setFacilities] = useState<FacilityOption[]>([]);
  const [profiles, setProfiles] = useState<FiProfileOption[]>([]);
  const [selectedFacilityId, setSelectedFacilityId] = useState<number | ''>('');
  const [selectedProfileId, setSelectedProfileId] = useState<string>('');

  const [masterItems, setMasterItems] = useState<MasterItemRow[]>([]);
  const [stockRows, setStockRows] = useState<StockBalanceResponse[]>([]);
  const [masterFiRows, setMasterFiRows] = useState<FiRecordRow[]>([]);
  const [houses, setHouses] = useState<ProductionHouseRow[]>([]);

  const selectedFacility = useMemo(
    () => facilities.find((row) => row.id === selectedFacilityId) ?? null,
    [facilities, selectedFacilityId],
  );

  const selectedProfile = useMemo(
    () => profiles.find((row) => row.id === selectedProfileId) ?? null,
    [profiles, selectedProfileId],
  );

  const loadFiOptions = useCallback(async () => {
    try {
      const [options, itemData] = await Promise.all([
        masterApi.getFiStandardOptions() as Promise<FiOptionsResponse>,
        masterApi.getItems() as unknown as Promise<MasterItemRow[]>,
      ]);
      setFacilities(options.facilities || []);
      setProfiles(options.profiles || []);
      setMasterItems(itemData || []);
      if (activeFacilityId) {
        setSelectedFacilityId(activeFacilityId);
      }
      if ((options.facilities || []).length > 0) {
        setSelectedFacilityId((prev) => {
          if (typeof prev === 'number' && prev > 0) return prev;
          if (activeFacilityId && options.facilities.some((row) => row.id === activeFacilityId)) {
            return activeFacilityId;
          }
          return options.facilities[0].id;
        });
      }
      if ((options.profiles || []).length > 0) {
        setSelectedProfileId((prev) => (prev || options.profiles[0].id));
      } else {
        setSelectedProfileId('');
        setMasterFiRows([]);
        setHouses([]);
        setInfoMessage('ยังไม่มี Master FI STD ที่ publish แล้ว (profiles = 0) จึงยังคำนวณไม่ได้');
      }
    } catch {
      setErrorMessage('ไม่สามารถโหลดรายการฟาร์ม/โปรไฟล์ Master FI STD ได้');
    }
  }, []);

  const loadInputs = useCallback(async (facility: FacilityOption, profileId: string) => {
    setLoading(true);
    try {
      setErrorMessage('');
      setInfoMessage('');

      const [stockResult, fiResult, productionResult] = await Promise.allSettled([
        inventoryStockService.getStockBalances(undefined, undefined, facility.code, true),
        masterApi.getFiStandardRecords({
          profileId,
          facilityId: facility.id,
          page: 1,
          pageSize: 500,
        }) as Promise<FiRecordsResponse>,
        axiosInstance.get<ProductionOptionsResponse>('/api/ProductionActivities/options', {
          params: { facilityId: facility.id },
        }),
      ]);

      if (stockResult.status === 'fulfilled') {
        setStockRows(
          (stockResult.value.items || []).filter(
            (row) => Number(row.itemId || 0) > 0 || normalizeCode(row.itemCode || '') !== '',
          ),
        );
      } else {
        setStockRows([]);
      }

      if (fiResult.status === 'fulfilled') {
        setMasterFiRows(fiResult.value.rows || []);
      } else {
        setMasterFiRows([]);
      }

      if (productionResult.status === 'fulfilled') {
        setHouses((productionResult.value.data?.houses || []).filter((house) => house.facilityNodeId === facility.id));
      } else {
        setHouses([]);
      }

      const stockEmpty = stockResult.status !== 'fulfilled' || !stockResult.value.items || stockResult.value.items.length === 0;
      const fiEmpty = fiResult.status !== 'fulfilled' || !fiResult.value.rows || fiResult.value.rows.length === 0;
      const houseEmpty = productionResult.status !== 'fulfilled'
        || !(productionResult.value.data?.houses || []).some((house) => house.facilityNodeId === facility.id);

      if (fiEmpty) {
        setInfoMessage('ไม่พบ Master FI STD rows สำหรับโปรไฟล์ที่เลือก');
      } else if (houseEmpty) {
        setInfoMessage('ไม่พบ stock หมูปัจจุบันของโรงเรือนที่เปิดอยู่');
      } else if (stockEmpty) {
        setInfoMessage('ไม่พบ stock feed ในคลัง (ถือเป็น 0) ระบบยังคำนวณแนะนำจาก stock หมู + Master FI STD ให้แล้ว');
      }

      if (fiResult.status !== 'fulfilled' || productionResult.status !== 'fulfilled') {
        setErrorMessage('บางข้อมูลที่ใช้คำนวณโหลดไม่สำเร็จ (Master FI STD หรือ stock หมูปัจจุบัน)');
      }
    } catch {
      setStockRows([]);
      setMasterFiRows([]);
      setHouses([]);
      setErrorMessage('ไม่สามารถโหลดข้อมูลที่ใช้คำนวณ (Master FI STD / stock หมูปัจจุบัน) ได้');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadFiOptions();
  }, [loadFiOptions]);

  useEffect(() => {
    const syncFacility = () => {
      setActiveFacilityId(getCurrentFacilityId());
    };
    syncFacility();
    window.addEventListener(FACILITY_CHANGED_EVENT, syncFacility);
    return () => window.removeEventListener(FACILITY_CHANGED_EVENT, syncFacility);
  }, []);

  useEffect(() => {
    if (!selectedFacility || !selectedProfileId) return;
    void loadInputs(selectedFacility, selectedProfileId);
  }, [selectedFacility, selectedProfileId, loadInputs]);

  const feedBandRows = useMemo(
    () => buildBandsFromMasterAndStocks(masterItems, stockRows),
    [masterItems, stockRows],
  );

  const dailyUsageByFeed = useMemo(() => {
    const fiByDay = buildMasterFiByDay(masterFiRows);
    const usage = new Map<string, number>();
    let headCountTotal = 0;

    houses.forEach((house) => {
      const heads = Math.max(0, Number(house.currentQuantity) || 0);
      if (heads <= 0) return;
      headCountTotal += heads;

      const day = Math.max(1, Number(house.ageDays) || 1);
      const row = resolveFiRowForDay(fiByDay, day);
      if (!row) return;

      const feedCode = normalizeCode(row.feedCode);
      if (!feedCode) return;

      const bandCode = FEED_SEQUENCE.find((candidate) => isFeedCodeMatch(candidate, feedCode));
      if (!bandCode) return;

      const perHeadKg = Math.max(0, Number(row.dailyFiKg) || 0);
      const totalKg = perHeadKg * heads;
      usage.set(bandCode, (usage.get(bandCode) ?? 0) + totalKg);
    });

    return { usage, headCountTotal };
  }, [masterFiRows, houses]);

  const planRows = useMemo<FeedPlanRow[]>(() => feedBandRows.map((row) => {
    const currentStockKg = Math.max(0, row.currentStockKg);
    const dailyUsageKg = Math.max(0, dailyUsageByFeed.usage.get(row.feedCode) ?? 0);
    const safetyDays = FEED_SAFETY_DAYS[row.feedCode] ?? 2;
    const cartWeightKg = FEED_CART_WEIGHT_KG[row.feedCode] ?? 0;

    const demand3DaysKg = dailyUsageKg * 3;
    const demand7DaysKg = dailyUsageKg * 7;
    const demand14DaysKg = dailyUsageKg * 14;
    const safetyStockKg = dailyUsageKg * safetyDays;
    const stockCoverDays = dailyUsageKg > 0 ? currentStockKg / dailyUsageKg : 999;
    const suggestedOrderKg = Math.max(0, dailyUsageKg * FORECAST_DAYS + safetyStockKg - currentStockKg);
    const suggestedCartCount = cartWeightKg > 0 ? Math.ceil(suggestedOrderKg / cartWeightKg) : 0;
    const status = dailyUsageKg <= 0 ? 'OK' : resolveStatus(stockCoverDays);

    return {
      feedCode: row.feedCode,
      itemCodesText: row.itemCodes.length > 0 ? row.itemCodes.join(', ') : '-',
      itemNamesText: row.itemNames.length > 0 ? row.itemNames.join(', ') : '-',
      currentStockKg,
      pigHeadCount: dailyUsageByFeed.headCountTotal,
      dailyUsageKg,
      safetyDays,
      cartWeightKg,
      demand3DaysKg,
      demand7DaysKg,
      demand14DaysKg,
      safetyStockKg,
      stockCoverDays,
      suggestedOrderKg,
      suggestedCartCount,
      status,
    };
  }), [feedBandRows, dailyUsageByFeed]);

  const summary = useMemo(() => {
    const totalStockKg = planRows.reduce((sum, row) => sum + row.currentStockKg, 0);
    const totalDailyUsageKg = planRows.reduce((sum, row) => sum + row.dailyUsageKg, 0);
    const totalSuggestedOrderKg = planRows.reduce((sum, row) => sum + row.suggestedOrderKg, 0);
    const criticalCount = planRows.filter((row) => row.status === 'CRITICAL').length;
    return {
      totalStockKg,
      totalDailyUsageKg,
      totalSuggestedOrderKg,
      criticalCount,
      totalHeadCount: dailyUsageByFeed.headCountTotal,
    };
  }, [planRows, dailyUsageByFeed.headCountTotal]);

  const summaryCards = useMemo(() => [
    {
      key: 'profile',
      value: selectedProfile?.referenceCode || '-',
      title: 'โปรไฟล์ Master FI STD',
      icon: <QueryStatsOutlined sx={{ color: '#4a6982', fontSize: 20 }} />,
      iconBg: '#efe8da',
      bar: '#4a6982',
    },
    {
      key: 'head',
      value: `${fmt(summary.totalHeadCount, 0)} ตัว`,
      title: 'หมูคงเหลือที่ใช้คำนวณ',
      icon: <PetsOutlined sx={{ color: '#d09100', fontSize: 20 }} />,
      iconBg: '#f2ead8',
      bar: '#d09100',
    },
    {
      key: 'stock',
      value: `${fmt(summary.totalStockKg, 2)} กก.`,
      title: 'Stock รวม',
      icon: <Inventory2Outlined sx={{ color: '#2e7d32', fontSize: 20 }} />,
      iconBg: '#dfe9db',
      bar: '#2e7d32',
    },
    {
      key: 'daily',
      value: `${fmt(summary.totalDailyUsageKg, 2)} กก.`,
      title: 'ใช้/วัน (Master FI STD)',
      icon: <QueryStatsOutlined sx={{ color: '#7c5ce5', fontSize: 20 }} />,
      iconBg: '#e4ddf4',
      bar: '#7c5ce5',
    },
    {
      key: 'suggest',
      value: `${fmt(summary.totalSuggestedOrderKg, 2)} กก.`,
      title: `แนะนำเรียกเข้า (${FORECAST_DAYS} วัน)`,
      icon: <LocalShippingOutlined sx={{ color: '#c85f00', fontSize: 20 }} />,
      iconBg: '#f8eadf',
      bar: '#c85f00',
    },
  ], [selectedProfile?.referenceCode, summary.totalDailyUsageKg, summary.totalHeadCount, summary.totalStockKg, summary.totalSuggestedOrderKg]);

  return (
    <Box sx={{ maxWidth: 1600, mx: 'auto', p: { xs: 1.5, md: 2 }, bgcolor: UI.bg }}>
      <Box
        sx={{
          ...panelSx,
          background: `linear-gradient(135deg, ${UI.accentSurface} 0%, ${UI.panel} 58%)`,
          px: { xs: 2, md: 2.6 },
          py: { xs: 2, md: 2.4 },
          display: 'grid',
          gap: 1.4,
          mb: 2,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
          <Chip
            size="small"
            label="Feed Inbound"
            sx={{
              bgcolor: '#fff',
              color: UI.accent,
              fontWeight: 800,
              border: `1px solid ${UI.borderStrong}`,
              height: 28,
            }}
          />
          <Typography sx={{ fontSize: '0.9rem', color: UI.muted }}>
            คำนวณจาก Master FI STD + stock หมูปัจจุบัน
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 1.5, flexWrap: 'wrap' }}>
          <Box>
            <Typography sx={{ fontSize: { xs: '1.9rem', md: '2.35rem' }, fontWeight: 900, lineHeight: 1.02, color: UI.text, letterSpacing: '-0.03em' }}>
              แผนเรียกเข้าอาหาร
            </Typography>
            <Typography sx={{ mt: 0.8, fontSize: '0.96rem', color: UI.muted, maxWidth: 760 }}>
              ดูการประมาณการความต้องการอาหารสุกร และจำนวนรถที่ต้องสั่งเข้ามา
            </Typography>
          </Box>
          <Typography sx={{ fontSize: '0.95rem', color: UI.muted, fontWeight: 700 }}>
            Dashboard / แผนเรียกเข้าอาหาร
          </Typography>
        </Box>
      </Box>

      <Stack spacing={2.5}>
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: {
              xs: 'repeat(2, minmax(0, 1fr))',
              md: 'repeat(3, minmax(0, 1fr))',
              xl: 'repeat(5, minmax(0, 1fr))',
            },
            gap: 1.5,
          }}
        >
          {summaryCards.map((card) => (
            <Box
              key={card.key}
              sx={{
                ...panelSx,
                position: 'relative',
                overflow: 'hidden',
                px: 2,
                py: 1.8,
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  inset: 0,
                  background: `linear-gradient(135deg, ${alpha(card.iconBg, 0.82)} 0%, rgba(255,255,255,0) 55%)`,
                  pointerEvents: 'none',
                },
              }}
            >
              <Box sx={{ position: 'relative', zIndex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                <Box>
                  <Typography variant="h5" sx={{ fontWeight: 700, lineHeight: 1.1, color: '#172422' }}>
                    {card.value}
                  </Typography>
                  <Typography variant="body2" sx={{ color: UI.text, mt: 0.45, fontWeight: 800 }}>
                    {card.title}
                  </Typography>
                </Box>
                <Box
                  sx={{
                    width: 42,
                    height: 42,
                    borderRadius: 10,
                    bgcolor: '#fff',
                    border: `1px solid ${alpha(card.bar, 0.15)}`,
                    boxShadow: UI.shadowSoft,
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  {card.icon}
                </Box>
              </Box>
              <Box sx={{ position: 'relative', zIndex: 1, width: 96, height: 6, borderRadius: 10, bgcolor: alpha(card.bar, 0.2) }}>
                <Box sx={{ width: 54, height: '100%', borderRadius: 10, bgcolor: card.bar }} />
              </Box>
            </Box>
          ))}
        </Box>

        <Box sx={{ ...panelSx, p: { xs: 1.25, md: 1.5 } }}>
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', md: 'minmax(0, 1fr) minmax(0, 1fr) auto' },
              gap: 1.25,
              alignItems: 'end',
            }}
          >
            <FormControl size="small" fullWidth>
              <Typography sx={{ fontSize: '0.83rem', fontWeight: 800, color: UI.text, mb: 0.55, px: 0.3 }}>
                ฟาร์ม
              </Typography>
              <Select
                displayEmpty
                value={selectedFacilityId}
                onChange={(event) => {
                  const value = event.target.value;
                  setSelectedFacilityId(typeof value === 'number' ? value : Number(value));
                }}
                sx={inputSx}
              >
                {facilities.map((facility) => (
                  <MenuItem key={facility.id} value={facility.id}>
                    {facility.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl size="small" fullWidth>
              <Typography sx={{ fontSize: '0.83rem', fontWeight: 800, color: UI.text, mb: 0.55, px: 0.3 }}>
                รูปแบบการเลี้ยง
              </Typography>
              <Select
                displayEmpty
                value={selectedProfileId}
                onChange={(event) => setSelectedProfileId(String(event.target.value || ''))}
                sx={inputSx}
              >
                {profiles.map((profile) => (
                  <MenuItem key={profile.id} value={profile.id}>
                    {profile.name} ({profile.referenceCode})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <Button
              component={Link}
              href="/data/farm-information"
              variant="outlined"
              startIcon={<ArrowBack />}
              sx={{
                height: 42,
                px: 1.75,
                borderColor: '#b8c5bf',
                color: UI.text,
                borderRadius: 10,
                boxShadow: UI.shadowSoft,
                whiteSpace: 'nowrap',
                '&:hover': { borderColor: UI.accent, bgcolor: alpha(UI.accent, 0.06) },
              }}
            >
              กลับหน้า Farm Info
            </Button>
          </Box>
        </Box>

        <Box
          sx={{
            ...panelSx,
            p: 1.5,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 1.5, flexWrap: 'wrap', mb: 1.1 }}>
            <Box>
              <Typography sx={{ fontSize: '1.08rem', fontWeight: 900, color: UI.text, mb: 0.45 }}>
                รายละเอียดแผนเรียกเข้า
              </Typography>
              <Typography sx={{ fontSize: '0.88rem', color: UI.muted }}>
                ปริมาณอาหารแต่ละเบอร์คงเหลือ และคำแนะนำสั่งซื้อ
              </Typography>
            </Box>
          </Box>

          <Alert
            severity="info"
            icon={<WarningAmberOutlined />}
            sx={{
              mb: 1.5,
              borderRadius: 10,
              border: `1px solid ${alpha(UI.accent, 0.14)}`,
              bgcolor: alpha(UI.accent, 0.07),
              color: UI.text,
              boxShadow: UI.shadowSoft,
            }}
          >
            สูตรคำนวณ: ใช้ได้อีก(วัน) = stock คงเหลือ / ใช้ต่อวัน(Master FI STD), และ
            แนะนำเรียกเข้า = max(0, ใช้ต่อวัน x {FORECAST_DAYS} + safety stock - stock คงเหลือ)
          </Alert>

          {infoMessage ? <Alert severity="warning" sx={{ mb: 1.5, borderRadius: 10}}>{infoMessage}</Alert> : null}
          {errorMessage ? <Alert severity="error" sx={{ mb: 1.5, borderRadius: 10}}>{errorMessage}</Alert> : null}

          <TableContainer sx={{ maxHeight: 640, overflow: 'auto', border: `1px solid ${UI.border}`, borderRadius: 10, boxShadow: UI.shadowSoft, bgcolor: UI.panelSoft }}>
            <Table stickyHeader size="small" sx={{ minWidth: 1700 }}>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ minWidth: 90, fontWeight: 900, color: '#fff', position: 'sticky', top: 0, left: 0, zIndex: 7, bgcolor: UI.accent, borderRight: `1px solid ${alpha('#ffffff', 0.24)}` }}>
                    เบอร์อาหาร
                  </TableCell>
                  <TableCell sx={{ minWidth: 220, fontWeight: 900, color: '#fff', position: 'sticky', top: 0, zIndex: 5, bgcolor: UI.accent }}>Item code ที่ map ได้</TableCell>
                  <TableCell sx={{ minWidth: 220, fontWeight: 900, color: '#fff', position: 'sticky', top: 0, zIndex: 5, bgcolor: UI.accent }}>ชื่อรายการ</TableCell>
                  <TableCell align="right" sx={{ minWidth: 140, fontWeight: 900, color: '#fff', position: 'sticky', top: 0, zIndex: 5, bgcolor: UI.accent }}>คงเหลือ (kg)</TableCell>
                  <TableCell align="right" sx={{ minWidth: 160, fontWeight: 900, color: '#fff', position: 'sticky', top: 0, zIndex: 5, bgcolor: UI.accent }}>ใช้/วัน (Master FI)</TableCell>
                  <TableCell align="right" sx={{ minWidth: 120, fontWeight: 900, color: '#fff', position: 'sticky', top: 0, zIndex: 5, bgcolor: UI.accent }}>Safety (วัน)</TableCell>
                  <TableCell align="right" sx={{ minWidth: 120, fontWeight: 900, color: '#fff', position: 'sticky', top: 0, zIndex: 5, bgcolor: UI.accent }}>รถ/คัน (kg)</TableCell>
                  <TableCell align="right" sx={{ minWidth: 120, fontWeight: 900, color: '#fff', position: 'sticky', top: 0, zIndex: 5, bgcolor: UI.accent }}>ใช้ 3 วัน</TableCell>
                  <TableCell align="right" sx={{ minWidth: 120, fontWeight: 900, color: '#fff', position: 'sticky', top: 0, zIndex: 5, bgcolor: UI.accent }}>ใช้ 7 วัน</TableCell>
                  <TableCell align="right" sx={{ minWidth: 120, fontWeight: 900, color: '#fff', position: 'sticky', top: 0, zIndex: 5, bgcolor: UI.accent }}>ใช้ 14 วัน</TableCell>
                  <TableCell align="right" sx={{ minWidth: 120, fontWeight: 900, color: '#fff', position: 'sticky', top: 0, zIndex: 5, bgcolor: UI.accent }}>Safety stock</TableCell>
                  <TableCell align="right" sx={{ minWidth: 130, fontWeight: 900, color: '#fff', position: 'sticky', top: 0, zIndex: 5, bgcolor: UI.accent }}>ใช้ได้อีก (วัน)</TableCell>
                  <TableCell align="right" sx={{ minWidth: 170, fontWeight: 900, color: '#fff', position: 'sticky', top: 0, zIndex: 5, bgcolor: UI.accent }}>แนะนำเรียกเข้า (kg)</TableCell>
                  <TableCell align="right" sx={{ minWidth: 130, fontWeight: 900, color: '#fff', position: 'sticky', top: 0, zIndex: 5, bgcolor: UI.accent }}>แนะนำ (คัน)</TableCell>
                  <TableCell sx={{ minWidth: 140, fontWeight: 900, color: '#fff', position: 'sticky', top: 0, zIndex: 5, bgcolor: UI.accent }}>สถานะ</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={15} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                      กำลังโหลดข้อมูล...
                    </TableCell>
                  </TableRow>
                ) : null}
                {!loading && planRows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={15} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                      ยังไม่พบข้อมูล stock หรือ Master FI STD สำหรับฟาร์มนี้
                    </TableCell>
                  </TableRow>
                ) : null}

                {planRows.map((row) => (
                  <TableRow key={row.feedCode} hover>
                    <TableCell sx={{ bgcolor: FEED_COLOR_MAP[row.feedCode] ?? '#f8fafc', fontWeight: 900, position: 'sticky', left: 0, zIndex: 3, borderRight: '1px solid #94a3b8' }}>
                      {row.feedCode}
                    </TableCell>
                    <TableCell sx={{ bgcolor: FEED_COLOR_MAP[row.feedCode] ?? '#fff' }}>{row.itemCodesText}</TableCell>
                    <TableCell sx={{ bgcolor: FEED_COLOR_MAP[row.feedCode] ?? '#fff' }}>{row.itemNamesText}</TableCell>
                    <TableCell align="right" sx={{ bgcolor: FEED_COLOR_MAP[row.feedCode] ?? '#fff', fontWeight: 700 }}>{fmt(row.currentStockKg, 2)}</TableCell>
                    <TableCell align="right" sx={{ bgcolor: FEED_COLOR_MAP[row.feedCode] ?? '#fff', fontWeight: 700 }}>{fmt(row.dailyUsageKg, 2)}</TableCell>
                    <TableCell align="right" sx={{ bgcolor: FEED_COLOR_MAP[row.feedCode] ?? '#fff' }}>{fmt(row.safetyDays, 0)}</TableCell>
                    <TableCell align="right" sx={{ bgcolor: FEED_COLOR_MAP[row.feedCode] ?? '#fff' }}>{fmt(row.cartWeightKg, 2)}</TableCell>
                    <TableCell align="right" sx={{ bgcolor: FEED_COLOR_MAP[row.feedCode] ?? '#fff' }}>{fmt(row.demand3DaysKg, 2)}</TableCell>
                    <TableCell align="right" sx={{ bgcolor: FEED_COLOR_MAP[row.feedCode] ?? '#fff' }}>{fmt(row.demand7DaysKg, 2)}</TableCell>
                    <TableCell align="right" sx={{ bgcolor: FEED_COLOR_MAP[row.feedCode] ?? '#fff' }}>{fmt(row.demand14DaysKg, 2)}</TableCell>
                    <TableCell align="right" sx={{ bgcolor: FEED_COLOR_MAP[row.feedCode] ?? '#fff' }}>{fmt(row.safetyStockKg, 2)}</TableCell>
                    <TableCell align="right" sx={{ bgcolor: FEED_COLOR_MAP[row.feedCode] ?? '#fff', fontWeight: 700 }}>
                      {row.dailyUsageKg <= 0 ? '-' : fmt(row.stockCoverDays, 2)}
                    </TableCell>
                    <TableCell align="right" sx={{ bgcolor: FEED_COLOR_MAP[row.feedCode] ?? '#fff', fontWeight: 800 }}>{fmt(row.suggestedOrderKg, 2)}</TableCell>
                    <TableCell align="right" sx={{ bgcolor: FEED_COLOR_MAP[row.feedCode] ?? '#fff' }}>{fmt(row.suggestedCartCount, 0)}</TableCell>
                    <TableCell sx={{ bgcolor: FEED_COLOR_MAP[row.feedCode] ?? '#fff' }}>{renderStatusChip(row.status)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      </Stack>
    </Box>
  );
}
