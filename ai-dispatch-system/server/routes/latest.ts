/**
 * /api/v1/latest — 後端唯一真實來源 API
 *
 * 規格：
 * - GET /api/v1/latest          → 回傳最新整包計算結果
 * - GET /api/v1/latest/version  → 只回傳 version + computedAt（前端 poll 用）
 *
 * 前端規則：
 * - 每次偵測 version 變動，必須整包刷新
 * - 不可局部更新
 * - audit_ok = false 時，前端只顯示 error_reason，不得顯示任何派單結果
 */
import { Router } from 'express';
import { getDb } from '../db/database.js';

const router = Router();

// GET /api/v1/latest/version — 輕量版本探針（前端定時 poll）
router.get('/version', (_req, res) => {
  const db = getDb();
  const row = db.prepare('SELECT version, computed_at, report_date, audit_result FROM dispatch_snapshots ORDER BY computed_at DESC LIMIT 1').get() as any;
  if (!row) {
    return res.json({
      success: true,
      data: { version: null, computedAt: null, reportDate: null, auditOk: false },
      error_code: null,
    });
  }
  return res.json({
    success: true,
    data: {
      version: row.version,
      computedAt: row.computed_at,
      reportDate: row.report_date,
      auditOk: row.audit_result === 'PASS',
    },
    error_code: null,
  });
});

// GET /api/v1/latest — 整包結果（含 rankings / groups / announcement）
router.get('/', (_req, res) => {
  const db = getDb();
  const row = db.prepare('SELECT * FROM dispatch_snapshots ORDER BY computed_at DESC LIMIT 1').get() as any;

  if (!row) {
    return res.status(404).json({
      success: false,
      message: '尚未產生任何派單結果，請先完成報表→解析→審計→排名流程',
      data: null,
      error_code: 'NO_LATEST',
    });
  }

  // 審計失敗：只回傳錯誤原因，不回傳任何排名/分組/公告
  if (row.audit_result !== 'PASS') {
    return res.status(200).json({
      success: false,
      message: '最新計算結果審計失敗，禁止顯示派單結果',
      data: {
        version: row.version,
        computedAt: row.computed_at,
        reportDate: row.report_date,
        auditOk: false,
        errorReason: '審計未通過',
        rankings: null,
        groups: null,
        announcement: null,
      },
      error_code: 'AUDIT_FAILED',
    });
  }

  let rankings: any[] = [];
  let groups: any = {};
  try { rankings = JSON.parse(row.ranking_list); } catch {}
  try { groups = JSON.parse(row.dispatch_groups); } catch {}

  // 優先從 announcement_outputs 撈完整五版公告
  const annRow = db.prepare('SELECT * FROM announcement_outputs WHERE report_date = ?').get(row.report_date) as any;
  const announcement: any = {
    fullText:    annRow?.full_text    ?? row.announcement ?? '',
    lineText:    annRow?.line_text    ?? '',
    shortText:   annRow?.short_text   ?? '',
    voiceText:   annRow?.voice_text   ?? '',
    managerText: annRow?.manager_text ?? '',
  };

  return res.json({
    success: true,
    message: '後端唯一真實來源 — 派單結果',
    data: {
      version: row.version,
      computedAt: row.computed_at,
      reportDate: row.report_date,
      auditOk: true,
      sortRules: '',
      groupRules: '',
      rankings,
      groups,
      announcement,
    },
    error_code: null,
  });
});

export default router;
