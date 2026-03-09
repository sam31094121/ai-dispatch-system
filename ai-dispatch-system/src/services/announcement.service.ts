import type { AnnouncementGeneratePayload } from '../types/announcement';

export const announcementService = {
  async generate(payload: AnnouncementGeneratePayload) {
    return {
      reportDate: payload.reportDate,
      fullText: '【全公司每日業績與排名公告】\n第一名：李玲玲 ...\n\nAI 派單：明日 A1 首當其衝...',
      lineText: '📣 李玲玲 拿冠軍！A1 派單請準備。',
      shortText: '明日派單照常',
      voiceText: '大家好，今天第一名是...',
      managerText: '主管報表：全日達成率 110%',
      finalConfirmText: '已發送',
    };
  }
};
