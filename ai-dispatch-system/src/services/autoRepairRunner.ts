// ════════════════════════════════════════════════════
// 前端系統自動維修引擎（單例快取）
// 首頁進入時自動執行，所有元件共用維修後結果
// ════════════════════════════════════════════════════

import {
  runAutoRepair,
  NAV_GROUPS,
  type AutoRepairResult,
  type CenterConfig,
  type NavGroupConfig,
} from '../constants/moduleConfig';

// ─── 維修紀錄型別 ───
export interface RepairLogEntry {
  timestamp: string;
  action: string;
  detail: string;
}

// ─── 快取 ───
let _cachedResult: AutoRepairResult | null = null;
let _repairLog: RepairLogEntry[] = [];
let _repairTimestamp: string = '';

/**
 * 執行前端系統自動維修（帶快取）
 * 首次呼叫時執行完整維修，之後直接回傳快取結果
 */
export function getRepairResult(): AutoRepairResult {
  if (_cachedResult) return _cachedResult;

  const now = new Date().toISOString();
  _repairTimestamp = now;
  _repairLog = [];

  _repairLog.push({
    timestamp: now,
    action: '啟動前端自動維修',
    detail: '系統開始偵測模組衝突、重複路徑、同類別、同功能群…',
  });

  const result = runAutoRepair();
  _cachedResult = result;

  // 記錄衝突處理
  for (const conflict of result.conflictRecords) {
    _repairLog.push({
      timestamp: now,
      action: `衝突處理：${conflict.conflictType}`,
      detail: conflict.explanation,
    });
  }

  // 記錄停用模組
  for (const log of result.disabledLog) {
    _repairLog.push({
      timestamp: now,
      action: `停用模組：${log.oldName}`,
      detail: `${log.reason}（功能合併至 ${log.retainedCenterKey}）`,
    });
  }

  // 記錄合併功能
  for (const merge of result.mergedFeatures) {
    _repairLog.push({
      timestamp: now,
      action: `功能合併：${merge.oldName}`,
      detail: `${merge.reason}（→ ${merge.newCenterKey}）`,
    });
  }

  // 記錄摘要
  for (const line of result.summary) {
    _repairLog.push({
      timestamp: now,
      action: '維修摘要',
      detail: line,
    });
  }

  console.log('═══════════════════════════════════════════');
  console.log('   前端系統自動維修完成');
  console.log(`   保留中心：${result.activeCenters.length} 個`);
  console.log(`   停用模組：${result.disabledLog.length} 個`);
  console.log(`   衝突處理：${result.conflictRecords.length} 批`);
  console.log(`   功能合併：${result.mergedFeatures.length} 項`);
  console.log('═══════════════════════════════════════════');

  return result;
}

/** 取得保留後的中心清單（首頁卡片、路由表共用） */
export function getActiveCenters(): CenterConfig[] {
  return getRepairResult().activeCenters;
}

/** 取得保留後的中心 key Set（快速查詢用） */
export function getActiveCenterKeys(): Set<string> {
  return new Set(getActiveCenters().map((c) => c.key));
}

/** 取得篩選後的導覽群組（只保留有可用中心的群組） */
export function getActiveNavGroups(): NavGroupConfig[] {
  const activeKeys = getActiveCenterKeys();
  return NAV_GROUPS
    .map((group) => ({
      ...group,
      centerKeys: group.centerKeys.filter((k) => activeKeys.has(k)),
    }))
    .filter((group) => group.centerKeys.length > 0)
    .sort((a, b) => a.order - b.order);
}

/** 取得維修紀錄 */
export function getRepairLog(): RepairLogEntry[] {
  // 確保已執行維修
  getRepairResult();
  return _repairLog;
}

/** 取得維修時間 */
export function getRepairTimestamp(): string {
  getRepairResult();
  return _repairTimestamp;
}

/** 強制重新執行維修（清除快取） */
export function forceReRunRepair(): AutoRepairResult {
  _cachedResult = null;
  _repairLog = [];
  _repairTimestamp = '';
  return getRepairResult();
}

/** 檢查某個中心是否在保留清單中 */
export function isCenterActive(key: string): boolean {
  return getActiveCenterKeys().has(key);
}
