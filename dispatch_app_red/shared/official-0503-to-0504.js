/**
 * 兆櫃 AI 派單官方存檔：115/05/03 結算 → 115/05/04 正式派單
 * 狀態：審計修正後 PASS (含完整名次異動紀錄)
 */
const OFFICIAL_0503_TO_0504 = {
  reportDate: '115/05/03',
  dispatchDate: '115/05/04',
  auditResult: '修正後 PASS',
  scoringMethod: 'AI 比例原則 (10,000 分制)',
  overallStats: {
    renewalCalls: 35,
    monthlyRevenue: 738850,
    renewalAmount: 302020,
    actualRevenue: 100640,
    cancellations: 0
  },
  platforms: {
    '三立奕心': { cumulativeRenewalDeals: 24, monthlyRevenue: 336420, totalRenewalAmount: 226160, actualRevenue: 58480 },
    '民視': { cumulativeRenewalDeals: 8, monthlyRevenue: 367970, totalRenewalAmount: 43880, actualRevenue: 18160 },
    '公司產品': { cumulativeRenewalDeals: 3, monthlyRevenue: 34460, totalRenewalAmount: 31980, actualRevenue: 24000 }
  },
  benchmarks: {
    maxActualRevenue: { value: 28500, holder: '湯玉琦' },
    maxRenewalRevenue: { value: 69910, holder: '馬秋香' },
    maxTotalRevenue: { value: 117110, holder: '馬秋香' },
    maxAvgRenewal: { value: 13982, holder: '馬秋香' },
    maxRenewalDeals: { value: 5, holder: '馬秋香' }
  },
  ranking: [
    { rank: 1, name: '湯玉琦', prevRank: 1, move: 'flat', totalScore: 8025.09, actualRevenue: 28500, renewalRevenue: 41380, totalRevenue: 91000, avgRenewal: 13793.33, renewalDeals: 3, group: 'A1', advice: '你這輪靠實收優勢穩坐第一，今天重點是把領先差距守住。' },
    { rank: 2, name: '馬秋香', prevRank: 2, move: 'flat', totalScore: 7000.00, actualRevenue: 0, renewalRevenue: 69910, totalRevenue: 117110, avgRenewal: 13982, renewalDeals: 5, group: 'A1', advice: '你的五項比例最完整，今天只差把實收補上就能更穩。' },
    { rank: 3, name: '林宜靜', prevRank: 6, move: 'up', totalScore: 5388.60, actualRevenue: 7600, renewalRevenue: 31380, totalRevenue: 112760, avgRenewal: 10460, renewalDeals: 3, group: 'A1', advice: '你這輪明顯往前衝，今天關鍵是把追續再補厚。' },
    { rank: 4, name: '林沛昕', prevRank: 19, move: 'up', totalScore: 5139.24, actualRevenue: 18100, renewalRevenue: 24600, totalRevenue: 33940, avgRenewal: 12300, renewalDeals: 2, group: 'A1', advice: '你靠實收與客單價直接翻上前段，今天重點是延續。' },
    { rank: 5, name: '王珍珠', prevRank: 3, move: 'down', totalScore: 3468.42, actualRevenue: 0, renewalRevenue: 18370, totalRevenue: 97950, avgRenewal: 6123.33, renewalDeals: 3, group: 'A2', advice: '你總業績底盤很硬，今天要把追續再轉成更高分。' },
    { rank: 6, name: '周美蓁', prevRank: 9, move: 'up', totalScore: 3433.35, actualRevenue: 12000, renewalRevenue: 12000, totalRevenue: 12000, avgRenewal: 12000, renewalDeals: 1, group: 'A2', advice: '你這輪衝上前段，今天只要再接一筆就有機會再升。' },
    { rank: 7, name: '許喬恩', prevRank: 10, move: 'up', totalScore: 3433.35, actualRevenue: 12000, renewalRevenue: 12000, totalRevenue: 12000, avgRenewal: 12000, renewalDeals: 1, group: 'A2', advice: '你跟前位差距不大，今天補一筆就能動名次。' },
    { rank: 8, name: '莉莉（新人）', prevRank: 4, move: 'down', totalScore: 3402.02, actualRevenue: 11880, renewalRevenue: 11880, totalRevenue: 11880, avgRenewal: 11880, renewalDeals: 1, group: 'A2', advice: '你這輪仍有亮點，今天先把穩定度接住。' },
    { rank: 9, name: '廖姿惠', prevRank: 5, move: 'down', totalScore: 3071.40, actualRevenue: 2980, renewalRevenue: 19060, totalRevenue: 38610, avgRenewal: 6353.33, renewalDeals: 3, group: 'A2', advice: '你三項都有接到，今天很有機會再往前推。' },
    { rank: 10, name: '高如郁', prevRank: 7, move: 'down', totalScore: 2745.69, actualRevenue: 7580, renewalRevenue: 9000, totalRevenue: 28140, avgRenewal: 9000, renewalDeals: 1, group: 'A2', advice: '你還在可上推區，今天先把最穩的一筆收下。' },
    { rank: 11, name: '李玲玲', prevRank: 11, move: 'flat', totalScore: 2395.25, actualRevenue: 0, renewalRevenue: 11560, totalRevenue: 52190, avgRenewal: 3853.33, renewalDeals: 3, group: 'A2', advice: '你這輪有基本厚度，今天要把追續再補強。' },
    { rank: 12, name: '王梅慧', prevRank: 8, move: 'down', totalScore: 2246.93, actualRevenue: 0, renewalRevenue: 12800, totalRevenue: 39240, avgRenewal: 6400, renewalDeals: 2, group: 'B', advice: '你底盤還在，今天差的是把有效分數再放大。' },
    { rank: 13, name: '高美雲', prevRank: 12, move: 'down', totalScore: 1845.98, actualRevenue: 0, renewalRevenue: 11020, totalRevenue: 20360, avgRenewal: 5510, renewalDeals: 2, group: 'B', advice: '你現在差距不大，今天一筆就可能翻位。' },
    { rank: 14, name: '江麗勉', prevRank: 13, move: 'down', totalScore: 1619.92, actualRevenue: 0, renewalRevenue: 9480, totalRevenue: 13460, avgRenewal: 4740, renewalDeals: 2, group: 'B', advice: '你還在可動區，今天先求再接一筆。' },
    { rank: 15, name: '謝啟芳', prevRank: 17, move: 'up', totalScore: 904.56, actualRevenue: 0, renewalRevenue: 2980, totalRevenue: 13920, avgRenewal: 2980, renewalDeals: 1, group: 'B', advice: '你這輪有進步，今天要把分數繼續墊高。' },
    { rank: 16, name: '鄭珮恩', prevRank: 14, move: 'down', totalScore: 748.63, actualRevenue: 0, renewalRevenue: 2600, totalRevenue: 5990, avgRenewal: 2600, renewalDeals: 1, group: 'B', advice: '先把空白項補起來，名次就會往前。' },
    { rank: 17, name: '陳百玲（新人）', prevRank: 24, move: 'up', totalScore: 611.70, actualRevenue: 0, renewalRevenue: 2000, totalRevenue: 2000, avgRenewal: 2000, renewalDeals: 1, group: 'B', advice: '先穩穩累積，不急著衝，先把下一筆做好。' },
    { rank: 18, name: '梁依萍', prevRank: 15, move: 'down', totalScore: 179.57, actualRevenue: 0, renewalRevenue: 0, totalRevenue: 14020, avgRenewal: 0, renewalDeals: 0, group: 'B', advice: '今天先求有分數，別讓盤面繼續空白。' },
    { rank: 19, name: '江沛林', prevRank: 18, move: 'down', totalScore: 148.07, actualRevenue: 0, renewalRevenue: 0, totalRevenue: 11560, avgRenewal: 0, renewalDeals: 0, group: 'C', advice: '先把零分狀態解除，後面才有機會往前。' },
    { rank: 20, name: '陳玲華', prevRank: 16, move: 'down', totalScore: 137.31, actualRevenue: 0, renewalRevenue: 0, totalRevenue: 10720, avgRenewal: 0, renewalDeals: 0, group: 'C', advice: '今天先求進帳，先回到可競爭區。' },
    { rank: 21, name: '徐華妤', prevRank: 20, move: 'down', totalScore: 0, actualRevenue: 0, renewalRevenue: 0, totalRevenue: 0, avgRenewal: 0, renewalDeals: 0, group: 'C', advice: '這輪是空白分，今天最重要的是先接到第一筆。' },
    { rank: 22, name: '林佩君', prevRank: 21, move: 'down', totalScore: 0, actualRevenue: 0, renewalRevenue: 0, totalRevenue: 0, avgRenewal: 0, renewalDeals: 0, group: 'C', advice: '先把有效數字做出來，才有往前的空間。' },
    { rank: 23, name: '蘇淑玲', prevRank: 22, move: 'down', totalScore: 0, actualRevenue: 0, renewalRevenue: 0, totalRevenue: 0, avgRenewal: 0, renewalDeals: 0, group: 'C', advice: '今天先求有分，再談翻位。' },
    { rank: 24, name: '鄭上官', prevRank: 23, move: 'down', totalScore: 0, actualRevenue: 0, renewalRevenue: 0, totalRevenue: 0, avgRenewal: 0, renewalDeals: 0, group: 'C', advice: '先解除空白，後續才有排名意義。' }
  ],
  groups: {
    A1: ['湯玉琦', '馬秋香', '林宜靜', '林沛昕'],
    A2: ['王珍珠', '周美蓁', '許喬恩', '莉莉（新人）', '廖姿惠', '高如郁', '李玲玲'],
    B: ['王梅慧', '高美雲', '江麗勉', '謝啟芳', '鄭珮恩', '陳百玲（新人）', '梁依萍'],
    C: ['江沛林', '陳玲華', '徐華妤', '林佩君', '蘇淑玲', '鄭上官']
  },
  platformAudit: [
    { platform: '三立奕心', status: 'PASS', details: '總表核對通過 (24通/33.6萬/實收5.8萬)' },
    { platform: '民視產品', status: 'WARNING', details: '總表9通與明細8通不符，已改採明細8通計算。其餘核對通過。' },
    { platform: '公司產品', status: 'PASS', details: '總表核對通過 (3通/3.4萬/實收2.4萬)' }
  ],
  announcement: `📣【AI 派單公告｜5/3 結算 → 5/4 正式派單】
審計修正後 PASS。民視追續單成交總表 9、明細加總 8，正式已改用明細 8；其餘三平台核對通過，無漏算、無多算、無總盤衝突。本輪依 AI 比例原則計算。正式前10名：1湯玉琦 2馬秋香 3林宜靜 4林沛昕 5王珍珠 6周美蓁 7許喬恩 8莉莉（新人） 9廖姿惠 10高如郁。A1：湯玉琦、馬秋香、林宜靜、林沛昕。A2：王珍珠、周美蓁、許喬恩、莉莉、廖姿惠、高如郁、李玲玲。正式派單順序以本則為準。`
};

module.exports = { OFFICIAL_0503_TO_0504 };
