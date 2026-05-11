/**
 * Zhaogui AI Dispatch — 同步守衛 API 路由 (Sync Guard Routes)
 *
 * 【永久鎖死】
 * 提供以下端點：
 *   POST /api/sync/heartbeat   — 前端定期回報版本與狀態
 *   GET  /api/sync/status      — 查詢守衛完整狀態
 *   POST /api/sync/unlock      — 人工解除鎖定
 *   POST /api/sync/repair      — 手動觸發維修
 *   POST /api/sync/recovery    — 手動觸發恢復
 */

const express = require('express');
const router = express.Router();
const syncGuard = require('../services/syncGuard.service');
const logger = require('../utils/logger');

/**
 * POST /api/sync/heartbeat
 * 前端定期回報目前顯示的版本號與螢幕狀態
 * Body: { clientKey, type, dataVersion, screenState, metadata }
 */
router.post('/heartbeat', (req, res) => {
  const { clientKey, type, dataVersion, screenState, metadata } = req.body || {};

  if (!clientKey) {
    return res.status(400).json({
      success: false,
      message: '缺少 clientKey'
    });
  }

  syncGuard.reportClientStatus(clientKey, {
    type: type || 'desktop',
    dataVersion: Number(dataVersion) || 0,
    screenState: screenState || 'active',
    metadata: metadata || {}
  });

  // 回傳後端目前的正式版本號，讓前端比對
  const guardStatus = syncGuard.getGuardStatus();

  return res.json({
    success: true,
    serverDataVersion: guardStatus.dataVersion,
    syncStatus: guardStatus.status,
    clientCount: guardStatus.clientCount
  });
});

/**
 * GET /api/sync/status
 * 查詢守衛完整狀態（含所有已連線客戶端清單）
 */
router.get('/status', (_req, res) => {
  const status = syncGuard.getGuardStatus();
  res.json({
    success: true,
    data: status
  });
});

/**
 * POST /api/sync/unlock
 * 人工解除異常鎖定狀態
 */
router.post('/unlock', (_req, res) => {
  try {
    syncGuard.unlockSystem();
    logger.info('[SyncRoute] 系統已手動解鎖');
    res.json({ success: true, message: '系統已解鎖，恢復正常運作' });
  } catch (err) {
    logger.error('[SyncRoute] 解鎖失敗', { error: err.message });
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * POST /api/sync/repair
 * 手動觸發維修流程
 */
router.post('/repair', (_req, res) => {
  try {
    const result = syncGuard.executeRepair();
    res.json({
      success: result,
      message: result ? '維修已觸發，等待前端同步驗證' : '維修失敗或已達上限'
    });
  } catch (err) {
    logger.error('[SyncRoute] 手動維修失敗', { error: err.message });
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * POST /api/sync/recovery
 * 手動觸發恢復流程
 */
router.post('/recovery', (_req, res) => {
  try {
    const result = syncGuard.executeRecovery();
    res.json({
      success: result,
      message: result ? '恢復已觸發，等待全端重新驗證' : '恢復失敗或已達上限'
    });
  } catch (err) {
    logger.error('[SyncRoute] 手動恢復失敗', { error: err.message });
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
