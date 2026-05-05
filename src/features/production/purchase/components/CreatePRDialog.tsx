'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Chip,
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
import { 
  Add as AddIcon, 
  Delete as DeleteIcon, 
  CheckCircle as CheckCircleIcon 
} from '@mui/icons-material';
import { DownloadCloud } from 'lucide-react';
import { AxiosError } from 'axios';
import { URGENCY_LABELS_THAI } from '@/lib/constants/status-labels';
import Swal from 'sweetalert2';
import { DialogTitleWithClose, JBFarmTable, JBFarmTableColumn } from '@/components/common';
import { authService } from '@/features/auth/services/auth.service';
import { formatUserDisplayName } from '@/lib/user-display';
import { formatCurrency } from '@/lib/utils/format.util';
import { purchaseService } from '../services/purchase.service';
import { stockService } from '@/features/production/stock/services/stock.service';
import { stockReplenishmentService } from '@/features/warehouse/stock-replenishment/services/stock-replenishment.service';
import { PURCHASE_REQUEST_SOURCE, PurchaseRequestType, type PurchaseRequestSource, UrgencyLevel } from '../types';
import { PR_DIALOG_TABLE_HEIGHT } from '@/core/ui-patterns/pr-ui.constants';
import { getCurrentFacilityCode } from '@/lib/facility-context';
import {
  PURCHASE_DIALOG_ACTIONS_SX,
  PURCHASE_DIALOG_CONTENT_SX,
  PURCHASE_DIALOG_ERROR_ALERT_SX,
  PURCHASE_DIALOG_FIELDSET_SX,
  PURCHASE_DIALOG_PRIMARY_BUTTON_SX,
  PURCHASE_DIALOG_LEGEND_SX,
  PURCHASE_DIALOG_PAPER_SX,
  PURCHASE_DIALOG_SECONDARY_BUTTON_SX,
  PURCHASE_DIALOG_TABLE_SX,
  PURCHASE_DIALOG_TITLE_SX,
} from './purchase-dialog.constants';
import type {
  CreatePurchaseRequest,
  PurchaseRequestResponse,
  PurchaseRequestCreateOptionsResponse,
  PurchaseRequestItemOption,
  CentralWarehouseItemOption,
} from '../types';
import type { StockBalanceResponse } from '@/features/production/stock/types';

type CreatePRDialogProps = {
  open: boolean;
  onClose: () => void;
  onCreated: () => Promise<void> | void;
  currentFacilityId?: number | null;
  initialRequest?: PurchaseRequestResponse | null;
  mode?: 'create' | 'edit';
  requestType?: PurchaseRequestType;
};

type DraftLine = {
  itemId: number;
  uomId: number;
  quantity: number;
  requestedQuantity?: number;
  unitPrice: number;
  estimatedPrice: number;
  remarks: string;
  requestSource: PurchaseRequestSource;
};

function createEmptyLine(): DraftLine {
  return {
    itemId: 0,
    uomId: 0,
    quantity: 1,
    unitPrice: 0,
    estimatedPrice: 0,
    remarks: '',
    requestSource: PURCHASE_REQUEST_SOURCE.ExternalPurchase,
  };
}

function resolveLineSource(
  itemId: number,
  facilityIsCentralHub: boolean,
  centralCatalogByItemId: Map<number, CentralWarehouseItemOption>,
  requestType: PurchaseRequestType,
): PurchaseRequestSource {
  if (requestType === PurchaseRequestType.Pig || facilityIsCentralHub || itemId <= 0) {
    return PURCHASE_REQUEST_SOURCE.ExternalPurchase;
  }

  const centralConfig = centralCatalogByItemId.get(itemId);
  if (!centralConfig) {
    return PURCHASE_REQUEST_SOURCE.ExternalPurchase;
  }

  return PURCHASE_REQUEST_SOURCE.CentralBooking;
}

function parseNumericInput(value: string): number | null {
  if (!/^\d*\.?\d*$/.test(value)) return null;
  if (value.trim() === '') return 0;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function formatNumber(value: number): string {
  return new Intl.NumberFormat('th-TH', { 
    minimumFractionDigits: 0, 
    maximumFractionDigits: 4 
  }).format(value);
}

const tableSx = {
  '& .MuiTableCell-head': {
    bgcolor: '#1a5c50 !important',
    color: '#fff !important',
    fontWeight: 900,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  '& .MuiTableCell-body': {
    borderColor: '#E5EEE8',
  },
} as const;

// Global memory to persist central items across scope changes and component remounts
const globalKnownCentralItemIds = new Set<number>();

export function CreatePRDialog({
  open,
  onClose,
  onCreated,
  currentFacilityId,
  initialRequest = null,
  mode = 'create',
  requestType = PurchaseRequestType.Material,
}: CreatePRDialogProps) {
  const [options, setOptions] = useState<PurchaseRequestCreateOptionsResponse>({
    departments: [],
    facilities: [],
    warehouses: [],
    items: [],
    pigItems: [],
    pigItemCategories: [],
    breeds: [],
    uoms: [],
    centralWarehouseItems: [],
  });
  const [optionsLoading, setOptionsLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [facilityId, setFacilityId] = useState<number>(0);
  const [destinationWarehouseId, setDestinationWarehouseId] = useState<number>(0);
  const [roleCode, setRoleCode] = useState('');
  const [urgency, setUrgency] = useState<UrgencyLevel>(UrgencyLevel.Normal);
  const [remarks, setRemarks] = useState('');
  const [lines, setLines] = useState<DraftLine[]>([]);
  const [draftLine, setDraftLine] = useState<DraftLine>(createEmptyLine());
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [stockAvailabilityByItemId, setStockAvailabilityByItemId] = useState<Map<number, number>>(new Map());
  const [knownCentralItemIds, setKnownCentralItemIds] = useState<number[]>(Array.from(globalKnownCentralItemIds));
  const [hasLoadedRequests, setHasLoadedRequests] = useState(false);
  const [stockReplenishmentRequestIds, setStockReplenishmentRequestIds] = useState<number[]>([]);
  const [stockReplenishmentSourceDocs, setStockReplenishmentSourceDocs] = useState<string[]>([]);

  const grandTotal = useMemo(() => {
    return lines.reduce((sum, line) => sum + (Number(line.estimatedPrice) || 0), 0);
  }, [lines]);
  const isEditMode = mode === 'edit';
  const currentUser = authService.getUser();
  const requesterName = formatUserDisplayName(currentUser);
  const resolvedRequestType = useMemo<PurchaseRequestType>(() => {
    if (isEditMode && initialRequest?.requestType) {
      return initialRequest.requestType;
    }
    return requestType;
  }, [initialRequest?.requestType, isEditMode, requestType]);

  // Initial load when dialog opens
  useEffect(() => {
    if (!open) return;
    let active = true;

    const loadInitialState = async () => {
      try {
        setOptionsLoading(true);
        // 1. Load initial options for current context
        const result = await purchaseService.getCreateOptions({
          facilityId: currentFacilityId ?? undefined,
          facilityCode: getCurrentFacilityCode() ?? undefined,
        });
        if (!active) return;
        
        // 2. Setup facilities first
        const availableFacs = result.facilities ?? [];
        if (availableFacs.length > 0 && facilityId === 0) {
          const hasCurrent = Boolean(
            currentFacilityId &&
            availableFacs.some((f) => f.id === currentFacilityId)
          );
          const initialFacId = hasCurrent && currentFacilityId ? currentFacilityId : availableFacs[0].id;
          setFacilityId(initialFacId);
        }

        // 3. MASTER DISCOVERY: Find the Central Hub and fetch its options to know ALL central items
        const centralHub = availableFacs.find(f => f.isCentralHub);
        if (centralHub) {
          // Fetch Hub options in background to get the full central warehouse items list
          void purchaseService.getCreateOptions({ facilityId: centralHub.id }).then(hubResult => {
            if (!active) return;
            if (hubResult.centralWarehouseItems?.length > 0) {
              let changed = false;
              hubResult.centralWarehouseItems.forEach(item => {
                const id = Number(item.itemId);
                if (!globalKnownCentralItemIds.has(id)) {
                  globalKnownCentralItemIds.add(id);
                  changed = true;
                }
              });
              if (changed) {
                setKnownCentralItemIds(Array.from(globalKnownCentralItemIds));
              }
            }
          });
        }
      } catch (err) {
        console.error("Failed to load initial PR options", err);
      } finally {
        if (active) setOptionsLoading(false);
      }
    };

    void loadInitialState();
    return () => { active = false; };
  }, [open, currentFacilityId]);

  // Reload facility-specific options when facilityId changes
  useEffect(() => {
    if (!open || facilityId === 0) return;
    let active = true;

    const loadFacilityOptions = async () => {
      try {
        setOptionsLoading(true);
        setError(null);
        const result = await purchaseService.getCreateOptions({
          facilityId: facilityId,
        });
        if (!active) return;

        const safeOptions: PurchaseRequestCreateOptionsResponse = {
          ...result,
          items: (result.items ?? []).map((item) => ({
            ...item,
            allowedUoms: item.allowedUoms ?? [],
          })),
          pigItems: (result.pigItems ?? []).map((item) => ({
            ...item,
            allowedUoms: item.allowedUoms ?? [],
          })),
          pigItemCategories: result.pigItemCategories ?? [],
          breeds: result.breeds ?? [],
          uoms: result.uoms ?? [],
          facilities: result.facilities ?? [],
          warehouses: result.warehouses ?? [],
          departments: result.departments ?? [],
          centralWarehouseItems: result.centralWarehouseItems ?? [],
        };
        setOptions(safeOptions);

        if (isEditMode && initialRequest && options.items.length === 0) {
          const existingLines = Array.isArray(initialRequest.lines) ? initialRequest.lines : [];
          setRoleCode(initialRequest.department || (currentUser?.roleCodes?.[0] ?? ''));
          setDestinationWarehouseId(initialRequest.destinationWarehouseId ?? 0);
          setUrgency(initialRequest.urgency as UrgencyLevel);
          setRemarks(initialRequest.remarks || '');
          setLines(
            existingLines.map((line) => {
              const qty = Number(line.quantity);
              const estPrice = Number(line.estimatedPrice);
              return {
                itemId: Number(line.pigItemId ?? line.itemId),
                uomId: line.uomId,
                quantity: qty,
                estimatedPrice: estPrice,
                unitPrice: qty > 0 ? estPrice / qty : estPrice,
                remarks: (line.remarks || '').trim(),
                requestSource: line.requestSource,
              };
            }),
          );
        } else if (!isEditMode) {
          if (safeOptions.departments.length > 0 && !roleCode) {
            setRoleCode(safeOptions.departments[0].departmentCode);
          }
        }
      } catch (err) {
        const axiosError = err as AxiosError<{ message?: string }>;
        if (!active) return;
        setError(axiosError.response?.data?.message ?? 'ไม่สามารถโหลดข้อมูลสำหรับสร้างใบขอซื้อได้');
      } finally {
        if (active) setOptionsLoading(false);
      }
    };
    
    // Auto-fill role if not set
    if (open && !roleCode && currentUser?.roleCodes?.length) {
      setRoleCode(currentUser.roleCodes[0]);
    }
    
    void loadFacilityOptions();
    return () => {
      active = false;
    };
  }, [open, facilityId, isEditMode, initialRequest]);

  const pigItemOptions = useMemo(() => {
    return options.pigItems ?? [];
  }, [options.pigItems]);
  const activeItemOptions = useMemo(
    () => (resolvedRequestType === PurchaseRequestType.Pig ? pigItemOptions : (options.items ?? [])),
    [options.items, pigItemOptions, resolvedRequestType],
  );
  const itemMap = useMemo(
    () => new Map<number, PurchaseRequestItemOption>(activeItemOptions.map((item) => [item.id, item])),
    [activeItemOptions],
  );
  const itemUomMap = useMemo(() => {
    const next = new Map<number, Map<number, string>>();
    activeItemOptions.forEach((item) => {
      const uomNameById = new Map<number, string>();
      (item.allowedUoms ?? []).forEach((uom) => {
        uomNameById.set(Number(uom.id), uom.name);
      });
      if (!uomNameById.has(item.baseUomId) && item.baseUomId > 0 && item.baseUomName) {
        uomNameById.set(item.baseUomId, item.baseUomName);
      }
      next.set(item.id, uomNameById);
    });
    return next;
  }, [activeItemOptions]);
  const pigDefaultItem = useMemo(
    () => pigItemOptions.find((item) => item.code === 'PIG001') ?? pigItemOptions[0] ?? null,
    [pigItemOptions],
  );
  const headUom = useMemo(
    () => (options.uoms ?? []).find((uom) => uom.name === 'ตัว' || uom.code === 'ตัว') ?? null,
    [options.uoms],
  );
  const availableFacilities = useMemo(
    () =>
      currentFacilityId
        ? (options.facilities ?? []).filter((facility) => facility.id === currentFacilityId)
        : (options.facilities ?? []),
    [options.facilities, currentFacilityId],
  );
  const availableWarehouses = useMemo(
    () =>
      (options.warehouses ?? []).filter((warehouse) =>
        warehouse.facilityNodeId === facilityId &&
        (warehouse.warehouseType === 'Farm' || warehouse.warehouseType === 'Central' || warehouse.isCentralHub),
      ),
    [facilityId, options.warehouses],
  );
  const currentFacility = useMemo(
    () => availableFacilities.find((facility) => facility.id === facilityId) ?? null,
    [availableFacilities, facilityId],
  );
  const facilityIsCentralHub = Boolean(currentFacility?.isCentralHub);
  const centralCatalogByItemId = useMemo(
    () => {
      const next = new Map<number, CentralWarehouseItemOption>();
      (options.centralWarehouseItems ?? [])
        .filter((row) => row.isCenterItem)
        .sort((left, right) => left.warehouseId - right.warehouseId || left.itemId - right.itemId)
        .forEach((row) => {
          if (!next.has(row.itemId)) {
            next.set(row.itemId, row);
          }
        });

      return next;
    },
    [options.centralWarehouseItems],
  );
  const centralCatalogRowByItemId = useMemo(
    () => {
      const next = new Map<number, CentralWarehouseItemOption>();
      (options.centralWarehouseItems ?? [])
        .filter((row) => row.isCenterItem)
        .forEach((row) => {
          if (!next.has(row.itemId)) {
            next.set(row.itemId, row);
          }
        });
      return next;
    },
    [options.centralWarehouseItems],
  );

  // Persistent Discovery: Remember central items globally across scope changes
  useEffect(() => {
    if (options.centralWarehouseItems && options.centralWarehouseItems.length > 0) {
      let changed = false;
      options.centralWarehouseItems.forEach(item => {
        const id = Number(item.itemId);
        if (!globalKnownCentralItemIds.has(id)) {
          globalKnownCentralItemIds.add(id);
          changed = true;
        }
      });
      
      if (changed) {
        setKnownCentralItemIds(Array.from(globalKnownCentralItemIds));
      }
    }
  }, [options.centralWarehouseItems]);
  const draftUomOptions = useMemo(() => {
    if (resolvedRequestType === PurchaseRequestType.Pig) {
      return headUom ? [headUom] : [];
    }

    const selectedItem = itemMap.get(Number(draftLine.itemId));
    if (!selectedItem) {
      return [];
    }

    const allowedUoms = selectedItem.allowedUoms ?? [];
    if (allowedUoms.length > 0) {
      return allowedUoms;
    }

    if (selectedItem.baseUomId > 0 && selectedItem.baseUomName) {
      return [{
        id: selectedItem.baseUomId,
        code: '',
        name: selectedItem.baseUomName,
      }];
    }

    return [];
  }, [draftLine.itemId, headUom, itemMap, resolvedRequestType]);

  useEffect(() => {
    const applyRouting = (line: DraftLine): DraftLine => {
      const requestSource = resolveLineSource(Number(line.itemId), facilityIsCentralHub, centralCatalogByItemId, resolvedRequestType);
      return {
        ...line,
        requestSource,
      };
    };

    setDraftLine((current) => applyRouting(current));
    setLines((current) => current.map((line) => applyRouting(line)));
  }, [centralCatalogByItemId, facilityIsCentralHub, resolvedRequestType]);

  const canCreate = useMemo(() => {
    const baseReady =
      availableFacilities.length > 0 &&
      availableWarehouses.length > 0;

    if (resolvedRequestType === PurchaseRequestType.Pig) {
      return baseReady && pigItemOptions.length > 0 && Boolean(headUom) && options.uoms.length > 0;
    }

    return baseReady && activeItemOptions.some((item) => (item.allowedUoms?.length ?? 0) > 0 || item.baseUomId > 0);
  }, [
    activeItemOptions,
    availableFacilities.length,
    availableWarehouses.length,
    headUom,
    pigItemOptions.length,
    options.uoms.length,
    resolvedRequestType,
  ]);

  const missingRequirements = useMemo(() => {
    const missing: string[] = [];
    if (availableFacilities.length === 0) missing.push('สถานที่');
    if (availableWarehouses.length === 0) missing.push('คลังปลายทาง');

    if (resolvedRequestType === PurchaseRequestType.Pig) {
      if (options.uoms.length === 0) missing.push('หน่วยนับ');
      if (pigItemOptions.length === 0) missing.push('รายการสุกร');
      if (!headUom) missing.push('หน่วยตัว');
    } else {
      if (activeItemOptions.length === 0) missing.push('สินค้า');
      if (!activeItemOptions.some((item) => (item.allowedUoms?.length ?? 0) > 0 || item.baseUomId > 0)) {
        missing.push('หน่วยที่ผูกกับสินค้า');
      }
    }

    return missing;
  }, [
    activeItemOptions.length,
    pigItemOptions.length,
    availableFacilities.length,
    availableWarehouses.length,
    headUom,
    options.uoms.length,
    resolvedRequestType,
  ]);

  const resetForm = () => {
    setFacilityId(0);
    setDestinationWarehouseId(0);
    setUrgency(UrgencyLevel.Normal);
    setRoleCode('');
    setRemarks('');
    setLines([]);
    setHasLoadedRequests(false);
    setStockReplenishmentRequestIds([]);
    setStockReplenishmentSourceDocs([]);
    setDraftLine(createEmptyLine());
    setEditingIndex(null);
    setError(null);
  };

  const handleClose = () => {
    if (saving) return;
    resetForm();
    onClose();
  };

  const updateDraftLine = useCallback((patch: Partial<DraftLine>) => {
    setDraftLine((current) => {
      const next = { ...current, ...patch };
      
      // เมื่อมีการเลือกสินค้าใหม่
      if (Object.prototype.hasOwnProperty.call(patch, 'itemId')) {
        const selectedItem = itemMap.get(Number(next.itemId));
        if (selectedItem) {
          const defaultMaterialUomId = Number(
            selectedItem.allowedUoms?.[0]?.id ??
            selectedItem.baseUomId ??
            0,
          );
          next.uomId = resolvedRequestType === PurchaseRequestType.Pig
            ? Number(headUom?.id ?? selectedItem.baseUomId)
            : defaultMaterialUomId;
          
          // ดึงราคาจาก Master (Unit Price)
          next.unitPrice = Number(selectedItem.cost ?? 0);
          // คำนวณราคารวม (Total Price)
          next.estimatedPrice = next.unitPrice * next.quantity;
        }

        next.requestSource = resolveLineSource(
          Number(next.itemId),
          facilityIsCentralHub,
          centralCatalogByItemId,
          resolvedRequestType,
        );
      } 
      // เมื่อมีการแก้ไข "จำนวน"
      else if (Object.prototype.hasOwnProperty.call(patch, 'quantity')) {
        next.estimatedPrice = next.unitPrice * next.quantity;
      }
      // เมื่อมีการแก้ไข "ราคาประมาณ" (ราคารวม) ด้วยตัวเอง
      else if (Object.prototype.hasOwnProperty.call(patch, 'estimatedPrice')) {
        // อัปเดต Unit Price แฝง (Implied Unit Price) เพื่อใช้คำนวณต่อเมื่อเปลี่ยนจำนวน
        if (next.quantity > 0) {
          next.unitPrice = next.estimatedPrice / next.quantity;
        }
      }
      
      return next;
    });
  }, [centralCatalogByItemId, facilityIsCentralHub, headUom?.id, itemMap, resolvedRequestType]);

  useEffect(() => {
    if (availableWarehouses.length === 0) {
      setDestinationWarehouseId(0);
      return;
    }

    const hasCurrentDestination = availableWarehouses.some(
      (warehouse) => warehouse.id === destinationWarehouseId,
    );
    if (hasCurrentDestination) {
      return;
    }

    const defaultWarehouse =
      availableWarehouses.find((warehouse) => warehouse.facilityNodeId === facilityId) ??
      availableWarehouses[0];
    setDestinationWarehouseId(defaultWarehouse?.id ?? 0);
  }, [availableWarehouses, destinationWarehouseId, facilityId]);

  useEffect(() => {
    if (resolvedRequestType === PurchaseRequestType.Pig) {
      setStockAvailabilityByItemId(new Map());
      return;
    }

    let active = true;
    const loadCentralStockAvailability = async () => {
      const entries = await Promise.all(
        Array.from(centralCatalogRowByItemId.values()).map(async (row) => {
          try {
            const balances = await stockService.getStockBalances(row.warehouseId, row.itemId, undefined, true);
            const totalAvailable = balances.items
              .filter((balance: StockBalanceResponse) => Number(balance.itemId) === row.itemId)
              .reduce((sum: number, balance: StockBalanceResponse) => {
                const available = Number(balance.availableQuantity ?? (Number(balance.quantity) - Number(balance.reservedQuantity ?? 0)));
                return sum + Math.max(0, available);
              }, 0);
            return [row.itemId, totalAvailable] as const;
          } catch {
            return [row.itemId, 0] as const;
          }
        }),
      );

      if (!active) return;
      setStockAvailabilityByItemId(new Map(entries));
    };

    void loadCentralStockAvailability();
    return () => {
      active = false;
    };
  }, [centralCatalogRowByItemId, resolvedRequestType]);

  useEffect(() => {
    if (resolvedRequestType !== PurchaseRequestType.Pig) return;
    if (!headUom) return;

    setDraftLine((current) => ({
      ...current,
      itemId: current.itemId > 0 ? current.itemId : Number(pigDefaultItem?.id ?? 0),
      uomId: headUom.id,
      estimatedPrice: current.estimatedPrice > 0 ? current.estimatedPrice : Number(pigDefaultItem?.cost ?? 0),
    }));
  }, [headUom, pigDefaultItem?.cost, pigDefaultItem?.id, resolvedRequestType]);

  const handleEditItem = (index: number) => {
    const line = lines[index];
    if (!line) return;
    setEditingIndex(index);
    
    // Recalculate price using master cost to prevent incorrect pricing when merging lines
    const selectedItem = itemMap.get(Number(line.itemId));
    const masterUnitPrice = selectedItem ? Number(selectedItem.cost ?? 0) : line.unitPrice;
    
    setDraftLine({ 
      ...line,
      unitPrice: masterUnitPrice,
      estimatedPrice: masterUnitPrice * line.quantity 
    });
    setError(null);
  };

  const handleCancelEdit = () => {
    setEditingIndex(null);
    setDraftLine({
      ...createEmptyLine(),
      itemId: resolvedRequestType === PurchaseRequestType.Pig ? Number(pigDefaultItem?.id ?? 0) : 0,
      uomId: resolvedRequestType === PurchaseRequestType.Pig ? Number(headUom?.id ?? 0) : 0,
      estimatedPrice: resolvedRequestType === PurchaseRequestType.Pig ? Number(pigDefaultItem?.cost ?? 0) : 0,
      quantity: 1,
    });
    setError(null);
  };

  const addLine = () => {
    const resolvedItemId = Number(draftLine.itemId);
    const resolvedUomId = resolvedRequestType === PurchaseRequestType.Pig
      ? Number(headUom?.id ?? draftLine.uomId)
      : Number(draftLine.uomId);
    const routedLine = resolveLineSource(resolvedItemId, facilityIsCentralHub, centralCatalogByItemId, resolvedRequestType);
    const nextLine: DraftLine = {
      itemId: resolvedItemId,
      uomId: resolvedUomId,
      quantity: Number(draftLine.quantity),
      requestedQuantity: draftLine.requestedQuantity,
      unitPrice: Number(draftLine.unitPrice),
      estimatedPrice: Number(draftLine.estimatedPrice),
      remarks: draftLine.remarks.trim(),
      requestSource: routedLine,
    };

    if (nextLine.itemId <= 0 || nextLine.uomId <= 0 || nextLine.quantity <= 0) {
      setError('กรุณาเลือกสินค้า หน่วย และจำนวนให้ถูกต้องก่อนบันทึก');
      return;
    }

    if (routedLine === PURCHASE_REQUEST_SOURCE.CentralBooking) {
      const availableQuantity = stockAvailabilityByItemId.get(resolvedItemId);
      if (typeof availableQuantity === 'number') {
        const existingQuantity = lines
          .filter((line, idx) => idx !== editingIndex && line.itemId === resolvedItemId && line.uomId === resolvedUomId)
          .reduce((sum, line) => sum + Number(line.quantity), 0);
        const nextTotalQuantity = existingQuantity + Number(draftLine.quantity);
        if (nextTotalQuantity > availableQuantity) {
          const item = itemMap.get(resolvedItemId);
          const errorMessage = `สินค้า ${item?.code ?? resolvedItemId} มีคงเหลือจองได้ ${formatNumber(availableQuantity)} ${item?.baseUomName ?? ''} แต่ยอดที่ขอรวม ${formatNumber(nextTotalQuantity)}`;
          setError(errorMessage);
          void Swal.fire({
            icon: 'error',
            title: 'บันทึกรายการไม่สำเร็จ',
            text: errorMessage,
          });
          return;
        }
      }
    }

    setError(null);
    if (editingIndex !== null) {
      // โหมดแก้ไข: อัพเดตแถวเดิม
      setLines((current) => current.map((line, idx) => (idx === editingIndex ? nextLine : line)));
      setEditingIndex(null);
    } else {
      // โหมดเพิ่มปกติ
      setLines((current) => {
        const existingIndex = current.findIndex(
          (line) =>
            line.itemId === nextLine.itemId &&
            line.uomId === nextLine.uomId,
        );

        if (existingIndex < 0) {
          return [...current, nextLine];
        }

        return current.map((line, index) => {
          if (index === existingIndex) {
            const newQuantity = Number(line.quantity) + nextLine.quantity;
            const selectedItem = itemMap.get(Number(line.itemId));
            const masterUnitPrice = selectedItem ? Number(selectedItem.cost ?? 0) : line.unitPrice;
            
            return {
              ...line,
              quantity: newQuantity,
              estimatedPrice: masterUnitPrice * newQuantity,
              unitPrice: masterUnitPrice,
              remarks: nextLine.remarks || line.remarks,
            };
          }
          return line;
        });
      });
    }

    setDraftLine(() => {
      const empty = createEmptyLine();
      return {
        ...empty,
        itemId: resolvedRequestType === PurchaseRequestType.Pig ? Number(pigDefaultItem?.id ?? 0) : 0,
        uomId: resolvedRequestType === PurchaseRequestType.Pig ? Number(headUom?.id ?? 0) : 0,
        estimatedPrice: resolvedRequestType === PurchaseRequestType.Pig ? Number(pigDefaultItem?.cost ?? 0) : 0,
        quantity: 1,
      };
    });
  };
  
  const handleLoadRequests = async () => {
    try {
      setSaving(true);
      setError(null);
      const preview = await stockReplenishmentService.previewPurchaseRequest({
        targetWarehouseId: destinationWarehouseId || undefined,
      });

      if (preview.lines.length === 0) {
        setError('ยังไม่มีใบแจ้งเติมสต็อกที่อนุมัติแล้วสำหรับรวมยอดเป็น PR');
        return;
      }

      setOptions((current) => {
        const existingItemIds = new Set((current.items ?? []).map((item) => Number(item.id)));
        const existingUomIds = new Set((current.uoms ?? []).map((uom) => Number(uom.id)));
        const hasPreviewFacility = (current.facilities ?? []).some((facility) => Number(facility.id) === Number(preview.targetFacilityId));
        const hasPreviewWarehouse = (current.warehouses ?? []).some((warehouse) => Number(warehouse.id) === Number(preview.targetWarehouseId));
        const previewItems = preview.lines
          .filter((line) => !existingItemIds.has(Number(line.itemId)))
          .map((line) => ({
            id: Number(line.itemId),
            code: line.itemCode,
            name: line.itemName,
            baseUomId: Number(line.uomId),
            baseUomName: line.uomName || line.uomCode,
            cost: Number(line.estimatedUnitPrice ?? 0),
            allowedUoms: [{
              id: Number(line.uomId),
              code: line.uomCode,
              name: line.uomName || line.uomCode,
            }],
          }));
        const previewUoms = preview.lines
          .filter((line) => !existingUomIds.has(Number(line.uomId)))
          .map((line) => ({
            id: Number(line.uomId),
            code: line.uomCode,
            name: line.uomName || line.uomCode,
          }));

        return {
          ...current,
          facilities: preview.targetFacilityId && !hasPreviewFacility
            ? [
              ...(current.facilities ?? []),
              {
                id: Number(preview.targetFacilityId),
                code: preview.targetFacilityCode,
                name: preview.targetFacilityName,
                type: 'Central',
                isCentralHub: true,
              },
            ]
            : current.facilities,
          warehouses: preview.targetWarehouseId > 0 && !hasPreviewWarehouse
            ? [
              ...(current.warehouses ?? []),
              {
                id: Number(preview.targetWarehouseId),
                code: preview.targetWarehouseCode,
                name: preview.targetWarehouseName,
                warehouseType: 'Central',
                facilityNodeId: preview.targetFacilityId ?? facilityId,
                facilityNodeName: preview.targetFacilityName,
                isCentralHub: true,
              },
            ]
            : current.warehouses,
          items: [...(current.items ?? []), ...previewItems],
          uoms: [...(current.uoms ?? []), ...previewUoms],
        };
      });

      const previewLines: DraftLine[] = preview.lines.map((line) => ({
        itemId: Number(line.itemId),
        uomId: Number(line.uomId),
        quantity: Number(line.quantity),
        requestedQuantity: Number(line.quantity),
        unitPrice: Number(line.estimatedUnitPrice ?? 0),
        estimatedPrice: Number(line.estimatedPrice),
        remarks: line.remarks,
        requestSource: PURCHASE_REQUEST_SOURCE.ExternalPurchase,
      }));

      setLines((current) => {
        const merged = [...current];
        previewLines.forEach((line) => {
          const index = merged.findIndex((existing) => existing.itemId === line.itemId && existing.uomId === line.uomId);
          if (index < 0) {
            merged.push(line);
            return;
          }

          const existing = merged[index];
          merged[index] = {
            ...existing,
            quantity: Number(existing.quantity) + Number(line.quantity),
            requestedQuantity: (existing.requestedQuantity || 0) + Number(line.quantity),
            estimatedPrice: Number(existing.estimatedPrice) + Number(line.estimatedPrice),
            remarks: [existing.remarks, line.remarks].filter(Boolean).join(' | '),
          };
        });
        return merged;
      });

      if (preview.targetWarehouseId > 0) {
        if (preview.targetFacilityId) {
          setFacilityId(preview.targetFacilityId);
        }
        setDestinationWarehouseId(preview.targetWarehouseId);
      }
      setStockReplenishmentRequestIds(preview.requestIds);
      setStockReplenishmentSourceDocs(preview.sourceDocumentNumbers);
      setHasLoadedRequests(true);
      if (!remarks.trim()) {
        setRemarks(`สร้างจากใบแจ้งเติมสต็อกคลังกลาง ${preview.sourceDocumentNumbers.join(', ')}`);
      }

      await Swal.fire({
        icon: 'success',
        title: 'ดึงข้อมูลสำเร็จ',
        text: `รวมยอดจากใบแจ้ง ${preview.sourceDocumentNumbers.length} ใบเรียบร้อยแล้ว`,
        timer: 1500,
        showConfirmButton: false,
      });
    } catch (err) {
      const axiosError = err as AxiosError<{ message?: string }>;
      const errorMessage = axiosError.response?.data?.message ?? 'ดึงข้อมูลรวมยอดจากใบแจ้งเติมสต็อกไม่สำเร็จ';
      setError(errorMessage);
      await Swal.fire({
        icon: 'error',
        title: 'ดึงข้อมูลไม่สำเร็จ',
        text: errorMessage,
      });
    } finally {
      setSaving(false);
    }
  };

  const removeLine = (index: number) => {
    setLines((current) => current.filter((_, lineIndex) => lineIndex !== index));
  };

  const handleEditLine = (index: number) => {
    const lineToEdit = lines[index];
    if (!lineToEdit) return;

    // ดึงข้อมูลกลับขึ้นไปที่ช่องกรอกด้านบน
    setDraftLine({
      ...lineToEdit,
    });

    // ลบออกจากตารางชั่วคราวเพื่อรอการเพิ่มกลับเข้าไปใหม่
    removeLine(index);
  };

  const updateLineQuantity = (index: number, value: string) => {
    const next = parseNumericInput(value);
    if (next === null) return;

    setLines((current) => current.map((line, lineIndex) => (
      lineIndex === index
        ? { 
            ...line, 
            quantity: Math.max(0, Number(next)),
            // เมื่อแก้จำนวนในตาราง ราคารวมต้องอัปเดตตาม
            estimatedPrice: Math.max(0, Number(next)) * line.unitPrice
          }
        : line
    )));
  };

  const updateLineRemarks = (index: number, value: string) => {
    setLines((current) => current.map((line, lineIndex) => (
      lineIndex === index
        ? { ...line, remarks: value }
        : line
    )));
  };

  const itemTableColumns = useMemo<JBFarmTableColumn<DraftLine>[]>(() => [
    {
      id: 'no',
      label: '#',
      width: 40,
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
      render: (line) => {
        const item = activeItemOptions.find(i => i.id === line.itemId);
        return (
          <Typography variant="body2" sx={{ fontWeight: 800, color: '#1a5c50' }}>
            {item ? `${item.code} - ${item.name}` : `รหัส: ${line.itemId}`}
          </Typography>
        );
      },
    },
    {
      id: 'quantity',
      label: 'จำนวน',
      width: 100,
      align: 'right',
      render: (line) => (
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
          <Typography variant="body2" sx={{ fontWeight: 700 }}>
            {formatNumber(Number(line.quantity || 0))}
          </Typography>
          {line.requestedQuantity ? (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: 'text.secondary', mt: -0.5 }}>
              <DownloadCloud size={14} />
              <Typography variant="caption" sx={{ fontWeight: 700 }}>
                ({formatNumber(line.requestedQuantity)})
              </Typography>
            </Box>
          ) : null}
        </Box>
      ),
    },
    {
      id: 'uom',
      label: 'หน่วย',
      width: 90,
      render: (line) => {
        const item = activeItemOptions.find(i => i.id === line.itemId);
        const uomName = (item ? itemUomMap.get(item.id)?.get(line.uomId) : undefined) ?? 
                       options.uoms.find(u => u.id === line.uomId)?.name;
        return <Typography variant="body2" color="text.secondary">{uomName || '-'}</Typography>;
      },
    },
    {
      id: 'price',
      label: 'ราคาประมาณ',
      width: 130,
      align: 'right',
      render: (line) => (
        <Typography variant="body2" sx={{ fontWeight: 800 }}>
          {formatCurrency(line.estimatedPrice)}
        </Typography>
      ),
    },
    {
      id: 'remarks',
      label: 'หมายเหตุ',
      width: 180,
      render: (line) => (
        <Typography variant="body2" color="text.secondary">
          {line.remarks || '-'}
        </Typography>
      ),
    },
    {
      id: 'actions',
      label: 'จัดการ',
      width: 70,
      align: 'right',
      render: (_, index) => (
        <IconButton size="small" color="error" onClick={() => removeLine(index)} disabled={saving}>
          <DeleteIcon fontSize="small" />
        </IconButton>
      ),
    },
  ], [activeItemOptions, itemUomMap, options.uoms, saving, removeLine]);

  const handleSubmit = async () => {
    setError(null);
    if (!facilityId) {
      setError('กรุณาเลือกสถานที่');
      return;
    }
    if (!roleCode) {
      setError('กรุณาเลือกบทบาท');
      return;
    }
    if (!destinationWarehouseId) {
      setError('กรุณาเลือกคลังปลายทาง');
      return;
    }

    const linesToSubmit = lines
      .map((line) => ({
        itemId: Number(line.itemId),
        uomId: Number(line.uomId),
        quantity: Number(line.quantity),
        estimatedPrice: Number(line.estimatedPrice),
        remarks: line.remarks.trim(),
      }))
      .filter((line) => (
      line.itemId > 0 &&
      line.uomId > 0 &&
      line.quantity > 0
      ));

    if (linesToSubmit.length === 0) {
      setError('กรุณาเพิ่มรายการอย่างน้อย 1 รายการ');
      return;
    }

    const invalidCentralLine = linesToSubmit.find((line) => {
      const source = resolveLineSource(line.itemId, facilityIsCentralHub, centralCatalogByItemId, resolvedRequestType);
      if (source !== PURCHASE_REQUEST_SOURCE.CentralBooking) {
        return false;
      }
      const availableQuantity = stockAvailabilityByItemId.get(line.itemId);
      if (typeof availableQuantity !== 'number') return false;
      return line.quantity > availableQuantity;
    });

    if (invalidCentralLine) {
      const item = itemMap.get(invalidCentralLine.itemId);
      const availableQuantity = stockAvailabilityByItemId.get(invalidCentralLine.itemId) ?? 0;
      const errorMessage = `สินค้า ${item?.code ?? invalidCentralLine.itemId} มีคงเหลือจองได้ ${formatNumber(availableQuantity)} ${item?.baseUomName ?? ''} แต่ยอดที่ขอเกินจำนวนคงเหลือ`;
      setError(errorMessage);
      void Swal.fire({
        icon: 'error',
        title: 'บันทึกใบขอซื้อไม่สำเร็จ',
        text: errorMessage,
      });
      return;
    }

    const payload: CreatePurchaseRequest = {
      facilityId,
      destinationWarehouseId: destinationWarehouseId || undefined,
      department: roleCode,
      urgency,
      remarks: remarks.trim(),
      requestType: resolvedRequestType,
      lines: linesToSubmit.map((line) => {
        if (resolvedRequestType !== PurchaseRequestType.Pig) {
          return {
            itemId: line.itemId,
            uomId: line.uomId,
            quantity: line.quantity,
            estimatedPrice: line.estimatedPrice,
            remarks: line.remarks,
          };
        }

        return {
          itemId: undefined,
          pigItemId: line.itemId,
          uomId: Number(headUom?.id ?? line.uomId),
          quantity: line.quantity,
          estimatedPrice: line.estimatedPrice,
          remarks: line.remarks,
        };
      }),
    };

    if (isEditMode && !initialRequest) {
      setError('ไม่พบข้อมูลใบขอซื้อที่ต้องการแก้ไข กรุณาปิดแล้วลองใหม่');
      return;
    }

    const confirm = await Swal.fire({
      icon: 'question',
      title: isEditMode ? 'ยืนยันการแก้ไขใบขอซื้อ' : 'ยืนยันการสร้างใบขอซื้อ',
      text: isEditMode
        ? 'ต้องการบันทึกการแก้ไขใบขอซื้อนี้ใช่หรือไม่'
        : 'ต้องการบันทึกใบขอซื้อนี้ใช่หรือไม่',
      showCancelButton: true,
      confirmButtonText: 'บันทึก',
      cancelButtonText: 'ยกเลิก',
      reverseButtons: true,
    });
    if (!confirm.isConfirmed) return;

    try {
      setSaving(true);
      if (isEditMode && initialRequest) {
        await purchaseService.update(initialRequest.id, payload);
      } else if (stockReplenishmentRequestIds.length > 0) {
        await stockReplenishmentService.createPurchaseRequest({
          requestIds: stockReplenishmentRequestIds,
          targetWarehouseId: destinationWarehouseId || undefined,
          department: roleCode,
          urgency,
          remarks: remarks.trim() || `สร้างจากใบแจ้งเติมสต็อกคลังกลาง ${stockReplenishmentSourceDocs.join(', ')}`,
          lines: linesToSubmit.map((line) => ({
            itemId: line.itemId,
            uomId: line.uomId,
            quantity: line.quantity,
            estimatedPrice: line.estimatedPrice,
            remarks: line.remarks,
          })),
        });
      } else {
        await purchaseService.create(payload);
      }
      await onCreated();
      await Swal.fire({
        icon: 'success',
        title: isEditMode ? 'แก้ไขใบขอซื้อสำเร็จ' : 'สร้างใบขอซื้อสำเร็จ',
        timer: 1400,
        showConfirmButton: false,
      });
      handleClose();
    } catch (err) {
      const axiosError = err as AxiosError<{ message?: string }>;
      const errorMessage = axiosError.response?.data?.message ?? (
        isEditMode ? 'ไม่สามารถแก้ไขใบขอซื้อได้' : 'ไม่สามารถบันทึกใบขอซื้อได้'
      );
      setError(errorMessage);
      await Swal.fire({
        icon: 'error',
        title: isEditMode ? 'แก้ไขใบขอซื้อไม่สำเร็จ' : 'สร้างใบขอซื้อไม่สำเร็จ',
        text: errorMessage,
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="lg" fullWidth PaperProps={{ sx: PURCHASE_DIALOG_PAPER_SX }}>
      <DialogTitleWithClose
        onClose={handleClose}
        disabled={saving}
        sx={PURCHASE_DIALOG_TITLE_SX}
      >
        <Stack alignItems="center" spacing={0.5}>
          <Typography variant="h6" sx={{ fontWeight: 900 }}>
            {isEditMode && initialRequest
              ? `แก้ไขใบขอซื้อ - ${initialRequest.documentNumber}`
              : resolvedRequestType === PurchaseRequestType.Pig
                ? 'สร้างใบขอซื้อสุกร'
                : 'สร้างใบขอซื้อ'}
          </Typography>
          {isEditMode && initialRequest && (
            <Chip 
              label="Draft / Returned" 
              sx={{ bgcolor: '#ff9800', color: '#fff', fontWeight: 800, fontSize: '0.75rem', height: 24 }} 
            />
          )}
        </Stack>
      </DialogTitleWithClose>
      <DialogContent dividers sx={PURCHASE_DIALOG_CONTENT_SX}>
        <Stack spacing={2}>
          {isEditMode && !initialRequest ? (
            <Alert severity="warning">
              กำลังโหลดข้อมูลใบขอซื้อสำหรับแก้ไข...
            </Alert>
          ) : null}
          {error && <Alert severity="error" sx={PURCHASE_DIALOG_ERROR_ALERT_SX}>{error}</Alert>}
          {!optionsLoading && !canCreate && (
            <Alert severity="warning" sx={PURCHASE_DIALOG_ERROR_ALERT_SX}>
              ยังไม่สามารถสร้างใบขอซื้อได้ กรุณาตรวจสอบข้อมูลต้นทางในระบบ: {missingRequirements.join(', ') || 'สินค้า หรือ หน่วยนับ'}
            </Alert>
          )}

          <Box component="fieldset" sx={PURCHASE_DIALOG_FIELDSET_SX}>
            <Typography component="legend" sx={PURCHASE_DIALOG_LEGEND_SX}>
              ข้อมูลใบขอซื้อ
            </Typography>
            <Stack spacing={2} sx={{ mt: 1 }}>
              <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
                <TextField
                  label="ผู้ขอ"
                  value={requesterName}
                  fullWidth
                  InputProps={{ readOnly: true }}
                />
                <TextField
                  select
                  label="บทบาท"
                  value={roleCode}
                  onChange={(event) => setRoleCode(event.target.value)}
                  fullWidth
                  disabled={saving}
                >
                  {(currentUser?.roleCodes ?? []).map((code, idx) => (
                    <MenuItem key={code} value={code}>
                      {code} - {currentUser?.roles?.[idx] || code}
                    </MenuItem>
                  ))}
                </TextField>
              </Stack>

              <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
                <TextField
                  select
                  label="สถานที่"
                  value={
                    availableFacilities.some((facility) => facility.id === facilityId)
                      ? facilityId
                      : ''
                  }
                  onChange={(event) => {
                    const nextFacilityId = Number(event.target.value);
                    setFacilityId(nextFacilityId);
                  }}
                  fullWidth
                  disabled={saving || optionsLoading}
                >
                  {availableFacilities.map((facility) => (
                    <MenuItem key={facility.id} value={facility.id}>
                      {facility.code} - {facility.name}
                    </MenuItem>
                  ))}
                </TextField>
                <TextField
                  select
                  label="ความเร่งด่วน"
                  value={urgency}
                  onChange={(event) => setUrgency(event.target.value as UrgencyLevel)}
                  sx={{ minWidth: 180 }}
                  disabled={saving}
                >
                  <MenuItem value={UrgencyLevel.Normal}>{URGENCY_LABELS_THAI['Normal']}</MenuItem>
                  <MenuItem value={UrgencyLevel.High}>{URGENCY_LABELS_THAI['High']}</MenuItem>
                  <MenuItem value={UrgencyLevel.Urgent}>{URGENCY_LABELS_THAI['Urgent']}</MenuItem>
                </TextField>
              </Stack>
              <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
                <TextField
                  select
                  label="คลังปลายทาง"
                  value={
                    availableWarehouses.some((warehouse) => warehouse.id === destinationWarehouseId)
                      ? destinationWarehouseId
                      : ''
                  }
                  onChange={(event) => {
                    const newWhId = Number(event.target.value);
                    setDestinationWarehouseId(newWhId);
                  }}
                  fullWidth
                  disabled={saving || optionsLoading}
                  helperText="ระบบจะใช้คลังนี้เป็นปลายทางเมื่อรับสินค้าเข้าจากใบขอซื้อ"
                >
                  {availableWarehouses.map((warehouse) => (
                    <MenuItem key={warehouse.id} value={warehouse.id}>
                      {warehouse.code} - {warehouse.name}
                    </MenuItem>
                  ))}
                </TextField>
              </Stack>

              <TextField
                label="หมายเหตุ"
                value={remarks}
                onChange={(event) => setRemarks(event.target.value)}
                multiline
                minRows={2}
                fullWidth
                variant="outlined"
                placeholder="ระบุหมายเหตุ"
                disabled={saving}
              />
            </Stack>
          </Box>

          <Box component="fieldset" sx={PURCHASE_DIALOG_FIELDSET_SX}>
            <Typography component="legend" sx={PURCHASE_DIALOG_LEGEND_SX}>
              {resolvedRequestType === PurchaseRequestType.Pig ? 'รายการสุกร' : 'รายการสินค้า'}
            </Typography>
            <Stack direction="column" spacing={2} sx={{ width: '100%', mb: 1, mt: 1 }}>
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: {
                    xs: '1fr',
                    md: 'minmax(300px, 2fr) minmax(120px, 0.7fr) minmax(120px, 0.7fr) minmax(160px, 0.9fr)',
                  },
                  gap: 1.5,
                  alignItems: 'end',
                }}
              >
                {resolvedRequestType === PurchaseRequestType.Pig ? (
                  <TextField
                    select
                    label="รายการสุกร"
                    value={draftLine.itemId}
                    onChange={(event) => updateDraftLine({ itemId: Number(event.target.value) })}
                    fullWidth
                    disabled={saving || optionsLoading}
                  >
                    {pigItemOptions.map((item) => (
                      <MenuItem key={item.id} value={item.id}>
                        {item.code} - {item.name}
                      </MenuItem>
                    ))}
                  </TextField>
                ) : (
                  <TextField
                    select
                    label="สินค้า"
                    value={draftLine.itemId}
                    onChange={(event) => {
                      updateDraftLine({ itemId: Number(event.target.value) });
                    }}
                    fullWidth
                    disabled={saving || optionsLoading}
                  >
                    {activeItemOptions.map((item) => {
                      // Check if this item is in the current central list OR if we've seen it as central before
                      const itemIdNum = Number(item.id);
                      const isCentral = 
                        (options.centralWarehouseItems ?? []).some(row => Number(row.itemId) === itemIdNum) || 
                        knownCentralItemIds.includes(itemIdNum);
                        
                      return (
                        <MenuItem key={item.id} value={item.id}>
                          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                            <Typography variant="body2">
                              {item.code} - {item.name}
                            </Typography>
                            {isCentral && (
                              <Chip 
                                label="คลังกลาง" 
                                size="small" 
                                sx={{ 
                                  ml: 1, 
                                  height: 20, 
                                  fontSize: '0.7rem', 
                                  bgcolor: '#FEF3F2',
                                  color: '#912018',
                                  fontWeight: 700,
                                  borderRadius: '4px',
                                  border: '1px solid #FEE4E2'
                                }} 
                              />
                            )}
                          </Box>
                        </MenuItem>
                      );
                    })}
                  </TextField>
                )}

                <TextField
                  select
                  label="หน่วย"
                  value={
                    draftUomOptions.some((uom) => uom.id === draftLine.uomId)
                      ? draftLine.uomId
                      : ''
                  }
                  onChange={(event) => updateDraftLine({ uomId: Number(event.target.value) })}
                  fullWidth
                  disabled={saving || optionsLoading || resolvedRequestType === PurchaseRequestType.Pig || draftUomOptions.length === 0}
                >
                  {draftUomOptions.map((uom) => (
                    <MenuItem key={uom.id} value={uom.id}>
                      {uom.name}
                    </MenuItem>
                  ))}
                </TextField>

                <TextField
                  label="จำนวน"
                  type="text"
                  value={draftLine.quantity}
                  onChange={(event) => {
                    const next = parseNumericInput(event.target.value);
                    if (next === null) return;
                    updateDraftLine({ quantity: next });
                  }}
                  inputProps={{ inputMode: 'decimal', pattern: '[0-9]*\\.?[0-9]*' }}
                  disabled={saving}
                  InputProps={{ sx: { '& input': { textAlign: 'right' } } }}
                />

                <TextField
                  label="ราคาประมาณ (บาท)"
                  type="text"
                  value={draftLine.estimatedPrice}
                  onChange={(event) => {
                    const next = parseNumericInput(event.target.value);
                    if (next === null) return;
                    updateDraftLine({ estimatedPrice: next });
                  }}
                  inputProps={{ inputMode: 'decimal', pattern: '[0-9]*\\.?[0-9]*' }}
                  disabled={saving}
                  InputProps={{ sx: { '& input': { textAlign: 'right' }, bgcolor: 'rgba(0,0,0,0.03)' } }}
                />

                <TextField
                  label="หมายเหตุรายการ"
                  value={draftLine.remarks}
                  onChange={(event) => updateDraftLine({ remarks: event.target.value })}
                  fullWidth
                  disabled={saving}
                  sx={{ gridColumn: { xs: '1', md: '1 / -1' } }}
                />
                
                <Box sx={{ gridColumn: { xs: '1', md: '1 / -1' }, pt: 0.5, display: 'flex', gap: 1 }}>
                  <Button
                    fullWidth
                    variant="contained"
                    startIcon={editingIndex !== null ? <CheckCircleIcon /> : <AddIcon />}
                    onClick={addLine}
                    disabled={saving || !draftLine.itemId}
                    sx={{ 
                      ...(editingIndex !== null ? PURCHASE_DIALOG_PRIMARY_BUTTON_SX : PURCHASE_DIALOG_SECONDARY_BUTTON_SX), 
                      minHeight: 48,
                      flex: editingIndex !== null ? 2 : 1
                    }}
                  >
                    {editingIndex !== null ? 'อัพเดตรายการ' : 'เพิ่มรายการ'}
                  </Button>
                  {editingIndex !== null && (
                    <Button
                      fullWidth
                      variant="outlined"
                      onClick={handleCancelEdit}
                      disabled={saving}
                      sx={{ ...PURCHASE_DIALOG_SECONDARY_BUTTON_SX, minHeight: 48, flex: 1 }}
                    >
                      ยกเลิกแก้ไข
                    </Button>
                  )}
                </Box>

                {facilityIsCentralHub && !editingIndex && (
                  <Box sx={{ gridColumn: { xs: '1', md: '1 / -1' }, pt: 0.5 }}>
                    <Button
                      fullWidth
                      variant="outlined"
                      onClick={handleLoadRequests}
                      disabled={saving || hasLoadedRequests}
                      sx={{ 
                        ...PURCHASE_DIALOG_SECONDARY_BUTTON_SX, 
                        minHeight: 48,
                        color: hasLoadedRequests ? 'text.disabled' : '#2e7d32',
                        borderColor: hasLoadedRequests ? 'divider' : '#2e7d32',
                        '&:hover': {
                          borderColor: '#1b5e20',
                          bgcolor: 'rgba(46, 125, 50, 0.04)'
                        }
                      }}
                    >
                      {hasLoadedRequests ? 'ดึงข้อมูลสำเร็จแล้ว' : 'ดึงข้อมูลรวมยอดจากคำขอฟาร์ม'}
                    </Button>
                  </Box>
                )}
              </Box>

              {/* Table Section */}



              <Box sx={{ mt: 1.5 }}>
                <JBFarmTable
                  columns={itemTableColumns}
                  rows={lines}
                  height={PR_DIALOG_TABLE_HEIGHT}
                  minWidth={800}
                  getRowId={(row) => `${row.itemId}-${row.uomId}-${row.remarks || 'line'}`}
                  onRowDoubleClick={(_, index) => handleEditItem(index)}
                  selectedRowId={editingIndex !== null ? `line-${editingIndex}` : undefined}
                  showPagination={false}
                  emptyMessage="ยังไม่มีรายการสินค้า"
                  footer={lines.length > 0 ? (
                    <Box sx={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center',
                      bgcolor: '#ecf2ee', 
                      px: 3,
                      py: 1.5,
                    }}>
                      <Typography sx={{ fontWeight: 900, color: '#1a5c50', fontSize: '1rem' }}>
                        รวมทั้งหมด
                      </Typography>
                      <Typography sx={{ fontWeight: 950, color: '#1a5c50', fontSize: '1.1rem' }}>
                        {formatCurrency(grandTotal)}
                      </Typography>
                    </Box>
                  ) : null}
                />
              </Box>
            </Stack>
          </Box>
        </Stack>
      </DialogContent>
      <DialogActions sx={PURCHASE_DIALOG_ACTIONS_SX}>
        <Button
          variant="outlined"
          onClick={handleClose}
          disabled={saving}
          sx={{ borderRadius: 999, px: 3, borderColor: 'divider', color: 'text.secondary' }}
        >
          ยกเลิก
        </Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={saving || optionsLoading || !canCreate || (isEditMode && !initialRequest)}
          sx={{ borderRadius: 999, px: 3, bgcolor: '#1a5c50', '&:hover': { bgcolor: '#124840' } }}
        >
          {isEditMode ? 'บันทึกการแก้ไข' : 'บันทึกใบขอซื้อ'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
