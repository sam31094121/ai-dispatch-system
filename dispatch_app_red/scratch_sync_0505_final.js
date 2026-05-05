const fs = require('fs');
const path = require('path');

const rawText = `📣【AI 派單公告｜5/4 結算 → 5/5 正式派單順序｜AI 比例原則版】

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
1    const ranking = rankingLines.map((line) => {
    const parts = line.split('｜');
    if (parts.length < 7) return null;
    
    const rankMatch = parts[0].match(/^(\d+)、(.*)/);
    const rank = parseInt(rankMatch[1]);
    const name = rankMatch[2].trim();
    
    const getNum = (str) => parseFloat(String(str).replace(/[^0-9.-]/g, '')) || 0;
    
    const score = getNum(parts[1]);
    const realRevenue = getNum(parts[2]);
    const continuationAmt = getNum(parts[3]);
    const totalRev = getNum(parts[4]);
    const ticketAvg = getNum(parts[5]);
    const count = getNum(parts[6]);

    let advice = "";
    const advLine = adviceLines.find(al => al.startsWith(rank + '、' + name));
    if (advLine) advice = advLine.split('：')[1].trim();

    let movement = "flat";
    let prevRank = rank;
    
    const mLines = movementSection.split('\n');
    for (let ml of mLines) {
      if (ml.includes(name) && ml.includes('→')) {
        const mm = ml.match(/(\d+)\s*→\s*(\d+)/);
        if (mm) {
          prevRank = parseInt(mm[1]);
          if (ml.includes('↑')) movement = "up";
          else if (ml.includes('↓')) movement = "down";
        }
      }
    }

    let group = "C";
    if (groupsSection.includes('🔴 A1') && groupsSection.split('🔴 A1')[1].split('🟠 A2')[0].includes(name)) group = "A1";
    else if (groupsSection.includes('🟠 A2') && groupsSection.split('🟠 A2')[1].split('🟡 B組')[0].includes(name)) group = "A2";
    else if (groupsSection.includes('🟡 B組') && groupsSection.split('🟡 B組')[1].split('🟢 C組')[0].includes(name)) group = "B";

    return {
      rank,
      name,
      group,
      prevRank,
      movement,
      metrics: {
        "正式權重分數": score,
        "實收": realRevenue,
        "總業績": totalRev,
        "續單金額": continuationAmt,
        "追續成交總數": count,
        "追續客單價": ticketAvg,
        "派單成交總通數": 0
      },
      advice,
      isNew: name.includes("新人")
    };
  }).filter(Boolean);

  const snapshot = {
    reportId: 'dispatch_2026_05_04_v1',
    title: 'AI 派單公告｜5/4 結算 → 5/5 正式派單',
    settlementDate: '2026-05-04',
    dispatchDate: '2026-05-05',
    status: 'published',
    auditResult: 'PASS',
    sourceText: rawText,
    rankings: ranking,
    audit: {
        result: 'PASS',
        rule: '先審計，後運算，後排序，再派單',
        platforms: [
            { platformName: "三立奕心", passed: true, metrics: { "累積追續總成交數": 45, "本月業績": 717358, "追續單總金額": 575440, "實收總金額": 60460 } },
            { platformName: "民視", passed: true, metrics: { "累積追續總成交數": 12, "本月業績": 490000, "追續單總金額": 80590, "實收總金額": 18160 } },
            { platformName: "公司產品", passed: true, metrics: { "累積追續總成交數": 4, "本月業績": 45710, "追續單總金額": 43230, "實收總金額": 35250 } }
        ],
        notes: ["本輪三平台總表與個別明細加總一致。", "無漏算、無多算、無總盤衝突。"],
        excludedEmployees: []
    },
    summaryBoard: {
        "累積追續總成交數": 61,
        "本月業績": 1253068,
        "追續單總金額": 699260,
        "實收總金額": 113870,
        "當日取消退貨": 0
    },
    groups: {
        A1: ranking.filter(r => r.group === 'A1').map(r => r.name),
        A2: ranking.filter(r => r.group === 'A2').map(r => r.name),
        B: ranking.filter(r => r.group === 'B').map(r => r.name),
        C: ranking.filter(r => r.group === 'C').map(r => r.name)
    },
    presentation: {
      summaryCards: [
        ['實收總金額', 113870],
        ['追續單金額', 699260],
        ['全部總業績', 1253068],
        ['追續單成交', 61]
      ],
      top10: ranking.slice(0, 10).map(r => ({
        rank: r.rank,
        name: r.name,
        group: r.group,
        weightedScore: r.metrics["正式權重分數"],
        movement: r.movement
      }))
    }
  };序。
18、陳百玲（新人）：你有累積，不急著衝，先把成交穩定做出來。
19、鄭珮恩：你分數差距不大，今天先把追續金額補強。
20、謝啟芳：你有成交但分數偏低，今天要先提高客單。
21、陳玲華：你有總業績但缺追續與實收，今天先求有效成交。
22、江沛林：先把追續單與實收補起來，排名才有上升空間。
23、蘇淑玲：今天先求破零，有分數才有派單空間。
24、鄭上官：先解除空白狀態，後續才有排名意義。`;

function parseData() {
  const rankingsSection = rawText.substring(rawText.indexOf("四、正式名次"), rawText.indexOf("五、名次異動"));
  const rankingLines = rankingsSection.split('\n').filter(l => l.match(/^\d+、/));
  
  const adviceSection = rawText.substring(rawText.indexOf("七、每人一句建議"));
  const adviceLines = adviceSection.split('\n').filter(l => l.match(/^\d+、/));

  const movementSection = rawText.substring(rawText.indexOf("五、名次異動"), rawText.indexOf("六、A1／A2／B／C 分級"));
  const groupsSection = rawText.substring(rawText.indexOf("六、A1／A2／B／C 分級"), rawText.indexOf("七、每人一句建議"));

  const ranking = rankingLines.map((line) => {
    const parts = line.split('｜');
    if (parts.length < 7) return null;
    
    const rankMatch = parts[0].match(/^(\d+)、(.*)/);
    const rank = parseInt(rankMatch[1]);
    const name = rankMatch[2].trim();
    
    const getNum = (str) => parseFloat(String(str).replace(/[^0-9.-]/g, '')) || 0;
    
    const score = getNum(parts[1]);
    const realRevenue = getNum(parts[2]);
    const continuationAmt = getNum(parts[3]);
    const totalRev = getNum(parts[4]);
    const ticketAvg = getNum(parts[5]);
    const count = getNum(parts[6]);

    let advice = "";
    const advLine = adviceLines.find(al => al.startsWith(rank + '、' + name));
    if (advLine) advice = advLine.split('：')[1].trim();

    let movement = "flat";
    let prevRank = rank;
    
    const mLines = movementSection.split('\n');
    for (let ml of mLines) {
      if (ml.includes(name) && ml.includes('→')) {
        const mm = ml.match(/(\d+)\s*→\s*(\d+)/);
        if (mm) {
          prevRank = parseInt(mm[1]);
          if (ml.includes('↑')) movement = "up";
          else if (ml.includes('↓')) movement = "down";
        }
      }
    }

    let group = "C";
    if (groupsSection.includes('🔴 A1') && groupsSection.split('🔴 A1')[1].split('🟠 A2')[0].includes(name)) group = "A1";
    else if (groupsSection.includes('🟠 A2') && groupsSection.split('🟠 A2')[1].split('🟡 B組')[0].includes(name)) group = "A2";
    else if (groupsSection.includes('🟡 B組') && groupsSection.split('🟡 B組')[1].split('🟢 C組')[0].includes(name)) group = "B";

    return {
      rank,
      name,
      group,
      totalScore: score,
      prevRank,
      movement,
      actualRevenue: realRevenue,
      renewalRevenue: continuationAmt,
      totalRevenue: totalRev,
      avgRenewal: ticketAvg,
      renewalDeals: count,
      advice
    };
  }).filter(Boolean);

  const snapshot = {
    reportId: 'dispatch_2026_05_04_v1',
    title: 'AI 派單公告｜5/4 結算 → 5/5 正式派單',
    reportDate: '115/05/04',
    dispatchDate: '115/05/05',
    status: 'published',
    auditResult: 'PASS',
    sourceText: rawText,
    rankings: ranking,
    groups: {
        A1: ranking.filter(r => r.group === 'A1').map(r => r.name),
        A2: ranking.filter(r => r.group === 'A2').map(r => r.name),
        B: ranking.filter(r => r.group === 'B').map(r => r.name),
        C: ranking.filter(r => r.group === 'C').map(r => r.name)
    },
    summaryBoard: {
        追續單成交: 61,
        全部總業績: 1253068,
        追續單金額: 699260,
        實收總金額: 113870,
        當日取消退貨: 0
    },
    standardData: {
      公告標題: 'AI 派單公告｜5/4 結算 → 5/5 正式派單',
      日期資訊: {
        結算日: '115/05/04',
        派單日: '115/05/05'
      },
      整合總盤: {
        追續單成交: 61,
        全部總業績: 1253068,
        追續單金額: 699260,
        實收總金額: 113870,
        當日取消退貨: 0
      },
      正式名次: ranking.map(r => ({
        rank: r.rank,
        name: r.name,
        group: r.group,
        totalScore: r.totalScore,
        prevRank: r.prevRank,
        movement: r.movement,
        metrics: {
          實收: r.actualRevenue,
          追續金額: r.renewalRevenue,
          全部總業績: r.totalRevenue,
          追續客單價: r.avgRenewal,
          追續單數: r.renewalDeals
        },
        advice: r.advice,
        isNew: r.name.includes("新人")
      })),
      分級: {
        A1: ranking.filter(r => r.group === 'A1').map(r => r.name),
        A2: ranking.filter(r => r.group === 'A2').map(r => r.name),
        B: ranking.filter(r => r.group === 'B').map(r => r.name),
        C: ranking.filter(r => r.group === 'C').map(r => r.name)
      },
      群組超精簡版: rawText
    },
    presentation: {
      summaryCards: [
        ['追續單成交', 61],
        ['全部總業績', 1253068],
        ['追續單金額', 699260],
        ['實收總金額', 113870]
      ],
      top10: ranking.slice(0, 10).map(r => ({
        rank: r.rank,
        name: r.name,
        group: r.group,
        weightedScore: r.totalScore,
        movement: r.movement
      }))
    }
  };

  return {
    report: snapshot,
    meta: {
      operator: 'system-super',
      savedAt: new Date().toISOString(),
      reason: '5/4 -> 5/5 Final Synchronization'
    }
  };
}

const finalData = parseData();
fs.writeFileSync(path.join(__dirname, 'data/dispatch-reports-v1/latest.json'), JSON.stringify(finalData, null, 2), 'utf8');
console.log('Successfully wrote to data/dispatch-reports-v1/latest.json');
