'use client';

import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import {
  CalendarMonth,
  DeleteOutline,
  EditOutlined,
  LocalShippingOutlined,
  MedicationOutlined,
  ReportProblemOutlined,
  Search,
  Today,
  WarningAmberOutlined,
} from '@mui/icons-material';
import {
  Alert,
  Box,
  Card,
  CardContent,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  InputAdornment,
  InputLabel,
  LinearProgress,
  MenuItem,
  Paper,
  Select,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { alpha, useTheme, type Theme } from '@mui/material/styles';
import { StockActionButton } from '@/features/production/stock/components/StockActionButton';
import Swal from 'sweetalert2';
import { ContentCard } from '@/components/common';
import { authService } from '@/features/auth/services/auth.service';
import { FACILITY_CHANGED_EVENT, getCurrentFacilityCode } from '@/lib/facility-context';
import { vaccinationPlanService } from './services/vaccination-plan.service';
import type {
  VaccinationBatchAllocation,
  VaccinationExecutionContext,
  VaccinationHouseOption,
  TimelineUrgency,
  VaccinationPlanDialogState,
  VaccinationPlannerOptions,
  VaccinationTask,
  VaccinationTimelineDay,
  VaccinationVaccineOption,
} from './types';

type PlanDialogMode = 'new' | 'reschedule';

const DEFAULT_PLANNER_OPTIONS: VaccinationPlannerOptions = {
  farms: [],
  groups: [],
  houses: [],
  vaccines: [],
};

const THAI_SHORT_MONTHS = [
  'ม.ค.',
  'ก.พ.',
  'มี.ค.',
  'เม.ย.',
  'พ.ค.',
  'มิ.ย.',
  'ก.ค.',
  'ส.ค.',
  'ก.ย.',
  'ต.ค.',
  'พ.ย.',
  'ธ.ค.',
];

function getCurrentIsoMonth(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  return `${year}-${month.toString().padStart(2, '0')}`;
}

function urgencyMeta(theme: Theme, urgency: TimelineUrgency): {
  nodeColor: string;
  textColor: string;
  chipBg: string;
  icon: ReactNode;
} {
  if (urgency === 'overdue') {
    return {
      nodeColor: theme.palette.error.main,
      textColor: theme.palette.error.dark,
      chipBg: theme.palette.error.main,
      icon: <ReportProblemOutlined sx={{ fontSize: 16, color: theme.palette.common.white }} />,
    };
  }
  if (urgency === 'today') {
    return {
      nodeColor: theme.palette.warning.main,
      textColor: theme.palette.warning.dark,
      chipBg: theme.palette.warning.main,
      icon: <Today sx={{ fontSize: 16, color: theme.palette.common.white }} />,
    };
  }
  if (urgency === 'tomorrow') {
    return {
      nodeColor: theme.palette.info.main,
      textColor: theme.palette.info.dark,
      chipBg: theme.palette.info.main,
      icon: <CalendarMonth sx={{ fontSize: 16, color: theme.palette.common.white }} />,
    };
  }
  return {
    nodeColor: theme.palette.grey[500],
    textColor: theme.palette.text.secondary,
    chipBg: theme.palette.grey[500],
    icon: <CalendarMonth sx={{ fontSize: 16, color: theme.palette.common.white }} />,
  };
}

function buildEmptyDraft(defaultDate: string): VaccinationPlanDialogState {
  return {
    farmCode: '',
    groupId: '',
    houseCode: '',
    vaccineItemId: '',
    targetHeadcount: '',
    plannedQty: '',
    batchAllocations: [],
    plannedDate: defaultDate,
    reason: '',
    note: '',
  };
}

function normalizePotentialBuddhistYear(year: number): number {
  if (!Number.isFinite(year)) {
    return year;
  }

  let normalizedYear = Math.trunc(year);
  let guard = 0;
  while (normalizedYear >= 2400 && guard < 8) {
    normalizedYear -= 543;
    guard += 1;
  }

  return normalizedYear;
}

function normalizeIsoDate(isoDate: string): string {
  const raw = isoDate.trim();
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(raw);
  if (!match) {
    return raw;
  }

  const year = normalizePotentialBuddhistYear(Number(match[1]));
  const month = Number(match[2]);
  const day = Number(match[3]);
  if (!Number.isFinite(year) || !Number.isFinite(month) || !Number.isFinite(day)) {
    return raw;
  }

  if (month < 1 || month > 12 || day < 1 || day > 31) {
    return raw;
  }

  return `${year.toString().padStart(4, '0')}-${match[2]}-${match[3]}`;
}

function resolveUrgency(isoDate: string): TimelineUrgency {
  const normalizedIsoDate = normalizeIsoDate(isoDate);
  const today = new Date();
  const todayIso = today.toISOString().slice(0, 10);
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  const tomorrowIso = tomorrow.toISOString().slice(0, 10);

  if (normalizedIsoDate < todayIso) return 'overdue';
  if (normalizedIsoDate === todayIso) return 'today';
  if (normalizedIsoDate === tomorrowIso) return 'tomorrow';
  return 'future';
}

function resolveUrgencyLabel(urgency: TimelineUrgency): string {
  if (urgency === 'overdue') return 'เลยกำหนด (Overdue)';
  if (urgency === 'today') return 'วันนี้ (Today)';
  if (urgency === 'tomorrow') return 'พรุ่งนี้ (Tomorrow)';
  return 'แผนล่วงหน้า (Upcoming)';
}

function resolveTaskProgressMeta(
  theme: Theme,
  status: VaccinationTask['status'],
): { label: string; chipSx: Record<string, unknown> } {
  if (status === 'completed') {
    return {
      label: 'บันทึกผลจริงแล้ว',
      chipSx: {
        bgcolor: alpha(theme.palette.success.main, 0.14),
        color: 'success.dark',
        border: `1px solid ${alpha(theme.palette.success.main, 0.28)}`,
      },
    };
  }

  if (status === 'in-progress') {
    return {
      label: 'เชื่อม Daily แล้ว',
      chipSx: {
        bgcolor: alpha(theme.palette.warning.main, 0.2),
        color: 'warning.dark',
        border: `1px solid ${alpha(theme.palette.warning.main, 0.35)}`,
      },
    };
  }

  if (status === 'pending') {
    return {
      label: 'รอยืนยันหน้างาน',
      chipSx: {
        bgcolor: alpha(theme.palette.info.main, 0.16),
        color: 'info.dark',
        border: `1px solid ${alpha(theme.palette.info.main, 0.28)}`,
      },
    };
  }

  return {
    label: 'รอบันทึกผลจริง',
    chipSx: {
      bgcolor: alpha(theme.palette.grey[700], 0.1),
      color: 'text.secondary',
      border: `1px solid ${alpha(theme.palette.grey[700], 0.2)}`,
    },
  };
}

function resolveWarehouseSummaryMeta(summary?: VaccinationTask['warehouseSummary'] | VaccinationExecutionContext['warehouseSummary'] | null): {
  label: string;
  chipSx: Record<string, unknown>;
} {
  const status = summary?.status ?? 'empty';
  if (status === 'enough') {
    return {
      label: `คลังพอ (${summary?.totalAvailableQuantity ?? 0} โดส)`,
      chipSx: {
        bgcolor: '#FEF3F2',
        color: '#912018',
        border: '1px solid #86efac',
      },
    };
  }

  if (status === 'available') {
    return {
      label: `มีในคลัง (${summary?.totalAvailableQuantity ?? 0} โดส)`,
      chipSx: {
        bgcolor: '#dbeafe',
        color: '#1d4ed8',
        border: '1px solid #93c5fd',
      },
    };
  }

  if (status === 'insufficient') {
    return {
      label: `คลังไม่พอ (ขาด ${summary?.shortageQuantity ?? 0} โดส)`,
      chipSx: {
        bgcolor: '#fef3c7',
        color: '#92400e',
        border: '1px solid #fcd34d',
      },
    };
  }

  return {
    label: 'ไม่พบ stock วัคซีนในคลัง',
    chipSx: {
      bgcolor: '#fee2e2',
      color: '#991b1b',
      border: '1px solid #fca5a5',
    },
  };
}

function buildBatchAllocationKey(allocation: Pick<VaccinationBatchAllocation, 'pigBatchId' | 'buildingOpeningRequestId'>): string {
  return `${allocation.pigBatchId}:${allocation.buildingOpeningRequestId}`;
}

function sumAllocatedHeadcount(allocations?: VaccinationBatchAllocation[]): number {
  return (allocations ?? []).reduce((sum, allocation) => {
    const headcount = Number(allocation.allocatedHeadcount);
    return Number.isFinite(headcount) && headcount > 0 ? sum + headcount : sum;
  }, 0);
}

function mergeBatchAllocations(
  batchOptions: VaccinationBatchAllocation[],
  existingAllocations?: VaccinationBatchAllocation[],
): VaccinationBatchAllocation[] {
  const existingMap = new Map(
    (existingAllocations ?? []).map((allocation) => [buildBatchAllocationKey(allocation), allocation]),
  );

  return batchOptions.map((option) => {
    const existing = existingMap.get(buildBatchAllocationKey(option));
    const nextAllocatedHeadcount = existing
      ? Number(existing.allocatedHeadcount)
      : Number(option.availableQuantity);

    return {
      ...option,
      allocatedHeadcount:
        Number.isFinite(nextAllocatedHeadcount) && nextAllocatedHeadcount >= 0
          ? nextAllocatedHeadcount
          : 0,
      note: existing?.note ?? option.note ?? null,
    };
  });
}

function formatDateLabel(isoDate: string): string {
  const normalizedIsoDate = normalizeIsoDate(isoDate);
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(normalizedIsoDate);
  if (!match) {
    return isoDate;
  }

  const year = Number(match[1]);
  const monthIndex = Number(match[2]) - 1;
  const day = Number(match[3]);
  if (
    !Number.isFinite(year)
    || !Number.isFinite(monthIndex)
    || !Number.isFinite(day)
    || monthIndex < 0
    || monthIndex >= THAI_SHORT_MONTHS.length
  ) {
    return normalizedIsoDate;
  }

  return `${day} ${THAI_SHORT_MONTHS[monthIndex]} ${year + 543}`;
}

function upsertTaskInTimeline(
  timelineRows: VaccinationTimelineDay[],
  nextTask: VaccinationTask,
): VaccinationTimelineDay[] {
  const normalizedTaskDate = normalizeIsoDate(nextTask.plannedDateIso);
  const normalizedTask: VaccinationTask = {
    ...nextTask,
    plannedDateIso: normalizedTaskDate,
  };

  const cleanedRows = timelineRows
    .map((day) => ({
      ...day,
      isoDate: normalizeIsoDate(day.isoDate),
      tasks: day.tasks
        .map((task) => ({ ...task, plannedDateIso: normalizeIsoDate(task.plannedDateIso) }))
        .filter((task) => task.id !== normalizedTask.id),
    }))
    .filter((day) => day.tasks.length > 0);

  const targetDayIndex = cleanedRows.findIndex((day) => day.isoDate === normalizedTaskDate);
  if (targetDayIndex >= 0) {
    const targetDay = cleanedRows[targetDayIndex];
    const nextDays = [...cleanedRows];
    nextDays[targetDayIndex] = {
      ...targetDay,
      dateLabel: formatDateLabel(targetDay.isoDate),
      tasks: [...targetDay.tasks, normalizedTask],
    };
    return nextDays.sort((left, right) => left.isoDate.localeCompare(right.isoDate));
  }

  const urgency = resolveUrgency(normalizedTaskDate);
  const newDay: VaccinationTimelineDay = {
    id: `day-${normalizedTaskDate}`,
    isoDate: normalizedTaskDate,
    dateLabel: formatDateLabel(normalizedTaskDate),
    urgency,
    label: resolveUrgencyLabel(urgency),
    tasks: [normalizedTask],
  };

  return [...cleanedRows, newDay].sort((left, right) => left.isoDate.localeCompare(right.isoDate));
}

function normalizeTimelineRows(rows: VaccinationTimelineDay[]): VaccinationTimelineDay[] {
  return rows
    .map((day) => {
      const normalizedIsoDate = normalizeIsoDate(day.isoDate);
      const urgency = resolveUrgency(normalizedIsoDate);

      return {
        ...day,
        id: `day-${normalizedIsoDate}`,
        isoDate: normalizedIsoDate,
        dateLabel: formatDateLabel(normalizedIsoDate),
        urgency,
        label: resolveUrgencyLabel(urgency),
        tasks: day.tasks.map((task) => ({
          ...task,
          plannedDateIso: normalizeIsoDate(task.plannedDateIso),
        })),
      };
    })
    .sort((left, right) => left.isoDate.localeCompare(right.isoDate));
}

export default function VaccinationPlanPage() {
  const theme = useTheme();
  const [authScopedFarmCode, setAuthScopedFarmCode] = useState(getCurrentFacilityCode() || '');
  const currentIsoMonth = getCurrentIsoMonth();
  const [mounted, setMounted] = useState(false);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [timelineRows, setTimelineRows] = useState<VaccinationTimelineDay[]>([]);
  const [plannerOptions, setPlannerOptions] =
    useState<VaccinationPlannerOptions>(DEFAULT_PLANNER_OPTIONS);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<PlanDialogMode>('new');
  const [selectedTask, setSelectedTask] = useState<VaccinationTask | null>(null);
  const [draft, setDraft] = useState<VaccinationPlanDialogState>(() =>
    buildEmptyDraft(new Date().toISOString().slice(0, 10)),
  );
  const [executionContext, setExecutionContext] = useState<VaccinationExecutionContext | null>(null);
  const [executionLoading, setExecutionLoading] = useState(false);

  useEffect(() => {
    setMounted(true);
    const handleFacilityChange = () => {
      setAuthScopedFarmCode(getCurrentFacilityCode() || '');
    };
    window.addEventListener(FACILITY_CHANGED_EVENT, handleFacilityChange);
    return () => {
      window.removeEventListener(FACILITY_CHANGED_EVENT, handleFacilityChange);
    };
  }, []);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [timeline, options] = await Promise.all([
        vaccinationPlanService.getTimeline(undefined, true),
        vaccinationPlanService.getOptions(),
      ]);
      setTimelineRows(normalizeTimelineRows(timeline));
      setPlannerOptions(options);
    } catch (error) {
      console.error('Failed to load vaccination planner data.', error);
      await Swal.fire({
        icon: 'error',
        title: 'โหลดข้อมูลไม่สำเร็จ',
        text: 'ไม่สามารถดึงข้อมูลแผนฉีดวัคซีนได้ กรุณาลองใหม่อีกครั้ง',
      });
      setTimelineRows([]);
      setPlannerOptions(DEFAULT_PLANNER_OPTIONS);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const canCreatePlan = mounted
    ? authService.hasAnyPermission(['operations_health.add', 'operations_health.manage'])
    : false;
  const canReschedulePlan = mounted
    ? authService.hasAnyPermission(['operations_health.edit', 'operations_health.manage'])
    : false;
  const canDeletePlan = mounted
    ? authService.hasAnyPermission(['operations_health.soft_delete', 'operations_health.manage'])
    : false;

  const filteredTimeline = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return timelineRows
      .map((day) => ({
        ...day,
        tasks: day.tasks.filter((task) => {
          if (authScopedFarmCode && task.farmCode !== authScopedFarmCode) {
            return false;
          }
          if (!normalizedQuery) {
            return true;
          }
          return [
            task.id,
            task.farmName,
            task.farmCode,
            task.phaseName,
            task.houseName,
            task.houseCode,
            task.vaccineName,
          ]
            .join(' ')
            .toLowerCase()
            .includes(normalizedQuery);
        }),
      }))
      .filter((day) => day.tasks.length > 0);
  }, [timelineRows, query, authScopedFarmCode]);

  const allTasks = useMemo(() => timelineRows.flatMap((day) => day.tasks), [timelineRows]);

  const farmOptions = useMemo(() => {
    let options = plannerOptions.farms;
    if (options.length === 0) {
      options = Array.from(
        new Map(
          allTasks.map((task) => [task.farmCode, { code: task.farmCode, name: task.farmName }]),
        ).values(),
      );
    }
    return authScopedFarmCode
      ? options.filter((farm) => farm.code === authScopedFarmCode)
      : options;
  }, [plannerOptions.farms, allTasks, authScopedFarmCode]);

  const groupOptions = useMemo(() => {
    const sourceOptions =
      plannerOptions.groups.length > 0
        ? plannerOptions.groups
        : Array.from(
            new Map(
              allTasks.map((task) => [
                `${task.farmCode}:${task.groupId}`,
                { id: task.groupId, name: task.phaseName, farmCode: task.farmCode },
              ]),
            ).values(),
          );

    return sourceOptions.filter(
      (group) => !draft.farmCode || !group.farmCode || group.farmCode === draft.farmCode,
    );
  }, [plannerOptions.groups, allTasks, draft.farmCode]);

  const houseOptions = useMemo<VaccinationHouseOption[]>(() => {
    const sourceOptions: VaccinationHouseOption[] =
      plannerOptions.houses.length > 0
        ? plannerOptions.houses
        : Array.from(
            new Map(
              allTasks.map((task) => [
                `${task.farmCode}:${task.groupId}:${task.houseCode}`,
                {
                  code: task.houseCode,
                  name: task.houseName,
                  farmCode: task.farmCode,
                  groupId: task.groupId,
                } satisfies VaccinationHouseOption,
              ]),
            ).values(),
          );

    return sourceOptions.filter(
      (house) =>
        (!draft.farmCode || !house.farmCode || house.farmCode === draft.farmCode) &&
        (!draft.groupId || !house.groupId || house.groupId === draft.groupId),
    );
  }, [plannerOptions.houses, allTasks, draft.farmCode, draft.groupId]);

  const vaccineOptions = useMemo<VaccinationVaccineOption[]>(() => {
    if (plannerOptions.vaccines.length > 0) {
      return plannerOptions.vaccines;
    }
    return Array.from(
      new Map(
        allTasks.map((task) => [
          task.vaccineName,
          {
            id: task.vaccineItemId ?? 0,
            code: task.vaccineName.toUpperCase().replace(/[^A-Z0-9]+/g, '_'),
            name: task.vaccineName,
            uomId: null,
            uomName: null,
          } satisfies VaccinationVaccineOption,
        ]),
      ).values(),
    );
  }, [plannerOptions.vaccines, allTasks]);

  const activeDraftBatchAllocations = useMemo(
    () => (draft.batchAllocations ?? []).filter((allocation) => Number(allocation.allocatedHeadcount) > 0),
    [draft.batchAllocations],
  );

  const totalAllocatedHeadcount = useMemo(
    () => sumAllocatedHeadcount(activeDraftBatchAllocations),
    [activeDraftBatchAllocations],
  );
  const hasBatchSelections = activeDraftBatchAllocations.length > 0;

  const selectedVaccine = useMemo(
    () => vaccineOptions.find((item) => Number(item.id) === Number(draft.vaccineItemId)) ?? null,
    [draft.vaccineItemId, vaccineOptions],
  );

  useEffect(() => {
    if (!dialogOpen || dialogMode !== 'new' || !draft.farmCode || !draft.houseCode) {
      setExecutionContext(null);
      setExecutionLoading(false);
      return;
    }

    let active = true;
    setExecutionLoading(true);

    vaccinationPlanService
      .getExecutionContext({
        farmCode: draft.farmCode,
        houseCode: draft.houseCode,
        groupId: draft.groupId.trim() || undefined,
        vaccineItemId:
          Number.isFinite(Number(draft.vaccineItemId)) && Number(draft.vaccineItemId) > 0
            ? Number(draft.vaccineItemId)
            : undefined,
      })
      .then((context) => {
        if (!active) {
          return;
        }

        setExecutionContext(context);
        if (!context) {
          return;
        }

        setDraft((prev) => {
          const nextAllocations = mergeBatchAllocations(context.batchOptions, prev.batchAllocations);
          const nextHeadcount = Math.round(sumAllocatedHeadcount(nextAllocations));
          const previousHeadcount =
            prev.targetHeadcount === '' || !Number.isFinite(Number(prev.targetHeadcount))
              ? null
              : Number(prev.targetHeadcount);
          const shouldSyncPlannedQty =
            prev.plannedQty === ''
            || (previousHeadcount !== null && Number(prev.plannedQty) === previousHeadcount);

          return {
            ...prev,
            batchAllocations: nextAllocations,
            targetHeadcount: nextHeadcount > 0 ? nextHeadcount : '',
            plannedQty:
              nextHeadcount > 0 && shouldSyncPlannedQty
                ? nextHeadcount
                : prev.plannedQty,
          };
        });
      })
      .catch((error) => {
        console.error('Failed to load vaccination execution context.', error);
        if (active) {
          setExecutionContext(null);
        }
      })
      .finally(() => {
        if (active) {
          setExecutionLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [
    dialogMode,
    dialogOpen,
    draft.farmCode,
    draft.groupId,
    draft.houseCode,
    draft.vaccineItemId,
  ]);

  const openNewDialog = () => {
    if (!canCreatePlan) {
      void Swal.fire({
        icon: 'warning',
        title: 'ไม่มีสิทธิ์',
        text: 'คุณไม่มีสิทธิ์เพิ่มแผนฉีดวัคซีน',
      });
      return;
    }
    setDialogMode('new');
    setSelectedTask(null);
    setExecutionContext(null);
    const nextDraft = buildEmptyDraft(`${currentIsoMonth}-01`);
    if (vaccineOptions.length > 0) {
      nextDraft.vaccineItemId = vaccineOptions[0].id;
    }
    if (authScopedFarmCode) {
      nextDraft.farmCode = authScopedFarmCode;
    }
    setDraft(nextDraft);
    setDialogOpen(true);
  };

  const openRescheduleDialog = (task: VaccinationTask) => {
    if (!canReschedulePlan) {
      void Swal.fire({
        icon: 'warning',
        title: 'ไม่มีสิทธิ์',
        text: 'คุณไม่มีสิทธิ์เลื่อนแผนฉีดวัคซีน',
      });
      return;
    }

    setDialogMode('reschedule');
    setSelectedTask(task);
    setExecutionContext(null);
    setDraft({
      farmCode: task.farmCode,
      groupId: task.groupId,
      houseCode: task.houseCode,
      vaccineItemId: task.vaccineItemId ?? vaccineOptions[0]?.id ?? '',
      targetHeadcount: Number.isFinite(task.headcount) ? task.headcount : '',
      plannedQty: Number.isFinite(task.dosesRequired) ? task.dosesRequired : '',
      batchAllocations: task.batchAllocations ?? [],
      plannedDate: task.plannedDateIso,
      reason: '',
      note: '',
    });
    setDialogOpen(true);
  };

  const handleSaveDialog = async () => {
    const plannedBatchAllocations = activeDraftBatchAllocations.map((allocation) => ({
      pigBatchId: allocation.pigBatchId,
      buildingOpeningRequestId: allocation.buildingOpeningRequestId,
      headcount: Number(allocation.allocatedHeadcount),
    }));

    if (!Number.isFinite(Number(draft.vaccineItemId)) || Number(draft.vaccineItemId) <= 0 || !draft.plannedDate.trim()) {
      await Swal.fire({
        icon: 'warning',
        title: 'ข้อมูลไม่ครบ',
        text: 'กรุณาระบุวัคซีนและวันที่ฉีด',
      });
      return;
    }

    if (dialogMode === 'new' && (!draft.farmCode || !draft.houseCode)) {
      await Swal.fire({
        icon: 'warning',
        title: 'ข้อมูลไม่ครบ',
        text: 'กรุณาเลือกฟาร์มและโรงเรือน',
      });
      return;
    }

    if (
      dialogMode === 'new'
      && (draft.targetHeadcount === ''
        || draft.plannedQty === ''
        || !Number.isFinite(Number(draft.targetHeadcount))
        || Number(draft.targetHeadcount) < 0
        || !Number.isFinite(Number(draft.plannedQty))
        || Number(draft.plannedQty) < 0)
    ) {
      await Swal.fire({
        icon: 'warning',
        title: 'ข้อมูลไม่ครบ',
        text: 'กรุณาระบุจำนวนสุกรที่วางแผนฉีดและจำนวนวัคซีนที่วางแผนใช้ให้ถูกต้อง',
      });
      return;
    }

    if (dialogMode === 'reschedule' && !draft.reason.trim()) {
      await Swal.fire({
        icon: 'warning',
        title: 'ข้อมูลไม่ครบ',
        text: 'กรุณาระบุเหตุผลการเลื่อน',
      });
      return;
    }

    if (
      dialogMode === 'new'
      && (executionContext?.batchOptions?.length ?? 0) > 0
      && plannedBatchAllocations.length === 0
    ) {
      await Swal.fire({
        icon: 'warning',
        title: 'ยังไม่ได้เลือก batch สุกร',
        text: 'กรุณาระบุจำนวนที่ต้องฉีดอย่างน้อย 1 batch เพื่อให้แผนผูกกับรุ่นสุกรที่ถูกต้อง',
      });
      return;
    }

    setSaving(true);
    try {
      if (dialogMode === 'new') {
        const createdTask = await vaccinationPlanService.createPlan({
          farmCode: draft.farmCode,
          groupId: draft.groupId.trim() || undefined,
          houseCode: draft.houseCode,
          vaccineItemId: Number(draft.vaccineItemId),
          plannedDate: draft.plannedDate,
          targetHeadcount:
            draft.targetHeadcount === '' ? undefined : Number(draft.targetHeadcount),
          plannedQty: draft.plannedQty === '' ? undefined : Number(draft.plannedQty),
          batchAllocations:
            plannedBatchAllocations.length > 0 ? plannedBatchAllocations : undefined,
          note: draft.note.trim() || undefined,
        });

        setTimelineRows((previous) => upsertTaskInTimeline(previous, createdTask));
      } else if (selectedTask) {
        await vaccinationPlanService.reschedulePlan(selectedTask.id, {
          plannedDate: draft.plannedDate,
          reason: draft.reason.trim(),
          note: draft.note.trim() || undefined,
        });

        setTimelineRows((previous) =>
          upsertTaskInTimeline(previous, {
            ...selectedTask,
            plannedDateIso: draft.plannedDate,
            status: 'scheduled',
          }),
        );
      }

      setDialogOpen(false);
      await Swal.fire({
        icon: 'success',
        title: 'บันทึกสำเร็จ',
        timer: 1200,
        showConfirmButton: false,
      });
    } catch (error) {
      console.error('Failed to save vaccination plan.', error);
      const errorMessage =
        typeof (error as { response?: { data?: { message?: string } } })?.response?.data?.message ===
        'string'
          ? (error as { response?: { data?: { message?: string } } }).response!.data!.message!
          : 'ไม่สามารถบันทึกแผนวัคซีนได้ กรุณาลองใหม่อีกครั้ง';
      await Swal.fire({
        icon: 'error',
        title: 'บันทึกไม่สำเร็จ',
        text: errorMessage,
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteTask = async (task: VaccinationTask) => {
    if (!canDeletePlan) {
      await Swal.fire({
        icon: 'warning',
        title: 'ไม่มีสิทธิ์',
        text: 'คุณไม่มีสิทธิ์ลบแผนฉีดวัคซีน',
      });
      return;
    }

    const confirmed = await Swal.fire({
      icon: 'warning',
      title: 'ยืนยันลบแผน',
      text: `ต้องการลบแผน ${task.vaccineName} (${task.houseCode}) ใช่หรือไม่`,
      showCancelButton: true,
      confirmButtonText: 'ลบแผน',
      cancelButtonText: 'ยกเลิก',
      reverseButtons: true,
    });
    if (!confirmed.isConfirmed) {
      return;
    }

    setSaving(true);
    try {
      await vaccinationPlanService.deletePlan(task.id);
      setTimelineRows((previous) =>
        previous
          .map((day) => ({
            ...day,
            tasks: day.tasks.filter((item) => item.id !== task.id),
          }))
          .filter((day) => day.tasks.length > 0),
      );
      await Swal.fire({
        icon: 'success',
        title: 'ลบแผนสำเร็จ',
        timer: 1200,
        showConfirmButton: false,
      });
    } catch (error) {
      const errorMessage =
        typeof (error as { response?: { data?: { message?: string } } })?.response?.data?.message ===
        'string'
          ? (error as { response?: { data?: { message?: string } } }).response!.data!.message!
          : 'ไม่สามารถลบแผนได้ กรุณาลองใหม่อีกครั้ง';
      await Swal.fire({
        icon: 'error',
        title: 'ลบไม่สำเร็จ',
        text: errorMessage,
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Box
      sx={{
        height: 'calc(100dvh - 52px)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        p: { xs: 2, md: 3 },
        bgcolor: 'background.default',
      }}
    >
      <Box
        sx={{
          flex: 1,
          minHeight: 0,
          maxWidth: 1280,
          width: '100%',
          mx: 'auto',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <ContentCard
          borderColor={alpha(theme.palette.divider, 0.45)}
          backgroundColor={theme.palette.background.paper}
          sx={{ overflow: 'hidden' }}
        >
          {loading ? <LinearProgress /> : null}

          <Stack
            spacing={1.5}
            sx={{
              pb: 1.25,
              borderBottom: `1px solid ${alpha(theme.palette.divider, 0.55)}`,
            }}
          >
            <Stack
              direction={{ xs: 'column', md: 'row' }}
              alignItems={{ xs: 'flex-start', md: 'center' }}
              justifyContent="space-between"
              spacing={1.5}
            >
              <Box>
                <Typography variant="h5" sx={{ fontWeight: 800, color: 'text.primary' }}>
                  แผนการฉีดวัคซีนฟาร์ม (Vaccine Timeline)
                </Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  วางแผนฉีดล่วงหน้า ติดตามคิวงาน และเลื่อนกำหนดการได้ทันที
                </Typography>
              </Box>

              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.25}>
                <TextField
                  size="small"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="ค้นหาโรงเรือน, ฟาร์ม, วัคซีน..."
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Search sx={{ color: 'text.secondary', fontSize: 18 }} />
                      </InputAdornment>
                    ),
                  }}
                  sx={{
                    minWidth: { xs: '100%', sm: 260 },
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 10,
                      bgcolor: 'background.paper',
                    },
                  }}
                />
                <StockActionButton
                  tone="success"
                  startIcon={<MedicationOutlined />}
                  onClick={openNewDialog}
                  disabled={!canCreatePlan}
                >
                  สร้างแผนฉีดวัคซีน
                </StockActionButton>
              </Stack>
            </Stack>

            {!canCreatePlan || !canReschedulePlan ? (
              <Box>
                <Chip
                  icon={<WarningAmberOutlined />}
                  label="สิทธิ์ปัจจุบันอาจไม่ครอบคลุมการเพิ่ม/เลื่อนแผนวัคซีนทั้งหมด"
                  sx={{
                    bgcolor: alpha(theme.palette.warning.main, 0.15),
                    color: 'warning.dark',
                    border: `1px solid ${alpha(theme.palette.warning.main, 0.35)}`,
                  }}
                />
              </Box>
            ) : null}

          </Stack>

          <Paper
            variant="outlined"
            sx={{
              flex: 1,
              minHeight: 0,
              borderRadius: 10,
              borderColor: alpha(theme.palette.divider, 0.7),
              bgcolor: 'background.paper',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <Box
              sx={{
                px: { xs: 2, md: 2.5 },
                py: 1.25,
                borderBottom: `1px solid ${alpha(theme.palette.divider, 0.55)}`,
              }}
            >
              <Typography sx={{ fontSize: '13px', fontWeight: 700, color: 'text.primary' }}>
                รายการแผนงาน (Timeline)
              </Typography>
            </Box>

            <Box
              sx={{
                flex: 1,
                minHeight: 0,
                overflowY: 'auto',
                overflowX: 'hidden',
                p: { xs: 1.75, md: 2.25 },
                scrollbarGutter: 'stable',
                scrollbarWidth: 'thin',
                scrollbarColor: `${alpha(theme.palette.text.secondary, 0.6)} ${alpha(theme.palette.divider, 0.38)}`,
                '&::-webkit-scrollbar': { width: 8, height: 8 },
                '&::-webkit-scrollbar-track': {
                  backgroundColor: alpha(theme.palette.divider, 0.38),
                  borderRadius: 10,
                },
                '&::-webkit-scrollbar-thumb': {
                  backgroundColor: alpha(theme.palette.text.secondary, 0.6),
                  borderRadius: 10,
                },
                '&::-webkit-scrollbar-thumb:hover': {
                  backgroundColor: alpha(theme.palette.text.secondary, 0.85),
                },
              }}
            >
              {filteredTimeline.length === 0 ? (
                <Box
                  sx={{
                    border: `1px dashed ${alpha(theme.palette.divider, 0.85)}`,
                    borderRadius: 10,
                    p: 4,
                    textAlign: 'center',
                    color: 'text.secondary',
                  }}
                >
                  <Typography sx={{ fontWeight: 700, mb: 0.5 }}>ไม่พบรายการแผนงาน</Typography>
                  <Typography variant="body2">ลองเปลี่ยนเดือนหรือปรับคำค้นหา</Typography>
                </Box>
              ) : (
                <Box sx={{ position: 'relative', pl: { xs: 2.25, md: 3.5 } }}>
                  <Box
                    sx={{
                      position: 'absolute',
                      left: { xs: 10, md: 16 },
                      top: 8,
                      bottom: 14,
                      borderLeft: `2px solid ${alpha(theme.palette.divider, 0.7)}`,
                    }}
                  />

                  <Stack spacing={3.25}>
                    {filteredTimeline.map((day) => {
                      const meta = urgencyMeta(theme, day.urgency);
                      return (
                        <Box key={day.id} sx={{ position: 'relative' }}>
                          <Box
                            sx={{
                              position: 'absolute',
                              left: { xs: -2, md: -2 },
                              top: 4,
                              width: 24,
                              height: 24,
                              borderRadius: 10,
                              bgcolor: meta.nodeColor,
                              border: `2px solid ${theme.palette.background.paper}`,
                              boxShadow: theme.shadows[3],
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                          >
                            {meta.icon}
                          </Box>

                          <Stack sx={{ pl: { xs: 3.5, md: 4.5 } }} spacing={1.25}>
                            <Stack
                              direction={{ xs: 'column', sm: 'row' }}
                              spacing={1}
                              alignItems={{ xs: 'flex-start', sm: 'center' }}
                            >
                              <Typography
                                sx={{
                                  fontSize: { xs: 26, md: 30 },
                                  fontWeight: 900,
                                  color: meta.textColor,
                                  lineHeight: 1.05,
                                }}
                              >
                                {day.dateLabel}
                              </Typography>
                              <Chip
                                label={day.label}
                                size="small"
                                sx={{
                                  bgcolor: meta.chipBg,
                                  color: theme.palette.common.white,
                                  fontWeight: 700,
                                  borderRadius: 10,
                                }}
                              />
                            </Stack>

                            <Stack spacing={1.25}>
                              {day.tasks.map((task) => {
                                const progressMeta = resolveTaskProgressMeta(theme, task.status);
                                const warehouseMeta = resolveWarehouseSummaryMeta(task.warehouseSummary);

                                return (
                                  <Card
                                    key={task.id}
                                    variant="outlined"
                                    sx={{
                                      borderRadius: 10,
                                      borderColor: alpha(theme.palette.divider, 0.7),
                                      boxShadow: 'none',
                                    }}
                                  >
                                    <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                                      <Stack
                                        direction={{ xs: 'column', lg: 'row' }}
                                        justifyContent="space-between"
                                        spacing={2}
                                      >
                                        <Box sx={{ flex: 1 }}>
                                          <Chip
                                            size="small"
                                            label={`${task.farmName} (${task.farmCode})  >  ${task.phaseName}`}
                                            sx={{
                                              mb: 1,
                                              bgcolor: alpha(theme.palette.action.active, 0.12),
                                              color: 'text.secondary',
                                              fontWeight: 600,
                                            }}
                                          />
                                          <Stack direction="row" spacing={1.25} alignItems="center" mb={0.75} flexWrap="wrap">
                                            <Typography
                                              sx={{
                                                fontSize: { xs: 20, md: 24 },
                                                fontWeight: 900,
                                                color: 'text.primary',
                                                lineHeight: 1.1,
                                              }}
                                            >
                                              {task.houseName}
                                            </Typography>
                                          </Stack>
                                          <Typography sx={{ color: 'text.primary', mb: 1 }}>
                                            จำนวนหมู: <b>{task.headcount}</b> ตัว
                                          </Typography>
                                          <Chip
                                            icon={<MedicationOutlined sx={{ fontSize: 16 }} />}
                                            label={`${task.vaccineName}  |  แผนใช้ ${task.dosesRequired} โดส`}
                                            sx={{
                                              bgcolor: alpha(theme.palette.success.main, 0.14),
                                              color: 'success.dark',
                                              border: `1px solid ${alpha(theme.palette.success.main, 0.3)}`,
                                              fontWeight: 700,
                                            }}
                                          />
                                          <Stack
                                            direction="row"
                                            spacing={1}
                                            useFlexGap
                                            flexWrap="wrap"
                                            sx={{ mt: 1.25 }}
                                          >
                                            {task.documentCode ? (
                                              <Chip
                                                size="small"
                                                label={`แผน ${task.documentCode}`}
                                                sx={{
                                                  bgcolor: alpha(theme.palette.primary.main, 0.1),
                                                  color: 'primary.dark',
                                                  fontWeight: 700,
                                                }}
                                              />
                                            ) : null}
                                            {task.approvalTxnCode ? (
                                              <Chip
                                                size="small"
                                                label={`Txn ${task.approvalTxnCode}`}
                                                sx={{
                                                  bgcolor: alpha(theme.palette.secondary.main, 0.12),
                                                  color: 'secondary.dark',
                                                  fontWeight: 700,
                                                }}
                                              />
                                            ) : null}
                                            <Chip
                                              size="small"
                                              label={progressMeta.label}
                                              sx={{ fontWeight: 700, ...progressMeta.chipSx }}
                                            />
                                            <Chip
                                              size="small"
                                              icon={<LocalShippingOutlined sx={{ fontSize: 14 }} />}
                                              label={warehouseMeta.label}
                                              sx={{
                                                fontWeight: 700,
                                                ...warehouseMeta.chipSx,
                                              }}
                                            />
                                          </Stack>
                                          {task.batchAllocations && task.batchAllocations.length > 0 ? (
                                            <Stack
                                              direction="row"
                                              spacing={0.75}
                                              useFlexGap
                                              flexWrap="wrap"
                                              sx={{ mt: 1.25 }}
                                            >
                                              {task.batchAllocations.slice(0, 4).map((allocation) => (
                                                <Chip
                                                  key={`${task.id}-${allocation.pigBatchId}-${allocation.buildingOpeningRequestId}`}
                                                  size="small"
                                                  label={`${allocation.batchNo} • ${allocation.allocatedHeadcount} ตัว`}
                                                  sx={{
                                                    bgcolor: alpha(theme.palette.info.main, 0.1),
                                                    color: 'info.dark',
                                                    fontWeight: 700,
                                                  }}
                                                />
                                              ))}
                                              {task.batchAllocations.length > 4 ? (
                                                <Chip
                                                  size="small"
                                                  label={`+${task.batchAllocations.length - 4} batch`}
                                                  sx={{
                                                    bgcolor: alpha(theme.palette.grey[700], 0.08),
                                                    color: 'text.secondary',
                                                    fontWeight: 700,
                                                  }}
                                                />
                                              ) : null}
                                            </Stack>
                                          ) : (
                                            <Typography variant="body2" sx={{ mt: 1.25, color: 'warning.dark', fontWeight: 600 }}>
                                              แผนนี้ยังไม่ได้ผูก batch สุกร
                                            </Typography>
                                          )}
                                        </Box>
                                        {task.status !== 'completed' && (
                                        <Stack
                                          alignItems={{ xs: 'stretch', lg: 'flex-end' }}
                                          spacing={1}
                                          sx={{ minWidth: { lg: 112 } }}
                                        >
                                          <StockActionButton
                                            tone="info"
                                            size="small"
                                            startIcon={<EditOutlined />}
                                            onClick={() => openRescheduleDialog(task)}
                                            disabled={!canReschedulePlan}
                                          >
                                            เลื่อน
                                          </StockActionButton>
                                          <StockActionButton
                                            tone="danger"
                                            size="small"
                                            startIcon={<DeleteOutline />}
                                            onClick={() => void handleDeleteTask(task)}
                                            disabled={!canDeletePlan || saving}
                                          >
                                            ลบแผน
                                          </StockActionButton>
                                        </Stack>
                                        )}
                                      </Stack>
                                    </CardContent>
                                  </Card>
                                );
                              })}
                            </Stack>
                          </Stack>
                        </Box>
                      );
                    })}
                  </Stack>
                </Box>
              )}
            </Box>
          </Paper>
        </ContentCard>
      </Box>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle sx={{ fontWeight: 800 }}>
          {dialogMode === 'new'
            ? 'กำหนดแผนฉีดวัคซีน (Manual Schedule)'
            : 'ปรับเปลี่ยนวันฉีดวัคซีน (Reschedule)'}
        </DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2}>
            {dialogMode === 'new' ? (
              <>
                <FormControl size="small" fullWidth>
                  <InputLabel>ฟาร์ม</InputLabel>
                  <Select
                    label="ฟาร์ม"
                    value={draft.farmCode}
                    disabled={!!authScopedFarmCode || farmOptions.length <= 1}
                    onChange={(event) =>
                      setDraft((prev) => ({
                        ...prev,
                        farmCode: String(event.target.value),
                        groupId: '',
                        houseCode: '',
                        batchAllocations: [],
                        targetHeadcount: '',
                        plannedQty: '',
                      }))
                    }
                  >
                    {farmOptions.map((farm) => (
                      <MenuItem key={farm.code} value={farm.code}>
                        {farm.name} ({farm.code})
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <FormControl size="small" fullWidth>
                  <InputLabel>โซน/ระยะการเลี้ยง (ไม่บังคับ)</InputLabel>
                  <Select
                    label="โซน/ระยะการเลี้ยง (ไม่บังคับ)"
                    value={draft.groupId}
                    onChange={(event) =>
                      setDraft((prev) => ({
                        ...prev,
                        groupId: String(event.target.value),
                        houseCode: '',
                        batchAllocations: [],
                        targetHeadcount: '',
                        plannedQty: '',
                      }))
                    }
                    disabled={!draft.farmCode}
                  >
                    <MenuItem value="">
                      <em>ไม่ระบุ</em>
                    </MenuItem>
                    {groupOptions.map((group) => (
                      <MenuItem key={`${group.farmCode ?? 'all'}-${group.id}`} value={group.id}>
                        {group.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <FormControl size="small" fullWidth>
                  <InputLabel>โรงเรือน</InputLabel>
                  <Select
                    label="โรงเรือน"
                    value={draft.houseCode}
                    onChange={(event) => {
                      const nextHouseCode = String(event.target.value);
                      setDraft((prev) => ({
                        ...prev,
                        houseCode: nextHouseCode,
                        batchAllocations: [],
                        targetHeadcount: '',
                        plannedQty: '',
                      }));
                    }}
                    disabled={!draft.farmCode}
                  >
                    {houseOptions.map((house) => (
                      <MenuItem key={`${house.farmCode ?? 'all'}-${house.groupId ?? '-'}-${house.code}`} value={house.code}>
                        {house.name}
                        {Number.isFinite(house.currentQuantity) ? ` (คงเหลือ ${house.currentQuantity} ตัว)` : ''}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                {executionLoading ? <LinearProgress sx={{ borderRadius: 10}} /> : null}

                {draft.houseCode ? (
                  <Paper
                    variant="outlined"
                    sx={{
                      borderRadius: 10,
                      borderColor: alpha(theme.palette.divider, 0.7),
                      bgcolor: alpha(theme.palette.info.main, 0.04),
                      p: 1.5,
                    }}
                  >
                    <Stack spacing={1}>
                      <Stack
                        direction={{ xs: 'column', md: 'row' }}
                        alignItems={{ xs: 'flex-start', md: 'center' }}
                        justifyContent="space-between"
                        spacing={1}
                      >
                        <Box>
                          <Typography sx={{ fontWeight: 800, color: 'text.primary' }}>
                            Batch สุกรที่พร้อมฉีด
                          </Typography>
                          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                            ระบบใช้ข้อมูลสุกรคงเหลือของโรงเรือนนี้ เพื่อช่วยเลือก batch และจำนวนหมูจริงที่จะฉีด
                          </Typography>
                        </Box>
                        <Chip
                          size="small"
                          label={resolveWarehouseSummaryMeta(executionContext?.warehouseSummary).label}
                          sx={{ fontWeight: 700, ...resolveWarehouseSummaryMeta(executionContext?.warehouseSummary).chipSx }}
                        />
                      </Stack>

                      {executionContext ? (
                        <Stack direction="row" spacing={0.75} useFlexGap flexWrap="wrap">
                          {executionContext.currentQuantity > 0 ? (
                            <Chip
                              size="small"
                              label={`หมูคงเหลือรวม ${executionContext.currentQuantity} ตัว`}
                              sx={{ bgcolor: '#e0f2fe', color: '#075985', fontWeight: 700 }}
                            />
                          ) : null}
                          {totalAllocatedHeadcount > 0 ? (
                            <Chip
                              size="small"
                              label={`เลือกฉีด ${totalAllocatedHeadcount} ตัว`}
                              sx={{ bgcolor: '#FEF3F2', color: '#912018', fontWeight: 700 }}
                            />
                          ) : null}
                          {executionContext.ageDays !== null && executionContext.ageDays !== undefined && executionContext.ageDays > 0 ? (
                            <Chip
                              size="small"
                              label={`อายุสูงสุด ${executionContext.ageDays} วัน`}
                              sx={{ bgcolor: '#f3e8ff', color: '#6b21a8', fontWeight: 700 }}
                            />
                          ) : null}
                          {selectedVaccine?.uomName ? (
                            <Chip
                              size="small"
                              label={`หน่วยวัคซีน ${selectedVaccine.uomName}`}
                              sx={{ bgcolor: '#fef3c7', color: '#92400e', fontWeight: 700 }}
                            />
                          ) : null}
                        </Stack>
                      ) : null}

                      {executionContext && executionContext.batchOptions.length > 0 ? (
                        <Stack spacing={1}>
                          {draft.batchAllocations?.map((allocation) => (
                            <Paper
                              key={`draft-batch-${allocation.pigBatchId}-${allocation.buildingOpeningRequestId}`}
                              variant="outlined"
                              sx={{
                                borderRadius: 10,
                                borderColor: alpha(theme.palette.divider, 0.7),
                                p: 1.25,
                              }}
                            >
                              <Stack
                                direction={{ xs: 'column', md: 'row' }}
                                spacing={1.25}
                                justifyContent="space-between"
                                alignItems={{ xs: 'stretch', md: 'center' }}
                              >
                                <Box sx={{ flex: 1 }}>
                                  <Typography sx={{ fontWeight: 800, color: 'text.primary' }}>
                                    {allocation.batchNo}
                                  </Typography>
                                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                                    {allocation.pigItemName || 'ไม่ระบุรุ่นสุกร'}
                                    {allocation.ageDays !== null && allocation.ageDays !== undefined
                                      ? ` · อายุ ${allocation.ageDays} วัน`
                                      : ''}
                                    {allocation.receivedDateIso ? ` · รับเข้า ${formatDateLabel(allocation.receivedDateIso)}` : ''}
                                  </Typography>
                                  <Stack direction="row" spacing={0.75} useFlexGap flexWrap="wrap" sx={{ mt: 0.75 }}>
                                    <Chip
                                      size="small"
                                      label={`คงเหลือ ${allocation.availableQuantity} ตัว`}
                                      sx={{ bgcolor: '#e2e8f0', color: '#334155', fontWeight: 700 }}
                                    />
                                    <Chip
                                      size="small"
                                      label={`BOR ${allocation.buildingOpeningRequestId}`}
                                      sx={{ bgcolor: '#ede9fe', color: '#5b21b6', fontWeight: 700 }}
                                    />
                                  </Stack>
                                </Box>
                                <TextField
                                  size="small"
                                  type="number"
                                  label="วางแผนฉีด (ตัว)"
                                  value={allocation.allocatedHeadcount}
                                  onChange={(event) =>
                                    setDraft((prev) => {
                                      const nextAllocations = (prev.batchAllocations ?? []).map((item) => {
                                        if (buildBatchAllocationKey(item) !== buildBatchAllocationKey(allocation)) {
                                          return item;
                                        }

                                        const nextValue =
                                          event.target.value.trim() === ''
                                            ? 0
                                            : Number(event.target.value);

                                        return {
                                          ...item,
                                          allocatedHeadcount:
                                            Number.isFinite(nextValue) && nextValue >= 0
                                              ? Math.min(nextValue, Number(item.availableQuantity) || nextValue)
                                              : 0,
                                        };
                                      });
                                      const nextHeadcount = Math.round(sumAllocatedHeadcount(nextAllocations));
                                      const previousHeadcount =
                                        prev.targetHeadcount === '' || !Number.isFinite(Number(prev.targetHeadcount))
                                          ? null
                                          : Number(prev.targetHeadcount);
                                      const shouldSyncPlannedQty =
                                        prev.plannedQty === ''
                                        || (previousHeadcount !== null && Number(prev.plannedQty) === previousHeadcount);

                                      return {
                                        ...prev,
                                        batchAllocations: nextAllocations,
                                        targetHeadcount: nextHeadcount > 0 ? nextHeadcount : '',
                                        plannedQty:
                                          nextHeadcount > 0 && shouldSyncPlannedQty
                                            ? nextHeadcount
                                            : prev.plannedQty,
                                      };
                                    })
                                  }
                                  inputProps={{
                                    min: 0,
                                    max: allocation.availableQuantity,
                                    step: 1,
                                  }}
                                  sx={{ width: { xs: '100%', md: 180 } }}
                                />
                              </Stack>
                            </Paper>
                          ))}
                        </Stack>
                      ) : draft.houseCode && !executionLoading ? (
                        <Alert severity="warning" sx={{ borderRadius: 10}}>
                          ยังไม่พบข้อมูล batch สุกรของโรงเรือนนี้ จึงยังผูกแผนกับรุ่นสุกรไม่ได้
                        </Alert>
                      ) : null}

                      {executionContext?.warehouseBalances?.length ? (
                        <Stack direction="row" spacing={0.75} useFlexGap flexWrap="wrap">
                          {executionContext.warehouseBalances.slice(0, 4).map((balance) => (
                            <Chip
                              key={`warehouse-${balance.warehouseId}-${balance.stockLotId ?? 0}`}
                              size="small"
                              icon={<LocalShippingOutlined sx={{ fontSize: 14 }} />}
                              label={`${balance.warehouseName}${balance.lotNumber ? ` / Lot ${balance.lotNumber}` : ''} • ${balance.availableQuantity} ${balance.uomName}`}
                              sx={{ bgcolor: '#fff7ed', color: '#9a3412', fontWeight: 700 }}
                            />
                          ))}
                        </Stack>
                      ) : null}
                    </Stack>
                  </Paper>
                ) : null}

                <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.25}>
                  <TextField
                    size="small"
                    label="จำนวนสุกรที่วางแผนฉีด (ตัว)"
                    type="number"
                    value={draft.targetHeadcount}
                    onChange={(event) =>
                      setDraft((prev) => ({
                        ...prev,
                        targetHeadcount:
                          event.target.value.trim() === '' ? '' : Number(event.target.value),
                      }))
                    }
                    inputProps={{ min: 0, step: 1 }}
                    InputProps={{
                      readOnly: (executionContext?.batchOptions?.length ?? 0) > 0,
                    }}
                    helperText={
                      hasBatchSelections
                        ? `รวมจาก batch ที่เลือก ${totalAllocatedHeadcount} ตัว`
                        : 'กรอกจำนวนสุกรที่ตั้งใจฉีดในแผนนี้'
                    }
                    fullWidth
                  />
                  <TextField
                    size="small"
                    label="จำนวนวัคซีนที่วางแผนใช้ (โดส)"
                    type="number"
                    value={draft.plannedQty}
                    onChange={(event) =>
                      setDraft((prev) => ({
                        ...prev,
                        plannedQty:
                          event.target.value.trim() === '' ? '' : Number(event.target.value),
                      }))
                    }
                    inputProps={{ min: 0, step: 1 }}
                    helperText="เป็นจำนวนวัคซีนที่วางแผนใช้ ยังไม่ใช่ยอดตัด stock จริง"
                    fullWidth
                  />
                </Stack>

              </>
            ) : (
              <Box
                sx={{
                  p: 1.5,
                  borderRadius: 10,
                  border: `1px solid ${alpha(theme.palette.divider, 0.7)}`,
                  bgcolor: alpha(theme.palette.background.default, 0.7),
                }}
              >
                <Typography sx={{ fontWeight: 700, color: 'text.primary' }}>
                  {selectedTask?.houseName}
                </Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  {selectedTask?.farmName} ({selectedTask?.farmCode}) · {selectedTask?.phaseName}
                </Typography>
              </Box>
            )}

            <FormControl size="small" fullWidth>
              <InputLabel>รายการวัคซีน</InputLabel>
              <Select
                label="รายการวัคซีน"
                value={draft.vaccineItemId}
                onChange={(event) =>
                  setDraft((prev) => ({
                    ...prev,
                    vaccineItemId:
                      String(event.target.value).trim() === ''
                        ? ''
                        : Number(event.target.value),
                  }))
                }
              >
                <MenuItem value="">
                  <em>เลือกวัคซีน...</em>
                </MenuItem>
                {vaccineOptions.map((vaccine) => (
                  <MenuItem key={vaccine.id} value={vaccine.id}>
                    {vaccine.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              size="small"
              type="date"
              label="วันที่ฉีด"
              value={draft.plannedDate}
              onChange={(event) =>
                setDraft((prev) => ({ ...prev, plannedDate: event.target.value }))
              }
              fullWidth
              InputLabelProps={{ shrink: true }}
            />

            <TextField
              size="small"
              label={dialogMode === 'reschedule' ? 'เหตุผลในการเลื่อน' : 'หมายเหตุ'}
              value={dialogMode === 'reschedule' ? draft.reason : draft.note}
              onChange={(event) =>
                setDraft((prev) =>
                  dialogMode === 'reschedule'
                    ? { ...prev, reason: event.target.value }
                    : { ...prev, note: event.target.value },
                )
              }
              fullWidth
              multiline
              minRows={2}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <StockActionButton tone="neutral" onClick={() => setDialogOpen(false)} disabled={saving}>
            ยกเลิก
          </StockActionButton>
          <StockActionButton tone="primary" onClick={() => void handleSaveDialog()} disabled={saving}>
            {saving ? 'กำลังบันทึก...' : 'บันทึกแผนงาน'}
          </StockActionButton>
        </DialogActions>
      </Dialog>

    </Box>
  );
}
