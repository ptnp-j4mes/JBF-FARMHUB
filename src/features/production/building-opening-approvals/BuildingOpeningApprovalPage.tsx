'use client';

import { useCallback, useEffect, useMemo, useRef, useState, type MouseEvent } from 'react';
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
  TextField,
  Typography,
} from '@mui/material';
import {
  AssignmentTurnedInOutlined,
  Download,
  PendingActionsOutlined,
  TodayOutlined,
  UndoOutlined,
} from '@mui/icons-material';
import { AxiosError } from 'axios';
import Swal from 'sweetalert2';
import { DataTable, DialogTitleWithClose, type Column } from '@/components/common';
import { formatDateShort, toISODateString } from '@/lib/utils/date.util';
import { formatNumber } from '@/lib/utils/format.util';
import { getWorkflowStatusChipSx, toThaiWorkflowStatus } from '@/lib/utils/status.util';
import { buildingOpeningService } from '@/features/production/building-opening/services/building-opening.service';
import type {
  BuildingOpeningFacilityOption,
  BuildingOpeningHouseOption,
  BuildingOpeningResponse,
} from '@/features/production/building-opening/types';
import { PR_MAIN_TABLE_BOTTOM_PADDING, PR_MAIN_TABLE_HEIGHT } from '@/core/ui-patterns/pr-ui.constants';
import { alpha } from '@mui/material/styles';

type Props = {
  initialData?: BuildingOpeningResponse[];
  mode?: 'approval' | 'report';
  embedded?: boolean;
  compact?: boolean;
  onClose?: () => void;
};

const UI = {
  panel: '#f6f7f6',
  border: '#dde2de',
  borderStrong: '#cad4cf',
  text: '#2f3a37',
  muted: '#7d8783',
  accent: 'rgb(22, 90, 80)',
  accentDark: '#10473f',
  shadow: '0 8px 18px rgba(22, 35, 31, 0.10), 0 1px 4px rgba(22, 35, 31, 0.06)',
  softShadow: '0 6px 14px rgba(22, 35, 31, 0.08), 0 1px 3px rgba(22, 35, 31, 0.05)',
};

const DIALOG_PAPER_SX = {
  borderRadius: 3.5,
  border: `1px solid ${UI.border}`,
  boxShadow: UI.shadow,
  overflow: 'hidden',
  bgcolor: UI.panel,
};

const DIALOG_TITLE_SX = {
  bgcolor: UI.accent,
  color: '#fff',
  borderBottom: `1px solid ${alpha(UI.accent, 0.24)}`,
  fontWeight: 800,
  '& .MuiIconButton-root': {
    color: '#fff',
  },
};

const DIALOG_CONTENT_SX = {
  bgcolor: '#fcfdfc',
  px: { xs: 1.5, md: 2 },
  py: { xs: 1.5, md: 2 },
};

const DIALOG_ACTIONS_SX = {
  px: { xs: 1.5, md: 2 },
  py: 1.25,
  borderTop: `1px solid ${UI.border}`,
  bgcolor: '#fbfcfb',
  gap: 1,
};

const OUTLINED_BUTTON_SX = {
  borderRadius: 2.2,
  px: 2,
  boxShadow: UI.softShadow,
  bgcolor: '#fff',
  borderColor: UI.borderStrong,
  color: UI.text,
  '&:hover': {
    borderColor: UI.accent,
    bgcolor: '#f7faf7',
  },
};

const PRIMARY_BUTTON_SX = {
  borderRadius: 2.2,
  px: 2.2,
  boxShadow: UI.softShadow,
  bgcolor: UI.accent,
  '&:hover': {
    bgcolor: UI.accentDark,
  },
};

function escapeCsv(value: string): string {
  if (value.includes('"') || value.includes(',') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function toCsv(rows: BuildingOpeningResponse[]): string {
  const header = ['เลขที่เอกสาร', 'วันที่', 'ฟาร์ม', 'โรงเรือน', 'จำนวน', 'สถานะ'];
  const lines = rows.map((row) => [
    row.documentNumber,
    formatDateShort(row.requestDate),
    row.facilityName,
    row.houseName,
    String(Number(row.quantity ?? 0)),
    toThaiWorkflowStatus(row.status),
  ]);

  return [header, ...lines]
    .map((line) => line.map((cell) => escapeCsv(String(cell ?? ''))).join(','))
    .join('\n');
}

export function BuildingOpeningApprovalPage({ initialData = [], mode = 'approval', embedded = false, compact = false, onClose }: Props) {
  const today = toISODateString(new Date());
  const [rows, setRows] = useState<BuildingOpeningResponse[]>(() =>
    mode === 'approval'
      ? initialData.filter((row) => row.status === 'Submitted')
      : initialData,
  );
  const [loading, setLoading] = useState(initialData.length === 0);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<BuildingOpeningResponse | null>(null);
  const [open, setOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [comment, setComment] = useState('');
  const initialBootstrapSkippedRef = useRef(false);
  const [facilities, setFacilities] = useState<BuildingOpeningFacilityOption[]>([]);
  const [houses, setHouses] = useState<BuildingOpeningHouseOption[]>([]);

  const [docNo, setDocNo] = useState('');
  const [facilityId, setFacilityId] = useState('');
  const [houseCode, setHouseCode] = useState('');
  const [requestDateFrom, setRequestDateFrom] = useState(today);
  const [requestDateTo, setRequestDateTo] = useState(today);
  const [appliedDocNo, setAppliedDocNo] = useState('');
  const [appliedFacilityId, setAppliedFacilityId] = useState('');
  const [appliedHouseCode, setAppliedHouseCode] = useState('');
  const [appliedRequestDateFrom, setAppliedRequestDateFrom] = useState(today);
  const [appliedRequestDateTo, setAppliedRequestDateTo] = useState(today);

  const loadRows = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await buildingOpeningService.getAll({ status: 'all' });
      setRows(mode === 'approval' ? data.filter((row) => row.status === 'Submitted') : data);
    } catch (err) {
      const axiosError = err as AxiosError<{ message?: string }>;
      setError(axiosError.response?.data?.message ?? 'ไม่สามารถโหลดรายการรออนุมัติเปิดโรงเรือนได้');
    } finally {
      setLoading(false);
    }
  }, [mode]);

  useEffect(() => {
    if (!initialBootstrapSkippedRef.current && initialData.length > 0) {
      initialBootstrapSkippedRef.current = true;
      return;
    }
    void loadRows();
  }, [initialData.length, loadRows]);

  useEffect(() => {
    let active = true;
    const loadOptions = async () => {
      try {
        const options = await buildingOpeningService.getCreateOptions();
        if (!active) return;
        setFacilities(options.facilities ?? []);
        setHouses(options.houses ?? []);
      } catch {
        if (!active) return;
        setFacilities([]);
        setHouses([]);
      }
    };

    void loadOptions();
    return () => {
      active = false;
    };
  }, []);

  const houseOptions = useMemo(() => {
    if (!facilityId) return [];
    const targetFacilityId = Number(facilityId);
    return houses.filter((house) => house.facilityNodeId === targetFacilityId);
  }, [facilityId, houses]);

  const openDetails = useCallback(async (row: BuildingOpeningResponse) => {
    try {
      const full = await buildingOpeningService.getById(row.id);
      setSelected(full);
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
      if (selected) {
        const full = await buildingOpeningService.getById(selected.id);
        setSelected(full);
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
  }, [loadRows, selected]);

  const filteredRows = useMemo(() => {
    return rows.filter((row) => {
      if (appliedDocNo.trim()) {
        const keyword = appliedDocNo.trim().toLowerCase();
        if (!row.documentNumber.toLowerCase().includes(keyword)) {
          return false;
        }
      }

      if (appliedFacilityId) {
        if (String(row.facilityId) !== appliedFacilityId) {
          return false;
        }
      }

      if (appliedHouseCode) {
        if ((row.houseCode || '').toLowerCase() !== appliedHouseCode.toLowerCase()) {
          return false;
        }
      }

      if (appliedRequestDateFrom || appliedRequestDateTo) {
        const rowDate = (row.requestDate || '').slice(0, 10);
        if (appliedRequestDateFrom && rowDate < appliedRequestDateFrom) {
          return false;
        }
        if (appliedRequestDateTo && rowDate > appliedRequestDateTo) {
          return false;
        }
      }

      return true;
    });
  }, [appliedDocNo, appliedFacilityId, appliedHouseCode, appliedRequestDateFrom, appliedRequestDateTo, rows]);

  const columns: Column<BuildingOpeningResponse>[] = [
    { id: 'documentNumber', label: 'เลขที่เอกสาร', align: 'left', minWidth: 180 },
    {
      id: 'requestDate',
      label: 'วันที่',
      align: 'center',
      minWidth: 120,
      format: (value) => formatDateShort(String(value)),
    },
    { id: 'facilityName', label: 'ฟาร์ม', align: 'left', minWidth: 220 },
    { id: 'houseName', label: 'โรงเรือน', align: 'left', minWidth: 130 },
    {
      id: 'quantity',
      label: 'จำนวน',
      align: 'right',
      minWidth: 100,
      format: (value) => formatNumber(Number(value ?? 0)),
    },
    {
      id: 'status',
      label: 'สถานะ',
      align: 'center',
      minWidth: 120,
      format: (value) => <Chip size="small" sx={getWorkflowStatusChipSx(String(value))} label={toThaiWorkflowStatus(String(value))} />,
    },
  ];

  const handleExportExcel = useCallback((event?: MouseEvent<HTMLButtonElement>) => {
    event?.preventDefault();
    event?.stopPropagation();

    const csv = toCsv(filteredRows);
    const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    const stamp = new Date()
      .toISOString()
      .replace(/[-:]/g, '')
      .replace('T', '_')
      .slice(0, 15);

    anchor.href = url;
    anchor.download = `building-opening-approvals-${stamp}.csv`;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
  }, [filteredRows]);

  const summaryCards = useMemo(() => {
    const submitted = filteredRows.filter((row) => row.status === 'Submitted').length;
    const approved = filteredRows.filter((row) => row.status === 'Approved').length;
    const returned = filteredRows.filter((row) => row.status === 'Returned').length;

    return [
      {
        key: 'all',
        title: 'รายการทั้งหมด',
        subtitle: 'เอกสารเปิดโรงเรือน',
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
        subtitle: 'พร้อมดำเนินงาน',
        value: approved,
        icon: <AssignmentTurnedInOutlined sx={{ color: '#2e7d32', fontSize: 20 }} />,
        iconBg: '#dfe9db',
        bar: '#2e7d32',
      },
      {
        key: 'returned',
        title: 'ตีกลับ',
        subtitle: 'ต้องแก้ไขข้อมูล',
        value: returned,
        icon: <UndoOutlined sx={{ color: '#7c5ce5', fontSize: 20 }} />,
        iconBg: '#e4ddf4',
        bar: '#7c5ce5',
      },
    ];
  }, [filteredRows]);

  return (
    <Box
      sx={{
        maxWidth: compact ? 'none' : embedded ? 'none' : 1400,
        mx: compact ? 0 : embedded ? 0 : 'auto',
        p: compact ? 0 : embedded ? 0 : { xs: 1.5, md: 2 },
        bgcolor: compact ? 'transparent' : embedded ? 'transparent' : UI.bg,
      }}
    >
      {!compact ? (
        <>
          <Box
            sx={{
              bgcolor: embedded ? '#fff' : UI.accent,
              color: embedded ? UI.text : '#fff',
              borderRadius: 3.5,
              border: embedded ? `1px solid ${UI.border}` : 'none',
              boxShadow: embedded ? UI.softShadow : UI.shadow,
              px: 2.5,
              py: embedded ? 1.8 : 2,
              display: 'flex',
              alignItems: { xs: 'flex-start', md: 'center' },
              justifyContent: 'space-between',
              gap: 1.5,
              mb: 2,
              flexWrap: 'wrap',
            }}
          >
            <Box>
              <Typography sx={{ fontSize: embedded ? '1.35rem' : '2rem', fontWeight: 700, lineHeight: 1 }}>
                {mode === 'report' ? 'รายงานเปิดโรงเรือน' : 'รายการอนุมัติโรงเรือน'}
              </Typography>
              {embedded ? (
                <Typography sx={{ mt: 0.5, fontSize: '0.92rem', color: UI.muted }}>
                  ตรวจสอบและอนุมัติรายการได้ทันทีจากหน้าเดียวกัน
                </Typography>
              ) : null}
            </Box>
            {embedded && onClose ? (
              <Button variant="outlined" onClick={onClose} sx={{ borderColor: UI.borderStrong, color: UI.text }}>
                ปิดรายการอนุมัติ
              </Button>
            ) : null}
          </Box>
          <Box sx={{ display: 'grid', gap: 1.5, gridTemplateColumns: { xs: '1fr 1fr', md: 'repeat(4,minmax(0,1fr))' }, mb: 2 }}>
            {summaryCards.map((card) => (
              <Box
                key={card.key}
                sx={{
                  borderRadius: 3.5,
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
        </>
      ) : null}

      <Box sx={{ borderRadius: 3.5, border: `1px solid ${UI.border}`, bgcolor: '#fbfcfb', p: { xs: 1.25, md: 1.5 }, boxShadow: UI.softShadow }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1, mb: 1.25 }}>
          <Typography sx={{ fontSize: 13, color: '#7d8783', fontWeight: 700 }}>รายการเปิดโรงเรือน</Typography>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            {mode === 'report' ? (
              <Button
                variant="contained"
                startIcon={<Download />}
                onClick={handleExportExcel}
                disabled={filteredRows.length === 0}
              >
                Export Excel
              </Button>
            ) : null}
          </Box>
        </Box>

        {error ? <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert> : null}

        <Box sx={{ display: 'grid', gap: 1.5, gridTemplateColumns: { xs: '1fr', md: '1.1fr 1fr 1fr minmax(300px,1.1fr) auto' }, mb: 1.25 }}>
          <TextField
            size="small"
            placeholder="ค้นหาเลขที่เอกสาร"
            value={docNo}
            onChange={(event) => setDocNo(event.target.value)}
            sx={{ '& .MuiOutlinedInput-root': { height: 40, borderRadius: 1.5, bgcolor: '#f8faf8', boxShadow: '0 2px 6px rgba(22, 35, 31, 0.06)' } }}
          />
          <TextField
            size="small"
            select
            label="ฟาร์ม"
            value={facilityId}
            onChange={(event) => {
              setFacilityId(event.target.value);
              setHouseCode('');
            }}
            sx={{ '& .MuiOutlinedInput-root': { height: 40, borderRadius: 1.5, bgcolor: '#f8faf8', boxShadow: '0 2px 6px rgba(22, 35, 31, 0.06)' } }}
          >
            <MenuItem value="all">ทั้งหมด</MenuItem>
            {facilities.map((facility) => (
              <MenuItem key={facility.id} value={String(facility.id)}>
                {facility.code} - {facility.name}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            size="small"
            select
            label="โรงเรือน"
            value={houseCode}
            onChange={(event) => setHouseCode(event.target.value)}
            disabled={!facilityId}
            sx={{ '& .MuiOutlinedInput-root': { height: 40, borderRadius: 1.5, bgcolor: '#f8faf8', boxShadow: '0 2px 6px rgba(22, 35, 31, 0.06)' } }}
          >
            <MenuItem value="all">{facilityId ? 'ทั้งหมด' : 'เลือกฟาร์มก่อน'}</MenuItem>
            {houseOptions.map((house) => (
              <MenuItem key={house.id} value={house.houseCode}>
                {house.zoneName ? `${house.zoneName}/` : ''}{house.houseCode} - {house.houseName}
              </MenuItem>
            ))}
          </TextField>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <TextField
              size="small"
              type="date"
              value={requestDateFrom}
              onChange={(event) => setRequestDateFrom(event.target.value)}
              sx={{ flex: 1, '& .MuiOutlinedInput-root': { height: 40, borderRadius: 1.5, bgcolor: '#f8faf8', boxShadow: '0 2px 6px rgba(22, 35, 31, 0.06)' } }}
            />
            <Typography variant="body2" color="text.secondary" sx={{ minWidth: 20, textAlign: 'center' }}>
              ถึง
            </Typography>
            <TextField
              size="small"
              type="date"
              value={requestDateTo}
              onChange={(event) => setRequestDateTo(event.target.value)}
              sx={{ flex: 1, '& .MuiOutlinedInput-root': { height: 40, borderRadius: 1.5, bgcolor: '#f8faf8', boxShadow: '0 2px 6px rgba(22, 35, 31, 0.06)' } }}
            />
          </Box>
          <Button
            variant="contained"
            onClick={() => {
              setAppliedDocNo(docNo);
              setAppliedFacilityId(facilityId);
              setAppliedHouseCode(houseCode);
              setAppliedRequestDateFrom(requestDateFrom);
              setAppliedRequestDateTo(requestDateTo);
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
          emptyMessage="ไม่มีรายการเปิดโรงเรือน"
          stickyHeader
          paperSx={{ borderRadius: 3.5, border: `1px solid ${UI.border}`, boxShadow: UI.softShadow, bgcolor: '#f9faf9', height: PR_MAIN_TABLE_HEIGHT, pb: `${PR_MAIN_TABLE_BOTTOM_PADDING}px` }}
          tableContainerSx={{ overflowX: 'auto', overflowY: 'auto' }}
          tableSx={{
            '& .MuiTable-root': { minWidth: { xs: 980, md: 980 }, tableLayout: 'fixed' },
            '& .MuiTableBody-root .MuiTableCell-root': { py: 1.05, borderBottom: `1px solid ${UI.border}`, color: UI.text },
          }}
        />
      </Box>

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="md" fullWidth PaperProps={{ sx: DIALOG_PAPER_SX }}>
        <DialogTitleWithClose onClose={() => setOpen(false)} disabled={actionLoading} sx={DIALOG_TITLE_SX}>
          {mode === 'report' ? 'รายละเอียดเปิดโรงเรือน' : 'อนุมัติเปิดโรงเรือน'}
        </DialogTitleWithClose>
        <DialogContent dividers sx={DIALOG_CONTENT_SX}>
          {selected ? (
            <Stack spacing={1.2}>
              <Typography><strong>เลขที่เอกสาร:</strong> {selected.documentNumber}</Typography>
              <Typography><strong>ฟาร์ม:</strong> {selected.facilityName}</Typography>
              <Typography><strong>โรงเรือน:</strong> {selected.houseCode} - {selected.houseName}</Typography>
              <Typography><strong>จำนวน:</strong> {formatNumber(Number(selected.quantity ?? 0))}</Typography>
              <Typography><strong>แหล่งสุกร:</strong> {selected.pigSource}</Typography>
              <Typography><strong>สถานะ:</strong> {toThaiWorkflowStatus(selected.status)}</Typography>
              {mode === 'approval' ? (
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
              ) : null}
            </Stack>
          ) : null}
        </DialogContent>
        {mode === 'approval' ? (
          <DialogActions sx={DIALOG_ACTIONS_SX}>
            <Button
              color="error"
              variant="outlined"
              disabled={!selected || actionLoading || selected.status !== 'Submitted'}
              sx={OUTLINED_BUTTON_SX}
              onClick={() => {
                if (!selected) return;
                if (!comment.trim()) {
                  void Swal.fire({ icon: 'warning', title: 'กรุณาใส่เหตุผลสำหรับ Reject' });
                  return;
                }
                void executeAction('ยืนยันไม่อนุมัติรายการนี้', async () => {
                  await buildingOpeningService.reject(selected.id, { comment: comment.trim() });
                });
              }}
            >
              Reject
            </Button>
            <Button
              color="warning"
              variant="outlined"
              disabled={!selected || actionLoading || selected.status !== 'Submitted'}
              sx={OUTLINED_BUTTON_SX}
              onClick={() => {
                if (!selected) return;
                if (!comment.trim()) {
                  void Swal.fire({ icon: 'warning', title: 'กรุณาใส่เหตุผลสำหรับ Return' });
                  return;
                }
                void executeAction('ยืนยันตีกลับรายการนี้', async () => {
                  await buildingOpeningService.returnForRevision(selected.id, { comment: comment.trim() });
                });
              }}
            >
              Return
            </Button>
            <Button
              color="success"
              variant="contained"
              disabled={!selected || actionLoading || selected.status !== 'Submitted'}
              sx={PRIMARY_BUTTON_SX}
              onClick={() => {
                if (!selected) return;
                void executeAction('ยืนยันอนุมัติรายการนี้', async () => {
                  await buildingOpeningService.approve(selected.id, { comment: comment.trim() || undefined });
                });
              }}
            >
              Approve
            </Button>
          </DialogActions>
        ) : null}
      </Dialog>
    </Box>
  );
}
