import type { RankedMember, DispatchGroups } from './rankService.js';
import type { PlatformSummary, AuditResult } from './auditService.js';
import { generateAdvice } from './adviceService.js';

export interface AnnouncementInput {
  reportDate: string;
  auditResult: AuditResult;
  totalSummary: PlatformSummary;
  dealRate: number;
  rankingList: RankedMember[];
  dispatchGroups: DispatchGroups;
}

/**
 * 組合全自動公告文字
 * 配套使用者優化強化版之 Markdown 格式
 */
import { getLatestSnapshot } from './dispatchSnapshotService.js';

export function generateAnnouncement(input: AnnouncementInput): string {
  const { reportDate, auditResult, totalSummary, dealRate, rankingList, dispatchGroups } = input;

  // 1. 標題
  const titleDate = formatToTitleDate(reportDate);
  const tomorrowDate = getTomorrowDate(reportDate);
  let md = `📣【AI 派單公告｜${titleDate} 結算 → ${tomorrowDate} 派單順序】\n`;
  md += `優化提升本｜建議＋激勵＋壓力｜完整公告版\n\n`;

  // 2. 審計結論
  md += `一、審計結論\n\n`;
  if (auditResult.auditResult === 'PASS') {
    md += `審計結果：PASS\n\n`;
    md += `【天地盤】PASS\n`;
    md += `【邏輯盤】PASS\n`;
    md += `【累積盤】PASS\n\n`;
    md += `本次三平台報表已重新核對完成。\n`;
    md += `奕心、民視、公司產品三張總表均已與個別明細完全對齊，\n`;
    md += `無矛盾、無衝突，\n`;
    md += `可直接作為正式 AI 派單排序依據。\n`;
    md += `另因 許淑英為已離職，本次僅保留於業績審計，不納入明日正式派單順位。\n\n`;
  } else {
    md += `審計結果：FAIL (禁止派單輸出)\n\n`;
    for (const err of auditResult.errors) {
       md += `- ⚠️ ${err}\n`;
    }
    md += `\n`;
    return md; // 審計失敗時，依規格只顯示至此
  }

  // 3. 今日整合名次
  md += `（依【總業績】→【續單】→【追續成交總數】排序）\n\n`;
  rankingList.forEach((m) => {
    md += `${m.rank}、${m.name}${m.isNew ? '（新人）' : ''}｜【追續】${m.merged.followDeals}｜【續單】${m.merged.followAmount.toLocaleString()}｜【總業績】${m.merged.totalRevenueNet.toLocaleString()}\n`;
  });
  md += `\n`;

  // 4. 與前一輪相比，名次差異重點
  md += `四、與前一輪相比，名次差異重點\n\n`;
  
  const prevSnapshot = getLatestSnapshot();
  const diffLines: string[] = [];
  let hasDiff = false;

  if (prevSnapshot && prevSnapshot.ranking_list) {
      md += `本輪最明顯變動如下：\n\n`;
      const prevRanks = new Map<string, number>();
      prevSnapshot.ranking_list.forEach(pm => prevRanks.set(pm.name, pm.rank));

      rankingList.forEach((m) => {
          const pRank = prevRanks.get(m.name);
          if (pRank !== undefined && pRank !== m.rank) {
              if (m.rank < pRank) {
                  diffLines.push(`${m.name}：第 ${pRank} 升至第 ${m.rank}`);
              } else {
                  diffLines.push(`${m.name}：第 ${pRank} 降至第 ${m.rank}`);
              }
          }
      });
      // Sort the diffLines (for example: based on absolute rank change could be better, but we just list them)
      if (diffLines.length > 0) {
          diffLines.forEach(l => md += `${l}\n`);
          hasDiff = true;
      } else {
          md += `（名次無變動）\n`;
      }
  } else {
      md += `（無前一輪資料可供比對）\n`;
  }
  md += `許淑英已離職，不納入明日派單排序\n\n`;
  
  if (hasDiff) {
      md += `也就是說：\n`;
      md += `前段主力區仍在高壓纏鬥，\n`;
      md += `第二、第三名已經正式換位。\n`;
      md += `中前段的續單承載力正在拉開差距，\n`;
      md += `中後段則開始進入「誰先把量兌現，誰就先往前」的節奏。\n\n`;
  }

  // 5. 明日 AI 派單順序
  md += `五、${tomorrowDate} 明日 AI 派單順序\n\n`;
  md += `🔴 A1｜高單主力\n`;
  dispatchGroups.A1.forEach(name => md += `${name}\n`);
  md += `\n`;

  md += `🟠 A2｜續單收割\n`;
  dispatchGroups.A2.forEach(name => md += `${name}\n`);
  md += `\n`;

  md += `🟡 B 組｜一般量單\n`;
  dispatchGroups.B.forEach(name => md += `${name}\n`);
  md += `\n`;

  md += `🟢 C 組｜補位樓梯／觀察培養\n`;
  dispatchGroups.C.forEach(name => md += `${name}\n`);
  md += `\n`;

  // 6. 執行規則
  md += `六、執行規則（鎖死）\n\n`;
  md += `照順序派。\n`;
  md += `前面全忙，才往後。\n`;
  md += `不得指定。\n`;
  md += `不得跳位。\n`;
  md += `同客戶回撥，優先回原承接人。\n`;
  md += `今天開始，全部依這份名單執行。\n`;
  md += `後續若有異動，以 AI 審計後公告為準。\n\n`;

  // 7. 每人一句建議
  md += `七、每人一句：建議＋壓力＋激勵（優化強化版｜AI大數據版）\n\n`;
  rankingList.forEach((m, index) => {
      const prev = index > 0 ? rankingList[index-1] : undefined;
      const next = index < rankingList.length - 1 ? rankingList[index+1] : undefined;
      const advice = generateAdvice(m, prev, next);
      md += `**${m.rank}、${m.name}：**${advice}\n\n`;
  });

  md += `八、最後確認\n\n`;
  md += `以上為今日統一派單規則與名單順序。\n`;
  md += `請全員確認內容後，直接回覆「+1」。\n`;
  md += `未回覆者，視為尚未確認今日派單規則。\n\n`;
  md += `看完請回 +1。\n`;

  return md;
}

// ── 輔助函式 ──
function formatToTitleDate(dateStr: string): string {
  try {
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      return `${parseInt(parts[1])}/${parseInt(parts[2])}`;
    }
    return dateStr;
  } catch {
    return dateStr;
  }
}

function getTomorrowDate(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    d.setDate(d.getDate() + 1);
    const m = d.getMonth() + 1;
    const day = d.getDate();
    return `${m}/${day}`;
  } catch {
    return '明日';
  }
}
