// shared/contract.mjs
// ─── 唯一排序真理來源：server + frontend 共用 ───
// 排序優先順序：總業績 → 續單金額 → 追續通數 → 姓名（中文 locale）
export function sortEmployees(rows = []) {
  return [...rows].sort((a, b) => {
    if ((b.totalRevenue || 0) !== (a.totalRevenue || 0)) {
      return (b.totalRevenue || 0) - (a.totalRevenue || 0);
    }
    if ((b.renewRevenue || 0) !== (a.renewRevenue || 0)) {
      return (b.renewRevenue || 0) - (a.renewRevenue || 0);
    }
    if ((b.renewDeals || 0) !== (a.renewDeals || 0)) {
      return (b.renewDeals || 0) - (a.renewDeals || 0);
    }
    return a.name.localeCompare(b.name, 'zh-Hant');
  }).map((row, index) => ({ ...row, rank: index + 1 }));
}
