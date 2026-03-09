import { Router } from 'express';
import { getDb } from '../db/database.js';

const router = Router();

// POST /api/v1/reports — 新增每日報表
router.post('/', (req, res) => {
  const { report_date, platform_name, report_mode, raw_text_content, note_text } = req.body;
  if (!report_date || !platform_name || !raw_text_content) {
    return res.status(400).json({ success: false, message: '報表日期、平台、原始文字不可空白', data: null, error_code: 'MISSING_FIELDS' });
  }
  const db = getDb();
  try {
    const result = db.prepare(`INSERT INTO daily_reports (report_date, platform_name, report_mode, raw_text_content, note_text)
      VALUES (?, ?, ?, ?, ?)`).run(report_date, platform_name, report_mode || '累積報表', raw_text_content, note_text || null);
    return res.json({
      success: true, message: '報表建立成功',
      data: { report_id: result.lastInsertRowid, report_date, platform_name, parse_status: '未解析', audit_status: '未審計' },
      error_code: null,
    });
  } catch (err: any) {
    if (err.message?.includes('UNIQUE')) {
      return res.status(409).json({ success: false, message: `${report_date} ${platform_name} 已有報表，不可重複`, data: null, error_code: 'DUPLICATE_REPORT' });
    }
    return res.status(500).json({ success: false, message: err.message, data: null, error_code: 'DB_ERROR' });
  }
});

// GET /api/v1/reports/:id — 讀取單筆報表
router.get('/:id', (req, res) => {
  const db = getDb();
  const report = db.prepare('SELECT * FROM daily_reports WHERE id = ?').get(req.params.id);
  if (!report) return res.status(404).json({ success: false, message: '報表不存在', data: null, error_code: 'NOT_FOUND' });
  return res.json({ success: true, message: '查詢成功', data: report, error_code: null });
});

// GET /api/v1/reports — 讀取多筆報表
router.get('/', (req, res) => {
  const db = getDb();
  const { date, platform_name } = req.query;
  let sql = 'SELECT id, report_date, platform_name, report_mode, parse_status, audit_status, announcement_status, updated_at FROM daily_reports WHERE 1=1';
  const params: any[] = [];
  if (date) { sql += ' AND report_date = ?'; params.push(date); }
  if (platform_name) { sql += ' AND platform_name = ?'; params.push(platform_name); }
  sql += ' ORDER BY report_date DESC, platform_name';
  const reports = db.prepare(sql).all(...params);
  return res.json({ success: true, message: '查詢成功', data: { items: reports, total: reports.length }, error_code: null });
});

// PUT /api/v1/reports/:id/raw — 更新原始報表內容
router.put('/:id/raw', (req, res) => {
  const { raw_text_content, change_reason } = req.body;
  if (!raw_text_content) return res.status(400).json({ success: false, message: '原始文字不可空白', data: null, error_code: 'MISSING_FIELDS' });
  const db = getDb();
  const existing = db.prepare('SELECT raw_text_content FROM daily_reports WHERE id = ?').get(req.params.id) as any;
  if (!existing) return res.status(404).json({ success: false, message: '報表不存在', data: null, error_code: 'NOT_FOUND' });

  const update = db.transaction(() => {
    db.prepare(`INSERT INTO version_change_logs (report_id, changed_field_name, value_before, value_after, change_reason, change_source)
      VALUES (?, 'raw_text_content', ?, ?, ?, '人工')`).run(req.params.id, existing.raw_text_content, raw_text_content, change_reason || '手動更新');
    db.prepare(`UPDATE daily_reports SET raw_text_content = ?, parse_status = '未解析', audit_status = '未審計',
      announcement_status = '未生成', updated_at = datetime('now','localtime') WHERE id = ?`).run(raw_text_content, req.params.id);
  });
  update();
  return res.json({ success: true, message: '原始內容已更新，所有下游狀態已重置', data: { report_id: Number(req.params.id), updated: true }, error_code: null });
});

// ─── 解析相關 (嵌套在 reports 下) ───

function parseNumber(s: string): number {
  return Number(s.replace(/,/g, '').replace(/[^\d.-]/g, '')) || 0;
}

// POST /api/v1/reports/:id/parse — 執行 AI 解析
router.post('/:id/parse', (req, res) => {
  const db = getDb();
  const reportId = Number(req.params.id);
  const report = db.prepare('SELECT * FROM daily_reports WHERE id = ?').get(reportId) as any;
  if (!report) return res.status(404).json({ success: false, message: '報表不存在', data: null, error_code: 'NOT_FOUND' });

  const raw = report.raw_text_content;
  const lines = raw.split('\n').map((l: string) => l.trim()).filter((l: string) => l.length > 0);
  const rows: any[] = [];
  const fixes: any[] = [];

  for (const line of lines) {
    let cleaned = line;
    // A級修正：全形數字
    const fullDigits = '０１２３４５６７８９';
    for (let i = 0; i < fullDigits.length; i++) {
      if (cleaned.includes(fullDigits[i])) {
        fixes.push({ fix_type: '全形半形修正', field_name: '文字', value_before: fullDigits[i], value_after: String(i) });
        cleaned = cleaned.split(fullDigits[i]).join(String(i));
      }
    }
    // A級修正：括號
    if (/\(新人\)/.test(cleaned)) {
      fixes.push({ fix_type: '括號修正', field_name: '新人標記', value_before: '(新人)', value_after: '（新人）' });
      cleaned = cleaned.replace(/\(新人\)/g, '（新人）');
    }

    const match = cleaned.match(/(\d+)[、,.\s]+(.+?)(?:（新人）)?\s*[｜|]\s*【追單】\s*(\d[\d,]*)\s*[｜|]\s*【續單】\s*([\d,]+)\s*[｜|]\s*【總業績】\s*([\d,]+)\s*[｜|]\s*【實收】\s*([\d,]+)/);
    if (match) {
      const rawName = match[2].trim();
      rows.push({
        employee_name: rawName,
        identity_tag: cleaned.includes('（新人）') ? '新人' : '一般',
        followup_deals_count: parseNumber(match[3]),
        followup_amount: parseNumber(match[4]),
        total_revenue_amount: parseNumber(match[5]),
        total_actual: parseNumber(match[6]),
        raw_row_order: rows.length + 1,
      });
    }
  }

  if (rows.length === 0) {
    db.prepare("UPDATE daily_reports SET parse_status = '解析失敗', updated_at = datetime('now','localtime') WHERE id = ?").run(reportId);
    db.prepare("INSERT INTO ai_parse_logs (report_id, parse_stage, parse_result, description_text) VALUES (?, '結構辨識', '失敗', '無法解析任何員工資料')").run(reportId);
    return res.status(400).json({ success: false, message: '無法解析任何員工資料', data: null, error_code: 'PARSE_FAILED' });
  }

  const doInsert = db.transaction(() => {
    db.prepare('DELETE FROM daily_report_details WHERE report_id = ?').run(reportId);
    db.prepare('DELETE FROM daily_report_totals WHERE report_id = ?').run(reportId);
    db.prepare('DELETE FROM ai_auto_fix_logs WHERE report_id = ?').run(reportId);
    db.prepare('DELETE FROM ai_parse_logs WHERE report_id = ?').run(reportId);
    db.prepare('DELETE FROM ai_audit_results WHERE report_id = ?').run(reportId);
    db.prepare('DELETE FROM ai_audit_issues WHERE report_id = ?').run(reportId);

    db.prepare("INSERT INTO ai_parse_logs (report_id, parse_stage, parse_result, description_text) VALUES (?, '格式清洗', '成功', ?)").run(reportId, `${fixes.length} 項格式修正`);
    db.prepare("INSERT INTO ai_parse_logs (report_id, parse_stage, parse_result, description_text) VALUES (?, '明細提取', '成功', ?)").run(reportId, `解析出 ${rows.length} 筆員工`);

    for (const f of fixes) {
      db.prepare(`INSERT INTO ai_auto_fix_logs (report_id, fix_level, fix_type, field_name, value_before, value_after, is_applied)
        VALUES (?, '可自動修正', ?, ?, ?, ?, 1)`).run(reportId, f.fix_type, f.field_name, f.value_before, f.value_after);
    }

    const insertDetail = db.prepare(`INSERT INTO daily_report_details (report_id, employee_name, normalized_name, identity_tag, followup_deals_count, followup_amount, total_revenue_amount, raw_row_order)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)`);
    for (const r of rows) {
      insertDetail.run(reportId, r.employee_name, r.employee_name, r.identity_tag, r.followup_deals_count, r.followup_amount, r.total_revenue_amount, r.raw_row_order);
    }

    const totalFollowupDeals = rows.reduce((s: number, r: any) => s + r.followup_deals_count, 0);
    const totalFollowup = rows.reduce((s: number, r: any) => s + r.followup_amount, 0);
    const totalRevenue = rows.reduce((s: number, r: any) => s + r.total_revenue_amount, 0);
    db.prepare(`INSERT INTO daily_report_totals (report_id, followup_deals_count, followup_amount, total_revenue_amount)
      VALUES (?, ?, ?, ?)`).run(reportId, totalFollowupDeals, totalFollowup, totalRevenue);

    db.prepare("UPDATE daily_reports SET parse_status = '解析成功', audit_status = '未審計', updated_at = datetime('now','localtime') WHERE id = ?").run(reportId);
  });
  doInsert();

  const totals = db.prepare('SELECT * FROM daily_report_totals WHERE report_id = ?').get(reportId);
  const autoFixLogs = db.prepare('SELECT * FROM ai_auto_fix_logs WHERE report_id = ? ORDER BY id').all(reportId);

  return res.json({
    success: true, message: '解析完成',
    data: { report_id: reportId, parse_status: '解析成功', totals, details_count: rows.length, auto_fix_logs: autoFixLogs, has_conflict: false },
    error_code: null,
  });
});

// GET /api/v1/reports/:id/parse-result — 讀取解析結果
router.get('/:id/parse-result', (req, res) => {
  const db = getDb();
  const reportId = Number(req.params.id);
  const totals = db.prepare('SELECT * FROM daily_report_totals WHERE report_id = ?').get(reportId);
  const details = db.prepare('SELECT * FROM daily_report_details WHERE report_id = ? ORDER BY raw_row_order').all(reportId);
  if (!totals) return res.status(404).json({ success: false, message: '尚未解析', data: null, error_code: 'NOT_PARSED' });
  return res.json({ success: true, message: '解析結果讀取成功', data: { report_id: reportId, totals, details }, error_code: null });
});

// PUT /api/v1/reports/:id/totals — 更新總計
router.put('/:id/totals', (req, res) => {
  const db = getDb();
  const reportId = Number(req.params.id);
  const existing = db.prepare('SELECT * FROM daily_report_totals WHERE report_id = ?').get(reportId) as any;
  if (!existing) return res.status(404).json({ success: false, message: '總計不存在', data: null, error_code: 'NOT_FOUND' });

  const allowedFields = ['total_calls', 'assigned_deals_count', 'followup_deals_count', 'closing_rate_percent', 'followup_amount', 'cancelled_return_amount', 'total_revenue_amount'];
  const updates: string[] = [];
  const params: any[] = [];
  for (const [key, value] of Object.entries(req.body)) {
    if (key === 'change_reason' || !allowedFields.includes(key)) continue;
    updates.push(`${key} = ?`);
    params.push(value);
    db.prepare(`INSERT INTO version_change_logs (report_id, changed_field_name, value_before, value_after, change_reason, change_source)
      VALUES (?, ?, ?, ?, ?, '人工')`).run(reportId, key, String(existing[key] ?? ''), String(value), req.body.change_reason || '人工確認總計數字');
  }
  if (updates.length > 0) {
    params.push(reportId);
    db.prepare(`UPDATE daily_report_totals SET ${updates.join(', ')}, updated_at = datetime('now','localtime') WHERE report_id = ?`).run(...params);
  }
  return res.json({ success: true, message: '總計更新成功', data: { report_id: reportId, updated: true }, error_code: null });
});

// ─── 審計相關 ───

// POST /api/v1/reports/:id/audit — 執行 AI 審計
router.post('/:id/audit', (req, res) => {
  const db = getDb();
  const reportId = Number(req.params.id);
  const report = db.prepare('SELECT * FROM daily_reports WHERE id = ?').get(reportId) as any;
  if (!report) return res.status(404).json({ success: false, message: '報表不存在', data: null, error_code: 'NOT_FOUND' });
  if (report.parse_status !== '解析成功') return res.status(400).json({ success: false, message: '尚未完成解析，不可審計', data: null, error_code: 'NOT_PARSED' });

  const totals = db.prepare('SELECT * FROM daily_report_totals WHERE report_id = ?').get(reportId) as any;
  const details = db.prepare('SELECT * FROM daily_report_details WHERE report_id = ? ORDER BY raw_row_order').all(reportId) as any[];

  const doAudit = db.transaction(() => {
    db.prepare('DELETE FROM ai_audit_results WHERE report_id = ?').run(reportId);
    db.prepare('DELETE FROM ai_audit_issues WHERE report_id = ?').run(reportId);

    const insertIssue = db.prepare(`INSERT INTO ai_audit_issues (report_id, detail_id, issue_type, issue_level, field_name, raw_value, expected_value, diff_value, suggestion_text)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`);

    let consistencyPass = true;
    let logicPass = true;

    // 天地盤
    const checks = [
      { field: 'followup_deals_count', total: totals.followup_deals_count, sum: details.reduce((s: number, d: any) => s + d.followup_deals_count, 0) },
      { field: 'followup_amount', total: totals.followup_amount, sum: details.reduce((s: number, d: any) => s + d.followup_amount, 0) },
      { field: 'total_revenue_amount', total: totals.total_revenue_amount, sum: details.reduce((s: number, d: any) => s + d.total_revenue_amount, 0) },
    ];
    for (const c of checks) {
      if (c.total !== c.sum) {
        consistencyPass = false;
        insertIssue.run(reportId, null, '天地盤差額', '鎖死', c.field, String(c.total), String(c.sum), String(c.total - c.sum), `總計與個人加總差額不為零，請人工確認`);
      }
    }

    // 邏輯盤
    for (const d of details) {
      if (d.followup_deals_count > 0 && d.total_revenue_amount === 0) {
        logicPass = false;
        insertIssue.run(reportId, d.id, '追單有值業績為零', '鎖死', d.normalized_name, String(d.followup_deals_count), '0', null, `${d.normalized_name} 追單 ${d.followup_deals_count} 但業績 0`);
      }
      if (d.followup_amount > 0 && d.total_revenue_amount === 0) {
        logicPass = false;
        insertIssue.run(reportId, d.id, '續單有值業績為零', '鎖死', d.normalized_name, String(d.followup_amount), '0', null, `${d.normalized_name} 續單 ${d.followup_amount} 但業績 0`);
      }
    }

    // 姓名重複
    const nameCount: Record<string, number> = {};
    for (const d of details) { nameCount[d.normalized_name] = (nameCount[d.normalized_name] || 0) + 1; }
    for (const [name, count] of Object.entries(nameCount)) {
      if (count > 1) {
        logicPass = false;
        insertIssue.run(reportId, null, '姓名衝突', '鎖死', name, String(count), '1', null, `姓名「${name}」出現 ${count} 次`);
      }
    }

    const overallPass = consistencyPass && logicPass;
    const unresolvedFixes = db.prepare("SELECT COUNT(*) as cnt FROM ai_auto_fix_logs WHERE report_id = ? AND fix_level = '禁止自修' AND is_applied = 0").get(reportId) as any;
    const canProceed = overallPass && (unresolvedFixes?.cnt ?? 0) === 0;

    db.prepare(`INSERT INTO ai_audit_results (report_id, consistency_result, logic_result, cumulative_result, final_result, can_generate_ranking, can_generate_dispatch, can_generate_announce, audit_summary)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(
      reportId, consistencyPass ? '通過' : '失敗', logicPass ? '通過' : '失敗', '通過',
      overallPass ? '通過' : '失敗', canProceed ? 1 : 0, canProceed ? 1 : 0, canProceed ? 1 : 0,
      overallPass ? '所有檢查通過' : '有異常需處理');

    db.prepare(`UPDATE daily_reports SET audit_status = ?, updated_at = datetime('now','localtime') WHERE id = ?`)
      .run(overallPass ? '審計通過' : '審計失敗', reportId);
  });
  doAudit();

  const auditResult = db.prepare('SELECT * FROM ai_audit_results WHERE report_id = ?').get(reportId) as any;
  const issues = db.prepare('SELECT * FROM ai_audit_issues WHERE report_id = ? ORDER BY id').all(reportId);

  return res.json({
    success: auditResult.final_result === '通過', message: auditResult.final_result === '通過' ? '審計完成' : '審計失敗，禁止進入派單',
    data: { report_id: reportId, ...auditResult, issues },
    error_code: auditResult.final_result === '通過' ? null : 'AUDIT_FAILED',
  });
});

// GET /api/v1/reports/:id/audit-result — 讀取審計結果
router.get('/:id/audit-result', (req, res) => {
  const db = getDb();
  const result = db.prepare('SELECT * FROM ai_audit_results WHERE report_id = ?').get(req.params.id);
  const issues = db.prepare('SELECT * FROM ai_audit_issues WHERE report_id = ? ORDER BY id').all(req.params.id);
  if (!result) return res.status(404).json({ success: false, message: '尚未審計', data: null, error_code: 'NOT_AUDITED' });
  return res.json({ success: true, message: '查詢成功', data: { ...result, issues }, error_code: null });
});

// POST /api/v1/reports/:id/apply-fixes
router.post('/:id/apply-fixes', (req, res) => {
  const db = getDb();
  const reportId = Number(req.params.id);
  const { fix_log_ids } = req.body;
  if (!fix_log_ids || !Array.isArray(fix_log_ids)) return res.status(400).json({ success: false, message: '需提供修正項目列表', data: null, error_code: 'MISSING_FIELDS' });

  const placeholders = fix_log_ids.map(() => '?').join(',');
  const fixes = db.prepare(`SELECT * FROM ai_auto_fix_logs WHERE report_id = ? AND id IN (${placeholders})`).all(reportId, ...fix_log_ids) as any[];
  const blocked = fixes.filter(f => f.fix_level === '禁止自修');
  if (blocked.length > 0) {
    return res.status(403).json({ success: false, message: `${blocked.length} 項為「禁止自修」，不可套用`, data: null, error_code: 'FIX_BLOCKED' });
  }

  db.prepare(`UPDATE ai_auto_fix_logs SET is_applied = 1 WHERE report_id = ? AND id IN (${placeholders})`).run(reportId, ...fix_log_ids);
  return res.json({ success: true, message: '可套用修正已完成', data: { applied_count: fix_log_ids.length, skipped_count: 0 }, error_code: null });
});

// POST /api/v1/reports/:id/manual-approve
router.post('/:id/manual-approve', (req, res) => {
  const db = getDb();
  const reportId = Number(req.params.id);
  const { approved_by_user_id, note_text } = req.body;

  db.prepare(`UPDATE ai_audit_results SET final_result = '通過', can_generate_ranking = 1, can_generate_dispatch = 1, can_generate_announce = 1,
    audit_summary = ? WHERE report_id = ?`).run(`人工確認通過 by ${approved_by_user_id || 1}${note_text ? ': ' + note_text : ''}`, reportId);
  db.prepare("UPDATE daily_reports SET audit_status = '審計通過', updated_at = datetime('now','localtime') WHERE id = ?").run(reportId);
  db.prepare("UPDATE ai_audit_issues SET is_resolved = 1 WHERE report_id = ?").run(reportId);

  return res.json({ success: true, message: '人工確認完成', data: { report_id: reportId, approved: true }, error_code: null });
});

export default router;
