// ==========================================
// 歷史數據：2/28 基線 + 3/1~3/7 逐日累積
// 三平台已預先合併（奕心 + 民視 + 公司）
// ==========================================
import type { Employee } from './mockData';

export interface DailyRecord {
  date: string;
  name: string;
  calls: number;       // 三平台累積總通數
  dispatchClose: number; // 派單成交
  followupClose: number; // 追續成交 (= 追單)
  renewalAmount: number; // 追續單金額 (= 續單)
  revenue: number;       // 三平台總業績
}

export interface PlatformDaily {
  date: string;
  platform: string;
  totalCalls: number;
  totalRevenue: number;
  sumIndividualRevenue: number; // 個人加總，用於天地盤
}

// ─── 2/28 三平台合計（上月基線） ───
export const feb28Data: DailyRecord[] = [
  { date:'2/28', name:'王珍珠', calls:47, dispatchClose:26, followupClose:47, renewalAmount:539630, revenue:728000 },
  { date:'2/28', name:'馬秋香', calls:42, dispatchClose:27, followupClose:39, renewalAmount:447836, revenue:626431 },
  { date:'2/28', name:'李玲玲', calls:48, dispatchClose:23, followupClose:25, renewalAmount:300715, revenue:523025 },
  { date:'2/28', name:'林沛昕', calls:27, dispatchClose:13, followupClose:13, renewalAmount:360716, revenue:496852 },
  { date:'2/28', name:'王梅慧', calls:34, dispatchClose:15, followupClose:37, renewalAmount:274250, revenue:354330 },
  { date:'2/28', name:'湯玉琦', calls:35, dispatchClose:24, followupClose:23, renewalAmount:221290, revenue:325530 },
  { date:'2/28', name:'高美雲', calls:25, dispatchClose:15, followupClose:11, renewalAmount:76698, revenue:312158 },
  { date:'2/28', name:'林宜靜', calls:31, dispatchClose:17, followupClose:15, renewalAmount:81882, revenue:234842 },
  { date:'2/28', name:'高如郁', calls:25, dispatchClose:18, followupClose:17, renewalAmount:135444, revenue:234664 },
  { date:'2/28', name:'江麗勉', calls:26, dispatchClose:15, followupClose:15, renewalAmount:141444, revenue:220164 },
  { date:'2/28', name:'廖姿惠', calls:35, dispatchClose:20, followupClose:20, renewalAmount:108590, revenue:215500 },
  { date:'2/28', name:'徐華妤', calls:22, dispatchClose:15, followupClose:15, renewalAmount:105520, revenue:201330 },
  { date:'2/28', name:'梁依萍', calls:24, dispatchClose:13, followupClose:10, renewalAmount:87540, revenue:192500 },
  { date:'2/28', name:'蘇淑玲', calls:21, dispatchClose:12, followupClose:17, renewalAmount:104708, revenue:184386 },
  { date:'2/28', name:'江沛林', calls:20, dispatchClose:12, followupClose:16, renewalAmount:96570, revenue:152550 },
  { date:'2/28', name:'陳玲華', calls:10, dispatchClose:6, followupClose:14, renewalAmount:59000, revenue:97140 },
  { date:'2/28', name:'許淑英', calls:1, dispatchClose:3, followupClose:9, renewalAmount:58340, revenue:67010 },
  { date:'2/28', name:'鄭珮恩', calls:5, dispatchClose:2, followupClose:18, renewalAmount:51330, revenue:61378 },
  { date:'2/28', name:'林佩君', calls:0, dispatchClose:0, followupClose:4, renewalAmount:33360, revenue:33360 },
  { date:'2/28', name:'吳義豐', calls:0, dispatchClose:0, followupClose:8, renewalAmount:28720, revenue:28720 },
  { date:'2/28', name:'董昭蘭', calls:0, dispatchClose:0, followupClose:7, renewalAmount:28750, revenue:28750 },
];

// ─── 3/1 三平台合計 ───
export const mar01Data: DailyRecord[] = [
  { date:'3/1', name:'王珍珠', calls:3, dispatchClose:2, followupClose:4, renewalAmount:18360, revenue:40340 },
  { date:'3/1', name:'李玲玲', calls:2, dispatchClose:2, followupClose:0, renewalAmount:0, revenue:17500 },
  { date:'3/1', name:'廖姿惠', calls:3, dispatchClose:0, followupClose:1, renewalAmount:17200, revenue:17200 },
  { date:'3/1', name:'林宜靜', calls:1, dispatchClose:1, followupClose:1, renewalAmount:6500, revenue:7880 },
  { date:'3/1', name:'湯玉琦', calls:2, dispatchClose:0, followupClose:1, renewalAmount:7000, revenue:7000 },
  { date:'3/1', name:'吳義豐', calls:0, dispatchClose:0, followupClose:1, renewalAmount:3900, revenue:3900 },
  { date:'3/1', name:'許淑英', calls:0, dispatchClose:0, followupClose:1, renewalAmount:1350, revenue:1350 },
];

// ─── 3/2 三平台合計 ───
export const mar02Data: DailyRecord[] = [
  { date:'3/2', name:'王珍珠', calls:9, dispatchClose:8, followupClose:7, renewalAmount:133560, revenue:194660 },
  { date:'3/2', name:'馬秋香', calls:5, dispatchClose:5, followupClose:6, renewalAmount:81700, revenue:114600 },
  { date:'3/2', name:'廖姿惠', calls:9, dispatchClose:5, followupClose:2, renewalAmount:21180, revenue:50420 },
  { date:'3/2', name:'湯玉琦', calls:7, dispatchClose:4, followupClose:3, renewalAmount:17800, revenue:47860 },
  { date:'3/2', name:'李玲玲', calls:7, dispatchClose:6, followupClose:1, renewalAmount:3520, revenue:47520 },
  { date:'3/2', name:'林沛昕', calls:3, dispatchClose:2, followupClose:1, renewalAmount:14000, revenue:45880 },
  { date:'3/2', name:'王梅慧', calls:5, dispatchClose:3, followupClose:3, renewalAmount:14560, revenue:30480 },
  { date:'3/2', name:'江麗勉', calls:4, dispatchClose:3, followupClose:1, renewalAmount:11600, revenue:28480 },
  { date:'3/2', name:'林宜靜', calls:5, dispatchClose:4, followupClose:3, renewalAmount:12960, revenue:25800 },
  { date:'3/2', name:'徐華妤', calls:3, dispatchClose:3, followupClose:0, renewalAmount:0, revenue:21360 },
  { date:'3/2', name:'陳玲華', calls:2, dispatchClose:1, followupClose:1, renewalAmount:11250, revenue:17750 },
  { date:'3/2', name:'高如郁', calls:6, dispatchClose:4, followupClose:0, renewalAmount:0, revenue:15920 },
  { date:'3/2', name:'梁依萍', calls:4, dispatchClose:1, followupClose:1, renewalAmount:7500, revenue:10480 },
  { date:'3/2', name:'江沛林', calls:2, dispatchClose:2, followupClose:0, renewalAmount:0, revenue:7960 },
  { date:'3/2', name:'鄭珮恩', calls:0, dispatchClose:0, followupClose:2, renewalAmount:5150, revenue:5150 },
  { date:'3/2', name:'蘇淑玲', calls:1, dispatchClose:1, followupClose:0, renewalAmount:0, revenue:5000 },
  { date:'3/2', name:'高美雲', calls:1, dispatchClose:1, followupClose:0, renewalAmount:0, revenue:3980 },
  { date:'3/2', name:'董昭蘭', calls:0, dispatchClose:0, followupClose:1, renewalAmount:3520, revenue:3520 },
  { date:'3/2', name:'許淑英', calls:0, dispatchClose:0, followupClose:1, renewalAmount:1350, revenue:1350 },
  // ⚠️ 吳義豐 3/2 邏輯盤異常：追續單金額 11,250 但業績 0
  { date:'3/2', name:'吳義豐', calls:0, dispatchClose:0, followupClose:2, renewalAmount:11250, revenue:0 },
];

// ─── 2/28 平台級天地盤資料（審計用） ───
export const platformAudit: PlatformDaily[] = [
  { date:'2/28', platform:'奕心', totalCalls:337, totalRevenue:4279945, sumIndividualRevenue:4279945 },
  { date:'2/28', platform:'民視', totalCalls:137, totalRevenue:815270, sumIndividualRevenue:815270 },
  { date:'2/28', platform:'公司', totalCalls:4, totalRevenue:223405, sumIndividualRevenue:223405 },
  { date:'3/1', platform:'奕心', totalCalls:11, totalRevenue:89410, sumIndividualRevenue:89410 },
  { date:'3/1', platform:'民視', totalCalls:0, totalRevenue:5760, sumIndividualRevenue:5760 },
  { date:'3/2', platform:'奕心', totalCalls:30, totalRevenue:429820, sumIndividualRevenue:429820 },
  { date:'3/2', platform:'民視', totalCalls:43, totalRevenue:237100, sumIndividualRevenue:237100 },
  // ⚠️ 3/2 公司：吳義豐 追續單=11,250 但業績=0，需人工確認
  { date:'3/2', platform:'公司', totalCalls:1, totalRevenue:11250, sumIndividualRevenue:11250 },
];

/** 將多日資料聚合成每人總計 */
export function aggregateByPerson(records: DailyRecord[]): DailyRecord[] {
  const map = new Map<string, DailyRecord>();
  for (const r of records) {
    const existing = map.get(r.name);
    if (existing) {
      existing.calls += r.calls;
      existing.dispatchClose += r.dispatchClose;
      existing.followupClose += r.followupClose;
      existing.renewalAmount += r.renewalAmount;
      existing.revenue += r.revenue;
    } else {
      map.set(r.name, { ...r });
    }
  }
  return [...map.values()].sort((a, b) => b.revenue - a.revenue);
}
