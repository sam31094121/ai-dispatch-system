// ═══════════════════════════════════════════════════════
// report.service.ts — 真實後端串接版
// ═══════════════════════════════════════════════════════
import { apiPost, apiGet, apiPut } from './apiClient';

export const reportService = {
  async createReport(payload: Record<string, unknown>) {
    const res = await apiPost<{ reportId: number }>('/reports', payload);
    if (!res.success) throw Object.assign(new Error(res.message), { responseMessage: res.message });
    return { id: Number(res.data.reportId) };
  },

  async runParse(id: number, _payload?: Record<string, unknown>) {
    const res = await apiPost<unknown>(`/reports/${id}/parse`);
    if (!res.success) throw Object.assign(new Error(res.message), { responseMessage: res.message });
    return res.data;
  },

  async getParseResult(id: number) {
    const res = await apiGet<{
      reportId: number;
      totals: {
        followupDealsCount: number;
        followupAmount: number;
        totalRevenueAmount: number;
        cancelledReturnAmount: number;
      };
      details: Array<{
        id: number;
        employeeName: string;
        identityTag: string;
        followupDealsCount: number;
        followupAmount: number;
        totalRevenueAmount: number;
        cancelledReturnAmount: number;
      }>;
    }>(`/reports/${id}/parse-result`);
    if (!res.success) throw Object.assign(new Error(res.message), { responseMessage: res.message });
    return res.data;
  },

  async updateTotals(id: number, payload: Record<string, unknown>) {
    const res = await apiPut<unknown>(`/reports/${id}/totals`, payload);
    return res.data;
  },

  async updateDetail(detailId: number, payload: Record<string, unknown>) {
    const res = await apiPut<unknown>(`/report-details/${detailId}`, payload);
    return res.data;
  },
};
