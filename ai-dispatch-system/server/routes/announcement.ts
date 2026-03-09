import { Router } from 'express';
import { getDb } from '../db/database.js';

const router = Router();

// POST /api/v1/announcements/generate
router.post('/generate', (req, res) => {
  const db = getDb();
  const { report_date } = req.body;
  if (!report_date) return res.status(400).json({ success: false, message: '需提供報表日期', data: null, error_code: 'MISSING_FIELDS' });

  // 骨牌防呆
  const rankings = db.prepare('SELECT * FROM integrated_rankings WHERE report_date = ? ORDER BY rank_no').all(report_date) as any[];
  if (rankings.length === 0) return res.status(403).json({ success: false, message: '排名尚未生成，無法輸出公告', data: null, error_code: 'RANKING_BLOCKED' });

  const groups = db.prepare('SELECT * FROM dispatch_group_results WHERE report_date = ? ORDER BY rank_no').all(report_date) as any[];

  const d = new Date(report_date);
  const nextDay = new Date(d); nextDay.setDate(d.getDate() + 1);
  const dateStr = `${d.getMonth() + 1}/${d.getDate()}`;
  const nextStr = `${nextDay.getMonth() + 1}/${nextDay.getDate()}`;
  const totalRevenue = rankings.reduce((s: number, r: any) => s + r.total_revenue_amount, 0);

  // 完整版
  let full = `📣【AI 派單公告｜${dateStr} 結算 → ${nextStr} 派單順序】\n\n`;
  full += `今日整合名次（依【總業績】→【續單】→【追單】排序）\n\n`;
  for (const r of rankings) {
    full += `${r.rank_no}、${r.employee_name}｜【追單】${r.total_followup_count}｜【續單】${r.total_followup_amount.toLocaleString()}｜【總業績】${r.total_revenue_amount.toLocaleString()}｜【實收】${r.total_actual_amount.toLocaleString()}\n`;
  }
  full += `\n明日派單順序\n`;
  for (const code of ['A1', 'A2', 'B', 'C']) {
    const m = groups.filter(g => g.dispatch_group === code);
    if (m.length) full += `【${code}】${m.map(x => x.employee_name).join('、')}\n`;
  }
  full += `\n執行規則\n- 照順序派。前面全忙，才往後。\n- 不得指定。不得跳位。\n- 同客戶回撥，優先回原承接人。\n\n`;
  for (const g of groups) { full += `${g.rank_no}. ${g.employee_name}：${g.suggestion_text}｜${g.pressure_text}｜${g.motivation_text}\n`; }
  full += `\n看完請回 +1`;

  // LINE版
  let line = `📣 AI派單重點：今日第一名${rankings[0]?.employee_name || ''}，明日A1順序如下\n\n`;
  for (const r of rankings) { line += `${r.rank_no}. ${r.employee_name} $${r.total_revenue_amount.toLocaleString()}\n`; }

  // 超短版
  const short = `今日第一名${rankings[0]?.employee_name || ''}，明日照序派單，請看完回 +1。`;

  // 播報版
  let voice = `各位夥伴請注意，今天三平台資料已完成審計。\n全員總業績 ${totalRevenue.toLocaleString()} 元。\n\n`;
  for (const r of rankings) { voice += `第${r.rank_no}名，${r.employee_name}，總業績${r.total_revenue_amount.toLocaleString()}元。\n`; }

  // 主管版
  let manager = `今日派單順序已鎖死，照順序派，不得跳位。\n\n`;
  for (const g of groups) { manager += `${g.rank_no}. ${g.employee_name}(${g.dispatch_group}) → ${g.pressure_text}\n`; }
  manager += `\n看完回 +1。`;

  const doInsert = db.transaction(() => {
    db.prepare('DELETE FROM announcement_outputs WHERE report_date = ?').run(report_date);
    db.prepare(`INSERT INTO announcement_outputs (report_date, full_text, line_text, short_text, voice_text, manager_text) VALUES (?, ?, ?, ?, ?, ?)`).run(report_date, full, line, short, voice, manager);
    db.prepare("UPDATE daily_reports SET announcement_status = '已生成', updated_at = datetime('now','localtime') WHERE report_date = ?").run(report_date);
  });
  doInsert();

  return res.json({
    success: true, message: '公告生成成功',
    data: { report_date, full_text: full, line_text: line, short_text: short, voice_text: voice, manager_text: manager },
    error_code: null,
  });
});

// GET /api/v1/announcements/:date
router.get('/:date', (req, res) => {
  const db = getDb();
  const ann = db.prepare('SELECT * FROM announcement_outputs WHERE report_date = ?').get(req.params.date) as any;
  if (!ann) return res.status(404).json({ success: false, message: '尚未生成公告', data: null, error_code: 'NOT_GENERATED' });
  return res.json({ success: true, message: '查詢成功', data: ann, error_code: null });
});

export default router;
