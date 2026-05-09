const fs = require('fs');
const path = require('path');

const LATEST_PATH = path.join(__dirname, '..', 'data', 'dispatch-reports-v1', 'latest.json');

const finalData = {
  "report": {
    "reportId": "dispatch_2026_05_09_v1",
    "version": 6,
    "status": "published",
    "title": "AI 派單公告｜5/9 結算 → 5/10 正式派單順序｜AI 比例原則版",
    "settlementDate": "2026-05-09",
    "dispatchDate": "2026-05-10",
    "auditResult": "PASS",
    "audit": {
      "result": "PASS",
      "rule": "先審計，後運算，後排序，再派單",
      "notes": [
        "本輪三平台總表與個別明細加總一致。",
        "無漏算、無多算、無總盤衝突。",
        "蘇淑玲（已離職）只列審計，不列正式排名。",
        "新人標示格式已永久統一為「姓名（新人）」"
      ],
      "excludedEmployees": [
        { "name": "蘇淑玲", "reason": "已離職" }
      ],
      "platforms": [
        { "platformName": "三立奕心", "passed": true, "metrics": { "追續單成交": 106, "全部總業績": 2062256, "追續單金額": 1680110, "實收總金額": 965278 } },
        { "platformName": "民視產品", "passed": true, "metrics": { "追續單成交": 29, "全部總業績": 1010260, "追續單金額": 169100, "實收總金額": 546170 } },
        { "platformName": "公司產品", "passed": true, "metrics": { "追續單成交": 10, "全部總業績": 252200, "追續單金額": 249720, "實收總金額": 203760 } }
      ]
    },
    "summaryBoard": {
      "追續單成交": 145,
      "全部總業績": 3324716,
      "追續單金額": 2098930,
      "實收總金額": 1715208,
      "totalRevenue": 3324716,
      "actualRevenue": 1715208,
      "renewalRevenue": 2098930,
      "renewalDeals": 145
    },
    "rankings": [
      { "rank": 1, "name": "馬秋香", "group": "A1", "metrics": { "score": 8934.39, "actualRevenue": 353930, "totalRevenue": 621230, "renewalRevenue": 530590, "renewalDeals": 17, "renewalAverage": 31211.18, "正式權重分數": 8934.39, "實收": 353930, "總業績": 621230, "續單金額": 530590, "追續成交總數": 17, "追續客單價": 31211.18 }, "advice": "你這輪全面壓制第一，今天重點是把領先差距再拉大。" },
      { "rank": 2, "name": "王梅慧", "group": "A1", "metrics": { "score": 4677.29, "actualRevenue": 147240, "totalRevenue": 382020, "renewalRevenue": 253580, "renewalDeals": 11, "renewalAverage": 23052.73, "正式權重分數": 4677.29, "實收": 147240, "總業績": 382020, "續單金額": 253580, "追續成交總數": 11, "追續客單價": 23052.73 }, "advice": "你高追續金額與高客單都很強，今天把實收再補厚就更穩。" },
      { "rank": 3, "name": "王珍珠", "group": "A1", "metrics": { "score": 4301.95, "actualRevenue": 137490, "totalRevenue": 299840, "renewalRevenue": 158210, "renewalDeals": 20, "renewalAverage": 7910.50, "正式權重分數": 4301.95, "實收": 137490, "總業績": 299840, "續單金額": 158210, "追續成交總數": 20, "追續客單價": 7910.50 }, "advice": "你追續單數全場最高，今天重點是把單數優勢轉成更高實收。" },
      { "rank": 4, "name": "許喬恩", "group": "A1", "metrics": { "score": 3865.56, "actualRevenue": 142000, "totalRevenue": 142000, "renewalRevenue": 142000, "renewalDeals": 2, "renewalAverage": 71000.00, "正式權重分數": 3865.56, "實收": 142000, "總業績": 142000, "續單金額": 142000, "追續成交總數": 2, "追續客單價": 71000.00 }, "advice": "你的追續客單價全場最高，今天只要補單數就能繼續往前壓。" },
      { "rank": 5, "name": "湯玉琦", "group": "A2", "metrics": { "score": 3788.75, "actualRevenue": 119040, "totalRevenue": 293380, "renewalRevenue": 187920, "renewalDeals": 11, "renewalAverage": 17083.64, "正式權重分數": 3788.75, "實收": 119040, "總業績": 293380, "續單金額": 187920, "追續成交總數": 11, "追續客單價": 17083.64 }, "advice": "你整體很完整，今天重點是把追續量再推高一層。" },
      { "rank": 6, "name": "林沛昕", "group": "A2", "metrics": { "score": 3335.14, "actualRevenue": 132968, "totalRevenue": 181216, "renewalRevenue": 142560, "renewalDeals": 11, "renewalAverage": 12960.00, "正式權重分數": 3335.14, "實收": 132968, "總業績": 181216, "續單金額": 142560, "追續成交總數": 11, "追續客單價": 12960.00 }, "advice": "你實收與追續金額都穩，今天再補一筆高客單有機會逼前五。" },
      { "rank": 7, "name": "廖姿惠", "group": "A2", "metrics": { "score": 2981.75, "actualRevenue": 111190, "totalRevenue": 194570, "renewalRevenue": 120080, "renewalDeals": 10, "renewalAverage": 12008.00, "正式權重分數": 2981.75, "實收": 111190, "總業績": 194570, "續單金額": 120080, "追續成交總數": 10, "追續客單價": 12008.00 }, "advice": "你整體厚度夠，今天重點是把高額實收接回來。" },
      { "rank": 8, "name": "林宜靜", "group": "A2", "metrics": { "score": 2396.97, "actualRevenue": 122650, "totalRevenue": 179660, "renewalRevenue": 61380, "renewalDeals": 5, "renewalAverage": 12276.00, "正式權重分數": 2396.97, "實收": 122650, "總業績": 179660, "續單金額": 61380, "追續成交總數": 5, "追續客單價": 12276.00 }, "advice": "你實收很穩，今天只差把追續成交數再補上。" },
      { "rank": 9, "name": "李玲玲", "group": "A2", "metrics": { "score": 2345.75, "actualRevenue": 76870, "totalRevenue": 200170, "renewalRevenue": 83080, "renewalDeals": 8, "renewalAverage": 10385.00, "正式權重分數": 2345.75, "實收": 76870, "總業績": 200170, "續單金額": 83080, "追續成交總數": 8, "追續客單價": 10385.00 }, "advice": "你總業績厚度不差，今天要把追續金額與實收一起補強。" },
      { "rank": 10, "name": "徐華妤", "group": "A2", "metrics": { "score": 1968.25, "actualRevenue": 40960, "totalRevenue": 137960, "renewalRevenue": 98860, "renewalDeals": 4, "renewalAverage": 24715.00, "正式權重分數": 1968.25, "實收": 40960, "總業績": 137960, "續單金額": 98860, "追續成交總數": 4, "追續客單價": 24715.00 }, "advice": "你的客單價很亮，今天關鍵是把實收再接起來。" },
      { "rank": 11, "name": "高美雲", "group": "A2", "metrics": { "score": 1532.25, "actualRevenue": 42320, "totalRevenue": 86830, "renewalRevenue": 49490, "renewalDeals": 8, "renewalAverage": 6186.25, "正式權重分數": 1532.25, "實收": 42320, "總業績": 86830, "續單金額": 49490, "追續成交總數": 8, "追續客單價": 6186.25 }, "advice": "你目前仍在可翻位區，今天再補一筆就會往前推。" },
      { "rank": 12, "name": "梁依萍", "group": "B", "metrics": { "score": 1278.17, "actualRevenue": 44360, "totalRevenue": 89040, "renewalRevenue": 39320, "renewalDeals": 3, "renewalAverage": 13106.67, "正式權重分數": 1278.17, "實收": 44360, "總業績": 89040, "續單金額": 39320, "追續成交總數": 3, "追續客單價": 13106.67 }, "advice": "你有客單優勢，今天先把成交量補足。" },
      { "rank": 13, "name": "高如郁", "group": "B", "metrics": { "score": 1217.62, "actualRevenue": 37640, "totalRevenue": 85410, "renewalRevenue": 39260, "renewalDeals": 4, "renewalAverage": 9815.00, "正式權重分數": 1217.62, "實收": 37640, "總業績": 85410, "續單金額": 39260, "追續成交總數": 4, "追續客單價": 9815.00 }, "advice": "你現在差距不大，今天穩穩補一筆就能動。" },
      { "rank": 14, "name": "鄭珮恩", "group": "B", "metrics": { "score": 1141.23, "actualRevenue": 8750, "totalRevenue": 67550, "renewalRevenue": 41340, "renewalDeals": 8, "renewalAverage": 5167.50, "正式權重分數": 1141.23, "實收": 8750, "總業績": 67550, "續單金額": 41340, "追續成交總數": 8, "追續客單價": 5167.50 }, "advice": "你這輪追續單數有量，今天要把金額與實收一起補強。" },
      { "rank": 15, "name": "江沛林", "group": "B", "metrics": { "score": 1075.83, "actualRevenue": 51240, "totalRevenue": 96170, "renewalRevenue": 15680, "renewalDeals": 3, "renewalAverage": 5226.67, "正式權重分數": 1075.83, "實收": 51240, "總業績": 96170, "續單金額": 15680, "追續成交總數": 3, "追續客單價": 5226.67 }, "advice": "你有實收底盤，今天再補追續量就能更穩。" },
      { "rank": 16, "name": "江麗勉", "group": "B", "metrics": { "score": 790.25, "actualRevenue": 13460, "totalRevenue": 41520, "renewalRevenue": 22480, "renewalDeals": 5, "renewalAverage": 4496.00, "正式權重分數": 790.25, "實收": 13460, "總業績": 41520, "續單金額": 22480, "追續成交總數": 5, "追續客單價": 4496.00 }, "advice": "你還在可動區，今天先把第二筆、第三筆做出來。" },
      { "rank": 17, "name": "陳百玲（新人）", "group": "B", "isNew": true, "metrics": { "score": 779.18, "actualRevenue": 5980, "totalRevenue": 31140, "renewalRevenue": 31140, "renewalDeals": 5, "renewalAverage": 6228.00, "正式權重分數": 779.18, "實收": 5980, "總業績": 31140, "續單金額": 31140, "追續成交總數": 5, "追續客單價": 6228.00 }, "advice": "你有基礎分數，今天先把節奏穩住最重要。" },
      { "rank": 18, "name": "林佩君", "group": "B", "metrics": { "score": 693.63, "actualRevenue": 18700, "totalRevenue": 41200, "renewalRevenue": 18700, "renewalDeals": 2, "renewalAverage": 9350.00, "正式權重分數": 693.63, "實收": 18700, "總業績": 41200, "續單金額": 18700, "追續成交總數": 2, "追續客單價": 9350.00 }, "advice": "你現在重點不是衝高，而是先把有效成交接穩。" },
      { "rank": 19, "name": "鄭上官", "group": "C", "metrics": { "score": 692.05, "actualRevenue": 16800, "totalRevenue": 16800, "renewalRevenue": 16800, "renewalDeals": 1, "renewalAverage": 16800.00, "正式權重分數": 692.05, "實收": 16800, "總業績": 16800, "續單金額": 16800, "追續成交總數": 1, "追續客單價": 16800.00 }, "advice": "你有基本分，今天先求把量接起來。" },
      { "rank": 20, "name": "謝啟芳", "group": "C", "metrics": { "score": 675.46, "actualRevenue": 26300, "totalRevenue": 43180, "renewalRevenue": 12980, "renewalDeals": 2, "renewalAverage": 6490.00, "正式權重分數": 675.46, "實收": 26300, "總業績": 43180, "續單金額": 12980, "追續成交總數": 2, "追續客單價": 6490.00 }, "advice": "你有實收但追續偏少，今天先補一筆有效追續。" },
      { "rank": 21, "name": "陳玲華", "group": "C", "metrics": { "score": 610.34, "actualRevenue": 28120, "totalRevenue": 48090, "renewalRevenue": 7000, "renewalDeals": 1, "renewalAverage": 7000.00, "正式權重分數": 610.34, "實收": 28120, "總業績": 48090, "續單金額": 7000, "追續成交總數": 1, "追續客單價": 7000.00 }, "advice": "你有總業績但結構偏弱，今天先把追續量補起來。" },
      { "rank": 22, "name": "莉莉（新人）", "group": "C", "isNew": true, "metrics": { "score": 530.86, "actualRevenue": 11880, "totalRevenue": 14480, "renewalRevenue": 14480, "renewalDeals": 3, "renewalAverage": 4826.67, "正式權重分數": 530.86, "實收": 11880, "總業績": 14480, "續單金額": 14480, "追續成交總數": 3, "追續客單價": 4826.67 }, "advice": "先把穩定度做出來，不急著衝名次。" },
      { "rank": 23, "name": "周美蓁", "group": "C", "metrics": { "score": 515.75, "actualRevenue": 12000, "totalRevenue": 12000, "renewalRevenue": 12000, "renewalDeals": 1, "renewalAverage": 12000.00, "正式權重分數": 515.75, "實收": 12000, "總業績": 12000, "續單金額": 12000, "追續成交總數": 1, "追續客單價": 12000.00 }, "advice": "今天先求破口再接一筆，順位就會比較好看。" }
    ],
    "groups": {
      "A1": ["馬秋香", "王梅慧", "王珍珠", "許喬恩"],
      "A2": ["湯玉琦", "林沛昕", "廖姿惠", "林宜靜", "李玲玲", "徐華妤", "高美雲"],
      "B": ["梁依萍", "高如郁", "鄭珮恩", "江沛林", "江麗勉", "陳百玲（新人）", "林佩君"],
      "C": ["鄭上官", "謝啟芳", "陳玲華", "莉莉（新人）", "周美蓁"]
    },
    "groupShortText": "📣【AI 派單公告｜5/9 結算 → 5/10 正式派單】審計 PASS，三平台總表全數核對通過，無漏算、無多算、無衝突。正式前10名：1馬秋香 2王梅慧 3王珍珠 4許喬恩 5湯玉琦 6林沛昕 7廖姿惠 8林宜靜 9李玲玲 10徐華妤。A1：馬秋香、王梅慧、王珍珠、許喬恩。A2：湯玉琦、林沛昕、廖姿惠、林宜靜、李玲玲、徐華妤、高美雲。B組：梁依萍、高如郁、鄭珮恩、江沛林、江麗勉、陳百玲、林佩君。C組：鄭上官、謝啟芳、陳玲華、莉莉、周美蓁。正式派單順序以本則為準。",
    "finalConfirmations": [
      "5/9 結算資料已核對完成。",
      "三平台總表全部核對通過。",
      "無漏算、無多算、無總表衝突。",
      "已離職人員蘇淑玲只列審計，不入正式派單。",
      "5/10 正式派單順序，以本則公告為準。"
    ]
  },
  "meta": {
    "operator": "AI Dispatcher",
    "reason": "Final Unified Specification Lock (5/10)",
    "savedAt": "2026-05-09 22:50:00"
  }
};

fs.writeFileSync(LATEST_PATH, JSON.stringify(finalData, null, 2), 'utf8');
console.log('[DONE] 5/10 正式派單數據已全面同步更新，規格已鎖死。');
