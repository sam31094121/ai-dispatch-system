const GROUP_KEYS = Object.freeze(['A1', 'A2', 'B', 'C']);
const GROUP_RANK_POLICY = Object.freeze({
  A1: { min: 1, max: 4, label: '🔴 A1｜高優先主力' },
  A2: { min: 5, max: 11, label: '🟠 A2｜次主力追進' },
  B: { min: 12, max: 18, label: '🟡 B組｜一般量單' },
  C: { min: 19, max: 999, label: '🟢 C組｜補位／觀察' }
});
const RANKING_METRICS = Object.freeze([
  '正式權重分數',
  '實收',
  '續單金額',
  '總業績',
  '追續客單價',
  '追續成交總數'
]);
const AUDIT_METRICS = Object.freeze([
  '追續單成交',
  '全部總業績',
  '追續單金額',
  '實收總金額'
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
const SORT_RULE_TEXT = '正式權重分數 → 實收總業績 → 追續單金額 → 全部總金額 → 追續客單價 → 追續單數量';
const WEIGHTING_POLICY = Object.freeze({
  title: 'AI比例原則永久鎖死版',
  description: '依當日結算業績計算；每個項目依全員最高值換算比例分數，再加總（滿分 10000）。',
  locked: true,
  maxScore: 10000,
  weights: Object.freeze([
    { key: '實收', label: '實收總業績', weight: 3000 },
    { key: '續單金額', label: '追續單金額', weight: 2500 },
    { key: '總業績', label: '全部總金額', weight: 1500 },
    { key: '追續客單價', label: '追續客單價', weight: 1500 },
    { key: '追續成交總數', label: '追續單數量', weight: 1500 }
  ]),
  formula: '正式權重分數 = 各項個人數值 ÷ 全員最高值 × 該項權重，再加總（滿分 10000）',
  safeguards: Object.freeze([
    '全員最高值為 0 時，該項所有人分數一律記 0。',
    '追續單數量為 0 時，追續客單價一律記 0。',
    '不可出現除以 0、NaN、Infinity。',
    '已離職只列審計，不進正式排名。',
    '不得人工手改排名。'
  ]),
  requiredInputFields: Object.freeze([
    '姓名',
    '是否離職',
    '是否新人',
    '實收總業績',
    '追續單金額',
    '全部總金額',
    '追續單數量'
  ]),
  requiredOutputFields: Object.freeze([
    '審計結果',
    '整合總盤',
    '正式名次',
    '正式權重分數',
    '派單順序'
  ])
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
const UNIFIED_COMMAND_SPEC = Object.freeze({
  sourceOfTruth: 'backend',
  syncPolicy: 'backend_snapshot_only',
  normalFlow: Object.freeze(['current', 'audit', 'save', 'broadcast', 'line-output']),
  exceptionFlow: Object.freeze(['smart-fix']),
  commands: Object.freeze({
    current: Object.freeze({
      method: 'GET',
      path: '/api/current',
      mode: 'read',
      input: Object.freeze([]),
      output: 'backend snapshot',
      abnormalOnly: false
    }),
    audit: Object.freeze({
      method: 'POST',
      path: '/api/audit',
      mode: 'preview',
      input: Object.freeze(['rawText']),
      output: 'backend snapshot',
      abnormalOnly: false
    }),
    save: Object.freeze({
      method: 'POST',
      path: '/api/save',
      mode: 'persist',
      input: Object.freeze(['rawText']),
      output: 'locked backend snapshot',
      abnormalOnly: false
    }),
    unifiedUpdate: Object.freeze({
      method: 'POST',
      path: '/api/unified/update',
      mode: 'persist',
      input: Object.freeze(['rawText']),
      output: 'locked backend snapshot',
      abnormalOnly: false
    }),
    broadcast: Object.freeze({
      method: 'GET',
      path: '/api/broadcast/current',
      mode: 'read',
      input: Object.freeze([]),
      output: 'backend broadcast snapshot',
      abnormalOnly: false
    }),
    lineOutput: Object.freeze({
      method: 'GET',
      path: '/api/line-output',
      mode: 'read',
      input: Object.freeze([]),
      output: 'backend line text',
      abnormalOnly: false
    }),
    smartFix: Object.freeze({
      method: 'POST',
      path: '/api/smart-fix',
      mode: 'repair',
      input: Object.freeze(['rawText']),
      output: 'repair suggestion',
      abnormalOnly: true
    })
  })
});
const TROPHY_POLICY = Object.freeze({
  threshold: 7000,
  icon: '🏆',
  label: '榮耀金獎',
  description: '正式權重分數達 7000 分以上自動授獎'
});
const BANNED_NAME_PATTERNS = Object.freeze([
  {
    field: 'name',
    pattern: /徐華(?!妤)/u,
    reason: '姓名必須使用正名「徐華妤」，不得出現其他錯寫。'
  }
]);

module.exports = {
  GROUP_KEYS,
  GROUP_RANK_POLICY,
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
  UNIFIED_COMMAND_SPEC,
  TROPHY_POLICY,
  BANNED_NAME_PATTERNS
};
