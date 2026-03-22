/**
 * /api/v1/system — 引擎狀態、模組開關、storage 存檔、日誌
 *
 * 設計原則：
 * 1. 前後端狀態必須完全一致，不可假 ON/OFF
 * 2. 核心模組（systemConfig）禁止關閉
 * 3. 所有輸入都寫入 storage/ 實體檔案
 * 4. 日期一律用台灣時區 Asia/Taipei
 * 5. 靜默失敗 → 改為主動提醒
 */
import { Router } from 'express';
import { getDb } from '../db/database.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const router = Router();
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const STORAGE_ROOT = path.join(__dirname, '..', '..', 'data');

// ── 台灣時間工具 ──
function getTaipeiTime(): Date {
  // 用 Intl 取得台灣當下時間字串，再轉回 Date
  const twStr = new Intl.DateTimeFormat('sv-SE', {
    timeZone: 'Asia/Taipei',
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  }).format(new Date());
  return new Date(twStr.replace(' ', 'T'));
}

function getTaipeiDateStr(): string {
  const d = getTaipeiTime();
  return d.toISOString().split('T')[0]; // YYYY-MM-DD
}

function getTaipeiISOString(): string {
  const d = getTaipeiTime();
  return d.toISOString().replace('Z', '+08:00');
}

// ── Storage 資料夾自動建立 ──
export function ensureStorage(): { created: string[]; existed: string[] } {
  const created: string[] = [];
  const existed: string[] = [];
  const dateStr = getTaipeiDateStr();
  const dirs = [
    STORAGE_ROOT,
    path.join(STORAGE_ROOT, 'reports'),
    path.join(STORAGE_ROOT, 'reports', dateStr),
    path.join(STORAGE_ROOT, 'backups'),
  ];
  for (const dir of dirs) {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      created.push(dir.replace(STORAGE_ROOT, 'storage'));
    } else {
      existed.push(dir.replace(STORAGE_ROOT, 'storage'));
    }
  }
  return { created, existed };
}

// ── 日誌寫入 ──
// 統一 JSONL 日誌檔：data/system-log.jsonl
const SYSTEM_LOG_FILE = path.join(STORAGE_ROOT, 'system-log.jsonl');

export function writeLog(level: 'INFO' | 'WARN' | 'ERROR', message: string): void {
  try {
    if (!fs.existsSync(STORAGE_ROOT)) fs.mkdirSync(STORAGE_ROOT, { recursive: true });
    const entry = JSON.stringify({ ts: getTaipeiISOString(), level, message }) + '\n';
    fs.appendFileSync(SYSTEM_LOG_FILE, entry, 'utf-8');
  } catch {
    console.error('[LOG_WRITE_FAIL]', message);
  }
}

// ── 系統狀態（In-Memory，重啟後重置）──
let engineRunning = false;
let engineStartedAt: string | null = null;

// 核心模組：禁止關閉
const CORE_MODULES = new Set(['systemConfig']);

const DEFAULT_MODULES: Record<string, { label: string; enabled: boolean; locked: boolean; description: string }> = {
  systemConfig:    { label: '系統設定中心', enabled: true,  locked: true,  description: '核心模組 — 禁止關閉' },
  reportInput:     { label: '業績輸入中心', enabled: true,  locked: false, description: '每日業績貼上/解析/審計' },
  auditEngine:     { label: 'AI 審計引擎',  enabled: true,  locked: false, description: '天地盤/邏輯盤/累積盤校驗' },
  rankEngine:      { label: '排名演算模組', enabled: true,  locked: false, description: '整合三平台名次計算' },
  dispatchEngine:  { label: '派單分組模組', enabled: true,  locked: false, description: 'A1/A2/B/C 梯隊分組' },
  announceEngine:  { label: '公告生成模組', enabled: true,  locked: false, description: '五版公告自動封裝' },
  storageEngine:   { label: '存檔備份模組', enabled: true,  locked: false, description: '每日自動存檔+備份+日誌' },
  repairEngine:    { label: '自動修復引擎', enabled: true,  locked: false, description: '後端系統自動維修' },
};

const modules = { ...DEFAULT_MODULES };

// ─────────────────────────────────────────────────────
// GET /api/v1/system/status
// ─────────────────────────────────────────────────────
router.get('/status', (_req, res) => {
  ensureStorage();
  const db = getDb();
  const dateStr = getTaipeiDateStr();

  // 今日 storage 狀態
  const todayDir = path.join(STORAGE_ROOT, 'reports', dateStr);
  const latestFile = path.join(STORAGE_ROOT, 'latest.json');
  const logFile = SYSTEM_LOG_FILE;

  const storageStatus = {
    todayDir: fs.existsSync(todayDir),
    latestFile: fs.existsSync(latestFile),
    logFile: fs.existsSync(logFile),
    logSize: fs.existsSync(logFile) ? fs.statSync(logFile).size : 0,
    backupCount: fs.existsSync(path.join(STORAGE_ROOT, 'backups'))
      ? fs.readdirSync(path.join(STORAGE_ROOT, 'backups')).length : 0,
  };

  // 今日報表數量
  const todayReports = db.prepare("SELECT COUNT(*) as cnt FROM daily_reports WHERE report_date = ?").get(dateStr) as any;

  // 最新快照
  const snap = db.prepare("SELECT version, report_date, audit_result, computed_at FROM dispatch_snapshots ORDER BY computed_at DESC LIMIT 1").get() as any;

  return res.json({
    success: true,
    message: '系統狀態查詢成功',
    data: {
      engine: {
        running: engineRunning,
        startedAt: engineStartedAt,
        currentTime: getTaipeiISOString(),
        timezone: 'Asia/Taipei',
      },
      modules: Object.entries(modules).map(([key, m]) => ({
        key,
        label: m.label,
        enabled: m.enabled,
        locked: m.locked,
        description: m.description,
      })),
      storage: storageStatus,
      database: {
        todayReportCount: todayReports?.cnt ?? 0,
        latestSnapshot: snap ? {
          version: snap.version,
          reportDate: snap.report_date,
          auditResult: snap.audit_result,
          computedAt: snap.computed_at,
        } : null,
      },
      alerts: buildAlerts(storageStatus, engineRunning, todayReports?.cnt ?? 0),
    },
    error_code: null,
  });
});

function buildAlerts(storage: any, running: boolean, reportCount: number): string[] {
  const alerts: string[] = [];
  if (!running) alerts.push('⚠️ AI 引擎尚未啟動，請點擊「啟動引擎」');
  if (!storage.todayDir) alerts.push('⚠️ 今日存檔資料夾不存在，系統將自動建立');
  if (reportCount === 0) alerts.push('📋 今日尚未輸入報表');
  if (!storage.logFile) alerts.push('📝 今日日誌尚未建立');
  return alerts;
}

// ─────────────────────────────────────────────────────
// POST /api/v1/system/boot
// ─────────────────────────────────────────────────────
router.post('/boot', (_req, res) => {
  if (engineRunning) {
    return res.json({
      success: true, message: 'AI 引擎已在運行中',
      data: { running: true, startedAt: engineStartedAt },
      error_code: null,
    });
  }
  ensureStorage();
  engineRunning = true;
  engineStartedAt = getTaipeiISOString();
  writeLog('INFO', `AI 全域引擎啟動 — ${engineStartedAt}`);

  return res.json({
    success: true, message: '✅ AI 全域引擎啟動成功',
    data: { running: true, startedAt: engineStartedAt, timezone: 'Asia/Taipei' },
    error_code: null,
  });
});

// ─────────────────────────────────────────────────────
// POST /api/v1/system/stop
// ─────────────────────────────────────────────────────
router.post('/stop', (_req, res) => {
  if (!engineRunning) {
    return res.json({
      success: true, message: '引擎本就未運行',
      data: { running: false },
      error_code: null,
    });
  }
  engineRunning = false;
  writeLog('INFO', `AI 全域引擎停止 — ${getTaipeiISOString()}`);
  engineStartedAt = null;
  return res.json({
    success: true, message: '⏹ AI 全域引擎已停止',
    data: { running: false },
    error_code: null,
  });
});

// ─────────────────────────────────────────────────────
// POST /api/v1/system/repair
// ─────────────────────────────────────────────────────
router.post('/repair', (_req, res) => {
  const { created } = ensureStorage();
  const db = getDb();

  // 檢查並修復 DB 必要資料（admin user）
  const admin = db.prepare("SELECT id FROM app_users WHERE account='admin'").get();
  if (!admin) {
    db.prepare("INSERT OR IGNORE INTO app_users (account,password_hash,display_name,role_name) VALUES ('admin','admin','系統管理員','管理員')").run();
  }

  writeLog('INFO', `系統修復執行 — 建立資料夾: ${created.length} 個`);
  return res.json({
    success: true, message: '✅ 系統修復完成',
    data: {
      storageCreated: created,
      dbRepaired: !admin,
      repairedAt: getTaipeiISOString(),
    },
    error_code: null,
  });
});

// ─────────────────────────────────────────────────────
// POST /api/v1/system/modules/:moduleKey/toggle
// ─────────────────────────────────────────────────────
router.post('/modules/:moduleKey/toggle', (req, res) => {
  const { moduleKey } = req.params;
  if (!modules[moduleKey]) {
    return res.status(404).json({ success: false, message: `模組 ${moduleKey} 不存在`, data: null, error_code: 'MODULE_NOT_FOUND' });
  }
  if (CORE_MODULES.has(moduleKey)) {
    return res.status(403).json({
      success: false, message: '核心模組鎖定中，不可關閉',
      data: { key: moduleKey, locked: true, enabled: true },
      error_code: 'CORE_MODULE_LOCKED',
    });
  }
  modules[moduleKey].enabled = !modules[moduleKey].enabled;
  const newState = modules[moduleKey].enabled;
  writeLog('INFO', `模組切換 [${moduleKey}] → ${newState ? 'ON' : 'OFF'}`);
  return res.json({
    success: true, message: `模組 ${modules[moduleKey].label} 已${newState ? '啟用' : '停用'}`,
    data: { key: moduleKey, enabled: newState },
    error_code: null,
  });
});

// ─────────────────────────────────────────────────────
// POST /api/v1/system/save-report  — 業績報表存檔（五段式）
// ─────────────────────────────────────────────────────
router.post('/save-report', (req, res) => {
  const { rawText, optimizedText, reportDate: inputDate, platformName, reportMode } = req.body;
  if (!rawText || typeof rawText !== 'string') {
    writeLog('WARN', '存檔失敗：缺少 rawText');
    return res.status(400).json({ success: false, message: '❌ 缺少 rawText，存檔失敗', data: null, error_code: 'MISSING_RAW_TEXT' });
  }

  ensureStorage();
  const dateStr = inputDate || getTaipeiDateStr();
  const ts = getTaipeiISOString();
  const safeDate = dateStr.replace(/[^0-9\-]/g, '');

  // 1. 當日資料夾
  const todayDir = path.join(STORAGE_ROOT, 'reports', safeDate);
  if (!fs.existsSync(todayDir)) fs.mkdirSync(todayDir, { recursive: true });

  const payload = {
    savedAt: ts,
    reportDate: safeDate,
    platformName: platformName || '未指定',
    reportMode: reportMode || '累積報表',
    rawText,
    optimizedText: optimizedText || rawText,
  };

  // 2. 當日資料夾存檔（時間戳命名，不覆蓋）
  const filename = `report_${ts.replace(/[:\+]/g, '-')}.json`;
  fs.writeFileSync(path.join(todayDir, filename), JSON.stringify(payload, null, 2), 'utf-8');

  // 3. 最新檔覆寫更新（data/latest.json）
  fs.writeFileSync(path.join(STORAGE_ROOT, 'latest.json'), JSON.stringify(payload, null, 2), 'utf-8');

  // 4. 備份（日期命名）
  const backupFile = path.join(STORAGE_ROOT, 'backups', `${safeDate}-backup.json`);
  fs.writeFileSync(backupFile, JSON.stringify(payload, null, 2), 'utf-8');

  // 5. 日誌
  writeLog('INFO', `報表存檔完成 | 日期:${safeDate} | 平台:${platformName || '未指定'} | 字元:${rawText.length}`);

  return res.json({
    success: true, message: '✅ 報表已完整存檔',
    data: {
      savedAt: ts,
      reportDate: safeDate,
      files: {
        daily: `data/reports/${safeDate}/${filename}`,
        latest: 'data/latest.json',
        backup: `data/backups/${safeDate}-backup.json`,
        log: 'data/system-log.jsonl',
      },
      status: ['已接收', '已存檔', '已備份', '已寫入日誌'],
    },
    error_code: null,
  });
});

// ─────────────────────────────────────────────────────
// GET /api/v1/system/latest-report
// ─────────────────────────────────────────────────────
router.get('/latest-report', (_req, res) => {
  const latestFile = path.join(STORAGE_ROOT, 'latest.json');
  if (!fs.existsSync(latestFile)) {
    return res.status(404).json({ success: false, message: '尚未有任何存檔報表', data: null, error_code: 'NO_LATEST' });
  }
  try {
    const data = JSON.parse(fs.readFileSync(latestFile, 'utf-8'));
    return res.json({ success: true, message: '查詢成功', data, error_code: null });
  } catch {
    return res.status(500).json({ success: false, message: '讀取失敗', data: null, error_code: 'READ_ERROR' });
  }
});

// ─────────────────────────────────────────────────────
// GET /api/v1/system/logs/today
// ─────────────────────────────────────────────────────
router.get('/logs/today', (_req, res) => {
  const dateStr = getTaipeiDateStr();
  if (!fs.existsSync(SYSTEM_LOG_FILE)) {
    return res.json({ success: true, message: '日誌尚未建立', data: { date: dateStr, lines: [] }, error_code: null });
  }
  const content = fs.readFileSync(SYSTEM_LOG_FILE, 'utf-8');
  const allLines = content.trim().split('\n').filter(Boolean);
  // 只取今日的條目（ts 開頭包含今日日期）
  const todayLines = allLines.filter(l => l.includes(`"ts":"${dateStr}`)).slice(-100);
  return res.json({ success: true, message: '查詢成功', data: { date: dateStr, lines: todayLines }, error_code: null });
});

// ─────────────────────────────────────────────────────
// POST /api/v1/system/broadcast  — 生成播報稿
// ─────────────────────────────────────────────────────
router.post('/broadcast', (req, res) => {
  const { rankings, reportDate, title } = req.body;
  if (!rankings || !Array.isArray(rankings)) {
    return res.status(400).json({ success: false, message: '缺少 rankings 資料', data: null, error_code: 'MISSING_RANKINGS' });
  }
  const dateStr = reportDate || getTaipeiDateStr();
  const header = title || `${dateStr} 業績播報`;

  const top3 = rankings.slice(0, 3);
  const scriptLines: string[] = [
    `📢 ${header}`,
    `今日共 ${rankings.length} 位夥伴業績回報`,
    '',
    '【前三名】',
    ...top3.map((r: any, i: number) => `第 ${i + 1} 名：${r.name}，業績 ${Number(r.amount || 0).toLocaleString()} 元`),
    '',
    '【A1 組】',
    ...rankings.filter((r: any) => r.group === 'A1').map((r: any) => `  ${r.name}（${Number(r.amount || 0).toLocaleString()}）`),
    '【A2 組】',
    ...rankings.filter((r: any) => r.group === 'A2').map((r: any) => `  ${r.name}（${Number(r.amount || 0).toLocaleString()}）`),
    '【B 組】',
    ...rankings.filter((r: any) => r.group === 'B').map((r: any) => `  ${r.name}（${Number(r.amount || 0).toLocaleString()}）`),
    '【C 組】',
    ...rankings.filter((r: any) => r.group === 'C').map((r: any) => `  ${r.name}（${Number(r.amount || 0).toLocaleString()}）`),
    '',
    `播報時間：${getTaipeiISOString().replace('T', ' ').split('+')[0]}（台灣時區）`,
  ];

  const script = scriptLines.filter(l => !(l.startsWith('【') && rankings.filter((r: any) => r.group === l.replace('【', '').replace(' 組】', '')).length === 0)).join('\n');
  writeLog('INFO', `播報稿生成完成 | 日期:${dateStr} | 人數:${rankings.length}`);

  return res.json({
    success: true, message: '✅ 播報稿生成完成',
    data: { script, reportDate: dateStr, personCount: rankings.length, generatedAt: getTaipeiISOString() },
    error_code: null,
  });
});

// ─────────────────────────────────────────────────────
// POST /api/v1/system/line-message  — 生成 LINE 轉傳訊息
// ─────────────────────────────────────────────────────
router.post('/line-message', (req, res) => {
  const { rankings, reportDate, groupName } = req.body;
  if (!rankings || !Array.isArray(rankings)) {
    return res.status(400).json({ success: false, message: '缺少 rankings 資料', data: null, error_code: 'MISSING_RANKINGS' });
  }
  const dateStr = reportDate || getTaipeiDateStr();

  const groups: Record<string, any[]> = { A1: [], A2: [], B: [], C: [] };
  for (const r of rankings) {
    const g = r.group || 'C';
    if (groups[g]) groups[g].push(r);
  }

  const blocks: Record<string, string> = {};
  for (const [g, members] of Object.entries(groups)) {
    if (members.length === 0) continue;
    const lines = [
      `🔔 ${dateStr} 業績派單（${g} 組）`,
      `━━━━━━━━━━━━━━━━`,
      ...members.map((r, i) => `${i + 1}. ${r.name} ｜ ${Number(r.amount || 0).toLocaleString()} 元`),
      `━━━━━━━━━━━━━━━━`,
      `📍 共 ${members.length} 位夥伴｜請確認接單`,
    ];
    blocks[g] = lines.join('\n');
  }

  const target = groupName ? { [groupName]: blocks[groupName] || '' } : blocks;
  writeLog('INFO', `LINE 訊息生成完成 | 日期:${dateStr} | 群組:${groupName || '全組'}`);

  return res.json({
    success: true, message: '✅ LINE 訊息生成完成',
    data: { messages: target, reportDate: dateStr, generatedAt: getTaipeiISOString() },
    error_code: null,
  });
});

export { getTaipeiDateStr, getTaipeiISOString, writeLog as systemLog };
export default router;
