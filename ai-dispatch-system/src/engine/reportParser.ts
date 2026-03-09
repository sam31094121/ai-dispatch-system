import type { ParsedDetail, ParsedTotals } from '../types/report';

/**
 * 解析使用者貼入的原始業績報表文字
 * 
 * 支援的格式：
 * 1. 標準格式：N、姓名｜【追單】X｜【續單】Y｜【總業績】Z｜【實收】W
 * 2. 帶（新人）標記
 * 3. 數字含千分位逗號
 */
export function parseReportText(text: string): {
  details: ParsedDetail[];
  totals: ParsedTotals;
} {
  const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
  const details: ParsedDetail[] = [];

  for (const line of lines) {
    const parsed = parseEmployeeLine(line);
    if (parsed) {
      details.push(parsed);
    }
  }

  // 自動算總計
  const totals: ParsedTotals = {
    totalDispatchDeals: details.reduce((s, d) => s + d.dispatchDeals, 0),
    totalFollowAmount: details.reduce((s, d) => s + d.followAmount, 0),
    totalRevenue: details.reduce((s, d) => s + d.revenue, 0),
    totalActual: details.reduce((s, d) => s + d.actual, 0),
    totalCancelReturn: details.reduce((s, d) => s + d.cancelReturn, 0),
    employeeCount: details.length,
  };

  return { details, totals };
}

/**
 * 解析單行員工資料
 */
function parseEmployeeLine(line: string): ParsedDetail | null {
  // 格式：N、姓名（新人）｜【追單】X｜【續單】Y,YYY｜【總業績】Z,ZZZ｜【實收】W,WWW
  // 也支援：N. 姓名 | 【追單】X | ...

  // Step 1: 嘗試匹配排名 + 姓名
  const nameMatch = line.match(/^(\d+)[、.\s]+([^\s｜|【]+)/);
  if (!nameMatch) return null;

  const rawName = nameMatch[2].trim();
  
  // 判斷是否為新人
  const isNew = rawName.includes('新人') || line.includes('新人');
  const employeeName = rawName.replace(/[（(]新人[）)]/g, '').trim();

  // Step 2: 提取各欄位數字
  const dispatchDeals = extractNumber(line, '追單');
  const followAmount = extractNumber(line, '續單');
  const revenue = extractNumber(line, '總業績');
  const actual = extractNumber(line, '實收');
  const cancelReturn = extractNumber(line, '退貨') ?? extractNumber(line, '取消') ?? 0;

  // 如果連追單和總業績都解析不到，則跳過
  if (dispatchDeals === null && revenue === null) return null;

  const detail: ParsedDetail = {
    id: String(details_counter++),
    employeeName,
    employeeRole: isNew ? '新人' : '一般',
    dispatchDeals: dispatchDeals ?? 0,
    followAmount: followAmount ?? 0,
    revenue: revenue ?? 0,
    actual: actual ?? 0,
    cancelReturn: cancelReturn,
  };

  // 自動生成警告
  if (detail.cancelReturn > 0) {
    detail._warnings = [`退貨 ${detail.cancelReturn} 筆，需留意`];
  }
  if (detail.dispatchDeals > 0 && detail.revenue === 0) {
    detail._errors = ['追單 > 0 但業績為 0'];
  }

  return detail;
}

let details_counter = 1;

/**
 * 從文字中提取指定欄位的數字值
 * 支援千分位逗號
 */
function extractNumber(text: string, fieldName: string): number | null {
  // 匹配 【fieldName】數字 或 fieldName: 數字 等格式
  const patterns = [
    new RegExp(`【${fieldName}】\\s*([\\d,]+\\.?\\d*)`, 'i'),
    new RegExp(`${fieldName}[：:]\\s*([\\d,]+\\.?\\d*)`, 'i'),
    new RegExp(`${fieldName}\\s+([\\d,]+\\.?\\d*)`, 'i'),
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      return parseFormattedNumber(match[1]);
    }
  }
  return null;
}

/**
 * 將帶千分位的字串轉為數字
 */
function parseFormattedNumber(str: string): number {
  return Number(str.replace(/,/g, ''));
}

/**
 * 重置解析器計數器（每次新解析時呼叫）
 */
export function resetParserCounter() {
  details_counter = 1;
}
