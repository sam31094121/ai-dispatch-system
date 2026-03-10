// ═══════════════════════════════════════════════════════
// announcement.service.ts — 真實後端串接版
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
  /** 生成公告文稿（需先完成排名） */
  async generate(reportDate: string): Promise<AnnouncementOutput> {
    const res = await apiPost<AnnouncementOutput>('/announcements/generate', { reportDate });
    if (!res.success) throw Object.assign(new Error(res.message), { responseMessage: res.message });
    return res.data;
  },

  /** 讀取已生成的公告 */
  async get(reportDate: string): Promise<AnnouncementOutput | null> {
    const res = await apiGet<AnnouncementOutput>(`/announcements/${reportDate}`);
    if (!res.success) return null;
    return res.data;
  },
};
