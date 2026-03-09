/**
 * 人工智慧自動修正規則表 — 後端常數設定檔
 * 不允許前端修改，僅後端引擎讀取
 */
export interface AutoFixRule {
  rule_code: string;
  rule_name: string;
  fix_level: '可自動修正' | '建議確認' | '禁止自修';
  target_field: string;
  trigger_condition: string;
  action: string;
  allow_apply: boolean;
  require_manual_confirm: boolean;
}

export const AUTO_FIX_RULES: AutoFixRule[] = [
  {
    rule_code: 'FMT_001',
    rule_name: '千分位修正',
    fix_level: '可自動修正',
    target_field: '金額欄位',
    trigger_condition: '純數字且疑似缺千分位格式',
    action: '只補格式，不改實際數值',
    allow_apply: true,
    require_manual_confirm: false,
  },
  {
    rule_code: 'FMT_002',
    rule_name: '全形半形修正',
    fix_level: '可自動修正',
    target_field: '所有文字欄位',
    trigger_condition: '偵測到全形數字或全形括號',
    action: '轉為半形數字與標準括號',
    allow_apply: true,
    require_manual_confirm: false,
  },
  {
    rule_code: 'FMT_003',
    rule_name: '前後空白修正',
    fix_level: '可自動修正',
    target_field: '姓名、平台、標題',
    trigger_condition: '欄位前後有空白字元',
    action: '移除空白',
    allow_apply: true,
    require_manual_confirm: false,
  },
  {
    rule_code: 'FMT_004',
    rule_name: '百分比格式修正',
    fix_level: '可自動修正',
    target_field: '成交率欄位',
    trigger_condition: '數字未帶百分比格式',
    action: '只做顯示格式統一',
    allow_apply: true,
    require_manual_confirm: false,
  },
  {
    rule_code: 'NAME_001',
    rule_name: '姓名疑似衝突',
    fix_level: '建議確認',
    target_field: '姓名',
    trigger_condition: '疑似同音或常見錯字',
    action: '提出候選修正，不直接覆寫',
    allow_apply: false,
    require_manual_confirm: true,
  },
  {
    rule_code: 'DATE_001',
    rule_name: '日期格式建議',
    fix_level: '建議確認',
    target_field: '報表日期',
    trigger_condition: '日期格式混用',
    action: '統一顯示為西元年月日',
    allow_apply: false,
    require_manual_confirm: true,
  },
  {
    rule_code: 'CORE_001',
    rule_name: '金額衝突禁止自修',
    fix_level: '禁止自修',
    target_field: '金額欄位',
    trigger_condition: '總計與個人加總不一致，或同欄位多來源不同值',
    action: '鎖死並提示人工確認',
    allow_apply: false,
    require_manual_confirm: true,
  },
  {
    rule_code: 'CORE_002',
    rule_name: '成交有值業績為零',
    fix_level: '禁止自修',
    target_field: '成交數與業績欄位',
    trigger_condition: '成交數 > 0 且業績 = 0',
    action: '鎖死並提示人工確認',
    allow_apply: false,
    require_manual_confirm: true,
  },
  {
    rule_code: 'CORE_003',
    rule_name: '追單有值業績為零',
    fix_level: '禁止自修',
    target_field: '追單與業績欄位',
    trigger_condition: '追單 > 0 且業績 = 0',
    action: '鎖死並提示人工確認',
    allow_apply: false,
    require_manual_confirm: true,
  },
  {
    rule_code: 'CORE_004',
    rule_name: '續單有值業績為零',
    fix_level: '禁止自修',
    target_field: '續單與業績欄位',
    trigger_condition: '續單 > 0 且業績 = 0',
    action: '鎖死並提示人工確認',
    allow_apply: false,
    require_manual_confirm: true,
  },
  {
    rule_code: 'CORE_005',
    rule_name: '累積數字倒退',
    fix_level: '禁止自修',
    target_field: '累積欄位',
    trigger_condition: '今日累積值小於昨日累積值',
    action: '鎖死並提示人工確認',
    allow_apply: false,
    require_manual_confirm: true,
  },
  {
    rule_code: 'CORE_006',
    rule_name: '疑似少零多零',
    fix_level: '禁止自修',
    target_field: '金額欄位',
    trigger_condition: '同欄位數值位數異常跳動',
    action: '僅提示疑似錯誤，不可改值',
    allow_apply: false,
    require_manual_confirm: true,
  },
];
