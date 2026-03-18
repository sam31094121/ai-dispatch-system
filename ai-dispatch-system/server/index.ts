import express from 'express';
import cors from 'cors';
import { getDb } from './db/database.js';
import { AUTO_FIX_RULES } from './config/autoFixRules.js';
import { 執行後端系統自動維修 } from './services/serverRepairEngine.js';

// Routes
import authRoutes from './routes/auth.js';
import reportRoutes from './routes/reports.js';
import rankingRoutes from './routes/ranking.js';
import dispatchRoutes from './routes/dispatch.js';
import announcementRoutes from './routes/announcement.js';
import historyRoutes from './routes/history.js';
import repairRoutes from './routes/repair.js';

const app = express();
const PORT = 3001;

// ── Middleware ──
app.use(cors());
app.use(express.json({ limit: '5mb' }));

// ── 初始化資料庫 ──
console.log('🔧 初始化 SQLite 資料庫...');
getDb();
console.log('✅ 資料庫就緒（12 張資料表已建立）');

// ── 後端啟動時自動維修（規則二） ──
console.log('');
console.log('🔧 執行後端系統自動維修...');
const 維修結果 = 執行後端系統自動維修();
console.log('═══════════════════════════════════════════');
console.log('   後端系統自動維修完成');
console.log(`   輸入模組：保留 ${維修結果.保留模組.length} 個，停用 ${維修結果.停用模組.length} 個`);
if (維修結果.衝突說明.length > 0) {
  for (const 說明 of 維修結果.衝突說明) {
    console.log(`   ⚠️ ${說明}`);
  }
} else {
  console.log('   ✅ 無衝突，全部模組正常保留');
}
console.log(`   📝 維修紀錄已寫入 repair_logs 表`);
console.log('═══════════════════════════════════════════');
console.log('');

const 頁面設定 = {
  網站標題: "兆櫃AI派單系統 療癒金流四層空間",
  網站副標題: "這不是影片腳本，而是可直接開工的網頁工程版本。整體以黑框立體舞台、四層空間、3D 景深、紅包金流互動為核心。",
  主角編號: 1,
  標籤: ["網頁工程", "四層空間", "3D立體景深", "禁止英文顯示", "紅包金流互動"],
  顏色設定: {
    背景一: "#07080c",
    背景二: "#0f1118",
    背景三: "#18131f",
    主文字: "#f7f0dc",
    輔文字: "#cdbf96",
    黃金一: "#fff1bf",
    黃金二: "#ffd76a",
    黃金三: "#f0b000",
    白色一: "#ffffff",
    白色二: "#dce7f5",
    綠色一: "#87ffc8",
    綠色二: "#169a5d",
    暗色一: "#232333",
    暗色二: "#6957ff",
    紅色一: "#ff7b86",
    紅色二: "#b20c1b",
    紅包一: "#d32a3a",
    紅包二: "#a60e18"
  },
  角色資料: [
    { id: 1, 名稱: "黃金火焰", 說明: "資源金錢", 主題: "金" },
    { id: 2, 名稱: "白色高密度火焰", 說明: "穩定方法", 主題: "白" },
    { id: 3, 名稱: "帝王綠火焰", 說明: "長期權威", 主題: "綠" },
    { id: 4, 名稱: "黑鑽能量火焰", 說明: "翻身突破", 主題: "暗" },
    { id: 5, 名稱: "血紅能量火焰", 說明: "機會爆發", 主題: "紅" }
  ]
};

app.get('/api/頁面設定', (_req, res) => {
  res.json({
    成功: true,
    資料: 頁面設定
  });
});

// ── API v1 路由 ──
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/reports', reportRoutes);
app.use('/api/v1/rankings', rankingRoutes);
app.use('/api/v1/dispatch', dispatchRoutes);
app.use('/api/v1/announcements', announcementRoutes);
app.use('/api/v1/history', historyRoutes);
app.use('/api/v1/repair', repairRoutes);

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
