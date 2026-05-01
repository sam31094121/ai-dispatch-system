const { OFFICIAL_0501_TO_0502 } = require('../../shared/official-0501-to-0502');

const META = {
  reportDate: '2026-05-01',
  displayDate: '115/05/01',
  weekday: '星期四',
  nextDispatchDate: '2026-05-02',
  nextDispatchDisplayDate: '115/05/02'
};

const SCORING_WEIGHTS = OFFICIAL_0501_TO_0502.scoringWeights;

const PRODUCTS = [
  { name: '三立奕心', renewalDeals: OFFICIAL_0501_TO_0502.platforms['三立奕心'].cumulativeRenewalDeals, totalRevenue: OFFICIAL_0501_TO_0502.platforms['三立奕心'].monthlyRevenue,  renewalRevenue: OFFICIAL_0501_TO_0502.platforms['三立奕心'].totalRenewalAmount, cashRevenue: OFFICIAL_0501_TO_0502.platforms['三立奕心'].actualRevenue },
  { name: '民視',     renewalDeals: OFFICIAL_0501_TO_0502.platforms['民視產品'].cumulativeRenewalDeals, totalRevenue: OFFICIAL_0501_TO_0502.platforms['民視產品'].monthlyRevenue,  renewalRevenue: OFFICIAL_0501_TO_0502.platforms['民視產品'].totalRenewalAmount, cashRevenue: OFFICIAL_0501_TO_0502.platforms['民視產品'].actualRevenue },
  { name: '公司',     renewalDeals: OFFICIAL_0501_TO_0502.platforms['公司產品'].cumulativeRenewalDeals, totalRevenue: OFFICIAL_0501_TO_0502.platforms['公司產品'].monthlyRevenue,  renewalRevenue: OFFICIAL_0501_TO_0502.platforms['公司產品'].totalRenewalAmount, cashRevenue: OFFICIAL_0501_TO_0502.platforms['公司產品'].actualRevenue }
];

const PEOPLE = OFFICIAL_0501_TO_0502.ranking.map((row) => ({
  name:          row.name,
  weightedScore: row.totalScore,
  cashRevenue:   row.actualRevenue,
  renewalRevenue: row.renewalRevenue,
  totalRevenue:  row.totalRevenue,
  averageRenewal: row.averageRenewal,
  renewalDeals:  row.renewalDeals,
  tier:          row.group,
  tags:          row.totalScore === 0 ? ['補位觀察'] : [],
  advice:        row.advice
}));

const RETIRED = OFFICIAL_0501_TO_0502.excludedEmployees.map((e) => e.name);

const _analysis = (() => {
  const people = PEOPLE.map((row, i) => ({
    ...row,
    rank: i + 1,
    collectionRate: row.totalRevenue > 0 ? Number((row.cashRevenue / row.totalRevenue).toFixed(4)) : 0
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

  const byTier = (t) => people.filter((p) => p.tier === t);

  return {
    ...META,
    products: PRODUCTS,
    people,
    totals,
    dispatchOrder: people,
    groups: { A1: byTier('A1'), A2: byTier('A2'), B: byTier('B'), C: byTier('C') },
    retired: RETIRED,
    scoringWeights: SCORING_WEIGHTS,
    scoringBaselines: OFFICIAL_0501_TO_0502.scoringBaselines,
    recommendation: '5/2 正式派單先壓馬秋香、莉莉、廖姿惠、王珍珠；A2 補王梅慧、李玲玲、林宜靜、鄭珮恩；B/C 前方全忙才往下派，不得跳位。',
    focusGroups: {
      mainForce:   byTier('A1'),
      companyProduct: people.filter((p) => p.tags.includes('公司產品強')),
      cultivation: people.filter((p) => p.name.includes('新人'))
    }
  };
})();

function buildPerformanceAnalysis() {
  return _analysis;
}

module.exports = { buildPerformanceAnalysis };
