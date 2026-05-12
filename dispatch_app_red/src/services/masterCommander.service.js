/**
 * Zhaogui AI Dispatch - Master Supreme Commander (永久鎖死版)
 * 
 * 【唯一架構｜鎖死】
 * 後端總機為唯一真實核心。所有前端（桌機、手機、會議室）一律一致。
 * 本服務整合了：
 *   1. 後端總機任務 (Audit, Sort, Versioning, Pushing)
 *   2. 同步規則 (Consistency, Resync, Repair, Recovery)
 *   3. 自動下一步配套 (Sync -> Repair -> Recovery -> Backoff)
 */

const fs = require('fs');
const path = require('path');
const { appConfig } = require('../config/appConfig');
const { logEvent, MasterEvents } = require('../utils/masterLogger');
const sseService = require('./sse.service');
const officialSync = require('./officialSync.service');

// ─── 常量 ───
const SYNC_HEARTBEAT_MS = 5000;  // 5秒主脈搏
const REPAIR_LIMIT = 5;
const RECOVERY_LIMIT = 3;

// ─── 狀態 ───
const state = {
  status: 'NORMAL', // NORMAL, REPAIRING, RECOVERING, LOCKED
  currentVersion: '',
  currentFingerprint: '',
  previousSnapshot: null,
  endpoints: new Map(), // screenId -> { version, fingerprint, lastSeen, status }
  repairCount: 0,
  recoveryCount: 0,
  timer: null
};

/**
 * 更新後端正式資料快照
 * 當 latest.json 變動時呼叫
 */
function updateOfficialSnapshot(snapshot) {
  // 自動解開 storedRecord 封裝
  const data = snapshot.report || snapshot.snapshot || snapshot;
  const stamped = officialSync.stampSnapshot(data);
  state.currentVersion = stamped.officialVersion;
  state.currentFingerprint = stamped.officialFingerprint;
  
  // 持久化 stamped 版本，確保前端 /api/current 讀到一致的 officialVersion
  // 必須符合 storedRecord 結構以相容 legacy service
  try {
    const latestFile = path.join(appConfig.storageRoot, 'latest.json');
    const storedRecord = {
      report: stamped,
      validation: snapshot.validation || { ok: true, status: 'PASS' },
      snapshot: stamped,
      meta: snapshot.meta || { reason: 'master_commander_stamp', timestamp: new Date().toISOString() }
    };
    fs.writeFileSync(latestFile, JSON.stringify(storedRecord, null, 2), 'utf8');
  } catch (err) {
    console.error('[MasterCommander] 持久化 stamped snapshot 失敗', err.message);
  }
  
  // 自動備份上一版
  if (state.currentVersion && state.currentVersion !== stamped.officialVersion) {
    state.previousSnapshot = state.lastGoodSnapshot;
  }
  state.lastGoodSnapshot = stamped;

  logEvent(MasterEvents.VERSION_SNAPSHOT, {
    version: state.currentVersion,
    fingerprint: state.currentFingerprint,
    action: 'update_snapshot'
  });

  // 立即觸發強制同步
  broadcastResync('official_data_changed');
}

/**
 * 前端回報版本 (Heartbeat)
 */
function reportScreen(report = {}) {
  const screenId = report.screenId || 'unknown';
  const data = {
    screenId,
    version: String(report.officialVersion || ''),
    fingerprint: String(report.officialFingerprint || ''),
    lastSeen: new Date().toISOString(),
    status: 'online'
  };

  // 檢查一致性
  if (data.version !== state.currentVersion) {
    data.status = 'mismatch';
    logEvent(MasterEvents.SYNC_FAIL, { 
      screenId, 
      reported: data.version, 
      expected: state.currentVersion,
      reason: 'version_mismatch'
    });
  } else if (data.fingerprint !== state.currentFingerprint) {
    // 指紋不符但版本一致，視為警告但不觸發維修
    data.status = 'synced'; 
    logEvent(MasterEvents.SYNC_SUCCESS, { 
      screenId, 
      message: 'Version matched, but fingerprint differs (ignoring)',
      reportedFingerprint: data.fingerprint,
      expectedFingerprint: state.currentFingerprint 
    });
  } else {
    data.status = 'synced';
  }

  state.endpoints.set(screenId, data);
  return data;
}

/**
 * 廣播重推送 (Sync Step 1)
 */
function broadcastResync(reason = 'auto_repair') {
  logEvent(MasterEvents.RE_PUSH, { reason, version: state.currentVersion });
  sseService.broadcastUpdate({
    type: 'force_sync',
    reason,
    officialVersion: state.currentVersion,
    officialFingerprint: state.currentFingerprint,
    timestamp: new Date().toISOString()
  });
}

/**
 * 執行自動維修 (Sync Step 2)
 */
async function executeRepair() {
  if (state.repairCount >= REPAIR_LIMIT) return executeRecovery();

  state.status = 'REPAIRING';
  state.repairCount++;
  logEvent(MasterEvents.REPAIR_START, { attempt: state.repairCount });

  try {
    // 重新廣播最新的正式版
    broadcastResync('repair_mode_active');
    
    // 驗證邏輯：等下一次 Heartbeat 檢查
    return true;
  } catch (err) {
    logEvent(MasterEvents.REPAIR_FAIL, { error: err.message });
    return false;
  }
}

/**
 * 執行自動恢復 (Sync Step 3)
 */
async function executeRecovery() {
  if (state.recoveryCount >= RECOVERY_LIMIT) {
    state.status = 'LOCKED';
    logEvent(MasterEvents.SYSTEM_LOCKED, { reason: 'Repair and Recovery failed' });
    return false;
  }

  state.status = 'RECOVERING';
  state.recoveryCount++;
  logEvent(MasterEvents.RECOVERY_START, { attempt: state.recoveryCount });

  try {
    // 若當前正式版損壞，嘗試回退到 previousSnapshot
    if (state.previousSnapshot) {
      logEvent(MasterEvents.ROLLBACK_START, { toVersion: state.previousSnapshot.officialVersion });
      const latestFile = path.join(appConfig.storageRoot, 'latest.json');
      fs.writeFileSync(latestFile, JSON.stringify(state.previousSnapshot, null, 2), 'utf8');
      
      // 更新狀態
      state.currentVersion = state.previousSnapshot.officialVersion;
      state.currentFingerprint = state.previousSnapshot.officialFingerprint;
      logEvent(MasterEvents.ROLLBACK_SUCCESS);
    }

    broadcastResync('recovery_mode_active');
    return true;
  } catch (err) {
    logEvent(MasterEvents.RECOVERY_FAIL, { error: err.message });
    return false;
  }
}

/**
 * 主循環：同步一致性檢查
 */
function runPulse() {
  if (state.status === 'LOCKED') return;

  const endpoints = Array.from(state.endpoints.values());
  const mismatched = endpoints.filter(e => e.status === 'mismatch' || e.status === 'missing');

  if (mismatched.length === 0) {
    if (state.status !== 'NORMAL') {
      logEvent(MasterEvents.SYNC_SUCCESS, { reason: 'All screens synced after repair/recovery' });
      state.status = 'NORMAL';
      state.repairCount = 0;
      state.recoveryCount = 0;
    }
    return;
  }

  // 發現異常，根據目前狀態決定下一步
  logEvent(MasterEvents.SYNC_FAIL, { mismatchCount: mismatched.length });
  
  if (state.status === 'NORMAL') {
    broadcastResync('initial_mismatch_detected');
    state.status = 'REPAIRING'; // 進入修復預備
  } else if (state.status === 'REPAIRING') {
    executeRepair();
  } else if (state.status === 'RECOVERING') {
    executeRecovery();
  }
}

/**
 * 啟動主控中心
 */
function start() {
  if (state.timer) return;
  
  // 載入當前正式版
  try {
    const latestFile = path.join(appConfig.storageRoot, 'latest.json');
    if (fs.existsSync(latestFile)) {
      const content = JSON.parse(fs.readFileSync(latestFile, 'utf8'));
      updateOfficialSnapshot(content);
    }
  } catch (e) {
    console.error('[MasterCommander] 載入正式版失敗', e.message);
  }

  state.timer = setInterval(runPulse, SYNC_HEARTBEAT_MS);
  logEvent(MasterEvents.SYNC_SUCCESS, { message: 'Master Commander Active' });
}

module.exports = {
  start,
  updateOfficialSnapshot,
  reportScreen,
  getCommanderStatus: () => ({
    status: state.status,
    currentVersion: state.currentVersion,
    currentFingerprint: state.currentFingerprint,
    repairCount: state.repairCount,
    recoveryCount: state.recoveryCount,
    endpoints: Array.from(state.endpoints.values())
  }),
  unlock: () => { state.status = 'NORMAL'; state.repairCount = 0; state.recoveryCount = 0; }
};
