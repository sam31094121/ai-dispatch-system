// ═══════════════════════════════════════════════════════
// audit.service.ts — 真實後端串接版
// ═══════════════════════════════════════════════════════
import { apiPost } from './apiClient';

// Trigger Vite HMR cache invalidation
export const auditService = {
  /** 執行 AI 審計（審計失敗時 data 仍有結果，不拋錯） */
  async runAudit(reportId: number, _payload?: Record<string, unknown>) {
    const res = await apiPost<{
      reportId: number;
      consistencyResult: string;
      logicResult: string;
      cumulativeResult: string;
      finalResult: string;
      canGenerateRanking: number;
      canGenerateDispatch: number;
      canGenerateAnnounce: number;
      auditSummary: string;
      issues: Array<{
        id: number;
        reportId: number;
        detailId: number | null;
        issueType: string;
        issueLevel: string;
        fieldName: string | null;
        rawValue: string | null;
        expectedValue: string | null;
        diffValue: string | null;
        suggestionText: string | null;
        isResolved: number;
      }>;
    }>(`/reports/${reportId}/audit`);
    // 審計失敗 success=false 但 data 有結果，需照常回傳
    if (!res.data) throw Object.assign(new Error(res.message), { responseMessage: res.message });
    return res.data;
  },

  /** 主管強行授權過件 */
  async manualApprove(reportId: number, payload?: Record<string, unknown>) {
    const res = await apiPost<{ reportId: number; approved: boolean }>(
      `/reports/${reportId}/manual-approve`,
      payload,
    );
    if (!res.success) throw Object.assign(new Error(res.message), { responseMessage: res.message });
    return res.data;
  },
};
