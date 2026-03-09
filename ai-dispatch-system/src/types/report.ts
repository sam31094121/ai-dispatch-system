import type {
  平台名稱,
  報表模式,
  解析狀態,
  審計狀態,
  公告狀態,
  身分標記,
  修正等級,
  修正類型,
  審計結果,
  異常等級,
  審計異常類型,
  解析階段,
  解析結果,
  派單分組,
  使用者角色,
  異動來源,
} from '../constants/options';

export interface DailyReport {
  id: number;
  reportDate: string;
  platformName: 平台名稱;
  reportMode: 報表模式;
  rawTextContent: string;
  parseStatus: 解析狀態;
  auditStatus: 審計狀態;
  announcementStatus: 公告狀態;
  createdByUserId: number;
  noteText: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface DailyReportCreatePayload {
  reportDate: string;
  platformName: 平台名稱;
  reportMode: 報表模式;
  rawTextContent: string;
  noteText?: string;
}

export interface DailyReportUpdateRawPayload {
  rawTextContent: string;
  changeReason: string;
}

export interface DailyReportTotals {
  id: number;
  reportId: number;
  totalCalls: number;
  assignedDealsCount: number;
  followupDealsCount: number;
  closingRatePercent: number | null;
  followupAmount: number;
  cancelledReturnAmount: number;
  totalRevenueAmount: number;
  createdAt: string;
  updatedAt: string;
}

export interface DailyReportTotalsUpdatePayload {
  totalCalls: number;
  assignedDealsCount: number;
  followupDealsCount: number;
  closingRatePercent: number | null;
  followupAmount: number;
  cancelledReturnAmount: number;
  totalRevenueAmount: number;
  changeReason: string;
}

export interface DailyReportDetail {
  id: number;
  reportId: number;
  employeeName: string;
  normalizedName: string;
  identityTag: 身分標記;
  totalCalls: number;
  assignedDealsCount: number;
  followupDealsCount: number;
  closingRatePercent: number | null;
  followupAmount: number;
  cancelledReturnAmount: number;
  totalRevenueAmount: number;
  rawRowOrder: number;
  isManuallyConfirmed: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface DailyReportDetailUpdatePayload {
  employeeName: string;
  normalizedName: string;
  identityTag: 身分標記;
  totalCalls: number;
  assignedDealsCount: number;
  followupDealsCount: number;
  closingRatePercent: number | null;
  followupAmount: number;
  cancelledReturnAmount: number;
  totalRevenueAmount: number;
  changeReason: string;
}

export interface ParseRunPayload {
  forceReparse?: boolean;
}

export interface ParseResult {
  reportId: number;
  parseStatus: string;
  totals: DailyReportTotals;
  detailsCount: number;
  autoFixLogs: Array<{
    fixType: string;
    fieldName: string;
    valueBefore: string | null;
    valueAfter: string | null;
    isApplied: boolean;
  }>;
  hasConflict: boolean;
}

export interface ParseResultDetailView {
  reportId: number;
  totals: DailyReportTotals;
  details: DailyReportDetail[];
}

export interface ReportHistoryQuery {
  dateFrom?: string;
  dateTo?: string;
  platformName?: string;
  employeeName?: string;
  auditStatus?: string;
}

export interface ReportHistoryItem {
  reportId: number;
  reportDate: string;
  platformName: string;
  parseStatus: string;
  auditStatus: string;
  announcementStatus: string;
  updatedAt: string;
}

export interface ReportHistoryResult {
  items: ReportHistoryItem[];
  total: number;
}

// ═══════════════════════════════════════════════════════
// mapper.ts 所需的型別別名 & 補充型別
// ═══════════════════════════════════════════════════════

/** 別名：與 DailyReportTotals 相同，供 mapper.ts 使用 */
export type ReportTotals = DailyReportTotals;

/** 別名：與 DailyReportDetail 相同，供 mapper.ts 使用 */
export type ReportDetail = DailyReportDetail;

/** 使用者 */
export interface AppUser {
  id: number;
  account: string;
  passwordHash: string;
  displayName: string;
  roleName: 使用者角色;
  isEnabled: number;
  createdAt: string;
  lastLoginAt: string | null;
}

/** AI 解析紀錄 */
export interface ParseLog {
  id: number;
  reportId: number;
  parseStage: 解析階段;
  parseResult: 解析結果;
  descriptionText: string | null;
  createdAt: string;
}

/** AI 自動修正紀錄 */
export interface AutoFixLog {
  id: number;
  reportId: number;
  detailId: number | null;
  fixLevel: 修正等級;
  fixType: 修正類型;
  fieldName: string;
  valueBefore: string | null;
  valueAfter: string | null;
  isApplied: number;
  requiresManualConfirm: number;
  createdAt: string;
}

/** 審計結果 */
export interface AuditResult {
  id?: number;
  reportId: number;
  consistencyResult: 審計結果;
  logicResult: 審計結果;
  cumulativeResult: 審計結果;
  finalResult: 審計結果;
  canGenerateRanking: boolean;
  canGenerateDispatch: boolean;
  canGenerateAnnounce: boolean;
  auditSummary: string | null;
  createdAt?: string;
}

/** 審計異常項目 */
export interface AuditIssue {
  id: number;
  reportId: number;
  detailId: number | null;
  issueType: 審計異常類型;
  issueLevel: 異常等級;
  fieldName: string | null;
  rawValue: string | null;
  expectedValue: string | null;
  diffValue: string | null;
  suggestionText: string | null;
  isResolved: boolean;
  createdAt: string;
}

/** 整合排名 */
export interface Ranking {
  id?: number;
  reportDate: string;
  employeeName: string;
  normalizedName?: string;
  totalFollowupCount: number;
  totalFollowupAmount: number;
  totalRevenueAmount: number;
  totalActualAmount: number;
  totalCancelAmount?: number;
  rankNo: number;
  rankingRuleText?: string;
  sourcePlatformData?: string;
  createdAt?: string;
}

/** 派單分組結果 */
export interface DispatchGroup {
  id?: number;
  reportDate: string;
  employeeName: string;
  normalizedName?: string;
  rankNo: number;
  dispatchGroupName: 派單分組;
  groupOrderNo: number;
  suggestionText: string | null;
  pressureText: string | null;
  motivationText: string | null;
  createdAt?: string;
}

/** 公告輸出 */
export interface Announcement {
  id?: number;
  reportDate: string;
  fullText: string | null;
  lineText: string | null;
  shortText: string | null;
  voiceText: string | null;
  managerText: string | null;
  finalConfirmText: string | null;
  createdAt?: string;
  updatedAt?: string;
}

/** 版本異動紀錄 */
export interface VersionLog {
  id: number;
  reportId: number;
  detailId: number | null;
  changedFieldName: string;
  valueBefore: string | null;
  valueAfter: string | null;
  changeReason: string;
  changedByUserId: number | null;
  changeSource: 異動來源;
  createdAt: string;
}

// ═══════════════════════════════════════════════════════
// 舊版引擎 & 頁面所需的補充型別（向後相容）
// ═══════════════════════════════════════════════════════

/** 舊版 reportParser 解析出的個人明細（引擎內部用） */
export interface ParsedDetail {
  id: string;
  employeeName: string;
  employeeRole: '一般' | '新人' | '停用';
  dispatchDeals: number;
  followAmount: number;
  revenue: number;
  actual: number;
  cancelReturn: number;
  _warnings?: string[];
  _errors?: string[];
}

/** 舊版 reportParser 解析出的總計（引擎內部用） */
export interface ParsedTotals {
  totalDispatchDeals: number;
  totalFollowAmount: number;
  totalRevenue: number;
  totalActual: number;
  totalCancelReturn: number;
  employeeCount?: number;
}

/** 自動修正紀錄（autoFixEngine 內部用） */
export interface AutoFixRecord {
  id: string;
  level: 'A' | 'B' | 'C';
  category: string;
  field: string;
  before: string;
  after: string;
  description: string;
  autoApplied: boolean;
  timestamp: string;
}

/** 衝突項目（autoFixEngine 內部用） */
export interface ConflictItem {
  id: string;
  level: 'B' | 'C';
  category: string;
  field: string;
  message: string;
  suggestion?: string;
  originalValue?: number;
  suggestedValue?: number;
  resolved: boolean;
}

/** 完整解析結果（reportStore + reportAuditEngine 用） */
export interface EngineParsedResult {
  date: string;
  platform: string;
  reportType: string;
  rawText: string;
  parsedAt: string;
  totals: ParsedTotals;
  details: ParsedDetail[];
  autoFixRecords: AutoFixRecord[];
  conflicts: ConflictItem[];
  isAuditPassed?: boolean;
}

/** 審計單項（reportAuditEngine 用） */
export interface AuditItem {
  id: string;
  auditType: string;
  severity: 'error' | 'warning';
  field: string;
  message: string;
  originalValue?: number;
  expectedValue?: number;
  difference?: number;
  suggestion?: string;
}

/** 舊版 AuditResult（reportAuditEngine 回傳用），與新版 API AuditResult 共存 */
export interface LegacyAuditResult {
  status: 'PASS' | 'WARNING' | 'FAIL' | 'PENDING';
  items: AuditItem[];
  passedAt?: string;
  canProceedToRanking: boolean;
}

/** 派單分組代碼 */
export type GroupCode = 'A1' | 'A2' | 'B' | 'C';

/** 排名後的員工資料（rankingEngine 用） */
export interface RankedEmployee {
  employeeName: string;
  dispatchDeals: number;
  followAmount: number;
  totalRevenue: number;
  totalActual: number;
  cancelReturn: number;
  ranking: number;
  groupCode: GroupCode;
  isNew: boolean;
  suggestion: string;
}

/** 各版本公告文字（rankingEngine 用） */
export interface Announcements {
  fullText: string;
  lineText: string;
  shortText: string;
  broadcastText: string;
  managerText: string;
}

/** 舊版平台選項（DailyInputPage/reportStore 用） */
export type ReportPlatform = '整合' | '奕心' | '民視' | '公司產品';

/** 舊版報表類型（DailyInputPage/reportStore 用） */
export type ReportType = '累積' | '單日';

/** 系統設定（SettingsPage 用） */
export interface SystemSettings {
  rankingPrimary: 'totalRevenue' | 'totalFollowAmount';
  rankingSecondary: 'totalFollowSuccess' | 'totalDispatchSuccess';
  a1Count: number;
  a2Count: number;
  bCount: number;
  auditLevel: 1 | 2 | 3;
  bannedNames: string[];
  correctNames: string[];
}
