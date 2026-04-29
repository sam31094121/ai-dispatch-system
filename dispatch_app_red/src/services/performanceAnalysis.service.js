const report = {
  reportDate: '2026-04-29',
  displayDate: '115/04/29',
  weekday: '星期三',
  nextDispatchDate: '2026-04-30',
  nextDispatchDisplayDate: '115/04/30',
  products: [
    { name: '奕心', renewalDeals: 274, totalRevenue: 4722330, averageRenewal: 17235, renewalRevenue: 3402278, cashRevenue: 3763032 },
    { name: '民視', renewalDeals: 77, totalRevenue: 2678260, averageRenewal: 6249, renewalRevenue: 481170, cashRevenue: 1834480 },
    { name: '公司', renewalDeals: 39, totalRevenue: 1122700, averageRenewal: 27599, renewalRevenue: 1076450, cashRevenue: 558170 }
  ],
  people: [
    { name: '王珍珠', renewalDeals: 59, totalRevenue: 1102028, renewalRevenue: 768960, cashRevenue: 823168, tags: ['總業績第1', '成交第1'] },
    { name: '馬秋香', renewalDeals: 45, totalRevenue: 984268, renewalRevenue: 623010, cashRevenue: 821868, tags: ['總業績第2', '穩定主力'] },
    { name: '王梅慧', renewalDeals: 40, totalRevenue: 930460, renewalRevenue: 667710, cashRevenue: 825330, tags: ['實收第1', '奕心強'] },
    { name: '李玲玲', renewalDeals: 26, totalRevenue: 762800, renewalRevenue: 360290, cashRevenue: 480430, tags: ['三線均衡'] },
    { name: '林沛昕', renewalDeals: 13, totalRevenue: 609390, renewalRevenue: 405536, cashRevenue: 572072, tags: ['高均價', '高實收'] },
    { name: '林宜靜', renewalDeals: 20, totalRevenue: 506290, renewalRevenue: 102600, cashRevenue: 390300, tags: ['民視業績強'] },
    { name: '徐華妤', renewalDeals: 16, totalRevenue: 444770, renewalRevenue: 241440, cashRevenue: 357130, tags: ['穩定補量'] },
    { name: '湯玉琦', renewalDeals: 26, totalRevenue: 391718, renewalRevenue: 272300, cashRevenue: 220438, tags: ['成交量高'] },
    { name: '許喬恩', renewalDeals: 7, totalRevenue: 299400, renewalRevenue: 299400, cashRevenue: 76400, tags: ['公司產品強', '高均價'] },
    { name: '鄭上官', renewalDeals: 9, totalRevenue: 284810, renewalRevenue: 284810, cashRevenue: 109810, tags: ['公司產品強'] },
    { name: '梁依萍', renewalDeals: 12, totalRevenue: 271270, renewalRevenue: 80460, cashRevenue: 215590, tags: ['民視實收佳'] },
    { name: '廖姿惠', renewalDeals: 21, totalRevenue: 267456, renewalRevenue: 100366, cashRevenue: 200276, tags: ['成交穩'] },
    { name: '高如郁', renewalDeals: 13, totalRevenue: 250138, renewalRevenue: 74380, cashRevenue: 196218, tags: ['實收穩'] },
    { name: '高美雲', renewalDeals: 10, totalRevenue: 241356, renewalRevenue: 60000, cashRevenue: 185016, tags: ['民視穩'] },
    { name: '蘇淑玲', renewalDeals: 6, totalRevenue: 220336, renewalRevenue: 95340, cashRevenue: 171836, tags: ['均價可拉高'] },
    { name: '江麗勉', renewalDeals: 12, totalRevenue: 203726, renewalRevenue: 86228, cashRevenue: 139306, tags: ['補量區'] },
    { name: '林佩君', renewalDeals: 8, totalRevenue: 193918, renewalRevenue: 165918, cashRevenue: 27178, tags: ['公司高均價'] },
    { name: '陳玲華', renewalDeals: 7, totalRevenue: 171458, renewalRevenue: 43130, cashRevenue: 110508, tags: ['民視實收'] },
    { name: '鄭珮恩', renewalDeals: 18, totalRevenue: 159978, renewalRevenue: 50660, cashRevenue: 121468, tags: ['成交補量'] },
    { name: '江沛林', renewalDeals: 6, totalRevenue: 97460, renewalRevenue: 78960, cashRevenue: 9980, tags: ['追續金額高於實收'] },
    { name: '謝啟芳', renewalDeals: 5, totalRevenue: 53500, renewalRevenue: 21640, cashRevenue: 38560, tags: ['觀察'] },
    { name: '周美蓁', renewalDeals: 3, totalRevenue: 28800, renewalRevenue: 28800, cashRevenue: 28800, tags: ['小量測試'] },
    { name: '陳桂子', renewalDeals: 4, totalRevenue: 19000, renewalRevenue: 19000, cashRevenue: 19000, tags: ['新人', '培養單'] },
    { name: '鄭上官', renewalDeals: 9, totalRevenue: 284810, renewalRevenue: 284810, cashRevenue: 109810, tags: ['公司產品強'] },
    { name: '莉莉', renewalDeals: 2, totalRevenue: 18000, renewalRevenue: 18000, cashRevenue: 15000, tags: ['新人', '培養單'] },
    { name: '吳昆如', renewalDeals: 2, totalRevenue: 10960, renewalRevenue: 10960, cashRevenue: 0, tags: ['新人', '觀察單'] }
  ]
};

function uniquePeople(people) {
  const byName = new Map();
  people.forEach((row) => byName.set(row.name, row));
  return [...byName.values()];
}

function withDerived(row, index) {
  const averageRenewal = row.renewalDeals > 0 ? Math.round(row.renewalRevenue / row.renewalDeals) : 0;
  const collectionRate = row.totalRevenue > 0 ? Number((row.cashRevenue / row.totalRevenue).toFixed(4)) : 0;
  return {
    ...row,
    rank: index + 1,
    averageRenewal,
    collectionRate
  };
}

function buildPerformanceAnalysis() {
  const people = uniquePeople(report.people)
    .sort((left, right) => right.totalRevenue - left.totalRevenue)
    .map(withDerived);

  const totals = report.products.reduce((sum, item) => ({
    renewalDeals: sum.renewalDeals + item.renewalDeals,
    totalRevenue: sum.totalRevenue + item.totalRevenue,
    renewalRevenue: sum.renewalRevenue + item.renewalRevenue,
    cashRevenue: sum.cashRevenue + item.cashRevenue
  }), { renewalDeals: 0, totalRevenue: 0, renewalRevenue: 0, cashRevenue: 0 });

  totals.averageRenewal = totals.renewalDeals > 0 ? Math.round(totals.renewalRevenue / totals.renewalDeals) : 0;

  return {
    ...report,
    totals,
    people,
    dispatchOrder: people.slice(0, 20),
    focusGroups: {
      mainForce: people.slice(0, 5),
      companyProduct: people.filter((row) => row.tags.includes('公司產品強') || row.name === '林佩君'),
      cultivation: people.filter((row) => row.tags.includes('新人'))
    },
    recommendation:
      '4/30 正式派單先壓王珍珠、馬秋香、王梅慧、李玲玲、林沛昕；公司產品補許喬恩、鄭上官、林佩君；新人保留少量培養單。'
  };
}

module.exports = {
  buildPerformanceAnalysis
};
