const path = require('path');
process.chdir(path.resolve(__dirname, '..'));

const { saveNewReport, saveReportVersion } = require('../src/services/dispatchQuery.service');

// groupingMode: "manual_from_announcement"（本輪分組以公告名單為準，非固定名次切法）
// rankChanges: not_provided（本輪未提供上一輪對照異動表）

const rankings = [
  { rank:1,  name:'馬秋香',        group:'A1', isNew:false, advice:'你這輪全面領先，今天重點是把優勢繼續拉開。',
    metrics:{ 正式權重分數:8858.72, 實收:212210, 續單金額:437910, 總業績:510790, 追續客單價:33685.38, 追續成交總數:13, 派單成交總通數:0 } },
  { rank:2,  name:'許喬恩',        group:'A1', isNew:false, advice:'你的超高客單直接衝上前段，今天維持成交節奏很重要。',
    metrics:{ 正式權重分數:4911.59, 實收:142000, 續單金額:142000, 總業績:142000, 追續客單價:71000.00, 追續成交總數:2,  派單成交總通數:0 } },
  { rank:3,  name:'王珍珠',        group:'A1', isNew:false, advice:'你單數與實收都很穩，今天再補高客單會更強。',
    metrics:{ 正式權重分數:4745.94, 實收:105250, 續單金額:145530, 總業績:254150, 追續客單價:8560.59,  追續成交總數:17, 派單成交總通數:0 } },
  { rank:4,  name:'湯玉琦',        group:'A1', isNew:false, advice:'你追續量很漂亮，今天把實收再往上推。',
    metrics:{ 正式權重分數:4539.39, 實收:96760,  續單金額:187920, 總業績:261240, 追續客單價:17083.64, 追續成交總數:11, 派單成交總通數:0 } },
  { rank:5,  name:'王梅慧',        group:'A1', isNew:false, advice:'你高客單開始成形，今天關鍵是再補實收。',
    metrics:{ 正式權重分數:4414.27, 實收:47240,  續單金額:238720, 總業績:350440, 追續客單價:26524.44, 追續成交總數:9,  派單成交總通數:0 } },
  { rank:6,  name:'林沛昕',        group:'A1', isNew:false, advice:'你整體很平均，今天只差再補高額成交。',
    metrics:{ 正式權重分數:3979.29, 實收:98568,  續單金額:142560, 總業績:179656, 追續客單價:12960.00, 追續成交總數:11, 派單成交總通數:0 } },
  { rank:7,  name:'廖姿惠',        group:'A2', isNew:false, advice:'你實收與追續同步成長，今天有機會再往前。',
    metrics:{ 正式權重分數:3744.40, 實收:105150, 續單金額:114080, 總業績:185490, 追續客單價:12675.56, 追續成交總數:9,  派單成交總通數:0 } },
  { rank:8,  name:'林宜靜',        group:'A2', isNew:false, advice:'你實收很穩，今天把追續量補起來。',
    metrics:{ 正式權重分數:2781.89, 實收:108690, 續單金額:41380,  總業績:149020, 追續客單價:10345.00, 追續成交總數:4,  派單成交總通數:0 } },
  { rank:9,  name:'徐華妤',        group:'A2', isNew:false, advice:'你客單價很亮眼，今天重點是增加成交數。',
    metrics:{ 正式權重分數:2038.72, 實收:27740,  續單金額:89620,  總業績:105100, 追續客單價:22405.00, 追續成交總數:4,  派單成交總通數:0 } },
  { rank:10, name:'李玲玲',        group:'A2', isNew:false, advice:'你實收有撐住，今天再補追續金額。',
    metrics:{ 正式權重分數:1969.20, 實收:99130,  續單金額:22540,  總業績:105610, 追續客單價:4508.00,  追續成交總數:5,  派單成交總通數:0 } },
  { rank:11, name:'梁依萍',        group:'A2', isNew:false, advice:'你有高客單優勢，今天先求再接一筆。',
    metrics:{ 正式權重分數:1470.21, 實收:33360,  續單金額:39320,  總業績:79180,  追續客單價:13106.67, 追續成交總數:3,  派單成交總通數:0 } },
  { rank:12, name:'高美雲',        group:'A2', isNew:false, advice:'你目前差距不大，再補單就有機會翻位。',
    metrics:{ 正式權重分數:1370.15, 實收:18710,  續單金額:42580,  總業績:62390,  追續客單價:8516.00,  追續成交總數:5,  派單成交總通數:0 } },
  { rank:13, name:'高如郁',        group:'A2', isNew:false, advice:'你還在可上升區，今天先穩定成交。',
    metrics:{ 正式權重分數:1203.26, 實收:27060,  續單金額:27380,  總業績:70450,  追續客單價:9126.67,  追續成交總數:3,  派單成交總通數:0 } },
  { rank:14, name:'鄭珮恩',        group:'B',  isNew:false, advice:'你追續單數有起來，今天補實收會更完整。',
    metrics:{ 正式權重分數:816.95,  實收:3390,   續單金額:20400,  總業績:42630,  追續客單價:4080.00,  追續成交總數:5,  派單成交總通數:0 } },
  { rank:15, name:'林佩君',        group:'B',  isNew:false, advice:'你現在要把成交量做出來。',
    metrics:{ 正式權重分數:809.56,  實收:14700,  續單金額:18700,  總業績:41200,  追續客單價:9350.00,  追續成交總數:2,  派單成交總通數:0 } },
  { rank:16, name:'江沛林',        group:'B',  isNew:false, advice:'你有總業績底盤，今天補追續即可往前。',
    metrics:{ 正式權重分數:684.15,  實收:11560,  續單金額:6980,   總業績:83490,  追續客單價:6980.00,  追續成交總數:1,  派單成交總通數:0 } },
  { rank:17, name:'陳玲華',        group:'B',  isNew:false, advice:'先把有效成交做出來，排名就會往上。',
    metrics:{ 正式權重分數:676.01,  實收:18300,  續單金額:7000,   總業績:48090,  追續客單價:7000.00,  追續成交總數:1,  派單成交總通數:0 } },
  { rank:18, name:'陳百玲（新人）', group:'B',  isNew:true,  advice:'穩定累積最重要，先把節奏做穩。',
    metrics:{ 正式權重分數:672.31,  實收:2000,   續單金額:24180,  總業績:24180,  追續客單價:8060.00,  追續成交總數:3,  派單成交總通數:0 } },
  { rank:19, name:'周美蓁',        group:'B',  isNew:false, advice:'你有穩定實收，再一筆就能往前推。',
    metrics:{ 正式權重分數:615.15,  實收:12000,  續單金額:12000,  總業績:12000,  追續客單價:12000.00, 追續成交總數:1,  派單成交總通數:0 } },
  { rank:20, name:'莉莉（新人）',  group:'C',  isNew:true,  advice:'先維持穩定成交，慢慢把分數墊高。',
    metrics:{ 正式權重分數:609.88,  實收:11880,  續單金額:11880,  總業績:11880,  追續客單價:11880.00, 追續成交總數:1,  派單成交總通數:0 } },
  { rank:21, name:'江麗勉',        group:'C',  isNew:false, advice:'今天先補追續量，會比較容易翻位。',
    metrics:{ 正式權重分數:560.54,  實收:13460,  續單金額:9480,   總業績:13460,  追續客單價:4740.00,  追續成交總數:2,  派單成交總通數:0 } },
  { rank:22, name:'謝啟芳',        group:'C',  isNew:false, advice:'先把客單價往上拉，分數會提升很多。',
    metrics:{ 正式權重分數:348.11,  實收:9340,   續單金額:2980,   總業績:16300,  追續客單價:2980.00,  追續成交總數:1,  派單成交總通數:0 } },
  { rank:23, name:'蘇淑玲',        group:'C',  isNew:false, advice:'今天先求破零，有分數才有競爭力。',
    metrics:{ 正式權重分數:56.56,   實收:0,      續單金額:0,      總業績:19260,  追續客單價:0,        追續成交總數:0,  派單成交總通數:0 } },
  { rank:24, name:'鄭上官',        group:'C',  isNew:false, advice:'先解除空白狀態，後續排名才有排名意義。',
    metrics:{ 正式權重分數:0,       實收:0,      續單金額:0,      總業績:0,      追續客單價:0,        追續成交總數:0,  派單成交總通數:0 } },
];

function buildGroups(rankings) {
  const g = { A1: [], A2: [], B: [], C: [] };
  rankings.forEach(r => { if (g[r.group]) g[r.group].push(r.name); });
  return g;
}

const report = {
  reportId: 'dispatch_2026_05_07_v1',
  title: 'AI 派單公告｜5/7 結算 → 5/8 正式派單順序',
  settlementDate: '2026-05-07',
  dispatchDate: '2026-05-08',
  status: 'published',
  auditResult: 'PASS',
  audit: {
    result: 'PASS',
    rule: '先審計，後排序，再派單',
    notes: ['3平台總表（三立、民視、公司）核對通過，無漏算、無多算、無總盤衝突'],
    excludedEmployees: [],
    platforms: [
      {
        platformName: '三立奕心',
        passed: true,
        metrics: {
          累積總派單數: 0,
          累積派單總成交數: 85,
          累積追續總成交數: 85,
          當日續單金額: 1437250,
          本月業績: 1673616,
          追續單總金額: 1437250,
          實收總金額: 622598
        }
      },
      {
        platformName: '民視',
        passed: true,
        metrics: {
          累積總派單數: 0,
          累積派單總成交數: 21,
          累積追續總成交數: 21,
          當日續單金額: 129250,
          本月業績: 873270,
          追續單總金額: 129250,
          實收總金額: 380120
        }
      },
      {
        platformName: '公司產品',
        passed: true,
        metrics: {
          累積總派單數: 0,
          累積派單總成交數: 8,
          累積追續總成交數: 8,
          當日續單金額: 218640,
          本月業績: 221120,
          追續單總金額: 218640,
          實收總金額: 186960
        }
      }
    ]
  },
  summaryBoard: {
    累積總派單數: 0,
    累積派單總成交數: 114,
    累積追續總成交數: 114,
    當日續單金額: 1785140,
    本月業績: 2768006,
    追續單總金額: 1785140,
    實收總金額: 1189678,
    當日取消退貨: 0
  },
  rankings,
  groups: buildGroups(rankings),
  adviceList: rankings.map(r => ({ name: r.name, rank: r.rank, group: r.group, text: r.advice })),
  finalConfirmations: [
    '5/7 結算資料已核對完成',
    '3平台總表（三立、民視、公司）核對通過，無漏算、無多算、無總盤衝突',
    '5/8 正式派單順序，以本則公告為準'
  ],
  groupShortText: '🔴A1主力：馬秋香、許喬恩、王珍珠、湯玉琦、王梅慧、林沛昕｜🟠A2次主力：廖姿惠、林宜靜、徐華妤、李玲玲、梁依萍、高美雲、高如郁｜🟡B組：鄭珮恩、林佩君、江沛林、陳玲華、陳百玲（新人）、周美蓁｜🟢C組：莉莉（新人）、江麗勉、謝啟芳、蘇淑玲、鄭上官',
  announcement: `【AI 派單公告｜5/7 結算 → 5/8 正式派單順序｜AI 比例原則版】

一、審計結論
審計結果：PASS
3平台總表核對通過，無漏算、無多算、無總盤衝突。

二、整合總盤
【追續單成交】114
【全部總業績】2,768,006
【追續單金額】1,785,140
【實收總金額】1,189,678

三、今日整合名次
1、馬秋香｜8858.72
2、許喬恩｜4911.59
3、王珍珠｜4745.94
4、湯玉琦｜4539.39
5、王梅慧｜4414.27
6、林沛昕｜3979.29
7、廖姿惠｜3744.40
8、林宜靜｜2781.89
9、徐華妤｜2038.72
10、李玲玲｜1969.20
11、梁依萍｜1470.21
12、高美雲｜1370.15
13、高如郁｜1203.26
14、鄭珮恩｜816.95
15、林佩君｜809.56
16、江沛林｜684.15
17、陳玲華｜676.01
18、陳百玲（新人）｜672.31
19、周美蓁｜615.15
20、莉莉（新人）｜609.88
21、江麗勉｜560.54
22、謝啟芳｜348.11
23、蘇淑玲｜56.56
24、鄭上官｜0.00

四、名次異動：本輪未提供異動對照資料

五、5/8 AI 派單順序
🔴 A1｜高優先主力：馬秋香、許喬恩、王珍珠、湯玉琦、王梅慧、林沛昕
🟠 A2｜次主力追進：廖姿惠、林宜靜、徐華妤、李玲玲、梁依萍、高美雲、高如郁
🟡 B組｜一般量單：鄭珮恩、林佩君、江沛林、陳玲華、陳百玲（新人）、周美蓁
🟢 C組｜補位觀察：莉莉（新人）、江麗勉、謝啟芳、蘇淑玲、鄭上官`
};

(async () => {
  try {
    let result;
    try {
      result = saveNewReport(report, {
        operator: 'AI-SYSTEM',
        reason: '5/7 結算 → 5/8 正式派單，AI 比例原則版，分組採 manual_from_announcement',
        source: 'official'
      });
      console.log('✅ 新版報告已成功儲存 (saveNewReport)');
    } catch (e) {
      if (e.code === 'DUPLICATE_REPORT' || (e.message && e.message.includes('已存在'))) {
        console.log('報告已存在，改用 saveReportVersion...');
        result = saveReportVersion(report, {
          operator: 'AI-SYSTEM',
          reason: '5/7 結算 → 5/8 正式派單更新版',
          source: 'official'
        });
        console.log('✅ 版本更新成功 (saveReportVersion)');
      } else {
        throw e;
      }
    }
    console.log('報告ID:', result.report.reportId);
    console.log('結算日:', result.report.settlementDate);
    console.log('派單日:', result.report.dispatchDate);
    console.log('排行數:', result.report.rankings?.length);
    console.log('審計:', result.validation?.ok ? 'PASS ✅' : `FAIL ❌ (${result.validation?.errors?.length} errors)`);
    if (!result.validation?.ok) {
      result.validation.errors.forEach(e => console.error(' -', e.field + ':', e.reason));
    }
    if (result.validation?.warnings?.length) {
      result.validation.warnings.forEach(w => console.warn(' warning:', w.field + ':', w.reason));
    }
  } catch (err) {
    console.error('❌ 儲存失敗:', err.message);
    if (err.errors) err.errors.forEach(e => console.error(' -', e.field + ':', e.reason));
    process.exit(1);
  }
})();
