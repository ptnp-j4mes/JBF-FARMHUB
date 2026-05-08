import { useMemo, useState, useRef } from 'react';
import {
  Alert,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  FormControl,
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
import {
  Add as AddIcon,
  Refresh as RefreshIcon,
  PendingActionsOutlined,
  TaskAltOutlined,
  DraftsOutlined,
  ReceiptLongOutlined,
  Delete as DeleteIcon,
  Search as SearchIcon,
  CancelOutlined as CancelOutlinedIcon,
  CheckCircle as CheckCircleIcon,
  LocalShippingOutlined as LocalShippingIcon,
} from '@mui/icons-material';
import { DocumentStatus } from '@/types/status.types';
import { toThaiWorkflowStatus, getWorkflowStatusChipSx } from '@/lib/utils/status.util';
import DialogTitleWithClose from '../../../components/common/DialogTitleWithClose';
import { PR_DIALOG_TABLE_HEIGHT } from '../../../core/ui-patterns/pr-ui.constants';
import {
  PURCHASE_DIALOG_ACTIONS_SX,
  PURCHASE_DIALOG_CONTENT_SX,
  PURCHASE_DIALOG_FIELDSET_SX,
  PURCHASE_DIALOG_INFO_ALERT_SX,
  PURCHASE_DIALOG_LEGEND_SX,
  PURCHASE_DIALOG_PAPER_SX,
  PURCHASE_DIALOG_PRIMARY_BUTTON_SX,
  PURCHASE_DIALOG_SECONDARY_BUTTON_SX,
  PURCHASE_DIALOG_TABLE_SX,
  PURCHASE_DIALOG_UI,
  PURCHASE_DIALOG_TITLE_SX,
} from '../../../features/production/purchase/components/purchase-dialog.constants';

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
};

export interface TestCentralStockAlertHubProps {
  scope: CentralAlertScope;
  currentFacilityName: string;
  currentFacilityCode?: string;
  currentUserName: string;
  centralHubName: string;
  centralHubCode?: string;
  items: CentralAlertItem[];
  requests: CentralAlertRequest[];
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
    action: 'approve' | 'reject' | 'return' | 'cancel',
  ) => void;
}

type DraftLine = {
  id: string;
  centralWarehouseItemId: string;
  requestedQuantity: number;
  estimatedPrice: number;
  note: string;
};

// Remove statusCopy as we now use toThaiWorkflowStatus and getWorkflowStatusChipSx

const lineStatusCopy: Record<CentralAlertRequestLineStatus, { label: string; tone: 'success' | 'warning' | 'error' | 'info' | 'default' }> = {
  open: { label: 'รอดำเนินการ', tone: 'info' },
  approved: { label: 'อนุมัติ', tone: 'success' },
  rejected: { label: 'ปฏิเสธ', tone: 'error' },
};

const urgencyCopy: Record<CentralAlertRequest['urgency'], { label: string; tone: 'default' | 'warning' | 'error' }> = {
  normal: { label: 'ปกติ', tone: 'default' },
  important: { label: 'ด่วน', tone: 'warning' },
  critical: { label: 'เร่งด่วน', tone: 'error' },
};

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

const panelSx = {
  border: '1px solid',
  borderColor: 'divider',
  borderRadius: 10,
  bgcolor: 'background.paper',
  overflow: 'hidden',
} as const;

const headerPanelSx = {
  ...panelSx,
  position: 'relative',
  overflow: 'hidden',
  px: 2,
  py: 1.8,
} as const;

const tableSx = {
  '& .MuiTableCell-head': {
    bgcolor: PURCHASE_DIALOG_UI.accent + ' !important',
    color: '#fff !important',
    fontWeight: 900,
    borderColor: alpha('#fff', 0.1),
  },
  '& .MuiTableCell-body': {
    borderColor: '#E5EEE8',
  },
} as const;

export default function TestCentralStockAlertHub({
  scope,
  currentFacilityName,
  currentFacilityCode,
  currentUserName,
  centralHubName,
  centralHubCode,
  items,
  requests,
  onCreateRequest,
  onActionRequest,
}: TestCentralStockAlertHubProps) {
  const theme = useTheme();
  const headerRef = useRef<HTMLDivElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);
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
  const renderWorkflowStepper = (status: string) => {
    const upperStatus = String(status).toUpperCase();
    const isSpecialCase = upperStatus === DocumentStatus.Approved.toUpperCase(); 
    const isBypassCase = upperStatus === DocumentStatus.Rejected.toUpperCase();

    // Mock data structure ที่รองรับ Level-based authorization
    // จะถูกแทนที่ด้วยข้อมูลจาก API: GET /api/approvals/{documentType}/{documentId}/history
    const steps = [
      { 
        label: 'ผู้จัดทำ', 
        name: 'นาย สมชาย', 
        role: 'ผู้ดูแลระบบ',
        date: '26/04/2026 09:00', 
        status: 'completed',
        requiredLevel: 0,
        effectiveLevel: 0,
        authType: 'RolePermission' as 'RolePermission' | 'UserOverride' | 'SuperAdmin' | 'Bypassed' | null
      },
      { 
        label: 'ผู้จัดการฟาร์ม', 
        name: isBypassCase ? 'นาย สุรศักดิ์' : 'นาย วิชาญ',
        role: isBypassCase ? 'ผู้ดูแลระบบสูงสุด' : 'ผู้จัดการ',
        date: '26/04/2026 13:00', 
        status: isBypassCase ? 'bypassed' : (upperStatus === DocumentStatus.Pending.toUpperCase() ? 'active' : (upperStatus === DocumentStatus.Approved.toUpperCase() ? 'completed' : (upperStatus === DocumentStatus.Rejected.toUpperCase() ? 'error' : (upperStatus === DocumentStatus.Returned.toUpperCase() ? 'warning' : 'pending')))),
        requiredLevel: 1,
        effectiveLevel: isBypassCase ? 999 : 1,
        authType: (isBypassCase ? 'SuperAdmin' : 'RolePermission') as 'RolePermission' | 'UserOverride' | 'SuperAdmin' | 'Bypassed' | null
      },
      { 
        label: 'แผนกคลังสินค้ากลาง', 
        name: isSpecialCase ? 'นาย ณเดชน์' : 'นางสาว สมศรี',
        role: isSpecialCase ? 'สัตวบาล' : 'ฝ่ายคลังสินค้า',
        date: isSpecialCase ? '26/04/2026 15:30' : '-', 
        status: isSpecialCase ? 'completed' : (isBypassCase ? 'bypassed' : (status === DocumentStatus.Approved ? 'active' : 'pending')),
        requiredLevel: 2,
        effectiveLevel: isSpecialCase ? 2 : 0,
        authType: (isSpecialCase ? 'UserOverride' : (isBypassCase ? 'SuperAdmin' : null)) as 'RolePermission' | 'UserOverride' | 'SuperAdmin' | 'Bypassed' | null
      },
    ];

    const authTypeConfig: Record<string, { label: string; bgcolor: string; color: string; border: string }> = {
      RolePermission: { label: 'ตามตำแหน่ง', bgcolor: '#e8f5e9', color: '#2e7d32', border: '#c8e6c9' },
      UserOverride: { label: 'สิทธิพิเศษ', bgcolor: '#fff9e6', color: '#b28900', border: '#ffeeba' },
      SuperAdmin: { label: 'ผู้ดูแลระบบสูงสุด', bgcolor: '#fce4ec', color: '#c62828', border: '#f8bbd0' },
    };

    return (
      <Box sx={{ 
        width: { xs: '100%', md: 280 }, 
        borderLeft: { md: '1px solid' }, 
        borderColor: 'divider', 
        pl: { md: 2.5 },
        pt: { xs: 2, md: 0 }
      }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 900, mb: 2, color: 'text.secondary', display: 'flex', alignItems: 'center', gap: 1 }}>
          <ReceiptLongOutlined sx={{ fontSize: 18 }} />
          ลำดับการอนุมัติ
        </Typography>
        <Stepper orientation="vertical" nonLinear sx={{ 
          '& .MuiStepConnector-line': { minHeight: 40 },
          '& .MuiStepLabel-label': { fontWeight: 800 }
        }}>
          {steps.map((step, index) => (
            <Step key={index} active={step.status === 'active'} completed={step.status === 'completed' || step.status === 'bypassed'}>
              <StepLabel 
                error={step.status === 'error'}
                StepIconProps={{
                  sx: {
                    ...(step.status === 'completed' && { color: '#2e7d32 !important' }),
                    ...(step.status === 'warning' && { color: '#ed6c02 !important' }),
                    ...(step.status === 'active' && { color: '#1976d2 !important' }),
                    ...(step.status === 'bypassed' && { color: '#9e9e9e !important' }),
                  }
                }}
              >
                <Box>
                  <Stack direction="row" spacing={0.5} alignItems="center">
                    <Typography variant="body2" sx={{ fontWeight: 900, color: step.status === 'bypassed' ? 'text.disabled' : 'text.primary' }}>
                      {step.label}
                    </Typography>
                    {step.requiredLevel > 0 && (
                      <Typography variant="caption" sx={{ 
                        px: 0.5, py: 0.1, bgcolor: '#e3f2fd', color: '#1565c0', 
                        borderRadius: 10, fontSize: '0.6rem', fontWeight: 800, border: '1px solid #bbdefb'
                      }}>
                        Lv.{step.requiredLevel}
                      </Typography>
                    )}
                  </Stack>
                  
                  <Typography variant="caption" sx={{ display: 'block', color: step.status === 'bypassed' ? 'text.disabled' : 'text.secondary', fontWeight: 600 }}>
                    {step.name} ({step.role})
                  </Typography>

                  {step.authType && step.status !== 'pending' && step.status !== 'active' && (
                    <Box sx={{ mt: 0.5, display: 'flex', flexWrap: 'wrap', gap: 0.5, alignItems: 'center' }}>
                      <Chip 
                        label={authTypeConfig[step.authType]?.label || step.authType}
                        size="small" 
                        sx={{ 
                          height: 16, 
                          fontSize: '0.6rem',
                          bgcolor: authTypeConfig[step.authType]?.bgcolor || '#f5f5f5',
                          color: authTypeConfig[step.authType]?.color || '#616161',
                          border: `1px solid ${authTypeConfig[step.authType]?.border || '#e0e0e0'}`,
                          fontWeight: 800,
                          '& .MuiChip-label': { px: 0.8 }
                        }} 
                      />
                      {step.effectiveLevel > 0 && step.authType !== 'SuperAdmin' && (
                        <Typography variant="caption" sx={{ fontSize: '0.6rem', color: 'text.disabled' }}>
                          Lv.{step.effectiveLevel}
                        </Typography>
                      )}
                    </Box>
                  )}

                  {step.date !== '-' && step.status !== 'bypassed' && (
                    <Typography variant="caption" sx={{ display: 'block', color: 'text.disabled', fontSize: '0.7rem', mt: 0.5 }}>
                      {step.date}
                    </Typography>
                  )}
                  {step.status === 'error' && (
                    <Typography variant="caption" sx={{ display: 'block', color: 'error.main', mt: 0.5, bgcolor: '#fff5f5', p: 0.5, borderRadius: 10, border: '1px solid #ffe3e3' }}>
                      ไม่อนุมัติ: ข้อมูลสินค้าไม่ถูกต้อง
                    </Typography>
                  )}
                  {step.status === 'warning' && (
                    <Typography variant="caption" sx={{ display: 'block', color: 'warning.main', mt: 0.5, bgcolor: '#fff9f0', p: 0.5, borderRadius: 10, border: '1px solid #ffecce' }}>
                      ตีกลับ: กรุณาแนบไฟล์เพิ่มเติม
                    </Typography>
                  )}
                </Box>
              </StepLabel>
            </Step>
          ))}
        </Stepper>
      </Box>
    );
  };
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [formError, setFormError] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);

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
  const draftCount = requests.filter((request) => request.status === DocumentStatus.Draft).length;
  const returnedCount = requests.filter((request) => request.status === DocumentStatus.Returned).length;
  const rejectedCount = requests.filter((request) => request.status === DocumentStatus.Rejected).length;
  const cancelledCount = requests.filter((request) => request.status === DocumentStatus.Cancelled).length;

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

  const summaryCards = useMemo(() => {
    const totalCount = requests.length;
    const cards = [
      {
        title: 'ใบแจ้งทั้งหมด',
        value: totalCount,
        subtitle: 'เอกสารทั้งหมด',
        color: '#4a6982',
        iconBg: '#e9f0f6',
        icon: <ReceiptLongOutlined sx={{ fontSize: 20 }} />,
        status: 'all',
      },
      {
        title: toThaiWorkflowStatus(DocumentStatus.Approved),
        value: approvedCount,
        subtitle: 'สถานะ Approved',
        color: '#2e7d32',
        iconBg: '#ecf7ee',
        icon: <TaskAltOutlined sx={{ fontSize: 20 }} />,
        status: DocumentStatus.Approved,
      },
      {
        title: toThaiWorkflowStatus(DocumentStatus.Rejected),
        value: rejectedCount,
        subtitle: 'สถานะ Rejected',
        color: '#d32f2f',
        iconBg: '#ffebee',
        icon: <CancelOutlinedIcon sx={{ fontSize: 20 }} />,
        status: DocumentStatus.Rejected,
      },
      {
        title: toThaiWorkflowStatus(DocumentStatus.Pending),
        value: pendingCount,
        subtitle: 'สถานะ Pending',
        color: '#d68b00',
        iconBg: '#fff3df',
        icon: <PendingActionsOutlined sx={{ fontSize: 20 }} />,
        status: DocumentStatus.Pending,
      },
      {
        title: toThaiWorkflowStatus(DocumentStatus.Returned),
        value: returnedCount,
        subtitle: 'สถานะ Returned',
        color: '#7c3aed',
        iconBg: '#f5f3ff',
        icon: <RefreshIcon sx={{ fontSize: 20 }} />,
        status: DocumentStatus.Returned,
      },
      {
        title: toThaiWorkflowStatus(DocumentStatus.Draft),
        value: draftCount,
        subtitle: 'สถานะ Draft',
        color: '#7c5ce5',
        iconBg: '#e4ddf4',
        icon: <DraftsOutlined sx={{ fontSize: 20 }} />,
        status: DocumentStatus.Draft,
      },
      {
        title: toThaiWorkflowStatus(DocumentStatus.Cancelled),
        value: cancelledCount,
        subtitle: 'สถานะ Cancelled',
        color: '#be123c',
        iconBg: '#fff1f2',
        icon: <CancelOutlinedIcon sx={{ fontSize: 20 }} />,
        status: DocumentStatus.Cancelled,
      },
    ];

    return cards;
  }, [approvedCount, draftCount, requests.length, pendingCount, returnedCount, rejectedCount, cancelledCount]);

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
    setLineEstimatedPrice(0);
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

  const submitRequest = () => {
    setFormError('');
    onCreateRequest?.({
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
  };

  const canAddCurrentLine = Boolean(selectedItem) && Number(lineQuantity) >= 1;

  const renderActionButtons = (request: CentralAlertRequest, compact = false) => (
    <Stack
      direction="row"
      spacing={0.75}
      justifyContent={compact ? 'flex-end' : 'flex-start'}
      alignItems="center"
      flexWrap="nowrap"
      sx={{ whiteSpace: 'nowrap' }}
    >
      {scope === 'central' && request.status === DocumentStatus.Pending && (
        <>
          <Tooltip title="ยกเลิกคำขอ">
            <span>
              <Button
                size="small"
                variant="outlined"
                color="error"
                startIcon={<CancelOutlinedIcon sx={{ fontSize: 16 }} />}
                onClick={() => onActionRequest?.(request.id, 'cancel' as any)}
                disabled={!onActionRequest}
                sx={{ height: 32, borderRadius: 10, px: 1.4 }}
              >
                ยกเลิก
              </Button>
            </span>
          </Tooltip>
          <Tooltip title="อนุมัติ">
            <span>
              <Button
                size="small"
                variant="contained"
                startIcon={<TaskAltOutlined sx={{ fontSize: 16 }} />}
                onClick={() => onActionRequest?.(request.id, 'approve')}
                disabled={!onActionRequest}
                sx={{ height: 32, borderRadius: 10, px: 1.4, bgcolor: '#2e7d32', '&:hover': { bgcolor: '#1b5e20' } }}
              >
                อนุมัติ
              </Button>
            </span>
          </Tooltip>
          <Tooltip title="ตีกลับ">
            <span>
              <Button
                size="small"
                variant="outlined"
                color="warning"
                startIcon={<RefreshIcon sx={{ fontSize: 16 }} />}
                onClick={() => onActionRequest?.(request.id, 'return' as any)}
                disabled={!onActionRequest}
                sx={{ height: 32, borderRadius: 10, px: 1.4 }}
              >
                ตีกลับ
              </Button>
            </span>
          </Tooltip>
          <Tooltip title="ไม่อนุมัติ">
            <span>
              <Button
                size="small"
                variant="outlined"
                color="error"
                startIcon={<CancelOutlinedIcon sx={{ fontSize: 16 }} />}
                onClick={() => onActionRequest?.(request.id, 'reject')}
                disabled={!onActionRequest}
                sx={{ height: 32, borderRadius: 10, px: 1.4 }}
              >
                ไม่อนุมัติ
              </Button>
            </span>
          </Tooltip>
        </>
      )}
      {scope === 'farm' && [DocumentStatus.Draft, DocumentStatus.Returned].includes(request.status) && (
        <>
          <Button
            size="small"
            variant="contained"
            onClick={() => setSelectedRequestId('')}
            sx={{ height: 32, borderRadius: 10, px: 1.4, bgcolor: PURCHASE_DIALOG_UI.accent, '&:hover': { bgcolor: '#124840' } }}
          >
            ส่งอนุมัติ
          </Button>
          <Button
            size="small"
            variant="outlined"
            onClick={() => {
              setSelectedRequestId('');
              setDraftLines(request.lines.map((line) => ({
                id: line.id,
                centralWarehouseItemId: line.centralWarehouseItemId,
                requestedQuantity: line.requestedQuantity,
                estimatedPrice: 0,
                note: line.note || '',
              })));
              setCreateDialogOpen(true);
            }}
            sx={{ height: 32, borderRadius: 10, px: 1.4 }}
          >
            แก้ไข
          </Button>
        </>
      )}
    </Stack>
  );

  const renderFarmComposer = () => (
    <Stack spacing={2}>
      <Box component="fieldset" sx={PURCHASE_DIALOG_FIELDSET_SX}>
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

      <Box component="fieldset" sx={PURCHASE_DIALOG_FIELDSET_SX}>
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
                setLineEstimatedPrice(Number(lineQuantity) * 450);
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
                  setLineEstimatedPrice((Number(val) || 0) * 450);
                }
              }}
              onBlur={() => {
                if (!lineQuantity || Number(lineQuantity) <= 0) {
                  setLineQuantity(1);
                  setLineEstimatedPrice(1 * 450);
                }
              }}
              inputProps={{ inputMode: 'decimal', pattern: '[0-9]*\\.?[0-9]*' }}
              InputProps={{ sx: { '& input': { textAlign: 'right' } } }}
            />
            <TextField
              label="ราคาประมาณ (บาท)"
              value={lineEstimatedPrice.toLocaleString()}
              InputProps={{
                readOnly: true,
                sx: { '& input': { textAlign: 'right' }, bgcolor: 'rgba(0,0,0,0.03)' },
              }}
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
                sx={{ ...PURCHASE_DIALOG_SECONDARY_BUTTON_SX, minHeight: 56, whiteSpace: 'nowrap', width: '100%' }}
                variant="outlined"
                startIcon={<AddIcon sx={{ fontSize: 18 }} />}
                onClick={addDraftLine}
                disabled={!canAddCurrentLine}
              >
                เพิ่มรายการ
              </Button>
            </Box>
          </Box>

          <TableContainer sx={{ ...PURCHASE_DIALOG_TABLE_SX, mt: 1.5, maxHeight: PR_DIALOG_TABLE_HEIGHT, height: PR_DIALOG_TABLE_HEIGHT }}>
            <Table size="small" stickyHeader sx={tableSx}>
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
                            sx={{ color: '#d32f2f !important' }}
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

  const renderRequestTable = (rows: CentralAlertRequest[], variant: 'farm' | 'central') => {
    const paginatedRows = rows.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

    return (
      <Box sx={panelSx}>
        <Box sx={{ display: 'flex', flexDirection: 'column' }}>
          {/* Sync Scroll Header */}
          <Box 
            ref={headerRef}
            sx={{ 
              overflow: 'hidden', 
              bgcolor: '#F2F7F3',
              borderBottom: '1px solid #DDE8E1',
              pr: '8px', // Match scrollbar width for alignment
            }}
          >
            <Table size="small" sx={{ minWidth: 1320, tableLayout: 'fixed' }}>
              <TableHead>
                <TableRow>
                  <TableCell width={60} sx={{ bgcolor: 'transparent', fontWeight: 900, color: '#1B352B', borderBottom: 'none' }}>#</TableCell>
                  <TableCell width={150} sx={{ bgcolor: 'transparent', fontWeight: 900, color: '#1B352B', borderBottom: 'none' }}>เลขที่ใบแจ้ง</TableCell>
                  <TableCell width={120} sx={{ bgcolor: 'transparent', fontWeight: 900, color: '#1B352B', borderBottom: 'none' }}>วันที่แจ้ง</TableCell>
                  <TableCell width={130} sx={{ bgcolor: 'transparent', fontWeight: 900, color: '#1B352B', borderBottom: 'none' }}>ต้องการภายใน</TableCell>
                  <TableCell width={220} sx={{ bgcolor: 'transparent', fontWeight: 900, color: '#1B352B', borderBottom: 'none' }}>{variant === 'central' ? 'ฟาร์มผู้ส่ง' : 'ส่งไปที่'}</TableCell>
                  <TableCell width={100} sx={{ bgcolor: 'transparent', fontWeight: 900, color: '#1B352B', borderBottom: 'none' }}>รายการ</TableCell>
                  <TableCell width={120} sx={{ bgcolor: 'transparent', fontWeight: 900, color: '#1B352B', borderBottom: 'none' }}>ความเร่งด่วน</TableCell>
                  <TableCell width={130} sx={{ bgcolor: 'transparent', fontWeight: 900, color: '#1B352B', borderBottom: 'none' }}>สถานะ</TableCell>
                </TableRow>
              </TableHead>
            </Table>
          </Box>

          {/* Sync Scroll Body */}
          <Box 
            ref={bodyRef}
            onScroll={(e) => {
              if (headerRef.current) {
                headerRef.current.scrollLeft = e.currentTarget.scrollLeft;
              }
            }}
            sx={{ 
              height: 480, 
              overflowY: 'scroll', // Always show vertical scrollbar
              overflowX: 'auto',
              '&::-webkit-scrollbar': { width: 8, height: 8 },
              '&::-webkit-scrollbar-thumb': { bgcolor: '#2e7d32', borderRadius: 10},
              '&::-webkit-scrollbar-track': { bgcolor: 'transparent' },
            }}
          >
            <Table size="small" sx={{ minWidth: 1320, tableLayout: 'fixed' }}>
              <TableBody>
                {rows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} align="center" sx={{ py: 7, color: 'text.secondary' }}>
                      ไม่พบข้อมูลคำขอเติมสต็อกกลาง
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedRows.map((request, index) => (
                  <TableRow
                    key={request.id}
                    hover
                    selected={selectedRequestId === request.id}
                    onDoubleClick={() => {
                      setSelectedRequestId(request.id);
                    }}
                    sx={{ cursor: 'pointer' }}
                  >
                    <TableCell width={60} sx={{ borderColor: '#E5EEE8' }}>
                      <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600 }}>
                        {page * rowsPerPage + index + 1}
                      </Typography>
                    </TableCell>
                    <TableCell width={150} sx={{ borderColor: '#E5EEE8' }}>
                      <Typography variant="body2" sx={{ fontWeight: 900, color: 'primary.main' }}>
                        {request.requestNo}
                      </Typography>
                    </TableCell>
                    <TableCell width={120} sx={{ borderColor: '#E5EEE8' }}>
                      {formatShortDate(request.requestDate)}
                    </TableCell>
                    <TableCell width={130} sx={{ borderColor: '#E5EEE8' }}>
                      {request.requiredByDate ? formatShortDate(request.requiredByDate) : '-'}
                    </TableCell>
                    <TableCell width={220} sx={{ borderColor: '#E5EEE8', minWidth: 0 }}>
                      <Typography variant="body2" sx={{ fontWeight: 800, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {variant === 'central' ? request.sourceFacilityName : request.targetFacilityName}
                      </Typography>
                    </TableCell>
                    <TableCell width={100} sx={{ borderColor: '#E5EEE8', minWidth: 0 }}>
                      <Typography variant="body2" sx={{ fontWeight: 800, whiteSpace: 'nowrap' }}>
                        {request.lines.length}
                      </Typography>
                    </TableCell>
                    <TableCell width={120} sx={{ borderColor: '#E5EEE8' }}>
                      <Chip
                        label={urgencyCopy[request.urgency].label}
                        color={urgencyCopy[request.urgency].tone}
                        size="small"
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell width={130} sx={{ borderColor: '#E5EEE8' }}>
                      <Chip 
                        label={toThaiWorkflowStatus(request.status)} 
                        sx={getWorkflowStatusChipSx(request.status)} 
                        size="small" 
                      />
                    </TableCell>
                  </TableRow>
                ))
              )}
              </TableBody>
            </Table>
          </Box>
        </Box>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid', borderColor: 'divider', bgcolor: '#fcfdfc' }}>
        <Typography variant="body2" sx={{ fontWeight: 800, color: 'text.secondary', pl: 2 }}>
          รวมทั้งหมด {rows.length} รายการ
        </Typography>
        <TablePagination
          component="div"
          count={rows.length}
          page={page}
          onPageChange={(_, newPage) => setPage(newPage)}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={(e) => {
            setRowsPerPage(parseInt(e.target.value, 10));
            setPage(0);
          }}
          labelRowsPerPage="จำนวนรายการต่อหน้า:"
          labelDisplayedRows={({ from, to, count }) => `${from}-${to} จาก ${count !== -1 ? count : `มากกว่า ${to}`}`}
        />
      </Box>
    </Box>
  );
  };

  const renderFilters = () => (
    <Box>
      <Box
        sx={{
          display: 'grid',
          gap: 1.2,
          gridTemplateColumns: {
            xs: '1fr',
            md: 'minmax(280px,1fr) 170px minmax(220px,1.1fr) auto',
          },
          alignItems: 'center',
        }}
      >
        <TextField
          label="ค้นหา"
          value={searchText}
          onChange={(event) => setSearchText(event.target.value)}
          placeholder="เลขที่ใบแจ้ง, ฟาร์ม, item"
          size="small"
          sx={{
            width: '100%',
            '& .MuiOutlinedInput-root': {
              height: 40,
              borderRadius: 10,
              bgcolor: PURCHASE_DIALOG_UI.panelSoft,
              boxShadow: PURCHASE_DIALOG_UI.shadowSoft,
            },
            '& .MuiInputBase-input::placeholder': {
              color: PURCHASE_DIALOG_UI.muted,
              opacity: 1,
            },
          }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon sx={{ fontSize: 18, color: '#8d9592' }} />
              </InputAdornment>
            ),
          }}
        />
        <TextField
          select
          label="สถานะ"
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value as typeof statusFilter)}
          size="small"
          SelectProps={{
            displayEmpty: true,
            renderValue: (value) => (value === 'all' ? 'ทุกสถานะ' : toThaiWorkflowStatus(value as string)),
          }}
          sx={{
            '& .MuiOutlinedInput-root': {
              height: 40,
              minHeight: 40,
              borderRadius: 10,
              bgcolor: PURCHASE_DIALOG_UI.panelSoft,
              boxShadow: PURCHASE_DIALOG_UI.shadowSoft,
            },
            '& .MuiSelect-select': {
              color: statusFilter === 'all' ? 'text.secondary' : 'inherit',
            },
          }}
        >
          <MenuItem value="all">ทุกสถานะ</MenuItem>
          {Object.values(DocumentStatus)
            .filter(status => status !== DocumentStatus.PartiallyReceived && status !== DocumentStatus.Completed)
            .map((status) => (
              <MenuItem key={status} value={status}>
                {toThaiWorkflowStatus(status)}
              </MenuItem>
            ))}
        </TextField>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <TextField
            select
            label="ความเร่งด่วน"
            value={urgencyFilter}
            onChange={(event) =>
              setUrgencyFilter(event.target.value as typeof urgencyFilter)
            }
            size="small"
            SelectProps={{
              displayEmpty: true,
              renderValue: (value) => (value === 'all' ? 'ทั้งหมด' : urgencyCopy[value as CentralAlertRequest['urgency']].label),
            }}
            sx={{
              flex: 1,
              '& .MuiOutlinedInput-root': {
                height: 40,
                minHeight: 40,
                borderRadius: 10,
                bgcolor: PURCHASE_DIALOG_UI.panelSoft,
                boxShadow: PURCHASE_DIALOG_UI.shadowSoft,
              },
              '& .MuiSelect-select': {
                color: urgencyFilter === 'all' ? 'text.secondary' : 'inherit',
              },
            }}
          >
            <MenuItem value="all">ทั้งหมด</MenuItem>
            {Object.entries(urgencyCopy).map(([value, copy]) => (
              <MenuItem key={value} value={value}>
                {copy.label}
              </MenuItem>
            ))}
          </TextField>
        </Box>
        <Button
          variant="contained"
          onClick={() => {
            setSearchText('');
            setStatusFilter('all');
            setUrgencyFilter('all');
          }}
          sx={{
            height: 40,
            minWidth: 110,
            borderRadius: 10,
            bgcolor: PURCHASE_DIALOG_UI.accent,
            boxShadow: PURCHASE_DIALOG_UI.shadowSoft,
            '&:hover': { bgcolor: PURCHASE_DIALOG_UI.accentDark },
          }}
        >
          ล้างตัวกรอง
        </Button>
      </Box>
    </Box>
  );

  const renderFarmScope = () => (
    <Box sx={{ p: { xs: 2, md: 2.5 }, bgcolor: 'background.default', minHeight: 680 }}>
      <Stack spacing={1.75}>
        <Box
          sx={{
            display: 'grid',
            gap: 1.5,
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            '& > *': { minWidth: 0 },
          }}
        >
          {summaryCards.map((card) => (
            <Box key={card.title} sx={headerPanelSx}>
              <Box sx={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 1 }}>
                <Box>
                  <Typography sx={{ fontSize: '2.1rem', fontWeight: 700, color: '#1d2624', lineHeight: 1 }}>
                    {card.value.toLocaleString()}
                  </Typography>
                  <Typography sx={{ fontSize: '1rem', color: '#2f3a37', fontWeight: 800, mt: 0.55 }}>
                    {card.title}
                  </Typography>
                </Box>
                <Box
                  sx={{
                    width: 46,
                    height: 46,
                    borderRadius: 10,
                    bgcolor: '#fff',
                    border: `1px solid ${alpha(card.color, 0.15)}`,
                    boxShadow: PURCHASE_DIALOG_UI.shadowSoft,
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: card.color,
                  }}
                >
                  {card.icon}
                </Box>
              </Box>
              <Typography sx={{ position: 'relative', zIndex: 1, fontSize: '0.84rem', color: PURCHASE_DIALOG_UI.muted }}>
                {card.subtitle}
              </Typography>
              <Box sx={{ position: 'relative', zIndex: 1, mt: 1.8, width: 118, height: 8, borderRadius: 10, bgcolor: '#e7ece8' }}>
                <Box sx={{ width: 58, height: '100%', bgcolor: card.color, borderRadius: 10}} />
              </Box>
            </Box>
          ))}
        </Box>
        <Box
          sx={{
            ...panelSx,
            p: { xs: 1.25, md: 1.5 },
            display: 'flex',
            justifyContent: 'flex-start',
            gap: 1,
            flexWrap: 'wrap',
          }}
        >
          <Button
            variant="contained"
            startIcon={<AddIcon sx={{ fontSize: 18 }} />}
            onClick={handleOpenCreate}
            sx={{
              borderRadius: 10,
              bgcolor: PURCHASE_DIALOG_UI.accent,
              boxShadow: PURCHASE_DIALOG_UI.shadowSoft,
              '&:hover': { bgcolor: PURCHASE_DIALOG_UI.accentDark },
            }}
          >
            สร้างใบแจ้ง
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon sx={{ fontSize: 18 }} />}
            onClick={handleOpenCreate}
            sx={{
              borderRadius: 10,
              bgcolor: '#4d7f7b',
              boxShadow: PURCHASE_DIALOG_UI.shadowSoft,
              '&:hover': { bgcolor: '#3e6965' },
            }}
          >
            สร้างใบแจ้งสุกร
          </Button>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon sx={{ fontSize: 18 }} />}
            onClick={() => {
              setSearchText('');
              setStatusFilter('all');
              setUrgencyFilter('all');
            }}
            sx={{
              borderRadius: 10,
              bgcolor: '#fff',
              borderColor: PURCHASE_DIALOG_UI.borderStrong,
              color: PURCHASE_DIALOG_UI.text,
              boxShadow: PURCHASE_DIALOG_UI.shadowSoft,
              '&:hover': {
                borderColor: PURCHASE_DIALOG_UI.accent,
                bgcolor: '#f7faf7',
              },
            }}
          >
            รีเฟรช
          </Button>
        </Box>
        {renderFilters()}
        {renderRequestTable(filteredRequests, 'farm')}
      </Stack>
    </Box>
  );

  const renderCentralScope = () => (
    <Box sx={{ p: { xs: 2, md: 2.5 }, bgcolor: 'background.default' }}>
      <Stack spacing={2}>
          {(() => {
            const centralCards = summaryCards.filter(c => c.title !== 'ฉบับร่าง');
            return (
              <Box
                sx={{
                  display: 'grid',
                  gap: 1.5,
                  gridTemplateColumns: `repeat(auto-fit, minmax(220px, 1fr))`,
                  '& > *': { minWidth: 0 },
                }}
              >
                {centralCards.map((card) => (
                  <Box 
                    key={card.title} 
                    onClick={() => setStatusFilter(card.status as any)}
                    sx={{
                      ...headerPanelSx,
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      border: statusFilter === card.status ? `2px solid ${card.color}` : headerPanelSx.border,
                      '&:hover': {
                        transform: 'translateY(-2px)',
                        boxShadow: `0 8px 16px ${alpha(card.color, 0.1)}`,
                        borderColor: alpha(card.color, 0.5),
                      }
                    }}
                  >
                    <Box sx={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 1 }}>
                      <Box>
                        <Typography sx={{ fontSize: '2.1rem', fontWeight: 700, color: '#1d2624', lineHeight: 1 }}>
                          {card.value.toLocaleString()}
                        </Typography>
                        <Typography sx={{ fontSize: '1rem', color: '#2f3a37', fontWeight: 800, mt: 0.55 }}>
                          {card.title}
                        </Typography>
                      </Box>
                      <Box
                        sx={{
                          width: 46,
                          height: 46,
                          borderRadius: 10,
                          bgcolor: '#fff',
                          border: `1px solid ${alpha(card.color, 0.15)}`,
                          boxShadow: PURCHASE_DIALOG_UI.shadowSoft,
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: card.color,
                        }}
                      >
                        {card.icon}
                      </Box>
                    </Box>
                    <Typography sx={{ position: 'relative', zIndex: 1, fontSize: '0.84rem', color: PURCHASE_DIALOG_UI.muted }}>
                      {card.subtitle}
                    </Typography>
                    <Box sx={{ position: 'relative', zIndex: 1, mt: 1.8, width: 118, height: 8, borderRadius: 10, bgcolor: '#e7ece8' }}>
                      <Box sx={{ width: 58, height: '100%', bgcolor: card.color, borderRadius: 10}} />
                    </Box>
                  </Box>
                ))}
              </Box>
            );
          })()}

        {renderFilters()}
        {renderRequestTable(filteredRequests, 'central')}
      </Stack>
    </Box>
  );

  const renderCreateDialog = () => (
    <Dialog
      open={createDialogOpen}
      onClose={() => setCreateDialogOpen(false)}
      maxWidth="lg"
      fullWidth
      PaperProps={{ sx: PURCHASE_DIALOG_PAPER_SX }}
    >
      <DialogTitleWithClose
        onClose={() => setCreateDialogOpen(false)}
        sx={PURCHASE_DIALOG_TITLE_SX}
      >
        {draftLines.length > 0 && requests.some(r => r.lines[0]?.id === draftLines[0]?.id) ? 'แก้ไขใบแจ้งเติมสต็อกคลังกลาง' : 'สร้างใบแจ้งเติมสต็อกคลังกลาง'}
      </DialogTitleWithClose>
      <DialogContent dividers sx={PURCHASE_DIALOG_CONTENT_SX}>
        {renderFarmComposer()}
      </DialogContent>
      <DialogActions sx={PURCHASE_DIALOG_ACTIONS_SX}>
        <Box sx={{ flexGrow: 1 }} />
        <Button onClick={() => setCreateDialogOpen(false)} sx={PURCHASE_DIALOG_SECONDARY_BUTTON_SX}>ยกเลิก</Button>
        <Button
          variant="contained"
          onClick={submitRequest}
          disabled={draftLines.length === 0}
          sx={PURCHASE_DIALOG_PRIMARY_BUTTON_SX}
        >
          บันทึก
        </Button>
      </DialogActions>
    </Dialog>
  );

  const renderDetailDialog = () => (
    <Dialog
      open={Boolean(selectedRequest)}
      onClose={() => setSelectedRequestId('')}
      maxWidth="lg"
      fullWidth
      PaperProps={{ sx: PURCHASE_DIALOG_PAPER_SX }}
    >
      <DialogTitleWithClose onClose={() => setSelectedRequestId('')} sx={PURCHASE_DIALOG_TITLE_SX}>
        รายละเอียดคำขอเติมสต็อกกลาง
      </DialogTitleWithClose>
      <DialogContent dividers sx={PURCHASE_DIALOG_CONTENT_SX}>
        {selectedRequest ? (
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={2.5} divider={<Divider orientation="vertical" flexItem sx={{ display: { xs: 'none', md: 'block' } }} />}>
            <Stack spacing={2} sx={{ flex: 1 }}>
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 1.5 }}>
                <Paper elevation={0} sx={{ ...panelSx, p: 1.75 }}>
                  <Typography variant="caption" color="text.secondary">
                    ฟาร์มผู้ส่ง
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 900 }}>
                    {selectedRequest.sourceFacilityName}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {selectedRequest.sourceFacilityCode ?? '-'}
                  </Typography>
                </Paper>
                <Paper elevation={0} sx={{ ...panelSx, p: 1.75 }}>
                  <Typography variant="caption" color="text.secondary">
                    สถานะ
                  </Typography>
                  <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 0.75 }}>
                    <Chip 
                      label={toThaiWorkflowStatus(selectedRequest.status)} 
                      sx={getWorkflowStatusChipSx(selectedRequest.status)} 
                      size="small" 
                    />
                    <Chip
                      label={urgencyCopy[selectedRequest.urgency].label}
                      color={urgencyCopy[selectedRequest.urgency].tone}
                      size="small"
                      variant="outlined"
                    />
                  </Stack>
                </Paper>
              </Box>

              <TableContainer component={Paper} elevation={0} sx={panelSx}>
                <Table size="small" sx={tableSx}>
                  <TableHead>
                    <TableRow>
                      <TableCell width={60}>#</TableCell>
                      <TableCell>สินค้า</TableCell>
                      <TableCell width={120} align="right">จำนวนขอ</TableCell>
                      <TableCell width={90}>หน่วย</TableCell>
                      <TableCell width={130} align="right">ราคาประมาณ</TableCell>
                      <TableCell>หมายเหตุ</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {selectedRequest.lines.map((line) => (
                      <TableRow key={line.id}>
                        <TableCell>{line.lineNo}</TableCell>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontWeight: 900 }}>
                            {line.itemCode} - {line.itemName}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">{line.requestedQuantity.toLocaleString()}</TableCell>
                        <TableCell>{line.unit}</TableCell>
                        <TableCell align="right">
                          {(line.requestedQuantity * 450).toLocaleString()}
                        </TableCell>
                        <TableCell>{line.note ?? '-'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>

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
        <DialogActions sx={PURCHASE_DIALOG_ACTIONS_SX}>
          {renderActionButtons(selectedRequest)}
        </DialogActions>
      ) : null}
    </Dialog>
  );

  return (
    <Box
      sx={{
        borderRadius: 10,
        border: '1px solid',
        borderColor: 'divider',
        bgcolor: 'background.paper',
        color: 'text.primary',
        overflow: 'hidden',
        boxShadow: `0 18px 50px ${alpha('#103C31', 0.1)}`,
      }}
    >
      <Box
        sx={{
          px: { xs: 2, md: 3 },
          py: 2,
          borderBottom: '1px solid',
          borderColor: 'divider',
          background: 'linear-gradient(135deg, #F3FAF5 0%, #FFFFFF 62%, #E9F5EE 100%)',
        }}
      >
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5} justifyContent="space-between">
          <Box>
            <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
              <ReceiptLongOutlined sx={{ fontSize: 22 }} />
              <Typography variant="h5" sx={{ fontWeight: 950 }}>
                แจ้งเติมสต็อกคลังกลาง
              </Typography>
              <Chip
                label={scope === 'central' ? 'Central scope' : 'Farm scope'}
                color={scope === 'central' ? 'success' : 'info'}
                variant="outlined"
                size="small"
              />
            </Stack>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.75 }}>
              {scope === 'central'
                ? `ดูและจัดการคำขอที่ส่งเข้า ${centralHubName}`
                : `สร้างคำขอจาก ${currentFacilityName} เพื่อแจ้งให้ ${centralHubName} เติม stock กลาง`}
            </Typography>
          </Box>

          <Stack direction="row" spacing={1} flexWrap="wrap" />
        </Stack>
      </Box>

      {scope === 'farm' ? renderFarmScope() : renderCentralScope()}
      {scope === 'farm' ? renderCreateDialog() : null}
      {renderDetailDialog()}
    </Box>
  );
}
