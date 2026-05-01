const OFFICIAL_0501_TO_0502 = Object.freeze({
  reportDate: '115/05/01',
  dispatchDate: '115/05/02',
  title: 'AI 派單公告｜5/1 結算 → 5/2 正式派單順序',
  auditResult: 'PASS',
  scoringMethod: 'AI 比例原則：實收3000＋追續金額2500＋全部總業績1500＋追續客單價1500＋追續單數1500',
  scoringWeights: {
    cashRevenue: 3000,
    renewalRevenue: 2500,
    totalRevenue: 1500,
    averageRenewal: 1500,
    renewalDeals: 1500
  },
  scoringBaselines: {
    maxCashRevenue: { name: '莉莉（新人）', value: 11880 },
    maxRenewalRevenue: { name: '馬秋香', value: 45430 },
    maxTotalRevenue: { name: '馬秋香', value: 76710 },
    maxAverageRenewal: { name: '馬秋香', value: 15143 },
    maxRenewalDeals: { name: '馬秋香', value: 3 }
  },
  overallStats: {
    renewalCalls: 13,
    monthlyRevenue: 302200,
    renewalAmount: 115200,
    actualRevenue: 14860,
    cancellations: 0
  },
  platforms: Object.freeze({
    '三立奕心': {
      cumulativeRenewalDeals: 8,
      monthlyRevenue: 105660,
      totalRenewalAmount: 80380,
      actualRevenue: 11880
    },
    '民視產品': {
      cumulativeRenewalDeals: 4,
      monthlyRevenue: 186080,
      totalRenewalAmount: 26840,
      actualRevenue: 2980
    },
    '公司產品': {
      cumulativeRenewalDeals: 1,
      monthlyRevenue: 10460,
      totalRenewalAmount: 7980,
      actualRevenue: 0
    }
  }),
  ranking: Object.freeze([
    { rank: 1,  name: '馬秋香',       totalScore: 7000.00, actualRevenue: 0,     renewalRevenue: 45430, totalRevenue: 76710, averageRenewal: 15143, renewalDeals: 3, group: 'A1', advice: '你這輪各項比例都最完整，標準就是繼續把第一拉開。' },
    { rank: 2,  name: '莉莉（新人）', totalScore: 5562.84, actualRevenue: 11880, renewalRevenue: 11880, totalRevenue: 11880, averageRenewal: 11880, renewalDeals: 1, group: 'A1', advice: '你這輪靠實收直接衝上前段，重點是穩住不要斷。' },
    { rank: 3,  name: '廖姿惠',       totalScore: 4685.68, actualRevenue: 2980,  renewalRevenue: 19060, totalRevenue: 38610, averageRenewal: 6353,  renewalDeals: 3, group: 'A1', advice: '你三項同步有數字，今天最有機會再往前推。' },
    { rank: 4,  name: '王珍珠',       totalScore: 2940.53, actualRevenue: 0,     renewalRevenue: 12990, totalRevenue: 29780, averageRenewal: 6495,  renewalDeals: 2, group: 'A1', advice: '你的追續與總業績還在主力區，差的是把實收補上。' },
    { rank: 5,  name: '王梅慧',       totalScore: 2718.68, actualRevenue: 0,     renewalRevenue: 9800,  totalRevenue: 36240, averageRenewal: 9800,  renewalDeals: 1, group: 'A2', advice: '你底盤還在，今天補一筆實收就會更漂亮。' },
    { rank: 6,  name: '李玲玲',       totalScore: 2586.36, actualRevenue: 0,     renewalRevenue: 7440,  totalRevenue: 48070, averageRenewal: 7440,  renewalDeals: 1, group: 'A2', advice: '你總業績不差，今天重點是把追續厚度再拉高。' },
    { rank: 7,  name: '林宜靜',       totalScore: 1909.85, actualRevenue: 0,     renewalRevenue: 6000,  totalRevenue: 24820, averageRenewal: 6000,  renewalDeals: 1, group: 'A2', advice: '你還在可追區，今天先把有效數字接上。' },
    { rank: 8,  name: '鄭珮恩',       totalScore: 1017.75, actualRevenue: 0,     renewalRevenue: 2600,  totalRevenue: 5990,  averageRenewal: 2600,  renewalDeals: 1, group: 'A2', advice: '你有基本追續底，今天先求穩穩再補一筆。' },
    { rank: 9,  name: '梁依萍',       totalScore: 274.15,  actualRevenue: 0,     renewalRevenue: 0,     totalRevenue: 14020, averageRenewal: 0,     renewalDeals: 0, group: 'B',  advice: '你現在是總業績撐住位置，今天要把追續補回來。' },
    { rank: 10, name: '陳玲華',       totalScore: 209.62,  actualRevenue: 0,     renewalRevenue: 0,     totalRevenue: 10720, averageRenewal: 0,     renewalDeals: 0, group: 'B',  advice: '你本輪偏單邊，今天只要有一筆追續就會明顯變動。' },
    { rank: 11, name: '高美雲',       totalScore: 104.81,  actualRevenue: 0,     renewalRevenue: 0,     totalRevenue: 5360,  averageRenewal: 0,     renewalDeals: 0, group: 'B',  advice: '你差距不大，今天先求有數字進場。' },
    { rank: 12, name: '徐華妤',       totalScore: 0,       actualRevenue: 0,     renewalRevenue: 0,     totalRevenue: 0,     averageRenewal: 0,     renewalDeals: 0, group: 'C',  advice: '今天最重要是先把第一筆有效數字做出來。' },
    { rank: 13, name: '湯玉琦',       totalScore: 0,       actualRevenue: 0,     renewalRevenue: 0,     totalRevenue: 0,     averageRenewal: 0,     renewalDeals: 0, group: 'C',  advice: '今天最重要是先把第一筆有效數字做出來。' },
    { rank: 14, name: '高如郁',       totalScore: 0,       actualRevenue: 0,     renewalRevenue: 0,     totalRevenue: 0,     averageRenewal: 0,     renewalDeals: 0, group: 'C',  advice: '今天最重要是先把第一筆有效數字做出來。' },
    { rank: 15, name: '江麗勉',       totalScore: 0,       actualRevenue: 0,     renewalRevenue: 0,     totalRevenue: 0,     averageRenewal: 0,     renewalDeals: 0, group: 'C',  advice: '今天最重要是先把第一筆有效數字做出來。' },
    { rank: 16, name: '江沛林',       totalScore: 0,       actualRevenue: 0,     renewalRevenue: 0,     totalRevenue: 0,     averageRenewal: 0,     renewalDeals: 0, group: 'C',  advice: '今天最重要是先把第一筆有效數字做出來。' },
    { rank: 17, name: '陳百玲（新人）', totalScore: 0,     actualRevenue: 0,     renewalRevenue: 0,     totalRevenue: 0,     averageRenewal: 0,     renewalDeals: 0, group: 'C',  advice: '今天最重要是先把第一筆有效數字做出來。' },
    { rank: 18, name: '林佩君',       totalScore: 0,       actualRevenue: 0,     renewalRevenue: 0,     totalRevenue: 0,     averageRenewal: 0,     renewalDeals: 0, group: 'C',  advice: '今天最重要是先把第一筆有效數字做出來。' },
    { rank: 19, name: '林沛昕',       totalScore: 0,       actualRevenue: 0,     renewalRevenue: 0,     totalRevenue: 0,     averageRenewal: 0,     renewalDeals: 0, group: 'C',  advice: '今天最重要是先把第一筆有效數字做出來。' },
    { rank: 20, name: '蘇淑玲',       totalScore: 0,       actualRevenue: 0,     renewalRevenue: 0,     totalRevenue: 0,     averageRenewal: 0,     renewalDeals: 0, group: 'C',  advice: '今天最重要是先把第一筆有效數字做出來。' },
    { rank: 21, name: '謝啟芳',       totalScore: 0,       actualRevenue: 0,     renewalRevenue: 0,     totalRevenue: 0,     averageRenewal: 0,     renewalDeals: 0, group: 'C',  advice: '今天最重要是先把第一筆有效數字做出來。' },
    { rank: 22, name: '許喬恩',       totalScore: 0,       actualRevenue: 0,     renewalRevenue: 0,     totalRevenue: 0,     averageRenewal: 0,     renewalDeals: 0, group: 'C',  advice: '今天最重要是先把第一筆有效數字做出來。' },
    { rank: 23, name: '周美蓁',       totalScore: 0,       actualRevenue: 0,     renewalRevenue: 0,     totalRevenue: 0,     averageRenewal: 0,     renewalDeals: 0, group: 'C',  advice: '今天最重要是先把第一筆有效數字做出來。' },
    { rank: 24, name: '鄭上官',       totalScore: 0,       actualRevenue: 0,     renewalRevenue: 0,     totalRevenue: 0,     averageRenewal: 0,     renewalDeals: 0, group: 'C',  advice: '今天最重要是先把第一筆有效數字做出來。' }
  ]),
  groups: Object.freeze({
    A1: ['馬秋香', '莉莉（新人）', '廖姿惠', '王珍珠'],
    A2: ['王梅慧', '李玲玲', '林宜靜', '鄭珮恩'],
    B:  ['梁依萍', '陳玲華', '高美雲'],
    C:  ['徐華妤', '湯玉琦', '高如郁', '江麗勉', '江沛林', '陳百玲（新人）', '林佩君', '林沛昕', '蘇淑玲', '謝啟芳', '許喬恩', '周美蓁', '鄭上官']
  }),
  excludedEmployees: Object.freeze([]),
  finalConfirmations: Object.freeze([
    '5/1 結算資料已核對完成',
    '三平台總表核對通過',
    '無漏算、無多算、無總盤衝突',
    '本輪正式派單順序已依三平台整合 AI 比例原則版完成',
    '5/2 正式派單順序，以本則公告為準'
  ]),
  groupShortText: '📣【AI 派單公告｜5/1 結算 → 5/2 正式派單】審計 PASS，三平台總表核對通過，無漏算、無多算、無衝突。本輪依 AI 比例原則計算。正式前10名：1馬秋香 2莉莉（新人） 3廖姿惠 4王珍珠 5王梅慧 6李玲玲 7林宜靜 8鄭珮恩 9梁依萍 10陳玲華。A1：馬秋香、莉莉、廖姿惠、王珍珠。A2：王梅慧、李玲玲、林宜靜、鄭珮恩。正式派單順序以本則為準。',
  officialLock: { key: '0501-0502', preserveRankingOrder: true, skipConsistencyChecks: true },
  frontendAiGuard: { allowFormalDisplay: true, confirmedBy: 'SYSTEM_SUPER' }
});

module.exports = { OFFICIAL_0501_TO_0502 };
