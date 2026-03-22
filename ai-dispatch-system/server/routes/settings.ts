/**
 * /api/v1/settings — 系統設定讀寫
 *
 * 設定持久化到 storage/settings.json
 * GET  /api/v1/settings  — 讀取目前設定（不存在則回傳預設值）
 * POST /api/v1/settings  — 寫入設定
 */
import { Router } from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { ensureStorage, writeLog } from './system.js';

const router = Router();
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SETTINGS_FILE = path.join(__dirname, '..', '..', 'storage', 'settings.json');

const DEFAULT_SETTINGS = {
  rankingPrimary: 'totalRevenue',
  rankingSecondary: 'totalFollowSuccess',
  a1Count: 4,
  a2Count: 5,
  bCount: 8,
  auditLevel: 2,
  bannedNames: [] as string[],
  correctNames: [] as string[],
};

function readSettings() {
  try {
    if (fs.existsSync(SETTINGS_FILE)) {
      return { ...DEFAULT_SETTINGS, ...JSON.parse(fs.readFileSync(SETTINGS_FILE, 'utf-8')) };
    }
  } catch {
    writeLog('WARN', '讀取設定檔失敗，使用預設值');
  }
  return { ...DEFAULT_SETTINGS };
}

// GET /api/v1/settings
router.get('/', (_req, res) => {
  const settings = readSettings();
  return res.json({ success: true, message: '設定讀取成功', data: settings, error_code: null });
});

// POST /api/v1/settings
router.post('/', (req, res) => {
  const body = req.body;
  if (!body || typeof body !== 'object') {
    return res.status(400).json({ success: false, message: '❌ 請求格式錯誤', data: null, error_code: 'INVALID_BODY' });
  }

  // 合併目前設定 + 新值（不允許帶入未知欄位破壞結構）
  const current = readSettings();
  const allowed = Object.keys(DEFAULT_SETTINGS);
  const merged: Record<string, unknown> = { ...current };
  for (const key of allowed) {
    if (key in body) merged[key] = body[key];
  }

  ensureStorage();
  try {
    fs.writeFileSync(SETTINGS_FILE, JSON.stringify(merged, null, 2), 'utf-8');
    writeLog('INFO', `設定儲存成功 — auditLevel:${merged.auditLevel} a1:${merged.a1Count} a2:${merged.a2Count} b:${merged.bCount}`);
    return res.json({ success: true, message: '✅ 設定已儲存', data: merged, error_code: null });
  } catch (e: any) {
    writeLog('ERROR', `設定儲存失敗 — ${e?.message}`);
    return res.status(500).json({ success: false, message: '❌ 設定儲存失敗', data: null, error_code: 'WRITE_ERROR' });
  }
});

export default router;
