/**
 * Zhaogui AI Dispatch - Master Supreme Commander Logger
 * 嚴格遵循【永久鎖死版】日誌規則。
 */

const fs = require('fs');
const path = require('path');
const { appConfig } = require('../config/appConfig');

const LOG_DIR = path.join(appConfig.storageRoot, 'master-logs');
const MASTER_LOG_FILE = path.join(LOG_DIR, 'supreme-commander.jsonl');

/**
 * 核心日誌事件 (由 Decree 指定)
 */
const MasterEvents = {
  SYNC_SUCCESS: 'SYNC_SUCCESS',
  SYNC_FAIL: 'SYNC_FAIL',
  RE_PUSH: 'RE_PUSH',
  REPAIR_START: 'REPAIR_START',
  REPAIR_SUCCESS: 'REPAIR_SUCCESS',
  REPAIR_FAIL: 'REPAIR_FAIL',
  RECOVERY_START: 'RECOVERY_START',
  RECOVERY_SUCCESS: 'RECOVERY_SUCCESS',
  RECOVERY_FAIL: 'RECOVERY_FAIL',
  UPGRADE_START: 'UPGRADE_START',
  UPGRADE_SUCCESS: 'UPGRADE_SUCCESS',
  UPGRADE_FAIL: 'UPGRADE_FAIL',
  ROLLBACK_START: 'ROLLBACK_START',
  ROLLBACK_SUCCESS: 'ROLLBACK_SUCCESS',
  VERSION_SNAPSHOT: 'VERSION_SNAPSHOT', // 記錄各端版本與更新時間
  SYSTEM_LOCKED: 'SYSTEM_LOCKED'
};

function ensureLogDir() {
  if (!fs.existsSync(LOG_DIR)) {
    fs.mkdirSync(LOG_DIR, { recursive: true });
  }
}

/**
 * 寫入 Master 日誌
 * @param {string} event MasterEvents 之一
 * @param {object} details 詳細資訊
 */
function logEvent(event, details = {}) {
  ensureLogDir();
  const entry = {
    timestamp: new Date().toISOString(),
    event,
    version: details.version || 'unknown',
    fingerprint: details.fingerprint || 'unknown',
    details
  };

  const line = JSON.stringify(entry) + '\n';
  try {
    fs.appendFileSync(MASTER_LOG_FILE, line, 'utf8');
    console.log(`[MasterCommander] ${event}:`, details);
  } catch (err) {
    console.error('[MasterCommander] 日誌寫入失敗:', err.message);
  }
  return entry;
}

module.exports = {
  MasterEvents,
  logEvent
};
