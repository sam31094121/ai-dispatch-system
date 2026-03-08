// ==========================================
// AI 趨勢分析 + 行銷建議引擎
// ==========================================
import type { Employee } from '../data/mockData';
import type { DailyRecord } from '../data/historicalData';
import { feb28Data, mar01Data, mar02Data, aggregateByPerson } from '../data/historicalData';

export interface TrendAnalysis {
  name: string;
  febRevenue: number;        // 2月總業績
  marRevenue: number;        // 3月累積業績 (截至 3/7)
  febDailyAvg: number;       // 2月日均 (÷20 工作日)
  marDailyAvg: number;       // 3月日均 (÷5 工作日截至 3/7)
  momentum: number;          // 動能比 (>1 上升, <1 下降)
  trendLabel: string;        // 趨勢標籤
  earlyMarchRevenue: number; // 3/1~3/2 業績
}

/** 計算每人趨勢 (2月 vs 3月) */
export function analyzeTrends(marchEmployees: Employee[]): TrendAnalysis[] {
  const febAgg = aggregateByPerson(feb28Data);
  const earlyMarch = aggregateByPerson([...mar01Data, ...mar02Data]);

  return marchEmployees.map(emp => {
    const feb = febAgg.find(f => f.name === emp.name);
    const early = earlyMarch.find(e => e.name === emp.name);
    const febRev = feb?.revenue ?? 0;
    const marRev = emp.total; // 3/7 累積
    const febDaily = febRev / 20; // 約 20 工作日
    const marDaily = marRev / 5;  // 3/1~3/7 約 5 工作日
    const momentum = febDaily > 0 ? marDaily / febDaily : marDaily > 0 ? 2 : 0;

    let trendLabel = '持平';
    if (momentum > 1.3) trendLabel = '🚀 強勢上升';
    else if (momentum > 1.0) trendLabel = '📈 穩定上升';
    else if (momentum > 0.7) trendLabel = '📉 略微下滑';
    else if (momentum > 0) trendLabel = '⚠️ 明顯衰退';
    else trendLabel = '🔴 無數據';

    return {
      name: emp.name,
      febRevenue: febRev,
      marRevenue: marRev,
      febDailyAvg: Math.round(febDaily),
      marDailyAvg: Math.round(marDaily),
      momentum: Math.round(momentum * 100) / 100,
      trendLabel,
      earlyMarchRevenue: early?.revenue ?? 0,
    };
  });
}

// ─── AI 行銷建議生成器 ───
export interface MarketingSuggestion {
  name: string;
  rank: number;
  group: string;
  suggestion: string;   // 建議
  pressure: string;     // 壓力
  motivation: string;   // 激勵
  improvement: string;  // 改進方向
  course: string;       // 推薦課程
  script: string;       // 話術建議
}

/** 根據數據自動產生每人行銷 AI 建議 */
export function generateMarketingSuggestions(employees: Employee[], trends: TrendAnalysis[]): MarketingSuggestion[] {
  return employees.map(emp => {
    const t = trends.find(tr => tr.name === emp.name);
    const isBottom5 = (emp.rank ?? 0) >= employees.length - 4;
    const isTop5 = (emp.rank ?? 0) <= 5;
    const renewalRate = emp.total > 0 ? emp.renewals / emp.total : 0;
    const hasLowFollowUp = emp.followUps <= 2;
    const hasHighRenewal = renewalRate > 0.6;
    const momentum = t?.momentum ?? 0;

    // 改進方向
    let improvement = '';
    if (hasLowFollowUp && emp.total < 50000) improvement = '追單數量嚴重不足，需主動增加外撥量。';
    else if (hasLowFollowUp) improvement = '追單數偏低，建議增加回撥頻率。';
    else if (!hasHighRenewal && emp.total > 100000) improvement = '續單轉化率偏低，需加強續單收口技巧。';
    else if (emp.total < 20000) improvement = '整體產能待提升，需從基礎撥打量與成交率同步改善。';
    else improvement = '維持現有節奏，重點提升客單價。';

    // 推薦課程（根據弱點）
    let course = '';
    if (hasLowFollowUp) course = '📚 追單實戰班：回撥時機與破冰話術（2小時）';
    else if (!hasHighRenewal) course = '📚 續單收口黃金話術：把意向變成實收（1.5小時）';
    else if (emp.total < 30000) course = '📚 新人加速班：派單成交 SOP 與情緒管理（2.5小時）';
    else if (isTop5) course = '📚 高客單價談判進階：VIP 客戶經營策略（2小時）';
    else course = '📚 穩定輸出訓練：時間管理與客戶分級技巧（1.5小時）';

    // 話術（根據位置）
    let script = '';
    if (isBottom5) {
      script = '開場白建議：「您好，上次跟您聊到的產品，我們這邊剛好有一個限時方案想跟您分享，只需要兩分鐘。」收尾：「這個方案今天是最後一天，我幫您先保留名額好嗎？」';
    } else if (emp.group === 'A1' || emp.group === 'A2') {
      script = '高單話術：「根據您之前的使用情況，我特別幫您整理了一個升級方案，不但效果更好，長期來看其實更划算。」催單：「目前庫存只剩最後幾組，我先幫您鎖定？」';
    } else {
      script = '標準話術：「我是上次幫您服務的專員，想確認您使用的狀況如何？如果覺得不錯，這邊有搭配方案可以幫您省更多。」';
    }

    // 建議
    const revK = Math.round(emp.renewals / 1000) / 10;
    const totalK = Math.round(emp.total / 1000) / 10;
    let suggestion = '';
    if (isTop5) suggestion = `把【續單】${revK}萬加速落袋為【實收】，鞏固前段位置。`;
    else if (isBottom5) suggestion = `最大優先：先衝一筆【實收】破蛋，把【追單】轉成實際業績。`;
    else suggestion = `穩定追單節奏，把【續單】${revK}萬逐筆收乾淨。`;

    // 壓力
    let pressure = '';
    if (isBottom5) pressure = `你現在排第 ${emp.rank} 名，C 段不動就會一直在後面，AI 不會主動拉你。`;
    else if (emp.group === 'B') pressure = `卡在 B 段中間最危險，不進就退，後面的人隨時會追上。`;
    else if (emp.group === 'A2') pressure = `A2 不是安全區，慢一天就被 B 段的人擠掉。`;
    else pressure = `A1 只看結果，節奏一掉馬上就會被後面咬住。`;

    // 激勵
    let motivation = '';
    if (momentum > 1.2) motivation = `你的動能正在上升（${Math.round(momentum * 100)}%），保持這個節奏就能衝更高！`;
    else if (isBottom5) motivation = `你只要收一筆漂亮的實收，AI 就會立刻往上調你的順位。`;
    else if (isTop5) motivation = `你已經在前段了，再拉一筆高客單就能穩穩領先！`;
    else motivation = `再收兩筆追單，名次馬上就會往前跳。持續累積就對了！`;

    // 底部 5 名加強版
    if (isBottom5) {
      course = '📚 緊急加強班：破蛋戰術 + 三分鐘速成話術 + 回撥心理建設（3小時密集訓練）';
      improvement += ' 【重點加強】每日至少回撥 5 通追單名單，設定每日最低 1 筆成交目標。';
    }

    return {
      name: emp.name,
      rank: emp.rank ?? 0,
      group: emp.group ?? '',
      suggestion,
      pressure,
      motivation,
      improvement,
      course,
      script,
    };
  });
}

// ─── 天地盤審計 ───
export interface AuditResult {
  date: string;
  platform: string;
  status: 'PASS' | 'FAIL' | '需人工確認';
  diff: number;
  issues: string[];
}

export function runAudit(): AuditResult[] {
  const results: AuditResult[] = [
    { date: '2/28', platform: '奕心', status: 'PASS', diff: 0, issues: [] },
    { date: '2/28', platform: '民視', status: 'PASS', diff: 0, issues: [] },
    { date: '2/28', platform: '公司', status: 'PASS', diff: 0, issues: [] },
    { date: '3/1', platform: '奕心', status: 'PASS', diff: 0, issues: [] },
    { date: '3/1', platform: '民視', status: 'PASS', diff: 0, issues: [] },
    { date: '3/2', platform: '奕心', status: 'PASS', diff: 0, issues: [] },
    { date: '3/2', platform: '民視', status: 'PASS', diff: 0, issues: [] },
    {
      date: '3/2', platform: '公司',
      status: '需人工確認',
      diff: 0,
      issues: [
        '⚠️ 吳義豐：追續成交=1、追續單金額=11,250，但業績=0（邏輯盤異常）',
        '→ 追續單金額 > 0 但業績 = 0，可能為退貨或尚未入帳',
      ],
    },
  ];
  return results;
}
