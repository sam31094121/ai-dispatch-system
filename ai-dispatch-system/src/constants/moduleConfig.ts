// ════════════════════════════════════════════════════
// 核心設定檔 — 全系統唯一真相來源
// 8 大核心中心取代原 19 個分散頁面
// ════════════════════════════════════════════════════

// ─── 角色類型 ───
export const ROLE_OPTIONS = ['老闆', '主管', '員工', '系統管理員'] as const;
export type RoleType = (typeof ROLE_OPTIONS)[number];

// ─── 8 大核心中心代碼 ───
export const CENTER_KEYS = [
  'workbench',       // 每日業績核心樞紐
  'report-center',   // 業績輸入與智能審計中心
  'dispatch-center', // 軍團派單中心
  'announce-center', // 公告與智慧播報中心
  'hv-center',       // 高價成交中心
  'line-center',     // LINE 轉傳中心
  'talent-center',   // 人才管理中心
  'system-center',   // 系統設定中心
] as const;

export type CenterKey = (typeof CENTER_KEYS)[number];

// ─── 模組類別（功能定位分類） ───
export const MODULE_CATEGORIES = [
  'core-home',       // 核心首頁
  'report-process',  // 業績處理
  'dispatch-mgmt',   // 派單管理
  'announce-cast',   // 公告播報
  'high-value',      // 高價成交
  'transfer-mgmt',   // 轉傳管理
  'talent-mgmt',     // 人才管理
  'system-mgmt',     // 系統管理
] as const;

export type ModuleCategory = (typeof MODULE_CATEGORIES)[number];

// ─── 中心設定 ───
export interface CenterConfig {
  key: CenterKey;
  label: string;
  path: string;
  description: string;
  roles: RoleType[];
  group: string;
  category: ModuleCategory; // 功能定位分類
  order: number;
  subFeatures: string[];
  aliases: string[];        // 別名清單（用於名稱近似偵測）
  isCore: boolean;          // 是否為核心中心
  isEnabled: boolean;       // 是否啟用
  strengthScore: number;    // 強度分數（0–100）
  optimizeScore: number;    // 優化分數（0–100）
}

// ─── 導覽群組設定 ───
export interface NavGroupConfig {
  groupName: string;
  icon: string;
  centerKeys: CenterKey[];
  order: number;
}

// ─── 合併規則（舊功能 → 新中心） ───
export interface MergeRule {
  oldName: string;
  newCenterKey: CenterKey;
  reason: string;
}

// ─── 衝突紀錄（自動偵測四種衝突類型） ───
export type ConflictType = 'path-duplicate' | 'category-conflict' | 'name-similar' | 'feature-overlap';

export interface ConflictRecord {
  conflictType: ConflictType;
  candidateKeys: string[];    // 所有參與競爭的中心代碼
  retainedCenterKey: string;  // 保留的中心代碼
  disabledKeys: string[];     // 被停用的中心代碼
  explanation: string;        // 原因說明
}

// ─── 停用功能紀錄 ───
export interface DisabledFeatureLog {
  oldName: string;
  reason: string;
  retainedCenterKey: string;
}

// ─── 自動維修結果 ───
export interface AutoRepairResult {
  activeCenters: CenterConfig[];
  mergedFeatures: MergeRule[];
  conflictRecords: ConflictRecord[];
  disabledLog: DisabledFeatureLog[];
  summary: string[];
}

// ─── 自動啟動任務 ───
export interface AutoStartTask {
  key: string;
  label: string;
  description: string;
  level: '核心' | '重要' | '一般';
  order: number;
}

// ─── 首頁摘要卡片 ───
export interface SummaryCard {
  key: string;
  title: string;
  subtitle: string;
  fieldLabel: string;
  defaultValue: string;
  colorVar: string;
}

// ════════════════════════════════════════════════════
// 8 大核心中心清單
// ════════════════════════════════════════════════════
export const CENTER_CONFIGS: CenterConfig[] = [
  {
    key: 'workbench',
    label: '每日業績核心樞紐',
    path: '/',
    description: '整體工作台首頁，顯示今日狀態、流程進度與快捷入口。',
    roles: ['老闆', '主管', '系統管理員'],
    group: '每日核心流程',
    category: 'core-home',
    order: 1,
    subFeatures: ['今日狀態總覽', '流程進度', '快捷入口', '異常提醒', '系統維修摘要'],
    aliases: ['首頁', '主頁', '工作台', '核心樞紐'],
    isCore: true,
    isEnabled: true,
    strengthScore: 100,
    optimizeScore: 100,
  },
  {
    key: 'report-center',
    label: '業績輸入與智能審計中心',
    path: '/report-center',
    description: '原始日報輸入、格式清洗、解析、審計、衝突提示、修正確認。',
    roles: ['老闆', '主管', '系統管理員'],
    group: '每日核心流程',
    category: 'report-process',
    order: 2,
    subFeatures: ['原始日報輸入', '智能解析', '格式清洗', '智能審計', '衝突提示', '人工確認', '修正紀錄'],
    aliases: ['輸入站', '解析結果', '智能審計', '業績輸入'],
    isCore: true,
    isEnabled: true,
    strengthScore: 96,
    optimizeScore: 98,
  },
  {
    key: 'dispatch-center',
    label: '軍團派單中心',
    path: '/dispatch-center',
    description: '整合名次、派單分組、員工建議、行銷建議、明日派單順序。',
    roles: ['老闆', '主管', '系統管理員'],
    group: '每日核心流程',
    category: 'dispatch-mgmt',
    order: 3,
    subFeatures: ['整合名次', 'A1A2BC分組', '明日派單順序', '每人一句建議', '主管派單總覽', '員工個人摘要', '今日行銷建議'],
    aliases: ['主管派單台', '員工個人頁', 'AI行銷建議', '派單台'],
    isCore: true,
    isEnabled: true,
    strengthScore: 95,
    optimizeScore: 97,
  },
  {
    key: 'announce-center',
    label: '公告與智慧播報中心',
    path: '/announce-center',
    description: '公告生成、精簡版、播報版、主管版、女聲播報設定與播放。',
    roles: ['老闆', '主管', '系統管理員'],
    group: '業務作戰',
    category: 'announce-cast',
    order: 4,
    subFeatures: ['完整版公告', 'LINE精簡版', '超短版', '播報版', '主管版', '女聲播報設定', '播放控制'],
    aliases: ['公告發報', '播報總控台', '播報稿管理', '播報風格', '播放控制', '女聲智慧播報'],
    isCore: true,
    isEnabled: true,
    strengthScore: 94,
    optimizeScore: 96,
  },
  {
    key: 'hv-center',
    label: '高價成交中心',
    path: '/hv-center',
    description: '高價話術、高價攻單名單、高價訓練、爆發大單建議。',
    roles: ['老闆', '主管', '員工', '系統管理員'],
    group: '業務作戰',
    category: 'high-value',
    order: 5,
    subFeatures: ['高價總覽', '高價個人建議', '話術素材庫', '攻單名單', '高價訓練', '團隊喊話', '爆發大單提醒'],
    aliases: ['高價總控台', '高價個人頁', '話術素材庫', '攻單名單', '高價訓練', '團隊喊話', '高價成交爆發'],
    isCore: true,
    isEnabled: true,
    strengthScore: 93,
    optimizeScore: 95,
  },
  {
    key: 'line-center',
    label: 'LINE 轉傳中心',
    path: '/line-center',
    description: '將公告快速轉為公司群組可直接轉傳格式。',
    roles: ['老闆', '主管', '系統管理員'],
    group: '業務作戰',
    category: 'transfer-mgmt',
    order: 6,
    subFeatures: ['公告轉傳', '固定結尾管理', '群組格式整理', '精簡內容產生'],
    aliases: ['LINE群組轉傳', 'LINE轉傳台', '轉傳規則'],
    isCore: false,
    isEnabled: true,
    strengthScore: 86,
    optimizeScore: 91,
  },
  {
    key: 'talent-center',
    label: '人才管理中心',
    path: '/talent-center',
    description: '招聘、訓練、潛力分析、訓練進度整合管理。',
    roles: ['老闆', '主管', '系統管理員'],
    group: '管理後台',
    category: 'talent-mgmt',
    order: 7,
    subFeatures: ['招聘管理', '候選人潛力分析', '訓練管理', '個人訓練進度'],
    aliases: ['招聘管理', '訓練管理'],
    isCore: false,
    isEnabled: true,
    strengthScore: 84,
    optimizeScore: 89,
  },
  {
    key: 'system-center',
    label: '系統設定中心',
    path: '/system-center',
    description: '固定字典、狀態列、規則鎖死、自動維修、系統參數設定。',
    roles: ['老闆', '系統管理員'],
    group: '管理後台',
    category: 'system-mgmt',
    order: 8,
    subFeatures: ['固定字典', '規則鎖死', '狀態列設定', '自動維修設定', '系統參數'],
    aliases: ['系統設定', '規則設定', '維修設定'],
    isCore: true,
    isEnabled: true,
    strengthScore: 85,
    optimizeScore: 88,
  },
];

// ════════════════════════════════════════════════════
// 導覽群組（3 組）
// ════════════════════════════════════════════════════
export const NAV_GROUPS: NavGroupConfig[] = [
  {
    groupName: '每日核心流程',
    icon: '📊',
    centerKeys: ['workbench', 'report-center', 'dispatch-center'],
    order: 1,
  },
  {
    groupName: '業務作戰',
    icon: '⚔️',
    centerKeys: ['announce-center', 'hv-center', 'line-center'],
    order: 2,
  },
  {
    groupName: '管理後台',
    icon: '⚙️',
    centerKeys: ['talent-center', 'system-center'],
    order: 3,
  },
];

// ════════════════════════════════════════════════════
// 合併規則（舊 19 功能 → 新 8 中心）
// ════════════════════════════════════════════════════
export const MERGE_RULES: MergeRule[] = [
  // → 業績輸入與智能審計中心
  { oldName: '輸入站',      newCenterKey: 'report-center',   reason: '已併入業績輸入與智能審計中心' },
  { oldName: '解析結果',    newCenterKey: 'report-center',   reason: '已併入業績輸入與智能審計中心' },
  { oldName: '智能審計',    newCenterKey: 'report-center',   reason: '已併入業績輸入與智能審計中心' },

  // → 軍團派單中心
  { oldName: '主管派單台',  newCenterKey: 'dispatch-center', reason: '已併入軍團派單中心' },
  { oldName: '員工個人頁',  newCenterKey: 'dispatch-center', reason: '已併入軍團派單中心' },
  { oldName: 'AI行銷建議',  newCenterKey: 'dispatch-center', reason: '已併入軍團派單中心' },
  { oldName: '老闆總控台',  newCenterKey: 'dispatch-center', reason: '已併入軍團派單中心主管總覽' },

  // → 公告與智慧播報中心
  { oldName: '公告發報',    newCenterKey: 'announce-center', reason: '已併入公告與智慧播報中心' },
  { oldName: '播報總控台',  newCenterKey: 'announce-center', reason: '已併入公告與智慧播報中心' },
  { oldName: '播報稿管理',  newCenterKey: 'announce-center', reason: '已併入公告與智慧播報中心' },
  { oldName: '播報風格',    newCenterKey: 'announce-center', reason: '已併入公告與智慧播報中心' },
  { oldName: '播放控制',    newCenterKey: 'announce-center', reason: '已併入公告與智慧播報中心' },
  { oldName: '女聲智慧播報',newCenterKey: 'announce-center', reason: '已併入公告與智慧播報中心' },

  // → 高價成交中心
  { oldName: '高價總控台',  newCenterKey: 'hv-center',       reason: '已併入高價成交中心' },
  { oldName: '高價個人頁',  newCenterKey: 'hv-center',       reason: '已併入高價成交中心' },
  { oldName: '話術素材庫',  newCenterKey: 'hv-center',       reason: '已併入高價成交中心' },
  { oldName: '攻單名單',    newCenterKey: 'hv-center',       reason: '已併入高價成交中心' },
  { oldName: '高價訓練',    newCenterKey: 'hv-center',       reason: '已併入高價成交中心' },
  { oldName: '團隊喊話',    newCenterKey: 'hv-center',       reason: '已併入高價成交中心' },
  { oldName: '高價成交爆發',newCenterKey: 'hv-center',       reason: '已併入高價成交中心' },

  // → LINE 轉傳中心
  { oldName: 'LINE群組轉傳',newCenterKey: 'line-center',     reason: '已併入 LINE 轉傳中心' },
  { oldName: 'LINE轉傳台',  newCenterKey: 'line-center',     reason: '已併入 LINE 轉傳中心' },
  { oldName: '轉傳規則',    newCenterKey: 'line-center',     reason: '已併入 LINE 轉傳中心' },

  // → 人才管理中心
  { oldName: '招聘管理',    newCenterKey: 'talent-center',   reason: '已併入人才管理中心' },
  { oldName: '訓練管理',    newCenterKey: 'talent-center',   reason: '已併入人才管理中心' },
];

// ════════════════════════════════════════════════════
// 自動維修引擎（四種衝突偵測）
// ════════════════════════════════════════════════════

function calcScore(c: CenterConfig): number {
  const coreW    = c.isCore    ? 30 : 0;
  const enabledW = c.isEnabled ? 10 : 0;
  const featW    = c.subFeatures.length * 3;
  const aliasW   = c.aliases.length;
  return c.strengthScore + c.optimizeScore + coreW + enabledW + featW + aliasW;
}

function isSimilarName(a: CenterConfig, b: CenterConfig): boolean {
  if (a.label === b.label) return true;
  return a.aliases.some((alias) => b.aliases.includes(alias));
}

function hasFeatureOverlap(a: CenterConfig, b: CenterConfig): boolean {
  const setA = new Set(a.subFeatures);
  let overlap = 0;
  for (const f of b.subFeatures) {
    if (setA.has(f)) overlap += 1;
  }
  return overlap >= 2 || a.group === b.group;
}

function mergeInto(kept: CenterConfig, disabled: CenterConfig): CenterConfig {
  return {
    ...kept,
    subFeatures: Array.from(new Set([...kept.subFeatures, ...disabled.subFeatures])),
    aliases:     Array.from(new Set([...kept.aliases, ...disabled.aliases, disabled.label])),
  };
}

function pickWinner(candidates: CenterConfig[]): CenterConfig {
  return [...candidates].sort((a, b) => {
    const diff = calcScore(b) - calcScore(a);
    return diff !== 0 ? diff : a.order - b.order;
  })[0];
}

function detectConflictType(a: CenterConfig, b: CenterConfig): ConflictType {
  if (a.path === b.path)            return 'path-duplicate';
  if (a.group === b.group)          return 'category-conflict';
  if (isSimilarName(a, b))          return 'name-similar';
  return 'feature-overlap';
}

export function runAutoRepair(): AutoRepairResult {
  const source    = CENTER_CONFIGS.filter((c) => c.isEnabled);
  const processed = new Set<string>();
  const kept:     CenterConfig[]       = [];
  const conflicts: ConflictRecord[]    = [];
  const disabled:  DisabledFeatureLog[] = [];

  for (const center of source) {
    if (processed.has(center.key)) continue;

    // 收集所有與此中心衝突的候選
    const candidates = source.filter((c) => {
      if (processed.has(c.key)) return false;
      if (c.key === center.key) return true;
      return (
        c.path  === center.path           ||
        isSimilarName(c, center)          ||
        hasFeatureOverlap(c, center)
      );
    });

    const winner = pickWinner(candidates);
    let merged   = { ...winner };

    const losers = candidates.filter((c) => c.key !== winner.key);
    for (const loser of losers) {
      merged = mergeInto(merged, loser);
      disabled.push({
        oldName:           loser.label,
        reason:            `偵測到與「${winner.label}」重複或衝突，已自動停用並合併有用功能`,
        retainedCenterKey: winner.key,
      });
    }

    if (losers.length > 0) {
      conflicts.push({
        conflictType:      detectConflictType(center, losers[0]),
        candidateKeys:     candidates.map((c) => c.key),
        retainedCenterKey: winner.key,
        disabledKeys:      losers.map((c) => c.key),
        explanation:       `系統已自動比較強度 / 優化分數、核心權重、功能完整度，保留較強版本「${winner.label}」（${calcScore(winner)} 分）`,
      });
    }

    kept.push(merged);
    for (const c of candidates) processed.add(c.key);
  }

  const sorted = kept.sort((a, b) => a.order - b.order);

  const summary = [
    `保留核心中心數量：${sorted.length}`,
    `已整併舊功能數量：${MERGE_RULES.length}`,
    `已停用重複模組：${disabled.length} 個`,
    `已處理衝突批次：${conflicts.length} 批`,
    '系統已改為 8 大核心中心架構',
    '所有被停用模組的有用功能已自動合併進保留中心',
    '後續工程一律只維護保留中心，不再新增重複頁面',
  ];

  return {
    activeCenters:   sorted,
    mergedFeatures:  MERGE_RULES,
    conflictRecords: conflicts,
    disabledLog:     disabled,
    summary,
  };
}

/** 依 key 取得中心設定 */
export function getCenter(key: CenterKey): CenterConfig | undefined {
  return CENTER_CONFIGS.find((c) => c.key === key);
}

/** 依路由路徑取得中心設定 */
export function getCenterByPath(path: string): CenterConfig | undefined {
  return CENTER_CONFIGS.find((c) => c.path === path);
}

/** 依群組名稱取得該群組所有中心 */
export function getCentersByGroup(groupName: string): CenterConfig[] {
  return CENTER_CONFIGS.filter((c) => c.group === groupName).sort((a, b) => a.order - b.order);
}

// ════════════════════════════════════════════════════
// 自動啟動任務清單
// ════════════════════════════════════════════════════
export const AUTO_START_TASKS: AutoStartTask[] = [
  { key: 'check-today-report',   label: '讀取今日報表狀態',    description: '檢查今日三平台是否已有正式報表。',                     level: '核心', order: 1 },
  { key: 'format-clean-engine',  label: '啟動格式清洗引擎',    description: '自動處理千分位、空白、百分比、括號與換行錯位。',       level: '核心', order: 2 },
  { key: 'parse-engine',         label: '啟動解析引擎',        description: '把原始日報拆成總計與個人明細。',                       level: '核心', order: 3 },
  { key: 'audit-engine',         label: '啟動審計引擎',        description: '執行天地盤、邏輯盤、累積盤六層檢查。',                 level: '核心', order: 4 },
  { key: 'auto-fix-engine',      label: '啟動自動修復引擎',    description: '修正可自修錯誤，鎖死高風險衝突。',                     level: '核心', order: 5 },
  { key: 'ranking-engine',       label: '啟動整合排名引擎',    description: '整合奕心、民視、公司產品三平台正式資料。',             level: '重要', order: 6 },
  { key: 'dispatch-engine',      label: '啟動派單引擎',        description: '依照名次自動生成 A1/A2/B/C 分組。',                   level: '重要', order: 7 },
  { key: 'hv-engine',            label: '啟動高價成交引擎',    description: '分析高價成交機會與爆發大單方向。',                     level: '重要', order: 8 },
  { key: 'broadcast-engine',     label: '啟動女聲播報引擎',    description: '自動載入播報稿與播放控制設定。',                       level: '一般', order: 9 },
  { key: 'line-engine',          label: '啟動 LINE 轉傳引擎',  description: '把公告版本轉為 LINE 可直接貼上格式。',                 level: '一般', order: 10 },
];

// ════════════════════════════════════════════════════
// 首頁摘要卡片
// ════════════════════════════════════════════════════
export const SUMMARY_CARDS: SummaryCard[] = [
  { key: 'total-revenue',  title: '今日三平台總業績', subtitle: '正式總盤',     fieldLabel: '今日實收', defaultValue: '尚未計算', colorVar: 'amber' },
  { key: 'audit-issues',   title: '待修正異常',       subtitle: '稽核鎖死項目', fieldLabel: '異常數量', defaultValue: '0 筆',     colorVar: 'rose'  },
  { key: 'dispatch-group', title: '今日主力組',       subtitle: 'A1/A2 狀態',   fieldLabel: '主力摘要', defaultValue: '尚未生成', colorVar: 'green' },
  { key: 'broadcast',      title: '今日播報狀態',     subtitle: '女聲智慧播報', fieldLabel: '播放狀態', defaultValue: '待播報',   colorVar: 'sky'   },
];

// ════════════════════════════════════════════════════
// 派單執行規則（鎖死，不允許使用者修改）
// ════════════════════════════════════════════════════
export const DISPATCH_RULES = [
  '照順序派',
  '前面全忙，才往後',
  '不得指定',
  '不得跳位',
  '同客戶回撥，優先回原承接人',
] as const;

// ════════════════════════════════════════════════════
// 固定執行規則
// ════════════════════════════════════════════════════
export const FIXED_OPERATION_RULES = [
  '原始資料只輸入一次',
  '先修正、再審計、再排名、再派單、再公告',
  '核心數字不可自動亂改',
  '有衝突矛盾必須先鎖死提示',
  '審計未通過禁止生成派單與公告',
  '所有頁面共用同一份正式資料',
] as const;
