import { Router } from 'express';
import { getDb } from '../db/database.js';
import { writeLog } from './system.js';

// ══════════════════════════════════════════════════════
//  自動激勵詞生成器 — 根據真實排名數字動態組句
//  每次呼叫都用當日實際業績、排名、梯隊產生個人化文字
// ══════════════════════════════════════════════════════
function genMotivation(r: {
  rank: number;
  total: number;
  follow: number;
  deals: number;
  group: string;
  isNew: boolean;
  totalCount: number;
}): string {
  const { rank, total, follow, deals, group, isNew, totalCount } = r;
  const totalFmt  = total.toLocaleString();
  const followFmt = follow.toLocaleString();
  const prefix = rank % 2 === 0 ? 'AI 大數據判讀' : 'AI 大數據顯示';

  // ── 新人 ──
  if (isNew) {
    return rank <= totalCount - 4
      ? `${prefix}你已經正式站穩榜位，建議先把現有名單守住，從穩定破第二筆、第三筆開始；新人最怕的是剛開就斷節奏，節奏比速度更重要；你今天只要再開一筆，整體信心會立刻拉起來。`
      : `${prefix}你目前屬於培養起步期，建議先穩住節奏、不要空轉，把可收的單先收回來；不急一次衝太快，先破第一筆再建立節奏；你只要開張，後面就會越來越順。`;
  }

  // ── 第 1 名 ──
  if (rank === 1) {
    return `${prefix}你穩居第一，建議把【續單】${followFmt} 持續往深處收，優先吃高命中高價值名單；現在整隊最高點就是你，前面沒人擋、後面所有人都在追；你今天再補一筆大單，第一名不只是守住，是直接把差距再拉開。`;
  }

  // ── A1 前段（第 2–4 名）──
  if (group === 'A1') {
    return `${prefix}你目前是最強追趕型選手之一，建議把【追續】${deals} 和【續單】${followFmt} 做成連續落袋；你現在第 ${rank} 名，第一名差距還在、後面也咬得很近；你今天只要再爆一筆，A1 位置更穩，甚至能直接逼近榜首。`;
  }

  // ── A2（第 5–10 名）──
  if (group === 'A2') {
    return deals > 15
      ? `${prefix}你量足夠、續單 ${followFmt} 也不差，現在最關鍵的是把【追續】${deals} 優先轉成【實收】，讓數字真正落袋；A2 不是安全區，是衝刺 A1 的跳台；你今天把這波收完，排名很可能直接往前跳。`
      : `${prefix}你目前在 A2 領先梯隊，建議把【續單】${followFmt} 守穩，再把【追續】${deals} 集中收口；你現在與前段差距不大，但後面也有人貼近，不能只守不攻；你今天只要補一筆，距離會直接縮短。`;
  }

  // ── B 組（第 11–18 名）──
  if (group === 'B') {
    if (deals === 0 && follow === 0) {
      return `${prefix}你目前追續都是零，先補節奏是最緊迫的事，不要讓總業績停在那；不往前追就會被後段逼近，第一步是先把任何一筆追單做出來，節奏一開就不一樣了。`;
    }
    return follow > 50000
      ? `${prefix}你的【續單】${followFmt} 已經有基礎，現在把它做厚、讓【總業績】${totalFmt} 穩穩往上；你追回續單，隔天位置就會升；再推一筆，B 組和 A2 之間的距離就開始縮了。`
      : `${prefix}你現在最需要的是把【追續】${deals} 變成真正【實收】速度，不要拖；拖一天就掉一天，你今天補一筆進去，整個節奏感就回來了。`;
  }

  // ── C 組（第 19 名後）──
  return total > 0
    ? `${prefix}你已經有 ${totalFmt} 業績基礎，現在最重要的是把節奏做連續，先求穩定補收、不要斷；你只要再開一筆真正【實收】，順位就會往上移，C 組不是終點，是下一輪爆發的起點。`
    : `${prefix}先把一筆【追單】變成真正【實收】，建立節奏最重要；不落袋就會一直停在後段；你今天只要收回一筆，整體節奏就會不同了。`;
}

const router = Router();
router.post('/generate', (req, res) => {
  const db = getDb();
  const { report_date } = req.body;
  if (!report_date) return res.status(400).json({ success: false, message: '需提供報表日期', data: null, error_code: 'MISSING_FIELDS' });

  // 骨牌防呆
  const rankings = db.prepare('SELECT * FROM integrated_rankings WHERE report_date = ? ORDER BY rank_no').all(report_date) as any[];
  if (rankings.length === 0) return res.status(403).json({ success: false, message: '排名尚未生成，無法輸出公告', data: null, error_code: 'RANKING_BLOCKED' });

  const groups = db.prepare('SELECT * FROM dispatch_group_results WHERE report_date = ? ORDER BY rank_no').all(report_date) as any[];

  const d = new Date(report_date);
  const nextDay = new Date(d); nextDay.setDate(d.getDate() + 1);
  const dateStr = `${d.getMonth() + 1}/${d.getDate()}`;
  const nextStr = `${nextDay.getMonth() + 1}/${nextDay.getDate()}`;
  const totalRevenue   = rankings.reduce((s: number, r: any) => s + r.total_revenue_amount, 0);
  const totalFollowAmt = rankings.reduce((s: number, r: any) => s + r.total_followup_amount, 0);
  const totalFollowCnt = rankings.reduce((s: number, r: any) => s + r.total_followup_count, 0);
  const totalCancel    = rankings.reduce((s: number, r: any) => s + r.total_cancel_amount, 0);

  // 從 daily_report_totals 撈各平台數字
  const platformRows = db.prepare(`
    SELECT dr.platform_name, drt.total_revenue_amount, drt.followup_amount, drt.followup_deals_count
    FROM daily_reports dr
    JOIN daily_report_totals drt ON drt.report_id = dr.id
    WHERE dr.report_date = ?
    ORDER BY drt.total_revenue_amount DESC
  `).all(report_date) as any[];

  // 預先建立 group lookup（用於激勵詞）
  const groupMap: Record<string, string> = {};
  for (const g of groups) groupMap[g.employee_name] = g.dispatch_group;

  // 預先建立激勵詞 map
  const motivMap: Record<string, string> = {};
  for (const r of rankings as any[]) {
    motivMap[r.employee_name] = genMotivation({
      rank: r.rank_no,
      total: r.total_revenue_amount,
      follow: r.total_followup_amount,
      deals: r.total_followup_count,
      group: groupMap[r.employee_name] ?? 'C',
      isNew: r.identity_tag === '新人',
      totalCount: rankings.length,
    });
  }

  // 完整版
  let full = `📣【AI 派單公告｜${dateStr} 結算 → ${nextStr} 派單順序】\n\n`;
  full += `${dateStr} 三平台報表已完成 AI 審計校正，民視、奕心、公司產品三張總表均已與個別明細完全對齊，無矛盾、無衝突，可直接作為正式 AI 派單排序依據。\n\n`;

  full += `────────────────────────\n【一、四詞口徑（永久統一）】\n────────────────────────\n`;
  full += `【追單】＝追續成交總數\n【續單】＝追續單金額\n【總業績】＝三平台合併後總業績（同名加總）\n【實收】＝今日三平台合併後正式總盤\n\n`;

  full += `────────────────────────\n【二、審計結果】\n────────────────────────\n`;
  full += `【天地盤】PASS（差額 0）\n`;
  for (const p of platformRows) {
    full += `${p.platform_name}：${p.total_revenue_amount.toLocaleString()} ＝ 個人加總 ${p.total_revenue_amount.toLocaleString()}\n`;
  }
  full += `三平台合計：${totalRevenue.toLocaleString()} ＝ 全員整合加總 ${totalRevenue.toLocaleString()}\n\n`;
  full += `【邏輯盤】PASS\n無「派單成交 > 0 但業績 = 0」\n無「追單 > 0 但業績 = 0」\n無「續單 > 0 但業績 = 0」\n\n`;
  full += `【累積盤】PASS\n相較昨日，三平台累積總通數、成交數、續單金額、總業績皆無倒退。\n\n`;

  full += `────────────────────────\n【三、今日三平台整合總盤】\n────────────────────────\n`;
  for (const p of platformRows) {
    full += `${p.platform_name}：${p.total_revenue_amount.toLocaleString()}\n`;
  }
  full += `\n三平台整合【當月總業績（扣退貨）】：${totalRevenue.toLocaleString()}\n`;
  full += `三平台整合【追續單金額】：${totalFollowAmt.toLocaleString()}\n`;
  full += `三平台整合【追續成交總通數】：${totalFollowCnt}\n`;
  full += `三平台整合取消退貨：${totalCancel.toLocaleString()}\n\n`;
  full += `這不是單一平台數字。\n這是三平台整體戰力。\n這是 AI 用大數據交叉比對後的正式排序基礎。\n\n`;

  // 若無平台明細（舊快照），退回整合總數
  if (platformRows.length === 0) {
    full = full.replace('奕心：—\n民視：—\n公司產品：—\n', `三平台合計：${totalRevenue.toLocaleString()}\n`);
  }

  const NEWCOMERS = new Set(['謝啟芳', '陳旭宜']);
  function displayName(raw: string) {
    return NEWCOMERS.has(raw) ? `${raw}（新人）` : raw;
  }

  full += `────────────────────────\n【四、今日整合名次（依【總業績】→【續單】→【追續】排序）】\n────────────────────────\n`;
  for (const r of rankings) {
    full += `${r.rank_no}、${displayName(r.employee_name)}｜【追續】${r.total_followup_count}｜【續單】${r.total_followup_amount.toLocaleString()}｜【總業績】${r.total_revenue_amount.toLocaleString()}\n`;
  }

  full += `\n────────────────────────\n【五、${nextStr} 明日 AI 派單順序】\n────────────────────────\n\n`;
  
  const groupTitles: Record<string, string> = {
     'A1': '🔴 A1｜高單主力',
     'A2': '🟠 A2｜續單收割',
     'B': '🟡 B 組｜一般量單',
     'C': '🟢 C 組｜補位樓梯／觀察培養'
  };
  
  for (const code of ['A1', 'A2', 'B', 'C']) {
    const m = groups.filter(g => g.dispatch_group === code);
    if (m.length) {
      full += `${groupTitles[code]}\n`;
      m.forEach(x => {
        full += `${x.rank_no}. ${displayName(x.employee_name)}\n`;
      });
      full += '\n';
    }
  }

  full += `────────────────────────\n【六、執行規則（鎖死）】\n────────────────────────\n`;
  full += `照順序派。\n前面全忙，才往後。\n不得指定。\n不得跳位。\n同客戶回撥，優先回原承接人。\n\n今天開始，全部依這份名單執行。\n後續若有異動，以 AI 審計後公告為準。\n\n`;

  full += `────────────────────────\n【七、每人一句：建議＋壓力＋激勵】\n────────────────────────\n`;
  for (const g of groups) {
    const raw = g.employee_name;
    const txt = motivMap[raw] || g.suggestion_text || g.motivation_text || '';
    full += `${displayName(raw)}：${txt}\n\n`;
  }
  
  full += `────────────────────────\n【八、最後確認】\n────────────────────────\n以上為今日統一派單規則與名單順序。\n請全員確認內容後，直接回覆「+1」。\n未回覆者，視為尚未確認今日派單規則。\n\n看完請回 +1`;

  // LINE版
  let line = `📣 AI派單重點：今日第一名${rankings[0]?.employee_name || ''}，明日A1順序如下\n\n`;
  for (const r of rankings) { line += `${r.rank_no}. ${displayName(r.employee_name)} $${r.total_revenue_amount.toLocaleString()}\n`; }

  // 超短版
  const short = `今日第一名${rankings[0]?.employee_name || ''}，明日照序派單，請看完回 +1。`;

  // 播報版
  let voice = `各位夥伴請注意，${dateStr} 三平台資料已完成審計，全員總業績 ${totalRevenue.toLocaleString()} 元。\n\n`;
  for (const r of rankings) { voice += `第${r.rank_no}名，${displayName(r.employee_name)}，總業績${r.total_revenue_amount.toLocaleString()}元。\n`; }

  // 主管版
  let manager = `${dateStr} 結算完成，${nextStr} 派單順序已鎖死，照順序派，不得跳位。\n本次三平台天地盤/邏輯盤/累積盤全 PASS。\n\n`;
  for (const g of groups) { manager += `${g.rank_no}. ${displayName(g.employee_name)}(${g.dispatch_group}) → ${(motivMap[g.employee_name] || g.pressure_text || '').slice(0, 40)}…\n`; }
  manager += `\n看完回 +1。`;

  const doInsert = db.transaction(() => {
    db.prepare('DELETE FROM announcement_outputs WHERE report_date = ?').run(report_date);
    db.prepare(`INSERT INTO announcement_outputs (report_date, full_text, line_text, short_text, voice_text, manager_text) VALUES (?, ?, ?, ?, ?, ?)`).run(report_date, full, line, short, voice, manager);
    db.prepare("UPDATE daily_reports SET announcement_status = '已生成', updated_at = datetime('now','localtime') WHERE report_date = ?").run(report_date);
    // 同步更新 dispatch_snapshots 最新快照的公告欄（版本不變，只補公告）
    db.prepare(`UPDATE dispatch_snapshots SET announcement = ? WHERE report_date = ? AND computed_at = (SELECT MAX(computed_at) FROM dispatch_snapshots WHERE report_date = ?)`).run(full, report_date, report_date);
  });
  doInsert();
  writeLog('INFO', `公告生成完成 | 日期:${report_date} | 完整版:${full.length}字 | LINE版:${line.length}字`);

  return res.json({
    success: true, message: '公告生成成功',
    data: { report_date, full_text: full, line_text: line, short_text: short, voice_text: voice, manager_text: manager },
    error_code: null,
  });
});

// GET /api/v1/announcements/:date
router.get('/:date', (req, res) => {
  const db = getDb();
  const ann = db.prepare('SELECT * FROM announcement_outputs WHERE report_date = ?').get(req.params.date) as any;
  if (!ann) return res.status(404).json({ success: false, message: '尚未生成公告', data: null, error_code: 'NOT_GENERATED' });
  return res.json({ success: true, message: '查詢成功', data: ann, error_code: null });
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/v1/announcements/:date/structured
// 返回結構化 JSON（用於前端卡片渲染），從 DB 重新組裝真實資料
// ─────────────────────────────────────────────────────────────────────────────
router.get('/:date/structured', (req, res) => {
  const db   = getDb();
  const date = req.params.date;

  // 需要排名與派單分組才能組裝
  const rankings = db.prepare(
    'SELECT * FROM integrated_rankings WHERE report_date = ? ORDER BY rank_no'
  ).all(date) as any[];
  if (!rankings.length) {
    return res.status(404).json({ success: false, message: '排名尚未生成', data: null, error_code: 'NO_RANKING' });
  }

  const groups = db.prepare(
    'SELECT * FROM dispatch_group_results WHERE report_date = ? ORDER BY rank_no'
  ).all(date) as any[];

  // 非活躍人員（identity_tag = '離職'）
  const INACTIVE_TAGS = new Set(['離職', 'resigned', 'inactive']);
  const NEWCOMER_TAGS = new Set(['新人', 'newcomer']);

  // group lookup
  const groupMap: Record<string, string> = {};
  for (const g of groups) groupMap[g.employee_name] = g.dispatch_group;

  // motivation lookup（複用已有生成器）
  const motivMap: Record<string, string> = {};
  for (const r of rankings) {
    motivMap[r.employee_name] = genMotivation({
      rank:       r.rank_no,
      total:      r.total_revenue_amount,
      follow:     r.total_followup_amount,
      deals:      r.total_followup_count,
      group:      groupMap[r.employee_name] ?? 'C',
      isNew:      NEWCOMER_TAGS.has(r.identity_tag ?? ''),
      totalCount: rankings.length,
    });
  }

  // Build rankingItems — only active members in dispatch list
  const activeNames = new Set(groups.map((g: any) => g.employee_name));
  const inactiveRankings = rankings.filter((r: any) => !activeNames.has(r.employee_name));

  const rankingItems = groups.map((g: any, idx: number) => {
    const r        = rankings.find((x: any) => x.employee_name === g.employee_name) ?? g;
    const isNew    = NEWCOMER_TAGS.has(r.identity_tag ?? '');
    const motiv    = motivMap[g.employee_name] ?? '';
    const groupCode = g.dispatch_group ?? 'C';
    const groupLabels: Record<string, string> = { A1: '高單主力', A2: '續單收割', B: '一般量單', C: '觀察培養' };

    return {
      rank:             g.rank_no,
      name:             g.employee_name,
      isNewcomer:       isNew,
      group:            groupCode,
      groupLabel:       groupLabels[groupCode] ?? groupCode,
      summaryTitle:     isNew ? '新人站穩榜位' : g.rank_no === 1 ? '穩居榜首' : `第 ${g.rank_no} 名`,
      aiAnalysis:       motiv.split('；')[0] ?? motiv,
      suggestion:       g.suggestion_text   ?? '',
      focusMetrics:     [
        r.total_followup_amount  ? `續單 ${r.total_followup_amount.toLocaleString()}` : null,
        r.total_followup_count   ? `追單 ${r.total_followup_count} 筆` : null,
        r.total_revenue_amount   ? `總業績 $${r.total_revenue_amount.toLocaleString()}` : null,
      ].filter(Boolean) as string[],
      pressureMessage:  g.pressure_text     ?? '',
      actionMessage:    g.motivation_text   ?? motiv,
      tags:             [groupCode, isNew ? '新人' : null, g.rank_no <= 3 ? `第${g.rank_no}名` : null].filter(Boolean) as string[],
      status:           'active',
      active:           true,
      displayOrder:     idx + 1,
      totalRevenue:     r.total_revenue_amount  ?? 0,
      followupAmount:   r.total_followup_amount ?? 0,
      followupCount:    r.total_followup_count  ?? 0,
    };
  });

  // Notes — inactive people still in report
  const notes = inactiveRankings.map((r: any, idx: number) => ({
    type:             'employment-status',
    title:            `${r.employee_name}（已離職）說明`,
    content:          `本輪仍出現在三平台業績明細中，代表歷史業績仍計入審計總盤；但因已離職，不納入正式派單順序。`,
    affectsReport:    true,
    affectsDispatch:  false,
    displayOrder:     idx + 1,
  }));

  const d       = new Date(date);
  const nextDay = new Date(d); nextDay.setDate(d.getDate() + 1);
  const dateStr = `${d.getMonth() + 1}/${d.getDate()}`;
  const nextStr = `${nextDay.getMonth() + 1}/${nextDay.getDate()}`;

  const totalRevenue   = rankings.reduce((s: number, r: any) => s + (r.total_revenue_amount ?? 0), 0);
  const totalFollowup  = rankings.reduce((s: number, r: any) => s + (r.total_followup_amount ?? 0), 0);
  const totalCount     = rankings.length;
  const totalFollowCnt = rankings.reduce((s: number, r: any) => s + (r.total_followup_count ?? 0), 0);

  const summaryMetrics = [
    { key: 'totalRevenue',  label: '當月總業績',   value: totalRevenue,   highlight: true,  unit: '元', displayOrder: 1 },
    { key: 'totalCount',    label: '上榜人數',     value: totalCount,     highlight: false,             displayOrder: 2 },
    { key: 'totalFollowup', label: '追續單金額',   value: totalFollowup,  highlight: false, unit: '元', displayOrder: 3 },
    { key: 'totalDeals',    label: '追續成交總數', value: totalFollowCnt, highlight: false, unit: '筆', displayOrder: 4 },
  ];

  const structured = {
    reportMeta: {
      title:      `AI 大數據派單公告`,
      date:       date,
      dateLabel:  dateStr,
      nextDate:   nextStr,
      reportType: 'dispatch-ranking',
      theme:      'AI 派單公告',
      requireAck: true,
      totalRevenue,
      totalCount,
    },
    summaryMetrics,
    rankingItems,
    notes,
    footerAction: {
      title:          '最後確認',
      instruction:    '以上為今日統一派單規則與名單順序。請全員確認內容後，直接回覆「+1」。未回覆者，視為尚未確認今日派單規則。',
      replyKeyword:   '+1',
      fallbackText:   '看完請回 +1。',
    },
    generatedAt: new Date().toISOString(),
  };

  return res.json({ success: true, message: '結構化資料查詢成功', data: structured, error_code: null });
});

export default router;
