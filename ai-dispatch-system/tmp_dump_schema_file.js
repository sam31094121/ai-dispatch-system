import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const dbPath = path.resolve('c:/Users/DRAGON/Desktop/兆櫃系統/ai-dispatch-system/data/dispatch.db');
const db = new Database(dbPath);

const tables = ['integrated_rankings', 'dispatch_group_results', 'announcement_outputs'];
let out = '';
tables.forEach(t => {
  const row = db.prepare(`SELECT sql FROM sqlite_master WHERE type='table' AND name=?`).get(t);
  out += `\n--- ${t} ---\n` + (row ? row.sql : 'Not found') + '\n';
});

fs.writeFileSync('c:/Users/DRAGON/Desktop/兆櫃系統/ai-dispatch-system/schema.txt', out);
db.close();
console.log('Schema dumped to schema.txt');
