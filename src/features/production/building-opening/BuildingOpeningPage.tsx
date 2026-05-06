'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Add as AddIcon,
  AssignmentTurnedInOutlined,
  PendingActionsOutlined,
  Refresh as RefreshIcon,
  TodayOutlined,
  UndoOutlined,
} from '@mui/icons-material';
import { Search as SearchIcon } from '@mui/icons-material';
import { Alert, Autocomplete, Box, Button, InputAdornment, MenuItem, Stack, TextField, Typography } from '@mui/material';
import { AxiosError } from 'axios';
import { QuickStatusButtonGroup, StatsCard } from '@/components/common';
import { PageTabs } from '@/design-system';
import { WorkspaceHeader } from '@/design-system';
import {
  FACILITY_CHANGED_EVENT,
  getCurrentFacilityCode,
  getCurrentFacilityId,
} from '@/lib/facility-context';
import { toISODateString } from '@/lib/utils/date.util';
import type { BuildingOpeningFilterParams, BuildingOpeningResponse } from './types';
import { buildingOpeningService } from './services/building-opening.service';
import { BuildingOpeningApprovalPage } from '../building-opening-approvals/BuildingOpeningApprovalPage';
import { stockPanelSx } from '../stock/components/StockWorkspaceChrome';
import {
  buildBuildingOpeningStatusItems,
  matchesBuildingOpeningFilters,
} from './utils/building-opening-filters';
import {
  BuildingOpeningDetailsDialog,
  BuildingOpeningList,
  CreateBuildingOpeningDialog,
  buildingOpeningInputSx,
  buildingOpeningPageShellSx,
} from './components';

type BuildingOpeningPageProps = {
  initialData?: BuildingOpeningResponse[];
};

export function BuildingOpeningPage({ initialData = [] }: BuildingOpeningPageProps) {
  type FacilityOption = { id: number; code: string; name: string };
  type HouseOption = { id: number; facilityNodeId: number; houseCode: string; houseName: string };
  const today = toISODateString(new Date());

  const [rows, setRows] = useState<BuildingOpeningResponse[]>(initialData);
  const [loading, setLoading] = useState(initialData.length === 0);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<BuildingOpeningResponse | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [createMode, setCreateMode] = useState<'create' | 'edit'>('create');
  const [editing, setEditing] = useState<BuildingOpeningResponse | null>(null);
  const [currentFacilityId, setCurrentFacilityId] = useState<number | null>(
    () => getCurrentFacilityId(),
  );
  const [currentFacilityCode, setCurrentFacilityCode] = useState<string | null>(
    () => getCurrentFacilityCode(),
  );
  const initialBootstrapSkippedRef = useRef(false);
  const [facilityOptions, setFacilityOptions] = useState<FacilityOption[]>([]);
  const [houseOptions, setHouseOptions] = useState<HouseOption[]>([]);
  const [activeTab, setActiveTab] = useState<'openings' | 'approvals'>('openings');

  const [filters, setFilters] = useState<BuildingOpeningFilterParams>({
    searchTerm: '',
    requestDateFrom: today,
    requestDateTo: today,
    facilityId: null,
    houseId: null,
    status: 'all',
  });
  const [appliedFilters, setAppliedFilters] = useState<BuildingOpeningFilterParams>({
    searchTerm: '',
    requestDateFrom: today,
    requestDateTo: today,
    facilityId: null,
    houseId: null,
    status: 'all',
  });

  const loadRows = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const effectiveFacilityId = appliedFilters.facilityId ?? currentFacilityId ?? undefined;
      const data = await buildingOpeningService.getAll({
        status: 'all',
        q: appliedFilters.searchTerm.trim() || undefined,
        facilityId: effectiveFacilityId,
        facilityCode: currentFacilityCode ?? undefined,
      });
      setRows(data);
    } catch (err) {
      const axiosError = err as AxiosError<{ message?: string }>;
      setError(axiosError.response?.data?.message || 'ไม่สามารถโหลดข้อมูลเปิดโรงเรือนได้');
    } finally {
      setLoading(false);
    }
  }, [appliedFilters.facilityId, appliedFilters.searchTerm, currentFacilityCode, currentFacilityId]);

  useEffect(() => {
    if (!initialBootstrapSkippedRef.current && initialData.length > 0) {
      initialBootstrapSkippedRef.current = true;
      return;
    }
    void loadRows();
  }, [initialData.length, loadRows]);

  useEffect(() => {
    setCurrentFacilityId(getCurrentFacilityId());
    setCurrentFacilityCode(getCurrentFacilityCode());

    const onFacilityChanged = () => {
      setCurrentFacilityId(getCurrentFacilityId());
      setCurrentFacilityCode(getCurrentFacilityCode());
    };

    window.addEventListener(FACILITY_CHANGED_EVENT, onFacilityChanged);
    return () => window.removeEventListener(FACILITY_CHANGED_EVENT, onFacilityChanged);
  }, []);

  useEffect(() => {
    let active = true;
    void (async () => {
      try {
        const options = await buildingOpeningService.getCreateOptions();
        if (!active) return;
        setFacilityOptions(options.facilities.map((item) => ({
          id: item.id,
          code: item.code,
          name: item.name,
        })));
        setHouseOptions(options.houses.map((item) => ({
          id: item.id,
          facilityNodeId: item.facilityNodeId,
          houseCode: item.houseCode,
          houseName: item.houseName,
        })));
      } catch {
        // ignore option loading error and keep page usable with current data
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const houseOptionById = useMemo(() => {
    const map = new Map<number, HouseOption>();
    for (const item of houseOptions) map.set(item.id, item);
    return map;
  }, [houseOptions]);

  const filteredHouseOptions = useMemo(() => {
    const source = !filters.facilityId
      ? houseOptions
      : houseOptions.filter((item) => item.facilityNodeId === filters.facilityId);

    return [...source].sort((a, b) => {
      const byCode = (a.houseCode || '').localeCompare(b.houseCode || '', 'th', {
        numeric: true,
        sensitivity: 'base',
      });
      if (byCode !== 0) return byCode;
      return (a.houseName || '').localeCompare(b.houseName || '', 'th', {
        numeric: true,
        sensitivity: 'base',
      });
    });
  }, [filters.facilityId, houseOptions]);

  const filteredRowsWithoutStatus = useMemo(() => {
    return rows.filter((item) =>
      matchesBuildingOpeningFilters(
        item,
        { ...appliedFilters, status: 'all' },
        houseOptionById,
        false,
      ),
    );
  }, [
    appliedFilters.facilityId,
    appliedFilters.houseId,
    appliedFilters.requestDateFrom,
    appliedFilters.requestDateTo,
    appliedFilters.searchTerm,
    houseOptionById,
    rows,
  ]);

  const filteredRows = useMemo(() => {
    return filteredRowsWithoutStatus.filter((item) =>
      matchesBuildingOpeningFilters(item, appliedFilters, houseOptionById, true),
    );
  }, [appliedFilters, filteredRowsWithoutStatus, houseOptionById]);

  const statusQuickStatuses = useMemo(
    () => buildBuildingOpeningStatusItems(filteredRowsWithoutStatus),
    [filteredRowsWithoutStatus],
  );

  const openDetails = async (row: BuildingOpeningResponse) => {
    try {
      const full = await buildingOpeningService.getById(row.id);
      setSelected(full);
      setDetailsOpen(true);
    } catch (err) {
      const axiosError = err as AxiosError<{ message?: string }>;
      setError(axiosError.response?.data?.message || 'ไม่สามารถโหลดรายละเอียดได้');
    }
  };

  const refreshOne = async (id: number) => {
    const full = await buildingOpeningService.getById(id);
    setSelected(full);
    await loadRows();
  };

  const summaryCards = useMemo(() => {
    const submitted = filteredRows.filter((row) => row.status === 'Submitted').length;
    const approved = filteredRows.filter((row) => row.status === 'Approved').length;
    const draft = filteredRows.filter((row) => row.status === 'Draft').length;
    return [
      {
        key: 'all',
        title: 'รายการทั้งหมด',
        subtitle: 'เอกสารเปิดโรงเรือน',
        value: filteredRows.length,
        icon: <TodayOutlined />,
        color: 'info' as const,
      },
      {
        key: 'submitted',
        title: 'รอดำเนินการ',
        subtitle: 'งานรออนุมัติ',
        value: submitted,
        icon: <PendingActionsOutlined />,
        color: 'warning' as const,
      },
      {
        key: 'approved',
        title: 'อนุมัติแล้ว',
        subtitle: 'พร้อมเปิดใช้งาน',
        value: approved,
        icon: <AssignmentTurnedInOutlined />,
        color: 'success' as const,
      },
      {
        key: 'draft',
        title: 'ฉบับร่าง',
        subtitle: 'รอส่งอนุมัติ',
        value: draft,
        icon: <UndoOutlined />,
        color: 'error' as const,
      },
    ];
  }, [filteredRows]);

  return (
    <Box sx={{ ...buildingOpeningPageShellSx, maxWidth: 1400, mx: 'auto' }}>
      <WorkspaceHeader
        chipLabel="Building Opening"
        title="เปิดโรงเรือน"
        subtitle=""
        meta="Dashboard / เปิดโรงเรือน"
      />

      <Box sx={{ display: 'grid', gap: 1.5, gridTemplateColumns: { xs: '1fr', sm: 'repeat(2,minmax(0,1fr))', md: 'repeat(4,minmax(0,1fr))' } }}>
        {summaryCards.map((card) => (
          <StatsCard
            key={card.key}
            title={card.title}
            value={card.value}
            subtitle={card.subtitle}
            icon={card.icon}
            color={card.color}
          />
        ))}
      </Box>

      <Box sx={{ ...stockPanelSx, px: 1, py: 1, mb: 1.6 }}>
        <PageTabs
          tabs={[
            { key: 'openings', label: 'รายการเปิดโรงเรือน' },
            { key: 'approvals', label: 'รายการอนุมัติ' },
          ]}
          activeKey={activeTab}
          onChange={(key) => setActiveTab(key as 'openings' | 'approvals')}
        />
      </Box>

      {activeTab === 'openings' ? (
        <Stack spacing={1.6}>
          {error ? (
            <Alert severity="error" sx={{ mb: 0 }}>
              {error}
            </Alert>
          ) : null}

          <Box sx={{ ...stockPanelSx, p: 1.5 }}>
            <Stack spacing={1.5}>
              <Box sx={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 1.5, flexWrap: 'wrap' }}>
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 900, color: 'text.primary', lineHeight: 1.1 }}>
                    ตัวกรองรายการ
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 0.4 }}>
                    ค้นหาด้วยเลขที่เอกสาร ฟาร์ม โรงเรือน และช่วงวันที่
                  </Typography>
                </Box>
                <Stack direction="row" spacing={1}>
                  <Button
                    variant="outlined"
                    startIcon={<AddIcon />}
                    onClick={() => {
                      setCreateMode('create');
                      setEditing(null);
                      setCreateOpen(true);
                    }}
                  >
                    สร้างรายการ
                  </Button>
                  <Button startIcon={<RefreshIcon />} onClick={loadRows} variant="outlined">
                    รีเฟรช
                  </Button>
                </Stack>
              </Box>

              <QuickStatusButtonGroup
                items={statusQuickStatuses}
                selectedValue={filters.status}
                onChange={(value) => {
                  const nextStatus = value as BuildingOpeningFilterParams['status'];
                  setFilters((prev) => ({ ...prev, status: nextStatus }));
                  setAppliedFilters((prev) => ({ ...prev, status: nextStatus }));
                }}
              />

              <Box
                sx={{
                  display: 'grid',
                  gap: 1.5,
                  gridTemplateColumns: {
                    xs: '1fr',
                    sm: '1fr 1fr',
                    md: '1.4fr 1.2fr 1.2fr minmax(300px,1.2fr)',
                  },
                  alignItems: 'center',
                }}
              >
                <TextField
                  size="small"
                  placeholder="ค้นหาเลขที่เอกสาร"
                  value={filters.searchTerm}
                  onChange={(event) => setFilters((prev) => ({ ...prev, searchTerm: event.target.value }))}
                  sx={buildingOpeningInputSx}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon />
                      </InputAdornment>
                    ),
                  }}
                />
                <Autocomplete
                  size="small"
                  options={facilityOptions}
                  getOptionLabel={(option) => `${option.code} - ${option.name}`}
                  value={facilityOptions.find((item) => item.id === (filters.facilityId ?? 0)) || null}
                  onChange={(_, value) => setFilters((prev) => ({ ...prev, facilityId: value?.id ?? null, houseId: null }))}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      placeholder="ค้นหาฟาร์ม"
                      sx={buildingOpeningInputSx}
                    />
                  )}
                />
                <TextField
                  size="small"
                  select
                  placeholder="เลือกโรงเรือน"
                  value={filters.houseId ?? ''}
                  onChange={(event) => {
                    const value = event.target.value;
                    setFilters((prev) => ({ ...prev, houseId: value === '' ? null : Number(value) }));
                  }}
                  SelectProps={{
                    displayEmpty: true,
                    renderValue: (value) => {
                      if (!value) return 'เลือกโรงเรือน';
                      const selectedHouse = filteredHouseOptions.find((item) => item.id === Number(value));
                      return selectedHouse ? `${selectedHouse.houseCode} - ${selectedHouse.houseName}` : 'เลือกโรงเรือน';
                    },
                  }}
                  sx={buildingOpeningInputSx}
                >
                  <MenuItem value="">เลือกโรงเรือนทั้งหมด</MenuItem>
                  {filteredHouseOptions.map((item) => (
                    <MenuItem key={item.id} value={item.id}>
                      {item.houseCode} - {item.houseName}
                    </MenuItem>
                  ))}
                </TextField>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <TextField
                    size="small"
                    type="date"
                    value={filters.requestDateFrom || ''}
                    onChange={(event) => setFilters((prev) => ({ ...prev, requestDateFrom: event.target.value }))}
                    sx={{ flex: 1, ...buildingOpeningInputSx }}
                  />
                  <Typography variant="body2" color="text.secondary" sx={{ minWidth: 20, textAlign: 'center' }}>
                    ถึง
                  </Typography>
                  <TextField
                    size="small"
                    type="date"
                    value={filters.requestDateTo || ''}
                    onChange={(event) => setFilters((prev) => ({ ...prev, requestDateTo: event.target.value }))}
                    sx={{ flex: 1, ...buildingOpeningInputSx }}
                  />
                </Box>
              </Box>

              <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                <Button
                  variant="contained"
                  startIcon={<SearchIcon />}
                  onClick={() => setAppliedFilters(filters)}
                >
                  ค้นหา
                </Button>
              </Box>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', textAlign: 'right' }}>
                *ดับเบิลคลิกที่แถวเพื่อดูรายละเอียดเพิ่มเติม
              </Typography>
              <BuildingOpeningList
                data={filteredRows}
                loading={loading}
                onView={openDetails}
                emptyMessage="ยังไม่มีรายการเปิดโรงเรือน"
              />
            </Stack>
          </Box>
        </Stack>
      ) : (
        <BuildingOpeningApprovalPage mode="approval" compact embedded />
      )}

      <BuildingOpeningDetailsDialog
        open={detailsOpen}
        request={selected}
        onClose={() => setDetailsOpen(false)}
        onRefresh={refreshOne}
        onEdit={(row) => {
          setEditing(row);
          setCreateMode('edit');
          setCreateOpen(true);
        }}
        onSubmit={async (id) => {
          await buildingOpeningService.submit(id);
        }}
        onUpdateChecklists={async (id, payload) => {
          await buildingOpeningService.updateChecklists(id, payload);
        }}
        onComplete={async (id, payload) => {
          await buildingOpeningService.complete(id, payload);
        }}
      />

      <CreateBuildingOpeningDialog
        open={createOpen}
        onClose={() => {
          setCreateOpen(false);
          setEditing(null);
          setCreateMode('create');
        }}
        onSaved={loadRows}
        mode={createMode}
        initialData={editing}
      />
    </Box>
  );
}
