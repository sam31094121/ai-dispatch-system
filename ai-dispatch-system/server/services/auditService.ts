import { isWrongName } from './nameAliasService.js';

// ── 型別定義 ──
export interface PlatformMember {
  name: string;
  totalCalls: number;
  leadDeals: number;
  followDeals: number;
  followAmount: number;
  refundAmount: number;
  totalRevenueNet: number;
  isNew?: boolean;
}

export interface PlatformSummary {
  totalCalls: number;
  leadDeals: number;
  followDeals: number;
  followAmount: number;
  refundAmount: number;
  totalRevenueNet: number;
}

export interface PlatformReport {
  platformName: string;
  summary: PlatformSummary;
  members: PlatformMember[];
}

export interface InputReportData {
  reportDate: string;
  platforms: PlatformReport[];
}

export interface AuditResult {
  auditResult: 'PASS' | 'FAIL';
  auditPanels: {
    heavenEarth: 'PASS' | 'FAIL';
    logic: 'PASS' | 'FAIL';
    accumulation: 'PASS' | 'FAIL';
  };
  errors: string[];
}

/**
 * 執行天地盤審計 (Heaven & Earth)
 * 檢查平台 summary 是否等於 members 加總
 */
export function auditHeavenEarth(platforms: PlatformReport[]): { status: 'PASS' | 'FAIL', errors: string[] } {
  let status: 'PASS' | 'FAIL' = 'PASS';
  const errors: string[] = [];

  for (const p of platforms) {
    const sum = {
      totalCalls: 0,
      leadDeals: 0,
      followDeals: 0,
      followAmount: 0,
      refundAmount: 0,
      totalRevenueNet: 0,
    };

    for (const m of p.members) {
      sum.totalCalls += m.totalCalls || 0;
      sum.leadDeals += m.leadDeals || 0;
      sum.followDeals += m.followDeals || 0;
      sum.followAmount += m.followAmount || 0;
      sum.refundAmount += m.refundAmount || 0;
      sum.totalRevenueNet += m.totalRevenueNet || 0;
    }

    const checkFields: (keyof PlatformSummary)[] = [
      'totalCalls', 'leadDeals', 'followDeals',
      'followAmount', 'refundAmount', 'totalRevenueNet'
    ];

    for (const field of checkFields) {
      if (p.summary[field] !== sum[field]) {
        status = 'FAIL';
        errors.push(`${p.platformName} summary.${field} (${p.summary[field]}) 與 members 加總 (${sum[field]}) 不一致`);
      }
    }
  }

  return { status, errors };
}

/**
 * 執行邏輯盤審計 (Logic)
 * 檢查業務矛盾與錯名防呆
 */
export function auditLogic(platforms: PlatformReport[]): { status: 'PASS' | 'FAIL', errors: string[] } {
  let status: 'PASS' | 'FAIL' = 'PASS';
  const errors: string[] = [];

  for (const p of platforms) {
    for (const m of p.members) {
      // 1. 金額為負數
      if (m.totalRevenueNet < 0) {
        status = 'FAIL';
        errors.push(`${p.platformName} 人員 ${m.name} 總業績為負數 (${m.totalRevenueNet})`);
      }

      // 2. leadDeals > 0 但 totalRevenueNet = 0
      if (m.leadDeals > 0 && m.totalRevenueNet === 0) {
        status = 'FAIL';
        errors.push(`${p.platformName} 人員 ${m.name} 有派單成交 (${m.leadDeals}) 但總業績為 0`);
      }

      // 3. followDeals > 0 但 totalRevenueNet = 0
      if (m.followDeals > 0 && m.totalRevenueNet === 0) {
        status = 'FAIL';
        errors.push(`${p.platformName} 人員 ${m.name} 有續單成交 (${m.followDeals}) 但總業績為 0`);
      }

      // 4. totalCalls = 0 但 leadDeals > 0
      if (m.totalCalls === 0 && m.leadDeals > 0) {
         // 雖然規格寫「警示或 FAIL (依商業規則)」，此處採用嚴格 FAIL，確保資料乾淨
        status = 'FAIL';
        errors.push(`${p.platformName} 人員 ${m.name} 通數為 0 但有派單成交 (${m.leadDeals})`);
      }

      // 5. 錯名字樣進榜 (規格5: 徐華好 視為資料錯誤)
      if (isWrongName(m.name)) {
        status = 'FAIL';
        errors.push(`${p.platformName} 偵測到禁用的錯誤姓名: "${m.name}"`);
      }
    }
  }

  return { status, errors };
}

/**
 * 執行累積盤審計 (Accumulation)
 * 驗算三平台 Summary 加總是否等於 整合總盤 (Merged Total)
 */
export function auditAccumulation(platforms: PlatformReport[], mergedTotal: PlatformSummary): { status: 'PASS' | 'FAIL', errors: string[] } {
  let status: 'PASS' | 'FAIL' = 'PASS';
  const errors: string[] = [];

  const platformSum = {
    totalCalls: 0,
    leadDeals: 0,
    followDeals: 0,
    followAmount: 0,
    refundAmount: 0,
    totalRevenueNet: 0,
  };

  for (const p of platforms) {
    platformSum.totalCalls += p.summary.totalCalls;
    platformSum.leadDeals += p.summary.leadDeals;
    platformSum.followDeals += p.summary.followDeals;
    platformSum.followAmount += p.summary.followAmount;
    platformSum.refundAmount += p.summary.refundAmount;
    platformSum.totalRevenueNet += p.summary.totalRevenueNet;
  }

  const checkFields: (keyof PlatformSummary)[] = [
    'totalCalls', 'leadDeals', 'followDeals',
    'followAmount', 'refundAmount', 'totalRevenueNet'
  ];

  for (const field of checkFields) {
    if (mergedTotal[field] !== platformSum[field]) {
      status = 'FAIL';
      errors.push(`整合總盤 ${field} (${mergedTotal[field]}) 與三平台 Summary 加總 (${platformSum[field]}) 不一致`);
    }
  }

  return { status, errors };
}

/**
 * 執行完整審計流程
 */
export function executeFullAudit(input: InputReportData, mergedTotal?: PlatformSummary): AuditResult {
  const errors: string[] = [];

  const heavenResult = auditHeavenEarth(input.platforms);
  errors.push(...heavenResult.errors);

  const logicResult = auditLogic(input.platforms);
  errors.push(...logicResult.errors);

  let accumulationResult: { status: 'PASS' | 'FAIL', errors: string[] } = { status: 'PASS', errors: [] };
  if (mergedTotal) {
    accumulationResult = auditAccumulation(input.platforms, mergedTotal);
    errors.push(...accumulationResult.errors);
  } else {
    // 若未傳入，先預設為 PASS (或在此計算一個 temporary 合併總和)
    accumulationResult.status = 'PASS';
  }

  const finalResult: 'PASS' | 'FAIL' = (heavenResult.status === 'PASS' && logicResult.status === 'PASS' && accumulationResult.status === 'PASS') ? 'PASS' : 'FAIL';

  return {
    auditResult: finalResult,
    auditPanels: {
      heavenEarth: heavenResult.status,
      logic: logicResult.status,
      accumulation: accumulationResult.status,
    },
    errors: errors,
  };
}
