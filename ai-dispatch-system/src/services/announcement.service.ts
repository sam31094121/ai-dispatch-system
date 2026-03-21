// ═══════════════════════════════════════════════════════
// announcement.service.ts — 真實後端串接版（完整五版本）
// ═══════════════════════════════════════════════════════
import { apiPost, apiGet } from './apiClient';

export interface AnnouncementOutput {
  reportDate: string;
  fullText: string;
  lineText: string;
  shortText: string;
  voiceText: string;
  managerText: string;
}

export const announcementService = {
  /**
   * 完整一條龍：
   * 1. POST /dispatch/rebuild  → 整合排名、派單分組、快照
   * 2. POST /rankings/generate → 寫入 integrated_rankings / dispatch_group_results
   * 3. POST /announcements/generate → 生成完整五版公告
   */
  async generate(reportDate: string): Promise<AnnouncementOutput> {
    // Step 1：重算派單快照（自動從 DB 撈當日審計通過報表）
    const rebuildRes = await apiPost<any>('/dispatch/rebuild', { reportDate });
    if (!rebuildRes.success) {
      throw Object.assign(new Error(rebuildRes.message), { responseMessage: rebuildRes.message });
    }

    // Step 2：生成整合排名（寫入 integrated_rankings 供公告使用）
    const rankRes = await apiPost<any>('/rankings/generate', { report_date: reportDate });
    if (!rankRes.success) {
      throw Object.assign(new Error(rankRes.message), { responseMessage: rankRes.message });
    }

    // Step 3：生成五版公告
    const annRes = await apiPost<any>('/announcements/generate', { report_date: reportDate });
    if (!annRes.success) {
      throw Object.assign(new Error(annRes.message), { responseMessage: annRes.message });
    }

    const d = annRes.data as any;
    return {
      reportDate,
      fullText:    d.fullText    ?? d.full_text    ?? '',
      lineText:    d.lineText    ?? d.line_text    ?? '',
      shortText:   d.shortText   ?? d.short_text   ?? '',
      voiceText:   d.voiceText   ?? d.voice_text   ?? '',
      managerText: d.managerText ?? d.manager_text ?? '',
    };
  },

  /** 讀取已生成的五版公告 */
  async get(reportDate: string): Promise<AnnouncementOutput | null> {
    const res = await apiGet<any>(`/announcements/${reportDate}`);
    if (!res.success || !res.data) return null;
    const d = res.data as any;
    return {
      reportDate,
      fullText:    d.fullText    ?? d.full_text    ?? '',
      lineText:    d.lineText    ?? d.line_text    ?? '',
      shortText:   d.shortText   ?? d.short_text   ?? '',
      voiceText:   d.voiceText   ?? d.voice_text   ?? '',
      managerText: d.managerText ?? d.manager_text ?? '',
    };
  },
};
