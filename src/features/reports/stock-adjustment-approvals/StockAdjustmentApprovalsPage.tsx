'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Box, Button, Chip, Typography } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import { AxiosError } from 'axios';
import Swal from 'sweetalert2';
import { DataTable, type Column } from '@/components/common';
import { PRFilters } from '@/features/production/purchase/components';
import type { PurchaseFilterParams } from '@/features/production/purchase/types';
import { stockAdjustmentRequestService } from '@/features/production/stock/services/stock-adjustment-request.service';
import type { StockAdjustmentRequestResponse } from '@/features/production/stock/types';
import { StockAdjustmentRequestDetailsDialog } from '@/features/production/stock-adjustment-request/components/StockAdjustmentRequestDetailsDialog';
import { formatDateTime, toISODateString } from '@/lib/utils/date.util';
import { formatNumber } from '@/lib/utils/format.util';
import { getWorkflowStatusChipSx, toThaiWorkflowStatus } from '@/lib/utils/status.util';
import { PR_MAIN_TABLE_BOTTOM_PADDING, PR_MAIN_TABLE_HEIGHT } from '@/core/ui-patterns/pr-ui.constants';

type AdjustApprovalRow = StockAdjustmentRequestResponse & {
  facilityName?: string;
};

type StockAdjustmentApprovalsPageProps = {
  initialPendingItems?: AdjustApprovalRow[];
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

export function StockAdjustmentApprovalsPage({ initialPendingItems = [] }: StockAdjustmentApprovalsPageProps) {
  const today = new Date();
  const sevenDaysAgo = new Date(today);
  sevenDaysAgo.setDate(today.getDate() - 7);

  const defaultFilters: PurchaseFilterParams = {
    searchTerm: '',
    requestDateFrom: toISODateString(sevenDaysAgo),
    requestDateTo: toISODateString(today),
    status: '',
  };

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [rows, setRows] = useState<AdjustApprovalRow[]>(initialPendingItems);
  const [loading, setLoading] = useState(initialPendingItems.length === 0);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedRequest, setSelectedRequest] = useState<StockAdjustmentRequestResponse | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const initialBootstrapSkippedRef = useRef(false);
  const [canApprove, setCanApprove] = useState(true);
  const [draftFilters, setDraftFilters] = useState<PurchaseFilterParams>(defaultFilters);
  const [appliedFilters, setAppliedFilters] = useState<PurchaseFilterParams>(defaultFilters);

  const loadPending = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await stockAdjustmentRequestService.getPendingApprovals();
      setRows(data);
      setCanApprove(true);
    } catch (err) {
      const axiosError = err as AxiosError<{ message?: string }>;
      if (axiosError.response?.status === 401 || axiosError.response?.status === 403) {
        setCanApprove(false);
        setRows([]);
        return;
      }
      setCanApprove(true);
      setError(axiosError.response?.data?.message ?? 'ไม่สามารถโหลดรายการรออนุมัติปรับสต๊อกได้');
    } finally {
      setLoading(false);
    }
  }, []);

  const handleOpenDetails = useCallback(async (row: AdjustApprovalRow) => {
    try {
      setError(null);
      const request = await stockAdjustmentRequestService.getById(row.id);
      setSelectedRequest(request);
      setDetailOpen(true);
    } catch (err) {
      const axiosError = err as AxiosError<{ message?: string }>;
      setError(axiosError.response?.data?.message ?? 'ไม่สามารถโหลดรายละเอียดคำขอปรับสต๊อกได้');
    }
  }, []);

  const refreshSelected = useCallback(async () => {
    if (!selectedRequest) return;
    const latest = await stockAdjustmentRequestService.getById(selectedRequest.id);
    setSelectedRequest(latest);
  }, [selectedRequest]);

  const handleApprove = useCallback(async (id: number, comment: string) => {
    const confirm = await Swal.fire({
      icon: 'question',
      title: 'ยืนยันการอนุมัติ',
      text: 'ต้องการอนุมัติคำขอปรับสต๊อกนี้ใช่หรือไม่',
      showCancelButton: true,
      confirmButtonText: 'อนุมัติ',
      cancelButtonText: 'ยกเลิก',
      reverseButtons: true,
    });
    if (!confirm.isConfirmed) return;

    try {
      setActionLoading(true);
      await stockAdjustmentRequestService.approve(id, comment);
      setDetailOpen(false);
      await loadPending();
      await refreshSelected();
      await Swal.fire({
        icon: 'success',
        title: 'อนุมัติสำเร็จ',
        timer: 1200,
        showConfirmButton: false,
      });
    } catch (err) {
      const axiosError = err as AxiosError<{ message?: string }>;
      await Swal.fire({
        icon: 'error',
        title: 'อนุมัติไม่สำเร็จ',
        text: axiosError.response?.data?.message ?? 'กรุณาตรวจสอบข้อมูลอีกครั้ง',
      });
    } finally {
      setActionLoading(false);
    }
  }, [loadPending, refreshSelected]);

  const handleReject = useCallback(async (id: number, reason: string) => {
    const confirm = await Swal.fire({
      icon: 'warning',
      title: 'ยืนยันการไม่อนุมัติ',
      text: 'ต้องการไม่อนุมัติคำขอปรับสต๊อกนี้ใช่หรือไม่',
      showCancelButton: true,
      confirmButtonText: 'ยืนยันไม่อนุมัติ',
      cancelButtonText: 'ยกเลิก',
      reverseButtons: true,
    });
    if (!confirm.isConfirmed) return;

    try {
      setActionLoading(true);
      await stockAdjustmentRequestService.reject(id, reason);
      setDetailOpen(false);
      await loadPending();
      await refreshSelected();
      await Swal.fire({
        icon: 'success',
        title: 'ไม่อนุมัติสำเร็จ',
        timer: 1200,
        showConfirmButton: false,
      });
    } catch (err) {
      const axiosError = err as AxiosError<{ message?: string }>;
      await Swal.fire({
        icon: 'error',
        title: 'ดำเนินการไม่สำเร็จ',
        text: axiosError.response?.data?.message ?? 'กรุณาตรวจสอบข้อมูลอีกครั้ง',
      });
    } finally {
      setActionLoading(false);
    }
  }, [loadPending, refreshSelected]);

  useEffect(() => {
    if (!initialBootstrapSkippedRef.current && initialPendingItems.length > 0) {
      initialBootstrapSkippedRef.current = true;
      return;
    }
    void loadPending();
  }, [initialPendingItems.length, loadPending]);

  const filteredRows = useMemo(() => {
    const keyword = appliedFilters.searchTerm.trim().toLowerCase();
    return rows.filter((row) => {
      const rowDate = row.requestDate.slice(0, 10);
      if (appliedFilters.requestDateFrom && rowDate < appliedFilters.requestDateFrom) return false;
      if (appliedFilters.requestDateTo && rowDate > appliedFilters.requestDateTo) return false;
      if (appliedFilters.status && row.status !== appliedFilters.status) return false;
      if (!keyword) return true;
      return (
        row.documentNumber.toLowerCase().includes(keyword) ||
        row.requesterName.toLowerCase().includes(keyword) ||
        row.facilityName.toLowerCase().includes(keyword)
      );
    }).sort((left, right) => right.requestDate.localeCompare(left.requestDate) || right.id - left.id);
  }, [appliedFilters, rows]);

  const summaryCards = useMemo(() => {
    const source = canApprove ? filteredRows : [];
    return [
      {
        key: 'pending',
        title: 'รออนุมัติทั้งหมด',
        value: source.length,
        subtitle: 'งานรออนุมัติ',
        icon: <Typography sx={{ fontSize: 20, color: '#d09100' }}>⏳</Typography>,
        iconBg: '#f2ead8',
        bar: '#d09100',
      },
      {
        key: 'facility',
        title: 'ฟาร์มที่มีคำขอ',
        value: new Set(source.map((row) => row.facilityId)).size,
        subtitle: 'จำนวนฟาร์ม',
        icon: <Typography sx={{ fontSize: 20, color: '#4a6982' }}>▣</Typography>,
        iconBg: '#efe8da',
        bar: '#4a6982',
      },
      {
        key: 'requester',
        title: 'ผู้ขอที่ไม่ซ้ำ',
        value: new Set(source.map((row) => row.requesterId)).size,
        subtitle: 'จำนวนผู้ขอ',
        icon: <Typography sx={{ fontSize: 20, color: '#2e7d32' }}>✓</Typography>,
        iconBg: '#dfe9db',
        bar: '#2e7d32',
      },
      {
        key: 'diff',
        title: 'มูลค่า Diff รวม',
        value: source.reduce((sum, row) => sum + Number(row.totalDeltaValue ?? 0), 0),
        subtitle: 'ยอด snapshot เพื่อคำนวณต้นทุน',
        icon: <Typography sx={{ fontSize: 20, color: '#7c5ce5' }}>฿</Typography>,
        iconBg: '#e4ddf4',
        bar: '#7c5ce5',
      },
    ];
  }, [canApprove, filteredRows]);

  const columns: Column<AdjustApprovalRow>[] = useMemo(() => [
    {
      id: 'documentNumber',
      label: 'เลขที่เอกสาร',
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
      format: (value) => formatDateTime(String(value)),
    },
    { id: 'requesterName', label: 'ผู้ขอ', align: 'left', minWidth: 180 },
    { id: 'facilityName', label: 'ฟาร์ม', align: 'left', minWidth: 180 },
    {
      id: 'totalDeltaValue',
      label: 'มูลค่า Diff',
      align: 'right',
      minWidth: 140,
      format: (value) => formatNumber(Number(value ?? 0), 2),
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
  ], [handleOpenDetails]);

  return (
    <Box sx={{ p: { xs: 1.5, md: 2 }, bgcolor: UI.panel }}>
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
          flexWrap: 'wrap',
          gap: 1,
        }}
      >
        <Typography sx={{ fontSize: '2rem', fontWeight: 700, lineHeight: 1 }}>อนุมัติใบขอปรับสต๊อก</Typography>
        <Typography sx={{ fontSize: '1rem', color: 'rgba(255,255,255,0.85)' }}>
          Dashboard / อนุมัติใบขอปรับสต๊อก
        </Typography>
      </Box>

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr 1fr', md: 'repeat(4, minmax(0,1fr))' }, gap: 1.5, mb: 2 }}>
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
                  {typeof card.value === 'number' ? formatNumber(card.value) : card.value}
                </Typography>
                <Typography sx={{ fontSize: '0.95rem', color: UI.muted, mt: 0.35 }}>
                  {card.title}
                </Typography>
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
          <Typography sx={{ fontSize: 13, color: UI.muted, fontWeight: 700 }}>รายการอนุมัติใบขอปรับสต๊อก</Typography>
          <Button
            variant="outlined"
            onClick={() => void loadPending()}
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

        {!canApprove ? (
          <Alert severity="warning" sx={{ mb: 2 }}>
            บัญชีนี้ไม่มีสิทธิ์อนุมัติ จึงไม่สามารถดูและดำเนินการอนุมัติใบขอปรับสต๊อกได้
          </Alert>
        ) : null}

        {error ? (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        ) : null}

        <PRFilters filters={draftFilters} onChange={setDraftFilters} onSearch={setAppliedFilters} />

        <DataTable
          columns={columns}
          data={canApprove ? filteredRows : []}
          loading={loading}
          emptyMessage={canApprove ? 'ไม่มีรายการรออนุมัติปรับสต๊อก' : 'ไม่มีสิทธิ์เข้าถึงรายการอนุมัติ'}
          onRowDoubleClick={handleOpenDetails}
          paperSx={{
            borderRadius: '14px',
            border: `1px solid ${UI.border}`,
            height: PR_MAIN_TABLE_HEIGHT,
            pb: `${PR_MAIN_TABLE_BOTTOM_PADDING}px`,
            boxShadow: UI.softShadow,
            bgcolor: '#f9faf9',
          }}
          tableContainerSx={{ height: '100%', overflowX: 'auto', overflowY: 'auto', scrollbarGutter: 'stable' }}
          detachedHeader={!isMobile}
          stickyHeader={isMobile}
          headerCellSx={{
            bgcolor: '#f3f5f4 !important',
            color: '#4a5451 !important',
            fontWeight: 700,
            fontSize: '15px',
            py: 0,
            verticalAlign: 'middle',
            borderBottom: `1px solid ${UI.border}`,
          }}
          tableSx={{
            '& .MuiTable-root': {
              minWidth: { xs: 960, md: 960 },
              tableLayout: 'fixed',
            },
            '& .MuiTableHead-root .MuiTableCell-root': {
              whiteSpace: 'nowrap',
              overflowWrap: 'normal',
              wordBreak: 'normal',
            },
            '& .MuiTableBody-root .MuiTableCell-root': {
              py: 1.05,
              verticalAlign: 'middle',
              whiteSpace: 'normal',
              overflowWrap: 'anywhere',
              wordBreak: 'break-word',
              borderBottom: `1px solid ${UI.border}`,
              color: UI.text,
            },
          }}
        />
      </Box>

      <StockAdjustmentRequestDetailsDialog
        open={detailOpen}
        request={selectedRequest}
        onClose={() => setDetailOpen(false)}
        canTakeApprovalAction={canApprove}
        actionLoading={actionLoading}
        onApprove={handleApprove}
        onReject={handleReject}
      />
    </Box>
  );
}
