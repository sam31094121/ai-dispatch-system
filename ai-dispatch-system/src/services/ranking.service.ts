// ═══════════════════════════════════════════════════════
// ranking.service.ts — 真實後端串接版
// ═══════════════════════════════════════════════════════
import { apiPost } from './apiClient';

export interface RankingRow {
  id?: number;
  reportDate: string;
  employeeName: string;
  normalizedName: string;
  totalFollowupCount: number;
  totalFollowupAmount: number;
  totalRevenueAmount: number;
  totalActualAmount: number;
  totalCancelAmount: number;
  rankNo: number;
  rankingRuleText: string;
  sourcePlatformData?: string;
}

export interface RankingSummary {
  totalRevenue: number;
  totalActualAmount: number;
  totalFollowupCount: number;
  totalFollowupAmount: number;
  platformBreakdown: Record<string, number>;
}

export interface RankingResult {
  reportDate: string;
  summary: RankingSummary;
  rankings: RankingRow[];
}

function buildSummary(rankings: RankingRow[]): RankingSummary {
  const platformBreakdown: Record<string, number> = {};
  for (const r of rankings) {
    try {
      const platforms = JSON.parse(r.sourcePlatformData ?? '{}') as Record<string, number>;
      for (const [p, v] of Object.entries(platforms)) {
        platformBreakdown[p] = (platformBreakdown[p] ?? 0) + (v as number);
      }
    } catch { /* ignore */ }
  }
  return {
    totalRevenue: rankings.reduce((s, r) => s + r.totalRevenueAmount, 0),
    totalActualAmount: rankings.reduce((s, r) => s + r.totalActualAmount, 0),
    totalFollowupCount: rankings.reduce((s, r) => s + r.totalFollowupCount, 0),
    totalFollowupAmount: rankings.reduce((s, r) => s + r.totalFollowupAmount, 0),
    platformBreakdown,
  };
}

export const rankingService = {
  /** 生成整合排名（同時產生派單分組） */
  async generate(reportDate: string): Promise<RankingResult> {
    const res = await apiPost<{ reportDate: string; rankings: RankingRow[] }>(
      '/rankings/generate',
      { reportDate },
    );
    if (!res.success) throw Object.assign(new Error(res.message), { responseMessage: res.message });
    const rankings = res.data.rankings ?? [];
    return { reportDate, summary: buildSummary(rankings), rankings };
  },
};
