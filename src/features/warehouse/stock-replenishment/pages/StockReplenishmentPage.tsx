'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { AxiosError } from 'axios';
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  Grid,
  IconButton,
  InputAdornment,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  TextField,
  Tooltip,
  Typography,
  Divider,
  Stepper,
  Step,
  StepLabel,
} from '@mui/material';
import type { SelectChangeEvent } from '@mui/material/Select';
import { alpha, useTheme } from '@mui/material/styles';
import type { Theme } from '@mui/material/styles';
import {
  Add as AddIcon,
  Refresh as RefreshIcon,
  PendingActionsOutlined,
  TaskAltOutlined,
  ReceiptLongOutlined,
  Delete as DeleteIcon,
  CancelOutlined as CancelOutlinedIcon,
  CheckCircle as CheckCircleIcon,
  LocalShippingOutlined as LocalShippingIcon,
} from '@mui/icons-material';
import { DocumentStatus } from '@/types/status.types';
import { toThaiWorkflowStatus, getWorkflowStatusType } from '@/lib/utils/status.util';
import { DialogTitleWithClose, StatsCard } from '@/components/common';
import { StatusBadge, WorkspaceHeader } from '@/design-system';
import { PR_DIALOG_TABLE_HEIGHT } from '@/core/ui-patterns/pr-ui.constants';
import {
  StockReplenishmentRequestTable,
  StockReplenishmentFilters,
} from '../components';
import { authService } from '@/features/auth/services/auth.service';
import { JBFarmTable } from '@/components/common';
import { approvalService } from '@/features/reports/approvals/services/approval.service';
import { FACILITY_CHANGED_EVENT, getCurrentFacilityCode, getCurrentFacilityId } from '@/lib/facility-context';
import {
  stockReplenishmentService,
  type StockReplenishmentCreateOptionsResponse,
  type StockReplenishmentRequestResponse,
} from '../services/stock-replenishment.service';
import {
  getPurchaseDialogActionsSx,
  getPurchaseDialogContentSx,
  getPurchaseDialogFieldsetSx,
  getPurchaseDialogPaperSx,
  getPurchaseDialogPrimaryButtonSx,
  getPurchaseDialogSecondaryButtonSx,
  getPurchaseDialogTableSx,
  PURCHASE_DIALOG_LEGEND_SX,
} from '@/features/production/purchase/components/purchase-dialog.constants';

export type CentralAlertScope = 'farm' | 'central';

export type CentralAlertItem = {
  id: string;
  code: string;
  name: string;
  unit: string;
  stockOnHand: number;
  reorderPoint: number;
  targetLevel: number;
  isCentralItem: boolean;
  category?: string;
  estimatedPrice?: number;
};

export type CentralAlertRequestStatus = DocumentStatus;

export type CentralAlertRequestLineStatus =
  | 'open'
  | 'approved'
  | 'rejected';

export type CentralAlertRequestLine = {
  id: string;
  lineNo: number;
  centralWarehouseItemId: string;
  itemCode: string;
  itemName: string;
  requestedQuantity: number;
  approvedQuantity?: number;
  unit: string;
  estimatedUnitPrice: number;
  lineStatus: CentralAlertRequestLineStatus;
  note?: string;
};

export type CentralAlertRequest = {
  id: string;
  requestNo: string;
  sourceFacilityName: string;
  sourceFacilityCode?: string;
  targetFacilityName: string;
  targetFacilityCode?: string;
  status: CentralAlertRequestStatus;
  urgency: 'normal' | 'important' | 'critical';
  requestedByName: string;
  requestDate: string;
  requiredByDate?: string;
  note?: string;
  reviewedByName?: string;
  reviewedAt?: string;
  closedAt?: string;
  updatedAt: string;
  lines: CentralAlertRequestLine[];
  linkedPurchaseRequestNumber?: string;
};

export interface StockReplenishmentHubProps {
  scope?: CentralAlertScope;
  currentFacilityName?: string;
  currentFacilityCode?: string;
  currentUserName?: string;
  centralHubName?: string;
  centralHubCode?: string;
  items?: CentralAlertItem[];
  requests?: CentralAlertRequest[];
  onCreateRequest?: (payload: {
    sourceFacilityName: string;
    sourceFacilityCode?: string;
    targetFacilityName: string;
    targetFacilityCode?: string;
    urgency: CentralAlertRequest['urgency'];
    requiredByDate: string;
    note: string;
    lines: Array<{
      centralWarehouseItemId: string;
      requestedQuantity: number;
      estimatedPrice: number;
      note?: string;
    }>;
  }) => void;
  onActionRequest?: (
    requestId: string,
    action: 'submit' | 'approve' | 'reject' | 'return' | 'cancel',
  ) => void;
}

type DraftLine = {
  id: string;
  centralWarehouseItemId: string;
  requestedQuantity: number;
  estimatedPrice: number;
  note: string;
};

// Remove statusCopy as we now use toThaiWorkflowStatus and StatusBadge

const lineStatusCopy: Record<CentralAlertRequestLineStatus, { label: string; tone: 'success' | 'warning' | 'error' | 'info' | 'default' }> = {
  open: { label: 'รอดำเนินการ', tone: 'info' },
  approved: { label: 'อนุมัติ', tone: 'success' },
  rejected: { label: 'ปฏิเสธ', tone: 'error' },
};

const urgencyLabel: Record<CentralAlertRequest['urgency'], string> = {
  normal: 'ปกติ',
  important: 'ด่วน',
  critical: 'เร่งด่วน',
};


function getUrgencyBadgeType(urgency: CentralAlertRequest['urgency']): 'default' | 'warning' | 'error' {
  return urgency === 'critical' ? 'error' : urgency === 'important' ? 'warning' : 'default';
}

const buildDraftId = () => `draft-${Math.random().toString(36).slice(2, 8)}`;

const formatShortDate = (value?: string) => {
  if (!value) return '';
  const trimmed = value.trim();
  const dateOnlyMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(trimmed);
  if (dateOnlyMatch) {
    const [, year, month, day] = dateOnlyMatch;
    return `${day}/${month}/${year}`;
  }

  const withTimeMatch = /^(\d{2})\/(\d{2})\/(\d{4})(?:\s+(\d{2}:\d{2}))?$/.exec(trimmed);
  if (withTimeMatch) {
    const [, day, month, year, time] = withTimeMatch;
    return time ? `${day}/${month}/${year} ${time}` : `${day}/${month}/${year}`;
  }

  const parsed = new Date(trimmed);
  if (Number.isNaN(parsed.getTime())) return trimmed;
  const day = `${parsed.getDate()}`.padStart(2, '0');
  const month = `${parsed.getMonth() + 1}`.padStart(2, '0');
  const year = `${parsed.getFullYear()}`;
  return `${day}/${month}/${year}`;
};

const formatDateTime = (value?: string) => {
  if (!value) return '-';
  const trimmed = value.trim();
  const match = /^(\d{2})\/(\d{2})\/(\d{4})(?:\s+(\d{2}:\d{2}))?$/.exec(trimmed);
  if (match) {
    return trimmed;
  }
  const formatted = formatShortDate(trimmed);
  return formatted || trimmed;
};

const toBackendUrgency = (value: CentralAlertRequest['urgency']) => {
  if (value === 'critical') return 'Urgent';
  if (value === 'important') return 'High';
  return 'Normal';
};

const toUiUrgency = (value?: string): CentralAlertRequest['urgency'] => {
  const normalized = (value ?? '').trim().toLowerCase();
  if (normalized === 'urgent' || normalized === 'critical') return 'critical';
  if (normalized === 'high' || normalized === 'important') return 'important';
  return 'normal';
};

const toIsoDateOnly = (value?: string | null) => {
  if (!value) return undefined;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value.slice(0, 10);
  return parsed.toISOString().slice(0, 10);
};

const mapOptionsToItems = (options: StockReplenishmentCreateOptionsResponse | null): CentralAlertItem[] => (
  options?.items.map((item) => ({
    id: String(item.id),
    code: item.itemCode,
    name: item.itemName,
    unit: item.uomName || item.uomCode,
    stockOnHand: Number(item.availableQuantity ?? item.stockOnHand ?? 0),
    reorderPoint: Number(item.reorderPoint ?? 0),
    targetLevel: Number(item.targetLevel ?? item.reorderPoint ?? 0),
    isCentralItem: item.isCentralItem,
    category: item.category,
    estimatedPrice: Number(item.estimatedUnitPrice ?? 0),
  })) ?? []
);

const mapRequestResponse = (request: StockReplenishmentRequestResponse): CentralAlertRequest => ({
  id: String(request.id),
  requestNo: request.documentNumber,
  sourceFacilityName: request.sourceFacilityName,
  sourceFacilityCode: request.sourceFacilityCode,
  targetFacilityName: request.targetFacilityName || request.targetWarehouseName,
  targetFacilityCode: request.targetFacilityCode || request.targetWarehouseCode,
  status: request.status as DocumentStatus,
  urgency: toUiUrgency(request.urgency),
  requestedByName: request.requestorName,
  requestDate: formatShortDate(request.requestDate),
  requiredByDate: toIsoDateOnly(request.requiredByDate),
  note: request.remarks,
  reviewedByName: request.reviewedByName ?? undefined,
  reviewedAt: request.reviewedAt ?? undefined,
  updatedAt: request.updatedDate ?? request.requestDate,
  lines: request.lines.map((line) => ({
    id: String(line.id),
    lineNo: line.lineNo,
    centralWarehouseItemId: String(line.centralWarehouseItemId),
    itemCode: line.itemCode,
    itemName: line.itemName,
    requestedQuantity: Number(line.requestedQuantity ?? 0),
    approvedQuantity: line.approvedQuantity == null ? undefined : Number(line.approvedQuantity),
    unit: line.uomName || line.uomCode,
    estimatedUnitPrice: Number(line.estimatedUnitPrice ?? 0),
    lineStatus: line.lineStatus.toLowerCase() === 'rejected' ? 'rejected' : line.lineStatus.toLowerCase() === 'approved' ? 'approved' : 'open',
    note: line.remarks,
  })),
  linkedPurchaseRequestNumber: request.linkedPurchaseRequestNumber ?? undefined,
});

const panelSx = {
  borderRadius: 3.5,
  border: '1px solid',
  borderColor: 'divider',
  bgcolor: 'background.paper',
  boxShadow: 2,
} as const;

function getTableSx(theme: Theme) {
  return {
    '& .MuiTableCell-head': {
      bgcolor: theme.palette.primary.main,
      color: theme.palette.primary.contrastText,
      fontWeight: 900,
      borderColor: alpha('#fff', 0.1),
    },
    '& .MuiTableCell-body': {
      borderColor: theme.palette.divider,
    },
  };
}

export default function StockReplenishmentHub({
  scope: scopeProp,
  currentFacilityName: currentFacilityNameProp,
  currentFacilityCode: currentFacilityCodeProp,
  currentUserName: currentUserNameProp,
  centralHubName: centralHubNameProp,
  centralHubCode: centralHubCodeProp,
  items: itemsProp = [],
  requests: requestsProp = [],
  onCreateRequest,
  onActionRequest,
}: StockReplenishmentHubProps) {
  const theme = useTheme();
  const headerRef = useRef<HTMLDivElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);
  const [apiOptions, setApiOptions] = useState<StockReplenishmentCreateOptionsResponse | null>(null);
  const [apiRequests, setApiRequests] = useState<CentralAlertRequest[]>(requestsProp);
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState('');
  const [currentFacilityId, setCurrentFacilityId] = useState<number | null>(() => getCurrentFacilityId());
  const [currentFacilityCodeState, setCurrentFacilityCodeState] = useState<string | null>(() => getCurrentFacilityCode());
  const usesExternalData = Boolean(onCreateRequest || onActionRequest || itemsProp.length > 0 || requestsProp.length > 0);
  const serviceItems = useMemo(() => mapOptionsToItems(apiOptions), [apiOptions]);
  const items = usesExternalData ? itemsProp : serviceItems;
  const requests = usesExternalData ? requestsProp : apiRequests;
  const scope = scopeProp ?? apiOptions?.scope ?? 'farm';
  const currentFacilityName = currentFacilityNameProp ?? apiOptions?.currentFacility?.name ?? 'ฟาร์มตัวอย่าง';
  const currentFacilityCode = currentFacilityCodeProp ?? apiOptions?.currentFacility?.code;
  const centralHubName = centralHubNameProp ?? apiOptions?.centralHub?.name ?? 'คลังกลาง';
  const centralHubCode = centralHubCodeProp ?? apiOptions?.centralHub?.code;
  const currentUser = authService.getUser();
  const userFullName = `${currentUser?.firstName ?? ''} ${currentUser?.lastName ?? ''}`.trim();
  const currentUserName = currentUserNameProp ?? (userFullName || currentUser?.username || 'ผู้ใช้งาน');
  const centralItems = useMemo(() => items.filter((item) => item.isCentralItem), [items]);
  const firstItemId = centralItems[0]?.id ?? '';

  const [urgency, setUrgency] = useState<CentralAlertRequest['urgency']>('important');
  const [requiredByDate, setRequiredByDate] = useState('');
  const [note, setNote] = useState('');
  const [selectedItemId, setSelectedItemId] = useState(firstItemId);
  const [lineQuantity, setLineQuantity] = useState<number | string>(1);
  const [lineEstimatedPrice, setLineEstimatedPrice] = useState(0);
  const [lineNote, setLineNote] = useState('');
  const [draftLines, setDraftLines] = useState<DraftLine[]>([]);
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | CentralAlertRequestStatus>('all');
  const [urgencyFilter, setUrgencyFilter] = useState<'all' | CentralAlertRequest['urgency']>('all');
  const [selectedRequestId, setSelectedRequestId] = useState('');
  const [approvalHistory, setApprovalHistory] = useState<any>(null);

  useEffect(() => {
    if (!selectedRequestId) {
      setApprovalHistory(null);
      return;
    }
    const fetchHistory = async () => {
      try {
        const history = await approvalService.getDocumentHistory('StockReplenishmentRequest', Number(selectedRequestId));
        setApprovalHistory(history);
      } catch (err) {
        setApprovalHistory(null);
      }
    };
    void fetchHistory();
  }, [selectedRequestId]);

  const renderWorkflowStepper = (status: CentralAlertRequestStatus) => {
    const isCompleted = status === DocumentStatus.Completed;
    const isProcessing = status === DocumentStatus.PartiallyReceived;
    const isApproved = status === DocumentStatus.Approved;
    const isRejected = status === DocumentStatus.Rejected;
    const isReturned = status === DocumentStatus.Returned;
    const isPending = status === DocumentStatus.Pending;

    // Use approval history if available (New Workflow System)
    if (approvalHistory && approvalHistory.history && approvalHistory.history.length > 0) {
      const authTypeConfig: Record<string, { label: string; bgcolor: string; color: string; border: string }> = {
        RolePermission: { label: 'ตามตำแหน่ง', bgcolor: alpha(theme.palette.success.main, 0.08), color: theme.palette.success.dark, border: alpha(theme.palette.success.main, 0.2) },
        UserOverride: { label: 'สิทธิพิเศษ', bgcolor: alpha(theme.palette.warning.main, 0.08), color: theme.palette.warning.dark ?? theme.palette.warning.main, border: alpha(theme.palette.warning.main, 0.2) },
        SuperAdmin: { label: 'ผู้ดูแลระบบสูงสุด', bgcolor: alpha(theme.palette.error.main, 0.08), color: theme.palette.error.dark, border: alpha(theme.palette.error.main, 0.2) },
      };

      // Ensure we display pending state if not completed and no actions yet
      return (
        <Box sx={{ width: '100%', pt: 2, mt: 1, borderTop: '1px solid', borderColor: 'divider' }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 900, mb: 2.5, color: 'text.secondary', display: 'flex', alignItems: 'center', gap: 1 }}>
            <ReceiptLongOutlined sx={{ fontSize: 18 }} />
            ประวัติการอนุมัติ
          </Typography>
          <Box sx={{ px: 2 }}>
            <Stepper 
              orientation="vertical"
              nonLinear
              sx={{
                '& .MuiStepConnector-line': { minHeight: 40 },
                '& .MuiStepLabel-label': { fontWeight: 800 }
              }}
            >
              {approvalHistory.history.map((step: any, index: number) => {
                const stepAction = step.action?.toLowerCase();
                const isStepError = stepAction === 'reject';
                const isStepWarning = stepAction === 'return';
                const isStepCompleted = stepAction === 'approve';
                return (
                  <Step key={index} active={true} completed={isStepCompleted}>
                    <StepLabel
                      error={isStepError}
                      StepIconProps={{
                        sx: {
                          ...(isStepCompleted && { color: 'success.main' }),
                          ...(isStepWarning && { color: 'warning.main' }),
                          ...(isStepError && { color: 'error.main' })
                        }
                      }}
                    >
                      <Box>
                        <Stack direction="row" spacing={0.5} alignItems="center">
                          <Typography variant="body2" sx={{ fontWeight: 900, color: 'text.primary' }}>
                            {step.approverName}
                          </Typography>
                        </Stack>
                        <Typography variant="caption" sx={{ display: 'block', color: 'text.secondary', fontWeight: 600 }}>
                          Lv.{step.stepOrder}
                        </Typography>
                        <Typography variant="caption" sx={{ display: 'block', color: 'text.disabled', fontSize: '0.7rem', mt: 0.5 }}>
                          {formatDateTime(step.actionDate)}
                        </Typography>
                        {isStepError && (
                          <Typography variant="caption" sx={{ display: 'block', color: 'error.main', mt: 0.5, bgcolor: alpha(theme.palette.error.main, 0.04), p: 0.5, borderRadius: 1, border: '1px solid', borderColor: alpha(theme.palette.error.main, 0.2) }}>
                            ไม่อนุมัติ: {step.comment || '-'}
                          </Typography>
                        )}
                        {isStepWarning && (
                          <Typography variant="caption" sx={{ display: 'block', color: 'warning.main', mt: 0.5, bgcolor: alpha(theme.palette.warning.main, 0.04), p: 0.5, borderRadius: 1, border: '1px solid', borderColor: alpha(theme.palette.warning.main, 0.2) }}>
                            ตีกลับ: {step.comment || '-'}
                          </Typography>
                        )}
                        {isStepCompleted && step.comment && (
                          <Typography variant="caption" sx={{ display: 'block', color: 'success.main', mt: 0.5, bgcolor: alpha(theme.palette.success.main, 0.04), p: 0.5, borderRadius: 1, border: '1px solid', borderColor: alpha(theme.palette.success.main, 0.2) }}>
                            {step.comment}
                          </Typography>
                        )}
                      </Box>
                    </StepLabel>
                  </Step>
                );
              })}
            </Stepper>
          </Box>
        </Box>
      );
    }

    // Fallback logic for legacy records or draft/pending states without history yet
    return (
      <Box sx={{ width: '100%', pt: 2, mt: 1, borderTop: '1px solid', borderColor: 'divider' }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 900, mb: 2.5, color: 'text.secondary', display: 'flex', alignItems: 'center', gap: 1 }}>
          <ReceiptLongOutlined sx={{ fontSize: 18 }} />
          ลำดับการอนุมัติ
        </Typography>
        <Box sx={{ px: 2 }}>
          <Stepper 
            alternativeLabel 
            activeStep={isCompleted ? 1 : 0}
            sx={{
              '& .MuiStepConnector-line': { minWidth: 40 },
              '& .MuiStepLabel-label': { fontWeight: 800, mt: 1 },
              '& .MuiStepLabel-root': { alignItems: 'center' }
            }}
          >
            <Step completed={isCompleted}>
              <StepLabel
                error={isRejected}
                StepIconProps={{
                  sx: {
                    ...(isCompleted && { color: 'success.main' }),
                    ...(isReturned && { color: 'warning.main' }),
                    ...(isPending && { color: 'info.main' }),
                  }
                }}
              >
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
                  <Stack direction="row" spacing={0.5} alignItems="center" justifyContent="center">
                    <Typography variant="body2" sx={{ fontWeight: 900 }}>
                      ผู้มีอำนาจอนุมัติ
                    </Typography>
                    <Typography variant="caption" sx={{
                      px: 0.5, py: 0.1, bgcolor: alpha(theme.palette.info.main, 0.08), color: theme.palette.info.dark ?? theme.palette.info.main,
                      borderRadius: 0.5, fontSize: '0.6rem', fontWeight: 800, border: '1px solid', borderColor: alpha(theme.palette.info.main, 0.2)
                    }}>
                      Lv.1
                    </Typography>
                  </Stack>
                  <Typography variant="caption" sx={{ display: 'block', color: 'text.secondary', fontWeight: 600 }}>
                    {selectedRequest?.reviewedByName || '-'}
                  </Typography>
                  {selectedRequest?.reviewedAt && (
                    <Typography variant="caption" sx={{ display: 'block', color: 'text.disabled', fontSize: '0.7rem', mt: 0.5 }}>
                      {formatDateTime(selectedRequest.reviewedAt)}
                    </Typography>
                  )}
                  {isRejected && (
                    <Typography variant="caption" sx={{ display: 'block', color: 'error.main', mt: 0.5, bgcolor: alpha(theme.palette.error.main, 0.04), p: 0.5, borderRadius: 1, border: '1px solid', borderColor: alpha(theme.palette.error.main, 0.2) }}>
                      ไม่อนุมัติ
                    </Typography>
                  )}
                  {isReturned && (
                    <Typography variant="caption" sx={{ display: 'block', color: 'warning.main', mt: 0.5, bgcolor: alpha(theme.palette.warning.main, 0.04), p: 0.5, borderRadius: 1, border: '1px solid', borderColor: alpha(theme.palette.warning.main, 0.2) }}>
                      ตีกลับเพื่อแก้ไข
                    </Typography>
                  )}
                </Box>
              </StepLabel>
            </Step>
          </Stepper>
        </Box>
      </Box>
    );
  };
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [formError, setFormError] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);

  const loadData = useCallback(async () => {
    if (usesExternalData) return;
    try {
      setLoading(true);
      setApiError('');
      const params =
        currentFacilityId || currentFacilityCodeState
          ? {
            facilityId: currentFacilityId ?? undefined,
            facilityCode: currentFacilityCodeState ?? undefined,
          }
          : undefined;
      const [options, rows] = await Promise.all([
        stockReplenishmentService.getOptions(params),
        stockReplenishmentService.getAll({
          ...params,
          scope: scopeProp ?? undefined,
        }),
      ]);
      setApiOptions(options);
      setApiRequests(rows.map(mapRequestResponse));
    } catch (err) {
      const axiosError = err as AxiosError<{ message?: string }>;
      setApiError(axiosError.response?.data?.message ?? 'ไม่สามารถโหลดข้อมูลใบแจ้งเติมสต็อกคลังกลางได้');
    } finally {
      setLoading(false);
    }
  }, [currentFacilityCodeState, currentFacilityId, scopeProp, usesExternalData]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  useEffect(() => {
    const onFacilityChanged = () => {
      setCurrentFacilityId(getCurrentFacilityId());
      setCurrentFacilityCodeState(getCurrentFacilityCode());
      setPage(0);
    };

    window.addEventListener(FACILITY_CHANGED_EVENT, onFacilityChanged);
    return () => window.removeEventListener(FACILITY_CHANGED_EVENT, onFacilityChanged);
  }, []);

  useEffect(() => {
    if (!selectedItemId && firstItemId) {
      setSelectedItemId(firstItemId);
      // Auto-set estimated price for the auto-selected item
      const autoItem = centralItems.find((i) => i.id === firstItemId);
      const price = autoItem?.estimatedPrice || 0;
      setLineEstimatedPrice(Number(lineQuantity) * price);
    }
  }, [firstItemId, selectedItemId, centralItems, lineQuantity]);

  const selectedItem = centralItems.find((item) => item.id === selectedItemId) ?? centralItems[0];
  const selectedRequest = requests.find((request) => request.id === selectedRequestId) ?? null;
  const selectedItemUom = selectedItem?.unit ?? '';
  const getTopUpQty = (item: CentralAlertItem) => Math.max(0, item.targetLevel - item.stockOnHand);
  const getRequestedQuantityForItem = (itemId: string) =>
    draftLines
      .filter((line) => line.centralWarehouseItemId === itemId)
      .reduce((sum, line) => sum + line.requestedQuantity, 0);
  const currentRequestedQuantity = selectedItem ? getRequestedQuantityForItem(selectedItem.id) : 0;
  const remainingAvailableQuantity = selectedItem ? Math.max(0, selectedItem.stockOnHand - currentRequestedQuantity) : 0;
  const validateRequestedQuantity = (itemId: string, requestedQuantity: number) => {
    return '';
  };
  const openRequests = requests.filter((request) => request.status !== DocumentStatus.Rejected);
  const lowCentralItems = centralItems.filter((item) => item.stockOnHand <= item.reorderPoint);
  const totalDraftQuantity = draftLines.reduce((sum, line) => sum + line.requestedQuantity, 0);
  const pendingCount = requests.filter((request) => request.status === DocumentStatus.Pending).length;
  const approvedCount = requests.filter((request) => request.status === DocumentStatus.Approved).length;
  const processingCount = requests.filter((request) => request.status === DocumentStatus.PartiallyReceived).length;

  const filteredRequests = useMemo(() => {
    const normalizedSearch = searchText.trim().toLowerCase();

    return requests.filter((request) => {
      const matchesStatus = statusFilter === 'all' || request.status === statusFilter;
      const matchesUrgency = urgencyFilter === 'all' || request.urgency === urgencyFilter;
      const haystack = [
        request.requestNo,
        request.sourceFacilityName,
        request.sourceFacilityCode,
        request.requestedByName,
        request.lines.map((line) => `${line.itemCode} ${line.itemName}`).join(' '),
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      return matchesStatus && matchesUrgency && (!normalizedSearch || haystack.includes(normalizedSearch));
    });
  }, [requests, searchText, statusFilter, urgencyFilter]);

  const resolveItem = (itemId: string) => centralItems.find((item) => item.id === itemId);

  const addDraftLine = () => {
    if (!selectedItem) return;

    const numQuantity = Number(lineQuantity);
    const validationMessage = validateRequestedQuantity(selectedItem.id, numQuantity);
    if (validationMessage) {
      setFormError(validationMessage);
      return;
    }

    setFormError('');
    setDraftLines((current) => {
      const exists = current.some((line) => line.centralWarehouseItemId === selectedItem.id);
      if (exists) {
        return current.map((line) =>
          line.centralWarehouseItemId === selectedItem.id
            ? {
              ...line,
              requestedQuantity: line.requestedQuantity + numQuantity,
              estimatedPrice: line.estimatedPrice || lineEstimatedPrice,
              note: line.note || lineNote,
            }
            : line,
        );
      }

      return [
        ...current,
        {
          id: buildDraftId(),
          centralWarehouseItemId: selectedItem.id,
          requestedQuantity: numQuantity,
          estimatedPrice: lineEstimatedPrice,
          note: lineNote,
        },
      ];
    });
    setLineQuantity(1);
    // Recalculate price for the still-selected item
    const currentPrice = selectedItem?.estimatedPrice || 0;
    setLineEstimatedPrice(1 * currentPrice);
    setLineNote('');
  };

  const removeDraftLine = (lineId: string) => {
    setDraftLines((current) => current.filter((line) => line.id !== lineId));
  };

  const handleOpenCreate = () => {
    setUrgency('important');
    setRequiredByDate('');
    setNote('');
    setDraftLines([]);
    setFormError('');
    setCreateDialogOpen(true);
  };

  const submitRequest = async () => {
    setFormError('');
    if (onCreateRequest) {
      onCreateRequest({
        sourceFacilityName: currentFacilityName,
        sourceFacilityCode: currentFacilityCode,
        targetFacilityName: centralHubName,
        targetFacilityCode: centralHubCode,
        urgency,
        requiredByDate,
        note,
        lines: draftLines.map((line) => ({
          centralWarehouseItemId: line.centralWarehouseItemId,
          requestedQuantity: line.requestedQuantity,
          estimatedPrice: line.estimatedPrice,
          note: line.note || undefined,
        })),
      });
      setCreateDialogOpen(false);
      return;
    }

    try {
      setLoading(true);
      setApiError('');
      await stockReplenishmentService.create({
        sourceFacilityId: currentFacilityId ?? undefined,
        sourceFacilityCode: currentFacilityCodeState ?? currentFacilityCode,
        targetWarehouseId: apiOptions?.items[0]?.warehouseId,
        requiredByDate: requiredByDate || undefined,
        urgency: toBackendUrgency(urgency),
        remarks: note,
        lines: draftLines.map((line) => ({
          centralWarehouseItemId: Number(line.centralWarehouseItemId),
          requestedQuantity: line.requestedQuantity,
          estimatedUnitPrice: line.requestedQuantity > 0 ? line.estimatedPrice / line.requestedQuantity : 0,
          remarks: line.note || undefined,
        })),
      });
      setCreateDialogOpen(false);
      await loadData();
    } catch (err) {
      const axiosError = err as AxiosError<{ message?: string }>;
      setFormError(axiosError.response?.data?.message ?? 'บันทึกใบแจ้งเติมสต็อกไม่สำเร็จ');
    } finally {
      setLoading(false);
    }
  };

  const canAddCurrentLine = Boolean(selectedItem) && Number(lineQuantity) >= 1;

  const handleActionRequest = async (
    requestId: string,
    action: 'submit' | 'approve' | 'reject' | 'return' | 'cancel',
  ) => {
    if (onActionRequest) {
      onActionRequest(requestId, action);
      return;
    }

    const numericId = Number(requestId);
    if (!Number.isFinite(numericId) || numericId <= 0) return;

    try {
      setLoading(true);
      setApiError('');
      if (action === 'submit') {
        await stockReplenishmentService.submit(numericId);
      } else if (action === 'approve') {
        await stockReplenishmentService.approve(numericId);
      } else if (action === 'reject') {
        await stockReplenishmentService.reject(numericId, 'ไม่อนุมัติจากหน้าคลังกลาง');
      } else if (action === 'return') {
        await stockReplenishmentService.returnForEdit(numericId, 'ตีกลับจากหน้าคลังกลาง');
      } else {
        await stockReplenishmentService.cancel(numericId, 'ยกเลิกจากหน้าคลังกลาง');
      }
      setSelectedRequestId('');
      await loadData();
    } catch (err) {
      const axiosError = err as AxiosError<{ message?: string }>;
      setApiError(axiosError.response?.data?.message ?? 'ดำเนินการกับใบแจ้งไม่สำเร็จ');
    } finally {
      setLoading(false);
    }
  };

  const renderActionButtons = (request: CentralAlertRequest, compact = false) => {
    if (compact) {
      return (
        <Stack direction="row" spacing={0.75} justifyContent="flex-end" alignItems="center">
          {scope === 'central' && request.status === DocumentStatus.Pending && (
            <>
              <Tooltip title="อนุมัติ">
                <IconButton 
                  size="small" 
                  onClick={() => void handleActionRequest(request.id, 'approve')} 
                  disabled={loading}
                  sx={{ color: 'success.main' }}
                >
                  <TaskAltOutlined sx={{ fontSize: 18 }} />
                </IconButton>
              </Tooltip>
              <Tooltip title="ตีกลับ">
                <IconButton 
                  size="small" 
                  onClick={() => void handleActionRequest(request.id, 'return')} 
                  disabled={loading}
                  sx={{ color: 'warning.main' }}
                >
                  <RefreshIcon sx={{ fontSize: 18 }} />
                </IconButton>
              </Tooltip>
              <Tooltip title="ไม่อนุมัติ">
                <IconButton 
                  size="small" 
                  onClick={() => void handleActionRequest(request.id, 'reject')} 
                  disabled={loading}
                  sx={{ color: 'error.main' }}
                >
                  <CancelOutlinedIcon sx={{ fontSize: 18 }} />
                </IconButton>
              </Tooltip>
            </>
          )}
          {scope === 'farm' && [DocumentStatus.Draft, DocumentStatus.Returned].includes(request.status) && (
            <Button
              size="small"
              variant="contained"
              onClick={() => void handleActionRequest(request.id, 'submit')}
              disabled={loading}
              sx={{ borderRadius: 999, bgcolor: 'primary.main' }}
            >
              ส่ง
            </Button>
          )}
        </Stack>
      );
    }

    return (
      <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap justifyContent="flex-end" sx={{ width: '100%' }}>
        {scope === 'central' && request.status === DocumentStatus.Pending && (
          <>
            <Button
              variant="contained"
              startIcon={<TaskAltOutlined sx={{ fontSize: 18 }} />}
              onClick={() => void handleActionRequest(request.id, 'approve')}
              disabled={loading}
              sx={{ borderRadius: 999, px: 2, bgcolor: 'success.main', '&:hover': { bgcolor: 'success.dark' } }}
            >
              อนุมัติ
            </Button>
            <Button
              variant="outlined"
              color="warning"
              startIcon={<RefreshIcon sx={{ fontSize: 18 }} />}
              onClick={() => void handleActionRequest(request.id, 'return')}
              disabled={loading}
              sx={{ borderRadius: 999, px: 2 }}
            >
              ตีกลับ
            </Button>
            <Button
              variant="outlined"
              color="error"
              startIcon={<CancelOutlinedIcon sx={{ fontSize: 18 }} />}
              onClick={() => void handleActionRequest(request.id, 'reject')}
              disabled={loading}
              sx={{ borderRadius: 999, px: 2 }}
            >
              ไม่อนุมัติ
            </Button>
          </>
        )}
        {scope === 'farm' && [DocumentStatus.Draft, DocumentStatus.Returned].includes(request.status) && (
          <>
            <Button
              variant="contained"
              onClick={() => void handleActionRequest(request.id, 'submit')}
              disabled={loading}
              sx={{ borderRadius: 999, px: 2.5, bgcolor: 'primary.main', '&:hover': { bgcolor: 'primary.dark' } }}
            >
              ส่งอนุมัติ
            </Button>
            <Button
              variant="outlined"
              onClick={() => {
                setSelectedRequestId('');
                setDraftLines(request.lines.map((line) => ({
                  id: line.id,
                  centralWarehouseItemId: line.centralWarehouseItemId,
                  requestedQuantity: line.requestedQuantity,
                  estimatedPrice: line.estimatedUnitPrice * line.requestedQuantity,
                  note: line.note || '',
                })));
                setCreateDialogOpen(true);
              }}
              sx={{ borderRadius: 999, px: 2.5, borderColor: 'primary.main', color: 'primary.main' }}
            >
              แก้ไข
            </Button>
          </>
        )}
      </Stack>
    );
  };

  const renderFarmComposer = () => (
    <Stack spacing={2}>
      <Box component="fieldset" sx={getPurchaseDialogFieldsetSx(theme)}>
        <Typography component="legend" sx={PURCHASE_DIALOG_LEGEND_SX}>
          ข้อมูลใบแจ้งเติมสต็อก
        </Typography>
        <Stack spacing={2}>

          <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
            <TextField
              label="ผู้ขอ"
              value={currentUserName}
              InputProps={{ readOnly: true }}
              fullWidth
            />
            <TextField
              label="ฟาร์มผู้ส่ง"
              value={`${currentFacilityName}${currentFacilityCode ? ` (${currentFacilityCode})` : ''}`}
              InputProps={{ readOnly: true }}
              fullWidth
            />
          </Stack>
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
            <TextField
              label="ส่งไปที่"
              value={`${centralHubName}${centralHubCode ? ` (${centralHubCode})` : ''}`}
              InputProps={{ readOnly: true }}
              fullWidth
            />
            <TextField
              select
              label="ความเร่งด่วน"
              value={urgency}
              onChange={(event) => setUrgency(event.target.value as CentralAlertRequest['urgency'])}
              sx={{ minWidth: 180 }}
            >
              <MenuItem value="normal">ปกติ</MenuItem>
              <MenuItem value="important">ด่วน</MenuItem>
              <MenuItem value="critical">เร่งด่วน</MenuItem>
            </TextField>
          </Stack>
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
            <TextField
              label="ต้องการภายใน"
              type="date"
              value={requiredByDate}
              onChange={(event) => setRequiredByDate(event.target.value)}
              InputLabelProps={{ shrink: true }}
              fullWidth
            />
          </Stack>
          <TextField
            label="หมายเหตุ"
            value={note}
            onChange={(event) => setNote(event.target.value)}
            multiline
            minRows={2}
            fullWidth
            placeholder="ระบุหมายเหตุ"
          />
        </Stack>
      </Box>

      <Box component="fieldset" sx={getPurchaseDialogFieldsetSx(theme)}>
        <Typography component="legend" sx={PURCHASE_DIALOG_LEGEND_SX}>
          รายการสินค้า
        </Typography>
        <Stack direction="column" spacing={2} sx={{ width: '100%', mb: 1 }}>
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: {
                xs: '1fr',
                md: 'minmax(300px, 2fr) minmax(100px, 0.7fr) minmax(100px, 0.7fr) minmax(140px, 0.9fr)',
              },
              gap: 1,
              alignItems: 'end',
            }}
          >
            <TextField
              select
              label="สินค้า"
              value={selectedItemId}
              onChange={(event) => {
                const id = event.target.value;
                setSelectedItemId(id);
                const selectedItem = centralItems.find((i) => i.id === id);
                const price = selectedItem?.estimatedPrice || 0;
                setLineEstimatedPrice(Number(lineQuantity) * price);
              }}
              fullWidth
              SelectProps={{
                renderValue: (value) => {
                  const item = centralItems.find((candidate) => candidate.id === value);
                  if (!item) return '';
                  return `${item.code} - ${item.name}`;
                },
              }}
            >
              {centralItems.map((item) => (
                <MenuItem key={item.id} value={item.id}>
                  <Stack spacing={0.15} sx={{ width: '100%', py: 0.35 }}>
                    <Typography variant="body2" sx={{ fontWeight: 800, lineHeight: 1.2 }}>
                      {item.code} - {item.name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      คงเหลือ {item.stockOnHand.toLocaleString()} {item.unit} · ต้องเติมอย่างน้อย {getTopUpQty(item).toLocaleString()} {item.unit}
                    </Typography>
                  </Stack>
                </MenuItem>
              ))}
            </TextField>
            <TextField
              label="หน่วย"
              value={selectedItemUom}
              InputProps={{ readOnly: true }}
              fullWidth
            />
            <TextField
              label="จำนวน"
              type="text"
              value={lineQuantity}
              onChange={(event) => {
                const val = event.target.value;
                if (val === '' || /^\d*\.?\d*$/.test(val)) {
                  setLineQuantity(val);
                  const selectedItem = centralItems.find((i) => i.id === selectedItemId);
                  const price = selectedItem?.estimatedPrice || 0;
                  setLineEstimatedPrice((Number(val) || 0) * price);
                }
              }}
              onBlur={() => {
                if (!lineQuantity || Number(lineQuantity) <= 0) {
                  setLineQuantity(1);
                  const selectedItem = centralItems.find((i) => i.id === selectedItemId);
                  const price = selectedItem?.estimatedPrice || 0;
                  setLineEstimatedPrice(1 * price);
                }
              }}
              inputProps={{ inputMode: 'decimal', pattern: '[0-9]*\\.?[0-9]*' }}
              InputProps={{ sx: { '& input': { textAlign: 'right' } } }}
            />
            <TextField
              label="ราคาประมาณ (บาท)"
              type="text"
              value={lineEstimatedPrice}
              onChange={(event) => {
                const val = event.target.value;
                if (val === '' || /^\d*\.?\d*$/.test(val)) {
                  setLineEstimatedPrice(Number(val) || 0);
                }
              }}
              inputProps={{ inputMode: 'decimal', pattern: '[0-9]*\\.?[0-9]*' }}
              InputProps={{ sx: { '& input': { textAlign: 'right' } } }}
            />
            <TextField
              label="หมายเหตุรายการ"
              value={lineNote}
              onChange={(event) => setLineNote(event.target.value)}
              fullWidth
              sx={{ gridColumn: { xs: '1', md: '1 / -1' } }}
            />
            <Box sx={{ gridColumn: { xs: '1', md: '1 / -1' }, display: 'flex', width: '100%' }}>
              <Button
                sx={{ ...getPurchaseDialogSecondaryButtonSx(theme), minHeight: 56, whiteSpace: 'nowrap', width: '100%' }}
                variant="outlined"
                startIcon={<AddIcon sx={{ fontSize: 18 }} />}
                onClick={addDraftLine}
                disabled={!canAddCurrentLine}
              >
                เพิ่มรายการ
              </Button>
            </Box>
          </Box>

          <TableContainer sx={{ ...getPurchaseDialogTableSx(theme), mt: 1.5, maxHeight: PR_DIALOG_TABLE_HEIGHT, height: PR_DIALOG_TABLE_HEIGHT }}>
            <Table size="small" stickyHeader sx={getTableSx(theme)}>
              <TableHead>
                <TableRow>
                  <TableCell width={56}>#</TableCell>
                  <TableCell>สินค้า</TableCell>
                  <TableCell width={120} align="right">จำนวน</TableCell>
                  <TableCell width={90}>หน่วย</TableCell>
                  <TableCell width={130} align="right">ราคาประมาณ</TableCell>
                  <TableCell>หมายเหตุ</TableCell>
                  <TableCell width={70} align="right">จัดการ</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {draftLines.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center" sx={{ py: 5, color: 'text.secondary' }}>
                      ยังไม่มีรายการสินค้า
                    </TableCell>
                  </TableRow>
                ) : (
                  draftLines.map((line, index) => {
                    const item = resolveItem(line.centralWarehouseItemId);

                    return (
                      <TableRow key={line.id} hover>
                        <TableCell>{index + 1}</TableCell>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontWeight: 800, color: 'primary.main' }}>
                            {item?.code ?? '-'} - {item?.name ?? 'ไม่พบ item'}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">{line.requestedQuantity.toLocaleString()}</TableCell>
                        <TableCell>{item?.unit ?? '-'}</TableCell>
                        <TableCell align="right">{line.estimatedPrice.toLocaleString()}</TableCell>
                        <TableCell>{line.note || '-'}</TableCell>
                        <TableCell align="right">
                          <IconButton
                            aria-label="ลบรายการ"
                            size="small"
                            onClick={() => removeDraftLine(line.id)}
                            disabled={draftLines.length <= 1}
                            sx={{ color: 'error.main' }}
                          >
                            <DeleteIcon sx={{ fontSize: 18 }} />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Stack>
      </Box>

      <Typography variant="caption" sx={{ color: 'text.secondary', fontStyle: 'italic', pl: 0.5 }}>
        รวม {draftLines.length.toLocaleString()} รายการ · {totalDraftQuantity.toLocaleString()} หน่วย
      </Typography>
    </Stack>
  );





  const renderFarmScope = () => (
    <>
      <Box>
        <Grid container spacing={1.5}>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <StatsCard
              title="ใบแจ้งทั้งหมด"
              value={requests.length}
              subtitle="เอกสารทั้งหมด"
              icon={<ReceiptLongOutlined />}
              color="info"
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <StatsCard
              title="รออนุมัติ"
              value={pendingCount}
              subtitle="สถานะ Pending"
              icon={<PendingActionsOutlined />}
              color="warning"
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <StatsCard
              title="อนุมัติแล้ว"
              value={approvedCount}
              subtitle="สถานะ Approved"
              icon={<CheckCircleIcon />}
              color="success"
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <StatsCard
              title="รับเข้าบางส่วน"
              value={processingCount}
              subtitle="กำลังดำเนินการ"
              icon={<LocalShippingIcon />}
              color="primary"
            />
          </Grid>
        </Grid>
      </Box>

      <Box sx={{ ...panelSx, p: 1.5 }}>
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
            <Button
              variant="contained"
              startIcon={<AddIcon sx={{ fontSize: 18 }} />}
              onClick={handleOpenCreate}
              sx={{
                borderRadius: 2.2,
                bgcolor: 'primary.main',
                boxShadow: 1,
                '&:hover': { bgcolor: 'primary.dark' },
              }}
            >
              สร้างใบแจ้ง
            </Button>
            <Button
              variant="contained"
              startIcon={<AddIcon sx={{ fontSize: 18 }} />}
              onClick={handleOpenCreate}
              sx={{
                borderRadius: 2.2,
                bgcolor: 'primary.dark',
                boxShadow: 1,
                '&:hover': { bgcolor: theme.palette.primary.dark },
              }}
            >
              สร้างใบแจ้งสุกร
            </Button>
            <Button
              variant="outlined"
              startIcon={<RefreshIcon sx={{ fontSize: 18 }} />}
              onClick={() => void loadData()}
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
          <StockReplenishmentFilters
            searchText={searchText}
            statusFilter={statusFilter}
            urgencyFilter={urgencyFilter}
            onSearchTextChange={setSearchText}
            onStatusFilterChange={setStatusFilter}
            onUrgencyFilterChange={setUrgencyFilter}
            onClear={() => {
              setSearchText('');
              setStatusFilter('all');
              setUrgencyFilter('all');
            }}
          />
          <StockReplenishmentRequestTable
            rows={filteredRequests}
            variant="farm"
            page={page}
            rowsPerPage={rowsPerPage}
            selectedRequestId={selectedRequestId}
            onSelectedRequestIdChange={setSelectedRequestId}
            onPageChange={(_, nextPage) => setPage(nextPage)}
            onRowsPerPageChange={setRowsPerPage}
          />
        </Stack>
      </Box>
    </>
  );

  const renderCentralScope = () => (
    <>
      <Box>
        <Grid container spacing={1.5}>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <StatsCard
              title="ใบแจ้งทั้งหมด"
              value={requests.length}
              subtitle="เอกสารทั้งหมด"
              icon={<ReceiptLongOutlined />}
              color="info"
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <StatsCard
              title="รออนุมัติ"
              value={pendingCount}
              subtitle="สถานะ Pending"
              icon={<PendingActionsOutlined />}
              color="warning"
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <StatsCard
              title="อนุมัติแล้ว"
              value={approvedCount}
              subtitle="สถานะ Approved"
              icon={<CheckCircleIcon />}
              color="success"
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <StatsCard
              title="รับเข้าบางส่วน"
              value={processingCount}
              subtitle="กำลังดำเนินการ"
              icon={<LocalShippingIcon />}
              color="primary"
            />
          </Grid>
        </Grid>
      </Box>

      <Box sx={{ ...panelSx, p: 1.5 }}>
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
            <Button
              variant="outlined"
              startIcon={<LocalShippingIcon sx={{ fontSize: 18 }} />}
              href="/warehouse/purchase-request"
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
              ไปหน้า PR เพื่อดึงยอดรวม
            </Button>
            <Button
              variant="outlined"
              startIcon={<RefreshIcon sx={{ fontSize: 18 }} />}
              onClick={() => void loadData()}
              disabled={loading}
              sx={{
                borderRadius: 2.2,
                bgcolor: 'background.paper',
                borderColor: 'divider',
                color: 'text.primary',
                boxShadow: 1,
              }}
            >
              รีเฟรช
            </Button>
          </Box>
          <StockReplenishmentFilters
            searchText={searchText}
            statusFilter={statusFilter}
            urgencyFilter={urgencyFilter}
            onSearchTextChange={setSearchText}
            onStatusFilterChange={setStatusFilter}
            onUrgencyFilterChange={setUrgencyFilter}
            onClear={() => {
              setSearchText('');
              setStatusFilter('all');
              setUrgencyFilter('all');
            }}
          />
          <StockReplenishmentRequestTable
            rows={filteredRequests}
            variant="central"
            page={page}
            rowsPerPage={rowsPerPage}
            selectedRequestId={selectedRequestId}
            onSelectedRequestIdChange={setSelectedRequestId}
            onPageChange={(_, nextPage) => setPage(nextPage)}
            onRowsPerPageChange={setRowsPerPage}
          />
        </Stack>
      </Box>
    </>
  );

  const renderCreateDialog = () => (
    <Dialog
      open={createDialogOpen}
      onClose={() => setCreateDialogOpen(false)}
      maxWidth="lg"
      fullWidth
      PaperProps={{ sx: getPurchaseDialogPaperSx(theme) }}
    >
      <DialogTitleWithClose
        onClose={() => setCreateDialogOpen(false)}
        variant="master"
      >
        {draftLines.length > 0 && requests.some(r => r.lines[0]?.id === draftLines[0]?.id) ? 'แก้ไขใบแจ้งเติมสต็อกคลังกลาง' : 'สร้างใบแจ้งเติมสต็อกคลังกลาง'}
      </DialogTitleWithClose>
      <DialogContent dividers sx={getPurchaseDialogContentSx(theme)}>
        {formError ? <Alert severity="error" sx={{ mb: 2 }}>{formError}</Alert> : null}
        {renderFarmComposer()}
      </DialogContent>
      <DialogActions sx={getPurchaseDialogActionsSx(theme)}>
        <Box sx={{ flexGrow: 1 }} />
        <Button onClick={() => setCreateDialogOpen(false)} sx={getPurchaseDialogSecondaryButtonSx(theme)}>ยกเลิก</Button>
        <Button
          variant="contained"
          onClick={submitRequest}
          disabled={draftLines.length === 0}
          sx={getPurchaseDialogPrimaryButtonSx(theme)}
        >
          บันทึก
        </Button>
      </DialogActions>
    </Dialog>
  );

  const renderDetailDialog = () => {
    if (!selectedRequest) return null;

    return (
      <Dialog
        open={Boolean(selectedRequest)}
        onClose={() => setSelectedRequestId('')}
        maxWidth="lg"
        fullWidth
        PaperProps={{ sx: getPurchaseDialogPaperSx(theme) }}
      >
      <DialogTitleWithClose onClose={() => setSelectedRequestId('')} variant="master">
        <Stack alignItems="center" spacing={0.5}>
          <Typography variant="h6" sx={{ fontWeight: 900 }}>
            รายละเอียดคำขอเติมสต็อกกลาง
          </Typography>
          {selectedRequest && (
            <StatusBadge
              label={urgencyLabel[selectedRequest?.urgency]}
              type={getUrgencyBadgeType(selectedRequest?.urgency)}
              size="small"
            />
          )}
        </Stack>
      </DialogTitleWithClose>
      <DialogContent dividers sx={getPurchaseDialogContentSx(theme)}>
        {selectedRequest ? (
          <Stack spacing={2.5}>
            <Stack spacing={2}>
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr 1fr' }, gap: 1.5 }}>
                {/* เลขที่ใบแจ้ง */}
                <Paper elevation={0} sx={{ ...panelSx, p: 1.75 }}>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.25 }}>
                    เลขที่ใบแจ้ง
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 900, color: 'primary.main', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {selectedRequest.requestNo}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    วันที่แจ้ง: {selectedRequest.requestDate}
                  </Typography>
                </Paper>

                {/* ฟาร์มผู้ส่ง */}
                <Paper elevation={0} sx={{ ...panelSx, p: 1.75 }}>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.25 }}>
                    ฟาร์มผู้ส่ง
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 900, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {selectedRequest.sourceFacilityName}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    รหัส: {selectedRequest.sourceFacilityCode ?? '-'}
                  </Typography>
                </Paper>

                {/* สถานะ */}
                <Paper elevation={0} sx={{ ...panelSx, p: 1.75 }}>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.25 }}>
                    สถานะเอกสาร
                  </Typography>
                  <Box sx={{ mt: 0.5 }}>
                    <StatusBadge
                      label={toThaiWorkflowStatus(selectedRequest.status)}
                      type={getWorkflowStatusType(selectedRequest.status)}
                      size="small"
                    />
                  </Box>
                </Paper>
              </Box>

              <Box>
                <JBFarmTable
                  columns={[
                    {
                      id: 'no',
                      label: '#',
                      width: 50,
                      render: (_, index) => (
                        <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600 }}>
                          {index + 1}
                        </Typography>
                      ),
                    },
                    {
                      id: 'item',
                      label: 'สินค้า',
                      width: 250,
                      render: (line) => (
                        <Typography variant="body2" sx={{ fontWeight: 800, color: 'primary.main' }}>
                          {line.itemCode} - {line.itemName}
                        </Typography>
                      ),
                    },
                    {
                      id: 'quantity',
                      label: 'จำนวนขอ',
                      width: 120,
                      align: 'right',
                      render: (line) => (
                        <Typography variant="body2" sx={{ fontWeight: 700 }}>
                          {line.requestedQuantity.toLocaleString()}
                        </Typography>
                      ),
                    },
                    {
                      id: 'uom',
                      label: 'หน่วย',
                      width: 90,
                      render: (line) => (
                        <Typography variant="body2" color="text.secondary">
                          {line.unit}
                        </Typography>
                      ),
                    },
                    {
                      id: 'price',
                      label: 'ราคาประมาณ',
                      width: 130,
                      align: 'right',
                      render: (line) => (
                        <Typography variant="body2" sx={{ fontWeight: 800 }}>
                          {(line.requestedQuantity * line.estimatedUnitPrice).toLocaleString()} ฿
                        </Typography>
                      ),
                    },
                    {
                      id: 'remarks',
                      label: 'หมายเหตุ',
                      width: 180,
                      render: (line) => (
                        <Typography variant="body2" color="text.secondary">
                          {line.note || '-'}
                        </Typography>
                      ),
                    },
                  ]}
                  rows={selectedRequest.lines}
                  height={320}
                  minWidth={800}
                  getRowId={(line) => line.id}
                  showPagination={false}
                  emptyMessage="ไม่พบรายการสินค้า"
                  footer={(
                    <Box sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      bgcolor: (t) => alpha(t.palette.primary.main, 0.06),
                      px: 3,
                      py: 1.5,
                    }}>
                      <Typography sx={{ fontWeight: 900, color: 'primary.main', fontSize: '1rem' }}>
                        รวมทั้งหมด
                      </Typography>
                      <Typography sx={{ fontWeight: 900, color: 'primary.main', fontSize: '1.1rem' }}>
                        {selectedRequest.lines.reduce((sum, line) => sum + (line.requestedQuantity * line.estimatedUnitPrice), 0).toLocaleString()} ฿
                      </Typography>
                    </Box>
                  )}
                />
              </Box>

              <Paper elevation={0} sx={{ ...panelSx, p: 1.75 }}>
                <Typography variant="caption" color="text.secondary">
                  ข้อมูลเพิ่มเติม
                </Typography>
                <Typography variant="body2" sx={{ mt: 0.75 }}>
                  ผู้ขอ: {selectedRequest.requestedByName} · ต้องการภายใน: {formatShortDate(selectedRequest.requiredByDate) || '-'} · อัปเดตล่าสุด: {formatDateTime(selectedRequest.updatedAt)}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.75 }}>
                  หมายเหตุ: {selectedRequest.note || '-'}
                </Typography>
              </Paper>
            </Stack>

            {selectedRequest.status !== DocumentStatus.Draft && renderWorkflowStepper(selectedRequest.status)}
          </Stack>
        ) : null}
      </DialogContent>
      {(scope === 'central' || [DocumentStatus.Draft, DocumentStatus.Returned].includes(selectedRequest?.status as DocumentStatus)) && selectedRequest ? (
        <DialogActions sx={getPurchaseDialogActionsSx(theme)}>
          {renderActionButtons(selectedRequest)}
        </DialogActions>
      ) : null}
    </Dialog>
  );
};

  return (
    <Box sx={{ maxWidth: 1400, mx: 'auto', p: { xs: 1, md: 2 } }}>
      <WorkspaceHeader
        chipLabel={scope === 'central' ? 'คลังกลาง' : 'ฟาร์ม'}
        title="ใบแจ้งเติมสต็อกคลังกลาง"
        meta="Warehouse / เติมสต็อกกลาง"
      />

      {/* Stats + Content */}
      <Stack spacing={2.5}>
        {apiError ? <Alert severity="error" sx={{ mb: 2 }}>{apiError}</Alert> : null}
        {loading ? <Alert severity="info" sx={{ mb: 2 }}>กำลังโหลด/บันทึกข้อมูลใบแจ้งเติมสต็อก...</Alert> : null}
        {scope === 'farm' ? renderFarmScope() : renderCentralScope()}
      </Stack>

      {/* Dialogs */}
      {scope === 'farm' ? renderCreateDialog() : null}
      {renderDetailDialog()}
    </Box>
  );
}
