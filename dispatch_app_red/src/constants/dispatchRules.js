const GROUP_KEYS = Object.freeze(['A1', 'A2', 'B', 'C']);
const RANKING_METRICS = Object.freeze([
  '總業績',
  '續單金額',
  '追續成交總數',
  '派單成交總通數'
]);
const AUDIT_METRICS = Object.freeze([
  '累積總派單數',
  '累積派單總成交數',
  '累積追續總成交數',
  '當日續單金額',
  '本月業績',
  '追續單總金額'
]);
const SUMMARY_METRICS = Object.freeze([...AUDIT_METRICS, '當日取消退貨']);
const PLATFORM_NAME_TO_KEY = Object.freeze({
  三立奕心: 'sanli_yixin',
  民視: 'ftv',
  公司產品: 'company_product'
});
const RESERVED_AUDIT_KEYS = Object.freeze([
  'result',
  'rule',
  'platforms',
  'notes',
  'excludedEmployees',
  '結果',
  '規則',
  '特別說明',
  '審計列示不入派單'
]);
const SERVICE_NAME = 'AI 派單公告系統 API';
const API_VERSION = 'v1';
const TIMEZONE = 'Asia/Taipei';
const DEFAULT_AUDIT_RULE = '先審計，後排序，再派單';
const SORT_RULE_TEXT = '總業績 → 續單金額 → 追續成交總數 → 派單成交總通數';
const FRONTEND_LOCK_RULES = Object.freeze([
  '後端唯一真實來源。',
  '前端只做畫面呈現，不做業務邏輯。',
  '正式名次、分級、建議、審計、精簡版全部來自同一筆 reportId。',
  `排序固定：${SORT_RULE_TEXT}。`,
  '已離職只列審計，不入正式派單。',
  '姓名必須完全正確，徐華妤禁止錯寫。',
  '任何前端畫面都不得與後端資料不一致。'
]);
const BANNED_NAME_PATTERNS = Object.freeze([
  {
    field: 'name',
    pattern: /徐華(?!妤)/u,
    reason: '姓名必須使用正名「徐華妤」，不得出現其他錯寫。'
  }
]);

module.exports = {
  GROUP_KEYS,
  RANKING_METRICS,
  AUDIT_METRICS,
  SUMMARY_METRICS,
  PLATFORM_NAME_TO_KEY,
  RESERVED_AUDIT_KEYS,
  SERVICE_NAME,
  API_VERSION,
  TIMEZONE,
  DEFAULT_AUDIT_RULE,
  SORT_RULE_TEXT,
  FRONTEND_LOCK_RULES,
  BANNED_NAME_PATTERNS
};
