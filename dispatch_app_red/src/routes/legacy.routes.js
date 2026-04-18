/**
 * Legacy API Bridge — 提供舊版 /api/current、/api/audit、/api/save、/api/broadcast/current
 * 讓主前端 (public/app.js) 與廣播頁 (broadcast.js) 繼續正常運作。
 */
const express = require('express');
const { SERVICE_NAME, API_VERSION } = require('../constants/dispatchRules');
const { parseDispatchDraft } = require('../services/dispatchParse.service');
const {
  getLatestReport,
  getLegacySnapshot,
  getValidationForReport,
  saveNewReport,
  saveReportVersion,
  resetStorageCache
} = require('../services/dispatchQuery.service');
const { formatTaipeiTimestamp } = require('../utils/date.util');

const router = express.Router();

function serverTime() {
  return new Intl.DateTimeFormat('zh-TW', {
    timeZone: 'Asia/Taipei',
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
    hour12: false
  }).format(new Date()).replace(/\//g, '/');
}

function ok(res, message, data) {
  res.json({
    success: true,
    message,
    systemName: SERVICE_NAME,
    systemVersion: API_VERSION,
    serverTime: serverTime(),
    data
  });
}

function fail(res, status, message, data = null) {
  res.status(status).json({ success: false, message, data });
}

/* ── GET /api/current ─────────────────────────────────────── */
router.get('/current', (_req, res) => {
  try {
    const report     = getLatestReport();
    const validation = getValidationForReport(report);
    const snapshot   = getLegacySnapshot(report, validation, {
      persisted: report.status === 'published',
      source:    'legacy-bridge'
    });
    ok(res, '取得最新正式資料成功', snapshot);
  } catch (error) {
    fail(res, 500, error.message || '系統錯誤');
  }
});

/* ── POST /api/audit ──────────────────────────────────────── */
router.post('/audit', (req, res) => {
  const rawText = req.body?.rawText;
  if (!rawText) { fail(res, 400, '缺少 rawText 欄位'); return; }

  try {
    const { report, validation } = parseDispatchDraft({ rawText, operator: 'WEB', source: 'audit' });
    const snapshot = getLegacySnapshot(report, validation, { persisted: false, source: 'audit' });
    res.json({
      success: true,
      message: validation.ok ? '審計通過' : '審計發現問題',
      data: snapshot
    });
  } catch (error) {
    fail(res, 400, error.message || '審計失敗');
  }
});

/* ── POST /api/save ───────────────────────────────────────── */
router.post('/save', (req, res) => {
  const rawText = req.body?.rawText;
  if (!rawText) { fail(res, 400, '缺少 rawText 欄位'); return; }

  try {
    const { report, validation } = parseDispatchDraft({ rawText, operator: 'WEB', source: 'manual' });

    if (!validation.ok) {
      const snapshot = getLegacySnapshot(report, validation, { persisted: false });
      fail(res, 400, '審計未通過，無法存為正式版', snapshot);
      return;
    }

    let saved;
    try {
      saved = saveNewReport(report, { operator: 'WEB', reason: 'save', source: 'manual' });
    } catch (dupError) {
      // reportId 已存在 → 新版本
      saved = saveReportVersion(report, { operator: 'WEB', reason: 'update', source: 'manual' });
    }

    resetStorageCache();
    const finalReport     = getLatestReport();
    const finalValidation = getValidationForReport(finalReport);
    const snapshot = getLegacySnapshot(finalReport, finalValidation, {
      persisted: true,
      source:    'save'
    });
    res.json({ success: true, persisted: true, message: '正式版已存檔', data: snapshot });
  } catch (error) {
    fail(res, 400, error.message || '存檔失敗');
  }
});

/* ── GET /api/broadcast/current ──────────────────────────── */
router.get('/broadcast/current', (_req, res) => {
  try {
    const report     = getLatestReport();
    const validation = getValidationForReport(report);
    const snapshot   = getLegacySnapshot(report, validation, {
      persisted: true,
      source:    'broadcast'
    });
    res.json({ success: true, message: '播報資料讀取成功', data: snapshot });
  } catch (error) {
    fail(res, 500, error.message || '系統錯誤');
  }
});

module.exports = router;
