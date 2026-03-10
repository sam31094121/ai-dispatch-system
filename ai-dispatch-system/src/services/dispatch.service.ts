// ═══════════════════════════════════════════════════════
// dispatch.service.ts — 真實後端串接版
// ═══════════════════════════════════════════════════════
import { apiPost } from './apiClient';

export interface DispatchItem {
  id?: number;
  reportDate?: string;
  employeeName: string;
  normalizedName?: string;
  rankNo: number;
  dispatchGroup?: string;
  groupOrderNo: number;
  suggestionText: string | null;
  pressureText: string | null;
  motivationText: string | null;
}

export interface DispatchGroupMap {
  A1: DispatchItem[];
  A2: DispatchItem[];
  B: DispatchItem[];
  C: DispatchItem[];
}

export interface DispatchResult {
  reportDate: string;
  groups: DispatchGroupMap;
}

export const dispatchService = {
  /** 讀取派單分組結果（排名生成後自動產生） */
  async generate(reportDate: string): Promise<DispatchResult> {
    const res = await apiPost<{ reportDate: string; groups: DispatchGroupMap }>(
      '/dispatch/generate',
      { reportDate },
    );
    if (!res.success) throw Object.assign(new Error(res.message), { responseMessage: res.message });
    return res.data;
  },
};
