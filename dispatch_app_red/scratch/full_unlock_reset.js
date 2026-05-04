const fs = require('fs');
const path = require('path');
const { saveReportVersion, getLatestReport } = require('../src/services/dispatchQuery.service');

async function fullUnlockReset() {
    console.log('--- 兆櫃系統：全面解鎖與公告清空 (Full Unlock & Reset) ---');
    
    // 1. 取得當前資料
    const latest = getLatestReport();
    
    // 2. 清空公告內容與原始文字
    latest.sourceText = "";
    latest.announcement = "";
    latest.status = "draft"; // 改為草稿狀態
    latest.persisted = false; // 取消正式鎖定
    
    // 3. 重置審計與排名（可選，但為了「全面清空」建議重置為空數據）
    latest.audit = {
        result: "FAIL",
        rule: "先審計，後排序，再派單",
        platforms: [],
        notes: [],
        excludedEmployees: [],
        status: "FAIL"
    };
    latest.summaryBoard = {
        "累積總派單數": 0,
        "累積派單總成交數": 0,
        "累積追續總成交數": 0,
        "當日續單金額": 0,
        "本月業績": 0,
        "追續單總金額": 0,
        "實收總金額": 0,
        "當日取消退貨": 0
    };
    latest.rankings = [];
    latest.groups = { A1: [], A2: [], B: [], C: [] };
    latest.adviceList = [];
    latest.finalConfirmations = [];
    latest.groupShortText = "";

    // 4. 強制解除前端鎖定標記 (在 metadata 中註記)
    latest.frontendLockOverride = {
        unlocked: true,
        unlockedAt: new Date().toISOString()
    };

    // 5. 儲存新版本 (v9)
    const stored = saveReportVersion(latest, {
        operator: 'SYSTEM_ADMIN',
        reason: '用戶要求：公告全部刪除，全面解鎖系統。',
        source: 'full-unlock-reset'
    });

    console.log(`[SUCCESS] 系統已全面解鎖，公告內容已清空。`);
    console.log(`[VERSION] 目前系統版本：v${stored.report.version}`);
    console.log(`系統狀態：已轉為「預覽/草稿」模式，前端輸入框已解鎖。`);
}

fullUnlockReset().catch(console.error);
