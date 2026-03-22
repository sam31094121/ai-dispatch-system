/** rankingFormatter — RankingItem → RankingCardVM */
import type { RankingItem, RankingCardVM } from '../types/dispatchReport';
import { GROUP_COLORS } from '../types/dispatchReport';
import { fmtPersonalAssessment } from './clipboardFormatter';

export function toRankingCardVM(item: RankingItem): RankingCardVM {
  return {
    rank:            item.rank,
    name:            item.name,
    isNewcomer:      item.isNewcomer,
    group:           item.group,
    groupColor:      GROUP_COLORS[item.group] ?? '#00d4ff',
    summaryTitle:    item.summaryTitle ?? (item.rank === 1 ? '穩居榜首' : `第 ${item.rank} 名`),
    aiAnalysis:      item.aiAnalysis,
    suggestion:      item.suggestion,
    focusMetrics:    item.focusMetrics,
    pressureMessage: item.pressureMessage,
    actionMessage:   item.actionMessage,
    tags:            item.tags,
    totalRevenue:    item.totalRevenue,
    displayOrder:    item.displayOrder,
    copyText:        fmtPersonalAssessment(item),
  };
}

export function toRankingCardVMs(items: RankingItem[]): RankingCardVM[] {
  return items.map(toRankingCardVM);
}
