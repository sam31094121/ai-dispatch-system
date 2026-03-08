// ==========================================
// AI 分析引擎 - 戰力分數計算與派單分組
// ==========================================
import { type Employee, aiSuggestions } from '../data/mockData';

/**
 * 戰力分數公式 (V50 規格)：
 * 成交能力 * 0.30 + 續單能力 * 0.20 + 追單能力 * 0.15
 * + 客單價能力 * 0.15 + 穩定度 * 0.10 + 即時狀態 * 0.10
 */
export function calculateAiScores(employees: Employee[]): Employee[] {
  const maxTotal = Math.max(...employees.map(e => e.total), 1);
  const maxRenewals = Math.max(...employees.map(e => e.renewals), 1);
  const maxFollowUps = Math.max(...employees.map(e => e.followUps), 1);
  const avgTotal = employees.reduce((s, e) => s + e.total, 0) / employees.length;

  return employees.map(emp => {
    // 各維度指標正規化到 0~100
    const closeRate = (emp.total / maxTotal) * 100;
    const renewalRate = emp.total > 0 ? (emp.renewals / emp.total) * 100 : 0;
    const followUpRate = (emp.followUps / maxFollowUps) * 100;
    const avgOrderValue = emp.followUps > 0
      ? Math.min((emp.total / emp.followUps) / 500, 100)
      : 0;
    const stability = Math.min((emp.total / avgTotal) * 50, 100);
    const todayState = emp.total >= avgTotal ? 80 : (emp.total / avgTotal) * 80;

    // 加權戰力分數
    const aiScore = Math.round(
      closeRate * 0.30 +
      renewalRate * 0.20 +
      followUpRate * 0.15 +
      avgOrderValue * 0.15 +
      stability * 0.10 +
      todayState * 0.10
    );

    return {
      ...emp,
      aiScore: Math.min(aiScore, 100),
      closeRate: Math.round(closeRate * 10) / 10,
      renewalRate: Math.round(renewalRate * 10) / 10,
      followUpRate: Math.round(followUpRate * 10) / 10,
      avgOrderValue: emp.followUps > 0 ? Math.round(emp.total / emp.followUps) : 0,
      stability: Math.round(stability * 10) / 10,
      suggestion: aiSuggestions[emp.name] || '保持穩定輸出，持續追單。',
    };
  }).sort((a, b) => (b.aiScore ?? 0) - (a.aiScore ?? 0));
}

/**
 * AI 派單分組邏輯 (V50 規格)：
 * A1 = 戰力前 20% 或總業績高於門檻 → 高單主力
 * A2 = 追單/續單能力高 → 續單收割
 * B  = 中間穩定輸出者 → 一般量單
 * C  = 業績低或新人 → 補位樓梯
 */
export function assignGroups(employees: Employee[]): Employee[] {
  const total = employees.length;
  const a1Count = Math.max(Math.round(total * 0.20), 1);
  const a2Count = Math.round(total * 0.25);
  const cThreshold = 15000; // C 組門檻

  return employees.map((emp, i) => {
    let group: string;
    if (i < a1Count) {
      group = 'A1';
    } else if (i < a1Count + a2Count) {
      group = 'A2';
    } else if (emp.total <= cThreshold) {
      group = 'C';
    } else {
      group = 'B';
    }
    return { ...emp, group };
  });
}

/** 計算公司健康度 (0~100) */
export function calcHealthScore(employees: Employee[]): number {
  const totalRev = employees.reduce((s, e) => s + e.total, 0);
  const avgRev = totalRev / employees.length;
  const activeRatio = employees.filter(e => e.followUps > 0).length / employees.length;
  const topHeavy = employees.slice(0, 4).reduce((s, e) => s + e.total, 0) / totalRev;
  // 健康度 = 活躍率 * 40 + (1 - 過度集中度) * 30 + 平均產值正規化 * 30
  const score = activeRatio * 40 + (1 - topHeavy) * 30 + Math.min(avgRev / 200000, 1) * 30;
  return Math.round(Math.min(score * 1.2, 100));
}

/** 解析使用者貼上的業績文字 */
export function parsePerformanceText(text: string): Employee[] {
  const regex = /(\d+)[.、]\s*([^｜|\s]+)[｜|]【追單】(\d+)[｜|]【續單】([\d,]+)[｜|]【總業績】([\d,]+)[｜|]【實收】([\d,]+)/g;
  const results: Employee[] = [];
  let match;
  while ((match = regex.exec(text)) !== null) {
    results.push({
      rank: parseInt(match[1]),
      name: match[2],
      followUps: parseInt(match[3]),
      renewals: parseInt(match[4].replace(/,/g, '')),
      total: parseInt(match[5].replace(/,/g, '')),
      actual: parseInt(match[6].replace(/,/g, '')),
    });
  }
  return results;
}

/** 依分組取得顏色 */
export function getGroupColor(g?: string) {
  switch (g) {
    case 'A1': return { bg: 'bg-red-500', text: 'text-red-700', light: 'bg-red-50', border: 'border-red-200', label: '🔴 高單主力' };
    case 'A2': return { bg: 'bg-orange-500', text: 'text-orange-700', light: 'bg-orange-50', border: 'border-orange-200', label: '🟠 續單收割' };
    case 'B': return { bg: 'bg-yellow-500', text: 'text-yellow-700', light: 'bg-yellow-50', border: 'border-yellow-200', label: '🟡 一般量單' };
    case 'C': return { bg: 'bg-green-500', text: 'text-green-700', light: 'bg-green-50', border: 'border-green-200', label: '🟢 補位樓梯' };
    default: return { bg: 'bg-slate-500', text: 'text-slate-700', light: 'bg-slate-50', border: 'border-slate-200', label: '未分組' };
  }
}
