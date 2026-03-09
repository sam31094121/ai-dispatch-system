export function getAuditTone(result: string): 'pass' | 'fail' | 'warn' | 'info' {
  if (result === '通過') return 'pass';
  if (result === '失敗') return 'fail';
  if (result === '鎖死') return 'fail';
  if (result === '警告') return 'warn';
  return 'info';
}

/** 金額格式化：加千分位逗號，前置 $ */
export function formatMoney(value: number): string {
  return `$${value.toLocaleString('zh-TW')}`;
}

/** 百分比格式化 */
export function formatPercent(value: number | null | undefined, decimals = 1): string {
  if (value == null) return '-';
  return `${value.toFixed(decimals)}%`;
}
