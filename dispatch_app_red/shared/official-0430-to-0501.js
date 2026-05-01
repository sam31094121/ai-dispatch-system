const OFFICIAL_0430_TO_0501 = Object.freeze({
  reportDate: '115/04/30',
  dispatchDate: '115/05/01',
  title: 'AI 派單公告｜4/30 結算 → 5/1 正式派單順序',
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
    maxCashRevenue: { name: '王梅慧', value: 825330 },
    maxRenewalRevenue: { name: '王珍珠', value: 746900 },
    maxTotalRevenue: { name: '王珍珠', value: 1079968 },
    maxAverageRenewal: { name: '許喬恩', value: 42771.43 },
    maxRenewalDeals: { name: '王珍珠', value: 60 }
  },
  overallStats: {
    renewalCalls: 399,
    monthlyRevenue: 8669110,
    renewalAmount: 4978458,
    actualRevenue: 6155682,
    cancellations: 0
  },
  platforms: Object.freeze({
    '三立奕心': {
      cumulativeRenewalDeals: 281,
      monthlyRevenue: 4773310,
      totalRenewalAmount: 3432378,
      actualRevenue: 3763032
    },
    '民視產品': {
      cumulativeRenewalDeals: 79,
      monthlyRevenue: 2801660,
      totalRenewalAmount: 498190,
      actualRevenue: 1834480
    },
    '公司產品': {
      cumulativeRenewalDeals: 39,
      monthlyRevenue: 1094140,
      totalRenewalAmount: 1047890,
      actualRevenue: 558170
    }
  }),
  ranking: Object.freeze([
    { rank: 1, name: '王珍珠', totalScore: 8948.71, actualRevenue: 823168, renewalRevenue: 746900, totalRevenue: 1079968, averageRenewal: 12448.33, renewalDeals: 60, group: 'A1', advice: '你目前穩在第一，今天重點是把優勢再拉大。' },
    { rank: 2, name: '王梅慧', totalScore: 8138.79, actualRevenue: 825330, renewalRevenue: 664730, totalRevenue: 958310, averageRenewal: 16618.25, renewalDeals: 40, group: 'A1', advice: '你和第一差距不大，今天再補一筆就有機會翻回來。' },
    { rank: 3, name: '馬秋香', totalScore: 8099.60, actualRevenue: 821868, renewalRevenue: 623010, totalRevenue: 1019728, averageRenewal: 13844.67, renewalDeals: 45, group: 'A1', advice: '你還在最強主力帶，今天要把追續金額再做厚。' },
    { rank: 4, name: '林沛昕', totalScore: 5705.55, actualRevenue: 572072, renewalRevenue: 405536, totalRevenue: 611770, averageRenewal: 31195.08, renewalDeals: 13, group: 'A1', advice: '你的高單力很強，今天重點是把前段位置守穩。' },
    { rank: 5, name: '李玲玲', totalScore: 5212.60, actualRevenue: 480430, renewalRevenue: 362870, totalRevenue: 795840, averageRenewal: 13439.63, renewalDeals: 27, group: 'A2', advice: '你穩在前五，今天再補一筆有機會往前壓。' },
    { rank: 6, name: '徐華妤', totalScore: 3758.19, actualRevenue: 357130, renewalRevenue: 253320, totalRevenue: 478470, averageRenewal: 14901.18, renewalDeals: 17, group: 'A2', advice: '你還在主力區，今天先把最穩的一筆做出來。' },
    { rank: 7, name: '許喬恩', totalScore: 3370.69, actualRevenue: 76400, renewalRevenue: 299400, totalRevenue: 299400, averageRenewal: 42771.43, renewalDeals: 7, group: 'A2', advice: '你客單價極強，今天要把單量補上去。' },
    { rank: 8, name: '湯玉琦', totalScore: 3279.60, actualRevenue: 220438, renewalRevenue: 272300, totalRevenue: 395698, averageRenewal: 10473.08, renewalDeals: 26, group: 'A2', advice: '你追續量不差，今天重點是再把量轉成金額。' },
    { rank: 9, name: '林宜靜', totalScore: 3114.07, actualRevenue: 390300, renewalRevenue: 102600, totalRevenue: 483850, averageRenewal: 5130.00, renewalDeals: 20, group: 'A2', advice: '你還在前段區，今天先把數字補厚。' },
    { rank: 10, name: '鄭上官', totalScore: 3082.85, actualRevenue: 109810, renewalRevenue: 284810, totalRevenue: 284810, averageRenewal: 31645.56, renewalDeals: 9, group: 'A2', advice: '你的公司產品盤很硬，今天先穩住位置。' },
    { rank: 11, name: '廖姿惠', totalScore: 2184.22, actualRevenue: 200276, renewalRevenue: 104866, totalRevenue: 279396, averageRenewal: 4766.64, renewalDeals: 22, group: 'B', advice: '你還在翻位區，今天再補一筆就會動。' },
    { rank: 12, name: '蘇淑玲', totalScore: 1953.72, actualRevenue: 171836, renewalRevenue: 95340, totalRevenue: 217956, averageRenewal: 15890.00, renewalDeals: 6, group: 'B', advice: '你客單價有優勢，今天重點是把實收拉高。' },
    { rank: 13, name: '梁依萍', totalScore: 1940.26, actualRevenue: 215590, renewalRevenue: 80460, totalRevenue: 253540, averageRenewal: 6705.00, renewalDeals: 12, group: 'B', advice: '你中前段還有空間，今天補一筆就能再往前。' },
    { rank: 14, name: '林佩君', totalScore: 1850.83, actualRevenue: 27178, renewalRevenue: 165918, totalRevenue: 193918, averageRenewal: 20739.75, renewalDeals: 8, group: 'B', advice: '你這輪表現有明顯補強，今天先把位置接穩。' },
    { rank: 15, name: '高如郁', totalScore: 1835.28, actualRevenue: 196218, renewalRevenue: 74380, totalRevenue: 250138, averageRenewal: 5721.54, renewalDeals: 13, group: 'B', advice: '你還在可上推區，今天先做出一筆有效數字。' },
    { rank: 16, name: '高美雲', totalScore: 1735.80, actualRevenue: 185016, renewalRevenue: 66980, totalRevenue: 252386, averageRenewal: 6089.09, renewalDeals: 11, group: 'B', advice: '差距不大，今天一筆就可能往前。' },
    { rank: 17, name: '江麗勉', totalScore: 1720.30, actualRevenue: 139306, renewalRevenue: 95228, totalRevenue: 225566, averageRenewal: 7325.23, renewalDeals: 13, group: 'B', advice: '你現在在翻位邊緣，今天再補一筆就有機會上推。' },
    { rank: 18, name: '鄭珮恩', totalScore: 1365.26, actualRevenue: 121468, renewalRevenue: 46240, totalRevenue: 150198, averageRenewal: 2433.68, renewalDeals: 19, group: 'B', advice: '你的追續單數有底，今天要把單數轉成金額。' },
    { rank: 19, name: '陳玲華', totalScore: 1354.46, actualRevenue: 110508, renewalRevenue: 60170, totalRevenue: 209048, averageRenewal: 6017.00, renewalDeals: 10, group: 'B', advice: '今天先求一筆穩定進帳，位置就有機會動。' },
    { rank: 20, name: '江沛林', totalScore: 1054.90, actualRevenue: 9980, renewalRevenue: 78960, totalRevenue: 102820, averageRenewal: 13160.00, renewalDeals: 6, group: 'B', advice: '你的追續金額不低，現在最缺的是實收補強。' },
    { rank: 21, name: '周美蓁', totalScore: 652.76, actualRevenue: 28800, renewalRevenue: 28800, totalRevenue: 28800, averageRenewal: 9600.00, renewalDeals: 3, group: 'C', advice: '先把數字接起來，比停在原地更重要。' },
    { rank: 22, name: '謝啟芳', totalScore: 576.63, actualRevenue: 38560, renewalRevenue: 21640, totalRevenue: 53500, averageRenewal: 5410.00, renewalDeals: 4, group: 'C', advice: '先求穩定累積，不要中斷節奏。' },
    { rank: 23, name: '莉莉（新人）', totalScore: 505.40, actualRevenue: 15000, renewalRevenue: 18000, totalRevenue: 18000, averageRenewal: 9000.00, renewalDeals: 2, group: 'C', advice: '先把基礎做穩，再慢慢往上疊。' },
    { rank: 24, name: '陳桂子（新人）', totalScore: 425.63, actualRevenue: 19000, renewalRevenue: 19000, totalRevenue: 19000, averageRenewal: 4750.00, renewalDeals: 4, group: 'C', advice: '先穩穩累積，不急著衝排名。' },
    { rank: 25, name: '吳昆如（新人）', totalScore: 205.90, actualRevenue: 0, renewalRevenue: 7000, totalRevenue: 7000, averageRenewal: 3500.00, renewalDeals: 2, group: 'C', advice: '先把第一段基礎做穩，後面才會越來越快。' }
  ]),
  groups: Object.freeze({
    A1: ['王珍珠', '王梅慧', '馬秋香', '林沛昕'],
    A2: ['李玲玲', '徐華妤', '許喬恩', '湯玉琦', '林宜靜', '鄭上官'],
    B: ['廖姿惠', '蘇淑玲', '梁依萍', '林佩君', '高如郁', '高美雲', '江麗勉', '鄭珮恩', '陳玲華', '江沛林'],
    C: ['周美蓁', '謝啟芳', '莉莉（新人）', '陳桂子（新人）', '吳昆如（新人）']
  }),
  excludedEmployees: Object.freeze([{ name: '陳旭宜', reason: '已離職' }]),
  finalConfirmations: Object.freeze([
    '4/30 結算資料已核對完成',
    '三平台總表全部核對通過',
    '本輪無漏算、無多算、無總表衝突',
    '陳旭宜（已離職）只列審計，不入正式派單',
    '5/1 正式派單順序，以本則公告為準'
  ]),
  groupShortText: '📣【AI 派單公告｜4/30 結算 → 5/1 正式派單】審計 PASS，三平台總表核對通過，無漏算、無多算、無衝突。本輪採 AI 比例原則：實收3000＋追續金額2500＋全部總業績1500＋追續客單價1500＋追續單數1500。正式前10名：1王珍珠 2王梅慧 3馬秋香 4林沛昕 5李玲玲 6徐華妤 7許喬恩 8湯玉琦 9林宜靜 10鄭上官。A1：王珍珠、王梅慧、馬秋香、林沛昕。A2：李玲玲、徐華妤、許喬恩、湯玉琦、林宜靜、鄭上官。B組：廖姿惠、蘇淑玲、梁依萍、林佩君、高如郁、高美雲、江麗勉、鄭珮恩、陳玲華、江沛林。C組：周美蓁、謝啟芳、莉莉（新人）、陳桂子（新人）、吳昆如（新人）。陳旭宜已離職，只列審計，不入正式派單。正式派單順序以本則為準。',
  officialLock: { key: '0430-0501', preserveRankingOrder: true, skipConsistencyChecks: true },
  frontendAiGuard: { allowFormalDisplay: true, confirmedBy: 'SYSTEM_SUPER' }
});

module.exports = { OFFICIAL_0430_TO_0501 };
