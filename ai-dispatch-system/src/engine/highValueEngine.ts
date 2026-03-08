// ==========================================
// 人工智慧高價成交爆發系統 - AI 引擎
// 10 維能力分數 + 大單等級 + 建議生成
// ==========================================
import type { Employee } from '../data/mockData';

// ─── 型別定義（對應 7 張資料表） ───

export interface HighValueProfile {
  name: string;
  date: string;
  scores: {
    opening: number;    // 大單開口能力
    courage: number;    // 高價成交膽量
    closing: number;    // 收口強度
    valueExpr: number;  // 價值表達能力
    priceEndure: number;// 價格承壓能力
    rejection: number;  // 拒絕處理能力
    leadDialog: number; // 主導對話能力
    burstPotential: number; // 爆發成交潛力
    bigClient: number;  // 大客戶處理能力
    stability: number;  // 高金額穩定度
  };
  totalScore: number;
  level: string;        // 大單等級
  canLeadBigDeal: boolean;
}

export interface HighValueSuggestion {
  name: string;
  status: string;       // 今日大單狀態
  courageLevel: string; // 今日高價膽量
  suggestion: string;
  pressure: string;
  motivation: string;
  bestClientType: string;
  bestPriceDirection: string;
  closeRequirement: string;
}

export interface CustomerOpportunity {
  clientName: string;
  closeProbability: number;
  repurchaseProbability: number;
  predictedOrderValue: number;
  isBigDealChance: boolean;
  bestEmployee: string;
  bestTimeSlot: string;
  suggestion: string;
}

export interface HighValueAlert {
  name: string;
  alertType: string;
  content: string;
  severity: '高' | '中' | '低';
  action: string;
}

// ─── 10 維能力計算 ───

export function analyzeHighValueAbility(employees: Employee[]): HighValueProfile[] {
  const maxTotal = Math.max(...employees.map(e => e.total), 1);
  const maxRenewal = Math.max(...employees.map(e => e.renewals), 1);
  const maxFollowUp = Math.max(...employees.map(e => e.followUps), 1);

  return employees.map(emp => {
    const avgOrderValue = emp.followUps > 0 ? emp.total / emp.followUps : 0;
    const maxAvg = maxTotal / Math.max(maxFollowUp, 1);
    const renewalRate = emp.total > 0 ? emp.renewals / emp.total : 0;

    // 各維度分數（0~100）
    const opening = Math.min(100, Math.round((avgOrderValue / Math.max(maxAvg, 1)) * 85 + (emp.followUps > 5 ? 15 : emp.followUps * 3)));
    const courage = Math.min(100, Math.round((emp.total / maxTotal) * 70 + (avgOrderValue > 20000 ? 30 : avgOrderValue / 20000 * 30)));
    const closing = Math.min(100, Math.round(renewalRate * 80 + (emp.actual / Math.max(emp.total, 1)) * 20));
    const valueExpr = Math.min(100, Math.round((emp.renewals / maxRenewal) * 60 + (emp.followUps / maxFollowUp) * 40));
    const priceEndure = Math.min(100, Math.round((avgOrderValue / Math.max(maxAvg, 1)) * 70 + (emp.total > 100000 ? 30 : emp.total / 100000 * 30)));
    const rejection = Math.min(100, Math.round((emp.followUps / maxFollowUp) * 50 + (renewalRate > 0.5 ? 50 : renewalRate * 100)));
    const leadDialog = Math.min(100, Math.round((emp.total / maxTotal) * 60 + (emp.followUps / maxFollowUp) * 40));
    const burstPotential = Math.min(100, Math.round((avgOrderValue / Math.max(maxAvg, 1)) * 50 + (emp.total / maxTotal) * 30 + (emp.followUps > 8 ? 20 : emp.followUps * 2.5)));
    const bigClient = Math.min(100, Math.round((avgOrderValue > 25000 ? 60 : avgOrderValue / 25000 * 60) + (emp.total > 200000 ? 40 : emp.total / 200000 * 40)));
    const stability = Math.min(100, Math.round((emp.actual / Math.max(emp.total, 1)) * 100));

    const scores = { opening, courage, closing, valueExpr, priceEndure, rejection, leadDialog, burstPotential, bigClient, stability };
    const totalScore = Math.round(Object.values(scores).reduce((s, v) => s + v, 0) / 10);

    // 大單等級
    let level = '需強化訓練';
    let canLeadBigDeal = false;
    if (totalScore >= 80) { level = '爆發大單主攻手'; canLeadBigDeal = true; }
    else if (totalScore >= 65) { level = '高價穩定手'; canLeadBigDeal = true; }
    else if (totalScore >= 45) { level = '潛力培養中'; }

    return { name: emp.name, date: '3/8', scores, totalScore, level, canLeadBigDeal };
  }).sort((a, b) => b.totalScore - a.totalScore);
}

// ─── 個人建議生成 ───

export function generateHighValueSuggestions(profiles: HighValueProfile[], employees: Employee[]): HighValueSuggestion[] {
  return profiles.map(p => {
    const emp = employees.find(e => e.name === p.name);
    const s = p.scores;
    const weakest = Object.entries(s).sort((a, b) => a[1] - b[1])[0];
    const strongest = Object.entries(s).sort((a, b) => b[1] - a[1])[0];

    const status = p.canLeadBigDeal ? '主攻' : p.totalScore >= 45 ? '輔攻' : '練習';
    const courageLevel = s.courage >= 80 ? '高' : s.courage >= 50 ? '中' : '低';

    // 建議
    let suggestion = '';
    if (s.opening < 50) suggestion = '今天最重要的事：敢開口報高價。不開口，大單永遠不會是你的。';
    else if (s.closing < 50) suggestion = '你敢開口但收不住，今天重點練收口：報價後不要自己先退。';
    else if (p.canLeadBigDeal) suggestion = '今天要先把價值講滿，再談價格。你有能力收大單，別浪費。';
    else suggestion = '今天跟著節奏走，遇到高價客戶不要怕，練習開口就是進步。';

    // 壓力
    let pressure = '';
    if (courageLevel === '低') pressure = '你若不敢開口，大單就永遠不會是你的。別人敢講你不敢，位置只會越來越後面。';
    else if (status === '輔攻') pressure = '你有潛力但還不夠穩，今天不突破就會一直卡在中段。';
    else pressure = '你已經在前段了，但不爆發就會被後面追上。今天不是守，是攻。';

    // 激勵
    let motivation = '';
    if (p.canLeadBigDeal) motivation = '你敢開價、敢收口、敢主導，今天就有機會爆發大單！';
    else if (p.totalScore >= 45) motivation = '你離爆發只差一步，今天收一筆高客單就能翻身！';
    else motivation = '每一通都是機會，今天只要敢開一次口，就是進步！';

    // 主攻方向
    const bestClientType = s.bigClient >= 60 ? '高價值客戶、續單客戶' : s.rejection >= 60 ? '猶豫型客戶、回撥客戶' : '新客戶、小單客戶（練膽量）';
    const bestPriceDirection = s.valueExpr >= 60 ? '效果、穩定度、後續價值' : s.priceEndure >= 60 ? '價格比較、CP 值' : '基礎方案、入門價格';

    const closeRequirement = courageLevel === '高'
      ? '不膽怯、不退縮、不虛弱，直接穩定收口。'
      : courageLevel === '中'
      ? '報價後停三秒，讓客戶思考，不要急著降價。'
      : '先練習把價格說出口，不管客戶反應如何，不要自己先打折。';

    return { name: p.name, status, courageLevel, suggestion, pressure, motivation, bestClientType, bestPriceDirection, closeRequirement };
  });
}

// ─── 異常告警 ───

export function detectHighValueAlerts(profiles: HighValueProfile[]): HighValueAlert[] {
  const alerts: HighValueAlert[] = [];
  for (const p of profiles) {
    if (p.scores.courage < 30) {
      alerts.push({ name: p.name, alertType: '高價膽量偏低', content: `${p.name} 遇到高客單價客戶時，收口語氣明顯偏弱（膽量分數 ${p.scores.courage}）。`, severity: '高', action: '立即安排高價收口訓練' });
    }
    if (p.scores.closing < 30) {
      alerts.push({ name: p.name, alertType: '收口強度不足', content: `${p.name} 報價後容易自己先退縮（收口分數 ${p.scores.closing}）。`, severity: '高', action: '安排收口強化密集訓練' });
    }
    if (p.scores.opening >= 70 && p.scores.closing < 40) {
      alerts.push({ name: p.name, alertType: '開口強但收不住', content: `${p.name} 敢開口但收口弱（開口 ${p.scores.opening} vs 收口 ${p.scores.closing}），大單容易跑掉。`, severity: '中', action: '針對收口環節做模擬訓練' });
    }
  }
  return alerts;
}

// ─── 團隊喊話生成 ───

export function generateTeamRally(profiles: HighValueProfile[], version: '主管版' | '精簡版'): string {
  const topAttacker = profiles.find(p => p.canLeadBigDeal);
  const weakest = profiles[profiles.length - 1];
  const bigDealCount = profiles.filter(p => p.canLeadBigDeal).length;

  if (version === '精簡版') {
    return `今天不是比誰講得多，今天是比誰敢拿大單。\n全隊 ${profiles.length} 人，${bigDealCount} 人可主攻大單。\n敢開口、敢收口、敢主導，今天就有機會爆發。`;
  }

  return `📣 今日高價成交團隊喊話（主管版）\n\n` +
    `今天不是比誰講得多，今天是比誰敢拿大單。\n\n` +
    `全隊 ${profiles.length} 人，${bigDealCount} 人已具備主攻大單能力。\n` +
    `今日最強主攻手：${topAttacker?.name}（總分 ${topAttacker?.totalScore}）\n` +
    `今日最需突破的：${weakest?.name}（總分 ${weakest?.totalScore}）\n\n` +
    `規則很簡單：\n` +
    `1. 遇到高價客戶，價值先講滿，價格後面談\n` +
    `2. 報價後不要自己先退，停三秒讓客戶思考\n` +
    `3. 收口要穩，不膽怯、不退縮、不虛弱\n` +
    `4. 今天每個人至少開一次高價口\n\n` +
    `敢開口的人，大單才會找上你。\n不敢開口的人，永遠只能吃別人剩的。\n\n` +
    `今天，全隊一起爆發。`;
}
