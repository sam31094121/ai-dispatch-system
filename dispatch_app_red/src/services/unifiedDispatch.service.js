const { parseDispatchDraft } = require('./dispatchParse.service');
const { saveReportVersion, getLatestReport } = require('./dispatchQuery.service');
const { enhanceSnapshotWithGemini } = require('../../shared/gemini');
const { formatTaipeiTimestamp } = require('../utils/date.util');
const { sendLineMessage } = require('./lineNotify.service');

/**
 * 兆櫃 AI 派單系統：統一指令計畫核心服務 (Unified Command Plan Service)
 * 實施原則：
 * 1. 統一更新路徑：禁止多個版本並行，所有更新一律經過此服務。
 * 2. AI 自動分析：所有進件資料自動由 AI 進行專業處理、核對、與公告生成。
 * 3. 鎖死後端儲存：完成處理後直接鎖定為最新版本 (latest.json)。
 */

async function processUnifiedUpdate(input, options = {}) {
  const operator = input.operator || 'system';
  const reason = input.reason || 'unified-ai-update';
  const appDir = options.appDir || process.cwd();

  console.log(`[UnifiedUpdate] 啟動 AI 統一指令計畫 - 執行人: ${operator}`);

  // 1. 解析原始輸入
  const draft = parseDispatchDraft(input);
  if (!draft.validation.ok) {
    console.error('[UnifiedUpdate] 解析失敗:', draft.validation.errors);
    throw new Error('資料解析失敗，請檢查格式。');
  }

  const baseReport = draft.report;
  baseReport.updatedAt = formatTaipeiTimestamp();

  // 2. AI 專業處理與強固 (AI 專業處，不拖泥帶水)
  console.log('[UnifiedUpdate] 呼叫 AI 進行專業分析與公告優化...');
  const { snapshot: enhancedReport, changed } = await enhanceSnapshotWithGemini(baseReport, { appDir });

  if (!changed) {
    console.warn('[UnifiedUpdate] AI 未能產出優化內容，將使用基準解析版。');
  }

  // 3. 鎖死儲存 (禁止有第二版跑出來)
  console.log('[UnifiedUpdate] 執行鎖死儲存，更新 latest.json...');
  const stored = saveReportVersion(enhancedReport, {
    operator,
    reason,
    source: 'unified-ai'
  });

  // 4. 自動通知 (可選)
  if (process.env.LINE_AUTO_NOTIFY_USER) {
    const message = `[系統鎖定] AI 派單公告已更新\n日期：${stored.report.dispatchDate}\n批次：${stored.report.reportId}\n版本：v${stored.report.version}\n執行人：${operator}`;
    try {
      await sendLineMessage(process.env.LINE_AUTO_NOTIFY_USER, message);
    } catch (e) {
      console.error('[UnifiedUpdate] LINE 通知發送失敗:', e.message);
    }
  }

  return {
    success: true,
    reportId: stored.report.reportId,
    version: stored.report.version,
    announcement: stored.report.announcement,
    snapshot: stored.report
  };
}

module.exports = {
  processUnifiedUpdate
};
