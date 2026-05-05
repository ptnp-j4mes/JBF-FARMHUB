'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import axios from 'axios';
import {
  Alert,
  Box,
  Chip,
  InputAdornment,
  MenuItem,
  Paper,
  TextField,
  Typography,
} from '@mui/material';
import {
  Add as AddIcon,
  Refresh as RefreshIcon,
  Search as SearchIcon,
  ReceiptLongOutlined,
  PendingActionsOutlined,
  TaskAltOutlined,
  CheckCircleOutlineOutlined,
} from '@mui/icons-material';
import Swal from 'sweetalert2';
import { DataTable, QuickStatusButtonGroup, type Column } from '@/components/common';
import { StockActionButton } from '@/features/production/stock/components/StockActionButton';
import { stockIssueRequestService } from './services/stock-issue-request.service';
import { notifyStockIssueRequestsChanged } from './stock-issue-request.events';
import type {
  CreateStockIssueRequestPayload,
  StockIssueRequestCreateOptionsResponse,
  StockIssueRequestResponse,
} from './types/stock-issue-request.types';
import { CreateStockIssueRequestDialog } from './components/CreateStockIssueRequestDialog';
import { StockIssueRequestDetailsDialog } from './components/StockIssueRequestDetailsDialog';
import { formatDateShort, toISODateString } from '@/lib/utils/date.util';
import { formatNumber } from '@/lib/utils/format.util';
import { toThaiWorkflowStatus, getWorkflowStatusChipSx } from '@/lib/utils/status.util';
import { useTheme, alpha } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import { PR_MAIN_TABLE_BOTTOM_PADDING, PR_MAIN_TABLE_HEIGHT } from '@/core/ui-patterns/pr-ui.constants';
import {
  FACILITY_CHANGED_EVENT,
  getCurrentFacilityCode,
  getCurrentFacilityId,
} from '@/lib/facility-context';
import {
  canManageWarehouseIssueRequests,
  canViewWarehouseIssueRequests,
} from '@/lib/access/modules/warehouse.guard';

type StockIssueRequestFilterParams = {
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
  { value: 'Completed', label: toThaiWorkflowStatus('Completed') },
  { value: 'Cancelled', label: toThaiWorkflowStatus('Cancelled') },
];

const UI = {
  panel: '#ffffff',
  panelSoft: '#f8faf8',
  panelMuted: '#f2f6f3',
  border: '#dde2de',
  borderStrong: '#cad4cf',
  text: '#2f3a37',
  muted: '#7d8783',
  accent: 'rgb(22, 90, 80)',
  accentSurface: '#edf5f1',
  shadow: '0 18px 40px rgba(22, 35, 31, 0.08), 0 3px 10px rgba(22, 35, 31, 0.05)',
  shadowSoft: '0 10px 24px rgba(22, 35, 31, 0.06), 0 2px 6px rgba(22, 35, 31, 0.04)',
};

const panelSx = {
  borderRadius: 3.5,
  border: `1px solid ${UI.border}`,
  bgcolor: UI.panel,
  boxShadow: UI.shadow,
};

export function StockIssueRequestPage() {
  const canViewIssue = canViewWarehouseIssueRequests();
  const canManageIssue = canManageWarehouseIssueRequests();

  const today = toISODateString(new Date());
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [rows, setRows] = useState<StockIssueRequestResponse[]>([]);
  const [options, setOptions] = useState<StockIssueRequestCreateOptionsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [dialogLoading, setDialogLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [openCreate, setOpenCreate] = useState(false);
  const [selected, setSelected] = useState<StockIssueRequestResponse | null>(null);
  const [openDetails, setOpenDetails] = useState(false);
  const [currentFacilityId, setCurrentFacilityId] = useState<number | null>(
    () => getCurrentFacilityId(),
  );
  const [currentFacilityCode, setCurrentFacilityCode] = useState<string | null>(
    () => getCurrentFacilityCode(),
  );
  const initialBootstrapSkippedRef = useRef(false);
  const dateFromInputRef = useRef<HTMLInputElement | null>(null);
  const dateToInputRef = useRef<HTMLInputElement | null>(null);
  const [draftFilters, setDraftFilters] = useState<StockIssueRequestFilterParams>({
    searchTerm: '',
    requestDateFrom: today,
    requestDateTo: today,
    status: '',
  });
  const [appliedFilters, setAppliedFilters] = useState<StockIssueRequestFilterParams>({
    searchTerm: '',
    requestDateFrom: today,
    requestDateTo: today,
    status: '',
  });

  const loadPage = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const requestRowsPromise = stockIssueRequestService.getMy({
        facilityId: currentFacilityId ?? undefined,
        facilityCode: currentFacilityCode ?? undefined,
      });
      const createOptionsPromise = canManageIssue
        ? stockIssueRequestService.getCreateOptions({
          facilityId: currentFacilityId ?? undefined,
          facilityCode: currentFacilityCode ?? undefined,
        })
        : Promise.resolve(null);
      const [requestRows, createOptions] = await Promise.all([
        requestRowsPromise,
        createOptionsPromise,
      ]);
      setRows(requestRows);
      setOptions(createOptions);
    } catch (err) {
      console.error(err);
      setError('ไม่สามารถโหลดข้อมูลใบขอตัดสต๊อกได้');
    } finally {
      setLoading(false);
    }
  }, [canManageIssue, currentFacilityCode, currentFacilityId]);

  useEffect(() => {
    setCurrentFacilityId(getCurrentFacilityId());
    setCurrentFacilityCode(getCurrentFacilityCode());
    const onFacilityChanged = () => {
      setCurrentFacilityId(getCurrentFacilityId());
      setCurrentFacilityCode(getCurrentFacilityCode());
    };
    window.addEventListener(FACILITY_CHANGED_EVENT, onFacilityChanged);
    return () => window.removeEventListener(FACILITY_CHANGED_EVENT, onFacilityChanged);
  }, []);

  useEffect(() => {
    if (!initialBootstrapSkippedRef.current && rows.length > 0) {
      initialBootstrapSkippedRef.current = true;
      return;
    }
    void loadPage();
  }, [loadPage]);

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
        row.requestorName.toLowerCase().includes(keyword) ||
        row.facilityName.toLowerCase().includes(keyword)
      );
    });
  }, [appliedFilters, rows]);

  const displayedRows = useMemo(() => {
    const statusPriority: Record<string, number> = {
      Pending: 4,
      Approved: 3,
      Completed: 2,
      Rejected: 1,
      Cancelled: 0,
    };

    return [...filteredRows].sort((left, right) => {
      const statusDiff = (statusPriority[right.status] ?? 0) - (statusPriority[left.status] ?? 0);
      if (statusDiff !== 0) return statusDiff;
      const dateDiff = right.requestDate.localeCompare(left.requestDate);
      if (dateDiff !== 0) return dateDiff;
      return right.id - left.id;
    });
  }, [filteredRows]);

  const quickStatuses = useMemo(() => {
    const count = (status: string) => displayedRows.filter((row) => String(row.status) === status).length;
    return [
      { label: 'ทั้งหมด', value: '', count: displayedRows.length },
      { label: toThaiWorkflowStatus('Pending'), value: 'Pending', count: count('Pending') },
      { label: toThaiWorkflowStatus('Approved'), value: 'Approved', count: count('Approved') },
      { label: toThaiWorkflowStatus('Completed'), value: 'Completed', count: count('Completed') },
      { label: toThaiWorkflowStatus('Rejected'), value: 'Rejected', count: count('Rejected') },
      { label: toThaiWorkflowStatus('Cancelled'), value: 'Cancelled', count: count('Cancelled') },
    ];
  }, [displayedRows]);

  const summaryCards = useMemo(
    () => [
      {
        key: 'total',
        title: 'ใบขอตัดทั้งหมด',
        value: rows.length,
        subtitle: 'จำนวนเอกสารทั้งหมด',
        icon: <ReceiptLongOutlined sx={{ color: '#4a6982', fontSize: 20 }} />,
        iconBg: '#efe8da',
        bar: '#4a6982',
      },
      {
        key: 'pending',
        title: 'รออนุมัติ',
        value: rows.filter((row) => row.status === 'Pending').length,
        subtitle: 'สถานะ Pending',
        icon: <PendingActionsOutlined sx={{ color: '#d09100', fontSize: 20 }} />,
        iconBg: '#f2ead8',
        bar: '#d09100',
      },
      {
        key: 'approved',
        title: 'อนุมัติแล้ว',
        value: rows.filter((row) => row.status === 'Approved').length,
        subtitle: 'พร้อมส่งเข้าคลัง',
        icon: <TaskAltOutlined sx={{ color: '#2e7d32', fontSize: 20 }} />,
        iconBg: '#dfe9db',
        bar: '#2e7d32',
      },
      {
        key: 'completed',
        title: 'ตัดจริงแล้ว',
        value: rows.filter((row) => row.status === 'Completed').length,
        subtitle: 'สถานะ Completed',
        icon: <CheckCircleOutlineOutlined sx={{ color: '#7c5ce5', fontSize: 20 }} />,
        iconBg: '#e4ddf4',
        bar: '#7c5ce5',
      },
    ],
    [rows],
  );

  const columns: Column<StockIssueRequestResponse>[] = [
    {
      id: 'documentNumber',
      label: 'เลขที่ใบขอ',
      align: 'left',
      minWidth: 132,
      width: 132,
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
      minWidth: 110,
      width: 110,
      format: (value) => formatDateShort(String(value)),
    },
    { id: 'requestorName', label: 'ผู้ขอ', align: 'left', minWidth: 130, width: 130 },
    { id: 'facilityName', label: 'คลังต้นทาง', align: 'left', minWidth: 170, width: 170 },
    {
      id: 'sourcePurchaseRequestNumber',
      label: 'PR ต้นทาง',
      align: 'left',
      minWidth: 150,
      width: 150,
      format: (value) => String(value || '-'),
    },
    {
      id: 'usageZone',
      label: 'ฟาร์มปลายทาง',
      align: 'center',
      minWidth: 160,
      width: 160,
      format: (value) => String(value || '-'),
    },
    {
      id: 'usageHouseName',
      label: 'โรงเรือน',
      align: 'left',
      minWidth: 138,
      width: 138,
      format: (value) => String(value || '-'),
    },
    {
      id: 'status',
      label: 'สถานะ',
      align: 'center',
      minWidth: 118,
      width: 118,
      format: (value) => (
        <Chip size="small" label={toThaiWorkflowStatus(String(value))} sx={getWorkflowStatusChipSx(String(value))} />
      ),
    },
  ];

  const handleFilterChange = useCallback((next: Partial<StockIssueRequestFilterParams>) => {
    setDraftFilters((prev) => ({ ...prev, ...next }));
  }, []);

  const handleFilterSearch = useCallback(() => {
    setAppliedFilters(draftFilters);
  }, [draftFilters]);

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

  const handleCreate = useCallback(async (payload: CreateStockIssueRequestPayload) => {
    try {
      setDialogLoading(true);
      await stockIssueRequestService.create(payload);
      setOpenCreate(false);
      await loadPage();
      notifyStockIssueRequestsChanged();
      await Swal.fire({ icon: 'success', title: 'สร้างใบขอตัดสต๊อกสำเร็จ', timer: 1200, showConfirmButton: false });
    } catch (err) {
      const rawErrorData = axios.isAxiosError(err) ? err.response?.data : null;
      const errorMessage = (() => {
        if (!axios.isAxiosError(err)) return 'กรุณาตรวจสอบข้อมูลอีกครั้ง';
        if (typeof rawErrorData === 'string' && rawErrorData.trim()) return rawErrorData;
        if (rawErrorData && typeof rawErrorData === 'object') {
          const maybeMessage = (rawErrorData as { message?: string }).message;
          if (maybeMessage) return maybeMessage;
          try {
            return JSON.stringify(rawErrorData);
          } catch {
            return 'กรุณาตรวจสอบข้อมูลอีกครั้ง';
          }
        }
        return 'กรุณาตรวจสอบข้อมูลอีกครั้ง';
      })();
      await Swal.fire({ icon: 'error', title: 'สร้างใบขอตัดไม่สำเร็จ', text: errorMessage });
    } finally {
      setDialogLoading(false);
    }
  }, [loadPage]);

  if (!canViewIssue) {
    return (
      <Box sx={{ p: { xs: 1.5, md: 2 }, bgcolor: UI.bg }}>
        <Alert severity="warning">คุณไม่มีสิทธิ์เข้าถึงหน้าขอตัดสต๊อก</Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: { xs: 1.5, md: 2 }, bgcolor: UI.bg }}>
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
            label="Stock Issue Request"
            sx={{ bgcolor: '#fff', color: UI.accent, fontWeight: 800, border: `1px solid ${UI.borderStrong}`, height: 28 }}
          />
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 1.5, flexWrap: 'wrap' }}>
          <Box>
            <Typography sx={{ fontSize: { xs: '1.9rem', md: '2.35rem' }, fontWeight: 900, lineHeight: 1.02, color: UI.text, letterSpacing: '-0.03em' }}>
              ใบขอตัดสต๊อก
            </Typography>
          </Box>
          <Typography sx={{ fontSize: '0.95rem', color: UI.muted, fontWeight: 700 }}>
            Dashboard / ใบขอตัดสต๊อก
          </Typography>
        </Box>
      </Box>

      <Box
        sx={{
          mb: 2,
          display: 'grid',
          gap: 1.5,
          gridTemplateColumns: { xs: '1fr', sm: 'repeat(2,1fr)', lg: 'repeat(4,1fr)' },
        }}
      >
        {summaryCards.map((card) => (
          <Paper
            key={card.key}
            variant="outlined"
            sx={{
              ...panelSx,
              position: 'relative',
              overflow: 'hidden',
              borderColor: UI.border,
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
            <Box sx={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 1 }}>
              <Box>
                <Typography sx={{ fontSize: '2.1rem', fontWeight: 700, color: '#1d2624', lineHeight: 1 }}>
                  {formatNumber(card.value)}
                </Typography>
                <Typography sx={{ fontSize: '1rem', color: UI.text, fontWeight: 800, mt: 0.55 }}>
                  {card.title}
                </Typography>
              </Box>
              <Box
                sx={{
                  width: 46,
                  height: 46,
                  borderRadius: 2,
                  bgcolor: '#fff',
                  border: `1px solid ${alpha(card.bar, 0.15)}`,
                  boxShadow: UI.shadowSoft,
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {card.icon}
              </Box>
            </Box>
            <Typography sx={{ position: 'relative', zIndex: 1, fontSize: '0.8rem', color: UI.muted }}>{card.subtitle}</Typography>
            <Box sx={{ position: 'relative', zIndex: 1, mt: 1.8, width: 108, height: 8, borderRadius: 999, bgcolor: '#e7ece8' }}>
              <Box sx={{ width: 54, height: '100%', bgcolor: card.bar, borderRadius: 999 }} />
            </Box>
          </Paper>
        ))}
      </Box>

      <Box
        sx={{
          ...panelSx,
          mb: 2,
          p: { xs: 1.25, md: 1.5 },
          display: 'flex',
          justifyContent: 'flex-start',
          gap: 1,
          flexWrap: 'wrap',
        }}
      >
        {canManageIssue && (
          <StockActionButton tone="success" startIcon={<AddIcon />} onClick={() => setOpenCreate(true)}>
            สร้างใบขอตัด
          </StockActionButton>
        )}

      </Box>

      <Box
        sx={{
          ...panelSx,
          p: { xs: 1.5, md: 2 },
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1.5, mb: 1.6, flexWrap: 'wrap' }}>
          <QuickStatusButtonGroup
            items={quickStatuses}
            selectedValue={appliedFilters.status || ''}
            onChange={(value) => {
              const next = { ...draftFilters, status: value };
              setDraftFilters(next);
              setAppliedFilters(next);
            }}
          />
          <Box />
        </Box>

        <Box
          sx={{
            mb: 1.6,
            display: 'grid',
            gap: 1.2,
            gridTemplateColumns: {
              xs: '1fr',
              sm: '1fr 1fr',
              md: 'minmax(280px,1fr) 170px minmax(220px,1.1fr) auto',
            },
            alignItems: 'center',
          }}
        >
          <TextField
            placeholder="Search..."
            value={draftFilters.searchTerm}
            onChange={(event) => handleFilterChange({ searchTerm: event.target.value })}
            size="small"
            sx={{
              width: '100%',
              '& .MuiOutlinedInput-root': {
                height: 40,
                borderRadius: 2,
                bgcolor: UI.panelSoft,
                boxShadow: UI.shadowSoft,
              },
            }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ color: '#8d9592' }} />
                </InputAdornment>
              ),
            }}
          />
          <TextField
            select
            placeholder="สถานะ"
            value={draftFilters.status}
            onChange={(event) => handleFilterChange({ status: event.target.value })}
            size="small"
            SelectProps={{
              displayEmpty: true,
              renderValue: (value) => (value ? String(value) : 'สถานะ'),
            }}
            sx={{
              '& .MuiOutlinedInput-root': {
                height: 40,
                borderRadius: 2,
                bgcolor: UI.panelSoft,
                boxShadow: UI.shadowSoft,
              },
              '& .MuiSelect-select': {
                color: draftFilters.status ? 'inherit' : 'text.secondary',
              },
            }}
          >
            {statusOptions.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </TextField>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <TextField
              type="date"
              value={draftFilters.requestDateFrom}
              onChange={(event) => handleFilterChange({ requestDateFrom: event.target.value })}
              onClick={() => {
                const input = dateFromInputRef.current as (HTMLInputElement & { showPicker?: () => void }) | null;
                input?.focus();
                input?.showPicker?.();
              }}
              inputRef={dateFromInputRef}
              size="small"
              sx={{
                flex: 1,
                '& .MuiOutlinedInput-root': {
                  height: 40,
                  borderRadius: 2,
                  bgcolor: UI.panelSoft,
                  boxShadow: UI.shadowSoft,
                  cursor: 'pointer',
                },
                '& input': { cursor: 'pointer' },
              }}
            />
            <Typography sx={{ minWidth: 20, textAlign: 'center', color: UI.muted }}>ถึง</Typography>
            <TextField
              type="date"
              value={draftFilters.requestDateTo}
              onChange={(event) => handleFilterChange({ requestDateTo: event.target.value })}
              onClick={() => {
                const input = dateToInputRef.current as (HTMLInputElement & { showPicker?: () => void }) | null;
                input?.focus();
                input?.showPicker?.();
              }}
              inputRef={dateToInputRef}
              size="small"
              sx={{
                flex: 1,
                '& .MuiOutlinedInput-root': {
                  height: 40,
                  borderRadius: 2,
                  bgcolor: UI.panelSoft,
                  boxShadow: UI.shadowSoft,
                  cursor: 'pointer',
                },
                '& input': { cursor: 'pointer' },
              }}
            />
          </Box>
          <StockActionButton tone="primary" onClick={handleFilterSearch}>
            ค้นหา
          </StockActionButton>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}
        <Typography variant="caption" sx={{ display: 'block', mb: 1, textAlign: 'right', color: '#c13e3e' }}>
          *ดับเบิลคลิกที่แถวเพื่อดูรายละเอียดเพิ่มเติม
        </Typography>

        <DataTable
          columns={columns}
          data={displayedRows}
          loading={loading}
          emptyMessage="ยังไม่มีใบขอตัดสต๊อก"
          onRowDoubleClick={handleOpenDetails}
          paperSx={{
            borderRadius: '18px',
            border: `1px solid ${UI.border}`,
            height: PR_MAIN_TABLE_HEIGHT,
            pb: `${PR_MAIN_TABLE_BOTTOM_PADDING}px`,
            boxShadow: UI.shadow,
            bgcolor: UI.panelSoft,
          }}
          tableContainerSx={{
            overflowX: 'auto',
            overflowY: 'auto',
            scrollbarGutter: 'stable',
          }}
          detachedHeader={!isMobile}
          stickyHeader={isMobile}
          headerCellSx={{
            bgcolor: `${UI.panelMuted} !important`,
            color: '#4a5451 !important',
            fontWeight: 800,
            fontSize: '15px',
            py: 0,
            textAlign: 'center !important',
            verticalAlign: 'middle',
            borderBottom: `1px solid ${UI.border}`,
          }}
          tableSx={{
            '& .MuiTable-root': {
              minWidth: { xs: 886, md: 886 },
              tableLayout: 'fixed',
            },
            '& .MuiTableBody-root .MuiTableCell-root': {
              whiteSpace: 'normal',
              overflowWrap: 'anywhere',
              wordBreak: 'break-word',
              py: 1.05,
              verticalAlign: 'middle',
              borderBottom: `1px solid ${UI.border}`,
              color: UI.text,
            },
            '& .MuiTableHead-root .MuiTableCell-root': {
              whiteSpace: 'nowrap',
              overflowWrap: 'normal',
              wordBreak: 'normal',
            },
          }}
        />
      </Box>

      <CreateStockIssueRequestDialog
        open={openCreate}
        options={options}
        currentFacilityId={currentFacilityId}
        loading={dialogLoading}
        onClose={() => setOpenCreate(false)}
        onSubmit={handleCreate}
      />

      <StockIssueRequestDetailsDialog
        open={openDetails}
        mode="view"
        data={selected}
        onClose={() => setOpenDetails(false)}
      />
    </Box>
  );
}
