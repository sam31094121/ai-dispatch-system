import type { AuditRunPayload, ManualApprovePayload } from '../types/audit';

export const auditService = {
  async runAudit(reportId: number, payload: AuditRunPayload) {
    return {
      reportId,
      consistencyResult: '失敗',
      logicResult: '通過',
      cumulativeResult: '通過',
      finalResult: '失敗',
      canGenerateRanking: false,
      canGenerateDispatch: false,
      canGenerateAnnounce: false,
      auditSummary: '有1筆天地盤差額異常',
      issues: [
         {
           id: 1,
           reportId,
           detailId: 5,
           issueType: '天地盤差額',
           issueLevel: '鎖死',
           fieldName: 'totalRevenueAmount',
           rawValue: '2026976',
           expectedValue: '2025976',
           diffValue: '1000',
           suggestionText: '總計與加總差額不為零',
           isResolved: false,
           createdAt: '2026-03-09T10:00:00Z',
         }
      ]
    };
  },
  async manualApprove(reportId: number, payload: ManualApprovePayload) {
    return { reportId, approved: true };
  }
};
