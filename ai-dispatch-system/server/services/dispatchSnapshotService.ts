import { getDb } from '../db/database.js';
import type { AuditResult, PlatformSummary } from './auditService.js';
import type { RankedMember, DispatchGroups } from './rankService.js';

export interface SnapshotData {
  version: string;
  report_date: string;
  computed_at?: string;
  data_hash: string;
  audit_result: 'PASS' | 'FAIL';
  audit_panels: any; // 會轉為 JSON 儲存
  total_summary: PlatformSummary;
  ranking_list: RankedMember[];
  dispatch_groups: DispatchGroups;
  announcement: string;
}

/**
 * 儲存快照至資料庫
 */
export function saveSnapshot(data: SnapshotData): void {
  const db = getDb();
  db.prepare(`
    INSERT OR REPLACE INTO dispatch_snapshots (
      version, report_date, data_hash, audit_result,
      audit_panels, total_summary, ranking_list, dispatch_groups, announcement
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    data.version,
    data.report_date,
    data.data_hash,
    data.audit_result,
    JSON.stringify(data.audit_panels),
    JSON.stringify(data.total_summary),
    JSON.stringify(data.ranking_list),
    JSON.stringify(data.dispatch_groups),
    data.announcement
  );
}

/**
 * 取得最新一筆快照
 */
export function getLatestSnapshot(): SnapshotData | null {
  const db = getDb();
  const row = db.prepare('SELECT * FROM dispatch_snapshots ORDER BY computed_at DESC LIMIT 1').get() as any;
  if (!row) return null;

  return {
    version: row.version,
    report_date: row.report_date,
    computed_at: row.computed_at,
    data_hash: row.data_hash,
    audit_result: row.audit_result as 'PASS' | 'FAIL',
    audit_panels: JSON.parse(row.audit_panels),
    total_summary: JSON.parse(row.total_summary),
    ranking_list: JSON.parse(row.ranking_list),
    dispatch_groups: JSON.parse(row.dispatch_groups),
    announcement: row.announcement,
  };
}

/**
 * 依據版本號取得快照
 */
export function getSnapshotByVersion(version: string): SnapshotData | null {
  const db = getDb();
  const row = db.prepare('SELECT * FROM dispatch_snapshots WHERE version = ?').get(version) as any;
  if (!row) return null;

  return {
    version: row.version,
    report_date: row.report_date,
    computed_at: row.computed_at,
    data_hash: row.data_hash,
    audit_result: row.audit_result as 'PASS' | 'FAIL',
    audit_panels: JSON.parse(row.audit_panels),
    total_summary: JSON.parse(row.total_summary),
    ranking_list: JSON.parse(row.ranking_list),
    dispatch_groups: JSON.parse(row.dispatch_groups),
    announcement: row.announcement,
  };
}

/**
 * 產生自動版號 (YYYY-MM-DD-XXX)
 */
export function generateAutoVersion(dateStr: string): string {
  const db = getDb();
  const countRow = db.prepare('SELECT COUNT(*) as cnt FROM dispatch_snapshots WHERE report_date = ?').get(dateStr) as { cnt: number };
  const count = countRow.cnt + 1;
  const countStr = String(count).padStart(3, '0');
  return `${dateStr}-${countStr}`;
}
