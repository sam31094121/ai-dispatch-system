import http from 'http';
import fs from 'fs';

const serverUrl = 'http://localhost:3001/api/v1/dispatch';

const logs: string[] = [];
function log(...args: any[]) {
  const line = args.map(a => typeof a === 'object' ? JSON.stringify(a, null, 2) : String(a)).join(' ');
  console.log(line);
  logs.push(line);
}

// ── 1. 符合規格三之完整健康 Mock 數據 ──
const validMockData = {
  reportDate: "2026-03-18",
  platforms: [
    {
      platformName: "奕心",
      summary: {
        totalCalls: 100,
        leadDeals: 40,
        followDeals: 50,
        followAmount: 500000,
        refundAmount: 1000,
        totalRevenueNet: 900000
      },
      members: [
        {
          name: "李玲玲",
          totalCalls: 60,
          leadDeals: 25,
          followDeals: 30,
          followAmount: 300000,
          refundAmount: 0,
          totalRevenueNet: 550000,
          isNew: false
        },
        {
          name: "王珍珠",
          totalCalls: 40,
          leadDeals: 15,
          followDeals: 20,
          followAmount: 200000,
          refundAmount: 1000,
          totalRevenueNet: 350000,
          isNew: false
        }
      ]
    },
    {
      platformName: "民視",
      summary: {
        totalCalls: 50,
        leadDeals: 20,
        followDeals: 10,
        followAmount: 100000,
        refundAmount: 0,
        totalRevenueNet: 200000
      },
      members: [
        {
          name: "李玲玲",
          totalCalls: 30,
          leadDeals: 10,
          followDeals: 5,
          followAmount: 50000,
          refundAmount: 0,
          totalRevenueNet: 100000,
          isNew: false
        },
        {
          name: "馬秋香",
          totalCalls: 20,
          leadDeals: 10,
          followDeals: 5,
          followAmount: 50000,
          refundAmount: 0,
          totalRevenueNet: 100000,
          isNew: false
        }
      ]
    },
    {
      platformName: "公司產品",
      summary: {
        totalCalls: 10,
        leadDeals: 5,
        followDeals: 5,
        followAmount: 50000,
        refundAmount: 0,
        totalRevenueNet: 100000
      },
      members: [
        {
          name: "王珍珠",
          totalCalls: 10,
          leadDeals: 5,
          followDeals: 5,
          followAmount: 50000,
          refundAmount: 0,
          totalRevenueNet: 100000,
          isNew: false
        }
      ]
    }
  ]
};

// ── 2. 故意放錯錯名 (徐華好) 的 Mock 數據 ──
const errorMockData = {
    ...validMockData,
    platforms: validMockData.platforms.map(p => {
        if (p.platformName === '公司產品') {
            return {
                ...p,
                members: [
                    ...p.members,
                    {
                        name: "徐華好", // 規格鎖死的禁用錯名
                        totalCalls: 5,
                        leadDeals: 2,
                        followDeals: 3,
                        followAmount: 10000,
                        refundAmount: 0,
                        totalRevenueNet: 20000,
                        isNew: true
                    }
                ],
                // 為了天地盤通過，我們必須把 summary 的數值加上去，看它是不是被 邏輯盤 (auditLogic) 給卡死！
                summary: {
                    totalCalls: p.summary.totalCalls + 5,
                    leadDeals: p.summary.leadDeals + 2,
                    followDeals: p.summary.followDeals + 3,
                    followAmount: p.summary.followAmount + 10000,
                    refundAmount: p.summary.refundAmount,
                    totalRevenueNet: p.summary.totalRevenueNet + 20000
                }
            }
        }
        return p;
    })
}

/**
 * 輔助發送 JSON POST
 */
function postJson(urlPath: string, data: any): Promise<any> {
  return new Promise((resolve, reject) => {
    const url = new URL(serverUrl + urlPath);
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => resolve(JSON.parse(body)));
    });

    req.on('error', reject);
    req.write(JSON.stringify(data));
    req.end();
  });
}

function getJson(urlPath: string): Promise<any> {
    return new Promise((resolve, reject) => {
      const url = new URL(serverUrl + urlPath);
      http.get(url, (res) => {
        let body = '';
        res.on('data', chunk => body += chunk);
        res.on('end', () => resolve(JSON.parse(body)));
      }).on('error', reject);
    });
}

async function runTests() {
    log('🧪 開始自動化測試核對 AI 派單系統後端...');

    // ── 測試 1: 匯入正確數據 ──
    try {
        log('\n[測試 1] 匯入正確數據...');
        const res1 = await postJson('/rebuild', validMockData);
        log('API 回傳:', res1.success ? '✅ 成功' : '❌ 失敗');
        log('審計結果:', res1.auditResult);
        if (res1.auditResult !== 'PASS') {
            log('❌ 預期為 PASS，但得到 FAIL');
            log('Errors:', res1.errors);
        } else {
            log('✅ 天地盤 / 邏輯盤 PASS');
        }

        // 檢查 latest
        log('\n[測試 2] 驗查 /latest 快照...');
        const latest = await getJson('/latest');
        if (latest.success) {
            log('✅ 讀取快照成功, 版號:', latest.version);
            log('🔥 整合總盤業績: ' + latest.totalSummary.totalRevenueNet + ' (預期 1,200,000)');
            log('🏆 排行榜第一名: ' + latest.rankingList[0].name + ' 業績: ' + latest.rankingList[0].merged.totalRevenueNet);
        } else {
            log('❌ 取得快照失敗: ' + latest.message);
        }

    } catch (e: any) {
        log('❌ 測試 1 出錯: ' + e.message);
    }

    // ── 測試 2: 進錯名 徐華好 ──
    try {
        log('\n[測試 3] 匯入內含錯名「徐華好」的數據 (預期審計應失敗)...');
        const res2 = await postJson('/rebuild', errorMockData);
        log('API 回傳:', res2.success ? '✅ 成功' : '❌ 失敗');
        log('審計結果:', res2.auditResult, '(預期為 FAIL)');
        if (res2.auditResult === 'FAIL') {
            log('✅ 邏輯盤成功阻擋錯誤名稱！');
            log('錯誤訊息包含: ' + JSON.stringify(res2.errors.filter((e:string) => e.includes('徐華好'))));
        } else {
            log('❌ 錯誤名稱卻通過了審計！這不對。');
        }
    } catch (e: any) {
         log('❌ 測試 2 出錯: ' + e.message);
    }

    log('\n🏁 測試流程結束。');

    // 寫入檔案
    fs.writeFileSync('c:\\Users\\DRAGON\\Desktop\\兆櫃系統\\ai-dispatch-system\\server\\tests\\test_result_out.log', logs.join('\n'), 'utf-8');
}

runTests();
