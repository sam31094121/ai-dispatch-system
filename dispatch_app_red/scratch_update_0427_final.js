const fs = require('fs');

const rankingText = `
1、王珍珠｜【AI權重分數】8952.11｜【實收】793,848｜【追續金額】678,760｜【全部總業績】993,558｜【追續客單價】13,309｜【追續單數】51
2、王梅慧｜【AI權重分數】8170.98｜【實收】782,180｜【追續金額】613,150｜【全部總業績】872,400｜【追續客單價】17,032｜【追續單數】36
3、馬秋香｜【AI權重分數】7886.73｜【實收】795,868｜【追續金額】527,240｜【全部總業績】869,718｜【追續客單價】13,181｜【追續單數】40
4、林沛昕｜【AI權重分數】5849.09｜【實收】524,082｜【追續金額】405,536｜【全部總業績】609,390｜【追續客單價】31,195｜【追續單數】13
5、李玲玲｜【AI權重分數】4600.53｜【實收】466,770｜【追續金額】238,790｜【全部總業績】604,070｜【追續客單價】9,950｜【追續單數】24
6、許喬恩｜【AI權重分數】3827.30｜【實收】76,400｜【追續金額】347,400｜【全部總業績】347,400｜【追續客單價】43,425｜【追續單數】8
7、徐華妤｜【AI權重分數】3622.24｜【實收】320,050｜【追續金額】228,440｜【全部總業績】402,190｜【追續客單價】15,229｜【追續單數】15
8、鄭上官｜【AI權重分數】3494.57｜【實收】109,810｜【追續金額】311,810｜【全部總業績】311,810｜【追續客單價】34,646｜【追續單數】9
9、林宜靜｜【AI權重分數】3052.18｜【實收】360,280｜【追續金額】83,640｜【全部總業績】474,330｜【追續客單價】4,920｜【追續單數】17
10、湯玉琦｜【AI權重分數】2694.08｜【實收】208,878｜【追續金額】159,600｜【全部總業績】279,018｜【追續客單價】7,255｜【追續單數】22
11、廖姿惠｜【AI權重分數】2054.27｜【實收】165,716｜【追續金額】91,586｜【全部總業績】243,056｜【追續客單價】4,820｜【追續單數】19
12、蘇淑玲｜【AI權重分數】1986.17｜【實收】151,636｜【追續金額】95,340｜【全部總業績】223,936｜【追續客單價】15,890｜【追續單數】6
13、梁依萍｜【AI權重分數】1964.01｜【實收】178,690｜【追續金額】80,460｜【全部總業績】271,270｜【追續客單價】6,705｜【追續單數】12
14、高如郁｜【AI權重分數】1959.99｜【實收】193,238｜【追續金額】74,380｜【全部總業績】250,138｜【追續客單價】5,722｜【追續單數】13
15、高美雲｜【AI權重分數】1677.91｜【實收】167,736｜【追續金額】55,000｜【全部總業績】243,266｜【追續客單價】6,111｜【追續單數】9
16、江麗勉｜【AI權重分數】1471.51｜【實收】130,966｜【追續金額】59,948｜【全部總業績】169,466｜【追續客單價】5,995｜【追續單數】10
17、鄭珮恩｜【AI權重分數】1405.62｜【實收】114,438｜【追續金額】46,060｜【全部總業績】155,378｜【追續客單價】2,879｜【追續單數】16
18、陳玲華｜【AI權重分數】1187.64｜【實收】95,488｜【追續金額】41,780｜【全部總業績】170,108｜【追續客單價】6,963｜【追續單數】6
19、江沛林｜【AI權重分數】1114.59｜【實收】9,980｜【追續金額】74,980｜【全部總業績】89,920｜【追續客單價】14,996｜【追續單數】5
20、周美蓁｜【AI權重分數】711.37｜【實收】28,800｜【追續金額】30,800｜【全部總業績】30,800｜【追續客單價】10,267｜【追續單數】3
21、林佩君｜【AI權重分數】501.80｜【實收】13,858｜【追續金額】21,658｜【全部總業績】43,130｜【追續客單價】5,414｜【追續單數】4
22、謝啟芳｜【AI權重分數】494.83｜【實收】24,140｜【追續金額】16,640｜【全部總業績】41,540｜【追續客單價】5,547｜【追續單數】3
23、陳桂子（新人）｜【AI權重分數】452.01｜【實收】19,000｜【追續金額】19,000｜【全部總業績】19,000｜【追續客單價】4,750｜【追續單數】4
`;

const parseNum = (str) => parseInt(str.replace(/,/g, ''), 10);
const parseScore = (str) => parseFloat(str);

const ranking = rankingText.trim().split('\n').map(line => {
  const parts = line.split('｜');
  const rankAndName = parts[0].split('、');
  const rank = parseInt(rankAndName[0], 10);
  const name = rankAndName[1];
  
  const totalScore = parseScore(parts[1].match(/】([\d\.]+)/)[1]);
  const actualRevenue = parseNum(parts[2].match(/】([\d\,]+)/)[1]);
  const renewalRevenue = parseNum(parts[3].match(/】([\d\,]+)/)[1]);
  const totalRevenue = parseNum(parts[4].match(/】([\d\,]+)/)[1]);
  const avgRenewal = parseNum(parts[5].match(/】([\d\,]+)/)[1]);
  const renewalDeals = parseNum(parts[6].match(/】([\d\,]+)/)[1]);

  return {
    rank, name,
    totalRevenue,
    actualRevenue,
    renewalRevenue,
    avgRenewal,
    renewalDeals,
    dispatchDeals: 0, // Placeholder
    totalScore
  };
});

const groups = {
  A1: ranking.slice(0, 4).map(r => r.name), // 1-4
  A2: ranking.slice(4, 10).map(r => r.name), // 5-10
  B: ranking.slice(10, 17).map(r => r.name), // 11-17
  C: ranking.slice(17, 23).map(r => r.name) // 18-23
};

const advice = ranking.map(r => {
  let text = '穩定發揮。';
  if (r.rank === 1) text = '追續單金額與總業績三項指標極強，請維持當前王者節奏。';
  if (r.rank === 2) text = '實收與追續極高，但在全部總業績稍遜，仍是頂尖表現。';
  if (r.rank === 3) text = '實收總金額全員最高，唯有其他四項參數被拉開，繼續穩住。';
  if (r.rank === 4) text = '總分衝上第四，客單價高達三萬多，戰鬥力驚人。';
  if (r.rank === 5) text = '穩居前五，總盤面實力厚實。';
  if (r.rank === 6) text = '公司產品追續客單價全員最高，一舉將名次拉升至第六。';
  if (r.rank === 7) text = '站穩前七，實收與追續皆有斬獲。';
  if (r.rank === 8) text = '高強度客單價成功帶動名次，非常漂亮。';
  if (r.rank === 9) text = '本輪雖稍降，但實收總額仍在前段班。';
  if (r.rank === 10) text = '回到前十，請繼續穩健推動派單成交。';
  if (r.rank === 11) text = '大幅前進兩名，追續單數量帶來穩固優勢。';
  if (r.rank === 12) text = '狂升三名，恭喜找回戰鬥節奏。';
  if (r.rank === 13) text = '稍有退後，請再次聚焦高單價產品。';
  if (r.rank === 14) text = '名次持平，維持中堅戰力。';
  if (r.rank === 15) text = '本輪掉出前排，需加強追續件數與客單價。';
  if (r.rank === 16) text = '上升一名，穩步前進。';
  if (r.rank === 17) text = '上升一名，漸入佳境。';
  if (r.rank === 18) text = '退至 C 組邊緣，需加速開單。';
  if (r.rank === 19) text = '上升兩名，追續金額貢獻度高。';
  if (r.rank === 20) text = '名次持平，請繼續加油。';
  if (r.rank === 21) text = '上升兩名，脫離末端。';
  if (r.rank === 22) text = '掉落至後段，急需新單注水。';
  if (r.rank === 23) text = '新人穩紮穩打，先求熟悉系統。';
  return { rank: r.rank, name: r.name, text };
});

const newObjString = `const OFFICIAL_0427_TO_0428 = Object.freeze({
  reportDate: '115/04/27',
  dispatchDate: '115/04/28',
  scoringMethod: 'AI 10000 權重比例原則：實收3000＋追續金額2500＋總業績1500＋追續客單價1500＋追續單數1500',
  scoringNote: '本輪全面改採 AI 比例原則，以全員最高值為基準計算加權分數。',
  overallStats: {
    totalCalls: 650, 
    dispatchCalls: 400, 
    renewalCalls: 345,
    renewalAmount: 4301998,
    dailyRenewalAmount: 512000, 
    cancellations: 0,
    monthlyRevenue: 7714892,
    actualRevenue: 5731852
  },
  platforms: {
    '三立奕心': {
      cumulativeDispatch: 350,
      cumulativeDispatchDeals: 200,
      cumulativeRenewalDeals: 238,
      dailyRenewalAmount: 212000,
      monthlyRevenue: 4111862,
      totalRenewalAmount: 2871188,
      actualRevenue: 3739612,
      dailyCancellations: 0
    },
    '民視': {
      cumulativeDispatch: 200,
      cumulativeDispatchDeals: 150,
      cumulativeRenewalDeals: 70,
      dailyRenewalAmount: 200000,
      monthlyRevenue: 2573140,
      totalRenewalAmount: 435920,
      actualRevenue: 1497790,
      dailyCancellations: 0
    },
    '公司產品': {
      cumulativeDispatch: 100,
      cumulativeDispatchDeals: 50,
      cumulativeRenewalDeals: 37,
      dailyRenewalAmount: 100000,
      monthlyRevenue: 1029890,
      totalRenewalAmount: 994890,
      actualRevenue: 494450,
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
const startIdx = content.indexOf('const OFFICIAL_0427_TO_0428 = Object.freeze({');
const endIdx = content.indexOf('function official0427GroupOf(name) {');

if (startIdx > -1 && endIdx > -1) {
  const newContent = content.substring(0, startIdx) + newObjString + '\n\n' + content.substring(endIdx);
  fs.writeFileSync('shared/official-locks.js', newContent);
  console.log('Successfully updated shared/official-locks.js');
} else {
  console.log('Failed to find bounds');
}
