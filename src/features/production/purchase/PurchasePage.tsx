/**
 * PurchasePage Component
 *
 * Main page for purchase request management
 */

'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Box, Button, Alert, Typography, Stack, Grid, TextField } from '@mui/material';
import { DocumentStatus } from '@/types/status.types';
import {
  Add as AddIcon,
  ReceiptLongOutlined,
  Refresh as RefreshIcon,
  InputOutlined,
  CheckCircleOutlineOutlined,
  PendingActionsOutlined,
} from '@mui/icons-material';
import {
  PRDetailsDialog,
  CreatePRDialog,
  PurchaseRequestFilters,
  PurchaseRequestTable,
} from './components';
import { StatsCard, QuickStatusButtonGroup } from '@/components/common';
import { WorkspaceHeader } from '@/design-system';
import { purchaseService } from './services/purchase.service';
import { authService } from '@/features/auth/services/auth.service';
import { PURCHASE_REQUEST_ROUTE_TYPE, PURCHASE_REQUEST_SOURCE, PurchaseRequestType } from './types';
import type { PurchaseRequestResponse } from './types';
import { AxiosError } from 'axios';
import dayjs from '@/lib/dayjs';
import Swal from 'sweetalert2';
import {
  FACILITY_CHANGED_EVENT,
  getCurrentFacilityCode,
  getCurrentFacilityId,
} from '@/lib/facility-context';
import {
  canCreateWarehousePurchaseRequests,
  canEditWarehousePurchaseRequests,
  canManageWarehousePurchaseRequests,
  canViewWarehousePurchaseRequests,
} from '@/lib/access/modules/warehouse.guard';

type PurchasePageProps = {
  initialRequests?: PurchaseRequestResponse[];
  initialSearchTerm?: string;
};

type PurchaseRequestLineItem = PurchaseRequestResponse['lines'][number];

const toSafeString = (value: unknown, fallback = ''): string => {
  if (typeof value === 'string') return value;
  if (value === null || value === undefined) return fallback;
  return String(value);
};

const toSafeNumber = (value: unknown, fallback = 0): number => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const coerceLine = (line: unknown): PurchaseRequestLineItem => {
  const source = (line && typeof line === 'object' ? line : {}) as Partial<PurchaseRequestLineItem>;
  const requestSource =
    source.requestSource === PURCHASE_REQUEST_SOURCE.CentralBooking
      ? PURCHASE_REQUEST_SOURCE.CentralBooking
      : PURCHASE_REQUEST_SOURCE.ExternalPurchase;
  return {
    id: toSafeNumber(source.id),
    itemId: source.itemId ?? null,
    itemName: toSafeString(source.itemName, '-'),
    itemCode: toSafeString(source.itemCode, '-'),
    pigItemId: source.pigItemId ?? null,
    pigItemName: toSafeString(source.pigItemName),
    pigItemCode: toSafeString(source.pigItemCode),
    quantity: toSafeNumber(source.quantity),
    receivedQuantity: toSafeNumber(source.receivedQuantity),
    uomId: toSafeNumber(source.uomId),
    uomName: toSafeString(source.uomName, '-'),
    estimatedPrice: toSafeNumber(source.estimatedPrice),
    remarks: toSafeString(source.remarks),
    requestSource,
    isCenter: Boolean(source.isCenter ?? requestSource === PURCHASE_REQUEST_SOURCE.CentralBooking),
    reservedQuantity: toSafeNumber(source.reservedQuantity),
    issuedQuantity: toSafeNumber(source.issuedQuantity),
    sourceWarehouseId: source.sourceWarehouseId ?? null,
    sourceWarehouseName: toSafeString(source.sourceWarehouseName),
  };
};

const coerceRequest = (request: unknown): PurchaseRequestResponse => {
  const source = (request && typeof request === 'object' ? request : {}) as Partial<PurchaseRequestResponse>;
  const lines = Array.isArray(source.lines) ? source.lines.map(coerceLine) : [];
  const routeType = isRouteType(source.routeType) ? source.routeType : resolveRouteTypeFromLines(lines);

  return {
    id: toSafeNumber(source.id),
    documentNumber: toSafeString(source.documentNumber, '-'),
    requestDate: toSafeString(source.requestDate),
    requestType: (source.requestType as PurchaseRequestType) ?? PurchaseRequestType.Material,
    status: toSafeString(source.status, DocumentStatus.Draft),
    urgency: toSafeString(source.urgency, 'Normal'),
    routeType,
    requestorId: toSafeNumber(source.requestorId),
    requestorName: toSafeString(source.requestorName, '-'),
    facilityId: toSafeNumber(source.facilityId),
    facilityName: toSafeString(source.facilityName, '-'),
    destinationWarehouseId: source.destinationWarehouseId ?? null,
    destinationWarehouseName: toSafeString(source.destinationWarehouseName),
    destinationWarehouseType: toSafeString(source.destinationWarehouseType),
    department: toSafeString(source.department),
    remarks: toSafeString(source.remarks),
    approval: source.approval,
    lines,
  };
};

const coerceRequests = (requests: unknown): PurchaseRequestResponse[] => {
  if (!Array.isArray(requests)) return [];
  return requests.map((request) => coerceRequest(request));
};

const isRouteType = (value: unknown): value is PurchaseRequestResponse['routeType'] =>
  value === PURCHASE_REQUEST_ROUTE_TYPE.CentralOnly ||
  value === PURCHASE_REQUEST_ROUTE_TYPE.ExternalOnly ||
  value === PURCHASE_REQUEST_ROUTE_TYPE.Mixed;

const resolveRouteTypeFromLines = (lines: PurchaseRequestResponse['lines']): PurchaseRequestResponse['routeType'] => {
  const hasCentral = lines.some((line) => line.isCenter || line.requestSource === PURCHASE_REQUEST_SOURCE.CentralBooking);
  const hasExternal = lines.some((line) => !line.isCenter && line.requestSource !== PURCHASE_REQUEST_SOURCE.CentralBooking);

  if (hasCentral && hasExternal) {
    return PURCHASE_REQUEST_ROUTE_TYPE.Mixed;
  }

  if (hasCentral) {
    return PURCHASE_REQUEST_ROUTE_TYPE.CentralOnly;
  }

  return PURCHASE_REQUEST_ROUTE_TYPE.ExternalOnly;
};

const panelSx = {
  borderRadius: 10,
  border: '1px solid',
  borderColor: 'divider',
  bgcolor: 'background.paper',
  boxShadow: 2,
};

export function PurchasePage({
  initialRequests = [],
  initialSearchTerm = '',
}: PurchasePageProps) {
  const canViewPR = canViewWarehousePurchaseRequests();
  const canCreatePR =
    canCreateWarehousePurchaseRequests() || canManageWarehousePurchaseRequests();
  const canEditPR =
    canEditWarehousePurchaseRequests() || canManageWarehousePurchaseRequests();

  const sanitizedInitialRequests = coerceRequests(initialRequests);
  const [requests, setRequests] = useState<PurchaseRequestResponse[]>(sanitizedInitialRequests);
  const [loading, setLoading] = useState(sanitizedInitialRequests.length === 0);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState(initialSearchTerm);
  const [statusFilter, setStatusFilter] = useState('all');
  const [urgencyFilter, setUrgencyFilter] = useState('all');
  const [startDate, setStartDate] = useState(() => dayjs().subtract(7, 'day').format('YYYY-MM-DD'));
  const [endDate, setEndDate] = useState(() => dayjs().format('YYYY-MM-DD'));
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [selectedRequest, setSelectedRequest] = useState<PurchaseRequestResponse | null>(null);
  const [editingRequest, setEditingRequest] = useState<PurchaseRequestResponse | null>(null);
  const [createDialogMode, setCreateDialogMode] = useState<'create' | 'edit'>('create');
  const [createRequestType, setCreateRequestType] = useState<PurchaseRequestType>(PurchaseRequestType.Material);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const initialBootstrapSkippedRef = useRef(false);
  const [currentFacilityId, setCurrentFacilityId] = useState<number | null>(
    () => getCurrentFacilityId(),
  );
  const [currentFacilityCode, setCurrentFacilityCode] = useState<string | null>(
    () => getCurrentFacilityCode(),
  );

  const PURCHASE_PERMISSION_ALIASES = [
    'warehouse.purchase_request',
    'purchase',
    'production_purchase_request',
  ] as const;

  const canApprovePurchase = (() => {
    const user = authService.getUser();
    if (!user) return false;
    if (user.roles?.some((role) => role.toLowerCase() === 'admin')) return true;
    return PURCHASE_PERMISSION_ALIASES.some(
      (alias) =>
        authService.hasPermission(`${alias}.approve`) ||
        authService.hasPermission(`${alias}.manage`),
    );
  })();

  const loadRequests = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await purchaseService.getAll(
        currentFacilityId || currentFacilityCode
          ? {
            facilityId: currentFacilityId ?? undefined,
            facilityCode: currentFacilityCode ?? undefined,
          }
          : undefined,
      );
      setRequests(coerceRequests(data.items));
    } catch (err) {
      const axiosError = err as AxiosError<{ message: string }>;
      console.error('Failed to load purchase requests:', err);
      setError(axiosError.response?.data?.message || 'ไม่สามารถโหลดข้อมูลใบขอซื้อได้');
    } finally {
      setLoading(false);
    }
  }, [currentFacilityCode, currentFacilityId]);

  useEffect(() => {
    if (!initialBootstrapSkippedRef.current && sanitizedInitialRequests.length > 0) {
      initialBootstrapSkippedRef.current = true;
      return;
    }
    void loadRequests();
  }, [loadRequests, sanitizedInitialRequests.length]);

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

  const filteredRequests = useMemo(() => {
    const keyword = toSafeString(searchTerm).trim().toLowerCase();
    const urgencyOrder: Record<string, number> = {
      Urgent: 3,
      High: 2,
      Normal: 1,
    };

    const isUnapproved = (status: string) => status !== DocumentStatus.Approved && status !== DocumentStatus.Rejected;

    const matches = requests.filter((req) => {
      if (currentFacilityId && req.facilityId !== currentFacilityId) {
        return false;
      }

      if (startDate) {
        const reqDate = dayjs(toSafeString(req.requestDate));
        if (reqDate.isValid() && reqDate.isBefore(dayjs(startDate), 'day')) {
          return false;
        }
      }

      if (endDate) {
        const reqDate = dayjs(toSafeString(req.requestDate));
        if (reqDate.isValid() && reqDate.isAfter(dayjs(endDate), 'day')) {
          return false;
        }
      }

      if (statusFilter !== 'all' && toSafeString(req.status) !== statusFilter) {
        return false;
      }

      if (urgencyFilter !== 'all' && toSafeString(req.urgency) !== urgencyFilter) {
        return false;
      }

      if (!keyword) {
        return true;
      }

      const searchable = [
        req.documentNumber,
        req.requestorName,
        req.facilityName,
        req.department,
        req.destinationWarehouseName,
        req.destinationWarehouseType,
        ...(req.lines ?? []).flatMap((line) => [line.itemCode, line.itemName, line.sourceWarehouseName ?? '']),
      ]
        .map((value) => toSafeString(value).toLowerCase())
        .join(' ');

      return searchable.includes(keyword);
    });

    return [...matches].sort((a, b) => {
      const aUnapproved = isUnapproved(toSafeString(a.status));
      const bUnapproved = isUnapproved(toSafeString(b.status));
      if (aUnapproved !== bUnapproved) {
        return aUnapproved ? -1 : 1;
      }

      if (aUnapproved && bUnapproved) {
        const urgencyDiff = (urgencyOrder[toSafeString(b.urgency)] ?? 0) - (urgencyOrder[toSafeString(a.urgency)] ?? 0);
        if (urgencyDiff !== 0) {
          return urgencyDiff;
        }
      }

      const bDate = new Date(toSafeString(b.requestDate)).getTime();
      const aDate = new Date(toSafeString(a.requestDate)).getTime();
      const dateDiff = (Number.isFinite(bDate) ? bDate : 0) - (Number.isFinite(aDate) ? aDate : 0);
      if (dateDiff !== 0) {
        return dateDiff;
      }

      return toSafeNumber(b.id) - toSafeNumber(a.id);
    });
  }, [currentFacilityId, requests, searchTerm, statusFilter, urgencyFilter, startDate, endDate]);

  const quickStatuses = useMemo(() => [
    { value: 'all', label: 'ทั้งหมด', count: requests.length },
    { value: DocumentStatus.Pending, label: 'รออนุมัติ', count: requests.filter((r) => toSafeString(r.status) === DocumentStatus.Pending).length },
    { value: DocumentStatus.Approved, label: 'อนุมัติแล้ว', count: requests.filter((r) => toSafeString(r.status) === DocumentStatus.Approved).length },
    { value: DocumentStatus.PartiallyReceived, label: 'รับเข้าบางส่วน', count: requests.filter((r) => toSafeString(r.status) === DocumentStatus.PartiallyReceived).length },
    { value: DocumentStatus.Completed, label: 'เสร็จสมบูรณ์', count: requests.filter((r) => toSafeString(r.status) === DocumentStatus.Completed).length },
    { value: DocumentStatus.Rejected, label: 'ไม่อนุมัติ', count: requests.filter((r) => toSafeString(r.status) === DocumentStatus.Rejected).length },
    { value: DocumentStatus.Cancelled, label: 'ยกเลิก', count: requests.filter((r) => toSafeString(r.status) === DocumentStatus.Cancelled).length },
  ], [requests]);

  useEffect(() => {
    setPage(0);
  }, [searchTerm, statusFilter, urgencyFilter, startDate, endDate]);

  const handleViewDetails = async (request: PurchaseRequestResponse) => {
    try {
      const fullRequest = coerceRequest(await purchaseService.getById(request.id));
      setSelectedRequest(fullRequest);
      setDetailDialogOpen(true);
    } catch (err) {
      const axiosError = err as AxiosError<{ message: string }>;
      await Swal.fire({
        icon: 'error',
        title: 'โหลดรายละเอียดไม่สำเร็จ',
        text: axiosError.response?.data?.message || 'ไม่สามารถโหลดรายละเอียดใบขอซื้อได้',
      });
    }
  };

  const handleSubmit = async (id: number) => {
    const confirm = await Swal.fire({
      icon: 'warning',
      title: 'ยืนยันการส่งอนุมัติ',
      text: 'เมื่อส่งแล้วจะเข้าสู่ขั้นตอนอนุมัติ และแก้ไขไม่ได้ในสถานะ Pending',
      showCancelButton: true,
      confirmButtonText: 'ยืนยันส่ง',
      cancelButtonText: 'ยกเลิก',
      reverseButtons: true,
    });
    if (!confirm.isConfirmed) return;

    try {
      await purchaseService.submit(id);
      await loadRequests();
      const fullRequest = await purchaseService.getById(id);
      setSelectedRequest(fullRequest);
      await Swal.fire({
        icon: 'success',
        title: 'ส่งใบขอซื้อเรียบร้อยแล้ว',
        timer: 1400,
        showConfirmButton: false,
      });
    } catch (err) {
      const axiosError = err as AxiosError<{ message: string }>;
      await Swal.fire({
        icon: 'error',
        title: 'ส่งใบขอซื้อไม่สำเร็จ',
        text: axiosError.response?.data?.message || 'ไม่สามารถส่งใบขอซื้อได้',
      });
    }
  };

  const handleEditRequest = async (request: PurchaseRequestResponse) => {
    try {
      const fullRequest = coerceRequest(await purchaseService.getById(request.id));
      setEditingRequest(fullRequest);
      setCreateDialogMode('edit');
      setCreateRequestType(fullRequest.requestType ?? PurchaseRequestType.Material);
      setDetailDialogOpen(false);
      setCreateDialogOpen(true);
    } catch (err) {
      const axiosError = err as AxiosError<{ message: string }>;
      await Swal.fire({
        icon: 'error',
        title: 'โหลดข้อมูลแก้ไขไม่สำเร็จ',
        text: axiosError.response?.data?.message || 'ไม่สามารถโหลดข้อมูลใบขอซื้อเพื่อแก้ไขได้',
      });
    }
  };

  const handleApprove = async (id: number, comment: string) => {
    try {
      setActionLoading(true);
      await purchaseService.approve(id, comment);
      await loadRequests();
      const updated = coerceRequest(await purchaseService.getById(id));
      setSelectedRequest(updated);
      await Swal.fire({
        icon: 'success',
        title: 'อนุมัติใบขอซื้อสำเร็จ',
        timer: 1200,
        showConfirmButton: false,
      });
    } catch (err) {
      const axiosError = err as AxiosError<{ message: string }>;
      await Swal.fire({
        icon: 'error',
        title: 'อนุมัติไม่สำเร็จ',
        text: axiosError.response?.data?.message || 'ไม่สามารถอนุมัติใบขอซื้อได้',
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleReturn = async (id: number, comment: string) => {
    try {
      setActionLoading(true);
      await purchaseService.returnForEdit(id, comment);
      await loadRequests();
      const updated = coerceRequest(await purchaseService.getById(id));
      setSelectedRequest(updated);
      await Swal.fire({
        icon: 'success',
        title: 'ตีกลับใบขอซื้อสำเร็จ',
        timer: 1200,
        showConfirmButton: false,
      });
    } catch (err) {
      const axiosError = err as AxiosError<{ message: string }>;
      await Swal.fire({
        icon: 'error',
        title: 'ตีกลับไม่สำเร็จ',
        text: axiosError.response?.data?.message || 'ไม่สามารถตีกลับใบขอซื้อได้',
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async (id: number, comment: string) => {
    try {
      setActionLoading(true);
      await purchaseService.reject(id, comment);
      await loadRequests();
      const updated = coerceRequest(await purchaseService.getById(id));
      setSelectedRequest(updated);
      await Swal.fire({
        icon: 'success',
        title: 'ไม่อนุมัติใบขอซื้อสำเร็จ',
        timer: 1200,
        showConfirmButton: false,
      });
    } catch (err) {
      const axiosError = err as AxiosError<{ message: string }>;
      await Swal.fire({
        icon: 'error',
        title: 'ดำเนินการไม่สำเร็จ',
        text: axiosError.response?.data?.message || 'ไม่สามารถดำเนินการได้',
      });
    } finally {
      setActionLoading(false);
    }
  };
  
  const handleCancelRequest = async (id: number, reason: string) => {
    try {
      setActionLoading(true);
      await purchaseService.cancel(id, reason);
      await loadRequests();
      const updated = coerceRequest(await purchaseService.getById(id));
      setSelectedRequest(updated);
      await Swal.fire({
        icon: 'success',
        title: 'ยกเลิกใบขอซื้อสำเร็จ',
        timer: 1200,
        showConfirmButton: false,
      });
    } catch (err) {
      const axiosError = err as AxiosError<{ message: string }>;
      await Swal.fire({
        icon: 'error',
        title: 'ยกเลิกไม่สำเร็จ',
        text: axiosError.response?.data?.message || 'ไม่สามารถยกเลิกใบขอซื้อได้',
      });
    } finally {
      setActionLoading(false);
    }
  };
  if (!canViewPR) {
    return (
      <Box sx={{ p: { xs: 1, md: 2 } }}>
        <Alert severity="warning">คุณไม่มีสิทธิ์เข้าถึงหน้าขอซื้อ</Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 1400, mx: 'auto', p: { xs: 1, md: 2 } }}>
      <WorkspaceHeader
        chipLabel="Purchase Request"
        title="ใบขอซื้อ"
        meta="Warehouse / ใบขอซื้อ"
      />

      <Stack spacing={2.5}>
        {/* Stats Cards - matches StockPage Grid pattern */}
        <Box>
          <Grid container spacing={1.5}>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <StatsCard
                title="ใบขอซื้อทั้งหมด"
                value={requests.length}
                subtitle="เอกสารทั้งหมด"
                icon={<ReceiptLongOutlined />}
                color="info"
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <StatsCard
                title="รออนุมัติ"
                value={requests.filter(r => r.status === DocumentStatus.Pending).length}
                subtitle="สถานะ Pending"
                icon={<PendingActionsOutlined />}
                color="warning"
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <StatsCard
                title="อนุมัติแล้ว"
                value={requests.filter(r => r.status === DocumentStatus.Approved).length}
                subtitle="สถานะ Approved"
                icon={<CheckCircleOutlineOutlined />}
                color="success"
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <StatsCard
                title="รับเข้าบางส่วน"
                value={requests.filter(r => r.status === DocumentStatus.PartiallyReceived).length}
                subtitle="กำลังดำเนินการ"
                icon={<InputOutlined />}
                color="primary"
              />
            </Grid>
          </Grid>
        </Box>

        {/* Content Panel - matches StockPage */}
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
              {canCreatePR && (
                <>
                  <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={() => {
                      setCreateDialogMode('create');
                      setCreateRequestType(PurchaseRequestType.Material);
                      setEditingRequest(null);
                      setCreateDialogOpen(true);
                    }}
                    sx={{
                      borderRadius: 10,
                      bgcolor: 'primary.main',
                      boxShadow: 1,
                      '&:hover': { bgcolor: 'primary.dark' },
                    }}
                  >
                    สร้างใบขอซื้อ
                  </Button>
                  <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={() => {
                      setCreateDialogMode('create');
                      setCreateRequestType(PurchaseRequestType.Pig);
                      setEditingRequest(null);
                      setCreateDialogOpen(true);
                    }}
                    sx={{
                      borderRadius: 10,
                      bgcolor: 'primary.dark',
                      boxShadow: 1,
                    }}
                  >
                    สร้างใบขอซื้อสุกร
                  </Button>
                </>
              )}

              <Button
                variant="outlined"
                startIcon={<RefreshIcon />}
                onClick={() => {
                  setPage(0);
                  void loadRequests();
                }}
                sx={{
                  borderRadius: 10,
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

            {/* Quick Status Filter */}
            <QuickStatusButtonGroup
              items={quickStatuses}
              selectedValue={statusFilter}
              onChange={(value) => {
                setStatusFilter(value);
                setPage(0);
              }}
            />

            {/* Date Range Filter */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <TextField
                type="date"
                label="วันที่เริ่ม"
                size="small"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  setPage(0);
                }}
                InputLabelProps={{ shrink: true }}
                sx={{
                  minWidth: 160,
                  '& .MuiOutlinedInput-root': {
                    height: 40,
                    borderRadius: 10,
                    bgcolor: 'background.paper',
                    boxShadow: 1,
                  },
                }}
              />
              <Typography color="text.secondary">ถึง</Typography>
              <TextField
                type="date"
                label="วันที่สิ้นสุด"
                size="small"
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value);
                  setPage(0);
                }}
                InputLabelProps={{ shrink: true }}
                sx={{
                  minWidth: 160,
                  '& .MuiOutlinedInput-root': {
                    height: 40,
                    borderRadius: 10,
                    bgcolor: 'background.paper',
                    boxShadow: 1,
                  },
                }}
              />
            </Box>

            {/* Filters */}
            <PurchaseRequestFilters
              searchTerm={searchTerm}
              statusFilter={statusFilter}
              urgencyFilter={urgencyFilter}
              onSearchTermChange={setSearchTerm}
              onStatusChange={setStatusFilter}
              onUrgencyChange={setUrgencyFilter}
              onClear={() => {
                setSearchTerm('');
                setStatusFilter('all');
                setUrgencyFilter('all');
                setStartDate(dayjs().subtract(7, 'day').format('YYYY-MM-DD'));
                setEndDate(dayjs().format('YYYY-MM-DD'));
                setPage(0);
              }}
            />

            {error && (
              <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
                {error}
              </Alert>
            )}

            <PurchaseRequestTable
              rows={filteredRequests}
              loading={loading}
              page={page}
              rowsPerPage={rowsPerPage}
              onPageChange={(_, nextPage) => setPage(nextPage)}
              onRowDoubleClick={handleViewDetails}
            />
          </Stack>
        </Box>
      </Stack>

      <PRDetailsDialog
        open={detailDialogOpen}
        request={selectedRequest}
        onClose={() => setDetailDialogOpen(false)}
        onEdit={canEditPR ? handleEditRequest : undefined}
        onSubmit={handleSubmit}
        canTakeApprovalAction={canApprovePurchase}
        actionLoading={actionLoading}
        onApprove={handleApprove}
        onReturn={handleReturn}
        onReject={handleReject}
        onCancelRequest={handleCancelRequest}
      />

      <CreatePRDialog
        open={createDialogOpen}
        onClose={() => {
          setCreateDialogOpen(false);
          setEditingRequest(null);
          setCreateDialogMode('create');
          setCreateRequestType(PurchaseRequestType.Material);
        }}
        onCreated={loadRequests}
        currentFacilityId={currentFacilityId}
        initialRequest={editingRequest}
        mode={createDialogMode}
        requestType={createRequestType}
      />
    </Box>
  );
}
