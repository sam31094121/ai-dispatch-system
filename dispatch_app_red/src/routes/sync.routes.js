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
const masterCommander = require('../services/masterCommander.service');
const logger = require('../utils/logger');

/**
 * POST /api/sync/heartbeat
 * 前端定期回報目前顯示的版本號與螢幕狀態
 * Body: { clientKey, screenId, officialVersion, officialFingerprint, metadata }
 */
router.post('/heartbeat', (req, res) => {
  const { screenId, officialVersion, officialFingerprint } = req.body || {};

  if (!screenId) {
    return res.status(400).json({ success: false, message: '缺少 screenId' });
  }

  // 回報並獲取當前狀態
  const report = masterCommander.reportScreen({
    screenId,
    officialVersion,
    officialFingerprint
  });

  const commanderStatus = masterCommander.getCommanderStatus();

  return res.json({
    success: true,
    serverVersion: commanderStatus.currentVersion,
    serverFingerprint: commanderStatus.currentFingerprint,
    syncStatus: commanderStatus.status,
    screenStatus: report.status
  });
});

/**
 * GET /api/sync/status
 * 查詢主控中心完整狀態
 */
router.get('/status', (_req, res) => {
  res.json({
    success: true,
    data: masterCommander.getCommanderStatus()
  });
});

/**
 * POST /api/sync/report (同 heartbeat，但更精確的命名)
 */
router.post('/report', (req, res) => {
  const result = masterCommander.reportScreen(req.body);
  res.json({ success: true, data: result });
});

/**
 * POST /api/sync/unlock
 * 人工解除異常鎖定狀態
 */
router.post('/unlock', (_req, res) => {
  masterCommander.unlock();
  res.json({ success: true, message: '系統已解鎖，恢復正常運作' });
});

module.exports = router;

module.exports = router;
