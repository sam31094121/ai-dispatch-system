import { getDb } from './server/db/database.js';

const reportDate = '2026-03-16';

const rankings = [
  { rank: 1, name: '李玲玲', follow: 22, renew: 592270, total: 813920, actual: 813920 },
  { rank: 2, name: '王珍珠', follow: 36, renew: 371670, total: 537020, actual: 537020 },
  { rank: 3, name: '馬秋香', follow: 29, renew: 408920, total: 533670, actual: 533670 },
  { rank: 4, name: '王梅慧', follow: 20, renew: 337160, total: 446210, actual: 446210 },
  { rank: 5, name: '林沛昕', follow: 9, renew: 253830, total: 387238, actual: 387238 },
  { rank: 6, name: '林宜靜', follow: 17, renew: 220120, total: 330340, actual: 330340 },
  { rank: 7, name: '廖姿惠', follow: 13, renew: 93460, total: 300000, actual: 300000 },
  { rank: 8, name: '江麗勉', follow: 5, renew: 250524, total: 283184, actual: 283184 },
  { rank: 9, name: '湯玉琦', follow: 13, renew: 56010, total: 258774, actual: 258774 },
  { rank: 10, name: '徐華妤', follow: 10, renew: 150440, total: 256950, actual: 256950 },
  { rank: 11, name: '高如郁', follow: 11, renew: 94370, total: 181108, actual: 181108 },
  { rank: 12, name: '高美雲', follow: 8, renew: 48350, total: 161850, actual: 161850 },
  { rank: 13, name: '陳玲華', follow: 9, renew: 78950, total: 138178, actual: 138178 },
  { rank: 14, name: '蘇淑玲', follow: 7, renew: 62750, total: 118746, actual: 118746 },
  { rank: 15, name: '梁依萍', follow: 10, renew: 49790, total: 97580, actual: 97580 },
  { rank: 16, name: '鄭珮恩', follow: 19, renew: 60385, total: 70885, actual: 70885 },
  { rank: 17, name: '江沛林', follow: 4, renew: 13370, total: 53590, actual: 53590 },
  { rank: 18, name: '許淑英', follow: 8, renew: 44640, total: 44640, actual: 44640 },
  { rank: 19, name: '董昭蘭', follow: 4, renew: 13665, total: 13665, actual: 13665 },
  { rank: 20, name: '謝啟芳（新人）', follow: 1, renew: 3264, total: 3264, actual: 3264 },
  { rank: 21, name: '林佩君', follow: 1, renew: 2490, total: 2490, actual: 2490 }
];

const groups = [
  { group: 'A1', members: ['李玲玲', '王珍珠', '馬秋香', '王梅慧'] },
  { group: 'A2', members: ['林沛昕', '林宜靜', '廖姿惠', '江麗勉', '湯玉琦', '徐華妤'] },
  { group: 'B', members: ['高如郁', '高美雲', '陳玲華', '蘇淑玲', '梁依萍', '鄭珮恩', '江沛林'] },
  { group: 'C', members: ['許淑英', '董昭蘭', '謝啟芳（新人）', '林佩君'] }
];

const feedback: Record<string, { suggest: string, pressure: string, motivate: string }> = {
  '李玲玲': { suggest: '把【續單】59.227萬繼續往深處收', pressure: '第一名不是守住，是再把差距拉大；你現在就是整隊最高壓力點', motivate: '你今天再補一筆大單，主力核心還是你定' },
  '王珍珠': { suggest: '把【追單】36和【續單】37.167萬做成連續落袋', pressure: '現在不是有機會，是已經超上來', motivate: '你今天再補一筆，前二就會更穩' },
  '馬秋香': { suggest: '把【續單】40.892萬做滿，第三名不是退，是暫時卡位', pressure: '你現在前有壓力、後有咬盤，不能鬆', motivate: '你今天只要再爆一筆，第 2 名隨時換回來' },
  '王梅慧': { suggest: '把【續單】33.716萬加快轉【實收】，不要讓大錢停在名單上', pressure: '你現在卡在前四核心區，進退都快', motivate: '你今天補一筆高客單，前三就會洗牌' },
  '林沛昕': { suggest: '把【續單】25.383萬守穩，再把【追單】9往深處打', pressure: '你現在還在主力邊緣帶，不能鬆', motivate: '你只要再補一筆，前四前五會更近' },
  '林宜靜': { suggest: '把【追單】17轉成真正【實收】，讓【續單】22.012萬完整落袋', pressure: '你距離主力區不遠', motivate: '你收完這波，下一輪再往上不是問題' },
  '廖姿惠': { suggest: '把【續單】9.346萬和現有名單整理成穩定節奏', pressure: '你現在最怕的是有量沒全收', motivate: '你今天再補一筆，前六就會開始有壓力' },
  '江麗勉': { suggest: '把【續單】25.0524萬守住並再擴大', pressure: '你現在不是沒實力，是要把這次優勢守住', motivate: '你今天只要再收一筆，前七前六都看得到' },
  '湯玉琦': { suggest: '把【追單】13持續轉【實收】', pressure: '你現在位置穩，但還能再往前頂', motivate: '你把這波追單收乾淨，排名還會再上' },
  '徐華妤': { suggest: '把【追單】10打密，讓【續單】15.044萬變成真正成績', pressure: '你現在已經站穩前 10，不能只守', motivate: '你今天再補一筆像樣實收，前 8 很快會碰到' },
  '高如郁': { suggest: '把【續單】9.437萬做厚，讓【總業績】繼續往上墊', pressure: '你現在在中前段，最怕停住', motivate: '你把這波追回來，還有上升空間' },
  '高美雲': { suggest: '把【追單】8和【續單】4.835萬做成連續【實收】', pressure: '你現在最需要的是穩，不是只靠一筆', motivate: '你再收一筆，名次會繼續前推' },
  '陳玲華': { suggest: '把【追單】9 and 【續單】7.895萬做成連續落袋，不要停在單點', pressure: '你不是沒能力，是現在要把節奏拉長', motivate: '你今天多補一筆，前段就會開始看到你' },
  '蘇淑玲': { suggest: '把【續單】62.750萬和【追單】7一起收穩，別讓零散單卡住', pressure: '你現在最怕節奏斷掉', motivate: '你只要再收一筆，順位還能再推' },
  '梁依萍': { suggest: '把【追單】10優先轉【實收】，續單不要再拖；拖一天就掉一天', pressure: '拖一天就掉一天', motivate: '你今天只要連續收兩筆，位置就能翻' },
  '鄭珮恩': { suggest: '把【追單】19先轉現金，不要讓量停在紙上', pressure: '你現在最大的優勢就是量夠', motivate: '你只要真的收回來，名次會直接往上跳' },
  '江沛林': { suggest: '先補【追單】節奏，再拉【實收】，不要讓數字卡在五萬附近', pressure: '不往前追，很容易被後段貼近', motivate: '你連續收兩筆，位置就能穩' },
  '許淑英': { suggest: '把【續單】4.464萬優先落袋，先求連續【實收】', pressure: '你現在不是沒機會，是先要破停滯', motivate: '你一開，順位就會上來' },
  '董昭蘭': { suggest: '把【續單】1.3665萬追完收完，做出連續【實收】', pressure: '不追就不會動', motivate: '你收一筆，順位立刻變' },
  '謝啟芳（新人）': { suggest: '今天先把節奏穩住，不要急、不要空轉', pressure: '新人現在最重要的是先破第一筆', motivate: '你只要開張，後面就會越來越順' },
  '林佩君': { suggest: '把現有名單重新整理，不要讓數字繼續停住', pressure: '再不補動作，就只能留在尾段', motivate: '你今天只要收回來一筆，整體節奏就會不同' }
};

const announcementText = `📣【AI 派單公告｜3/16 結算 → 3/17 派單順序】
一、審計結論
審計結果：條件通過
【天地盤】PASS
【邏輯盤】PASS
【累積盤】FAIL
二、整合總盤（本日）
【實收】5,033,302
【續單】3,206,428
【追單】256
三、今日整合名次
... (略，視需求填入)
`;

try {
  const db = getDb();
  
  const insertRanking = db.prepare(`
    INSERT OR REPLACE INTO integrated_rankings 
    (report_date, employee_name, normalized_name, total_followup_count, total_followup_amount, total_revenue_amount, total_actual_amount, rank_no, ranking_rule_text, source_platform_data)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, '三平台整合', '{}')
  `);

  const insertDispatch = db.prepare(`
    INSERT OR REPLACE INTO dispatch_group_results
    (report_date, employee_name, normalized_name, rank_no, dispatch_group, group_order_no, suggestion_text, pressure_text, motivation_text)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertAnnounce = db.prepare(`
    INSERT OR REPLACE INTO announcement_outputs
    (report_date, full_text, created_at, updated_at)
    VALUES (?, ?, datetime('now','localtime'), datetime('now','localtime'))
  `);

  const doWork = db.transaction(() => {
    // 1. 插入 Rankings
    for (const r of rankings) {
      const normalized = r.name.replace(/（新人）/g, '');
      insertRanking.run(reportDate, r.name, normalized, r.follow, r.renew, r.total, r.actual, r.rank);
      
      // 2. 找到分組
      let foundGroup = 'C';
      let orderNo = 1;
      for (const g of groups) {
        if (g.members.includes(r.name)) {
          foundGroup = g.group;
          orderNo = g.members.indexOf(r.name) + 1;
          break;
        }
      }
      
      const fb = feedback[r.name] || { suggest: '', pressure: '', motivate: '' };
      insertDispatch.run(reportDate, r.name, normalized, r.rank, foundGroup, orderNo, fb.suggest, fb.pressure, fb.motivate);
    }

    // 3. 插入 Announce
    insertAnnounce.run(reportDate, announcementText);
  });

  doWork();
  console.log('✅ 資料匯入完成！');

} catch (e) {
  console.error('❌ 匯入失敗:', e);
}
db.close();
