const fs = require('fs');
const path = require('path');

const LATEST_PATH = path.join(__dirname, '..', 'data', 'dispatch-reports-v1', 'latest.json');

function verify510() {
    console.log('--- 5/10 正式派單數據最終校準 ---');
    const raw = fs.readFileSync(LATEST_PATH, 'utf8');
    const data = JSON.parse(raw);
    const report = data.report;

    if (report.reportId !== "dispatch_2026_05_09_v1") throw new Error("ID 錯誤");
    if (report.settlementDate !== "2026-05-09") throw new Error("結算日期錯誤");
    if (report.dispatchDate !== "2026-05-10") throw new Error("派單日期錯誤");

    const rankings = report.rankings;
    rankings.forEach(row => {
        if (!row.name || row.rank <= 0) throw new Error(`排名異常: ${JSON.stringify(row)}`);
        const score = row.metrics.正式權重分數;
        if (typeof score !== 'number' || isNaN(score) || score < 0) {
            throw new Error(`分數異常: ${row.name} = ${score}`);
        }
    });

    console.log('[PASS] 5/10 正式派單數據校準完成，無異常數字。');
}

verify510();
