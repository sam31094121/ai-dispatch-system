/**
 * 兆櫃 AI 派單官方存檔：115/05/03 結算 → 115/05/04 正式派單
 * 狀態：AI 比例原則全線解鎖版
 */
const OFFICIAL_0503_TO_0504 = {
  reportDate: '115/05/03',
  dispatchDate: '115/05/04',
  auditResult: '修正後 PASS',
  scoringMethod: 'AI 比例原則：實收3000＋追續金額2500＋全部總業績1500＋追續客單價1500＋追續單數1500',
  overallStats: {
    totalCalls: 0, // 原始數據未提供
    dispatchCalls: 0, // 原始數據未提供
    renewalCalls: 35,
    dailyRenewalAmount: 0,
    monthlyRevenue: 738850,
    renewalAmount: 302020,
    actualRevenue: 100640,
    cancellations: 0
  },
  platforms: {
    '三立奕心': {
      renewalCalls: 24,
      monthlyRevenue: 336420,
      totalRenewalAmount: 226160,
      actualRevenue: 58480,
      passed: true
    },
    '民視產品': {
      renewalCalls: 8, // 依明細修正
      monthlyRevenue: 367970,
      totalRenewalAmount: 43880,
      actualRevenue: 18160,
      passed: true,
      note: '總表成交 9，依明細修正為 8'
    },
    '公司產品': {
      renewalCalls: 3,
      monthlyRevenue: 34460,
      totalRenewalAmount: 31980,
      actualRevenue: 24000,
      passed: true
    }
  },
  ranking: [
    { rank: 1, name: '湯玉琦', totalScore: 8025.09, actualRevenue: 28500, renewalRevenue: 41380, totalRevenue: 91000, avgRenewal: 13793.33, renewalDeals: 3, advice: '你這輪靠實收優勢穩坐第一，今天重點是把領先差距守住。', group: 'A1' },
    { rank: 2, name: '馬秋香', totalScore: 7000.00, actualRevenue: 0, renewalRevenue: 69910, totalRevenue: 117110, avgRenewal: 13982, renewalDeals: 5, advice: '你的五項比例最完整，今天只差把實收補上就能更穩。', group: 'A1' },
    { rank: 3, name: '林宜靜', totalScore: 5388.60, actualRevenue: 7600, renewalRevenue: 31380, totalRevenue: 112760, avgRenewal: 10460, renewalDeals: 3, advice: '你這輪明顯往前衝，今天關鍵是把追續再補厚。', group: 'A1' },
    { rank: 4, name: '林沛昕', totalScore: 5139.24, actualRevenue: 18100, renewalRevenue: 24600, totalRevenue: 33940, avgRenewal: 12300, renewalDeals: 2, advice: '你靠實收與客單價直接翻上前段，今天重點是延續。', group: 'A1' },
    { rank: 5, name: '王珍珠', totalScore: 3468.42, actualRevenue: 0, renewalRevenue: 18370, totalRevenue: 97950, avgRenewal: 6123.33, renewalDeals: 3, advice: '你總業績底盤很硬，今天要把追續再轉成更高分。', group: 'A2' },
    { rank: 6, name: '周美蓁', totalScore: 3433.35, actualRevenue: 12000, renewalRevenue: 12000, totalRevenue: 12000, avgRenewal: 12000, renewalDeals: 1, advice: '你這輪衝上前段，今天只要再接一筆就有機會再升。', group: 'A2' },
    { rank: 7, name: '許喬恩', totalScore: 3433.35, actualRevenue: 12000, renewalRevenue: 12000, totalRevenue: 12000, avgRenewal: 12000, renewalDeals: 1, advice: '你跟前位差距不大，今天補一筆就能動名次。', group: 'A2' },
    { rank: 8, name: '莉莉（新人）', totalScore: 3402.02, actualRevenue: 11880, renewalRevenue: 11880, totalRevenue: 11880, avgRenewal: 11880, renewalDeals: 1, advice: '你這輪仍有亮點，今天先把穩定度接住。', group: 'A2' },
    { rank: 9, name: '廖姿惠', totalScore: 3071.40, actualRevenue: 2980, renewalRevenue: 19060, totalRevenue: 38610, avgRenewal: 6353.33, renewalDeals: 3, advice: '你三項都有接到，今天很有機會再往前推。', group: 'A2' },
    { rank: 10, name: '高如郁', totalScore: 2745.69, actualRevenue: 7580, renewalRevenue: 9000, totalRevenue: 28140, avgRenewal: 9000, renewalDeals: 1, advice: '你還在可上推區，今天先把最穩的一筆收下。', group: 'A2' },
    { rank: 11, name: '李玲玲', totalScore: 2395.25, actualRevenue: 0, renewalRevenue: 11560, totalRevenue: 52190, avgRenewal: 3853.33, renewalDeals: 3, advice: '你這輪有基本厚度，今天要把追續再補強。', group: 'A2' },
    { rank: 12, name: '王梅慧', totalScore: 2246.93, actualRevenue: 0, renewalRevenue: 12800, totalRevenue: 39240, avgRenewal: 6400, renewalDeals: 2, advice: '你底盤還在，今天差的是把有效分數再放大。', group: 'B' },
    { rank: 13, name: '高美雲', totalScore: 1845.98, actualRevenue: 0, renewalRevenue: 11020, totalRevenue: 20360, avgRenewal: 5510, renewalDeals: 2, advice: '你現在差距不大，今天一筆就可能翻位。', group: 'B' },
    { rank: 14, name: '江麗勉', totalScore: 1619.92, actualRevenue: 0, renewalRevenue: 9480, totalRevenue: 13460, avgRenewal: 4740, renewalDeals: 2, advice: '你還在可動區，今天先求再接一筆。', group: 'B' },
    { rank: 15, name: '謝啟芳', totalScore: 904.56, actualRevenue: 0, renewalRevenue: 2980, totalRevenue: 13920, avgRenewal: 2980, renewalDeals: 1, advice: '你這輪有進步，今天要把分數繼續墊高。', group: 'B' },
    { rank: 16, name: '鄭珮恩', totalScore: 748.63, actualRevenue: 0, renewalRevenue: 2600, totalRevenue: 5990, avgRenewal: 2600, renewalDeals: 1, advice: '先把空白項補起來，名次就會往前。', group: 'B' },
    { rank: 17, name: '陳百玲（新人）', totalScore: 611.70, actualRevenue: 0, renewalRevenue: 2000, totalRevenue: 2000, avgRenewal: 2000, renewalDeals: 1, advice: '先穩穩累積，不急著衝，先把下一筆做好。', group: 'B' },
    { rank: 18, name: '梁依萍', totalScore: 179.57, actualRevenue: 0, renewalRevenue: 0, totalRevenue: 14020, avgRenewal: 0, renewalDeals: 0, advice: '今天先求有分數，別讓盤面繼續空白。', group: 'B' },
    { rank: 19, name: '江沛林', totalScore: 148.07, actualRevenue: 0, renewalRevenue: 0, totalRevenue: 11560, avgRenewal: 0, renewalDeals: 0, advice: '先把零分狀態解除，後面才有機會往前。', group: 'C' },
    { rank: 20, name: '陳玲華', totalScore: 137.31, actualRevenue: 0, renewalRevenue: 0, totalRevenue: 10720, avgRenewal: 0, renewalDeals: 0, advice: '今天先求進帳，先回到可競爭區。', group: 'C' },
    { rank: 21, name: '徐華妤', totalScore: 0, actualRevenue: 0, renewalRevenue: 0, totalRevenue: 0, avgRenewal: 0, renewalDeals: 0, advice: '這輪是空白分，今天最重要的是先接到第一筆。', group: 'C' },
    { rank: 22, name: '林佩君', totalScore: 0, actualRevenue: 0, renewalRevenue: 0, totalRevenue: 0, avgRenewal: 0, renewalDeals: 0, advice: '先把有效數字做出來，才有往前的空間。', group: 'C' },
    { rank: 23, name: '蘇淑玲', totalScore: 0, actualRevenue: 0, renewalRevenue: 0, totalRevenue: 0, avgRenewal: 0, renewalDeals: 0, advice: '今天先求有分，再談翻位。', group: 'C' },
    { rank: 24, name: '鄭上官', totalScore: 0, actualRevenue: 0, renewalRevenue: 0, totalRevenue: 0, avgRenewal: 0, renewalDeals: 0, advice: '先解除空白，後續才有排名意義。', group: 'C' }
  ],
  groups: {
    A1: ['湯玉琦', '馬秋香', '林宜靜', '林沛昕'],
    A2: ['王珍珠', '周美蓁', '許喬恩', '莉莉（新人）', '廖姿惠', '高如郁', '李玲玲'],
    B: ['王梅慧', '高美雲', '江麗勉', '謝啟芳', '鄭珮恩', '陳百玲（新人）', '梁依萍'],
    C: ['江沛林', '陳玲華', '徐華妤', '林佩君', '蘇淑玲', '鄭上官']
  },
  finalConfirmations: [
    '5/3 結算資料已核對完成。',
    '三平台已完成整合審計。',
    '民視追續單成交總表 9 與明細 8 不一致，已改用明細 8。',
    '5/4 正式派單順序，以本則公告為準。'
  ],
  groupShortText: '📣【AI 派單公告｜5/3 結算 → 5/4 正式派單】審計修正後 PASS。民視追續單成交總表 9、明細加總 8，正式已改用明細 8；其餘三平台核對通過，無漏算、無多算、無衝突。本輪依 AI 比例原則計算。正式前10名：1湯玉琦 2馬秋香 3林宜靜 4林沛昕 5王珍珠 6周美蓁 7許喬恩 8莉莉（新人） 9廖姿惠 10高如郁。A1：湯玉琦、馬秋香、林宜靜、林沛昕。A2：王珍珠、周美蓁、許喬恩、莉莉、廖姿惠、高如郁、李玲玲。正式派單順序以本則為準。'
};

module.exports = { OFFICIAL_0503_TO_0504 };
