'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ContentCard, DataTable, SearchField, type Column } from '@/components/common';
import { useUserAssignmentData } from '@/features/admin/user-assignment/components';
import type { AdminUserAssignment } from '@/features/admin/user-assignment/types';
import {
  Add,
  Agriculture,
  FilterList,
  Home,
  Layers,
  Pets,
  Storage,
} from '@mui/icons-material';
import {
  Box,
  Button,
  Collapse,
  Divider,
  FormControl,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Tab,
  Tabs,
  Typography,
} from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import Swal, { type SweetAlertOptions } from 'sweetalert2';
import {
  MASTER_PROGRAM_CONTENT_SX,
  MASTER_PROGRAM_HEADER_BAR_SX,
  MASTER_PROGRAM_SHELL_FIELDSET_SX,
} from '@/core/ui-patterns/block-style.template';
import { extractApiErrorMessage } from '@/lib/api-error';
import {
  AddFarmDialog,
  AddHouseDialog,
  AddPenDialog,
  AddSiloDialog,
  AddZoneDialog,
} from '@/features/admin/master/components';
import { userService } from '@/features/admin/user-assignment/services';
import {
  type Farm,
  type FarmFormData,
  type House,
  type HouseFormData,
  type Pen,
  type PenFormData,
  type Silo,
  type SiloFormData,
  type Zone,
  type ZoneFormData,
} from '@/features/admin/user-assignment/types';
import { normalizeCode, normalizeText } from '@/features/admin/user-assignment/utils';

interface ScopePageProps {
  showManagementNav?: boolean;
  fixedEntity?: 'farms' | 'zones' | 'houses' | 'pens' | 'silos';
}

const SCOPE_TAB_LABELS = ['ฟาร์ม', 'โซน', 'โรงเรือน', 'คอก', 'ไซโล'] as const;
const SCOPE_TAB_INDEX_BY_ENTITY = {
  farms: 0,
  zones: 1,
  houses: 2,
  pens: 3,
  silos: 4,
} as const;

type ScopeEntityType = 'farm' | 'zone' | 'house' | 'pen' | 'silo';
type ScopeTabIndex = 0 | 1 | 2 | 3 | 4;

interface ScopeTableRow {
  id: number;
  _dbId?: number;
  code?: string;
  name?: string;
  location?: string;
  farmName?: string;
  zoneName?: string;
  houseName?: string;
  capacityKg?: number;
  status: Farm['status'];
}

export default function ScopePage({
  showManagementNav = true,
  fixedEntity,
}: ScopePageProps) {
  const theme = useTheme();
  const showAlert = useCallback((options: SweetAlertOptions) => {
    const originalDidOpen = options.didOpen;

    return Swal.fire({
      scrollbarPadding: false,
      heightAuto: false,
      target: 'body',
      ...options,
      didOpen: (popup) => {
        const container = Swal.getContainer();
        if (container) {
          container.style.zIndex = '9999';
        }
        originalDidOpen?.(popup);
      },
    });
  }, []);
  const {
    farms: sharedFarms,
    zones: sharedZones,
    houses: sharedHouses,
    pens: sharedPens,
    silos: sharedSilos,
    assignments: sharedAssignments,
    setFarms,
    setZones,
    setHouses,
    setPens,
    setSilos,
    saveFarm,
    saveZone,
    saveHouse,
    savePen,
    saveSilo,
    deleteScopeNode,
    deleteSilo,
    isHydrated,
    isMutating,
  } = useUserAssignmentData();
  const pageBg = theme.palette.background.default;
  const surface = alpha(theme.palette.background.paper, theme.palette.mode === 'dark' ? 0.9 : 1);
  const surfaceMuted = alpha(
    theme.palette.background.paper,
    theme.palette.mode === 'dark' ? 0.74 : 0.96,
  );
  const tableHeaderSurface =
    theme.palette.mode === 'dark'
      ? alpha(theme.palette.common.white, 0.06)
      : '#f3f4f6';
  const border = alpha(theme.palette.divider, theme.palette.mode === 'dark' ? 0.82 : 0.6);
  const borderSoft = alpha(theme.palette.divider, theme.palette.mode === 'dark' ? 0.6 : 0.48);
  const textMuted = alpha(theme.palette.text.secondary, 0.9);
  const isMasterPattern = !showManagementNav;
  const fixedTabIndex = fixedEntity ? SCOPE_TAB_INDEX_BY_ENTITY[fixedEntity] : null;
  const showScopeTabs = fixedTabIndex === null;

  const [currentTab, setCurrentTab] = useState<ScopeTabIndex>(() => (fixedTabIndex ?? 0) as ScopeTabIndex);
  const farms = sharedFarms as Farm[];
  const zones = sharedZones as Zone[];
  const houses = sharedHouses as House[];
  const pens = sharedPens as Pen[];
  const silos = sharedSilos as Silo[];
  const assignments = sharedAssignments as AdminUserAssignment[];
  const [searchQuery, setSearchQuery] = useState('');
  const [farmDialogOpen, setFarmDialogOpen] = useState(false);
  const [zoneDialogOpen, setZoneDialogOpen] = useState(false);
  const [houseDialogOpen, setHouseDialogOpen] = useState(false);
  const [penDialogOpen, setPenDialogOpen] = useState(false);
  const [siloDialogOpen, setSiloDialogOpen] = useState(false);
  const [editingFarmId, setEditingFarmId] = useState<number | null>(null);
  const [editingZoneId, setEditingZoneId] = useState<number | null>(null);
  const [editingHouseId, setEditingHouseId] = useState<number | null>(null);
  const [editingPenId, setEditingPenId] = useState<number | null>(null);
  const [editingSiloId, setEditingSiloId] = useState<number | null>(null);

  const [farmLocationFilter, setFarmLocationFilter] = useState('');
  const [farmStatusFilter, setFarmStatusFilter] = useState('');
  const [zoneFarmFilter, setZoneFarmFilter] = useState('');
  const [zoneStatusFilter, setZoneStatusFilter] = useState('');
  const [houseFarmFilter, setHouseFarmFilter] = useState('');
  const [houseZoneFilter, setHouseZoneFilter] = useState('');
  const [houseStatusFilter, setHouseStatusFilter] = useState('');
  const [penFarmFilter, setPenFarmFilter] = useState('');
  const [penZoneFilter, setPenZoneFilter] = useState('');
  const [penHouseFilter, setPenHouseFilter] = useState('');
  const [penStatusFilter, setPenStatusFilter] = useState('');
  const [siloFarmFilter, setSiloFarmFilter] = useState('');
  const [siloZoneFilter, setSiloZoneFilter] = useState('');
  const [siloHouseFilter, setSiloHouseFilter] = useState('');
  const [siloStatusFilter, setSiloStatusFilter] = useState('');
  const [isFilterExpanded, setIsFilterExpanded] = useState(false);
  const [isStatusMutating, setIsStatusMutating] = useState(false);

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);

  const uniqueLocations = useMemo(
    () => Array.from(new Set(farms.map((farm) => farm.location))),
    [farms],
  );

  const uniqueFarmNames = useMemo(
    () => Array.from(new Set(zones.map((zone) => zone.farmName))),
    [zones],
  );

  const availableZonesForHouseFilter = useMemo(() => {
    const candidates = houseFarmFilter
      ? zones.filter((zone) => zone.farmName === houseFarmFilter)
      : zones;
    return Array.from(new Set(candidates.map((zone) => zone.name)));
  }, [houseFarmFilter, zones]);

  const uniqueFarmNamesForPens = useMemo(
    () => Array.from(new Set(pens.map((pen) => pen.farmName))),
    [pens],
  );

  const availableZonesForPenFilter = useMemo(() => {
    const candidates = penFarmFilter
      ? pens.filter((pen) => pen.farmName === penFarmFilter)
      : pens;
    return Array.from(new Set(candidates.map((pen) => pen.zoneName)));
  }, [penFarmFilter, pens]);

  const availableHousesForPenFilter = useMemo(() => {
    const byFarm = penFarmFilter
      ? pens.filter((pen) => pen.farmName === penFarmFilter)
      : pens;
    const byZone = penZoneFilter
      ? byFarm.filter((pen) => pen.zoneName === penZoneFilter)
      : byFarm;
    return Array.from(new Set(byZone.map((pen) => pen.houseName)));
  }, [penFarmFilter, penZoneFilter, pens]);

  const uniqueFarmNamesForSilos = useMemo(
    () => Array.from(new Set(silos.map((silo) => silo.farmName))),
    [silos],
  );

  const availableZonesForSiloFilter = useMemo(() => {
    const candidates = siloFarmFilter
      ? silos.filter((silo) => silo.farmName === siloFarmFilter)
      : silos;
    return Array.from(new Set(candidates.map((silo) => silo.zoneName || 'ไม่มีโซน')));
  }, [siloFarmFilter, silos]);

  const availableHousesForSiloFilter = useMemo(() => {
    const byFarm = siloFarmFilter
      ? silos.filter((silo) => silo.farmName === siloFarmFilter)
      : silos;
    const byZone = siloZoneFilter
      ? byFarm.filter((silo) => (silo.zoneName || 'ไม่มีโซน') === siloZoneFilter)
      : byFarm;
    return Array.from(new Set(byZone.map((silo) => silo.houseName)));
  }, [siloFarmFilter, siloZoneFilter, silos]);

  const filteredFarms = useMemo(() => {
    return farms.filter((farm) => {
      const matchSearch =
        !searchQuery ||
        farm.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        farm.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        farm.location.toLowerCase().includes(searchQuery.toLowerCase());
      const matchLocation = !farmLocationFilter || farm.location === farmLocationFilter;
      const matchStatus = !farmStatusFilter || farm.status === farmStatusFilter;
      return matchSearch && matchLocation && matchStatus;
    });
  }, [farmLocationFilter, farmStatusFilter, farms, searchQuery]);

  const filteredZones = useMemo(() => {
    return zones.filter((zone) => {
      const matchSearch =
        !searchQuery ||
        zone.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        zone.farmName.toLowerCase().includes(searchQuery.toLowerCase());
      const matchFarm = !zoneFarmFilter || zone.farmName === zoneFarmFilter;
      const matchStatus = !zoneStatusFilter || zone.status === zoneStatusFilter;
      return matchSearch && matchFarm && matchStatus;
    });
  }, [zoneFarmFilter, zoneStatusFilter, zones, searchQuery]);

  const filteredHouses = useMemo(() => {
    return houses.filter((house) => {
      const matchSearch =
        !searchQuery ||
        house.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        house.farmName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        house.zoneName.toLowerCase().includes(searchQuery.toLowerCase());
      const matchFarm = !houseFarmFilter || house.farmName === houseFarmFilter;
      const matchZone = !houseZoneFilter || house.zoneName === houseZoneFilter;
      const matchStatus = !houseStatusFilter || house.status === houseStatusFilter;
      return matchSearch && matchFarm && matchZone && matchStatus;
    });
  }, [houseFarmFilter, houseZoneFilter, houseStatusFilter, houses, searchQuery]);

  const filteredPens = useMemo(() => {
    return pens.filter((pen) => {
      const matchSearch =
        !searchQuery ||
        pen.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        pen.farmName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        pen.zoneName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        pen.houseName.toLowerCase().includes(searchQuery.toLowerCase());
      const matchFarm = !penFarmFilter || pen.farmName === penFarmFilter;
      const matchZone = !penZoneFilter || pen.zoneName === penZoneFilter;
      const matchHouse = !penHouseFilter || pen.houseName === penHouseFilter;
      const matchStatus = !penStatusFilter || pen.status === penStatusFilter;
      return matchSearch && matchFarm && matchZone && matchHouse && matchStatus;
    });
  }, [penFarmFilter, penHouseFilter, penZoneFilter, penStatusFilter, pens, searchQuery]);

  const filteredSilos = useMemo(() => {
    return silos.filter((silo) => {
      const zoneLabel = silo.zoneName || 'ไม่มีโซน';
      const matchSearch =
        !searchQuery ||
        silo.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        silo.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        silo.farmName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        zoneLabel.toLowerCase().includes(searchQuery.toLowerCase()) ||
        silo.houseName.toLowerCase().includes(searchQuery.toLowerCase());
      const matchFarm = !siloFarmFilter || silo.farmName === siloFarmFilter;
      const matchZone = !siloZoneFilter || zoneLabel === siloZoneFilter;
      const matchHouse = !siloHouseFilter || silo.houseName === siloHouseFilter;
      const matchStatus = !siloStatusFilter || silo.status === siloStatusFilter;
      return matchSearch && matchFarm && matchZone && matchHouse && matchStatus;
    });
  }, [searchQuery, siloFarmFilter, siloHouseFilter, siloStatusFilter, siloZoneFilter, silos]);

  const currentData = useMemo(() => {
    if (currentTab === 0) return filteredFarms;
    if (currentTab === 1) return filteredZones;
    if (currentTab === 2) return filteredHouses;
    if (currentTab === 3) return filteredPens;
    return filteredSilos;
  }, [currentTab, filteredFarms, filteredHouses, filteredPens, filteredSilos, filteredZones]);

  const paginatedData = useMemo(() => {
    const start = page * rowsPerPage;
    const end = start + rowsPerPage;
    return currentData.slice(start, end);
  }, [currentData, page, rowsPerPage]);

  const pagedTableRows = useMemo<ScopeTableRow[]>(() => {
    if (currentTab === 0) {
      return (paginatedData as Farm[]).map((farm, idx) => ({
        id: page * rowsPerPage + idx + 1,
        _dbId: farm.id,
        code: farm.code,
        name: farm.name,
        location: farm.location,
        status: farm.status,
      }));
    }

    if (currentTab === 1) {
      return (paginatedData as Zone[]).map((zone, idx) => ({
        id: page * rowsPerPage + idx + 1,
        _dbId: zone.id,
        farmName: zone.farmName,
        name: zone.name,
        status: zone.status,
      }));
    }

    if (currentTab === 2) {
      return (paginatedData as House[]).map((house, idx) => ({
        id: page * rowsPerPage + idx + 1,
        _dbId: house.id,
        farmName: house.farmName,
        zoneName: house.zoneName,
        name: house.name,
        status: house.status,
      }));
    }

    if (currentTab === 3) {
      return (paginatedData as Pen[]).map((pen, idx) => ({
        id: page * rowsPerPage + idx + 1,
        _dbId: pen.id,
        farmName: pen.farmName,
        zoneName: pen.zoneName,
        houseName: pen.houseName,
        name: pen.name,
        status: pen.status,
      }));
    }

    return (paginatedData as Silo[]).map((silo, idx) => ({
      id: page * rowsPerPage + idx + 1,
      _dbId: silo.id,
      code: silo.code,
      farmName: silo.farmName,
      zoneName: silo.zoneName || 'ไม่มีโซน',
      houseName: silo.houseName,
      name: silo.name,
      capacityKg: silo.capacityKg,
      status: silo.status,
    }));
  }, [currentTab, paginatedData, page, rowsPerPage]);

  useEffect(() => {
    const maxPage = Math.max(0, Math.ceil(currentData.length / rowsPerPage) - 1);
    if (page > maxPage) setPage(maxPage);
  }, [currentData.length, page, rowsPerPage]);

  const clearAllFilters = useCallback(() => {
    setFarmLocationFilter('');
    setFarmStatusFilter('');
    setZoneFarmFilter('');
    setZoneStatusFilter('');
    setHouseFarmFilter('');
    setHouseZoneFilter('');
    setHouseStatusFilter('');
    setPenFarmFilter('');
    setPenZoneFilter('');
    setPenHouseFilter('');
    setPenStatusFilter('');
    setSiloFarmFilter('');
    setSiloZoneFilter('');
    setSiloHouseFilter('');
    setSiloStatusFilter('');
  }, []);

  useEffect(() => {
    if (fixedTabIndex === null) {
      return;
    }

    setCurrentTab((prev) => (prev === fixedTabIndex ? prev : fixedTabIndex));
    setSearchQuery('');
    clearAllFilters();
    setIsFilterExpanded(false);
    setPage(0);
  }, [clearAllFilters, fixedTabIndex]);

  const activeFilterCount = useMemo(() => {
    if (currentTab === 0) {
      return [farmLocationFilter, farmStatusFilter].filter(Boolean).length;
    }
    if (currentTab === 1) {
      return [zoneFarmFilter, zoneStatusFilter].filter(Boolean).length;
    }
    if (currentTab === 2) {
      return [houseFarmFilter, houseZoneFilter, houseStatusFilter].filter(Boolean).length;
    }
    if (currentTab === 3) {
      return [penFarmFilter, penZoneFilter, penHouseFilter, penStatusFilter].filter(Boolean)
        .length;
    }
    return [siloFarmFilter, siloZoneFilter, siloHouseFilter, siloStatusFilter].filter(Boolean)
      .length;
  }, [
    currentTab,
    farmLocationFilter,
    farmStatusFilter,
    penFarmFilter,
    penHouseFilter,
    penZoneFilter,
    penStatusFilter,
    siloFarmFilter,
    siloHouseFilter,
    siloStatusFilter,
    siloZoneFilter,
    zoneFarmFilter,
    zoneStatusFilter,
    houseFarmFilter,
    houseZoneFilter,
    houseStatusFilter,
  ]);

  const handleTabChange = (_event: React.SyntheticEvent, nextTab: number) => {
    if (!showScopeTabs) {
      return;
    }

    setCurrentTab(nextTab as ScopeTabIndex);
    setSearchQuery('');
    clearAllFilters();
    setIsFilterExpanded(false);
    setPage(0);
  };

  const handleToggleFilterPanel = () => {
    setIsFilterExpanded((prev) => !prev);
  };

  const handleDelete = async (type: ScopeEntityType, id: number) => {
    if (isMutating) {
      return;
    }

    const confirmation = await showAlert({
      icon: 'warning',
      title: 'ยืนยันลบข้อมูล?',
      text: 'ยืนยันลบข้อมูลนี้แบบถาวรใช่หรือไม่? การดำเนินการนี้ไม่สามารถย้อนกลับได้',
      showCancelButton: true,
      confirmButtonText: 'ลบ',
      cancelButtonText: 'ยกเลิก',
      confirmButtonColor: '#ef4444',
    });
    if (!confirmation.isConfirmed) {
      return;
    }

    // In Master Data area tabs, trash icon should call delete endpoint directly.
    if (isMasterPattern) {
      try {
        if (type === 'silo') {
          await deleteSilo(id);
          void showAlert({
            icon: 'success',
            title: 'ลบข้อมูลสำเร็จ',
            showConfirmButton: false,
            timer: 1500,
          });
          return;
        }
        await deleteScopeNode(type, id);
        void showAlert({
          icon: 'success',
          title: 'ลบข้อมูลสำเร็จ',
          showConfirmButton: false,
          timer: 1500,
        });
      } catch (error) {
        void showAlert({
          icon: 'error',
          title: 'ลบข้อมูลไม่สำเร็จ',
          text: extractApiErrorMessage(
            error,
            type === 'silo' ? 'ลบไซโลไม่สำเร็จ' : 'ลบขอบเขตไม่สำเร็จ',
          ),
        });
      }
      return;
    }

    if (type === 'farm') {
      const targetFarm = farms.find((farm) => farm.id === id);
      if (!targetFarm) return;
      const farmInUse = assignments.some((assignment) =>
        assignment.roleScopes.some((scope) => scope.farm === targetFarm.name),
      );
      if (farmInUse) {
        void showAlert({
          icon: 'error',
          title: 'ไม่สามารถลบข้อมูลได้',
          text: 'ไม่สามารถลบฟาร์มนี้ได้ เนื่องจากยังมีผู้ใช้งานที่อ้างอิงอยู่',
        });
        return;
      }
    }

    if (type === 'zone') {
      const targetZone = zones.find((zone) => zone.id === id);
      if (!targetZone) return;
      const zoneInUse = assignments.some((assignment) =>
        assignment.roleScopes.some(
          (scope) =>
            scope.farm === targetZone.farmName && scope.zone === targetZone.name,
        ),
      );
      if (zoneInUse) {
        void showAlert({
          icon: 'error',
          title: 'ไม่สามารถลบข้อมูลได้',
          text: 'ไม่สามารถลบโซนนี้ได้ เนื่องจากยังมีผู้ใช้งานที่อ้างอิงอยู่',
        });
        return;
      }
    }

    if (type === 'house') {
      const targetHouse = houses.find((house) => house.id === id);
      if (!targetHouse) return;
      const houseInUse = assignments.some((assignment) =>
        assignment.roleScopes.some((scope) => scope.house === targetHouse.name),
      );
      if (houseInUse) {
        void showAlert({
          icon: 'error',
          title: 'ไม่สามารถลบข้อมูลได้',
          text: 'ไม่สามารถลบโรงเรือนนี้ได้ เนื่องจากยังมีผู้ใช้งานที่อ้างอิงอยู่',
        });
        return;
      }
    }

    if (type === 'silo') {
      try {
        await deleteSilo(id);
        void showAlert({
          icon: 'success',
          title: 'ลบข้อมูลสำเร็จ',
          showConfirmButton: false,
          timer: 1500,
        });
      } catch (error) {
        void showAlert({
          icon: 'error',
          title: 'ลบข้อมูลไม่สำเร็จ',
          text: extractApiErrorMessage(error, 'ลบไซโลไม่สำเร็จ'),
        });
      }
      return;
    }

    try {
      await deleteScopeNode(type, id);
      void showAlert({
        icon: 'success',
        title: 'ลบข้อมูลสำเร็จ',
        showConfirmButton: false,
        timer: 1500,
      });
    } catch (error) {
      void showAlert({
        icon: 'error',
        title: 'ลบข้อมูลไม่สำเร็จ',
        text: extractApiErrorMessage(error, 'ลบขอบเขตไม่สำเร็จ'),
      });
    }
  };

  const handleEdit = (type: ScopeEntityType, id: number) => {
    if (type === 'farm') {
      setEditingFarmId(id);
      setFarmDialogOpen(true);
      return;
    }
    if (type === 'zone') {
      setEditingZoneId(id);
      setZoneDialogOpen(true);
      return;
    }
    if (type === 'house') {
      setEditingHouseId(id);
      setHouseDialogOpen(true);
      return;
    }
    if (type === 'silo') {
      setEditingSiloId(id);
      setSiloDialogOpen(true);
      return;
    }
    setEditingPenId(id);
    setPenDialogOpen(true);
  };

  const handleSaveFarm = async (data: FarmFormData) => {
    if (isMutating) {
      return;
    }

    const normalizedData: FarmFormData = {
      name: data.name.trim(),
      code: normalizeCode(data.code),
      location: data.location.trim(),
      status: data.status,
    };
    const duplicateFarmName = farms.some(
      (farm) =>
        farm.id !== editingFarmId &&
        normalizeText(farm.name) === normalizeText(normalizedData.name),
    );
    if (duplicateFarmName) {
      void showAlert({
        icon: 'error',
        title: 'บันทึกไม่สำเร็จ',
        text: 'ไม่สามารถบันทึกได้ เนื่องจากชื่อฟาร์มซ้ำ',
      });
      return;
    }
    const duplicateFarmCode = farms.some(
      (farm) =>
        farm.id !== editingFarmId &&
        normalizeCode(farm.code) === normalizeCode(normalizedData.code),
    );
    if (duplicateFarmCode) {
      void showAlert({
        icon: 'error',
        title: 'บันทึกไม่สำเร็จ',
        text: 'ไม่สามารถบันทึกได้ เนื่องจากรหัสฟาร์มซ้ำ',
      });
      return;
    }

    try {
      const confirmation = await showAlert({
        icon: 'question',
        title: editingFarmId ? 'ยืนยันบันทึกการแก้ไข?' : 'ยืนยันเพิ่มฟาร์ม?',
        text: editingFarmId
          ? `คุณต้องการบันทึกการแก้ไขฟาร์ม ${normalizedData.name} หรือไม่`
          : `คุณต้องการเพิ่มฟาร์ม ${normalizedData.name} หรือไม่`,
        showCancelButton: true,
        confirmButtonText: 'ยืนยัน',
        cancelButtonText: 'ยกเลิก',
        confirmButtonColor: '#1d4ed8',
      });
      if (!confirmation.isConfirmed) {
        return;
      }

      await saveFarm({
        id: editingFarmId ?? undefined,
        name: normalizedData.name,
        code: normalizedData.code,
        location: normalizedData.location,
        status: normalizedData.status,
      });
      setFarmDialogOpen(false);
      setEditingFarmId(null);
      void showAlert({
        icon: 'success',
        title: 'บันทึกสำเร็จ',
        showConfirmButton: false,
        timer: 1500,
      });
    } catch (error) {
      void showAlert({
        icon: 'error',
        title: 'บันทึกไม่สำเร็จ',
        text: extractApiErrorMessage(error, 'บันทึกฟาร์มไม่สำเร็จ'),
      });
    }
  };

  const handleSaveZone = async (data: ZoneFormData) => {
    if (isMutating) {
      return;
    }

    const normalizedData: ZoneFormData = {
      name: data.name.trim(),
      farmId: data.farmId,
      status: data.status,
    };
    const duplicateZoneInFarm = zones.some(
      (zone) =>
        zone.id !== editingZoneId &&
        zone.farmId === normalizedData.farmId &&
        normalizeText(zone.name) === normalizeText(normalizedData.name),
    );
    if (duplicateZoneInFarm) {
      void showAlert({
        icon: 'error',
        title: 'บันทึกไม่สำเร็จ',
        text: 'ไม่สามารถบันทึกได้ เนื่องจากชื่อโซนซ้ำภายในฟาร์มเดียวกัน',
      });
      return;
    }

    const farm = farms.find((item) => item.id === normalizedData.farmId);
    if (!farm) return;

    try {
      const confirmation = await showAlert({
        icon: 'question',
        title: editingZoneId ? 'ยืนยันบันทึกการแก้ไข?' : 'ยืนยันเพิ่มโซน?',
        text: editingZoneId
          ? `คุณต้องการบันทึกการแก้ไขโซน ${normalizedData.name} หรือไม่`
          : `คุณต้องการเพิ่มโซน ${normalizedData.name} หรือไม่`,
        showCancelButton: true,
        confirmButtonText: 'ยืนยัน',
        cancelButtonText: 'ยกเลิก',
        confirmButtonColor: '#1d4ed8',
      });
      if (!confirmation.isConfirmed) {
        return;
      }

      await saveZone({
        id: editingZoneId ?? undefined,
        name: normalizedData.name,
        farmId: normalizedData.farmId,
        status: normalizedData.status,
      });
      setZoneDialogOpen(false);
      setEditingZoneId(null);
      void showAlert({
        icon: 'success',
        title: 'บันทึกสำเร็จ',
        showConfirmButton: false,
        timer: 1500,
      });
    } catch (error) {
      void showAlert({
        icon: 'error',
        title: 'บันทึกไม่สำเร็จ',
        text: extractApiErrorMessage(error, 'บันทึกโซนไม่สำเร็จ'),
      });
    }
  };

  const handleSaveHouse = async (data: HouseFormData) => {
    if (isMutating) {
      return;
    }

    const normalizedData: HouseFormData = {
      name: data.name.trim(),
      farmId: data.farmId,
      zoneId: data.zoneId,
      status: data.status,
    };
    const duplicateHouseName = houses.some(
      (house) =>
        house.id !== editingHouseId &&
        normalizeText(house.name) === normalizeText(normalizedData.name),
    );
    if (duplicateHouseName) {
      void showAlert({
        icon: 'error',
        title: 'บันทึกไม่สำเร็จ',
        text: 'ไม่สามารถบันทึกได้ เนื่องจากชื่อโรงเรือนซ้ำ',
      });
      return;
    }

    const farm = farms.find((item) => item.id === normalizedData.farmId);
    if (!farm) return;

    try {
      const confirmation = await showAlert({
        icon: 'question',
        title: editingHouseId ? 'ยืนยันบันทึกการแก้ไข?' : 'ยืนยันเพิ่มโรงเรือน?',
        text: editingHouseId
          ? `คุณต้องการบันทึกการแก้ไขโรงเรือน ${normalizedData.name} หรือไม่`
          : `คุณต้องการเพิ่มโรงเรือน ${normalizedData.name} หรือไม่`,
        showCancelButton: true,
        confirmButtonText: 'ยืนยัน',
        cancelButtonText: 'ยกเลิก',
        confirmButtonColor: '#1d4ed8',
      });
      if (!confirmation.isConfirmed) {
        return;
      }

      await saveHouse({
        id: editingHouseId ?? undefined,
        name: normalizedData.name,
        farmId: normalizedData.farmId,
        zoneId: normalizedData.zoneId > 0 ? normalizedData.zoneId : undefined,
        status: normalizedData.status,
      });
      setHouseDialogOpen(false);
      setEditingHouseId(null);
      void showAlert({
        icon: 'success',
        title: 'บันทึกสำเร็จ',
        showConfirmButton: false,
        timer: 1500,
      });
    } catch (error) {
      void showAlert({
        icon: 'error',
        title: 'บันทึกไม่สำเร็จ',
        text: extractApiErrorMessage(error, 'บันทึกโรงเรือนไม่สำเร็จ'),
      });
    }
  };

  const handleSavePen = async (data: PenFormData) => {
    if (isMutating) {
      return;
    }

    const normalizedData: PenFormData = {
      name: data.name.trim(),
      houseId: data.houseId,
      status: data.status,
    };
    const duplicatePenNameInHouse = pens.some(
      (pen) =>
        pen.id !== editingPenId &&
        pen.houseId === normalizedData.houseId &&
        normalizeText(pen.name) === normalizeText(normalizedData.name),
    );
    if (duplicatePenNameInHouse) {
      void showAlert({
        icon: 'error',
        title: 'บันทึกไม่สำเร็จ',
        text: 'ไม่สามารถบันทึกได้ เนื่องจากชื่อคอกซ้ำภายในโรงเรือนเดียวกัน',
      });
      return;
    }

    const house = houses.find((item) => item.id === normalizedData.houseId);
    if (!house) {
      return;
    }

    try {
      const confirmation = await showAlert({
        icon: 'question',
        title: editingPenId ? 'ยืนยันบันทึกการแก้ไข?' : 'ยืนยันเพิ่มคอก?',
        text: editingPenId
          ? `คุณต้องการบันทึกการแก้ไขคอก ${normalizedData.name} หรือไม่`
          : `คุณต้องการเพิ่มคอก ${normalizedData.name} หรือไม่`,
        showCancelButton: true,
        confirmButtonText: 'ยืนยัน',
        cancelButtonText: 'ยกเลิก',
        confirmButtonColor: '#1d4ed8',
      });
      if (!confirmation.isConfirmed) {
        return;
      }

      await savePen({
        id: editingPenId ?? undefined,
        name: normalizedData.name,
        houseId: normalizedData.houseId,
        status: normalizedData.status,
      });
      setPenDialogOpen(false);
      setEditingPenId(null);
      void showAlert({
        icon: 'success',
        title: 'บันทึกสำเร็จ',
        showConfirmButton: false,
        timer: 1500,
      });
    } catch (error) {
      void showAlert({
        icon: 'error',
        title: 'บันทึกไม่สำเร็จ',
        text: extractApiErrorMessage(error, 'บันทึกคอกไม่สำเร็จ'),
      });
    }
  };

  const handleSaveSilo = async (data: SiloFormData) => {
    if (isMutating) {
      return;
    }

    const duplicateSiloCode = silos.some(
      (silo) =>
        silo.id !== editingSiloId && normalizeCode(silo.code) === normalizeCode(data.code),
    );
    if (duplicateSiloCode) {
      void showAlert({
        icon: 'error',
        title: 'บันทึกไม่สำเร็จ',
        text: 'ไม่สามารถบันทึกได้ เนื่องจากรหัสไซโลซ้ำ',
      });
      return;
    }

    const duplicateSiloHouse = silos.some(
      (silo) => silo.id !== editingSiloId && silo.houseId === data.houseId,
    );
    if (duplicateSiloHouse) {
      void showAlert({
        icon: 'error',
        title: 'บันทึกไม่สำเร็จ',
        text: 'ไม่สามารถบันทึกได้ เนื่องจากโรงเรือนนี้มีไซโลอยู่แล้ว',
      });
      return;
    }

    try {
      const confirmation = await showAlert({
        icon: 'question',
        title: editingSiloId ? 'ยืนยันบันทึกการแก้ไข?' : 'ยืนยันเพิ่มไซโล?',
        text: editingSiloId
          ? `คุณต้องการบันทึกการแก้ไขไซโล ${data.name.trim()} หรือไม่`
          : `คุณต้องการเพิ่มไซโล ${data.name.trim()} หรือไม่`,
        showCancelButton: true,
        confirmButtonText: 'ยืนยัน',
        cancelButtonText: 'ยกเลิก',
        confirmButtonColor: '#1d4ed8',
      });
      if (!confirmation.isConfirmed) {
        return;
      }

      await saveSilo({
        id: editingSiloId ?? undefined,
        code: normalizeCode(data.code),
        name: data.name.trim(),
        farmId: data.farmId,
        houseId: data.houseId,
        capacityKg: data.capacityKg,
        status: data.status,
      });
      setSiloDialogOpen(false);
      setEditingSiloId(null);
      void showAlert({
        icon: 'success',
        title: 'บันทึกสำเร็จ',
        showConfirmButton: false,
        timer: 1500,
      });
    } catch (error) {
      void showAlert({
        icon: 'error',
        title: 'บันทึกไม่สำเร็จ',
        text: extractApiErrorMessage(error, 'บันทึกไซโลไม่สำเร็จ'),
      });
    }
  };

  const addButtonDisabled =
    isMutating ||
    (currentTab === 1 && farms.length === 0) ||
    (currentTab === 2 && farms.length === 0) ||
    (currentTab === 3 && houses.length === 0) ||
    (currentTab === 4 && houses.length === 0);
  const currentTabLabel = SCOPE_TAB_LABELS[currentTab] ?? 'รายการ';
  const currentEntityType: ScopeEntityType =
    currentTab === 0
      ? 'farm'
      : currentTab === 1
        ? 'zone'
        : currentTab === 2
          ? 'house'
          : currentTab === 3
            ? 'pen'
            : 'silo';

  const handleToggleRowStatus = async (row: ScopeTableRow) => {
    if (isMutating || isStatusMutating) return;
    const targetId = row._dbId ?? row.id;
    const nextStatus: Farm['status'] = row.status === 'Active' ? 'Inactive' : 'Active';
    const prevStatus: Farm['status'] = row.status;
    const entityLabel =
      currentEntityType === 'farm'
        ? 'ฟาร์ม'
        : currentEntityType === 'zone'
          ? 'โซน'
          : currentEntityType === 'house'
            ? 'โรงเรือน'
            : currentEntityType === 'pen'
              ? 'คอก'
              : 'ไซโล';
    const displayName = (row.name ?? row.code ?? '').toString().trim() || String(targetId);

    const confirmation = await showAlert({
      icon: 'warning',
      title: `ยืนยันเปลี่ยนสถานะ${entityLabel}?`,
      text: `คุณต้องการ${nextStatus === 'Active' ? 'เปิดใช้งาน' : 'ระงับ'}${entityLabel} ${displayName} หรือไม่`,
      showCancelButton: true,
      confirmButtonText: 'ยืนยัน',
      cancelButtonText: 'ยกเลิก',
      confirmButtonColor: nextStatus === 'Active' ? '#B42318' : '#f59e0b',
    });
    if (!confirmation.isConfirmed) {
      return;
    }

    const applyStatusToLocalState = (status: Farm['status']) => {
      if (currentEntityType === 'farm') {
        setFarms((prev) =>
          prev.map((farm) => (farm.id === targetId ? { ...farm, status } : farm)),
        );
        return;
      }
      if (currentEntityType === 'zone') {
        setZones((prev) =>
          prev.map((zone) => (zone.id === targetId ? { ...zone, status } : zone)),
        );
        return;
      }
      if (currentEntityType === 'house') {
        setHouses((prev) =>
          prev.map((house) => (house.id === targetId ? { ...house, status } : house)),
        );
        return;
      }
      if (currentEntityType === 'silo') {
        setSilos((prev) =>
          prev.map((silo) => (silo.id === targetId ? { ...silo, status } : silo)),
        );
        return;
      }
      setPens((prev) => prev.map((pen) => (pen.id === targetId ? { ...pen, status } : pen)));
    };

    try {
      setIsStatusMutating(true);
      applyStatusToLocalState(nextStatus);
      if (currentEntityType === 'silo') {
        await userService.feedSilos.setStatus(targetId, nextStatus === 'Active');
      } else {
        await userService.facilities.setStatus(targetId, nextStatus === 'Active');
      }
    } catch (error: any) {
      applyStatusToLocalState(prevStatus);
      void showAlert({
        icon: 'error',
        title: 'เปลี่ยนสถานะไม่สำเร็จ',
        text: extractApiErrorMessage(error, 'ไม่สามารถเปลี่ยนสถานะได้ โปรดลองอีกครั้ง'),
      });
      console.error('Failed to update scope status', error);
      return;
    } finally {
      setIsStatusMutating(false);
    }

    void showAlert({
      icon: 'success',
      title: 'เปลี่ยนสถานะสำเร็จ',
      showConfirmButton: false,
      timer: 1500,
    });
  };

  const tableColumns = useMemo<Column<ScopeTableRow>[]>(() => {
    if (currentTab === 0) {
      return [
        { id: 'name', label: 'ชื่อฟาร์ม', minWidth: 220 },
        { id: 'location', label: 'พื้นที่', minWidth: 260 },
      ];
    }

    if (currentTab === 1) {
      return [
        { id: 'farmName', label: 'ฟาร์ม', minWidth: 220 },
        {
          id: 'name',
          label: 'ชื่อโซน',
          minWidth: 220,
          format: (value) => (
            <Typography variant="body2" sx={{ fontWeight: 700, color: 'primary.main' }}>
              {String(value ?? '-')}
            </Typography>
          ),
        },
      ];
    }

    if (currentTab === 2) {
      return [
        { id: 'farmName', label: 'ฟาร์ม', minWidth: 180 },
        { id: 'zoneName', label: 'โซน', minWidth: 180 },
        {
          id: 'name',
          label: 'ชื่อโรงเรือน',
          minWidth: 220,
          format: (value) => (
            <Typography variant="body2" sx={{ fontWeight: 700, color: 'primary.main' }}>
              {String(value ?? '-')}
            </Typography>
          ),
        },
      ];
    }

    if (currentTab === 3) {
      return [
        { id: 'farmName', label: 'ฟาร์ม', minWidth: 160 },
        { id: 'zoneName', label: 'โซน', minWidth: 160 },
        { id: 'houseName', label: 'โรงเรือน', minWidth: 170 },
        {
          id: 'name',
          label: 'ชื่อคอก',
          minWidth: 180,
          format: (value) => (
            <Typography variant="body2" sx={{ fontWeight: 700, color: 'primary.main' }}>
              {String(value ?? '-')}
            </Typography>
          ),
        },
      ];
    }

    return [
      { id: 'farmName', label: 'ฟาร์ม', minWidth: 160 },
      { id: 'zoneName', label: 'โซน', minWidth: 160 },
      { id: 'houseName', label: 'โรงเรือน', minWidth: 170 },
      {
        id: 'name',
        label: 'ชื่อไซโล',
        minWidth: 180,
        format: (value) => (
          <Typography variant="body2" sx={{ fontWeight: 700, color: 'primary.main' }}>
            {String(value ?? '-')}
          </Typography>
        ),
      },
      {
        id: 'capacityKg',
        label: 'ความจุ (กก.)',
        minWidth: 150,
        format: (value) =>
          typeof value === 'number'
            ? new Intl.NumberFormat('th-TH', { maximumFractionDigits: 4 }).format(value)
            : '-',
      },
    ];
  }, [currentTab]);

  return (
    <Box
      sx={{
        ...(isMasterPattern
          ? {
              display: 'flex',
              flexDirection: 'column',
              flex: 1,
              minHeight: 0,
            }
          : {
              p: { xs: 1.5, md: 2 },
              bgcolor: pageBg,
              color: 'text.primary',
            }),
      }}
    >
      <Box
        component={showManagementNav ? 'fieldset' : 'div'}
        sx={
          showManagementNav
            ? MASTER_PROGRAM_SHELL_FIELDSET_SX
            : {
                border: 0,
                m: 0,
                p: 0,
                minWidth: 0,
                display: 'flex',
                flexDirection: 'column',
                flex: 1,
                minHeight: 0,
              }
        }
      >
        {showManagementNav ? <Box sx={MASTER_PROGRAM_HEADER_BAR_SX}>จัดการขอบเขต</Box> : null}
        <Box
          sx={
            showManagementNav
              ? MASTER_PROGRAM_CONTENT_SX
              : { display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }
          }
        >
          <ContentCard
            borderColor={border}
            backgroundColor={surface}
            sx={{
              borderRadius: 10,
              overflow: 'hidden',
              ...(isMasterPattern ? {} : { p: 0 }),
            }}
          >
        {showScopeTabs ? (
          <Box sx={{ borderBottom: `1px solid ${border}`, bgcolor: surfaceMuted }}>
            <Tabs
              value={currentTab}
              onChange={handleTabChange}
              sx={{
                px: 2,
                '& .MuiTabs-indicator': {
                  height: 3,
                },
                '& .MuiTab-root': {
                  textTransform: 'none',
                  fontWeight: 600,
                  minHeight: 56,
                  gap: 1,
                  color: textMuted,
                },
                '& .Mui-selected': {
                  color: 'primary.light',
                },
              }}
            >
              <Tab icon={<Agriculture sx={{ fontSize: 20 }} />} iconPosition="start" label={`ฟาร์ม (${filteredFarms.length})`} />
              <Tab icon={<Layers sx={{ fontSize: 20 }} />} iconPosition="start" label={`โซน (${filteredZones.length})`} />
              <Tab icon={<Home sx={{ fontSize: 20 }} />} iconPosition="start" label={`โรงเรือน (${filteredHouses.length})`} />
              <Tab icon={<Pets sx={{ fontSize: 20 }} />} iconPosition="start" label={`คอก (${filteredPens.length})`} />
              <Tab icon={<Storage sx={{ fontSize: 20 }} />} iconPosition="start" label={`ไซโล (${filteredSilos.length})`} />
            </Tabs>
          </Box>
        ) : null}

        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            flexWrap: 'wrap',
            ...(isMasterPattern
              ? {
                  mb: isFilterExpanded ? 1 : 1.25,
                }
              : {
                  p: 2,
                  bgcolor: surface,
                  borderBottom: `1px solid ${border}`,
                }),
          }}
        >
          <SearchField
            placeholder={`ค้นหา${currentTabLabel}`}
            value={searchQuery}
            onChange={(event) => {
              setSearchQuery(event.target.value);
              setPage(0);
            }}
            sx={{
              flex: 1,
              minWidth: { xs: '100%', md: 260 },
              maxWidth: { md: isMasterPattern ? 360 : 420 },
              '& .MuiOutlinedInput-root': {
                bgcolor: isMasterPattern ? alpha(surface, 0.7) : pageBg,
              },
            }}
          />
          <Button
            variant="outlined"
            startIcon={<FilterList fontSize="small" />}
            onClick={handleToggleFilterPanel}
            sx={{
              minHeight: 40,
              textTransform: 'none',
              borderColor: activeFilterCount > 0 || isFilterExpanded ? alpha('#1d4ed8', 0.65) : border,
              color: activeFilterCount > 0 || isFilterExpanded ? '#1d4ed8' : textMuted,
              bgcolor: alpha(surface, isMasterPattern ? 0.6 : 0.9),
              '&:hover': {
                borderColor: activeFilterCount > 0 || isFilterExpanded ? '#1d4ed8' : theme.palette.text.primary,
                bgcolor: alpha(surface, isMasterPattern ? 0.76 : 1),
              },
            }}
          >
            ตัวกรอง{activeFilterCount > 0 ? ` (${activeFilterCount})` : ''}
          </Button>
          <Button
            variant="contained"
            startIcon={<Add />}
            disabled={addButtonDisabled}
            onClick={() => {
              if (currentTab === 0) {
                setEditingFarmId(null);
                setFarmDialogOpen(true);
              }
              if (currentTab === 1) {
                setEditingZoneId(null);
                setZoneDialogOpen(true);
              }
              if (currentTab === 2) {
                setEditingHouseId(null);
                setHouseDialogOpen(true);
              }
              if (currentTab === 3) {
                setEditingPenId(null);
                setPenDialogOpen(true);
              }
              if (currentTab === 4) {
                setEditingSiloId(null);
                setSiloDialogOpen(true);
              }
            }}
            sx={
              isMasterPattern
                ? {
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
                  }
                : { textTransform: 'none', fontWeight: 700, ml: { md: 'auto' } }
            }
          >
            เพิ่ม{currentTabLabel}
          </Button>
        </Box>

        <Collapse in={isFilterExpanded} timeout="auto">
          <Paper
            variant="outlined"
            sx={{
              borderRadius: 10,
              borderColor: border,
              bgcolor: alpha(surface, theme.palette.mode === 'dark' ? 0.84 : 0.96),
              p: { xs: 1.25, md: 1.5 },
              mb: 1.25,
            }}
          >
            <Typography sx={{ fontSize: '11px', fontWeight: 700, color: theme.palette.text.primary, mb: 0.75 }}>
              ตัวกรองรายการ
            </Typography>

            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))', lg: 'repeat(3, minmax(0, 1fr))' },
                gap: 1,
                '& .MuiFormControl-root': {
                  minWidth: 0,
                  width: '100%',
                  maxWidth: { xs: '100%', md: 280 },
                  '& .MuiOutlinedInput-root': { minHeight: 36 },
                },
              }}
            >
              {currentTab === 0 && (
                <>
                  <FormControl size="small">
                    <InputLabel>พื้นที่</InputLabel>
                    <Select
                      value={farmLocationFilter}
                      label="พื้นที่"
                      onChange={(event) => {
                        setFarmLocationFilter(event.target.value);
                        setPage(0);
                      }}
                      sx={{ bgcolor: alpha(surface, 0.7) }}
                    >
                      <MenuItem value="">ทุกพื้นที่</MenuItem>
                      {uniqueLocations.map((location) => (
                        <MenuItem key={location} value={location}>
                          {location}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  <FormControl size="small">
                    <InputLabel>สถานะ</InputLabel>
                    <Select
                      value={farmStatusFilter}
                      label="สถานะ"
                      onChange={(event) => {
                        setFarmStatusFilter(event.target.value);
                        setPage(0);
                      }}
                      sx={{ bgcolor: alpha(surface, 0.7) }}
                    >
                      <MenuItem value="">ทุกสถานะ</MenuItem>
                      <MenuItem value="Active">ใช้งาน</MenuItem>
                      <MenuItem value="Inactive">ไม่ใช้งาน</MenuItem>
                    </Select>
                  </FormControl>
                </>
              )}

              {currentTab === 1 && (
                <>
                  <FormControl size="small">
                    <InputLabel>ฟาร์ม</InputLabel>
                    <Select
                      value={zoneFarmFilter}
                      label="ฟาร์ม"
                      onChange={(event) => {
                        setZoneFarmFilter(event.target.value);
                        setPage(0);
                      }}
                      sx={{ bgcolor: alpha(surface, 0.7) }}
                    >
                      <MenuItem value="">ทุกฟาร์ม</MenuItem>
                      {uniqueFarmNames.map((farmName) => (
                        <MenuItem key={farmName} value={farmName}>
                          {farmName}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  <FormControl size="small">
                    <InputLabel>สถานะ</InputLabel>
                    <Select
                      value={zoneStatusFilter}
                      label="สถานะ"
                      onChange={(event) => {
                        setZoneStatusFilter(event.target.value);
                        setPage(0);
                      }}
                      sx={{ bgcolor: alpha(surface, 0.7) }}
                    >
                      <MenuItem value="">ทุกสถานะ</MenuItem>
                      <MenuItem value="Active">ใช้งาน</MenuItem>
                      <MenuItem value="Inactive">ไม่ใช้งาน</MenuItem>
                    </Select>
                  </FormControl>
                </>
              )}

              {currentTab === 2 && (
                <>
                  <FormControl size="small">
                    <InputLabel>ฟาร์ม</InputLabel>
                    <Select
                      value={houseFarmFilter}
                      label="ฟาร์ม"
                      onChange={(event) => {
                        setHouseFarmFilter(event.target.value);
                        setHouseZoneFilter('');
                        setPage(0);
                      }}
                      sx={{ bgcolor: alpha(surface, 0.7) }}
                    >
                      <MenuItem value="">ทุกฟาร์ม</MenuItem>
                      {uniqueFarmNames.map((farmName) => (
                        <MenuItem key={farmName} value={farmName}>
                          {farmName}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  <FormControl size="small">
                    <InputLabel>โซน</InputLabel>
                    <Select
                      value={houseZoneFilter}
                      label="โซน"
                      disabled={!houseFarmFilter}
                      onChange={(event) => {
                        setHouseZoneFilter(event.target.value);
                        setPage(0);
                      }}
                      sx={{ bgcolor: alpha(surface, 0.7) }}
                    >
                      <MenuItem value="">ทุกโซน</MenuItem>
                      {availableZonesForHouseFilter.map((zoneName) => (
                        <MenuItem key={zoneName} value={zoneName}>
                          {zoneName}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  <FormControl size="small">
                    <InputLabel>สถานะ</InputLabel>
                    <Select
                      value={houseStatusFilter}
                      label="สถานะ"
                      onChange={(event) => {
                        setHouseStatusFilter(event.target.value);
                        setPage(0);
                      }}
                      sx={{ bgcolor: alpha(surface, 0.7) }}
                    >
                      <MenuItem value="">ทุกสถานะ</MenuItem>
                      <MenuItem value="Active">ใช้งาน</MenuItem>
                      <MenuItem value="Inactive">ไม่ใช้งาน</MenuItem>
                    </Select>
                  </FormControl>
                </>
              )}

              {currentTab === 3 && (
                <>
                  <FormControl size="small">
                    <InputLabel>ฟาร์ม</InputLabel>
                    <Select
                      value={penFarmFilter}
                      label="ฟาร์ม"
                      onChange={(event) => {
                        setPenFarmFilter(event.target.value);
                        setPenZoneFilter('');
                        setPenHouseFilter('');
                        setPage(0);
                      }}
                      sx={{ bgcolor: alpha(surface, 0.7) }}
                    >
                      <MenuItem value="">ทุกฟาร์ม</MenuItem>
                      {uniqueFarmNamesForPens.map((farmName) => (
                        <MenuItem key={farmName} value={farmName}>
                          {farmName}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  <FormControl size="small">
                    <InputLabel>โซน</InputLabel>
                    <Select
                      value={penZoneFilter}
                      label="โซน"
                      disabled={!penFarmFilter}
                      onChange={(event) => {
                        setPenZoneFilter(event.target.value);
                        setPenHouseFilter('');
                        setPage(0);
                      }}
                      sx={{ bgcolor: alpha(surface, 0.7) }}
                    >
                      <MenuItem value="">ทุกโซน</MenuItem>
                      {availableZonesForPenFilter.map((zoneName) => (
                        <MenuItem key={zoneName} value={zoneName}>
                          {zoneName}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  <FormControl size="small">
                    <InputLabel>โรงเรือน</InputLabel>
                    <Select
                      value={penHouseFilter}
                      label="โรงเรือน"
                      disabled={!penZoneFilter}
                      onChange={(event) => {
                        setPenHouseFilter(event.target.value);
                        setPage(0);
                      }}
                      sx={{ bgcolor: alpha(surface, 0.7) }}
                    >
                      <MenuItem value="">ทุกโรงเรือน</MenuItem>
                      {availableHousesForPenFilter.map((houseName) => (
                        <MenuItem key={houseName} value={houseName}>
                          {houseName}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  <FormControl size="small">
                    <InputLabel>สถานะ</InputLabel>
                    <Select
                      value={penStatusFilter}
                      label="สถานะ"
                      onChange={(event) => {
                        setPenStatusFilter(event.target.value);
                        setPage(0);
                      }}
                      sx={{ bgcolor: alpha(surface, 0.7) }}
                    >
                      <MenuItem value="">ทุกสถานะ</MenuItem>
                      <MenuItem value="Active">ใช้งาน</MenuItem>
                      <MenuItem value="Inactive">ไม่ใช้งาน</MenuItem>
                    </Select>
                  </FormControl>
                </>
              )}

              {currentTab === 4 && (
                <>
                  <FormControl size="small">
                    <InputLabel>ฟาร์ม</InputLabel>
                    <Select
                      value={siloFarmFilter}
                      label="ฟาร์ม"
                      onChange={(event) => {
                        setSiloFarmFilter(event.target.value);
                        setSiloZoneFilter('');
                        setSiloHouseFilter('');
                        setPage(0);
                      }}
                      sx={{ bgcolor: alpha(surface, 0.7) }}
                    >
                      <MenuItem value="">ทุกฟาร์ม</MenuItem>
                      {uniqueFarmNamesForSilos.map((farmName) => (
                        <MenuItem key={farmName} value={farmName}>
                          {farmName}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  <FormControl size="small">
                    <InputLabel>โซน</InputLabel>
                    <Select
                      value={siloZoneFilter}
                      label="โซน"
                      disabled={!siloFarmFilter}
                      onChange={(event) => {
                        setSiloZoneFilter(event.target.value);
                        setSiloHouseFilter('');
                        setPage(0);
                      }}
                      sx={{ bgcolor: alpha(surface, 0.7) }}
                    >
                      <MenuItem value="">ทุกโซน</MenuItem>
                      {availableZonesForSiloFilter.map((zoneName) => (
                        <MenuItem key={zoneName} value={zoneName}>
                          {zoneName}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  <FormControl size="small">
                    <InputLabel>โรงเรือน</InputLabel>
                    <Select
                      value={siloHouseFilter}
                      label="โรงเรือน"
                      disabled={!siloZoneFilter}
                      onChange={(event) => {
                        setSiloHouseFilter(event.target.value);
                        setPage(0);
                      }}
                      sx={{ bgcolor: alpha(surface, 0.7) }}
                    >
                      <MenuItem value="">ทุกโรงเรือน</MenuItem>
                      {availableHousesForSiloFilter.map((houseName) => (
                        <MenuItem key={houseName} value={houseName}>
                          {houseName}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  <FormControl size="small">
                    <InputLabel>สถานะ</InputLabel>
                    <Select
                      value={siloStatusFilter}
                      label="สถานะ"
                      onChange={(event) => {
                        setSiloStatusFilter(event.target.value);
                        setPage(0);
                      }}
                      sx={{ bgcolor: alpha(surface, 0.7) }}
                    >
                      <MenuItem value="">ทุกสถานะ</MenuItem>
                      <MenuItem value="Active">ใช้งาน</MenuItem>
                      <MenuItem value="Inactive">ไม่ใช้งาน</MenuItem>
                    </Select>
                  </FormControl>
                </>
              )}
            </Box>

            <Divider sx={{ borderColor: border, my: 1 }} />
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
              <Button
                variant="text"
                onClick={() => {
                  clearAllFilters();
                  setPage(0);
                }}
                sx={{ textTransform: 'none', color: textMuted }}
              >
                ล้างค่า
              </Button>
              <Button
                variant="contained"
                onClick={() => {
                  setPage(0);
                  setIsFilterExpanded(false);
                }}
                sx={{
                  textTransform: 'none',
                  boxShadow: 'none',
                  bgcolor: '#1d4ed8',
                  '&:hover': { bgcolor: '#1e40af', boxShadow: 'none' },
                }}
              >
                นำไปใช้
              </Button>
            </Box>
          </Paper>
        </Collapse>

        <DataTable<ScopeTableRow>
          columns={tableColumns}
          data={pagedTableRows}
          totalCount={currentData.length}
          page={page}
          rowsPerPage={rowsPerPage}
          onPageChange={setPage}
          onRowsPerPageChange={(value) => {
            setRowsPerPage(value);
            setPage(0);
          }}
          rowsPerPageOptions={[25, 50, 100]}
          footerSummaryText={`ทั้งหมด ${currentData.length} รายการ`}
          stickyHeader
          sortable={false}
          emptyMessage="ไม่พบข้อมูลตามเงื่อนไขที่เลือก"
          loading={!isHydrated || isMutating || isStatusMutating}
          lockEntityColumns
          includeCodeColumn={currentTab === 0 || currentTab === 4}
          includeStatusColumn
          onEditRow={(row) => {
            const targetId = row._dbId ?? row.id;
            void handleEdit(currentEntityType, targetId);
          }}
          onDeleteRow={(row) => {
            const targetId = row._dbId ?? row.id;
            void handleDelete(currentEntityType, targetId);
          }}
          onToggleRowStatus={(row) => {
            void handleToggleRowStatus(row);
          }}
          isRowActive={(row) => row.status === 'Active'}
          paperSx={{
            flex: 1,
            minHeight: 0,
            borderRadius: 10,
            borderColor: border,
            bgcolor: surface,
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
            scrollbarColor: `${alpha(textMuted, 0.58)} ${alpha(borderSoft, 0.16)}`,
            '&::-webkit-scrollbar': { width: 8, height: 8 },
            '&::-webkit-scrollbar-track': {
              backgroundColor: alpha(borderSoft, 0.12),
              borderLeft: `1px solid ${alpha(border, 0.46)}`,
              borderRadius: 10,
              marginBlock: 6,
            },
            '&::-webkit-scrollbar-thumb': {
              backgroundColor: alpha(textMuted, 0.62),
              borderRadius: 10,
              border: `1px solid ${alpha(surface, 0.66)}`,
            },
            '&::-webkit-scrollbar-thumb:hover': {
              backgroundColor: alpha(textMuted, 0.8),
            },
          }}
          tableSx={{
            tableLayout: 'fixed',
            width: '100%',
            borderCollapse: 'separate',
            borderSpacing: 0,
            '& .MuiTableCell-root': {
              px: 1.25,
              whiteSpace: 'normal',
              wordBreak: 'break-word',
              overflowWrap: 'anywhere',
              verticalAlign: 'top',
            },
            '& .MuiTableHead-root .MuiTableCell-root': {
              borderBottom: `1px solid ${border}`,
              color: theme.palette.text.primary,
              fontSize: '13px',
              bgcolor: tableHeaderSurface,
            },
            '& .MuiTableBody-root .MuiTableCell-root': {
              borderBottom: `1px solid ${borderSoft}`,
              color: textMuted,
              fontSize: '12px',
            },
            '& .MuiTableHead-root .MuiTableCell-root:not(:last-of-type), & .MuiTableBody-root .MuiTableCell-root:not(:last-of-type)': {
              borderRight: `1px solid ${alpha(border, 0.48)}`,
            },
          }}
        />
      </ContentCard>
        </Box>
      </Box>

      <AddFarmDialog
        open={farmDialogOpen}
        onClose={() => {
          setFarmDialogOpen(false);
          setEditingFarmId(null);
        }}
        onSave={(payload) => {
          void handleSaveFarm(payload);
        }}
        mode={editingFarmId ? 'edit' : 'create'}
        initialData={editingFarmId ? farms.find((farm) => farm.id === editingFarmId) ?? null : null}
      />

      <AddZoneDialog
        open={zoneDialogOpen}
        onClose={() => {
          setZoneDialogOpen(false);
          setEditingZoneId(null);
        }}
        onSave={(payload) => {
          void handleSaveZone(payload);
        }}
        farms={farms}
        mode={editingZoneId ? 'edit' : 'create'}
        initialData={editingZoneId ? zones.find((zone) => zone.id === editingZoneId) ?? null : null}
      />

      <AddHouseDialog
        open={houseDialogOpen}
        onClose={() => {
          setHouseDialogOpen(false);
          setEditingHouseId(null);
        }}
        onSave={(payload) => {
          void handleSaveHouse(payload);
        }}
        farms={farms}
        zones={zones}
        mode={editingHouseId ? 'edit' : 'create'}
        initialData={editingHouseId ? houses.find((house) => house.id === editingHouseId) ?? null : null}
      />

      <AddPenDialog
        open={penDialogOpen}
        onClose={() => {
          setPenDialogOpen(false);
          setEditingPenId(null);
        }}
        onSave={(payload) => {
          void handleSavePen(payload);
        }}
        farms={farms}
        zones={zones}
        houses={houses}
        mode={editingPenId ? 'edit' : 'create'}
        initialData={editingPenId ? pens.find((pen) => pen.id === editingPenId) ?? null : null}
      />

      <AddSiloDialog
        open={siloDialogOpen}
        onClose={() => {
          setSiloDialogOpen(false);
          setEditingSiloId(null);
        }}
        onSave={(payload) => {
          void handleSaveSilo(payload);
        }}
        farms={farms}
        zones={zones}
        houses={houses}
        mode={editingSiloId ? 'edit' : 'create'}
        initialData={editingSiloId ? silos.find((silo) => silo.id === editingSiloId) ?? null : null}
      />
    </Box>
  );
}
