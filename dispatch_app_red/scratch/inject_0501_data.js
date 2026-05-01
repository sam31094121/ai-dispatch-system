const fs = require('fs');
const path = require('path');

const reportId = 'dispatch_2026_05_01_v1';
const reportDir = path.join('data', 'dispatch-reports-v1', 'reports', reportId);
const v1Path = path.join(reportDir, 'v1.json');
const latestPath = path.join('data', 'dispatch-reports-v1', 'latest.json');
const rootLatestPath = path.join('data', 'latest.json');

if (!fs.existsSync(reportDir)) fs.mkdirSync(reportDir, { recursive: true });

const reportData = {
  report: {
    reportId,
    version: 1,
    status: 'published',
    title: 'AI 派單公告｜5/1 結算 → 5/2 正式派單順序',
    settlementDate: '2026-05-01',
    dispatchDate: '2026-05-02',
    auditResult: 'PASS',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    sourceText: '三平台整合 AI 比例原則版',
    audit: {
      result: 'PASS',
      notes: ['本輪未發現三平台總表與個別明細加總不一致', '本輪無漏算、無多算、無總盤衝突'],
      summaryBoard: {
        '追續單成交': 13,
        '全部總業績': 302200,
        '追續單金額': 115200,
        '實收總金額': 14860
      }
    },
    rankings: [
      { rank: 1, name: '馬秋香', group: 'A1', metrics: { '正式權重分數': 7000.00, '實收': 0, '續單金額': 45430, '總業績': 76710, '追續成交總數': 3 }, advice: '你這輪各項比例都最完整，標準就是繼續把第一拉開。' },
      { rank: 2, name: '莉莉', group: 'A1', metrics: { '正式權重分數': 5562.84, '實收': 11880, '續單金額': 11880, '總業績': 11880, '追續成交總數': 1 }, advice: '你這輪靠實收直接衝上前段，重點是穩住不要斷。', isNew: true },
      { rank: 3, name: '廖姿惠', group: 'A1', metrics: { '正式權重分數': 4685.68, '實收': 2980, '續單金額': 19060, '總業績': 38610, '追續成交總數': 3 }, advice: '你三項同步有數字，今天最有機會再往前推。' },
      { rank: 4, name: '王珍珠', group: 'A1', metrics: { '正式權重分數': 2940.53, '實收': 0, '續單金額': 12990, '總業績': 29780, '追續成交總數': 2 }, advice: '你的追續與總業績還在主力區，差的是把實收補上。' },
      { rank: 5, name: '王梅慧', group: 'A2', metrics: { '正式權重分數': 2718.68, '實收': 0, '續單金額': 9800, '總業績': 36240, '追續成交總數': 1 }, advice: '你底盤還在，今天補一筆實收就會更漂亮。' },
      { rank: 6, name: '李玲玲', group: 'A2', metrics: { '正式權重分數': 2586.36, '實收': 0, '續單金額': 7440, '總業績': 48070, '追續成交總數': 1 }, advice: '你總業績不差，今天重點是把追續厚度再拉高。' },
      { rank: 7, name: '林宜靜', group: 'A2', metrics: { '正式權重分數': 1909.85, '實收': 0, '續單金額': 6000, '總業績': 24820, '追續成交總數': 1 }, advice: '你還在可追區，今天先把有效數字接上。' },
      { rank: 8, name: '鄭珮恩', group: 'A2', metrics: { '正式權重分數': 1017.75, '實收': 0, '續單金額': 2600, '總業績': 5990, '追續成交總數': 1 }, advice: '你有基本追續底，今天先求穩穩再補一筆。' },
      { rank: 9, name: '梁依萍', group: 'B', metrics: { '正式權重分數': 274.15, '實收': 0, '續單金額': 0, '總業績': 14020, '追續成交總數': 0 }, advice: '你現在是總業績撐住位置，今天要把追續補回來。' },
      { rank: 10, name: '陳玲華', group: 'B', metrics: { '正式權重分數': 209.62, '實收': 0, '續單金額': 0, '總業績': 10720, '追續成交總數': 0 }, advice: '你本輪偏單邊，今天只要有一筆追續就會明顯變動。' },
      { rank: 11, name: '高美雲', group: 'B', metrics: { '正式權重分數': 104.81, '實收': 0, '續單金額': 0, '總業績': 5360, '追續成交總數': 0 }, advice: '你差距不大，今天先求有數字進場。' }
    ],
    groups: {
      A1: ['馬秋香', '莉莉', '廖姿惠', '王珍珠'],
      A2: ['王梅慧', '李玲玲', '林宜靜', '鄭珮恩'],
      B: ['梁依萍', '陳玲華', '高美雲'],
      C: ['徐華妤', '湯玉琦', '高如郁', '江麗勉', '江沛林', '陳百玲', '林佩君', '林沛昕', '蘇淑玲', '謝啟芳', '許喬恩', '周美蓁', '鄭上官']
    },
    groupShortText: '📣【AI 派單公告｜5/1 結算 → 5/2 正式派單】審計 PASS，三平台總表核對通過，無漏算、無多算、無衝突。本輪依 AI 比例原則計算。正式前10名：1馬秋香 2莉莉（新人） 3廖姿惠 4王珍珠 5王梅慧 6李玲玲 7林宜靜 8鄭珮恩 9梁依萍 10陳玲華。A1：馬秋香、莉莉、廖姿惠、王珍珠。A2：王梅慧、李玲玲、林宜靜、鄭珮恩。正式派單順序以本則為準。',
    finalConfirmations: ['5/1 結算資料已核對完成', '三平台總表核對通過', '無漏算、無多算、無總盤衝突', '本輪正式派單順序已依 三平台整合 AI 比例原則版 完成']
  },
  meta: {
    operator: 'admin',
    reason: 'manual_injection',
    savedAt: new Date().toISOString(),
    source: 'manual'
  }
};

const fullJson = JSON.stringify(reportData, null, 2);
fs.writeFileSync(v1Path, fullJson);
fs.writeFileSync(latestPath, fullJson);
fs.writeFileSync(rootLatestPath, fullJson);

console.log('Successfully injected 5/1 data and updated latest.json');
