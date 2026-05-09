const fs = require('fs');
const path = require('path');

const LATEST_PATH = path.join(__dirname, '..', 'data', 'dispatch-reports-v1', 'latest.json');

function migrateToUAIS() {
    console.log('--- 開始 UAIS 規格同步化 (latest.json) ---');
    const raw = fs.readFileSync(LATEST_PATH, 'utf8');
    const data = JSON.parse(raw);
    const report = data.report;

    // 1. 同步 Rankings
    report.rankings.forEach(row => {
        const m = row.metrics;
        // 注入英文規格 Key
        m.score = m.正式權重分數;
        m.actualRevenue = m.實收;
        m.totalRevenue = m.總業績;
        m.renewalRevenue = m.續單金額;
        m.renewalDeals = m.追續成交總數;
        m.renewalAverage = m.追續客單價;
    });

    // 2. 同步 SummaryBoard
    const sb = report.summaryBoard;
    sb.totalRevenue = sb.全部總業績;
    sb.actualRevenue = sb.實收總金額;
    sb.renewalRevenue = sb.追續單金額;
    sb.renewalDeals = sb.追續單成交;

    // 3. 確保 officialChinese 也同步 (如果有的話)
    if (report.officialChinese && report.officialChinese.rankings) {
        report.officialChinese.rankings.forEach(row => {
            row.score = row.score || 0;
            row.actualRevenue = row.actualRevenue || 0;
        });
    }

    fs.writeFileSync(LATEST_PATH, JSON.stringify(data, null, 2), 'utf8');
    console.log('[DONE] UAIS 規格同步完成。');
}

migrateToUAIS();
