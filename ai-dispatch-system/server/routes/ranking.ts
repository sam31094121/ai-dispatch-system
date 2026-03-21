import { Router } from 'express';
import { createHash } from 'crypto';
import { getDb } from '../db/database.js';
import { writeLog } from './system.js';

// ══ 分組規則鎖死（後端唯一真實來源）══
// A1 = rank 1–4 ｜ A2 = rank 5–10 ｜ B = rank 11–18 ｜ C = rank 19+
function assignGroup(rank: number): string {
  if (rank <= 4)  return 'A1';
  if (rank <= 10) return 'A2';
  if (rank <= 18) return 'B';
  return 'C';
}

// ══ 姓名守門：已知錯名 → 拒絕進榜 ══
const NAME_BLOCKLIST: Record<string, string> = {
  '徐華好': '徐華妤',  // 錯字，正確為「徐華妤」
};

// ══ 建議文產生（後端統一，前端不得自行生成）══
function buildSuggestion(_name: string, rank: number, group: string, follow: number, dispatch: number): string {
  const f = follow.toLocaleString();
  if (group === 'A1') return rank === 1
    ? `把【追單】${dispatch}筆和【續單】${f}繼續往深處收，第一名不是保住而是把差距再拉大；你是全隊壓力核心，今天只要再爆一筆，節奏就是你定。`
    : `🔥 把【追單】${dispatch}筆和【續單】${f}加快轉成【實收】，穩住A1位置不鬆手。`;
  if (group === 'A2') return follow > 100000
    ? `💪 用【續單】${f}把實收做厚，再補【追單】深度；A2不是安全區，是衝刺A1的跳台。`
    : `💪 把【追單】${dispatch}筆變現，讓【續單】${f}穩定落袋；你現在就在A1門口，不能拖。`;
  if (group === 'B') {
    if (follow === 0 && dispatch === 0) return `📈 先補【追單】和實收節奏，不要讓總業績停住；不往前追就會被後段逼近。`;
    if (follow > 0) return `📈 把【續單】${f}做厚，讓【總業績】穩穩往上；你追回續單，隔天位置就會升。`;
    return `📈 把【追單】${dispatch}變成【實收】速度，不要拖；拖一天就掉一天。`;
  }
  return `⚡ 先把一筆【追單】變成真正【實收】，建立節奏最重要；不落袋就會一直停在後段。`;
}

const router = Router();

// POST /api/v1/rankings/generate — 生成整合排名（後端鎖死分組）
router.post('/generate', (req, res) => {
  const db = getDb();
  const { report_date } = req.body;
  if (!report_date) return res.status(400).json({ success: false, message: '需提供報表日期', data: null, error_code: 'MISSING_FIELDS' });

  // 骨牌防呆：所有報表必須審計通過
  const reports = db.prepare("SELECT * FROM daily_reports WHERE report_date = ?").all(report_date) as any[];
  if (reports.length === 0) return res.status(404).json({ success: false, message: `${report_date} 無任何報表`, data: null, error_code: 'NO_REPORTS' });

  const auditFailed = reports.filter((r: any) => r.audit_status !== '審計通過');
  if (auditFailed.length > 0) {
    return res.status(403).json({
      success: false, message: `審計未通過，禁止生成排名：${auditFailed.map((r: any) => r.platform_name).join('、')}`,
      data: null, error_code: 'AUDIT_BLOCKED',
    });
  }

  const allDetails = db.prepare(`
    SELECT dd.*, dr.platform_name FROM daily_report_details dd
    JOIN daily_reports dr ON dd.report_id = dr.id
    WHERE dr.report_date = ? AND dr.audit_status = '審計通過'
  `).all(report_date) as any[];

  // ── 姓名守門：拒絕已知錯名 ──
  const blockedEntries = allDetails.filter((d: any) => NAME_BLOCKLIST[d.normalized_name]);
  if (blockedEntries.length > 0) {
    const detail = blockedEntries.map((d: any) => `「${d.normalized_name}」應為「${NAME_BLOCKLIST[d.normalized_name]}」`).join('；');
    return res.status(422).json({
      success: false,
      message: `資料包含已知錯名，禁止進榜。${detail}。請先修正姓名後重新審計。`,
      data: null, error_code: 'INVALID_NAME',
    });
  }

  // 按姓名整合三平台數據
  const map = new Map<string, { dispatch: number; follow: number; revenue: number; actual: number; cancel: number; closingRate: number; assignedDeals: number; callCount: number; platforms: Record<string, number>; isNew: boolean }>();
  for (const d of allDetails) {
    const key = d.normalized_name;
    const existing = map.get(key) || { dispatch: 0, follow: 0, revenue: 0, actual: 0, cancel: 0, closingRate: 0, assignedDeals: 0, callCount: 0, platforms: {}, isNew: d.identity_tag === '新人' };
    existing.dispatch     += d.followup_deals_count;
    existing.follow       += d.followup_amount;
    existing.revenue      += d.total_revenue_amount;
    existing.actual       += d.total_revenue_amount;
    existing.cancel       += d.cancelled_return_amount;
    existing.assignedDeals+= d.assigned_deals_count;
    existing.callCount    += d.total_calls || 0;
    // 成交率：用本次值覆蓋（或加權平均，此處取最新）
    if (d.closing_rate_percent != null) existing.closingRate = d.closing_rate_percent;
    existing.platforms[d.platform_name] = (existing.platforms[d.platform_name] || 0) + d.total_revenue_amount;
    map.set(key, existing);
  }

  // ── 排序規則鎖死（規則六）：總業績 desc → 成交率 desc → 派單成交 desc → 追續單金額 desc ──
  const sorted = [...map.entries()].sort(([, a], [, b]) =>
    b.revenue - a.revenue ||
    b.closingRate - a.closingRate ||
    b.assignedDeals - a.assignedDeals ||
    b.follow - a.follow
  );

  // 產生 dataHash（確保每次計算結果可比對）
  const hashInput = sorted.map(([name, d]) => `${name}:${d.revenue}:${d.closingRate}:${d.assignedDeals}:${d.follow}`).join('|');
  const dataHash = createHash('sha256').update(hashInput).digest('hex').slice(0, 16);
  const computedAt = new Date().toISOString();

  const doRanking = db.transaction(() => {
    db.prepare('DELETE FROM integrated_rankings WHERE report_date = ?').run(report_date);
    db.prepare('DELETE FROM dispatch_group_results WHERE report_date = ?').run(report_date);

    const insertRanking = db.prepare(`INSERT INTO integrated_rankings
      (report_date, employee_name, normalized_name, total_followup_count, total_followup_amount, total_revenue_amount, total_actual_amount, total_cancel_amount, rank_no, ranking_rule_text, source_platform_data)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);

    const insertDispatch = db.prepare(`INSERT INTO dispatch_group_results
      (report_date, employee_name, normalized_name, rank_no, dispatch_group, group_order_no, suggestion_text, pressure_text, motivation_text)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`);

    sorted.forEach(([name, data], idx) => {
      const rank = idx + 1;
      const groupCode = assignGroup(rank);
      const groupOrder = groupCode === 'A1' ? rank
        : groupCode === 'A2' ? rank - 4
        : groupCode === 'B'  ? rank - 10
        : rank - 18;

      insertRanking.run(report_date, name, name, data.dispatch, data.follow, data.revenue, data.actual, data.cancel, rank,
        '【總業績】desc→【成交率】desc→【派單成交】desc→【追續單金額】desc', JSON.stringify(data.platforms));

      const suggestion = buildSuggestion(name, rank, groupCode, data.follow, data.dispatch);
      const pressure   = rank <= 3 ? '站頂端不能鬆，每一天都在定整隊節奏' : groupCode === 'C' ? '今天必須出一筆實收，否則順位繼續往後' : '再不推進，後段隨時追上來';
      const motivation = rank <= 3 ? '今天再收一波，整隊節奏由你定' : '💪 加把勁，位置是打出來的！';

      insertDispatch.run(report_date, name, name, rank, groupCode, groupOrder, suggestion, pressure, motivation);
    });
  });
  doRanking();

  const rankings = db.prepare('SELECT * FROM integrated_rankings WHERE report_date = ? ORDER BY rank_no').all(report_date);
  const groups   = db.prepare('SELECT * FROM dispatch_group_results WHERE report_date = ? ORDER BY rank_no').all(report_date);

  // ── 公告若已存在則一併嵌入，否則留空 ──
  const ann = db.prepare('SELECT * FROM announcement_outputs WHERE report_date = ?').get(report_date) as any;
  const announcementText = ann?.full_text ?? '';

  const groupedMap: Record<string, any[]> = { A1: [], A2: [], B: [], C: [] };
  for (const g of groups as any[]) groupedMap[g.dispatch_group]?.push(g);

  // 自動版號（日期-序號）
  const lastSnap = db.prepare("SELECT version FROM dispatch_snapshots WHERE report_date = ? ORDER BY computed_at DESC LIMIT 1").get(report_date) as any;
  let seqNo = 1;
  if (lastSnap?.version) {
    const m = lastSnap.version.match(/-(\d+)$/);
    if (m) seqNo = parseInt(m[1]) + 1;
  }
  const version = `${report_date}-${String(seqNo).padStart(3, '0')}`;
  writeLog('INFO', `整合排名生成 | 日期:${report_date} | 人數:${sorted.length} | 版本:${version}`);

  db.prepare(`
    INSERT INTO dispatch_snapshots (version, report_date, computed_at, data_hash, audit_result, audit_panels, total_summary, ranking_list, dispatch_groups, announcement)
    VALUES (?, ?, ?, ?, 'PASS', '{}', '{}', ?, ?, ?)
    ON CONFLICT(version) DO UPDATE SET
      ranking_list=excluded.ranking_list,
      dispatch_groups=excluded.dispatch_groups,
      announcement=excluded.announcement
  `).run(
    version, report_date, computedAt, dataHash,
    JSON.stringify(rankings),
    JSON.stringify(groupedMap),
    announcementText,
  );

  return res.json({
    success: true, message: '整合排名生成成功',
    data: {
      report_date,
      version: dataHash,
      computedAt,
      dataHash,
      groupRules: { A1: '1–4', A2: '5–10', B: '11–18', C: '19+' },
      sortRules: '總業績 desc → 續單金額 desc → 追續成交 desc',
      rankings,
      groups: groupedMap,
    },
    error_code: null,
  });
});

// GET /api/v1/rankings/:date
router.get('/:date', (req, res) => {
  const db = getDb();
  const rankings = db.prepare('SELECT * FROM integrated_rankings WHERE report_date = ? ORDER BY rank_no').all(req.params.date);
  const groups   = db.prepare('SELECT * FROM dispatch_group_results WHERE report_date = ? ORDER BY rank_no').all(req.params.date);
  if (rankings.length === 0) return res.status(404).json({ success: false, message: '尚未排名', data: null, error_code: 'NOT_RANKED' });
  return res.json({ success: true, message: '查詢成功', data: { rankings, groups }, error_code: null });
});

export default router;
