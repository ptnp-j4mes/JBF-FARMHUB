'use client';

import { useEffect, useMemo, useState, type ReactElement } from 'react';
import {
  Alert,
  Box,
  Dialog,
  DialogActions,
  DialogContent,
  Divider,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
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
import { Add as AddIcon } from '@mui/icons-material';
import { DialogTitleWithClose } from '@/components/common';
import { StockActionButton } from '@/features/production/stock/components/StockActionButton';
import type {
  CreateStockIssueRequestPayload,
  StockIssueRequestCreateOptionsResponse,
} from '../types/stock-issue-request.types';
import type { StockBalanceResponse } from '@/features/production/stock/types';
import { stockService } from '@/features/production/stock/services/stock.service';
import { filterWarehousesForFacility } from '@/features/production/stock/utils/warehouse-scope.util';
import { formatNumber } from '@/lib/utils/format.util';
import { PR_DIALOG_TABLE_HEIGHT } from '@/core/ui-patterns/pr-ui.constants';
import axiosInstance from '@/lib/axios';
import { formatCodeNameLabel, getFeedSiloDisplayLabel, naturalTextCompare } from '@/features/production/stock/utils/location-display.util';
import {
  parseStockNumber,
  validatePositiveStockNumber,
  validateIssueDraft,
} from '@/features/production/stock/utils/stock-validation';
import { getStockDialogTitleSx, getStockDialogTableSx } from '../../stock/components/stock-dialog.constants';
import { useTheme } from '@mui/material/styles';

type DraftLine = {
  itemId: number | '';
  warehouseId: number | '';
  feedSiloId: number | '';
  stockLotId: number | '';
  quantity: string;
};

type ProductionActivityHouseOption = {
  id: number;
  facilityNodeId: number;
  zoneName?: string | null;
  houseCode: string;
  houseName: string;
};

type ProductionActivityOptionsResponse = {
  houses: ProductionActivityHouseOption[];
};

type Props = {
  open: boolean;
  options: StockIssueRequestCreateOptionsResponse | null;
  currentFacilityId?: number | null;
  loading?: boolean;
  onClose: () => void;
  onSubmit: (payload: CreateStockIssueRequestPayload) => Promise<void>;
};

function normalizeLotStrategy(strategy?: string | null): 'FIFO' | 'FEFO' | 'MANUAL' {
  const normalized = (strategy ?? '').trim().toUpperCase();
  if (normalized === 'FIFO' || normalized === 'FEFO') return normalized;
  return 'MANUAL';
}

function compareLotCandidates(
  left: StockBalanceResponse,
  right: StockBalanceResponse,
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

  const lotCompare = naturalTextCompare(left.lotNumber ?? '', right.lotNumber ?? '');
  if (lotCompare !== 0) return lotCompare;

  const siloCompare = naturalTextCompare(
    getFeedSiloDisplayLabel(left.feedSiloName, left.feedSiloCode),
    getFeedSiloDisplayLabel(right.feedSiloName, right.feedSiloCode),
  );
  if (siloCompare !== 0) return siloCompare;

  return Number(left.stockLotId ?? 0) - Number(right.stockLotId ?? 0);
}

function getLotExpiryLabel(balance: StockBalanceResponse): string {
  const expiry = balance.expiryDate ?? balance.layers?.find((layer) => layer.expiryDate)?.expiryDate ?? null;
  if (!expiry) return '-';
  return new Date(expiry).toLocaleDateString('th-TH');
}

function getLotLayerLines(balance: StockBalanceResponse): string[] {
  const layers = balance.layers && balance.layers.length > 0 ? balance.layers : [];
  if (layers.length === 0) {
    return [];
  }

  return layers.map((layer, index) => {
    const expiry = layer.expiryDate ? new Date(layer.expiryDate).toLocaleDateString('th-TH') : '-';
    return `หมดอายุ ${expiry} • คงเหลือ ${formatNumber(layer.remainingQuantity)}`;
  });
}

function renderLotMenuContent(balance: StockBalanceResponse): ReactElement {
  const layers = getLotLayerLines(balance);
  return (
    <Stack spacing={0.25} sx={{ py: 0.25, whiteSpace: 'normal', minWidth: 420, maxWidth: '100%' }}>
      <Typography variant="body2" fontWeight={700} lineHeight={1.3}>
        {balance.lotNumber}
        {balance.feedSiloName ? ` • ไซโล ${getFeedSiloDisplayLabel(balance.feedSiloName, balance.feedSiloCode)}` : ''}
      </Typography>
      <Typography variant="caption" color="text.secondary" lineHeight={1.35}>
        หมดอายุ {getLotExpiryLabel(balance)} • คงเหลือ {formatNumber(balance.availableQuantity ?? balance.quantity)} {balance.uomName}
      </Typography>
      {layers.length > 0 && (
        <Stack spacing={0.1} sx={{ pl: 1, mt: 0.25 }}>
          {layers.map((line, index) => (
            <Typography key={`${balance.stockLotId ?? 'lot'}-layer-${index}`} variant="caption" color="text.secondary" lineHeight={1.35}>
              {line}
            </Typography>
          ))}
        </Stack>
      )}
    </Stack>
  );
}

function renderLotSelectedValue(
  balance: StockBalanceResponse | undefined,
  placeholder = 'ไม่ระบุ',
): string {
  if (!balance) return placeholder;
  const expiry = getLotExpiryLabel(balance);
  return `${balance.lotNumber}${balance.feedSiloName ? ` • ไซโล ${getFeedSiloDisplayLabel(balance.feedSiloName, balance.feedSiloCode)}` : ''} • หมดอายุ ${expiry} • คงเหลือ ${formatNumber(balance.availableQuantity ?? balance.quantity)} ${balance.uomName}`;
}

function requiresFeedSiloManagement(itemCode?: string | null, itemCategoryCode?: string | null): boolean {
  return (itemCategoryCode ?? '').trim() === '05' && (itemCode ?? '').trim().toUpperCase().startsWith('SEMI-');
}

export function CreateStockIssueRequestDialog({
  open,
  options,
  currentFacilityId = null,
  loading = false,
  onClose,
  onSubmit,
}: Props) {
  const theme = useTheme();
  const toLocalDateTimeInputValue = () => {
    const now = new Date();
    const offset = now.getTimezoneOffset();
    const local = new Date(now.getTime() - offset * 60_000);
    return local.toISOString().slice(0, 16);
  };

  const today = toLocalDateTimeInputValue();
  const [error, setError] = useState<string | null>(null);
  const [requestDate, setRequestDate] = useState(today);
  const [facilityId, setFacilityId] = useState<number | ''>('');
  const [usageTargetType, setUsageTargetType] = useState('Production');
  const [usageZone, setUsageZone] = useState('');
  const [usageHouseId, setUsageHouseId] = useState<number | ''>('');
  const [issuePurpose, setIssuePurpose] = useState('เบิกไปใช้งาน');
  const [referenceDetail, setReferenceDetail] = useState('');
  const [remarks, setRemarks] = useState('');
  const [draftLine, setDraftLine] = useState<DraftLine>({
    itemId: '',
    warehouseId: '',
    feedSiloId: '',
    stockLotId: '',
    quantity: '',
  });
  const [warehouseBalances, setWarehouseBalances] = useState<StockBalanceResponse[]>([]);
  const [productionHouses, setProductionHouses] = useState<ProductionActivityHouseOption[]>([]);
  const [lines, setLines] = useState<CreateStockIssueRequestPayload['lines']>([]);

  const availableFacilities = useMemo(
    () =>
      currentFacilityId
        ? (options?.facilities ?? []).filter((facility) => facility.id === currentFacilityId)
        : (options?.facilities ?? []),
    [currentFacilityId, options?.facilities],
  );

  const availableWarehouses = useMemo(
    () => filterWarehousesForFacility(options?.warehouses ?? [], facilityId ? Number(facilityId) : null, true),
    [facilityId, options?.warehouses],
  );

  const defaultFacilityWarehouse = useMemo(
    () =>
      availableWarehouses.find((warehouse) =>
        warehouse.isCentralHub !== true && warehouse.facilityNodeId === Number(facilityId)) ?? null,
    [availableWarehouses, facilityId],
  );

  useEffect(() => {
    if (!open) return;
    setRequestDate(today);
    setFacilityId(availableFacilities[0]?.id ?? '');
    setUsageTargetType('Production');
    setUsageZone('');
    setUsageHouseId('');
    setIssuePurpose('เบิกไปใช้งาน');
    setReferenceDetail('');
    setRemarks('');
    setDraftLine({
      itemId: '',
      warehouseId: '',
      feedSiloId: '',
      stockLotId: '',
      quantity: '',
    });
    setLines([]);
  }, [currentFacilityId, open, options?.facilities, today]);

  useEffect(() => {
    let active = true;
    const loadProductionOptions = async () => {
      if (!open) return;
      try {
        const response = await axiosInstance.get<ProductionActivityOptionsResponse>('/api/ProductionActivities/options', {
          params: {
            facilityId: facilityId || currentFacilityId || undefined,
          },
        });
        if (!active) return;
        setProductionHouses(response.data?.houses ?? []);
      } catch {
        if (!active) return;
        setProductionHouses([]);
      }
    };

    void loadProductionOptions();
    return () => {
      active = false;
    };
  }, [currentFacilityId, facilityId, open]);

  useEffect(() => {
    let active = true;
    const loadBalances = async () => {
      if (!draftLine.warehouseId) {
        setWarehouseBalances([]);
        return;
      }

      try {
        const response = await stockService.getStockBalanceByWarehouse(Number(draftLine.warehouseId), true);
        if (!active) return;
        setWarehouseBalances((response ?? []).filter((row) => (row.availableQuantity ?? row.quantity) > 0));
      } catch {
        if (!active) return;
        setWarehouseBalances([]);
      }
    };

    void loadBalances();
    return () => {
      active = false;
    };
  }, [draftLine.warehouseId]);

  const filteredHouses = useMemo(() => {
    if (!facilityId) return [];
    return productionHouses.filter((house) => house.facilityNodeId === Number(facilityId));
  }, [facilityId, productionHouses]);

  const materialWarehouseBalances = useMemo(
    () =>
      warehouseBalances.filter((balance) =>
        Boolean(balance.itemId) &&
        (typeof balance.requestType !== 'string' || balance.requestType.toLowerCase() !== 'pig'),
      ),
    [warehouseBalances],
  );

  const zoneOptions = useMemo(
    () =>
      Array.from(
        new Set(
          filteredHouses
            .map((house) => (house.zoneName ?? '').trim())
            .filter(Boolean),
        ),
      ).sort(naturalTextCompare),
    [filteredHouses],
  );

  const houseOptions = useMemo(
    () =>
      filteredHouses
        .filter((house) => !usageZone || (house.zoneName ?? '').trim() === usageZone)
        .sort((left, right) => {
          const codeCompare = naturalTextCompare(left.houseCode, right.houseCode);
          return codeCompare !== 0 ? codeCompare : naturalTextCompare(left.houseName, right.houseName);
        }),
    [filteredHouses, usageZone],
  );

  useEffect(() => {
    setUsageZone((current) => (current && zoneOptions.includes(current) ? current : ''));
  }, [zoneOptions]);

  useEffect(() => {
    setUsageHouseId((current) =>
      current && houseOptions.some((house) => house.id === Number(current)) ? current : '',
    );
  }, [houseOptions]);

  useEffect(() => {
    if (!open) return;
    setDraftLine((current) => {
      const nextWarehouseId = defaultFacilityWarehouse?.id ?? '';
      const currentWarehouseId = current.warehouseId === '' ? '' : Number(current.warehouseId);
      if (currentWarehouseId === nextWarehouseId) return current;
      return {
        warehouseId: nextWarehouseId,
        itemId: '',
        feedSiloId: '',
        stockLotId: '',
        quantity: '',
      };
    });
  }, [defaultFacilityWarehouse?.id, open]);

  const itemOptions = useMemo(() => {
    const grouped = new Map<number, StockBalanceResponse>();
    materialWarehouseBalances.forEach((balance) => {
      if (!balance.itemId) return;

      if (!grouped.has(balance.itemId)) {
        grouped.set(balance.itemId, {
          ...balance,
          quantity: Number(balance.quantity ?? 0),
          reservedQuantity: Number(balance.reservedQuantity ?? 0),
          availableQuantity: Number(balance.availableQuantity ?? balance.quantity ?? 0),
        });
        return;
      }

      const current = grouped.get(balance.itemId)!;
      current.quantity = Number(current.quantity ?? 0) + Number(balance.quantity ?? 0);
      current.reservedQuantity =
        Number(current.reservedQuantity ?? 0) + Number(balance.reservedQuantity ?? 0);
      current.availableQuantity =
        Number(current.availableQuantity ?? 0) +
        Number(balance.availableQuantity ?? balance.quantity ?? 0);
    });
    return Array.from(grouped.values());
  }, [materialWarehouseBalances]);

  const selectedItemBalance = useMemo(() => {
    if (!draftLine.itemId) return null;
    return itemOptions.find((balance) => balance.itemId === Number(draftLine.itemId)) ?? null;
  }, [draftLine.itemId, itemOptions]);

  const selectedItemLotStrategy = useMemo(
    () => normalizeLotStrategy(selectedItemBalance?.itemLotStrategy),
    [selectedItemBalance?.itemLotStrategy],
  );

  const draftFeedSiloOptions = useMemo(() => {
    if (!draftLine.itemId) return [];
    const grouped = new Map<number, { id: number; label: string }>();
    materialWarehouseBalances
      .filter((balance) => balance.itemId === Number(draftLine.itemId) && balance.feedSiloId)
      .forEach((balance) => {
        const feedSiloId = Number(balance.feedSiloId);
        if (!grouped.has(feedSiloId)) {
          grouped.set(feedSiloId, {
            id: feedSiloId,
            label: getFeedSiloDisplayLabel(balance.feedSiloName, balance.feedSiloCode) || String(feedSiloId),
          });
        }
    });
    return Array.from(grouped.values()).sort((left, right) => naturalTextCompare(left.label, right.label));
  }, [draftLine.itemId, materialWarehouseBalances]);

  const selectedDraftRequiresFeedSilo = useMemo(
    () => (selectedItemBalance?.itemCode ?? '').trim().toUpperCase().startsWith('SEMI-'),
    [selectedItemBalance?.itemCode],
  );
  const draftNeedsFeedSiloButUnavailable = selectedDraftRequiresFeedSilo && draftFeedSiloOptions.length === 0;
  const draftNeedsFeedSiloSelection = selectedDraftRequiresFeedSilo && draftFeedSiloOptions.length > 0;

  const lotOptions = useMemo(() => {
    if (!draftLine.itemId) return [];

    const candidates = materialWarehouseBalances.filter((balance) =>
      balance.itemId === Number(draftLine.itemId) &&
      (draftLine.feedSiloId === '' || balance.feedSiloId === Number(draftLine.feedSiloId)));

    const balancesWithLot = candidates.filter((balance) => balance.stockLotId != null);
    const effectiveCandidates = balancesWithLot.length > 0 ? balancesWithLot : candidates;

    return effectiveCandidates.sort((left, right) => compareLotCandidates(left, right, selectedItemLotStrategy));
  }, [draftLine.feedSiloId, draftLine.itemId, materialWarehouseBalances, selectedItemLotStrategy]);

  useEffect(() => {
    if (!draftLine.itemId) return;
    if (!selectedDraftRequiresFeedSilo || draftFeedSiloOptions.length === 0) {
      if (draftLine.feedSiloId === '') return;
      setDraftLine((current) => ({ ...current, feedSiloId: '', stockLotId: '' }));
      return;
    }

    const hasSelectedSilo =
      draftLine.feedSiloId !== '' &&
      draftFeedSiloOptions.some((option) => option.id === Number(draftLine.feedSiloId));

    if (hasSelectedSilo) return;

    if (draftFeedSiloOptions.length === 1) {
      setDraftLine((current) => ({
        ...current,
        feedSiloId: draftFeedSiloOptions[0].id,
        stockLotId: '',
      }));
      return;
    }

    if (draftLine.feedSiloId !== '') {
      setDraftLine((current) => ({ ...current, feedSiloId: '', stockLotId: '' }));
    }
  }, [draftFeedSiloOptions, draftLine.feedSiloId, draftLine.itemId, selectedDraftRequiresFeedSilo]);

  const selectedBalance = useMemo(() => {
    if (!draftLine.itemId || !draftLine.stockLotId) return null;
    return materialWarehouseBalances.find((balance) =>
      balance.itemId === Number(draftLine.itemId) &&
      (draftLine.feedSiloId === '' || balance.feedSiloId === Number(draftLine.feedSiloId)) &&
      balance.stockLotId === Number(draftLine.stockLotId));
  }, [draftLine.feedSiloId, draftLine.itemId, draftLine.stockLotId, materialWarehouseBalances]);

  const submittedLineValidationError = useMemo(() => {
    for (const line of lines) {
      const baseBalance = materialWarehouseBalances.find((balance) =>
        balance.itemId === line.itemId &&
        balance.warehouseId === line.warehouseId &&
        balance.stockLotId === line.stockLotId);

      if (!baseBalance) {
        const warehouseMatch = warehouseBalances.find((balance) =>
          balance.itemId === line.itemId &&
          balance.warehouseId === line.warehouseId &&
          balance.stockLotId === line.stockLotId);

        if (warehouseMatch) {
          if ((warehouseMatch.requestType ?? '').toLowerCase() === 'pig') {
            return `รายการสินค้า ${warehouseMatch.itemCode ?? line.itemId} เป็นสต๊อกหมู จึงใช้ในใบขอตัดสต๊อกวัสดุไม่ได้`;
          }

          if ((warehouseMatch.availableQuantity ?? warehouseMatch.quantity ?? 0) <= 0) {
            return `รายการสินค้า ${warehouseMatch.itemCode ?? line.itemId} มีอยู่ในสต๊อก แต่คงเหลือพร้อมใช้เป็นศูนย์`;
          }

          return `รายการสินค้า ${warehouseMatch.itemCode ?? line.itemId} ยังไม่อยู่ในรายการสต๊อกที่เบิกได้ตอนนี้ กรุณาลบแล้วเพิ่มใหม่`;
        }

        return `รายการสินค้า ${line.itemId} - ${line.stockLotId} ไม่ตรงกับสต๊อกที่มีอยู่จริง กรุณาลบแล้วเพิ่มใหม่`;
      }

      const requiresFeedSilo = requiresFeedSiloManagement(
        baseBalance.itemCode ?? null,
        baseBalance.itemCategoryCode ?? null,
      );
      if (requiresFeedSilo && !line.feedSiloId) {
        return `รายการสินค้า ${baseBalance.itemCode} ต้องเลือกไซโลก่อนบันทึก`;
      }

      if (requiresFeedSilo) {
        const matchedBalance = materialWarehouseBalances.find((balance) =>
          balance.itemId === line.itemId &&
          balance.warehouseId === line.warehouseId &&
          balance.stockLotId === line.stockLotId &&
          (balance.feedSiloId ?? null) === (line.feedSiloId ?? null));

        if (!matchedBalance) {
          return `รายการสินค้า ${line.itemId} - ${line.stockLotId} ไม่ตรงกับสต๊อกที่มีอยู่จริง กรุณาลบแล้วเพิ่มใหม่`;
        }
      }
    }
    return '';
  }, [lines, materialWarehouseBalances]);

  const lineValidationInputs = useMemo(
    () =>
      lines.map((line, index) => {
        const baseBalance = materialWarehouseBalances.find((balance) =>
          balance.itemId === line.itemId &&
          balance.warehouseId === line.warehouseId &&
          balance.stockLotId === line.stockLotId);

        const warehouseMatch = warehouseBalances.find((balance) =>
          balance.itemId === line.itemId &&
          balance.warehouseId === line.warehouseId &&
          balance.stockLotId === line.stockLotId);

        const requiresFeedSilo = requiresFeedSiloManagement(
          baseBalance?.itemCode ?? null,
          baseBalance?.itemCategoryCode ?? null,
        );

        const matchedBalance = requiresFeedSilo
          ? materialWarehouseBalances.find((balance) =>
              balance.itemId === line.itemId &&
              balance.warehouseId === line.warehouseId &&
              balance.stockLotId === line.stockLotId &&
              (balance.feedSiloId ?? null) === (line.feedSiloId ?? null))
          : baseBalance;

        return {
          itemName: String(line.itemId ?? index + 1),
          itemId: line.itemId,
          warehouseId: line.warehouseId,
          stockLotId: line.stockLotId,
          feedSiloId: line.feedSiloId ?? '',
          quantity: line.quantity,
          requiresFeedSilo,
          resolvedItemName: baseBalance?.itemName ?? warehouseMatch?.itemName ?? '',
          resolvedWarehouseName: baseBalance?.warehouseName ?? warehouseMatch?.warehouseName ?? '',
          resolvedUomName: baseBalance?.uomName ?? warehouseMatch?.uomName ?? '',
        };
      }),
    [lines, materialWarehouseBalances],
  );

  const submitValidation = useMemo(
    () =>
      validateIssueDraft({
        facilityId,
        issuePurpose,
        usageTargetType,
        usageZone,
        usageHouseId,
        lines: lineValidationInputs,
        submittedLineValidationError,
      }),
    [facilityId, issuePurpose, lineValidationInputs, submittedLineValidationError, usageHouseId, usageTargetType, usageZone],
  );

  const availableStockCount = useMemo(
    () =>
      itemOptions.reduce(
        (sum, balance) => sum + Number(balance.availableQuantity ?? balance.quantity ?? 0),
        0,
      ),
    [itemOptions],
  );

  useEffect(() => {
    if (!draftLine.itemId) return;

    const hasSelectedLot =
      draftLine.stockLotId !== '' &&
      lotOptions.some((balance) => balance.stockLotId != null && Number(balance.stockLotId) === Number(draftLine.stockLotId));

    if (hasSelectedLot) return;

    const firstSelectableLot = lotOptions.find((balance) => balance.stockLotId != null);

    setDraftLine((current) => ({
      ...current,
      stockLotId: firstSelectableLot?.stockLotId != null ? Number(firstSelectableLot.stockLotId) : '',
    }));
  }, [draftLine.itemId, draftLine.stockLotId, lotOptions]);

  const handleAddLine = () => {
    const quantityError = validatePositiveStockNumber(draftLine.quantity, 'จำนวน');
    if (quantityError) {
      setError(quantityError);
      return;
    }

    const parsedQuantity = parseStockNumber(draftLine.quantity);
    if (!draftLine.itemId || !draftLine.warehouseId || !draftLine.stockLotId || parsedQuantity == null) return;
    if (draftNeedsFeedSiloButUnavailable) return;
    if (draftNeedsFeedSiloSelection && draftLine.feedSiloId === '') return;
    const matchedBalance = selectedBalance;
    if (!matchedBalance) return;

    setLines((current) => [
      ...current,
      {
        itemId: Number(draftLine.itemId),
        warehouseId: Number(draftLine.warehouseId),
        stockLotId: Number(draftLine.stockLotId),
        feedSiloId: draftLine.feedSiloId === '' ? undefined : Number(draftLine.feedSiloId),
        uomId: matchedBalance.uomId,
        quantity: parsedQuantity,
      },
    ]);
    setError(null);
    setDraftLine((current) => ({
      ...current,
      itemId: '',
      feedSiloId: '',
      stockLotId: '',
      quantity: '',
    }));
  };

  const handleSubmit = async () => {
    if (!submitValidation.isValid) return;
    await onSubmit({
      requestDate: new Date(requestDate).toISOString(),
      facilityId: Number(facilityId),
      issuePurpose,
      usageTargetType,
      usageZone,
      usageHouseId: usageHouseId ? Number(usageHouseId) : null,
      referenceDetail,
      remarks,
      lines,
    });
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="lg">
      <DialogTitleWithClose
        onClose={onClose}
        disabled={loading}
        sx={getStockDialogTitleSx(theme)}
      >
        สร้างใบขอตัดสต๊อก
      </DialogTitleWithClose>
      <DialogContent
        dividers
        sx={{
          '& .MuiTextField-root .MuiOutlinedInput-root': {
            minHeight: 40,
            height: 40,
          },
          '& .MuiTextField-root .MuiOutlinedInput-input': {
            py: '8px',
            fontSize: '0.92rem',
          },
          '& .MuiFormControl-root .MuiOutlinedInput-root': {
            minHeight: 40,
            height: 40,
          },
          '& .MuiFormControl-root .MuiSelect-select': {
            py: '8px',
            minHeight: 'unset',
            display: 'flex',
            alignItems: 'center',
          },
          '& .MuiTextField-root .MuiOutlinedInput-root.MuiInputBase-multiline': {
            height: 'auto',
            minHeight: 96,
          },
          '& .MuiTextField-root .MuiOutlinedInput-root.MuiInputBase-multiline textarea': {
            py: '10px',
          },
        }}
      >
        <Stack spacing={2}>
          {error ? <Alert severity="error">{error}</Alert> : null}
          {!options && (
            <Alert severity="warning">
              กำลังโหลดข้อมูลสำหรับสร้างใบขอตัดสต๊อก...
            </Alert>
          )}
          {draftLine.warehouseId && itemOptions.length === 0 ? (
            <Alert severity="info">
              คลังต้นทางนี้ยังไม่มีสินค้าในคลังวัสดุที่พร้อมใช้สำหรับสร้างใบขอตัด
            </Alert>
          ) : null}
          {draftNeedsFeedSiloButUnavailable ? (
            <Alert severity="warning">
              สินค้านี้ต้องเลือกไซโล แต่ไม่พบไซโลที่ใช้งานได้ในคลังต้นทางนี้
            </Alert>
          ) : null}
          {submittedLineValidationError ? (
            <Alert severity="error">
              {submittedLineValidationError}
            </Alert>
          ) : null}

          <Box
            component="fieldset"
            sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 10, p: 1.5, minWidth: 0 }}
          >
            <Typography component="legend" sx={{ px: 1, fontSize: '0.95rem', fontWeight: 700 }}>
              ข้อมูลใบขอตัด
            </Typography>
            <Stack spacing={1.5}>
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: { xs: '1fr', md: '1fr 1fr 1fr' },
                  gap: 1.5,
                }}
              >
                <TextField
                  label="วันที่ขอ"
                  type="datetime-local"
                  value={requestDate}
                  onChange={(event) => setRequestDate(event.target.value)}
                  InputLabelProps={{ shrink: true }}
                  fullWidth
                />
                <FormControl fullWidth>
                  <InputLabel>ฟาร์ม</InputLabel>
                  <Select value={facilityId} label="ฟาร์ม" onChange={(event) => setFacilityId(event.target.value as number)}>
                    {availableFacilities.map((facility) => (
                      <MenuItem key={facility.id} value={facility.id}>
                        {facility.code} - {facility.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <FormControl fullWidth>
                  <InputLabel>ปลายทางการใช้</InputLabel>
                  <Select value={usageTargetType} label="ปลายทางการใช้" onChange={(event) => setUsageTargetType(String(event.target.value))}>
                    <MenuItem value="Production">Production</MenuItem>
                    <MenuItem value="Maintenance">Maintenance</MenuItem>
                    <MenuItem value="Vaccine">Vaccine</MenuItem>
                  </Select>
                </FormControl>
              </Box>

              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: { xs: '1fr', md: '1fr 1fr 1fr' },
                  gap: 1.5,
                }}
              >
              <TextField
                label="วัตถุประสงค์การใช้"
                value={issuePurpose}
                onChange={(event) => setIssuePurpose(event.target.value)}
                fullWidth
                disabled
              />
                <FormControl fullWidth>
                  <InputLabel>โซน</InputLabel>
                  <Select
                    value={usageZone}
                    label="โซน"
                    onChange={(event) => setUsageZone(String(event.target.value))}
                    disabled={zoneOptions.length === 0}
                  >
                    <MenuItem value="">ทุกโซน</MenuItem>
                    {zoneOptions.map((zone) => (
                      <MenuItem key={zone} value={zone}>
                        {zone}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <FormControl fullWidth>
                  <InputLabel>โรงเรือน</InputLabel>
                  <Select
                    value={usageHouseId}
                    label="โรงเรือน"
                    onChange={(event) => setUsageHouseId(event.target.value as number)}
                    disabled={houseOptions.length === 0}
                  >
                    {houseOptions.map((house) => (
                      <MenuItem key={house.id} value={house.id}>
                        {formatCodeNameLabel(house.houseCode, house.houseName)}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Box>

              <TextField
                label="รายละเอียดอ้างอิง"
                value={referenceDetail}
                onChange={(event) => setReferenceDetail(event.target.value)}
                fullWidth
              />
              <TextField
                label="หมายเหตุ"
                value={remarks}
                onChange={(event) => setRemarks(event.target.value)}
                fullWidth
                multiline
                minRows={3}
              />
            </Stack>
          </Box>

          <Box
            component="fieldset"
            sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 10, p: 1.5, minWidth: 0 }}
          >
            <Typography component="legend" sx={{ px: 1, fontSize: '0.95rem', fontWeight: 700 }}>
              รายการสินค้า
            </Typography>
            <Box
              sx={{
                display: 'grid',
                gap: 1.5,
                gridTemplateColumns: { xs: '1fr', md: '1.6fr 180px 1fr' },
              }}
            >
              <FormControl fullWidth>
                <InputLabel>สินค้า</InputLabel>
                <Select
                  value={draftLine.itemId}
                  label="สินค้า"
                  onChange={(event) =>
                    setDraftLine((current) => ({
                      ...current,
                      itemId: event.target.value as number,
                      feedSiloId: '',
                      stockLotId: '',
                      quantity: '',
                    }))}
                  disabled={!draftLine.warehouseId}
                >
                  {itemOptions.map((balance) => (
                    <MenuItem key={Number(balance.itemId)} value={Number(balance.itemId)}>
                      {balance.itemCode} - {balance.itemName} (คงเหลือ {formatNumber(balance.availableQuantity ?? balance.quantity)} {balance.uomName})
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <TextField
                label="หน่วยนับ"
                value={selectedItemBalance?.uomName ?? ''}
                disabled
                fullWidth
              />

              <FormControl fullWidth>
                <InputLabel>คลังต้นทาง</InputLabel>
                <Select
                  value={draftLine.warehouseId}
                  label="คลังต้นทาง"
                  onChange={(event) => {
                    const nextWarehouseId = event.target.value === '' ? '' : Number(event.target.value);
                    setDraftLine({
                      warehouseId: nextWarehouseId,
                      itemId: '',
                      feedSiloId: '',
                      stockLotId: '',
                      quantity: '',
                    });
                  }}
                >
                  {availableWarehouses.map((warehouse) => (
                    <MenuItem key={warehouse.id} value={warehouse.id}>
                      {warehouse.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

                <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: { xs: '1fr', md: draftNeedsFeedSiloSelection ? '140px 220px 1fr auto' : '140px 1fr auto' },
                  gap: 1.5,
                  gridColumn: { md: 'span 3' },
                  alignItems: 'start',
                }}
              >
                <TextField
                  label="จำนวน"
                  value={draftLine.quantity}
                  onChange={(event) => setDraftLine((current) => ({ ...current, quantity: event.target.value }))}
                  InputProps={{ sx: { '& input': { textAlign: 'right' } } }}
                  fullWidth
                />
                {draftNeedsFeedSiloSelection ? (
                  <FormControl fullWidth>
                    <InputLabel>ไซโล</InputLabel>
                    <Select
                      value={draftLine.feedSiloId}
                      label="ไซโล"
                      onChange={(event) => setDraftLine((current) => ({ ...current, feedSiloId: event.target.value as number, stockLotId: '' }))}
                      disabled={!draftLine.itemId}
                    >
                      <MenuItem value="">เลือกไซโล</MenuItem>
                      {draftFeedSiloOptions.map((silo) => (
                        <MenuItem key={silo.id} value={silo.id}>
                          {silo.label}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                ) : null}

                <FormControl fullWidth>
                  <InputLabel>Lot</InputLabel>
                  <Select
                    value={draftLine.stockLotId}
                    label="Lot"
                    onChange={(event) => setDraftLine((current) => ({ ...current, stockLotId: event.target.value as number }))}
                    disabled={!draftLine.itemId || draftNeedsFeedSiloButUnavailable || (draftNeedsFeedSiloSelection && draftLine.feedSiloId === '')}
                    renderValue={(selected) => {
                      const lot = lotOptions.find((balance) => Number(balance.stockLotId) === Number(selected));
                      return renderLotSelectedValue(lot, 'ไม่ระบุ');
                    }}
                    MenuProps={{
                      PaperProps: {
                        sx: {
                          minWidth: 560,
                          maxWidth: 'calc(100vw - 80px)',
                          },
                        },
                      }}
                    >
                    {lotOptions.map((balance) => (
                      <MenuItem key={`${balance.itemId}-${balance.stockLotId}-${balance.feedSiloId ?? 0}`} value={balance.stockLotId}>
                        {renderLotMenuContent(balance)}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <StockActionButton tone="success" size="small" startIcon={<AddIcon />} onClick={handleAddLine} disabled={!selectedBalance || !draftLine.quantity || draftNeedsFeedSiloButUnavailable || (draftNeedsFeedSiloSelection && draftLine.feedSiloId === '')}>
                  เพิ่มรายการ
                </StockActionButton>
              </Box>
            </Box>

            {selectedBalance ? (
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1.25 }}>
                คงเหลือสูงสุด {formatNumber(selectedBalance.availableQuantity ?? selectedBalance.quantity)} {selectedBalance.uomName}
                {selectedItemBalance?.itemLotPolicyName ? ` • นโยบาย ${selectedItemBalance.itemLotPolicyName}` : ''}
                {` • เรียง lot ตาม ${selectedItemLotStrategy}`}
              </Typography>
            ) : draftLine.warehouseId ? (
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1.25 }}>
                คลังที่เลือกมีของพร้อมใช้รวม {formatNumber(availableStockCount)}
              </Typography>
            ) : null}

            <TableContainer
              sx={{
                mt: 1.5,
                maxHeight: PR_DIALOG_TABLE_HEIGHT,
                height: PR_DIALOG_TABLE_HEIGHT,
                overflowY: 'auto',
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 10,
              }}
            >
              <Table
                size="small"
                stickyHeader
                sx={{
                  ...getStockDialogTableSx(theme),
                  '& .MuiTableCell-head': {
                    ...getStockDialogTableSx(theme)['& .MuiTableCell-head'],
                    height: 44,
                    py: 0.5,
                    whiteSpace: 'nowrap',
                    textAlign: 'center',
                    verticalAlign: 'middle',
                  },
                  '& .MuiTableBody-root .MuiTableCell-root': {
                    verticalAlign: 'top',
                    py: 1,
                  },
                }}
              >
                <TableHead>
                  <TableRow>
                    <TableCell width={56}>#</TableCell>
                    <TableCell>สินค้า</TableCell>
                    <TableCell>คลังต้นทาง</TableCell>
                    <TableCell>ไซโล</TableCell>
                    <TableCell>Lot</TableCell>
                    <TableCell align="right" width={140}>จำนวน</TableCell>
                    <TableCell align="center" width={96}>จัดการ</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {lines.length === 0 ? (
                    <TableRow>
                        <TableCell colSpan={7} align="center">
                          ยังไม่มีรายการขอ
                        </TableCell>
                    </TableRow>
                  ) : (
                    lines.map((line, index) => {
                      const matchedLot = warehouseBalances.find((balance) =>
                        balance.itemId === line.itemId &&
                        balance.stockLotId === line.stockLotId &&
                        (balance.feedSiloId ?? null) === (line.feedSiloId ?? null) &&
                        balance.warehouseId === line.warehouseId);
                      const matchedBaseBalance = matchedLot ?? warehouseBalances.find((balance) =>
                        balance.itemId === line.itemId &&
                        balance.warehouseId === line.warehouseId);
                      const displayItemName = matchedBaseBalance?.itemName ?? String(line.itemId);
                      const displayWarehouseName = matchedBaseBalance?.warehouseName ?? String(line.warehouseId);
                      const displayUomName = matchedBaseBalance?.uomName ?? '';

                      return (
                        <TableRow key={`${line.itemId}-${line.stockLotId}-${line.feedSiloId ?? 0}-${index}`}>
                          <TableCell>{index + 1}</TableCell>
                        <TableCell>{displayItemName}</TableCell>
                          <TableCell>{displayWarehouseName}</TableCell>
                          <TableCell>{matchedLot?.feedSiloName ? getFeedSiloDisplayLabel(matchedLot.feedSiloName, matchedLot.feedSiloCode) : '-'}</TableCell>
                          <TableCell>{matchedLot?.lotNumber ?? '-'}</TableCell>
                          <TableCell align="right">
                            {formatNumber(line.quantity)} {displayUomName}
                          </TableCell>
                          <TableCell align="center">
                            <StockActionButton tone="danger" size="small" onClick={() => setLines((current) => current.filter((_, currentIndex) => currentIndex !== index))}>
                              ลบ
                            </StockActionButton>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 2 }}>
        <StockActionButton tone="neutral" onClick={onClose} disabled={loading}>ยกเลิก</StockActionButton>
        <StockActionButton
          tone="primary"
          onClick={() => void handleSubmit()}
          disabled={loading || !submitValidation.isValid}
        >
          บันทึกใบขอตัดสต๊อก
        </StockActionButton>
      </DialogActions>
    </Dialog>
  );
}
