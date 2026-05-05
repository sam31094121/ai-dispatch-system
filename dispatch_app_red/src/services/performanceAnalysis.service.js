const { getLatestReport } = require('./dispatchQuery.service');

const WEEKDAYS = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];

function formatDisplayDate(isoDate) {
  if (!isoDate) return '-';
  const parts = String(isoDate).split('-');
  if (parts.length < 3) return isoDate;
  return `${parseInt(parts[1], 10)}/${parseInt(parts[2], 10)}`;
}

function buildPerformanceAnalysis() {
  const report = getLatestReport();
  if (!report) throw new Error('[performanceAnalysis] No latest report found');

  const settlementDate = report.settlementDate || '';
  const dispatchDate = report.dispatchDate || '';
  const dateObj = settlementDate ? new Date(settlementDate) : null;
  const weekday = dateObj ? (WEEKDAYS[dateObj.getDay()] || '') : '';

  const rankings = Array.isArray(report.rankings) ? report.rankings : [];

  const people = rankings.map((row) => {
    const m = row.metrics || {};
    const totalRevenue = Number(m.總業績 || m.全部總業績 || 0);
    const cashRevenue = Number(m.實收 || 0);
    const renewalRevenue = Number(m.續單金額 || m.追續金額 || 0);
    const renewalDeals = Number(m.追續成交總數 || m.追續單數 || 0);
    const weightedScore = Number(m.正式權重分數 || 0);
    return {
      rank: row.rank,
      name: row.name,
      weightedScore,
      cashRevenue,
      renewalRevenue,
      totalRevenue,
      averageRenewal: renewalDeals > 0 ? Math.round(renewalRevenue / renewalDeals) : 0,
      renewalDeals,
      tier: row.group,
      tags: row.isNew ? ['新人'] : [],
      advice: row.advice || '',
      collectionRate: totalRevenue > 0 ? Number((cashRevenue / totalRevenue).toFixed(4)) : 0
    };
  });

  const platforms = Array.isArray(report.audit?.platforms) ? report.audit.platforms : [];
  const products = platforms.map((p) => {
    const m = p.metrics || {};
    return {
      name: p.platformName || p.name || '-',
      renewalDeals: Number(m.累積追續總成交數 || 0),
      totalRevenue: Number(m.本月業績 || 0),
      renewalRevenue: Number(m.追續單總金額 || m.當日續單金額 || 0),
      cashRevenue: Number(m.實收總金額 || 0)
    };
  });

  const sb = report.summaryBoard || {};
  const totals = {
    renewalDeals: Number(sb.累積追續總成交數 || 0),
    totalRevenue: Number(sb.本月業績 || 0),
    renewalRevenue: Number(sb.追續單總金額 || sb.當日續單金額 || 0),
    cashRevenue: Number(sb.實收總金額 || 0)
  };
  totals.averageRenewal = totals.renewalDeals > 0
    ? Math.round(totals.renewalRevenue / totals.renewalDeals)
    : 0;

  const byTier = (t) => people.filter((p) => p.tier === t);
  const retired = Array.isArray(report.audit?.excludedEmployees)
    ? report.audit.excludedEmployees.map((e) => (typeof e === 'string' ? e : (e.name || '')))
    : [];

  return {
    reportDate: settlementDate,
    displayDate: formatDisplayDate(settlementDate),
    weekday,
    nextDispatchDate: dispatchDate,
    nextDispatchDisplayDate: formatDisplayDate(dispatchDate),
    products,
    people,
    totals,
    dispatchOrder: people,
    groups: { A1: byTier('A1'), A2: byTier('A2'), B: byTier('B'), C: byTier('C') },
    retired,
    recommendation: report.groupShortText || '',
    focusGroups: {
      mainForce: byTier('A1'),
      companyProduct: [],
      cultivation: people.filter((p) => p.tags.includes('新人'))
    }
  };
}

module.exports = { buildPerformanceAnalysis };
