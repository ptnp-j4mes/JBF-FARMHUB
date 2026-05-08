'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Box, Button, Chip, InputAdornment, MenuItem, Paper, TextField, Typography } from '@mui/material';
import {
  Refresh as RefreshIcon,
  Search as SearchIcon,
  ReceiptLongOutlined,
  PendingActionsOutlined,
  TaskAltOutlined,
  CheckCircleOutlineOutlined,
} from '@mui/icons-material';
import { useTheme, alpha } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import { AxiosError } from 'axios';
import Swal from 'sweetalert2';
import { DataTable, type Column } from '@/components/common';
import { stockIssueRequestService } from '@/features/production/stock-issue-request/services/stock-issue-request.service';
import type { StockIssueRequestResponse } from '@/features/production/stock-issue-request/types/stock-issue-request.types';
import { notifyStockIssueRequestsChanged } from '@/features/production/stock-issue-request/stock-issue-request.events';
import { StockIssueRequestDetailsDialog } from '@/features/production/stock-issue-request/components/StockIssueRequestDetailsDialog';
import { formatDateShort, toISODateString } from '@/lib/utils/date.util';
import { formatNumber } from '@/lib/utils/format.util';
import { getWorkflowStatusChipSx, toThaiWorkflowStatus } from '@/lib/utils/status.util';
import { PR_MAIN_TABLE_BOTTOM_PADDING, PR_MAIN_TABLE_HEIGHT } from '@/core/ui-patterns/pr-ui.constants';


type StockIssueApprovalFilterParams = {
  searchTerm: string;
  requestDateFrom: string;
  requestDateTo: string;
  status: string;
};

const statusOptions = [
  { value: '', label: 'ทั้งหมด' },
  { value: 'Pending', label: toThaiWorkflowStatus('Pending') },
  { value: 'Approved', label: toThaiWorkflowStatus('Approved') },
  { value: 'Rejected', label: toThaiWorkflowStatus('Rejected') },
];

const UI = {
  panel: '#f6f7f6',
  border: '#dde2de',
  text: '#2f3a37',
  muted: '#7d8783',
  accent: 'rgb(22, 90, 80)',
  shadow: '0 8px 18px rgba(22, 35, 31, 0.10), 0 1px 4px rgba(22, 35, 31, 0.06)',
};

export function StockIssueApprovalPage() {
  const today = toISODateString(new Date());
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [rows, setRows] = useState<StockIssueRequestResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<StockIssueRequestResponse | null>(null);
  const [openDetails, setOpenDetails] = useState(false);
  const [canApprove, setCanApprove] = useState(false);
  const initialBootstrapSkippedRef = useRef(false);
  const dateFromInputRef = useRef<HTMLInputElement | null>(null);
  const dateToInputRef = useRef<HTMLInputElement | null>(null);
  const [draftFilters, setDraftFilters] = useState<StockIssueApprovalFilterParams>({
    searchTerm: '',
    requestDateFrom: today,
    requestDateTo: today,
    status: '',
  });
  const [appliedFilters, setAppliedFilters] = useState<StockIssueApprovalFilterParams>({
    searchTerm: '',
    requestDateFrom: today,
    requestDateTo: today,
    status: '',
  });

  const loadRows = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      setRows(await stockIssueRequestService.getPendingApprovals());
      setCanApprove(true);
    } catch (err) {
      console.error(err);
      const axiosError = err as AxiosError<{ message?: string }>;
      if (axiosError.response?.status === 401 || axiosError.response?.status === 403) {
        setCanApprove(false);
        setRows([]);
        return;
      }
      setCanApprove(true);
      setError('ไม่สามารถโหลดรายการอนุมัติขอตัดสต๊อกได้');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!initialBootstrapSkippedRef.current && rows.length > 0) {
      initialBootstrapSkippedRef.current = true;
      return;
    }
    void loadRows();
  }, [loadRows]);

  const filteredRows = useMemo(() => {
    const keyword = appliedFilters.searchTerm.trim().toLowerCase();
    const filtered = rows.filter((row) => {
      const rowDate = row.requestDate.slice(0, 10);
      if (appliedFilters.requestDateFrom && rowDate < appliedFilters.requestDateFrom) return false;
      if (appliedFilters.requestDateTo && rowDate > appliedFilters.requestDateTo) return false;
      if (appliedFilters.status && row.status !== appliedFilters.status) return false;
      if (!keyword) return true;
      return (
        row.documentNumber.toLowerCase().includes(keyword) ||
        row.requestorName.toLowerCase().includes(keyword) ||
        row.facilityName.toLowerCase().includes(keyword)
      );
    });
    return filtered.sort((left, right) => right.requestDate.localeCompare(left.requestDate) || right.id - left.id);
  }, [appliedFilters, rows]);

  const summaryCards = useMemo(() => {
    const source = canApprove ? filteredRows : [];
    return [
      {
        key: 'pending',
        title: 'รออนุมัติทั้งหมด',
        value: source.length,
        subtitle: 'งานรออนุมัติ',
        icon: <PendingActionsOutlined sx={{ color: '#d09100', fontSize: 20 }} />,
        iconBg: '#f2ead8',
        bar: '#d09100',
      },
      {
        key: 'facility',
        title: 'ฟาร์มที่มีคำขอ',
        value: new Set(source.map((row) => row.facilityId)).size,
        subtitle: 'จำนวนฟาร์ม',
        icon: <ReceiptLongOutlined sx={{ color: '#4a6982', fontSize: 20 }} />,
        iconBg: '#efe8da',
        bar: '#4a6982',
      },
      {
        key: 'zone',
        title: 'มีโซนระบุ',
        value: source.filter((row) => !!row.usageZone).length,
        subtitle: 'ติดตามปลายทางใช้',
        icon: <TaskAltOutlined sx={{ color: '#2e7d32', fontSize: 20 }} />,
        iconBg: '#dfe9db',
        bar: '#2e7d32',
      },
      {
        key: 'house',
        title: 'มีโรงเรือนระบุ',
        value: source.filter((row) => !!row.usageHouseName).length,
        subtitle: 'พร้อมตรวจสอบ',
        icon: <CheckCircleOutlineOutlined sx={{ color: '#7c5ce5', fontSize: 20 }} />,
        iconBg: '#e4ddf4',
        bar: '#7c5ce5',
      },
    ];
  }, [canApprove, filteredRows]);

  const columns: Column<StockIssueRequestResponse>[] = [
    {
      id: 'documentNumber',
      label: 'เลขที่ใบขอ',
      align: 'left',
      minWidth: 180,
      format: (value) => (
        <Typography variant="body2" fontWeight={600} textAlign="left">
          {value as React.ReactNode}
        </Typography>
      ),
    },
    {
      id: 'requestDate',
      label: 'วันที่ขอ',
      align: 'center',
      minWidth: 120,
      format: (value) => formatDateShort(String(value)),
    },
    { id: 'requestorName', label: 'ผู้ขอ', align: 'left', minWidth: 180 },
    {
      id: 'sourcePurchaseRequestNumber',
      label: 'PR ต้นทาง',
      align: 'left',
      minWidth: 180,
      format: (value) => String(value || '-'),
    },
    {
      id: 'usageHouseName',
      label: 'โรงเรือน',
      align: 'left',
      minWidth: 220,
      format: (value) => String(value || '-'),
    },
    {
      id: 'status',
      label: 'สถานะ',
      align: 'center',
      minWidth: 130,
      format: (value) => (
        <Chip size="small" label={toThaiWorkflowStatus(String(value))} sx={getWorkflowStatusChipSx(String(value))} />
      ),
    },
    {
      id: 'id',
      label: 'จัดการ',
      align: 'center',
      minWidth: 120,
      format: (_, row) => (
        <Button size="small" variant="outlined" onClick={() => void handleOpenDetails(row)}>
          รายละเอียด
        </Button>
      ),
    },
  ];

  const handleOpenDetails = useCallback(async (row: StockIssueRequestResponse) => {
    try {
      const full = await stockIssueRequestService.getById(row.id);
      setSelected(full);
      setOpenDetails(true);
    } catch (err) {
      console.error(err);
      setError('ไม่สามารถโหลดรายละเอียดใบขอตัดได้');
    }
  }, []);

  const handleApprove = useCallback(async (comment: string) => {
    if (!selected) return;

    const confirm = await Swal.fire({
      icon: 'question',
      title: 'ยืนยันการอนุมัติ',
      text: 'ต้องการอนุมัติใบขอตัดสต๊อกนี้ใช่หรือไม่',
      showCancelButton: true,
      confirmButtonText: 'อนุมัติ',
      cancelButtonText: 'ยกเลิก',
      reverseButtons: true,
    });
    if (!confirm.isConfirmed) return;

    try {
      setActionLoading(true);
      await stockIssueRequestService.approve(selected.id, comment);
      setOpenDetails(false);
      await loadRows();
      notifyStockIssueRequestsChanged();
      await Swal.fire({ icon: 'success', title: 'อนุมัติสำเร็จ', timer: 1200, showConfirmButton: false });
    } catch (err) {
      console.error(err);
      await Swal.fire({ icon: 'error', title: 'อนุมัติไม่สำเร็จ', text: 'กรุณาตรวจสอบข้อมูลอีกครั้ง' });
    } finally {
      setActionLoading(false);
    }
  }, [loadRows, selected]);

  const handleReject = useCallback(async (comment: string) => {
    if (!selected) return;

    const confirm = await Swal.fire({
      icon: 'warning',
      title: 'ยืนยันการไม่อนุมัติ',
      text: 'ต้องการไม่อนุมัติใบขอตัดสต๊อกนี้ใช่หรือไม่',
      showCancelButton: true,
      confirmButtonText: 'ยืนยันไม่อนุมัติ',
      cancelButtonText: 'ยกเลิก',
      reverseButtons: true,
    });
    if (!confirm.isConfirmed) return;

    try {
      setActionLoading(true);
      await stockIssueRequestService.reject(selected.id, comment);
      setOpenDetails(false);
      await loadRows();
      notifyStockIssueRequestsChanged();
      await Swal.fire({ icon: 'success', title: 'ไม่อนุมัติสำเร็จ', timer: 1200, showConfirmButton: false });
    } catch (err) {
      console.error(err);
      await Swal.fire({ icon: 'error', title: 'ดำเนินการไม่สำเร็จ', text: 'กรุณาตรวจสอบข้อมูลอีกครั้ง' });
    } finally {
      setActionLoading(false);
    }
  }, [loadRows, selected]);

  return (
    <Box sx={{ p: { xs: 1.5, md: 2 }, bgcolor: UI.bg }}>
      <Box
        sx={{
          bgcolor: UI.accent,
          color: '#fff',
          borderRadius: 10,
          boxShadow: UI.shadow,
          px: 2.5,
          py: 2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          mb: 2,
        }}
      >
        <Typography sx={{ fontSize: '2rem', fontWeight: 700, lineHeight: 1 }}>อนุมัติขอตัดสต๊อก</Typography>
        <Typography sx={{ fontSize: '1rem', color: 'rgba(255,255,255,0.85)' }}>
          Dashboard / อนุมัติขอตัดสต๊อก
        </Typography>
      </Box>

      <Box sx={{ mb: 2, display: 'grid', gap: 1.5, gridTemplateColumns: { xs: '1fr', sm: 'repeat(2,1fr)', lg: 'repeat(4,1fr)' } }}>
        {summaryCards.map((card) => (
          <Paper key={card.key} variant="outlined" sx={{ borderRadius: 10, borderColor: UI.border, bgcolor: UI.panel, boxShadow: UI.shadow, px: 2, py: 1.8 }}>
            <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 1 }}>
              <Box>
                <Typography sx={{ fontSize: '2.1rem', fontWeight: 700, color: '#1d2624', lineHeight: 1 }}>
                  {formatNumber(card.value)}
                </Typography>
                <Typography sx={{ fontSize: '0.95rem', color: UI.muted, mt: 0.4 }}>{card.title}</Typography>
              </Box>
              <Box sx={{ width: 46, height: 46, borderRadius: 10, bgcolor: card.iconBg, boxShadow: '0 4px 10px rgba(22, 35, 31, 0.10)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                {card.icon}
              </Box>
            </Box>
            <Typography sx={{ fontSize: '0.8rem', color: UI.muted }}>{card.subtitle}</Typography>
            <Box sx={{ mt: 1.8, width: 108, height: 8, borderRadius: 10, bgcolor: '#e7ece8' }}>
              <Box sx={{ width: 54, height: '100%', bgcolor: card.bar, borderRadius: 10}} />
            </Box>
          </Paper>
        ))}
      </Box>

      <Box sx={{ borderRadius: 10, border: `1px solid ${UI.border}`, bgcolor: UI.panel, boxShadow: UI.shadow, p: { xs: 1.5, md: 2 } }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1.5, mb: 1.6 }}>
          <Chip variant="outlined" sx={{ borderColor: '#e2c26a', color: '#8a6400', bgcolor: '#f8efd6', fontWeight: 700 }} label={`รออนุมัติ ${canApprove ? filteredRows.length : 0} รายการ`} />
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={() => void loadRows()}
            sx={{ borderRadius: 10, borderColor: '#b8c5bf', boxShadow: '0 3px 8px rgba(22, 35, 31, 0.08)', color: UI.text, '&:hover': { borderColor: UI.accent, bgcolor: alpha(UI.accent, 0.08) } }}
          >
            รีเฟรช
          </Button>
        </Box>

        {!canApprove ? (
          <Alert severity="warning" sx={{ mb: 2 }}>
            บัญชีนี้ไม่มีสิทธิ์อนุมัติ จึงไม่สามารถดูและดำเนินการอนุมัติใบขอตัดสต๊อกได้
          </Alert>
        ) : null}

        {error ? (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        ) : null}

        <Box
          sx={{
            mb: 1.6,
            display: 'grid',
            gap: 1.2,
            gridTemplateColumns: {
              xs: '1fr',
              sm: '1fr 1fr',
              md: 'minmax(280px,1fr) 160px minmax(220px,1fr) minmax(320px,1.1fr) auto',
            },
            alignItems: 'center',
          }}
        >
          <TextField
            placeholder="ค้นหาเลขที่เอกสาร"
            value={draftFilters.searchTerm}
            onChange={(event) => setDraftFilters((prev) => ({ ...prev, searchTerm: event.target.value }))}
            size="small"
            sx={{ width: '100%', '& .MuiOutlinedInput-root': { height: 40, borderRadius: 10, bgcolor: '#f8faf8', boxShadow: '0 2px 6px rgba(22, 35, 31, 0.06)' } }}
            InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon sx={{ color: '#8d9592' }} /></InputAdornment> }}
          />
          <TextField
            select
            value={draftFilters.status}
            onChange={(event) => setDraftFilters((prev) => ({ ...prev, status: event.target.value }))}
            size="small"
            SelectProps={{ displayEmpty: true, renderValue: (value) => (value ? String(value) : 'สถานะ') }}
            sx={{
              '& .MuiOutlinedInput-root': { height: 40, borderRadius: 10, bgcolor: '#f8faf8', boxShadow: '0 2px 6px rgba(22, 35, 31, 0.06)' },
              '& .MuiSelect-select': { color: draftFilters.status ? 'inherit' : 'text.secondary' },
            }}
          >
            {statusOptions.map((option) => (
              <MenuItem key={option.value} value={option.value}>{option.label}</MenuItem>
            ))}
          </TextField>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <TextField
              type="date"
              value={draftFilters.requestDateFrom}
              onChange={(event) => setDraftFilters((prev) => ({ ...prev, requestDateFrom: event.target.value }))}
              onClick={() => {
                const input = dateFromInputRef.current as (HTMLInputElement & { showPicker?: () => void }) | null;
                input?.focus();
                input?.showPicker?.();
              }}
              inputRef={dateFromInputRef}
              size="small"
              sx={{ flex: 1, '& .MuiOutlinedInput-root': { height: 40, cursor: 'pointer', borderRadius: 10, bgcolor: '#f8faf8', boxShadow: '0 2px 6px rgba(22, 35, 31, 0.06)' }, '& input': { cursor: 'pointer' } }}
            />
            <Typography variant="body2" color="text.secondary" sx={{ minWidth: 20, textAlign: 'center' }}>ถึง</Typography>
            <TextField
              type="date"
              value={draftFilters.requestDateTo}
              onChange={(event) => setDraftFilters((prev) => ({ ...prev, requestDateTo: event.target.value }))}
              onClick={() => {
                const input = dateToInputRef.current as (HTMLInputElement & { showPicker?: () => void }) | null;
                input?.focus();
                input?.showPicker?.();
              }}
              inputRef={dateToInputRef}
              size="small"
              sx={{ flex: 1, '& .MuiOutlinedInput-root': { height: 40, cursor: 'pointer', borderRadius: 10, bgcolor: '#f8faf8', boxShadow: '0 2px 6px rgba(22, 35, 31, 0.06)' }, '& input': { cursor: 'pointer' } }}
            />
          </Box>
          <Box sx={{ display: 'flex', justifyContent: { xs: 'stretch', md: 'flex-end' } }}>
            <Button variant="contained" onClick={() => setAppliedFilters(draftFilters)} sx={{ height: 40, width: { xs: '100%', md: '120px' }, minWidth: '120px', borderRadius: 10, bgcolor: UI.accent, boxShadow: '0 4px 10px rgba(22, 35, 31, 0.14)', '&:hover': { bgcolor: '#10473f' } }}>
              ค้นหา
            </Button>
          </Box>
        </Box>

        <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
          ตรวจสอบรายละเอียดใบขอตัดก่อนอนุมัติหรือไม่อนุมัติ โดยกดปุ่ม <strong>รายละเอียด</strong> ในแต่ละแถว
        </Typography>

        <DataTable
          columns={columns}
          data={canApprove ? filteredRows : []}
          loading={loading}
          emptyMessage={canApprove ? 'ไม่มีรายการรออนุมัติขอตัดสต๊อก' : 'ไม่มีสิทธิ์เข้าถึงรายการอนุมัติ'}
          paperSx={{ borderRadius: 10, border: `1px solid ${UI.border}`, height: PR_MAIN_TABLE_HEIGHT, pb: `${PR_MAIN_TABLE_BOTTOM_PADDING}px`, boxShadow: UI.shadow, bgcolor: '#f9faf9' }}
          tableContainerSx={{ height: '100%', overflowX: 'auto', overflowY: 'auto', scrollbarGutter: 'stable' }}
          detachedHeader={!isMobile}
          stickyHeader={isMobile}
          headerCellSx={{ bgcolor: '#f3f5f4 !important', color: '#4a5451 !important', fontWeight: 700, fontSize: '15px', py: 0, verticalAlign: 'middle', borderBottom: `1px solid ${UI.border}` }}
          tableSx={{
            '& .MuiTable-root': { minWidth: { xs: 960, md: 960 }, tableLayout: 'fixed' },
            '& .MuiTableHead-root .MuiTableCell-root': { whiteSpace: 'nowrap' },
            '& .MuiTableBody-root .MuiTableCell-root': { py: 1.05, verticalAlign: 'middle', whiteSpace: 'normal', overflowWrap: 'anywhere', wordBreak: 'break-word', borderBottom: `1px solid ${UI.border}`, color: UI.text },
          }}
        />
      </Box>

      <StockIssueRequestDetailsDialog
        open={openDetails}
        mode="approval"
        data={selected}
        onClose={() => setOpenDetails(false)}
        onApprove={handleApprove}
        onReject={handleReject}
        actionLoading={actionLoading}
      />
    </Box>
  );
}
