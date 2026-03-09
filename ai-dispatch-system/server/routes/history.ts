import { Router } from 'express';
import { getDb } from '../db/database.js';

const router = Router();

// GET /api/v1/history/reports
router.get('/reports', (req, res) => {
  const db = getDb();
  const { date_from, date_to, platform_name, employee_name, audit_status } = req.query;

  let sql = 'SELECT id, report_date, platform_name, report_mode, parse_status, audit_status, announcement_status, updated_at FROM daily_reports WHERE 1=1';
  const params: any[] = [];
  if (date_from) { sql += ' AND report_date >= ?'; params.push(date_from); }
  if (date_to) { sql += ' AND report_date <= ?'; params.push(date_to); }
  if (platform_name) { sql += ' AND platform_name = ?'; params.push(platform_name); }
  if (audit_status) { sql += ' AND audit_status = ?'; params.push(audit_status); }
  sql += ' ORDER BY report_date DESC, platform_name';

  let reports = db.prepare(sql).all(...params) as any[];

  if (employee_name) {
    const ids = (db.prepare('SELECT DISTINCT report_id FROM daily_report_details WHERE normalized_name LIKE ?').all(`%${employee_name}%`) as any[]).map(r => r.report_id);
    reports = reports.filter(r => ids.includes(r.id));
  }

  return res.json({ success: true, message: '查詢成功', data: { items: reports, total: reports.length }, error_code: null });
});

// GET /api/v1/history/versions/:reportId
router.get('/versions/:reportId', (req, res) => {
  const db = getDb();
  const logs = db.prepare('SELECT * FROM version_change_logs WHERE report_id = ? ORDER BY created_at DESC').all(req.params.reportId);
  return res.json({ success: true, message: '查詢成功', data: { items: logs, total: logs.length }, error_code: null });
});

// GET /api/v1/history/fixes/:reportId
router.get('/fixes/:reportId', (req, res) => {
  const db = getDb();
  const fixes = db.prepare('SELECT * FROM ai_auto_fix_logs WHERE report_id = ? ORDER BY id').all(req.params.reportId);
  return res.json({ success: true, message: '查詢成功', data: { items: fixes, total: fixes.length }, error_code: null });
});

export default router;
