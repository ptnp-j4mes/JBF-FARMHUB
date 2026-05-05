import axios from 'axios';
import axiosInstance from '@/lib/axios';
import type {
  CreateVaccinationPlanRequest,
  VaccinationBatchAllocation,
  VaccinationExecutionContext,
  RescheduleVaccinationPlanRequest,
  VaccinationPlannerOptions,
  VaccinationVaccineOption,
  VaccinationTask,
  VaccinationTimelineDay,
  VaccinationWarehouseBalance,
  VaccinationWarehouseSummary,
} from '../types';

const BASE_URL = '/api/OperationsHealth';

const FALLBACK_TIMELINE_BY_MONTH: Record<string, VaccinationTimelineDay[]> = {
  '2026-03': [
    {
      id: 'day-2026-03-24',
      dateLabel: '24 มี.ค. 2026',
      isoDate: '2026-03-24',
      urgency: 'overdue',
      label: 'เลยกำหนด (Overdue)',
      tasks: [
        {
          id: 'TASK-001',
          farmName: 'ฟาร์มหนองบัวลำภู',
          farmCode: 'NB-01',
          phaseName: 'โซนเล้าขุน',
          groupId: 'FIN',
          houseName: 'โรงเรือนขุน 3 (F3)',
          houseCode: 'F3',
          headcount: 500,
          vaccineItemId: 1,
          vaccineName: 'อหิวาต์สุกร (CSF)',
          dosesRequired: 500,
          status: 'pending',
          plannedDateIso: '2026-03-24',
        },
      ],
    },
    {
      id: 'day-2026-03-26',
      dateLabel: '26 มี.ค. 2026',
      isoDate: '2026-03-26',
      urgency: 'today',
      label: 'วันนี้ (Today)',
      tasks: [
        {
          id: 'TASK-002',
          farmName: 'ฟาร์มหนองบัวลำภู',
          farmCode: 'NB-01',
          phaseName: 'โซนเล้าอนุบาล',
          groupId: 'NUR',
          houseName: 'โรงเรือนอนุบาล 2 (N2)',
          houseCode: 'N2',
          headcount: 450,
          vaccineItemId: 2,
          vaccineName: 'PCV2 + Mycoplasma',
          dosesRequired: 450,
          status: 'in-progress',
          plannedDateIso: '2026-03-26',
        },
      ],
    },
    {
      id: 'day-2026-03-27',
      dateLabel: '27 มี.ค. 2026',
      isoDate: '2026-03-27',
      urgency: 'tomorrow',
      label: 'พรุ่งนี้ (Tomorrow)',
      tasks: [
        {
          id: 'TASK-003',
          farmName: 'ฟาร์มหนองบัวลำภู',
          farmCode: 'NB-01',
          phaseName: 'โซนเล้าคลอด',
          groupId: 'FAR',
          houseName: 'โรงเรือนคลอด 1 (F1)',
          houseCode: 'F1',
          headcount: 115,
          vaccineItemId: 3,
          vaccineName: 'ธาตุเหล็ก + ป้องกันบิด',
          dosesRequired: 115,
          status: 'scheduled',
          plannedDateIso: '2026-03-27',
        },
      ],
    },
    {
      id: 'day-2026-03-31',
      dateLabel: '31 มี.ค. 2026',
      isoDate: '2026-03-31',
      urgency: 'future',
      label: 'สัปดาห์หน้า (Next Week)',
      tasks: [
        {
          id: 'TASK-004',
          farmName: 'ฟาร์มขอนแก่น',
          farmCode: 'KK-02',
          phaseName: 'โซนเล้าอุ้มท้อง',
          groupId: 'GES',
          houseName: 'โรงเรือนอุ้มท้อง 1 (G1)',
          houseCode: 'G1',
          headcount: 45,
          vaccineItemId: 4,
          vaccineName: 'E.coli / FMD',
          dosesRequired: 45,
          status: 'scheduled',
          plannedDateIso: '2026-03-31',
        },
      ],
    },
  ],
  '2026-04': [],
};

function cloneTimeline(rows: VaccinationTimelineDay[]): VaccinationTimelineDay[] {
  return rows.map((day) => ({
    ...day,
    tasks: day.tasks.map((task) => ({ ...task })),
  }));
}

function getCurrentIsoMonth(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  return `${year}-${String(month).padStart(2, '0')}`;
}

function getFallbackTimeline(month?: string, showAll = false): VaccinationTimelineDay[] {
  if (showAll) {
    const rows = Object.values(FALLBACK_TIMELINE_BY_MONTH).flatMap((days) => days);
    return cloneTimeline(rows).sort((left, right) => left.isoDate.localeCompare(right.isoDate));
  }

  const targetMonth = month ?? getCurrentIsoMonth();
  return cloneTimeline(FALLBACK_TIMELINE_BY_MONTH[targetMonth] ?? []);
}

function isApiNotReady(error: unknown): boolean {
  if (!axios.isAxiosError(error)) {
    return false;
  }

  const status = error.response?.status;
  return status === 404 || status === 405 || status === 501;
}

function isTimelineRows(value: unknown): value is VaccinationTimelineDay[] {
  if (!Array.isArray(value)) {
    return false;
  }

  return value.every((day) => day && typeof day === 'object' && Array.isArray(day.tasks));
}

function buildFallbackOptions(): VaccinationPlannerOptions {
  const tasks = Object.values(FALLBACK_TIMELINE_BY_MONTH)
    .flatMap((days) => days)
    .flatMap((day) => day.tasks);

  const farms = Array.from(
    new Map(tasks.map((task) => [task.farmCode, { code: task.farmCode, name: task.farmName }])).values(),
  );

  const groups = Array.from(
    new Map(
      tasks.map((task) => [
        `${task.farmCode}:${task.groupId}`,
        {
          id: task.groupId,
          name: task.phaseName,
          farmCode: task.farmCode,
        },
      ]),
    ).values(),
  );

  const houses = Array.from(
    new Map(
      tasks.map((task) => [
        `${task.farmCode}:${task.groupId}:${task.houseCode}`,
        {
          code: task.houseCode,
          name: task.houseName,
          farmCode: task.farmCode,
          groupId: task.groupId,
        },
      ]),
    ).values(),
  );

  const vaccines = Array.from(
    new Map(
      tasks.map((task) => [
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

  return { farms, groups, houses, vaccines };
}

function buildFallbackCreatedTask(request: CreateVaccinationPlanRequest): VaccinationTask {
  const fallbackOptions = buildFallbackOptions();
  const requestGroupId = (request.groupId ?? '').trim();
  const resolvedGroupName =
    fallbackOptions.groups.find(
      (group) =>
        group.id === requestGroupId &&
        (!group.farmCode || group.farmCode === request.farmCode),
    )?.name ?? requestGroupId;
  const selectedVaccine = fallbackOptions.vaccines.find(
    (item) => item.id === request.vaccineItemId,
  );
  const run = Date.now().toString().slice(-6);

  return {
    id: `manual-${Date.now()}`,
    farmCode: request.farmCode,
    farmName:
      fallbackOptions.farms.find((farm) => farm.code === request.farmCode)?.name ??
      request.farmCode,
    groupId: requestGroupId || '-',
    phaseName: resolvedGroupName || '-',
    houseCode: request.houseCode,
    houseName:
      fallbackOptions.houses.find(
        (house) =>
          house.code === request.houseCode &&
          (!house.farmCode || house.farmCode === request.farmCode) &&
          (!requestGroupId || !house.groupId || house.groupId === requestGroupId),
      )?.name ?? request.houseCode,
    headcount:
      request.targetHeadcount !== undefined && Number.isFinite(request.targetHeadcount)
        ? Number(request.targetHeadcount)
        : 0,
    vaccineItemId: request.vaccineItemId,
    vaccineName: selectedVaccine?.name ?? 'วัคซีน',
    dosesRequired:
      request.plannedQty !== undefined && Number.isFinite(request.plannedQty)
        ? Number(request.plannedQty)
        : request.targetHeadcount !== undefined && Number.isFinite(request.targetHeadcount)
          ? Number(request.targetHeadcount)
          : 0,
    status: 'scheduled',
    plannedDateIso: request.plannedDate,
    documentCode: `${(request.documentPrefix ?? 'VPL').toUpperCase()}-${run}`,
    approvalTxnCode: `${(request.approvalTxnPrefix ?? 'TXN').toUpperCase()}-${run}`,
  };
}

function isVaccinationTask(value: unknown): value is VaccinationTask {
  if (!value || typeof value !== 'object') {
    return false;
  }
  const payload = value as Partial<VaccinationTask>;
  return (
    (typeof payload.id === 'string' || typeof payload.id === 'number') &&
    typeof payload.farmCode === 'string' &&
    typeof payload.groupId === 'string' &&
    typeof payload.houseCode === 'string' &&
    typeof payload.vaccineName === 'string' &&
    typeof payload.plannedDateIso === 'string'
  );
}

function normalizeBatchAllocation(value: unknown): VaccinationBatchAllocation | null {
  if (!value || typeof value !== 'object') {
    return null;
  }

  const payload = value as Partial<VaccinationBatchAllocation>;
  const pigBatchId = Number(payload.pigBatchId);
  const buildingOpeningRequestId = Number(payload.buildingOpeningRequestId);
  if (!Number.isFinite(pigBatchId) || pigBatchId <= 0 || !Number.isFinite(buildingOpeningRequestId) || buildingOpeningRequestId <= 0) {
    return null;
  }

  return {
    pigBatchId,
    batchNo: typeof payload.batchNo === 'string' ? payload.batchNo : `Batch ${pigBatchId}`,
    buildingOpeningRequestId,
    allocatedHeadcount: Number.isFinite(Number(payload.allocatedHeadcount)) ? Number(payload.allocatedHeadcount) : 0,
    availableQuantity: Number.isFinite(Number(payload.availableQuantity)) ? Number(payload.availableQuantity) : 0,
    ageDays: Number.isFinite(Number(payload.ageDays)) ? Number(payload.ageDays) : null,
    pigItemId: Number.isFinite(Number(payload.pigItemId)) ? Number(payload.pigItemId) : null,
    pigItemName: typeof payload.pigItemName === 'string' ? payload.pigItemName : null,
    receivedDateIso: typeof payload.receivedDateIso === 'string' ? payload.receivedDateIso : null,
    note: typeof payload.note === 'string' ? payload.note : null,
  };
}

function normalizeWarehouseBalance(value: unknown): VaccinationWarehouseBalance | null {
  if (!value || typeof value !== 'object') {
    return null;
  }

  const payload = value as Partial<VaccinationWarehouseBalance>;
  const warehouseId = Number(payload.warehouseId);
  const uomId = Number(payload.uomId);
  if (!Number.isFinite(warehouseId) || warehouseId <= 0 || !Number.isFinite(uomId) || uomId <= 0) {
    return null;
  }

  return {
    warehouseId,
    warehouseName: typeof payload.warehouseName === 'string' ? payload.warehouseName : `Warehouse ${warehouseId}`,
    warehouseType: typeof payload.warehouseType === 'string' ? payload.warehouseType : '',
    stockLotId: Number.isFinite(Number(payload.stockLotId)) ? Number(payload.stockLotId) : null,
    lotNumber: typeof payload.lotNumber === 'string' ? payload.lotNumber : null,
    uomId,
    uomName: typeof payload.uomName === 'string' ? payload.uomName : '',
    availableQuantity: Number.isFinite(Number(payload.availableQuantity)) ? Number(payload.availableQuantity) : 0,
    expiryDateIso: typeof payload.expiryDateIso === 'string' ? payload.expiryDateIso : null,
  };
}

function normalizeWarehouseSummary(value: unknown): VaccinationWarehouseSummary | null {
  if (!value || typeof value !== 'object') {
    return null;
  }

  const payload = value as Partial<VaccinationWarehouseSummary>;
  const rawStatus = typeof payload.status === 'string' ? payload.status : 'empty';
  const status = ['available', 'enough', 'insufficient', 'empty'].includes(rawStatus)
    ? rawStatus as VaccinationWarehouseSummary['status']
    : 'empty';
  return {
    status,
    totalAvailableQuantity:
      Number.isFinite(Number(payload.totalAvailableQuantity)) ? Number(payload.totalAvailableQuantity) : 0,
    requiredQuantity:
      Number.isFinite(Number(payload.requiredQuantity)) ? Number(payload.requiredQuantity) : null,
    shortageQuantity:
      Number.isFinite(Number(payload.shortageQuantity)) ? Number(payload.shortageQuantity) : 0,
    candidateCount: Number.isFinite(Number(payload.candidateCount)) ? Number(payload.candidateCount) : 0,
  };
}

function normalizeTask(task: VaccinationTask): VaccinationTask {
  const maybeZoneName = (task as VaccinationTask & { zoneName?: string; phaseName?: string }).zoneName;
  const maybePhaseName = (task as VaccinationTask & { zoneName?: string; phaseName?: string }).phaseName;

  return {
    ...task,
    id: String(task.id),
    phaseName:
      typeof task.phaseName === 'string' && task.phaseName.trim().length > 0
        ? task.phaseName
        : typeof maybePhaseName === 'string' && maybePhaseName.trim().length > 0
          ? maybePhaseName
          : typeof maybeZoneName === 'string'
            ? maybeZoneName
            : '',
    headcount: Number.isFinite(task.headcount) ? task.headcount : 0,
    dosesRequired: Number.isFinite(task.dosesRequired) ? task.dosesRequired : 0,
    vaccineItemId:
      task.vaccineItemId !== undefined && Number.isFinite(task.vaccineItemId)
        ? Number(task.vaccineItemId)
        : undefined,
    documentCode:
      typeof task.documentCode === 'string' && task.documentCode.trim().length > 0
        ? task.documentCode.trim()
        : undefined,
    approvalTxnCode:
      typeof task.approvalTxnCode === 'string' && task.approvalTxnCode.trim().length > 0
        ? task.approvalTxnCode.trim()
        : undefined,
    batchAllocations: Array.isArray(task.batchAllocations)
      ? task.batchAllocations.map(normalizeBatchAllocation).filter(Boolean) as VaccinationBatchAllocation[]
      : [],
    warehouseSummary: normalizeWarehouseSummary(task.warehouseSummary),
  };
}

export const vaccinationPlanService = {
  getTimeline: async (month?: string, showAll = false): Promise<VaccinationTimelineDay[]> => {
    try {
      const response = await axiosInstance.get<unknown>(`${BASE_URL}/vaccination-plans/timeline`, {
        params: {
          ...(month ? { month } : {}),
          ...(showAll ? { showAll: true } : {}),
        },
      });

      if (isTimelineRows(response.data)) {
        return cloneTimeline(response.data).map((day) => ({
          ...day,
          tasks: day.tasks.map(normalizeTask),
        }));
      }

      return getFallbackTimeline(month, showAll);
    } catch (error) {
      if (isApiNotReady(error)) {
        return getFallbackTimeline(month, showAll);
      }
      throw error;
    }
  },

  getOptions: async (): Promise<VaccinationPlannerOptions> => {
    try {
      const response = await axiosInstance.get<unknown>(`${BASE_URL}/vaccination-plans/options`);
      if (response.data && typeof response.data === 'object') {
        const payload = response.data as Partial<VaccinationPlannerOptions>;
        return {
          farms: Array.isArray(payload.farms) ? payload.farms : [],
          groups: Array.isArray(payload.groups) ? payload.groups : [],
          houses: Array.isArray(payload.houses) ? payload.houses : [],
          vaccines: Array.isArray(payload.vaccines) ? payload.vaccines : [],
        };
      }
      return buildFallbackOptions();
    } catch (error) {
      if (isApiNotReady(error)) {
        return buildFallbackOptions();
      }
      throw error;
    }
  },

  getExecutionContext: async (params: {
    farmCode: string;
    houseCode: string;
    groupId?: string;
    vaccineItemId?: number;
  }): Promise<VaccinationExecutionContext | null> => {
    if (!params.farmCode || !params.houseCode) {
      return null;
    }

    try {
      const response = await axiosInstance.get<unknown>(`${BASE_URL}/vaccination-plans/execution-context`, {
        params: {
          farmCode: params.farmCode,
          houseCode: params.houseCode,
          ...(params.groupId ? { groupId: params.groupId } : {}),
          ...(params.vaccineItemId && params.vaccineItemId > 0 ? { vaccineItemId: params.vaccineItemId } : {}),
        },
      });

      if (!response.data || typeof response.data !== 'object') {
        return null;
      }

      const payload = response.data as Partial<VaccinationExecutionContext>;
      return {
        farmCode: typeof payload.farmCode === 'string' ? payload.farmCode : params.farmCode,
        farmName: typeof payload.farmName === 'string' ? payload.farmName : params.farmCode,
        groupId: typeof payload.groupId === 'string' ? payload.groupId : null,
        houseCode: typeof payload.houseCode === 'string' ? payload.houseCode : params.houseCode,
        houseName: typeof payload.houseName === 'string' ? payload.houseName : params.houseCode,
        currentQuantity: Number.isFinite(Number(payload.currentQuantity)) ? Number(payload.currentQuantity) : 0,
        ageDays: Number.isFinite(Number(payload.ageDays)) ? Number(payload.ageDays) : null,
        batchOptions: Array.isArray(payload.batchOptions)
          ? payload.batchOptions.map(normalizeBatchAllocation).filter(Boolean) as VaccinationBatchAllocation[]
          : [],
        warehouseBalances: Array.isArray(payload.warehouseBalances)
          ? payload.warehouseBalances.map(normalizeWarehouseBalance).filter(Boolean) as VaccinationWarehouseBalance[]
          : [],
        warehouseSummary: normalizeWarehouseSummary(payload.warehouseSummary),
      };
    } catch (error) {
      if (isApiNotReady(error)) {
        return null;
      }
      throw error;
    }
  },

  createPlan: async (request: CreateVaccinationPlanRequest): Promise<VaccinationTask> => {
    try {
      const response = await axiosInstance.post<unknown>(`${BASE_URL}/vaccination-plans`, request);
      if (isVaccinationTask(response.data)) {
        return normalizeTask(response.data);
      }
      return buildFallbackCreatedTask(request);
    } catch (error) {
      if (isApiNotReady(error)) {
        return buildFallbackCreatedTask(request);
      }
      throw error;
    }
  },

  deletePlan: async (taskId: string): Promise<void> => {
    try {
      await axiosInstance.delete(`${BASE_URL}/vaccination-plans/${taskId}`);
    } catch (error) {
      if (isApiNotReady(error)) {
        return;
      }
      throw error;
    }
  },

  reschedulePlan: async (
    taskId: string,
    request: RescheduleVaccinationPlanRequest,
  ): Promise<void> => {
    try {
      await axiosInstance.patch(`${BASE_URL}/vaccination-plans/${taskId}/reschedule`, request);
    } catch (error) {
      if (isApiNotReady(error)) {
        return;
      }
      throw error;
    }
  },
};
