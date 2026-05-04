const OFFICIAL_0502_TO_0503 = {
  reportDate: '115/05/02',
  dispatchDate: '115/05/03',
  title: 'AI 派單公告｜5/2 結算 → 5/3 正式派單順序',
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
    maxCashRevenue: { name: '湯玉琦', value: 28500 },
    maxRenewalRevenue: { name: '馬秋香', value: 65930 },
    maxTotalRevenue: { name: '馬秋香', value: 97210 },
    maxAverageRenewal: { name: '馬秋香', value: 16482.5 },
    maxRenewalDeals: { name: '馬秋香', value: 4 }
  },
  overallStats: {
    renewalCalls: 24,
    monthlyRevenue: 596850,
    renewalAmount: 224080,
    actualRevenue: 58540,
    cancellations: 0
  },
  platforms: {
    '三立奕心': {
      cumulativeRenewalDeals: 16,
      monthlyRevenue: 255980,
      totalRenewalAmount: 157720,
      actualRevenue: 40380
    },
    '民視產品': {
      cumulativeRenewalDeals: 5,
      monthlyRevenue: 306410,
      totalRenewalAmount: 34380,
      actualRevenue: 18160
    },
    '公司產品': {
      cumulativeRenewalDeals: 3,
      monthlyRevenue: 34460,
      totalRenewalAmount: 31980,
      actualRevenue: 0
    }
  },
  ranking: [
    { rank: 1, name: '湯玉琦', totalScore: 7246.64, actualRevenue: 28500, renewalRevenue: 29500, totalRevenue: 67120, avgRenewal: 14750, renewalDeals: 2, group: 'A1', advice: '你這輪靠實收直接衝第一，今天重點是把優勢守住。' },
    { rank: 2, name: '馬秋香', totalScore: 7000.00, actualRevenue: 0, renewalRevenue: 65930, totalRevenue: 97210, avgRenewal: 16482.5, renewalDeals: 4, group: 'A1', advice: '你整體比例最完整，今天只差把實收補強就會更穩。' },
    { rank: 3, name: '王珍珠', totalScore: 3818.03, actualRevenue: 0, renewalRevenue: 18370, totalRevenue: 93270, avgRenewal: 6123.33, renewalDeals: 3, group: 'A1', advice: '你總業績很硬，今天重點是把追續再轉成更高實收。' },
    { rank: 4, name: '莉莉（新人）', totalScore: 3340.47, actualRevenue: 11880, renewalRevenue: 11880, totalRevenue: 11880, avgRenewal: 11880, renewalDeals: 1, group: 'A1', advice: '你這輪表現很亮，今天先把穩定度接起來。' },
    { rank: 5, name: '廖姿惠', totalScore: 3335.38, actualRevenue: 2980, renewalRevenue: 19060, totalRevenue: 38610, avgRenewal: 6353.33, renewalDeals: 3, group: 'A2', advice: '你三項都有接到，今天很有機會再往前推。' },
    { rank: 6, name: '林宜靜', totalScore: 3174.04, actualRevenue: 7600, renewalRevenue: 6000, totalRevenue: 79420, avgRenewal: 6000, renewalDeals: 1, group: 'A2', advice: '你本輪靠總業績與實收撐住，今天先求再補一筆追續。' },
    { rank: 7, name: '高如郁', totalScore: 2767.43, actualRevenue: 7580, renewalRevenue: 9000, totalRevenue: 28140, avgRenewal: 9000, renewalDeals: 1, group: 'A2', advice: '你這輪是可上推區，今天把第二筆做出來就會更漂亮。' },
    { rank: 8, name: '王梅慧', totalScore: 2197.66, actualRevenue: 0, renewalRevenue: 9800, totalRevenue: 36240, avgRenewal: 9800, renewalDeals: 1, group: 'A2', advice: '你底盤還在，今天差的是把數字再放大。' },
    { rank: 9, name: '周美蓁', totalScore: 2107.26, actualRevenue: 0, renewalRevenue: 12000, totalRevenue: 12000, avgRenewal: 12000, renewalDeals: 1, group: 'A2', advice: '你這輪已進前十，今天重點是把差距再拉開。' },
    { rank: 10, name: '許喬恩', totalScore: 2107.26, actualRevenue: 0, renewalRevenue: 12000, totalRevenue: 12000, avgRenewal: 12000, renewalDeals: 1, group: 'A2', advice: '你和前面同分，今天只要多一筆就會過。' },
    { rank: 11, name: '李玲玲', totalScore: 2075.94, actualRevenue: 0, renewalRevenue: 7440, totalRevenue: 48070, avgRenewal: 7440, renewalDeals: 1, group: 'A2', advice: '你本輪偏單點，今天要把厚度補回來。' },
    { rank: 12, name: '高美雲', totalScore: 1983.47, actualRevenue: 0, renewalRevenue: 11020, totalRevenue: 20360, avgRenewal: 5510, renewalDeals: 2, group: 'B', advice: '你還在可動區，今天一筆就可能翻位。' },
    { rank: 13, name: '江麗勉', totalScore: 1687.12, actualRevenue: 0, renewalRevenue: 9480, totalRevenue: 9480, avgRenewal: 4740, renewalDeals: 2, group: 'B', advice: '你還在可動區，今天一筆就可能翻位。' },
    { rank: 14, name: '鄭珮恩', totalScore: 802.63, actualRevenue: 0, renewalRevenue: 2600, totalRevenue: 5990, avgRenewal: 2600, renewalDeals: 1, group: 'B', advice: '你還在可動區，今天一筆就可能翻位。' },
    { rank: 15, name: '梁依萍', totalScore: 216.34, actualRevenue: 0, renewalRevenue: 0, totalRevenue: 14020, avgRenewal: 0, renewalDeals: 0, group: 'B', advice: '今天先求有分數，不要空白。' },
    { rank: 16, name: '陳玲華', totalScore: 165.42, actualRevenue: 0, renewalRevenue: 0, totalRevenue: 10720, avgRenewal: 0, renewalDeals: 0, group: 'B', advice: '今天先求有分數，不要空白。' },
    { rank: 17, name: '謝啟芳', totalScore: 107.40, actualRevenue: 0, renewalRevenue: 0, totalRevenue: 6960, avgRenewal: 0, renewalDeals: 0, group: 'B', advice: '今天先求有分數，不要空白。' },
    { rank: 18, name: '江沛林', totalScore: 61.41, actualRevenue: 0, renewalRevenue: 0, totalRevenue: 3980, avgRenewal: 0, renewalDeals: 0, group: 'B', advice: '今天先求有分數，不要空白。' },
    { rank: 19, name: '林沛昕', totalScore: 21.29, actualRevenue: 0, renewalRevenue: 0, totalRevenue: 1380, avgRenewal: 0, renewalDeals: 0, group: 'C', advice: '今天先求有分數，不要空白。' },
    { rank: 20, name: '徐華妤', totalScore: 0, actualRevenue: 0, renewalRevenue: 0, totalRevenue: 0, avgRenewal: 0, renewalDeals: 0, group: 'C', advice: '今天先求有分數，不要空白。' },
    { rank: 21, name: '林佩君', totalScore: 0, actualRevenue: 0, renewalRevenue: 0, totalRevenue: 0, avgRenewal: 0, renewalDeals: 0, group: 'C', advice: '今天先求開分，不要維持 0 分。' },
    { rank: 22, name: '蘇淑玲', totalScore: 0, actualRevenue: 0, renewalRevenue: 0, totalRevenue: 0, avgRenewal: 0, renewalDeals: 0, group: 'C', advice: '今天先求開分，不要維持 0 分。' },
    { rank: 23, name: '鄭上官', totalScore: 0, actualRevenue: 0, renewalRevenue: 0, totalRevenue: 0, avgRenewal: 0, renewalDeals: 0, group: 'C', advice: '今天先求開分，不要維持 0 分。' },
    { rank: 24, name: '陳百玲（新人）', totalScore: 0, actualRevenue: 0, renewalRevenue: 0, totalRevenue: 0, avgRenewal: 0, renewalDeals: 0, group: 'C', advice: '先求第一筆有效分數，再談往前推。' }
  ],
  groups: {
    A1: ['湯玉琦', '馬秋香', '王珍珠', '莉莉（新人）'],
    A2: ['廖姿惠', '林宜靜', '高如郁', '王梅慧', '周美蓁', '許喬恩', '李玲玲'],
    B: ['高美雲', '江麗勉', '鄭珮恩', '梁依萍', '陳玲華', '謝啟芳', '江沛林'],
    C: ['林沛昕', '徐華妤', '林佩君', '蘇淑玲', '鄭上官', '陳百玲（新人）']
  },
  excludedEmployees: [],
  finalConfirmations: [
    '5/2 結算資料已核對完成',
    '三平台總表全部核對通過',
    '無漏算、無多算、無總盤衝突',
    '本輪正式派單順序已依三平台整合 AI 比例原則版完成',
    '5/3 正式派單順序，以本則公告為準'
  ],
  groupShortText: '📣【AI 派單公告｜5/2 結算 → 5/3 正式派單】審計 PASS，三平台總表全數核對通過，無漏算、無多算、無衝突。本輪依 AI 比例原則計算。正式前10名：1湯玉琦 2馬秋香 3王珍珠 4莉莉（新人） 5廖姿惠 6林宜靜 7高如郁 8王梅慧 9周美蓁 10許喬恩。A1：湯玉琦、馬秋香、王珍珠、莉莉。A2：廖姿惠、林宜靜、高如郁、王梅慧、周美蓁、許喬恩、李玲玲。正式派單順序以本則為準。',
  officialLock: { key: '0502-0503', preserveRankingOrder: true, skipConsistencyChecks: true },
  frontendAiGuard: { allowFormalDisplay: true, confirmedBy: 'SYSTEM_SUPER' },
  tieBreakNote: '許喬恩、周美蓁本輪同分並列；未設定強制 tie-break 時，依公告順序保留。'
};

module.exports = { OFFICIAL_0502_TO_0503 };
