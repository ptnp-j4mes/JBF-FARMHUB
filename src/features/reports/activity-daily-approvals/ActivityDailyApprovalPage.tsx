'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Viewer from 'viewerjs';
import {
  Alert,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  MenuItem,
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
import {
  AssignmentTurnedInOutlined,
  AssignmentLateOutlined,
  PendingActionsOutlined,
  TodayOutlined,
} from '@mui/icons-material';
import { AxiosError } from 'axios';
import Swal from 'sweetalert2';
import { DataTable, DialogTitleWithClose, type Column } from '@/components/common';
import { httpClient } from '@/core/api/http-client';
import { formatDateShort, toISODateString } from '@/lib/utils/date.util';
import { getWorkflowStatusChipSx, toThaiWorkflowStatus } from '@/lib/utils/status.util';
import { PR_MAIN_TABLE_BOTTOM_PADDING, PR_MAIN_TABLE_HEIGHT } from '@/core/ui-patterns/pr-ui.constants';

export type ActivityDailyApprovalRow = {
  id: number;
  docNo: string;
  sourceDocNo?: string | null;
  txnDocNo?: string | null;
  documentType?: string | null;
  mortalityDocNo?: string | null;
  entryDate: string;
  facilityId: number;
  facilityCode: string;
  facilityName: string;
  status: string;
  remark?: string | null;
  createdDate: string;
  updatedDate?: string | null;
};

type ActivityDailyDetail = {
  header: ActivityDailyApprovalRow;
  payload?: unknown;
};

type ActivityDailyHealthKey = 'eating' | 'movement' | 'breathing' | 'skin';
type ActivityDailyHealthToggles = Record<ActivityDailyHealthKey, string>;
type ActivityDailyFeedRecord = {
  id?: string;
  feedNo?: string;
  amount?: string | number;
  amountKg?: string | number;
  displayQty?: string | number;
  isBagDisplay?: boolean;
  displayUomName?: string;
  note?: string;
};
type ActivityDailyMedRecord = { id?: string; medName?: string; method?: string; amount?: string | number; dose?: string | number; note?: string };
type ActivityDailyMortalityRecord = {
  id?: string;
  type?: string;
  reason?: string;
  deathDay?: string | number;
  stall?: string;
  amount?: string | number;
  weight?: string | number;
  imageName?: string;
  imageUrl?: string;
  imageStorageUrl?: string;
  desc?: string;
};
type ActivityDailyPayload = {
  selectedFarm?: string;
  selectedGroup?: string;
  selectedHouse?: string;
  mortalityDocNo?: string;
  sectionDocNos?: {
    overview?: string;
    health?: string;
    feed?: string;
    meds?: string;
    mortality?: string;
    media?: string;
  };
  healthToggles: ActivityDailyHealthToggles;
  feedRecords: ActivityDailyFeedRecord[];
  medRecords: ActivityDailyMedRecord[];
  mortalityRecords: ActivityDailyMortalityRecord[];
  generalRemark?: string;
};

type FacilityOption = {
  id: number;
  code: string;
  name: string;
};

type ActivityOptionsResponse = {
  facilities?: FacilityOption[];
};

type Props = {
  initialData?: ActivityDailyApprovalRow[];
};

const UI = {
  panel: '#f6f7f6',
  border: '#dde2de',
  text: '#2f3a37',
  muted: '#7d8783',
  accent: 'rgb(22, 90, 80)',
  shadow: '0 8px 18px rgba(22, 35, 31, 0.10), 0 1px 4px rgba(22, 35, 31, 0.06)',
  softShadow: '0 6px 14px rgba(22, 35, 31, 0.08), 0 1px 3px rgba(22, 35, 31, 0.05)',
};

function toNumberDisplay(value: unknown): string {
  if (value == null || value === '') return '-';
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return String(value);
  return numeric.toLocaleString();
}

function toThaiActivityDocType(value: string | null | undefined): string {
  switch ((value || '').toLowerCase()) {
    case 'overview':
      return 'ภาพรวม';
    case 'health':
      return 'สุขภาพสุกร';
    case 'feed':
      return 'อาหาร';
    case 'meds':
      return 'ยา/วัคซีน';
    case 'mortality':
      return 'ตาย/คัดทิ้ง';
    case 'media':
      return 'แนบไฟล์';
    default:
      return 'ไม่ระบุ';
  }
}

function formatFeedAmount(row: ActivityDailyFeedRecord): string {
  const rawAmountKg = row.amountKg ?? row.amount;
  if (rawAmountKg == null || rawAmountKg === '') {
    return '-';
  }

  const amountKg = Number(rawAmountKg);
  const isBagDisplay = Boolean(row.isBagDisplay);
  const displayQty = Number(row.displayQty ?? row.amount ?? 0);
  if (!isBagDisplay) {
    return `${toNumberDisplay(amountKg)} กก.`;
  }

  return `${toNumberDisplay(displayQty)} ${String(row.displayUomName ?? 'กระสอบ')} (${toNumberDisplay(amountKg)} กก.)`;
}

function normalizePayload(raw: unknown): ActivityDailyPayload {
  const value = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {};
  const health = value.healthToggles && typeof value.healthToggles === 'object'
    ? (value.healthToggles as Record<string, unknown>)
    : {};

  const toArray = <T,>(input: unknown): T[] => (Array.isArray(input) ? (input as T[]) : []);
  const sectionDocNos = value.sectionDocNos && typeof value.sectionDocNos === 'object'
    ? (value.sectionDocNos as Record<string, unknown>)
    : {};

  return {
    selectedFarm: typeof value.selectedFarm === 'string' ? value.selectedFarm : '',
    selectedGroup: typeof value.selectedGroup === 'string' ? value.selectedGroup : '',
    selectedHouse: typeof value.selectedHouse === 'string' ? value.selectedHouse : '',
    mortalityDocNo: typeof value.mortalityDocNo === 'string' ? value.mortalityDocNo : '',
    sectionDocNos: {
      overview: typeof sectionDocNos.overview === 'string' ? sectionDocNos.overview : '',
      health: typeof sectionDocNos.health === 'string' ? sectionDocNos.health : '',
      feed: typeof sectionDocNos.feed === 'string' ? sectionDocNos.feed : '',
      meds: typeof sectionDocNos.meds === 'string' ? sectionDocNos.meds : '',
      mortality: typeof sectionDocNos.mortality === 'string' ? sectionDocNos.mortality : '',
      media: typeof sectionDocNos.media === 'string' ? sectionDocNos.media : '',
    },
    healthToggles: {
      eating: typeof health.eating === 'string' ? health.eating : 'normal',
      movement: typeof health.movement === 'string' ? health.movement : 'normal',
      breathing: typeof health.breathing === 'string' ? health.breathing : 'normal',
      skin: typeof health.skin === 'string' ? health.skin : 'normal',
    },
    feedRecords: toArray<ActivityDailyFeedRecord>(value.feedRecords).map((item, idx) => ({
      id: item.id || `feed-${idx + 1}`,
      feedNo: item.feedNo || '',
      amount: item.amount ?? '',
      amountKg: item.amountKg ?? '',
      displayQty: item.displayQty ?? '',
      isBagDisplay: Boolean(item.isBagDisplay),
      displayUomName: item.displayUomName || '',
      note: item.note || '',
    })),
    medRecords: toArray<ActivityDailyMedRecord>(value.medRecords).map((item, idx) => ({
      id: item.id || `med-${idx + 1}`,
      medName: item.medName || '',
      method: item.method || '',
      amount: item.amount ?? '',
      dose: item.dose ?? '',
      note: item.note || '',
    })),
    mortalityRecords: toArray<ActivityDailyMortalityRecord>(value.mortalityRecords).map((item, idx) => ({
      id: item.id || `mortality-${idx + 1}`,
      type: item.type || '',
      reason: item.reason || '',
      deathDay: item.deathDay ?? '',
      stall: item.stall || '',
      amount: item.amount ?? '',
      weight: item.weight ?? '',
      imageName: item.imageName || '',
      imageUrl: item.imageUrl || '',
      imageStorageUrl: item.imageStorageUrl || '',
      desc: item.desc || '',
    })),
    generalRemark: typeof value.generalRemark === 'string' ? value.generalRemark : '',
  };
}

export function ActivityDailyApprovalPage({ initialData = [] }: Props) {
  const today = toISODateString(new Date());
  const [rows, setRows] = useState<ActivityDailyApprovalRow[]>(initialData);
  const [loading, setLoading] = useState(initialData.length === 0);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<ActivityDailyDetail | null>(null);
  const [payloadDraft, setPayloadDraft] = useState<ActivityDailyPayload>(normalizePayload({}));
  const [open, setOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [comment, setComment] = useState('');
  const [mortalityImagePreviewUrls, setMortalityImagePreviewUrls] = useState<Record<string, string>>({});
  const mortalityGalleryRef = useRef<HTMLDivElement | null>(null);
  const mortalityViewerRef = useRef<Viewer | null>(null);
  const initialBootstrapSkippedRef = useRef(false);

  const [facilities, setFacilities] = useState<FacilityOption[]>([]);
  const [docNo, setDocNo] = useState('');
  const [facilityId, setFacilityId] = useState('all');
  const [entryDateFrom, setEntryDateFrom] = useState(today);
  const [entryDateTo, setEntryDateTo] = useState(today);
  const [appliedDocNo, setAppliedDocNo] = useState('');
  const [appliedFacilityId, setAppliedFacilityId] = useState('all');
  const [appliedEntryDateFrom, setAppliedEntryDateFrom] = useState(today);
  const [appliedEntryDateTo, setAppliedEntryDateTo] = useState(today);

  const loadRows = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await httpClient.get<ActivityDailyApprovalRow[]>('/api/ProductionActivities/pending-approvals');
      setRows(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      const axiosError = err as AxiosError<{ message?: string }>;
      setError(axiosError.response?.data?.message ?? 'ไม่สามารถโหลดรายการรออนุมัติ Activity Daily ได้');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!initialBootstrapSkippedRef.current && initialData.length > 0) {
      initialBootstrapSkippedRef.current = true;
      return;
    }
    void loadRows();
  }, [initialData.length, loadRows]);

  useEffect(() => {
    let active = true;
    const loadFacilityOptions = async () => {
      try {
        const response = await httpClient.get<ActivityOptionsResponse>('/api/ProductionActivities/options');
        const data = response.data?.facilities ?? [];
        if (!active) return;
        setFacilities(data);
      } catch {
        if (!active) return;
        setFacilities([]);
      }
    };

    void loadFacilityOptions();
    return () => {
      active = false;
    };
  }, []);

  const filteredRows = useMemo(() => {
    return rows.filter((row) => {
      if (appliedDocNo.trim()) {
        const keyword = appliedDocNo.trim().toLowerCase();
        const haystack = [
          row.docNo || '',
          row.sourceDocNo || '',
          row.txnDocNo || '',
          row.facilityCode || '',
          row.facilityName || '',
          row.documentType || '',
          toThaiActivityDocType(row.documentType),
        ].join(' ').toLowerCase();
        if (!haystack.includes(keyword)) {
          return false;
        }
      }

      if (appliedFacilityId !== 'all' && String(row.facilityId) !== appliedFacilityId) {
        return false;
      }

      const rowDate = (row.entryDate || '').slice(0, 10);
      if (appliedEntryDateFrom && rowDate < appliedEntryDateFrom) {
        return false;
      }
      if (appliedEntryDateTo && rowDate > appliedEntryDateTo) {
        return false;
      }

      return true;
    });
  }, [appliedDocNo, appliedEntryDateFrom, appliedEntryDateTo, appliedFacilityId, rows]);

  const summaryCards = useMemo(() => {
    const submitted = filteredRows.filter((row) => row.status === 'Submitted').length;
    const approved = filteredRows.filter((row) => row.status === 'Approved').length;
    const rejected = filteredRows.filter((row) => row.status === 'Rejected').length;
    return [
      {
        key: 'all',
        title: 'รายการทั้งหมด',
        subtitle: 'เอกสารทั้งหมด',
        value: filteredRows.length,
        icon: <TodayOutlined sx={{ color: '#4a6982', fontSize: 20 }} />,
        iconBg: '#efe8da',
        bar: '#4a6982',
      },
      {
        key: 'submitted',
        title: 'รอดำเนินการ',
        subtitle: 'งานรออนุมัติ',
        value: submitted,
        icon: <PendingActionsOutlined sx={{ color: '#d09100', fontSize: 20 }} />,
        iconBg: '#f2ead8',
        bar: '#d09100',
      },
      {
        key: 'approved',
        title: 'อนุมัติแล้ว',
        subtitle: 'ผ่านการตรวจสอบ',
        value: approved,
        icon: <AssignmentTurnedInOutlined sx={{ color: '#2e7d32', fontSize: 20 }} />,
        iconBg: '#dfe9db',
        bar: '#2e7d32',
      },
      {
        key: 'rejected',
        title: 'ไม่อนุมัติ',
        subtitle: 'ต้องทบทวนแก้ไข',
        value: rejected,
        icon: <AssignmentLateOutlined sx={{ color: '#7c5ce5', fontSize: 20 }} />,
        iconBg: '#e4ddf4',
        bar: '#7c5ce5',
      },
    ];
  }, [filteredRows]);

  const selectedDocType = useMemo(
    () => (selected?.header.documentType || '').toLowerCase(),
    [selected?.header.documentType],
  );

  const visibleSections = useMemo(() => {
    switch (selectedDocType) {
      case 'health':
        return new Set(['health']);
      case 'feed':
        return new Set(['feed']);
      case 'meds':
        return new Set(['meds']);
      case 'mortality':
        return new Set(['mortality']);
      case 'overview':
      case 'media':
        return new Set<string>();
      default:
        return new Set(['health', 'feed', 'meds', 'mortality']);
    }
  }, [selectedDocType]);

  const sectionDocumentRows = useMemo(() => {
    if (!selected) return [];
    const sectionDocNos = payloadDraft.sectionDocNos ?? {};
    const rowsForDisplay: Array<{ label: string; value: string }> = [];
    const pushIfAny = (label: string, value: unknown) => {
      const text = typeof value === 'string' ? value.trim() : '';
      if (text) rowsForDisplay.push({ label, value: text });
    };

    pushIfAny('เลข TXN', selected.header.txnDocNo || selected.header.docNo);
    pushIfAny('เลขเอกสารต้นทาง', selected.header.sourceDocNo);
    pushIfAny('เลขภาพรวม', sectionDocNos.overview);
    pushIfAny('เลขสุขภาพสุกร', sectionDocNos.health);
    pushIfAny('เลขอาหาร', sectionDocNos.feed);
    pushIfAny('เลขยา/วัคซีน', sectionDocNos.meds);
    pushIfAny('เลขตาย/คัดทิ้ง', sectionDocNos.mortality || selected.header.mortalityDocNo);
    pushIfAny('เลขแนบไฟล์', sectionDocNos.media);
    return rowsForDisplay;
  }, [payloadDraft.sectionDocNos, selected]);

  const getMortalityPreviewSrc = useCallback((row: ActivityDailyMortalityRecord): string => {
    const direct = (row.imageStorageUrl || row.imageUrl || '').trim();
    if (!direct) return '';
    return mortalityImagePreviewUrls[direct] || direct;
  }, [mortalityImagePreviewUrls]);

  const mortalityViewerRows = useMemo(
    () => payloadDraft.mortalityRecords.filter((row) => Boolean(getMortalityPreviewSrc(row))),
    [getMortalityPreviewSrc, payloadDraft.mortalityRecords],
  );

  useEffect(() => {
    let active = true;
    const objectUrls: string[] = [];

    const loadMortalityImages = async () => {
      const urls = Array.from(
        new Set(
          (payloadDraft.mortalityRecords || [])
            .map((row) => {
              const direct = typeof row.imageStorageUrl === 'string' ? row.imageStorageUrl.trim() : '';
              if (direct) return direct;
              return typeof row.imageUrl === 'string' ? row.imageUrl.trim() : '';
            })
            .filter((url) => Boolean(url)),
        ),
      );

      if (urls.length === 0) {
        setMortalityImagePreviewUrls({});
        return;
      }

      const entries = await Promise.all(
        urls.map(async (url) => {
          try {
            const response = await httpClient.get<Blob>(url, { responseType: 'blob' });
            const objectUrl = URL.createObjectURL(response.data);
            objectUrls.push(objectUrl);
            return [url, objectUrl] as const;
          } catch {
            return [url, ''] as const;
          }
        }),
      );

      if (!active) {
        objectUrls.forEach((item) => URL.revokeObjectURL(item));
        return;
      }

      setMortalityImagePreviewUrls(
        entries.reduce<Record<string, string>>((acc, [url, objectUrl]) => {
          acc[url] = objectUrl;
          return acc;
        }, {}),
      );
    };

    void loadMortalityImages();

    return () => {
      active = false;
      objectUrls.forEach((item) => URL.revokeObjectURL(item));
    };
  }, [payloadDraft.mortalityRecords]);

  useEffect(() => {
    if (!open || !mortalityGalleryRef.current) return undefined;

    if (mortalityViewerRef.current) {
      mortalityViewerRef.current.destroy();
      mortalityViewerRef.current = null;
    }

    mortalityViewerRef.current = new Viewer(mortalityGalleryRef.current, {
      navbar: false,
      title: true,
      toolbar: {
        zoomIn: true,
        zoomOut: true,
        oneToOne: true,
        reset: true,
        prev: true,
        play: false,
        next: true,
        rotateLeft: true,
        rotateRight: true,
        flipHorizontal: true,
        flipVertical: true,
      },
    });

    return () => {
      if (mortalityViewerRef.current) {
        mortalityViewerRef.current.destroy();
        mortalityViewerRef.current = null;
      }
    };
  }, [mortalityViewerRows, open]);

  const openDetails = useCallback(async (row: ActivityDailyApprovalRow) => {
    try {
      const response = await httpClient.get<ActivityDailyDetail>(`/api/ProductionActivities/${row.id}`);
      setSelected(response.data);
      setPayloadDraft(normalizePayload(response.data?.payload));
      setComment('');
      setOpen(true);
    } catch (err) {
      const axiosError = err as AxiosError<{ message?: string }>;
      setError(axiosError.response?.data?.message ?? 'ไม่สามารถโหลดรายละเอียดได้');
    }
  }, []);

  const executeAction = useCallback(async (title: string, run: () => Promise<void>) => {
    const confirm = await Swal.fire({
      icon: 'question',
      title,
      showCancelButton: true,
      confirmButtonText: 'ยืนยัน',
      cancelButtonText: 'ยกเลิก',
      reverseButtons: true,
    });
    if (!confirm.isConfirmed) return;

    try {
      setActionLoading(true);
      await run();
      await loadRows();
      if (selected?.header.id) {
        const response = await httpClient.get<ActivityDailyDetail>(`/api/ProductionActivities/${selected.header.id}`);
        setSelected(response.data);
        setPayloadDraft(normalizePayload(response.data?.payload));
      }
      await Swal.fire({ icon: 'success', title: 'บันทึกสำเร็จ', timer: 1200, showConfirmButton: false });
    } catch (err) {
      const axiosError = err as AxiosError<{ message?: string }>;
      await Swal.fire({
        icon: 'error',
        title: 'ดำเนินการไม่สำเร็จ',
        text: axiosError.response?.data?.message ?? 'เกิดข้อผิดพลาด',
      });
    } finally {
      setActionLoading(false);
    }
  }, [loadRows, selected?.header.id]);

  const healthRows = useMemo(
    () => ([
      { key: 'eating' as const, label: 'การกินอาหาร' },
      { key: 'movement' as const, label: 'การเคลื่อนไหว' },
      { key: 'breathing' as const, label: 'การหายใจ' },
      { key: 'skin' as const, label: 'ผิวหนัง' },
    ]),
    [],
  );

  const setFeedNote = useCallback((id: string | undefined, note: string) => {
    setPayloadDraft((prev) => ({
      ...prev,
      feedRecords: prev.feedRecords.map((row) => (row.id === id ? { ...row, note } : row)),
    }));
  }, []);

  const setMedNote = useCallback((id: string | undefined, note: string) => {
    setPayloadDraft((prev) => ({
      ...prev,
      medRecords: prev.medRecords.map((row) => (row.id === id ? { ...row, note } : row)),
    }));
  }, []);

  const setMortalityDesc = useCallback((id: string | undefined, desc: string) => {
    setPayloadDraft((prev) => ({
      ...prev,
      mortalityRecords: prev.mortalityRecords.map((row) => (row.id === id ? { ...row, desc } : row)),
    }));
  }, []);

  const columns: Column<ActivityDailyApprovalRow>[] = [
    {
      id: 'docNo',
      label: 'เลขที่เอกสาร',
      align: 'left',
      minWidth: 170,
      format: (value) => String(value || '-'),
    },
    {
      id: 'documentType',
      label: 'ประเภทเอกสาร',
      align: 'left',
      minWidth: 160,
      format: (value) => toThaiActivityDocType(String(value || '')),
    },
    {
      id: 'entryDate',
      label: 'วันที่เอกสาร',
      align: 'center',
      minWidth: 120,
      format: (value) => formatDateShort(String(value)),
    },
    {
      id: 'facilityName',
      label: 'ฟาร์ม',
      align: 'left',
      minWidth: 220,
      format: (_, row) => `${row.facilityCode} - ${row.facilityName}`,
    },
    {
      id: 'status',
      label: 'สถานะ',
      align: 'center',
      minWidth: 110,
      format: (value) => <Chip size="small" sx={getWorkflowStatusChipSx(String(value))} label={toThaiWorkflowStatus(String(value))} />,
    },
    {
      id: 'updatedDate',
      label: 'แก้ไขล่าสุด',
      align: 'center',
      minWidth: 160,
      format: (value, row) => formatDateShort(String(value || row.createdDate)),
    },
  ];

  return (
    <Box sx={{ p: { xs: 1.5, md: 2 }, bgcolor: UI.bg }}>
      <Box
        sx={{
          bgcolor: UI.accent,
          color: '#fff',
          borderRadius: 2,
          boxShadow: UI.shadow,
          px: 2.5,
          py: 2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          mb: 2,
        }}
      >
        <Typography sx={{ fontSize: '2rem', fontWeight: 700, lineHeight: 1 }}>อนุมัติบันทึกข้อมูลประจำวัน</Typography>
        <Typography sx={{ fontSize: '1rem', color: 'rgba(255,255,255,0.85)' }}>
          Dashboard / อนุมัติบันทึกข้อมูลประจำวัน
        </Typography>
      </Box>

      <Box sx={{ display: 'grid', gap: 1.5, gridTemplateColumns: { xs: '1fr 1fr', md: 'repeat(4,minmax(0,1fr))' }, mb: 2 }}>
        {summaryCards.map((card) => (
          <Box
            key={card.key}
            sx={{
              borderRadius: 2.5,
              border: `1px solid ${UI.border}`,
              bgcolor: '#f4f6f4',
              p: 1.7,
              boxShadow: UI.softShadow,
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 1 }}>
              <Box>
                <Typography sx={{ fontSize: '2rem', fontWeight: 700, color: '#1d2624', lineHeight: 1 }}>
                  {card.value.toLocaleString()}
                </Typography>
                <Typography sx={{ fontSize: '0.95rem', color: UI.muted, mt: 0.35 }}>{card.title}</Typography>
              </Box>
              <Box sx={{ width: 46, height: 46, borderRadius: 1.5, bgcolor: card.iconBg, boxShadow: '0 4px 10px rgba(22, 35, 31, 0.10)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                {card.icon}
              </Box>
            </Box>
            <Typography sx={{ fontSize: '0.82rem', color: UI.muted }}>{card.subtitle}</Typography>
            <Box sx={{ mt: 1.6, width: 108, height: 8, borderRadius: 999, bgcolor: '#e3e9e4' }}>
              <Box sx={{ width: 54, height: '100%', bgcolor: card.bar, borderRadius: 999 }} />
            </Box>
          </Box>
        ))}
      </Box>

      <Box sx={{ borderRadius: 2, border: `1px solid ${UI.border}`, bgcolor: '#fbfcfb', p: { xs: 1.25, md: 1.5 }, boxShadow: UI.softShadow }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1, mb: 1.25 }}>
          <Typography sx={{ fontSize: 13, color: UI.muted, fontWeight: 700 }}>รายการรออนุมัติ Activity Daily</Typography>
          <Button
            variant="outlined"
            onClick={loadRows}
            sx={{
              borderColor: '#b8c5bf',
              color: UI.text,
              borderRadius: 1.5,
              boxShadow: '0 3px 8px rgba(22, 35, 31, 0.08)',
              '&:hover': { borderColor: UI.accent, bgcolor: 'rgba(22,90,80,0.08)' },
            }}
          >
            รีเฟรช
          </Button>
        </Box>

        {error ? <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert> : null}

        <Box sx={{ display: 'grid', gap: 1.5, gridTemplateColumns: { xs: '1fr', md: '1.1fr 1fr minmax(300px,1.1fr) auto' }, mb: 1.25 }}>
          <TextField
            size="small"
            placeholder="ค้นหาเอกสาร / ประเภท / ฟาร์ม"
            value={docNo}
            onChange={(event) => setDocNo(event.target.value)}
            sx={{ '& .MuiOutlinedInput-root': { height: 40, borderRadius: 1.5, bgcolor: '#f8faf8', boxShadow: '0 2px 6px rgba(22, 35, 31, 0.06)' } }}
          />
          <TextField
            size="small"
            select
            value={facilityId}
            onChange={(event) => setFacilityId(event.target.value)}
            sx={{ '& .MuiOutlinedInput-root': { height: 40, borderRadius: 1.5, bgcolor: '#f8faf8', boxShadow: '0 2px 6px rgba(22, 35, 31, 0.06)' } }}
          >
            <MenuItem value="all">ทุกฟาร์ม</MenuItem>
            {facilities.map((facility) => (
              <MenuItem key={facility.id} value={String(facility.id)}>
                {facility.code} - {facility.name}
              </MenuItem>
            ))}
          </TextField>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <TextField
              size="small"
              type="date"
              value={entryDateFrom}
              onChange={(event) => setEntryDateFrom(event.target.value)}
              sx={{ flex: 1, '& .MuiOutlinedInput-root': { height: 40, borderRadius: 1.5, bgcolor: '#f8faf8', boxShadow: '0 2px 6px rgba(22, 35, 31, 0.06)' } }}
            />
            <Typography variant="body2" color="text.secondary" sx={{ minWidth: 20, textAlign: 'center' }}>
              ถึง
            </Typography>
            <TextField
              size="small"
              type="date"
              value={entryDateTo}
              onChange={(event) => setEntryDateTo(event.target.value)}
              sx={{ flex: 1, '& .MuiOutlinedInput-root': { height: 40, borderRadius: 1.5, bgcolor: '#f8faf8', boxShadow: '0 2px 6px rgba(22, 35, 31, 0.06)' } }}
            />
          </Box>
          <Button
            variant="contained"
            onClick={() => {
              setAppliedDocNo(docNo);
              setAppliedFacilityId(facilityId);
              setAppliedEntryDateFrom(entryDateFrom);
              setAppliedEntryDateTo(entryDateTo);
            }}
            sx={{ height: 40, borderRadius: 1.5, bgcolor: UI.accent, boxShadow: '0 4px 10px rgba(22, 35, 31, 0.14)', '&:hover': { bgcolor: '#10473f' } }}
          >
            ค้นหา
          </Button>
        </Box>

        <Typography variant="caption" color="red" sx={{ display: 'block', mb: 1, textAlign: 'right' }}>
          *ดับเบิลคลิกที่แถวเพื่อดูรายละเอียดเพิ่มเติม
        </Typography>
        <DataTable
          columns={columns}
          data={filteredRows}
          loading={loading}
          headerCellSx={{
            bgcolor: '#f3f5f4 !important',
            color: '#4a5451 !important',
            fontWeight: 700,
            fontSize: '15px',
            py: 0,
            verticalAlign: 'middle',
            borderBottom: `1px solid ${UI.border}`,
          }}
          onRowDoubleClick={openDetails}
          emptyMessage="ไม่มีรายการรออนุมัติ"
          stickyHeader
          paperSx={{ borderRadius: '14px', border: `1px solid ${UI.border}`, boxShadow: UI.softShadow, bgcolor: '#f9faf9', height: PR_MAIN_TABLE_HEIGHT, pb: `${PR_MAIN_TABLE_BOTTOM_PADDING}px` }}
          tableContainerSx={{ overflowX: 'auto', overflowY: 'auto' }}
          tableSx={{
            '& .MuiTable-root': { minWidth: { xs: 1000, md: 1000 }, tableLayout: 'fixed' },
            '& .MuiTableBody-root .MuiTableCell-root': { py: 1.05, borderBottom: `1px solid ${UI.border}`, color: UI.text },
            '& .MuiTableHead-root .MuiTableCell-root': { whiteSpace: 'nowrap' },
          }}
        />
      </Box>

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="lg" fullWidth>
        <DialogTitleWithClose onClose={() => setOpen(false)} disabled={actionLoading}>
          อนุมัติบันทึกข้อมูลประจำวัน
        </DialogTitleWithClose>
        <DialogContent dividers>
          {selected ? (
            <Stack spacing={1.2}>
              <Typography><strong>ประเภทเอกสาร:</strong> {toThaiActivityDocType(selected.header.documentType)}</Typography>
              <Typography><strong>ฟาร์ม:</strong> {selected.header.facilityCode} - {selected.header.facilityName}</Typography>
              <Typography><strong>วันที่:</strong> {formatDateShort(selected.header.entryDate)}</Typography>
              <Typography><strong>สถานะ:</strong> {toThaiWorkflowStatus(selected.header.status)}</Typography>
              <Typography><strong>หมายเหตุ:</strong> {selected.header.remark || '-'}</Typography>

              <Box sx={{ border: `1px solid ${UI.border}`, borderRadius: 2, bgcolor: '#fbfcfb', p: 1.25 }}>
                <Typography sx={{ fontSize: 13, color: UI.muted, fontWeight: 700, mb: 0.75 }}>เลขที่เอกสารตามประเภท</Typography>
                {sectionDocumentRows.length > 0 ? (
                  <Stack spacing={0.5}>
                    {sectionDocumentRows.map((row) => (
                      <Typography key={`${row.label}-${row.value}`}>
                        <strong>{row.label}:</strong> {row.value}
                      </Typography>
                    ))}
                  </Stack>
                ) : (
                  <Typography color="text.secondary">-</Typography>
                )}
              </Box>

              <TextField
                size="small"
                label="Comment"
                value={comment}
                onChange={(event) => setComment(event.target.value)}
                placeholder="ระบุเหตุผล (จำเป็นสำหรับ Return/Reject)"
                multiline
                minRows={2}
                fullWidth
              />

              <TextField
                size="small"
                label="หมายเหตุรายงาน (ปรับแก้ได้)"
                value={payloadDraft.generalRemark || ''}
                onChange={(event) => setPayloadDraft((prev) => ({ ...prev, generalRemark: event.target.value }))}
                multiline
                minRows={2}
                fullWidth
              />

              {visibleSections.has('health') ? (
                <Box sx={{ border: `1px solid ${UI.border}`, borderRadius: 2, bgcolor: '#fbfcfb', p: 1.25 }}>
                  <Typography sx={{ fontSize: 13, color: UI.muted, fontWeight: 700, mb: 0.75 }}>สุขภาพสุกร</Typography>
                  <TableContainer sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1.5 }}>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell sx={{ fontWeight: 700 }}>รายการ</TableCell>
                          <TableCell sx={{ fontWeight: 700 }} align="center">สถานะ</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {healthRows.map((row) => (
                          <TableRow key={row.key}>
                            <TableCell>{row.label}</TableCell>
                            <TableCell align="center">{payloadDraft.healthToggles[row.key] === 'abnormal' ? 'ผิดปกติ' : 'ปกติ'}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Box>
              ) : null}

              {visibleSections.has('feed') ? (
                <Box sx={{ border: `1px solid ${UI.border}`, borderRadius: 2, bgcolor: '#fbfcfb', p: 1.25 }}>
                  <Typography sx={{ fontSize: 13, color: UI.muted, fontWeight: 700, mb: 0.75 }}>บันทึกการใช้อาหาร</Typography>
                  <TableContainer sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1.5 }}>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell sx={{ fontWeight: 700 }}>เบอร์อาหาร</TableCell>
                          <TableCell sx={{ fontWeight: 700 }} align="right">จำนวน</TableCell>
                          <TableCell sx={{ fontWeight: 700 }}>รายละเอียด/ความเห็น</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {payloadDraft.feedRecords.length > 0 ? payloadDraft.feedRecords.map((row) => (
                          <TableRow key={row.id}>
                            <TableCell>{row.feedNo || '-'}</TableCell>
                            <TableCell align="right">{formatFeedAmount(row)}</TableCell>
                            <TableCell sx={{ minWidth: 260 }}>
                              <TextField
                                size="small"
                                fullWidth
                                value={row.note || ''}
                                onChange={(event) => setFeedNote(row.id, event.target.value)}
                                placeholder="เพิ่มรายละเอียด"
                              />
                            </TableCell>
                          </TableRow>
                        )) : (
                          <TableRow><TableCell colSpan={3} align="center">ไม่มีข้อมูล</TableCell></TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Box>
              ) : null}

              {visibleSections.has('meds') ? (
                <Box sx={{ border: `1px solid ${UI.border}`, borderRadius: 2, bgcolor: '#fbfcfb', p: 1.25 }}>
                  <Typography sx={{ fontSize: 13, color: UI.muted, fontWeight: 700, mb: 0.75 }}>บันทึกยา/วัคซีน</Typography>
                  <TableContainer sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1.5 }}>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell sx={{ fontWeight: 700 }}>รายการยา</TableCell>
                          <TableCell sx={{ fontWeight: 700 }}>วิธีใช้</TableCell>
                          <TableCell sx={{ fontWeight: 700 }} align="right">ปริมาณ</TableCell>
                          <TableCell sx={{ fontWeight: 700 }} align="right">โดส</TableCell>
                          <TableCell sx={{ fontWeight: 700 }}>รายละเอียด/ความเห็น</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {payloadDraft.medRecords.length > 0 ? payloadDraft.medRecords.map((row) => (
                          <TableRow key={row.id}>
                            <TableCell>{row.medName || '-'}</TableCell>
                            <TableCell>{row.method || '-'}</TableCell>
                            <TableCell align="right">{toNumberDisplay(row.amount)}</TableCell>
                            <TableCell align="right">{toNumberDisplay(row.dose)}</TableCell>
                            <TableCell sx={{ minWidth: 260 }}>
                              <TextField
                                size="small"
                                fullWidth
                                value={row.note || ''}
                                onChange={(event) => setMedNote(row.id, event.target.value)}
                                placeholder="เพิ่มรายละเอียด"
                              />
                            </TableCell>
                          </TableRow>
                        )) : (
                          <TableRow><TableCell colSpan={5} align="center">ไม่มีข้อมูล</TableCell></TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Box>
              ) : null}

              {visibleSections.has('mortality') ? (
                <Box sx={{ border: `1px solid ${UI.border}`, borderRadius: 2, bgcolor: '#fbfcfb', p: 1.25 }}>
                  <Typography sx={{ fontSize: 13, color: UI.muted, fontWeight: 700, mb: 0.75 }}>ตาย/คัดทิ้ง</Typography>
                  <TableContainer sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1.5 }}>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell sx={{ fontWeight: 700 }}>ประเภท</TableCell>
                          <TableCell sx={{ fontWeight: 700 }}>สาเหตุ</TableCell>
                          <TableCell sx={{ fontWeight: 700 }} align="right">วันที่ตาย</TableCell>
                          <TableCell sx={{ fontWeight: 700 }}>คอก</TableCell>
                          <TableCell sx={{ fontWeight: 700 }} align="right">จำนวน</TableCell>
                          <TableCell sx={{ fontWeight: 700 }} align="right">น้ำหนัก</TableCell>
                          <TableCell sx={{ fontWeight: 700 }}>รูปแนบ</TableCell>
                          <TableCell sx={{ fontWeight: 700 }}>รายละเอียด/ความเห็น</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {payloadDraft.mortalityRecords.length > 0 ? payloadDraft.mortalityRecords.map((row) => (
                          <TableRow key={row.id}>
                            <TableCell>{row.type || '-'}</TableCell>
                            <TableCell>{row.reason || '-'}</TableCell>
                            <TableCell align="right">{row.deathDay ? `Day ${row.deathDay}` : '-'}</TableCell>
                            <TableCell>{row.stall || '-'}</TableCell>
                            <TableCell align="right">{toNumberDisplay(row.amount)}</TableCell>
                            <TableCell align="right">{toNumberDisplay(row.weight)}</TableCell>
                            <TableCell>
                              {(row.imageStorageUrl || row.imageUrl) ? (
                                <Stack direction="row" spacing={1} alignItems="center">
                                  {getMortalityPreviewSrc(row) ? (
                                    <Box
                                      component="img"
                                      src={getMortalityPreviewSrc(row)}
                                      alt={row.imageName || 'evidence'}
                                      onClick={() => {
                                        const index = mortalityViewerRows.findIndex((item) => item.id === row.id);
                                        if (index >= 0 && mortalityViewerRef.current) {
                                          mortalityViewerRef.current.view(index);
                                        }
                                      }}
                                      sx={{
                                        width: 46,
                                        height: 46,
                                        objectFit: 'cover',
                                        borderRadius: 1,
                                        border: '1px solid',
                                        borderColor: 'divider',
                                        cursor: 'pointer',
                                      }}
                                    />
                                  ) : (
                                    <Typography variant="body2" color="text.secondary">โหลดรูปไม่ได้</Typography>
                                  )}
                                  <Button
                                    size="small"
                                    variant="text"
                                    onClick={() => {
                                      const index = mortalityViewerRows.findIndex((item) => item.id === row.id);
                                      if (index >= 0 && mortalityViewerRef.current) {
                                        mortalityViewerRef.current.view(index);
                                      }
                                    }}
                                  >
                                    {row.imageName || 'ดูรูป'}
                                  </Button>
                                </Stack>
                              ) : (
                                row.imageName || '-'
                              )}
                            </TableCell>
                            <TableCell sx={{ minWidth: 260 }}>
                              <TextField
                                size="small"
                                fullWidth
                                value={row.desc || ''}
                                onChange={(event) => setMortalityDesc(row.id, event.target.value)}
                                placeholder="เพิ่มรายละเอียด"
                              />
                            </TableCell>
                          </TableRow>
                        )) : (
                          <TableRow><TableCell colSpan={8} align="center">ไม่มีข้อมูล</TableCell></TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Box>
              ) : null}

              <Box
                ref={mortalityGalleryRef}
                sx={{
                  position: 'fixed',
                  width: 1,
                  height: 1,
                  overflow: 'hidden',
                  opacity: 0,
                  pointerEvents: 'none',
                  left: -99999,
                  top: -99999,
                }}
              >
                {mortalityViewerRows.map((row, idx) => (
                  <img
                    key={`mortality-approve-gallery-${row.id || idx}`}
                    src={getMortalityPreviewSrc(row)}
                    alt={row.imageName || 'evidence'}
                  />
                ))}
              </Box>
            </Stack>
          ) : null}
        </DialogContent>
        <DialogActions>
          <Button
            color="error"
            variant="outlined"
            disabled={!selected || actionLoading || selected.header.status !== 'SUBMITTED'}
            onClick={() => {
              if (!selected) return;
              if (!comment.trim()) {
                void Swal.fire({ icon: 'warning', title: 'กรุณาใส่เหตุผลสำหรับ Reject' });
                return;
              }
              void executeAction('ยืนยันไม่อนุมัติรายการนี้', async () => {
                await httpClient.post(`/api/ProductionActivities/${selected.header.id}/reject`, {
                  comment: comment.trim(),
                  reviewPayload: payloadDraft,
                });
              });
            }}
          >
            Reject
          </Button>
          <Button
            color="warning"
            variant="outlined"
            disabled={!selected || actionLoading || selected.header.status !== 'SUBMITTED'}
            onClick={() => {
              if (!selected) return;
              if (!comment.trim()) {
                void Swal.fire({ icon: 'warning', title: 'กรุณาใส่เหตุผลสำหรับ Return' });
                return;
              }
              void executeAction('ยืนยันตีกลับรายการนี้', async () => {
                await httpClient.post(`/api/ProductionActivities/${selected.header.id}/return`, {
                  comment: comment.trim(),
                  reviewPayload: payloadDraft,
                });
              });
            }}
          >
            Return
          </Button>
          <Button
            color="success"
            variant="contained"
            disabled={!selected || actionLoading || selected.header.status !== 'SUBMITTED'}
            onClick={() => {
              if (!selected) return;
              void executeAction('ยืนยันอนุมัติรายการนี้', async () => {
                await httpClient.post(`/api/ProductionActivities/${selected.header.id}/approve`, {
                  comment: comment.trim() || undefined,
                  reviewPayload: payloadDraft,
                });
              });
            }}
          >
            Approve
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
