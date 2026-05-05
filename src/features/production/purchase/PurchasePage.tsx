/**
 * PurchasePage Component
 *
 * Main page for purchase request management
 */

'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Box, Button, Alert, Typography, Chip, Stack } from '@mui/material';
import { DocumentStatus } from '@/types/status.types';
import {
  Add as AddIcon,
  ReceiptLongOutlined,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import {
  PRDetailsDialog,
  CreatePRDialog,
  PRStats,
  PurchaseRequestFilters,
  PurchaseRequestTable,
} from './components';
import { StatsWrapper, ContentWrapper, PageRootWrapper } from '@/components/common/SectionWrappers';
import { purchaseService } from './services/purchase.service';
import { authService } from '@/features/auth/services/auth.service';
import { PURCHASE_REQUEST_ROUTE_TYPE, PURCHASE_REQUEST_SOURCE, PurchaseRequestType } from './types';
import type { PurchaseRequestResponse } from './types';
import { AxiosError } from 'axios';
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

const UI = {
  bg: '#f2f3f2',
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
  }, [currentFacilityId, requests, searchTerm, statusFilter, urgencyFilter]);

  useEffect(() => {
    setPage(0);
  }, [searchTerm, statusFilter, urgencyFilter]);

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
      <Box sx={{ p: { xs: 1.5, md: 2 }, bgcolor: UI.bg }}>
        <Alert severity="warning">คุณไม่มีสิทธิ์เข้าถึงหน้าขอซื้อ</Alert>
      </Box>
    );
  }

  return (
    <PageRootWrapper>
      <>
        <Box
          sx={{
            px: { xs: 2, md: 3 },
            py: 2,
            borderBottom: '1px solid',
            borderColor: 'divider',
            background: `linear-gradient(135deg, ${UI.accentSurface} 0%, ${UI.panel} 58%)`,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
            <ReceiptLongOutlined sx={{ fontSize: 22, color: UI.text }} />
            <Typography variant="h5" sx={{ fontWeight: 950, color: UI.text }}>
              ใบขอซื้อ
            </Typography>
            <Chip
              size="small"
              label="Purchase Request"
              sx={{
                bgcolor: '#fff',
                color: UI.accent,
                fontWeight: 800,
                border: `1px solid ${UI.borderStrong}`,
                height: 28,
              }}
            />
          </Box>
          <Typography sx={{ mt: 0.75, fontSize: '0.95rem', color: UI.muted, fontWeight: 700 }}>
            จัดการคำขอซื้อ ค้นหา และติดตามสถานะเอกสารในหน้าจอเดียว
          </Typography>
        </Box>

        <StatsWrapper>
          <PRStats data={requests} />
        </StatsWrapper>

        <ContentWrapper>
          <Stack spacing={1.5}>
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
                      borderRadius: 2.2,
                      bgcolor: UI.accent,
                      boxShadow: UI.shadowSoft,
                      '&:hover': { bgcolor: '#10473f' },
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
                      borderRadius: 2.2,
                      bgcolor: '#466f68',
                      boxShadow: UI.shadowSoft,
                      '&:hover': { bgcolor: '#365952' },
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
                  borderRadius: 2.2,
                  bgcolor: '#fff',
                  borderColor: UI.borderStrong,
                  color: UI.text,
                  boxShadow: UI.shadowSoft,
                  '&:hover': {
                    borderColor: UI.accent,
                    bgcolor: '#f7faf7',
                  },
                }}
              >
                รีเฟรช
              </Button>
            </Box>

            <Box sx={{ mb: 0.25 }}>
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
                  setPage(0);
                }}
              />
            </Box>

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
              onRowsPerPageChange={(event) => {
                setRowsPerPage(parseInt(event.target.value, 10));
                setPage(0);
              }}
              onRowDoubleClick={handleViewDetails}
            />
          </Stack>
        </ContentWrapper>
      </>

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
    </PageRootWrapper>
  );
}
