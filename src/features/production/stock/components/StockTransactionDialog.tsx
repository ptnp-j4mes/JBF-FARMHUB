'use client';

import { useCallback, useEffect, useMemo, useState, type ReactElement } from 'react';
import {
  Alert,
  Box,
  Dialog,
  DialogActions,
  DialogContent,
  IconButton,
  MenuItem,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { Add as AddIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { AxiosError } from 'axios';
import Swal from 'sweetalert2';
import dayjs from '@/lib/dayjs';
import axiosInstance from '@/lib/axios';
import DialogTitleWithClose from '@/design-system/components/atoms/DialogTitleWithClose/DialogTitleWithClose';
import { stockAdjustmentRequestService } from '../services/stock-adjustment-request.service';
import { stockService } from '../services/stock.service';
import type {
  CreateStockAdjustmentRequestPayload,
  FeedSiloOption,
  IssueUsageTargetType,
  ItemOption,
  StockBalanceLayerResponse,
  StockBalanceResponse,
  UomOption,
  WarehouseResponse,
  WarehouseTransactionMode,
} from '../types';
import { authService } from '@/features/auth/services/auth.service';
import { formatUserDisplayName } from '@/lib/user-display';
import { getUserFarmScopeNodes } from '@/lib/facility-context';
import { formatNumber } from '@/lib/utils/format.util';
import { formatCodeNameLabel, getFeedSiloDisplayLabel, naturalTextCompare } from '../utils/location-display.util';
import { getFeedSiloCompatibility } from '../utils/feed-silo-compatibility.util';
import { isCentralWarehouse } from '../utils/warehouse-scope.util';
import {
  isPositiveStockNumber,
  validateAdjustDraft,
  validatePositiveStockNumber,
  validateIssueDraft,
  validateTransferDraft,
} from '../utils/stock-validation';
import {
  STOCK_DIALOG_LEGEND_SX,
  getStockDialogActionsSx,
  getStockDialogErrorAlertSx,
  getStockDialogFieldsetSx,
  getStockDialogFormSx,
  getStockDialogPaperSx,
  getStockDialogTableSx,
} from './stock-dialog.constants';
import { StockActionButton } from './StockActionButton';

type StockTransactionDialogProps = {
  open: boolean;
  mode: WarehouseTransactionMode | null;
  warehouses: WarehouseResponse[];
  allWarehouses?: WarehouseResponse[];
  defaultFromWarehouseId?: number;
  items: ItemOption[];
  uoms: UomOption[];
  onClose: () => void;
  onSubmitted: () => Promise<void> | void;
};

type AvailableLotOption = {
  stockLotId: number;
  lotNumber: string;
  quantity: number;
  expiryDate?: string | null;
  lotCreatedDate?: string | null;
  layers?: StockBalanceLayerResponse[];
};

type FacilityUsageOption = {
  facilityNodeId: number;
  facilityName: string;
};

type ProductionActivityHouseOption = {
  id: number;
  facilityNodeId: number;
  zoneName?: string | null;
  phaseZone?: string | null;
  houseCode: string;
  houseName: string;
};

type ProductionActivityOptionsResponse = {
  houses: ProductionActivityHouseOption[];
};

function getProductionHouseZoneName(house: ProductionActivityHouseOption): string {
  return (house.zoneName ?? house.phaseZone ?? '').trim();
}

function buildReceiveHouseOptionsFromSilos(silos: FeedSiloOption[], facilityNodeId: number): ProductionActivityHouseOption[] {
  const grouped = new Map<number, ProductionActivityHouseOption>();
  silos
    .filter((silo) => !facilityNodeId || silo.facilityNodeId === facilityNodeId)
    .forEach((silo) => {
      if (!grouped.has(silo.houseId)) {
        grouped.set(silo.houseId, {
          id: silo.houseId,
          facilityNodeId: silo.facilityNodeId,
          zoneName: (silo.phaseZone ?? '').trim(),
          phaseZone: (silo.phaseZone ?? '').trim(),
          houseCode: silo.houseCode,
          houseName: silo.houseName,
        });
      }
    });

  return Array.from(grouped.values());
}

function normalizeLotStrategy(strategy?: string | null): 'FIFO' | 'FEFO' | 'MANUAL' {
  const normalized = (strategy ?? '').trim().toUpperCase();
  if (normalized === 'FIFO' || normalized === 'FEFO') return normalized;
  return 'MANUAL';
}

function compareAvailableLotOptions(
  left: AvailableLotOption,
  right: AvailableLotOption,
  strategy: 'FIFO' | 'FEFO' | 'MANUAL',
): number {
  const leftExpiryValue = left.expiryDate ?? left.layers?.find((layer) => layer.expiryDate)?.expiryDate ?? null;
  const rightExpiryValue = right.expiryDate ?? right.layers?.find((layer) => layer.expiryDate)?.expiryDate ?? null;
  if (strategy === 'FEFO') {
    const leftExpiry = leftExpiryValue ? new Date(leftExpiryValue).getTime() : Number.POSITIVE_INFINITY;
    const rightExpiry = rightExpiryValue ? new Date(rightExpiryValue).getTime() : Number.POSITIVE_INFINITY;
    if (leftExpiry !== rightExpiry) return leftExpiry - rightExpiry;
  }

  if (strategy === 'FIFO') {
    const leftCreatedValue = left.lotCreatedDate ?? left.layers?.find((layer) => layer.receivedAt)?.receivedAt ?? null;
    const rightCreatedValue = right.lotCreatedDate ?? right.layers?.find((layer) => layer.receivedAt)?.receivedAt ?? null;
    const leftCreated = leftCreatedValue ? new Date(leftCreatedValue).getTime() : Number.POSITIVE_INFINITY;
    const rightCreated = rightCreatedValue ? new Date(rightCreatedValue).getTime() : Number.POSITIVE_INFINITY;
    if (leftCreated !== rightCreated) return leftCreated - rightCreated;
  }

  const lotCompare = naturalTextCompare(left.lotNumber, right.lotNumber);
  if (lotCompare !== 0) return lotCompare;
  return left.stockLotId - right.stockLotId;
}

function getAvailableLotExpiryLabel(lot: AvailableLotOption): string {
  const expiry = lot.expiryDate ?? lot.layers?.find((layer) => layer.expiryDate)?.expiryDate ?? null;
  if (!expiry) return '-';
  return new Date(expiry).toLocaleDateString('th-TH');
}

function getAvailableLotBatchLines(lot: AvailableLotOption): string[] {
  const layers = lot.layers && lot.layers.length > 0 ? lot.layers : [];
  if (layers.length === 0) {
    return [];
  }

  return layers.map((layer, index) => {
    const expiry = layer.expiryDate ? new Date(layer.expiryDate).toLocaleDateString('th-TH') : '-';
    return `หมดอายุ ${expiry} • คงเหลือ ${formatNumber(layer.remainingQuantity)}`;
  });
}

function renderAvailableLotMenuContent(lot: AvailableLotOption): ReactElement {
  const lines = getAvailableLotBatchLines(lot);
  const expiry = getAvailableLotExpiryLabel(lot);

  return (
    <Stack spacing={0.25} sx={{ py: 0.25, whiteSpace: 'normal', minWidth: 420, maxWidth: '100%' }}>
      <Typography variant="body2" fontWeight={700} lineHeight={1.3}>
        {lot.lotNumber}
      </Typography>
      <Typography variant="caption" color="text.secondary" lineHeight={1.35}>
        หมดอายุ {expiry} • คงเหลือ {formatNumber(lot.quantity)}
      </Typography>
      {lines.length > 0 && (
        <Stack spacing={0.1} sx={{ pl: 0, mt: 0.25 }}>
          {lines.map((line, index) => (
            <Typography key={`${lot.stockLotId}-layer-${index}`} variant="caption" color="text.secondary" lineHeight={1.35}>
              {line}
            </Typography>
          ))}
        </Stack>
      )}
    </Stack>
  );
}

function renderAvailableLotSelectedValue(
  lot: AvailableLotOption | undefined,
  placeholder = 'ไม่ระบุ',
): string {
  if (!lot) return placeholder;
  const expiry = getAvailableLotExpiryLabel(lot);
  return `${lot.lotNumber} • หมดอายุ ${expiry} • คงเหลือ ${formatNumber(lot.quantity)}`;
}

type IssueDraftLine = {
  itemId: number;
  uomId: number;
  fromWarehouseId: number;
  feedSiloId: number | '';
  quantity: number;
  stockLotId: number | '';
  lotNumber: string;
};

type TransferDraftLine = {
  itemId: number;
  uomId: number;
  fromWarehouseId: number;
  toWarehouseId: number;
  quantity: number;
  stockLotId: number | '';
  lotNumber: string;
};

const ISSUE_PURPOSE_LABEL = 'เบิกไปใช้งาน';
const ISSUE_USAGE_TARGET_OPTIONS: IssueUsageTargetType[] = [
  'Production',
  'Vaccine',
  'Maintenance',
];
function toLocalInputValue(date = dayjs()): string {
  return date.format('YYYY-MM-DDTHH:mm');
}

function toIso(value: string): string {
  const now = dayjs();
  const date = dayjs(value);
  if (!date.isValid()) return now.toISOString();

  const maxFuture = now.add(1, 'day');
  if (date.isAfter(maxFuture)) {
    return now.toISOString();
  }

  return date.toISOString();
}

function modeTitle(mode: WarehouseTransactionMode | null): string {
  switch (mode) {
    case 'receive':
      return 'รับสินค้าเข้าคลัง';
    case 'transfer':
      return 'โอนสินค้า';
    case 'issue':
      return 'เบิกสินค้า';
    case 'adjust':
      return 'ปรับยอดสินค้า';
    default:
      return 'ทำรายการคลังสินค้า';
  }
}

function modeSuccessText(mode: WarehouseTransactionMode | null): string {
  switch (mode) {
    case 'receive':
      return 'รับสินค้าเข้าคลังสำเร็จ';
    case 'transfer':
      return 'โอนสินค้าสำเร็จ';
    case 'issue':
      return 'ตัดสต๊อกสำเร็จ';
    case 'adjust':
      return 'ส่งคำขอปรับยอดสินค้าสำเร็จ';
    default:
      return 'บันทึกรายการสำเร็จ';
  }
}

function formatWarehouseLabel(warehouse: WarehouseResponse): string {
  const code = warehouse.code?.trim() ?? '';
  const name = warehouse.name?.trim() ?? '';

  if (!code) return name;
  if (!name) return code;

  return name.startsWith(code) ? name : `${code} - ${name}`;
}

function formatTransferWarehouseLabel(warehouse: WarehouseResponse): string {
  const prefix = isCentralWarehouse(warehouse) ? 'คลังกลาง' : 'คลังฟาร์ม';
  return `${prefix}: ${formatWarehouseLabel(warehouse)}`;
}

function isPigItemCode(itemCode?: string): boolean {
  const normalized = (itemCode ?? '').trim().toUpperCase();
  if (!normalized) return false;
  if (normalized === 'ITM-08-0001') return true;
  return /^ITM-(07|08|09)-/.test(normalized);
}

function isFeedItemCategory(itemCategoryId?: number | null): boolean {
  return Number(itemCategoryId) === 5;
}

function requiresFeedSiloManagement(itemCategoryId?: number | null, itemCode?: string | null): boolean {
  return isFeedItemCategory(itemCategoryId) && (itemCode ?? '').trim().toUpperCase().startsWith('SEMI-');
}

function requiresExpiryForReceive(itemCategoryId?: number | null, itemCategoryName?: string | null): boolean {
  const normalizedName = (itemCategoryName ?? '').trim();
  return Number(itemCategoryId) === 1 || Number(itemCategoryId) === 11 || normalizedName.includes('ยา') || normalizedName.includes('วัคซีน');
}

function createEmptyIssueLine(defaultWarehouseId = 0): IssueDraftLine {
  return {
    itemId: 0,
    uomId: 0,
    fromWarehouseId: defaultWarehouseId,
    feedSiloId: '',
    quantity: 1,
    stockLotId: '',
    lotNumber: '',
  };
}

function createEmptyTransferLine(defaultFromWarehouseId = 0, defaultToWarehouseId = 0): TransferDraftLine {
  return {
    itemId: 0,
    uomId: 0,
    fromWarehouseId: defaultFromWarehouseId,
    toWarehouseId: defaultToWarehouseId,
    quantity: 1,
    stockLotId: '',
    lotNumber: '',
  };
}

export function StockTransactionDialog({
  open,
  mode,
  warehouses,
  allWarehouses = [],
  defaultFromWarehouseId,
  items,
  uoms,
  onClose,
  onSubmitted,
}: StockTransactionDialogProps) {
  const theme = useTheme();
  const [currentUser] = useState(() => authService.getUser());
  const userFarmScopeIds = useMemo(
    () => new Set(getUserFarmScopeNodes(currentUser).map((node) => node.facilityNodeId)),
    [currentUser],
  );
  const currentUserDisplayName = useMemo(() => {
    return formatUserDisplayName(currentUser, '');
  }, [currentUser]);

  const facilityOptions = useMemo<FacilityUsageOption[]>(() => {
    const map = new Map<number, FacilityUsageOption>();

    for (const node of getUserFarmScopeNodes(currentUser)) {
      map.set(node.facilityNodeId, {
        facilityNodeId: node.facilityNodeId,
        facilityName: node.facilityName,
      });
    }

    for (const warehouse of warehouses) {
      if (warehouse.facilityNodeId == null || !warehouse.facilityNodeName) {
        continue;
      }

      if (!map.has(warehouse.facilityNodeId)) {
        map.set(warehouse.facilityNodeId, {
          facilityNodeId: warehouse.facilityNodeId,
          facilityName: warehouse.facilityNodeName,
        });
      }
    }

    return Array.from(map.values()).sort((a, b) => a.facilityName.localeCompare(b.facilityName));
  }, [currentUser, warehouses]);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [transactionDate, setTransactionDate] = useState(toLocalInputValue());
  const [remarks, setRemarks] = useState('');
  const [issueType, setIssueType] = useState(ISSUE_PURPOSE_LABEL);
  const [usageTargetType, setUsageTargetType] = useState<IssueUsageTargetType>('Production');
  const [requestedByName, setRequestedByName] = useState('');
  const [receivedByName, setReceivedByName] = useState('');
  const [targetFacilityNodeId, setTargetFacilityNodeId] = useState(0);
  const [targetZone, setTargetZone] = useState('');
  const [targetHouseId, setTargetHouseId] = useState(0);
  const [referenceDetail, setReferenceDetail] = useState('');
  const [receivePhase, setReceivePhase] = useState('');
  const [receiveHouseId, setReceiveHouseId] = useState(0);
  const [receiveFeedSiloId, setReceiveFeedSiloId] = useState<number | ''>('');
  const [itemId, setItemId] = useState(0);
  const [uomId, setUomId] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [newQuantity, setNewQuantity] = useState(0);
  const [fromWarehouseId, setFromWarehouseId] = useState(0);
  const [toWarehouseId, setToWarehouseId] = useState(0);
  const [warehouseId, setWarehouseId] = useState(0);
  const [stockLotId, setStockLotId] = useState<number | ''>('');
  const [lotNumber, setLotNumber] = useState('');
  const [supplierLotNumber, setSupplierLotNumber] = useState('');
  const [unitCost, setUnitCost] = useState(0);
  const [expiryDate, setExpiryDate] = useState('');
  const [reason, setReason] = useState('');
  const [availableLots, setAvailableLots] = useState<AvailableLotOption[]>([]);
  const [productionHouses, setProductionHouses] = useState<ProductionActivityHouseOption[]>([]);
  const [receiveFeedSiloOptions, setReceiveFeedSiloOptions] = useState<FeedSiloOption[]>([]);
  const [transferWarehouseOverrides, setTransferWarehouseOverrides] = useState<WarehouseResponse[]>([]);
  const [issueSourceBalances, setIssueSourceBalances] = useState<StockBalanceResponse[]>([]);
  const [transferSourceBalances, setTransferSourceBalances] = useState<StockBalanceResponse[]>([]);
  const [receiveSourceBalances, setReceiveSourceBalances] = useState<StockBalanceResponse[]>([]);
  const [issueDraftLine, setIssueDraftLine] = useState<IssueDraftLine>(() =>
    createEmptyIssueLine(warehouses[0]?.id ?? 0),
  );
  const [issueLines, setIssueLines] = useState<IssueDraftLine[]>([]);
  const [transferLines, setTransferLines] = useState<TransferDraftLine[]>([]);

  const transferWarehouses = useMemo(
    () =>
      (transferWarehouseOverrides.length > 0
        ? transferWarehouseOverrides
        : allWarehouses.length > 0
          ? allWarehouses
          : warehouses
      ).filter((warehouse) => {
        if (!warehouse.isActive) return false;
        if (isCentralWarehouse(warehouse)) return true;
        if (warehouse.facilityNodeId == null) return false;
        return userFarmScopeIds.has(warehouse.facilityNodeId);
      }),
    [allWarehouses, transferWarehouseOverrides, userFarmScopeIds, warehouses],
  );

  const selectedTransferSourceWarehouse = useMemo(
    () => transferWarehouses.find((warehouse) => warehouse.id === fromWarehouseId) ?? null,
    [fromWarehouseId, transferWarehouses],
  );

  const transferSourceWarehouses = useMemo(
    () => transferWarehouses,
    [transferWarehouses],
  );

  const resolveWarehouseById = useCallback(
    (warehouseId: number | null | undefined) =>
      (allWarehouses.length > 0 ? allWarehouses : warehouses).find((warehouse) => warehouse.id === warehouseId) ?? null,
    [allWarehouses, warehouses],
  );

  const selectedItem = useMemo(() => items.find((item) => item.id === itemId), [items, itemId]);
  const selectedIsPig = useMemo(() => isPigItemCode(selectedItem?.code), [selectedItem?.code]);
  const selectedReceiveRequiresFeedSilo = useMemo(
    () => requiresFeedSiloManagement(selectedItem?.itemCategoryId, selectedItem?.code),
    [selectedItem?.code, selectedItem?.itemCategoryId],
  );
  const selectedIssueDraftItem = useMemo(
    () => items.find((item) => item.id === issueDraftLine.itemId) ?? null,
    [items, issueDraftLine.itemId],
  );
  const selectedIssueDraftRequiresFeedSilo = useMemo(
    () => requiresFeedSiloManagement(selectedIssueDraftItem?.itemCategoryId, selectedIssueDraftItem?.code),
    [selectedIssueDraftItem?.code, selectedIssueDraftItem?.itemCategoryId],
  );
  const selectedReceiveRequiresExpiry = useMemo(
    () => requiresExpiryForReceive(selectedItem?.itemCategoryId, selectedItem?.itemCategoryName),
    [selectedItem?.itemCategoryId, selectedItem?.itemCategoryName],
  );

  const transferDestinationWarehouses = useMemo(() => {
    if (mode !== 'transfer') return warehouses;
    if (!selectedTransferSourceWarehouse) return [];

    if (selectedIsPig) {
      return transferWarehouses.filter(
        (warehouse) =>
          warehouse.id !== selectedTransferSourceWarehouse.id &&
          warehouse.warehouseType === 'Farm',
      );
    }

    if (isCentralWarehouse(selectedTransferSourceWarehouse)) {
      return transferWarehouses.filter(
        (warehouse) =>
          warehouse.id !== selectedTransferSourceWarehouse.id &&
          warehouse.warehouseType === 'Farm',
      );
    }

    return transferWarehouses.filter((warehouse) => warehouse.id !== selectedTransferSourceWarehouse.id);
  }, [mode, selectedIsPig, selectedTransferSourceWarehouse, transferWarehouses, warehouses]);

  const transferSelectableItems = useMemo(() => {
    if (mode !== 'transfer' || !fromWarehouseId) return items;

    const summaryMap = new Map<number, { quantity: number; uomName: string }>();
    for (const balance of transferSourceBalances) {
      if (Number(balance.quantity) <= 0 || balance.itemId == null) continue;
      const existing = summaryMap.get(balance.itemId);
      if (existing) {
        existing.quantity += Number(balance.quantity);
      } else {
        summaryMap.set(balance.itemId, {
          quantity: Number(balance.quantity),
          uomName: balance.uomName,
        });
      }
    }

    return items.filter((item) => summaryMap.has(item.id));
  }, [fromWarehouseId, items, mode, transferSourceBalances]);

  const transferItemSummaryMap = useMemo(() => {
    const map = new Map<number, { quantity: number; uomName: string }>();
    for (const balance of transferSourceBalances) {
      if (Number(balance.quantity) <= 0 || balance.itemId == null) continue;
      const existing = map.get(balance.itemId);
      if (existing) {
        existing.quantity += Number(balance.quantity);
      } else {
        map.set(balance.itemId, {
          quantity: Number(balance.quantity),
          uomName: balance.uomName,
        });
      }
    }
    return map;
  }, [transferSourceBalances]);

  const issueSelectableItems = useMemo(() => {
    if (mode !== 'issue' || !issueDraftLine.fromWarehouseId) return items;

    const availableItemIds = new Set(
      issueSourceBalances
        .filter((balance) => Number(balance.quantity) > 0 && balance.itemId != null)
        .map((balance) => balance.itemId as number),
    );

    return items.filter((item) => availableItemIds.has(item.id));
  }, [issueDraftLine.fromWarehouseId, issueSourceBalances, items, mode]);

  const issueItemSummaryMap = useMemo(() => {
    const map = new Map<number, { quantity: number; uomName: string }>();
    for (const balance of issueSourceBalances) {
      if (Number(balance.quantity) <= 0 || balance.itemId == null) continue;
      const existing = map.get(balance.itemId);
      if (existing) {
        existing.quantity += Number(balance.quantity);
      } else {
        map.set(balance.itemId, {
          quantity: Number(balance.quantity),
          uomName: balance.uomName,
        });
      }
    }
    return map;
  }, [issueSourceBalances]);

  const selectedIssueLotStrategy = useMemo(
    () =>
      normalizeLotStrategy(
        issueSourceBalances.find((balance) => balance.itemId === issueDraftLine.itemId)?.itemLotStrategy,
      ),
    [issueDraftLine.itemId, issueSourceBalances],
  );

  const issueFeedSiloOptions = useMemo<FeedSiloOption[]>(() => {
    if (mode !== 'issue' || !selectedIssueDraftRequiresFeedSilo || !issueDraftLine.fromWarehouseId || !issueDraftLine.itemId) {
      return [];
    }

    const map = new Map<number, FeedSiloOption>();
    for (const balance of issueSourceBalances) {
      if (
        balance.warehouseId !== issueDraftLine.fromWarehouseId ||
        balance.itemId !== issueDraftLine.itemId ||
        !balance.feedSiloId ||
        Number(balance.availableQuantity ?? balance.quantity ?? 0) <= 0
      ) {
        continue;
      }

      if (!map.has(balance.feedSiloId)) {
        map.set(balance.feedSiloId, {
          id: balance.feedSiloId,
          code: balance.feedSiloCode ?? '',
          name: balance.feedSiloName ?? '',
          description: '',
          capacityKg: 0,
          currentQuantityKg: 0,
          availableCapacityKg: 0,
          facilityNodeId: 0,
          facilityName: '',
          houseId: 0,
          houseCode: '',
          houseName: '',
          phaseZone: '',
        });
      }
    }

    return Array.from(map.values()).sort((left, right) =>
      naturalTextCompare(getFeedSiloDisplayLabel(left.name, left.code), getFeedSiloDisplayLabel(right.name, right.code)));
  }, [issueDraftLine.fromWarehouseId, issueDraftLine.itemId, issueSourceBalances, mode, selectedIssueDraftRequiresFeedSilo]);
  const issueSiloLabelMap = useMemo(() => {
    const map = new Map<number, string>();
    for (const balance of issueSourceBalances) {
      if (!balance.feedSiloId) continue;
      const label = getFeedSiloDisplayLabel(balance.feedSiloName, balance.feedSiloCode);
      if (!map.has(balance.feedSiloId)) {
        map.set(balance.feedSiloId, label || String(balance.feedSiloId));
      }
    }
    return map;
  }, [issueSourceBalances]);
  const quantityStep = '1';

  const selectedLotAvailableQuantity = useMemo(() => {
    if (stockLotId === '') return null;
    const lot = availableLots.find((row) => row.stockLotId === stockLotId);
    return lot ? Number(lot.quantity) : null;
  }, [availableLots, stockLotId]);

  const issueDraftMaxQuantity = useMemo(() => {
    if (issueDraftLine.stockLotId === '') return null;
    const lot = availableLots.find((row) => row.stockLotId === issueDraftLine.stockLotId);
    return lot ? Number(lot.quantity) : null;
  }, [availableLots, issueDraftLine.stockLotId]);

  const transferDraftMaxQuantity = useMemo(() => {
    if (stockLotId === '') return null;
    const lot = availableLots.find((row) => row.stockLotId === stockLotId);
    return lot ? Number(lot.quantity) : null;
  }, [availableLots, stockLotId]);

  const quantityMaxForSource = useMemo(() => {
    if (!(mode === 'transfer' || mode === 'issue')) return null;
    if (mode === 'issue') return issueDraftMaxQuantity;
    if (mode === 'transfer') return transferDraftMaxQuantity;
    if (selectedLotAvailableQuantity != null) return selectedLotAvailableQuantity;
    return null;
  }, [issueDraftMaxQuantity, mode, selectedLotAvailableQuantity, transferDraftMaxQuantity]);
  const selectedReceiveWarehouse = useMemo(
    () => warehouses.find((warehouse) => warehouse.id === toWarehouseId) ?? null,
    [toWarehouseId, warehouses],
  );
  const receiveFacilityNodeId = selectedReceiveWarehouse?.facilityNodeId ?? 0;
  const receiveFacilityHouses = useMemo(
    () =>
      selectedReceiveRequiresFeedSilo
        ? buildReceiveHouseOptionsFromSilos(receiveFeedSiloOptions, receiveFacilityNodeId)
        : productionHouses.filter((house) => house.facilityNodeId === receiveFacilityNodeId),
    [productionHouses, receiveFacilityNodeId, receiveFeedSiloOptions, selectedReceiveRequiresFeedSilo],
  );
  const receivePhaseOptions = useMemo(
    () =>
      Array.from(
        new Set(
          receiveFacilityHouses
            .map((house) => getProductionHouseZoneName(house))
            .filter(Boolean),
        ),
      ).sort(naturalTextCompare),
    [receiveFacilityHouses],
  );
  const receiveHouseOptions = useMemo(
    () =>
      receiveFacilityHouses
        .filter((house) => !receivePhase || getProductionHouseZoneName(house) === receivePhase)
        .sort((left, right) => {
          const codeCompare = naturalTextCompare(left.houseCode, right.houseCode);
          return codeCompare !== 0 ? codeCompare : naturalTextCompare(left.houseName, right.houseName);
        }),
    [receiveFacilityHouses, receivePhase],
  );

  const facilityHouses = useMemo(
    () => productionHouses.filter((house) => house.facilityNodeId === targetFacilityNodeId),
    [productionHouses, targetFacilityNodeId],
  );

  const zoneOptions = useMemo(
    () =>
      Array.from(
        new Set(
          facilityHouses
            .map((house) => (house.zoneName ?? '').trim())
            .filter(Boolean),
        ),
      ).sort(naturalTextCompare),
    [facilityHouses],
  );

  const houseOptions = useMemo(
    () =>
      facilityHouses
        .filter((house) => !targetZone || (house.zoneName ?? '').trim() === targetZone)
        .sort((left, right) => {
          const codeCompare = naturalTextCompare(left.houseCode, right.houseCode);
          return codeCompare !== 0 ? codeCompare : naturalTextCompare(left.houseName, right.houseName);
        }),
    [facilityHouses, targetZone],
  );

  const selectedHouse = useMemo(
    () => houseOptions.find((house) => house.id === targetHouseId) ?? null,
    [houseOptions, targetHouseId],
  );

  const handleQuantityChange = (rawValue: string) => {
    const normalized = rawValue.trim();
    if (normalized === '') {
      setQuantity(0);
      return;
    }

    if (!/^\d+(\.\d{0,4})?$/.test(normalized)) {
      return;
    }

    setQuantity(Number.parseFloat(normalized));
  };

  const updateIssueDraftLine = (patch: Partial<IssueDraftLine>) => {
    setIssueDraftLine((current) => {
      const next = { ...current, ...patch };
      if (Object.prototype.hasOwnProperty.call(patch, 'itemId')) {
        const selected = items.find((item) => item.id === Number(next.itemId));
        if (selected) {
          next.uomId = selected.baseUomId || next.uomId || uoms[0]?.id || 0;
        }
        next.feedSiloId = '';
        next.stockLotId = '';
        next.lotNumber = '';
      }
      if (Object.prototype.hasOwnProperty.call(patch, 'fromWarehouseId')) {
        next.feedSiloId = '';
        next.stockLotId = '';
        next.lotNumber = '';
      }
      if (Object.prototype.hasOwnProperty.call(patch, 'feedSiloId')) {
        next.stockLotId = '';
        next.lotNumber = '';
      }
      return next;
    });
  };

  useEffect(() => {
    if (!open) return;
    const candidateWarehouses = (allWarehouses.length > 0 ? allWarehouses : warehouses).filter((warehouse) => warehouse.isActive);
    const initialWarehouseId =
      defaultFromWarehouseId && candidateWarehouses.some((warehouse) => warehouse.id === defaultFromWarehouseId)
        ? defaultFromWarehouseId
        : warehouses[0]?.id ?? 0;
    setError(null);
    setSaving(false);
    setTransactionDate(toLocalInputValue());
    setRemarks('');
    setIssueType(ISSUE_PURPOSE_LABEL);
    setUsageTargetType('Production');
    setRequestedByName('');
    setReceivedByName(currentUserDisplayName);
    setTargetFacilityNodeId(facilityOptions[0]?.facilityNodeId ?? 0);
    setTargetZone('');
    setTargetHouseId(0);
    setReferenceDetail('');
    setReceivePhase('');
    setReceiveHouseId(0);
    setReceiveFeedSiloId('');
    setItemId(items[0]?.id ?? 0);
    setUomId(items[0]?.baseUomId ?? uoms[0]?.id ?? 0);
    setQuantity(1);
    setNewQuantity(0);
    setFromWarehouseId(initialWarehouseId);
    setToWarehouseId(initialWarehouseId);
    setWarehouseId(initialWarehouseId);
    setStockLotId('');
    setLotNumber('');
    setSupplierLotNumber('');
    setUnitCost(0);
    setExpiryDate('');
    setReason('');
    setAvailableLots([]);
    setTransferWarehouseOverrides([]);
    setReceiveFeedSiloOptions([]);
    setIssueDraftLine(createEmptyIssueLine(initialWarehouseId));
    setIssueLines([]);
    setTransferLines([]);
  }, [open, items, uoms, warehouses, allWarehouses, defaultFromWarehouseId, currentUserDisplayName, facilityOptions]);

  useEffect(() => {
    if (!open || mode !== 'issue' || !issueDraftLine.fromWarehouseId) {
      setIssueSourceBalances([]);
      return;
    }

    let active = true;
    void (async () => {
      try {
        const isCentral = isCentralWarehouse(resolveWarehouseById(issueDraftLine.fromWarehouseId));
        const response = await stockService.getStockBalances(issueDraftLine.fromWarehouseId, undefined, undefined, isCentral);
        if (!active) return;
        setIssueSourceBalances(response.items.filter((row) => Number(row.quantity) > 0));
      } catch {
        if (!active) return;
        setIssueSourceBalances([]);
      }
    })();

    return () => {
      active = false;
    };
  }, [issueDraftLine.fromWarehouseId, mode, open]);

  useEffect(() => {
    if (!open || mode !== 'issue') return;
    if (issueSelectableItems.length === 0) return;

    if (!issueSelectableItems.some((item) => item.id === issueDraftLine.itemId)) {
      const nextItem = issueSelectableItems[0];
      updateIssueDraftLine({
        itemId: nextItem.id,
        uomId: nextItem.baseUomId || uoms[0]?.id || 0,
        stockLotId: '',
        lotNumber: '',
      });
    }
  }, [issueDraftLine.itemId, issueSelectableItems, mode, open, uoms]);

  useEffect(() => {
    if (!open || mode !== 'issue' || !selectedIssueDraftRequiresFeedSilo) return;
    if (issueFeedSiloOptions.length !== 1) return;
    if (issueDraftLine.feedSiloId) return;

    updateIssueDraftLine({ feedSiloId: issueFeedSiloOptions[0].id });
  }, [issueDraftLine.feedSiloId, issueFeedSiloOptions, mode, open, selectedIssueDraftRequiresFeedSilo]);

  useEffect(() => {
    if (!open || mode !== 'transfer') return;

    let active = true;
    void (async () => {
      try {
        const visibleWarehouses = await stockService.getWarehouses(undefined, undefined, true);
        if (!active) return;
        const merged = visibleWarehouses.filter((warehouse, index, array) =>
          warehouse.isActive && array.findIndex((candidate) => candidate.id === warehouse.id) === index,
        );
        setTransferWarehouseOverrides(merged);
      } catch {
        if (!active) return;
        setTransferWarehouseOverrides([]);
      }
    })();

    return () => {
      active = false;
    };
  }, [mode, open]);

  useEffect(() => {
    if (!open || mode !== 'transfer' || !fromWarehouseId) {
      setTransferSourceBalances([]);
      return;
    }

    let active = true;
    void (async () => {
      try {
        const isCentral = isCentralWarehouse(resolveWarehouseById(fromWarehouseId));
        const response = await stockService.getStockBalances(fromWarehouseId, undefined, undefined, isCentral);
        if (!active) return;
        setTransferSourceBalances(response.items.filter((row) => Number(row.quantity) > 0));
      } catch {
        if (!active) return;
        setTransferSourceBalances([]);
      }
    })();

    return () => {
      active = false;
    };
  }, [fromWarehouseId, mode, open]);

  useEffect(() => {
    if (!open || mode !== 'transfer') return;
    if (transferSourceWarehouses.length === 0) return;

    if (!transferSourceWarehouses.some((warehouse) => warehouse.id === fromWarehouseId)) {
      setFromWarehouseId(transferSourceWarehouses[0].id);
      return;
    }

    if (!transferDestinationWarehouses.some((warehouse) => warehouse.id === toWarehouseId)) {
      setToWarehouseId(transferDestinationWarehouses[0]?.id ?? 0);
    }
  }, [fromWarehouseId, mode, open, toWarehouseId, transferDestinationWarehouses, transferSourceWarehouses]);

  useEffect(() => {
    if (!open || mode !== 'transfer') return;
    if (transferSelectableItems.length === 0) return;

    if (!transferSelectableItems.some((item) => item.id === itemId)) {
      const nextItem = transferSelectableItems[0];
      setItemId(nextItem.id);
      setUomId(nextItem.baseUomId || uoms[0]?.id || 0);
    }
  }, [itemId, mode, open, transferSelectableItems, uoms]);

  useEffect(() => {
    if (!selectedItem) return;
    setUomId(selectedItem.baseUomId || uoms[0]?.id || 0);
    setUnitCost(Number(selectedItem.cost ?? 0));
  }, [selectedItem, uoms]);

  useEffect(() => {
    if (mode !== 'receive') return;
    if (!selectedReceiveRequiresFeedSilo) {
      setReceivePhase('');
      setReceiveHouseId(0);
      setReceiveFeedSiloId('');
      setReceiveFeedSiloOptions([]);
    }
  }, [mode, selectedReceiveRequiresFeedSilo]);

  useEffect(() => {
    if (!open || mode !== 'issue') return;

    let active = true;
    void (async () => {
      try {
        const response = await axiosInstance.get<ProductionActivityOptionsResponse>('/api/ProductionActivities/options', {
          params: {
            facilityId: targetFacilityNodeId || undefined,
          },
        });
        if (!active) return;
        setProductionHouses(response.data.houses ?? []);
      } catch {
        if (!active) return;
        setProductionHouses([]);
      }
    })();

    return () => {
      active = false;
    };
  }, [mode, open, targetFacilityNodeId]);

  useEffect(() => {
    if (!open || mode !== 'receive' || !selectedReceiveRequiresFeedSilo || !receiveFacilityNodeId) {
      setProductionHouses((current) => (mode === 'issue' ? current : []));
      setReceiveFeedSiloOptions([]);
      return;
    }

    let active = true;
    void (async () => {
      try {
        const silos = await stockService.getFeedSiloOptions({ facilityId: receiveFacilityNodeId });
        if (!active) return;
        setReceiveFeedSiloOptions(silos ?? []);
      } catch {
        if (!active) return;
        setReceiveFeedSiloOptions([]);
      }
    })();

    return () => {
      active = false;
    };
  }, [mode, open, receiveFacilityNodeId, selectedReceiveRequiresFeedSilo]);

  useEffect(() => {
    if (mode !== 'issue') return;
    if (targetZone && !zoneOptions.includes(targetZone)) {
      setTargetZone('');
    }
  }, [mode, zoneOptions, targetZone]);

  useEffect(() => {
    if (mode !== 'receive') return;
    if (receivePhase && !receivePhaseOptions.includes(receivePhase)) {
      setReceivePhase('');
    }
  }, [mode, receivePhase, receivePhaseOptions]);

  useEffect(() => {
    if (mode !== 'issue') return;
    if (targetHouseId && !houseOptions.some((house) => house.id === targetHouseId)) {
      setTargetHouseId(0);
    }
  }, [houseOptions, mode, targetHouseId]);

  useEffect(() => {
    if (mode !== 'receive') return;
    if (receiveHouseId && !receiveHouseOptions.some((house) => house.id === receiveHouseId)) {
      setReceiveHouseId(0);
      setReceiveFeedSiloId('');
    }
  }, [mode, receiveHouseId, receiveHouseOptions]);

  useEffect(() => {
    if (mode !== 'receive' || !selectedReceiveRequiresFeedSilo) return;
    const siloOptions = receiveFeedSiloOptions.filter((silo) => !receiveHouseId || silo.houseId === receiveHouseId);
    if (receiveFeedSiloId && !siloOptions.some((silo) => silo.id === receiveFeedSiloId)) {
      setReceiveFeedSiloId('');
      return;
    }
    if (!receiveFeedSiloId && siloOptions.length === 1) {
      setReceiveFeedSiloId(siloOptions[0].id);
    }
  }, [mode, receiveFeedSiloId, receiveFeedSiloOptions, receiveHouseId, selectedReceiveRequiresFeedSilo]);

  useEffect(() => {
    if (!open || mode !== 'receive' || !selectedReceiveRequiresFeedSilo || !toWarehouseId) {
      setReceiveSourceBalances([]);
      return;
    }

    let active = true;
    void (async () => {
      try {
        const balances = await stockService.getStockBalanceByWarehouse(toWarehouseId);
        if (!active) return;
        setReceiveSourceBalances(balances);
      } catch {
        if (!active) return;
        setReceiveSourceBalances([]);
      }
    })();

    return () => {
      active = false;
    };
  }, [mode, open, selectedReceiveRequiresFeedSilo, toWarehouseId]);

  useEffect(() => {
    if (!open) return;
    if (!(mode === 'transfer' || mode === 'issue')) return;

    const activeWarehouseId = mode === 'issue' ? issueDraftLine.fromWarehouseId : fromWarehouseId;
    const activeItemId = mode === 'issue' ? issueDraftLine.itemId : itemId;
    const activeFeedSiloId = mode === 'issue' ? issueDraftLine.feedSiloId : '';
    if (!activeWarehouseId || !activeItemId) {
      setAvailableLots([]);
      return;
    }

    let active = true;
    void (async () => {
      try {
        const isCentral = isCentralWarehouse(resolveWarehouseById(activeWarehouseId));
        const balances = await stockService.getStockBalances(activeWarehouseId, activeItemId, undefined, isCentral);
        if (!active) return;
        const isFeedIssueFlow = mode === 'issue' && selectedIssueDraftRequiresFeedSilo;
        const strategy = normalizeLotStrategy(
          balances.items.find((row) => row.itemId === activeItemId)?.itemLotStrategy,
        );
        const lots = balances.items
          .filter((row) => {
            if (!(row.stockLotId && Number(row.quantity) > 0)) return false;
            if (!isFeedIssueFlow) return true;
            if (activeFeedSiloId === '') return false;
            return row.feedSiloId === activeFeedSiloId;
          })
          .map((row) => ({
            stockLotId: Number(row.stockLotId),
            lotNumber: row.lotNumber || `LOT-${row.stockLotId}`,
            quantity: Number(row.availableQuantity ?? row.quantity ?? 0),
            expiryDate: row.expiryDate ?? null,
            lotCreatedDate: row.lotCreatedDate ?? null,
            layers: row.layers ?? [],
          }))
          .sort((left, right) => compareAvailableLotOptions(left, right, strategy));

        setAvailableLots(lots);
        if (mode === 'issue') {
          setIssueDraftLine((current) => {
            const existing = current.stockLotId !== ''
              ? lots.find((lot) => lot.stockLotId === current.stockLotId)
              : null;
            if (existing) {
              return { ...current, lotNumber: existing.lotNumber };
            }
            if (lots.length === 0) {
              return { ...current, stockLotId: '', lotNumber: '' };
            }
            return {
              ...current,
              stockLotId: lots[0].stockLotId,
              lotNumber: lots[0].lotNumber,
            };
          });
        } else if (!stockLotId && lots.length > 0) {
          setStockLotId(lots[0].stockLotId);
        }
      } catch {
        if (!active) return;
        setAvailableLots([]);
      }
    })();

    return () => {
      active = false;
    };
  }, [fromWarehouseId, issueDraftLine.feedSiloId, issueDraftLine.fromWarehouseId, issueDraftLine.itemId, itemId, mode, open, selectedIssueDraftRequiresFeedSilo, stockLotId]);

  const validate = (): string | null => {
    if (!mode) return 'ไม่พบประเภทรายการ';

    if (mode === 'issue') {
      if (!requestedByName.trim()) return 'กรุณาระบุผู้ขอ';
      if (!receivedByName.trim()) return 'กรุณาระบุผู้รับ';
      if (!usageTargetType.trim()) return 'กรุณาเลือกปลายทางการใช้';
      if (!targetFacilityNodeId) return 'กรุณาเลือกฟาร์มที่ใช้งาน';
      if (houseOptions.length > 0 && !targetHouseId) return 'กรุณาเลือกโรงเรือน';

      const issueValidation = validateIssueDraft({
        facilityId: targetFacilityNodeId,
        issuePurpose: issueType,
        usageTargetType,
        usageZone: targetZone || undefined,
        usageHouseId: targetHouseId || undefined,
        lines: issueLines.map((line, index) => ({
          itemName: items.find((item) => item.id === line.itemId)?.name ?? `รายการที่ ${index + 1}`,
          itemId: line.itemId,
          warehouseId: line.fromWarehouseId,
          feedSiloId: line.feedSiloId,
          stockLotId: line.stockLotId,
          quantity: line.quantity,
        })),
      });

      if (!issueValidation.isValid) return issueValidation.firstError;
      return null;
    }

    if (mode === 'transfer') {
      const transferValidation = validateTransferDraft({
        mode: 'transfer',
        lines: transferLines.map((line) => ({
          itemId: line.itemId,
          uomId: line.uomId,
          fromWarehouseId: line.fromWarehouseId,
          toWarehouseId: line.toWarehouseId,
          quantity: line.quantity,
          stockLotId: line.stockLotId,
        })),
      });

      return transferValidation.firstError;
    }

    if (!itemId) return 'กรุณาเลือกสินค้า';
    if (!uomId) return 'กรุณาเลือกหน่วยนับ';

    if (mode === 'receive') {
      if (!toWarehouseId) return 'กรุณาเลือกคลังปลายทาง';
      if (selectedReceiveRequiresFeedSilo) {
        if (!receiveHouseId) return 'กรุณาเลือกโรงเรือนสำหรับอาหาร';
        if (!receiveFeedSiloId) return 'กรุณาเลือกไซโลสำหรับอาหาร';
        if (!selectedIsPig && lotNumber.trim()) {
          const compatibility = getFeedSiloCompatibility(receiveSourceBalances, Number(receiveFeedSiloId), {
            itemId,
            lotNumber,
          });
          if (!compatibility.compatible) {
            return compatibility.reason ?? 'ไซโลนี้ไม่สามารถใช้กับ item/lot นี้ได้';
          }
        }
      }
      const quantityError = validatePositiveStockNumber(quantity, 'จำนวน');
      if (quantityError) return quantityError;
      if (!selectedIsPig && !lotNumber.trim()) return 'กรุณากรอก Lot Number';
      if (selectedReceiveRequiresExpiry && !expiryDate.trim()) return 'กรุณากรอกวันหมดอายุ';
      return null;
    }

    if (mode === 'adjust') {
      const adjustValidation = validateAdjustDraft({
        warehouseId,
        itemId,
        uomId,
        stockLotId,
        newQuantity,
        reason,
      });

      return adjustValidation.firstError;
    }

    return null;
  };

  const submitValidationError = mode === 'transfer'
    ? validateTransferDraft({
        mode: 'transfer',
        lines: transferLines.map((line) => ({
          itemId: line.itemId,
          uomId: line.uomId,
          fromWarehouseId: line.fromWarehouseId,
          toWarehouseId: line.toWarehouseId,
          quantity: line.quantity,
          stockLotId: line.stockLotId,
        })),
      }).firstError
    : validate();

  const addIssueLine = () => {
    const nextLine: IssueDraftLine = {
      itemId: Number(issueDraftLine.itemId),
      uomId: Number(issueDraftLine.uomId),
      fromWarehouseId: Number(issueDraftLine.fromWarehouseId),
      feedSiloId: issueDraftLine.feedSiloId === '' ? '' : Number(issueDraftLine.feedSiloId),
      quantity: Number(issueDraftLine.quantity),
      stockLotId: issueDraftLine.stockLotId === '' ? '' : Number(issueDraftLine.stockLotId),
      lotNumber: issueDraftLine.lotNumber,
    };

    const draftItem = items.find((item) => item.id === nextLine.itemId);
    const isFeedLine = isFeedItemCategory(draftItem?.itemCategoryId);

    if (!isPositiveStockNumber(nextLine.itemId) || !isPositiveStockNumber(nextLine.uomId) || !isPositiveStockNumber(nextLine.fromWarehouseId)) {
      setError('กรุณาเลือกสินค้า หน่วย และคลังต้นทางก่อนเพิ่มรายการ');
      return;
    }
    if (isFeedLine && nextLine.feedSiloId === '') {
      setError('กรุณาเลือกไซโลก่อนเพิ่มรายการอาหาร');
      return;
    }
    const quantityError = validatePositiveStockNumber(nextLine.quantity, 'จำนวน');
    if (quantityError) {
      setError(quantityError);
      return;
    }
    if (issueDraftMaxQuantity != null && nextLine.quantity > issueDraftMaxQuantity) {
      setError(`จำนวนเกินสต๊อก lot ที่เลือก (คงเหลือ ${issueDraftMaxQuantity})`);
      return;
    }

    setError(null);
    setIssueLines((current) => {
      const existingIndex = current.findIndex(
        (line) =>
          line.itemId === nextLine.itemId &&
          line.uomId === nextLine.uomId &&
          line.fromWarehouseId === nextLine.fromWarehouseId &&
          (line.feedSiloId || '') === (nextLine.feedSiloId || '') &&
          (line.stockLotId || '') === (nextLine.stockLotId || ''),
      );

      if (existingIndex < 0) {
        return [...current, nextLine];
      }

      return current.map((line, index) =>
        index === existingIndex
          ? {
              ...line,
              quantity: Number(line.quantity) + nextLine.quantity,
            }
          : line,
      );
    });

    setIssueDraftLine((current) => createEmptyIssueLine(current.fromWarehouseId));
    setAvailableLots([]);
  };

  const removeIssueLine = (index: number) => {
    setIssueLines((current) => current.filter((_, lineIndex) => lineIndex !== index));
  };

  const addTransferLine = () => {
    const nextLine: TransferDraftLine = {
      itemId: Number(itemId),
      uomId: Number(uomId),
      fromWarehouseId: Number(fromWarehouseId),
      toWarehouseId: Number(toWarehouseId),
      quantity: Number(quantity),
      stockLotId: stockLotId === '' ? '' : Number(stockLotId),
      lotNumber:
        stockLotId === ''
          ? ''
          : availableLots.find((lot) => lot.stockLotId === Number(stockLotId))?.lotNumber ?? '',
    };

    if (
      !isPositiveStockNumber(nextLine.itemId) ||
      !isPositiveStockNumber(nextLine.uomId) ||
      !isPositiveStockNumber(nextLine.fromWarehouseId) ||
      !isPositiveStockNumber(nextLine.toWarehouseId)
    ) {
      setError('กรุณาเลือกสินค้า หน่วย คลังต้นทาง และคลังปลายทางก่อนเพิ่มรายการ');
      return;
    }
    if (nextLine.fromWarehouseId === nextLine.toWarehouseId) {
      setError('คลังต้นทางและปลายทางต้องไม่ซ้ำกัน');
      return;
    }
    const quantityError = validatePositiveStockNumber(nextLine.quantity, 'จำนวน');
    if (quantityError) {
      setError(quantityError);
      return;
    }
    if (availableLots.length > 0 && nextLine.stockLotId === '') {
      setError('กรุณาเลือก lot ก่อนโอนสินค้า');
      return;
    }
    if (transferDraftMaxQuantity != null && nextLine.quantity > transferDraftMaxQuantity) {
      setError(`จำนวนเกินสต๊อก lot ที่เลือก (คงเหลือ ${transferDraftMaxQuantity})`);
      return;
    }

    setError(null);
    setTransferLines((current) => {
      const existingIndex = current.findIndex(
        (line) =>
          line.itemId === nextLine.itemId &&
          line.uomId === nextLine.uomId &&
          line.fromWarehouseId === nextLine.fromWarehouseId &&
          line.toWarehouseId === nextLine.toWarehouseId &&
          (line.stockLotId || '') === (nextLine.stockLotId || ''),
      );

      if (existingIndex < 0) {
        return [...current, nextLine];
      }

      return current.map((line, index) =>
        index === existingIndex
          ? {
              ...line,
              quantity: Number(line.quantity) + nextLine.quantity,
            }
          : line,
      );
    });

    setQuantity(1);
    setStockLotId('');
    setAvailableLots([]);
  };

  const removeTransferLine = (index: number) => {
    setTransferLines((current) => current.filter((_, lineIndex) => lineIndex !== index));
  };

  const submit = async () => {
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    if (!mode) return;

    const confirm = await Swal.fire({
      icon: 'question',
      title: `ยืนยัน${modeTitle(mode)}`,
      text: 'ต้องการบันทึกรายการนี้ใช่หรือไม่',
      showCancelButton: true,
      confirmButtonText: 'ยืนยัน',
      cancelButtonText: 'ยกเลิก',
      reverseButtons: true,
    });
    if (!confirm.isConfirmed) return;

    try {
      setSaving(true);
      setError(null);
      const idempotencyKey = crypto.randomUUID();
      const dateValue = toIso(transactionDate);

      if (mode === 'receive') {
        const isCentral = isCentralWarehouse(resolveWarehouseById(toWarehouseId));
        await stockService.receiveStock(
          {
            transactionType: 'Receive',
            transactionDate: dateValue,
            remarks,
            lines: [
              {
                itemId,
                lotNumber: selectedIsPig ? undefined : lotNumber,
                expiryDate: selectedIsPig ? undefined : (expiryDate ? toIso(expiryDate) : undefined),
                supplierLotNumber,
                toWarehouseId,
                feedSiloId: selectedReceiveRequiresFeedSilo && receiveFeedSiloId !== '' ? Number(receiveFeedSiloId) : undefined,
                quantity,
                uomId,
                unitCost,
                remarks,
              },
            ],
          },
          idempotencyKey,
          isCentral,
        );
      }

      if (mode === 'transfer') {
        const hasCentral = transferLines.some((line) => {
          const fromW = (allWarehouses.length > 0 ? allWarehouses : warehouses).find((w) => w.id === line.fromWarehouseId);
          const toW = (allWarehouses.length > 0 ? allWarehouses : warehouses).find((w) => w.id === line.toWarehouseId);
          return isCentralWarehouse(fromW) || isCentralWarehouse(toW);
        });
        await stockService.transferStock(
          {
            transactionType: 'Transfer',
            transactionDate: dateValue,
            remarks,
            lines: transferLines.map((line) => ({
              itemId: line.itemId,
              stockLotId: line.stockLotId === '' ? undefined : Number(line.stockLotId),
              fromWarehouseId: line.fromWarehouseId,
              toWarehouseId: line.toWarehouseId,
              quantity: line.quantity,
              uomId: line.uomId,
              remarks: '',
            })),
          },
          idempotencyKey,
          hasCentral,
        );
      }

      if (mode === 'issue') {
        const hasCentral = issueLines.some((line) => {
          const fromW = (allWarehouses.length > 0 ? allWarehouses : warehouses).find((w) => w.id === line.fromWarehouseId);
          return isCentralWarehouse(fromW);
        });
        await stockService.issueStock(
          {
            transactionType: 'Issue',
            transactionDate: dateValue,
            issueType,
            usageTargetType,
            targetFacilityNodeId,
            targetZone: targetZone || undefined,
            targetHouseId: targetHouseId || undefined,
            referenceDetail: referenceDetail.trim(),
            remarks,
            requestedByName: requestedByName.trim(),
            receivedByName: receivedByName.trim(),
            lines: issueLines.map((line) => ({
              itemId: line.itemId,
              stockLotId: line.stockLotId === '' ? undefined : Number(line.stockLotId),
              feedSiloId: line.feedSiloId === '' ? undefined : Number(line.feedSiloId),
              fromWarehouseId: line.fromWarehouseId,
              quantity: line.quantity,
              uomId: line.uomId,
            })),
          },
          idempotencyKey,
          hasCentral,
        );
      }

      if (mode === 'adjust') {
        const selectedWarehouse = (allWarehouses.length > 0 ? allWarehouses : warehouses).find(
          (w) => w.id === warehouseId,
        );
        const isCentral = isCentralWarehouse(selectedWarehouse);
        const facilityId = selectedWarehouse?.facilityNodeId ?? null;
        if (!selectedWarehouse || !facilityId || isCentral) {
          throw new Error('การขอปรับยอดรองรับเฉพาะคลังฟาร์มที่ผูก Facility');
        }

        const payload: CreateStockAdjustmentRequestPayload = {
          requestDate: dateValue,
          facilityId,
          remarks,
          lines: [
            {
              warehouseId,
              itemId,
              stockLotId: stockLotId === '' ? undefined : Number(stockLotId),
              uomId,
              newQuantity,
              reason: reason.trim(),
            },
          ],
        };

        await stockAdjustmentRequestService.create(payload);
      }

      await onSubmitted();
      await Swal.fire({
        icon: 'success',
        title: modeSuccessText(mode),
        timer: 1400,
        showConfirmButton: false,
      });
      onClose();
    } catch (err) {
      const axiosError = err as AxiosError<{ message?: string }>;
      const errorMessage = axiosError.response?.data?.message ?? 'ไม่สามารถบันทึกรายการคลังสินค้าได้';
      setError(errorMessage);
      await Swal.fire({
        icon: 'error',
        title: 'บันทึกรายการคลังสินค้าไม่สำเร็จ',
        text: errorMessage,
      });
    } finally {
      setSaving(false);
    }
  };

  const showFromWarehouse = mode === 'transfer' || mode === 'issue';
  const showToWarehouse = mode === 'receive' || mode === 'transfer';
  const showLotInput = mode === 'receive';
  const showStockLotId = mode === 'transfer' || mode === 'issue' || mode === 'adjust';

  const renderStandardLayout = () => (
    <Stack spacing={2} pt={0.5}>
      {error && <Alert severity="error">{error}</Alert>}
      <Box component="fieldset" sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, p: 1.5, minWidth: 0 }}>
        <Typography component="legend" sx={{ px: 1, fontSize: '0.95rem', fontWeight: 700 }}>
          ข้อมูลรายการ
        </Typography>
        <Stack spacing={2}>
          <TextField
            type="datetime-local"
            label="วันที่ทำรายการ"
            value={transactionDate}
            onChange={(event) => setTransactionDate(event.target.value)}
            InputLabelProps={{ shrink: true }}
            disabled={saving}
          />
          <TextField
            select
            label="สินค้า"
            value={itemId}
            onChange={(event) => setItemId(Number(event.target.value))}
            disabled={saving}
          >
            {items.map((item) => (
              <MenuItem key={item.id} value={item.id}>
                {item.code} - {item.name}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            select
            label="หน่วยนับ"
            value={uomId}
            onChange={(event) => setUomId(Number(event.target.value))}
            disabled={saving}
          >
            {uoms.map((uom) => (
              <MenuItem key={uom.id} value={uom.id}>
                {uom.code} - {uom.name}
              </MenuItem>
            ))}
          </TextField>
          {showFromWarehouse && (
            <TextField
              select
              label="คลังต้นทาง"
              value={fromWarehouseId}
              onChange={(event) => setFromWarehouseId(Number(event.target.value))}
              disabled={saving}
              helperText={mode === 'transfer' ? 'เลือกคลังที่ต้องการย้ายสินค้าออก' : undefined}
            >
              {(mode === 'transfer' ? transferSourceWarehouses : warehouses).map((warehouse) => (
                <MenuItem key={warehouse.id} value={warehouse.id}>
                  {mode === 'transfer' ? formatTransferWarehouseLabel(warehouse) : formatWarehouseLabel(warehouse)}
                </MenuItem>
              ))}
            </TextField>
          )}
          {showToWarehouse && (
            <TextField
              select
              label="คลังปลายทาง"
              value={toWarehouseId}
              onChange={(event) => setToWarehouseId(Number(event.target.value))}
              disabled={saving}
              helperText={
                mode === 'transfer'
                  ? selectedIsPig
                    ? transferDestinationWarehouses.length === 0
                      ? 'รายการหมูโอนเข้าคลังกลางไม่ได้ และใน scope ปัจจุบันไม่พบคลังฟาร์มปลายทางอื่น'
                      : 'รายการหมูโอนย้ายได้เฉพาะระหว่างคลังฟาร์ม'
                    : 'ถ้าต้นทางเป็นคลังกลาง จะเลือกปลายทางได้เฉพาะคลังฟาร์ม'
                  : undefined
              }
            >
              {mode === 'transfer' && transferDestinationWarehouses.length === 0 ? (
                <MenuItem value={0} disabled>
                  ไม่พบคลังปลายทางที่ย้ายได้
                </MenuItem>
              ) : null}
              {(mode === 'transfer' ? transferDestinationWarehouses : warehouses).map((warehouse) => (
                <MenuItem key={warehouse.id} value={warehouse.id}>
                  {mode === 'transfer' ? formatTransferWarehouseLabel(warehouse) : formatWarehouseLabel(warehouse)}
                </MenuItem>
              ))}
            </TextField>
          )}
          {mode === 'receive' && selectedReceiveRequiresFeedSilo ? (
            <>
              <TextField
                select
                label="เฟส"
                value={receivePhase}
                onChange={(event) => {
                  setReceivePhase(event.target.value);
                  setReceiveHouseId(0);
                  setReceiveFeedSiloId('');
                }}
                disabled={saving || receivePhaseOptions.length === 0}
                helperText={receivePhaseOptions.length === 0 ? 'โรงเรือนชุดนี้ไม่มีการแบ่งเฟส' : undefined}
              >
                <MenuItem value="">ทุกเฟส</MenuItem>
                {receivePhaseOptions.map((phase) => (
                  <MenuItem key={phase} value={phase}>
                    {phase}
                  </MenuItem>
                ))}
              </TextField>
              <TextField
                select
                label="โรงเรือน"
                value={receiveHouseId}
                onChange={(event) => {
                  setReceiveHouseId(Number(event.target.value));
                  setReceiveFeedSiloId('');
                }}
                disabled={saving || receiveHouseOptions.length === 0}
                helperText={receiveHouseOptions.length === 0 ? 'ไม่พบโรงเรือนที่ใช้งานได้' : undefined}
                required
                SelectProps={{
                  displayEmpty: true,
                  renderValue: (selected) => {
                    if (selected === '' || selected == null || Number(selected) <= 0) {
                      return 'เลือกโรงเรือน';
                    }
                    const house = receiveHouseOptions.find((option) => option.id === Number(selected));
                    return house ? formatCodeNameLabel(house.houseCode, house.houseName) : 'เลือกโรงเรือน';
                  },
                }}
              >
                <MenuItem value="">เลือกโรงเรือน</MenuItem>
                {receiveHouseOptions.map((house) => (
                  <MenuItem key={house.id} value={house.id}>
                    {formatCodeNameLabel(house.houseCode, house.houseName)}
                  </MenuItem>
                ))}
              </TextField>
              <TextField
                select
                label="ไซโล"
                value={receiveFeedSiloId}
                onChange={(event) => setReceiveFeedSiloId(event.target.value === '' ? '' : Number(event.target.value))}
                disabled={saving || receiveFeedSiloOptions.filter((silo) => !receiveHouseId || silo.houseId === receiveHouseId).length === 0}
                helperText={
                  receiveFeedSiloOptions.filter((silo) => !receiveHouseId || silo.houseId === receiveHouseId).length === 0
                    ? 'ไม่พบไซโลของโรงเรือนที่เลือก'
                    : undefined
                }
                SelectProps={{
                  renderValue: (selected) => {
                    if (selected === '' || selected == null) {
                      return 'เลือกไซโล';
                    }
                    const silo = receiveFeedSiloOptions.find((option) => option.id === Number(selected));
                    return silo ? getFeedSiloDisplayLabel(silo.name, silo.code) : 'เลือกไซโล';
                  },
                }}
              >
                <MenuItem value="">เลือกไซโล</MenuItem>
                {receiveFeedSiloOptions
                  .filter((silo) => !receiveHouseId || silo.houseId === receiveHouseId)
                  .map((silo) => {
                    const compatibility = getFeedSiloCompatibility(receiveSourceBalances, silo.id, {
                      itemId,
                      lotNumber,
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
            </>
          ) : null}
          {mode === 'adjust' && (
            <TextField
              select
              label="คลัง"
              value={warehouseId}
              onChange={(event) => setWarehouseId(Number(event.target.value))}
              disabled={saving}
            >
              {warehouses.map((warehouse) => (
                <MenuItem key={warehouse.id} value={warehouse.id}>
                  {formatWarehouseLabel(warehouse)}
                </MenuItem>
              ))}
            </TextField>
          )}
          {(mode === 'receive' || mode === 'transfer') && (
            <TextField
              type="number"
              label="จำนวน"
              value={quantity}
              onChange={(event) => handleQuantityChange(event.target.value)}
              disabled={saving}
              inputProps={{
                min: 0,
                step: quantityStep,
                ...(quantityMaxForSource != null ? { max: quantityMaxForSource } : {}),
              }}
              helperText={quantityMaxForSource != null ? `คงเหลือสูงสุด ${quantityMaxForSource}` : undefined}
            />
          )}
          {mode === 'adjust' && (
            <TextField
              type="number"
              label="จำนวนใหม่"
              value={newQuantity}
              onChange={(event) => setNewQuantity(Number(event.target.value))}
              disabled={saving}
              inputProps={{ min: 0, step: '0.0001' }}
            />
          )}
          {mode === 'receive' && (
            <TextField
              type="number"
              label="ต้นทุนต่อหน่วย"
              value={unitCost}
              onChange={(event) => setUnitCost(Number(event.target.value))}
              disabled={saving}
              inputProps={{ min: 0, step: '0.01' }}
            />
          )}
          {showStockLotId && mode === 'transfer' && (
            <TextField
              select
              label="Stock Lot"
              value={stockLotId}
              onChange={(event) => setStockLotId(event.target.value === '' ? '' : Number(event.target.value))}
              disabled={saving}
            >
              <MenuItem value="">ไม่ระบุ</MenuItem>
              {availableLots.map((lot) => (
                <MenuItem key={lot.stockLotId} value={lot.stockLotId}>
                  {renderAvailableLotMenuContent(lot)}
                </MenuItem>
              ))}
            </TextField>
          )}
          {showStockLotId && mode === 'adjust' && (
            <TextField
              type="number"
              label="Stock Lot Id (ถ้ามี)"
              value={stockLotId}
              onChange={(event) => setStockLotId(event.target.value === '' ? '' : Number(event.target.value))}
              disabled={saving}
              inputProps={{ min: 1 }}
            />
          )}
          {showLotInput && (
            <>
              <TextField
                label={selectedIsPig ? 'Lot Number' : 'Lot Number *'}
                value={lotNumber}
                onChange={(event) => setLotNumber(event.target.value)}
                disabled={saving || selectedIsPig}
                helperText={
                  selectedIsPig
                    ? 'รายการหมู ระบบสร้าง Lot ให้อัตโนมัติ'
                    : selectedReceiveRequiresExpiry
                      ? 'รายการนี้ควรระบุ lot และวันหมดอายุ'
                      : undefined
                }
              />
              <TextField
                label="Supplier Lot Number"
                value={supplierLotNumber}
                onChange={(event) => setSupplierLotNumber(event.target.value)}
                disabled={saving}
              />
              <TextField
                type="datetime-local"
                label={selectedReceiveRequiresExpiry ? 'Expiry Date *' : 'Expiry Date'}
                value={expiryDate}
                onChange={(event) => setExpiryDate(event.target.value)}
                InputLabelProps={{ shrink: true }}
                disabled={saving || selectedIsPig}
                helperText={selectedReceiveRequiresExpiry ? 'ยา/วัคซีนต้องระบุวันหมดอายุ' : undefined}
              />
            </>
          )}
          {mode === 'adjust' && (
            <TextField
              label="เหตุผลปรับยอด"
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              disabled={saving}
            />
          )}
          <TextField
            label="หมายเหตุ"
            value={remarks}
            onChange={(event) => setRemarks(event.target.value)}
            disabled={saving}
            multiline
            minRows={2}
          />
        </Stack>
      </Box>
    </Stack>
  );

  const renderIssueLayout = () => (
    <Stack spacing={2} pt={0.5}>
      {error && <Alert severity="error" sx={getStockDialogErrorAlertSx(theme)}>{error}</Alert>}

      <Box component="fieldset" sx={getStockDialogFieldsetSx(theme)}>
        <Typography component="legend" sx={STOCK_DIALOG_LEGEND_SX}>
          ข้อมูลเอกสาร
        </Typography>
        <Stack spacing={1.5}>
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5}>
            <TextField
              type="datetime-local"
              label="วันที่ทำรายการ"
              value={transactionDate}
              onChange={(event) => setTransactionDate(event.target.value)}
              InputLabelProps={{ shrink: true }}
              disabled={saving}
              fullWidth
            />
            <TextField
              label="ผู้ขอ"
              value={requestedByName}
              onChange={(event) => setRequestedByName(event.target.value)}
              disabled={saving}
              fullWidth
            />
            <TextField
              label="ผู้รับ"
              value={receivedByName}
              onChange={(event) => setReceivedByName(event.target.value)}
              disabled={saving}
              fullWidth
            />
          </Stack>
        </Stack>
      </Box>

      <Box component="fieldset" sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, p: 1.5, minWidth: 0 }}>
        <Typography component="legend" sx={{ px: 1, fontSize: '0.95rem', fontWeight: 700 }}>
          ปลายทางการใช้งาน
        </Typography>
        <Stack spacing={1.5}>
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5}>
            <TextField label="วัตถุประสงค์การเบิก" value={issueType} disabled fullWidth />
            <TextField
              select
              label="ปลายทางการใช้"
              value={usageTargetType}
              onChange={(event) => setUsageTargetType(event.target.value as IssueUsageTargetType)}
              disabled={saving}
              fullWidth
            >
              {ISSUE_USAGE_TARGET_OPTIONS.map((option) => (
                <MenuItem key={option} value={option}>
                  {option}
                </MenuItem>
              ))}
            </TextField>
          </Stack>
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5}>
            <TextField
              select
              label="ฟาร์ม"
              value={targetFacilityNodeId}
              onChange={(event) => setTargetFacilityNodeId(Number(event.target.value))}
              disabled={saving || facilityOptions.length === 0}
              helperText={facilityOptions.length === 0 ? 'ไม่พบรายการฟาร์มใน scope ของผู้ใช้' : undefined}
              fullWidth
            >
              {facilityOptions.map((facility) => (
                <MenuItem key={facility.facilityNodeId} value={facility.facilityNodeId}>
                  {facility.facilityName}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              select
              label="โซน"
              value={targetZone}
              onChange={(event) => setTargetZone(event.target.value)}
              disabled={saving || zoneOptions.length === 0}
              helperText={zoneOptions.length === 0 ? 'ไม่พบข้อมูลโซนในฟาร์มที่เลือก' : undefined}
              fullWidth
            >
              <MenuItem value="">ทุกโซน</MenuItem>
              {zoneOptions.map((zone) => (
                <MenuItem key={zone} value={zone}>
                  {zone}
                </MenuItem>
              ))}
            </TextField>
          </Stack>
          <TextField
            select
            label="โรงเรือน"
            value={targetHouseId}
            onChange={(event) => setTargetHouseId(Number(event.target.value))}
            disabled={saving || houseOptions.length === 0}
            helperText={houseOptions.length === 0 ? 'ไม่พบโรงเรือนที่เปิดใช้งานในฟาร์ม/โซนที่เลือก' : undefined}
            fullWidth
          >
            {houseOptions.map((house) => (
              <MenuItem key={house.id} value={house.id}>
                {[house.houseCode, house.houseName].filter(Boolean).join(' - ')}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            label="รายละเอียดอ้างอิง"
            value={referenceDetail}
            onChange={(event) => setReferenceDetail(event.target.value)}
            disabled={saving}
            placeholder="เช่น ใช้รอบเช้า, เตรียมวัคซีน, ซ่อมระบบน้ำ"
            fullWidth
          />
          <TextField
            label="หมายเหตุ"
            value={remarks}
            onChange={(event) => setRemarks(event.target.value)}
            disabled={saving}
            multiline
            minRows={2}
            fullWidth
          />
        </Stack>
      </Box>

      <Box component="fieldset" sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, p: 1.5, minWidth: 0 }}>
        <Typography component="legend" sx={{ px: 1, fontSize: '0.95rem', fontWeight: 700 }}>
          รายการที่เบิก
        </Typography>
        <Stack spacing={1.5}>
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5}>
            <TextField
              select
              label="สินค้า"
              value={issueDraftLine.itemId}
              onChange={(event) => updateIssueDraftLine({ itemId: Number(event.target.value) })}
              disabled={saving}
              helperText={issueSelectableItems.length === 0 ? 'ไม่พบสินค้าในคลังต้นทางที่เลือก' : undefined}
              fullWidth
            >
              {issueSelectableItems.map((item) => {
                const summary = issueItemSummaryMap.get(item.id);
                const stockSuffix = summary ? ` (คงเหลือ ${summary.quantity} ${summary.uomName})` : '';
                return (
                  <MenuItem key={item.id} value={item.id}>
                    {item.code} - {item.name}{stockSuffix}
                  </MenuItem>
                );
              })}
            </TextField>
            <TextField
              select
              label="หน่วยนับ"
              value={issueDraftLine.uomId}
              onChange={(event) => updateIssueDraftLine({ uomId: Number(event.target.value) })}
              disabled={saving}
              sx={{ minWidth: 180 }}
            >
              {uoms.map((uom) => (
                <MenuItem key={uom.id} value={uom.id}>
                  {uom.code} - {uom.name}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              select
              label="คลังต้นทาง"
              value={issueDraftLine.fromWarehouseId}
              onChange={(event) => updateIssueDraftLine({ fromWarehouseId: Number(event.target.value) })}
              disabled={saving}
              sx={{ minWidth: 240 }}
            >
              {warehouses.map((warehouse) => (
                <MenuItem key={warehouse.id} value={warehouse.id}>
                  {formatWarehouseLabel(warehouse)}
                </MenuItem>
              ))}
            </TextField>
          </Stack>

          <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5}>
            <TextField
              type="number"
              label="จำนวน"
              value={issueDraftLine.quantity}
              onChange={(event) => {
                const normalized = event.target.value.trim();
                if (normalized === '') {
                  updateIssueDraftLine({ quantity: 0 });
                  return;
                }
                if (!/^\d+$/.test(normalized)) return;
                updateIssueDraftLine({ quantity: Number.parseInt(normalized, 10) });
              }}
              disabled={saving}
              inputProps={{
                min: 0,
                step: quantityStep,
                ...(issueDraftMaxQuantity != null ? { max: issueDraftMaxQuantity } : {}),
              }}
              helperText={issueDraftMaxQuantity != null ? `คงเหลือสูงสุด ${issueDraftMaxQuantity}` : undefined}
              sx={{ minWidth: 140, '& input': { textAlign: 'right' } }}
            />
            {selectedIssueDraftRequiresFeedSilo ? (
              <TextField
                select
                label="ไซโล"
                value={issueDraftLine.feedSiloId}
                onChange={(event) =>
                  updateIssueDraftLine({
                    feedSiloId: event.target.value === '' ? '' : Number(event.target.value),
                  })
                }
                disabled={saving || issueFeedSiloOptions.length === 0}
                helperText={issueFeedSiloOptions.length === 0 ? 'ไม่พบไซโลอาหารในคลังต้นทางนี้' : undefined}
                sx={{ minWidth: 220 }}
              >
                <MenuItem value="">เลือกไซโล</MenuItem>
                {issueFeedSiloOptions.map((silo) => (
                  <MenuItem key={silo.id} value={silo.id}>
                    {getFeedSiloDisplayLabel(silo.name, silo.code)}
                  </MenuItem>
                ))}
              </TextField>
            ) : null}
            <TextField
              select
              label="Stock Lot"
              value={issueDraftLine.stockLotId}
              onChange={(event) => {
                const nextLotId = event.target.value === '' ? '' : Number(event.target.value);
                const nextLot = availableLots.find((lot) => lot.stockLotId === nextLotId);
                updateIssueDraftLine({
                  stockLotId: nextLotId,
                  lotNumber: nextLot?.lotNumber ?? '',
                });
              }}
              disabled={saving}
              fullWidth
              helperText={`เรียง lot ตาม ${selectedIssueLotStrategy} • ระบบจะตัดจาก lot ที่ใกล้หมดก่อน`}
              SelectProps={{
                renderValue: (selected) => {
                  const lot = availableLots.find((item) => item.stockLotId === Number(selected));
                  return renderAvailableLotSelectedValue(lot, 'ไม่ระบุ');
                },
                MenuProps: {
                  PaperProps: {
                    sx: {
                      minWidth: 560,
                      maxWidth: 'calc(100vw - 80px)',
                    },
                  },
                },
              }}
            >
              <MenuItem value="">ไม่ระบุ</MenuItem>
              {availableLots.map((lot) => (
                <MenuItem key={lot.stockLotId} value={lot.stockLotId}>
                  {renderAvailableLotMenuContent(lot)}
                </MenuItem>
              ))}
            </TextField>
          </Stack>

          <StockActionButton tone="success" size="small" startIcon={<AddIcon />} onClick={addIssueLine} disabled={saving} sx={{ alignSelf: 'flex-start' }}>
            เพิ่มรายการ
          </StockActionButton>

          <TableContainer sx={{ ...getStockDialogTableSx(theme), borderRadius: '15px 15px 0 0', maxHeight: 280 }}>
            <Table
              size="small"
              stickyHeader
              sx={{}}
            >
              <TableHead>
                <TableRow>
                  <TableCell width={56} align="center">#</TableCell>
                  <TableCell>สินค้า</TableCell>
                  <TableCell>หน่วย</TableCell>
                  <TableCell>คลังต้นทาง</TableCell>
                  <TableCell>ไซโล</TableCell>
                  <TableCell>ล็อต</TableCell>
                  <TableCell align="right">จำนวน</TableCell>
                  <TableCell width={80} align="center">จัดการ</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {issueLines.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                      ยังไม่มีรายการเบิก
                    </TableCell>
                  </TableRow>
                ) : (
                  issueLines.map((line, index) => {
                    const item = items.find((row) => row.id === line.itemId);
                    const uom = uoms.find((row) => row.id === line.uomId);
                    const warehouse = warehouses.find((row) => row.id === line.fromWarehouseId);
                    const siloLabel = line.feedSiloId ? (issueSiloLabelMap.get(line.feedSiloId) ?? String(line.feedSiloId)) : '-';

                    return (
                      <TableRow key={`${line.itemId}-${line.fromWarehouseId}-${line.feedSiloId}-${line.uomId}-${line.stockLotId}-${index}`} hover>
                        <TableCell align="center">{index + 1}</TableCell>
                        <TableCell>{item ? `${item.code} - ${item.name}` : line.itemId}</TableCell>
                        <TableCell>{uom ? `${uom.code} - ${uom.name}` : line.uomId}</TableCell>
                        <TableCell>{warehouse ? formatWarehouseLabel(warehouse) : line.fromWarehouseId}</TableCell>
                        <TableCell>{siloLabel}</TableCell>
                        <TableCell>{line.lotNumber || '-'}</TableCell>
                        <TableCell align="right">{line.quantity}</TableCell>
                        <TableCell align="center">
                          <IconButton color="error" size="small" onClick={() => removeIssueLine(index)} disabled={saving}>
                            <DeleteIcon fontSize="small" />
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
    </Stack>
  );

  const renderTransferLayout = () => (
    <Stack spacing={2} pt={0.5}>
      {error && <Alert severity="error" sx={getStockDialogErrorAlertSx(theme)}>{error}</Alert>}

      <Box component="fieldset" sx={getStockDialogFieldsetSx(theme)}>
        <Typography component="legend" sx={STOCK_DIALOG_LEGEND_SX}>
          ข้อมูลรายการ
        </Typography>
        <Stack spacing={1.5}>
          <TextField
            type="datetime-local"
            label="วันที่ทำรายการ"
            value={transactionDate}
            onChange={(event) => setTransactionDate(event.target.value)}
            InputLabelProps={{ shrink: true }}
            disabled={saving}
            fullWidth
          />
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5}>
            <TextField
              select
              label="สินค้า"
              value={itemId}
              onChange={(event) => setItemId(Number(event.target.value))}
              disabled={saving}
              fullWidth
              helperText={transferSelectableItems.length === 0 ? 'ไม่พบสินค้าในคลังต้นทางที่เลือก' : undefined}
            >
              {transferSelectableItems.map((item) => {
                const stockSummary = transferItemSummaryMap.get(item.id);
                return (
                <MenuItem key={item.id} value={item.id}>
                  {item.code} - {item.name}
                  {stockSummary ? ` (คงเหลือ ${stockSummary.quantity} ${stockSummary.uomName})` : ''}
                </MenuItem>
                );
              })}
            </TextField>
            <TextField
              select
              label="หน่วยนับ"
              value={uomId}
              onChange={(event) => setUomId(Number(event.target.value))}
              disabled={saving}
              sx={{ minWidth: 180 }}
            >
              {uoms.map((uom) => (
                <MenuItem key={uom.id} value={uom.id}>
                  {uom.code} - {uom.name}
                </MenuItem>
              ))}
            </TextField>
          </Stack>
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5}>
            <TextField
              select
              label="คลังต้นทาง"
              value={fromWarehouseId}
              onChange={(event) => setFromWarehouseId(Number(event.target.value))}
              disabled={saving}
              helperText="เลือกคลังที่ต้องการย้ายสินค้าออก"
              fullWidth
            >
              {transferSourceWarehouses.map((warehouse) => (
                <MenuItem key={warehouse.id} value={warehouse.id}>
                  {formatTransferWarehouseLabel(warehouse)}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              select
              label="คลังปลายทาง"
              value={toWarehouseId}
              onChange={(event) => setToWarehouseId(Number(event.target.value))}
              disabled={saving}
              helperText={
                selectedIsPig
                  ? transferDestinationWarehouses.length === 0
                    ? 'รายการหมูโอนเข้าคลังกลางไม่ได้ และใน scope ปัจจุบันไม่พบคลังฟาร์มปลายทางอื่น'
                    : 'รายการหมูโอนย้ายได้เฉพาะระหว่างคลังฟาร์ม'
                  : 'ถ้าต้นทางเป็นคลังกลาง จะเลือกปลายทางได้เฉพาะคลังฟาร์ม'
              }
              fullWidth
            >
              {transferDestinationWarehouses.length === 0 ? (
                <MenuItem value={0} disabled>
                  ไม่พบคลังปลายทางที่ย้ายได้
                </MenuItem>
              ) : null}
              {transferDestinationWarehouses.map((warehouse) => (
                <MenuItem key={warehouse.id} value={warehouse.id}>
                  {formatTransferWarehouseLabel(warehouse)}
                </MenuItem>
              ))}
            </TextField>
          </Stack>
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5}>
            <TextField
              type="number"
              label="จำนวน"
              value={quantity}
              onChange={(event) => handleQuantityChange(event.target.value)}
              disabled={saving}
              inputProps={{
                min: 0,
                step: quantityStep,
                ...(quantityMaxForSource != null ? { max: quantityMaxForSource } : {}),
              }}
              helperText={quantityMaxForSource != null ? `คงเหลือสูงสุด ${quantityMaxForSource}` : undefined}
              sx={{ minWidth: 160, '& input': { textAlign: 'right' } }}
            />
            <TextField
              select
              label="Stock Lot"
              value={stockLotId}
              onChange={(event) => setStockLotId(event.target.value === '' ? '' : Number(event.target.value))}
              disabled={saving}
              fullWidth
              helperText="ระบบจะตัดจาก lot ที่ใกล้หมดก่อน"
              SelectProps={{
                renderValue: (selected) => {
                  const lot = availableLots.find((item) => item.stockLotId === Number(selected));
                  return renderAvailableLotSelectedValue(lot, 'ไม่ระบุ');
                },
                MenuProps: {
                  PaperProps: {
                    sx: {
                      minWidth: 560,
                      maxWidth: 'calc(100vw - 80px)',
                    },
                  },
                },
              }}
            >
              <MenuItem value="">ไม่ระบุ</MenuItem>
              {availableLots.map((lot) => (
                <MenuItem key={lot.stockLotId} value={lot.stockLotId}>
                  {renderAvailableLotMenuContent(lot)}
                </MenuItem>
              ))}
            </TextField>
          </Stack>

          <TextField
            label="หมายเหตุ"
            value={remarks}
            onChange={(event) => setRemarks(event.target.value)}
            disabled={saving}
            multiline
            minRows={2}
            fullWidth
          />

          <StockActionButton tone="success" size="small" startIcon={<AddIcon />} onClick={addTransferLine} disabled={saving} sx={{ alignSelf: 'flex-start' }}>
            เพิ่มรายการ
          </StockActionButton>

          <TableContainer sx={{ ...getStockDialogTableSx(theme), borderRadius: '15px 15px 0 0', maxHeight: 280 }}>
            <Table
              size="small"
              stickyHeader
              sx={{}}
            >
              <TableHead>
                <TableRow>
                  <TableCell width={56} align="center">#</TableCell>
                  <TableCell>สินค้า</TableCell>
                  <TableCell>หน่วย</TableCell>
                  <TableCell>คลังต้นทาง</TableCell>
                  <TableCell>คลังปลายทาง</TableCell>
                  <TableCell>ล็อต</TableCell>
                  <TableCell align="right">จำนวน</TableCell>
                  <TableCell width={80} align="center">จัดการ</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {transferLines.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                      ยังไม่มีรายการโอนย้าย
                    </TableCell>
                  </TableRow>
                ) : (
                  transferLines.map((line, index) => {
                    const item = items.find((row) => row.id === line.itemId);
                    const uom = uoms.find((row) => row.id === line.uomId);
                    const fromWarehouse = transferSourceWarehouses.find((row) => row.id === line.fromWarehouseId);
                    const toWarehouse = transferWarehouses.find((row) => row.id === line.toWarehouseId);

                    return (
                      <TableRow key={`${line.itemId}-${line.fromWarehouseId}-${line.toWarehouseId}-${line.uomId}-${line.stockLotId}-${index}`} hover>
                        <TableCell align="center">{index + 1}</TableCell>
                        <TableCell>{item ? `${item.code} - ${item.name}` : line.itemId}</TableCell>
                        <TableCell>{uom ? `${uom.code} - ${uom.name}` : line.uomId}</TableCell>
                        <TableCell>{fromWarehouse ? formatTransferWarehouseLabel(fromWarehouse) : line.fromWarehouseId}</TableCell>
                        <TableCell>{toWarehouse ? formatTransferWarehouseLabel(toWarehouse) : line.toWarehouseId}</TableCell>
                        <TableCell>{line.lotNumber || '-'}</TableCell>
                        <TableCell align="right">{line.quantity}</TableCell>
                        <TableCell align="center">
                          <IconButton color="error" size="small" onClick={() => removeTransferLine(index)} disabled={saving}>
                            <DeleteIcon fontSize="small" />
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
    </Stack>
  );

  return (
    <Dialog open={open} onClose={saving ? undefined : onClose} fullWidth maxWidth={mode === 'issue' || mode === 'transfer' ? 'lg' : 'sm'} PaperProps={{ sx: getStockDialogPaperSx(theme) }}>
      <DialogTitleWithClose onClose={onClose} disabled={saving} variant="master">
        {modeTitle(mode)}
      </DialogTitleWithClose>
      <DialogContent dividers sx={getStockDialogFormSx(theme)}>
        {mode === 'issue' ? renderIssueLayout() : mode === 'transfer' ? renderTransferLayout() : renderStandardLayout()}
      </DialogContent>
      <DialogActions sx={getStockDialogActionsSx(theme)}>
        <StockActionButton
          tone="primary"
          onClick={submit}
          disabled={saving || !mode || Boolean(submitValidationError)}
        >
          บันทึก
        </StockActionButton>
      </DialogActions>
    </Dialog>
  );
}
