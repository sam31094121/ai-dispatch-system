const fs = require('fs');
const path = require('path');

const targetPath = path.join(__dirname, 'shared', 'official-locks.js');
let content = fs.readFileSync(targetPath, 'utf8');

const newLockBlock = `const OFFICIAL_0412_TO_0413 = Object.freeze({
  reportDate: '115/04/12',
  dispatchDate: '115/04/13',
  scoringMethod: '鎖死排序規則：總業績 → 續單金額 → 追續成交總數 → 派單成交總通數',
  overallStats: {
    totalCalls: 395,
    dispatchCalls: 232,
    renewalCalls: 144,
    renewalAmount: 2019712,
    dailyRenewalAmount: 36440,
    cancellations: 0,
    monthlyRevenue: 3564392
  },
  platforms: Object.freeze({
    '三立奕心': Object.freeze({
      dailyDispatch: 0,
      dailyDispatchDeals: 5,
      dailyRenewalDeals: 1,
      cumulativeDispatch: 132,
      cumulativeDispatchDeals: 72,
      cumulativeRenewalDeals: 91,
      dailyRenewalAmount: 5100,
      monthlyRevenue: 2076122,
      totalRenewalAmount: 1477292,
      dailyCancellations: 0
    }),
    '民視': Object.freeze({
      dailyDispatch: 0,
      dailyDispatchDeals: 3,
      dailyRenewalDeals: 5,
      cumulativeDispatch: 243,
      cumulativeDispatchDeals: 155,
      cumulativeRenewalDeals: 32,
      dailyRenewalAmount: 25730,
      monthlyRevenue: 1126120,
      totalRenewalAmount: 210930,
      dailyCancellations: 0
    }),
    '公司產品': Object.freeze({
      dailyDispatch: 0,
      dailyDispatchDeals: 0,
      dailyRenewalDeals: 1,
      cumulativeDispatch: 20,
      cumulativeDispatchDeals: 5,
      cumulativeRenewalDeals: 21,
      dailyRenewalAmount: 5610,
      monthlyRevenue: 362150,
      totalRenewalAmount: 331490,
      dailyCancellations: 0
    })
  }),
  ranking: Object.freeze([
    { rank: 1, name: '王梅慧', totalRevenue: 547760, renewalRevenue: 411770, renewalDeals: 16, dispatchDeals: 20 },
    { rank: 2, name: '馬秋香', totalRevenue: 516280, renewalRevenue: 326120, renewalDeals: 17, dispatchDeals: 29 },
    { rank: 3, name: '王珍珠', totalRevenue: 507868, renewalRevenue: 374840, renewalDeals: 23, dispatchDeals: 21 },
    { rank: 4, name: '李玲玲', totalRevenue: 322590, renewalRevenue: 158380, renewalDeals: 8, dispatchDeals: 18 },
    { rank: 5, name: '林宜靜', totalRevenue: 283280, renewalRevenue: 37560, renewalDeals: 6, dispatchDeals: 24 },
    { rank: 6, name: '林沛昕', totalRevenue: 238624, renewalRevenue: 209576, renewalDeals: 8, dispatchDeals: 7 },
    { rank: 7, name: '湯玉琦', totalRevenue: 194090, renewalRevenue: 107420, renewalDeals: 15, dispatchDeals: 19 },
    { rank: 8, name: '廖姿惠', totalRevenue: 124008, renewalRevenue: 40408, renewalDeals: 9, dispatchDeals: 17 },
    { rank: 9, name: '蘇淑玲', totalRevenue: 117468, renewalRevenue: 61040, renewalDeals: 3, dispatchDeals: 8 },
    { rank: 10, name: '徐華妤', totalRevenue: 97260, renewalRevenue: 75820, renewalDeals: 6, dispatchDeals: 6 },
    { rank: 11, name: '梁依萍', totalRevenue: 85830, renewalRevenue: 19840, renewalDeals: 4, dispatchDeals: 11 },
    { rank: 12, name: '高如郁', totalRevenue: 84360, renewalRevenue: 14960, renewalDeals: 4, dispatchDeals: 10 },
    { rank: 13, name: '高美雲', totalRevenue: 83208, renewalRevenue: 22800, renewalDeals: 4, dispatchDeals: 10 },
    { rank: 14, name: '江麗勉', totalRevenue: 82970, renewalRevenue: 2380, renewalDeals: 1, dispatchDeals: 13 },
    { rank: 15, name: '許喬恩', totalRevenue: 76000, renewalRevenue: 76000, renewalDeals: 5, dispatchDeals: 0 },
    { rank: 16, name: '陳玲華', totalRevenue: 65338, renewalRevenue: 6500, renewalDeals: 1, dispatchDeals: 8 },
    { rank: 17, name: '鄭珮恩', totalRevenue: 60880, renewalRevenue: 8680, renewalDeals: 5, dispatchDeals: 9 },
    { rank: 18, name: '鄭上官', totalRevenue: 18000, renewalRevenue: 18000, renewalDeals: 1, dispatchDeals: 0 },
    { rank: 19, name: '謝啟芳', totalRevenue: 16570, renewalRevenue: 5610, renewalDeals: 1, dispatchDeals: 2 },
    { rank: 20, name: '陳桂子（新人）', totalRevenue: 13500, renewalRevenue: 13500, renewalDeals: 1, dispatchDeals: 0 },
    { rank: 21, name: '周美蓁', totalRevenue: 12000, renewalRevenue: 12000, renewalDeals: 2, dispatchDeals: 0 },
    { rank: 22, name: '江沛林', totalRevenue: 9980, renewalRevenue: 9980, renewalDeals: 3, dispatchDeals: 0 },
    { rank: 23, name: '林佩君', totalRevenue: 6528, renewalRevenue: 6528, renewalDeals: 1, dispatchDeals: 0 }
  ]),
  groups: Object.freeze({
    A1: ['王梅慧', '馬秋香', '王珍珠', '李玲玲'],
    A2: ['林宜靜', '林沛昕', '湯玉琦', '廖姿惠', '蘇淑玲', '徐華妤'],
    B:  ['梁依萍', '高如郁', '高美雲', '江麗勉', '許喬恩', '陳玲華', '鄭珮恩'],
    C:  ['鄭上官', '謝啟芳', '陳桂子（新人）', '周美蓁', '江沛林', '林佩君']
  }),
  rankChanges: Object.freeze({
    new: [],
    up: [],
    down: [],
    flat: ['王梅慧', '馬秋香', '王珍珠', '李玲玲', '林宜靜', '林沛昕', '湯玉琦', '廖姿惠', '蘇淑玲', '徐華妤', '梁依萍', '高如郁', '高美雲', '江麗勉', '許喬恩', '陳玲華', '鄭珮恩', '鄭上官', '謝啟芳', '陳桂子（新人）', '周美蓁', '江沛林', '林佩君']
  }),
  advice: Object.freeze([
    { rank: 1, name: '王梅慧', text: '你現在穩居第1，今天重點是把領先差距再拉開。' },
    { rank: 2, name: '馬秋香', text: '你緊咬第2，今天只差一筆強單就能翻盤。' },
    { rank: 3, name: '王珍珠', text: '你仍在前三核心帶，今天要把高續單優勢守住。' },
    { rank: 4, name: '李玲玲', text: '你前四位置很穩，今天重點是往前三再逼近。' },
    { rank: 5, name: '林宜靜', text: '你守住前五，今天先求穩單，不要掉速。' },
    { rank: 6, name: '林沛昕', text: '你底盤硬，今天差的是把追續再轉成實收。' },
    { rank: 7, name: '湯玉琦', text: '你位置穩，今天補一筆就能再往上壓。' },
    { rank: 8, name: '廖姿惠', text: '你仍在前段，今天先守住不要被後面追上。' },
    { rank: 9, name: '蘇淑玲', text: '你目前前十穩定，今天重點是再往前擠。' },
    { rank: 10, name: '徐華妤', text: '你守在前十，今天先求穩穩補厚數字。' },
    { rank: 11, name: '梁依萍', text: '你在中前段，今天要補一筆拉開差距。' },
    { rank: 12, name: '高如郁', text: '你跟前面差距不大，今天關鍵是把單做實。' },
    { rank: 13, name: '高美雲', text: '你本輪位置穩，今天再補一筆就能往前。' },
    { rank: 14, name: '江麗勉', text: '你現在卡中段，今天先求明確進帳。' },
    { rank: 15, name: '許喬恩', text: '你靠續單撐位很明顯，今天再補就能再推前。' },
    { rank: 16, name: '陳玲華', text: '你需要把數字重新點亮，先求一筆實單。' },
    { rank: 17, name: '鄭珮恩', text: '你還有追上空間，今天先把節奏找回來。' },
    { rank: 18, name: '鄭上官', text: '你目前靠續單留位，今天先守住基本盤。' },
    { rank: 19, name: '謝啟芳', text: '你今天最重要的是先把進度做出來。' },
    { rank: 20, name: '陳桂子（新人）', text: '先求開張，不急著追排名。' },
    { rank: 21, name: '周美蓁', text: '先把數字接起來，比停在原地重要。' },
    { rank: 22, name: '江沛林', text: '你有追續底，今天重點是把它變現。' },
    { rank: 23, name: '林佩君', text: '今天先求有單，再談往前推。' }
  ])
});`;

content = content.replace(/const OFFICIAL_0412_TO_0413 = Object\.freeze\(\{[\s\S]*?\}\);/, newLockBlock);
fs.writeFileSync(targetPath, content, 'utf8');
console.log('Done replacing OFFICIAL_0412_TO_0413');
