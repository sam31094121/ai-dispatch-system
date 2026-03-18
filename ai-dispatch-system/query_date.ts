import { getDb } from './server/db/database.js';

try {
  const db = getDb();
  const rows = db.prepare('SELECT DISTINCT report_date FROM daily_reports LIMIT 3').all();
  console.log('Daily Reports Dates:', rows);
  
  const rankRows = db.prepare('SELECT DISTINCT report_date FROM integrated_rankings LIMIT 3').all();
  console.log('Rankings Dates:', rankRows);
} catch (e) {
  console.error('查詢失敗:', e);
}
