'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Viewer from 'viewerjs';
import { Box, Button, Stack, TextField, Typography } from '@mui/material';
import { Save as SaveIcon } from '@mui/icons-material';
import Swal from 'sweetalert2';

import {
  TABS,
  TAB_IDS,
  UI,
  INITIAL_FEED_FORM,
  INITIAL_MED_FORM,
  INITIAL_MORTALITY_FORM,
  STATIC_MED_OPTIONS,
  FORM_INPUT_SX,
  PRIMARY_ACTION_SX,
  SECONDARY_ACTION_SX,
} from './constants';
import {
  getTodayIsoDate,
  normalizeAgeDays,
  calculateAgeDaysFromReceivedDate,
  formatDdmmyyFromIso,
  extractRun4FromMortalityDocNo,
  extractRun4FromMortalityRowId,
  getMortalityImageSrc,
  normalizePotentialBuddhistIsoDate,
  normalizeHouseCode,
  getPositiveNumber,
  sumAllocatedHeadcount,
  buildBatchAllocationKey,
  resolveFarmCodeFromContext,
  mergeBatchAllocations,
  summarizeWarehouseBalances,
  sortHouseGroups,
  buildPlanSwitchKey,
} from './utils';

import { httpClient } from '@/core/api/http-client';
import { uploadService } from '@/core/api/upload.service';
import { masterApi } from '@/features/admin/master/services/master.api';
import { authService } from '@/features/auth/services/auth.service';
import { vaccinationPlanService } from '@/features/operations/health/services/vaccination-plan.service';
import { feedingService } from '@/features/operations/feeding/services/feeding.service';
import {
  FACILITY_CHANGED_EVENT,
  getCurrentFacilityId,
  getCurrentFacilityCode,
  getActivityDailyHouseSelection,
  setActivityDailyHouseSelection,
  getUserFarmScopeNodes,
} from '@/lib/facility-context';
import PageTabs from '@/design-system/components/molecules/PageTabs';

// Components
import ActivityDailyHeader from './ActivityDailyHeader';
import OverviewTab from './tabs/OverviewTab';
import HealthTab from './tabs/HealthTab';
import MortalityTab from './tabs/MortalityTab';
import FeedTab from './tabs/FeedTab';
import MedsTab from './tabs/MedsTab';
import MediaTab from './tabs/MediaTab';
import MortalityAttachDialog from './dialogs/MortalityAttachDialog';
import MortalityDetailDialog from './dialogs/MortalityDetailDialog';

function resolveHouseSelection(houseGroups, preferredGroupId, preferredHouseCode) {
  if (!Array.isArray(houseGroups) || houseGroups.length === 0) {
    return { groupId: '', houseCode: '' };
  }

  const targetGroup = houseGroups.find((group) => group.id === preferredGroupId) || null;
  if (targetGroup) {
    const targetHouse =
      (Array.isArray(targetGroup.houses) ? targetGroup.houses : []).find(
        (house) => house.code === preferredHouseCode,
      ) || null;

    return {
      groupId: targetGroup.id || '',
      houseCode: targetHouse?.code || targetGroup.houses?.[0]?.code || '',
    };
  }

  const fallbackGroup = houseGroups[0] || null;
  return {
    groupId: fallbackGroup?.id || '',
    houseCode: fallbackGroup?.houses?.[0]?.code || '',
  };
}

export default function ActivityDailyPage() {
  // ── Core State ──
  const [activeTab, setActiveTab] = useState('overview');
  const [saving, setSaving] = useState(false);
  const [hydrating, setHydrating] = useState(false);
  const [entryId, setEntryId] = useState(null);
  const [entryIdsByTab, setEntryIdsByTab] = useState({});
  const [entryStatus, setEntryStatus] = useState('DRAFT');
  const [entryDate, setEntryDate] = useState(() => getTodayIsoDate());
  const [generalRemark, setGeneralRemark] = useState('');
  const rowIdRef = useRef(0);

  // ── Facility State ──
  const [farmOptions, setFarmOptions] = useState([]);
  const [houseGroupMap, setHouseGroupMap] = useState({});
  const [selectedFarm, setSelectedFarm] = useState('');
  const [mainFacilityCode, setMainFacilityCode] = useState('');
  const [mainFacilityId, setMainFacilityId] = useState(null);
  const [currentUserName, setCurrentUserName] = useState('System');
  const deepLinkContextRef = useRef({
    tab: '',
    entryDate: '',
    farmCode: '',
    groupId: '',
    houseCode: '',
  });
  const houseSelectionSignatureRef = useRef('');

  // ── Health State ──
  const [healthToggles, setHealthToggles] = useState({
    eating: 'normal',
    movement: 'normal',
    breathing: 'normal',
    skin: 'normal',
  });

  // ── Feed State ──
  const [feedRecords, setFeedRecords] = useState([]);
  const [feedForm, setFeedForm] = useState(INITIAL_FEED_FORM);
  const [feedPlanSuggestions, setFeedPlanSuggestions] = useState([]);
  const [feedPlanLoading, setFeedPlanLoading] = useState(false);
  const [feedExecutionContext, setFeedExecutionContext] = useState(null);
  const [feedExecutionLoading, setFeedExecutionLoading] = useState(false);
  const [feedItemOptions, setFeedItemOptions] = useState([]);
  const [farmWarehouseOptions, setFarmWarehouseOptions] = useState([]);

  // ── Meds State ──
  const [medRecords, setMedRecords] = useState([]);
  const [medForm, setMedForm] = useState(INITIAL_MED_FORM);
  const [medItemOptions, setMedItemOptions] = useState(STATIC_MED_OPTIONS);
  const [planSuggestions, setPlanSuggestions] = useState([]);
  const [farmDayPlanSuggestions, setFarmDayPlanSuggestions] = useState([]);
  const [planLoading, setPlanLoading] = useState(false);
  const [medExecutionContext, setMedExecutionContext] = useState(null);
  const [medExecutionLoading, setMedExecutionLoading] = useState(false);
  const medExecutionCacheRef = useRef(new Map());

  // ── Mortality State ──
  const [mortalityRecords, setMortalityRecords] = useState([]);
  const [mortalityForm, setMortalityForm] = useState(INITIAL_MORTALITY_FORM);
  const [mortalityAttachDialogOpen, setMortalityAttachDialogOpen] = useState(false);
  const [mortalityDetailDialogOpen, setMortalityDetailDialogOpen] = useState(false);
  const [mortalityDetailRecord, setMortalityDetailRecord] = useState(null);
  const [mortalityDetailIndex, setMortalityDetailIndex] = useState(0);
  const mortalityCameraInputRef = useRef(null);
  const mortalityUploadInputRef = useRef(null);
  const mortalityGalleryRef = useRef(null);
  const mortalityViewerRef = useRef(null);
  const mortalityPendingFilesRef = useRef(new Map());

  // ── Derived State ──
  const houseGroups = houseGroupMap[selectedFarm] || [];
  const [selectedGroup, setSelectedGroup] = useState(houseGroups[0]?.id || '');
  const [selectedHouse, setSelectedHouse] = useState(houseGroups[0]?.houses?.[0]?.code || '');

  const selectedFacility = useMemo(
    () => farmOptions.find((item) => item.code === selectedFarm) ?? null,
    [farmOptions, selectedFarm],
  );
  const currentGroupHouses = useMemo(
    () => houseGroups.find((group) => group.id === selectedGroup)?.houses ?? [],
    [houseGroups, selectedGroup],
  );
  const selectedHouseInfo = useMemo(
    () => currentGroupHouses.find((house) => house.code === selectedHouse) ?? null,
    [currentGroupHouses, selectedHouse],
  );
  const autoDeathDay = useMemo(
    () => normalizeAgeDays(selectedHouseInfo?.ageDays),
    [selectedHouseInfo?.ageDays],
  );
  const hasOpenedHouses = houseGroups.length > 0 && currentGroupHouses.length > 0;
  const persistHouseSelection = useCallback((farmCode, groupId, houseCode) => {
    if (!farmCode) return;
    setActivityDailyHouseSelection(farmCode, {
      groupId: groupId || '',
      houseCode: houseCode || '',
    });
  }, []);

  const applyHouseSelection = useCallback(
    (farmCode, groupId, houseCode) => {
      if (!farmCode) return;
      setSelectedGroup(groupId || '');
      setSelectedHouse(houseCode || '');
      persistHouseSelection(farmCode, groupId, houseCode);
    },
    [persistHouseSelection],
  );

  // Meds derived
  const medBatchAllocations = useMemo(
    () => (Array.isArray(medForm.batchAllocations) ? medForm.batchAllocations : []),
    [medForm.batchAllocations],
  );
  const medAllocatedHeadcount = useMemo(
    () => sumAllocatedHeadcount(medBatchAllocations),
    [medBatchAllocations],
  );
  const medWarehouseBalances = useMemo(
    () =>
      Array.isArray(medExecutionContext?.warehouseBalances)
        ? medExecutionContext.warehouseBalances
        : [],
    [medExecutionContext],
  );
  const medWarehouseOptions = useMemo(
    () => summarizeWarehouseBalances(medWarehouseBalances),
    [medWarehouseBalances],
  );
  const medSelectedWarehouseLots = useMemo(() => {
    const targetWarehouseId = Number(medForm.warehouseId || 0);
    if (targetWarehouseId <= 0) return [];
    return medWarehouseBalances.filter(
      (balance) =>
        Number(balance?.warehouseId || 0) === targetWarehouseId &&
        Number(balance?.stockLotId || 0) > 0,
    );
  }, [medForm.warehouseId, medWarehouseBalances]);
  const otherHousePlanSuggestions = useMemo(
    () =>
      Array.from(
        new Map(
          (Array.isArray(farmDayPlanSuggestions) ? farmDayPlanSuggestions : [])
            .filter(
              (task) => String(task?.houseCode || '').trim() !== String(selectedHouse || '').trim(),
            )
            .map((task) => [buildPlanSwitchKey(task), task]),
        ).values(),
      ),
    [farmDayPlanSuggestions, selectedHouse],
  );

  // ── Helpers ──
  const nextRowId = () => {
    rowIdRef.current += 1;
    return `row-${Date.now()}-${rowIdRef.current}`;
  };

  const visibleTabs = useMemo(
    () => (hasOpenedHouses ? TABS : TABS.filter((tab) => tab.id === 'overview')),
    [hasOpenedHouses],
  );

  const menuTabs = useMemo(
    () => visibleTabs.map((tab) => ({ key: tab.id, label: tab.label })),
    [visibleTabs],
  );

  // ── Image Handlers ──
  const clearPendingMortalityFiles = useCallback(() => {
    mortalityPendingFilesRef.current.forEach((pending) => {
      if (pending?.previewUrl?.startsWith('blob:')) URL.revokeObjectURL(pending.previewUrl);
    });
    mortalityPendingFilesRef.current.clear();
  }, []);

  const clearMortalityFormImage = useCallback(() => {
    setMortalityForm((prev) => {
      if (prev.imageFileKey) {
        const pending = mortalityPendingFilesRef.current.get(prev.imageFileKey);
        if (pending?.previewUrl?.startsWith('blob:')) URL.revokeObjectURL(pending.previewUrl);
        mortalityPendingFilesRef.current.delete(prev.imageFileKey);
      }
      return {
        ...prev,
        hasImage: false,
        imageName: '',
        imageUrl: '',
        imageStorageUrl: '',
        imageFileKey: '',
      };
    });
  }, []);

  const handleMortalityImagePicked = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    try {
      if (mortalityForm.imageFileKey) {
        const pending = mortalityPendingFilesRef.current.get(mortalityForm.imageFileKey);
        if (pending?.previewUrl?.startsWith('blob:')) URL.revokeObjectURL(pending.previewUrl);
        mortalityPendingFilesRef.current.delete(mortalityForm.imageFileKey);
      }
      const imageFileKey = `mortality-file-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
      const previewUrl = URL.createObjectURL(file);
      mortalityPendingFilesRef.current.set(imageFileKey, { file, previewUrl });
      setMortalityForm((prev) => ({
        ...prev,
        hasImage: true,
        imageName: file.name || 'image.jpg',
        imageUrl: previewUrl,
        imageStorageUrl: '',
        imageFileKey,
      }));
    } catch {
      /* ignore */
    }
  };

  // ── Reset ──
  const resetEntryForm = useCallback(() => {
    clearPendingMortalityFiles();
    setActiveTab('overview');
    setEntryId(null);
    setEntryIdsByTab({});
    setEntryStatus('DRAFT');
    setEntryDate(getTodayIsoDate());
    setGeneralRemark('');
    setHealthToggles({ eating: 'normal', movement: 'normal', breathing: 'normal', skin: 'normal' });
    setFeedRecords([]);
    setFeedForm(INITIAL_FEED_FORM);
    setMedRecords([]);
    setMedForm(INITIAL_MED_FORM);
    setMedExecutionContext(null);
    setMedExecutionLoading(false);
    medExecutionCacheRef.current.clear();
    setMortalityRecords([]);
    setMortalityForm({ ...INITIAL_MORTALITY_FORM, deathDay: autoDeathDay });
    setMortalityAttachDialogOpen(false);
  }, [autoDeathDay, clearPendingMortalityFiles]);

  // ── Persist ──
  const handlePersist = async (submit) => {
    const facilityId = selectedFacility?.id ?? 0;
    if (!facilityId) {
      void Swal.fire({
        icon: 'warning',
        title: 'ไม่พบฟาร์มที่ใช้งาน',
        text: 'กรุณาเลือกฟาร์มก่อนบันทึกข้อมูล',
      });
      return;
    }
    if (submit) {
      const confirm = await Swal.fire({
        icon: 'question',
        title: 'ยืนยันส่งรายงาน',
        text: 'เมื่อส่งแล้วเอกสารจะเป็นสถานะ SUBMITTED',
        showCancelButton: true,
        confirmButtonText: 'ยืนยัน',
        cancelButtonText: 'ยกเลิก',
        reverseButtons: true,
      });
      if (!confirm.isConfirmed) return;
    }
    try {
      setSaving(true);
      const runFromDocNo = extractRun4FromMortalityDocNo(
        mortalityRecords.find((row) => typeof row.mortalityDocNo === 'string')?.mortalityDocNo,
      );
      const runFromExistingRows =
        mortalityRecords
          .map((row) => extractRun4FromMortalityRowId(row.id))
          .find((value) => Boolean(value)) || '';
      const run4 = runFromDocNo || runFromExistingRows || '0001';
      const datePart = formatDdmmyyFromIso(entryDate);

      const uploadedMortalityRecords = await Promise.all(
        mortalityRecords.map(async (record, idx) => {
          const rowId = `${datePart}-${run4}-${String(idx + 1).padStart(2, '0')}`;
          if (!record.imageFileKey) {
            return {
              ...record,
              id: rowId,
              imageUrl: record.hasImage
                ? uploadService.getMortalityRecordUrl(rowId)
                : record.imageUrl,
            };
          }
          const pending = mortalityPendingFilesRef.current.get(record.imageFileKey);
          if (!pending?.file) {
            return {
              ...record,
              id: rowId,
              imageUrl: record.hasImage
                ? uploadService.getMortalityRecordUrl(rowId)
                : record.imageUrl,
              imageFileKey: '',
            };
          }
          const uploaded = await uploadService.uploadMortalityRecordImage(pending.file, rowId);
          if (pending.previewUrl?.startsWith('blob:')) URL.revokeObjectURL(pending.previewUrl);
          mortalityPendingFilesRef.current.delete(record.imageFileKey);
          return {
            ...record,
            id: rowId,
            hasImage: true,
            imageName: uploaded.originalFileName || record.imageName,
            imageUrl: uploaded.recordUrl,
            imageStorageUrl: uploaded.url,
            imageFileKey: '',
          };
        }),
      );
      setMortalityRecords(uploadedMortalityRecords);

      const basePayload = { selectedFarm, selectedGroup, selectedHouse, generalRemark };
      const payload = (() => {
        if (activeTab === 'health') return { ...basePayload, healthToggles };
        if (activeTab === 'feed') return { ...basePayload, feedRecords };
        if (activeTab === 'meds') return { ...basePayload, medRecords };
        if (activeTab === 'mortality')
          return {
            ...basePayload,
            mortalityRecords: uploadedMortalityRecords.map(({ imageFileKey, ...rest }) => rest),
          };
        if (activeTab === 'media') return { ...basePayload, mediaRecords: [] };
        return basePayload;
      })();

      const response = await httpClient.post('/api/ProductionActivities', {
        id: entryIdsByTab[activeTab] ?? undefined,
        documentType: activeTab,
        entryDate: `${entryDate}T00:00:00.000Z`,
        facilityId,
        remark: generalRemark?.trim() || '',
        submit,
        payload,
      });

      const header = response?.data?.header ?? null;
      if (submit) {
        resetEntryForm();
      } else if (header) {
        setEntryId(header.id ?? null);
        setEntryIdsByTab((prev) => ({ ...prev, [activeTab]: header.id ?? null }));
        setEntryStatus(header.status ?? 'DRAFT');
      }

      await Swal.fire({
        icon: 'success',
        title: submit ? 'ส่งรายงานสำเร็จ' : 'บันทึกแบบร่างสำเร็จ',
        timer: 1400,
        showConfirmButton: false,
      });
    } catch (error) {
      await Swal.fire({
        icon: 'error',
        title: submit ? 'ส่งรายงานไม่สำเร็จ' : 'บันทึกแบบร่างไม่สำเร็จ',
        text: error?.response?.data?.message || 'กรุณาตรวจสอบข้อมูลและลองใหม่อีกครั้ง',
      });
    } finally {
      setSaving(false);
    }
  };

  // ── API: Fetch Med Execution Context ──
  const fetchMedicationExecutionContext = useCallback(
    async ({ farmCode, groupId, houseCode, vaccineItemId }) => {
      const normalizedVaccineItemId = Number(vaccineItemId || 0);
      if (!farmCode || !houseCode || normalizedVaccineItemId <= 0) return null;
      const cacheKey = [
        farmCode.trim(),
        (groupId || '-').trim() || '-',
        houseCode.trim(),
        normalizedVaccineItemId,
      ].join('|');
      if (medExecutionCacheRef.current.has(cacheKey))
        return medExecutionCacheRef.current.get(cacheKey);
      const context = await vaccinationPlanService.getExecutionContext({
        farmCode,
        groupId: groupId && groupId !== '-' ? groupId : undefined,
        houseCode,
        vaccineItemId: normalizedVaccineItemId,
      });
      medExecutionCacheRef.current.set(cacheKey, context);
      return context;
    },
    [],
  );

  // ── API: Fetch Pending Feeding Plans ──
  const fetchPendingFeedingPlans = useCallback(async ({ date, facilityId, houseId, houseCode }) => {
    if (!date || !facilityId) return [];
    try {
      setFeedPlanLoading(true);
      const plans = await feedingService.getPendingPlans(date, facilityId, houseId, houseCode);
      setFeedPlanSuggestions(plans);
      return plans;
    } catch (error) {
      console.error('Failed to fetch pending feeding plans:', error);
      return [];
    } finally {
      setFeedPlanLoading(false);
    }
  }, []);

  // ── Meds: Append from Plan ──
  const appendPlanToMedRecords = useCallback(
    async (planTask) => {
      const planItemId = Number(planTask?.id || 0);
      if (
        planItemId > 0 &&
        medRecords.some((record) => Number(record.vaccinationPlanItemId) === planItemId)
      )
        return;

      let executionContext = null;
      const vaccineItemId = Number(planTask?.vaccineItemId || 0);
      if (vaccineItemId > 0) {
        try {
          executionContext = await fetchMedicationExecutionContext({
            farmCode: selectedFarm,
            groupId: selectedGroup,
            houseCode: selectedHouse,
            vaccineItemId,
          });
        } catch (error) {
          console.error('Failed to resolve warehouse context from vaccination plan.', error);
        }
      }

      const mergedBatchAllocations = mergeBatchAllocations(
        executionContext?.batchOptions?.length
          ? executionContext.batchOptions
          : Array.isArray(planTask?.batchAllocations)
            ? planTask.batchAllocations
            : [],
        Array.isArray(planTask?.batchAllocations) ? planTask.batchAllocations : [],
      );
      const defaultWarehouse = executionContext?.warehouseBalances?.[0] ?? null;

      setMedRecords((prev) => [
        ...prev,
        {
          id: nextRowId(),
          house: selectedHouse,
          medName: planTask.vaccineName || '',
          vaccineItemId: vaccineItemId > 0 ? vaccineItemId : '',
          vaccinationPlanItemId: planItemId > 0 ? planItemId : null,
          method: 'ฉีดเข้ากล้ามเนื้อ',
          amount:
            sumAllocatedHeadcount(mergedBatchAllocations) > 0
              ? String(sumAllocatedHeadcount(mergedBatchAllocations))
              : Number.isFinite(Number(planTask.headcount))
                ? String(planTask.headcount)
                : '',
          dose: Number.isFinite(Number(planTask.dosesRequired))
            ? String(planTask.dosesRequired)
            : sumAllocatedHeadcount(mergedBatchAllocations) > 0
              ? String(sumAllocatedHeadcount(mergedBatchAllocations))
              : '',
          warehouseId: defaultWarehouse?.warehouseId ?? '',
          warehouseName: defaultWarehouse?.warehouseName ?? '',
          stockLotId:
            Number(defaultWarehouse?.stockLotId || 0) > 0
              ? Number(defaultWarehouse.stockLotId)
              : '',
          lotNumber: defaultWarehouse?.lotNumber ?? '',
          batchAllocations: mergedBatchAllocations,
          warehouseIssueStatus: defaultWarehouse ? 'READY' : 'NOT_SELECTED',
          warehouseIssueMessage: defaultWarehouse ? '' : 'ยังไม่ได้เลือก warehouse สำหรับตัด stock',
          note: planTask.documentCode ? `อ้างอิงแผน ${planTask.documentCode}` : '',
        },
      ]);
    },
    [selectedFarm, selectedGroup, selectedHouse, medRecords, fetchMedicationExecutionContext],
  );

  // ── Effects ──
  useEffect(() => {
    const syncMainFacility = () => {
      setMainFacilityId(getCurrentFacilityId());
      setMainFacilityCode(getCurrentFacilityCode() || '');
    };
    syncMainFacility();
    window.addEventListener(FACILITY_CHANGED_EVENT, syncMainFacility);
    return () => {
      window.removeEventListener(FACILITY_CHANGED_EVENT, syncMainFacility);
    };
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const requestedTab = (params.get('tab') || '').trim();
    const requestedDate = (params.get('entryDate') || '').trim();
    const farmCode = (params.get('farmCode') || '').trim();
    const groupId = (params.get('groupId') || '').trim();
    const houseCode = (params.get('houseCode') || '').trim();
    deepLinkContextRef.current = {
      tab: requestedTab,
      entryDate: requestedDate,
      farmCode,
      groupId,
      houseCode,
    };
    if (TAB_IDS.has(requestedTab)) setActiveTab(requestedTab);
    if (/^\d{4}-\d{2}-\d{2}$/.test(requestedDate)) setEntryDate(requestedDate);
  }, []);

  useEffect(() => {
    if (!hasOpenedHouses && activeTab !== 'overview') setActiveTab('overview');
  }, [hasOpenedHouses, activeTab]);

  useEffect(() => {
    if (!mortalityGalleryRef.current) return undefined;
    if (mortalityViewerRef.current) {
      mortalityViewerRef.current.destroy();
      mortalityViewerRef.current = null;
    }
    mortalityViewerRef.current = new Viewer(mortalityGalleryRef.current, {
      navbar: false,
      title: true,
      toolbar: {
        zoomIn: true,
        zoomOut: true,
        oneToOne: true,
        reset: true,
        prev: true,
        play: false,
        next: true,
        rotateLeft: true,
        rotateRight: true,
        flipHorizontal: true,
        flipVertical: true,
      },
    });
    return () => {
      if (mortalityViewerRef.current) {
        mortalityViewerRef.current.destroy();
        mortalityViewerRef.current = null;
      }
    };
  }, [mortalityRecords]);

  useEffect(() => {
    return () => {
      clearPendingMortalityFiles();
    };
  }, [clearPendingMortalityFiles]);

  // Load options
  useEffect(() => {
    let active = true;
    const fallbackFacilitiesFromScope = () => {
      const user = authService.getUser();
      const nodes = getUserFarmScopeNodes(user);
      return nodes.map((node) => ({
        id: node.facilityNodeId,
        code: node.facilityCode,
        name: node.facilityName,
      }));
    };
    const loadOptions = async () => {
      setHydrating(true);
      try {
        try {
          const vaccineResponse = await httpClient.get(
            '/api/OperationsHealth/vaccination-plans/options',
          );
          const vaccines = Array.isArray(vaccineResponse?.data?.vaccines)
            ? vaccineResponse.data.vaccines
            : [];
          if (vaccines.length > 0)
            setMedItemOptions(vaccines.map((item) => ({ id: item.id, name: item.name })));
          else setMedItemOptions(STATIC_MED_OPTIONS);
        } catch {
          setMedItemOptions(STATIC_MED_OPTIONS);
        }

        try {
          const feedingOptionsResponse = await httpClient.get('/api/Feeding/options');
          const feedItems = Array.isArray(feedingOptionsResponse?.data?.feedItems)
            ? feedingOptionsResponse.data.feedItems
            : [];
          setFeedItemOptions(feedItems);
          const farmWarehouses = Array.isArray(feedingOptionsResponse?.data?.warehouses)
            ? feedingOptionsResponse.data.warehouses.filter((w) => w.warehouseType === 'Farm')
            : [];
          setFarmWarehouseOptions(
            farmWarehouses.map((w) => ({ warehouseId: w.id, warehouseName: w.name })),
          );
        } catch (e) {
          console.error('Failed to load feed options:', e);
          setFeedItemOptions([]);
          setFarmWarehouseOptions([]);
        }

        const dashboardResponse = await masterApi.getFarmInformationDashboard(
          mainFacilityId ?? undefined,
        );
        if (!active) return;

        if (dashboardResponse?.hasFarmAccess === false) {
          const fallbackFacilities = fallbackFacilitiesFromScope();
          setFarmOptions(fallbackFacilities);
          setHouseGroupMap({});
          setCurrentUserName('System');
          setSelectedFarm(fallbackFacilities[0]?.code || '');
          setSelectedGroup('');
          setSelectedHouse('');
          return;
        }

        const facilities = Array.isArray(dashboardResponse?.facilities)
          ? dashboardResponse.facilities.map((item) => ({
              id: item.id,
              code: item.code,
              name: item.name,
            }))
          : [];
        if (!facilities.length) {
          setFarmOptions([]);
          setHouseGroupMap({});
          setSelectedFarm('');
          setSelectedGroup('');
          setSelectedHouse('');
          setHydrating(false);
          return;
        }

        const targetFacilityId =
          dashboardResponse?.selectedFacilityId ?? mainFacilityId ?? facilities[0]?.id ?? null;
        const selectedFacility = targetFacilityId
          ? (facilities.find((facility) => facility.id === targetFacilityId) ??
            facilities[0] ??
            null)
          : (facilities[0] ?? null);
        const dashboardHouses = Array.isArray(dashboardResponse?.houses)
          ? dashboardResponse.houses
          : [];

        const enrichedHouseCards = await Promise.all(
          dashboardHouses.map(async (house) => {
            try {
              const detail = await masterApi.getFarmHouseDetail(house.buildingOpeningId);
              const detailHouse = detail?.house ?? {};
              const detailSummary = detail?.summary ?? {};
              const receivedDate = detailHouse.receivedDate || house.receivedDate || null;
              return {
                id: house.buildingOpeningId,
                buildingOpeningId: house.buildingOpeningId,
                documentNumber: house.documentNumber || '',
                code: house.houseCode || '',
                name: detailHouse.houseName || house.houseName || house.houseCode || '',
                zone: detailHouse.zone || '',
                generation: detailHouse.generation || '',
                batchNo: detailHouse.batchNo || house.batchNo || '',
                status: detailHouse.status || house.status || '',
                receivedDate,
                ageDays: calculateAgeDaysFromReceivedDate(receivedDate),
                currentQuantity: Number.isFinite(Number(detailSummary.currentHeadCount))
                  ? Number(detailSummary.currentHeadCount)
                  : Number(house.currentHeadCount || 0),
                capacityHeadCount: Number.isFinite(Number(detailSummary.openingHeadCount))
                  ? Number(detailSummary.openingHeadCount)
                  : Number(house.capacityHeadCount || 0),
                fcrActual: detailSummary.fcrActual ?? house.fcrActual ?? null,
                fcrTarget: detailSummary.fcrTarget ?? house.fcrTarget ?? null,
                mortalityRatePercent:
                  detailSummary.mortalityRatePercent ?? house.mortalityRatePercent ?? null,
                feedingEfficiencyPercent: detailSummary.feedingEfficiencyPercent ?? null,
                feedIntakeTotalKg: detailSummary.feedIntakeTotalKg ?? null,
                totalTargetKg: detailSummary.totalTargetKg ?? null,
                totalActualKg: detailSummary.totalActualKg ?? null,
                totalInboundKg: detailSummary.totalInboundKg ?? null,
                totalBoKg: detailSummary.totalBoKg ?? null,
                currentBalanceKg: detailSummary.currentBalanceKg ?? null,
                houseDetail: detail ?? null,
              };
            } catch (error) {
              console.error('Failed to load farm house detail for activity daily:', error);
              const receivedDate = house.receivedDate || null;
              return {
                id: house.buildingOpeningId,
                buildingOpeningId: house.buildingOpeningId,
                documentNumber: house.documentNumber || '',
                code: house.houseCode || '',
                name: house.houseName || house.houseCode || '',
                zone: '',
                generation: '',
                batchNo: house.batchNo || '',
                status: house.status || '',
                receivedDate,
                ageDays: calculateAgeDaysFromReceivedDate(receivedDate),
                currentQuantity: Number(house.currentHeadCount || 0),
                capacityHeadCount: Number(house.capacityHeadCount || 0),
                fcrActual: house.fcrActual ?? null,
                fcrTarget: house.fcrTarget ?? null,
                mortalityRatePercent: house.mortalityRatePercent ?? null,
                feedingEfficiencyPercent: null,
                feedIntakeTotalKg: null,
                totalTargetKg: null,
                totalActualKg: null,
                totalInboundKg: null,
                totalBoKg: null,
                currentBalanceKg: null,
                houseDetail: null,
              };
            }
          }),
        );
        if (!active) return;

        const grouped = {};
        const selectedFacilityCode = selectedFacility?.code || facilities[0]?.code || '';
        if (selectedFacilityCode) {
          grouped[selectedFacilityCode] = {};
          for (const house of enrichedHouseCards) {
            const zoneCode = String(house.zone || '').trim() || '-';
            const zoneLabel = zoneCode === '-' ? 'โซน -' : `โซน ${zoneCode}`;
            if (!grouped[selectedFacilityCode][zoneCode]) {
              grouped[selectedFacilityCode][zoneCode] = {
                id: zoneCode,
                label: zoneLabel,
                houses: [],
              };
            }
            grouped[selectedFacilityCode][zoneCode].houses.push(house);
          }
        }

        const nextHouseMap = {};
        for (const facility of facilities) {
          nextHouseMap[facility.code] = sortHouseGroups(
            Object.values(grouped[facility.code] ?? {}),
          );
        }

        setFarmOptions(facilities);
        setHouseGroupMap(nextHouseMap);
        const user = authService.getUser();
        const fullName = `${user?.firstName || ''} ${user?.lastName || ''}`.trim();
        setCurrentUserName(fullName || user?.username || 'System');

        const nextFarmCode = selectedFacility?.code || facilities[0]?.code || '';
        setSelectedGroup('');
        setSelectedHouse('');
        setSelectedFarm(nextFarmCode);
      } catch {
        setMedItemOptions(STATIC_MED_OPTIONS);
        const fallbackFacilities = fallbackFacilitiesFromScope();
        if (fallbackFacilities.length > 0) {
          setFarmOptions(fallbackFacilities);
          setHouseGroupMap({});
          const nextFarmCode = fallbackFacilities[0].code;
          setSelectedGroup('');
          setSelectedHouse('');
          setSelectedFarm(nextFarmCode);
          setHydrating(false);
          return;
        }
        setFarmOptions([]);
        setHouseGroupMap({});
        setSelectedFarm('');
        setSelectedGroup('');
        setSelectedHouse('');
        setHydrating(false);
        return;
      }
    };
    void loadOptions();
    return () => {
      active = false;
    };
  }, [mainFacilityCode, mainFacilityId]);

  useEffect(() => {
    const preferredFarmCode = resolveFarmCodeFromContext(farmOptions, mainFacilityCode);
    if (
      !preferredFarmCode ||
      preferredFarmCode === selectedFarm ||
      !farmOptions.some((facility) => facility.code === preferredFarmCode)
    )
      return;
    setSelectedGroup('');
    setSelectedHouse('');
    setSelectedFarm(preferredFarmCode);
  }, [farmOptions, mainFacilityCode, selectedFarm]);

  useEffect(() => {
    if (!selectedFarm) return;

    const groups = houseGroupMap[selectedFarm] || [];
    const signature = `${selectedFarm}::${groups
      .map(
        (group) =>
          `${group.id}:${Array.isArray(group?.houses) ? group.houses.map((house) => house.code).join(',') : ''}`,
      )
      .join('|')}`;

    if (houseSelectionSignatureRef.current === signature) return;
    houseSelectionSignatureRef.current = signature;

    const deepLink = deepLinkContextRef.current;
    const hasDeepLinkForCurrentFarm = deepLink.farmCode === selectedFarm;
    const storedSelection = getActivityDailyHouseSelection(selectedFarm);

    if (groups.length === 0) {
      setSelectedGroup('');
      setSelectedHouse('');
      persistHouseSelection(selectedFarm, null, null);
      setHydrating(false);
      return;
    }

    let nextSelection = null;
    if (hasDeepLinkForCurrentFarm) {
      nextSelection = resolveHouseSelection(groups, deepLink.groupId, deepLink.houseCode);
      deepLinkContextRef.current = {
        tab: '',
        entryDate: '',
        farmCode: '',
        groupId: '',
        houseCode: '',
      };
    } else if (storedSelection) {
      nextSelection = resolveHouseSelection(
        groups,
        storedSelection.groupId,
        storedSelection.houseCode,
      );
    } else {
      nextSelection = resolveHouseSelection(groups, '', '');
    }

    setSelectedGroup(nextSelection.groupId);
    setSelectedHouse(nextSelection.houseCode);
    persistHouseSelection(selectedFarm, nextSelection.groupId, nextSelection.houseCode);
    setHydrating(false);
  }, [houseGroupMap, persistHouseSelection, selectedFarm]);

  useEffect(() => {
    resetEntryForm();
    setEntryDate(getTodayIsoDate());
  }, [selectedFacility?.id]);
  useEffect(() => {
    setEntryIdsByTab({});
    setEntryId(null);
  }, [entryDate]);
  useEffect(() => {
    setMortalityForm((prev) => ({ ...prev, deathDay: autoDeathDay }));
  }, [autoDeathDay]);
  useEffect(() => {
    setEntryId(entryIdsByTab[activeTab] ?? null);
  }, [activeTab, entryIdsByTab]);

  // Load vaccination plans
  useEffect(() => {
    let active = true;
    const loadPlanSuggestions = async () => {
      if (!selectedFarm || !entryDate) {
        setPlanSuggestions([]);
        setFarmDayPlanSuggestions([]);
        return;
      }
      setPlanLoading(true);
      try {
        const days = await vaccinationPlanService.getTimeline(entryDate.slice(0, 7));
        const normalizedEntryDate = normalizePotentialBuddhistIsoDate(entryDate);
        const selectedDay = days.find(
          (day) => normalizePotentialBuddhistIsoDate(day?.isoDate) === normalizedEntryDate,
        );
        const rawTasks = Array.isArray(selectedDay?.tasks) ? selectedDay.tasks : [];
        const tasks = rawTasks.filter((t) => {
          const status = (t?.status || '').toLowerCase();
          return status !== 'completed' && status !== 'cancelled';
        });
        const sameFarmTasks = tasks.filter(
          (task) => (task?.farmCode || '').trim() === selectedFarm,
        );
        const filtered = tasks.filter((task) => {
          const sameFarm = (task?.farmCode || '').trim() === selectedFarm;
          const sameHouse = (task?.houseCode || '').trim() === selectedHouse;
          if (!sameFarm || !sameHouse) return false;
          const taskGroup = (task?.groupId || '').trim();
          if (!selectedGroup || selectedGroup === '-' || !taskGroup || taskGroup === '-')
            return true;
          return taskGroup === selectedGroup;
        });
        if (!active) return;
        setFarmDayPlanSuggestions(sameFarmTasks);
        setPlanSuggestions(filtered);
      } catch {
        if (!active) return;
        setFarmDayPlanSuggestions([]);
        setPlanSuggestions([]);
      } finally {
        if (active) setPlanLoading(false);
      }
    };
    void loadPlanSuggestions();
    return () => {
      active = false;
    };
  }, [entryDate, selectedFarm, selectedGroup, selectedHouse]);

  // Load med execution context
  useEffect(() => {
    let active = true;
    const vaccineItemId = Number(medForm.vaccineItemId || 0);
    if (!selectedFarm || !selectedHouse || vaccineItemId <= 0) {
      setMedExecutionContext(null);
      setMedExecutionLoading(false);
      return;
    }
    setMedExecutionLoading(true);
    fetchMedicationExecutionContext({
      farmCode: selectedFarm,
      groupId: selectedGroup,
      houseCode: selectedHouse,
      vaccineItemId,
    })
      .then((context) => {
        if (!active) return;
        setMedExecutionContext(context);
        if (!context) return;
        setMedForm((prev) => {
          if (Number(prev.vaccineItemId || 0) !== vaccineItemId) return prev;
          const nextBatchAllocations = mergeBatchAllocations(
            context.batchOptions,
            prev.batchAllocations,
          );
          const nextHeadcount = sumAllocatedHeadcount(nextBatchAllocations);
          const nextWarehouseId =
            Number(prev.warehouseId || 0) > 0
              ? Number(prev.warehouseId)
              : Number(context.warehouseBalances?.[0]?.warehouseId || 0);
          const candidateLots = (context.warehouseBalances ?? []).filter(
            (balance) =>
              Number(balance?.warehouseId || 0) === nextWarehouseId &&
              Number(balance?.stockLotId || 0) > 0,
          );
          const hasCurrentLot = candidateLots.some(
            (balance) => Number(balance?.stockLotId || 0) === Number(prev.stockLotId || 0),
          );
          return {
            ...prev,
            batchAllocations: nextBatchAllocations,
            amount: nextHeadcount > 0 ? String(nextHeadcount) : prev.amount,
            warehouseId: nextWarehouseId > 0 ? nextWarehouseId : '',
            stockLotId: hasCurrentLot
              ? prev.stockLotId
              : Number(candidateLots[0]?.stockLotId || 0) > 0
                ? Number(candidateLots[0].stockLotId)
                : '',
          };
        });
      })
      .catch((error) => {
        console.error('Failed to load vaccination execution context for daily meds.', error);
        if (active) setMedExecutionContext(null);
      })
      .finally(() => {
        if (active) setMedExecutionLoading(false);
      });
    return () => {
      active = false;
    };
  }, [
    fetchMedicationExecutionContext,
    medForm.vaccineItemId,
    selectedFarm,
    selectedGroup,
    selectedHouse,
  ]);

  // ── Mortality Handlers ──
  const handleDeleteMortalityRecord = useCallback((id) => {
    setMortalityRecords((prev) => {
      const target = prev.find((item) => item.id === id);
      if (target?.imageFileKey) {
        const pending = mortalityPendingFilesRef.current.get(target.imageFileKey);
        if (pending?.previewUrl?.startsWith('blob:')) URL.revokeObjectURL(pending.previewUrl);
        mortalityPendingFilesRef.current.delete(target.imageFileKey);
      }
      return prev.filter((item) => item.id !== id);
    });
  }, []);

  const handleMortalityImageClick = useCallback(
    (row) => {
      const index = mortalityRecords
        .filter((item) => getMortalityImageSrc(item))
        .findIndex((item) => item.id === row.id);
      if (index >= 0 && mortalityViewerRef.current) {
        mortalityViewerRef.current.view(index);
      } else {
        setMortalityDetailRecord(row);
        setMortalityDetailIndex(mortalityRecords.findIndex((r) => r.id === row.id));
        setMortalityDetailDialogOpen(true);
      }
    },
    [mortalityRecords],
  );

  const handleSelectGroup = useCallback(
    (groupId) => {
      const nextGroup = houseGroups.find((group) => group.id === groupId) || null;
      const nextHouseCode = nextGroup?.houses?.[0]?.code || '';
      applyHouseSelection(selectedFarm, groupId || '', nextHouseCode);
    },
    [applyHouseSelection, houseGroups, selectedFarm],
  );

  const handleSelectHouse = useCallback(
    (houseCode) => {
      applyHouseSelection(selectedFarm, selectedGroup, houseCode || '');
    },
    [applyHouseSelection, selectedFarm, selectedGroup],
  );

  const handleSwitchHouse = useCallback(
    (task) => {
      applyHouseSelection(selectedFarm, task.groupId || '', task.houseCode || '');
    },
    [applyHouseSelection, selectedFarm],
  );

  // ── Render ──
  return (
    <Box
      sx={{
        width: '100%',
        maxWidth: 1400,
        mx: 'auto',
        p: { xs: 1.5, md: 2 },
        pb: { xs: 10, md: 2 },
        bgcolor: UI.bg,
      }}
    >
      <Stack spacing={2}>
        <ActivityDailyHeader
          entryStatus={entryStatus}
          hydrating={hydrating}
        />

        <Box
          sx={{
            borderRadius: 10,
            border: `1px solid ${UI.border}`,
            bgcolor: UI.panel,
            boxShadow: UI.shadowSoft,
            p: { xs: 1.5, md: 2 },
          }}
        >
          <Stack spacing={1.2}>
            <Typography
              sx={{
                fontSize: '0.95rem',
                fontWeight: 900,
                color: UI.text,
                letterSpacing: '-0.01em',
              }}
            >
              ข้อมูลเอกสาร
            </Typography>
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: {
                  xs: '1fr',
                  sm: '1fr 1fr',
                  lg: 'repeat(3, 1fr)',
                },
                gap: { xs: 1, md: 1.25 },
              }}
            >
              <TextField
                size="small"
                label="วันที่เอกสาร"
                type="date"
                value={entryDate}
                onChange={(event) => setEntryDate(event.target.value)}
                InputLabelProps={{ shrink: true }}
                sx={FORM_INPUT_SX}
              />
              <TextField
                size="small"
                label="ผู้รายงาน"
                value={currentUserName}
                InputProps={{ readOnly: true }}
                sx={FORM_INPUT_SX}
              />
              <TextField
                size="small"
                label="ฟาร์ม / โซน"
                value={
                  selectedFacility
                    ? `${selectedFacility.code} - ${selectedFacility.name}`
                    : '-'
                }
                InputProps={{ readOnly: true }}
                sx={FORM_INPUT_SX}
              />
            </Box>
          </Stack>
        </Box>

        <Box
          sx={{
            borderRadius: 10,
            border: `1px solid ${UI.border}`,
            bgcolor: UI.panel,
            boxShadow: UI.shadowSoft,
            p: { xs: 1.5, md: 1.8 },
          }}
        >
          <Stack>

            <Box
              role="tablist"
              aria-label="activity daily menu"
              sx={{
                backgroundColor: UI.panel,
              }}
            >
              <PageTabs tabs={menuTabs} activeKey={activeTab} onChange={setActiveTab} />
            </Box>
          </Stack>
        </Box>

        <Box
          sx={{
            borderRadius: 10,
            border: '1px solid',
            borderColor: UI.border,
            bgcolor: UI.panel,
            boxShadow: UI.shadowSoft,
            p: { xs: 1.5, md: 2 },
          }}
        >
          {activeTab === 'overview' && (
            <OverviewTab
              houseGroups={houseGroups}
              selectedGroup={selectedGroup}
              selectedHouse={selectedHouse}
              currentGroupHouses={currentGroupHouses}
              hasOpenedHouses={hasOpenedHouses}
              isLoading={hydrating}
              onSelectGroup={handleSelectGroup}
              onSelectHouse={handleSelectHouse}
            />
          )}
          {activeTab === 'health' && (
            <HealthTab
              healthToggles={healthToggles}
              onToggleChange={(key, value) =>
                setHealthToggles((prev) => ({ ...prev, [key]: value }))
              }
              selectedHouse={selectedHouse}
            />
          )}
          {activeTab === 'mortality' && (
            <MortalityTab
              mortalityForm={mortalityForm}
              setMortalityForm={setMortalityForm}
              mortalityRecords={mortalityRecords}
              setMortalityRecords={setMortalityRecords}
              autoDeathDay={autoDeathDay}
              selectedHouse={selectedHouse}
              onOpenAttachDialog={() => setMortalityAttachDialogOpen(true)}
              onClearImage={clearMortalityFormImage}
              onDeleteRecord={handleDeleteMortalityRecord}
              onImageClick={handleMortalityImageClick}
              nextRowId={nextRowId}
            />
          )}
          {activeTab === 'feed' && (
            <FeedTab
              feedForm={feedForm}
              setFeedForm={setFeedForm}
              feedRecords={feedRecords}
              setFeedRecords={setFeedRecords}
              feedPlanSuggestions={feedPlanSuggestions}
              feedPlanLoading={feedPlanLoading}
              feedItemOptions={feedItemOptions}
              farmWarehouseOptions={farmWarehouseOptions}
              selectedHouse={selectedHouse}
              selectedFacility={selectedFacility}
              houseGroups={houseGroups}
              fetchPendingFeedingPlans={fetchPendingFeedingPlans}
              entryDate={entryDate}
              nextRowId={nextRowId}
            />
          )}
          {activeTab === 'meds' && (
            <MedsTab
              medForm={medForm}
              setMedForm={setMedForm}
              medRecords={medRecords}
              setMedRecords={setMedRecords}
              medItemOptions={medItemOptions}
              planSuggestions={planSuggestions}
              otherHousePlanSuggestions={otherHousePlanSuggestions}
              planLoading={planLoading}
              medExecutionContext={medExecutionContext}
              medExecutionLoading={medExecutionLoading}
              selectedHouse={selectedHouse}
              selectedFarm={selectedFarm}
              selectedGroup={selectedGroup}
              medAllocatedHeadcount={medAllocatedHeadcount}
              medBatchAllocations={medBatchAllocations}
              medWarehouseOptions={medWarehouseOptions}
              medSelectedWarehouseLots={medSelectedWarehouseLots}
              fetchMedicationExecutionContext={fetchMedicationExecutionContext}
              nextRowId={nextRowId}
              onAppendPlanToMedRecords={appendPlanToMedRecords}
              onSwitchHouse={handleSwitchHouse}
            />
          )}
          {activeTab === 'media' && (
            <MediaTab
              generalRemark={generalRemark}
              setGeneralRemark={setGeneralRemark}
              selectedHouse={selectedHouse}
            />
          )}
        </Box>

        <Box
          sx={{
            borderRadius: 10,
            border: `1px solid ${UI.border}`,
            bgcolor: UI.panel,
            boxShadow: UI.shadowSoft,
            p: { xs: 1.5, md: 1.8 },
          }}
        >
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            spacing={1.5}
            justifyContent="center"
            alignItems="center"
          >
            <Button
              variant="outlined"
              disabled={saving}
              onClick={() => handlePersist(false)}
              sx={{ ...SECONDARY_ACTION_SX, width: { xs: '100%', sm: '30%' }, minWidth: 180 }}
            >
              บันทึกแบบร่าง
            </Button>
            <Button
              variant="contained"
              startIcon={<SaveIcon />}
              disabled={saving}
              onClick={() => handlePersist(true)}
              sx={{ ...PRIMARY_ACTION_SX, width: { xs: '100%', sm: '30%' }, minWidth: 180 }}
            >
              ส่งรายงาน
            </Button>
          </Stack>
        </Box>
      </Stack>

      {/* Hidden gallery for Viewer.js */}
      <Box
        ref={mortalityGalleryRef}
        sx={{
          position: 'fixed',
          width: 1,
          height: 1,
          overflow: 'hidden',
          opacity: 0,
          pointerEvents: 'none',
          left: -99999,
          top: -99999,
        }}
      >
        {mortalityRecords
          .filter((row) => getMortalityImageSrc(row))
          .map((row) => (
            <img
              key={`gallery-${row.id}`}
              src={getMortalityImageSrc(row)}
              alt={row.imageName || 'mortality-evidence'}
            />
          ))}
      </Box>

      {/* Dialogs */}
      <MortalityAttachDialog
        open={mortalityAttachDialogOpen}
        onClose={() => setMortalityAttachDialogOpen(false)}
        currentImageName={mortalityForm.imageName}
        currentImageUrl={mortalityForm.imageUrl}
        cameraInputRef={mortalityCameraInputRef}
        uploadInputRef={mortalityUploadInputRef}
        onFileUpload={handleMortalityImagePicked}
        onCameraCapture={handleMortalityImagePicked}
      />

      <MortalityDetailDialog
        open={mortalityDetailDialogOpen}
        onClose={() => setMortalityDetailDialogOpen(false)}
        record={mortalityDetailRecord}
        recordIndex={mortalityDetailIndex}
        onDelete={handleDeleteMortalityRecord}
      />
    </Box>
  );
}
