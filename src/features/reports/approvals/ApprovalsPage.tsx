'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Box, Button, Chip, Typography } from '@mui/material';
import {
  AssignmentTurnedInOutlined,
  PendingActionsOutlined,
  Refresh as RefreshIcon,
  TodayOutlined,
  WarningAmberOutlined,
} from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import { AxiosError } from 'axios';
import { DataTable, type Column } from '@/components/common';
import { purchaseService } from '@/features/production/purchase/services/purchase.service';
import { PRDetailsDialog, PRFilters } from '@/features/production/purchase/components';
import type { ApprovalPendingItem, PurchaseFilterParams, PurchaseRequestResponse } from '@/features/production/purchase/types';
import { formatDateTime, toISODateString } from '@/lib/utils/date.util';
import { formatNumber } from '@/lib/utils/format.util';
import { getWorkflowStatusChipSx, toThaiWorkflowStatus } from '@/lib/utils/status.util';
import { PR_MAIN_TABLE_BOTTOM_PADDING, PR_MAIN_TABLE_HEIGHT } from '@/core/ui-patterns/pr-ui.constants';
import Swal from 'sweetalert2';

type ApprovalsPageProps = {
  initialPendingItems?: ApprovalPendingItem[];
};

type ApprovalPendingRow = ApprovalPendingItem & {
  documentNumber?: string;
  facilityName?: string;
  urgency?: string;
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

function toPrDisplayNumber(row: ApprovalPendingRow): string {
  const raw = (row.documentNumber ?? '').trim();
  if (/^PR\d{4,}$/i.test(raw)) {
    return raw;
  }

  const requested = new Date(row.requestedDate);
  const year = Number.isNaN(requested.getTime())
    ? new Date().getFullYear() % 100
    : requested.getFullYear() % 100;
  const month = Number.isNaN(requested.getTime())
    ? new Date().getMonth() + 1
    : requested.getMonth() + 1;
  const suffix = String(row.documentId).padStart(4, '0');
  return `PR${String(year).padStart(2, '0')}${String(month).padStart(2, '0')}${suffix}`;
}

export function ApprovalsPage({ initialPendingItems = [] }: ApprovalsPageProps) {
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
  const [pendingItems, setPendingItems] = useState<ApprovalPendingRow[]>(initialPendingItems);
  const [loading, setLoading] = useState(initialPendingItems.length === 0);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedRequest, setSelectedRequest] = useState<PurchaseRequestResponse | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const initialBootstrapSkippedRef = useRef(false);
  const [canApprove, setCanApprove] = useState(true);
  const [draftFilters, setDraftFilters] = useState<PurchaseFilterParams>(defaultFilters);
  const [appliedFilters, setAppliedFilters] = useState<PurchaseFilterParams>(defaultFilters);

  const loadPending = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await purchaseService.getPendingApprovals();
      const details = await Promise.allSettled(
        data.map(async (item) => purchaseService.getById(item.documentId)),
      );

      const detailMap = new Map<number, PurchaseRequestResponse>();
      details.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          detailMap.set(data[index].documentId, result.value);
        }
      });

      setPendingItems(
        data.map((item) => {
          const detail = detailMap.get(item.documentId);
          return {
            ...item,
            documentNumber: detail?.documentNumber,
            facilityName: detail?.facilityName,
            urgency: detail?.urgency,
          };
        }),
      );
      setCanApprove(true);
    } catch (err) {
      const axiosError = err as AxiosError<{ message?: string }>;
      if (axiosError.response?.status === 401 || axiosError.response?.status === 403) {
        setCanApprove(false);
        setPendingItems([]);
        return;
      }
      setCanApprove(true);
      setError(axiosError.response?.data?.message ?? 'ไม่สามารถโหลดรายการรออนุมัติได้');
    } finally {
      setLoading(false);
    }
  }, []);

  const handleOpenDetails = useCallback(async (item: ApprovalPendingRow) => {
    try {
      setError(null);
      const request = await purchaseService.getById(item.documentId);
      setSelectedRequest(request);
      setDetailOpen(true);
    } catch (err) {
      const axiosError = err as AxiosError<{ message?: string }>;
      setError(axiosError.response?.data?.message ?? 'ไม่สามารถโหลดรายละเอียด PR ได้');
    }
  }, []);

  const refreshSelected = useCallback(async () => {
    if (!selectedRequest) return;
    const latest = await purchaseService.getById(selectedRequest.id);
    setSelectedRequest(latest);
  }, [selectedRequest]);

  const handleApprove = useCallback(async (id: number, comment: string) => {
    const confirm = await Swal.fire({
      icon: 'question',
      title: 'ยืนยันการอนุมัติ',
      text: 'ต้องการอนุมัติเอกสาร PR นี้ใช่หรือไม่',
      showCancelButton: true,
      confirmButtonText: 'อนุมัติ',
      cancelButtonText: 'ยกเลิก',
      reverseButtons: true,
    });
    if (!confirm.isConfirmed) return;

    try {
      setActionLoading(true);
      await purchaseService.approve(id, comment);
      await Promise.all([loadPending(), refreshSelected()]);
      await Swal.fire({
        icon: 'success',
        title: 'อนุมัติเรียบร้อยแล้ว',
        timer: 1400,
        showConfirmButton: false,
      });
    } catch (err) {
      const axiosError = err as AxiosError<{ message?: string }>;
      await Swal.fire({
        icon: 'error',
        title: 'อนุมัติไม่สำเร็จ',
        text: axiosError.response?.data?.message ?? 'ไม่สามารถอนุมัติเอกสารได้',
      });
    } finally {
      setActionLoading(false);
    }
  }, [loadPending, refreshSelected]);

  const handleReturn = useCallback(async (id: number, comment: string) => {
    const confirm = await Swal.fire({
      icon: 'warning',
      title: 'ยืนยันการตีกลับ',
      text: 'ต้องการตีกลับเอกสาร PR นี้ใช่หรือไม่',
      showCancelButton: true,
      confirmButtonText: 'ยืนยันตีกลับ',
      cancelButtonText: 'ยกเลิก',
      reverseButtons: true,
    });
    if (!confirm.isConfirmed) return;

    try {
      setActionLoading(true);
      await purchaseService.returnForEdit(id, comment);
      await Promise.all([loadPending(), refreshSelected()]);
      await Swal.fire({
        icon: 'success',
        title: 'ตีกลับเอกสารเรียบร้อยแล้ว',
        timer: 1400,
        showConfirmButton: false,
      });
    } catch (err) {
      const axiosError = err as AxiosError<{ message?: string }>;
      await Swal.fire({
        icon: 'error',
        title: 'ตีกลับเอกสารไม่สำเร็จ',
        text: axiosError.response?.data?.message ?? 'ไม่สามารถตีกลับเอกสารได้',
      });
    } finally {
      setActionLoading(false);
    }
  }, [loadPending, refreshSelected]);

  const handleReject = useCallback(async (id: number, reason: string) => {
    const confirm = await Swal.fire({
      icon: 'warning',
      title: 'ยืนยันการไม่อนุมัติ',
      text: 'ต้องการไม่อนุมัติเอกสาร PR นี้ใช่หรือไม่',
      showCancelButton: true,
      confirmButtonText: 'ยืนยันไม่อนุมัติ',
      cancelButtonText: 'ยกเลิก',
      reverseButtons: true,
    });
    if (!confirm.isConfirmed) return;

    try {
      setActionLoading(true);
      await purchaseService.reject(id, reason);
      await Promise.all([loadPending(), refreshSelected()]);
      await Swal.fire({
        icon: 'success',
        title: 'ไม่อนุมัติเอกสารเรียบร้อยแล้ว',
        timer: 1400,
        showConfirmButton: false,
      });
    } catch (err) {
      const axiosError = err as AxiosError<{ message?: string }>;
      await Swal.fire({
        icon: 'error',
        title: 'ไม่อนุมัติเอกสารไม่สำเร็จ',
        text: axiosError.response?.data?.message ?? 'ไม่สามารถไม่อนุมัติเอกสารได้',
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

  const filteredItems = useMemo(() => {
    const normalizedKeyword = appliedFilters.searchTerm.trim().toLowerCase();
    return pendingItems.filter((row) => {
      if (appliedFilters.status && row.status !== appliedFilters.status) return false;
      const rowDate = row.requestedDate.slice(0, 10);
      if (appliedFilters.requestDateFrom && rowDate < appliedFilters.requestDateFrom) {
        return false;
      }
      if (appliedFilters.requestDateTo && rowDate > appliedFilters.requestDateTo) {
        return false;
      }
      if (!normalizedKeyword) return true;
      return (
        toPrDisplayNumber(row).toLowerCase().includes(normalizedKeyword) ||
        row.requesterName.toLowerCase().includes(normalizedKeyword) ||
        (row.facilityName ?? '').toLowerCase().includes(normalizedKeyword)
      );
    });
  }, [pendingItems, appliedFilters]);

  const summaryCards = useMemo(() => {
    const source = canApprove ? filteredItems : [];
    return [
      {
        key: 'all',
        title: 'รออนุมัติทั้งหมด',
        value: source.length,
        subtitle: 'งานรออนุมัติ',
        icon: <TodayOutlined sx={{ color: '#4a6982', fontSize: 20 }} />,
        iconBg: '#efe8da',
        bar: '#4a6982',
      },
      {
        key: 'urgent',
        title: 'ความเร่งด่วนสูง',
        value: source.filter((row) => row.urgency === 'Urgent').length,
        subtitle: 'Urgent',
        icon: <WarningAmberOutlined sx={{ color: '#d09100', fontSize: 20 }} />,
        iconBg: '#f2ead8',
        bar: '#d09100',
      },
      {
        key: 'high',
        title: 'ความเร่งด่วนกลาง',
        value: source.filter((row) => row.urgency === 'High').length,
        subtitle: 'High',
        icon: <PendingActionsOutlined sx={{ color: '#c85f00', fontSize: 20 }} />,
        iconBg: '#f8eadf',
        bar: '#c85f00',
      },
      {
        key: 'normal',
        title: 'ความเร่งด่วนปกติ',
        value: source.filter((row) => !row.urgency || row.urgency === 'Normal').length,
        subtitle: 'Normal',
        icon: <AssignmentTurnedInOutlined sx={{ color: '#2e7d32', fontSize: 20 }} />,
        iconBg: '#dfe9db',
        bar: '#2e7d32',
      },
    ];
  }, [canApprove, filteredItems]);

  const columns: Column<ApprovalPendingRow>[] = useMemo(() => [
    {
      id: 'documentNumber',
      label: 'เลขที่ PR',
      align: 'left',
      format: (_, row) => (
        <Typography variant="body2" fontWeight={600} textAlign="left">
          {toPrDisplayNumber(row)}
        </Typography>
      ),
    },
    {
      id: 'requesterName',
      label: 'ผู้ขอ',
      align: 'left',
    },
    {
      id: 'urgency',
      label: 'ความเร่งด่วน',
      align: 'center',
      format: (value) => {
        const urgency = (value as string) || 'Normal';
        return (
          <Chip
            size="small"
            label={urgency}
            color={urgency === 'Urgent' ? 'error' : urgency === 'High' ? 'warning' : 'default'}
          />
        );
      },
    },
    {
      id: 'requestedDate',
      label: 'วันที่',
      align: 'center',
      format: (value) => formatDateTime(value as string),
    },
    {
      id: 'status',
      label: 'สถานะ',
      align: 'center',
      format: (value) => <Chip size="small" sx={getWorkflowStatusChipSx(String(value))} label={toThaiWorkflowStatus(String(value))} />,
    },
  ], []);

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
        <Typography sx={{ fontSize: '2rem', fontWeight: 700, lineHeight: 1 }}>อนุมัติใบขอซื้อ (PR)</Typography>
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
                  {formatNumber(Number(card.value || 0))}
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
          <Typography sx={{ fontSize: 13, color: UI.muted, fontWeight: 700 }}>รายการอนุมัติ PR</Typography>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={loadPending}
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
            บัญชีนี้ไม่มีสิทธิ์อนุมัติ จึงไม่สามารถดูและดำเนินการอนุมัติ PR ได้
          </Alert>
        ) : null}

        {error ? (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        ) : null}

        <PRFilters
          filters={draftFilters}
          onChange={setDraftFilters}
          onSearch={setAppliedFilters}
        />

        <DataTable
          columns={columns}
          data={canApprove ? filteredItems : []}
          loading={loading}
          emptyMessage={canApprove ? 'ไม่มีรายการรออนุมัติ' : 'ไม่มีสิทธิ์เข้าถึงรายการอนุมัติ'}
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
              minWidth: { xs: 1030, md: 1030 },
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

      <PRDetailsDialog
        open={detailOpen}
        request={selectedRequest}
        onClose={() => setDetailOpen(false)}
        canTakeApprovalAction={canApprove}
        actionLoading={actionLoading}
        onApprove={handleApprove}
        onReturn={handleReturn}
        onReject={handleReject}
      />
    </Box>
  );
}
