const fs = require('fs');
const path = require('path');
const { OFFICIAL_0503_TO_0504 } = require('./shared/official-0503-to-0504');

// 轉換為前端所需的結構 (Snapshot 格式)
function toFrontendSnapshot(official) {
  return {
    executionId: '20260504132244',
    title: official.groupShortText.split('】')[0].replace('📣【', '') + '】',
    reportDate: official.reportDate,
    dispatchDate: official.dispatchDate,
    persisted: true,
    status: '通過',
    validation: {
      status: 'PASS',
      summary: {
        審計結果: official.auditResult,
        正式人數: official.ranking.length,
        離職列示人數: 0,
        本月業績: official.overallStats.monthlyRevenue
      },
      errors: [],
      warnings: official.platforms['民視產品'].note ? [official.platforms['民視產品'].note] : []
    },
    standardData: {
      公告標題: official.groupShortText.split('】')[0].replace('📣【', '') + '】',
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
        名次: r.rank,
        姓名: r.name,
        分級: r.group,
        正式權重分數: r.totalScore,
        metrics: {
          實收: r.actualRevenue,
          追續金額: r.renewalRevenue,
          全部總業績: r.totalRevenue,
          追續客單價: r.avgRenewal,
          追續單數: r.renewalDeals
        },
        建議: r.advice
      })),
      分級: official.groups,
      群組超精簡版: official.groupShortText
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
        actualRevenue: r.actualRevenue
      })),
      groups: official.groups
    },
    scoringPolicy: {
      title: 'AI 權重分數 (比例原則)',
      description: '本輪以 5/3 業績比例換算權重分數。',
      weights: [
        { key: 'actualRevenue', label: '實收總業績', weight: 3000 },
        { key: 'renewalRevenue', label: '追續單金額', weight: 2500 },
        { key: 'totalRevenue', label: '全部總金額', weight: 1500 },
        { key: 'avgRenewal', label: '追續客單價', weight: 1500 },
        { key: 'renewalDeals', label: '追續單數量', weight: 1500 }
      ],
      formula: '正式權重分數 = 實收比例*3000 + 追續金額比例*2500 + 全部總額比例*1500 + 客單價比例*1500 + 追續單數比例*1500'
    }
  };
}

const snapshot = toFrontendSnapshot(OFFICIAL_0503_TO_0504);
const targetPath = path.join(__dirname, 'data', 'dispatch-reports-v1', 'latest.json');

fs.writeFileSync(targetPath, JSON.stringify(snapshot, null, 2), 'utf-8');
console.log('Successfully synced 5/3 performance to latest.json');
