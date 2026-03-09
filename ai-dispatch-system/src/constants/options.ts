// ═══════════════════════════════════════════════════════
// 集中管理：下拉選單 ∕ 狀態列 ∕ 字典 ∕ 顏色對照
// 前端唯一真相來源 — 所有選項與衍生 type 都從這裡匯出
// ═══════════════════════════════════════════════════════

// ── 平台 ──
export const 平台選項 = ['奕心', '民視', '公司產品'] as const;
export type 平台名稱 = (typeof 平台選項)[number];

// ── 報表模式 ──
export const 報表模式選項 = ['累積報表', '單日報表'] as const;
export type 報表模式 = (typeof 報表模式選項)[number];

// ── 解析狀態 ──
export const 解析狀態選項 = ['未解析', '解析成功', '解析失敗'] as const;
export type 解析狀態 = (typeof 解析狀態選項)[number];

// ── 審計狀態 ──
export const 審計狀態選項 = ['未審計', '審計通過', '審計失敗'] as const;
export type 審計狀態 = (typeof 審計狀態選項)[number];

// ── 公告狀態 ──
export const 公告狀態選項 = ['未生成', '已生成'] as const;
export type 公告狀態 = (typeof 公告狀態選項)[number];

// ── 身分標記 ──
export const 身分標記選項 = ['一般', '新人', '停用'] as const;
export type 身分標記 = (typeof 身分標記選項)[number];

// ── 修正等級 ──
export const 修正等級選項 = ['可自動修正', '建議確認', '禁止自修'] as const;
export type 修正等級 = (typeof 修正等級選項)[number];

// ── 審計結果 ──
export const 審計結果選項 = ['通過', '失敗'] as const;
export type 審計結果 = (typeof 審計結果選項)[number];

// ── 異常等級 ──
export const 異常等級選項 = ['警告', '鎖死'] as const;
export type 異常等級 = (typeof 異常等級選項)[number];

// ── 派單分組 ──
export const 派單分組選項 = ['A1', 'A2', 'B', 'C'] as const;
export type 派單分組 = (typeof 派單分組選項)[number];

// ── 使用者角色 ──
export const 使用者角色選項 = ['管理員', '主管', '一般操作員'] as const;
export type 使用者角色 = (typeof 使用者角色選項)[number];

// ── 解析階段（ai_parse_logs.parse_stage） ──
export const 解析階段選項 = ['格式清洗', '結構辨識', '總計提取', '明細提取', '姓名提取'] as const;
export type 解析階段 = (typeof 解析階段選項)[number];

// ── 解析結果（ai_parse_logs.parse_result） ──
export const 解析結果選項 = ['成功', '失敗', '部分成功'] as const;
export type 解析結果 = (typeof 解析結果選項)[number];

// ── 修正類型（ai_auto_fix_logs.fix_type） ──
export const 修正類型選項 = [
  '千分位修正', '空白修正', '全形半形修正', '括號修正',
  '欄位名稱統一', '新人標記統一', '姓名疑似衝突',
  '日期格式建議', '百分比格式修正', '換行錯位重整',
] as const;
export type 修正類型 = (typeof 修正類型選項)[number];

// ── 審計異常類型（ai_audit_issues.issue_type） ──
export const 審計異常類型選項 = [
  '天地盤差額', '成交有值業績為零', '追單有值業績為零',
  '續單有值業績為零', '累積倒退', '欄位缺漏',
  '姓名衝突', '退貨未反映', '疑似少零多零',
] as const;
export type 審計異常類型 = (typeof 審計異常類型選項)[number];

// ── 異動來源（version_change_logs.change_source） ──
export const 異動來源選項 = ['人工', '系統自動修正', '套用建議'] as const;
export type 異動來源 = (typeof 異動來源選項)[number];

// ── 顏色對照 ──
export const 狀態顏色對照 = {
  pass: '#4f8a5b',
  warn: '#d1842b',
  fail: '#9c2f2f',
  info: '#3d5a80',
  base: '#efe6d1',
  number: '#7a5c1f',
} as const;
