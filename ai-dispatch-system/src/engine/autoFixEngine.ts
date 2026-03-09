import type { AutoFixRecord, ConflictItem } from '../types/report';

/**
 * ═══════════════════════════════════════════
 * 衝突分級自動修正引擎
 * A級：自動修正 → B級：建議修正 → C級：禁止修正
 * ═══════════════════════════════════════════
 */

let fixCounter = 0;
function nextFixId() { return `fix_${++fixCounter}`; }

// ── A級：格式清洗（自動修正） ──

/** 全形數字→半形 */
function normalizeFullWidth(text: string): { text: string; fixes: AutoFixRecord[] } {
  const fixes: AutoFixRecord[] = [];
  const fullDigits = '０１２３４５６７８９';
  let result = text;
  for (let i = 0; i < fullDigits.length; i++) {
    if (result.includes(fullDigits[i])) {
      const before = result;
      result = result.split(fullDigits[i]).join(String(i));
      fixes.push({
        id: nextFixId(), level: 'A', category: '全形半形',
        field: '文字', before: fullDigits[i], after: String(i),
        description: `全形數字「${fullDigits[i]}」→ 半形「${i}」`,
        autoApplied: true, timestamp: new Date().toISOString(),
      });
    }
  }
  return { text: result, fixes };
}

/** 前後空白清理 */
function trimWhitespace(name: string): { name: string; fix: AutoFixRecord | null } {
  const trimmed = name.replace(/\s+/g, ' ').trim();
  if (trimmed !== name) {
    return {
      name: trimmed,
      fix: {
        id: nextFixId(), level: 'A', category: '空白清理',
        field: name, before: `"${name}"`, after: `"${trimmed}"`,
        description: `姓名前後空白已清除`,
        autoApplied: true, timestamp: new Date().toISOString(),
      },
    };
  }
  return { name, fix: null };
}

/** 括號格式統一 (半形→全形) */
function normalizeBrackets(text: string): { text: string; fixes: AutoFixRecord[] } {
  const fixes: AutoFixRecord[] = [];
  let result = text;

  // (新人) → （新人）
  const bracketRegex = /\(([^)]+)\)/g;
  let match;
  while ((match = bracketRegex.exec(text)) !== null) {
    const before = match[0];
    const after = `（${match[1]}）`;
    result = result.replace(before, after);
    fixes.push({
      id: nextFixId(), level: 'A', category: '括號格式',
      field: '括號', before, after,
      description: `半形括號 ${before} → 全形 ${after}`,
      autoApplied: true, timestamp: new Date().toISOString(),
    });
  }
  return { text: result, fixes };
}

/** 欄位名稱同義字統一 */
function normalizeFieldNames(text: string): { text: string; fixes: AutoFixRecord[] } {
  const fixes: AutoFixRecord[] = [];
  const synonyms: [RegExp, string, string][] = [
    [/追續成交總通數/g, '追單', '追續成交總通數→追單'],
    [/追續成交/g, '追單', '追續成交→追單'],
    [/追續單金額/g, '續單', '追續單金額→續單'],
    [/當月總業績/g, '總業績', '當月總業績→總業績'],
    [/當月業績/g, '總業績', '當月業績→總業績'],
    [/今日取消退貨/g, '退貨', '今日取消退貨→退貨'],
  ];
  let result = text;
  for (const [pattern, replacement, desc] of synonyms) {
    if (pattern.test(result)) {
      result = result.replace(pattern, replacement);
      fixes.push({
        id: nextFixId(), level: 'A', category: '欄位名稱統一',
        field: '欄位', before: desc.split('→')[0], after: replacement,
        description: desc, autoApplied: true, timestamp: new Date().toISOString(),
      });
    }
  }
  return { text: result, fixes };
}

// ── B級：建議修正（需人工確認） ──

/** 偵測疑似同人不同寫法 */
function detectNameVariants(names: string[]): ConflictItem[] {
  const conflicts: ConflictItem[] = [];
  for (let i = 0; i < names.length; i++) {
    for (let j = i + 1; j < names.length; j++) {
      const a = names[i], b = names[j];
      // 只差一個字
      if (a.length === b.length && a.length >= 2) {
        let diff = 0;
        for (let k = 0; k < a.length; k++) { if (a[k] !== b[k]) diff++; }
        if (diff === 1) {
          conflicts.push({
            id: nextFixId(), level: 'B', category: '姓名疑似相同',
            field: `${a} / ${b}`,
            message: `「${a}」和「${b}」只差一個字，是否為同一人？`,
            suggestion: `請確認是否合併為同一姓名`,
            resolved: false,
          });
        }
      }
    }
  }
  return conflicts;
}

/** 偵測新人標記不一致 */
function detectNewTagVariant(text: string): ConflictItem[] {
  const conflicts: ConflictItem[] = [];
  // 多種新人標記格式
  const patterns = [/\(新人\)/, /（新人）/, /-新人/, /＿新人/];
  const found: string[] = [];
  for (const p of patterns) {
    if (p.test(text)) found.push(p.source);
  }
  if (found.length > 1) {
    conflicts.push({
      id: nextFixId(), level: 'B', category: '新人標記格式',
      field: '新人標記', message: `新人標記格式不一致：${found.join(' 與 ')}`,
      suggestion: '建議統一為（新人）',
      resolved: false,
    });
  }
  return conflicts;
}

// ── C級：禁止修正（鎖死提示） ──

/** 偵測金額相關的嚴重衝突 */
function detectAmountConflicts(
  details: { employeeName: string; revenue: number; actual: number; dispatchDeals: number; followAmount: number }[],
  totals: { totalRevenue: number; totalFollowAmount: number; totalDispatchDeals: number; totalActual: number }
): ConflictItem[] {
  const conflicts: ConflictItem[] = [];

  // 總計 vs 加總
  const sumRevenue = details.reduce((s, d) => s + d.revenue, 0);
  if (totals.totalRevenue !== sumRevenue) {
    conflicts.push({
      id: nextFixId(), level: 'C', category: '金額不一致',
      field: '總業績',
      message: `總業績 ${totals.totalRevenue.toLocaleString()} ≠ 個人加總 ${sumRevenue.toLocaleString()}（差額 ${(totals.totalRevenue - sumRevenue).toLocaleString()}）`,
      originalValue: totals.totalRevenue, suggestedValue: sumRevenue,
      resolved: false,
    });
  }

  const sumFollow = details.reduce((s, d) => s + d.followAmount, 0);
  if (totals.totalFollowAmount !== sumFollow) {
    conflicts.push({
      id: nextFixId(), level: 'C', category: '金額不一致',
      field: '續單金額',
      message: `續單總金額 ${totals.totalFollowAmount.toLocaleString()} ≠ 個人加總 ${sumFollow.toLocaleString()}`,
      originalValue: totals.totalFollowAmount, suggestedValue: sumFollow,
      resolved: false,
    });
  }

  // 邏輯矛盾
  for (const d of details) {
    if (d.dispatchDeals > 0 && d.revenue === 0) {
      conflicts.push({
        id: nextFixId(), level: 'C', category: '邏輯矛盾',
        field: d.employeeName,
        message: `有追單 ${d.dispatchDeals} 但業績為 0`,
        resolved: false,
      });
    }
    if (d.followAmount > 0 && d.revenue === 0) {
      conflicts.push({
        id: nextFixId(), level: 'C', category: '邏輯矛盾',
        field: d.employeeName,
        message: `有續單 $${d.followAmount.toLocaleString()} 但業績為 0`,
        resolved: false,
      });
    }
    if (d.actual > d.revenue && d.revenue > 0) {
      conflicts.push({
        id: nextFixId(), level: 'C', category: '邏輯矛盾',
        field: d.employeeName,
        message: `實收 $${d.actual.toLocaleString()} > 總業績 $${d.revenue.toLocaleString()}`,
        resolved: false,
      });
    }
  }

  return conflicts;
}

// ═══════════════════════════════════════════
// 主函數：完整衝突分析
// ═══════════════════════════════════════════

export interface AutoFixResult {
  cleanedText: string;
  autoFixRecords: AutoFixRecord[];  // A級已自動修正
  conflicts: ConflictItem[];        // B+C級待處理
}

/**
 * 執行完整的格式清洗 + 衝突偵測
 * 流程：A級清洗 → B級偵測 → C級偵測
 */
export function runAutoFix(
  rawText: string,
  details: { employeeName: string; revenue: number; actual: number; dispatchDeals: number; followAmount: number }[],
  totals: { totalRevenue: number; totalFollowAmount: number; totalDispatchDeals: number; totalActual: number }
): AutoFixResult {
  fixCounter = 0;
  let text = rawText;
  const allFixes: AutoFixRecord[] = [];
  const allConflicts: ConflictItem[] = [];

  // ── 步驟 1：A 級格式清洗 ──
  const fw = normalizeFullWidth(text);
  text = fw.text; allFixes.push(...fw.fixes);

  const br = normalizeBrackets(text);
  text = br.text; allFixes.push(...br.fixes);

  const fn = normalizeFieldNames(text);
  text = fn.text; allFixes.push(...fn.fixes);

  // 姓名空白清理（在 details 上操作）
  for (const d of details) {
    const tw = trimWhitespace(d.employeeName);
    if (tw.fix) {
      d.employeeName = tw.name;
      allFixes.push(tw.fix);
    }
  }

  // ── 步驟 2：B 級偵測 ──
  const names = details.map(d => d.employeeName);
  allConflicts.push(...detectNameVariants(names));
  allConflicts.push(...detectNewTagVariant(text));

  // ── 步驟 3：C 級偵測 ──
  allConflicts.push(...detectAmountConflicts(details, totals));

  return {
    cleanedText: text,
    autoFixRecords: allFixes,
    conflicts: allConflicts,
  };
}

/**
 * 判斷是否有未解決的 C 級衝突
 */
export function hasUnresolvedCritical(conflicts: ConflictItem[]): boolean {
  return conflicts.some(c => c.level === 'C' && !c.resolved);
}
