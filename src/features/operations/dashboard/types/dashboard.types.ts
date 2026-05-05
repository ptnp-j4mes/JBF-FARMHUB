export interface CommandCenterSummaryCards {
  totalStockHead: number;
  mortalityRatePct: number;
  fcrAverage: number;
  feedCostMonth: number;
  budgetMonth: number;
  budgetUsagePct: number;
  momDeltaPct: number;
}

export interface CommandCenterAlert {
  id: number;
  severity: 'info' | 'warning' | 'critical';
  title: string;
  description: string;
  facilityName: string;
  houseName?: string | null;
  occurredAt: string;
  isNew: boolean;
}

export interface CommandCenterFarmTableRow {
  farmId: number;
  farmName: string;
  stockHead: number;
  deathHead: number;
  mortalityRatePct: number;
  statusDot: 'normal' | 'warning' | 'critical';
}

export interface CommandCenterFeedUsageRow {
  feedCode: string;
  actualTon: number;
  targetTon: number;
  varianceTon: number;
  status: 'normal' | 'over' | 'under';
}

export interface CommandCenterResponse {
  hasFarmAccess: boolean;
  accessMessage: string;
  lastUpdatedAt: string;
  summaryCards: CommandCenterSummaryCards;
  alerts: CommandCenterAlert[];
  farmTable: CommandCenterFarmTableRow[];
  feedUsageByNumber: CommandCenterFeedUsageRow[];
}

export interface CommandCenterFilters {
  date?: string;
  facilityId?: number;
}
