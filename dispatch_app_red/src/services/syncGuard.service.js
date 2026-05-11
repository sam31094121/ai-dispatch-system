/**
 * Zhaogui AI Dispatch — 同步守衛服務 (Sync Guard Service)
 * 
 * 【永久鎖死架構】
 * 後端總機為唯一資料核心。所有前端（桌機、手機、會議室）只讀同一份正式結果。
 * 本服務負責：
 *   1. 正式版本號追蹤與生成
 *   2. 前端連線狀態監控
 *   3. 同步一致性檢查
 *   4. 自動維修 → 自動恢復 → 自動升級 級聯鏈
 *   5. 完整日誌記錄
 */

const fs = require('fs');
const path = require('path');
const logger = require('../utils/logger');
const { appConfig } = require('../config/appConfig');

// ─── 常量 ───
const SYNC_CHECK_INTERVAL_MS = 10_000;   // 每 10 秒檢查一次同步狀態
const CLIENT_TIMEOUT_MS = 60_000;        // 60 秒未心跳視為離線
const MAX_REPAIR_ATTEMPTS = 3;           // 最大維修嘗試次數
const MAX_RECOVERY_ATTEMPTS = 2;         // 最大恢復嘗試次數
const LOG_DIR = path.join(appConfig.projectRoot, 'logs');
const SYNC_LOG_FILE = path.join(LOG_DIR, 'sync-guard.log');

// ─── 狀態枚舉 ───
const SyncStatus = Object.freeze({
  NORMAL: 'NORMAL',           // 正常運作
  RESYNCING: 'RESYNCING',     // 重推送中
  REPAIRING: 'REPAIRING',     // 維修中
  RECOVERING: 'RECOVERING',   // 恢復中
  LOCKED: 'LOCKED',           // 異常鎖定，等待人工
  UPGRADING: 'UPGRADING'      // 升級中
});

const ClientType = Object.freeze({
  DESKTOP: 'desktop',
  MOBILE: 'mobile',
  BROADCAST: 'broadcast'
});

// ─── 核心狀態（單例） ───
const guardState = {
  /** 目前系統同步狀態 */
  status: SyncStatus.NORMAL,
  /** 當前正式資料版本號（由後端生成，所有端必須一致） */
  dataVersion: 0,
  /** 上一版正式資料版本號（回退用） */
  previousDataVersion: 0,
  /** 已連線前端登記表 { clientKey: { type, dataVersion, lastHeartbeat, metadata } } */
  clients: new Map(),
  /** 維修計數器 */
  repairAttempts: 0,
  /** 恢復計數器 */
  recoveryAttempts: 0,
  /** 輪詢計時器 */
  checkTimer: null,
  /** SSE 廣播函式（由外部注入） */
  broadcastFn: null,
  /** 通知資料更新函式（由外部注入） */
  notifyUpdateFn: null,
  /** 上次正式版 latest.json 備份 */
  lastGoodSnapshot: null,
  /** 系統啟動時間 */
  startedAt: new Date().toISOString(),
  /** 連續穩定次數（觸發自動升級用） */
  consecutiveStableChecks: 0,
  /** 升級次數 */
  upgradeCount: 0
};

// ─── 日誌寫入 ───

function ensureLogDir() {
  try {
    fs.mkdirSync(LOG_DIR, { recursive: true });
  } catch { /* ignore */ }
}

/**
 * 寫入同步守衛日誌（追加模式）
 * @param {string} event 事件類型
 * @param {object} detail 事件細節
 */
function writeLog(event, detail = {}) {
  ensureLogDir();
  const entry = {
    timestamp: new Date().toISOString(),
    event,
    status: guardState.status,
    dataVersion: guardState.dataVersion,
    clientCount: guardState.clients.size,
    ...detail
  };

  const line = JSON.stringify(entry) + '\n';

  try {
    fs.appendFileSync(SYNC_LOG_FILE, line, 'utf8');
  } catch (err) {
    logger.error('[SyncGuard] 日誌寫入失敗', { error: err.message });
  }

  // 同時輸出到主 logger
  const logLevel = event.includes('FAIL') || event.includes('ERROR') ? 'error'
    : event.includes('WARN') ? 'warn'
    : 'info';
  logger[logLevel](`[SyncGuard] ${event}`, detail);
}

// ─── 版本管理 ───

/**
 * 生成新的正式版本號。每次後端資料更新時呼叫。
 * @returns {number} 新版本號
 */
function bumpDataVersion() {
  guardState.previousDataVersion = guardState.dataVersion;
  guardState.dataVersion = Date.now();

  writeLog('VERSION_BUMPED', {
    newVersion: guardState.dataVersion,
    previousVersion: guardState.previousDataVersion
  });

  return guardState.dataVersion;
}

/**
 * 取得目前正式版本號
 */
function getDataVersion() {
  return guardState.dataVersion;
}

/**
 * 備份目前正式快照（恢復用）
 */
function backupCurrentSnapshot() {
  try {
    const latestFile = path.join(appConfig.storageRoot, 'latest.json');
    if (fs.existsSync(latestFile)) {
      const content = fs.readFileSync(latestFile, 'utf8');
      guardState.lastGoodSnapshot = JSON.parse(content);
      writeLog('SNAPSHOT_BACKED_UP', { reportId: guardState.lastGoodSnapshot?.report?.reportId });
    }
  } catch (err) {
    writeLog('SNAPSHOT_BACKUP_FAIL', { error: err.message });
  }
}

// ─── 前端連線管理 ───

/**
 * 前端回報自身版本與狀態
 * @param {string} clientKey 唯一客戶端識別碼
 * @param {object} report { type, dataVersion, screenState, metadata }
 */
function reportClientStatus(clientKey, report) {
  const existing = guardState.clients.get(clientKey);
  guardState.clients.set(clientKey, {
    type: report.type || existing?.type || ClientType.DESKTOP,
    dataVersion: report.dataVersion ?? 0,
    lastHeartbeat: Date.now(),
    screenState: report.screenState || 'active',
    metadata: report.metadata || {},
    registeredAt: existing?.registeredAt || new Date().toISOString()
  });
}

/**
 * 移除前端連線
 */
function removeClient(clientKey) {
  guardState.clients.delete(clientKey);
  writeLog('CLIENT_REMOVED', { clientKey });
}

/**
 * 清除超時客戶端
 */
function pruneStaleClients() {
  const now = Date.now();
  const staleKeys = [];

  for (const [key, client] of guardState.clients) {
    if (now - client.lastHeartbeat > CLIENT_TIMEOUT_MS) {
      staleKeys.push(key);
    }
  }

  staleKeys.forEach(key => {
    guardState.clients.delete(key);
    writeLog('CLIENT_PRUNED', { clientKey: key });
  });

  return staleKeys.length;
}

// ─── 同步一致性檢查 ───

/**
 * 檢查所有已連線前端是否與後端版本一致
 * @returns {{ consistent: boolean, mismatchedClients: Array }}
 */
function checkConsistency() {
  const currentVersion = guardState.dataVersion;
  const mismatched = [];

  for (const [key, client] of guardState.clients) {
    if (client.dataVersion !== currentVersion) {
      mismatched.push({
        clientKey: key,
        type: client.type,
        clientVersion: client.dataVersion,
        expectedVersion: currentVersion,
        lastHeartbeat: new Date(client.lastHeartbeat).toISOString()
      });
    }
  }

  return {
    consistent: mismatched.length === 0,
    mismatchedClients: mismatched
  };
}

// ─── 級聯修復鏈 ───

/**
 * 步驟一：重推送 — 透過 SSE 要求所有前端重新抓取資料
 */
function executeResync() {
  if (guardState.status === SyncStatus.LOCKED) {
    writeLog('RESYNC_BLOCKED', { reason: '系統處於 LOCKED 狀態' });
    return false;
  }

  guardState.status = SyncStatus.RESYNCING;
  writeLog('RESYNC_START');

  try {
    // 透過 SSE 廣播「強制同步」事件
    if (guardState.broadcastFn) {
      guardState.broadcastFn({
        type: 'force_sync',
        dataVersion: guardState.dataVersion,
        timestamp: new Date().toISOString(),
        reason: 'sync-guard-resync'
      });
    }

    // 另外觸發 data_updated 確保各端重新抓取
    if (guardState.notifyUpdateFn) {
      guardState.notifyUpdateFn({ source: 'sync-guard-resync' });
    }

    writeLog('RESYNC_PUSHED');
    return true;
  } catch (err) {
    writeLog('RESYNC_FAIL', { error: err.message });
    return false;
  }
}

/**
 * 步驟二：自動維修
 * 鎖版 → 停止異常端寫入 → 重檢版本 → 重推 → 驗證
 */
function executeRepair() {
  if (guardState.repairAttempts >= MAX_REPAIR_ATTEMPTS) {
    writeLog('REPAIR_MAX_EXCEEDED', { attempts: guardState.repairAttempts });
    return false;
  }

  guardState.status = SyncStatus.REPAIRING;
  guardState.repairAttempts += 1;
  writeLog('REPAIR_START', { attempt: guardState.repairAttempts });

  try {
    // 第1步：鎖住當前正式版（備份）
    backupCurrentSnapshot();

    // 第2步：確認後端正式資料完整性
    const latestFile = path.join(appConfig.storageRoot, 'latest.json');
    if (!fs.existsSync(latestFile)) {
      writeLog('REPAIR_FAIL', { reason: 'latest.json 不存在' });
      return false;
    }

    // 第3步：重新生成版本號確保唯一
    bumpDataVersion();

    // 第4步：強制推送到所有前端
    const resyncOk = executeResync();
    if (!resyncOk) {
      writeLog('REPAIR_FAIL', { reason: '重推送失敗' });
      return false;
    }

    // 第5步：寫入維修日誌
    writeLog('REPAIR_PUSHED', { attempt: guardState.repairAttempts });

    // 延遲驗證（給前端時間同步）— 由定期檢查自動完成
    return true;
  } catch (err) {
    writeLog('REPAIR_FAIL', { error: err.message, attempt: guardState.repairAttempts });
    return false;
  }
}

/**
 * 步驟三：自動恢復
 * 確認正式版 → 若損壞則回退 → 全端重抓 → 驗證
 */
function executeRecovery() {
  if (guardState.recoveryAttempts >= MAX_RECOVERY_ATTEMPTS) {
    writeLog('RECOVERY_MAX_EXCEEDED', { attempts: guardState.recoveryAttempts });
    return false;
  }

  guardState.status = SyncStatus.RECOVERING;
  guardState.recoveryAttempts += 1;
  writeLog('RECOVERY_START', { attempt: guardState.recoveryAttempts });

  try {
    const latestFile = path.join(appConfig.storageRoot, 'latest.json');

    // 第1步：檢查目前正式版是否可用
    let currentOk = false;
    try {
      const content = JSON.parse(fs.readFileSync(latestFile, 'utf8'));
      currentOk = Boolean(content?.report?.reportId);
    } catch { /* 損壞 */ }

    // 第2步：若損壞且有備份，回退
    if (!currentOk && guardState.lastGoodSnapshot) {
      writeLog('RECOVERY_ROLLBACK', { toReportId: guardState.lastGoodSnapshot.report?.reportId });
      fs.mkdirSync(path.dirname(latestFile), { recursive: true });
      fs.writeFileSync(latestFile, JSON.stringify(guardState.lastGoodSnapshot, null, 2), 'utf8');
      writeLog('RECOVERY_ROLLBACK_SUCCESS');
    } else if (!currentOk) {
      writeLog('RECOVERY_FAIL', { reason: '正式版損壞且無備份可回退' });
      return false;
    }

    // 第3步：重新生成版本號
    bumpDataVersion();

    // 第4步：全端重推
    executeResync();

    writeLog('RECOVERY_PUSHED', { attempt: guardState.recoveryAttempts });
    return true;
  } catch (err) {
    writeLog('RECOVERY_FAIL', { error: err.message, attempt: guardState.recoveryAttempts });
    return false;
  }
}

/**
 * 進入異常鎖定狀態（級聯修復全部失敗時）
 */
function enterLockedState() {
  guardState.status = SyncStatus.LOCKED;
  writeLog('SYSTEM_LOCKED', {
    reason: '級聯修復鏈全部失敗，保護正式版，等待人工確認',
    repairAttempts: guardState.repairAttempts,
    recoveryAttempts: guardState.recoveryAttempts
  });
}

/**
 * 手動解除鎖定（人工確認後呼叫）
 */
function unlockSystem() {
  guardState.status = SyncStatus.NORMAL;
  guardState.repairAttempts = 0;
  guardState.recoveryAttempts = 0;
  guardState.consecutiveStableChecks = 0;
  writeLog('SYSTEM_UNLOCKED', { operator: 'manual' });
}

// ─── 自動升級 ───

/**
 * 自動穩定性升級（非功能變更）
 * 僅在系統長時間穩定後自動觸發
 */
function executeAutoUpgrade() {
  const STABLE_THRESHOLD = 100; // 連續 100 次穩定檢查後才可升級

  if (guardState.consecutiveStableChecks < STABLE_THRESHOLD) return false;
  if (guardState.status !== SyncStatus.NORMAL) return false;

  guardState.status = SyncStatus.UPGRADING;
  guardState.upgradeCount += 1;
  writeLog('UPGRADE_START', { upgradeCount: guardState.upgradeCount });

  try {
    // 第1步：備份
    backupCurrentSnapshot();

    // 第2步：穩定性優化項目（實際可擴充）
    const optimizations = [];

    // 清理過期客戶端記錄
    const pruned = pruneStaleClients();
    if (pruned > 0) optimizations.push(`清理 ${pruned} 個過期客戶端`);

    // 日誌檔輪替（超過 10MB 則截斷）
    try {
      const stats = fs.statSync(SYNC_LOG_FILE);
      if (stats.size > 10 * 1024 * 1024) {
        const content = fs.readFileSync(SYNC_LOG_FILE, 'utf8');
        const lines = content.split('\n');
        // 保留最近 1000 行
        const kept = lines.slice(-1000).join('\n');
        fs.writeFileSync(SYNC_LOG_FILE, kept, 'utf8');
        optimizations.push('日誌檔輪替完成');
      }
    } catch { /* 首次可能不存在 */ }

    guardState.consecutiveStableChecks = 0;
    guardState.status = SyncStatus.NORMAL;

    writeLog('UPGRADE_SUCCESS', {
      upgradeCount: guardState.upgradeCount,
      optimizations
    });

    return true;
  } catch (err) {
    // 升級失敗立即回退
    guardState.status = SyncStatus.NORMAL;
    writeLog('UPGRADE_FAIL', { error: err.message });
    return false;
  }
}

// ─── 定期檢查主循環 ───

/**
 * 定期同步檢查 — 系統核心驅動迴路
 * 自動判斷下一步該做什麼
 */
function runSyncCheck() {
  // 清除超時客戶端
  pruneStaleClients();

  // 若無任何前端連線，不需檢查一致性
  if (guardState.clients.size === 0) {
    if (guardState.status === SyncStatus.RESYNCING ||
        guardState.status === SyncStatus.REPAIRING ||
        guardState.status === SyncStatus.RECOVERING) {
      // 修復期間所有端都斷了，恢復正常
      guardState.status = SyncStatus.NORMAL;
      guardState.repairAttempts = 0;
      guardState.recoveryAttempts = 0;
    }
    return;
  }

  // 若處於鎖定狀態，不做自動處理
  if (guardState.status === SyncStatus.LOCKED) return;

  const { consistent, mismatchedClients } = checkConsistency();

  if (consistent) {
    // ── 同步正常 ──
    if (guardState.status !== SyncStatus.NORMAL &&
        guardState.status !== SyncStatus.UPGRADING) {
      // 從修復狀態恢復
      writeLog('SYNC_RESTORED', { fromStatus: guardState.status });
      guardState.status = SyncStatus.NORMAL;
      guardState.repairAttempts = 0;
      guardState.recoveryAttempts = 0;
    }

    guardState.consecutiveStableChecks += 1;
    writeLog('SYNC_OK', { consecutiveStable: guardState.consecutiveStableChecks });

    // 嘗試自動升級
    executeAutoUpgrade();
    return;
  }

  // ── 同步異常 ── 按級聯鏈處理
  guardState.consecutiveStableChecks = 0;
  writeLog('SYNC_MISMATCH', { mismatchedClients });

  switch (guardState.status) {
    case SyncStatus.NORMAL:
      // 第一次偵測到不一致：嘗試重推送
      executeResync();
      break;

    case SyncStatus.RESYNCING:
      // 重推送後仍不一致：進入維修
      if (!executeRepair()) {
        // 維修達上限：進入恢復
        if (!executeRecovery()) {
          // 恢復也失敗：鎖定
          enterLockedState();
        }
      }
      break;

    case SyncStatus.REPAIRING:
      // 維修中仍不一致：再次維修或升級到恢復
      if (!executeRepair()) {
        if (!executeRecovery()) {
          enterLockedState();
        }
      }
      break;

    case SyncStatus.RECOVERING:
      // 恢復中仍不一致：再次恢復或鎖定
      if (!executeRecovery()) {
        enterLockedState();
      }
      break;

    default:
      break;
  }
}

// ─── 生命週期 ───

/**
 * 啟動同步守衛
 * @param {object} deps { broadcastFn, notifyUpdateFn }
 */
function startSyncGuard(deps = {}) {
  if (guardState.checkTimer) return; // 防重複啟動

  guardState.broadcastFn = deps.broadcastFn || null;
  guardState.notifyUpdateFn = deps.notifyUpdateFn || null;

  // 初始版本號
  if (guardState.dataVersion === 0) {
    guardState.dataVersion = Date.now();
  }

  // 初始備份
  backupCurrentSnapshot();

  // 啟動定期檢查
  guardState.checkTimer = setInterval(runSyncCheck, SYNC_CHECK_INTERVAL_MS);
  guardState.checkTimer.unref?.();

  writeLog('GUARD_STARTED', {
    checkInterval: SYNC_CHECK_INTERVAL_MS,
    clientTimeout: CLIENT_TIMEOUT_MS
  });
}

/**
 * 停止同步守衛
 */
function stopSyncGuard() {
  if (guardState.checkTimer) {
    clearInterval(guardState.checkTimer);
    guardState.checkTimer = null;
  }
  writeLog('GUARD_STOPPED');
}

/**
 * 取得完整守衛狀態快照（供 API 查詢用）
 */
function getGuardStatus() {
  const clientList = [];
  for (const [key, client] of guardState.clients) {
    clientList.push({
      clientKey: key,
      type: client.type,
      dataVersion: client.dataVersion,
      versionMatch: client.dataVersion === guardState.dataVersion,
      lastHeartbeat: new Date(client.lastHeartbeat).toISOString(),
      screenState: client.screenState,
      registeredAt: client.registeredAt
    });
  }

  return {
    status: guardState.status,
    dataVersion: guardState.dataVersion,
    previousDataVersion: guardState.previousDataVersion,
    clients: clientList,
    clientCount: guardState.clients.size,
    repairAttempts: guardState.repairAttempts,
    recoveryAttempts: guardState.recoveryAttempts,
    consecutiveStableChecks: guardState.consecutiveStableChecks,
    upgradeCount: guardState.upgradeCount,
    startedAt: guardState.startedAt,
    hasBackup: Boolean(guardState.lastGoodSnapshot),
    backupReportId: guardState.lastGoodSnapshot?.report?.reportId || null
  };
}

module.exports = {
  // 版本管理
  bumpDataVersion,
  getDataVersion,
  backupCurrentSnapshot,

  // 客戶端管理
  reportClientStatus,
  removeClient,

  // 狀態查詢
  getGuardStatus,
  checkConsistency,

  // 手動控制
  unlockSystem,
  executeResync,
  executeRepair,
  executeRecovery,

  // 生命週期
  startSyncGuard,
  stopSyncGuard,

  // 常量
  SyncStatus,
  ClientType
};
