export interface RankingSummary {
  yixinTotalRevenue: number;
  minshiTotalRevenue: number;
  companyTotalRevenue: number;
  allTotalRevenue: number;
}

export interface IntegratedRanking {
  id?: number;
  reportDate: string;
  employeeName: string;
  normalizedName?: string;
  totalFollowupCount: number;
  totalFollowupAmount: number;
  totalRevenueAmount: number;
  totalActualAmount: number;
  totalCancelAmount?: number;
  rankNo: number;
  rankingRuleText?: string;
  sourcePlatformData?: Record<string, unknown>;
  createdAt?: string;
}

export interface RankingGeneratePayload {
  reportDate: string;
}

export interface RankingGenerateResult {
  reportDate: string;
  summary: RankingSummary;
  rankings: IntegratedRanking[];
}
