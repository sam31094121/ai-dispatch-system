const data = [
  { name: '王珍珠', totalCalls: 27, orderCalls: 18, followCalls: 4, rate: 81, followAmount: 24620, revenue: 113990 },
  { name: '馬秋香', totalCalls: 15, orderCalls: 9, followCalls: 7, rate: 107, followAmount: 39620, revenue: 102040 },
  { name: '李玲玲', totalCalls: 23, orderCalls: 18, followCalls: 1, rate: 83, followAmount: 14280, revenue: 143030 },
  { name: '王梅慧', totalCalls: 23, orderCalls: 14, followCalls: 2, rate: 70, followAmount: 46380, revenue: 105590 },
  { name: '湯玉琦', totalCalls: 16, orderCalls: 15, followCalls: 2, rate: 106, followAmount: 12580, revenue: 112324 },
  { name: '高如郁', totalCalls: 19, orderCalls: 15, followCalls: 1, rate: 84, followAmount: 7580, revenue: 82050 },
  { name: '廖姿惠', totalCalls: 24, orderCalls: 21, followCalls: 1, rate: 92, followAmount: 3980, revenue: 137070 },
  { name: '江麗勉', totalCalls: 9, orderCalls: 6, followCalls: 0, rate: 67, followAmount: 0, revenue: 40860 },
  { name: '林宜靜', totalCalls: 19, orderCalls: 15, followCalls: 1, rate: 84, followAmount: 3000, revenue: 64760 },
  { name: '徐華妤', totalCalls: 13, orderCalls: 6, followCalls: 3, rate: 69, followAmount: 15340, revenue: 36040 },
  { name: '江沛林', totalCalls: 15, orderCalls: 7, followCalls: 1, rate: 53, followAmount: 3390, revenue: 29310 },
  { name: '梁依萍', totalCalls: 16, orderCalls: 7, followCalls: 3, rate: 63, followAmount: 20250, revenue: 82980 },
  { name: '許淑英', totalCalls: 0, orderCalls: 0, followCalls: 2, rate: 0, followAmount: 6960, revenue: 6960 },
  { name: '陳玲華', totalCalls: 12, orderCalls: 6, followCalls: 0, rate: 50, followAmount: 0, revenue: 43040 },
  { name: '鄭珮恩', totalCalls: 0, orderCalls: 0, followCalls: 3, rate: 0, followAmount: 11255, revenue: 11255 },
  { name: '董昭蘭', totalCalls: 0, orderCalls: 0, followCalls: 1, rate: 0, followAmount: 1495, revenue: 1495 },
  { name: '林佩君', totalCalls: 0, orderCalls: 0, followCalls: 1, rate: 0, followAmount: 2490, revenue: 2490 },
  { name: '林沛昕', totalCalls: 13, orderCalls: 8, followCalls: 2, rate: 77, followAmount: 18260, revenue: 66740 },
  { name: '高美雲', totalCalls: 16, orderCalls: 10, followCalls: 1, rate: 69, followAmount: 4680, revenue: 129430 },
  { name: '蘇淑玲', totalCalls: 14, orderCalls: 10, followCalls: 5, rate: 107, followAmount: 36640, revenue: 82290 },
  { name: '謝啟芳', totalCalls: 0, orderCalls: 0, followCalls: 1, rate: 0, followAmount: 3264, revenue: 3264 }
];

const sum = {
  totalCalls: 0,
  orderCalls: 0,
  followCalls: 0,
  followAmount: 0,
  revenue: 0
};

data.forEach(p => {
  sum.totalCalls += p.totalCalls;
  sum.orderCalls += p.orderCalls;
  sum.followCalls += p.followCalls;
  sum.followAmount += p.followAmount;
  sum.revenue += p.revenue;
});

console.log("=== 計算產出 ===");
console.log(sum);

const reportHeader = {
  totalCalls: 274,
  orderCalls: 185,
  followCalls: 42,
  followAmount: 276064,
  revenue: 1397008
};

console.log("\n=== 差異比對 (個別加總 - 表頭) ===");
console.log({
  totalCalls: sum.totalCalls - reportHeader.totalCalls,
  orderCalls: sum.orderCalls - reportHeader.orderCalls,
  followCalls: sum.followCalls - reportHeader.followCalls,
  followAmount: sum.followAmount - reportHeader.followAmount,
  revenue: sum.revenue - reportHeader.revenue
});

// 檢查邏輯矛盾
const contradictions = [];
data.forEach(p => {
  if (p.revenue > 0 && p.orderCalls === 0 && p.followCalls === 0) {
    contradictions.push(`${p.name}: 業績=${p.revenue} 但 成交=0`);
  }
  if (p.followAmount > 0 && p.followCalls === 0) {
    contradictions.push(`${p.name}: 追續單金額=${p.followAmount} 但 追續成交=0`);
  }
});

console.log("\n=== 邏輯矛盾 ===");
if (contradictions.length === 0) console.log("無發現明顯矛盾");
else contradictions.forEach(c => console.log(c));
