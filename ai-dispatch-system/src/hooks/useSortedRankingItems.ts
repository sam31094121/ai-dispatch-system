/**
 * useSortedRankingItems
 *
 * 輸入：RankingItem[] from API
 * 輸出：只保留 active=true，依 rank → displayOrder 排序
 *
 * 規則（鎖死）：
 * 1. active=false 一律濾除
 * 2. 第一排序：rank (asc)
 * 3. 第二排序：displayOrder (asc)
 * 4. 前端不得自行修改 rank 值
 */
import { useMemo } from 'react';
import type { RankingItem } from '../types/dispatchReport';
import { GROUP_ORDER } from '../types/dispatchReport';

export interface SortedRankingGroups {
  all:    RankingItem[];
  byGroup: Record<string, RankingItem[]>;
}

export function useSortedRankingItems(items: RankingItem[]): SortedRankingGroups {
  return useMemo(() => {
    const active = items
      .filter(i => i.active)
      .sort((a, b) => a.rank - b.rank || a.displayOrder - b.displayOrder);

    const byGroup: Record<string, RankingItem[]> = {};
    for (const g of GROUP_ORDER) byGroup[g] = [];
    for (const item of active) {
      const g = item.group ?? 'C';
      if (!byGroup[g]) byGroup[g] = [];
      byGroup[g].push(item);
    }

    return { all: active, byGroup };
  }, [items]);
}
