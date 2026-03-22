import Database from 'better-sqlite3';
const db = new Database('./data/dispatch.db');

const row = db.prepare('SELECT * FROM dispatch_snapshots ORDER BY computed_at DESC LIMIT 1').get();
console.log('snapshot report_date:', JSON.stringify(row.report_date));
console.log('snapshot report_date length:', row.report_date.length);

const annRow = db.prepare('SELECT * FROM announcement_outputs WHERE report_date = ?').get(row.report_date);
console.log('annRow found:', !!annRow);
if (annRow) {
  console.log('full_text len:', annRow.full_text?.length);
  console.log('line_text len:', annRow.line_text?.length);
  console.log('manager_text len:', annRow.manager_text?.length);
}

// 也列出所有 announcement_outputs 的 report_date
const all = db.prepare('SELECT report_date, length(report_date) as len FROM announcement_outputs').all();
console.log('all announcement dates:', all);
