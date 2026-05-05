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
import { Alert, Autocomplete, Box, Button, InputAdornment, MenuItem, Tab, Tabs, TextField, Typography } from '@mui/material';
import { Chip } from '@mui/material';
import { alpha } from '@mui/material/styles';
import { AxiosError } from 'axios';
import {
  FACILITY_CHANGED_EVENT,
  getCurrentFacilityCode,
  getCurrentFacilityId,
} from '@/lib/facility-context';
import { toISODateString } from '@/lib/utils/date.util';
import type { BuildingOpeningFilterParams, BuildingOpeningResponse } from './types';
import { buildingOpeningService } from './services/building-opening.service';
import { BuildingOpeningApprovalPage } from '../building-opening-approvals/BuildingOpeningApprovalPage';
import {
  BuildingOpeningDetailsDialog,
  BuildingOpeningList,
  CreateBuildingOpeningDialog,
} from './components';

type BuildingOpeningPageProps = {
  initialData?: BuildingOpeningResponse[];
};

const UI = {
  panel: '#ffffff',
  panelSoft: '#f8faf8',
  panelMuted: '#f2f6f3',
  border: '#dde2de',
  borderStrong: '#cad4cf',
  text: '#2f3a37',
  muted: '#7d8783',
  accent: 'rgb(22, 90, 80)',
  accentSurface: '#edf5f1',
  shadow: '0 18px 40px rgba(22, 35, 31, 0.08), 0 3px 10px rgba(22, 35, 31, 0.05)',
  softShadow: '0 10px 24px rgba(22, 35, 31, 0.06), 0 2px 6px rgba(22, 35, 31, 0.04)',
};

const panelSx = {
  borderRadius: 3.5,
  border: `1px solid ${UI.border}`,
  bgcolor: UI.panel,
  boxShadow: UI.shadow,
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

  const filteredRows = useMemo(() => {
    return rows.filter((item) => {
      if (appliedFilters.status !== 'all' && item.status !== appliedFilters.status) {
        return false;
      }

      const rowDate = item.requestDate.slice(0, 10);
      if (appliedFilters.requestDateFrom && rowDate < appliedFilters.requestDateFrom) {
        return false;
      }
      if (appliedFilters.requestDateTo && rowDate > appliedFilters.requestDateTo) {
        return false;
      }

      if (appliedFilters.houseId) {
        const house = houseOptionById.get(appliedFilters.houseId);
        if (house && item.houseCode !== house.houseCode) {
          return false;
        }
      }

      const keyword = appliedFilters.searchTerm.trim().toLowerCase();
      if (!keyword) return true;
      if (!item.documentNumber.toLowerCase().includes(keyword)) {
        return false;
      }

      return true;
    });
  }, [appliedFilters.houseId, appliedFilters.requestDateFrom, appliedFilters.requestDateTo, appliedFilters.searchTerm, appliedFilters.status, houseOptionById, rows]);

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
        icon: <TodayOutlined sx={{ color: '#4a6982', fontSize: 20 }} />,
        iconBg: '#efe8da',
        bar: '#4a6982',
      },
      {
        key: 'submitted',
        title: 'รอดำเนินการ',
        subtitle: 'งานรออนุมัติ',
        value: submitted,
        icon: <PendingActionsOutlined sx={{ color: '#d09100', fontSize: 20 }} />,
        iconBg: '#f2ead8',
        bar: '#d09100',
      },
      {
        key: 'approved',
        title: 'อนุมัติแล้ว',
        subtitle: 'พร้อมเปิดใช้งาน',
        value: approved,
        icon: <AssignmentTurnedInOutlined sx={{ color: '#2e7d32', fontSize: 20 }} />,
        iconBg: '#dfe9db',
        bar: '#2e7d32',
      },
      {
        key: 'draft',
        title: 'ฉบับร่าง',
        subtitle: 'รอส่งอนุมัติ',
        value: draft,
        icon: <UndoOutlined sx={{ color: '#7c5ce5', fontSize: 20 }} />,
        iconBg: '#e4ddf4',
        bar: '#7c5ce5',
      },
    ];
  }, [filteredRows]);

  return (
    <Box sx={{ p: { xs: 1.5, md: 2 }, bgcolor: UI.bg }}>
      <Box
        sx={{
          ...panelSx,
          background: `linear-gradient(135deg, ${UI.accentSurface} 0%, ${UI.panel} 58%)`,
          px: { xs: 2, md: 2.6 },
          py: { xs: 2, md: 2.4 },
          display: 'grid',
          gap: 1.4,
          mb: 2,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
          <Chip size="small" label="Building Opening" sx={{ bgcolor: '#fff', color: UI.accent, fontWeight: 800, border: `1px solid ${UI.borderStrong}`, height: 28 }} />
          <Typography sx={{ fontSize: '0.9rem', color: UI.muted }}>
            จัดการเอกสารเปิดโรงเรือน ค้นหา และติดตามสถานะได้จากหน้าจอเดียว
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 1.5, flexWrap: 'wrap' }}>
          <Box>
            <Typography sx={{ fontSize: { xs: '1.9rem', md: '2.35rem' }, fontWeight: 900, lineHeight: 1.02, color: UI.text, letterSpacing: '-0.03em' }}>
              เปิดโรงเรือน
            </Typography>
            <Typography sx={{ mt: 0.8, fontSize: '0.96rem', color: UI.muted, maxWidth: 760 }}>
              เริ่มจากรายการที่ต้องติดตามก่อน จากนั้นคัดกรองตามฟาร์ม โรงเรือน และช่วงวันที่เพื่อจัดการเอกสารได้รวดเร็วขึ้น
            </Typography>
          </Box>
          <Typography sx={{ fontSize: '0.95rem', color: UI.muted, fontWeight: 700 }}>
            Dashboard / เปิดโรงเรือน
          </Typography>
        </Box>
      </Box>

      <Box sx={{ display: 'grid', gap: 1.5, gridTemplateColumns: { xs: '1fr 1fr', md: 'repeat(4,minmax(0,1fr))' }, mb: 2 }}>
        {summaryCards.map((card) => (
          <Box
            key={card.key}
            sx={{
              ...panelSx,
              position: 'relative',
              overflow: 'hidden',
              p: 1.7,
              '&::before': {
                content: '""',
                position: 'absolute',
                inset: 0,
                background: `linear-gradient(135deg, ${alpha(card.iconBg, 0.82)} 0%, rgba(255,255,255,0) 55%)`,
                pointerEvents: 'none',
              },
            }}
          >
            <Box sx={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 1 }}>
              <Box>
                <Typography sx={{ fontSize: '2rem', fontWeight: 700, color: '#1d2624', lineHeight: 1 }}>
                  {card.value.toLocaleString()}
                </Typography>
                <Typography sx={{ fontSize: '1rem', color: UI.text, fontWeight: 800, mt: 0.45 }}>{card.title}</Typography>
              </Box>
              <Box sx={{ width: 46, height: 46, borderRadius: 2, bgcolor: '#fff', border: `1px solid ${alpha(card.bar, 0.15)}`, boxShadow: UI.softShadow, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                {card.icon}
              </Box>
            </Box>
            <Typography sx={{ position: 'relative', zIndex: 1, fontSize: '0.82rem', color: UI.muted }}>{card.subtitle}</Typography>
            <Box sx={{ position: 'relative', zIndex: 1, mt: 1.6, width: 108, height: 8, borderRadius: 999, bgcolor: '#e3e9e4' }}>
              <Box sx={{ width: 54, height: '100%', bgcolor: card.bar, borderRadius: 999 }} />
            </Box>
          </Box>
        ))}
      </Box>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 1,
          mb: 1.25,
          bgcolor: UI.panel,
          p: 1.25,
          borderRadius: 3.5,
          border: `1px solid ${UI.border}`,
          boxShadow: UI.shadow,
          flexWrap: 'wrap',
        }}
      >
        <Tabs
          value={activeTab}
          onChange={(_, value) => setActiveTab(value as 'openings' | 'approvals')}
          variant="scrollable"
          allowScrollButtonsMobile
          sx={{
            minHeight: 40,
            '& .MuiTabs-indicator': { display: 'none' },
            '& .MuiTabs-flexContainer': { gap: 1 },
          }}
        >
          <Tab
            value="openings"
            label="รายการเปิดโรงเรือน"
            sx={{
              minHeight: 40,
              px: 2,
              borderRadius: 2,
              textTransform: 'none',
              fontWeight: 800,
              bgcolor: activeTab === 'openings' ? alpha(UI.accent, 0.08) : 'transparent',
              color: activeTab === 'openings' ? UI.accent : UI.text,
              border: `1px solid ${activeTab === 'openings' ? alpha(UI.accent, 0.18) : UI.border}`,
            }}
          />
          <Tab
            value="approvals"
            label="รายการอนุมัติ"
            sx={{
              minHeight: 40,
              px: 2,
              borderRadius: 2,
              textTransform: 'none',
              fontWeight: 800,
              bgcolor: activeTab === 'approvals' ? alpha(UI.accent, 0.08) : 'transparent',
              color: activeTab === 'approvals' ? UI.accent : UI.text,
              border: `1px solid ${activeTab === 'approvals' ? alpha(UI.accent, 0.18) : UI.border}`,
            }}
          />
        </Tabs>

        {activeTab === 'openings' ? (
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            <Button
              variant="outlined"
              startIcon={<AddIcon />}
              onClick={() => {
                setCreateMode('create');
                setEditing(null);
                setCreateOpen(true);
              }}
              sx={{
                borderColor: '#b8c5bf',
                color: UI.text,
                borderRadius: 2,
                boxShadow: UI.softShadow,
                '&:hover': { borderColor: UI.accent, bgcolor: alpha(UI.accent, 0.06) },
              }}
            >
              สร้างรายการ
            </Button>
            <Button
              startIcon={<RefreshIcon />}
              onClick={loadRows}
              variant="outlined"
              sx={{
                borderColor: '#b8c5bf',
                color: UI.text,
                borderRadius: 2,
                boxShadow: UI.softShadow,
                '&:hover': { borderColor: UI.accent, bgcolor: alpha(UI.accent, 0.06) },
              }}
            >
              รีเฟรช
            </Button>
          </Box>
        ) : null}
      </Box>

      {activeTab === 'openings' ? (
        <Box sx={{ ...panelSx, p: { xs: 1.25, md: 1.5 } }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1, mb: 1.25 }}>
            <Typography sx={{ fontSize: 13, color: UI.muted, fontWeight: 700 }}>รายการเปิดโรงเรือน</Typography>
          </Box>

          {error ? <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert> : null}

          <Box
            sx={{
              display: 'grid',
              gap: 1.5,
              gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '1.4fr 1.2fr 1.2fr minmax(300px,1.2fr) auto' },
              alignItems: 'center',
              mb: 1.25,
            }}
          >
            <TextField
              size="small"
              placeholder="ค้นหาเลขที่เอกสาร"
              value={filters.searchTerm}
              onChange={(event) => setFilters((prev) => ({ ...prev, searchTerm: event.target.value }))}
              sx={{ '& .MuiOutlinedInput-root': { height: 40, borderRadius: 2, bgcolor: UI.panelSoft, boxShadow: UI.softShadow } }}
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
                  sx={{ '& .MuiOutlinedInput-root': { height: 40, borderRadius: 2, bgcolor: UI.panelSoft, boxShadow: UI.softShadow } }}
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
                  const selected = filteredHouseOptions.find((item) => item.id === Number(value));
                  return selected ? `${selected.houseCode} - ${selected.houseName}` : 'เลือกโรงเรือน';
                },
              }}
              sx={{ '& .MuiOutlinedInput-root': { height: 40, borderRadius: 2, bgcolor: UI.panelSoft, boxShadow: UI.softShadow } }}
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
                sx={{ flex: 1, '& .MuiOutlinedInput-root': { height: 40, borderRadius: 2, bgcolor: UI.panelSoft, boxShadow: UI.softShadow } }}
              />
              <Typography variant="body2" color="text.secondary" sx={{ minWidth: 20, textAlign: 'center' }}>
                ถึง
              </Typography>
              <TextField
                size="small"
                type="date"
                value={filters.requestDateTo || ''}
                onChange={(event) => setFilters((prev) => ({ ...prev, requestDateTo: event.target.value }))}
                sx={{ flex: 1, '& .MuiOutlinedInput-root': { height: 40, borderRadius: 2, bgcolor: UI.panelSoft, boxShadow: UI.softShadow } }}
              />
            </Box>
            <Button
              variant="contained"
              startIcon={<SearchIcon />}
              onClick={() => setAppliedFilters(filters)}
              sx={{ minWidth: { xs: '100%', md: 120 }, height: 40, borderRadius: 2, bgcolor: UI.accent, boxShadow: UI.softShadow, '&:hover': { bgcolor: '#10473f' } }}
            >
              ค้นหา
            </Button>
          </Box>

          <BuildingOpeningList
            data={filteredRows}
            loading={loading}
            onView={openDetails}
            emptyMessage="ยังไม่มีรายการเปิดโรงเรือน"
          />
        </Box>
      ) : (
        <BuildingOpeningApprovalPage mode="approval" compact />
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
