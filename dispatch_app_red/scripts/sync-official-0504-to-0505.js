const fs = require('fs');
const path = require('path');
const {
  AUDIT_METRICS,
  DEFAULT_AUDIT_RULE,
  RANKING_METRICS,
  SUMMARY_METRICS
} = require('../src/constants/dispatchRules');

const APP_ROOT = path.join(__dirname, '..');

const GROUP_SHORT_TEXT = `📣【AI 派單公告｜5/4 結算 → 5/5 正式派單順序｜AI 比例原則版】

一、審計結論

審計結果：PASS
本輪已依鎖死規則執行：先審計，後運算，後排序，再派單。

三立奕心總表核對通過
追續單成交：45 ✅
全部總業績：717,358 ✅
追續單金額：575,440 ✅
實收總金額：60,460 ✅

民視產品總表核對通過
追續單成交：12 ✅
全部總業績：490,000 ✅
追續單金額：80,590 ✅
實收總金額：18,160 ✅

公司產品總表核對通過
追續單成交：4 ✅
全部總業績：45,710 ✅
追續單金額：43,230 ✅
實收總金額：35,250 ✅

異常與提醒
本輪三平台總表與個別明細加總一致。
無漏算、無多算、無總盤衝突。

二、整合總盤

【追續單成交】61
【全部總業績】1,253,068
【追續單金額】699,260
【實收總金額】113,870

三、AI 比例原則

本輪權重：
實收總業績：3000
追續單金額：2500
全部總金額：1500
追續客單價：1500
追續單數量：1500

正式權重分數＝
實收比例分數＋追續金額比例分數＋全部總業績比例分數＋追續客單價比例分數＋追續單數量比例分數

本輪全員最高值：
實收總金額最高：30,480（湯玉琦）
追續單金額最高：189,510（馬秋香）
全部總業績最高：244,150（馬秋香）
追續客單價最高：27,072.86（馬秋香）
追續單數量最高：7（王珍珠、馬秋香、林沛昕）

四、正式名次

1、馬秋香｜【正式權重分數】7000.00｜【實收】0｜【追續金額】189,510｜【全部總業績】244,150｜【追續客單價】27,072.86｜【追續單數】7
2、湯玉琦｜【正式權重分數】6253.76｜【實收】30,480｜【追續金額】62,860｜【全部總業績】106,860｜【追續客單價】12,572.00｜【追續單數】5
3、林沛昕｜【正式權重分數】6073.93｜【實收】18,100｜【追續金額】95,580｜【全部總業績】126,148｜【追續客單價】13,654.29｜【追續單數】7
4、廖姿惠｜【正式權重分數】3661.65｜【實收】2,980｜【追續金額】70,660｜【全部總業績】97,710｜【追續客單價】17,665.00｜【追續單數】4
5、王珍珠｜【正式權重分數】3188.03｜【實收】0｜【追續金額】42,650｜【全部總業績】128,230｜【追續客單價】6,092.86｜【追續單數】7
6、林宜靜｜【正式權重分數】3077.17｜【實收】7,600｜【追續金額】31,380｜【全部總業績】112,760｜【追續客單價】10,460.00｜【追續單數】3
7、高美雲｜【正式權重分數】2930.50｜【實收】11,250｜【追續金額】26,070｜【全部總業績】42,490｜【追續客單價】6,517.50｜【追續單數】4
8、周美蓁｜【正式權重分數】2292.29｜【實收】12,000｜【追續金額】12,000｜【全部總業績】12,000｜【追續客單價】12,000.00｜【追續單數】1
9、許喬恩｜【正式權重分數】2292.29｜【實收】12,000｜【追續金額】12,000｜【全部總業績】12,000｜【追續客單價】12,000.00｜【追續單數】1
10、莉莉（新人）｜【正式權重分數】2271.51｜【實收】11,880｜【追續金額】11,880｜【全部總業績】11,880｜【追續客單價】11,880.00｜【追續單數】1
11、徐華妤｜【正式權重分數】2105.03｜【實收】0｜【追續金額】35,640｜【全部總業績】35,640｜【追續客單價】17,820.00｜【追續單數】2
12、高如郁｜【正式權重分數】2039.76｜【實收】7,580｜【追續金額】15,500｜【全部總業績】37,640｜【追續客單價】7,750.00｜【追續單數】2
13、李玲玲｜【正式權重分數】1842.52｜【實收】0｜【追續金額】18,560｜【全部總業績】78,690｜【追續客單價】4,640.00｜【追續單數】4
14、王梅慧｜【正式權重分數】1742.81｜【實收】0｜【追續金額】20,800｜【全部總業績】52,600｜【追續客單價】5,200.00｜【追續單數】4
15、梁依萍｜【正式權重分數】1486.55｜【實收】0｜【追續金額】14,280｜【全部總業績】47,640｜【追續客單價】14,280.00｜【追續單數】1
16、林佩君｜【正式權重分數】1312.99｜【實收】0｜【追續金額】14,700｜【全部總業績】14,700｜【追續客單價】14,700.00｜【追續單數】1
17、江麗勉｜【正式權重分數】898.95｜【實收】0｜【追續金額】9,480｜【全部總業績】13,460｜【追續客單價】4,740.00｜【追續單數】2
18、陳百玲（新人）｜【正式權重分數】756.90｜【實收】0｜【追續金額】6,980｜【全部總業績】6,980｜【追續客單價】3,490.00｜【追續單數】2
19、鄭珮恩｜【正式權重分數】752.80｜【實收】0｜【追續金額】5,750｜【全部總業績】14,500｜【追續客單價】2,875.00｜【追續單數】2
20、謝啟芳｜【正式權重分數】518.85｜【實收】0｜【追續金額】2,980｜【全部總業績】16,300｜【追續客單價】2,980.00｜【追續單數】1
21、陳玲華｜【正式權重分數】158.14｜【實收】0｜【追續金額】0｜【全部總業績】25,740｜【追續客單價】0｜【追續單數】0
22、江沛林｜【正式權重分數】91.85｜【實收】0｜【追續金額】0｜【全部總業績】14,950｜【追續客單價】0｜【追續單數】0
23、蘇淑玲｜【正式權重分數】0｜【實收】0｜【追續金額】0｜【全部總業績】0｜【追續客單價】0｜【追續單數】0
24、鄭上官｜【正式權重分數】0｜【實收】0｜【追續金額】0｜【全部總業績】0｜【追續客單價】0｜【追續單數】0

五、名次異動

以上一輪 5/3 正式派單名次對照，本輪異動如下：

上升
馬秋香：2 → 1 ↑
林沛昕：4 → 3 ↑
廖姿惠：9 → 4 ↑
高美雲：13 → 7 ↑
徐華妤：21 → 11 ↑
梁依萍：18 → 15 ↑
林佩君：22 → 16 ↑

下降
湯玉琦：1 → 2 ↓
林宜靜：3 → 6 ↓
周美蓁：6 → 8 ↓
許喬恩：7 → 9 ↓
莉莉（新人）：8 → 10 ↓
高如郁：10 → 12 ↓
李玲玲：11 → 13 ↓
王梅慧：12 → 14 ↓
江麗勉：14 → 17 ↓
陳百玲（新人）：17 → 18 ↓
鄭珮恩：16 → 19 ↓
謝啟芳：15 → 20 ↓
陳玲華：20 → 21 ↓
江沛林：19 → 22 ↓

持平
王珍珠：5 → 5 ＝
蘇淑玲：23 → 23 ＝
鄭上官：24 → 24 ＝

六、A1／A2／B／C 分級

🔴 A1｜高優先主力
馬秋香
湯玉琦
林沛昕
廖姿惠

🟠 A2｜次主力追進
王珍珠
林宜靜
高美雲
周美蓁
許喬恩
莉莉（新人）
徐華妤
高如郁

🟡 B組｜一般量單
李玲玲
王梅慧
梁依萍
林佩君
江麗勉
陳百玲（新人）
鄭珮恩
謝啟芳

🟢 C組｜補位／觀察
陳玲華
江沛林
蘇淑玲
鄭上官

七、每人一句建議

1、馬秋香：你這輪靠追續金額、總業績與客單價全面拉高，今天重點是把實收補上。
2、湯玉琦：你實收仍是全場第一，今天只要再補追續量就能穩住前段。
3、林沛昕：你追續單數與實收都有撐住，今天是繼續往前推的關鍵。
4、廖姿惠：你這輪客單價與追續金額明顯拉升，今天要把實收接起來。
5、王珍珠：你單數有量、總業績有底，今天差的是把金額與實收再拉高。
6、林宜靜：你有實收支撐，今天補上追續成交就能再往前。
7、高美雲：你這輪名次明顯上升，今天要把成交穩定度延續。
8、周美蓁：你有乾淨實收，今天只要再補一筆就能再動名次。
9、許喬恩：你跟周美蓁分數相同，今天補單就能拉開差距。
10、莉莉（新人）：你有實收亮點，今天先求穩定再往前推。
11、徐華妤：你客單價很漂亮，今天關鍵是把實收補起來。
12、高如郁：你有實收基礎，今天再補追續金額就能上推。
13、李玲玲：你有單數但分數偏散，今天要提高追續金額。
14、王梅慧：你單數有基本盤，今天差的是更高客單與實收。
15、梁依萍：你有高客單切入點，今天先把下一筆成交接起來。
16、林佩君：你這輪有有效分數，今天要把單數補上。
17、江麗勉：你有追續成交，今天再補一筆就能拉高排序。
18、陳百玲（新人）：你有累積，不急著衝，先把成交穩定做出來。
19、鄭珮恩：你分數差距不大，今天先把追續金額補強。
20、謝啟芳：你有成交但分數偏低，今天要先提高客單。
21、陳玲華：你有總業績但缺追續與實收，今天先求有效成交。
22、江沛林：先把追續單與實收補起來，排名才有上升空間。
23、蘇淑玲：今天先求破零，有分數才有派單空間。
24、鄭上官：先解除空白狀態，後續才有排名意義。`;

const rows = [
  [1, '馬秋香', 2, 'up', 7000.00, 0, 189510, 244150, 27072.86, 7, 'A1', '你這輪靠追續金額、總業績與客單價全面拉高，今天重點是把實收補上。'],
  [2, '湯玉琦', 1, 'down', 6253.76, 30480, 62860, 106860, 12572.00, 5, 'A1', '你實收仍是全場第一，今天只要再補追續量就能穩住前段。'],
  [3, '林沛昕', 4, 'up', 6073.93, 18100, 95580, 126148, 13654.29, 7, 'A1', '你追續單數與實收都有撐住，今天是繼續往前推的關鍵。'],
  [4, '廖姿惠', 9, 'up', 3661.65, 2980, 70660, 97710, 17665.00, 4, 'A1', '你這輪客單價與追續金額明顯拉升，今天要把實收接起來。'],
  [5, '王珍珠', 5, 'flat', 3188.03, 0, 42650, 128230, 6092.86, 7, 'A2', '你單數有量、總業績有底，今天差的是把金額與實收再拉高。'],
  [6, '林宜靜', 3, 'down', 3077.17, 7600, 31380, 112760, 10460.00, 3, 'A2', '你有實收支撐，今天補上追續成交就能再往前。'],
  [7, '高美雲', 13, 'up', 2930.50, 11250, 26070, 42490, 6517.50, 4, 'A2', '你這輪名次明顯上升，今天要把成交穩定度延續。'],
  [8, '周美蓁', 6, 'down', 2292.29, 12000, 12000, 12000, 12000.00, 1, 'A2', '你有乾淨實收，今天只要再補一筆就能再動名次。'],
  [9, '許喬恩', 7, 'down', 2292.29, 12000, 12000, 12000, 12000.00, 1, 'A2', '你跟周美蓁分數相同，今天補單就能拉開差距。'],
  [10, '莉莉（新人）', 8, 'down', 2271.51, 11880, 11880, 11880, 11880.00, 1, 'A2', '你有實收亮點，今天先求穩定再往前推。'],
  [11, '徐華妤', 21, 'up', 2105.03, 0, 35640, 35640, 17820.00, 2, 'A2', '你客單價很漂亮，今天關鍵是把實收補起來。'],
  [12, '高如郁', 10, 'down', 2039.76, 7580, 15500, 37640, 7750.00, 2, 'A2', '你有實收基礎，今天再補追續金額就能上推。'],
  [13, '李玲玲', 11, 'down', 1842.52, 0, 18560, 78690, 4640.00, 4, 'B', '你有單數但分數偏散，今天要提高追續金額。'],
  [14, '王梅慧', 12, 'down', 1742.81, 0, 20800, 52600, 5200.00, 4, 'B', '你單數有基本盤，今天差的是更高客單與實收。'],
  [15, '梁依萍', 18, 'up', 1486.55, 0, 14280, 47640, 14280.00, 1, 'B', '你有高客單切入點，今天先把下一筆成交接起來。'],
  [16, '林佩君', 22, 'up', 1312.99, 0, 14700, 14700, 14700.00, 1, 'B', '你這輪有有效分數，今天要把單數補上。'],
  [17, '江麗勉', 14, 'down', 898.95, 0, 9480, 13460, 4740.00, 2, 'B', '你有追續成交，今天再補一筆就能拉高排序。'],
  [18, '陳百玲（新人）', 17, 'down', 756.90, 0, 6980, 6980, 3490.00, 2, 'B', '你有累積，不急著衝，先把成交穩定做出來。'],
  [19, '鄭珮恩', 16, 'down', 752.80, 0, 5750, 14500, 2875.00, 2, 'B', '你分數差距不大，今天先把追續金額補強。'],
  [20, '謝啟芳', 15, 'down', 518.85, 0, 2980, 16300, 2980.00, 1, 'B', '你有成交但分數偏低，今天要先提高客單。'],
  [21, '陳玲華', 20, 'down', 158.14, 0, 0, 25740, 0, 0, 'C', '你有總業績但缺追續與實收，今天先求有效成交。'],
  [22, '江沛林', 19, 'down', 91.85, 0, 0, 14950, 0, 0, 'C', '先把追續單與實收補起來，排名才有上升空間。'],
  [23, '蘇淑玲', 23, 'flat', 0, 0, 0, 0, 0, 0, 'C', '今天先求破零，有分數才有派單空間。'],
  [24, '鄭上官', 24, 'flat', 0, 0, 0, 0, 0, 0, 'C', '先解除空白狀態，後續才有排名意義。']
];

function rankingMetrics(score, actualRevenue, renewalRevenue, totalRevenue, avgRenewal, renewalDeals) {
  return {
    [RANKING_METRICS[0]]: score,
    [RANKING_METRICS[1]]: actualRevenue,
    [RANKING_METRICS[2]]: renewalRevenue,
    [RANKING_METRICS[3]]: totalRevenue,
    [RANKING_METRICS[4]]: avgRenewal,
    [RANKING_METRICS[5]]: renewalDeals,
    正式權重分數: score,
    實收: actualRevenue,
    追續金額: renewalRevenue,
    全部總業績: totalRevenue,
    追續客單價: avgRenewal,
    追續單數: renewalDeals
  };
}

function auditMetrics(renewalDeals, totalRevenue, renewalRevenue, actualRevenue) {
  return {
    [AUDIT_METRICS[0]]: 0,
    [AUDIT_METRICS[1]]: 0,
    [AUDIT_METRICS[2]]: renewalDeals,
    [AUDIT_METRICS[3]]: 0,
    [AUDIT_METRICS[4]]: totalRevenue,
    [AUDIT_METRICS[5]]: renewalRevenue,
    [AUDIT_METRICS[6]]: actualRevenue,
    追續單成交: renewalDeals,
    全部總業績: totalRevenue,
    追續單金額: renewalRevenue,
    實收總金額: actualRevenue
  };
}

const rankings = rows.map(([rank, name, prevRank, movement, score, actualRevenue, renewalRevenue, totalRevenue, avgRenewal, renewalDeals, group, advice]) => ({
  rank,
  name,
  prevRank,
  movement,
  isNew: name.includes('新人'),
  group,
  metrics: rankingMetrics(score, actualRevenue, renewalRevenue, totalRevenue, avgRenewal, renewalDeals),
  advice
}));

const groups = {
  A1: rankings.filter((row) => row.group === 'A1').map((row) => row.name),
  A2: rankings.filter((row) => row.group === 'A2').map((row) => row.name),
  B: rankings.filter((row) => row.group === 'B').map((row) => row.name),
  C: rankings.filter((row) => row.group === 'C').map((row) => row.name)
};

const compactTop10 = rankings
  .slice(0, 10)
  .map((row) => `${row.rank}${row.name}`)
  .join(' ');
const compactLockText = [
  `正式前10名：${compactTop10}。`,
  `A1：${groups.A1.join('、')}。`,
  `A2：${groups.A2.join('、')}。`,
  `B組：${groups.B.join('、')}。`,
  `C組：${groups.C.join('、')}。`
].join('\n');

const adviceList = rankings.map((row) => ({
  name: row.name,
  rank: row.rank,
  group: row.group,
  text: row.advice
}));

const summaryBoard = {
  [SUMMARY_METRICS[0]]: 0,
  [SUMMARY_METRICS[1]]: 0,
  [SUMMARY_METRICS[2]]: 61,
  [SUMMARY_METRICS[3]]: 0,
  [SUMMARY_METRICS[4]]: 1253068,
  [SUMMARY_METRICS[5]]: 699260,
  [SUMMARY_METRICS[6]]: 113870,
  [SUMMARY_METRICS[7]]: 0,
  追續單成交: 61,
  全部總業績: 1253068,
  追續單金額: 699260,
  實收總金額: 113870
};

const report = {
  reportId: 'dispatch_2026_05_04_v1',
  version: 1,
  status: 'published',
  title: 'AI 派單公告｜5/4 結算 → 5/5 正式派單',
  settlementDate: '2026-05-04',
  dispatchDate: '2026-05-05',
  reportDate: '115/05/04',
  auditResult: 'PASS',
  createdAt: '2026-05-04T19:30:00+08:00',
  updatedAt: new Date().toISOString(),
  sourceText: GROUP_SHORT_TEXT,
  audit: {
    result: 'PASS',
    rule: DEFAULT_AUDIT_RULE || '先審計，後運算，後排序，再派單。',
    platforms: [
      {
        platformKey: 'sanli_yixin',
        platformName: '三立奕心',
        passed: true,
        metrics: auditMetrics(45, 717358, 575440, 60460)
      },
      {
        platformKey: 'ftv',
        platformName: '民視產品',
        passed: true,
        metrics: auditMetrics(12, 490000, 80590, 18160)
      },
      {
        platformKey: 'company_product',
        platformName: '公司產品',
        passed: true,
        metrics: auditMetrics(4, 45710, 43230, 35250)
      }
    ],
    notes: [
      '本輪三平台總表與個別明細加總一致。',
      '無漏算、無多算、無總盤衝突。'
    ],
    excludedEmployees: []
  },
  summaryBoard,
  rankings,
  groups,
  adviceList,
  finalConfirmations: [
    '5/4 最新業績已統一為正式版。',
    '三平台總表核對通過。',
    '正式名次、分級與公告文字以本資料為準。'
  ],
  groupShortText: `${GROUP_SHORT_TEXT}\n\n${compactLockText}`
};

const storedRecord = {
  report,
  meta: {
    operator: 'system-super-optimizer',
    savedAt: new Date().toISOString(),
    reason: 'Official 5/4 settlement to 5/5 dispatch unified update',
    source: 'manual-official'
  }
};

const standardData = {
  公告標題: report.title,
  交接資料: {
    結算日: '5/4',
    派單日: '5/5'
  },
  審計結論: report.audit,
  整合總盤: summaryBoard,
  正式名次: rankings.map((row) => ({
    名次: row.rank,
    姓名: row.name,
    分級: row.group,
    上輪名次: row.prevRank,
    異動: row.movement,
    ...row.metrics,
    建議: row.advice
  })),
  分級: groups,
  每人一句建議: adviceList,
  群組超精簡版: report.groupShortText,
  preserveRankingOrder: true,
  officialLock: {
    preserveRankingOrder: true,
    key: '0504-0505'
  }
};

function writeJson(relativePath, payload) {
  const filePath = path.join(APP_ROOT, relativePath);
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');
}

writeJson('data/latest.json', storedRecord);
writeJson('data/dispatch-reports-v1/latest.json', storedRecord);
writeJson('data/dispatch-reports-v1/reports/dispatch_2026_05_04_v1/v1.json', storedRecord);

const sharedModule = `module.exports = ${JSON.stringify({ ...storedRecord, standardData }, null, 2)};\n`;
fs.writeFileSync(path.join(APP_ROOT, 'shared/official-0504-to-0505.js'), sharedModule, 'utf8');

console.log('Synced official 5/4 settlement -> 5/5 dispatch data.');
console.log(`Rankings: ${rankings.length}`);
console.log(`Top 3: ${rankings.slice(0, 3).map((row) => `${row.rank}.${row.name}`).join(' / ')}`);
