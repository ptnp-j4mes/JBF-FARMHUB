'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Dialog,
  DialogActions,
  DialogContent,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { AddCircleOutlineRounded, DeleteOutlineRounded } from '@mui/icons-material';
import { AxiosError } from 'axios';
import Swal from 'sweetalert2';
import dayjs from '@/lib/dayjs';
import { authService } from '@/features/auth/services/auth.service';
import { formatUserDisplayName } from '@/lib/user-display';
import { stockService } from '../services/stock.service';
import type { FeedSiloOption, ReceivablePurchaseRequestRow, StockBalanceResponse, WarehouseResponse } from '../types';
import { formatNumber } from '@/lib/utils/format.util';
import DialogTitleWithClose from '@/design-system/components/atoms/DialogTitleWithClose/DialogTitleWithClose';
import { formatCodeNameLabel, getFeedSiloDisplayLabel, naturalTextCompare } from '../utils/location-display.util';
import { getFeedSiloCompatibility } from '../utils/feed-silo-compatibility.util';
import {
  parseStockNumber,
  validateReceiveDraft,
  validateNonNegativeStockNumber,
  validatePositiveStockNumber,
} from '../utils/stock-validation';
import {
  STOCK_DIALOG_LEGEND_SX,
  getStockDialogActionsSx,
  getStockDialogErrorAlertSx,
  getStockDialogFieldsetSx,
  getStockDialogFormSx,
  getStockDialogInfoAlertSx,
  getStockDialogPaperSx,
} from './stock-dialog.constants';
import { StockActionButton } from './StockActionButton';

type ReceiveLineState = {
  purchaseRequestLineId: number;
  itemId?: number | null;
  pigItemId?: number | null;
  itemCategoryCode?: string;
  itemCategoryName?: string;
  itemCode: string;
  itemName: string;
  itemLotPolicyId?: number | null;
  itemLotPolicyName?: string;
  isLotRequired?: boolean;
  isExpiryRequired?: boolean;
  lotStrategy?: string;
  uomId: number;
  uomName: string;
  receiveQuantity: number;
  remainingQuantity: number;
  toWarehouseId: number;
  lotNumber: string;
  unitCost: string;
  actualUnitPrice?: number | null;
  remarks: string;
  allocations: ReceiveAllocationState[];
  expiryAllocations: ReceiveExpiryAllocationState[];
};

type ReceiveAllocationState = {
  key: string;
  targetPhase: string;
  targetHouseId: number;
  feedSiloId: number | '';
  quantity: string;
};

type ReceiveExpiryAllocationState = {
  key: string;
  expiryDate: string;
  quantity: string;
};

type FeedHouseOption = {
  id: number;
  facilityNodeId: number;
  zoneName: string;
  houseCode: string;
  houseName: string;
};

function parseUnitCost(value: string): number | null {
  return parseStockNumber(value);
}

function parseOptionalAmount(value: string): number | null {
  return parseStockNumber(value);
}

function createEmptyAllocation(quantity = ''): ReceiveAllocationState {
  return {
    key: crypto.randomUUID(),
    targetPhase: '',
    targetHouseId: 0,
    feedSiloId: '',
    quantity,
  };
}

function createEmptyExpiryAllocation(quantity = ''): ReceiveExpiryAllocationState {
  return {
    key: crypto.randomUUID(),
    expiryDate: '',
    quantity,
  };
}

function isPigLine(requestType?: string, pigItemId?: number | null): boolean {
  return requestType?.toLowerCase() === 'pig' || Boolean(pigItemId && pigItemId > 0);
}

function isFeedLine(itemCategoryCode?: string): boolean {
  return (itemCategoryCode ?? '').trim() === '05';
}

function requiresFeedSiloManagement(
  itemCategoryCode?: string,
  itemCode?: string,
  requestType?: string,
  pigItemId?: number | null,
): boolean {
  if (isPigLine(requestType, pigItemId ?? undefined)) {
    return false;
  }

  return isFeedLine(itemCategoryCode) && (itemCode ?? '').trim().toUpperCase().startsWith('SEMI-');
}

function isMedicineOrVaccineCategory(itemCategoryCode?: string, itemCategoryName?: string): boolean {
  const normalizedCode = (itemCategoryCode ?? '').trim();
  const normalizedName = (itemCategoryName ?? '').trim();
  return normalizedCode === '01' || normalizedCode === '11' || normalizedName.includes('ยา') || normalizedName.includes('วัคซีน');
}

function lineRequiresLot(line: ReceiveLineState, requestType?: string): boolean {
  if (isPigLine(requestType, line.pigItemId)) return false;
  if (typeof line.isLotRequired === 'boolean') return line.isLotRequired;
  return true;
}

function lineRequiresExpiry(line: ReceiveLineState): boolean {
  if (typeof line.isExpiryRequired === 'boolean') return line.isExpiryRequired;
  return isMedicineOrVaccineCategory(line.itemCategoryCode, line.itemCategoryName);
}

type ReceivePurchaseRequestDialogProps = {
  open: boolean;
  purchaseRequest: ReceivablePurchaseRequestRow | null;
  warehouses: WarehouseResponse[];
  onClose: () => void;
  onSubmitted: () => Promise<void> | void;
};

function toLocalInputValue(date = dayjs()): string {
  return date.format('YYYY-MM-DDTHH:mm');
}

function toIso(value: string): string {
  const date = dayjs(value);
  return date.isValid() ? date.toISOString() : dayjs().toISOString();
}

function toDateIso(value: string): string | undefined {
  const date = dayjs(value, 'YYYY-MM-DD');
  return date.isValid() ? date.startOf('day').toISOString() : undefined;
}

function resolveMinExpiryDate(allocations: ReceiveExpiryAllocationState[]): string | undefined {
  const candidates = allocations
    .map((allocation) => allocation.expiryDate)
    .filter((value) => value.trim());

  if (candidates.length === 0) return undefined;

  return candidates.reduce((min, value) =>
    dayjs(value).isBefore(dayjs(min)) ? value : min,
  );
}

function buildReceiveRemarks(remarks: string): string {
  return remarks.trim();
}

function getHouseZoneName(house: FeedHouseOption): string {
  return (house.zoneName ?? '').trim();
}

function buildHouseOptionsFromSilos(silos: FeedSiloOption[], facilityId?: number | null): FeedHouseOption[] {
  const scopedSilos = typeof facilityId === 'number' && facilityId > 0
    ? silos.filter((silo) => silo.facilityNodeId === facilityId)
    : silos;
  const grouped = new Map<number, FeedHouseOption>();
  scopedSilos.forEach((silo) => {
    if (!grouped.has(silo.houseId)) {
      grouped.set(silo.houseId, {
        id: silo.houseId,
        facilityNodeId: silo.facilityNodeId,
        zoneName: (silo.phaseZone ?? '').trim(),
        houseCode: silo.houseCode,
        houseName: silo.houseName,
      });
    }
  });
  return Array.from(grouped.values());
}

function formatWarehouseLabel(warehouse: WarehouseResponse): string {
  const code = warehouse.code?.trim() ?? '';
  const name = warehouse.name?.trim() ?? '';

  if (!code) return name;
  if (!name) return code;

  return name.startsWith(code) ? name : `${code} - ${name}`;
}

export function ReceivePurchaseRequestDialog({
  open,
  purchaseRequest,
  warehouses,
  onClose,
  onSubmitted,
}: ReceivePurchaseRequestDialogProps) {
  const theme = useTheme();
  const currentUser = authService.getUser();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [transactionDate, setTransactionDate] = useState(toLocalInputValue());
  const [remarks, setRemarks] = useState('');
  const [freightCost, setFreightCost] = useState('');
  const [lines, setLines] = useState<ReceiveLineState[]>([]);
  const [feedSiloOptions, setFeedSiloOptions] = useState<FeedSiloOption[]>([]);
  const [feedSiloBalancesByWarehouse, setFeedSiloBalancesByWarehouse] = useState<Record<number, StockBalanceResponse[]>>({});

  const defaultWarehouseId = purchaseRequest?.destinationWarehouseId ?? warehouses[0]?.id ?? 0;
  const isDestinationLocked = Boolean(purchaseRequest?.destinationWarehouseId);
  const receiverName = useMemo(() => {
    return formatUserDisplayName(currentUser);
  }, [currentUser]);

  useEffect(() => {
    if (!open || !purchaseRequest) return;

    setSaving(false);
    setError(null);
    setTransactionDate(toLocalInputValue());
    setRemarks('');
    setFreightCost('');
    setLines(
      purchaseRequest.lines.map((line) => {
        const requiresExpiry = typeof line.isExpiryRequired === 'boolean'
          ? line.isExpiryRequired
          : isMedicineOrVaccineCategory(line.itemCategoryCode ?? '', line.itemCategoryName ?? '');

        return {
          purchaseRequestLineId: line.purchaseRequestLineId,
          itemId: line.itemId,
          pigItemId: line.pigItemId ?? null,
          itemCategoryCode: line.itemCategoryCode ?? '',
          itemCategoryName: line.itemCategoryName ?? '',
          itemCode: line.itemCode,
          itemName: line.itemName,
          itemLotPolicyId: line.itemLotPolicyId ?? null,
          itemLotPolicyName: line.itemLotPolicyName ?? '',
          isLotRequired: line.isLotRequired,
          isExpiryRequired: line.isExpiryRequired,
          lotStrategy: line.lotStrategy ?? '',
          uomId: line.uomId,
          uomName: line.uomName,
          receiveQuantity: Math.floor(line.remainingQuantity),
          remainingQuantity: line.remainingQuantity,
          toWarehouseId: defaultWarehouseId,
          lotNumber: '',
          unitCost:
            line.actualUnitPrice != null && Number(line.actualUnitPrice) > 0
              ? String(line.actualUnitPrice)
              : '',
          actualUnitPrice: line.actualUnitPrice ?? null,
          remarks: line.remarks ?? '',
          allocations: requiresFeedSiloManagement(
            line.itemCategoryCode ?? '',
            line.itemCode,
            purchaseRequest?.requestType,
            line.pigItemId,
          )
            ? [createEmptyAllocation(String(Math.floor(line.remainingQuantity)))]
            : [],
          expiryAllocations: requiresExpiry
            ? [createEmptyExpiryAllocation(String(Math.floor(line.remainingQuantity)))]
            : [],
        };
      }),
    );
  }, [defaultWarehouseId, open, purchaseRequest]);

  useEffect(() => {
    if (!open || !purchaseRequest?.facilityId) {
      setFeedSiloOptions([]);
      return;
    }

    let active = true;
    void (async () => {
      try {
        const silos = await stockService.getFeedSiloOptions({ facilityId: purchaseRequest.facilityId });

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
  }, [open, purchaseRequest?.facilityId]);

  const feedWarehouseIds = useMemo(() => {
    return Array.from(
      new Set(
        lines
          .filter((line) => requiresFeedSiloManagement(line.itemCategoryCode, line.itemCode, purchaseRequest?.requestType, line.pigItemId))
          .map((line) => line.toWarehouseId)
          .filter((warehouseId): warehouseId is number => warehouseId > 0),
      ),
    ).sort((left, right) => left - right);
  }, [lines]);

  const feedWarehouseIdsKey = feedWarehouseIds.join(',');

  useEffect(() => {
    if (!open || !purchaseRequest || feedWarehouseIds.length === 0) {
      setFeedSiloBalancesByWarehouse({});
      return;
    }

    let active = true;
    void (async () => {
      try {
        const entries = await Promise.all(
          feedWarehouseIds.map(async (warehouseId) => {
            const balances = await stockService.getStockBalanceByWarehouse(warehouseId);
            return [warehouseId, balances] as const;
          }),
        );

        if (!active) return;
        setFeedSiloBalancesByWarehouse(Object.fromEntries(entries));
      } catch {
        if (!active) return;
        setFeedSiloBalancesByWarehouse({});
      }
    })();

    return () => {
      active = false;
    };
  }, [feedWarehouseIdsKey, open, purchaseRequest]);

  const activeLines = useMemo(
    () => lines.filter((line) => line.receiveQuantity > 0),
    [lines],
  );

  const updateLine = (
    purchaseRequestLineId: number,
    updater: (current: ReceiveLineState) => ReceiveLineState,
  ) => {
    setLines((current) =>
      current.map((line) =>
        line.purchaseRequestLineId === purchaseRequestLineId ? updater(line) : line,
      ),
    );
  };

  const updateAllocation = (
    purchaseRequestLineId: number,
    key: string,
    updater: (current: ReceiveAllocationState) => ReceiveAllocationState,
  ) => {
    updateLine(purchaseRequestLineId, (current) => ({
      ...current,
      allocations: current.allocations.map((allocation) =>
        allocation.key === key ? updater(allocation) : allocation,
      ),
    }));
  };

  const addAllocation = (purchaseRequestLineId: number) => {
    updateLine(purchaseRequestLineId, (current) => ({
      ...current,
      allocations: [...current.allocations, createEmptyAllocation('')],
    }));
  };

  const removeAllocation = (purchaseRequestLineId: number, key: string) => {
    updateLine(purchaseRequestLineId, (current) => ({
      ...current,
      allocations:
        current.allocations.length <= 1
          ? [createEmptyAllocation('')]
          : current.allocations.filter((allocation) => allocation.key !== key),
    }));
  };

  const applyFeedSiloSelection = (feedSiloId: number | '') => {
    if (feedSiloId === '') {
      return {
        feedSiloId: '',
        targetHouseId: 0,
        targetPhase: '',
      };
    }

    const selectedSilo = feedSiloOptions.find((silo) => silo.id === feedSiloId);
    return {
      feedSiloId,
      targetHouseId: selectedSilo?.houseId ?? 0,
      targetPhase: (selectedSilo?.phaseZone ?? '').trim(),
    };
  };

  const updateExpiryAllocation = (
    purchaseRequestLineId: number,
    key: string,
    updater: (current: ReceiveExpiryAllocationState) => ReceiveExpiryAllocationState,
  ) => {
    updateLine(purchaseRequestLineId, (current) => ({
      ...current,
      expiryAllocations: current.expiryAllocations.map((allocation) =>
        allocation.key === key ? updater(allocation) : allocation,
      ),
    }));
  };

  const addExpiryAllocation = (purchaseRequestLineId: number) => {
    updateLine(purchaseRequestLineId, (current) => ({
      ...current,
      expiryAllocations: [...current.expiryAllocations, createEmptyExpiryAllocation('')],
    }));
  };

  const removeExpiryAllocation = (purchaseRequestLineId: number, key: string) => {
    updateLine(purchaseRequestLineId, (current) => ({
      ...current,
      expiryAllocations:
        current.expiryAllocations.length <= 1
          ? [createEmptyExpiryAllocation('')]
          : current.expiryAllocations.filter((allocation) => allocation.key !== key),
    }));
  };

  const validate = (): string | null => {
    const baseValidation = validateReceiveDraft({
      purchaseRequestExists: Boolean(purchaseRequest),
      activeLineCount: activeLines.length,
      freightCost,
      lines: activeLines.map((line) => ({
        itemName: line.itemName,
        toWarehouseId: line.toWarehouseId,
        receiveQuantity: line.receiveQuantity,
        remainingQuantity: line.remainingQuantity,
        lotNumber: line.lotNumber,
        lineRequiresLot: lineRequiresLot(line, purchaseRequest?.requestType),
        lineRequiresExpiry: lineRequiresExpiry(line),
        expiryAllocations: line.expiryAllocations.map((allocation) => ({
          expiryDate: allocation.expiryDate,
          quantity: allocation.quantity,
        })),
        requiresFeedSiloManagement: requiresFeedSiloManagement(
          line.itemCategoryCode,
          line.itemCode,
          purchaseRequest?.requestType,
          line.pigItemId,
        ),
        allocations: line.allocations.map((allocation) => ({
          targetHouseId: allocation.targetHouseId,
          feedSiloId: allocation.feedSiloId,
          quantity: allocation.quantity,
        })),
        unitCost: line.unitCost,
        isPigRequest: purchaseRequest?.requestType?.toLowerCase() === 'pig',
      })),
    });
    if (!baseValidation.isValid) {
      return baseValidation.firstError;
    }

    const requestedAllocationBySilo = new Map<number, number>();

    for (const line of activeLines) {
      if (requiresFeedSiloManagement(line.itemCategoryCode, line.itemCode, purchaseRequest?.requestType, line.pigItemId)) {
        const allocationSum = line.allocations.reduce((sum, allocation) => {
          if (!allocation.feedSiloId || line.lotNumber.trim() === '') {
            return sum;
          }

          const allocationQty = parseOptionalAmount(allocation.quantity) ?? 0;
          const siloId = Number(allocation.feedSiloId);
          requestedAllocationBySilo.set(
            siloId,
            (requestedAllocationBySilo.get(siloId) ?? 0) + allocationQty,
          );
          return sum + allocationQty;
        }, 0);

        const lineBalances = feedSiloBalancesByWarehouse[line.toWarehouseId] ?? [];
        for (const allocation of line.allocations) {
          if (!allocation.feedSiloId || line.lotNumber.trim() === '') {
            continue;
          }

          const compatibility = getFeedSiloCompatibility(lineBalances, Number(allocation.feedSiloId), {
            itemId: line.itemId,
            pigItemId: line.pigItemId,
            lotNumber: line.lotNumber,
          });

          if (!compatibility.compatible) {
            return `ไซโล ${getFeedSiloDisplayLabel(
              feedSiloOptions.find((option) => option.id === Number(allocation.feedSiloId))?.name,
              feedSiloOptions.find((option) => option.id === Number(allocation.feedSiloId))?.code,
            )} ${compatibility.reason ?? 'ไม่สามารถใช้กับ item/lot นี้ได้'}`;
          }
        }

        if (allocationSum !== line.receiveQuantity) {
          return `จำนวนรวมที่จัดสรรไซโลของ ${line.itemName} ต้องเท่ากับจำนวนรับ`;
        }
      }
    }

    for (const [feedSiloId, requestedQuantity] of requestedAllocationBySilo.entries()) {
      const silo = feedSiloOptions.find((option) => option.id === feedSiloId);
      if (!silo) continue;

      const availableCapacity = Math.max(0, silo.capacityKg - silo.currentQuantityKg);
      if (requestedQuantity > availableCapacity) {
        return `ไซโล ${getFeedSiloDisplayLabel(silo.name, silo.code)} ความจุไม่พอ คงเหลือได้อีก ${formatNumber(availableCapacity)} กก.`;
      }
    }

    return null;
  };

  const submitValidation = useMemo(
    () =>
      validateReceiveDraft({
        purchaseRequestExists: Boolean(purchaseRequest),
        activeLineCount: activeLines.length,
        freightCost,
        lines: activeLines.map((line) => ({
          itemName: line.itemName,
          toWarehouseId: line.toWarehouseId,
          receiveQuantity: line.receiveQuantity,
          remainingQuantity: line.remainingQuantity,
          lotNumber: line.lotNumber,
          lineRequiresLot: lineRequiresLot(line, purchaseRequest?.requestType),
          lineRequiresExpiry: lineRequiresExpiry(line),
          expiryAllocations: line.expiryAllocations.map((allocation) => ({
            expiryDate: allocation.expiryDate,
            quantity: allocation.quantity,
          })),
          requiresFeedSiloManagement: requiresFeedSiloManagement(
            line.itemCategoryCode,
            line.itemCode,
            purchaseRequest?.requestType,
            line.pigItemId,
          ),
          allocations: line.allocations.map((allocation) => ({
            targetHouseId: allocation.targetHouseId,
            feedSiloId: allocation.feedSiloId,
            quantity: allocation.quantity,
          })),
          unitCost: line.unitCost,
          isPigRequest: purchaseRequest?.requestType?.toLowerCase() === 'pig',
        })),
      }),
    [activeLines, freightCost, purchaseRequest],
  );

  const submit = async () => {
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    if (!purchaseRequest) return;

    try {
      setSaving(true);
      setError(null);

      const createdReceiveRequest = await stockService.createStockReceiveRequest(
        {
          requestDate: toIso(transactionDate),
          purchaseRequestId: purchaseRequest.id,
          facilityId: purchaseRequest.facilityId,
          warehouseId: activeLines[0]?.toWarehouseId ?? defaultWarehouseId,
          receiverName,
          referenceDetail: '',
          freightCost: parseOptionalAmount(freightCost) ?? undefined,
          remarks: buildReceiveRemarks(remarks),
          lines: activeLines.map((line) => {
            const isPig = isPigLine(purchaseRequest.requestType, line.pigItemId);
            const unitCost = parseUnitCost(line.unitCost);
            const expiryAllocations = isPig
              ? []
              : line.expiryAllocations
                  .filter((allocation) => allocation.expiryDate.trim())
                  .map((allocation) => ({
                    expiryDate: toDateIso(allocation.expiryDate) ?? '',
                    quantity: parseOptionalAmount(allocation.quantity) ?? 0,
                  }));
            const minExpiry = isPig ? undefined : resolveMinExpiryDate(line.expiryAllocations);

            return {
              purchaseRequestLineId: line.purchaseRequestLineId,
              itemId: isPig ? undefined : line.itemId ?? undefined,
              pigItemId: isPig ? line.pigItemId ?? undefined : undefined,
              lotNumber: isPig ? '' : (line.lotNumber || ''),
              expiryDate: isPig ? undefined : (minExpiry ? toDateIso(minExpiry) : undefined),
              expiryAllocations,
              receiveQuantity: line.receiveQuantity,
              uomId: line.uomId,
              unitCost: unitCost ?? undefined,
              remarks: line.remarks,
              allocations: requiresFeedSiloManagement(
                line.itemCategoryCode,
                line.itemCode,
                purchaseRequest?.requestType,
                line.pigItemId,
              )
                ? line.allocations
                    .filter((allocation) => allocation.feedSiloId !== '')
                    .map((allocation) => ({
                      feedSiloId: Number(allocation.feedSiloId),
                      quantity: parseOptionalAmount(allocation.quantity) ?? 0,
                    }))
                : [],
            };
          }),
        },
        crypto.randomUUID(),
      );

      const isPigRequest = purchaseRequest.requestType?.toLowerCase() === 'pig';
      if (isPigRequest) {
        await stockService.finalizeStockReceiveRequest(createdReceiveRequest.id);
        await Swal.fire({
          icon: 'success',
          title: 'รับเข้าหมูสำเร็จ',
          timer: 1200,
          showConfirmButton: false,
        });
      }

      await onSubmitted();
      onClose();
    } catch (err) {
      const axiosError = err as AxiosError<{ message?: string }>;
      setError(
        axiosError.response?.data?.message ??
          (purchaseRequest.requestType?.toLowerCase() === 'pig'
            ? 'ไม่สามารถรับเข้าหมูได้'
            : 'ไม่สามารถสร้างใบรับสินค้าได้'),
      );
    } finally {
      setSaving(false);
    }
  };

    return (
    <Dialog open={open} onClose={saving ? undefined : onClose} fullWidth maxWidth="md" PaperProps={{ sx: getStockDialogPaperSx(theme) }}>
      <DialogTitleWithClose onClose={onClose} disabled={saving} variant="master">
        สร้างใบรับสินค้าจาก {purchaseRequest?.documentNumber ?? ''}
      </DialogTitleWithClose>
      <DialogContent dividers sx={getStockDialogFormSx(theme)}>
        <Stack spacing={2}>
          {purchaseRequest && (
            <Typography variant="body2" color="text.secondary">
              {purchaseRequest.facilityName} • ผู้ขอ {purchaseRequest.requestorName}
            </Typography>
          )}

          {error && <Alert severity="error" sx={getStockDialogErrorAlertSx(theme)}>{error}</Alert>}

          <Box component="fieldset" sx={getStockDialogFieldsetSx(theme)}>
            <Typography component="legend" sx={STOCK_DIALOG_LEGEND_SX}>
              ข้อมูลใบรับสินค้า
            </Typography>
            <TextField
              type="datetime-local"
              label="วันที่รับสินค้า"
              value={transactionDate}
              onChange={(event) => setTransactionDate(event.target.value)}
              InputLabelProps={{ shrink: true }}
              disabled={saving}
            />

            <TextField
              label="ผู้รับสินค้า"
              value={receiverName}
              InputProps={{ readOnly: true }}
              disabled={saving}
            />

            <TextField
              label="ค่าขนส่ง"
              value={freightCost}
              onChange={(event) => setFreightCost(event.target.value)}
              disabled={saving}
              placeholder="กรอกหรือไม่กรอกก็ได้"
            />
          </Box>

          {lines.map((line) => (
            <Box
              component="fieldset"
              key={line.purchaseRequestLineId}
              sx={getStockDialogFieldsetSx(theme)}
            >
              {(() => {
                const facilityHouses = buildHouseOptionsFromSilos(feedSiloOptions, purchaseRequest?.facilityId);
                const phaseOptions = Array.from(
                  new Set(facilityHouses.map((house) => getHouseZoneName(house)).filter(Boolean)),
                ).sort(naturalTextCompare);
                const lineBalances = feedSiloBalancesByWarehouse[line.toWarehouseId] ?? [];
                const totalAllocated = line.allocations.reduce(
                  (sum, allocation) => sum + (parseOptionalAmount(allocation.quantity) ?? 0),
                  0,
                );
                const remainingToAllocate = line.receiveQuantity - totalAllocated;
                return (
                  <>
              <Typography component="legend" sx={STOCK_DIALOG_LEGEND_SX}>
                {line.itemCode} - {line.itemName}
              </Typography>
              <Stack spacing={1.2}>
                <Typography variant="caption" color="text.secondary">
                  คงค้าง {formatNumber(line.remainingQuantity)} {line.uomName}
                </Typography>
                {(parseUnitCost(line.unitCost) ?? 0) <= 0 ? (
                  <Alert severity="warning" sx={{ ...getStockDialogErrorAlertSx(theme), bgcolor: '#fff6e3', borderColor: '#eed7a3', color: '#6e5718' }}>
                    รายการนี้ยังไม่มีราคาจริงในระบบ ระบบจะบันทึกเป็นใบรับสินค้ารอรับเข้าคลังไว้ก่อน แล้วค่อยเติมราคาในขั้นถัดไป
                  </Alert>
                ) : null}
                {lineRequiresExpiry(line) ? (
                  <Alert severity="info" sx={getStockDialogInfoAlertSx(theme)}>
                    รายการนี้ต้องระบุวันหมดอายุตอนรับสินค้า{line.itemLotPolicyName ? ` ตามนโยบาย ${line.itemLotPolicyName}` : ''}
                  </Alert>
                ) : null}
                <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.2}>
                  <TextField
                    type="number"
                    label="จำนวนรับ"
                    required
                    value={line.receiveQuantity}
                    onChange={(event) => {
                      const rawValue = event.target.value.trim();
                      if (rawValue === '') {
                        updateLine(line.purchaseRequestLineId, (current) => ({
                          ...current,
                          receiveQuantity: 0,
                        }));
                        return;
                      }

                      if (!/^\d+$/.test(rawValue)) return;

                      const nextQuantity = Number.parseInt(rawValue, 10);
                      updateLine(line.purchaseRequestLineId, (current) => ({
                        ...current,
                        receiveQuantity: Math.min(
                          nextQuantity,
                          Math.max(0, Math.floor(current.remainingQuantity)),
                        ),
                      }));
                    }}
                    inputProps={{
                      min: 0,
                      step: '1',
                      max: Math.max(0, Math.floor(line.remainingQuantity)),
                    }}
                    disabled={saving}
                    fullWidth
                    sx={{ '& input': { textAlign: 'right' } }}
                  />
                  <TextField
                    select
                    label="คลังปลายทาง"
                    value={line.toWarehouseId}
                    onChange={(event) =>
                      updateLine(line.purchaseRequestLineId, (current) => ({
                        ...current,
                        toWarehouseId: Number(event.target.value),
                      }))
                    }
                    disabled={saving || isDestinationLocked}
                    fullWidth
                  >
                    {warehouses.map((warehouse) => (
                      <MenuItem key={warehouse.id} value={warehouse.id}>
                        {formatWarehouseLabel(warehouse)}
                      </MenuItem>
                    ))}
                  </TextField>
                </Stack>
                {isDestinationLocked && purchaseRequest?.destinationWarehouseName ? (
                  <Typography variant="caption" color="text.secondary">
                    ปลายทางของใบรับสินค้าถูกกำหนดจากใบ PR เป็น {purchaseRequest.destinationWarehouseName}
                  </Typography>
                ) : null}
                <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.2}>
                  <TextField
                    label="ต้นทุนต่อหน่วย"
                    value={line.unitCost}
                    onChange={(event) =>
                      updateLine(line.purchaseRequestLineId, (current) => ({
                        ...current,
                        unitCost: event.target.value,
                      }))
                    }
                    disabled={saving}
                    fullWidth
                    placeholder="กรอกราคาต่อหน่วย"
                    sx={{ '& input': { textAlign: 'right' } }}
                  />
                  {isPigLine(purchaseRequest?.requestType, line.pigItemId) ? (
                    <TextField
                      size="small"
                      label="Lot Number"
                      value="ระบบสร้างอัตโนมัติสำหรับหมู"
                      InputProps={{ readOnly: true }}
                      disabled
                      fullWidth
                    />
                  ) : (
                    <TextField
                      size="small"
                      label="Lot Number"
                      required
                      value={line.lotNumber}
                      onChange={(event) =>
                        updateLine(line.purchaseRequestLineId, (current) => ({
                          ...current,
                          lotNumber: event.target.value,
                        }))
                      }
                      disabled={saving}
                      fullWidth
                    />
                  )}
                  {!isPigLine(purchaseRequest?.requestType, line.pigItemId) && lineRequiresExpiry(line) ? (
                    <Box
                      sx={{
                        mt: 0.5,
                        p: 1.25,
                        border: '1px dashed',
                        borderColor: theme.palette.divider,
                        borderRadius: 10,
                        bgcolor: '#f8f7ff',
                      }}
                    >
                      <Stack spacing={1.2}>
                        <Stack direction="row" justifyContent="space-between" alignItems="center">
                          <Typography variant="subtitle2" fontWeight={800}>
                            วันหมดอายุ
                          </Typography>
                          <StockActionButton
                            tone="success"
                            size="small"
                            startIcon={<AddCircleOutlineRounded />}
                            onClick={() => addExpiryAllocation(line.purchaseRequestLineId)}
                            disabled={saving}
                          >
                            เพิ่มวันหมดอายุ
                          </StockActionButton>
                        </Stack>

                        {line.expiryAllocations.map((allocation, index) => (
                          <Box
                            key={allocation.key}
                            sx={{
                              p: 1.1,
                              border: '1px solid',
                              borderColor: theme.palette.divider,
                              borderRadius: 10,
                              bgcolor: theme.palette.background.paper,
                            }}
                          >
                            <Stack spacing={1}>
                              <Typography variant="caption" color="text.secondary" fontWeight={700}>
                                ชุดวันหมดอายุที่ {index + 1}
                              </Typography>
                              <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.2}>
                                <TextField
                                  type="date"
                                  label="วันหมดอายุ"
                                  required
                                  value={allocation.expiryDate}
                                  onChange={(event) =>
                                    updateExpiryAllocation(line.purchaseRequestLineId, allocation.key, (current) => ({
                                      ...current,
                                      expiryDate: event.target.value,
                                    }))
                                  }
                                  InputLabelProps={{ shrink: true }}
                                  disabled={saving}
                                  fullWidth
                                />
                                <TextField
                                  type="number"
                                  label="จำนวน"
                                  required
                                  value={allocation.quantity}
                                  onChange={(event) =>
                                    updateExpiryAllocation(line.purchaseRequestLineId, allocation.key, (current) => ({
                                      ...current,
                                      quantity: event.target.value,
                                    }))
                                  }
                                  inputProps={{ min: 0, step: '0.01' }}
                                  disabled={saving}
                                  fullWidth
                                  sx={{ '& input': { textAlign: 'right' } }}
                                />
                                <StockActionButton
                                  tone="danger"
                                  size="small"
                                  onClick={() => removeExpiryAllocation(line.purchaseRequestLineId, allocation.key)}
                                  disabled={saving}
                                  sx={{ minWidth: 96, alignSelf: { xs: 'stretch', md: 'center' } }}
                                >
                                  ลบ
                                </StockActionButton>
                              </Stack>
                            </Stack>
                          </Box>
                        ))}
                      </Stack>
                    </Box>
                  ) : null}
                </Stack>
                {requiresFeedSiloManagement(
                  line.itemCategoryCode,
                  line.itemCode,
                  purchaseRequest?.requestType,
                  line.pigItemId,
                ) ? (
                  <Box
                    sx={{
                      mt: 0.5,
                      p: 1.25,
                      border: '1px dashed',
                      borderColor: theme.palette.divider,
                      borderRadius: 10,
                      bgcolor: '#f4f8f5',
                    }}
                  >
                    <Stack spacing={1.2}>
                      <Stack direction="row" justifyContent="space-between" alignItems="center">
                        <Typography variant="subtitle2" fontWeight={800}>
                          จัดสรรไซโล
                        </Typography>
                        <StockActionButton
                          tone="success"
                          size="small"
                          startIcon={<AddCircleOutlineRounded />}
                          onClick={() => addAllocation(line.purchaseRequestLineId)}
                          disabled={saving}
                        >
                          เพิ่มไซโล
                        </StockActionButton>
                      </Stack>

                      {line.allocations.map((allocation, index) => {
                        const houseOptions = facilityHouses
                          .filter((house) => !allocation.targetPhase || getHouseZoneName(house) === allocation.targetPhase)
                          .sort((left, right) => {
                            const codeCompare = naturalTextCompare(left.houseCode, right.houseCode);
                            return codeCompare !== 0 ? codeCompare : naturalTextCompare(left.houseName, right.houseName);
                          });
                        const siloOptions = feedSiloOptions
                          .filter((silo) => !allocation.targetHouseId || silo.houseId === allocation.targetHouseId)
                          .sort((left, right) =>
                            naturalTextCompare(getFeedSiloDisplayLabel(left.name, left.code), getFeedSiloDisplayLabel(right.name, right.code)));

                        return (
                          <Box
                            key={allocation.key}
                            sx={{
                              p: 0.85,
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
                              <Box
                                sx={{
                                  display: 'grid',
                                  gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
                                  gap: 0.75,
                                  alignItems: 'stretch',
                                }}
                              >
                                <TextField
                                  select
                                  size="small"
                                  label="โซน/เฟส"
                                  required={false}
                                  value={allocation.targetPhase}
                                  onChange={(event) =>
                                    updateAllocation(line.purchaseRequestLineId, allocation.key, (current) => ({
                                      ...current,
                                      targetPhase: event.target.value,
                                      targetHouseId: 0,
                                      feedSiloId: '',
                                    }))
                                  }
                                  disabled={saving || phaseOptions.length === 0}
                                  helperText={phaseOptions.length === 0 ? 'โรงเรือนชุดนี้ไม่มีการแบ่งโซน/เฟส' : undefined}
                                  fullWidth
                                  >
                                  <MenuItem value="">ทุกโซน/เฟส</MenuItem>
                                  {phaseOptions.map((phase) => (
                                    <MenuItem key={phase} value={phase}>
                                      {phase}
                                    </MenuItem>
                                  ))}
                                </TextField>
                                <TextField
                                  select
                                  size="small"
                                  label="โรงเรือน"
                                  required
                                  value={allocation.targetHouseId}
                                  onChange={(event) =>
                                    updateAllocation(line.purchaseRequestLineId, allocation.key, (current) => ({
                                      ...current,
                                      targetHouseId: Number(event.target.value),
                                      feedSiloId: '',
                                    }))
                                  }
                                  disabled={saving || houseOptions.length === 0}
                                  helperText={houseOptions.length === 0 ? 'ไม่พบโรงเรือนที่ใช้งานได้' : undefined}
                                  SelectProps={{
                                    displayEmpty: true,
                                    renderValue: (selected) => {
                                      if (selected === '' || selected == null || Number(selected) <= 0) {
                                        return 'เลือกโรงเรือน';
                                      }
                                      const house = houseOptions.find((option) => option.id === Number(selected));
                                      return house ? formatCodeNameLabel(house.houseCode, house.houseName) : 'เลือกโรงเรือน';
                                    },
                                  }}
                                  fullWidth
                                >
                                  <MenuItem value="">เลือกโรงเรือน</MenuItem>
                                  {houseOptions.map((house) => (
                                    <MenuItem key={house.id} value={house.id}>
                                      {formatCodeNameLabel(house.houseCode, house.houseName)}
                                    </MenuItem>
                                  ))}
                                </TextField>
                              </Box>

                              <Box
                                sx={{
                                  display: 'grid',
                                  gridTemplateColumns: { xs: '1fr', md: '1.25fr 0.95fr 88px' },
                                  gap: 0.75,
                                  alignItems: 'start',
                                }}
                              >
                                <TextField
                                  select
                                  size="small"
                                  label="ไซโล"
                                  required
                                  value={allocation.feedSiloId}
                                  onChange={(event) =>
                                    updateAllocation(line.purchaseRequestLineId, allocation.key, (current) => ({
                                      ...current,
                                      ...applyFeedSiloSelection(event.target.value === '' ? '' : Number(event.target.value)),
                                    }))
                                  }
                                  disabled={saving || siloOptions.length === 0}
                                  helperText={siloOptions.length === 0 ? 'ไม่พบไซโลของโรงเรือนที่เลือก' : undefined}
                                  SelectProps={{
                                    renderValue: (selected) => {
                                      if (selected === '' || selected == null) {
                                        return 'เลือกไซโล';
                                      }
                                      const silo = siloOptions.find((option) => option.id === Number(selected));
                                      return silo ? getFeedSiloDisplayLabel(silo.name, silo.code) : 'เลือกไซโล';
                                    },
                                  }}
                                  fullWidth
                                >
                                  <MenuItem value="">เลือกไซโล</MenuItem>
                                  {siloOptions.map((silo) => {
                                    const compatibility = getFeedSiloCompatibility(lineBalances, silo.id, {
                                      itemId: line.itemId,
                                      pigItemId: line.pigItemId,
                                      lotNumber: line.lotNumber,
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
                                  required
                                  value={allocation.quantity}
                                  onChange={(event) =>
                                    updateAllocation(line.purchaseRequestLineId, allocation.key, (current) => ({
                                      ...current,
                                      quantity: event.target.value,
                                    }))
                                  }
                                  disabled={saving}
                                  fullWidth
                                />
                                <StockActionButton
                                  tone="danger"
                                  size="small"
                                  startIcon={<DeleteOutlineRounded />}
                                  onClick={() => removeAllocation(line.purchaseRequestLineId, allocation.key)}
                                  disabled={saving}
                                  sx={{
                                    minWidth: { xs: '100%', md: 88 },
                                    alignSelf: 'center',
                                  }}
                                >
                                  ลบ
                                </StockActionButton>
                              </Box>
                            </Stack>
                          </Box>
                        );
                      })}

                      <Typography variant="caption" color={remainingToAllocate === 0 ? 'success.main' : 'warning.main'}>
                        จัดสรรแล้ว {formatNumber(totalAllocated)} / {formatNumber(line.receiveQuantity)} {line.uomName}
                        {remainingToAllocate !== 0 ? ` • คงเหลือต้องจัดสรรอีก ${formatNumber(remainingToAllocate)} ${line.uomName}` : ''}
                      </Typography>
                    </Stack>
                  </Box>
                ) : null}
              </Stack>
                  </>
                );
              })()}
            </Box>
          ))}

          <TextField
            label="หมายเหตุ"
            value={remarks}
            onChange={(event) => setRemarks(event.target.value)}
            disabled={saving}
            multiline
            minRows={2}
          />
        </Stack>
      </DialogContent>
      <DialogActions sx={getStockDialogActionsSx(theme)}>
        <StockActionButton
          tone="primary"
          onClick={submit}
          disabled={saving || !purchaseRequest || !submitValidation.isValid}
        >
          บันทึกใบรับสินค้า
        </StockActionButton>
      </DialogActions>
    </Dialog>
  );
}
