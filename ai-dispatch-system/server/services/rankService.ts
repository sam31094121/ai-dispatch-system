import type { MergedMember } from './mergeService.js';

export interface RankedMember extends MergedMember {
  rank: number;
}

export interface DispatchGroups {
  A1: string[];
  A2: string[];
  B: string[];
  C: string[];
}

/**
 * 依據整合數據進行正式排序
 * 排序鍵: totalRevenueNet -> followupAmount -> followupDeals -> name
 */
export function rankMembers(members: MergedMember[]): RankedMember[] {
  // 排除已離職人員 (例：許淑英) 不納入派單排序
  const activeMembers = members.filter(m => m.name !== '許淑英');

  // 複製一份避免污染
  const sorted = [...activeMembers].sort((a, b) => {
    // 1. 總業績
    if (b.merged.totalRevenueNet !== a.merged.totalRevenueNet) {
      return b.merged.totalRevenueNet - a.merged.totalRevenueNet;
    }
    // 2. 續單金額
    if (b.merged.followAmount !== a.merged.followAmount) {
      return b.merged.followAmount - a.merged.followAmount;
    }
    // 3. 續單成交數
    if (b.merged.followDeals !== a.merged.followDeals) {
      return b.merged.followDeals - a.merged.followDeals;
    }
    // 4. 字典序
    return a.name.localeCompare(b.name, 'zh-TW');
  });

  // 賦予 rank
  return sorted.map((m, index) => ({
    ...m,
    rank: index + 1,
  }));
}

/**
 * 將排序後的隊員進行分組
 * A1: 1-4
 * A2: 5-10
 * B: 11-18
 * C: 19+
 */
export function groupMembers(rankedMembers: RankedMember[]): DispatchGroups {
  const groups: DispatchGroups = {
    A1: [],
    A2: [],
    B: [],
    C: [],
  };

  for (const m of rankedMembers) {
    if (m.rank <= 4) {
      groups.A1.push(m.name);
    } else if (m.rank <= 10) {
      groups.A2.push(m.name);
    } else if (m.rank <= 18) {
      groups.B.push(m.name);
    } else {
      groups.C.push(m.name);
    }
  }

  return groups;
}
