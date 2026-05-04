const officialLocks = require('../../shared/official-locks');

// Auto-select the latest OFFICIAL_MMDD_TO_MMDD export
const officialKeys = Object.keys(officialLocks).filter((k) => k.startsWith('OFFICIAL_'));
const latestKey = officialKeys.sort().reverse()[0];
const LATEST = latestKey ? officialLocks[latestKey] : null;

if (!LATEST) throw new Error('[performanceAnalysis] No OFFICIAL_ data found in official-locks.js');

// Derive Gregorian dates from ROC reportDate (e.g. '115/05/03' -> '2026-05-03')
function rocToGregorian(rocStr) {
  const parts = String(rocStr || '').split('/');
  if (parts.length !== 3) return rocStr || '';
  const year = parseInt(parts[0], 10) + 1911;
  return `${year}-${parts[1]}-${parts[2]}`;
}

// Weekday lookup
const WEEKDAYS = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];

function buildMeta(official) {
  const reportIso = rocToGregorian(official.reportDate);
  const dispatchIso = rocToGregorian(official.dispatchDate);
  const reportDate = new Date(reportIso);
  const weekday = WEEKDAYS[reportDate.getDay()] || '';
  return {
    reportDate: reportIso,
    displayDate: official.reportDate,
    weekday,
    nextDispatchDate: dispatchIso,
    nextDispatchDisplayDate: official.dispatchDate
  };
}

function buildProducts(official) {
  const p = official.audit?.platforms || official.platforms || [];
  if (Array.isArray(p)) {
    return p.map((data) => ({
      name: data.platformName || data.name,
      renewalDeals: data.metrics?.追續單成交 || data.cumulativeRenewalDeals || 0,
      totalRevenue: data.metrics?.全部總業績 || data.monthlyRevenue || 0,
      renewalRevenue: data.metrics?.追續單金額 || data.totalRenewalAmount || 0,
      cashRevenue: data.metrics?.實收總金額 || data.actualRevenue || 0
    }));
  }
  return Object.entries(p).map(([name, data]) => ({
    name,
    renewalDeals: data.cumulativeRenewalDeals || 0,
    totalRevenue: data.monthlyRevenue || 0,
    renewalRevenue: data.totalRenewalAmount || 0,
    cashRevenue: data.actualRevenue || 0
  }));
}

const _analysis = (() => {
  const META = buildMeta(LATEST);
  const PRODUCTS = buildProducts(LATEST);
  const SCORING_WEIGHTS = LATEST.scoringWeights || {};

  const people = (LATEST.ranking || []).map((row, i) => ({
    rank: i + 1,
    name: row.name,
    weightedScore: row.totalScore,
    cashRevenue: row.actualRevenue,
    renewalRevenue: row.renewalRevenue,
    totalRevenue: row.totalRevenue,
    averageRenewal: row.averageRenewal,
    renewalDeals: row.renewalDeals,
    tier: row.group,
    tags: row.totalScore === 0 ? ['補位觀察'] : [],
    advice: row.advice,
    collectionRate: row.totalRevenue > 0 ? Number((row.actualRevenue / row.totalRevenue).toFixed(4)) : 0
  }));

  const totals = PRODUCTS.reduce((sum, item) => ({
    renewalDeals:   sum.renewalDeals   + item.renewalDeals,
    totalRevenue:   sum.totalRevenue   + item.totalRevenue,
    renewalRevenue: sum.renewalRevenue + item.renewalRevenue,
    cashRevenue:    sum.cashRevenue    + item.cashRevenue
  }), { renewalDeals: 0, totalRevenue: 0, renewalRevenue: 0, cashRevenue: 0 });
  totals.averageRenewal = totals.renewalDeals > 0
    ? Math.round(totals.renewalRevenue / totals.renewalDeals)
    : 0;
  
  // 核心修正：若產品列表為空，從 summaryBoard 提取總計
  if (totals.totalRevenue === 0 && official.summaryBoard) {
    const sb = official.summaryBoard;
    totals.renewalDeals = sb.追續單成交 || sb.累積追續總成交數 || 0;
    totals.totalRevenue = sb.全部總業績 || sb.本月業績 || 0;
    totals.renewalRevenue = sb.追續單金額 || sb.追續單總金額 || 0;
    totals.cashRevenue = sb.實收總金額 || 0;
    totals.averageRenewal = totals.renewalDeals > 0 ? Math.round(totals.renewalRevenue / totals.renewalDeals) : 0;
  }

  const byTier = (t) => people.filter((p) => p.tier === t);
  const retired = (LATEST.excludedEmployees || []).map((e) => e.name);

  return {
    ...META,
    products: PRODUCTS,
    people,
    totals,
    dispatchOrder: people,
    groups: { A1: byTier('A1'), A2: byTier('A2'), B: byTier('B'), C: byTier('C') },
    retired,
    scoringWeights: SCORING_WEIGHTS,
    scoringBaselines: LATEST.scoringBaselines || {},
    recommendation: LATEST.groupShortText || '',
    focusGroups: {
      mainForce:      byTier('A1'),
      companyProduct: people.filter((p) => p.tags.includes('公司產品強')),
      cultivation:    people.filter((p) => p.name.includes('新人'))
    }
  };
})();

function buildPerformanceAnalysis() {
  return _analysis;
}

module.exports = { buildPerformanceAnalysis };
