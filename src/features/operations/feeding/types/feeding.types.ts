export interface FeedingOptionFacility {
  id: number;
  code: string;
  name: string;
}

export interface FeedingOptionHouse {
  id: number;
  facilityId: number;
  zoneName?: string | null;
  houseCode: string;
  houseName: string;
}

export interface FeedingOptionItem {
  id: number;
  code: string;
  name: string;
  unitCost: number;
  isBagDisplay?: boolean;
  displayUomName?: string;
  kgPerDisplayUnit?: number;
}

export interface FeedingPlanOptionsResponse {
  facilities: FeedingOptionFacility[];
  houses: FeedingOptionHouse[];
  feedItems: FeedingOptionItem[];
}

export interface FeedingPlanLineResponse {
  id: number;
  headerId: number;
  planDate: string;
  facilityId: number;
  facilityName: string;
  houseId?: number | null;
  houseCode: string;
  houseName: string;
  feedItemId: number;
  feedItemCode: string;
  feedItemName: string;
  scheduledTime: string;
  plannedQtyKg: number;
  actualQtyKg?: number | null;
  isBagDisplay?: boolean;
  displayUomName?: string;
  kgPerDisplayUnit?: number;
  plannedDisplayQty?: number;
  actualDisplayQty?: number | null;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  note?: string | null;
  completedAt?: string | null;
  completedBy?: string | null;
}

export interface FeedingFarmFcrRow {
  facilityId: number;
  facilityName: string;
  fcrActual: number;
}

export interface FeedingPlanSummaryResponse {
  date: string;
  totalPlannedKg: number;
  totalActualKg: number;
  completionRatePct: number;
  costPerKg: number;
  efficiencyPct: number;
  fcrMtd?: number | null;
  completedCount: number;
  totalCount: number;
  farmFcr: FeedingFarmFcrRow[];
}

export interface CreateFeedingPlanLineRequest {
  planDate: string;
  facilityId: number;
  houseId?: number | null;
  feedItemId: number;
  scheduledTime: string;
  plannedQtyKg: number;
  plannedDisplayQty?: number;
  note?: string;
}

export interface CreateFeedingPlanLineBulkLineRequest {
  feedItemId: number;
  feedCode?: string;
  plannedQtyKg?: number;
  plannedDisplayQty?: number;
  note?: string;
}

export interface CreateFeedingPlanLineBulkRequest {
  planDate: string;
  facilityId: number;
  houseId?: number | null;
  scheduledTime: string;
  note?: string;
  isBulk?: boolean;
  lines: CreateFeedingPlanLineBulkLineRequest[];
}

export interface CompleteFeedingPlanLineRequest {
  actualQtyKg?: number;
  actualDisplayQty?: number;
  note?: string;
}

export interface FeedingCartRoundRow {
  roundNo: number;
  plannedKg: number;
  displayQty?: number;
  displayUomName?: string;
  suggestedTime: string;
  cartCount?: number;
}

export interface FeedingPendingPlanResponse {
  planLineId: number;
  feedItemId: number;
  feedItemCode: string;
  feedItemName: string;
  houseId?: number | null;
  houseCode: string;
  houseName: string;
  plannedQtyKg: number;
  isBagDisplay?: boolean;
  displayUomName?: string;
  kgPerDisplayUnit?: number;
  plannedDisplayQty?: number;
  scheduledTime: string;
  note?: string | null;
  cartCount?: number;
}

export interface FeedingFiScheduleRowResponse {
  houseId: number;
  houseCode: string;
  houseName: string;
  buildingOpeningId?: number | null;
  buildingOpeningDocNo?: string | null;
  batchId?: number | null;
  batchNo?: string | null;
  targetDay?: number | null;
  stockHead: number;
  headCount?: number;
  feedItemId?: number | null;
  feedItemCode: string;
  feedItemName: string;
  feedCode: string;
  fiKgPerHead?: number | null;
  fiGramPerHead?: number | null;
  suggestedKg?: number;
  backlogKg?: number;
  plannedKg?: number;
  targetFeedKg: number;
  isBagDisplay?: boolean;
  displayUomName?: string;
  kgPerDisplayUnit?: number;
  targetFeedDisplayQty?: number;
  feedingFormat: string;
  cartWeightKg?: number | null;
  roundCount: number;
  cartPlanText: string;
  plannedRounds: FeedingCartRoundRow[];
}
