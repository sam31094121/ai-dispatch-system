import Database from 'better-sqlite3';
import path from 'path';

const dbPath = path.resolve('c:/Users/DRAGON/Desktop/兆櫃系統/ai-dispatch-system/data/dispatch.db');
const db = new Database(dbPath);

const tables = ['integrated_rankings', 'dispatch_group_results', 'announcement_outputs'];
tables.forEach(t => {
  const row = db.prepare(`SELECT sql FROM sqlite_master WHERE type='table' AND name=?`).get(t);
  console.log(`\n--- ${t} ---`);
  console.log(row ? row.sql : 'Not found');
});

db.close();
