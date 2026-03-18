// ==========================================
// 3/17 結算真實業績數據 → 3/18 AI 派單
// 更新：3/17 當日報表疊加完畢（今日派單+追續）
// 排序：總業績 → 續單金額 → 追續成交總數
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

// 三平台資料（奕心＋民視＋公司）
// 佔比：奕心59% 主力 / 民視26% 爆發 / 公司15% 潛力
export const platforms: Platform[] = [
  { name: '奕心', revenue: 3153310 },  // 59% 💡 主力
  { name: '民視', revenue: 1397008 },  // 26% 🚀 爆發 (3/17 累計更新)
  { name: '公司', revenue: 806688  },  // 15% 🌀 潛力
];

// 3/17 當日業績（今日追續+派單）
// 王珍珠: +37,450(追5筆) 馬秋香: +60,000(追1) 李玲玲: +5,000(追1)
// 廖姿惠: +7,980(追1) 江麗勉: +219,600(追2) 梁依萍: +6,840(追1)
// 許淑英: +1,380(追1) 陳玲華: +11,250(追1) 蘇淑玲: +5,610(追1)
// 林沛昕: +23,250(派1+追1) / 高美雲: 派2筆但0成交

// 3/17 結算 → 3/18 派單的真實員工資料（依總業績降序）
export const rawEmployees: Employee[] = [
  { rank: 1,  name: '李玲玲', followUps: 23, renewals: 597270, total: 822900, actual: 822900, stats: { total: 93, open: 100, brave: 100, close: 78, value: 84, stress: 100 }, group: 'A1' },
  { rank: 2,  name: '馬秋香', followUps: 33, renewals: 506920, total: 642670, actual: 642670, stats: { total: 83, open: 84,  brave: 74,  close: 81, value: 74, stress: 87 }, group: 'A1' },
  { rank: 3,  name: '王珍珠', followUps: 43, renewals: 429200, total: 621030, actual: 621030, stats: { total: 80, open: 71,  brave: 69,  close: 75, value: 78, stress: 76 }, group: 'A1' },
  { rank: 4,  name: '江麗勉', followUps: 7,  renewals: 470124, total: 520284, actual: 520284, stats: { total: 78, open: 100, brave: 56,  close: 91, value: 33, stress: 100 }, group: 'A1' },
  { rank: 5,  name: '林沛昕', followUps: 12, renewals: 299060, total: 472048, actual: 472048, stats: { total: 77, open: 100, brave: 63,  close: 72, value: 36, stress: 100 }, group: 'A1' },
  { rank: 6,  name: '王梅慧', followUps: 22, renewals: 343120, total: 460130, actual: 460130, stats: { total: 82, open: 99,  brave: 68,  close: 80, value: 56, stress: 99 }, group: 'A2' },
  { rank: 7,  name: '林宜靜', followUps: 18, renewals: 320120, total: 436340, actual: 436340, stats: { total: 73, open: 88,  brave: 58,  close: 73, value: 41, stress: 90 }, group: 'A2' },
  { rank: 8,  name: '廖姿惠', followUps: 14, renewals: 101440, total: 316730, actual: 316730, stats: { total: 70, open: 100, brave: 56,  close: 46, value: 25, stress: 100 }, group: 'A2' },
  { rank: 9,  name: '徐華妤', followUps: 11, renewals: 156440, total: 281930, actual: 281930, stats: { total: 73, open: 100, brave: 52,  close: 67, value: 26, stress: 100 }, group: 'A2' },
  { rank: 10, name: '湯玉琦', followUps: 13, renewals: 56010,  total: 258774, actual: 258774, stats: { total: 63, open: 90,  brave: 52,  close: 37, value: 20, stress: 92 }, group: 'A2' },
  { rank: 11, name: '高如郁', followUps: 13, renewals: 99530,  total: 196308, actual: 196308, stats: { total: 61, open: 77,  brave: 40,  close: 62, value: 22, stress: 81 }, group: 'B' },
  { rank: 12, name: '高美雲', followUps: 9,  renewals: 53390,  total: 190220, actual: 190220, stats: { total: 60, open: 91,  brave: 44,  close: 44, value: 14, stress: 93 }, group: 'B' },
  { rank: 13, name: '陳玲華', followUps: 10, renewals: 90200,  total: 158768, actual: 158768, stats: { total: 59, open: 73,  brave: 36,  close: 67, value: 19, stress: 79 }, group: 'B' },
  { rank: 14, name: '蘇淑玲', followUps: 9,  renewals: 72160,  total: 145866, actual: 145866, stats: { total: 57, open: 79,  brave: 36,  close: 62, value: 14, stress: 83 }, group: 'B' },
  { rank: 15, name: '梁依萍', followUps: 11, renewals: 56630,  total: 119360, actual: 119360, stats: { total: 49, open: 53,  brave: 24,  close: 62, value: 17, stress: 60 }, group: 'B' },
  { rank: 16, name: '鄭珮恩', followUps: 19, renewals: 60385,  total: 70885,  actual: 70885,  stats: { total: 45, open: 29,  brave: 12,  close: 88, value: 27, stress: 33 }, group: 'B' },
  { rank: 17, name: '江沛林', followUps: 6,  renewals: 19350,  total: 59570,  actual: 59570,  stats: { total: 42, open: 62,  brave: 25,  close: 40, value: 6,  stress: 58 }, group: 'B' },
  { rank: 18, name: '許淑英', followUps: 9,  renewals: 46020,  total: 46020,  actual: 46020,  stats: { total: 42, open: 36,  brave: 12,  close: 100,value: 13, stress: 31 }, group: 'C' },
  { rank: 19, name: '董昭蘭', followUps: 5,  renewals: 17465,  total: 17465,  actual: 17465,  stats: { total: 34, open: 25,  brave: 6,   close: 100,value: 6,  stress: 15 }, group: 'C' },
  { rank: 20, name: '謝啟芳', followUps: 3,  renewals: 15144,  total: 15144,  actual: 15144,  stats: { total: 30, open: 15,  brave: 5,   close: 100,value: 1,  stress: 11 }, group: 'C' },
  { rank: 21, name: '林佩君', followUps: 1,  renewals: 2490,   total: 2490,   actual: 2490,   stats: { total: 29, open: 12,  brave: 4,   close: 100,value: 1,  stress: 1  }, group: 'C' },
];

// AI 個人建議（3/18 版本，依3/17底排名更新）
export const aiSuggestions: Record<string, string> = {
  '李玲玲': '你昨天【續單】+5,000，總業績推上82.29萬，繼續穩居第一；但馬秋香昨天+6萬，差距縮到18萬，第一名不是躺著守，今天要再爆一筆把距離拉開；你是全隊壓力核心，不能讓人覺得你會停。',
  '馬秋香': '昨天【追單】一筆+6萬直接殺到第二，這個位置是你打上來的，今天要繼續打；前面李玲玲差18萬，後面王珍珠差2萬，你現在是最有機會上第一、也最容易被超的人；今天只要再爆一筆大單，格局就完全不同。',
  '王珍珠': '昨天追了5筆+3.745萬，你的追單量是全隊第一；但馬秋香昨天一筆6萬就超了你，你現在退到第三；你不缺量，缺的是大客單；今天把追單轉成高客單，才能真的守住前段。',
  '江麗勉': '昨天2筆追單+21.96萬，從第8直接跳到第4，全隊昨日最大爆發；你現在業績52萬，前面王珍珠才差10萬；這個勢頭不能停，今天繼續攻，你有實力拿到前三。',
  '林沛昕': '昨天派單+追單共+2.325萬，總業績推到47.2萬；你現在排第5，後面王梅慧差1.2萬，非常危險；今天要把追單12繼續往深處打，守住第5才有機會往上頂。',
  '王梅慧': '昨天零業績，結果被江麗勉和林沛昕同時超越，排名從第4跌到第6；你的續單34.3萬還沒完全兌現，今天要把這筆錢收回來；不動就等著繼續跌，今天開一筆大的。',
  '林宜靜': '昨天零業績，位置原地，後面廖姿惠距離縮近中；你的追單18和續單32萬一直還在帳面上，今天必須實際收回來；不兌現的業績是空的，今天把積壓的量打出來。',
  '廖姿惠': '昨天追單+7,980，繼續往上補；你現在在第8，前面林宜靜差11.9萬，仍有追趕空間；今天繼續把追單14穩定轉成實收，別讓節奏斷，你還能再往前爬。',
  '徐華妤': '昨天零業績，名次維持第9；你的追單11還在，但不打就一直停在這；今天把這11筆追單認真轉，每一筆都是往前推的子彈；你不缺量，缺的是今天出手。',
  '湯玉琦': '昨天零業績，第10穩住；但後面第11名差3.8萬，不是很安全的距離；你的追單13要今天開始轉，不能只守不攻；你今天補一筆，就能讓後段不敢靠近。',
  '高如郁': '昨天零業績，位置沒動；你的追單13和續單9.9萬還壓著，今天要讓它動起來；中段的競爭很近，你稍微一鬆後面就會追上來；今天開一筆，穩住前11。',
  '高美雲': '昨天派了2通但0成交，這說明有在打但沒收到；今天要改節奏，先從最好收的追單9打，把成交率補回來；你的9萬續單還沒收，今天至少讓一筆落袋。',
  '陳玲華': '昨天追單+11,250，小進步；你現在15.8萬，對比前面高美雲19萬差距縮小了；今天繼續打追單10，讓業績繼續往上疊；你的成交節奏開始對了，今天不要停。',
  '蘇淑玲': '昨天追單+5,610，穩定補進；你現在14.5萬，和陳玲華差距1萬，非常接近；今天把追單9繼續轉，讓業績連續墊高；節奏對的時候不要自己停，今天繼續打。',
  '梁依萍': '昨天追單+6,840，推到11.9萬；鄭珮恩在你前面7萬，今天要開始拉距離而不是追趕；把11筆追單轉成連續實收，今天補兩筆，位置就能有感移動。',
  '鄭珮恩': '昨天零業績，位置原地；你的追單19筆是後段最大的量，但一直沒真正轉成現金；今天不能再觀望，把最容易成交的那幾筆先收回來；你一旦動起來，名次立刻有變。',
  '江沛林': '昨天零業績，位置沒動；前面鄭珮恩有19筆追單，隨時可能拉開距離；你今天要先把追單6穩定轉實收，守住位置再說；先收穩、再往前頂。',
  '許淑英': '昨天追單+1,380，總業績推到4.6萬；你現在已經有穩定追單節奏，今天繼續；把9筆追單用同樣方式推進，每一筆都是積累；不停就能繼續往前爬。',
  '董昭蘭': '昨天零業績，位置在後段；你的續單1.7萬還沒收，今天這筆要落袋；先收這筆，再打新追單；你只要開始動，後段的距離就能拉開。',
  '謝啟芳': '昨天零業績，名次停在倒數第二；你現在最重要的任務是破開第一筆，建立信心；今天挑一個最好說話的客戶，把第一筆拿下來；第一筆是最難的，拿下之後就不一樣了。',
  '林佩君': '昨天零業績，名次墊底；你的追單1還沒收，今天把這一筆作為唯一目標；先把它收下來，再看下一步；不要一次想太多，今天只打這一筆，認真打。',
};
