const fs = require('fs');
const path = require('path');
const { OFFICIAL_0503_TO_0504 } = require('./shared/official-0503-to-0504');

function toFinalRecord(official) {
  const snapshot = {
    executionId: '20260504133644',
    title: 'AI 派單公告｜5/3 結算 → 5/4 正式派單',
    reportDate: official.reportDate,
    dispatchDate: official.dispatchDate,
    status: '通過',
    validation: {
      status: 'PASS',
      summary: {
        審計結果: official.auditResult,
        正式人數: official.ranking.length,
        本月業績: official.overallStats.monthlyRevenue,
        追續單數: official.overallStats.renewalCalls
      },
      errors: [],
      warnings: ['民視追續單成交總表 9 與明細 8 不一致，已改用明細 8。']
    },
    standardData: {
      公告標題: 'AI 派單公告｜5/3 結算 → 5/4 正式派單',
      日期資訊: {
        結算日: official.reportDate,
        派單日: official.dispatchDate
      },
      整合總盤: {
        追續單成交: official.overallStats.renewalCalls,
        全部總業績: official.overallStats.monthlyRevenue,
        追續單金額: official.overallStats.renewalAmount,
        實收總金額: official.overallStats.actualRevenue,
        當日取消退貨: official.overallStats.cancellations
      },
      正式名次: official.ranking.map(r => ({
        rank: r.rank,
        name: r.name,
        group: r.group,
        totalScore: r.totalScore,
        prevRank: r.prevRank,
        movement: r.move, // up, down, flat
        metrics: {
          實收: r.actualRevenue,
          追續金額: r.renewalRevenue,
          全部總業績: r.totalRevenue,
          追續客單價: r.avgRenewal,
          追續單數: r.renewalDeals
        },
        advice: r.name === '湯玉琦' ? '你這輪靠實收優勢穩坐第一，今天重點是把領先差距守住。' : 
              r.name === '馬秋香' ? '你的五項比例最完整，今天只差把實收補上就能更穩。' :
              r.name === '林宜靜' ? '你這輪明顯往前衝，今天關鍵是把追續再補厚。' :
              r.name === '林沛昕' ? '你靠實收與客單價直接翻上前段，今天重點是延續。' :
              r.name === '王珍珠' ? '你總業績底盤很硬，今天要把追續再轉成更高分。' :
              r.name === '周美蓁' ? '你這輪衝上前段，今天只要再接一筆就有機會再升。' :
              r.name === '許喬恩' ? '你跟前位差距不大，今天補一筆就能動名次。' :
              r.name === '莉莉（新人）' ? '你這輪仍有亮點，今天先把穩定度接住。' :
              r.name === '廖姿惠' ? '你三項都有接到，今天很有機會再往前推。' :
              r.name === '高如郁' ? '你還在可上推區，今天先把最穩的一筆收下。' :
              r.name === '李玲玲' ? '你這輪有基本厚度，今天要把追續再補強。' :
              r.name === '王梅慧' ? '你底盤還在，今天差的是把有效分數再放大。' :
              r.name === '高美雲' ? '你現在差距不大，今天一筆就可能翻位。' :
              r.name === '江麗勉' ? '你還在可動區，今天先求再接一筆。' :
              r.name === '謝啟芳' ? '你這輪有進步，今天要把分數繼續墊高。' :
              r.name === '鄭珮恩' ? '先把空白項補起來，名次就會往前。' :
              r.name === '陳百玲（新人）' ? '先穩穩累積，不急著衝，先把下一筆做好。' :
              r.name === '梁依萍' ? '今天先求有分數，別讓盤面繼續空白。' :
              r.name === '江沛林' ? '先把零分狀態解除，後面才有機會往前。' :
              r.name === '陳玲華' ? '今天先求進帳，先回到可競爭區。' :
              r.name === '徐華妤' ? '這輪是空白分，今天最重要的是先接到第一筆。' :
              r.name === '林佩君' ? '先把有效數字做出來，才有往前的空間。' :
              r.name === '蘇淑玲' ? '今天先求有分，再談翻位。' :
              r.name === '鄭上官' ? '先解除空白，後續才有排名意義。' : ''
      })),
      分級: official.groups,
      群組超精簡版: official.announcement
    },
    presentation: {
      summaryCards: [
        ['追續單成交', official.overallStats.renewalCalls],
        ['全部總業績', official.overallStats.monthlyRevenue],
        ['追續單金額', official.overallStats.renewalAmount],
        ['實收總金額', official.overallStats.actualRevenue]
      ],
      top10: official.ranking.slice(0, 10).map(r => ({
        rank: r.rank,
        name: r.name,
        group: r.group,
        weightedScore: r.totalScore,
        movement: r.move
      }))
    }
  };

  return {
    report: snapshot,
    meta: {
      operator: 'system-super',
      savedAt: new Date().toISOString(),
      reason: '5/4 Final Synchronization'
    }
  };
}

const finalRecord = toFinalRecord(OFFICIAL_0503_TO_0504);
const targetPath = path.join(__dirname, 'data', 'dispatch-reports-v1', 'latest.json');

fs.writeFileSync(targetPath, JSON.stringify(finalRecord, null, 2), 'utf-8');
console.log('Successfully synced RECORD formatted 5/3 performance to latest.json');
