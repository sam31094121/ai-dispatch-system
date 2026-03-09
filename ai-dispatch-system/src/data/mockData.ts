// ==========================================
// 3/7 結算真實業績數據 (未來替換為資料庫 API)
// ==========================================

export interface Employee {
  rank: number;
  name: string;
  followUps: number;
  renewals: number;
  total: number;
  actual: number;
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

// 三平台資料
export const platforms: Platform[] = [
  { name: '奕心', revenue: 1741396 },
  { name: '民視', revenue: 582210 },
  { name: '公司', revenue: 104760 },
];

// 3/8 結算 → 3/9 派單的真實員工資料
export const rawEmployees: Employee[] = [
  { rank: 1, name: '李玲玲', followUps: 10, renewals: 334810, total: 421610, actual: 421610 },
  { rank: 2, name: '王珍珠', followUps: 19, renewals: 264230, total: 360930, actual: 360930 },
  { rank: 3, name: '王梅慧', followUps: 12, renewals: 245640, total: 318320, actual: 318320 },
  { rank: 4, name: '馬秋香', followUps: 14, renewals: 245300, total: 291700, actual: 291700 },
  { rank: 5, name: '林沛昕', followUps: 6, renewals: 163170, total: 268590, actual: 268590 },
  { rank: 6, name: '林宜靜', followUps: 9, renewals: 141040, total: 188800, actual: 188800 },
  { rank: 7, name: '廖姿惠', followUps: 9, renewals: 76160, total: 182380, actual: 182380 },
  { rank: 8, name: '湯玉琦', followUps: 10, renewals: 40030, total: 140010, actual: 140010 },
  { rank: 9, name: '徐華妤', followUps: 5, renewals: 82180, total: 135700, actual: 135700 },
  { rank: 10, name: '高如郁', followUps: 6, renewals: 57010, total: 129258, actual: 129258 },
  { rank: 11, name: '江麗勉', followUps: 2, renewals: 53200, total: 62500, actual: 62500 },
  { rank: 12, name: '梁依萍', followUps: 5, renewals: 16990, total: 48530, actual: 48530 },
  { rank: 13, name: '陳玲華', followUps: 2, renewals: 18250, total: 47758, actual: 47758 },
  { rank: 14, name: '高美雲', followUps: 4, renewals: 27280, total: 45500, actual: 45500 },
  { rank: 15, name: '江沛林', followUps: 0, renewals: 0, total: 21140, actual: 21140 },
  { rank: 16, name: '蘇淑玲', followUps: 1, renewals: 10000, total: 20000, actual: 20000 },
  { rank: 17, name: '鄭珮恩', followUps: 5, renewals: 16250, total: 18330, actual: 18330 },
  { rank: 18, name: '吳義豐', followUps: 2, renewals: 16860, total: 16860, actual: 16860 },
  { rank: 19, name: '董昭蘭', followUps: 2, renewals: 10820, total: 10820, actual: 10820 },
  { rank: 20, name: '許淑英', followUps: 3, renewals: 6530, total: 6530, actual: 6530 },
  { rank: 21, name: '謝啟芳', followUps: 1, renewals: 3800, total: 3800, actual: 3800 },
  { rank: 22, name: '林佩君', followUps: 1, renewals: 2490, total: 2490, actual: 2490 },
];

// AI 個人建議 (模擬 AI 輸出)
export const aiSuggestions: Record<string, string> = {
  '李玲玲': '把【追單】10筆和【續單】33.48萬優先收口，直接把第一名拉開；站在第一就不能鬆；你今天再收一波，整隊節奏就是你定。',
  '王珍珠': '把【追單】19筆分批收回，先收高機率客戶，守住36萬以上；第二名只差一步就能反超；你把續單再收乾淨，第一名隨時翻盤。',
  '王梅慧': '把【續單】24.56萬加快轉成【實收】，不要讓錢停在名單上；前三名競爭很緊，你一慢就會被壓住；你再補一筆高客單，直接往前咬。',
  '馬秋香': '把【追單】14和【續單】24.53萬收滿，總業績還能再衝；A1只看結果，不看辛苦；你把這波做完，前三就能繼續鎖住。',
  '林沛昕': '用【續單】16.317萬把實收做厚，再補【追單】深度；第五名不是安全區，後面都在追；你只要再爆一筆，就能再往前。',
  '林宜靜': '把【追單】9筆變現，讓【續單】14.104萬穩定落袋；你現在就在A1門口，不能拖；你收完這波，下一輪就有上修空間。',
  '廖姿惠': '把【續單】7.616萬整理成回撥清單，穩定補【實收】；中段最容易被前後夾擊；你只要再拉一筆，位置就會明顯往前。',
  '湯玉琦': '今天重點很簡單，把【追單】10變【實收】；A2不是休息區，是衝刺區；你把追單收滿，排名還會再升。',
  '徐華妤': '把【追單】5筆打密，讓【續單】8.218萬轉成真正業績；今天不收，順位就不動；你只要收回一筆像樣的實收，馬上跳位。',
  '高如郁': '把【續單】5.701萬做厚，讓【總業績】穩穩往上；只吃量不收尾很快會停住；你追回續單，隔天位置就會升。',
  '江麗勉': '公司【續單】5.32萬要守住並擴大，讓【實收】不要斷線；不擴就只能卡中段；你再拉一段，會直接靠近前段。',
  '梁依萍': '把【追單】5變成【實收】速度，續單不要拖；拖一天就掉一天；你明天收兩筆，名次就能翻。',
  '陳玲華': '把公司【續單】1.825萬做成連續【實收】，不要只停一筆；金額不連續就容易被擠下去；你多收一筆，公司盤就靠你拉。',
  '高美雲': '把【追單】4做成連續【實收】，讓【續單】2.728萬不斷線；不收就只能留在中後段；你收一筆漂亮的，位置就會變。',
  '江沛林': '先補【追單】和實收節奏，不要讓總業績停在兩萬出頭；不往前追就會被後段逼近；你只要連續收回兩筆，位置就能穩住。',
  '蘇淑玲': '先把【續單】1萬收穩，做出連續【實收】；再停滯就會被後段追上；你只要收一筆漂亮的，就能往前排。',
  '鄭珮恩': '現在最重要的是把【追單】5變【實收】，不要讓續單斷掉；你現在在邊緣區，最怕停住；你收一筆就能立刻上跳。',
  '吳義豐': '把【續單】1.686萬收乾淨，讓事件變成結果；有追單沒結果，AI不會給前位；你再收一筆，順位就會往前。',
  '董昭蘭': '把【續單】1.082萬追完收完，做出連續【實收】；不追就不會有結果；你收一筆，順位立刻動。',
  '許淑英': '先求一筆【實收】破蛋，把【續單】落袋；不落袋就會一直停在後段；你只要破蛋，AI 就會拉你上來。',
  '謝啟芳': '先把第一筆【追單】變成真正【實收】，建立節奏最重要；新人最怕空轉；你今天只要破第一筆，後面就會越來越順。',
  '林佩君': '把【追單】1筆變【實收】，續單不要漏；再不擴就只能補位；你收兩筆，就不會排最後。',
};
