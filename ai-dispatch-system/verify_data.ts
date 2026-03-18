import { getDb } from './server/db/database.js';
const db = getDb();
const count = db.prepare("SELECT COUNT(*) as cnt FROM integrated_rankings WHERE report_date = '2026-03-16'").get() as any;
const announce = db.prepare("SELECT COUNT(*) as cnt FROM announcement_outputs WHERE report_date = '2026-03-16'").get() as any;
console.log('3/16 Rankings Count:', count.cnt);
console.log('3/16 Announce Count:', announce.cnt);
db.close();
