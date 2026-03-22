/** metricFormatter — SummaryMetric → SummaryCardVM */
import type { SummaryMetric, SummaryCardVM } from '../types/dispatchReport';

function formatValue(value: string | number, unit?: string): string {
  if (typeof value === 'number') {
    const fmt = value >= 10000
      ? `$${value.toLocaleString()}`
      : value.toLocaleString();
    return unit ? `${fmt} ${unit}` : fmt;
  }
  return unit ? `${value} ${unit}` : value;
}

export function toSummaryCardVM(m: SummaryMetric): SummaryCardVM {
  return {
    key:          m.key,
    label:        m.label,
    display:      formatValue(m.value, m.unit),
    highlight:    m.highlight ?? false,
    displayOrder: m.displayOrder,
    copyText:     `${m.label}：${formatValue(m.value, m.unit)}`,
  };
}

export function toSummaryCardVMs(metrics: SummaryMetric[]): SummaryCardVM[] {
  return [...metrics]
    .sort((a, b) => a.displayOrder - b.displayOrder)
    .map(toSummaryCardVM);
}
