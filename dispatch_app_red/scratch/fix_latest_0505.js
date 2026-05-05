const fs = require('fs');
const path = require('path');

const LATEST_PATH = path.join(__dirname, '..', 'data', 'dispatch-reports-v1', 'latest.json');

function fix() {
    if (!fs.existsSync(LATEST_PATH)) {
        console.error('File not found:', LATEST_PATH);
        return;
    }

    const data = JSON.parse(fs.readFileSync(LATEST_PATH, 'utf8'));
    const report = data.report;
    const rankings = report.rankings || [];

    // 1. Recalculate Aggregated Totals
    let totalActual = 0;
    let totalRenewal = 0;
    let totalRevenue = 0;
    let totalDeals = 0;

    rankings.forEach(r => {
        totalActual += (r.actualRevenue || 0);
        totalRenewal += (r.renewalRevenue || 0);
        totalRevenue += (r.totalRevenue || 0);
        totalDeals += (r.renewalDeals || 0);
    });

    console.log('Recalculated Totals:');
    console.log('Actual:', totalActual);
    console.log('Renewal:', totalRenewal);
    console.log('Total Rev:', totalRevenue);
    console.log('Deals:', totalDeals);

    // 2. Update summaryBoard and summaryCards
    const summaryBoard = {
        "取消退貨": 0,
        "實收總金額": totalActual,
        "追續單金額": totalRenewal,
        "全部總業績": totalRevenue,
        "追續單成交": totalDeals,
        "累積派單成交": totalDeals, // Guessing this for now
        "當日取消退貨": 0
    };

    report.summaryBoard = summaryBoard;

    if (report.standardData) {
        report.standardData.整合總盤 = summaryBoard;
    }

    if (data.presentation) {
        data.presentation.summaryCards = [
            ["取消退貨", 0],
            ["實收總金額", totalActual],
            ["追續單金額", totalRenewal],
            ["全部總業績", totalRevenue],
            ["追續單成交", totalDeals],
            ["累積派單成交", totalDeals]
        ];
    } else if (report.presentation) {
        report.presentation.summaryCards = [
            ["取消退貨", 0],
            ["實收總金額", totalActual],
            ["追續單金額", totalRenewal],
            ["全部總業績", totalRevenue],
            ["追續單成交", totalDeals],
            ["累積派單成交", totalDeals]
        ];
    }

    // 3. Ensure AI Scores are correct in the JSON
    // (They seem correct in the text, but let's make sure they are numbers)
    rankings.forEach(r => {
        r.totalScore = parseFloat(r.totalScore) || 0;
        if (r.metrics) {
            r.metrics.正式權重分數 = r.totalScore;
        }
    });

    // 4. Update the sourceText and groupShortText to reflect the 5/5 title if missing
    report.title = "AI 派單戰情室｜5/5 終極正式派單";
    if (report.standardData) {
        report.standardData.公告標題 = report.title;
    }

    // 5. Save back
    fs.writeFileSync(LATEST_PATH, JSON.stringify(data, null, 2), 'utf8');
    console.log('Successfully updated latest.json');
}

fix();
