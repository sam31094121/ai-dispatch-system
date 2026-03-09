import { Router } from 'express';
import { getDb } from '../db/database.js';

const router = Router();

// POST /api/v1/rankings/generate — 生成整合排名
router.post('/generate', (req, res) => {
  const db = getDb();
  const { report_date } = req.body;
  if (!report_date) return res.status(400).json({ success: false, message: '需提供報表日期', data: null, error_code: 'MISSING_FIELDS' });

  // 骨牌防呆
  const reports = db.prepare("SELECT * FROM daily_reports WHERE report_date = ?").all(report_date) as any[];
  if (reports.length === 0) return res.status(404).json({ success: false, message: `${report_date} 無任何報表`, data: null, error_code: 'NO_REPORTS' });

  const auditFailed = reports.filter(r => r.audit_status !== '審計通過');
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

  // 按姓名整合
  const map = new Map<string, { dispatch: number; follow: number; revenue: number; actual: number; cancel: number; platforms: Record<string, number> }>();
  for (const d of allDetails) {
    const key = d.normalized_name;
    const existing = map.get(key) || { dispatch: 0, follow: 0, revenue: 0, actual: 0, cancel: 0, platforms: {} };
    existing.dispatch += d.followup_deals_count;
    existing.follow += d.followup_amount;
    existing.revenue += d.total_revenue_amount;
    existing.actual += d.total_revenue_amount;
    existing.cancel += d.cancelled_return_amount;
    existing.platforms[d.platform_name] = (existing.platforms[d.platform_name] || 0) + d.total_revenue_amount;
    map.set(key, existing);
  }

  const sorted = [...map.entries()].sort(([, a], [, b]) => b.revenue - a.revenue || b.follow - a.follow || b.dispatch - a.dispatch);

  const doRanking = db.transaction(() => {
    db.prepare('DELETE FROM integrated_rankings WHERE report_date = ?').run(report_date);
    db.prepare('DELETE FROM dispatch_group_results WHERE report_date = ?').run(report_date);

    const insertRanking = db.prepare(`INSERT INTO integrated_rankings
      (report_date, employee_name, normalized_name, total_followup_count, total_followup_amount, total_revenue_amount, total_actual_amount, total_cancel_amount, rank_no, ranking_rule_text, source_platform_data)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);

    const insertDispatch = db.prepare(`INSERT INTO dispatch_group_results
      (report_date, employee_name, normalized_name, rank_no, dispatch_group, group_order_no, suggestion_text, pressure_text, motivation_text)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`);

    const total = sorted.length;
    const a1Count = Math.max(1, Math.ceil(total * 0.2));
    const a2Count = Math.max(1, Math.ceil(total * 0.3));

    sorted.forEach(([name, data], idx) => {
      const rank = idx + 1;
      insertRanking.run(report_date, name, name, data.dispatch, data.follow, data.revenue, data.actual, data.cancel, rank,
        '依【總業績】→【續單】→【追單】', JSON.stringify(data.platforms));

      let groupCode: string;
      let groupOrder: number;
      if (rank <= a1Count) { groupCode = 'A1'; groupOrder = rank; }
      else if (rank <= a1Count + a2Count) { groupCode = 'A2'; groupOrder = rank - a1Count; }
      else if (rank <= total - Math.ceil(total * 0.1)) { groupCode = 'B'; groupOrder = rank - a1Count - a2Count; }
      else { groupCode = 'C'; groupOrder = rank - total + Math.ceil(total * 0.1); }

      const suggestion = rank <= 3 ? '優先收口高續單' : rank <= Math.ceil(total * 0.5) ? '穩定產出，保位衝高' : '需要補量，持續追進';
      const pressure = rank <= 3 ? '站第一不能鬆' : '再不推進，位子就沒了';
      const motivation = rank <= 3 ? '今天再收一波，整隊節奏由你定' : '💪 加把勁衝上去！';

      insertDispatch.run(report_date, name, name, rank, groupCode, groupOrder, suggestion, pressure, motivation);
    });
  });
  doRanking();

  const rankings = db.prepare('SELECT * FROM integrated_rankings WHERE report_date = ? ORDER BY rank_no').all(report_date);
  return res.json({
    success: true, message: '整合排名生成成功',
    data: { report_date, rankings },
    error_code: null,
  });
});

// GET /api/v1/rankings/:date
router.get('/:date', (req, res) => {
  const db = getDb();
  const rankings = db.prepare('SELECT * FROM integrated_rankings WHERE report_date = ? ORDER BY rank_no').all(req.params.date);
  if (rankings.length === 0) return res.status(404).json({ success: false, message: '尚未排名', data: null, error_code: 'NOT_RANKED' });
  return res.json({ success: true, message: '查詢成功', data: { rankings }, error_code: null });
});

export default router;
