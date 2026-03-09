import { Router } from 'express';
import { getDb } from '../db/database.js';

const router = Router();

// POST /api/v1/dispatch/generate — 生成派單
router.post('/generate', (req, res) => {
  const db = getDb();
  const { report_date } = req.body;
  if (!report_date) return res.status(400).json({ success: false, message: '需提供報表日期', data: null, error_code: 'MISSING_FIELDS' });

  const groups = db.prepare('SELECT * FROM dispatch_group_results WHERE report_date = ? ORDER BY rank_no').all(report_date) as any[];
  if (groups.length === 0) return res.status(404).json({ success: false, message: '尚未生成排名', data: null, error_code: 'NOT_RANKED' });

  const grouped: Record<string, any[]> = { A1: [], A2: [], B: [], C: [] };
  for (const g of groups) {
    grouped[g.dispatch_group]?.push(g);
  }
  return res.json({ success: true, message: '派單分組生成成功', data: { report_date, groups: grouped }, error_code: null });
});

// GET /api/v1/dispatch/:date
router.get('/:date', (req, res) => {
  const db = getDb();
  const groups = db.prepare('SELECT * FROM dispatch_group_results WHERE report_date = ? ORDER BY rank_no').all(req.params.date) as any[];
  if (groups.length === 0) return res.status(404).json({ success: false, message: '尚未派單', data: null, error_code: 'NOT_DISPATCHED' });
  const grouped: Record<string, any[]> = { A1: [], A2: [], B: [], C: [] };
  for (const g of groups) { grouped[g.dispatch_group]?.push(g); }
  return res.json({ success: true, message: '查詢成功', data: { report_date: req.params.date, groups: grouped }, error_code: null });
});

export default router;
