export type TimelineUrgency = 'overdue' | 'today' | 'tomorrow' | 'future';

export type VaccinationTaskStatus = 'pending' | 'in-progress' | 'scheduled' | 'completed';

export type VaccinationWarehouseStatus = 'available' | 'enough' | 'insufficient' | 'empty';

export interface VaccinationBatchAllocation {
  pigBatchId: number;
  batchNo: string;
  buildingOpeningRequestId: number;
  allocatedHeadcount: number;
  availableQuantity: number;
  ageDays?: number | null;
  pigItemId?: number | null;
  pigItemName?: string | null;
  receivedDateIso?: string | null;
  note?: string | null;
}

export interface VaccinationWarehouseBalance {
  warehouseId: number;
  warehouseName: string;
  warehouseType: string;
  stockLotId?: number | null;
  lotNumber?: string | null;
  uomId: number;
  uomName: string;
  availableQuantity: number;
  expiryDateIso?: string | null;
}

export interface VaccinationWarehouseSummary {
  status: VaccinationWarehouseStatus;
  totalAvailableQuantity: number;
  requiredQuantity?: number | null;
  shortageQuantity: number;
  candidateCount: number;
}

export interface VaccinationExecutionContext {
  farmCode: string;
  farmName: string;
  groupId?: string | null;
  houseCode: string;
  houseName: string;
  currentQuantity: number;
  ageDays?: number | null;
  batchOptions: VaccinationBatchAllocation[];
  warehouseBalances: VaccinationWarehouseBalance[];
  warehouseSummary?: VaccinationWarehouseSummary | null;
}

export interface VaccinationTask {
  id: string;
  farmName: string;
  farmCode: string;
  phaseName: string;
  groupId: string;
  houseName: string;
  houseCode: string;
  headcount: number;
  vaccineItemId?: number;
  vaccineName: string;
  dosesRequired: number;
  status: VaccinationTaskStatus;
  plannedDateIso: string;
  documentCode?: string;
  approvalTxnCode?: string;
  batchAllocations?: VaccinationBatchAllocation[];
  warehouseSummary?: VaccinationWarehouseSummary | null;
}

export interface VaccinationTimelineDay {
  id: string;
  dateLabel: string;
  isoDate: string;
  urgency: TimelineUrgency;
  label: string;
  tasks: VaccinationTask[];
}

export interface VaccinationFarmOption {
  code: string;
  name: string;
}

export interface VaccinationGroupOption {
  id: string;
  name: string;
  farmCode?: string;
}

export interface VaccinationHouseOption {
  code: string;
  name: string;
  farmCode?: string;
  groupId?: string;
  currentQuantity?: number;
  ageDays?: number;
}

export interface VaccinationPlannerOptions {
  farms: VaccinationFarmOption[];
  groups: VaccinationGroupOption[];
  houses: VaccinationHouseOption[];
  vaccines: VaccinationVaccineOption[];
}

export interface VaccinationVaccineOption {
  id: number;
  code: string;
  name: string;
  uomId?: number | null;
  uomName?: string | null;
}

export interface CreateVaccinationPlanRequest {
  farmCode: string;
  groupId?: string;
  houseCode: string;
  vaccineItemId: number;
  plannedDate: string;
  targetHeadcount?: number;
  plannedQty?: number;
  batchAllocations?: Array<{
    pigBatchId: number;
    buildingOpeningRequestId: number;
    headcount: number;
  }>;
  note?: string;
  documentPrefix?: string;
  approvalTxnPrefix?: string;
}

export interface RescheduleVaccinationPlanRequest {
  plannedDate: string;
  reason: string;
  note?: string;
}

export interface VaccinationPlanDialogState {
  farmCode: string;
  groupId: string;
  houseCode: string;
  vaccineItemId: number | '';
  targetHeadcount: number | '';
  plannedQty: number | '';
  batchAllocations?: VaccinationBatchAllocation[];
  plannedDate: string;
  reason: string;
  note: string;
}
