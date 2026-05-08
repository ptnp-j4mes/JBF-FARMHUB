'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Alert,
  Box,
  Button,
  Chip,
  Grid,
  LinearProgress,
  Paper,
  Stack,
  Tab,
  Tabs,
  Typography,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import Swal from 'sweetalert2';
import { feedingService } from './services/feeding.service';
import { masterApi } from '@/features/admin/master/services/master.api';
import type {
  FeedProgramDto,
  FeedingFiScheduleRowResponse,
  FeedingOptionFacility,
  FeedingOptionHouse,
  FeedingOptionItem,
  FeedingPlanLineResponse,
  FeedingPlanSummaryResponse,
} from './types';
import {
  getCurrentFacilityId,
} from '@/lib/facility-context';
import {
  UI,
  softPanelSx,
  TABS,
} from './constants';
import { todayIso, toKgQty, toDisplayQty, normalizeFeedCodeForMatch } from './utils';

// Components
import FeedingHeader from './FeedingHeader';
import FeedingFilterBar from './FeedingFilterBar';
import SummaryCards from './components/SummaryCards';
import TodayBoardTab from './tabs/TodayBoardTab';
import PlanBuilderTab from './tabs/PlanBuilderTab';
import ExecutionTab from './tabs/ExecutionTab';
import ReportsTab from './tabs/ReportsTab';
import CreatePlanDialog from './dialogs/CreatePlanDialog';

type FarmDashboardHouseCard = {
  buildingOpeningId: number;
  documentNumber: string;
  houseCode: string;
  houseName: string;
  batchNo: string;
  status: string;
  currentHeadCount: number;
  capacityHeadCount: number;
  receivedDate?: string | null;
};

type FarmInformationDashboardResponse = {
  hasFarmAccess: boolean;
  accessMessage: string;
  selectedFacilityId?: number | null;
  houses: FarmDashboardHouseCard[];
};

const emptySummary: FeedingPlanSummaryResponse = {
  date: todayIso(),
  totalPlannedKg: 0,
  totalActualKg: 0,
  completionRatePct: 0,
  costPerKg: 0,
  efficiencyPct: 0,
  fcrMtd: null,
  completedCount: 0,
  totalCount: 0,
  farmFcr: [],
};

export default function FeedingPlanningPage() {
  const router = useRouter();
  const [date, setDate] = useState(todayIso());
  const [facilityId, setFacilityId] = useState<number | ''>('');
  const [facilities, setFacilities] = useState<FeedingOptionFacility[]>([]);
  const [houses, setHouses] = useState<FeedingOptionHouse[]>([]);
  const [openHouses, setOpenHouses] = useState<FeedingOptionHouse[]>([]);
  const [feedItems, setFeedItems] = useState<FeedingOptionItem[]>([]);
  const [feedPrograms, setFeedPrograms] = useState<FeedProgramDto[]>([]);
  const [summary, setSummary] = useState<FeedingPlanSummaryResponse>(emptySummary);
  const [rows, setRows] = useState<FeedingPlanLineResponse[]>([]);
  const [fiScheduleRows, setFiScheduleRows] = useState<FeedingFiScheduleRowResponse[]>([]);
  const [dashboardHouses, setDashboardHouses] = useState<FarmDashboardHouseCard[]>([]);
  const [dashboardHasFarmAccess, setDashboardHasFarmAccess] = useState(true);
  const [dashboardAccessMessage, setDashboardAccessMessage] = useState('');
  const [optionsLoaded, setOptionsLoaded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fiScheduleHouseId, setFiScheduleHouseId] = useState<number | ''>('');
  const [roleMode, setRoleMode] = useState<'manager' | 'worker'>('manager');
  const [activeView, setActiveView] = useState<'today' | 'plan' | 'execution' | 'reports'>('today');
  const [openCreate, setOpenCreate] = useState(false);

  // ── Derived Data ──
  const housesByFacility = useMemo(() => {
    const grouped: Record<number, FeedingOptionHouse[]> = {};
    for (const house of houses) {
      if (!grouped[house.facilityId]) grouped[house.facilityId] = [];
      grouped[house.facilityId].push(house);
    }
    return grouped;
  }, [houses]);

  const selectedFacilityHouseOptions = useMemo(() => {
    if (typeof facilityId !== 'number') {
      return [];
    }

    const openHouseOptions = openHouses.filter((house) => house.facilityId === facilityId);
    if (openHouseOptions.length > 0) {
      return openHouseOptions;
    }

    return housesByFacility[facilityId] ?? [];
  }, [facilityId, housesByFacility, openHouses]);

  const selectedFacilityHouseCodes = useMemo(
    () => new Set(
      selectedFacilityHouseOptions
        .map((house) => house.houseCode.trim().toUpperCase())
        .filter(Boolean),
    ),
    [selectedFacilityHouseOptions],
  );

  const dashboardHouseCodes = useMemo(() => {
    return new Set(
      dashboardHouses
        .map((house) => house.houseCode.trim().toUpperCase())
        .filter(Boolean),
    );
  }, [dashboardHouses]);

  const visibleHouseCodes = useMemo(() => {
    if (!dashboardHasFarmAccess) {
      return new Set<string>();
    }

    if (selectedFacilityHouseCodes.size > 0) {
      return selectedFacilityHouseCodes;
    }

    return dashboardHouseCodes;
  }, [dashboardHasFarmAccess, dashboardHouseCodes, selectedFacilityHouseCodes]);

  const visibleFiScheduleRows = useMemo(
    () => fiScheduleRows.filter((row) => visibleHouseCodes.has(row.houseCode.trim().toUpperCase())),
    [fiScheduleRows, visibleHouseCodes],
  );

  const selectedFilterFacilityHouses = typeof facilityId === 'number'
    ? selectedFacilityHouseOptions.filter((house) => visibleHouseCodes.has(house.houseCode.trim().toUpperCase()))
    : [];
  const displayedFiScheduleRows = typeof fiScheduleHouseId === 'number'
    ? visibleFiScheduleRows.filter((row) => row.houseId === fiScheduleHouseId)
    : visibleFiScheduleRows;
  const selectedFacility = facilities.find((facility) => facility.id === facilityId) ?? null;
  const activeViewMeta = TABS.find((tab) => tab.id === activeView) ?? TABS[0];
  const activeViewLabel = activeViewMeta?.label ?? 'Today Board';
  const facilityLabel = selectedFacility ? selectedFacility.name : 'ทุกฟาร์ม';
  const dateLabel = new Intl.DateTimeFormat('th-TH', { dateStyle: 'full' }).format(new Date(`${date}T00:00:00`));
  const roleLabel = roleMode === 'manager' ? 'Manager mode' : 'Worker mode';
  const houseVisibilityNotice = useMemo(() => {
    if (loading) {
      return null;
    }

    if (!dashboardHasFarmAccess) {
      return {
        severity: 'warning' as const,
        message: dashboardAccessMessage || 'คุณไม่มีสิทธิ์เข้าถึงฟาร์มที่เลือก',
      };
    }

    if (selectedFacilityHouseOptions.length > 0 || openHouses.length > 0 || dashboardHouseCodes.size > 0) {
      return null;
    }

    return {
      severity: 'warning' as const,
      message: dashboardAccessMessage || 'ไม่พบโรงเรือนสำหรับฟาร์มที่เลือก',
    };
  }, [
    dashboardAccessMessage,
    dashboardHasFarmAccess,
    dashboardHouseCodes.size,
    loading,
    openHouses.length,
    selectedFacilityHouseOptions.length,
  ]);

  const resolveFeedDisplayMeta = useCallback((itemId?: number | null) => {
    if (!itemId || itemId <= 0) return null;
    return feedItems.find((item) => item.id === itemId) ?? null;
  }, [feedItems]);

  // ── House Today Board ──
  const houseTodayBoard = useMemo(() => {
    const board = new Map<number, {
      houseId: number;
      houseCode: string;
      houseName: string;
      fiDay: number | null;
      stockHead: number;
      feedCodes: Set<string>;
      targetFeedKg: number;
      roundCount: number;
      plannedKg: number;
      actualKg: number;
      status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';
    }>();

    const dashboardHouseByCode = new Map(
      dashboardHouses.map((house) => [house.houseCode.trim().toUpperCase(), house] as const),
    );

    for (const house of selectedFilterFacilityHouses) {
      const codeKey = house.houseCode.trim().toUpperCase();
      const dashboardHouse = dashboardHouseByCode.get(codeKey);
      board.set(house.id, {
        houseId: house.id,
        houseCode: house.houseCode,
        houseName: house.houseName,
        fiDay: null,
        stockHead: dashboardHouse?.currentHeadCount ?? 0,
        feedCodes: new Set(),
        targetFeedKg: 0,
        roundCount: 0,
        plannedKg: 0,
        actualKg: 0,
        status: 'PENDING',
      });

      const mappedRows = visibleFiScheduleRows.filter((row) => row.houseId === house.id || row.houseCode.trim().toUpperCase() === codeKey);
      for (const fiRow of mappedRows) {
        const found = board.get(house.id);
        if (!found) continue;
        found.fiDay = fiRow.targetDay ?? found.fiDay;
        found.stockHead = fiRow.stockHead > 0 ? fiRow.stockHead : found.stockHead;
        if (fiRow.feedCode) found.feedCodes.add(fiRow.feedCode);
        found.targetFeedKg += fiRow.plannedKg ?? fiRow.targetFeedKg;
        found.roundCount += fiRow.roundCount;
      }
    }

    for (const line of rows) {
      if (!line.houseId) continue;
      const found = board.get(line.houseId);
      if (!found) continue;
      found.plannedKg += line.plannedQtyKg;
      found.actualKg += line.actualQtyKg ?? 0;
      if (line.status !== 'COMPLETED') {
        found.status = line.status === 'IN_PROGRESS' ? 'IN_PROGRESS' : 'PENDING';
      } else if (found.status !== 'PENDING') {
        found.status = 'COMPLETED';
      }
    }

    return [...board.values()].sort((a, b) => a.houseCode.localeCompare(b.houseCode));
  }, [dashboardHouses, rows, selectedFilterFacilityHouses, visibleFiScheduleRows]);

  // ── Cart Rounds ──
  const cartRoundsTotal = visibleFiScheduleRows.reduce((sum, row) => sum + row.roundCount, 0);
  const resolveCartDetailForPlanLine = useCallback((line: FeedingPlanLineResponse) => {
    const byHouseAndItem = visibleFiScheduleRows.find((scheduleRow) =>
      scheduleRow.houseId === (line.houseId ?? -1) && scheduleRow.feedItemId === line.feedItemId);
    if (byHouseAndItem) return byHouseAndItem;

    const normalizedFeedCode = normalizeFeedCodeForMatch(line.feedItemCode);
    const byHouseAndCode = visibleFiScheduleRows.find((scheduleRow) =>
      scheduleRow.houseId === (line.houseId ?? -1) && scheduleRow.feedCode === normalizedFeedCode);
    if (byHouseAndCode) return byHouseAndCode;

    return null;
  }, [visibleFiScheduleRows]);

  const cartRoundsDone = rows
    .filter((line) => line.status === 'COMPLETED')
    .reduce((sum, line) => sum + (resolveCartDetailForPlanLine(line)?.roundCount ?? 0), 0);
  const cartRoundsRemaining = Math.max(0, cartRoundsTotal - cartRoundsDone);
  const activeFeedProgram = useMemo(
    () => feedPrograms.find((program) => program.isActive) ?? feedPrograms[0] ?? null,
    [feedPrograms],
  );

  // ── Data Loading ──
  const load = useCallback(async () => {
    setLoading(true);
    try {
      const resolvedFacilityId = typeof facilityId === 'number' ? facilityId : undefined;
      const [summaryResp, rowsResp, fiScheduleResp, dashboardResp, openHousesResp, feedProgramsResp] = await Promise.all([
        feedingService.getSummary(date, resolvedFacilityId),
        feedingService.getPlanLines(date, resolvedFacilityId),
        resolvedFacilityId
          ? feedingService.getFiSchedule(date, resolvedFacilityId)
          : Promise.resolve([]),
        masterApi.getFarmInformationDashboard(resolvedFacilityId),
        resolvedFacilityId
          ? feedingService.getOpenHouses(resolvedFacilityId)
          : Promise.resolve([]),
        masterApi.getFeedPrograms(true).catch(() => []),
      ]);
      setSummary(summaryResp);
      setRows(rowsResp);
      setFiScheduleRows(fiScheduleResp);
      setDashboardHouses(dashboardResp.houses ?? []);
      setDashboardHasFarmAccess(dashboardResp.hasFarmAccess !== false);
      setDashboardAccessMessage(dashboardResp.accessMessage ?? '');
      setOpenHouses(Array.isArray(openHousesResp) ? openHousesResp : []);
      setFeedPrograms(Array.isArray(feedProgramsResp) ? feedProgramsResp : []);
    } catch (error) {
      console.error(error);
      Swal.fire({ icon: 'error', title: 'โหลดข้อมูลไม่สำเร็จ', text: 'ไม่สามารถดึงข้อมูลแผนการให้อาหารได้' });
    } finally {
      setLoading(false);
    }
  }, [date, facilityId]);

  const loadOptions = useCallback(async () => {
    try {
      const options = await feedingService.getOptions();
      setFacilities(options.facilities);
      setHouses(options.houses);
      setFeedItems(options.feedItems);
      const currentFacilityId = getCurrentFacilityId();
      if (currentFacilityId) {
        setFacilityId(currentFacilityId);
      } else if (options.facilities.length > 0) {
        setFacilityId(options.facilities[0].id);
      }
    } catch (error) {
      console.error(error);
      Swal.fire({ icon: 'error', title: 'โหลดตัวเลือกไม่สำเร็จ', text: 'ไม่สามารถโหลดฟาร์ม/โรงเรือน/รายการอาหารได้' });
    } finally {
      setOptionsLoaded(true);
    }
  }, []);

  useEffect(() => { void loadOptions(); }, [loadOptions]);
  useEffect(() => { void load(); }, [load]);

  // ── Complete Line Action ──
  const completeLine = useCallback(async (line: FeedingPlanLineResponse) => {
    const lineMeta = resolveFeedDisplayMeta(line.feedItemId) ?? line;
    const result = await Swal.fire({
      icon: 'question',
      title: 'ยืนยันปิดงานการให้อาหาร',
      text: `${line.houseCode} - ${line.feedItemName}`,
      input: 'number',
      inputLabel: `ปริมาณจริง (${lineMeta.isBagDisplay ? lineMeta.displayUomName || 'กระสอบ' : 'กก.'})`,
      inputValue: lineMeta.isBagDisplay
        ? (line.actualDisplayQty ?? toDisplayQty(line.actualQtyKg ?? line.plannedQtyKg, lineMeta))
        : (line.actualQtyKg ?? line.plannedQtyKg),
      showCancelButton: true,
      confirmButtonText: 'บันทึกเสร็จสิ้น',
      cancelButtonText: 'ยกเลิก',
    });

    if (!result.isConfirmed) return;

    const actualInput = Number(result.value);
    if (!Number.isFinite(actualInput) || actualInput < 0) {
      await Swal.fire({ icon: 'warning', title: 'ค่าปริมาณไม่ถูกต้อง' });
      return;
    }
    const actualQty = toKgQty(actualInput, lineMeta);

    try {
      await feedingService.completePlanLine(line.id, {
        actualQtyKg: actualQty,
        actualDisplayQty: lineMeta.isBagDisplay ? actualInput : undefined,
      });
      await load();
      await Swal.fire({ icon: 'success', title: 'บันทึกเสร็จสิ้นแล้ว', timer: 1200, showConfirmButton: false });
    } catch (error) {
      console.error(error);
      await Swal.fire({ icon: 'error', title: 'อัปเดตสถานะไม่สำเร็จ' });
    }
  }, [load, resolveFeedDisplayMeta]);

  const handleFacilityChange = useCallback((newFacilityId: number) => {
    setOpenHouses([]);
    setFacilityId(newFacilityId);
    setFiScheduleHouseId('');
  }, []);

  // ── Render ──
  return (
    <Box
      sx={{
        position: 'relative',
        maxWidth: 1440,
        mx: 'auto',
        p: { xs: 1.2, md: 2 },
        bgcolor: UI.bg,
        minHeight: '100%',
        overflow: 'hidden',
        '&::before': {
          content: '""',
          position: 'absolute',
          inset: '-8% auto auto -8%',
          width: 280,
          height: 280,
          borderRadius: 10,
          bgcolor: 'rgba(166, 199, 187, 0.18)',
          filter: 'blur(24px)',
          pointerEvents: 'none',
        },
        '&::after': {
          content: '""',
          position: 'absolute',
          inset: '12% -10% auto auto',
          width: 320,
          height: 320,
          borderRadius: 10,
          bgcolor: 'rgba(221, 233, 226, 0.42)',
          filter: 'blur(22px)',
          pointerEvents: 'none',
        },
      }}
    >
      <Box sx={{ position: 'relative', zIndex: 1 }}>
        <FeedingHeader
          activeViewLabel={activeViewLabel}
          dateLabel={dateLabel}
          facilityLabel={facilityLabel}
          roleLabel={roleLabel}
          summary={summary}
        />

        {activeFeedProgram && (
          <Paper
            variant="outlined"
            sx={{
              mb: 2,
              p: { xs: 1.5, md: 2 },
              borderRadius: 10,
              borderColor: UI.border,
              bgcolor: alpha('#fff', 0.94),
              boxShadow: UI.shadowSoft,
            }}
          >
            <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5} justifyContent="space-between" alignItems={{ xs: 'stretch', md: 'center' }}>
              <Box>
                <Typography sx={{ fontSize: '0.78rem', fontWeight: 800, color: UI.muted, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                  โปรแกรมให้อาหารหลัก
                </Typography>
                <Typography sx={{ fontSize: { xs: '1.02rem', md: '1.18rem' }, fontWeight: 900, color: UI.text, mt: 0.3 }}>
                  {activeFeedProgram.programName}
                </Typography>
                <Typography sx={{ color: UI.muted, fontSize: '0.9rem', mt: 0.25 }}>
                  {activeFeedProgram.programCode} • {activeFeedProgram.totalDays} วัน • {activeFeedProgram.days.length} ช่วง
                </Typography>
              </Box>
              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap justifyContent={{ xs: 'flex-start', md: 'flex-end' }}>
                <Chip size="small" label={`รวม ${activeFeedProgram.totalKgPerHead.toFixed(0)} กก./ตัว`} sx={{ fontWeight: 700 }} />
                <Chip size="small" label={`FCR ${activeFeedProgram.fcr.toFixed(2)}`} sx={{ fontWeight: 700 }} />
                <Chip size="small" label={`ADG ${activeFeedProgram.adgGramsPerDay.toFixed(0)}`} sx={{ fontWeight: 700 }} />
                <StockActionButton
                  tone="info"
                  size="small"
                  onClick={() => router.push('/admin/master-data/feeding/feed-programs')}
                >
                  จัดการโปรแกรม
                </StockActionButton>
              </Stack>
            </Stack>

            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mt: 1.5 }}>
              {activeFeedProgram.days.map((day) => (
                <Chip
                  key={`${day.id}-${day.feedCode}`}
                  size="small"
                  label={`${day.feedCode} วัน ${day.dayFrom}-${day.dayTo}`}
                  sx={{
                    fontWeight: 700,
                    bgcolor: alpha(UI.accentSurface, 0.74),
                    color: UI.accent,
                  }}
                />
              ))}
            </Stack>
          </Paper>
        )}

        <FeedingFilterBar
          roleMode={roleMode}
          onRoleModeChange={setRoleMode}
          date={date}
          onDateChange={setDate}
          facilityId={facilityId}
          onFacilityChange={handleFacilityChange}
          facilities={facilities}
          showAddButton={roleMode === 'manager'}
          onOpenCreate={() => setOpenCreate(true)}
        />

        {houseVisibilityNotice && (
          <Alert
            severity={houseVisibilityNotice.severity}
            sx={{ mb: 2, borderRadius: 10, border: `1px solid ${UI.border}` }}
          >
            {houseVisibilityNotice.message}
          </Alert>
        )}

        {/* Tab Navigation */}
        <Box sx={{ ...softPanelSx, mb: 2, p: { xs: 1, md: 1.15 }, backdropFilter: 'blur(10px)' }}>
          <Tabs
            value={activeView}
            onChange={(_, value) => setActiveView(value)}
            variant="scrollable"
            scrollButtons="auto"
            allowScrollButtonsMobile
            sx={{
              minHeight: 0,
              '& .MuiTabs-indicator': { display: 'none' },
              '& .MuiTabs-flexContainer': { gap: 1 },
              '& .MuiTab-root': {
                minHeight: 48,
                textTransform: 'none',
                fontSize: '0.92rem',
                fontWeight: 800,
                borderRadius: 10,
                border: `1px solid ${UI.border}`,
                bgcolor: alpha('#fff', 0.96),
                color: UI.muted,
                px: 1.8,
                py: 0.9,
                letterSpacing: '-0.01em',
                transition: 'transform 280ms cubic-bezier(0.4, 0, 0.2, 1), box-shadow 280ms cubic-bezier(0.4, 0, 0.2, 1), border-color 280ms ease, color 280ms ease, background 280ms ease',
                boxShadow: UI.shadowSoft,
                '&:hover': {
                  transform: 'translateY(-2px)',
                  borderColor: UI.borderStrong,
                  boxShadow: UI.shadowLift,
                  background: `linear-gradient(180deg, ${alpha(UI.accentSurface, 0.4)} 0%, ${alpha('#fff', 0.98)} 100%)`,
                },
                '&.Mui-selected': {
                  background: `linear-gradient(180deg, ${alpha(UI.accentSurface, 0.95)} 0%, ${alpha('#fff', 0.96)} 100%)`,
                  color: UI.accent,
                  borderColor: alpha(UI.accent, 0.18),
                  boxShadow: UI.shadowLift,
                },
              },
            }}
          >
            {TABS.map((tab) => (
              <Tab
                key={tab.id}
                value={tab.id}
                icon={tab.icon}
                iconPosition="start"
                label={tab.label}
              />
            ))}
          </Tabs>
        </Box>

        {loading && <LinearProgress sx={{ mb: 2, borderRadius: 10}} />}

        <SummaryCards summary={summary} />

        {/* Tab Content */}
        {activeView === 'today' && (
          <Stack spacing={2}>
            <TodayBoardTab
              houseTodayBoard={houseTodayBoard}
              cartRoundsTotal={cartRoundsTotal}
              cartRoundsRemaining={cartRoundsRemaining}
              onViewExecution={() => setActiveView('execution')}
            />
            <PlanBuilderTab
              displayedFiScheduleRows={displayedFiScheduleRows}
              fiScheduleHouseId={fiScheduleHouseId}
              onFiScheduleHouseChange={setFiScheduleHouseId}
              openedFilterFacilityHouses={selectedFilterFacilityHouses}
            />
          </Stack>
        )}

        {activeView === 'plan' && (
          <PlanBuilderTab
            displayedFiScheduleRows={displayedFiScheduleRows}
            fiScheduleHouseId={fiScheduleHouseId}
            onFiScheduleHouseChange={setFiScheduleHouseId}
            openedFilterFacilityHouses={selectedFilterFacilityHouses}
          />
        )}

        {activeView === 'execution' && (
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, lg: 8 }}>
              <ExecutionTab
                rows={rows}
                roleMode={roleMode}
                summary={summary}
                fiScheduleRows={fiScheduleRows}
                onCompleteLine={(line) => void completeLine(line)}
              />
            </Grid>
            {roleMode === 'manager' && (
              <Grid size={{ xs: 12, lg: 4 }}>
                <ReportsTab farmFcr={summary.farmFcr} />
              </Grid>
            )}
          </Grid>
        )}

        {activeView === 'reports' && roleMode === 'manager' && (
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, lg: 8 }}>
              <ExecutionTab
                rows={rows}
                roleMode={roleMode}
                summary={summary}
                fiScheduleRows={fiScheduleRows}
                onCompleteLine={(line) => void completeLine(line)}
              />
            </Grid>
            <Grid size={{ xs: 12, lg: 4 }}>
              <ReportsTab farmFcr={summary.farmFcr} />
            </Grid>
          </Grid>
        )}

        {/* Create Dialog */}
        <CreatePlanDialog
          open={openCreate}
          onClose={() => setOpenCreate(false)}
          onSuccess={() => void load()}
          date={date}
          facilities={facilities}
          selectedFacilityId={facilityId}
          fiScheduleRows={fiScheduleRows}
        />
      </Box>
    </Box>
  );
}
