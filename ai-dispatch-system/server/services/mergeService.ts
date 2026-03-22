import { getCorrectName } from './nameAliasService.js';
import type { PlatformReport, PlatformMember, PlatformSummary } from './auditService.js';

export interface MergedMember {
  name: string;
  isNew: boolean;
  merged: PlatformSummary;
  sourceBreakdown: {
    platformName: string;
    followDeals: number;
    followAmount: number;
    totalRevenueNet: number;
  }[];
}

/**
 * 跨平台人員資料整併
 */
export function mergePlatformData(platforms: PlatformReport[]): { mergedMembers: MergedMember[], totalSummary: PlatformSummary } {
  const memberMap = new Map<string, MergedMember>();

  const totalSummary: PlatformSummary = {
    totalCalls: 0,
    leadDeals: 0,
    followDeals: 0,
    followAmount: 0,
    refundAmount: 0,
    totalRevenueNet: 0,
  };

  for (const p of platforms) {
    for (const m of p.members) {
      // 1. 名稱標準化 (正名)
      const normName = getCorrectName(m.name);

      // 2. 累加資料
      if (!memberMap.has(normName)) {
        memberMap.set(normName, {
          name: normName,
          isNew: !!m.isNew,
          merged: {
            totalCalls: 0,
            leadDeals: 0,
            followDeals: 0,
            followAmount: 0,
            refundAmount: 0,
            totalRevenueNet: 0,
          },
          sourceBreakdown: [],
        });
      }

      const existing = memberMap.get(normName)!;
      existing.merged.totalCalls += m.totalCalls || 0;
      existing.merged.leadDeals += m.leadDeals || 0;
      existing.merged.followDeals += m.followDeals || 0;
      existing.merged.followAmount += m.followAmount || 0;
      existing.merged.refundAmount += m.refundAmount || 0;
      existing.merged.totalRevenueNet += m.totalRevenueNet || 0;

      // 3. 保留 Breakdown
      existing.sourceBreakdown.push({
        platformName: p.platformName,
        followDeals: m.followDeals || 0,
        followAmount: m.followAmount || 0,
        totalRevenueNet: m.totalRevenueNet || 0,
      });

      // 如果有任何來源標記為新，就當作新
      if (m.isNew) {
        existing.isNew = true;
      }
    }

    // 4. 累加三平台 Summary 作為驗算對照 (累積盤使用)
    totalSummary.totalCalls += p.summary.totalCalls;
    totalSummary.leadDeals += p.summary.leadDeals;
    totalSummary.followDeals += p.summary.followDeals;
    totalSummary.followAmount += p.summary.followAmount;
    totalSummary.refundAmount += p.summary.refundAmount;
    totalSummary.totalRevenueNet += p.summary.totalRevenueNet;
  }

  // 將 Map 轉為 Array
  const mergedMembers = Array.from(memberMap.values());

  return {
    mergedMembers,
    totalSummary,
  };
}

/**
 * 計算總盤成交率
 */
export function calculateDealRate(totalSummary: PlatformSummary): number {
  if (totalSummary.totalCalls === 0) return 0;
  // 依照規格四 (leadDeals + followDeals) / totalCalls
  const rate = (totalSummary.leadDeals + totalSummary.followDeals) / totalSummary.totalCalls;
  // 雖然說是要顯示百分比要四捨五入，我們這裡先算成整數（例如 114 代表 114% 或 11.4%？）
  // 參考規格十六： dealRate = 114 (通數 537, 總計派單+續單 317 + 293 = 610)
  // 610 / 537 = 1.1359 => 114% 
  return Math.round(rate * 100);
}
