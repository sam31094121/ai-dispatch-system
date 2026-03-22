/**
 * clipboardFormatter — 所有複製文案的唯一生成點
 *
 * 規則：
 * - 所有複製文字必須從此模組產生
 * - 元件只呼叫 copy(clipboardFormatter.xxx(item))
 * - 禁止在元件內拼接複製字串
 */
import type { RankingItem, ReportMeta, SummaryMetric, FooterAction } from '../types/dispatchReport';

/** 點擊姓名 → 個人 AI 點評（私訊格式） */
export function fmtPersonalAssessment(item: RankingItem): string {
  const lines = [
    `【${item.name}】第 ${item.rank} 名`,
    item.aiAnalysis,
  ];
  if (item.suggestion)      lines.push(`建議：${item.suggestion}`);
  if (item.pressureMessage) lines.push(item.pressureMessage);
  if (item.actionMessage)   lines.push(item.actionMessage);
  return lines.filter(Boolean).join('\n');
}

/** 點擊 RankingCard → 主管短版摘要 */
export function fmtManagerSummary(item: RankingItem): string {
  return `${item.rank}. ${item.name}（${item.group}）$${item.totalRevenue.toLocaleString()} — ${(item.aiAnalysis || item.actionMessage).slice(0, 60)}…`;
}

/** 點擊梯隊標籤 → 全組名單 */
export function fmtGroupList(group: string, groupLabel: string, items: RankingItem[]): string {
  const names = items.filter(i => i.group === group && i.active).map(i => i.name).join('、');
  return `【${groupLabel}】\n${names}`;
}

/** 點擊 SummaryMetric → 總盤摘要 */
export function fmtSummaryMetric(meta: ReportMeta, metrics: SummaryMetric[]): string {
  const lines = [`📣【AI 派單公告｜${meta.dateLabel} 結算 → ${meta.nextDate} 派單順序】`];
  for (const m of metrics.sort((a, b) => a.displayOrder - b.displayOrder)) {
    lines.push(`${m.label}：${typeof m.value === 'number' ? m.value.toLocaleString() : m.value}${m.unit ?? ''}`);
  }
  return lines.join('\n');
}

/** 點擊 AckPanel → 確認指示文字 */
export function fmtAckInstruction(action: FooterAction): string {
  return `${action.instruction}\n${action.fallbackText}`;
}
