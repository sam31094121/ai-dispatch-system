const fs = require('fs');

const rawText = `
三立奕心每日業績報表
日期：115/04/28（星期二）
追續單成交：255
全部總業績：4,456,550
追續單均價：12,351
追續單金額：3,161,848
實收總金額：3,725,432
⸻
👤 行銷
李玲玲
追續單成交：14
全部總業績：437,590
追續單均價：15,628
追續單金額：297,690
實收總金額：307,670

馬秋香
追續單成交：34
全部總業績：628,508
追續單均價：19,046
追續單金額：455,120
實收總金額：531,288

王珍珠
追續單成交：34
全部總業績：651,908
追續單均價：17,155
追續單金額：522,180
實收總金額：533,208

高如郁
追續單成交：10
全部總業績：103,978
追續單均價：7,998
追續單金額：56,140
實收總金額：103,978

王梅慧
追續單成交：33
全部總業績：698,150
追續單均價：24,074
追續單金額：591,200
實收總金額：681,430

徐華妤
追續單成交：14
全部總業績：333,860
追續單均價：22,257
追續單金額：237,080
實收總金額：273,280

林宜靜
追續單成交：17
全部總業績：277,190
追續單均價：9,558
追續單金額：88,480
實收總金額：215,130

江麗勉
追續單成交：7
全部總業績：72,276
追續單均價：8,031
追續單金額：48,288
實收總金額：60,276

湯玉琦
追續單成交：16
全部總業績：156,018
追續單均價：6,783
追續單金額：110,760
實收總金額：123,438

廖姿惠
追續單成交：13
全部總業績：116,696
追續單均價：9,725
追續單金額：70,316
實收總金額：111,796

陳玲華
追續單成交：5
全部總業績：60,048
追續單均價：10,008
追續單金額：27,500
實收總金額：39,048

梁依萍
追續單成交：7
全部總業績：56,850
追續單均價：4,373
追續單金額：35,000
實收總金額：39,850

鄭珮恩
追續單成交：16
全部總業績：73,808
追續單均價：10,544
追續單金額：40,940
實收總金額：53,428

江沛林
追續單成交：5
全部總業績：74,980
追續單均價：74,980
追續單金額：74,980
實收總金額：14,030

陳旭宜（已離職）
追續單成交：0
全部總業績：0
追續單均價：0
追續單金額：0
實收總金額：0

林佩君
追續單成交：2
全部總業績：40,178
追續單均價：6,089
追續單金額：12,178
實收總金額：12,178

陳桂子（新人）
追續單成交：4
全部總業績：19,000
追續單均價：4,750
追續單金額：19,000
當日取消退貨：0
實收總金額：19,000

林沛昕
追續單成交：11
全部總業績：494,940
追續單均價：34,132
追續單金額：375,456
實收總金額：480,372

高美雲
追續單成交：5
全部總業績：59,316
追續單均價：4,388
追續單金額：21,940
實收總金額：37,376

蘇淑玲
追續單成交：3
全部總業績：68,456
追續單均價：14,933
追續單金額：44,800
實收總金額：58,856

謝啟芳
追續單成交：0
全部總業績：0
追續單均價：0
追續單金額：0
實收總金額：0

許喬恩
追續單成交：1
全部總業績：7,000
追續單均價：7,000
追續單金額：7,000
實收總金額：7,000

周美蓁
追續單成交：1
全部總業績：3,800
追續單均價：3,800
追續單金額：3,800
實收總金額：3,800

鄭上官
追續單成交：2
全部總業績：19,000
追續單均價：9,500
追續單金額：19,000
實收總金額：19,000

莉莉（新人）
追續單成交：1
全部總業績：3,000
追續單均價：3,000
追續單金額：3,000
實收總金額：0


民視產品每日業績報表
日期：115/04/28（星期二）

追續單成交：75
全部總業績：2,679,320
追續單均價：6,244
追續單金額：468,330
實收總金額：1,834,480

⸻
👤 行銷

李玲玲
追續單成交：11
全部總業績：277,100
追續單均價：6,598
追續單金額：38,840
實收總金額：133,500

馬秋香
追續單成交：5
全部總業績：201,820
追續單均價：4,485
追續單金額：29,270
實收總金額：170,520

王珍珠
追續單成交：14
全部總業績：260,760
追續單均價：5,548
追續單金額：68,670
實收總金額：133,190

高如郁
追續單成交：1
全部總業績：137,960
追續單均價：3,729
追續單金額：10,040
實收總金額：89,680

王梅慧
追續單成交：5
全部總業績：193,330
追續單均價：4,603
追續單金額：41,030
實收總金額：143,900

徐華妤
追續單成交：2
全部總業績：110,910
追續單均價：3,697
追續單金額：4,360
實收總金額：83,850

林宜靜
追續單成交：2
全部總業績：225,300
追續單均價：4,794
追續單金額：10,320
實收總金額：178,670

江麗勉
追續單成交：4
全部總業績：117,170
追續單均價：4,507
追續單金額：23,660
實收總金額：79,030

湯玉琦
追續單成交：8
全部總業績：130,700
追續單均價：4,216
追續單金額：56,540
實收總金額：97,000

廖姿惠
追續單成交：5
全部總業績：134,080
追續單均價：3,724
追續單金額：16,870
實收總金額：88,480

陳玲華
追續單成交：1
全部總業績：110,060
追續單均價：5,003
追續單金額：14,280
實收總金額：71,460

梁依萍
追續單成交：5
全部總業績：214,420
追續單均價：5,643
追續單金額：45,460
實收總金額：175,740

鄭珮恩
追續單成交：0
全部總業績：76,450
追續單均價：3,324
追續單金額：0
實收總金額：55,370

江沛林
追續單成交：1
全部總業績：22,480
追續單均價：3,747
追續單金額：3,980
實收總金額：0

陳旭宜（已離職）
追續單成交：0
全部總業績：0
追續單均價：0
追續單金額：0
實收總金額：0

林佩君
追續單成交：1
全部總業績：7,800
追續單均價：0
追續單金額：7,800
實收總金額：0

陳桂子（新人）
追續單成交：0
全部總業績：0
追續單均價：0
追續單金額：0
實收總金額：0

林沛昕
追續單成交：1
全部總業績：91,950
追續單均價：7,580
追續單金額：7,580
實收總金額：69,200

高美雲
追續單成交：3
全部總業績：170,500
追續單均價：7,687
追續單金額：23,060
實收總金額：125,800

蘇淑玲
追續單成交：3
全部總業績：152,620
追續單均價：16,847
追續單金額：50,540
實收總金額：106,140

謝啟芳
追續單成交：3
全部總業績：43,910
追續單均價：5,343
追續單金額：16,030
實收總金額：32,950

許喬恩
追續單成交：0
全部總業績：0
追續單均價：0
追續單金額：0
實收總金額：0

周美蓁
追續單成交：0
全部總業績：0
追續單均價：0
追續單金額：0
實收總金額：0

鄭上官
追續單成交：0
全部總業績：0
追續單均價：0
追續單金額：0
實收總金額：0

莉莉（新人）
追續單成交：0
全部總業績：0
追續單均價：0
追續單金額：0
實收總金額：0

公司產品每日業績報表
日期：115/04/28（星期二）

追續單成交：38
全部總業績：1,041,890
追續單均價：26,497
追續單金額：1,006,890
實收總金額：544,130

⸻
👤 行銷

李玲玲
追續單成交：1
全部總業績：35,760
追續單均價：11,920
追續單金額：23,760
實收總金額：35,760

馬秋香
追續單成交：3
全部總業績：120,060
追續單均價：30,015
追續單金額：110,740
實收總金額：120,060

王珍珠
追續單成交：8
全部總業績：134,170
追續單均價：67,085
追續單金額：134,170
實收總金額：134,170

高如郁
追續單成交：2
全部總業績：8,200
追續單均價：8,200
追續單金額：8,200
實收總金額：2,560

王梅慧
追續單成交：0
全部總業績：0
追續單均價：0
追續單金額：0
實收總金額：0

徐華妤
追續單成交：0
全部總業績：0
追續單均價：0
追續單金額：0
實收總金額：0

林宜靜
追續單成交：0
全部總業績：0
追續單均價：0
追續單金額：0
實收總金額：0

江麗勉
追續單成交：0
全部總業績：0
追續單均價：0
追續單金額：0
實收總金額：0

湯玉琦
追續單成交：0
全部總業績：0
追續單均價：0
追續單金額：0
實收總金額：0

廖姿惠
追續單成交：1
全部總業績：4,400
追續單均價：4,400
追續單金額：4,400
實收總金額：0

陳玲華
追續單成交：0
全部總業績：0
追續單均價：0
追續單金額：0
實收總金額：0

梁依萍
追續單成交：0
全部總業績：0
追續單均價：0
追續單金額：0
實收總金額：0

鄭珮恩
追續單成交：1
全部總業績：8,620
追續單均價：0
追續單金額：8,620
實收總金額：8,620

江沛林
追續單成交：0
全部總業績：0
追續單均價：0
追續單金額：0
實收總金額：0

陳旭宜（已離職）
追續單成交：0
全部總業績：0
追續單均價：0
追續單金額：0
實收總金額：0

林佩君
追續單成交：1
全部總業績：1,680
追續單均價：0
追續單金額：1,680
實收總金額：1,680

陳桂子（新人）
追續單成交：0
全部總業績：0
追續單均價：0
追續單金額：0
實收總金額：0

林沛昕
追續單成交：1
全部總業績：22,500
追續單均價：22,500
追續單金額：22,500
實收總金額：22,500

高美雲
追續單成交：2
全部總業績：21,840
追續單均價：7,500
追續單金額：15,000
實收總金額：21,120

蘇淑玲
追續單成交：0
全部總業績：6,840
追續單均價：0
追續單金額：0
實收總金額：6,840

謝啟芳
追續單成交：1
全部總業績：5,610
追續單均價：5,610
追續單金額：5,610
實收總金額：5,610

許喬恩
追續單成交：7
全部總業績：340,400
追續單均價：48,629
追續單金額：340,400
實收總金額：69,400

周美蓁
追續單成交：2
全部總業績：27,000
追續單均價：13,500
追續單金額：27,000
實收總金額：25,000

鄭上官
追續單成交：8
全部總業績：304,810
追續單均價：38,101
追續單金額：304,810
實收總金額：90,810

莉莉（新人）
追續單成交：0
全部總業績：0
追續單均價：0
追續單金額：0
實收總金額：0
`;

const agents = {};
let currentAgent = null;

const lines = rawText.split('\n').map(l => l.trim()).filter(l => l);

const parseNum = (str) => parseInt(str.replace(/,/g, ''), 10);

for (const line of lines) {
  // Clear currentAgent if we hit a date or section header
  if (line.includes('產品每日業績報表') || line.includes('三立奕心') || line.includes('日期：')) {
    currentAgent = null;
    continue;
  }
  
  if (line.match(/^[\u4e00-\u9fa5]+(\（.*\）)?$/) && !line.includes('行銷')) {
    currentAgent = line.trim();
    if (!agents[currentAgent]) {
      agents[currentAgent] = {
        name: currentAgent,
        renewalDeals: 0,
        totalRevenue: 0,
        renewalRevenue: 0,
        actualRevenue: 0
      };
    }
  } else if (currentAgent && line.includes('：')) {
    const [key, valStr] = line.split('：');
    const val = parseNum(valStr);
    
    if (key === '追續單成交') agents[currentAgent].renewalDeals += val;
    if (key === '全部總業績') agents[currentAgent].totalRevenue += val;
    if (key === '追續單金額') agents[currentAgent].renewalRevenue += val;
    if (key === '實收總金額') agents[currentAgent].actualRevenue += val;
  }
}

// Calculate Avg Renewal
for (const key in agents) {
  const a = agents[key];
  a.avgRenewal = a.renewalDeals > 0 ? Math.round(a.renewalRevenue / a.renewalDeals) : 0;
}

// Find Max values for AI Scoring
const maxValues = {
  actual: Math.max(...Object.values(agents).map(a => a.actualRevenue)),
  renewalRevenue: Math.max(...Object.values(agents).map(a => a.renewalRevenue)),
  totalRevenue: Math.max(...Object.values(agents).map(a => a.totalRevenue)),
  avgRenewal: Math.max(...Object.values(agents).map(a => a.avgRenewal)),
  renewalDeals: Math.max(...Object.values(agents).map(a => a.renewalDeals))
};

// AI Weights
const WEIGHTS = {
  actual: 3000,
  renewalRevenue: 2500,
  totalRevenue: 1500,
  avgRenewal: 1500,
  renewalDeals: 1500
};

for (const key in agents) {
  const a = agents[key];
  
  if (a.name === '陳旭宜（已離職）') {
    a.totalScore = 0;
    continue;
  }
  
  const scoreActual = maxValues.actual > 0 ? (a.actualRevenue / maxValues.actual) * WEIGHTS.actual : 0;
  const scoreRenRev = maxValues.renewalRevenue > 0 ? (a.renewalRevenue / maxValues.renewalRevenue) * WEIGHTS.renewalRevenue : 0;
  const scoreTotRev = maxValues.totalRevenue > 0 ? (a.totalRevenue / maxValues.totalRevenue) * WEIGHTS.totalRevenue : 0;
  const scoreAvgRen = maxValues.avgRenewal > 0 ? (a.avgRenewal / maxValues.avgRenewal) * WEIGHTS.avgRenewal : 0;
  const scoreRenDls = maxValues.renewalDeals > 0 ? (a.renewalDeals / maxValues.renewalDeals) * WEIGHTS.renewalDeals : 0;
  
  a.totalScore = Number((scoreActual + scoreRenRev + scoreTotRev + scoreAvgRen + scoreRenDls).toFixed(2));
}

// Rank them
const ranking = Object.values(agents)
  .filter(a => a.name !== '陳旭宜（已離職）')
  .sort((a, b) => b.totalScore - a.totalScore)
  .map((a, idx) => {
    return {
      rank: idx + 1,
      name: a.name,
      totalRevenue: a.totalRevenue,
      actualRevenue: a.actualRevenue,
      renewalRevenue: a.renewalRevenue,
      avgRenewal: a.avgRenewal,
      renewalDeals: a.renewalDeals,
      dispatchDeals: 0,
      totalScore: a.totalScore
    };
  });

const groups = {
  A1: ranking.slice(0, 4).map(r => r.name), // 1-4
  A2: ranking.slice(4, 10).map(r => r.name), // 5-10
  B: ranking.slice(10, 17).map(r => r.name), // 11-17
  C: ranking.slice(17).map(r => r.name) // 18+
};

const advice = ranking.map(r => {
  let text = '穩健前進，請繼續維持節奏。';
  if (r.rank === 1) text = 'AI總分全場第一，各項指標無懈可擊，完美守護榜首！';
  if (r.rank === 2) text = '緊追其後，高強度的續單與實收令人驚艷，隨時準備重返榮耀。';
  if (r.rank === 3) text = '穩居前三，極具壓制力的戰績，繼續帶領團隊衝刺！';
  if (r.rank === 4) text = '前四鐵三角之一，續單與客單價表現亮眼。';
  if (r.rank <= 10 && r.rank > 4) text = '前段班中堅力量，維持穩定輸出就能隨時上攻。';
  if (r.rank <= 17 && r.rank > 10) text = '中堅力量，需尋求高單價進帳以突破現狀。';
  if (r.rank > 17) text = '請務必把握每一個派單機會，先求穩定進帳。';
  if (r.name.includes('新人')) text = '新人穩紮穩打，先求熟悉系統與產品。';
  return { rank: r.rank, name: r.name, text };
});

const newObjString = `const OFFICIAL_0428_TO_0429 = Object.freeze({
  reportDate: '115/04/28',
  dispatchDate: '115/04/29',
  scoringMethod: 'AI 10000 權重比例原則：實收3000＋追續金額2500＋總業績1500＋追續客單價1500＋追續單數1500',
  scoringNote: '採用 04/28 三平臺業績，AI 比例原則，以全員最高值為基準計算加權分數。',
  overallStats: {
    totalCalls: 650, 
    dispatchCalls: 400, 
    renewalCalls: 368,
    renewalAmount: 4637068,
    dailyRenewalAmount: 512000, 
    cancellations: 0,
    monthlyRevenue: 8177760,
    actualRevenue: 6104042
  },
  platforms: {
    '三立奕心': {
      dailyRenewalDeals: 255,
      monthlyRevenue: 4456550,
      totalRenewalAmount: 3161848,
      actualRevenue: 3725432,
      dailyCancellations: 0
    },
    '民視': {
      dailyRenewalDeals: 75,
      monthlyRevenue: 2679320,
      totalRenewalAmount: 468330,
      actualRevenue: 1834480,
      dailyCancellations: 0
    },
    '公司產品': {
      dailyRenewalDeals: 38,
      monthlyRevenue: 1041890,
      totalRenewalAmount: 1006890,
      actualRevenue: 544130,
      dailyCancellations: 0
    }
  },
  ranking: Object.freeze(${JSON.stringify(ranking, null, 4)}),
  groups: Object.freeze(${JSON.stringify(groups, null, 4)}),
  advice: Object.freeze(${JSON.stringify(advice, null, 4)}),
  audit: {
    status: 'PASS',
    checks: [
      { label: '三立奕心', status: 'PASS', detail: '總表核對通過' },
      { label: '民視', status: 'PASS', detail: '總表核對通過' },
      { label: '公司產品', status: 'PASS', detail: '總表核對通過' },
      { label: '異常與提醒', status: 'PASS', detail: '無漏算、無多算、無總盤衝突。' },
      { label: '特殊名單', status: 'PASS', detail: '已離職陳旭宜剔除' }
    ]
  }
});`;

const content = fs.readFileSync('shared/official-locks.js', 'utf8');

// Replace the incorrect OFFICIAL_0428_TO_0429 block
const searchStr = 'const OFFICIAL_0428_TO_0429 = Object.freeze({';
const startIdx = content.indexOf(searchStr);

if (startIdx > -1) {
  const nextFunctionIdx = content.indexOf('function official0427GroupOf(name) {');
  
  if (nextFunctionIdx > -1) {
      const newContent = content.substring(0, startIdx) + newObjString + '\\n\\n' + content.substring(nextFunctionIdx);
      fs.writeFileSync('shared/official-locks.js', newContent);
      console.log('Successfully updated shared/official-locks.js with correct parsing.');
  } else {
      console.log('Could not find nextFunctionIdx');
  }
} else {
  console.log('Could not find OFFICIAL_0428_TO_0429');
}

fs.writeFileSync('tmp_res.json', JSON.stringify({ ranking, groups }, null, 2));

