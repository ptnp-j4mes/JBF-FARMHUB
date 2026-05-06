'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import dayjs from '@/lib/dayjs';
import Swal from 'sweetalert2';
import {
  Alert,
  Box,
  Button,
  FormControl,
  Grid,
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
import { alpha, useTheme } from '@mui/material/styles';
import {
  AddCircleOutlineRounded,
  CheckCircleOutlineOutlined,
  DeleteOutlineRounded,
  DescriptionOutlined,
  PendingActionsOutlined,
  Refresh as RefreshIcon,
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
import { toISODateString } from '@/lib/utils/date.util';
import { formatNumber } from '@/lib/utils/format.util';
import { toThaiWorkflowStatus } from '@/lib/utils/status.util';
import { StatsCard, QuickStatusButtonGroup } from '@/components/common';
import { WorkspaceHeader } from '@/design-system';
import { filterFarmWarehousesByFacility } from '@/features/production/stock/utils/warehouse-scope.util';
import {
  StockAdjustmentRequestDetailsDialog,
  StockAdjustmentRequestFilters,
  StockAdjustmentRequestTable,
} from './components';
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
  isCentralHub?: boolean;
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

const panelSx = {
  borderRadius: 3.5,
  border: '1px solid',
  borderColor: 'divider',
  bgcolor: 'background.paper',
  boxShadow: 2,
};

export function StockAdjustmentRequestPage() {
  const user = authService.getUser();
  const canViewPage = canViewWarehouseAdjustmentRequests();
  const canRequestAdjustStock = canManageWarehouseAdjustmentRequests();
  const theme = useTheme();

  const today = toISODateString(new Date());

  const facilityOptions = useMemo<FacilityOption[]>(() => {
    return getUserFarmScopeNodes(user).map((node) => ({
      facilityNodeId: node.facilityNodeId,
      facilityCode: node.facilityCode,
      facilityName: node.facilityName,
      isCentralHub: false,
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

  // Filter state for My Requests tab
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [dateFrom, setDateFrom] = useState(today);
  const [dateTo, setDateTo] = useState(today);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);

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

  // Reset page on filter changes
  useEffect(() => {
    setPage(0);
  }, [searchTerm, statusFilter, dateFrom, dateTo]);

  const summary = useMemo(() => {
    const allMyRequests = myRequests.length;
    const pendingMyRequests = myRequests.filter((request) => request.status === 'Pending').length;
    const approvedMyRequests = myRequests.filter((request) => request.status === 'Approved').length;
    const totalDeltaValue = myRequests.reduce((sum, request) => sum + Number(request.totalDeltaValue ?? 0), 0);

    return {
      allMyRequests,
      pending: pendingMyRequests,
      approved: approvedMyRequests,
      totalDeltaValue,
    };
  }, [myRequests]);

  const filteredRows = useMemo(() => {
    const keyword = searchTerm.trim().toLowerCase();
    return myRequests.filter((row) => {
      const rowDate = row.requestDate.slice(0, 10);
      if (dateFrom && rowDate < dateFrom) return false;
      if (dateTo && rowDate > dateTo) return false;
      if (statusFilter && row.status !== statusFilter) return false;
      if (!keyword) return true;
      return (
        row.documentNumber.toLowerCase().includes(keyword) ||
        row.facilityName.toLowerCase().includes(keyword) ||
        row.requesterName.toLowerCase().includes(keyword)
      );
    });
  }, [searchTerm, statusFilter, dateFrom, dateTo, myRequests]);

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
      { label: toThaiWorkflowStatus('Rejected'), value: 'Rejected', count: count('Rejected') },
      { label: toThaiWorkflowStatus('Completed'), value: 'Completed', count: count('Completed') },
      { label: toThaiWorkflowStatus('Cancelled'), value: 'Cancelled', count: count('Cancelled') },
    ];
  }, [displayedRows]);

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

  const handleClearFilters = useCallback(() => {
    setSearchTerm('');
    setStatusFilter('');
    setDateFrom(today);
    setDateTo(today);
    setPage(0);
  }, [today]);

  const tabItems = [
    ...(canRequestAdjustStock ? [{ value: 'request', label: 'ส่งคำขอปรับ' }] : []),
    { value: 'my-requests', label: 'คำขอของฉัน' },
  ] as const;

  if (!canViewPage) {
    return (
      <Box sx={{ p: { xs: 1.5, md: 2 } }}>
        <Alert severity="warning">
          คุณไม่มีสิทธิ์เข้าถึงหน้าคำขอปรับสต๊อก
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 1400, mx: 'auto', p: { xs: 1.5, md: 2 } }}>
      <WorkspaceHeader
        chipLabel="Adjust Request"
        title="คำขอปรับสต๊อก"
        meta="Warehouse / คำขอปรับสต๊อก"
      />

      <Stack spacing={2.5}>
        {/* Stats Cards */}
        <Box>
          <Grid container spacing={1.5}>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <StatsCard
                title="คำขอทั้งหมด"
                value={summary.allMyRequests}
                subtitle="จำนวนเอกสารทั้งหมด"
                icon={<DescriptionOutlined />}
                color="info"
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <StatsCard
                title="รออนุมัติ"
                value={summary.pending}
                subtitle="สถานะ Pending"
                icon={<PendingActionsOutlined />}
                color="warning"
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <StatsCard
                title="อนุมัติแล้ว"
                value={summary.approved}
                subtitle="สถานะ Approved"
                icon={<TaskAltOutlined />}
                color="success"
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <StatsCard
                title="มูลค่า Diff รวม"
                value={formatNumber(summary.totalDeltaValue, 2)}
                subtitle="ยอด snapshot เพื่อคำนวณต้นทุน"
                icon={<CheckCircleOutlineOutlined />}
                color="primary"
              />
            </Grid>
          </Grid>
        </Box>

        {error && (
          <Alert severity="error" onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {/* Tabs */}
        <Box sx={{ ...panelSx, px: 1, py: 1 }}>
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
                  borderColor: 'divider',
                  bgcolor: 'background.paper',
                  color: 'text.secondary',
                  textTransform: 'none',
                  fontWeight: 800,
                  fontSize: '0.96rem',
                  lineHeight: 1.2,
                  '&:hover': {
                    bgcolor: (t) => alpha(t.palette.primary.main, 0.04),
                    borderColor: (t) => alpha(t.palette.primary.main, 0.2),
                  },
                  '&.Mui-selected': {
                    bgcolor: (t) => alpha(t.palette.primary.main, 0.06),
                    color: 'primary.main',
                    borderColor: (t) => alpha(t.palette.primary.main, 0.2),
                  },
                }}
              />
            ))}
          </Tabs>
        </Box>

        {/* Tab Content */}
        <Box sx={{ ...panelSx, p: 1.5 }}>
          <Box sx={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 1.5, flexWrap: 'wrap', mb: 1.2 }}>
            <Box>
              <Typography sx={{ fontSize: '1.08rem', fontWeight: 900, color: 'text.primary', mb: 0.45 }}>
                {activeTab === 'request'
                  ? 'ส่งคำขอปรับ'
                  : 'คำขอของฉัน'}
              </Typography>
              <Typography sx={{ fontSize: '0.88rem', color: 'text.secondary' }}>
                {activeTab === 'request'
                  ? 'กรอกข้อมูลปรับสต๊อกทีละรายการ หรือเพิ่มหลาย line เพื่อส่งเป็นคำขอเดียว'
                  : 'ติดตามคำขอของตัวเอง พร้อมตรวจสอบ snapshot หลังอนุมัติ'}
              </Typography>
            </Box>
            <Stack direction="row" spacing={1}>
              <Button
                variant="outlined"
                startIcon={<RefreshIcon />}
                onClick={() => void refreshAll()}
                disabled={masterLoading || loading}
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
              {canRequestAdjustStock ? (
                <Button
                  variant="contained"
                  startIcon={<AddCircleOutlineRounded />}
                  onClick={() => setActiveTab('request')}
                  sx={{
                    borderRadius: 2.2,
                    bgcolor: 'primary.main',
                    boxShadow: 1,
                    '&:hover': { bgcolor: 'primary.dark' },
                  }}
                >
                  คำขอใหม่
                </Button>
              ) : null}
            </Stack>
          </Box>

          {/* Submit Request Tab */}
          {activeTab === 'request' && canRequestAdjustStock ? (
            <Stack spacing={2}>
              <Box
                component="fieldset"
                sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3, p: { xs: 1.25, md: 1.5 }, minWidth: 0, bgcolor: 'background.paper', boxShadow: 1 }}
              >
                <Typography component="legend" sx={{ px: 1.1, fontSize: '0.95rem', fontWeight: 800, color: 'text.primary' }}>
                  ฟอร์มส่งคำขอปรับ
                </Typography>
                <Typography variant="caption" sx={{ px: 1, color: 'text.secondary', display: 'block', mb: 1.5 }}>
                  บันทึกเป็น Pending แล้วส่งเข้าสู่กระบวนการอนุมัติ
                </Typography>

                <Stack spacing={2}>
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 1 }}>
                    <FormControl size="small" sx={{ minWidth: { xs: '100%', sm: 280 } }}>
                      <Select
                        value={selectedFacilityId}
                        onChange={(event) => handleFacilityChange(Number(event.target.value))}
                        disabled={!facilityOptions.length}
                        sx={{ height: 40, borderRadius: 2, bgcolor: 'background.paper' }}
                      >
                        {facilityOptions.map((facility) => (
                          <MenuItem key={facility.facilityNodeId} value={facility.facilityNodeId}>
                            {facility.facilityCode} - {facility.facilityName}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Box>

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
                        borderRadius: 2.2,
                        borderColor: 'divider',
                        color: 'text.primary',
                        '&:hover': { borderColor: 'primary.main', bgcolor: (t) => alpha(t.palette.primary.main, 0.04) },
                      }}
                    >
                      เพิ่ม line
                    </Button>
                  </Box>

                  <TableContainer
                    component={Paper}
                    sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider', boxShadow: 'none' }}
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
                        borderRadius: 2.2,
                        borderColor: 'divider',
                        color: 'text.primary',
                      }}
                    >
                      ล้างฟอร์ม
                    </Button>
                    <Button
                      variant="contained"
                      onClick={() => void handleSubmit()}
                      disabled={saving || masterLoading || loading || selectedFacilityId === ''}
                      sx={{ borderRadius: 2.2, bgcolor: 'primary.main', boxShadow: 1, '&:hover': { bgcolor: 'primary.dark' } }}
                    >
                      {saving ? 'กำลังส่ง...' : 'ส่งคำขอปรับ'}
                    </Button>
                  </Box>
                </Stack>
              </Box>
            </Stack>
          ) : null}

          {/* My Requests Tab */}
          {activeTab === 'my-requests' && canRequestAdjustStock ? (
            <Stack spacing={1.5}>
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
              <StockAdjustmentRequestFilters
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

              <Typography variant="caption" sx={{ display: 'block', mb: 0.5, textAlign: 'right', color: 'text.secondary' }}>
                *ดับเบิลคลิกที่แถวเพื่อดูรายละเอียดเพิ่มเติม
              </Typography>

              {/* Table */}
              <StockAdjustmentRequestTable
                rows={displayedRows}
                loading={loading}
                page={page}
                rowsPerPage={rowsPerPage}
                onPageChange={(_, nextPage) => setPage(nextPage)}
                onRowsPerPageChange={setRowsPerPage}
                onView={openDetails}
                onRowDoubleClick={openDetails}
              />
            </Stack>
          ) : null}
        </Box>
      </Stack>

      {/* Dialog */}
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
