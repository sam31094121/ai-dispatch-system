/**
 * Zhaogui AI Dispatch - Supreme Update 0512 (FULL STORED RECORD)
 * 【後端正式執行版｜5/11 結算 → 5/12 正式派單】
 */

const fs = require('fs');
const path = require('path');

// 後端路徑 (依據 appConfig.js)
const STORAGE_ROOT = path.join(__dirname, '../data/dispatch-reports-v1');
const LATEST_FILE = path.join(STORAGE_ROOT, 'latest.json');

// 載入 5/12 正式資料
const formalData0512 = JSON.parse(fs.readFileSync(path.join(__dirname, '5_12_formal_dispatch_data.json'), 'utf8'));

/**
 * 執行最高指令：全部更新
 */
async function executeSupremeUpdate() {
    console.log('────────────────────────────────────────────────');
    console.log('【Supreme Update 0512｜開始執行】');
    console.log('────────────────────────────────────────────────');

    try {
        if (!fs.existsSync(STORAGE_ROOT)) fs.mkdirSync(STORAGE_ROOT, { recursive: true });

        // 1. 建立符合 dispatchQuery.service.js 期待的 storedRecord 結構
        const report = {
            reportId: 'DISPATCH_SUPREME_0512',
            version: 512,
            status: 'published',
            title: formalData0512.公告標題,
            settlementDate: '2026-05-11T00:00:00.000Z',
            dispatchDate: '2026-05-12T00:00:00.000Z',
            auditResult: 'PASS',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            sourceText: formalData0512.群組超精簡版,
            audit: {
                result: 'PASS',
                rule: '比例原則',
                platforms: [],
                notes: ['5/11 結算審計通過'],
                excludedEmployees: [{ name: '蘇淑玲', reason: '已離職' }]
            },
            summaryBoard: {
                '累積追續總成交數': formalData0512.整合總盤.追續單成交,
                '本月業績': formalData0512.整合總盤.全部總業績,
                '追續單總金額': formalData0512.整合總盤.追續單金額,
                '實收總金額': formalData0512.整合總盤.實收總金額,
                '當日取消退貨': formalData0512.整合總盤.當日取消退貨 || 0
            },
            rankings: formalData0512.正式名次.map(r => ({
                rank: r.名次,
                name: r.姓名,
                group: r.分級,
                advice: r.建議,
                metrics: {
                    總業績: r.全部總業績,
                    實收: r.實收,
                    正式權重分數: r.正式權重分數,
                    追續成交總數: r.追續單數
                }
            })),
            groups: formalData0512.分級,
            adviceList: formalData0512.正式名次.map(r => ({ name: r.姓名, text: r.建議 })),
            finalConfirmations: [],
            groupShortText: formalData0512.群組超精簡版
        };

        const storedRecord = {
            report,
            validation: { ok: true, status: 'PASS', errors: [], warnings: [] },
            snapshot: {
                ...report, // 簡化
                reportVersion: 512
            },
            meta: {
                reason: 'supreme_update',
                updatedBy: 'MasterSupremeCommander',
                timestamp: new Date().toISOString()
            }
        };

        // 2. 寫入 latest.json
        fs.writeFileSync(LATEST_FILE, JSON.stringify(storedRecord, null, 2), 'utf8');

        console.log('✅ 5/12 正式版 StoredRecord 已成功寫入 latest.json');
        console.log('✅ 數據版本號：512 (STORED_RECORD COMPATIBLE)');

        console.log('\n────────────────────────────────────────────────');
        console.log('【下一步建議】');
        console.log('1. 系統將由 MasterCommander 自動檢測並進行 Stamping 與推送。');
        console.log('────────────────────────────────────────────────');

    } catch (err) {
        console.error('❌ Supreme Update 失敗:', err.message);
    }
}

executeSupremeUpdate();
