import type { 審計結果, 異常等級, 修正等級 } from '../constants/options';

export interface AutoFixLog {
  id: number;
  reportId: number;
  detailId: number | null;
  fixLevel: 修正等級;
  fixType: string;
  fieldName: string;
  valueBefore: string | null;
  valueAfter: string | null;
  isApplied: boolean;
  requiresManualConfirm: boolean;
  createdAt: string;
}

export interface AuditIssue {
  id: number;
  reportId: number;
  detailId: number | null;
  issueType: string;
  issueLevel: 異常等級;
  fieldName: string | null;
  rawValue: string | null;
  expectedValue: string | null;
  diffValue: string | null;
  suggestionText: string | null;
  isResolved: boolean;
  createdAt: string;
}

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

export interface AuditRunPayload {
  runConsistencyCheck?: boolean;
  runLogicCheck?: boolean;
  runCumulativeCheck?: boolean;
}

export interface AuditRunResult extends AuditResult {
  issues: AuditIssue[];
}

export interface ApplyFixesPayload {
  fixLogIds: number[];
}

export interface ApplyFixesResult {
  appliedCount: number;
  skippedCount: number;
}

export interface ManualApprovePayload {
  approvedByUserId: number;
  noteText: string;
}

export interface ManualApproveResult {
  reportId: number;
  approved: boolean;
}
