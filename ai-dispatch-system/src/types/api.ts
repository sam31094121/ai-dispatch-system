// ═══════════════════════════════════════════════════════
// 後端 API 回傳型別 — 欄位全部 snake_case
// 對齊 server/db/schema.ts 12 張資料表
// ═══════════════════════════════════════════════════════

import type {
  平台名稱, 報表模式, 解析狀態, 審計狀態, 公告狀態,
  身分標記, 修正等級, 修正類型, 審計結果, 異常等級,
  審計異常類型, 解析階段, 解析結果, 派單分組, 使用者角色, 異動來源,
} from '../constants/options';

// ── 通用 API 信封 ──
export interface ApiEnvelope<T> {
  success: boolean;
  message: string;
  data: T;
  error_code: string | null;
}

// ── 1. app_users ──
export interface ApiAppUser {
  id: number;
  account: string;
  password_hash: string;
  display_name: string;
  role_name: 使用者角色;
  is_enabled: number;
  created_at: string;
  last_login_at: string | null;
}

// ── 2. daily_reports ──
export interface ApiDailyReport {
  id: number;
  report_date: string;
  platform_name: 平台名稱;
  report_mode: 報表模式;
  raw_text_content: string;
  parse_status: 解析狀態;
  audit_status: 審計狀態;
  announcement_status: 公告狀態;
  created_by_user_id: number;
  note_text: string | null;
  created_at: string;
  updated_at: string;
}

// ── 3. daily_report_totals ──
export interface ApiReportTotals {
  id: number;
  report_id: number;
  total_calls: number;
  assigned_deals_count: number;
  followup_deals_count: number;
  closing_rate_percent: number | null;
  followup_amount: number;
  cancelled_return_amount: number;
  total_revenue_amount: number;
  created_at: string;
  updated_at: string;
}

// ── 4. daily_report_details ──
export interface ApiReportDetail {
  id: number;
  report_id: number;
  employee_name: string;
  normalized_name: string;
  identity_tag: 身分標記;
  total_calls: number;
  assigned_deals_count: number;
  followup_deals_count: number;
  closing_rate_percent: number | null;
  followup_amount: number;
  cancelled_return_amount: number;
  total_revenue_amount: number;
  raw_row_order: number;
  is_manually_confirmed: number;
  created_at: string;
  updated_at: string;
}

// ── 5. ai_parse_logs ──
export interface ApiParseLog {
  id: number;
  report_id: number;
  parse_stage: 解析階段;
  parse_result: 解析結果;
  description_text: string | null;
  created_at: string;
}

// ── 6. ai_auto_fix_logs ──
export interface ApiAutoFixLog {
  id: number;
  report_id: number;
  detail_id: number | null;
  fix_level: 修正等級;
  fix_type: 修正類型;
  field_name: string;
  value_before: string | null;
  value_after: string | null;
  is_applied: number;
  requires_manual_confirm: number;
  created_at: string;
}

// ── 7. ai_audit_results ──
export interface ApiAuditResult {
  id: number;
  report_id: number;
  consistency_result: 審計結果;
  logic_result: 審計結果;
  cumulative_result: 審計結果;
  final_result: 審計結果;
  can_generate_ranking: number;
  can_generate_dispatch: number;
  can_generate_announce: number;
  audit_summary: string | null;
  created_at: string;
}

// ── 8. ai_audit_issues ──
export interface ApiAuditIssue {
  id: number;
  report_id: number;
  detail_id: number | null;
  issue_type: 審計異常類型;
  issue_level: 異常等級;
  field_name: string | null;
  raw_value: string | null;
  expected_value: string | null;
  diff_value: string | null;
  suggestion_text: string | null;
  is_resolved: number;
  created_at: string;
}

// ── 9. integrated_rankings ──
export interface ApiRanking {
  id: number;
  report_date: string;
  employee_name: string;
  normalized_name: string;
  total_followup_count: number;
  total_followup_amount: number;
  total_revenue_amount: number;
  total_actual_amount: number;
  total_cancel_amount: number;
  rank_no: number;
  ranking_rule_text: string;
  source_platform_data: string;
  created_at: string;
}

// ── 10. dispatch_group_results ──
export interface ApiDispatchGroup {
  id: number;
  report_date: string;
  employee_name: string;
  normalized_name: string;
  rank_no: number;
  dispatch_group: 派單分組;
  group_order_no: number;
  suggestion_text: string | null;
  pressure_text: string | null;
  motivation_text: string | null;
  created_at: string;
}

// ── 11. announcement_outputs ──
export interface ApiAnnouncement {
  id: number;
  report_date: string;
  full_text: string | null;
  line_text: string | null;
  short_text: string | null;
  voice_text: string | null;
  manager_text: string | null;
  final_confirm_text: string | null;
  created_at: string;
  updated_at: string;
}

// ── 12. version_change_logs ──
export interface ApiVersionLog {
  id: number;
  report_id: number;
  detail_id: number | null;
  changed_field_name: string;
  value_before: string | null;
  value_after: string | null;
  change_reason: string;
  changed_by_user_id: number | null;
  change_source: 異動來源;
  created_at: string;
}
