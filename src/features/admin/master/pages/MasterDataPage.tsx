'use client';

import { Add, DeleteOutline, EditOutlined, FilterList } from '@mui/icons-material';
import {
  Box,
  Button,
  Collapse,
  Divider,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Tooltip,
  Typography,
  alpha,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ContentCard, SearchField, SectionTabsCard } from '@/components/common';
import DataTable, { type Column } from '@/components/common/DataTable';
import {
  getOrLoadClientQueryCache,
  invalidateClientQueryCache,
  readClientQueryCache,
  writeClientQueryCache,
} from '@/lib/client-query-cache';
import {
  MASTER_SECTION_TABS,
  DEFAULT_MASTER_SECTION_TAB_KEY,
  MasterSectionLayout,
  MasterCrudDialog,
  FieldConfig
} from '@/features/admin/master/components';
import { masterApi } from '@/features/admin/master/services/master.api';
import { UserAssignmentDataProvider } from '@/features/admin/user-assignment/components';
import FarmPage from './FarmPage';
import ZonePage from './ZonePage';
import HousePage from './HousePage';
import SiloPage from './SiloPage';

import { MasterOverviewPage } from './MasterOverviewPage';

interface MasterDataPageProps {
  title: string;
  subtitle: string;
}

interface FilterDefinition {
  key: string;
  label: string;
  options: { label: string; value: string }[];
}

const FILTER_DEFINITIONS: Partial<Record<string, FilterDefinition[]>> = {
  products: [
    { key: 'itemCategoryName', label: 'หมวดสินค้า', options: [] }, // populated dynamically
    { key: 'isActive', label: 'สถานะ', options: [{ label: 'ใช้งาน', value: 'true' }, { label: 'ไม่ใช้งาน', value: 'false' }] },
  ],
  categories: [
    { key: 'isActive', label: 'สถานะ', options: [{ label: 'ใช้งาน', value: 'true' }, { label: 'ไม่ใช้งาน', value: 'false' }] },
  ],
  units: [
    { key: 'isActive', label: 'สถานะ', options: [{ label: 'ใช้งาน', value: 'true' }, { label: 'ไม่ใช้งาน', value: 'false' }] },
  ],
  conversions: [
    { key: 'isActive', label: 'สถานะ', options: [{ label: 'ใช้งาน', value: 'true' }, { label: 'ไม่ใช้งาน', value: 'false' }] },
  ],
  'lot-policies': [
    { key: 'strategy', label: 'รูปแบบ', options: [{ label: 'FIFO', value: 'FIFO' }, { label: 'FEFO', value: 'FEFO' }, { label: 'LIFO', value: 'LIFO' }] },
    { key: 'isLotRequired', label: 'บังคับล็อต', options: [{ label: 'บังคับ', value: 'true' }, { label: 'ไม่บังคับ', value: 'false' }] },
    { key: 'isActive', label: 'สถานะ', options: [{ label: 'ใช้งาน', value: 'true' }, { label: 'ไม่ใช้งาน', value: 'false' }] },
  ],
  partners: [
    { key: 'type', label: 'ประเภท', options: [{ label: 'VENDER', value: 'VENDER' }, { label: 'CUSTOMER', value: 'CUSTOMER' }, { label: 'INTERNAL', value: 'INTERNAL' }] },
    { key: 'isActive', label: 'สถานะ', options: [{ label: 'ใช้งาน', value: 'true' }, { label: 'ไม่ใช้งาน', value: 'false' }] },
  ],
  'system-prefixes': [
    { key: 'categoryName', label: 'หมวดหมู่คำนำหน้า', options: [] },
    { key: 'isActive', label: 'สถานะ', options: [{ label: 'ใช้งาน', value: 'true' }, { label: 'ไม่ใช้งาน', value: 'false' }] },
  ],
  'system-prefix-categories': [
    { key: 'isActive', label: 'สถานะ', options: [{ label: 'ใช้งาน', value: 'true' }, { label: 'ไม่ใช้งาน', value: 'false' }] },
  ],
};

type MasterLookups = {
  categories: any[];
  uoms: any[];
  uomConversions: any[];
  lotPolicies: any[];
  items: any[];
  centralWarehouseItems: any[];
  mortalityTypes: any[];
  prefixCategories: any[];
};

const formatStockThreshold = (value: unknown): string => {
  if (value === null || value === undefined || value === '') {
    return '-';
  }

  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    return '-';
  }

  return new Intl.NumberFormat('th-TH', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 4,
  }).format(parsed);
};

const MASTER_LOOKUPS_CACHE_KEY = 'master:lookups';
const MASTER_DATA_CACHE_KEY_PREFIX = 'master:data:';
const MASTER_TABS_THAT_AFFECT_LOOKUPS = new Set([
  'products',
  'categories',
  'units',
  'conversions',
  'lot-policies',
  'loss-type',
  'system-prefix-categories',
]);

const EMPTY_MASTER_LOOKUPS: MasterLookups = {
  categories: [],
  uoms: [],
  uomConversions: [],
  lotPolicies: [],
  items: [],
  centralWarehouseItems: [],
  mortalityTypes: [],
  prefixCategories: [],
};

function getMasterDataCacheKey(tabKey: string | undefined): string {
  return `${MASTER_DATA_CACHE_KEY_PREFIX}${tabKey ?? 'unknown'}`;
}

async function fetchMasterLookups(): Promise<MasterLookups> {
  const [cats, uoms, uomConversions, lots, itms, centralItems, mTypes, prefixCats] = await Promise.all([
    masterApi.getCategories().catch(() => []),
    masterApi.getUOMs().catch(() => []),
    masterApi.getUomConversions().catch(() => []),
    masterApi.getLotPolicies().catch(() => []),
    masterApi.getItems().catch(() => []),
    masterApi.getCentralWarehouseItems().catch(() => []),
    masterApi.getMortalityTypes().catch(() => []),
    masterApi.getPrefixCategories().catch(() => []),
  ]);

  return {
    categories: cats,
    uoms,
    uomConversions,
    lotPolicies: lots,
    items: itms,
    centralWarehouseItems: centralItems,
    mortalityTypes: mTypes,
    prefixCategories: prefixCats,
  };
}

export function MasterDataPage({ title }: MasterDataPageProps) {
  const theme = useTheme();
  const [currentTabKey, setCurrentTabKey] = useState<string>(DEFAULT_MASTER_SECTION_TAB_KEY);
  const [currentCategoryKey, setCurrentCategoryKey] = useState<string>('area');

  const handleTabChange = useCallback((newKey: string) => {
    setCurrentTabKey(newKey);
  }, []);

  const activeTab = useMemo(() => {
    return MASTER_SECTION_TABS.find((tab) => tab.key === currentTabKey) ?? MASTER_SECTION_TABS[0];
  }, [currentTabKey]);
  const activeCategoryKey = activeTab.category;
  const warehouseTabs = useMemo(
    () => MASTER_SECTION_TABS.filter((tab) => tab.category === 'warehouse'),
    [],
  );

  const activeTabKey = activeTab?.key;
  const dataCacheKey = useMemo(() => getMasterDataCacheKey(activeTabKey), [activeTabKey]);
  const cachedInitialData = readClientQueryCache<any[]>(dataCacheKey);
  const cachedInitialLookups = readClientQueryCache<MasterLookups>(MASTER_LOOKUPS_CACHE_KEY);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [searchQuery, setSearchQuery] = useState('');
  const [data, setData] = useState<any[]>(cachedInitialData ?? []);
  const [loading, setLoading] = useState(cachedInitialData === undefined);
  const [isStatusMutating, setIsStatusMutating] = useState(false);

  // Filter state – draft pattern matching mock
  const [isFilterExpanded, setIsFilterExpanded] = useState(false);
  const [filterValues, setFilterValues] = useState<Record<string, string>>({});
  const [draftFilterValues, setDraftFilterValues] = useState<Record<string, string>>({});

  // CRUD state
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<'create' | 'edit'>('create');
  const [editingRecord, setEditingRecord] = useState<any>(null);

  // Deletion State
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [recordToDelete, setRecordToDelete] = useState<number | null>(null);

  const [lookups, setLookups] = useState<MasterLookups>(cachedInitialLookups ?? EMPTY_MASTER_LOOKUPS);

  const loadLookups = useCallback(async (options?: { force?: boolean }) => {
    if (!options?.force) {
      const cachedLookups = readClientQueryCache<MasterLookups>(MASTER_LOOKUPS_CACHE_KEY);
      if (cachedLookups) {
        setLookups(cachedLookups);
        return cachedLookups;
      }
    }

    try {
      const nextLookups = await getOrLoadClientQueryCache(
        MASTER_LOOKUPS_CACHE_KEY,
        fetchMasterLookups,
        { force: options?.force },
      );
      setLookups(nextLookups);
      return nextLookups;
    } catch (error) {
      console.error('Failed to fetch master lookups', error);
      setLookups(EMPTY_MASTER_LOOKUPS);
      return EMPTY_MASTER_LOOKUPS;
    }
  }, []);

  useEffect(() => {
    void loadLookups();
  }, [loadLookups]);

  const colors = useMemo(
    () =>
      theme.palette.mode === 'dark'
        ? { cardBg: '#0f172a', line: alpha('#94a3b8', 0.24), title: '#e2e8f0', subtitle: '#94a3b8' }
        : { cardBg: '#ffffff', line: '#e2e8f0', title: '#1e293b', subtitle: '#64748b' },
    [theme.palette.mode],
  );
  const primary = theme.palette.primary.main;
  const primaryHover = theme.palette.primary.dark;

  const convertedUnitOptions = useMemo(() => {
    return lookups.uomConversions
      .filter((row) => Boolean(row?.isActive) && Number.isFinite(Number(row?.id)) && Number(row.id) > 0)
      .map((row) => {
        const receiveName = row?.uomName ?? '-';
        const stockName = row?.stockUomName ?? '-';
        const factor = Number(row?.conversionFactor);
        const isIdentity = receiveName === stockName && factor === 1;

        return {
          label: isIdentity ? receiveName : `${receiveName} -> ${stockName} (${Number.isFinite(factor) ? factor : '-'})`,
          value: Number(row.id),
        };
      })
      .sort((a, b) => a.label.localeCompare(b.label, 'th'));
  }, [lookups.uomConversions]);

  const contentTitle = activeTab?.label ?? title;

  // Filter definitions — build dynamically
  const activeFilterDefinitions = useMemo<FilterDefinition[]>(() => {
    const defs = FILTER_DEFINITIONS[activeTabKey ?? ''] ?? [];
    if (activeTabKey === 'products') {
      return defs.map(d =>
        d.key === 'itemCategoryName'
          ? { ...d, options: lookups.categories.map(c => ({ label: c.name, value: c.name })) }
          : d
      );
    }
    if (activeTabKey === 'system-prefixes') {
      return defs.map(d =>
        d.key === 'categoryName'
          ? { ...d, options: lookups.prefixCategories.map(c => ({ label: c.categoryName, value: c.categoryName })) }
          : d
      );
    }
    return defs;
  }, [activeTabKey, lookups.categories, lookups.prefixCategories]);

  // Reset filters on tab change
  useEffect(() => {
    const initial: Record<string, string> = {};
    activeFilterDefinitions.forEach(f => { initial[f.key] = 'all'; });
    setFilterValues(initial);
    setDraftFilterValues(initial);
    setSearchQuery('');
    setPage(0);
    setIsFilterExpanded(false);
  }, [activeTabKey]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    setCurrentCategoryKey(activeCategoryKey);
  }, [activeCategoryKey]);

  const handleCategoryChange = useCallback((nextCategoryKey: string) => {
    setCurrentCategoryKey(nextCategoryKey);
    const firstTabInCategory = MASTER_SECTION_TABS.find((tab) => tab.category === nextCategoryKey);
    if (firstTabInCategory && firstTabInCategory.key !== currentTabKey) {
      handleTabChange(firstTabInCategory.key);
    }
  }, [currentTabKey, handleTabChange]);

  const loadData = useCallback(async (options?: { force?: boolean }) => {
    if (!activeTabKey) {
      setData([]);
      setLoading(false);
      return [];
    }

    if (!options?.force) {
      const cachedRows = readClientQueryCache<any[]>(dataCacheKey);
      if (cachedRows) {
        setData(cachedRows);
        setLoading(false);
        return cachedRows;
      }
    }

    setLoading(true);
    try {
      const rows = await getOrLoadClientQueryCache<any[]>(
        dataCacheKey,
        async () => {
          let result: any[] = [];
          switch (activeTabKey) {
            case 'products': {
              result = await masterApi.getItems();
              break;
            }
            case 'categories': result = await masterApi.getCategories(); break;
            case 'units': result = await masterApi.getUOMs(); break;
            case 'conversions': result = await masterApi.getUomConversions(); break;
            case 'lot-policies': result = await masterApi.getLotPolicies(); break;
            case 'partners': result = await masterApi.getPartners(); break;
            case 'farm-type': result = await masterApi.getPigTypes(); break;
            case 'breed': result = await masterApi.getBreeds(); break;
            case 'disease-group': result = await masterApi.getDiseases(); break;
            case 'treatment-type': result = await masterApi.getTreatmentTypes(); break;
            case 'death-cause': result = await masterApi.getMortalityCauses(); break;
            case 'loss-type': result = await masterApi.getMortalityTypes(); break;
            case 'system-prefixes': result = await masterApi.getPrefixes(); break;
            case 'system-prefix-categories': result = await masterApi.getPrefixCategories(); break;
            default: result = [];
          }

          if (activeTabKey !== 'conversions') {
            return result || [];
          }

          const dedupedByPair = new Map<string, any>();
          (result || []).forEach((row: any) => {
            const uomId = Number(row?.uomId);
            const stockUomId = Number(row?.stockUomId);
            if (!Number.isFinite(uomId) || !Number.isFinite(stockUomId)) {
              return;
            }

            const key = `${uomId}:${stockUomId}`;
            const existing = dedupedByPair.get(key);
            if (!existing) {
              dedupedByPair.set(key, row);
              return;
            }

            const existingActive = Boolean(existing?.isActive);
            const currentActive = Boolean(row?.isActive);
            if (!existingActive && currentActive) {
              dedupedByPair.set(key, row);
              return;
            }

            if (existingActive === currentActive && Number(row?.id) < Number(existing?.id)) {
              dedupedByPair.set(key, row);
            }
          });

          return Array.from(dedupedByPair.values());
        },
        { force: options?.force },
      );

      setData(rows);
      return rows;
    } catch (err) {
      console.error('Failed to fetch data', err);
      setData([]);
      return [];
    } finally {
      setLoading(false);
    }
  }, [activeTabKey, dataCacheKey]);

  useEffect(() => {
    const cachedRows = readClientQueryCache<any[]>(dataCacheKey);
    if (cachedRows) {
      setData(cachedRows);
      setLoading(false);
      return;
    }

    setData([]);
    setLoading(Boolean(activeTabKey));
    void loadData();
  }, [activeTabKey, dataCacheKey, loadData]);

  const getEndpoint = useCallback(() => {
    switch (activeTabKey) {
      case 'products': return 'Items';
      case 'categories': return 'ItemCategories';
      case 'units': return 'UOMs';
      case 'conversions': return 'UomConversions';
      case 'lot-policies': return 'ItemLotPolicies';
      case 'partners': return 'BusinessPartners';
      case 'farm-type': return 'PigTypes';
      case 'breed': return 'Breeds';
      case 'disease-group': return 'Diseases';
      case 'treatment-type': return 'TreatmentTypes';
      case 'death-cause': return 'MortalityCauses';
      case 'loss-type': return 'MortalityTypes';
      case 'system-prefixes': return 'Prefixes';
      case 'system-prefix-categories': return 'PrefixCategories';
      default: return '';
    }
  }, [activeTabKey]);

  const refreshCurrentTable = useCallback(async () => {
    invalidateClientQueryCache(dataCacheKey);
    return loadData({ force: true });
  }, [dataCacheKey, loadData]);

  const refreshLookupsIfNeeded = useCallback(async () => {
    if (!activeTabKey || !MASTER_TABS_THAT_AFFECT_LOOKUPS.has(activeTabKey)) {
      return;
    }

    invalidateClientQueryCache(MASTER_LOOKUPS_CACHE_KEY);
    await loadLookups({ force: true });
  }, [activeTabKey, loadLookups]);

  // --- Filter handlers ---
  const handleToggleFilterPanel = () => {
    setIsFilterExpanded(prev => {
      const next = !prev;
      if (next) setDraftFilterValues(filterValues);
      return next;
    });
  };

  const handleDraftFilterChange = (key: string, value: string) => {
    setDraftFilterValues(prev => ({ ...prev, [key]: value }));
  };

  const handleClearDraftFilters = () => {
    const initial: Record<string, string> = {};
    activeFilterDefinitions.forEach(f => { initial[f.key] = 'all'; });
    setDraftFilterValues(initial);
  };

  const handleApplyFilters = () => {
    setFilterValues(draftFilterValues);
    setPage(0);
    setIsFilterExpanded(false);
  };

  const activeFilterCount = useMemo(
    () => activeFilterDefinitions.filter(f => (filterValues[f.key] ?? 'all') !== 'all').length,
    [activeFilterDefinitions, filterValues],
  );

  const primaryFilterDefinitions = useMemo(() => activeFilterDefinitions.slice(0, 2), [activeFilterDefinitions]);
  const secondaryFilterDefinitions = useMemo(() => activeFilterDefinitions.slice(2), [activeFilterDefinitions]);

  // --- CRUD handlers ---
  const handleOpenDialog = (mode: 'create' | 'edit', record: any = null) => {
    setDialogMode(mode);
    if (activeTabKey === 'products' && record) {
      const itemId = Number(record._dbId ?? record.id);
      const centralMapping = lookups.centralWarehouseItems.find((row) => Number(row?.itemId) === itemId) ?? null;
      setEditingRecord({
        ...record,
        isCentralItem: Boolean(centralMapping?.isCenterItem),
        centralWarehouseItemId: centralMapping?.id ?? null,
        centralWarehouseId: centralMapping?.warehouseId ?? null,
      });
    } else {
      setEditingRecord(record);
    }
    setIsDialogOpen(true);
  };
  const handleCloseDialog = () => { setIsDialogOpen(false); setEditingRecord(null); };
  const handleSave = async (formData: any) => {
    const endpoint = getEndpoint();
    if (!endpoint) return;
    const payload = { ...formData };

    if (activeTabKey === 'products') {
      payload.isCentralItem = Boolean(payload.isCentralItem);
      if (payload.cost === null || payload.cost === undefined || String(payload.cost).trim() === '') {
        payload.cost = 0;
      } else {
        const parsedCost = Number(payload.cost);
        if (!Number.isFinite(parsedCost)) {
          alert('กรุณากรอกราคาทุนเป็นตัวเลขเท่านั้น');
          return;
        }
        payload.cost = parsedCost;
      }

      if (payload.price === null || payload.price === undefined || String(payload.price).trim() === '') {
        payload.price = 0;
      } else {
        const parsedPrice = Number(payload.price);
        if (!Number.isFinite(parsedPrice)) {
          alert('กรุณากรอกราคาขายเป็นตัวเลขเท่านั้น');
          return;
        }
        payload.price = parsedPrice;
      }
    }

    if (activeTabKey === 'conversions') {
      const parsedUomId = Number(payload.uomId);
      const parsedStockUomId = Number(payload.stockUomId);
      const parsedFactor = Number(payload.conversionFactor);

      if (!Number.isFinite(parsedUomId) || parsedUomId <= 0) {
        alert('กรุณาเลือกหน่วยรับเข้า/ส่งออก');
        return;
      }
      if (!Number.isFinite(parsedStockUomId) || parsedStockUomId <= 0) {
        alert('กรุณาเลือกหน่วยตัดสต็อก');
        return;
      }
      if (!Number.isFinite(parsedFactor) || parsedFactor <= 0) {
        alert('กรุณากรอกอัตราแปลงให้มากกว่า 0');
        return;
      }

      if (parsedUomId === parsedStockUomId && parsedFactor !== 1) {
        alert('หากหน่วยรับเข้า/ส่งออก เท่ากับ หน่วยตัดสต็อก ค่าอัตราแปลงต้องเป็น 1 เท่านั้น');
        return;
      }

      if (dialogMode === 'create') {
        const hasDuplicate = data.some(
          (row) =>
            Number(row?.uomId) === parsedUomId &&
            Number(row?.stockUomId) === parsedStockUomId &&
            Boolean(row?.isActive),
        );
        if (hasDuplicate) {
          alert('คู่หน่วยนี้มีอยู่แล้ว ไม่สามารถสร้างซ้ำได้');
          return;
        }
      }
      payload.uomId = parsedUomId;
      payload.stockUomId = parsedStockUomId;
      payload.conversionFactor = parsedFactor;
    }

    if (dialogMode === 'create') {
      const createdItem = await masterApi.createData<any>(endpoint, payload);
      if (activeTabKey === 'products') {
        await syncCentralCatalogForProduct(createdItem?.id, payload);
      }
    } else {
      await masterApi.updateData(endpoint, editingRecord.id, payload);
      if (activeTabKey === 'products') {
        await syncCentralCatalogForProduct(editingRecord?._dbId ?? editingRecord?.id, payload);
      }
    }
    await refreshCurrentTable();
    void refreshLookupsIfNeeded();
  };

  const syncCentralCatalogForProduct = async (itemId: number, payload: any) => {
    if (!Number.isFinite(Number(itemId)) || Number(itemId) <= 0) {
      return;
    }

    const isCentralItem = Boolean(payload.isCentralItem);
    const existing = lookups.centralWarehouseItems.find((row) => Number(row?.itemId) === Number(itemId)) ?? null;
    const centralWarehouseId =
      existing?.warehouseId ??
      lookups.centralWarehouseItems.find((row) => Boolean(row?.isCenterItem))?.warehouseId ??
      null;

    if (isCentralItem) {
      if (!centralWarehouseId) {
        throw new Error('ไม่พบคลังกลางสำหรับผูก item กลาง');
      }

      const centralPayload = {
        warehouseId: centralWarehouseId,
        itemId: Number(itemId),
        isCenterItem: true,
        isActive: true,
        minBookingQuantity: existing?.minBookingQuantity ?? null,
        maxBookingQuantity: existing?.maxBookingQuantity ?? null,
        remarks: existing?.remarks ?? null,
      };

      if (existing?.id) {
        await masterApi.updateData('CentralWarehouseItems', existing.id, centralPayload);
      } else {
        await masterApi.createData('CentralWarehouseItems', centralPayload);
      }
    } else if (existing?.id) {
      await masterApi.deleteData('CentralWarehouseItems', existing.id);
    }
  };
  const handleDelete = (id: number) => {
    setRecordToDelete(id);
    setDeleteConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (recordToDelete === null) return;
    const endpoint = getEndpoint();
    if (!endpoint) return;

    try {
      await masterApi.deleteData(endpoint, recordToDelete);
      setDeleteConfirmOpen(false);
      setRecordToDelete(null);
      await refreshCurrentTable();
      void refreshLookupsIfNeeded();
    } catch (error: any) {
      const apiMessage =
        error?.response?.data?.message ??
        error?.response?.data?.title ??
        error?.response?.data ??
        (error instanceof Error ? error.message : null);
      alert(
        typeof apiMessage === 'string' && apiMessage.trim().length > 0
          ? apiMessage
          : 'ไม่สามารถลบข้อมูลได้ อาจมีการถูกใช้งานอยู่ในระบบ',
      );
    }
  };

  const handleToggleStatus = async (row: any) => {
    if (isStatusMutating) return;
    const endpoint = getEndpoint();
    if (!endpoint) return;
    const targetId = row?._dbId ?? row?.id;
    if (targetId === undefined || targetId === null) return;
    const isActive = Boolean(
      row?.isActive ?? (typeof row?.status === 'string' && row.status.toLowerCase() === 'active'),
    );
    const nextIsActive = !isActive;
    const previousData = data;

    try {
      setIsStatusMutating(true);
      const nextRows = data.map((item) =>
        item?.id === targetId
          ? {
              ...item,
              isActive: nextIsActive,
            }
          : item,
      );
      setData(nextRows);
      writeClientQueryCache(dataCacheKey, nextRows);
      await masterApi.setDataStatus(endpoint, targetId, nextIsActive);
      void refreshLookupsIfNeeded();
    } catch (error) {
      setData(previousData);
      writeClientQueryCache(dataCacheKey, previousData);
      console.error('Failed to toggle status', error);
    } finally {
      setIsStatusMutating(false);
    }
  };

  // --- Filtered + searched rows ---
  const filteredRows = useMemo(() => {
    const normalizedSearch = searchQuery.trim().toLowerCase();
    return data.filter(row => {
      const matchesSearch = !normalizedSearch || Object.values(row).some(
        val => val != null && String(val).toLowerCase().includes(normalizedSearch)
      );
      if (!matchesSearch) return false;

      return activeFilterDefinitions.every(filter => {
        const selected = filterValues[filter.key] ?? 'all';
        if (selected === 'all') return true;
        return String(row[filter.key]) === selected;
      });
    });
  }, [data, searchQuery, activeFilterDefinitions, filterValues]);

  const pagedRows = useMemo(
    () => filteredRows.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage),
    [filteredRows, page, rowsPerPage],
  );

  // Override 'id' with sequential row numbers for display; save real DB id in _dbId
  const numberedPagedRows = useMemo(
    () => pagedRows.map((row, idx) => ({ ...row, _dbId: row.id, id: page * rowsPerPage + idx + 1 })),
    [pagedRows, page, rowsPerPage],
  );

  useEffect(() => {
    const maxPage = Math.max(0, Math.ceil(filteredRows.length / rowsPerPage) - 1);
    if (page > maxPage) setPage(maxPage);
  }, [filteredRows.length, page, rowsPerPage]);

  // --- Dialog field configs ---
  const dialogFields = useMemo<FieldConfig[]>(() => {
    switch (activeTabKey) {
      case 'products':
        return [
          { name: 'code', label: 'รหัสสินค้า', type: 'text', required: true, placeholder: 'เช่น VAC-CSF-001' },
          { name: 'name', label: 'ชื่อสินค้า', type: 'text', required: true, placeholder: 'เช่น วัคซีนอหิวาต์สุกร (CSF)' },
          { name: 'itemCategoryId', label: 'หมวดสินค้า', type: 'select', required: true, options: lookups.categories.filter(c => c.isActive).map(c => ({ label: c.name, value: c.id })) },
          { name: 'uomConversionId', label: 'หน่วยรับเข้า/ส่งออก', type: 'select', required: true, options: convertedUnitOptions },
          { name: 'isCentralItem', label: 'เป็น item กลาง', type: 'checkbox' },
          { name: 'itemLotPolicyId', label: 'นโยบายล็อต', type: 'select', options: lookups.lotPolicies.map(lp => ({ label: lp.name, value: lp.id })) },
          { name: 'minStockQty', label: 'ขั้นต่ำสต็อก', type: 'number', allowEmpty: true, placeholder: 'เช่น 10' },
          { name: 'maxStockQty', label: 'ขั้นสูงสต็อก', type: 'number', allowEmpty: true, placeholder: 'เช่น 100' },
          { name: 'cost', label: 'ราคาทุน', type: 'number', allowEmpty: true, placeholder: 'กรอกราคาทุน (เว้นว่างได้ ระบบจะเป็น 0)' },
          { name: 'price', label: 'ราคาขาย', type: 'number', allowEmpty: true, placeholder: 'กรอกราคาขาย (เว้นว่างได้ ระบบจะเป็น 0)' }
        ];
      case 'categories':
        return [
          { name: 'code', label: 'รหัสหมวดหมู่', type: 'text', required: true },
          { name: 'name', label: 'ชื่อหมวดหมู่', type: 'text', required: true }
        ];
      case 'units':
        return [
          { name: 'code', label: 'รหัสหน่วย', type: 'text', required: true },
          { name: 'name', label: 'ชื่อหน่วย', type: 'text', required: true }
        ];
      case 'conversions':
        return [
          {
            name: 'uomId',
            label: 'หน่วยรับเข้า/ส่งออก',
            type: 'select',
            required: true,
            options: lookups.uoms
              .filter((u) => u.isActive)
              .map((u) => ({ label: u.name, value: u.id })),
          },
          {
            name: 'stockUomId',
            label: 'หน่วยตัดสต็อก',
            type: 'select',
            required: true,
            options: lookups.uoms
              .filter((u) => u.isActive)
              .map((u) => ({ label: u.name, value: u.id })),
          },
          {
            name: 'conversionFactor',
            label: 'อัตราแปลง',
            type: 'number',
            required: true,
            placeholder: 'เช่น 100',
          },
        ];
      case 'lot-policies':
        return [
          { name: 'name', label: 'ชื่อนโยบาย', type: 'text', required: true },
          { name: 'strategy', label: 'รูปแบบ', type: 'select', required: true, options: [{ label: 'FIFO', value: 'FIFO' }, { label: 'FEFO', value: 'FEFO' }, { label: 'LIFO', value: 'LIFO' }] },
          { name: 'isLotRequired', label: 'บังคับระบุล็อต', type: 'checkbox' },
          { name: 'isExpiryRequired', label: 'บังคับวันหมดอายุ', type: 'checkbox' }
        ];
      case 'partners':
        return [
          { name: 'code', label: 'รหัสคู่ค้า', type: 'text', required: true },
          { name: 'name', label: 'ชื่อคู่ค้า', type: 'text', required: true },
          { name: 'type', label: 'ประเภท', type: 'select', required: true, options: [{ label: 'VENDER', value: 'VENDER' }, { label: 'CUSTOMER', value: 'CUSTOMER' }, { label: 'INTERNAL', value: 'INTERNAL' }] },
          { name: 'taxId', label: 'เลขประจำตัวผู้เสียภาษี', type: 'text' },
          { name: 'phone', label: 'เบอร์โทรศัพท์', type: 'text' },
          { name: 'email', label: 'อีเมล', type: 'text' },
          { name: 'address', label: 'ที่อยู่', type: 'text' }
        ];
      case 'farm-type':
        return [
          { name: 'code', label: 'รหัสประเภทการเลี้ยง', type: 'text', required: true },
          { name: 'name', label: 'ประเภทการเลี้ยง (เช่น หมูขุน, หมูหย่านม)', type: 'text', required: true },
          { name: 'description', label: 'คำอธิบายเพิ่มเติม', type: 'text' }
        ];
      case 'breed':
        return [
          { name: 'code', label: 'รหัสสายพันธุ์', type: 'text', required: true },
          { name: 'name', label: 'ชื่อสายพันธุ์', type: 'text', required: true },
          { name: 'description', label: 'คำอธิบายเพิ่มเติม', type: 'text' }
        ];
      case 'disease-group':
        return [
          { name: 'code', label: 'รหัสกลุ่มโรค', type: 'text', required: true },
          { name: 'name', label: 'ชื่อกลุ่มโรค', type: 'text', required: true },
          { name: 'description', label: 'คำอธิบายเพิ่มเติม', type: 'text' },
          { name: 'symptomDescription', label: 'อาการเบื้องต้น', type: 'text' }
        ];
      case 'treatment-type':
        return [
          { name: 'code', label: 'รหัสประเภทการรักษา', type: 'text', required: true },
          { name: 'name', label: 'ชื่อประเภทการรักษา', type: 'text', required: true }
        ];
      case 'loss-type':
        return [
          { name: 'code', label: 'รหัสประเภทการสูญเสีย', type: 'text', required: true },
          { name: 'name', label: 'ชื่อประเภทการสูญเสีย', type: 'text', required: true },
          { name: 'description', label: 'คำอธิบายเพิ่มเติม', type: 'text' }
        ];
      case 'death-cause':
        return [
          { name: 'code', label: 'รหัสสาเหตุการตาย', type: 'text', required: true },
          { name: 'name', label: 'สาเหตุการตาย', type: 'text', required: true },
          { name: 'mortalityTypeId', label: 'ประเภทการสูญเสีย', type: 'select', required: true, options: lookups.mortalityTypes.map(m => ({ label: m.name, value: m.id })) }
        ];
      case 'system-prefix-categories':
        return [
          { name: 'categoryCode', label: 'รหัสหมวดหมู่', type: 'text', required: true },
          { name: 'categoryName', label: 'ชื่อหมวดหมู่คำนำหน้า', type: 'text', required: true },
          { name: 'description', label: 'คำอธิบาย', type: 'text' },
        ];
      case 'system-prefixes':
        return [
          {
            name: 'categoryId',
            label: 'หมวดหมู่คำนำหน้า',
            type: 'select',
            required: true,
            options: lookups.prefixCategories
              .filter((c) => c.isActive)
              .map((c) => ({ label: `${c.categoryName} (${c.categoryCode})`, value: c.id })),
          },
          { name: 'prefixCode', label: 'รหัสคำนำหน้า', type: 'text', required: true },
          { name: 'description', label: 'คำอธิบาย', type: 'text' },
        ];
      default: return [];
    }
  }, [activeTabKey, convertedUnitOptions, lookups]);

  // --- Column definitions ---
  const columns = useMemo<Column<any>[]>(() => {
    const editDeleteCol: Column<any> = {
      id: 'manage',
      label: 'จัดการ',
      align: 'center',
      minWidth: 92,
      sortable: false,
      format: (_val, row) => (
        <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5 }}>
          <Tooltip title="แก้ไขรายการ">
            <IconButton
              size="small"
              sx={{ color: primary }}
              onClick={(e) => {
                e.stopPropagation();
                handleOpenDialog('edit', { ...row, id: row._dbId });
              }}
            >
              <EditOutlined fontSize="inherit" />
            </IconButton>
          </Tooltip>
          <Tooltip title="ลบรายการ">
            <IconButton
              size="small"
              sx={{ color: '#ef4444' }}
              onClick={(e) => {
                e.stopPropagation();
                handleDelete(row._dbId ?? row.id);
              }}
            >
              <DeleteOutline fontSize="inherit" />
            </IconButton>
          </Tooltip>
        </Box>
      ),
    };

    switch (activeTabKey) {
      case 'products': {
        const centralItemIds = new Set(
          lookups.centralWarehouseItems
            .filter((row) => Boolean(row?.isCenterItem))
            .map((row) => Number(row?.itemId))
            .filter((id) => Number.isFinite(id) && id > 0),
        );
        return [
          { id: 'id', label: 'ID', minWidth: 52, align: 'center' as const },
          { id: 'code', label: 'รหัส' },
          { id: 'name', label: 'ชื่อรายการ' },
          { id: 'itemCategoryName', label: 'หมวดสินค้า' },
          {
            id: 'type',
            label: 'ประเภท',
            format: (_val, row) => (centralItemIds.has(Number(row?._dbId ?? row?.id)) ? 'กลาง' : 'ปกติ'),
          },
          {
            id: 'minStockQty',
            label: 'ขั้นต่ำ',
            format: (_val, row) => formatStockThreshold(row?.minStockQty),
          },
          {
            id: 'maxStockQty',
            label: 'ขั้นสูง',
            format: (_val, row) => formatStockThreshold(row?.maxStockQty),
          },
          {
            id: 'receiveUom',
            label: 'หน่วยรับเข้า/ส่งออก',
            format: (_val, row) => {
              return row?.receiveUomName ?? '-';
            },
          },
          { id: 'cost', label: 'ราคาทุน' },
          { id: 'price', label: 'ราคาขาย' },
          { id: 'isActive', label: 'สถานะ', format: v => v ? 'ใช้งาน' : 'ไม่ใช้งาน' },
          editDeleteCol,
        ];
      }
      case 'categories':
      case 'units':
        return [
          { id: 'id', label: 'ID', minWidth: 52, align: 'center' as const },
          { id: 'code', label: 'รหัส' },
          { id: 'name', label: 'ชื่อ' },
          { id: 'isActive', label: 'สถานะ', format: v => v ? 'ใช้งาน' : 'ไม่ใช้งาน' },
          editDeleteCol,
        ];
      case 'conversions':
        return [
          { id: 'id', label: 'ID', minWidth: 52, align: 'center' as const },
          {
            id: 'uomName',
            label: 'หน่วยรับเข้า/ส่งออก',
            format: (_val, row) => {
              return row?.uomName ?? '-';
            },
          },
          { id: 'conversionFactor', label: 'อัตราแปลง' },
          {
            id: 'stockUom',
            label: 'หน่วยตัดสต็อก',
            format: (_val, row) => {
              const matchedItem = lookups.items.find((item) => item.id === row?.itemId);
              const name = row?.stockUomName
                ?? matchedItem?.baseUomName
                ?? lookups.uoms.find((u) => u.id === (row?.stockUomId ?? matchedItem?.baseUomId))?.name
                ?? '-';
              return name;
            },
          },
          { id: 'isActive', label: 'สถานะ', format: v => v ? 'ใช้งาน' : 'ไม่ใช้งาน' },
          editDeleteCol,
        ];
      case 'lot-policies':
        return [
          { id: 'id', label: 'ID', minWidth: 52, align: 'center' as const },
          { id: 'name', label: 'ชื่อนโยบาย' },
          { id: 'strategy', label: 'รูปแบบ' },
          { id: 'isLotRequired', label: 'บังคับล็อต', format: v => v ? 'ใช่' : 'ไม่' },
          { id: 'isExpiryRequired', label: 'บังคับวันหมดอายุ', format: v => v ? 'ใช่' : 'ไม่' },
          { id: 'isActive', label: 'สถานะ', format: v => v ? 'ใช้งาน' : 'ไม่ใช้งาน' },
          editDeleteCol,
        ];
      case 'partners':
        return [
          { id: 'id', label: 'ID', minWidth: 52, align: 'center' as const },
          { id: 'code', label: 'รหัส' },
          { id: 'name', label: 'ชื่อคู่ค้า' },
          { id: 'type', label: 'ประเภท' },
          { id: 'phone', label: 'เบอร์โทร' },
          { id: 'isActive', label: 'สถานะ', format: v => v ? 'ใช้งาน' : 'ไม่ใช้งาน' },
          editDeleteCol,
        ];
      case 'farm-type':
        return [
          { id: 'id', label: 'ID', minWidth: 52, align: 'center' as const },
          { id: 'code', label: 'รหัส' },
          { id: 'name', label: 'ประเภทการเลี้ยง' },
          { id: 'description', label: 'คำอธิบาย' },
          { id: 'isActive', label: 'สถานะ', format: v => v ? 'ใช้งาน' : 'ไม่ใช้งาน' },
          editDeleteCol,
        ];
      case 'breed':
        return [
          { id: 'id', label: 'ID', minWidth: 52, align: 'center' as const },
          { id: 'code', label: 'รหัส' },
          { id: 'name', label: 'สายพันธุ์' },
          { id: 'description', label: 'คำอธิบาย' },
          { id: 'isActive', label: 'สถานะ', format: v => v ? 'ใช้งาน' : 'ไม่ใช้งาน' },
          editDeleteCol,
        ];
      case 'disease-group':
        return [
          { id: 'id', label: 'ID', minWidth: 52, align: 'center' as const },
          { id: 'code', label: 'รหัส' },
          { id: 'name', label: 'กลุ่มโรค' },
          { id: 'description', label: 'คำอธิบาย' },
          { id: 'symptomDescription', label: 'อาการเบื้องต้น' },
          { id: 'isActive', label: 'สถานะ', format: v => v ? 'ใช้งาน' : 'ไม่ใช้งาน' },
          editDeleteCol,
        ];
      case 'treatment-type':
        return [
          { id: 'id', label: 'ID', minWidth: 52, align: 'center' as const },
          { id: 'code', label: 'รหัส' },
          { id: 'name', label: 'ประเภทการรักษา' },
          { id: 'isActive', label: 'สถานะ', format: v => v ? 'ใช้งาน' : 'ไม่ใช้งาน' },
          editDeleteCol,
        ];
      case 'loss-type':
        return [
          { id: 'id', label: 'ID', minWidth: 52, align: 'center' as const },
          { id: 'code', label: 'รหัส' },
          { id: 'name', label: 'ประเภทการสูญเสีย' },
          { id: 'description', label: 'คำอธิบาย' },
          { id: 'isActive', label: 'สถานะ', format: v => v ? 'ใช้งาน' : 'ไม่ใช้งาน' },
          editDeleteCol,
        ];
      case 'death-cause':
        return [
          { id: 'id', label: 'ID', minWidth: 52, align: 'center' as const },
          { id: 'code', label: 'รหัส' },
          { id: 'name', label: 'สาเหตุการตาย' },
          { id: 'mortalityTypeName', label: 'ประเภทการสูญเสีย' },
          { id: 'isActive', label: 'สถานะ', format: v => v ? 'ใช้งาน' : 'ไม่ใช้งาน' },
          editDeleteCol,
        ];
      case 'system-prefix-categories':
        return [
          { id: 'id', label: 'ID', minWidth: 52, align: 'center' as const },
          { id: 'categoryCode', label: 'รหัสหมวดหมู่' },
          { id: 'categoryName', label: 'ชื่อหมวดหมู่คำนำหน้า' },
          { id: 'description', label: 'คำอธิบาย' },
          { id: 'isActive', label: 'สถานะ', format: v => v ? 'ใช้งาน' : 'ไม่ใช้งาน' },
          editDeleteCol,
        ];
      case 'system-prefixes':
        return [
          { id: 'id', label: 'ID', minWidth: 52, align: 'center' as const },
          { id: 'prefixCode', label: 'รหัสคำนำหน้า' },
          { id: 'categoryName', label: 'หมวดหมู่คำนำหน้า' },
          { id: 'description', label: 'คำอธิบาย' },
          { id: 'isActive', label: 'สถานะ', format: v => v ? 'ใช้งาน' : 'ไม่ใช้งาน' },
          editDeleteCol,
        ];
      default:
        return [
          { id: 'id', label: 'ID', minWidth: 52, align: 'center' as const },
          { id: 'name', label: 'ชื่อรายการ' },
          editDeleteCol,
        ];
    }
  }, [activeTabKey, lookups.centralWarehouseItems, lookups.items, lookups.uoms, primary]);

  const hasCodeColumn = useMemo(
    () => columns.some((column) => String(column.id).trim().toLowerCase() === 'code'),
    [columns],
  );
  const hasStatusColumn = useMemo(
    () =>
      columns.some((column) => {
        const normalizedId = String(column.id).trim().toLowerCase();
        const normalizedLabel = String(column.label).trim().toLowerCase();
        return normalizedId === 'status' || normalizedId === 'isactive' || normalizedLabel === 'สถานะ';
      }),
    [columns],
  );
  const isSpecialTab = ['area-farms', 'area-zones', 'area-houses', 'area-silos'].includes(currentTabKey);
  const isOverview = currentTabKey === 'overview';

  return (
    <Box sx={{ height: 'calc(100dvh - 52px)', display: 'flex', flexDirection: 'column', overflow: 'hidden', p: { xs: 2, md: 3 } }}>
      <MasterSectionLayout
        activeTabKey={currentTabKey}
        onTabChange={handleTabChange}
        activeCategoryKey={currentCategoryKey}
        onCategoryChange={handleCategoryChange}
        hideTabsForCategoryKeys={['warehouse']}
        sx={{ flex: 1, minHeight: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}
      >
        {isOverview ? (
          <MasterOverviewPage lookups={lookups} />
        ) : isSpecialTab ? (
          <UserAssignmentDataProvider workspaceMode="full">
            <Box sx={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
              {currentTabKey === 'area-farms' && <FarmPage />}
              {currentTabKey === 'area-zones' && <ZonePage />}
              {currentTabKey === 'area-houses' && <HousePage />}
              {currentTabKey === 'area-silos' && <SiloPage />}
            </Box>
          </UserAssignmentDataProvider>
        ) : (
          <>
            {activeCategoryKey === 'warehouse' && (
              <SectionTabsCard
                wrapperSx={{ mb: 1.5 }}
                tabs={warehouseTabs.map((tab) => ({ key: tab.key, label: tab.label }))}
                activeKey={currentTabKey}
                onTabChange={handleTabChange}
                mutedTextColor={colors.subtitle}
                lineColor={colors.line}
                tabIdleColor={colors.subtitle}
                cardBackground={colors.cardBg}
              />
            )}
            <ContentCard borderColor={colors.line} backgroundColor={colors.cardBg}>
              <Box sx={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>

            {/* Toolbar */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap', mb: isFilterExpanded ? 1 : 1.25 }}>
              <SearchField
                placeholder={`ค้นหา${contentTitle}`}
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setPage(0); }}
                sx={{
                  flex: 1,
                  minWidth: { xs: '100%', md: 260 },
                  maxWidth: { md: 360 },
                  '& .MuiOutlinedInput-root': { bgcolor: alpha(colors.cardBg, 0.7) },
                }}
              />
              <Button
                variant="outlined"
                startIcon={<FilterList fontSize="small" />}
                onClick={handleToggleFilterPanel}
                sx={{
                  minHeight: 40,
                  textTransform: 'none',
                  borderColor: activeFilterCount > 0 || isFilterExpanded ? alpha('#1d4ed8', 0.65) : colors.line,
                  color: activeFilterCount > 0 || isFilterExpanded ? '#1d4ed8' : colors.subtitle,
                  bgcolor: alpha(colors.cardBg, 0.6),
                  '&:hover': {
                    borderColor: activeFilterCount > 0 || isFilterExpanded ? '#1d4ed8' : colors.title,
                    bgcolor: alpha(colors.cardBg, 0.76),
                  },
                }}
              >
                ตัวกรอง{activeFilterCount > 0 ? ` (${activeFilterCount})` : ''}
              </Button>
              <Button
                size="medium"
                variant="contained"
                disableElevation
                startIcon={<Add />}
                onClick={() => handleOpenDialog('create')}
                sx={{
                  minWidth: 132,
                  minHeight: 40,
                  ml: { md: 'auto' },
                  bgcolor: '#1d4ed8',
                  color: '#ffffff',
                  fontSize: '13px',
                  fontWeight: 700,
                  textTransform: 'none',
                  whiteSpace: 'nowrap',
                  '&:hover': { bgcolor: '#1e40af' },
                }}
              >
                เพิ่ม{contentTitle}
              </Button>
            </Box>

            {/* Filter Panel */}
            <Collapse in={isFilterExpanded} timeout="auto">
              <Paper
                variant="outlined"
                sx={{
                  borderRadius: 2,
                  borderColor: colors.line,
                  bgcolor: alpha(colors.cardBg, theme.palette.mode === 'dark' ? 0.84 : 0.96),
                  p: { xs: 1.25, md: 1.5 },
                  mb: 1.25,
                }}
              >
                {primaryFilterDefinitions.length > 0 && (
                  <Box>
                    <Typography sx={{ fontSize: '11px', fontWeight: 700, color: colors.title, lineHeight: '16px', mb: 0.75 }}>
                      ข้อมูลรายการ
                    </Typography>
                    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))' }, gap: 1 }}>
                      {primaryFilterDefinitions.map(filter => (
                        <FormControl key={filter.key} size="small" sx={{ width: '100%', maxWidth: { xs: '100%', md: 280 }, '& .MuiOutlinedInput-root': { minHeight: 36 } }}>
                          <InputLabel>{filter.label}</InputLabel>
                          <Select
                            value={draftFilterValues[filter.key] ?? 'all'}
                            label={filter.label}
                            onChange={e => handleDraftFilterChange(filter.key, e.target.value)}
                            sx={{ bgcolor: alpha(colors.cardBg, 0.7) }}
                          >
                            <MenuItem value="all">ทั้งหมด</MenuItem>
                            {filter.options.map(o => <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>)}
                          </Select>
                        </FormControl>
                      ))}
                    </Box>
                  </Box>
                )}

                {secondaryFilterDefinitions.length > 0 && (
                  <>
                    <Divider sx={{ borderColor: colors.line, my: 1 }} />
                    <Box>
                      <Typography sx={{ fontSize: '11px', fontWeight: 700, color: colors.title, lineHeight: '16px', mb: 0.75 }}>
                        เงื่อนไขเพิ่มเติม
                      </Typography>
                      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))', lg: 'repeat(3, minmax(0, 1fr))' }, gap: 1 }}>
                        {secondaryFilterDefinitions.map(filter => (
                          <FormControl key={filter.key} size="small" sx={{ width: '100%', maxWidth: { xs: '100%', md: 280 }, '& .MuiOutlinedInput-root': { minHeight: 36 } }}>
                            <InputLabel>{filter.label}</InputLabel>
                            <Select
                              value={draftFilterValues[filter.key] ?? 'all'}
                              label={filter.label}
                              onChange={e => handleDraftFilterChange(filter.key, e.target.value)}
                              sx={{ bgcolor: alpha(colors.cardBg, 0.7) }}
                            >
                              <MenuItem value="all">ทั้งหมด</MenuItem>
                              {filter.options.map(o => <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>)}
                            </Select>
                          </FormControl>
                        ))}
                      </Box>
                    </Box>
                  </>
                )}

                <Divider sx={{ borderColor: colors.line, my: 1 }} />
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                  <Button variant="text" onClick={handleClearDraftFilters} sx={{ textTransform: 'none', color: colors.subtitle }}>
                    ล้างค่า
                  </Button>
                  <Button
                    variant="contained"
                    onClick={handleApplyFilters}
                    sx={{ textTransform: 'none', boxShadow: 'none', bgcolor: primary, '&:hover': { bgcolor: primaryHover, boxShadow: 'none' } }}
                  >
                    นำไปใช้
                  </Button>
                </Box>
              </Paper>
            </Collapse>

            {/* Data Table */}
            <DataTable<any>
              columns={columns}
              data={numberedPagedRows}
              totalCount={filteredRows.length}
              page={page}
              rowsPerPage={rowsPerPage}
              onPageChange={setPage}
              onRowsPerPageChange={(value) => { setRowsPerPage(value); setPage(0); }}
              loading={loading}
              rowsPerPageOptions={[25, 50, 100]}
              footerSummaryText={`ทั้งหมด ${filteredRows.length} รายการ`}
              stickyHeader
              sortable={false}
              emptyMessage="ไม่พบข้อมูล"
              lockEntityColumns
              includeCodeColumn={hasCodeColumn}
              includeStatusColumn={hasStatusColumn}
              onEditRow={(row) => {
                const targetId = row._dbId ?? row.id;
                handleOpenDialog('edit', { ...row, id: targetId });
              }}
              onDeleteRow={(row) => {
                const targetId = row._dbId ?? row.id;
                handleDelete(targetId);
              }}
              onToggleRowStatus={
                hasStatusColumn
                  ? (row) => {
                      void handleToggleStatus(row);
                    }
                  : undefined
              }
              isRowActive={(row) => Boolean(row.isActive)}
              paperSx={{
                flex: 1,
                minHeight: 0,
                borderRadius: 1.25,
                borderColor: colors.line,
                bgcolor: colors.cardBg,
                display: 'flex',
                flexDirection: 'column',
              }}
              tableContainerSx={{
                flex: 1,
                minHeight: 0,
                overflowY: 'auto',
                overflowX: 'hidden',
                scrollbarGutter: 'auto',
                scrollbarWidth: 'thin',
                scrollbarColor: `${alpha(colors.subtitle, 0.6)} ${alpha(colors.line, 0.08)}`,
                '&::-webkit-scrollbar': { width: 8, height: 8 },
                '&::-webkit-scrollbar-track': { backgroundColor: alpha(colors.line, 0.08), borderLeft: `1px solid ${alpha(colors.line, 0.45)}`, borderRadius: 999, marginBlock: 6 },
                '&::-webkit-scrollbar-thumb': { backgroundColor: alpha(colors.subtitle, 0.58), borderRadius: 999, border: `1px solid ${alpha(colors.cardBg, 0.65)}` },
                '&::-webkit-scrollbar-thumb:hover': { backgroundColor: alpha(colors.subtitle, 0.75) },
              }}
              tableSx={{
                tableLayout: 'fixed',
                width: '100%',
                borderCollapse: 'separate',
                borderSpacing: 0,
                '& .MuiTableCell-root': { px: 1.25 },
                '& .MuiTableHead-root .MuiTableCell-root': {
                  borderBottom: `1px solid ${colors.line}`,
                  color: colors.title,
                  fontSize: '13px',
                },
                '& .MuiTableBody-root .MuiTableCell-root': {
                  borderBottom: `1px solid ${colors.line}`,
                  color: colors.subtitle,
                  fontSize: '12px',
                },
                  '& .MuiTableHead-root .MuiTableCell-root:not(:last-of-type), & .MuiTableBody-root .MuiTableCell-root:not(:last-of-type)': {
                  borderRight: `1px solid ${colors.line}`,
                },
              }}
            />
              </Box>
            </ContentCard>
          </>
        )}

        <MasterCrudDialog
          open={isDialogOpen}
          onClose={handleCloseDialog}
          onSave={handleSave}
          title={dialogMode === 'create' ? `เพิ่ม${contentTitle}` : `แก้ไข${contentTitle}`}
          fields={dialogFields}
          initialData={editingRecord}
        />

        {/* Delete Confirmation Dialog */}
        <Dialog
          open={deleteConfirmOpen}
          onClose={() => setDeleteConfirmOpen(false)}
          PaperProps={{
            sx: { borderRadius: 3, p: 1, minWidth: 320 }
          }}
        >
          <DialogTitle sx={{ fontWeight: 700, color: colors.title }}>
            ยืนยันการลบข้อมูล
          </DialogTitle>
          <DialogContent>
            <DialogContentText sx={{ color: colors.subtitle }}>
              คุณต้องการลบข้อมูลรายการนี้ใช่หรือไม่? การดำเนินการนี้ไม่สามารถย้อนกลับได้
            </DialogContentText>
          </DialogContent>
          <DialogActions sx={{ p: 2, pt: 1 }}>
            <Button
              onClick={() => setDeleteConfirmOpen(false)}
              sx={{ color: colors.subtitle, fontWeight: 600 }}
            >
              ยกเลิก
            </Button>
            <Button
              onClick={confirmDelete}
              variant="contained"
              color="error"
              sx={{
                borderRadius: 2,
                fontWeight: 600,
                px: 3,
                boxShadow: 'none',
                '&:hover': { boxShadow: 'none' }
              }}
              autoFocus
            >
              ยืนยันการลบ
            </Button>
          </DialogActions>
        </Dialog>
      </MasterSectionLayout>
    </Box>
  );
}
