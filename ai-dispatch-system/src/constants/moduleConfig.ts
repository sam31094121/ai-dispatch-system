// ════════════════════════════════════════════════════
// 模組路由設定檔 — 全系統唯一真相來源
// 所有頁面定義、導覽群組、自動啟動任務皆從此匯出
// ════════════════════════════════════════════════════

// ─── 角色類型 ───
export const ROLE_OPTIONS = ['老闆', '主管', '員工', '系統管理員'] as const;
export type RoleType = (typeof ROLE_OPTIONS)[number];

// ─── 頁面代碼 ───
export const MODULE_KEYS = [
  'workbench',       // 每日業績核心樞紐（工作台）
  'boss',            // 老闆總控台
  'dispatch',        // 主管派單台
  'member',          // 員工個人頁
  'marketing',       // 人工智慧行銷建議
  'hv-command',      // 高價總控台
  'hv-personal',     // 高價個人頁
  'hv-scripts',      // 話術素材庫
  'hv-targets',      // 攻單名單
  'hv-training',     // 高價訓練
  'hv-rally',        // 團隊喊話
  'bc-command',      // 播報總控台
  'bc-scripts',      // 播報稿管理
  'bc-style',        // 播報風格
  'bc-playback',     // 播放控制
  'line-convert',    // LINE 轉傳台
  'line-rules',      // 轉傳規則
  'hiring',          // 招聘管理
  'training',        // 訓練管理
] as const;

export type ModuleKey = (typeof MODULE_KEYS)[number];

// ─── 單一頁面設定 ───
export interface ModuleConfig {
  key: ModuleKey;
  label: string;
  path: string;
  description: string;
  roles: RoleType[];
  group: string;
  order: number;
}

// ─── 導覽群組設定 ───
export interface NavGroupConfig {
  groupName: string;
  icon: string;
  moduleKeys: ModuleKey[];
  order: number;
}

// ─── 自動啟動任務設定 ───
export interface AutoStartTask {
  key: string;
  label: string;
  description: string;
  level: '核心' | '重要' | '一般';
  order: number;
}

// ─── 首頁摘要卡片設定 ───
export interface SummaryCard {
  key: string;
  title: string;
  subtitle: string;
  fieldLabel: string;
  defaultValue: string;
  colorVar: string; // CSS class 變數名（行內樣式用）
}

// ════════════════════════════════════════════════════
// 頁面設定清單
// ════════════════════════════════════════════════════
export const MODULE_CONFIGS: ModuleConfig[] = [
  // ── 每日業績核心樞紐 ──
  {
    key: 'workbench',
    label: '每日業績核心樞紐',
    path: '/',
    description: '每日原始業績輸入、解析、審計、排名、派單、公告的統一入口。',
    roles: ['老闆', '主管', '系統管理員'],
    group: '每日業績核心樞紐',
    order: 1,
  },
  {
    key: 'boss',
    label: '老闆總控台',
    path: '/boss',
    description: '查看公司健康度、即時營收、問題警報、機會點與策略建議。',
    roles: ['老闆', '系統管理員'],
    group: '每日業績核心樞紐',
    order: 2,
  },
  {
    key: 'dispatch',
    label: '主管派單台',
    path: '/dispatch',
    description: '查看整合名次、A1/A2/B/C 分組、派單順序與執行規則。',
    roles: ['老闆', '主管', '系統管理員'],
    group: '每日業績核心樞紐',
    order: 3,
  },
  {
    key: 'member',
    label: '員工個人頁',
    path: '/member',
    description: '顯示個人追單、續單、總業績、建議、壓力與激勵。',
    roles: ['老闆', '主管', '員工', '系統管理員'],
    group: '每日業績核心樞紐',
    order: 4,
  },
  {
    key: 'marketing',
    label: '人工智慧行銷建議',
    path: '/marketing',
    description: '自動產生今日行銷重點、話術方向、回撥建議與高價機會。',
    roles: ['老闆', '主管', '系統管理員'],
    group: '每日業績核心樞紐',
    order: 5,
  },

  // ── 高價成交爆發 ──
  {
    key: 'hv-command',
    label: '高價總控台',
    path: '/hv-command',
    description: '高價成交總覽、高價主攻手、爆發大單機會與高價戰略。',
    roles: ['老闆', '主管', '系統管理員'],
    group: '高價成交爆發',
    order: 6,
  },
  {
    key: 'hv-personal',
    label: '高價個人頁',
    path: '/hv-personal',
    description: '個人高價膽量、高價收口、爆發大單建議與主攻方向。',
    roles: ['老闆', '主管', '員工', '系統管理員'],
    group: '高價成交爆發',
    order: 7,
  },
  {
    key: 'hv-scripts',
    label: '話術素材庫',
    path: '/hv-scripts',
    description: '保存高價話術、續單話術、追單回收話術、抗拒處理話術。',
    roles: ['老闆', '主管', '員工', '系統管理員'],
    group: '高價成交爆發',
    order: 8,
  },
  {
    key: 'hv-targets',
    label: '攻單名單',
    path: '/hv-targets',
    description: '顯示今日最適合主攻的大單客戶、高價客戶與續單客戶。',
    roles: ['老闆', '主管', '系統管理員'],
    group: '高價成交爆發',
    order: 9,
  },
  {
    key: 'hv-training',
    label: '高價訓練',
    path: '/hv-training',
    description: '高價成交模擬、高價開口訓練、價格承壓訓練、收口訓練。',
    roles: ['老闆', '主管', '員工', '系統管理員'],
    group: '高價成交爆發',
    order: 10,
  },
  {
    key: 'hv-rally',
    label: '團隊喊話',
    path: '/hv-rally',
    description: '產出今日團隊精神喊話、衝刺口號、威壓版與溫和版。',
    roles: ['老闆', '主管', '系統管理員'],
    group: '高價成交爆發',
    order: 11,
  },

  // ── 女聲智慧播報 ──
  {
    key: 'bc-command',
    label: '播報總控台',
    path: '/bc-command',
    description: '控制今日播報稿、播報模式、播放狀態與播報紀錄。',
    roles: ['老闆', '主管', '系統管理員'],
    group: '女聲智慧播報',
    order: 12,
  },
  {
    key: 'bc-scripts',
    label: '播報稿管理',
    path: '/bc-scripts',
    description: '管理完整版、精簡版、超短版、主管版與女聲朗讀稿。',
    roles: ['老闆', '主管', '系統管理員'],
    group: '女聲智慧播報',
    order: 13,
  },
  {
    key: 'bc-style',
    label: '播報風格',
    path: '/bc-style',
    description: '設定聲音穿透力、節奏、停頓、強度、柔和度與威壓感。',
    roles: ['老闆', '主管', '系統管理員'],
    group: '女聲智慧播報',
    order: 14,
  },
  {
    key: 'bc-playback',
    label: '播放控制',
    path: '/bc-playback',
    description: '直接播放、暫停、重播、切換播報版本與輸出設備控制。',
    roles: ['老闆', '主管', '系統管理員'],
    group: '女聲智慧播報',
    order: 15,
  },

  // ── LINE 群組轉傳 ──
  {
    key: 'line-convert',
    label: 'LINE 轉傳台',
    path: '/line-convert',
    description: '把公告版、精簡版、超短版、播報版快速轉成 LINE 用文字。',
    roles: ['老闆', '主管', '系統管理員'],
    group: 'LINE 群組轉傳',
    order: 16,
  },
  {
    key: 'line-rules',
    label: '轉傳規則',
    path: '/line-rules',
    description: '設定 LINE 群組轉傳格式、固定結尾、+1 規則與訊息長度。',
    roles: ['老闆', '主管', '系統管理員'],
    group: 'LINE 群組轉傳',
    order: 17,
  },

  // ── 系統管理 ──
  {
    key: 'hiring',
    label: '招聘管理',
    path: '/hiring',
    description: '管理候選人、成交潛力分數、履歷分析與錄取建議。',
    roles: ['老闆', '主管', '系統管理員'],
    group: '系統管理',
    order: 18,
  },
  {
    key: 'training',
    label: '訓練管理',
    path: '/training',
    description: '管理個人訓練計畫、話術課程、高價訓練與訓練進度。',
    roles: ['老闆', '主管', '系統管理員'],
    group: '系統管理',
    order: 19,
  },
];

// ════════════════════════════════════════════════════
// 導覽群組清單
// ════════════════════════════════════════════════════
export const NAV_GROUPS: NavGroupConfig[] = [
  {
    groupName: '每日業績核心樞紐',
    icon: '📊',
    moduleKeys: ['workbench', 'boss', 'dispatch', 'member', 'marketing'],
    order: 1,
  },
  {
    groupName: '高價成交爆發',
    icon: '💰',
    moduleKeys: ['hv-command', 'hv-personal', 'hv-scripts', 'hv-targets', 'hv-training', 'hv-rally'],
    order: 2,
  },
  {
    groupName: '女聲智慧播報',
    icon: '🎙️',
    moduleKeys: ['bc-command', 'bc-scripts', 'bc-style', 'bc-playback'],
    order: 3,
  },
  {
    groupName: 'LINE 群組轉傳',
    icon: '📨',
    moduleKeys: ['line-convert', 'line-rules'],
    order: 4,
  },
  {
    groupName: '系統管理',
    icon: '⚙️',
    moduleKeys: ['hiring', 'training'],
    order: 5,
  },
];

// ════════════════════════════════════════════════════
// 自動啟動任務清單（首頁進入時依序執行）
// ════════════════════════════════════════════════════
export const AUTO_START_TASKS: AutoStartTask[] = [
  { key: 'check-today-report',   label: '讀取今日報表狀態',   description: '檢查今日三平台是否已有正式報表。',                                       level: '核心', order: 1 },
  { key: 'format-clean-engine',  label: '啟動格式清洗引擎',   description: '自動處理千分位、空白、百分比、括號與換行錯位。',                           level: '核心', order: 2 },
  { key: 'parse-engine',         label: '啟動解析引擎',       description: '把原始日報拆成總計與個人明細。',                                           level: '核心', order: 3 },
  { key: 'audit-engine',         label: '啟動審計引擎',       description: '執行天地盤、邏輯盤、累積盤六層檢查。',                                     level: '核心', order: 4 },
  { key: 'auto-fix-engine',      label: '啟動自動修復引擎',   description: '修正可自修錯誤，鎖死高風險衝突，避免骨牌效應。',                           level: '核心', order: 5 },
  { key: 'ranking-engine',       label: '啟動整合排名引擎',   description: '整合奕心、民視、公司產品三平台正式資料。',                                 level: '重要', order: 6 },
  { key: 'dispatch-engine',      label: '啟動派單引擎',       description: '依照名次與自訂規則，自動生成 A1 / A2 / B / C 分組。',                      level: '重要', order: 7 },
  { key: 'hv-engine',            label: '啟動高價成交引擎',   description: '分析高價成交機會、高價話術與爆發大單方向。',                               level: '重要', order: 8 },
  { key: 'broadcast-engine',     label: '啟動女聲播報引擎',   description: '自動載入播報稿、播報風格與播放控制設定。',                                 level: '一般', order: 9 },
  { key: 'line-engine',          label: '啟動 LINE 轉傳引擎', description: '把公告版本轉為 LINE 可直接貼上格式。',                                     level: '一般', order: 10 },
];

// ════════════════════════════════════════════════════
// 首頁摘要卡片
// ════════════════════════════════════════════════════
export const SUMMARY_CARDS: SummaryCard[] = [
  { key: 'total-revenue',  title: '今日三平台總業績', subtitle: '正式總盤',      fieldLabel: '今日實收',   defaultValue: '尚未計算', colorVar: 'amber' },
  { key: 'audit-issues',   title: '待修正異常',       subtitle: '稽核鎖死項目',  fieldLabel: '異常數量',   defaultValue: '0 筆',     colorVar: 'rose'  },
  { key: 'dispatch-group', title: '今日主力組',       subtitle: 'A1 / A2 狀態',  fieldLabel: '主力摘要',   defaultValue: '尚未生成', colorVar: 'green' },
  { key: 'broadcast',      title: '今日播報狀態',     subtitle: '女聲智慧播報',  fieldLabel: '播放狀態',   defaultValue: '待播報',   colorVar: 'sky'   },
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
// 工具函式
// ════════════════════════════════════════════════════

/** 依 key 取得模組設定 */
export function getModule(key: ModuleKey): ModuleConfig | undefined {
  return MODULE_CONFIGS.find((m) => m.key === key);
}

/** 依路由路徑取得模組設定 */
export function getModuleByPath(path: string): ModuleConfig | undefined {
  return MODULE_CONFIGS.find((m) => m.path === path);
}

/** 依群組名稱取得該群組所有模組 */
export function getModulesByGroup(groupName: string): ModuleConfig[] {
  return MODULE_CONFIGS.filter((m) => m.group === groupName).sort((a, b) => a.order - b.order);
}
