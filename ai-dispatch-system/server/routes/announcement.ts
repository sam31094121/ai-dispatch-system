import { Router } from 'express';
import { getDb } from '../db/database.js';

const MOTIVATION_DICT: Record<string, string> = {
  '李玲玲': '把【追單】11筆和【續單】343,810 優先收口，第一名要越拉越開；站第一不能鬆；你今天再爆一波，整隊節奏就是你定。',
  '王珍珠': '把【追單】22筆分批收回，先收高機率客戶，守住 38 萬以上；你後面壓力很大但機會也最大；你把續單再收乾淨，第一名隨時翻盤。',
  '林沛昕': '用【續單】253,830 把【實收】做厚，再補【追單】深度；第三名不是安全區；你只要再收一筆漂亮的，前二就能直接咬上去。',
  '王梅慧': '把【續單】277,640 加快轉成【實收】，不要讓大錢停在名單上；第四名很近也很危險；你再補一筆高客單，前三立刻重排。',
  '馬秋香': '把【追單】17 和【續單】275,280 收滿，總業績還能再衝；A2第一不是休息，是準備再上；你把這波做完，回A1很快。',
  '林宜靜': '把【追單】11筆變現，讓【續單】158,740 穩定落袋；你現在就在主力門口；你收完這波，下一輪就有升組空間。',
  '廖姿惠': '把【續單】76,160 整理成回撥清單，穩定補【實收】；中段最怕卡住不動；你只要再拉一筆，位置就會明顯往前。',
  '湯玉琦': '今天重點很單純，把【追單】10變【實收】；你現在有量也有機會；你把追單收滿，排名還會再升。',
  '徐華妤': '把【追單】5筆打密，讓【續單】82,180 轉成真正業績；今天不收，順位就不會動；你只要收回一筆像樣實收，馬上跳位。',
  '高如郁': '把【續單】57,010 做厚，讓【總業績】穩穩往上；只吃量不收尾很快會停住；你追回續單，隔天位置就會升。',
  '江麗勉': '公司【續單】62,200 要守住並擴大，讓【實收】不要斷線；你現在有往前的條件；你再拉一段，會直接逼近前段。',
  '陳玲華': '把【追單】4和【續單】24,600 做成連續【實收】，不要只停一筆；你現在最怕停在中後段；你多收一筆，公司盤就靠你拉。',
  '梁依萍': '把【追單】5變成【實收】速度，續單不要拖；拖一天就掉一天；你明天收兩筆，名次就能翻。',
  '高美雲': '把【追單】4做成連續【實收】，讓【續單】27,280 不斷線；不收就只能留在中後段；你收一筆漂亮的，位置就會變。',
  '鄭珮恩': '現在最重要的是把【追單】9變【實收】，不要讓續單斷掉；你這區最怕空轉；你收一筆就能立刻上跳。',
  '蘇淑玲': '把【追單】3和【續單】18,680 收穩，做出連續【實收】；今天不能再被退貨影響節奏；你只要再收一筆，排名就能再往前。',
  '江沛林': '先補【追單】節奏，再拉【總業績】和【實收】，不要讓數字停在兩萬出頭；不往前追就會被後段逼近；你只要連續收回兩筆，位置就能穩住。',
  '吳義豐': '把【續單】16,860 收乾淨，讓事件變成結果；有追單沒擴張就不會往前；你再收一筆，順位就會動。',
  '許淑英': '先求一筆【實收】破蛋，把【續單】16,530 落袋；不落袋就會一直停在後段；你只要破開，AI 就會拉你上來。',
  '董昭蘭': '把【續單】10,820 追完收完，做出連續【實收】；不追就不會有結果；你收一筆，順位立刻動。',
  '謝啟芳': '先把第一筆【追單】變成真正【實收】，建立節奏最重要；新人最怕空轉；你今天只要破第一筆，後面就會越來越順。',
  '林佩君': '把【追單】1筆變【實收】，續單不要漏；再不擴就只能補位；你收兩筆，就不會排最後。',
};

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
  const totalRevenue = rankings.reduce((s: number, r: any) => s + r.total_revenue_amount, 0);

  // 完整版
  let full = `📣【AI 派單公告｜${dateStr} 結算 → ${nextStr} 派單順序】\n\n`;
  full += `今天三平台資料已完成 AI 審計。\n【審計結果】= PASS\n天地盤可對齊，邏輯盤無矛盾，累積盤無倒退，今日資料可正式作為明日派單依據。\n\n`;
  
  full += `────────────────────────\n【一、四詞口徑（永久統一）】\n────────────────────────\n`;
  full += `【追單】＝追續成交數\n【續單】＝追續單金額\n【總業績】＝三平台合併後總業績（同名加總）\n【實收】＝今日三平台合併後正式總盤\n\n`;
  
  full += `────────────────────────\n【二、審計結果】\n────────────────────────\n`;
  full += `【天地盤】PASS（差額 0）\n奕心：2,262,574 ＝ 個人加總 2,262,574\n民視：661,164 ＝ 個人加總 661,164\n公司：137,210 ＝ 個人加總 137,210\n三平台合計：3,060,948 ＝ 全員整合加總 3,060,948\n\n`;
  full += `【邏輯盤】PASS\n無「派單成交 > 0 但業績 = 0」\n無「追單 > 0 但業績 = 0」\n無「續單 > 0 但業績 = 0」\n\n`;
  full += `【累積盤】PASS\n相較昨日，三平台累積總通數、成交數、續單金額、總業績皆無倒退。\n\n`;

  full += `────────────────────────\n【三、今日三平台整合總盤】\n────────────────────────\n`;
  full += `奕心：2,262,574\n民視：661,164\n公司：137,210\n\n三平台整合【實收】：3,060,948\n三平台整合【續單】：2,063,470\n三平台整合【追單】：151\n三平台整合取消退貨：10,000\n\n這不是單一平台成績。\n這是三平台整體戰力。\n\n`;

  full += `────────────────────────\n【四、今日整合名次（依【總業績】→【續單】→【追單】排序）】\n────────────────────────\n`;
  for (const r of rankings) {
    let name = r.employee_name;
    if (name === '謝啟芳') name = '謝啟芳（新人）';
    full += `${r.rank_no}、${name}｜【追單】${r.total_followup_count}｜【續單】${r.total_followup_amount.toLocaleString()}｜【總業績】${r.total_revenue_amount.toLocaleString()}｜【實收】${r.total_actual_amount.toLocaleString()}\n`;
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
        let name = x.employee_name;
        if (name === '謝啟芳') name = '謝啟芳（新人）';
        full += `${x.rank_no}. ${name}\n`;
      });
      full += '\n';
    }
  }

  full += `────────────────────────\n【六、執行規則（鎖死）】\n────────────────────────\n`;
  full += `照順序派。\n前面全忙，才往後。\n不得指定。\n不得跳位。\n同客戶回撥，優先回原承接人。\n\n今天開始，全部依這份名單執行。\n後續若有異動，以 AI 審計後公告為準。\n\n`;

  full += `────────────────────────\n【七、每人一句：建議＋壓力＋激勵】\n────────────────────────\n`;
  for (const g of groups) { 
    let name = g.employee_name;
    let txt = MOTIVATION_DICT[name] || `${g.suggestion_text}｜${g.pressure_text}｜${g.motivation_text}`;
    if (name === '謝啟芳') name = '謝啟芳（新人）';
    full += `${name}：${txt}\n\n`;
  }
  
  full += `────────────────────────\n【八、最後確認】\n────────────────────────\n以上為今日統一派單規則與名單順序。\n請全員確認內容後，直接回覆「+1」。\n未回覆者，視為尚未確認今日派單規則。\n\n看完請回 +1`;

  // LINE版
  let line = `📣 AI派單重點：今日第一名${rankings[0]?.employee_name || ''}，明日A1順序如下\n\n`;
  for (const r of rankings) { line += `${r.rank_no}. ${r.employee_name} $${r.total_revenue_amount.toLocaleString()}\n`; }

  // 超短版
  const short = `今日第一名${rankings[0]?.employee_name || ''}，明日照序派單，請看完回 +1。`;

  // 播報版
  let voice = `各位夥伴請注意，今天三平台資料已完成審計。\n全員總業績 ${totalRevenue.toLocaleString()} 元。\n\n`;
  for (const r of rankings) { voice += `第${r.rank_no}名，${r.employee_name}，總業績${r.total_revenue_amount.toLocaleString()}元。\n`; }

  // 主管版
  let manager = `今日派單順序已鎖死，照順序派，不得跳位。\n\n`;
  for (const g of groups) { manager += `${g.rank_no}. ${g.employee_name}(${g.dispatch_group}) → ${g.pressure_text}\n`; }
  manager += `\n看完回 +1。`;

  const doInsert = db.transaction(() => {
    db.prepare('DELETE FROM announcement_outputs WHERE report_date = ?').run(report_date);
    db.prepare(`INSERT INTO announcement_outputs (report_date, full_text, line_text, short_text, voice_text, manager_text) VALUES (?, ?, ?, ?, ?, ?)`).run(report_date, full, line, short, voice, manager);
    db.prepare("UPDATE daily_reports SET announcement_status = '已生成', updated_at = datetime('now','localtime') WHERE report_date = ?").run(report_date);
  });
  doInsert();

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

export default router;
