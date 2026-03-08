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

// 3/7 結算 → 3/8 派單的真實員工資料
export const rawEmployees: Employee[] = [
  { rank: 1, name: '王珍珠', followUps: 16, renewals: 235230, total: 331930, actual: 331930 },
  { rank: 2, name: '王梅慧', followUps: 12, renewals: 245640, total: 318320, actual: 318320 },
  { rank: 3, name: '馬秋香', followUps: 14, renewals: 245300, total: 296500, actual: 296500 },
  { rank: 4, name: '林沛昕', followUps: 5, renewals: 148400, total: 239120, actual: 239120 },
  { rank: 5, name: '李玲玲', followUps: 7, renewals: 134810, total: 210610, actual: 210610 },
  { rank: 6, name: '廖姿惠', followUps: 9, renewals: 76160, total: 182380, actual: 182380 },
  { rank: 7, name: '林宜靜', followUps: 8, renewals: 135040, total: 180420, actual: 180420 },
  { rank: 8, name: '徐華妤', followUps: 5, renewals: 82180, total: 135700, actual: 135700 },
  { rank: 9, name: '湯玉琦', followUps: 8, renewals: 34050, total: 130530, actual: 130530 },
  { rank: 10, name: '高如郁', followUps: 6, renewals: 57010, total: 126778, actual: 126778 },
  { rank: 11, name: '江麗勉', followUps: 2, renewals: 53200, total: 62500, actual: 62500 },
  { rank: 12, name: '梁依萍', followUps: 5, renewals: 16990, total: 48530, actual: 48530 },
  { rank: 13, name: '高美雲', followUps: 4, renewals: 27280, total: 45500, actual: 45500 },
  { rank: 14, name: '陳玲華', followUps: 1, renewals: 11250, total: 36778, actual: 36778 },
  { rank: 15, name: '蘇淑玲', followUps: 1, renewals: 10000, total: 20000, actual: 20000 },
  { rank: 16, name: '吳義豐', followUps: 2, renewals: 16860, total: 16860, actual: 16860 },
  { rank: 17, name: '江沛林', followUps: 0, renewals: 0, total: 15340, actual: 15340 },
  { rank: 18, name: '鄭珮恩', followUps: 4, renewals: 12450, total: 14530, actual: 14530 },
  { rank: 19, name: '董昭蘭', followUps: 2, renewals: 10820, total: 10820, actual: 10820 },
  { rank: 20, name: '許淑英', followUps: 2, renewals: 2730, total: 2730, actual: 2730 },
  { rank: 21, name: '林佩君', followUps: 1, renewals: 2490, total: 2490, actual: 2490 },
];

// AI 個人建議 (模擬 AI 輸出)
export const aiSuggestions: Record<string, string> = {
  '王珍珠': '把【追單】16筆持續拆段收回，優先收高機率客戶，守住【實收】33萬以上。',
  '王梅慧': '把【續單】24.56萬加快轉成【實收】，不要讓錢停在名單上。',
  '馬秋香': '把【續單】24.53萬做完結案，讓【總業績】和【實收】同步往上推。',
  '林沛昕': '用【續單】14.84萬把【實收】做厚，再補【追單】深度。',
  '李玲玲': '把【追單】7補強，把【續單】13.48萬做成可重複【實收】。',
  '廖姿惠': '把【續單】7.616萬整理成回撥清單，穩定補【實收】。',
  '林宜靜': '把【追單】8筆變【實收】，把【續單】13.50萬收乾淨。',
  '徐華妤': '把【追單】5筆打密，讓【續單】8.218萬轉成【實收】。',
  '湯玉琦': '把【追單】8變成【實收】，續單收滿下一輪就能回前段。',
  '高如郁': '把【續單】5.701萬做厚，讓【總業績】穩穩往上。',
  '江麗勉': '公司【續單】5.32萬要守住並擴大，讓【實收】不要斷線。',
  '梁依萍': '把【追單】5變成【實收】速度，續單不要拖。',
  '高美雲': '把【追單】4做成連續【實收】，讓【續單】2.728萬不斷線。',
  '陳玲華': '把公司【續單】1.125萬做成連續【實收】，再補【追單】。',
  '蘇淑玲': '先把【續單】1萬收穩，做出連續【實收】。',
  '吳義豐': '把【續單】1.686萬收乾淨，讓【追單】變成真正【實收】。',
  '江沛林': '先補【追單】，再拉【總業績】和【實收】，不要讓數字停在一萬五。',
  '鄭珮恩': '把【追單】4變【實收】，讓【續單】不要斷。',
  '董昭蘭': '把【續單】1.082萬追完收完，做出連續【實收】。',
  '許淑英': '先求一筆【實收】破蛋，把【續單】落袋。',
  '林佩君': '把【追單】1筆變【實收】，續單不要漏。',
};
