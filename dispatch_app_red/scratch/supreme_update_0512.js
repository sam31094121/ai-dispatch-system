/**
 * Zhaogui AI Dispatch - Supreme Update 0512
 * 【後端正式執行版｜5/11 結算 → 5/12 正式派單】
 */

const fs = require('fs');
const path = require('path');

// 模擬後端路徑
const STORAGE_ROOT = path.join(__dirname, '../data');
const LATEST_FILE = path.join(STORAGE_ROOT, 'latest.json');

// 載入 5/12 正式資料 (從 artifact 複製)
const formalData0512 = JSON.parse(fs.readFileSync(path.join(__dirname, '5_12_formal_dispatch_data.json'), 'utf8'));

/**
 * 執行最高指令：全部更新
 */
async function executeSupremeUpdate() {
    console.log('────────────────────────────────────────────────');
    console.log('【Supreme Update 0512｜開始執行】');
    console.log('────────────────────────────────────────────────');

    try {
        // 1. 確保目錄存在
        if (!fs.existsSync(STORAGE_ROOT)) fs.mkdirSync(STORAGE_ROOT, { recursive: true });

        // 2. 備份舊版 (若存在)
        if (fs.existsSync(LATEST_FILE)) {
            const oldData = fs.readFileSync(LATEST_FILE, 'utf8');
            fs.writeFileSync(path.join(STORAGE_ROOT, `backup_latest_${Date.now()}.json`), oldData);
            console.log('✅ 已完成舊版備份');
        }

        // 3. 寫入 5/12 正式版
        // 注意：這裡直接寫入 latest.json，會觸發 MasterCommander 的數據監看 (Data Watcher)
        fs.writeFileSync(LATEST_FILE, JSON.stringify({
            success: true,
            data: formalData0512,
            dataVersion: 512, // 強制鎖定版本
            updatedAt: new Date().toISOString()
        }, null, 2), 'utf8');

        console.log('✅ 5/12 正式版資料已成功寫入 latest.json');
        console.log('✅ 數據版本號：512 (AUTHORITATIVE)');

        // 4. 輸出審計摘要 (Decree 要求)
        console.log('\n【審計與同步摘要】');
        console.log(`- 標題：${formalData0512.公告標題}`);
        console.log(`- 結算日：${formalData0512.日期資訊.結算日}`);
        console.log(`- 派單日：${formalData0512.日期資訊.派單日}`);
        console.log(`- 審計結果：${formalData0512.審計結論.結果}`);
        console.log(`- A1 人數：${formalData0512.分級.A1.length} 人`);
        console.log(`- A2 人數：${formalData0512.分級.A2.length} 人`);
        console.log(`- B/C 人數：${formalData0512.分級.B.length + formalData0512.分級.C.length} 人`);

        console.log('\n────────────────────────────────────────────────');
        console.log('【下一步建議】');
        console.log('1. 系統已自動觸發 SSE 廣播，全端（桌機、手機、會議室）將立即對齊。');
        console.log('2. 前端請確認「5/11 結算」標籤已顯示。');
        console.log('3. 若有任何端未同步，SyncGuard 會在 5 秒內自動執行修復鏈。');
        console.log('────────────────────────────────────────────────');

    } catch (err) {
        console.error('❌ Supreme Update 失敗:', err.message);
    }
}

executeSupremeUpdate();
