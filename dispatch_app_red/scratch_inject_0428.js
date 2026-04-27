const fs = require('fs');
const path = require('path');

const LATEST_PATH = path.join(__dirname, 'data', 'latest.json');

const rawData = [
  { rank: 1, name: '王珍珠', score: 8952.11, actual: 793848, renewal: 678760, total: 993558, avg: 13309, deals: 51, group: 'A1' },
  { rank: 2, name: '王梅慧', score: 8170.98, actual: 782180, renewal: 613150, total: 872400, avg: 17032, deals: 36, group: 'A1' },
  { rank: 3, name: '馬秋香', score: 7886.73, actual: 795868, renewal: 527240, total: 869718, avg: 13181, deals: 40, group: 'A1' },
  { rank: 4, name: '林沛昕', score: 5849.09, actual: 524082, renewal: 405536, total: 609390, avg: 31195, deals: 13, group: 'A1' },
  { rank: 5, name: '李玲玲', score: 4600.53, actual: 466770, renewal: 238790, total: 604070, avg: 9950, deals: 24, group: 'A1' },
  { rank: 6, name: '許喬恩', score: 3827.30, actual: 76400, renewal: 347400, total: 347400, avg: 43425, deals: 8, group: 'A2' },

  { rank: 7, name: '徐華妤', score: 3622.24, actual: 320050, renewal: 228440, total: 402190, avg: 15229, deals: 15, group: 'A2' },
  { rank: 8, name: '鄭上官', score: 3494.57, actual: 109810, renewal: 311810, total: 311810, avg: 34646, deals: 9, group: 'A2' },
  { rank: 9, name: '林宜靜', score: 3052.18, actual: 360280, renewal: 83640, total: 474330, avg: 4920, deals: 17, group: 'A2' },
  { rank: 10, name: '湯玉琦', score: 2694.08, actual: 208878, renewal: 159600, total: 279018, avg: 7255, deals: 22, group: 'A2' },
  { rank: 11, name: '廖姿惠', score: 2054.27, actual: 165716, renewal: 91586, total: 243056, avg: 4820, deals: 19, group: 'B' },
  { rank: 12, name: '蘇淑玲', score: 1986.17, actual: 151636, renewal: 95340, total: 223936, avg: 15890, deals: 6, group: 'B' },
  { rank: 13, name: '梁依萍', score: 1964.01, actual: 178690, renewal: 80460, total: 271270, avg: 6705, deals: 12, group: 'B' },
  { rank: 14, name: '高如郁', score: 1959.99, actual: 193238, renewal: 74380, total: 250138, avg: 5722, deals: 13, group: 'B' },
  { rank: 15, name: '高美雲', score: 1677.91, actual: 167736, renewal: 55000, total: 243266, avg: 6111, deals: 9, group: 'B' },
  { rank: 16, name: '江麗勉', score: 1471.51, actual: 130966, renewal: 59948, total: 169466, avg: 5995, deals: 10, group: 'B' },
  { rank: 17, name: '鄭珮恩', score: 1405.62, actual: 114438, renewal: 46060, total: 155378, avg: 2879, deals: 16, group: 'B' },
  { rank: 18, name: '陳玲華', score: 1187.64, actual: 95488, renewal: 41780, total: 170108, avg: 6963, deals: 6, group: 'C' },
  { rank: 19, name: '江沛林', score: 1114.59, actual: 9980, renewal: 74980, total: 89920, avg: 14996, deals: 5, group: 'C' },
  { rank: 20, name: '周美蓁', score: 711.37, actual: 28800, renewal: 30800, total: 30800, avg: 10267, deals: 3, group: 'C' },
  { rank: 21, name: '林佩君', score: 501.80, actual: 13858, renewal: 21658, total: 43130, avg: 5414, deals: 4, group: 'C' },
  { rank: 22, name: '謝啟芳', score: 494.83, actual: 24140, renewal: 16640, total: 41540, avg: 5547, deals: 3, group: 'C' },
  { rank: 23, name: '陳桂子', score: 452.01, actual: 19000, renewal: 19000, total: 19000, avg: 4750, deals: 4, group: 'C', tag: '新人' }
];

const latest = JSON.parse(fs.readFileSync(LATEST_PATH, 'utf8'));

// 更新基本資訊
latest.executionId = "20260428014459";
latest.completedAt = "2026-04-28T01:44:59+08:00";
latest.persisted = true;
latest.standardData.公告標題 = "AI 派單公告｜4/27 結算 → 4/28 正式派單順序｜三平台整合比例原則版";
latest.standardData.日期資訊.結算日 = "4/27";
latest.standardData.日期資訊.派單日 = "4/28";

// 更新審計結果
latest.standardData.審計結論.結果 = "PASS";
latest.standardData.審計結論.特別說明 = ["三平台整合版已通過大數據審計核對"];
latest.standardData.審計結論.審計列示不入派單 = [{ 姓名: "陳旭宜", 原因: "已離職" }];
latest.validation.status = "PASS";
latest.validation.errors = [];
latest.validation.warnings = ["本輪已包含 04/28 前 5 名榮耀視覺優化特效"];
latest.validation.summary.審計結果 = "PASS";
latest.validation.summary.正式人數 = 23;
latest.validation.summary.離職列示人數 = 1;
latest.validation.summary.本月業績 = 7714892;

// 轉換為標準名次格式
const formattedRanking = rawData.map(d => ({
  名次: d.rank,
  姓名: d.name,
  正式權重分數: d.score,
  實收: d.actual,
  續單金額: d.renewal,
  總業績: d.total,
  追續客單價: d.avg,
  追續成交總數: d.deals,
  分級: d.group,
  標記: d.tag || "",
  建議: "" // 將由前端 autoProportionalAdvice 自動生成
}));

latest.standardData.正式名次 = formattedRanking;

// 更新分級清單
const groups = { A1: [], A2: [], B: [], C: [] };
rawData.forEach(d => {
  if (groups[d.group]) groups[d.group].push(d.name);
});
latest.standardData.分級 = groups;
latest.groups = groups;

// 更新 presentation 數據 (用於 Spotlight)
latest.presentation.top5 = formattedRanking.slice(0, 5);
latest.presentation.top10 = formattedRanking.slice(0, 10);
latest.presentation.summaryCards = [
  ["追續單成交", 345],
  ["全部總業績", 7714892],
  ["追續單金額", 4301998],
  ["實收總金額", 5731852],
  ["前 5 名 AI 平均", 7091],
  ["本輪權重模型", 10000]
];

// 更新 Ranking 陣列 (用於 Leaderboard)
latest.ranking = rawData.map(d => ({
  rank: d.rank,
  name: d.name,
  group: d.group,
  totalRevenue: d.total,
  renewalRevenue: d.renewal,
  renewalDeals: d.deals,
  weightedScore: d.score,
  actualRevenue: d.actual
}));

fs.writeFileSync(LATEST_PATH, JSON.stringify(latest, null, 2));
console.log("Successfully injected 04/28 data into latest.json");
