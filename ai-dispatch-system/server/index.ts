import express from 'express';
import cors from 'cors';
import { getDb } from './db/database.js';
import { AUTO_FIX_RULES } from './config/autoFixRules.js';

// Routes
import authRoutes from './routes/auth.js';
import reportRoutes from './routes/reports.js';
import rankingRoutes from './routes/ranking.js';
import dispatchRoutes from './routes/dispatch.js';
import announcementRoutes from './routes/announcement.js';
import historyRoutes from './routes/history.js';

const app = express();
const PORT = 3001;

// ── Middleware ──
app.use(cors());
app.use(express.json({ limit: '5mb' }));

// ── 初始化資料庫 ──
console.log('🔧 初始化 SQLite 資料庫...');
getDb();
console.log('✅ 資料庫就緒（12 張資料表已建立）');

// ── API v1 路由 ──
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/reports', reportRoutes);
app.use('/api/v1/rankings', rankingRoutes);
app.use('/api/v1/dispatch', dispatchRoutes);
app.use('/api/v1/announcements', announcementRoutes);
app.use('/api/v1/history', historyRoutes);

// ── 修正規則查詢 ──
app.get('/api/v1/fix-rules', (_req, res) => {
  res.json({ success: true, message: '查詢成功', data: AUTO_FIX_RULES, error_code: null });
});

// ── 健康檢查 ──
app.get('/api/v1/health', (_req, res) => {
  const db = getDb();
  const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name").all() as any[];
  res.json({
    success: true, message: '系統正常',
    data: { version: 'V2 — 生產規格版', tables: tables.map((t: any) => t.name), table_count: tables.length, timestamp: new Date().toISOString() },
    error_code: null,
  });
});

// ── 明細更新 (獨立路由) ──
app.put('/api/v1/report-details/:detailId', (req, res) => {
  const db = getDb();
  const detailId = Number(req.params.detailId);
  const existing = db.prepare('SELECT * FROM daily_report_details WHERE id = ?').get(detailId) as any;
  if (!existing) return res.status(404).json({ success: false, message: '明細不存在', data: null, error_code: 'NOT_FOUND' });

  const allowedFields = ['employee_name', 'normalized_name', 'identity_tag', 'total_calls', 'assigned_deals_count', 'followup_deals_count', 'closing_rate_percent', 'followup_amount', 'cancelled_return_amount', 'total_revenue_amount'];
  const updates: string[] = [];
  const params: any[] = [];
  for (const [key, value] of Object.entries(req.body)) {
    if (key === 'change_reason' || !allowedFields.includes(key)) continue;
    updates.push(`${key} = ?`);
    params.push(value);
    db.prepare(`INSERT INTO version_change_logs (report_id, detail_id, changed_field_name, value_before, value_after, change_reason, change_source)
      VALUES (?, ?, ?, ?, ?, ?, '人工')`).run(existing.report_id, detailId, key, String(existing[key] ?? ''), String(value), req.body.change_reason || '人工修正明細');
  }
  if (updates.length > 0) {
    params.push(detailId);
    db.prepare(`UPDATE daily_report_details SET ${updates.join(', ')}, updated_at = datetime('now','localtime') WHERE id = ?`).run(...params);
  }
  return res.json({ success: true, message: '明細更新成功', data: { detail_id: detailId, updated: true }, error_code: null });
});

// ── 啟動 ──
app.listen(PORT, () => {
  console.log('');
  console.log('═══════════════════════════════════════════');
  console.log('   人工智慧商業帝國系統 — 後端 V2');
  console.log(`   http://localhost:${PORT}/api/v1/`);
  console.log('   12 張資料表 · 7 大接口 · 鎖死流程');
  console.log('═══════════════════════════════════════════');
  console.log('');
  console.log('📌 API 路徑前綴：/api/v1/');
  console.log('📌 流程鎖死：輸入→解析→審計→排名→派單→公告');
  console.log('📌 C級衝突未解 → 禁止派單輸出');
  console.log('📌 核心金額禁止自動修正');
  console.log('');
});
