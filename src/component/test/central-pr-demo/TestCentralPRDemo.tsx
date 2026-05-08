import React, { useState, useRef } from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
  Chip,
  Alert,
  MenuItem,
  IconButton,
  InputAdornment,
  Paper,
  TablePagination,
  Divider,
  Stepper,
  Step,
  StepLabel,
} from '@mui/material';
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
import { DownloadCloud } from 'lucide-react';
import DialogTitleWithClose from '../../../../src/components/common/DialogTitleWithClose';
import { alpha } from '@mui/material/styles';
import { toThaiWorkflowStatus, getWorkflowStatusChipSx } from '../../../lib/utils/status.util';
import { DOCUMENT_STATUS_THAI } from '../../../lib/constants/status-labels';
import StatusBadge from '../../../../src/components/common/StatusBadge';
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

export interface TestCentralPRDemoProps {
  scope: 'farm' | 'central';
  initialStandardLines?: PRLine[];
  mockConsolidatedLines?: PRLine[];
  centralItems?: any[];
  mockPRData?: any[];
}

export type PRLine = {
  id: string;
  itemCode: string;
  itemName: string;
  quantity: number;
  requestedQuantity?: number; // ยอดจากคำขอฟาร์ม
  unit: string;
  estimatedPrice: number;
  note: string;
  source: string;
  references?: string[];
};

export default function TestCentralPRDemo({ scope, initialStandardLines = [], mockConsolidatedLines = [], centralItems = [], mockPRData = [] }: TestCentralPRDemoProps) {
  const headerRef = useRef<HTMLDivElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const renderWorkflowStepper = (status: string) => {
    const isSpecialCase = status === 'approved'; 
    const isBypassCase = status === 'rejected';

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
        status: isBypassCase ? 'bypassed' : (status === 'submitted' ? 'active' : (status === 'approved' ? 'completed' : (status === 'rejected' ? 'error' : (status === 'returned' ? 'warning' : 'pending')))),
        requiredLevel: 1,
        effectiveLevel: isBypassCase ? 999 : 1,
        authType: (isBypassCase ? 'SuperAdmin' : 'RolePermission') as 'RolePermission' | 'UserOverride' | 'SuperAdmin' | 'Bypassed' | null
      },
      { 
        label: 'แผนกจัดซื้อกลาง', 
        name: isSpecialCase ? 'นาย ณเดชน์' : 'นางสาว สมศรี',
        role: isSpecialCase ? 'สัตวบาล' : 'ฝ่ายจัดซื้อ',
        date: isSpecialCase ? '26/04/2026 15:30' : '-', 
        status: isSpecialCase ? 'completed' : (isBypassCase ? 'bypassed' : (status === 'approved' ? 'active' : 'pending')),
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
        width: '100%', 
        pt: 2,
        mt: 2,
        borderTop: '1px solid',
        borderColor: 'divider'
      }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 900, mb: 2, color: 'text.secondary', display: 'flex', alignItems: 'center', gap: 1 }}>
          <ReceiptLongOutlined sx={{ fontSize: 18 }} />
          ลำดับการอนุมัติ
        </Typography>
        <Stepper alternativeLabel nonLinear sx={{ 
          '& .MuiStepConnector-line': { minWidth: 40 },
          '& .MuiStepLabel-label': { fontWeight: 800, mt: 1 },
          '& .MuiStepLabel-root': { alignItems: 'center' }
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
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
                  <Stack direction="row" spacing={0.5} alignItems="center" justifyContent="center">
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

  const [lines, setLines] = useState<PRLine[]>([]);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');
  const [urgencyFilter, setUrgencyFilter] = useState('all');
  const [selectedPRId, setSelectedPRId] = useState<string | null>(null);
  const [selectedItemId, setSelectedItemId] = useState('');
  const [selectedItemUnit, setSelectedItemUnit] = useState('-');
  const [lineQuantity, setLineQuantity] = useState<number | string>(1);
  const [linePrice, setLinePrice] = useState(0);
  const [lineNote, setLineNote] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  
  const filteredRows = mockPRData.filter(row => {
    const matchStatus = statusFilter === 'all' || row.status === statusFilter;
    const matchUrgency = urgencyFilter === 'all' || row.urgency === urgencyFilter;
    return matchStatus && matchUrgency;
  });

  const paginatedRows = filteredRows.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  const handleAddLine = () => {
    const item = centralItems.find(i => i.id === selectedItemId);
    if (!item || !lineQuantity || Number(lineQuantity) <= 0) return;

    const qty = Number(lineQuantity);
    
    setLines(prevLines => {
      const existingLineIndex = prevLines.findIndex(l => l.itemCode === item.code);
      
      if (existingLineIndex > -1) {
        // Item already exists, update quantity and price
        const updatedLines = [...prevLines];
        const existingLine = updatedLines[existingLineIndex];
        const newTotalQty = existingLine.quantity + qty;
        
        updatedLines[existingLineIndex] = {
          ...existingLine,
          quantity: newTotalQty,
          estimatedPrice: item.price * newTotalQty,
        };
        return updatedLines;
      } else {
        // Item doesn't exist, add new line
        const newLine: PRLine = {
          id: Math.random().toString(36).substr(2, 9),
          itemCode: item.code,
          itemName: item.name,
          quantity: qty,
          unit: item.unit,
          estimatedPrice: item.price * qty,
          note: lineNote,
          source: 'ซื้อภายนอก',
        };
        return [...prevLines, newLine];
      }
    });
    
    // Reset inputs
    setSelectedItemId('');
    setSelectedItemUnit('-');
    setLineQuantity(1);
    setLinePrice(0);
    setLineNote('');
  };

  const calculateAndSetPrice = (id: string, qty: number | string) => {
    const item = centralItems.find(i => i.id === id);
    if (item) {
      setLinePrice(item.price * (Number(qty) || 0));
    } else {
      setLinePrice(0);
    }
  };

  const handleOpenStandard = () => {
    setSelectedPRId(null);
    setLines(initialStandardLines);
    setHasLoaded(false);
    setOpen(true);
  };

  const handleOpenConsolidated = () => {
    setSelectedPRId(null);
    setLines(mockConsolidatedLines);
    setHasLoaded(true);
    setOpen(true);
  };

  const handleRowDoubleClick = (prId: string) => {
    const pr = mockPRData?.find(p => p.id === prId);
    if (!pr) return;
    
    setSelectedPRId(prId);
    
    // Open Detail Mode (Read-only) for all statuses
    setLines(mockConsolidatedLines || []); // Mock loading lines for detail
    setHasLoaded(true);
    setDetailOpen(true);
  };

  const handleLoadRequests = () => {
    setLines(prev => {
      const merged = [...prev];
      mockConsolidatedLines.forEach(l => {
        const idx = merged.findIndex(m => m.itemCode === l.itemCode);
        if (idx > -1) {
          const existing = merged[idx];
          const newReqQty = (existing.requestedQuantity || 0) + (l.requestedQuantity || 0);
          const newTotalQty = existing.quantity + l.quantity;
          merged[idx] = {
            ...existing,
            requestedQuantity: newReqQty,
            quantity: newTotalQty,
            estimatedPrice: 450 * newTotalQty, // Mock price calculation
          };
        } else {
          merged.push(l);
        }
      });
      return merged;
    });
    setHasLoaded(true);
  };

  const totalCount = mockPRData.length;
  const count = (s: string) => mockPRData.filter(p => String(p.status).toLowerCase() === s.toLowerCase()).length;

  const summaryCards = [
    { title: 'ใบขอซื้อทั้งหมด', value: totalCount, subtitle: 'เอกสารทั้งหมด', icon: <ReceiptLongOutlined />, iconBg: '#e9f0f6', bar: '#4a6982' },
    { title: toThaiWorkflowStatus('Approved'), value: count('approved'), subtitle: 'สถานะ Approved', icon: <TaskAltOutlined />, iconBg: '#ecf7ee', bar: '#2e7d32' },
    { title: toThaiWorkflowStatus('Rejected'), value: count('rejected'), subtitle: 'สถานะ Rejected', icon: <CancelOutlinedIcon />, iconBg: '#ffebee', bar: '#d32f2f' },
    { title: toThaiWorkflowStatus('Pending'), value: count('submitted') + count('pending'), subtitle: 'สถานะ Pending', icon: <PendingActionsOutlined />, iconBg: '#fff3df', bar: '#d68b00' },
    { title: toThaiWorkflowStatus('Returned'), value: count('returned'), subtitle: 'สถานะ Returned', icon: <RefreshIcon />, iconBg: '#f5f3ff', bar: '#7c3aed' },
    { title: toThaiWorkflowStatus('Draft'), value: count('draft'), subtitle: 'สถานะ Draft', icon: <DraftsOutlined />, iconBg: '#f3f4f6', bar: '#4b5563' },
    { title: toThaiWorkflowStatus('PartiallyReceived'), value: count('PartiallyReceived'), subtitle: 'สถานะ Partial', icon: <LocalShippingIcon sx={{ fontSize: 20 }} />, iconBg: '#eff6ff', bar: '#2563eb' },
    { title: toThaiWorkflowStatus('Completed'), value: count('Completed'), subtitle: 'สถานะ Completed', icon: <CheckCircleIcon sx={{ fontSize: 20 }} />, iconBg: '#FEF3F2', bar: '#B42318' },
    { title: toThaiWorkflowStatus('Cancelled'), value: count('Cancelled'), subtitle: 'สถานะ Cancelled', icon: <CancelOutlinedIcon />, iconBg: '#fef2f2', bar: '#dc2626' },
  ];

  const urgencyCopy: Record<string, { label: string; tone: 'default' | 'warning' | 'error' }> = {
    normal: { label: 'ปกติ', tone: 'default' },
    important: { label: 'ด่วน', tone: 'warning' },
    critical: { label: 'เร่งด่วน', tone: 'error' },
  };

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
                ใบขอซื้อ
              </Typography>
              <Chip
                label="Purchase Request"
                color="info"
                variant="outlined"
                size="small"
              />
            </Stack>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.75 }}>
              จัดการคำขอซื้อ ค้นหา และติดตามสถานะเอกสารในหน้าจอเดียว
            </Typography>
          </Box>
        </Stack>
      </Box>

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
            <Box key={card.title} sx={{
              borderRadius: 10,
              border: `1px solid`,
              borderColor: 'divider',
              bgcolor: 'background.paper',
              position: 'relative',
              overflow: 'hidden',
              px: 2,
              py: 1.8,
            }}>
              <Box sx={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 1 }}>
                <Box>
                  <Typography sx={{ fontSize: '2.1rem', fontWeight: 700, color: '#1d2624', lineHeight: 1 }}>
                    {card.value}
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
                    border: `1px solid ${alpha(card.bar, 0.15)}`,
                    boxShadow: PURCHASE_DIALOG_UI.shadowSoft,
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: card.bar,
                  }}
                >
                  {card.icon}
                </Box>
              </Box>
              <Typography sx={{ position: 'relative', zIndex: 1, fontSize: '0.84rem', color: PURCHASE_DIALOG_UI.muted }}>
                {card.subtitle}
              </Typography>
              <Box sx={{ position: 'relative', zIndex: 1, mt: 1.8, width: 118, height: 8, borderRadius: 10, bgcolor: '#e7ece8' }}>
                <Box sx={{ width: 58, height: '100%', bgcolor: card.bar, borderRadius: 10}} />
              </Box>
            </Box>
          ))}
        </Box>

        <Box sx={{
          borderRadius: 10,
          border: '1px solid',
          borderColor: 'divider',
          bgcolor: 'background.paper',
          p: 1.25,
          display: 'flex',
          justifyContent: 'flex-start',
          gap: 1,
          flexWrap: 'wrap',
        }}>
          <Button
            variant="contained"
            startIcon={<AddIcon sx={{ fontSize: 18 }} />}
            onClick={handleOpenStandard}
            sx={{
              borderRadius: 10,
              bgcolor: PURCHASE_DIALOG_UI.accent,
              boxShadow: PURCHASE_DIALOG_UI.shadowSoft,
              '&:hover': { bgcolor: '#124840' },
            }}
          >
            สร้างใบขอซื้อ
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon sx={{ fontSize: 18 }} />}
            sx={{
              borderRadius: 10,
              bgcolor: '#4d7f7b',
              boxShadow: PURCHASE_DIALOG_UI.shadowSoft,
              '&:hover': { bgcolor: '#3e6965' },
            }}
          >
            สร้างใบขอซื้อสุกร
          </Button>

          <Button
            variant="outlined"
            startIcon={<RefreshIcon sx={{ fontSize: 18 }} />}
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
              placeholder="เลขที่คำขอ, ฟาร์ม, item"
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
              onChange={(event) => setStatusFilter(event.target.value)}
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
              {Object.entries(DOCUMENT_STATUS_THAI).map(([value, label]) => (
                <MenuItem key={value} value={value}>
                  {label}
                </MenuItem>
              ))}
            </TextField>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <TextField
                select
                label="ความเร่งด่วน"
                value={urgencyFilter}
                onChange={(event) => setUrgencyFilter(event.target.value)}
                size="small"
                SelectProps={{
                  displayEmpty: true,
                  renderValue: (value) => (value === 'all' ? 'ทั้งหมด' : urgencyCopy[value as string].label),
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
                setStatusFilter('all');
                setUrgencyFilter('all');
              }}
              sx={{
                height: 40,
                minWidth: 110,
                borderRadius: 10,
                bgcolor: PURCHASE_DIALOG_UI.accent,
                boxShadow: PURCHASE_DIALOG_UI.shadowSoft,
                '&:hover': { bgcolor: '#124840' },
              }}
            >
              ล้างตัวกรอง
            </Button>
          </Box>
        </Box>

        <Box sx={{
          borderRadius: 10,
          border: '1px solid',
          borderColor: 'divider',
          bgcolor: 'background.paper',
          overflow: 'hidden',
        }}>
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
                    <TableCell width={150} sx={{ bgcolor: 'transparent', fontWeight: 900, color: '#1B352B', borderBottom: 'none' }}>เลขที่ใบขอซื้อ</TableCell>
                    <TableCell width={120} sx={{ bgcolor: 'transparent', fontWeight: 900, color: '#1B352B', borderBottom: 'none' }}>วันที่ขอซื้อ</TableCell>
                    <TableCell width={220} sx={{ bgcolor: 'transparent', fontWeight: 900, color: '#1B352B', borderBottom: 'none' }}>ผู้ขอ</TableCell>
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
                  {paginatedRows.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} align="center" sx={{ py: 10, color: 'text.secondary' }}>
                        ไม่พบข้อมูลใบขอซื้อ
                      </TableCell>
                    </TableRow>
                  ) : (
                    paginatedRows.map((row, index) => (
                      <TableRow key={row.id} hover sx={{ cursor: 'pointer' }} onDoubleClick={() => handleRowDoubleClick(row.id)}>
                        <TableCell width={60} sx={{ borderColor: '#E5EEE8' }}>
                          <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600 }}>{page * rowsPerPage + index + 1}</Typography>
                        </TableCell>
                        <TableCell width={150} sx={{ borderColor: '#E5EEE8' }}>
                          <Typography variant="body2" sx={{ fontWeight: 900, color: 'primary.main' }}>{row.id}</Typography>
                        </TableCell>
                        <TableCell width={120} sx={{ borderColor: '#E5EEE8' }}>
                          {row.date}
                        </TableCell>
                        <TableCell width={220} sx={{ borderColor: '#E5EEE8' }}>
                          <Typography variant="body2" sx={{ fontWeight: 800 }}>{row.requester}</Typography>
                        </TableCell>
                        <TableCell width={100} sx={{ borderColor: '#E5EEE8' }}>
                          <Typography variant="body2" sx={{ fontWeight: 800 }}>{row.items}</Typography>
                        </TableCell>
                        <TableCell width={120} sx={{ borderColor: '#E5EEE8' }}>
                          <Chip label={urgencyCopy[row.urgency as keyof typeof urgencyCopy].label} color={urgencyCopy[row.urgency as keyof typeof urgencyCopy].tone} size="small" variant="outlined" />
                        </TableCell>
                        <TableCell width={130} sx={{ borderColor: '#E5EEE8' }}>
                          <Chip 
                            label={toThaiWorkflowStatus(row.status)} 
                            sx={getWorkflowStatusChipSx(row.status)}
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
              รวมทั้งหมด {filteredRows.length} รายการ
            </Typography>
            <TablePagination
              rowsPerPageOptions={[10, 25, 50]}
              component="div"
              count={filteredRows.length}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={(_, newPage) => setPage(newPage)}
              onRowsPerPageChange={(e) => {
                setRowsPerPage(parseInt(e.target.value, 10));
                setPage(0);
              }}
              sx={{
                borderTop: 'none',
                '& .MuiTablePagination-toolbar': {
                  minHeight: 48,
                }
              }}
            />
          </Box>
        </Box>
      </Stack>
    </Box>

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="lg" fullWidth PaperProps={{ sx: PURCHASE_DIALOG_PAPER_SX }}>
        <DialogTitleWithClose onClose={() => setOpen(false)} sx={PURCHASE_DIALOG_TITLE_SX}>
          {selectedPRId ? `รายละเอียดใบขอซื้อ - ${selectedPRId}` : 'สร้างใบขอซื้อ'}
        </DialogTitleWithClose>
        <DialogContent dividers sx={PURCHASE_DIALOG_CONTENT_SX}>
          <Stack spacing={2}>
            
            <Box component="fieldset" sx={PURCHASE_DIALOG_FIELDSET_SX}>
              <Typography component="legend" sx={PURCHASE_DIALOG_LEGEND_SX}>ข้อมูลใบขอซื้อ</Typography>
              <Stack spacing={2} sx={{ mt: 1 }}>
                <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
                  <TextField label="ผู้ขอ" value={selectedPRId ? mockPRData.find(p => p.id === selectedPRId)?.requester : 'นาย สมชาย'} InputProps={{ readOnly: true }} fullWidth />
                  <TextField select label="แผนก" defaultValue="PUR" fullWidth>
                    <MenuItem value="PUR">PUR - จัดซื้อ</MenuItem>
                  </TextField>
                </Stack>
                <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
                  <TextField select label="สถานที่" defaultValue="CEN" fullWidth>
                    <MenuItem value="CEN">CEN - คลังกลาง</MenuItem>
                  </TextField>
                  <TextField select label="ความเร่งด่วน" value={selectedPRId ? mockPRData.find(p => p.id === selectedPRId)?.urgency : 'normal'} sx={{ minWidth: 180 }}>
                    <MenuItem value="normal">ปกติ</MenuItem>
                    <MenuItem value="important">ด่วน</MenuItem>
                    <MenuItem value="critical">เร่งด่วน</MenuItem>
                  </TextField>
                </Stack>
                <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
                  <TextField select label="คลังปลายทาง" defaultValue="CEN-WH" fullWidth>
                    <MenuItem value="CEN-WH">คลังกลางหลัก</MenuItem>
                  </TextField>
                </Stack>
                <TextField label="หมายเหตุ" multiline minRows={2} fullWidth variant="outlined" placeholder="ระบุหมายเหตุ" />
              </Stack>
            </Box>

            <Box component="fieldset" sx={PURCHASE_DIALOG_FIELDSET_SX}>
              <Typography component="legend" sx={PURCHASE_DIALOG_LEGEND_SX}>รายการสินค้า</Typography>
              <Stack direction="column" spacing={2} sx={{ width: '100%', mb: 1, mt: 1 }}>
                
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
                    onChange={(e) => {
                      const id = e.target.value;
                      setSelectedItemId(id);
                      const item = centralItems.find(i => i.id === id);
                      setSelectedItemUnit(item?.unit || '-');
                      calculateAndSetPrice(id, lineQuantity);
                    }}
                    fullWidth
                  >
                    <MenuItem value="">เลือกสินค้า...</MenuItem>
                    {centralItems.map(item => (
                      <MenuItem key={item.id} value={item.id}>
                        {item.code} - {item.name}
                      </MenuItem>
                    ))}
                  </TextField>
                  <TextField label="หน่วย" value={selectedItemUnit} InputProps={{ readOnly: true }} fullWidth />
                  <TextField
                    label="จำนวน"
                    type="text"
                    value={lineQuantity}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === '' || /^\d*\.?\d*$/.test(val)) {
                        setLineQuantity(val);
                        calculateAndSetPrice(selectedItemId, val);
                      }
                    }}
                    onBlur={() => {
                      if (!lineQuantity || Number(lineQuantity) <= 0) {
                        setLineQuantity(1);
                        calculateAndSetPrice(selectedItemId, 1);
                      }
                    }}
                    inputProps={{ inputMode: 'decimal' }}
                    InputProps={{ sx: { '& input': { textAlign: 'right' } } }}
                  />
                  <TextField
                    label="ราคาประมาณ (บาท)"
                    value={linePrice.toLocaleString()}
                    InputProps={{ 
                      readOnly: true,
                      sx: { '& input': { textAlign: 'right' }, bgcolor: 'rgba(0,0,0,0.03)' } 
                    }}
                  />
                  <TextField
                    label="หมายเหตุรายการ"
                    value={lineNote}
                    onChange={(e) => setLineNote(e.target.value)}
                    fullWidth
                    sx={{ gridColumn: { xs: '1', md: '1 / -1' } }}
                  />
                  <Box sx={{ gridColumn: { xs: '1', md: '1 / -1' }, display: 'flex', flexDirection: 'column', width: '100%', gap: 1 }}>
                    <Button
                      sx={{ ...PURCHASE_DIALOG_SECONDARY_BUTTON_SX, minHeight: 56, whiteSpace: 'nowrap', width: '100%' }}
                      variant="outlined"
                      startIcon={<AddIcon sx={{ fontSize: 18 }} />}
                      onClick={handleAddLine}
                      disabled={!selectedItemId}
                    >
                      เพิ่มรายการ
                    </Button>
                    {scope === 'central' && (
                      <Button
                        sx={{ ...PURCHASE_DIALOG_SECONDARY_BUTTON_SX, minHeight: 56, whiteSpace: 'nowrap', width: '100%', color: '#2e7d32', borderColor: '#2e7d32' }}
                        variant="outlined"
                        startIcon={<DownloadCloud size={16} />}
                        onClick={handleLoadRequests}
                        disabled={hasLoaded}
                      >
                        {hasLoaded ? 'ดึงข้อมูลสำเร็จ' : 'ดึงข้อมูลจากคำขอฟาร์ม'}
                      </Button>
                    )}
                  </Box>
                </Box>

                <TableContainer sx={{ ...PURCHASE_DIALOG_TABLE_SX, mt: 1.5, maxHeight: 350 }}>
                  <Table size="small" stickyHeader sx={tableSx}>
                    <TableHead>
                      <TableRow>
                        <TableCell width={56}>#</TableCell>
                        <TableCell>สินค้า</TableCell>
                        <TableCell width={120} align="right">จำนวน</TableCell>
                        <TableCell width={90}>หน่วย</TableCell>
                        <TableCell width={130} align="right">ราคาประมาณ</TableCell>
                        <TableCell>หมายเหตุ</TableCell>
                        <TableCell align="right" width={70}>จัดการ</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {lines.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={7} align="center" sx={{ py: 4 }}>ยังไม่มีรายการสินค้า</TableCell>
                        </TableRow>
                      ) : (
                        lines.map((line, idx) => (
                          <TableRow key={idx} hover>
                            <TableCell>{idx + 1}</TableCell>
                            <TableCell>
                              <Typography variant="body2" sx={{ fontWeight: 800, color: 'primary.main' }}>
                                {line.itemCode} - {line.itemName}
                              </Typography>
                            </TableCell>
                            <TableCell align="right">
                              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                  {line.requestedQuantity && (
                                    <DownloadCloud size={14} style={{ color: '#8d9592' }} />
                                  )}
                                  <Typography variant="body2" sx={{ fontWeight: 800 }}>
                                    {line.quantity.toLocaleString()}
                                  </Typography>
                                </Box>
                                {line.requestedQuantity && line.quantity > line.requestedQuantity && (
                                  <Typography variant="caption" sx={{ color: 'success.main', fontWeight: 800, mt: -0.5 }}>
                                    (+{(line.quantity - line.requestedQuantity).toLocaleString()})
                                  </Typography>
                                )}
                              </Box>
                            </TableCell>
                            <TableCell>{line.unit}</TableCell>
                            <TableCell align="right">{line.estimatedPrice.toLocaleString()}</TableCell>
                            <TableCell>{line.note || '-'}</TableCell>
                            <TableCell align="right">
                              <IconButton
                                sx={{ color: '#d32f2f !important' }}
                                size="small"
                                onClick={() => setLines(prev => prev.filter((_, i) => i !== idx))}
                              >
                                <DeleteIcon sx={{ fontSize: 18 }} />
                              </IconButton>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Stack>
            </Box>
          </Stack>
        </DialogContent>
        <DialogActions sx={PURCHASE_DIALOG_ACTIONS_SX}>
          <Box sx={{ flexGrow: 1 }} />
          <Button onClick={() => setOpen(false)} sx={PURCHASE_DIALOG_SECONDARY_BUTTON_SX}>ยกเลิก</Button>
          <Button variant="contained" onClick={() => setOpen(false)} sx={PURCHASE_DIALOG_PRIMARY_BUTTON_SX}>
            บันทึก
          </Button>
        </DialogActions>
      </Dialog>

      {/* Detail Dialog */}
      <Dialog 
        open={detailOpen} 
        onClose={() => setDetailOpen(false)} 
        maxWidth="lg" 
        fullWidth 
        PaperProps={{ sx: PURCHASE_DIALOG_PAPER_SX }}
      >
        <DialogTitleWithClose onClose={() => setDetailOpen(false)} sx={PURCHASE_DIALOG_TITLE_SX}>
          <Stack alignItems="center" spacing={0.5}>
            <Typography variant="h6" sx={{ fontWeight: 900 }}>
              รายละเอียดใบขอซื้อ
            </Typography>
            {selectedPRId && (() => {
              const currentUrgency = mockPRData.find(p => p.id === selectedPRId)?.urgency || 'normal';
              const urgencyInfo = urgencyCopy[currentUrgency];
              const urgencyChipSx: Record<string, object> = {
                normal: { bgcolor: '#e8eae9', color: '#4b5563', fontWeight: 800 },
                important: { bgcolor: '#ff9800', color: '#fff', fontWeight: 800 },
                critical: { bgcolor: '#d32f2f', color: '#fff', fontWeight: 800 },
              };
              return (
                <Chip
                  label={urgencyInfo.label}
                  sx={{ ...urgencyChipSx[currentUrgency], fontSize: '0.75rem', height: 24 }}
                />
              );
            })()}
          </Stack>
        </DialogTitleWithClose>
        <DialogContent dividers sx={PURCHASE_DIALOG_CONTENT_SX}>
          {selectedPRId && (
            <Stack spacing={2.5}>
              <Stack spacing={2}>
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr 1fr' }, gap: 1.5 }}>
                  {/* เลขที่เอกสาร */}
                  <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 10, p: 1.75 }}>
                    <Typography variant="caption" color="text.secondary">เลขที่เอกสาร</Typography>
                    <Typography variant="body1" sx={{ fontWeight: 900, color: 'primary.main' }}>
                      {selectedPRId}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      วันที่: {mockPRData.find(p => p.id === selectedPRId)?.date}
                    </Typography>
                  </Paper>
                  {/* ผู้ขอ */}
                  <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 10, p: 1.75 }}>
                    <Typography variant="caption" color="text.secondary">ผู้ขอ</Typography>
                    <Typography variant="body1" sx={{ fontWeight: 900 }}>
                      {mockPRData.find(p => p.id === selectedPRId)?.requester}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">แผนก: จัดซื้อ</Typography>
                  </Paper>
                  {/* สถานะ */}
                  <Paper elevation={0} sx={{ 
                    border: '1px solid', 
                    borderColor: 'divider', 
                    borderRadius: 10, 
                    p: 1.75 
                  }}>
                    <Typography variant="caption" color="text.secondary">สถานะเอกสาร</Typography>
                    <Box sx={{ mt: 0.75 }}>
                      <Chip 
                        label={toThaiWorkflowStatus(mockPRData.find(p => p.id === selectedPRId)?.status)} 
                        sx={{ ...getWorkflowStatusChipSx(mockPRData.find(p => p.id === selectedPRId)?.status), fontWeight: 900, fontSize: '0.85rem', height: 28 }}
                      />
                    </Box>
                  </Paper>
                </Box>

                <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 10, overflow: 'hidden' }}>
                  <Table size="small" sx={tableSx}>
                    <TableHead>
                      <TableRow>
                        <TableCell width={60}>#</TableCell>
                        <TableCell>สินค้า</TableCell>
                        <TableCell width={120} align="right">จำนวน</TableCell>
                        <TableCell width={90}>หน่วย</TableCell>
                        <TableCell width={130} align="right">ราคาประมาณ</TableCell>
                        <TableCell>หมายเหตุ</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {lines.map((line, idx) => (
                        <TableRow key={idx}>
                          <TableCell>{idx + 1}</TableCell>
                          <TableCell>
                            <Typography variant="body2" sx={{ fontWeight: 900 }}>
                              {line.itemCode} - {line.itemName}
                            </Typography>
                          </TableCell>
                          <TableCell align="right">{line.quantity.toLocaleString()}</TableCell>
                          <TableCell>{line.unit}</TableCell>
                          <TableCell align="right">{line.estimatedPrice.toLocaleString()}</TableCell>
                          <TableCell>{line.note || '-'}</TableCell>
                        </TableRow>
                      ))}
                      <TableRow sx={{ bgcolor: '#f5f7f6' }}>
                        <TableCell colSpan={2}>
                          <Typography variant="subtitle2" sx={{ fontWeight: 900 }}>รวมทั้งหมด</Typography>
                        </TableCell>
                        <TableCell colSpan={2} />
                        <TableCell align="right">
                          <Typography variant="subtitle2" sx={{ fontWeight: 900 }}>
                            {lines.reduce((sum, l) => sum + l.estimatedPrice, 0).toLocaleString()} บาท
                          </Typography>
                        </TableCell>
                        <TableCell />
                      </TableRow>
                    </TableBody>
                  </Table>
                </TableContainer>


              </Stack>

              {mockPRData?.find(p => p.id === selectedPRId)?.status !== 'draft' && (
                renderWorkflowStepper(mockPRData?.find(p => p.id === selectedPRId)?.status || 'submitted')
              )}
            </Stack>
          )}
        </DialogContent>
        {['draft', 'returned'].includes(mockPRData?.find(p => p.id === selectedPRId)?.status || '') && (
          <DialogActions sx={PURCHASE_DIALOG_ACTIONS_SX}>
            <Stack direction="row" spacing={1}>
              <Button
                variant="contained"
                onClick={() => setDetailOpen(false)}
                sx={{ borderRadius: 10, px: 2, bgcolor: PURCHASE_DIALOG_UI.accent, '&:hover': { bgcolor: '#124840' } }}
              >
                ส่งอนุมัติ
              </Button>
              <Button
                variant="outlined"
                onClick={() => {
                  setDetailOpen(false);
                  setLines(initialStandardLines || []);
                  setHasLoaded(false);
                  setOpen(true);
                }}
                sx={{ borderRadius: 10, px: 2 }}
              >
                แก้ไข
              </Button>
            </Stack>
          </DialogActions>
        )}
        {scope === 'central' && mockPRData?.find(p => p.id === selectedPRId)?.status === 'submitted' && (
          <DialogActions sx={PURCHASE_DIALOG_ACTIONS_SX}>
            <Stack direction="row" spacing={1}>
              <Button
                variant="contained"
                startIcon={<TaskAltOutlined sx={{ fontSize: 18 }} />}
                onClick={() => setDetailOpen(false)}
                sx={{ borderRadius: 10, px: 2, bgcolor: '#2e7d32', '&:hover': { bgcolor: '#1b5e20' } }}
              >
                อนุมัติ
              </Button>
              <Button
                variant="outlined"
                color="warning"
                startIcon={<RefreshIcon sx={{ fontSize: 18 }} />}
                onClick={() => setDetailOpen(false)}
                sx={{ borderRadius: 10, px: 2 }}
              >
                ตีกลับ
              </Button>
              <Button
                variant="outlined"
                color="error"
                startIcon={<CancelOutlinedIcon sx={{ fontSize: 18 }} />}
                onClick={() => setDetailOpen(false)}
                sx={{ borderRadius: 10, px: 2 }}
              >
                ไม่อนุมัติ
              </Button>
            </Stack>
          </DialogActions>
        )}
      </Dialog>
    </Box>
  );
}
