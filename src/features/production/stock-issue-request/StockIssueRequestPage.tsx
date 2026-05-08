'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import axios from 'axios';
import {
  Alert,
  Box,
  Button,
  Grid,
  Stack,
  Typography,
} from '@mui/material';
import {
  Add as AddIcon,
  Refresh as RefreshIcon,
  ReceiptLongOutlined,
  PendingActionsOutlined,
  TaskAltOutlined,
  CheckCircleOutlineOutlined,
} from '@mui/icons-material';
import Swal from 'sweetalert2';
import { StatsCard, QuickStatusButtonGroup } from '@/components/common';
import { WorkspaceHeader } from '@/design-system';
import {
  CreateStockIssueRequestDialog,
  StockIssueRequestDetailsDialog,
  StockIssueRequestFilters,
  StockIssueRequestTable,
} from './components';
import { stockIssueRequestService } from './services/stock-issue-request.service';
import { notifyStockIssueRequestsChanged } from './stock-issue-request.events';
import type {
  CreateStockIssueRequestPayload,
  StockIssueRequestCreateOptionsResponse,
  StockIssueRequestResponse,
} from './types/stock-issue-request.types';
import { toISODateString } from '@/lib/utils/date.util';
import { toThaiWorkflowStatus } from '@/lib/utils/status.util';
import {
  FACILITY_CHANGED_EVENT,
  getCurrentFacilityCode,
  getCurrentFacilityId,
} from '@/lib/facility-context';
import {
  canManageWarehouseIssueRequests,
  canViewWarehouseIssueRequests,
} from '@/lib/access/modules/warehouse.guard';

const panelSx = {
  borderRadius: 3.5,
  border: '1px solid',
  borderColor: 'divider',
  bgcolor: 'background.paper',
  boxShadow: 2,
};

export function StockIssueRequestPage() {
  const canViewIssue = canViewWarehouseIssueRequests();
  const canManageIssue = canManageWarehouseIssueRequests();

  const today = toISODateString(new Date());
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

  // Filter state — single source of truth (applies immediately)
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [dateFrom, setDateFrom] = useState(today);
  const [dateTo, setDateTo] = useState(today);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);

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

  // Reset page on filter changes
  useEffect(() => {
    setPage(0);
  }, [searchTerm, statusFilter, dateFrom, dateTo]);

  const filteredRows = useMemo(() => {
    const keyword = searchTerm.trim().toLowerCase();
    return rows.filter((row) => {
      const rowDate = row.requestDate.slice(0, 10);
      if (dateFrom && rowDate < dateFrom) return false;
      if (dateTo && rowDate > dateTo) return false;
      if (statusFilter && row.status !== statusFilter) return false;
      if (!keyword) return true;
      return (
        row.documentNumber.toLowerCase().includes(keyword) ||
        row.requestorName.toLowerCase().includes(keyword) ||
        row.facilityName.toLowerCase().includes(keyword)
      );
    });
  }, [searchTerm, statusFilter, dateFrom, dateTo, rows]);

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

  const handleClearFilters = useCallback(() => {
    setSearchTerm('');
    setStatusFilter('');
    setDateFrom(today);
    setDateTo(today);
    setPage(0);
  }, [today]);

  if (!canViewIssue) {
    return (
      <Box sx={{ p: { xs: 1, md: 2 } }}>
        <Alert severity="warning">คุณไม่มีสิทธิ์เข้าถึงหน้าขอตัดสต๊อก</Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 1400, mx: 'auto', p: { xs: 1, md: 2 } }}>
      <WorkspaceHeader
        chipLabel="Stock Issue Request"
        title="ใบขอตัดสต๊อก"
        meta="Warehouse / ใบขอตัดสต๊อก"
      />

      <Stack spacing={2.5}>
        {/* Stats Cards */}
        <Box>
          <Grid container spacing={1.5}>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <StatsCard
                title="ใบขอตัดทั้งหมด"
                value={rows.length}
                subtitle="จำนวนเอกสารทั้งหมด"
                icon={<ReceiptLongOutlined />}
                color="info"
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <StatsCard
                title="รออนุมัติ"
                value={rows.filter((r) => r.status === 'Pending').length}
                subtitle="สถานะ Pending"
                icon={<PendingActionsOutlined />}
                color="warning"
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <StatsCard
                title="อนุมัติแล้ว"
                value={rows.filter((r) => r.status === 'Approved').length}
                subtitle="พร้อมส่งเข้าคลัง"
                icon={<TaskAltOutlined />}
                color="success"
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <StatsCard
                title="ตัดจริงแล้ว"
                value={rows.filter((r) => r.status === 'Completed').length}
                subtitle="สถานะ Completed"
                icon={<CheckCircleOutlineOutlined />}
                color="primary"
              />
            </Grid>
          </Grid>
        </Box>

        {/* Content Panel */}
        <Box sx={{ ...panelSx, p: 1.5 }}>
          <Stack spacing={1.5}>
            {/* Action Buttons */}
            <Box
              sx={{
                ...panelSx,
                p: { xs: 1.25, md: 1.5 },
                display: 'flex',
                justifyContent: 'flex-start',
                gap: 1,
                flexWrap: 'wrap',
                minHeight: 64,
                alignItems: 'center',
              }}
            >
              {canManageIssue && (
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={() => setOpenCreate(true)}
                  sx={{
                    borderRadius: 2.2,
                    bgcolor: 'primary.main',
                    boxShadow: 1,
                    '&:hover': { bgcolor: 'primary.dark' },
                  }}
                >
                  สร้างใบขอตัด
                </Button>
              )}
              <Button
                variant="outlined"
                startIcon={<RefreshIcon />}
                onClick={() => {
                  setPage(0);
                  void loadPage();
                }}
                sx={{
                  borderRadius: 2.2,
                  bgcolor: 'background.paper',
                  borderColor: 'divider',
                  color: 'text.primary',
                  boxShadow: 1,
                  '&:hover': {
                    borderColor: 'primary.main',
                    bgcolor: 'background.paper',
                  },
                }}
              >
                รีเฟรช
              </Button>
            </Box>

            {/* Quick Status Buttons */}
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1.5, flexWrap: 'wrap' }}>
              <QuickStatusButtonGroup
                items={quickStatuses}
                selectedValue={statusFilter}
                onChange={(value) => setStatusFilter(value)}
              />
              <Box />
            </Box>

            {/* Filters */}
            <StockIssueRequestFilters
              searchTerm={searchTerm}
              statusFilter={statusFilter}
              dateFrom={dateFrom}
              dateTo={dateTo}
              onSearchTermChange={setSearchTerm}
              onStatusChange={setStatusFilter}
              onDateFromChange={setDateFrom}
              onDateToChange={setDateTo}
              onClear={handleClearFilters}
            />

            {error && (
              <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
                {error}
              </Alert>
            )}

            <Typography variant="caption" sx={{ display: 'block', mb: 0.5, textAlign: 'right', color: 'text.secondary' }}>
              *ดับเบิลคลิกที่แถวเพื่อดูรายละเอียดเพิ่มเติม
            </Typography>

            {/* Table */}
            <StockIssueRequestTable
              rows={displayedRows}
              loading={loading}
              page={page}
              rowsPerPage={rowsPerPage}
              onPageChange={(_, nextPage) => setPage(nextPage)}
              onRowsPerPageChange={setRowsPerPage}
              onRowDoubleClick={handleOpenDetails}
            />
          </Stack>
        </Box>
      </Stack>

      {/* Dialogs */}
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
