const fs = require('fs');
const path = require('path');
const { smartFixRawInput } = require('../src/services/smartFix.service');
const { appConfig } = require('../src/config/appConfig');

/**
 * 智慧修復執行腳本
 * 讀取當前最新的資料並進行「立此類推」校準
 */

async function run() {
    const storageRoot = appConfig.storageRoot;
    if (!fs.existsSync(storageRoot)) {
        console.log('[SmartFix] 尚未偵測到資料庫，跳過校準。');
        return;
    }

    const files = fs.readdirSync(storageRoot).filter(f => f.endsWith('.json'));
    if (files.length === 0) {
        console.log('[SmartFix] 資料庫為空，無需校準。');
        return;
    }

    // 取最新的報表進行校準
    const latestFile = files.sort().reverse()[0];
    const filePath = path.join(storageRoot, latestFile);
    
    try {
        const rawData = fs.readFileSync(filePath, 'utf8');
        const result = smartFixRawInput(rawData);

        if (result.fixCount > 0) {
            console.log(`[SmartFix] 偵測到 ${result.fixCount} 處可優化項。`);
            fs.writeFileSync(filePath, result.fixedJson, 'utf8');
            console.log(`[SmartFix] 已自動執行「立此類推」校準：${latestFile}`);
        } else {
            console.log('[SmartFix] 資料完整性檢查通過，無需修正。');
        }
    } catch (e) {
        console.error('[SmartFix] 校準過程中發生錯誤:', e.message);
    }
}

run();
