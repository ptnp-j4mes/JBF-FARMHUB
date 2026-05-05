export interface AnalyticsOverviewTrendPoint {
  month: string;
  fcrAverage: number;
  feedCost: number;
  mortalityRatePct: number;
}

export interface AnalyticsOverviewFarmRow {
  farmId: number;
  farmName: string;
  stockHead: number;
  deathHead: number;
  mortalityRatePct: number;
  fcrAverage: number;
  feedCostMonth: number;
}

export interface AnalyticsOverviewResponse {
  lastUpdatedAt: string;
  totalStockHead: number;
  totalDeathHead: number;
  mortalityRatePct: number;
  fcrAverage: number;
  feedCostMonth: number;
  farmCount: number;
  monthlyTrends: AnalyticsOverviewTrendPoint[];
  farmPerformance: AnalyticsOverviewFarmRow[];
}

export interface AnalyticsFilters {
  facilityId?: number;
}
