'use client';

import { PublishOutlined, SaveOutlined, TaskAltOutlined } from '@mui/icons-material';
import {
  alpha,
  Alert,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  TextField,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import { useEffect, useMemo, useState } from 'react';
import DataTable, { type Column } from '@/components/common/DataTable';
import { masterApi } from '@/features/admin/master/services/master.api';

interface ProfileOption {
  id: string;
  name: string;
  referenceCode: string;
}

interface OptionResponse {
  profiles: ProfileOption[];
}

interface ItemOption {
  id: number;
  code: string;
  name: string;
}

interface FiZoneInput {
  itemId: number;
  startDay: number;
  endDay: number;
  targetKgPerHead: number;
}

interface FiDailyOverrideInput {
  day: number;
  itemId: number;
  dailyFiKg: number;
}

interface FiDailyRow {
  day: number;
  itemId: number;
  dailyFiKg: number;
  cumulativeFiKg: number;
}

interface FiPreviewResponse {
  gender: 'ALL' | 'MALE' | 'FEMALE';
  targetFeedTotalKg: number;
  generatedFeedTotalKg: number;
  varianceKg: number;
  variancePercent: number;
  isWithinTolerance: boolean;
  isValid: boolean;
  errors: string[];
  rows: FiDailyRow[];
}

interface FiDraftListItem {
  draftId: string;
  profileId?: string | null;
  draftName?: string;
  profileName: string;
  status: string;
  updatedAt: string;
}

interface FiDraftSaveResponse {
  draftId: string;
  status: string;
  preview: FiPreviewResponse;
}

interface FiProfileDraftRow {
  id: string;
  sequence: number;
  draftName: string;
  profileName: string;
  draftId: string;
  draftStatus: string;
  updatedAt: string;
}

interface ProgramBandTemplate {
  code: string;
  label: string;
  baseDays: number;
  color: string;
}

interface RankedItemOption extends ItemOption {
  score: number;
}

const BAND_CODE_ALIASES: Record<string, string[]> = {
  '112GI': ['112GI', '112G'],
};

const PROGRAM_BANDS: ProgramBandTemplate[] = [
  { code: '110G', label: '110G', baseDays: 7, color: '#F3C8CB' },
  { code: '111G', label: '111G', baseDays: 20, color: '#D9D9DC' },
  { code: '112GI', label: '112GI', baseDays: 14, color: '#95D95D' },
  { code: '112G', label: '112G', baseDays: 10, color: '#BEDAAE' },
  { code: '113G', label: '113G', baseDays: 45, color: '#F7E595' },
  { code: '114G', label: '114G', baseDays: 25, color: '#BCD2E8' },
  { code: '115G', label: '115G', baseDays: 29, color: '#F8F70A' },
];

function buildBaseDailyFiCurveGrams150(): number[] {
  const curve: number[] = [0, 216];
  for (let day = 2; day <= 150; day += 1) {
    let increment = 0;
    if (day >= 2 && day <= 6) increment = 30;
    else if (day >= 7 && day <= 15) increment = 29;
    else if (day === 16) increment = 27;
    else if (day === 17) increment = 25;
    else if (day >= 18 && day <= 25) increment = 28;
    else if (day >= 26 && day <= 37) increment = 27;
    else if (day >= 38 && day <= 45) increment = 26;
    else if (day >= 46 && day <= 52) increment = 24;
    else if (day >= 53 && day <= 55) increment = 23;
    else if (day >= 56 && day <= 63) increment = 22;
    else if (day >= 64 && day <= 70) increment = 20;
    else if (day >= 71 && day <= 81) increment = 18;
    else if (day >= 82 && day <= 91) increment = 17;
    else if (day >= 92 && day <= 122) increment = 15;
    else increment = 0;
    curve[day] = curve[day - 1] + increment;
  }
  return curve;
}

const BASE_DAILY_CURVE_G_150 = buildBaseDailyFiCurveGrams150();

function buildDailyRowsFromOverrides(overrides: FiDailyOverrideInput[]): FiDailyRow[] {
  const ordered = [...overrides].sort((a, b) => a.day - b.day || a.itemId - b.itemId);
  let cumulative = 0;
  return ordered.map((row) => {
    cumulative += row.dailyFiKg;
    return {
      day: row.day,
      itemId: row.itemId,
      dailyFiKg: Math.round(row.dailyFiKg * 1000) / 1000,
      cumulativeFiKg: Math.round(cumulative * 1000) / 1000,
    };
  });
}

function extractCodeTail(code: string): string {
  const upper = code.trim().toUpperCase();
  const parts = upper.split('-');
  return parts[parts.length - 1] || upper;
}

function isBandTailMatch(bandCode: string, itemCode: string): boolean {
  const band = bandCode.trim().toUpperCase();
  const tail = extractCodeTail(itemCode);
  if (!tail.startsWith(band)) {
    return false;
  }

  const suffix = tail.slice(band.length);
  return suffix === '' || suffix === '0' || suffix === 'L';
}

function scoreBandItemMatch(bandCode: string, item: ItemOption): number {
  const code = item.code.trim().toUpperCase();
  const tail = extractCodeTail(code);
  const band = bandCode.trim().toUpperCase();
  const candidates = BAND_CODE_ALIASES[band] ?? [band];
  const matchedBand = candidates.find((candidate) => isBandTailMatch(candidate, code));
  if (!matchedBand) {
    return -1;
  }

  let score = 0;
  if (code.startsWith('SEMI-')) score += 1200;
  else if (code.startsWith('FG-')) score += 1000;
  else score += 100;
  if (tail === `${matchedBand}0`) score += 40;
  if (tail === matchedBand) score += 35;
  if (tail === `${matchedBand}L`) score += 30;
  if (matchedBand === band) score += 10;
  score += Math.max(0, 20 - code.length);
  return score;
}

function resolveBandItemId(bandCode: string, items: ItemOption[]): number {
  const ranked = items
    .map((item) => ({ ...item, score: scoreBandItemMatch(bandCode, item) }))
    .filter((item): item is RankedItemOption => item.score >= 0)
    .sort((a, b) => b.score - a.score || a.code.localeCompare(b.code));
  return ranked[0]?.id ?? 0;
}

function allocateBandDays(totalDays: number): number[] {
  if (totalDays <= 0) return PROGRAM_BANDS.map(() => 0);
  if (totalDays === 150) return PROGRAM_BANDS.map((band) => band.baseDays);

  const ratio = totalDays / 150;
  const raw = PROGRAM_BANDS.map((band) => band.baseDays * ratio);
  const floors = raw.map((value) => Math.max(1, Math.floor(value)));
  let assigned = floors.reduce((sum, value) => sum + value, 0);
  const fractions = raw.map((value, index) => ({ index, fraction: value - Math.floor(value) }));

  if (assigned < totalDays) {
    fractions.sort((a, b) => b.fraction - a.fraction);
    let cursor = 0;
    while (assigned < totalDays) {
      floors[fractions[cursor % fractions.length].index] += 1;
      assigned += 1;
      cursor += 1;
    }
  } else if (assigned > totalDays) {
    fractions.sort((a, b) => a.fraction - b.fraction);
    let cursor = 0;
    while (assigned > totalDays) {
      const targetIndex = fractions[cursor % fractions.length].index;
      if (floors[targetIndex] > 1) {
        floors[targetIndex] -= 1;
        assigned -= 1;
      }
      cursor += 1;
    }
  }

  return floors;
}

function resampleCurveGrams(totalDays: number): number[] {
  if (totalDays <= 0) return [];
  if (totalDays === 150) return BASE_DAILY_CURVE_G_150.slice(1);
  if (totalDays === 1) return [BASE_DAILY_CURVE_G_150[1]];

  const output: number[] = [];
  for (let day = 1; day <= totalDays; day += 1) {
    const position = 1 + ((day - 1) * (150 - 1)) / (totalDays - 1);
    const lower = Math.floor(position);
    const upper = Math.min(150, Math.ceil(position));
    const ratio = position - lower;
    const value = BASE_DAILY_CURVE_G_150[lower] + (BASE_DAILY_CURVE_G_150[upper] - BASE_DAILY_CURVE_G_150[lower]) * ratio;
    output.push(value);
  }
  return output;
}

function toErrorMessage(error: unknown, fallback: string): string {
  if (error && typeof error === 'object') {
    const maybe = error as {
      response?: {
        status?: number;
        data?: { message?: string; title?: string; errors?: Record<string, string[] | string> };
      };
      message?: string;
    };

    const status = maybe.response?.status;
    const data = maybe.response?.data;
    const direct = data?.message || data?.title;
    if (direct) return status ? `${direct} (HTTP ${status})` : direct;

    const detailErrors = data?.errors;
    if (detailErrors && typeof detailErrors === 'object') {
      const flat = Object.values(detailErrors)
        .flatMap((value) => (Array.isArray(value) ? value : [String(value)]))
        .filter(Boolean);
      if (flat.length > 0) return status ? `${flat.join(' | ')} (HTTP ${status})` : flat.join(' | ');
    }

    if (maybe.message) return status ? `${maybe.message} (HTTP ${status})` : maybe.message;
  }

  return fallback;
}

export default function FiManagementPage() {
  const DEFAULT_BASELINE_START_WEIGHT_KG = 6;
  const DEFAULT_ACTUAL_START_WEIGHT_KG = 5;
  const DEFAULT_TARGET_WEIGHT_KG = 120;
  const DEFAULT_TARGET_FCR = 2.49;
  const DEFAULT_TARGET_ADG_G = 760;
  const DEFAULT_CYCLE_DAYS = 150;
  const DEFAULT_TOLERANCE_PERCENT = 5;
  const theme = useTheme();
  const fullScreenDialog = useMediaQuery(theme.breakpoints.down('md'));

  const [profiles, setProfiles] = useState<ProfileOption[]>([]);
  const [items, setItems] = useState<ItemOption[]>([]);
  const [drafts, setDrafts] = useState<FiDraftListItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [draftId, setDraftId] = useState<string>('');
  const [preview, setPreview] = useState<FiPreviewResponse | null>(null);
  const [editableRows, setEditableRows] = useState<FiDailyRow[]>([]);
  const [newDraftDialogOpen, setNewDraftDialogOpen] = useState(false);

  const [profileId, setProfileId] = useState('');
  const [profileName, setProfileName] = useState('');
  const [gender, setGender] = useState<'ALL' | 'MALE' | 'FEMALE'>('ALL');
  const [targetFiStartG, setTargetFiStartG] = useState(216);

  const [newDraftProfileName, setNewDraftProfileName] = useState('');
  const [newDraftProfileId, setNewDraftProfileId] = useState('');
  const [newDraftGender, setNewDraftGender] = useState<'ALL' | 'MALE' | 'FEMALE'>('ALL');
  const [newDraftTargetFiStartG, setNewDraftTargetFiStartG] = useState(216);

  const itemLabelMap = useMemo(
    () => Object.fromEntries(items.map((item) => [item.id, `${item.code} - ${item.name}`])),
    [items],
  );

  const computedProgram = useMemo(() => {
    const cycleDays = DEFAULT_CYCLE_DAYS;
    const normalizedTargetFiStartG = Math.max(0, Number(targetFiStartG) || 0);
    const bandDays = allocateBandDays(cycleDays);
    const baseCurve = resampleCurveGrams(cycleDays);
    const baseStartG = baseCurve[0] ?? 216;
    const scale = baseStartG > 0 ? normalizedTargetFiStartG / baseStartG : 1;

    const zones: Array<FiZoneInput & { code: string; color: string; dailyCount: number }> = [];
    let startDay = 1;
    for (let index = 0; index < PROGRAM_BANDS.length; index += 1) {
      const band = PROGRAM_BANDS[index];
      const dailyCount = bandDays[index];
      const endDay = startDay + dailyCount - 1;
      const itemId = resolveBandItemId(band.code, items);
      zones.push({
        code: band.code,
        color: band.color,
        itemId,
        startDay,
        endDay,
        dailyCount,
        targetKgPerHead: 0,
      });
      startDay = endDay + 1;
    }

    const overrides: FiDailyOverrideInput[] = [];
    const zoneTotals = zones.map(() => 0);

    for (let day = 1; day <= cycleDays; day += 1) {
      const zoneIndex = zones.findIndex((zone) => day >= zone.startDay && day <= zone.endDay);
      if (zoneIndex < 0) continue;

      const rawKg = (baseCurve[day - 1] / 1000) * scale;
      const dailyFiKg = Math.round(rawKg * 1000) / 1000;
      zoneTotals[zoneIndex] += dailyFiKg;
      overrides.push({
        day,
        itemId: zones[zoneIndex].itemId,
        dailyFiKg,
      });
    }

    for (let index = 0; index < zones.length; index += 1) {
      zones[index].targetKgPerHead = Math.round(zoneTotals[index] * 1000) / 1000;
    }

    const generatedTotalKg = Math.round(overrides.reduce((sum, row) => sum + row.dailyFiKg, 0) * 1000) / 1000;

    return {
      targetFeedTotalKg: generatedTotalKg,
      baselineTargetFeedTotalKg: generatedTotalKg,
      zones,
      dailyOverrides: overrides.filter((item) => item.itemId > 0),
      hasMissingItemMapping: zones.some((zone) => zone.itemId <= 0),
      missingCodes: zones.filter((zone) => zone.itemId <= 0).map((zone) => zone.code),
    };
  }, [items, targetFiStartG]);

  useEffect(() => {
    setEditableRows(buildDailyRowsFromOverrides(computedProgram.dailyOverrides));
  }, [computedProgram.dailyOverrides]);

  const dailyColumns = useMemo<Column<FiDailyRow>[]>(() => [
    { id: 'day', label: 'วันที่ลงเลี้ยง (วัน)', minWidth: 110, align: 'center' },
    {
      id: 'itemId',
      label: 'ชนิดอาหาร',
      minWidth: 190,
      format: (value) => itemLabelMap[Number(value)] ?? `Item ${value}`,
    },
    {
      id: 'dailyFiKg',
      label: 'Target FI (g)',
      minWidth: 120,
      align: 'right',
      format: (value) => Math.round(Number(value) * 1000).toLocaleString('en-US'),
    },
    {
      id: 'increaseG',
      label: 'จำนวนที่เพิ่ม',
      minWidth: 120,
      align: 'right',
      format: (_, row, meta) => {
        const current = Math.round(row.dailyFiKg * 1000);
        if (!meta || meta.rowIndex === 0) return '-';
        const previous = Math.round((editableRows[meta.rowIndex - 1]?.dailyFiKg ?? row.dailyFiKg) * 1000);
        return (current - previous).toLocaleString('en-US');
      },
    },
  ], [editableRows, itemLabelMap]);

  const profileDraftRows = useMemo<FiProfileDraftRow[]>(
    () => drafts.map((draft, index) => ({
      id: draft.draftId,
      sequence: index + 1,
      draftName: draft.draftName || '-',
      profileName: draft.profileName || '-',
      draftId: draft.draftId,
      draftStatus: draft.status || '-',
      updatedAt: draft.updatedAt || '-',
    })),
    [drafts],
  );

  const loadBootstrap = async () => {
    setLoading(true);
    try {
      const [optionData, itemData] = await Promise.all([
        masterApi.getFiStandardOptions() as Promise<OptionResponse>,
        masterApi.getItems() as Promise<ItemOption[]>,
      ]);
      setProfiles(optionData.profiles ?? []);
      setItems(itemData ?? []);
    } catch (e) {
      setError(toErrorMessage(e, 'ไม่สามารถโหลดข้อมูลตั้งต้นของหน้า FI Management ได้'));
    } finally {
      setLoading(false);
    }
  };

  const loadDrafts = async () => {
    try {
      const data = (await masterApi.listFiManagementDrafts()) as FiDraftListItem[];
      setDrafts(data ?? []);
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    void loadBootstrap();
  }, []);

  useEffect(() => {
    void loadDrafts();
  }, []);

  const buildPayload = () => ({
    draftId: draftId || undefined,
    profileId: profileId || undefined,
    draftName: profileName.trim(),
    gender,
    startWeightKg: DEFAULT_BASELINE_START_WEIGHT_KG,
    baselineStartWeightKg: DEFAULT_BASELINE_START_WEIGHT_KG,
    actualStartWeightKg: DEFAULT_ACTUAL_START_WEIGHT_KG,
    targetWeightKg: DEFAULT_TARGET_WEIGHT_KG,
    targetFcr: DEFAULT_TARGET_FCR,
    targetAdgG: DEFAULT_TARGET_ADG_G,
    cycleDays: DEFAULT_CYCLE_DAYS,
    tolerancePercent: DEFAULT_TOLERANCE_PERCENT,
    zones: computedProgram.zones.map((zone) => ({
      itemId: zone.itemId,
      startDay: zone.startDay,
      endDay: zone.endDay,
      targetKgPerHead: zone.targetKgPerHead,
    })),
    dailyOverrides: editableRows.map((row) => ({
      day: row.day,
      itemId: row.itemId,
      dailyFiKg: row.dailyFiKg,
    })),
  });

  const handlePreview = async () => {
    setError('');
    setMessage('');
    if (computedProgram.hasMissingItemMapping) {
      setError(`ไม่พบ Item mapping สำหรับ feed code: ${computedProgram.missingCodes.join(', ')}`);
      return;
    }
    try {
      const data = (await masterApi.previewFiManagement(buildPayload())) as FiPreviewResponse;
      setPreview(data);
      if (!data.isValid) setError('พบข้อผิดพลาดในการคำนวณ กรุณาตรวจสอบก่อนบันทึก');
    } catch (e) {
      setError(toErrorMessage(e, 'คำนวณ FI preview ไม่สำเร็จ'));
    }
  };

  const handleSaveDraft = async () => {
    setError('');
    setMessage('');
    if (!profileName.trim()) {
      setError('กรุณากรอกชื่อ Draft ก่อนบันทึก');
      return;
    }
    if (computedProgram.hasMissingItemMapping) {
      setError(`ไม่พบ Item mapping สำหรับ feed code: ${computedProgram.missingCodes.join(', ')}`);
      return;
    }
    try {
      const response = (await masterApi.upsertFiManagementDraft(buildPayload())) as FiDraftSaveResponse;
      setDraftId(response.draftId);
      setPreview(response.preview);
      setMessage(`บันทึก draft สำเร็จ (status: ${response.status})`);
      await loadDrafts();
    } catch (e) {
      setError(toErrorMessage(e, 'บันทึก FI draft ไม่สำเร็จ'));
    }
  };

  const handleValidate = async () => {
    if (!draftId) {
      setError('กรุณาบันทึก draft ก่อน validate');
      return;
    }
    setError('');
    setMessage('');
    try {
      const result = await masterApi.validateFiManagementDraft(draftId);
      if (result?.isValid) setMessage('Validate draft ผ่าน');
      else setError(`Validate draft ไม่ผ่าน: ${(result?.errors ?? []).join(', ')}`);
      await loadDrafts();
    } catch (e) {
      setError(toErrorMessage(e, 'Validate draft ไม่สำเร็จ'));
    }
  };

  const handlePublish = async () => {
    if (!draftId) {
      setError('กรุณาบันทึก draft ก่อน publish');
      return;
    }
    setError('');
    setMessage('');
    try {
      const response = await masterApi.publishFiManagementDraft(draftId, {
        idempotencyKey: `${draftId}:${new Date().toISOString().slice(0, 19)}`,
      });
      setMessage(`Publish สำเร็จ เวอร์ชัน ${response?.versionNo ?? '-'}`);
      await loadDrafts();
    } catch (e) {
      setError(toErrorMessage(e, 'Publish FI draft ไม่สำเร็จ'));
    }
  };

  const handleLoadDraft = async (targetDraftId: string) => {
    try {
      const detail = await masterApi.getFiManagementDraft(targetDraftId);
      setDraftId(detail.draftId);
      setProfileId(detail.profileId || '');
      setProfileName(detail.draftName || detail.profileName || '');
      setGender(detail.gender);
      const firstDailyKg = Number(detail.rows?.[0]?.dailyFiKg ?? 0);
      const firstDailyG = firstDailyKg > 0 ? Math.round(firstDailyKg * 1000) : 216;
      setTargetFiStartG(firstDailyG);
      setNewDraftTargetFiStartG(firstDailyG);
      setNewDraftGender(detail.gender);
      setNewDraftProfileName(detail.draftName || detail.profileName || '');
      setNewDraftProfileId(detail.profileId || '');
      setPreview({
        gender: detail.gender,
        targetFeedTotalKg: Number(detail.targetFeedTotalKg),
        generatedFeedTotalKg: Number(detail.generatedFeedTotalKg),
        varianceKg: Number(detail.varianceKg),
        variancePercent: Number(detail.variancePercent),
        isWithinTolerance: Boolean(detail.isWithinTolerance),
        isValid: detail.status !== 'draft',
        errors: [],
        rows: detail.rows ?? [],
      });
      setEditableRows((detail.rows ?? []).map((row: any) => ({
        day: Number(row.day),
        itemId: Number(row.itemId),
        dailyFiKg: Number(row.dailyFiKg),
        cumulativeFiKg: Number(row.cumulativeFiKg),
      })));
    } catch (e) {
      setError(toErrorMessage(e, 'โหลด draft ไม่สำเร็จ'));
    }
  };

  const handleOpenDraftFromTable = async (targetDraftId: string) => {
    await handleLoadDraft(targetDraftId);
    setNewDraftDialogOpen(true);
  };

  const handleNewDraft = () => {
    setNewDraftProfileName(profileName || '');
    setNewDraftProfileId(profileId || '');
    setNewDraftGender(gender);
    setNewDraftTargetFiStartG(targetFiStartG || 216);
    setError('');
    setMessage('');
    setNewDraftDialogOpen(true);
  };

  const handleConfirmNewDraft = () => {
    const trimmed = newDraftProfileName.trim();
    if (!trimmed) {
      setError('กรุณากรอกชื่อ Draft');
      return;
    }
    setProfileName(trimmed);
    setProfileId(newDraftProfileId || '');
    setGender(newDraftGender);
    setTargetFiStartG(Math.max(0, Number(newDraftTargetFiStartG) || 0));
    setDraftId('');
    setPreview(null);
    setMessage('');
    setError('');
  };

  const profileDraftColumns = useMemo<Column<FiProfileDraftRow>[]>(() => [
    { id: 'sequence', label: 'ลำดับ', minWidth: 80, align: 'center' },
    { id: 'draftName', label: 'Draft Name', minWidth: 220 },
    { id: 'profileName', label: 'Profile (ผูกแล้ว)', minWidth: 180 },
    {
      id: 'draftStatus',
      label: 'สถานะ Draft',
      minWidth: 120,
      align: 'center',
      format: (value) => {
        const status = String(value || '').trim().toLowerCase();
        const baseChipSx = {
          height: 24,
          fontSize: '11px',
          fontWeight: 600,
          borderRadius: 10,
          minWidth: 68,
          '& .MuiChip-label': { px: 1 },
        };
        const activeSx = {
          ...baseChipSx,
          bgcolor: 'rgba(180,35,24,0.10)',
          color: '#B42318',
          border: '1px solid rgba(180,35,24,0.20)',
        };
        const inactiveSx = {
          ...baseChipSx,
          bgcolor: 'rgba(245,158,11,0.10)',
          color: '#d97706',
          border: '1px solid rgba(245,158,11,0.20)',
        };
        if (status === 'published') {
          return (
            <Box sx={{ display: 'flex', justifyContent: 'center' }}>
              <Chip size="small" label="Published" sx={activeSx} />
            </Box>
          );
        }
        if (status === 'validated') {
          return (
            <Box sx={{ display: 'flex', justifyContent: 'center' }}>
              <Chip size="small" label="Validated" sx={activeSx} />
            </Box>
          );
        }
        if (status === 'draft') {
          return (
            <Box sx={{ display: 'flex', justifyContent: 'center' }}>
              <Chip size="small" label="Draft" sx={inactiveSx} />
            </Box>
          );
        }
        return (
          <Box sx={{ display: 'flex', justifyContent: 'center' }}>
            <Chip size="small" label={String(value || '-')} sx={inactiveSx} />
          </Box>
        );
      },
    },
    {
      id: 'updatedAt',
      label: 'อัปเดตล่าสุด',
      minWidth: 180,
      format: (value) => String(value || '-'),
    },
    {
      id: 'action',
      label: 'Action',
      minWidth: 120,
      align: 'center',
      format: (_, row) => (
        <Button size="small" onClick={() => void handleOpenDraftFromTable(row.draftId)}>
          เปิด
        </Button>
      ),
    },
  ], []);

  return (
    <Box sx={{ maxWidth: 1500, mx: 'auto', p: { xs: 1.5, md: 2 }, display: 'grid', gap: 2 }}>
      <Paper
        variant="outlined"
        sx={{
          p: { xs: 1.5, md: 2 },
          borderRadius: 10,
          background: `linear-gradient(135deg, ${alpha('#0f766e', 0.12)} 0%, ${alpha('#0369a1', 0.08)} 100%)`,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1, flexWrap: 'wrap' }}>
        <Box>
          <Typography variant="h5" fontWeight={900}>FI Management</Typography>
          <Typography variant="body2" color="text.secondary">
            จัดการ Draft FI โดยกรอกเป้าหมายแล้วระบบคำนวณให้อัตโนมัติ
          </Typography>
        </Box>
        <Stack direction="row" spacing={1}>
          <Button variant="outlined" onClick={handleNewDraft}>New Draft</Button>
          <Button variant="outlined" onClick={() => void loadDrafts()}>Refresh Drafts</Button>
        </Stack>
        </Box>
      </Paper>

      {error ? <Alert severity="error">{error}</Alert> : null}
      {message ? <Alert severity="success">{message}</Alert> : null}

      <Paper variant="outlined" sx={{ p: 2, borderRadius: 10, boxShadow: '0 8px 20px rgba(15, 23, 42, 0.05)' }}>
        <Typography fontWeight={800} sx={{ mb: 1 }}>รายการ FI Draft</Typography>
        <DataTable
          columns={profileDraftColumns}
          data={profileDraftRows}
          loading={loading}
          page={0}
          rowsPerPage={Math.min(profileDraftRows.length, 25) || 10}
          totalCount={profileDraftRows.length}
          onPageChange={() => undefined}
          onRowsPerPageChange={() => undefined}
          onRowDoubleClick={(row) => { void handleOpenDraftFromTable(row.draftId); }}
          enforceEntityColumns={false}
          includeManagementColumn={false}
          emptyMessage="ยังไม่มี draft สำหรับแสดง"
        />
      </Paper>

      <Dialog
        open={newDraftDialogOpen}
        onClose={() => setNewDraftDialogOpen(false)}
        fullWidth
        fullScreen={fullScreenDialog}
        maxWidth="lg"
      >
        <DialogTitle sx={{ pb: 1 }}>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} alignItems={{ xs: 'flex-start', sm: 'center' }} justifyContent="space-between">
            <Box>
              <Typography variant="h6" fontWeight={900}>สร้าง FI Draft ใหม่</Typography>
              <Typography variant="body2" color="text.secondary">กำหนดค่าเริ่มต้น, preview, validate และ publish ได้ในหน้าต่างเดียว</Typography>
            </Box>
            <Chip size="small" label={`Draft ID: ${draftId || '-'}`} variant="outlined" />
          </Stack>
        </DialogTitle>
        <DialogContent sx={{ display: 'grid', gap: 1.5, pt: 1 }}>
          {error ? <Alert severity="error">{error}</Alert> : null}
          {message ? <Alert severity="success">{message}</Alert> : null}

          <Box sx={{ display: 'grid', gap: 1.5, gridTemplateColumns: { xs: '1fr', lg: '360px 1fr' }, alignItems: 'start' }}>
            <Stack spacing={1.5}>
              <Paper variant="outlined" sx={{ p: 1.25, borderRadius: 10}}>
                <Stack spacing={1.25}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Draft Name"
                    value={newDraftProfileName}
                    onChange={(event) => {
                      const value = event.target.value;
                      setNewDraftProfileName(value);
                      setProfileName(value);
                    }}
                    helperText="บันทึก draft ได้ทันทีโดยไม่ต้องผูก profile"
                  />

                  <FormControl fullWidth size="small">
                    <InputLabel>เลือก Profile (Optional)</InputLabel>
                    <Select
                      value={newDraftProfileId}
                      label="เลือก Profile (Optional)"
                      onChange={(event) => {
                        const value = String(event.target.value || '');
                        setNewDraftProfileId(value);
                        setProfileId(value);
                      }}
                    >
                      <MenuItem value="">ไม่ผูกโปรไฟล์ตอนนี้</MenuItem>
                      {profiles.map((profile) => (
                        <MenuItem key={profile.id} value={profile.id}>
                          {profile.name} {profile.referenceCode ? `(${profile.referenceCode})` : ''}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>

                  <FormControl fullWidth size="small">
                    <InputLabel>Gender</InputLabel>
                    <Select
                      value={newDraftGender}
                      label="Gender"
                      onChange={(event) => {
                        const value = event.target.value as 'ALL' | 'MALE' | 'FEMALE';
                        setNewDraftGender(value);
                        setGender(value);
                      }}
                    >
                      <MenuItem value="ALL">ALL</MenuItem>
                      <MenuItem value="MALE">MALE</MenuItem>
                      <MenuItem value="FEMALE">FEMALE</MenuItem>
                    </Select>
                  </FormControl>

                  <TextField
                    fullWidth
                    size="small"
                    label="Target FI (g)"
                    type="number"
                    value={newDraftTargetFiStartG}
                    onChange={(event) => {
                      const value = Number(event.target.value);
                      setNewDraftTargetFiStartG(value);
                      setTargetFiStartG(value);
                    }}
                    inputProps={{ min: 0, step: 1 }}
                  />
                </Stack>
              </Paper>

              <Paper variant="outlined" sx={{ p: 1.25, borderRadius: 10}}>
                <Typography variant="caption" color="text.secondary">รายละเอียดที่จะใช้งาน</Typography>
                <Typography variant="body2">Draft Name: {newDraftProfileName || '-'}</Typography>
                <Typography variant="body2">
                  Profile (Optional): {profiles.find((profile) => profile.id === newDraftProfileId)?.name || '-'}
                </Typography>
                <Typography variant="body2">Gender: {newDraftGender}</Typography>
                <Typography variant="body2">Target FI เริ่มต้น: {Math.max(0, Number(newDraftTargetFiStartG) || 0).toFixed(0)} g</Typography>
                <Typography variant="body2">Cycle: {DEFAULT_CYCLE_DAYS} วัน</Typography>
              </Paper>

              <Paper variant="outlined" sx={{ p: 1.25, borderRadius: 10}}>
                <Stack direction={{ xs: 'column', md: 'row' }} spacing={1} flexWrap="wrap">
                  <Button variant="outlined" onClick={handlePreview} disabled={loading}>Preview</Button>
                  <Button variant="contained" startIcon={<SaveOutlined />} onClick={handleSaveDraft} disabled={loading}>Save Draft</Button>
                  <Button variant="outlined" color="success" startIcon={<TaskAltOutlined />} onClick={handleValidate} disabled={loading}>Validate</Button>
                  <Button variant="contained" color="success" startIcon={<PublishOutlined />} onClick={handlePublish} disabled={loading}>Publish</Button>
                </Stack>
              </Paper>
            </Stack>

            <Stack spacing={1.5}>
              <Paper variant="outlined" sx={{ p: 1.25, borderRadius: 10}}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
              <Typography fontWeight={800}>Block เบอร์อาหาร (Auto map จาก Items)</Typography>
              <Chip label="Priority: SEMI > FG" size="small" color="primary" variant="outlined" />
            </Box>
            <Box sx={{ display: 'grid', gap: 1, gridTemplateColumns: { xs: '1fr', md: 'repeat(7, minmax(0, 1fr))' } }}>
              {computedProgram.zones.map((zone) => (
                <Box
                  key={`${zone.code}-${zone.startDay}`}
                  sx={{
                    border: '1px solid',
                    borderColor: 'divider',
                    borderRadius: 10,
                    p: 1,
                    bgcolor: zone.color,
                  }}
                >
                  <Typography fontWeight={800}>{zone.code}</Typography>
                  <Typography variant="caption" sx={{ display: 'block' }}>
                    กิน {zone.dailyCount} วัน ({zone.startDay}-{zone.endDay})
                  </Typography>
                  <Typography variant="caption" sx={{ display: 'block' }}>
                    {zone.targetKgPerHead.toFixed(3)} กก./ตัว
                  </Typography>
                  <Typography variant="caption" sx={{ display: 'block' }}>
                    {itemLabelMap[zone.itemId] ?? `ยังไม่ map item (${zone.code})`}
                  </Typography>
                </Box>
              ))}
            </Box>
              </Paper>

              {preview ? (
                <Paper variant="outlined" sx={{ p: 1.25, display: 'grid', gap: 0.5, borderRadius: 10}}>
                  <Typography fontWeight={800}>Preview Summary</Typography>
                  <Typography variant="body2">Target FI เริ่มต้น: {targetFiStartG.toFixed(0)} g</Typography>
                  <Typography variant="body2">Target Feed Total: {preview.targetFeedTotalKg.toFixed(3)} kg/head</Typography>
                  <Typography variant="body2">Curve Baseline Total: {computedProgram.baselineTargetFeedTotalKg.toFixed(3)} kg/head</Typography>
                  <Typography variant="body2">Generated Feed Total: {preview.generatedFeedTotalKg.toFixed(3)} kg/head</Typography>
                  <Typography variant="body2">Variance: {preview.varianceKg.toFixed(3)} kg ({preview.variancePercent.toFixed(4)}%)</Typography>
                  <Typography variant="body2">Tolerance Status: {preview.isWithinTolerance ? 'Within tolerance' : 'Out of tolerance'}</Typography>
                  {preview.errors.length ? <Alert severity="warning">{preview.errors.join(' | ')}</Alert> : null}
                </Paper>
              ) : null}

              <Paper variant="outlined" sx={{ p: 1.25, borderRadius: 10}}>
                <Typography fontWeight={800} sx={{ mb: 1 }}>Daily FI (Generated)</Typography>
                <DataTable
                  columns={dailyColumns}
                  data={editableRows}
                  loading={loading}
                  page={0}
                  rowsPerPage={Math.min(editableRows.length, 150) || 10}
                  totalCount={editableRows.length}
                  onPageChange={() => undefined}
                  onRowsPerPageChange={() => undefined}
                  getRowId={(row) => `${row.day}-${row.itemId}`}
                  emptyMessage="ยังไม่มีผลลัพธ์การคำนวณ"
                />
              </Paper>
            </Stack>
          </Box>
        </DialogContent>

        <DialogActions>
          <Button onClick={() => setNewDraftDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleConfirmNewDraft}>Create Draft</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
