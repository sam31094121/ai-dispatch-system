// ==========================================
// 3/21 結算真實業績數據 → 3/22 AI 派單
// 更新：3/21 16:30 三平台報表校正完畢，天地盤/邏輯盤/累積盤全 PASS
// 排序：總業績 → 續單金額 → 追續成交總數
// 版本：2026-03-21 17:00 LIFE ENGINE v11.0
// ==========================================

export interface Employee {
  rank: number;
  name: string;
  followUps: number;
  renewals: number;
  total: number;
  actual: number;
  // ⬇️ AI 加強：六維戰力大數據
  stats?: {
    total: number;
    open: number;
    brave: number;
    close: number;
    value: number;
    stress: number;
  };
  // AI 計算欄位
  aiScore?: number;
  group?: string;
  closeRate?: number;
  renewalRate?: number;
  followUpRate?: number;
  avgOrderValue?: number;
  stability?: number;
  suggestion?: string;
}

export interface Platform {
  name: string;
  revenue: number;
}

// 三平台資料（奕心＋民視＋公司）3/21 16:30 結算
// 奕心 4,152,282 / 民視 1,449,788 / 公司 378,360 合計 5,980,430
export const platforms: Platform[] = [
  { name: '奕心', revenue: 4152282 },  // 69% 💡 主力
  { name: '民視', revenue: 1449788 },  // 24% 🚀 爆發
  { name: '公司', revenue: 378360  },  //  7% 🌀 潛力
];

// 3/21 16:30 結算（三平台整合）→ 3/22 派單
// 名次異動：高如郁 11→7、林宜靜 7→5、林沛昕 5→6
// 王梅慧 6→4、廖姿惠 8→8（不變）、江麗勉 4→9（掉位）
// 新增：陳旭宜（新人）正式進榜第 21 名

// 3/21 結算 → 3/22 派單的真實員工資料（依總業績降序）
export const rawEmployees: Employee[] = [
  { rank: 1,  name: '李玲玲', followUps: 22, renewals: 592270, total: 817900, actual: 817900, stats: { total: 94, open: 100, brave: 100, close: 79, value: 85, stress: 100 }, group: 'A1' },
  { rank: 2,  name: '王珍珠', followUps: 40, renewals: 497250, total: 700580, actual: 700580, stats: { total: 82, open: 75,  brave: 72,  close: 77, value: 80, stress: 79 }, group: 'A1' },
  { rank: 3,  name: '馬秋香', followUps: 34, renewals: 550920, total: 686670, actual: 686670, stats: { total: 84, open: 86,  brave: 76,  close: 83, value: 76, stress: 89 }, group: 'A1' },
  { rank: 4,  name: '王梅慧', followUps: 23, renewals: 349120, total: 474090, actual: 474090, stats: { total: 83, open: 100, brave: 70,  close: 82, value: 58, stress: 100 }, group: 'A1' },
  { rank: 5,  name: '林宜靜', followUps: 18, renewals: 320120, total: 464240, actual: 464240, stats: { total: 75, open: 90,  brave: 60,  close: 75, value: 43, stress: 92 }, group: 'A2' },
  { rank: 6,  name: '林沛昕', followUps: 11, renewals: 287810, total: 445278, actual: 445278, stats: { total: 78, open: 100, brave: 65,  close: 74, value: 38, stress: 100 }, group: 'A2' },
  { rank: 7,  name: '高如郁', followUps: 14, renewals: 199530, total: 324208, actual: 324208, stats: { total: 65, open: 82,  brave: 46,  close: 66, value: 26, stress: 85 }, group: 'A2' },
  { rank: 8,  name: '廖姿惠', followUps: 13, renewals: 93460,  total: 315018, actual: 315018, stats: { total: 71, open: 100, brave: 58,  close: 48, value: 27, stress: 100 }, group: 'A2' },
  { rank: 9,  name: '江麗勉', followUps: 5,  renewals: 250524, total: 300684, actual: 300684, stats: { total: 74, open: 100, brave: 52,  close: 88, value: 30, stress: 100 }, group: 'A2' },
  { rank: 10, name: '徐華妤', followUps: 12, renewals: 160240, total: 289710, actual: 289710, stats: { total: 74, open: 100, brave: 54,  close: 69, value: 28, stress: 100 }, group: 'A2' },
  { rank: 11, name: '湯玉琦', followUps: 15, renewals: 71880,  total: 274644, actual: 274644, stats: { total: 65, open: 93,  brave: 55,  close: 40, value: 22, stress: 95 }, group: 'B' },
  { rank: 12, name: '高美雲', followUps: 10, renewals: 58430,  total: 199240, actual: 199240, stats: { total: 61, open: 93,  brave: 46,  close: 46, value: 16, stress: 95 }, group: 'B' },
  { rank: 13, name: '陳玲華', followUps: 10, renewals: 82750,  total: 164288, actual: 164288, stats: { total: 60, open: 75,  brave: 38,  close: 69, value: 21, stress: 81 }, group: 'B' },
  { rank: 14, name: '蘇淑玲', followUps: 8,  renewals: 66550,  total: 141236, actual: 141236, stats: { total: 58, open: 81,  brave: 38,  close: 64, value: 15, stress: 85 }, group: 'B' },
  { rank: 15, name: '梁依萍', followUps: 11, renewals: 66790,  total: 140480, actual: 140480, stats: { total: 50, open: 55,  brave: 26,  close: 64, value: 18, stress: 62 }, group: 'B' },
  { rank: 16, name: '鄭珮恩', followUps: 20, renewals: 61735,  total: 76215,  actual: 76215,  stats: { total: 46, open: 31,  brave: 14,  close: 90, value: 29, stress: 35 }, group: 'B' },
  { rank: 17, name: '江沛林', followUps: 6,  renewals: 19350,  total: 59570,  actual: 59570,  stats: { total: 43, open: 64,  brave: 27,  close: 42, value: 7,  stress: 60 }, group: 'B' },
  { rank: 18, name: '許淑英', followUps: 10, renewals: 55440,  total: 55440,  actual: 55440,  stats: { total: 43, open: 38,  brave: 14,  close: 100,value: 15, stress: 33 }, group: 'B' },
  { rank: 19, name: '董昭蘭', followUps: 6,  renewals: 29345,  total: 29345,  actual: 29345,  stats: { total: 36, open: 28,  brave: 8,   close: 100,value: 8,  stress: 18 }, group: 'C' },
  { rank: 20, name: '謝啟芳', followUps: 3,  renewals: 15144,  total: 15144,  actual: 15144,  stats: { total: 31, open: 17,  brave: 6,   close: 100,value: 2,  stress: 13 }, group: 'C' },
  { rank: 21, name: '陳旭宜', followUps: 1,  renewals: 3960,   total: 3960,   actual: 3960,   stats: { total: 28, open: 10,  brave: 3,   close: 100,value: 1,  stress: 8  }, group: 'C' },
  { rank: 22, name: '林佩君', followUps: 1,  renewals: 2490,   total: 2490,   actual: 2490,   stats: { total: 28, open: 11,  brave: 4,   close: 100,value: 1,  stress: 1  }, group: 'C' },
];

// AI 個人建議（3/22 派單版，依 3/21 16:30 結算排名更新｜LIFE ENGINE v11.0）
export const aiSuggestions: Record<string, string> = {
  '李玲玲': '📊 AI 算力核定：穩居榜首。💡 建議：將 59.227 萬【續單】精準收口，優先鎖定高淨值客戶。⚠️ 壓力：你已踩在天花板，後方追趕者磁吸擴大，不容半秒怠惰。🚀 激勵：今日再補一發高單價，直接拉出不可跨越之絕對斷層！',
  '王珍珠': '📊 AI 算力核定：最強追趕者。💡 建議：將 40 次【追續】高頻落袋，把 49.725 萬【續單】打成連續實收。⚠️ 壓力：前方榜首未縮小，後方第 3 名機率逼近，夾縫中最忌猶豫。🚀 激勵：開張即爆發，穩坐前二甚至直接逼近榜首！',
  '馬秋香': '📊 AI 算力核定：續單高承載節點。💡 建議：優先將 55.092 萬【續單】轉化為確定實收。⚠️ 壓力：當前處於死亡纏鬥區，曲線極抖，任何漏單都會引發下滑。🚀 激勵：續單爆發性極強，今日補上一筆大單，直接引發排名洗牌！',
  '王梅慧': '📊 AI 算力核定：高質量收口中樞。💡 建議：加速 34.912 萬【續單】變現。⚠️ 壓力：身處前四核心交界，進退權重敏感，不往前推就是往後退。🚀 激勵：鎖定一筆高單價客群，攻入前三的機率模型將立即點亮！',
  '林宜靜': '📊 AI 算力核定：強勢上升點。💡 建議：優化 18 次【追續】成功率並守穩 32.012 萬【續單】。⚠️ 壓力：衝上第五僅是開始，站不穩就是曇花一現。🚀 激勵：今天再下一城，前方的主力核心將無法再忽視你的存在！',
  '林沛昕': '📊 AI 算力核定：主力邊緣高壓區。💡 建議：守穩 28.781 萬【續單】，集中收網 11 次【追續】。⚠️ 壓力：距離前五僅一步之遙，若只防守、不開拓，會被後方累積算力吞沒。🚀 激勵：今日只要咬下一單，名次指標將由紅轉綠！',
  '高如郁': '📊 AI 算力核定：最大跳升突圍點。💡 建議：繼續做厚 19.953 萬【續單】厚度，優先提純高機率客戶。⚠️ 壓力：警示跳升後最怕「動能斷檔」，一原地停留就會遭到反超。🚀 激勵：持續追擊，前六的數據連線已為你鋪好，衝就對了！',
  '廖姿惠': '📊 AI 算力核定：穩健緩升型。💡 建議：梳理 13 次【追續】與 9.346 萬【續單】，整理出連續爆單節奏。⚠️ 壓力：數據有量但缺客單價，在拉鋸戰中容易吃虧。🚀 激勵：補齊高價口，今日只要有一筆客單引爆，前七位將由你主導！',
  '江麗勉': '📊 AI 算力核定：公司盤護航點。💡 建議：在 25.0524 萬【續單】優勢上主動開拓，別停留在單一渠道。⚠️ 壓力：靠優勢守城非長久之計，守位機率正逐時下降。🚀 激勵：打出主動破局單，前段排名將直接為你騰出新位置！',
  '徐華妤': '📊 AI 算力核定：前十守門人。💡 建議：將 12 次【追續】打穿，把 16.024 萬【續單】轉高亮實收。⚠️ 壓力：保十不是終點是危險邊緣，不把指標往上壓隨時會脫離核心圈。🚀 激勵：一筆實收即刻讓數據曲線拉出上揚高亮角！',
  '湯玉琦': '📊 AI 算力核定：中段交界樞紐。💡 建議：15 次【追續】做滿收割，確保每個機會點完全變現。⚠️ 壓力：名次極度擁擠，你目前正處於「最容易踩空」的交叉路口。🚀 激勵：全力吃乾淨這波單，數據排序會直接把你往上一層推！',
  '高美雲': '📊 AI 算力核定：穩定補量節點。💡 建議：將 10 次【追續】與 5.843 萬【續單】做出點對點連續收割。⚠️ 壓力：單點爆發缺乏連續性，容易消耗大數據評估權重。🚀 激勵：穩定連線是你的武器，持續補單將穩步推進！',
  '陳玲華': '📊 AI 算力核定：上升潛力觀測點。💡 建議：把 10 次【追續】與 8.275 萬【續單】套袋，拉長獲利線。⚠️ 壓力：缺乏連續波峰會在平滑期被忽略，必須創造高峰。🚀 激勵：多下一筆重單，前段陣群的雷達將正式掃描到你！',
  '蘇淑玲': '📊 AI 算力核定：中段壓力區。💡 建議：精準對齊 8 次【追續】與 6.655 萬【續單】，排除零星拖慢。⚠️ 壓力：模型警示若在此開空，後面順位會形成連鎖下滑。🚀 激勵：氣勢點燃即可破局，單次排序將超前！',
  '梁依萍': '📊 AI 算力核定：微距突破點。💡 建議：優先兌現 11 次【追續】，將 6.679 萬【續單】急速落袋。⚠️ 壓力：與前一名差距僅在微克級別，多拖一天就多一分耗損。🚀 激勵：連續收口兩次，名次將引發二進制式直接翻升！',
  '鄭珮恩': '📊 AI 算力核定：高量量單載體。💡 建議：將 20 次【追續】流量轉現，別讓滾動指標停在紙上。⚠️ 壓力：量大無實收會被判定為「低效運轉」，扣除名單權重。🚀 激勵：今日將數據變現，名次將呈現爆發式跳躍！',
  '江沛林': '📊 AI 算力核定：後段守位防線。💡 建議：建立 6 次【追續】安全節奏，使 1.935 萬【續單】做厚成實收。⚠️ 壓力：低水位易致數據鈍化，再不上攻後路堪憂。🚀 激勵：連吃兩單脫離重災區，狀態重歸安定！',
  '許淑英': '📊 AI 算力核定：可追性啟動點。💡 建議：打穿 5.544 萬【續單】，建立連續實收模型破除停滯。⚠️ 壓力：停滯是最大效能殺手，不破殼難接優質單。🚀 激勵：今日開張即能拉高開口效應，順位必頂！',
  '董昭蘭': '📊 AI 算力核定：有感累積點。💡 建議：將 2.9345 萬【續單】全量追蹤全量收割，不可有漏網。⚠️ 壓力：不追擊便無數據，等於算法中斷連。🚀 激勵：今日追下一發，順位立刻動能滿滿！',
  '謝啟芳': '📊 AI 算力核定：極速起步期。💡 建議：穩住單點節奏，排除雜質，先將可收名單百分百歸宗。⚠️ 壓力：開局斷節奏會大幅降低算法的「冷啟動」評價。🚀 激勵：今日連續實收，信心算法將被納入起飛曲線！',
  '陳旭宜': '📊 AI 算力核定：新進榜節點。💡 建議：鎖死現手機會名單，打破單點孤島，求穩定破二、三筆。⚠️ 壓力：剛性開局虛無易碎，千萬不能斷鏈。🚀 激勵：再追下一單，新人池數據係數將全面解鎖！',
  '林佩君': '📊 AI 算力核定：尾端低伏區。💡 建議：將凍結名單全面提純，不可讓數字繼續在底部歸零。⚠️ 壓力：數據將形成固定遲滯模式，難以打破。🚀 激勵：收割一單，在算法中的甦醒係數將全面引爆反擊！',
};
