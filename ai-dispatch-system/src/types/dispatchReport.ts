/**
 * dispatchReport.ts — 派單報表系統唯一型別定義
 *
 * 規則：
 * 1. 所有前後端欄位以此檔為準
 * 2. 不允許在元件內自行定義同義 interface
 * 3. rank 決定排序，displayOrder 為次排序
 * 4. active=false 不得出現在主排名區
 * 5. 正確姓名以後端 DB 為準（禁止硬編碼錯誤姓名）
 */

// ─── 基礎枚舉 ──────────────────────────────────────────────

export type ReportType =
  | 'dispatch-ranking'
  | 'performance-summary'
  | 'audit-report';

export type RecordStatus =
  | 'active'
  | 'inactive'
  | 'departed'
  | 'archived';

export type NoteType =
  | 'employment-status'
  | 'audit-note'
  | 'calc-note'
  | 'general';

// ─── 報表 Meta ─────────────────────────────────────────────

export interface ReportMeta {
  title:       string;
  date:        string;        // YYYY-MM-DD
  dateLabel:   string;        // M/D 顯示用
  nextDate:    string;        // 明日 M/D
  reportType:  ReportType;
  theme:       string;
  requireAck:  boolean;
  subtitle?:   string;
  version?:    string;
}

// ─── 總覽指標（頂部摘要卡） ─────────────────────────────────

export interface SummaryMetric {
  key:          string;
  label:        string;
  value:        string | number;
  highlight?:   boolean;
  unit?:        string;
  displayOrder: number;
}

// ─── 排名項目（每位人員一筆）──────────────────────────────

export interface RankingItem {
  rank:             number;
  name:             string;
  isNewcomer:       boolean;
  group:            'A1' | 'A2' | 'B' | 'C';
  groupLabel:       string;
  summaryTitle?:    string;
  aiAnalysis:       string;
  suggestion:       string;
  focusMetrics:     string[];
  pressureMessage:  string;
  actionMessage:    string;
  tags:             string[];
  status:           RecordStatus;
  active:           boolean;
  displayOrder:     number;
  totalRevenue:     number;
  followupAmount:   number;
  followupCount:    number;
}

// ─── 補充說明（離職、審計補充等） ──────────────────────────

export interface ReportNote {
  type:            NoteType;
  title:           string;
  content:         string;
  affectsReport:   boolean;
  affectsDispatch: boolean;
  displayOrder:    number;
}

// ─── 最後確認區 ────────────────────────────────────────────

export interface FooterAction {
  title:        string;
  instruction:  string;
  replyKeyword: string;
  fallbackText: string;
}

// ─── 完整報表 Payload（後端 /structured 回傳 + 前端使用） ──

export interface DispatchReportPayload {
  reportMeta:     ReportMeta;
  summaryMetrics: SummaryMetric[];
  rankingItems:   RankingItem[];
  notes:          ReportNote[];
  footerAction:   FooterAction;
  generatedAt:    string;
}

// ─── API Envelope ──────────────────────────────────────────

export interface ApiEnvelope<T> {
  success:    boolean;
  message:    string;
  data:       T;
  error_code: string | null;
}

// ─── UI ViewModel（formatter 產出，元件使用） ──────────────

/** RankingCard 渲染用 model */
export interface RankingCardVM {
  rank:            number;
  name:            string;
  isNewcomer:      boolean;
  group:           string;
  groupColor:      string;
  summaryTitle:    string;
  aiAnalysis:      string;
  suggestion:      string;
  focusMetrics:    string[];
  pressureMessage: string;
  actionMessage:   string;
  tags:            string[];
  totalRevenue:    number;
  displayOrder:    number;
  /** 複製文案（by clipboardFormatter） */
  copyText:        string;
}

/** NoteCard 渲染用 model */
export interface NoteCardVM {
  title:           string;
  content:         string;
  affectsReport:   boolean;
  affectsDispatch: boolean;
  badgeColor:      string;
  displayOrder:    number;
}

/** SummaryCard 渲染用 model */
export interface SummaryCardVM {
  key:         string;
  label:       string;
  display:     string;   // 已格式化的顯示字串
  highlight:   boolean;
  displayOrder: number;
  copyText:    string;
}

// ─── 梯隊常數 ──────────────────────────────────────────────

export const GROUP_COLORS: Record<string, string> = {
  A1: '#EF4444',
  A2: '#F59E0B',
  B:  '#FBBF24',
  C:  '#10B981',
};

export const GROUP_LABELS: Record<string, string> = {
  A1: '🔴 A1｜高單主力',
  A2: '🟠 A2｜續單收割',
  B:  '🟡 B 組｜一般量單',
  C:  '🟢 C 組｜觀察培養',
};

export const GROUP_ORDER = ['A1', 'A2', 'B', 'C'] as const;
