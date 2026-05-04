const fs = require('fs');
const path = require('path');
const { OFFICIAL_0502_TO_0503 } = require('./shared/official-0502-to-0503');

// 模擬後端的轉換邏輯
function toNumber(val) {
  return Number(val) || 0;
}

const report = {
  reportId: 'dispatch_2026_05_02_v1',
  version: 2,
  status: 'published',
  title: OFFICIAL_0502_TO_0503.title,
  settlementDate: OFFICIAL_0502_TO_0503.reportDate,
  dispatchDate: OFFICIAL_0502_TO_0503.dispatchDate,
  auditResult: OFFICIAL_0502_TO_0503.auditResult,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  sourceText: 'Manual Unlock & Sync',
  audit: {
    result: OFFICIAL_0502_TO_0503.auditResult,
    rule: OFFICIAL_0502_TO_0503.scoringMethod,
    platforms: Object.entries(OFFICIAL_0502_TO_0503.platforms).map(([name, p]) => ({
      platformName: name,
      passed: true,
      metrics: {
        累積追續總成交數: p.cumulativeRenewalDeals,
        本月業績: p.monthlyRevenue,
        追續單總金額: p.totalRenewalAmount,
        實收總金額: p.actualRevenue
      }
    })),
    notes: [],
    excludedEmployees: OFFICIAL_0502_TO_0503.excludedEmployees || []
  },
  summaryBoard: {
    累積總派單數: OFFICIAL_0502_TO_0503.overallStats.totalCalls || 0,
    累積派單總成交數: OFFICIAL_0502_TO_0503.overallStats.dispatchCalls || 0,
    累積追續總成交數: OFFICIAL_0502_TO_0503.overallStats.renewalCalls || 0,
    當日續單金額: OFFICIAL_0502_TO_0503.overallStats.dailyRenewalAmount || 0,
    本月業績: OFFICIAL_0502_TO_0503.overallStats.monthlyRevenue || 0,
    追續單總金額: OFFICIAL_0502_TO_0503.overallStats.renewalAmount || 0,
    實收總金額: OFFICIAL_0502_TO_0503.overallStats.actualRevenue || 0,
    當日取消退貨: OFFICIAL_0502_TO_0503.overallStats.cancellations || 0
  },
  rankings: OFFICIAL_0502_TO_0503.ranking.map(r => ({
    rank: r.rank,
    name: r.name,
    group: r.group,
    advice: r.advice,
    metrics: {
      正式權重分數: r.totalScore,
      實收: r.actualRevenue,
      總業績: r.totalRevenue,
      續單金額: r.renewalRevenue,
      追續成交總數: r.renewalDeals,
      追續客單價: r.avgRenewal
    }
  })),
  groups: OFFICIAL_0502_TO_0503.groups,
  finalConfirmations: OFFICIAL_0502_TO_0503.finalConfirmations,
  groupShortText: OFFICIAL_0502_TO_0503.groupShortText
};

const payload = {
  report,
  meta: {
    operator: 'system-unlock',
    reason: 'manual-sync-0503',
    savedAt: new Date().toLocaleString('zh-TW', { timeZone: 'Asia/Taipei' }),
    source: 'official-data-file'
  }
};

const latestPath = path.join(__dirname, 'data', 'dispatch-reports-v1', 'latest.json');
fs.writeFileSync(latestPath, JSON.stringify(payload, null, 2), 'utf8');
console.log('Successfully synced official 0503 data to latest.json');
