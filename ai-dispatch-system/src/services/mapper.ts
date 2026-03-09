// ═══════════════════════════════════════════════════════
// Mapper：snake_case ↔ camelCase 轉換
// 所有欄位轉換只走這裡，禁止前端自行翻譯
// ═══════════════════════════════════════════════════════

import type {
  ApiDailyReport, ApiReportTotals, ApiReportDetail,
  ApiAutoFixLog, ApiAuditResult, ApiAuditIssue,
  ApiParseLog, ApiRanking, ApiDispatchGroup,
  ApiAnnouncement, ApiVersionLog, ApiAppUser,
} from '../types/api';
import type {
  DailyReport, ReportTotals, ReportDetail,
  AutoFixLog, AuditResult, AuditIssue,
  ParseLog, Ranking, DispatchGroup,
  Announcement, VersionLog, AppUser,
} from '../types/report';

// ── 通用轉換工具 ──

/** snake_case key → camelCase key */
function snakeKeyToCamel(key: string): string {
  return key.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
}

/** camelCase key → snake_case key */
function camelKeyToSnake(key: string): string {
  return key.replace(/[A-Z]/g, (c) => `_${c.toLowerCase()}`);
}

/** 深層轉換物件所有 key：snake → camel */
export function snakeToCamel<T>(obj: unknown): T {
  if (obj === null || obj === undefined) return obj as T;
  if (Array.isArray(obj)) return obj.map((item) => snakeToCamel(item)) as T;
  if (typeof obj === 'object') {
    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
      result[snakeKeyToCamel(key)] = snakeToCamel(value);
    }
    return result as T;
  }
  return obj as T;
}

/** 深層轉換物件所有 key：camel → snake */
export function camelToSnake<T>(obj: unknown): T {
  if (obj === null || obj === undefined) return obj as T;
  if (Array.isArray(obj)) return obj.map((item) => camelToSnake(item)) as T;
  if (typeof obj === 'object') {
    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
      result[camelKeyToSnake(key)] = camelToSnake(value);
    }
    return result as T;
  }
  return obj as T;
}

// ── 具名 mapper：API → 前端 ──

export function mapApiUserToFrontend(raw: ApiAppUser): AppUser {
  return snakeToCamel<AppUser>(raw);
}

export function mapApiReportToFrontend(raw: ApiDailyReport): DailyReport {
  return snakeToCamel<DailyReport>(raw);
}

export function mapApiTotalsToFrontend(raw: ApiReportTotals): ReportTotals {
  return snakeToCamel<ReportTotals>(raw);
}

export function mapApiDetailToFrontend(raw: ApiReportDetail): ReportDetail {
  return snakeToCamel<ReportDetail>(raw);
}

export function mapApiAutoFixLogToFrontend(raw: ApiAutoFixLog): AutoFixLog {
  return snakeToCamel<AutoFixLog>(raw);
}

export function mapApiAuditResultToFrontend(raw: ApiAuditResult): AuditResult {
  return snakeToCamel<AuditResult>(raw);
}

export function mapApiAuditIssueToFrontend(raw: ApiAuditIssue): AuditIssue {
  return snakeToCamel<AuditIssue>(raw);
}

export function mapApiParseLogToFrontend(raw: ApiParseLog): ParseLog {
  return snakeToCamel<ParseLog>(raw);
}

export function mapApiRankingToFrontend(raw: ApiRanking): Ranking {
  return snakeToCamel<Ranking>(raw);
}

export function mapApiDispatchGroupToFrontend(raw: ApiDispatchGroup): DispatchGroup {
  return snakeToCamel<DispatchGroup>(raw);
}

export function mapApiAnnouncementToFrontend(raw: ApiAnnouncement): Announcement {
  return snakeToCamel<Announcement>(raw);
}

export function mapApiVersionLogToFrontend(raw: ApiVersionLog): VersionLog {
  return snakeToCamel<VersionLog>(raw);
}

// ── 具名 mapper：前端 → API ──

export function mapFrontendToApiReport(data: Partial<DailyReport>): Partial<ApiDailyReport> {
  return camelToSnake<Partial<ApiDailyReport>>(data);
}

export function mapFrontendToApiDetail(data: Partial<ReportDetail>): Partial<ApiReportDetail> {
  return camelToSnake<Partial<ApiReportDetail>>(data);
}

export function mapFrontendToApiTotals(data: Partial<ReportTotals>): Partial<ApiReportTotals> {
  return camelToSnake<Partial<ApiReportTotals>>(data);
}
