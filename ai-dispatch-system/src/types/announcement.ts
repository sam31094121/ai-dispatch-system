// ═══════════════════════════════════════════════════════════
//  AI 派單公告 — 結構化卡片資料型別（前後端共用）
// ═══════════════════════════════════════════════════════════

export interface ReportMeta {
  title:        string;
  date:         string;
  dateLabel:    string;
  nextDate:     string;
  reportType:   'dispatch-ranking';
  theme:        string;
  requireAck:   boolean;
  totalRevenue: number;
  totalCount:   number;
}

export interface RankingItem {
  rank:             number;
  name:             string;
  isNewcomer:       boolean;
  group:            'A1' | 'A2' | 'B' | 'C';
  groupLabel:       string;
  summaryTitle:     string;
  aiAnalysis:       string;
  suggestion:       string;
  focusMetrics:     string[];
  pressureMessage:  string;
  actionMessage:    string;
  tags:             string[];
  status:           'active' | 'inactive';
  active:           boolean;
  displayOrder:     number;
  totalRevenue:     number;
  followupAmount:   number;
  followupCount:    number;
}

export interface NoteItem {
  type:            'employment-status' | 'audit-note' | 'calc-note' | 'general';
  title:           string;
  content:         string;
  affectsReport:   boolean;
  affectsDispatch: boolean;
  displayOrder:    number;
}

export interface FooterAction {
  title:        string;
  instruction:  string;
  replyKeyword: string;
  fallbackText: string;
}

export interface StructuredAnnouncement {
  reportMeta:   ReportMeta;
  rankingItems: RankingItem[];
  notes:        NoteItem[];
  footerAction: FooterAction;
}

export const GROUP_COLORS: Record<string, string> = {
  A1: '#EF4444', A2: '#F59E0B', B: '#FBBF24', C: '#10B981',
};

export const GROUP_LABELS: Record<string, string> = {
  A1: '🔴 A1｜高單主力', A2: '🟠 A2｜續單收割',
  B:  '🟡 B 組｜一般量單', C: '🟢 C 組｜觀察培養',
};

// ─── 既有型別保留 ────────────────────────────────────────────

export interface AnnouncementGeneratePayload {
  reportDate: string;
  includeFullText?: boolean;
  includeLineText?: boolean;
  includeShortText?: boolean;
  includeVoiceText?: boolean;
  includeManagerText?: boolean;
}

export interface AnnouncementOutput {
  id?: number;
  reportDate: string;
  fullText: string | null;
  lineText: string | null;
  shortText: string | null;
  voiceText: string | null;
  managerText: string | null;
  finalConfirmText?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface AnnouncementRegeneratePayload {
  reportDate: string;
  versionType: 'full' | 'line' | 'short' | 'voice' | 'manager';
}
