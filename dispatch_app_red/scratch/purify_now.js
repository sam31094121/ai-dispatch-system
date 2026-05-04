const path = require('path');
const fs = require('fs');
const { enhanceSnapshotWithGemini } = require('../shared/gemini');
const { saveReportVersion, getLatestReport } = require('../src/services/dispatchQuery.service');

// Mock req.app.get('projectRoot')
const projectRoot = process.cwd();

async function runPurify() {
  console.log('--- AI 專業淨化維修處啟動 ---');
  try {
    const latest = getLatestReport();
    console.log(`目前公告: ${latest.title} (v${latest.version})`);
    
    console.log('正在呼叫 AI 進行淨化...');
    const { snapshot, changed } = await enhanceSnapshotWithGemini(latest, { appDir: projectRoot });
    
    if (changed) {
      console.log('淨化成功！正在更新 latest.json...');
      const stored = saveReportVersion(snapshot, {
        operator: 'AI-PURIFIER-PRO',
        reason: 'Manual professional purification',
        source: 'purify-script'
      });
      console.log(`更新完成！新版本: v${stored.report.version}`);
      console.log('\n--- 淨化版公告文字 (業績傳送) ---');
      console.log(stored.report.announcement || stored.report.groupShortText);
    } else {
      console.log('資料已是最新淨化狀態，無需變更。');
      console.log('\n--- 目前公告文字 ---');
      console.log(latest.announcement || latest.groupShortText);
    }
  } catch (err) {
    console.error('淨化過程異常:', err);
  }
}

runPurify();
