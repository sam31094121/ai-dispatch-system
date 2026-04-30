const META = {
  reportDate: '2026-04-29',
  displayDate: '115/04/29',
  weekday: '星期三',
  nextDispatchDate: '2026-04-30',
  nextDispatchDisplayDate: '115/04/30'
};

const SCORING_WEIGHTS = {
  cashRevenue:    3000,
  renewalRevenue: 2500,
  totalRevenue:   1500,
  averageRenewal: 1500,
  renewalDeals:   1500
};

const PRODUCTS = [
  { name: '三立奕心', renewalDeals: 274, totalRevenue: 4722330, renewalRevenue: 3402278, cashRevenue: 3763032 },
  { name: '民視', renewalDeals:  77, totalRevenue: 2678260, renewalRevenue:  481170, cashRevenue: 1834480 },
  { name: '公司', renewalDeals:  39, totalRevenue: 1122700, renewalRevenue: 1076450, cashRevenue:  558170 }
];

const PEOPLE = [
  { name: '王珍珠', weightedScore: 8949.22, cashRevenue:  823168, renewalRevenue: 768960, totalRevenue: 1102028, averageRenewal: 13033, renewalDeals: 59, tier: 'A1', tags: ['總業績第1', '成交第1'],    advice: '你目前穩居第一，今天重點是把領先差距再拉開。' },
  { name: '王梅慧', weightedScore: 8039.66, cashRevenue:  825330, renewalRevenue: 667710, totalRevenue:  930460, averageRenewal: 16693, renewalDeals: 40, tier: 'A1', tags: ['實收第1', '三立奕心強'],   advice: '你實收最強，今天只差一筆就很有機會翻回榜首。' },
  { name: '馬秋香', weightedScore: 7982.23, cashRevenue:  821868, renewalRevenue: 623010, totalRevenue:  984268, averageRenewal: 13845, renewalDeals: 45, tier: 'A1', tags: ['穩定主力'],               advice: '你還在第一集團，今天重點是把追續金額再往上推。' },
  { name: '林沛昕', weightedScore: 5651.87, cashRevenue:  572072, renewalRevenue: 405536, totalRevenue:  609390, averageRenewal: 31195, renewalDeals: 13, tier: 'A1', tags: ['高均價', '高實收'],       advice: '你的高單能力很明顯，今天要把優勢繼續放大。' },
  { name: '李玲玲', weightedScore: 5102.94, cashRevenue:  480430, renewalRevenue: 360290, totalRevenue:  762800, averageRenewal: 13857, renewalDeals: 26, tier: 'A2', tags: ['三線均衡'],               advice: '你穩在前五，今天先守住位置再找機會往前壓。' },
  { name: '徐華妤', weightedScore: 3624.47, cashRevenue:  357130, renewalRevenue: 241440, totalRevenue:  444770, averageRenewal: 15090, renewalDeals: 16, tier: 'A2', tags: ['穩定補量'],               advice: '你還在主力帶，今天再補一筆就能更往前。' },
  { name: '許喬恩', weightedScore: 3336.59, cashRevenue:   76400, renewalRevenue: 299400, totalRevenue:  299400, averageRenewal: 42771, renewalDeals:  7, tier: 'A2', tags: ['公司產品強', '高均價'],   advice: '你的客單價最強，今天重點是把單量補起來。' },
  { name: '湯玉琦', weightedScore: 3248.05, cashRevenue:  220438, renewalRevenue: 272300, totalRevenue:  391718, averageRenewal: 10473, renewalDeals: 26, tier: 'A2', tags: ['成交量高'],               advice: '你的追續量有底，今天要把量再轉成金額。' },
  { name: '林宜靜', weightedScore: 3129.78, cashRevenue:  390300, renewalRevenue: 102600, totalRevenue:  506290, averageRenewal:  5130, renewalDeals: 20, tier: 'A2', tags: ['民視業績強'],             advice: '你還在前段區，今天先把數字做厚。' },
  { name: '鄭上官', weightedScore: 3051.40, cashRevenue:  109810, renewalRevenue: 284810, totalRevenue:  284810, averageRenewal: 31646, renewalDeals:  9, tier: 'A2', tags: ['公司產品強'],             advice: '你的公司產品盤很硬，今天先穩穩守位。' },
  { name: '廖姿惠', weightedScore: 2119.84, cashRevenue:  200276, renewalRevenue: 100366, totalRevenue:  267456, averageRenewal:  4779, renewalDeals: 21, tier: 'B',  tags: ['成交穩'],                 advice: '你在翻位區，今天再補一筆就有機會上推。' },
  { name: '梁依萍', weightedScore: 1954.70, cashRevenue:  215590, renewalRevenue:  80460, totalRevenue:  271270, averageRenewal:  6705, renewalDeals: 12, tier: 'B',  tags: ['民視實收佳'],             advice: '你整體很平均，今天再補一筆就能動名次。' },
  { name: '蘇淑玲', weightedScore: 1944.28, cashRevenue:  171836, renewalRevenue:  95340, totalRevenue:  220336, averageRenewal: 15890, renewalDeals:  6, tier: 'B',  tags: ['均價可拉高'],             advice: '你客單價不差，今天重點是把實收再補高。' },
  { name: '林佩君', weightedScore: 1832.90, cashRevenue:   27178, renewalRevenue: 165918, totalRevenue:  193918, averageRenewal: 20740, renewalDeals:  8, tier: 'B',  tags: ['公司高均價'],             advice: '你這輪衝得很明顯，今天先把位置站穩。' },
  { name: '高如郁', weightedScore: 1826.69, cashRevenue:  196218, renewalRevenue:  74380, totalRevenue:  250138, averageRenewal:  5722, renewalDeals: 13, tier: 'B',  tags: ['實收穩'],                 advice: '你還在可上推區，今天先收最穩的一筆。' },
  { name: '高美雲', weightedScore: 1660.76, cashRevenue:  185016, renewalRevenue:  60000, totalRevenue:  241356, averageRenewal:  6000, renewalDeals: 10, tier: 'B',  tags: ['民視穩'],                 advice: '差距不大，今天一筆就可能往前。' },
  { name: '江麗勉', weightedScore: 1621.09, cashRevenue:  139306, renewalRevenue:  86228, totalRevenue:  203726, averageRenewal:  7186, renewalDeals: 12, tier: 'B',  tags: ['補量區'],                 advice: '你現在在中段翻位區，今天補一筆就會動。' },
  { name: '鄭珮恩', weightedScore: 1380.31, cashRevenue:  121468, renewalRevenue:  50660, totalRevenue:  159978, averageRenewal:  2814, renewalDeals: 18, tier: 'B',  tags: ['成交補量'],               advice: '你的追續單數有底，今天要把單數轉成金額。' },
  { name: '陳玲華', weightedScore: 1169.33, cashRevenue:  110508, renewalRevenue:  43130, totalRevenue:  171458, averageRenewal:  6161, renewalDeals:  7, tier: 'C',  tags: ['民視實收'],               advice: '你後面還有空間，今天先做出一筆有效數字。' },
  { name: '江沛林', weightedScore: 1039.71, cashRevenue:    9980, renewalRevenue:  78960, totalRevenue:   97460, averageRenewal: 13160, renewalDeals:  6, tier: 'C',  tags: ['追續金額高於實收'],       advice: '你追續金額不低，今天重點是把實收補起來。' },
  { name: '周美蓁', weightedScore:  650.46, cashRevenue:   28800, renewalRevenue:  28800, totalRevenue:   28800, averageRenewal:  9600, renewalDeals:  3, tier: 'C',  tags: ['小量'],                   advice: '先把數字接起來，比停在原地更重要。' },
  { name: '謝啟芳', weightedScore:  562.24, cashRevenue:   38560, renewalRevenue:  21640, totalRevenue:   53500, averageRenewal:  4328, renewalDeals:  5, tier: 'C',  tags: ['觀察'],                   advice: '你還在後段，先求一筆穩定進度。' },
  { name: '莉莉',   weightedScore:  504.02, cashRevenue:   15000, renewalRevenue:  18000, totalRevenue:   18000, averageRenewal:  9000, renewalDeals:  2, tier: 'C',  tags: ['新人', '培養單'],         advice: '先把基礎數字做穩，再慢慢往上疊。' },
  { name: '陳桂子', weightedScore:  424.97, cashRevenue:   19000, renewalRevenue:  19000, totalRevenue:   19000, averageRenewal:  4750, renewalDeals:  4, tier: 'C',  tags: ['新人', '培養單'],         advice: '先穩穩累積，不急著衝排名。' }
];

const RETIRED = ['陳旭宜'];

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
    recommendation: '4/30 正式派單先壓王珍珠、王梅慧、馬秋香、林沛昕；A2 補李玲玲、徐華妤、許喬恩、湯玉琦、林宜靜、鄭上官；B/C 依順序補位，前方全忙才往下派，不得跳位。',
    focusGroups: {
      mainForce:      byTier('A1'),
      companyProduct: people.filter((p) => p.tags.includes('公司產品強')),
      cultivation:    people.filter((p) => p.tags.includes('新人'))
    }
  };
})();

function buildPerformanceAnalysis() {
  return _analysis;
}

module.exports = { buildPerformanceAnalysis };
