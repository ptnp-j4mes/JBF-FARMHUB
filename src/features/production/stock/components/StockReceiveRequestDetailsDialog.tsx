'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Dialog,
  DialogActions,
  DialogContent,
  Grid,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
  MenuItem,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { AxiosError } from 'axios';
import { AddCircleOutlineRounded, DeleteOutlineRounded } from '@mui/icons-material';
import Swal from 'sweetalert2';
import DialogTitleWithClose from '@/design-system/components/atoms/DialogTitleWithClose/DialogTitleWithClose';
import { formatNumber } from '@/lib/utils/format.util';
import { stockService } from '../services/stock.service';
import type {
  FeedSiloOption,
  StockBalanceResponse,
  StockReceiveRequestResponse,
  UpdateStockReceiveRequest,
} from '../types';
import { getFeedSiloDisplayLabel } from '../utils/location-display.util';
import { getFeedSiloCompatibility } from '../utils/feed-silo-compatibility.util';
import {
  getStockDialogActionsSx,
  getStockDialogErrorAlertSx,
  getStockDialogFormSx,
  getStockDialogPaperSx,
  getStockDialogTableSx,
} from './stock-dialog.constants';
import { StockActionButton } from './StockActionButton';

type EditableAllocationState = {
  key: string;
  feedSiloId: number | '';
  quantity: string;
};

type EditableExpiryAllocationState = {
  key: string;
  expiryDate: string;
  quantity: string;
};

type EditableLineState = {
  id: number;
  unitCost: string;
  lotNumber: string;
  remarks: string;
  allocations: EditableAllocationState[];
  expiryAllocations: EditableExpiryAllocationState[];
};

type StockReceiveRequestDetailsDialogProps = {
  open: boolean;
  data: StockReceiveRequestResponse | null;
  onClose: () => void;
  onSubmitted?: () => Promise<void> | void;
};

function parseOptionalAmount(value: string): number | null {
  const normalized = value.trim().replace(/,/g, '');
  if (!normalized) return null;
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

function toDateIso(value: string): string | null {
  const date = value.trim();
  if (!date) return null;
  const parsed = new Date(`${date}T00:00:00`);
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
}

function resolveMinExpiryDate(allocations: EditableExpiryAllocationState[]): string | null {
  const dates = allocations
    .map((allocation) => allocation.expiryDate)
    .filter((value) => value.trim());

  if (dates.length === 0) return null;

  return dates.reduce((min, value) => (new Date(value).getTime() < new Date(min).getTime() ? value : min));
}

function createEditableAllocation(quantity = ''): EditableAllocationState {
  return {
    key: crypto.randomUUID(),
    feedSiloId: '',
    quantity,
  };
}

function createEditableExpiryAllocation(quantity = ''): EditableExpiryAllocationState {
  return {
    key: crypto.randomUUID(),
    expiryDate: '',
    quantity,
  };
}

function isMedicineOrVaccineCategory(itemCategoryCode?: string, itemCategoryName?: string): boolean {
  const normalizedCode = (itemCategoryCode ?? '').trim();
  const normalizedName = (itemCategoryName ?? '').trim();
  return normalizedCode === '01' || normalizedCode === '11' || normalizedName.includes('ยา') || normalizedName.includes('วัคซีน');
}

function requiresFeedSiloManagement(line: StockReceiveRequestResponse['lines'][number]): boolean {
  return (line.itemCategoryCode ?? '').trim() === '05' && (line.itemCode ?? '').trim().toUpperCase().startsWith('SEMI-');
}

function lineRequiresExpiry(line: StockReceiveRequestResponse['lines'][number]): boolean {
  if (line.pigItemId) return false;
  if (typeof line.isExpiryRequired === 'boolean') return line.isExpiryRequired;
  return isMedicineOrVaccineCategory(line.itemCategoryCode, line.itemCategoryName);
}

function normalizeOptionalNumber(value: number | null | undefined): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

export function StockReceiveRequestDetailsDialog({
  open,
  data,
  onClose,
  onSubmitted,
}: StockReceiveRequestDetailsDialogProps) {
  const [receiverName, setReceiverName] = useState('');
  const [referenceDetail, setReferenceDetail] = useState('');
  const [remarks, setRemarks] = useState('');
  const [freightCost, setFreightCost] = useState('');
  const [lines, setLines] = useState<EditableLineState[]>([]);
  const [saving, setSaving] = useState(false);
  const [finalizing, setFinalizing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [feedSiloOptions, setFeedSiloOptions] = useState<FeedSiloOption[]>([]);
  const [warehouseBalances, setWarehouseBalances] = useState<StockBalanceResponse[]>([]);
  const theme = useTheme();

  useEffect(() => {
    if (!open || !data) return;

    setReceiverName(data.receiverName || '');
    setReferenceDetail(data.referenceDetail || '');
    setRemarks(data.remarks || '');
    setFreightCost(data.freightCost != null && data.freightCost > 0 ? String(data.freightCost) : '');
    setLines(
      data.lines.map((line) => ({
        id: line.id,
        unitCost:
          line.lockedUnitCost != null && line.lockedUnitCost > 0
            ? String(line.lockedUnitCost)
            : line.unitCost != null && line.unitCost > 0
              ? String(line.unitCost)
              : '',
        lotNumber: line.lotNumber || '',
        remarks: line.remarks || '',
        allocations:
          line.allocations.length > 0
            ? line.allocations.map((allocation) => ({
                key: crypto.randomUUID(),
                feedSiloId: allocation.feedSiloId,
                quantity: String(allocation.quantity),
              }))
            : [createEditableAllocation('')],
        expiryAllocations:
          (line.expiryAllocations?.length ?? 0) > 0
            ? (line.expiryAllocations ?? []).map((allocation) => ({
                key: crypto.randomUUID(),
                expiryDate: String(allocation.expiryDate).slice(0, 10),
                quantity: String(allocation.quantity),
              }))
            : line.expiryDate
              ? [{
                  key: crypto.randomUUID(),
                  expiryDate: String(line.expiryDate).slice(0, 10),
                  quantity: String(line.receiveQuantity),
                }]
              : lineRequiresExpiry(line)
                ? [createEditableExpiryAllocation(String(line.receiveQuantity))]
                : [],
      })),
    );
    setSaving(false);
    setFinalizing(false);
    setError(null);
  }, [open, data]);

  useEffect(() => {
    if (!open || !data?.facilityId) {
      setFeedSiloOptions([]);
      return;
    }

    let active = true;
    void (async () => {
      try {
        const silos = await stockService.getFeedSiloOptions({ facilityId: data.facilityId });
        if (!active) return;
        setFeedSiloOptions(silos ?? []);
      } catch {
        if (!active) return;
        setFeedSiloOptions([]);
      }
    })();

    return () => {
      active = false;
    };
  }, [open, data?.facilityId]);

  useEffect(() => {
    if (!open || !data?.warehouseId) {
      setWarehouseBalances([]);
      return;
    }

    let active = true;
    void (async () => {
      try {
        const balances = await stockService.getStockBalanceByWarehouse(data.warehouseId);
        if (!active) return;
        setWarehouseBalances(balances);
      } catch {
        if (!active) return;
        setWarehouseBalances([]);
      }
    })();

    return () => {
      active = false;
    };
  }, [data?.warehouseId, open]);

  const lineMap = useMemo(() => {
    return new Map(lines.map((line) => [line.id, line] as const));
  }, [lines]);

  const canFinalize = Boolean(
      data &&
      data.status !== 'Completed' &&
      lines.length > 0 &&
      data.lines.every((sourceLine) => {
        if (sourceLine.pigItemId) return true;
        const editableLine = lineMap.get(sourceLine.id);
        return Boolean((editableLine?.lotNumber ?? '').trim());
      }) &&
      data.lines.every((sourceLine) => {
        const editableLine = lineMap.get(sourceLine.id);
        if (!editableLine) return false;
        if (!lineRequiresExpiry(sourceLine)) return true;

        const expirySum = editableLine.expiryAllocations.reduce(
          (sum, allocation) => sum + (parseOptionalAmount(allocation.quantity) ?? 0),
          0,
        );
        const hasAllDates = editableLine.expiryAllocations.every((allocation) => allocation.expiryDate.trim());

        return editableLine.expiryAllocations.length > 0 && hasAllDates && expirySum === sourceLine.receiveQuantity;
      }) &&
      lines.every((line) => {
        const unitCost = parseOptionalAmount(line.unitCost);
        return unitCost != null && unitCost > 0;
      }),
  );

  const updateLine = (id: number, updater: (current: EditableLineState) => EditableLineState) => {
    setLines((current) => current.map((line) => (line.id === id ? updater(line) : line)));
  };

  const updateAllocation = (
    lineId: number,
    key: string,
    updater: (current: EditableAllocationState) => EditableAllocationState,
  ) => {
    updateLine(lineId, (current) => ({
      ...current,
      allocations: current.allocations.map((allocation) =>
        allocation.key === key ? updater(allocation) : allocation,
      ),
    }));
  };

  const addAllocation = (lineId: number) => {
    updateLine(lineId, (current) => ({
      ...current,
      allocations: [...current.allocations, createEditableAllocation('')],
    }));
  };

  const removeAllocation = (lineId: number, key: string) => {
    updateLine(lineId, (current) => ({
      ...current,
      allocations:
        current.allocations.length <= 1
          ? [createEditableAllocation('')]
          : current.allocations.filter((allocation) => allocation.key !== key),
    }));
  };

  const updateExpiryAllocation = (
    lineId: number,
    key: string,
    updater: (current: EditableExpiryAllocationState) => EditableExpiryAllocationState,
  ) => {
    updateLine(lineId, (current) => ({
      ...current,
      expiryAllocations: current.expiryAllocations.map((allocation) =>
        allocation.key === key ? updater(allocation) : allocation,
      ),
    }));
  };

  const addExpiryAllocation = (lineId: number) => {
    updateLine(lineId, (current) => ({
      ...current,
      expiryAllocations: [...current.expiryAllocations, createEditableExpiryAllocation('')],
    }));
  };

  const removeExpiryAllocation = (lineId: number, key: string) => {
    updateLine(lineId, (current) => ({
      ...current,
      expiryAllocations:
        current.expiryAllocations.length <= 1
          ? [createEditableExpiryAllocation('')]
          : current.expiryAllocations.filter((allocation) => allocation.key !== key),
    }));
  };

  const buildPayload = (): UpdateStockReceiveRequest | null => {
    if (!data) return null;

    const requestedAllocationBySilo = new Map<number, number>();

    for (const line of lines) {
      const sourceLine = data.lines.find((item) => item.id === line.id);
      const isPigLine = Boolean(sourceLine?.pigItemId);

      if (!isPigLine && !line.lotNumber.trim()) {
        setError('กรุณากรอก Lot ให้ครบก่อนบันทึก');
        return null;
      }

      if (sourceLine && lineRequiresExpiry(sourceLine)) {
        if (line.expiryAllocations.length === 0) {
          setError(`กรุณากรอกวันหมดอายุของ ${sourceLine.itemName || sourceLine.pigItemName}`);
          return null;
        }

        let expirySum = 0;
        for (const expiryAllocation of line.expiryAllocations) {
          if (!expiryAllocation.expiryDate.trim()) {
            setError(`กรุณากรอกวันหมดอายุของ ${sourceLine.itemName || sourceLine.pigItemName}`);
            return null;
          }
          const qty = parseOptionalAmount(expiryAllocation.quantity);
          if (qty == null || qty <= 0) {
            setError(`กรุณาระบุจำนวนวันหมดอายุของ ${sourceLine.itemName || sourceLine.pigItemName}`);
            return null;
          }
          expirySum += qty;
        }

        if (expirySum !== sourceLine.receiveQuantity) {
          setError(`จำนวนวันหมดอายุของ ${sourceLine.itemName || sourceLine.pigItemName} ต้องเท่ากับจำนวนรับ`);
          return null;
        }
      }

      if (sourceLine && requiresFeedSiloManagement(sourceLine)) {
        for (const allocation of line.allocations) {
          if (allocation.feedSiloId === '') continue;
          const compatibility = getFeedSiloCompatibility(warehouseBalances, Number(allocation.feedSiloId), {
            itemId: sourceLine.itemId,
            pigItemId: sourceLine.pigItemId,
            lotNumber: line.lotNumber,
          });

          if (!compatibility.compatible) {
            setError(`ไซโล ${getFeedSiloDisplayLabel(
              feedSiloOptions.find((option) => option.id === Number(allocation.feedSiloId))?.name,
              feedSiloOptions.find((option) => option.id === Number(allocation.feedSiloId))?.code,
            )} ${compatibility.reason ?? 'ไม่สามารถใช้กับ item/lot นี้ได้'}`);
            return null;
          }
        }
      }

      const unitCost = parseOptionalAmount(line.unitCost);
      if (unitCost != null && unitCost < 0) {
        setError('ราคาต่อหน่วยต้องไม่ติดลบ');
        return null;
      }

      const shouldManageFeedSilo = sourceLine ? requiresFeedSiloManagement(sourceLine) : false;
      if (shouldManageFeedSilo) {
        if (line.allocations.length === 0) {
          setError('กรุณาจัดสรรไซโลให้ครบก่อนบันทึก');
          return null;
        }

        let allocationSum = 0;
        const seenSiloIds = new Set<number>();

        for (const allocation of line.allocations) {
          if (!allocation.feedSiloId) {
            setError('กรุณาเลือกไซโลให้ครบก่อนบันทึก');
            return null;
          }

          const siloId = Number(allocation.feedSiloId);
          if (seenSiloIds.has(siloId)) {
            setError('ห้ามเลือกไซโลซ้ำในรายการเดียวกัน');
            return null;
          }
          seenSiloIds.add(siloId);

          const quantity = parseOptionalAmount(allocation.quantity);
          if (quantity == null || quantity <= 0) {
            setError('กรุณาระบุจำนวนลงไซโลให้ครบ');
            return null;
          }

          allocationSum += quantity;
          requestedAllocationBySilo.set(siloId, (requestedAllocationBySilo.get(siloId) ?? 0) + quantity);
        }

        if (sourceLine && allocationSum !== sourceLine.receiveQuantity) {
          setError(`จำนวนรวมที่จัดสรรไซโลของ ${sourceLine.itemName || sourceLine.pigItemName} ต้องเท่ากับจำนวนรับ`);
          return null;
        }
      }
    }

    for (const [feedSiloId, requestedQuantity] of requestedAllocationBySilo.entries()) {
      const silo = feedSiloOptions.find((option) => option.id === feedSiloId);
      if (!silo) continue;

      const availableCapacity = Math.max(0, silo.capacityKg - silo.currentQuantityKg);
      if (requestedQuantity > availableCapacity) {
        setError(`ไซโล ${getFeedSiloDisplayLabel(silo.name, silo.code)} ความจุไม่พอ คงเหลือได้อีก ${formatNumber(availableCapacity)} กก.`);
        return null;
      }
    }

    return {
      receiverName: receiverName.trim(),
      referenceDetail: referenceDetail.trim(),
      remarks: remarks.trim(),
      freightCost: parseOptionalAmount(freightCost),
      lines: lines.map((line) => ({
        id: line.id,
        unitCost:
          (() => {
            const sourceLine = data.lines.find((item) => item.id === line.id);
            const lockedUnitCost = sourceLine?.lockedUnitCost;
            return lockedUnitCost != null && lockedUnitCost > 0
              ? lockedUnitCost
              : parseOptionalAmount(line.unitCost);
          })(),
        lotNumber: data.lines.find((item) => item.id === line.id)?.pigItemId ? '' : line.lotNumber.trim(),
        expiryDate: (() => {
          const sourceLine = data.lines.find((item) => item.id === line.id);
          if (sourceLine?.pigItemId) return null;
          const minExpiry = resolveMinExpiryDate(line.expiryAllocations);
          return minExpiry ? toDateIso(minExpiry) : null;
        })(),
        expiryAllocations: (() => {
          const sourceLine = data.lines.find((item) => item.id === line.id);
          if (sourceLine?.pigItemId) return [];
          return line.expiryAllocations
            .filter((allocation) => allocation.expiryDate.trim())
            .map((allocation) => ({
              expiryDate: toDateIso(allocation.expiryDate) ?? '',
              quantity: parseOptionalAmount(allocation.quantity) ?? 0,
            }));
        })(),
        remarks: line.remarks.trim(),
        allocations: (() => {
          const sourceLine = data.lines.find((item) => item.id === line.id);
          if (!sourceLine || !requiresFeedSiloManagement(sourceLine)) {
            return [];
          }

          return line.allocations
            .filter((allocation) => allocation.feedSiloId !== '')
            .map((allocation) => ({
              feedSiloId: Number(allocation.feedSiloId),
              quantity: parseOptionalAmount(allocation.quantity) ?? 0,
            }));
        })(),
      })),
    };
  };

  const hasMeaningfulChanges = (payload: UpdateStockReceiveRequest): boolean => {
    if (!data) return false;

    const currentFreightCost = normalizeOptionalNumber(data.freightCost);
    const nextFreightCost = normalizeOptionalNumber(payload.freightCost);
    if ((receiverName.trim() !== (data.receiverName ?? '').trim())
      || (referenceDetail.trim() !== (data.referenceDetail ?? '').trim())
      || (remarks.trim() !== (data.remarks ?? '').trim())
      || currentFreightCost !== nextFreightCost) {
      return true;
    }

    for (const payloadLine of payload.lines) {
      const sourceLine = data.lines.find((item) => item.id === payloadLine.id);
      if (!sourceLine) return true;

      const sourceUnitCost =
        (sourceLine.lockedUnitCost != null && sourceLine.lockedUnitCost > 0
          ? sourceLine.lockedUnitCost
          : sourceLine.unitCost) ?? null;
      const nextUnitCost = normalizeOptionalNumber(payloadLine.unitCost);

      const sourceExpiryAllocations = (sourceLine.expiryAllocations ?? [])
        .map((allocation) => `${String(allocation.expiryDate).slice(0, 10)}:${allocation.quantity}`)
        .sort()
        .join('|');
      const nextExpiryAllocations = (payloadLine.expiryAllocations ?? [])
        .map((allocation) => `${String(allocation.expiryDate).slice(0, 10)}:${allocation.quantity}`)
        .sort()
        .join('|');

      if ((payloadLine.lotNumber ?? '') !== (sourceLine.pigItemId ? '' : (sourceLine.lotNumber ?? '').trim())
        || normalizeOptionalNumber(sourceUnitCost) !== nextUnitCost
        || sourceExpiryAllocations !== nextExpiryAllocations
        || (payloadLine.remarks ?? '') !== (sourceLine.remarks ?? '').trim()) {
        return true;
      }

      const sourceAllocations = (sourceLine.allocations ?? [])
        .map((allocation) => `${allocation.feedSiloId}:${allocation.quantity}`)
        .sort()
        .join('|');
      const nextAllocations = (payloadLine.allocations ?? [])
        .map((allocation) => `${allocation.feedSiloId}:${allocation.quantity}`)
        .sort()
        .join('|');

      if (sourceAllocations !== nextAllocations) {
        return true;
      }
    }

    return false;
  };

  const handleSave = async () => {
    if (!data) return;
    const payload = buildPayload();
    if (!payload) return;

    try {
      setSaving(true);
      setError(null);
      await stockService.updateStockReceiveRequest(data.id, payload);
      await onSubmitted?.();
      await Swal.fire({
        icon: 'success',
        title: 'บันทึกใบรับสินค้าสำเร็จ',
        timer: 1200,
        showConfirmButton: false,
      });
      onClose();
    } catch (err) {
      const axiosError = err as AxiosError<{ message?: string }>;
      setError(axiosError.response?.data?.message ?? 'ไม่สามารถบันทึกใบรับสินค้าได้');
    } finally {
      setSaving(false);
    }
  };

  const handleFinalize = async () => {
    if (!data) return;

    const payload = buildPayload();
    if (!payload) return;

    if (!canFinalize) {
      setError('กรุณากรอกราคาต่อหน่วย และกรอก Lot/วันหมดอายุให้ครบสำหรับรายการที่จำเป็นก่อนรับเข้าคลัง');
      return;
    }

    try {
      setFinalizing(true);
      setError(null);
      if (hasMeaningfulChanges(payload)) {
        await stockService.updateStockReceiveRequest(data.id, payload);
      }
      await stockService.finalizeStockReceiveRequest(data.id);
      onClose();
      void Promise.resolve(onSubmitted?.());
      void Swal.fire({
        icon: 'success',
        title: 'รับเข้าคลังสำเร็จ',
        timer: 1200,
        showConfirmButton: false,
      });
    } catch (err) {
      const axiosError = err as AxiosError<{ message?: string }>;
      setError(axiosError.response?.data?.message ?? 'ไม่สามารถรับเข้าคลังได้');
      await Swal.fire({
        icon: 'error',
        title: 'รับเข้าคลังไม่สำเร็จ',
        text: axiosError.response?.data?.message ?? 'ไม่สามารถรับเข้าคลังได้',
      });
    } finally {
      setFinalizing(false);
    }
  };

  return (
    <Dialog open={open} onClose={saving || finalizing ? undefined : onClose} fullWidth maxWidth="xl" PaperProps={{ sx: getStockDialogPaperSx(theme) }}>
      <DialogTitleWithClose onClose={onClose} variant="master">
        รายละเอียดใบรับสินค้า
      </DialogTitleWithClose>
      <DialogContent dividers sx={getStockDialogFormSx(theme)}>
        {data ? (
          <Stack spacing={3}>
            {error ? <Alert severity="error" sx={getStockDialogErrorAlertSx(theme)}>{error}</Alert> : null}

            <Grid container spacing={2}>
              <Grid size={{ xs: 12, md: 4 }}>
                <Typography variant="caption" color="text.secondary">เลขที่เอกสาร</Typography>
                <Typography variant="h6" fontWeight={800}>{data.documentNumber}</Typography>
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <Typography variant="caption" color="text.secondary">อ้างอิง PR</Typography>
                <Typography variant="body1" fontWeight={700}>{data.purchaseRequestNumber}</Typography>
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <Typography variant="caption" color="text.secondary">สถานะ</Typography>
                <Typography variant="body1" fontWeight={700}>{data.status}</Typography>
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <Typography variant="caption" color="text.secondary">ฟาร์ม</Typography>
                <Typography variant="body1" fontWeight={700}>{data.facilityName}</Typography>
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <Typography variant="caption" color="text.secondary">คลังปลายทาง</Typography>
                <Typography variant="body1" fontWeight={700}>{data.warehouseName}</Typography>
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <TextField
                  label="ผู้รับสินค้า"
                  value={receiverName}
                  onChange={(event) => setReceiverName(event.target.value)}
                  fullWidth
                  size="small"
                />
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <TextField
                  label="รายละเอียดอ้างอิง"
                  value={referenceDetail}
                  onChange={(event) => setReferenceDetail(event.target.value)}
                  fullWidth
                  size="small"
                />
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <TextField
                  label="ค่าขนส่ง"
                  value={freightCost}
                  onChange={(event) => setFreightCost(event.target.value)}
                  fullWidth
                  size="small"
                />
              </Grid>
              <Grid size={{ xs: 12, md: 12 }}>
                <TextField
                  label="หมายเหตุ"
                  value={remarks}
                  onChange={(event) => setRemarks(event.target.value)}
                  fullWidth
                  multiline
                  minRows={2}
                />
              </Grid>
            </Grid>

            <Paper sx={{ ...getStockDialogTableSx(theme), overflow: 'hidden' }}>
              <TableContainer sx={{ overflowX: 'auto' }}>
                <Table
                  size="small"
                  sx={{
                    tableLayout: 'fixed',
                    '& .MuiTableCell-root': { verticalAlign: 'top', px: 1.25, py: 1 },
                    '& .MuiTableCell-head': { whiteSpace: 'nowrap' },
                  }}
                >
                  <colgroup>
                    <col style={{ width: '17%' }} />
                    <col style={{ width: '7%' }} />
                    <col style={{ width: '10%' }} />
                    <col style={{ width: '20%' }} />
                    <col style={{ width: '22%' }} />
                    <col style={{ width: '8%' }} />
                    <col style={{ width: '7%' }} />
                    <col style={{ width: '9%' }} />
                  </colgroup>
                  <TableHead>
                    <TableRow>
                      <TableCell>รายการสินค้า</TableCell>
                      <TableCell>จำนวนรับ</TableCell>
                      <TableCell>Lot</TableCell>
                      <TableCell>วันหมดอายุ</TableCell>
                      <TableCell>ไซโล</TableCell>
                      <TableCell>ราคา/หน่วย</TableCell>
                      <TableCell>หมายเหตุ</TableCell>
                      <TableCell>สถานะ</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {data.lines.map((line) => {
                      const editableLine = lineMap.get(line.id);
                      const hasAllocations = requiresFeedSiloManagement(line);
                      const isPigLine = Boolean(line.pigItemId);
                      return (
                        <TableRow key={line.id}>
                          <TableCell>
                            <Typography variant="body2" fontWeight={700}>
                              {line.itemName || line.pigItemName}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {line.itemCode || line.pigItemCode || '-'}
                            </Typography>
                          </TableCell>
                          <TableCell sx={{ textAlign: 'center' }}>
                            {formatNumber(line.receiveQuantity)} {line.uomName}
                          </TableCell>
                          <TableCell sx={{ minWidth: 140 }}>
                            <TextField
                              value={isPigLine ? 'ระบบจะสร้างให้อัตโนมัติ' : editableLine?.lotNumber ?? ''}
                              onChange={(event) =>
                                updateLine(line.id, (current) => ({ ...current, lotNumber: event.target.value }))
                              }
                              size="small"
                              fullWidth
                              disabled={isPigLine}
                              helperText={isPigLine ? 'ระบบจะสร้างเลข lot/batch ให้ตอนรับเข้าคลัง' : undefined}
                            />
                          </TableCell>
                          <TableCell sx={{ minWidth: 260 }}>
                            {isPigLine ? (
                              <Typography variant="body2" color="text.secondary">-</Typography>
                            ) : lineRequiresExpiry(line) ? (
                              <Stack spacing={0.85}>
                                {(editableLine?.expiryAllocations ?? []).map((allocation, index) => (
                                  <Box
                                    key={allocation.key}
                                    sx={{
                                      p: 0.9,
                                      border: '1px solid',
                                      borderColor: theme.palette.divider,
                                      borderRadius: 10,
                                      bgcolor: theme.palette.background.paper,
                                    }}
                                  >
                                    <Stack spacing={0.75}>
                                      <Typography variant="caption" color="text.secondary" fontWeight={700}>
                                        วันหมดอายุที่ {index + 1}
                                      </Typography>
                                      <Stack direction={{ xs: 'column', md: 'row' }} spacing={0.85}>
                                        <TextField
                                          type="date"
                                          label="วันหมดอายุ *"
                                          value={allocation.expiryDate}
                                          onChange={(event) =>
                                            updateExpiryAllocation(line.id, allocation.key, (current) => ({
                                              ...current,
                                              expiryDate: event.target.value,
                                            }))
                                          }
                                          size="small"
                                          fullWidth
                                          InputLabelProps={{ shrink: true }}
                                        />
                                        <TextField
                                          type="number"
                                          label="จำนวน *"
                                          value={allocation.quantity}
                                          onChange={(event) =>
                                            updateExpiryAllocation(line.id, allocation.key, (current) => ({
                                              ...current,
                                              quantity: event.target.value,
                                            }))
                                          }
                                          inputProps={{ min: 0, step: '0.01' }}
                                          size="small"
                                          fullWidth
                                          sx={{ '& input': { textAlign: 'right' } }}
                                        />
                                        <StockActionButton
                                          tone="danger"
                                          size="small"
                                          onClick={() => removeExpiryAllocation(line.id, allocation.key)}
                                          sx={{ minWidth: 76, alignSelf: { xs: 'stretch', md: 'center' } }}
                                        >
                                          ลบ
                                        </StockActionButton>
                                      </Stack>
                                    </Stack>
                                  </Box>
                                ))}
                                <StockActionButton
                                  tone="success"
                                  size="small"
                                  startIcon={<AddCircleOutlineRounded />}
                                  onClick={() => addExpiryAllocation(line.id)}
                                >
                                  เพิ่มวันหมดอายุ
                                </StockActionButton>
                              </Stack>
                            ) : (
                              <Typography variant="body2" color="text.secondary">-</Typography>
                            )}
                          </TableCell>
                          <TableCell sx={{ minWidth: 320 }}>
                            {hasAllocations ? (
                              <Stack spacing={0.85}>
                                {(editableLine?.allocations ?? []).map((allocation, index) => (
                                  <Box
                                    key={allocation.key}
                                    sx={{
                                      p: 1,
                                      border: '1px solid',
                                      borderColor: theme.palette.divider,
                                      borderRadius: 10,
                                      bgcolor: theme.palette.background.paper,
                                    }}
                                  >
                                    <Stack spacing={0.75}>
                                      <Typography variant="caption" color="text.secondary" fontWeight={700}>
                                        ไซโลที่ {index + 1}
                                      </Typography>
                                      <TextField
                                        select
                                        size="small"
                                        label="เลือกไซโล"
                                        value={allocation.feedSiloId}
                                        onChange={(event) =>
                                          updateAllocation(line.id, allocation.key, (current) => ({
                                            ...current,
                                            feedSiloId: event.target.value === '' ? '' : Number(event.target.value),
                                          }))
                                        }
                                        SelectProps={{
                                          renderValue: (selected) => {
                                            if (selected === '' || selected == null) {
                                              return 'เลือกไซโล';
                                            }
                                            const silo = feedSiloOptions.find((option) => option.id === Number(selected));
                                            return silo ? getFeedSiloDisplayLabel(silo.name, silo.code) : 'เลือกไซโล';
                                          },
                                        }}
                                        fullWidth
                                      >
                                        <MenuItem value="">เลือกไซโล</MenuItem>
                                        {feedSiloOptions.map((silo) => {
                                          const compatibility = getFeedSiloCompatibility(warehouseBalances, silo.id, {
                                            itemId: line.itemId,
                                            pigItemId: line.pigItemId,
                                            lotNumber: editableLine?.lotNumber ?? line.lotNumber ?? '',
                                          });

                                          return (
                                            <MenuItem key={silo.id} value={silo.id} disabled={!compatibility.compatible}>
                                              <Stack spacing={0.25} sx={{ py: 0.25, whiteSpace: 'normal', maxWidth: '100%' }}>
                                                <Typography variant="body2" fontWeight={700} lineHeight={1.25}>
                                                  {getFeedSiloDisplayLabel(silo.name, silo.code)}
                                                </Typography>
                                                <Typography variant="caption" color="text.secondary" lineHeight={1.3}>
                                                  คงเหลือ {formatNumber(silo.currentQuantityKg)} / {formatNumber(silo.capacityKg)} กก.
                                                </Typography>
                                                {compatibility.reason ? (
                                                  <Typography
                                                    variant="caption"
                                                    color={compatibility.compatible ? 'success.main' : 'error.main'}
                                                    lineHeight={1.25}
                                                  >
                                                    {compatibility.reason}
                                                  </Typography>
                                                ) : null}
                                              </Stack>
                                            </MenuItem>
                                          );
                                        })}
                                      </TextField>
                                      <TextField
                                        size="small"
                                        label="จำนวนลงไซโล"
                                        value={allocation.quantity}
                                        onChange={(event) =>
                                          updateAllocation(line.id, allocation.key, (current) => ({
                                            ...current,
                                            quantity: event.target.value,
                                          }))
                                        }
                                        fullWidth
                                      />
                                      <StockActionButton
                                        tone="danger"
                                        size="small"
                                        startIcon={<DeleteOutlineRounded />}
                                        onClick={() => removeAllocation(line.id, allocation.key)}
                                        fullWidth
                                      >
                                        ลบ
                                      </StockActionButton>
                                    </Stack>
                                  </Box>
                                ))}
                                <StockActionButton
                                  tone="success"
                                  size="small"
                                  startIcon={<AddCircleOutlineRounded />}
                                  onClick={() => addAllocation(line.id)}
                                  sx={{ alignSelf: 'flex-start' }}
                                >
                                  เพิ่มไซโล
                                </StockActionButton>
                              </Stack>
                            ) : '-'}
                          </TableCell>
                          <TableCell sx={{ minWidth: 120, textAlign: 'center' }}>
                            <TextField
                              value={editableLine?.unitCost ?? ''}
                              onChange={(event) =>
                                updateLine(line.id, (current) => ({ ...current, unitCost: event.target.value }))
                              }
                              size="small"
                              fullWidth
                            />
                          </TableCell>
                          <TableCell sx={{ minWidth: 150 }}>
                            <TextField
                              value={editableLine?.remarks ?? ''}
                              onChange={(event) =>
                                updateLine(line.id, (current) => ({ ...current, remarks: event.target.value }))
                              }
                              size="small"
                              fullWidth
                            />
                          </TableCell>
                          <TableCell sx={{ whiteSpace: 'nowrap', textAlign: 'center' }}>{line.status}</TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          </Stack>
        ) : null}
      </DialogContent>
      <DialogActions sx={getStockDialogActionsSx(theme)}>
        <StockActionButton tone="neutral" onClick={onClose} disabled={saving || finalizing}>ปิด</StockActionButton>
        <StockActionButton tone="info" onClick={() => void handleSave()} disabled={!data || saving || finalizing}>
          บันทึก
        </StockActionButton>
        <StockActionButton
          tone="primary"
          onClick={() => void handleFinalize()}
          disabled={!data || saving || finalizing || !canFinalize}
        >
          รับเข้าคลัง
        </StockActionButton>
      </DialogActions>
    </Dialog>
  );
}
