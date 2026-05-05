'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import dayjs from '@/lib/dayjs';
import Swal from 'sweetalert2';
import {
  Alert,
  Box,
  Button,
  Chip,
  FormControl,
  IconButton,
  MenuItem,
  Paper,
  Select,
  Stack,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tabs,
  TextField,
  Typography,
} from '@mui/material';
import {
  AddCircleOutlineRounded,
  CheckCircleOutlineOutlined,
  DeleteOutlineRounded,
  DescriptionOutlined,
  PendingActionsOutlined,
  RefreshOutlined,
  TaskAltOutlined,
} from '@mui/icons-material';
import { authService } from '@/features/auth/services/auth.service';
import { stockAdjustmentRequestService } from '@/features/production/stock/services/stock-adjustment-request.service';
import { stockService } from '@/features/production/stock/services/stock.service';
import type {
  CreateStockAdjustmentRequestPayload,
  StockAdjustmentRequestResponse,
} from '@/features/production/stock/types/stock-adjustment-request.types';
import type {
  CentralWarehouseItemOption,
  ItemOption,
  UomOption,
  WarehouseResponse,
} from '@/features/production/stock/types';
import {
  FACILITY_CHANGED_EVENT,
  getCurrentFacilityCode,
  getCurrentFacilityId,
  getUserFarmScopeNodes,
  setCurrentFacilityContext,
} from '@/lib/facility-context';
import { readCurrentAccessContext } from '@/lib/access-context';
import {
  syncCurrentAccessContextForFacility,
} from '@/features/auth/services/access-context-sync.service';
import { formatDateTime } from '@/lib/utils/date.util';
import { formatNumber } from '@/lib/utils/format.util';
import { getWorkflowStatusChipSx, toThaiWorkflowStatus } from '@/lib/utils/status.util';
import { STOCK_WORKSPACE_UI, StockSection, StockSummaryCard, StockWorkspaceHeader, stockPanelSx } from '@/features/production/stock/components/StockWorkspaceChrome';
import { filterFarmWarehousesByFacility } from '@/features/production/stock/utils/warehouse-scope.util';
import { StockAdjustmentRequestDetailsDialog } from './components/StockAdjustmentRequestDetailsDialog';
import {
  canManageWarehouseAdjustmentRequests,
  canViewWarehouseAdjustmentRequests,
} from '@/lib/access/modules/warehouse.guard';

type DraftLine = {
  id: string;
  warehouseId: number | '';
  itemId: number | '';
  uomId: number | '';
  newQuantity: string;
  reason: string;
};

type FacilityOption = {
  facilityNodeId: number;
  facilityCode: string;
  facilityName: string;
};

function createDraftLine(options: {
  warehouseId?: number | '';
  itemId?: number | '';
  uomId?: number | '';
} = {}): DraftLine {
  return {
    id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    warehouseId: options.warehouseId ?? '',
    itemId: options.itemId ?? '',
    uomId: options.uomId ?? '',
    newQuantity: '',
    reason: '',
  };
}

function formatWarehouseLabel(warehouse: WarehouseResponse): string {
  const code = warehouse.code?.trim() ?? '';
  const name = warehouse.name?.trim() ?? '';
  if (!code) return name;
  if (!name) return code;
  return name.startsWith(code) ? name : `${code} - ${name}`;
}

function formatItemLabel(item: ItemOption): string {
  const code = item.code?.trim() ?? '';
  const name = item.name?.trim() ?? '';
  if (!code) return name;
  if (!name) return code;
  return `${code} - ${name}`;
}

function statusChip(status: string) {
  return <Chip label={toThaiWorkflowStatus(status)} sx={getWorkflowStatusChipSx(status)} />;
}

function toIsoDateTime(value: string): string {
  const parsed = dayjs(value);
  if (!parsed.isValid()) {
    return dayjs().toISOString();
  }
  return parsed.toISOString();
}

function getAxiosErrorMessage(err: unknown): string | undefined {
  return axios.isAxiosError<{ message?: string }>(err)
    ? err.response?.data?.message
    : undefined;
}

export function StockAdjustmentRequestPage() {
  const user = authService.getUser();
  const canViewPage = canViewWarehouseAdjustmentRequests();
  const canRequestAdjustStock = canManageWarehouseAdjustmentRequests();

  const facilityOptions = useMemo<FacilityOption[]>(() => {
    return getUserFarmScopeNodes(user).map((node) => ({
      facilityNodeId: node.facilityNodeId,
      facilityCode: node.facilityCode,
      facilityName: node.facilityName,
    }));
  }, [user]);

  const [currentFacilityId, setCurrentFacilityId] = useState<number | null>(null);
  const [currentFacilityCode, setCurrentFacilityCode] = useState<string | null>(null);
  const [selectedFacilityId, setSelectedFacilityId] = useState<number | ''>('');
  const [warehouses, setWarehouses] = useState<WarehouseResponse[]>([]);
  const [items, setItems] = useState<ItemOption[]>([]);
  const [uoms, setUoms] = useState<UomOption[]>([]);
  const [myRequests, setMyRequests] = useState<StockAdjustmentRequestResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [masterLoading, setMasterLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'request' | 'my-requests'>(
    canRequestAdjustStock ? 'request' : 'my-requests',
  );
  const [requestDate, setRequestDate] = useState(dayjs().format('YYYY-MM-DDTHH:mm'));
  const [remarks, setRemarks] = useState('');
  const [draftLines, setDraftLines] = useState<DraftLine[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<StockAdjustmentRequestResponse | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [centralWarehouseItems, setCentralWarehouseItems] = useState<CentralWarehouseItemOption[]>([]);

  const selectedFacility = useMemo(
    () => facilityOptions.find((facility) => facility.facilityNodeId === selectedFacilityId) ?? null,
    [facilityOptions, selectedFacilityId],
  );

  const farmWarehouses = useMemo(() => {
    if (selectedFacilityId === '') return [];
    return filterFarmWarehousesByFacility(
      warehouses.filter((warehouse) => warehouse.isActive),
      selectedFacilityId,
    );
  }, [selectedFacilityId, warehouses]);

  const activeItems = useMemo(
    () => {
      const baseItems = items.filter((item) => item.isActive);
      if (selectedFacility?.isCentralHub !== true) {
        return baseItems.sort((left, right) => left.code.localeCompare(right.code));
      }
      const centralItemIds = new Set(
        centralWarehouseItems
          .filter((row) => row.isCenterItem && row.isActive)
          .map((row) => row.itemId),
      );
      return baseItems
        .filter((item) => centralItemIds.has(item.id))
        .sort((left, right) => left.code.localeCompare(right.code));
    },
    [centralWarehouseItems, items, selectedFacility?.isCentralHub],
  );

  const activeUoms = useMemo(
    () => uoms.filter((uom) => uom.isActive).sort((left, right) => left.code.localeCompare(right.code)),
    [uoms],
  );

  const selectedFacilityCode = selectedFacility?.facilityCode ?? currentFacilityCode ?? undefined;

  const loadMasters = useCallback(async () => {
    try {
      setMasterLoading(true);
      const [warehouseList, itemList, uomList] = await Promise.all([
        stockService.getWarehouses(undefined, undefined, true),
        stockService.getItems(),
        stockService.getUoms(),
      ]);
      const centralList =
        selectedFacility?.isCentralHub === true
          ? await stockService.getCentralWarehouseItems().catch(() => [])
          : [];
      setWarehouses(warehouseList);
      setItems(itemList);
      setCentralWarehouseItems(centralList);
      setUoms(uomList);
    } catch (err) {
      console.error('Failed to load stock masters:', err);
      setError('ไม่สามารถโหลดข้อมูลต้นทางของคำขอปรับสต๊อกได้');
    } finally {
      setMasterLoading(false);
    }
  }, [selectedFacility?.isCentralHub]);

  const loadRequests = useCallback(async () => {
    if (!canViewPage || selectedFacilityId === '') {
      setMyRequests([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const params = {
        facilityId: selectedFacilityId,
        facilityCode: selectedFacilityCode,
      };

      const mine = canRequestAdjustStock
        ? await stockAdjustmentRequestService.getMy(params)
        : ([] as StockAdjustmentRequestResponse[]);

      setMyRequests(mine);
    } catch (err) {
      console.error('Failed to load stock adjustment requests:', err);
      setError(getAxiosErrorMessage(err) || 'ไม่สามารถโหลดรายการคำขอปรับสต๊อกได้');
      setMyRequests([]);
    } finally {
      setLoading(false);
    }
  }, [canRequestAdjustStock, canViewPage, selectedFacilityCode, selectedFacilityId]);

  useEffect(() => {
    const current = getCurrentFacilityId();
    setCurrentFacilityId(current);
    setCurrentFacilityCode(getCurrentFacilityCode());

    const onFacilityChanged = () => {
      const nextFacilityId = getCurrentFacilityId();
      const nextFacilityCode = getCurrentFacilityCode();
      setCurrentFacilityId(nextFacilityId);
      setCurrentFacilityCode(nextFacilityCode);

      const currentUser = authService.getUser();
      if (currentUser) {
        void syncCurrentAccessContextForFacility({
          user: currentUser,
          currentFacilityId: nextFacilityId,
          storedContext: readCurrentAccessContext(),
        });
      }
    };

    window.addEventListener(FACILITY_CHANGED_EVENT, onFacilityChanged);
    return () => window.removeEventListener(FACILITY_CHANGED_EVENT, onFacilityChanged);
  }, []);

  useEffect(() => {
    void loadMasters();
  }, [loadMasters]);

  useEffect(() => {
    if (!facilityOptions.length) return;

    const currentFacility = currentFacilityId
      ? facilityOptions.find((facility) => facility.facilityNodeId === currentFacilityId)
      : null;
    const fallback = currentFacility ?? facilityOptions[0] ?? null;
    if (!fallback) return;

    if (selectedFacilityId !== fallback.facilityNodeId) {
      setSelectedFacilityId(fallback.facilityNodeId);
    }

    if (
      currentFacilityId !== fallback.facilityNodeId ||
      currentFacilityCode !== fallback.facilityCode
    ) {
      setCurrentFacilityContext(fallback.facilityNodeId, fallback.facilityCode);
    }
  }, [currentFacilityCode, currentFacilityId, facilityOptions, selectedFacilityId]);

  useEffect(() => {
    if (!canRequestAdjustStock) {
      return;
    }

    if (selectedFacilityId === '') {
      return;
    }

    void loadRequests();
  }, [canRequestAdjustStock, loadRequests, selectedFacilityId]);

  useEffect(() => {
    if (canRequestAdjustStock && activeTab === 'my-requests') {
      return;
    }
    if (!canRequestAdjustStock && activeTab === 'request') {
      setActiveTab('my-requests');
    }
  }, [activeTab, canRequestAdjustStock]);

  useEffect(() => {
    if (!canRequestAdjustStock) return;

    const defaultWarehouse = farmWarehouses[0]?.id ?? '';
    const defaultItem = activeItems[0] ?? null;
    const defaultUom = defaultItem?.baseUomId ?? activeUoms[0]?.id ?? '';

    setDraftLines((previous) => {
      if (previous.length > 0) return previous;
      return [
        createDraftLine({
          warehouseId: defaultWarehouse,
          itemId: defaultItem?.id ?? '',
          uomId: defaultUom,
        }),
      ];
    });
  }, [activeItems, activeUoms, canRequestAdjustStock, farmWarehouses]);

  useEffect(() => {
    if (!canRequestAdjustStock) return;

    const defaultWarehouse = farmWarehouses[0]?.id ?? '';
    const defaultItem = activeItems[0] ?? null;
    const defaultUom = defaultItem?.baseUomId ?? activeUoms[0]?.id ?? '';

        setDraftLines([
          createDraftLine({
            warehouseId: defaultWarehouse,
            itemId: defaultItem?.id ?? '',
            uomId: defaultUom,
          }),
        ]);
        setRemarks('');
        setRequestDate(dayjs().format('YYYY-MM-DDTHH:mm'));
      }, [activeItems, activeUoms, canRequestAdjustStock, selectedFacilityId, farmWarehouses]);

  const summary = useMemo(() => {
    const allMyRequests = myRequests.length;
    const pendingMyRequests = myRequests.filter((request) => request.status === 'Pending').length;
    const approvedMyRequests = myRequests.filter((request) => request.status === 'Approved').length;
    const rejectedMyRequests = myRequests.filter((request) => request.status === 'Rejected').length;
    const totalDeltaValue = myRequests.reduce((sum, request) => sum + Number(request.totalDeltaValue ?? 0), 0);

    return {
      allMyRequests,
      pending: pendingMyRequests,
      approved: approvedMyRequests,
      rejected: rejectedMyRequests,
      totalDeltaValue,
    };
  }, [myRequests]);

  const addLine = () => {
    const defaultWarehouse = farmWarehouses[0]?.id ?? '';
    const defaultItem = activeItems[0] ?? null;
    const defaultUom = defaultItem?.baseUomId ?? activeUoms[0]?.id ?? '';

    setDraftLines((previous) => [
      ...previous,
      createDraftLine({
        warehouseId: defaultWarehouse,
        itemId: defaultItem?.id ?? '',
        uomId: defaultUom,
      }),
    ]);
  };

  const removeLine = (lineId: string) => {
    setDraftLines((previous) => {
      if (previous.length <= 1) {
        return previous.map((line) => ({
          ...line,
          warehouseId: farmWarehouses[0]?.id ?? '',
          itemId: activeItems[0]?.id ?? '',
          uomId: activeItems[0]?.baseUomId ?? activeUoms[0]?.id ?? '',
          newQuantity: '',
          reason: '',
        }));
      }

      return previous.filter((line) => line.id !== lineId);
    });
  };

  const updateLine = (lineId: string, patch: Partial<DraftLine>) => {
    setDraftLines((previous) =>
      previous.map((line) => {
        if (line.id !== lineId) return line;
        return { ...line, ...patch };
      }),
    );
  };

  const handleFacilityChange = (value: number) => {
    const selected = facilityOptions.find((facility) => facility.facilityNodeId === value) ?? null;
    setSelectedFacilityId(value);
    setCurrentFacilityId(value);
    setCurrentFacilityCode(selected?.facilityCode ?? null);
    setCurrentFacilityContext(value, selected?.facilityCode ?? null);
  };

  const handleSubmit = async () => {
    if (!canRequestAdjustStock) return;
    if (selectedFacilityId === '') {
      await Swal.fire({
        icon: 'warning',
        title: 'กรุณาเลือกฟาร์ม',
        text: 'ต้องเลือก Facility ก่อนส่งคำขอปรับสต๊อก',
      });
      return;
    }

    const validation = validateDraftLines(draftLines, farmWarehouses, activeItems);
    if (validation) {
      await Swal.fire({
        icon: 'error',
        title: 'ข้อมูลไม่ครบถ้วน',
        text: validation,
      });
      return;
    }

    try {
      setSaving(true);
      const payload: CreateStockAdjustmentRequestPayload = {
        requestDate: toIsoDateTime(requestDate),
        facilityId: selectedFacilityId,
        remarks: remarks.trim(),
        lines: draftLines.map((line) => {
          return {
            warehouseId: Number(line.warehouseId),
            itemId: Number(line.itemId),
            uomId: Number(line.uomId),
            newQuantity: Number(line.newQuantity),
            reason: line.reason.trim(),
            stockLotId: undefined,
          };
        }),
      };

      await stockAdjustmentRequestService.create(payload);
      await loadRequests();
      setActiveTab('my-requests');
      setRemarks('');
      setRequestDate(dayjs().format('YYYY-MM-DDTHH:mm'));
      setDraftLines([
        createDraftLine({
          warehouseId: farmWarehouses[0]?.id ?? '',
          itemId: activeItems[0]?.id ?? '',
          uomId: activeItems[0]?.baseUomId ?? activeUoms[0]?.id ?? '',
        }),
      ]);
      await Swal.fire({
        icon: 'success',
        title: 'ส่งคำขอปรับสต๊อกสำเร็จ',
        timer: 1300,
        showConfirmButton: false,
      });
    } catch (err) {
      console.error(err);
      await Swal.fire({
        icon: 'error',
        title: 'ส่งคำขอไม่สำเร็จ',
        text: getAxiosErrorMessage(err) || 'ไม่สามารถส่งคำขอปรับสต๊อกได้',
      });
    } finally {
      setSaving(false);
    }
  };

  const openDetails = (request: StockAdjustmentRequestResponse) => {
    setSelectedRequest(request);
    setDetailsOpen(true);
  };

  const refreshAll = async () => {
    await Promise.all([loadMasters(), loadRequests()]);
  };

  const tabItems = [
    ...(canRequestAdjustStock ? [{ value: 'request', label: 'ส่งคำขอปรับ' }] : []),
    { value: 'my-requests', label: 'คำขอของฉัน' },
  ] as const;

  if (!canViewPage) {
    return (
      <Box sx={{ p: { xs: 1.5, md: 2 }, bgcolor: STOCK_WORKSPACE_UI.bg }}>
        <Alert severity="warning">
          คุณไม่มีสิทธิ์เข้าถึงหน้าคำขอปรับสต๊อก
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: { xs: 1.5, md: 2 }, bgcolor: STOCK_WORKSPACE_UI.bg }}>
      <StockWorkspaceHeader
        chipLabel="Adjust Request"
        title="คำขอปรับสต๊อก"
        subtitle="ยื่นคำขอปรับยอดสต๊อกแบบต้องอนุมัติ และติดตามรายการของตัวเองในหน้าเดียว"
        meta="Production / Material Stock"
      />

      <Stack spacing={2.5}>
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: 'repeat(2, minmax(0, 1fr))', md: 'repeat(4, minmax(0, 1fr))' },
            gap: 1.2,
          }}
        >
          <StockSummaryCard
            title="คำขอทั้งหมด"
            value={formatNumber(summary.allMyRequests)}
            subtitle="จำนวนเอกสารทั้งหมด"
            icon={<DescriptionOutlined sx={{ color: '#4a6982', fontSize: 20 }} />}
            iconBg="#efe8da"
            bar="#4a6982"
          />
          <StockSummaryCard
            title="รออนุมัติ"
            value={formatNumber(summary.pending)}
            subtitle="สถานะ Pending"
            icon={<PendingActionsOutlined sx={{ color: '#d09100', fontSize: 20 }} />}
            iconBg="#f2ead8"
            bar="#d09100"
          />
          <StockSummaryCard
            title="อนุมัติแล้ว"
            value={formatNumber(summary.approved)}
            subtitle="สถานะ Approved"
            icon={<TaskAltOutlined sx={{ color: '#2e7d32', fontSize: 20 }} />}
            iconBg="#dfe9db"
            bar="#2e7d32"
          />
          <StockSummaryCard
            title="มูลค่า Diff รวม"
            value={formatNumber(summary.totalDeltaValue, 2)}
            subtitle="ยอด snapshot เพื่อคำนวณต้นทุน"
            icon={<CheckCircleOutlineOutlined sx={{ color: '#7c5ce5', fontSize: 20 }} />}
            iconBg="#e4ddf4"
            bar="#7c5ce5"
          />
        </Box>

        {error ? (
          <Alert severity="error" onClose={() => setError(null)}>
            {error}
          </Alert>
        ) : null}

        <Box
          sx={{
            ...stockPanelSx,
            px: 1,
            py: 1,
          }}
        >
          <Tabs
            value={activeTab}
            onChange={(_, value: 'request' | 'my-requests') => setActiveTab(value)}
            variant="scrollable"
            scrollButtons="auto"
            sx={{
              minHeight: 0,
              '& .MuiTabs-indicator': { display: 'none' },
              '& .MuiTabs-flexContainer': {
                gap: 0.8,
                flexWrap: { xs: 'nowrap', md: 'wrap' },
              },
            }}
          >
            {tabItems.map((tab) => (
              <Tab
                key={tab.value}
                value={tab.value}
                label={tab.label}
                sx={{
                  minHeight: 40,
                  px: 2.2,
                  py: 0.82,
                  borderRadius: 4,
                  border: '1px solid',
                  borderColor: '#c8d0cb',
                  bgcolor: STOCK_WORKSPACE_UI.panelSoft,
                  color: '#8b9390',
                  textTransform: 'none',
                  fontWeight: 800,
                  fontSize: '0.96rem',
                  lineHeight: 1.2,
                  '&:hover': {
                    bgcolor: STOCK_WORKSPACE_UI.accentSurface,
                    borderColor: 'rgba(22, 90, 80, 0.22)',
                  },
                  '&.Mui-selected': {
                    bgcolor: STOCK_WORKSPACE_UI.accentSurface,
                    color: STOCK_WORKSPACE_UI.accent,
                    borderColor: 'rgba(22, 90, 80, 0.22)',
                  },
                }}
              />
            ))}
          </Tabs>
        </Box>

        <Box
          sx={{
            ...stockPanelSx,
            p: 1.5,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 1.5, flexWrap: 'wrap', mb: 1.2 }}>
            <Box>
              <Typography sx={{ fontSize: '1.08rem', fontWeight: 900, color: STOCK_WORKSPACE_UI.text, mb: 0.45 }}>
                {activeTab === 'request'
                  ? 'ส่งคำขอปรับ'
              : 'คำขอของฉัน'}
              </Typography>
              <Typography sx={{ fontSize: '0.88rem', color: STOCK_WORKSPACE_UI.muted }}>
                {activeTab === 'request'
                  ? 'กรอกข้อมูลปรับสต๊อกทีละรายการ หรือเพิ่มหลาย line เพื่อส่งเป็นคำขอเดียว'
                  : 'ติดตามคำขอของตัวเอง พร้อมตรวจสอบ snapshot หลังอนุมัติ'}
              </Typography>
            </Box>
            <Stack direction="row" spacing={1}>
              <Button
                variant="contained"
                startIcon={<RefreshOutlined />}
                onClick={() => void refreshAll()}
                disabled={masterLoading || loading}
                sx={{ borderRadius: 4, bgcolor: STOCK_WORKSPACE_UI.accent, '&:hover': { bgcolor: '#10473f' } }}
              >
                รีเฟรช
              </Button>
              {canRequestAdjustStock ? (
                <Button
                  variant="outlined"
                  startIcon={<AddCircleOutlineRounded />}
                  onClick={() => setActiveTab('request')}
                  sx={{
                    borderRadius: 4,
                    borderColor: '#b8c5bf',
                    color: STOCK_WORKSPACE_UI.text,
                    '&:hover': { borderColor: STOCK_WORKSPACE_UI.accent, bgcolor: 'rgba(22, 90, 80, 0.06)' },
                  }}
                >
                  คำขอใหม่
                </Button>
              ) : null}
            </Stack>
          </Box>

          {activeTab === 'request' && canRequestAdjustStock ? (
            <StockSection
              title="ฟอร์มส่งคำขอปรับ"
              description="บันทึกเป็น Pending แล้วส่งเข้าสู่กระบวนการอนุมัติ"
              action={
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  <FormControl size="small" sx={{ minWidth: { xs: '100%', sm: 280 } }}>
                    <Select
                      value={selectedFacilityId}
                      onChange={(event) => handleFacilityChange(Number(event.target.value))}
                      disabled={!facilityOptions.length}
                      sx={{ height: 40, borderRadius: 2, bgcolor: STOCK_WORKSPACE_UI.panelSoft }}
                    >
                      {facilityOptions.map((facility) => (
                        <MenuItem key={facility.facilityNodeId} value={facility.facilityNodeId}>
                          {facility.facilityCode} - {facility.facilityName}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Box>
              }
            >
              <Stack spacing={2}>
                <Box
                  sx={{
                    display: 'grid',
                    gridTemplateColumns: { xs: '1fr', md: '1.2fr 1fr' },
                    gap: 1.2,
                  }}
                >
                  <TextField
                    type="datetime-local"
                    label="วันที่ทำรายการ"
                    value={requestDate}
                    onChange={(event) => setRequestDate(event.target.value)}
                    InputLabelProps={{ shrink: true }}
                    fullWidth
                    size="small"
                  />
                  <TextField
                    label="Facility"
                    value={selectedFacility ? `${selectedFacility.facilityCode} - ${selectedFacility.facilityName}` : '-'}
                    size="small"
                    fullWidth
                    disabled
                  />
                </Box>

                <TextField
                  label="หมายเหตุ"
                  value={remarks}
                  onChange={(event) => setRemarks(event.target.value)}
                  multiline
                  minRows={2}
                  fullWidth
                  size="small"
                  placeholder="เหตุผลหรือข้อมูลเพิ่มเติมสำหรับผู้อนุมัติ"
                />

                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1.2, flexWrap: 'wrap' }}>
                  <Typography variant="body2" color="text.secondary">
                    ระบบจะใช้หน่วยนับฐานของสินค้าอัตโนมัติ และ snapshot ยอดคงเหลือจริงเมื่อส่งคำขอ
                  </Typography>
                  <Button
                    variant="outlined"
                    startIcon={<AddCircleOutlineRounded />}
                    onClick={addLine}
                    sx={{
                      borderRadius: 4,
                      borderColor: '#b8c5bf',
                      color: STOCK_WORKSPACE_UI.text,
                      '&:hover': { borderColor: STOCK_WORKSPACE_UI.accent, bgcolor: 'rgba(22, 90, 80, 0.06)' },
                    }}
                  >
                    เพิ่ม line
                  </Button>
                </Box>

                <TableContainer
                  component={Paper}
                  sx={{ borderRadius: 3, border: `1px solid ${STOCK_WORKSPACE_UI.border}`, boxShadow: 'none' }}
                >
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>คลัง</TableCell>
                        <TableCell>สินค้า</TableCell>
                        <TableCell>หน่วย</TableCell>
                        <TableCell align="right">จำนวนใหม่</TableCell>
                        <TableCell>เหตุผล</TableCell>
                        <TableCell align="center">จัดการ</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {draftLines.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                            ยังไม่มีรายการ
                          </TableCell>
                        </TableRow>
                      ) : (
                        draftLines.map((line) => {
                          const selectedItem = activeItems.find((item) => item.id === Number(line.itemId)) ?? null;
                          const selectedUom = activeUoms.find((uom) => uom.id === Number(line.uomId)) ?? null;
                          return (
                            <TableRow key={line.id}>
                              <TableCell sx={{ minWidth: 220 }}>
                                <TextField
                                  select
                                  size="small"
                                  fullWidth
                                  value={line.warehouseId}
                                  onChange={(event) => updateLine(line.id, { warehouseId: Number(event.target.value) })}
                                >
                                  <MenuItem value="">เลือกคลัง</MenuItem>
                                  {farmWarehouses.map((warehouse) => (
                                    <MenuItem key={warehouse.id} value={warehouse.id}>
                                      {formatWarehouseLabel(warehouse)}
                                    </MenuItem>
                                  ))}
                                </TextField>
                              </TableCell>
                              <TableCell sx={{ minWidth: 260 }}>
                                <TextField
                                  select
                                  size="small"
                                  fullWidth
                                  value={line.itemId}
                                  onChange={(event) => {
                                    const nextItemId = Number(event.target.value);
                                    const nextItem = activeItems.find((item) => item.id === nextItemId) ?? null;
                                    updateLine(line.id, {
                                      itemId: nextItemId,
                                      uomId: nextItem?.baseUomId ?? '',
                                    });
                                  }}
                                >
                                  <MenuItem value="">เลือกสินค้า</MenuItem>
                                  {activeItems.map((item) => (
                                    <MenuItem key={item.id} value={item.id}>
                                      {formatItemLabel(item)}
                                    </MenuItem>
                                  ))}
                                </TextField>
                                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                                  หน่วยฐาน: {selectedItem?.baseUomName || '-'}
                                </Typography>
                              </TableCell>
                              <TableCell sx={{ minWidth: 120 }}>
                                <TextField
                                  size="small"
                                  fullWidth
                                  value={selectedUom?.name ?? selectedItem?.baseUomName ?? '-'}
                                  disabled
                                />
                              </TableCell>
                              <TableCell sx={{ minWidth: 160 }} align="right">
                                <TextField
                                  type="number"
                                  size="small"
                                  fullWidth
                                  inputProps={{ min: 0, step: '0.0001' }}
                                  value={line.newQuantity}
                                  onChange={(event) => updateLine(line.id, { newQuantity: event.target.value })}
                                />
                              </TableCell>
                              <TableCell sx={{ minWidth: 280 }}>
                                <TextField
                                  size="small"
                                  fullWidth
                                  value={line.reason}
                                  onChange={(event) => updateLine(line.id, { reason: event.target.value })}
                                  placeholder="เหตุผลในการขอปรับ"
                                />
                              </TableCell>
                              <TableCell align="center" sx={{ minWidth: 80 }}>
                                <IconButton onClick={() => removeLine(line.id)} aria-label="remove-line">
                                  <DeleteOutlineRounded />
                                </IconButton>
                              </TableCell>
                            </TableRow>
                          );
                        })
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>

                <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, flexWrap: 'wrap' }}>
                  <Button
                    variant="outlined"
                      onClick={() => {
                        setDraftLines([
                          createDraftLine({
                            warehouseId: farmWarehouses[0]?.id ?? '',
                            itemId: activeItems[0]?.id ?? '',
                            uomId: activeItems[0]?.baseUomId ?? activeUoms[0]?.id ?? '',
                          }),
                        ]);
                        setRemarks('');
                        setRequestDate(dayjs().format('YYYY-MM-DDTHH:mm'));
                      }}
                    sx={{
                      borderRadius: 4,
                      borderColor: '#b8c5bf',
                      color: STOCK_WORKSPACE_UI.text,
                    }}
                  >
                    ล้างฟอร์ม
                  </Button>
                  <Button
                    variant="contained"
                    onClick={() => void handleSubmit()}
                    disabled={saving || masterLoading || loading || selectedFacilityId === ''}
                    sx={{ borderRadius: 4, bgcolor: STOCK_WORKSPACE_UI.accent, '&:hover': { bgcolor: '#10473f' } }}
                  >
                    {saving ? 'กำลังส่ง...' : 'ส่งคำขอปรับ'}
                  </Button>
                </Box>
              </Stack>
            </StockSection>
          ) : null}

              {activeTab === 'my-requests' && canRequestAdjustStock ? (
            <StockSection
              title="คำขอของฉัน"
              description="ติดตามคำขอปรับสต๊อกของคุณ พร้อมสถานะล่าสุด"
            >
              <RequestTable
                rows={myRequests}
                loading={loading}
                emptyText="ยังไม่มีคำขอปรับสต๊อก"
                onView={openDetails}
              />
              </StockSection>
            ) : null}
        </Box>
      </Stack>

      <StockAdjustmentRequestDetailsDialog
        open={detailsOpen}
        request={selectedRequest}
        onClose={() => {
          setDetailsOpen(false);
          setSelectedRequest(null);
        }}
      />
    </Box>
  );
}

type RequestTableProps = {
  rows: StockAdjustmentRequestResponse[];
  loading: boolean;
  emptyText: string;
  onView: (request: StockAdjustmentRequestResponse) => void;
};

function RequestTable({ rows, loading, emptyText, onView }: RequestTableProps) {
  return (
    <TableContainer component={Paper} sx={{ borderRadius: 3, border: `1px solid ${STOCK_WORKSPACE_UI.border}`, boxShadow: 'none' }}>
      <Table size="small" stickyHeader>
        <TableHead>
          <TableRow>
            <TableCell>เลขที่เอกสาร</TableCell>
            <TableCell>วันที่ขอ</TableCell>
            <TableCell>Facility</TableCell>
            <TableCell align="right">มูลค่า Diff</TableCell>
            <TableCell>สถานะ</TableCell>
            <TableCell align="center">จัดการ</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {loading ? (
            <TableRow>
              <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                กำลังโหลด...
              </TableCell>
            </TableRow>
          ) : rows.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                {emptyText}
              </TableCell>
            </TableRow>
          ) : (
            rows.map((row) => (
              <TableRow key={row.id}>
                <TableCell>{row.documentNumber}</TableCell>
                <TableCell>{formatDateTime(row.requestDate)}</TableCell>
                <TableCell>{row.facilityName}</TableCell>
                <TableCell align="right">{formatNumber(row.totalDeltaValue ?? 0, 2)}</TableCell>
                <TableCell>{statusChip(row.status)}</TableCell>
                <TableCell align="center">
                  <Button size="small" variant="outlined" onClick={() => onView(row)}>
                    ดูรายละเอียด
                  </Button>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

type ApprovalTableProps = {
  rows: StockAdjustmentRequestResponse[];
  loading: boolean;
  actionLoading: boolean;
  emptyText: string;
  onView: (request: StockAdjustmentRequestResponse) => void;
  onApprove: (request: StockAdjustmentRequestResponse) => void;
  onReject: (request: StockAdjustmentRequestResponse) => void;
};

function ApprovalTable({ rows, loading, actionLoading, emptyText, onView, onApprove, onReject }: ApprovalTableProps) {
  return (
    <TableContainer component={Paper} sx={{ borderRadius: 3, border: `1px solid ${STOCK_WORKSPACE_UI.border}`, boxShadow: 'none' }}>
      <Table size="small" stickyHeader>
        <TableHead>
          <TableRow>
            <TableCell>เลขที่เอกสาร</TableCell>
            <TableCell>ผู้ขอ</TableCell>
            <TableCell>Facility</TableCell>
            <TableCell align="right">มูลค่า Diff</TableCell>
            <TableCell align="center">จัดการ</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {loading ? (
            <TableRow>
              <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                กำลังโหลด...
              </TableCell>
            </TableRow>
          ) : rows.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                {emptyText}
              </TableCell>
            </TableRow>
          ) : (
            rows.map((row) => (
              <TableRow key={row.id}>
                <TableCell>{row.documentNumber}</TableCell>
                <TableCell>{row.requesterName}</TableCell>
                <TableCell>{row.facilityName}</TableCell>
                <TableCell align="right">{formatNumber(row.totalDeltaValue ?? 0, 2)}</TableCell>
                <TableCell align="center">
                  <Stack direction="row" spacing={1} justifyContent="center" flexWrap="wrap">
                    <Button size="small" variant="outlined" onClick={() => onView(row)}>
                      ดูรายละเอียด
                    </Button>
                    <Button
                      size="small"
                      variant="contained"
                      onClick={() => onApprove(row)}
                      disabled={actionLoading}
                      sx={{ bgcolor: STOCK_WORKSPACE_UI.accent, '&:hover': { bgcolor: '#10473f' } }}
                    >
                      อนุมัติ
                    </Button>
                    <Button
                      size="small"
                      variant="outlined"
                      color="error"
                      onClick={() => onReject(row)}
                      disabled={actionLoading}
                    >
                      ไม่อนุมัติ
                    </Button>
                  </Stack>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

function validateDraftLines(lines: DraftLine[], warehouses: WarehouseResponse[], items: ItemOption[]): string | null {
  if (!lines.length) {
    return 'กรุณาเพิ่มรายการอย่างน้อย 1 รายการ';
  }

  const seen = new Set<string>();
  for (const line of lines) {
    const warehouseId = Number(line.warehouseId);
    const itemId = Number(line.itemId);
    const uomId = Number(line.uomId);
    const quantity = Number(line.newQuantity);
    const reason = line.reason.trim();

    if (!warehouseId) return 'กรุณาเลือกคลัง';
    if (!itemId) return 'กรุณาเลือกสินค้า';
    if (!uomId) return 'กรุณาระบุหน่วยนับ';
    if (!Number.isFinite(quantity) || quantity < 0) return 'จำนวนใหม่ต้องเป็น 0 หรือมากกว่า';
    if (!reason) return 'กรุณาระบุเหตุผลในแต่ละรายการ';

    const warehouse = warehouses.find((candidate) => candidate.id === warehouseId);
    if (!warehouse || warehouse.warehouseType !== 'Farm') {
      return 'คำขอปรับสต๊อกใช้ได้เฉพาะคลังฟาร์ม';
    }

    const item = items.find((candidate) => candidate.id === itemId);
    if (!item) return 'สินค้าไม่ถูกต้อง';
    if (item.baseUomId !== uomId) {
      return `สินค้า ${item.code} ต้องใช้หน่วยฐาน`;
    }

    const key = `${warehouseId}|${itemId}|${uomId}`;
    if (seen.has(key)) {
      return 'ไม่สามารถเพิ่มรายการซ้ำสำหรับคลัง/สินค้า/หน่วยเดียวกัน';
    }
    seen.add(key);
  }

  return null;
}
