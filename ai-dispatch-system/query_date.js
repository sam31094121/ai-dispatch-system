import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const db = new Database(path.join(__dirname, 'server', 'data', 'dispatch.db'));

try {
  const rows = db.prepare('SELECT DISTINCT report_date FROM daily_reports LIMIT 5').all();
  console.log('Daily Reports Date:', rows);
  
  const rankRows = db.prepare('SELECT DISTINCT report_date FROM integrated_rankings LIMIT 5').all();
  console.log('Rankings Date:', rankRows);
} catch (e) {
  console.error(e);
}
db.close();
