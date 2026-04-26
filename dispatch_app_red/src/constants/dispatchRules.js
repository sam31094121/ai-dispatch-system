const GROUP_KEYS = Object.freeze(['A1', 'A2', 'B', 'C']);
const RANKING_METRICS = Object.freeze([
  '正式權重分數',
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
const SORT_RULE_TEXT = 'AI 權重分數 (比例原則) → 總業績 → 續單金額 → 追續成交總數 → 派單成交總通數';
const WEIGHTING_POLICY = Object.freeze({
  title: 'AI 權重分數（比例原則）',
  description: '以 4/23 業績資料計算，供 4/24 今日正式派單使用；每個項目依全員最高值換算比例分數。',
  weights: Object.freeze([
    { key: '總業績', label: '今日業績', weight: 300 },
    { key: '續單金額', label: '續單金額', weight: 250 },
    { key: '追續成交總數', label: '追續成交', weight: 200 },
    { key: '派單成交總通數', label: '派單成交', weight: 150 },
    { key: 'base', label: '基礎分', weight: 100 }
  ]),
  formula: '正式權重分數 = 各項個人數值 ÷ 全員最高值 × 該項權重，再加總基礎分 100'
});
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
  WEIGHTING_POLICY,
  FRONTEND_LOCK_RULES,
  BANNED_NAME_PATTERNS
};
