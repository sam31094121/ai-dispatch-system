// types.ts

export type ReportType =
  | 'dispatch-ranking'
  | 'performance-summary'
  | 'audit-report';

export type RecordStatus =
  | 'active'
  | 'inactive'
  | 'departed'
  | 'archived';

export interface ReportMeta {
  title: string;
  date: string;
  reportType: ReportType;
  theme: string;
  requireAck: boolean;
  subtitle?: string;
  version?: string;
}

export interface SummaryMetric {
  key: string;
  label: string;
  value: string | number;
  highlight?: boolean;
  unit?: string;
  displayOrder: number;
}

export interface RankingItem {
  rank: number;
  name: string;
  isNewcomer: boolean;
  summaryTitle?: string;
  aiAnalysis: string;
  suggestion: string;
  focusMetrics: string[];
  pressureMessage: string;
  actionMessage: string;
  tags: string[];
  status: RecordStatus;
  active: boolean;
  displayOrder: number;
}

export interface ReportNote {
  type: string;
  title: string;
  content: string;
  affectsReport: boolean;
  affectsDispatch: boolean;
  displayOrder: number;
}

export interface FooterAction {
  title: string;
  instruction: string;
  replyKeyword: string;
  fallbackText: string;
}

export interface DispatchReportPayload {
  reportMeta: ReportMeta;
  summaryMetrics: SummaryMetric[];
  rankingItems: RankingItem[];
  notes: ReportNote[];
  footerAction: FooterAction;
  generatedAt: string;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export interface ApiErrorBody {
  success?: boolean;
  message?: string;
  error?: string;
  details?: unknown;
}
