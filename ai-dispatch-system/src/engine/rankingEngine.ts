import type { ParsedDetail, RankedEmployee, GroupCode, Announcements } from '../types/report';

/**
 * 整合排名：依【總業績】→【續單】→【追單】排序
 */
export function generateRankings(
  details: ParsedDetail[],
  a1Count = 4, a2Count = 5, bCount = 8
): RankedEmployee[] {
  const sorted = [...details]
    .filter(d => d.employeeRole !== '停用')
    .sort((a, b) => {
      if (b.revenue !== a.revenue) return b.revenue - a.revenue;
      if (b.followAmount !== a.followAmount) return b.followAmount - a.followAmount;
      if (b.dispatchDeals !== a.dispatchDeals) return b.dispatchDeals - a.dispatchDeals;
      return 0;
    });

  return sorted.map((d, i) => {
    const rank = i + 1;
    let groupCode: GroupCode;
    if (rank <= a1Count) groupCode = 'A1';
    else if (rank <= a1Count + a2Count) groupCode = 'A2';
    else if (rank <= a1Count + a2Count + bCount) groupCode = 'B';
    else groupCode = 'C';

    return {
      employeeName: d.employeeName,
      dispatchDeals: d.dispatchDeals,
      followAmount: d.followAmount,
      totalRevenue: d.revenue,
      totalActual: d.actual,
      cancelReturn: d.cancelReturn,
      ranking: rank,
      groupCode,
      isNew: d.employeeRole === '新人',
      suggestion: generateSuggestion(d, rank, groupCode),
    };
  });
}

function generateSuggestion(d: ParsedDetail, rank: number, group: GroupCode): string {
  const name = d.employeeName;
  const follow = d.followAmount.toLocaleString();
  const dispatch = d.dispatchDeals;

  if (group === 'A1') {
    if (d.cancelReturn > 0) return `把【追單】${dispatch}筆和【續單】${follow}優先收口，直接把第${rank}名拉開；站在A1就不能鬆。`;
    return `🔥 把【追單】${dispatch}筆和【續單】${follow}加快轉成【實收】，穩住A1位置。`;
  }
  if (group === 'A2') {
    if (d.followAmount > 100000) return `💪 用【續單】${follow}把實收做厚，再補【追單】深度；A2不是安全區，是衝刺區。`;
    return `💪 把【追單】${dispatch}筆變現，讓【續單】${follow}穩定落袋；你現在就在A1門口，不能拖。`;
  }
  if (group === 'B') {
    if (d.followAmount === 0 && d.dispatchDeals === 0) return `📈 先補【追單】和實收節奏，不要讓總業績停住；不往前追就會被後段逼近。`;
    if (d.followAmount > 0) return `📈 把【續單】${follow}做厚，讓【總業績】穩穩往上；你追回續單，隔天位置就會升。`;
    return `📈 把【追單】${dispatch}變成【實收】速度，不要拖；拖一天就掉一天。`;
  }
  // C 組
  if (d.employeeRole === '新人') return `⚡ 先把第一筆【追單】變成真正【實收】，建立節奏最重要；新人最怕空轉。`;
  if (d.revenue < 10000) return `⚡ 先求一筆【實收】破蛋，把【續單】落袋；不落袋就會一直停在後段。`;
  return `⚡ 把【追單】${dispatch}筆變【實收】，續單不要漏；再不擴就只能補位。`;
}

/**
 * 產生各版本公告
 */
export function generateAnnouncements(
  date: string,
  rankings: RankedEmployee[],
  platform: string
): Announcements {
  const a1 = rankings.filter(r => r.groupCode === 'A1');
  const a2 = rankings.filter(r => r.groupCode === 'A2');
  const b = rankings.filter(r => r.groupCode === 'B');
  const c = rankings.filter(r => r.groupCode === 'C');

  const rules = `📌 執行規則（鎖死）：\n照順序派。前面全忙，才往後。\n不得指定。不得跳位。\n同客戶回撥，優先回原承接人。`;

  const nextDay = getNextDayStr(date);

  // ── 完整版 ──
  const fullText = [
    `# 📣【AI 派單公告｜${date} 結算 → ${nextDay} 派單順序】`,
    ``,
    `## 今日整合名次（依【總業績】→【續單】→【追單】排序）`,
    ``,
    ...rankings.map(r => {
      const newTag = r.isNew ? '（新人）' : '';
      return `${r.ranking}、${r.employeeName}${newTag}｜【追單】${r.dispatchDeals}｜【續單】${r.followAmount.toLocaleString()}｜【總業績】${r.totalRevenue.toLocaleString()}｜【實收】${r.totalActual.toLocaleString()}`;
    }),
    ``,
    `---`,
    ``,
    `## ${nextDay} 明日 AI 派單順序`,
    ``,
    `### 🔴 A1｜高單主力`,
    ...a1.map(r => `${r.ranking}. ${r.employeeName}`),
    ``,
    `### 🟠 A2｜續單收割`,
    ...a2.map(r => `${r.ranking}. ${r.employeeName}`),
    ``,
    `### 🟡 B 組｜一般量單`,
    ...b.map(r => `${r.ranking}. ${r.employeeName}`),
    ``,
    `### 🟢 C 組｜補位樓梯／觀察培養`,
    ...c.map(r => `${r.ranking}. ${r.employeeName}${r.isNew ? '（新人）' : ''}`),
    ``,
    `---`,
    ``,
    `## 執行規則（鎖死）`,
    ``,
    `**照順序派。**`,
    `**前面全忙，才往後。**`,
    `**不得指定。**`,
    `**不得跳位。**`,
    `**同客戶回撥，優先回原承接人。**`,
    ``,
    `---`,
    ``,
    `## 每人一句：建議＋壓力＋激勵`,
    ``,
    ...rankings.map(r => `${r.employeeName}：${r.suggestion}`),
    ``,
    `---`,
    ``,
    `**看完請回 +1。**`,
  ].join('\n');

  // ── LINE 精簡版 ──
  const lineText = [
    `📊 ${date} → ${nextDay} 派單公告`,
    ``,
    `🏆 整合名次：`,
    ...rankings.map(r => `${r.ranking}. ${r.employeeName} $${r.totalRevenue.toLocaleString()}`),
    ``,
    `🔴A1：${a1.map(r => r.employeeName).join('、')}`,
    `🟠A2：${a2.map(r => r.employeeName).join('、')}`,
    `🟡B：${b.map(r => r.employeeName).join('、')}`,
    `🟢C：${c.map(r => r.employeeName).join('、')}`,
    ``,
    rules,
    `✅ 看完請回 +1`,
  ].join('\n');

  // ── 20秒超短版 ──
  const shortText = [
    `📊 ${date}→${nextDay} 派單`,
    `1.${rankings[0]?.employeeName ?? '-'} 2.${rankings[1]?.employeeName ?? '-'} 3.${rankings[2]?.employeeName ?? '-'}`,
    `A1：${a1.map(r => r.employeeName).join('/')}`,
    `照順序派，回+1`,
  ].join('\n');

  // ── 播報版 ──
  const broadcastText = [
    `各位同仁，以下是${date}結算，${nextDay}的派單公告。`,
    ...rankings.slice(0, 5).map(r => `排名第${r.ranking}：${r.employeeName}，總業績${r.totalRevenue.toLocaleString()}元。`),
    `明日優先派單組A1：${a1.map(r => r.employeeName).join('、')}。`,
    `請各位依照規定順序承接，不得指定跳位。謝謝。`,
  ].join('\n');

  // ── 主管威壓版 ──
  const managerText = [
    `⚠️ ${date} 結算 → ${nextDay} 主管通報`,
    ``,
    `📊 今日排名已出，以下是最嚴格的執行要求：`,
    ``,
    ...rankings.map(r => `第${r.ranking}名 ${r.employeeName} $${r.totalRevenue.toLocaleString()} ${r.groupCode}`),
    ``,
    `🚨 執行紀律：`,
    `❶ 嚴格照表派單，違者記錄`,
    `❷ A1 有單必接，拒接扣分`,
    `❸ C 組今日必須至少出 1 單`,
    `❹ 退貨率超標者明日降級`,
    ``,
    `沒有例外，沒有藉口。執行！`,
  ].join('\n');

  return { fullText, lineText, shortText, broadcastText, managerText };
}

function getNextDayStr(dateStr: string): string {
  try {
    const parts = dateStr.match(/(\d+)\/(\d+)/);
    if (parts) {
      const month = parseInt(parts[1]);
      const day = parseInt(parts[2]);
      return `${month}/${day + 1}`;
    }
    // Try ISO format
    const d = new Date(dateStr);
    d.setDate(d.getDate() + 1);
    return `${d.getMonth() + 1}/${d.getDate()}`;
  } catch {
    return dateStr;
  }
}
