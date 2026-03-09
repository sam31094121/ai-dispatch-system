import type { EngineParsedResult, AuditItem, LegacyAuditResult } from '../types/report';

/**
 * ═══════════════════════════════════════════
 * AI 審計引擎（骨牌/蝴蝶效應防呆版）
 *
 * 流程：天地盤 → 邏輯盤 → 姓名 → 完整性
 * 若有 C 級未解衝突 → canProceedToRanking = false
 * ═══════════════════════════════════════════
 */

function checkSkyGround(data: EngineParsedResult): AuditItem[] {
  const items: AuditItem[] = [];
  const d = data.details;
  const checks: { field: string; totalVal: number; sumExpr: (r: typeof d[0]) => number }[] = [
    { field: '總業績', totalVal: data.totals.totalRevenue, sumExpr: r => r.revenue },
    { field: '續單金額', totalVal: data.totals.totalFollowAmount, sumExpr: r => r.followAmount },
    { field: '追單數', totalVal: data.totals.totalDispatchDeals, sumExpr: r => r.dispatchDeals },
    { field: '實收', totalVal: data.totals.totalActual, sumExpr: r => r.actual },
    { field: '退貨', totalVal: data.totals.totalCancelReturn, sumExpr: r => r.cancelReturn },
  ];
  checks.forEach(({ field, totalVal, sumExpr }) => {
    const sum = d.reduce((acc, r) => acc + sumExpr(r), 0);
    if (totalVal !== sum) {
      items.push({
        id: `sky_${field}`, auditType: '天地盤', severity: 'error', field,
        message: `${field}總計(${totalVal.toLocaleString()}) ≠ 個人加總(${sum.toLocaleString()})`,
        originalValue: totalVal, expectedValue: sum, difference: totalVal - sum,
        suggestion: `建議將總計修改為 ${sum.toLocaleString()}`,
      });
    }
  });
  return items;
}

function checkLogic(data: EngineParsedResult): AuditItem[] {
  const items: AuditItem[] = [];
  data.details.forEach(r => {
    if (r.dispatchDeals > 0 && r.revenue === 0)
      items.push({ id: `logic_d_${r.id}`, auditType: '邏輯盤', severity: 'error', field: r.employeeName, message: `追單 ${r.dispatchDeals} 筆但總業績為 0` });
    if (r.followAmount > 0 && r.revenue === 0)
      items.push({ id: `logic_f_${r.id}`, auditType: '邏輯盤', severity: 'error', field: r.employeeName, message: `續單 $${r.followAmount.toLocaleString()} 但總業績為 0` });
    if (r.cancelReturn > 0)
      items.push({ id: `logic_c_${r.id}`, auditType: '邏輯盤', severity: 'warning', field: r.employeeName, message: `有 ${r.cancelReturn} 筆退貨，需留意` });
    if (r.actual > r.revenue && r.revenue > 0)
      items.push({ id: `logic_a_${r.id}`, auditType: '邏輯盤', severity: 'error', field: r.employeeName, message: `實收 $${r.actual.toLocaleString()} > 總業績 $${r.revenue.toLocaleString()}` });
  });
  return items;
}

function checkNames(data: EngineParsedResult, bannedNames: string[] = []): AuditItem[] {
  const items: AuditItem[] = [];
  const seen = new Set<string>();
  data.details.forEach((d, i) => {
    if (seen.has(d.employeeName))
      items.push({ id: `name_dup_${i}`, auditType: '姓名檢查', severity: 'error', field: d.employeeName, message: `姓名「${d.employeeName}」重複出現` });
    seen.add(d.employeeName);
    if (bannedNames.includes(d.employeeName))
      items.push({ id: `name_ban_${i}`, auditType: '姓名檢查', severity: 'error', field: d.employeeName, message: `姓名在禁用名單中` });
  });
  return items;
}

function checkCompleteness(data: EngineParsedResult): AuditItem[] {
  const items: AuditItem[] = [];
  if (!data.date) items.push({ id: 'comp_date', auditType: '欄位完整性', severity: 'error', field: '日期', message: '缺少日期' });
  if (!data.platform) items.push({ id: 'comp_plat', auditType: '欄位完整性', severity: 'error', field: '平台', message: '缺少平台' });
  if (data.details.length === 0) items.push({ id: 'comp_det', auditType: '欄位完整性', severity: 'error', field: '個人明細', message: '缺少個人明細' });
  return items;
}

/**
 * 執行完整 AI 審計
 * 骨牌效應防呆：若有 C 級未解衝突，canProceedToRanking = false
 */
export function runFullAudit(data: EngineParsedResult, bannedNames: string[] = []): LegacyAuditResult {
  const allItems: AuditItem[] = [
    ...checkCompleteness(data),
    ...checkSkyGround(data),
    ...checkLogic(data),
    ...checkNames(data, bannedNames),
  ];

  const hasErrors = allItems.some(i => i.severity === 'error');
  const hasWarnings = allItems.some(i => i.severity === 'warning');

  // ── 骨牌效應防呆 ──
  // 檢查是否有未解決的 C 級衝突
  const hasUnresolvedC = (data.conflicts ?? []).some(c => c.level === 'C' && !c.resolved);

  return {
    status: hasErrors ? 'FAIL' : hasWarnings ? 'WARNING' : 'PASS',
    items: allItems,
    passedAt: !hasErrors ? new Date().toISOString() : undefined,
    canProceedToRanking: !hasErrors && !hasUnresolvedC,
  };
}
