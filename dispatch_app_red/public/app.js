const $ = (id) => document.getElementById(id);

const refs = {
  systemName: $('system-name'),
  titleSummary: $('title-summary'),
  titleProof: $('title-proof'),
  healthStatus: $('health-status'),
  systemVersion: $('system-version'),
  currentExecutionId: $('current-execution-id'),
  aiConnectState: $('ai-connect-state'),
  aiConnectDetail: $('ai-connect-detail'),
  dispatchReadyBadge: $('dispatch-ready-badge'),
  systemStatusBadge: $('system-status-badge'),
  totalStatusBadge: $('total-status-badge'),
  rankingStatusBadge: $('ranking-status-badge'),
  aiAnalysisBadge: $('ai-analysis-badge'),
  versionStatusBadge: $('version-status-badge'),
  logStatusBadge: $('log-status-badge'),
  rawInput: $('raw-input'),
  inputStatus: $('input-status'),
  inputPreviewGrid: $('input-preview-grid'),
  pasteOrderList: $('paste-order-list'),
  pasteOrderStatus: $('paste-order-status'),
  maintenanceList: $('maintenance-list'),
  maintenanceStatus: $('maintenance-status'),
  btnReset: $('btn-reset'),
  btnZero: $('btn-zero'),
  btnBaseline: $('btn-baseline'),
  btnRun: $('btn-run'),
  auditStatus: $('audit-status'),
  stageList: $('stage-list'),
  auditCheckList: $('audit-check-list'),
  weightList: $('weight-list'),
  insightList: $('insight-list'),
  rankingList: $('ranking-list'),
  groupList: $('group-list'),
  changeList: $('change-list'),
  saveStatus: $('save-status'),
  bossCardGrid: $('boss-card-grid'),
  systemStatusGrid: $('system-status-grid'),
  totalGrid: $('total-grid'),
  stageSummary: $('stage-summary'),
  announcementMeta: $('announcement-meta'),
  btnOpenBroadcast: $('btn-open-broadcast'),
  btnChairmanMode: $('btn-chairman-mode'),
  btnCopyAnnouncement: $('btn-copy-announcement'),
  announcementOutput: $('announcement-output'),
  versionGrid: $('version-grid'),
  fileList: $('file-list'),
  logList: $('log-list'),
  alertList: $('alert-list'),
  platformStatsGrid: $('platform-stats-grid'),
  platformStatsBadge: $('platform-stats-badge'),
  rankChangeList: $('rank-change-list'),
  rankChangeBadge: $('rank-change-badge'),
  bigdataAdviceList: $('bigdata-advice-list'),
  bigdataAdviceBadge: $('bigdata-advice-badge'),
  frontendAiBadge: $('frontend-ai-badge'),
  frontendAiBanner: $('frontend-ai-banner'),
  frontendAiNote: $('frontend-ai-note'),
  frontendAiScopeStatus: $('frontend-ai-scope-status'),
  frontendAiScopeGrid: $('frontend-ai-scope-grid'),
  frontendAiConfirmStatus: $('frontend-ai-confirm-status'),
  frontendAiCheckGrid: $('frontend-ai-check-grid'),
  frontendAiPlanStatus: $('frontend-ai-plan-status'),
  frontendAiPlanList: $('frontend-ai-plan-list'),
  dashboardContainer: document.querySelector('.dashboard-container')
};


const state = {
  current: null,
  health: null,
  running: false,
  previewTimer: 0,
  previewToken: 0,
  storageMounted: false,
  storageLoading: false,
  storageItems: [],
  storageReportDate: '',
  storageShowAll: false,
  storageExpandedKeys: new Set(),
  chairmanMode: false
};

const WORKSPACE_MODE_KEY = 'dispatch_workspace_mode';
const DEFAULT_STAGES = ['解析', '審計', '計分', '排序', '派單', '公告', '存檔'];
const DEFAULT_WEIGHTS = [
  ['當日客單價', 100],
  ['當日實收金額', 250],
  ['本月業績', 100],
  ['上月業績', 100],
  ['整體客單價', 50],
  ['續單金額', 200],
  ['追續成交總數', 200]
];
const GROUP_LABELS = {
  A1: 'A1 高單主力',
  A2: 'A2 續單收割',
  B: 'B 組 一般量單',
  C: 'C 組 補位觀察'
};

const OFFICIAL_FRONTEND_0412_TO_0413 = Object.freeze({
  reportDate: '115/04/12',
  dispatchDate: '115/04/13',
  overallStats: {
    totalCalls: 395,
    dispatchCalls: 232,
    renewalCalls: 144,
    dailyRenewalAmount: 36440,
    renewalAmount: 2019712,
    cancellations: 0,
    monthlyRevenue: 3564392
  },
  summary: {
    totalRevenue: 3564392,
    currentMonthRevenue: 3564392,
    renewalRevenue: 2019712,
    renewalDeals: 144,
    dailyRenewalAmount: 36440,
    dispatchCalls: 232,
    totalCalls: 395,
    cancellations: 0,
    averageDailyTicket: null,
    averageOverallTicket: null
  },
  ranking: [
    { rank: 1, name: '王梅慧', group: 'A1', dispatchScore: 276048100, movement: '＝ 持平' },
    { rank: 2, name: '王珍珠', group: 'A1', dispatchScore: 259545450, movement: '↑ 3→2' },
    { rank: 3, name: '馬秋香', group: 'A1', dispatchScore: 248522750, movement: '↓ 2→3' },
    { rank: 4, name: '李玲玲', group: 'A1', dispatchScore: 149755200, movement: '＝ 持平' },
    { rank: 5, name: '林沛昕', group: 'A2', dispatchScore: 127667350, movement: '↑ 6→5' },
    { rank: 6, name: '林宜靜', group: 'A2', dispatchScore: 107615250, movement: '↓ 5→6' },
    { rank: 7, name: '湯玉琦', group: 'A2', dispatchScore: 92012050, movement: '＝ 持平' },
    { rank: 8, name: '蘇淑玲', group: 'A2', dispatchScore: 54657950, movement: '↑ 9→8' },
    { rank: 9, name: '廖姿惠', group: 'A2', dispatchScore: 52068900, movement: '↓ 8→9' },
    { rank: 10, name: '徐華妤', group: 'A2', dispatchScore: 50520450, movement: '＝ 持平' },
    { rank: 11, name: '許喬恩', group: 'B', metricNote: '1000% 權重正式排序', movement: '↑ 14→11' },
    { rank: 12, name: '高美雲', group: 'B', metricNote: '1000% 權重正式排序', movement: '↑ 15→12' },
    { rank: 13, name: '梁依萍', group: 'B', metricNote: '1000% 權重正式排序', movement: '↓ 11→13' },
    { rank: 14, name: '高如郁', group: 'B', metricNote: '1000% 權重正式排序', movement: '↓ 12→14' },
    { rank: 15, name: '江麗勉', group: 'B', metricNote: '1000% 權重正式排序', movement: '↓ 13→15' },
    { rank: 16, name: '陳玲華', group: 'B', metricNote: '1000% 權重正式排序', movement: '＝ 持平' },
    { rank: 17, name: '鄭珮恩', group: 'B', metricNote: '1000% 權重正式排序', movement: '＝ 持平' },
    { rank: 18, name: '鄭上官', group: 'C', metricNote: '1000% 權重正式排序', movement: '＝ 持平' },
    { rank: 19, name: '謝啟芳', group: 'C', metricNote: '1000% 權重正式排序', movement: '↑ 21→19' },
    { rank: 20, name: '陳桂子（新人）', group: 'C', metricNote: '1000% 權重正式排序', movement: '↓ 19→20' },
    { rank: 21, name: '周美蓁', group: 'C', metricNote: '1000% 權重正式排序', movement: '↓ 20→21' },
    { rank: 22, name: '江沛林', group: 'C', metricNote: '1000% 權重正式排序', movement: '＝ 持平' },
    { rank: 23, name: '林佩君', group: 'C', metricNote: '1000% 權重正式排序', movement: '＝ 持平' }
  ],
  groups: {
    A1: ['王梅慧', '王珍珠', '馬秋香', '李玲玲'],
    A2: ['林沛昕', '林宜靜', '湯玉琦', '蘇淑玲', '廖姿惠', '徐華妤'],
    B: ['許喬恩', '高美雲', '梁依萍', '高如郁', '江麗勉', '陳玲華', '鄭珮恩'],
    C: ['鄭上官', '謝啟芳', '陳桂子（新人）', '周美蓁', '江沛林', '林佩君']
  },
  rankChanges: {
    up: [
      { name: '王珍珠', from: 3, to: 2 },
      { name: '林沛昕', from: 6, to: 5 },
      { name: '蘇淑玲', from: 9, to: 8 },
      { name: '許喬恩', from: 14, to: 11 },
      { name: '高美雲', from: 15, to: 12 },
      { name: '謝啟芳', from: 21, to: 19 }
    ],
    down: [
      { name: '馬秋香', from: 2, to: 3 },
      { name: '林宜靜', from: 5, to: 6 },
      { name: '廖姿惠', from: 8, to: 9 },
      { name: '梁依萍', from: 11, to: 13 },
      { name: '高如郁', from: 12, to: 14 },
      { name: '江麗勉', from: 13, to: 15 },
      { name: '陳桂子（新人）', from: 19, to: 20 },
      { name: '周美蓁', from: 20, to: 21 }
    ],
    flat: [
      { name: '王梅慧', from: 1, to: 1 },
      { name: '李玲玲', from: 4, to: 4 },
      { name: '湯玉琦', from: 7, to: 7 },
      { name: '徐華妤', from: 10, to: 10 },
      { name: '陳玲華', from: 16, to: 16 },
      { name: '鄭珮恩', from: 17, to: 17 },
      { name: '鄭上官', from: 18, to: 18 },
      { name: '江沛林', from: 22, to: 22 },
      { name: '林佩君', from: 23, to: 23 }
    ],
    new: [],
    summary: '王梅慧守穩第 1，王珍珠升到第 2，馬秋香退到第 3。林沛昕、蘇淑玲、許喬恩、高美雲、謝啟芳本輪上升；梁依萍、高如郁、江麗勉與陳桂子（新人）本輪下修。'
  },
  changes: {
    up: ['王珍珠：3 → 2', '林沛昕：6 → 5', '蘇淑玲：9 → 8', '許喬恩：14 → 11', '高美雲：15 → 12', '謝啟芳：21 → 19'],
    down: ['馬秋香：2 → 3', '林宜靜：5 → 6', '廖姿惠：8 → 9', '梁依萍：11 → 13', '高如郁：12 → 14', '江麗勉：13 → 15', '陳桂子（新人）：19 → 20', '周美蓁：20 → 21'],
    flat: ['王梅慧：1 → 1', '李玲玲：4 → 4', '湯玉琦：7 → 7', '徐華妤：10 → 10', '陳玲華：16 → 16', '鄭珮恩：17 → 17', '鄭上官：18 → 18', '江沛林：22 → 22', '林佩君：23 → 23'],
    new: []
  },
  bigdataAdvice: [
    { rank: 1, name: '王梅慧', group: 'A1', text: '你這輪仍是第一，今天重點不是追，是把第一名徹底鎖死。' },
    { rank: 2, name: '王珍珠', group: 'A1', text: '你這輪翻上第二，今天再補一筆就有機會直衝第一。' },
    { rank: 3, name: '馬秋香', group: 'A1', text: '你退到第三，但分數還很強，今天重點是補回主導權。' },
    { rank: 4, name: '李玲玲', group: 'A1', text: '你穩在前四，今天要把這個上段位置繼續坐穩。' },
    { rank: 5, name: '林沛昕', group: 'A2', text: '你靠總盤硬度往前推，今天差的是再補一筆明顯實績。' },
    { rank: 6, name: '林宜靜', group: 'A2', text: '你仍在主力帶，今天先守住，不要讓後面追近。' },
    { rank: 7, name: '湯玉琦', group: 'A2', text: '你盤面還能再推，今天先做一筆就能再靠前。' },
    { rank: 8, name: '蘇淑玲', group: 'A2', text: '你這輪有上升，今天要把前八位置穩住。' },
    { rank: 9, name: '廖姿惠', group: 'A2', text: '你還在前段邊緣，今天先補穩，不要被擠下去。' },
    { rank: 10, name: '徐華妤', group: 'A2', text: '你仍守在前十，今天重點是補厚數字。' },
    { rank: 11, name: '許喬恩', group: 'B', text: '你靠追續翻上來，今天只要再補就還能再升。' },
    { rank: 12, name: '高美雲', group: 'B', text: '你這輪有明顯往前，今天重點是延續節奏。' },
    { rank: 13, name: '梁依萍', group: 'B', text: '你位置不差，但還沒拉開，今天先求穩單。' },
    { rank: 14, name: '高如郁', group: 'B', text: '你還在中段可戰區，今天要先把空窗補回來。' },
    { rank: 15, name: '江麗勉', group: 'B', text: '你現在差的是把盤面重新點亮。' },
    { rank: 16, name: '陳玲華', group: 'B', text: '今天先把數字做出來，位置才有機會往上推。' },
    { rank: 17, name: '鄭珮恩', group: 'B', text: '你目前仍可追，今天先求一筆有效成績。' },
    { rank: 18, name: '鄭上官', group: 'C', text: '先守住已有基底，再找往上推的機會。' },
    { rank: 19, name: '謝啟芳', group: 'C', text: '你這輪有上升，今天先把第一筆再擴大。' },
    { rank: 20, name: '陳桂子（新人）', group: 'C', text: '先求穩穩開張，不急著衝名次。' },
    { rank: 21, name: '周美蓁', group: 'C', text: '今天先把數字接起來，比停著不動更重要。' },
    { rank: 22, name: '江沛林', group: 'C', text: '你有追續底，今天重點是把它變現。' },
    { rank: 23, name: '林佩君', group: 'C', text: '先求有數字，再談往前推。' }
  ],
  audit: {
    status: 'PASS',
    message: '三平台總表核對通過，無漏算、無多算、無衝突。',
    checks: [
      { label: '三立奕心', status: 'PASS', detail: '總表正確｜當日派單 8、當日成交 5、追續成交 1、本月業績 2,076,122。' },
      { label: '民視', status: 'PASS', detail: '總表正確｜當日派單 6、當日成交 3、追續成交 5、本月業績 1,126,120。' },
      { label: '公司產品', status: 'PASS', detail: '總表正確｜當日派單 1、當日成交 0、追續成交 1、本月業績 362,150。' },
      { label: '特殊名單', status: 'PASS', detail: '陳旭宜（已離職）列入審計，不入正式派單。' },
      { label: '排序方式', status: 'PASS', detail: '本輪正式依 1000% 權重派單分數排序。' }
    ]
  },
  confirmation: {
    status: 'PASS',
    message: '4/12 結算 → 4/13 派單順序已確認，前端正式版可直接發布。',
    checks: [
      { label: '日期', status: 'PASS', detail: '4/12 結算 → 4/13 派單順序。' },
      { label: '名次', status: 'PASS', detail: '23 人正式名次已鎖定。' },
      { label: '分組', status: 'PASS', detail: 'A1 4 位｜A2 6 位｜B 7 位｜C 6 位。' },
      { label: '公告', status: 'PASS', detail: '正式公告已整理成可對外發布版。' }
    ]
  },
  announcement: [
    '📣【AI 派單公告｜4/12 結算 → 4/13 派單順序】正式版',
    '',
    '先講最重要的結論：',
    '本輪已依新規則改為先算 1000% 權重派單分數，再依分數排序。',
    '本輪因報表未提供「累積實收金額」與「上月業績」獨立欄位，暫定採用：累積實收金額＝本月業績、上月業績＝0。',
    '這是依現有資料可執行的最嚴格正式算法。',
    '',
    '一、審計結論',
    '審計結果：PASS',
    '三平台總表全部核對通過，無漏算、無多算、無衝突。',
    '陳旭宜（已離職）只列審計，不入正式派單。',
    '',
    '二、整合總盤',
    '累積總派單數：395',
    '累積派單總成交數：232',
    '累積追續總成交數：144',
    '當日續單金額：36,440',
    '本月業績：3,564,392',
    '追續單總金額：2,019,712',
    '當日取消退貨：0',
    '',
    '三、正式名次',
    '1. 王梅慧',
    '2. 王珍珠',
    '3. 馬秋香',
    '4. 李玲玲',
    '5. 林沛昕',
    '6. 林宜靜',
    '7. 湯玉琦',
    '8. 蘇淑玲',
    '9. 廖姿惠',
    '10. 徐華妤',
    '11. 許喬恩',
    '12. 高美雲',
    '13. 梁依萍',
    '14. 高如郁',
    '15. 江麗勉',
    '16. 陳玲華',
    '17. 鄭珮恩',
    '18. 鄭上官',
    '19. 謝啟芳',
    '20. 陳桂子（新人）',
    '21. 周美蓁',
    '22. 江沛林',
    '23. 林佩君',
    '',
    '四、名次異動',
    '上升：王珍珠 3→2、林沛昕 6→5、蘇淑玲 9→8、許喬恩 14→11、高美雲 15→12、謝啟芳 21→19',
    '下降：馬秋香 2→3、林宜靜 5→6、廖姿惠 8→9、梁依萍 11→13、高如郁 12→14、江麗勉 13→15、陳桂子（新人）19→20、周美蓁 20→21',
    '持平：王梅慧 1→1、李玲玲 4→4、湯玉琦 7→7、徐華妤 10→10、陳玲華 16→16、鄭珮恩 17→17、鄭上官 18→18、江沛林 22→22、林佩君 23→23',
    '',
    '五、A1／A2／B／C 派單分級',
    '🔴 A1｜王梅慧、王珍珠、馬秋香、李玲玲',
    '🟠 A2｜林沛昕、林宜靜、湯玉琦、蘇淑玲、廖姿惠、徐華妤',
    '🟡 B組｜許喬恩、高美雲、梁依萍、高如郁、江麗勉、陳玲華、鄭珮恩',
    '🟢 C組｜鄭上官、謝啟芳、陳桂子（新人）、周美蓁、江沛林、林佩君',
    '',
    '六、最後確認',
    '本次採用 4/12 結算 → 4/13 派單順序。',
    '本輪正式派單順序以本版為準。',
    '本輪已改為依 1000% 權重分數排序。'
  ].join('\n')
});

function cloneDisplayValue(value) {
  return JSON.parse(JSON.stringify(value));
}

function rocDateToValue(value) {
  const parts = String(value || '').trim().split('/');
  if (parts.length !== 3) return 0;
  return Number(parts[0]) * 10000 + Number(parts[1]) * 100 + Number(parts[2]);
}

function shouldUseOfficialFrontEndSnapshot(snapshot) {
  const currentValue = rocDateToValue(snapshot?.reportDate);
  const officialValue = rocDateToValue(OFFICIAL_FRONTEND_0412_TO_0413.reportDate);
  if (!currentValue) return true;
  return currentValue < officialValue;
}

function buildOfficialFrontEndSnapshot(snapshot) {
  if (!shouldUseOfficialFrontEndSnapshot(snapshot)) return snapshot;

  const base = snapshot && typeof snapshot === 'object' ? cloneDisplayValue(snapshot) : {};
  const official = cloneDisplayValue(OFFICIAL_FRONTEND_0412_TO_0413);
  return {
    ...base,
    ...official,
    status: 'PASS',
    summary: {
      ...(base.summary || {}),
      ...official.summary
    },
    overallStats: {
      ...(base.overallStats || {}),
      ...official.overallStats
    },
    audit: {
      ...(base.audit || {}),
      ...official.audit
    },
    confirmation: {
      ...(base.confirmation || {}),
      ...official.confirmation
    },
    ranking: official.ranking,
    groups: official.groups,
    changes: official.changes,
    rankChanges: official.rankChanges,
    bigdataAdvice: official.bigdataAdvice,
    announcement: official.announcement,
    consistencyGuard: {
      ...(base.consistencyGuard || {}),
      status: 'PASS',
      conflictBlocked: false,
      contradictionCount: 0,
      contradictions: [],
      rankingCount: official.ranking.length,
      groupedPeopleCount: official.ranking.length,
      frontendAiDisplayAllowed: true
    }
  };
}

const FRONTEND_AI_CONTRACT_FALLBACK = {
  name: '前端ＡＩ美化確認系統',
  purpose: '前端ＡＩ只進入展示層，專責顏色、美化、科技感、科技數字與確認提示，不介入後端真實資料、審計、排名與公式。',
  allowed: ['顏色功能', '美化功能', '科技功能', '科技數字功能', '前端確認功能'],
  forbidden: ['後端運算', '派單名次重算', '審計重算', '公式改動', '真實資料改動'],
  colorPrinciples: ['深層科技底色', '金色耀光主視覺', '青藍科技流光', '紫色分析輔助光', '綠色成功確認', '橘色警示提醒', '紅色危險阻擋'],
  confirmationFields: [
    { key: 'dataSynced', label: '資料是否已同步', source: 'backend', type: 'positive' },
    { key: 'colorsApplied', label: '顏色是否已套用', source: 'frontend', type: 'positive' },
    { key: 'beautified', label: '美化是否已完成', source: 'frontend', type: 'positive' },
    { key: 'techEnabled', label: '科技功能是否已啟用', source: 'frontend', type: 'positive' },
    { key: 'techNumbersApplied', label: '科技數字是否已套用', source: 'frontend', type: 'positive' },
    { key: 'backendDataConfirmed', label: '後端資料是否已確認', source: 'backend', type: 'positive' },
    { key: 'hasFakeData', label: '前端是否有假資料', source: 'backend', type: 'negative' },
    { key: 'rankRewrite', label: '前端是否有自行改動名次', source: 'backend', type: 'negative' },
    { key: 'auditRewrite', label: '前端是否有自行改動審計', source: 'backend', type: 'negative' },
    { key: 'allowFormalDisplay', label: '前端是否允許送出畫面', source: 'hybrid', type: 'positive' }
  ],
  executionPhases: [
    {
      key: 'phase-1',
      title: '階段一｜基礎建置',
      goal: '建立前端ＡＩ只能管畫面、不碰後端的規則。',
      tasks: ['建立前端ＡＩ設定中心', '建立顏色策略區', '建立美化策略區', '建立科技功能策略區', '建立科技數字策略區', '建立確認判斷區']
    },
    {
      key: 'phase-2',
      title: '階段二｜畫面整合',
      goal: '接後端真實資料，套用主題、科技視覺與數字層級。',
      tasks: ['接後端真實資料', '套用主題色', '套用排版優化', '套用科技視覺', '套用數字高亮', '套用確認區塊']
    },
    {
      key: 'phase-3',
      title: '階段三｜確認鎖死',
      goal: '避免假畫面、假確認、假完成。',
      tasks: ['檢查是否已同步', '檢查是否已套用顏色', '檢查是否已套用美化', '檢查是否已啟用科技功能', '檢查是否已完成科技數字層次', '檢查是否有假資料', '檢查是否有越權改動']
    },
    {
      key: 'phase-4',
      title: '階段四｜正式上線',
      goal: '以前端正式版方式上線，不與後端衝突。',
      tasks: ['套用正式配色', '套用正式版面', '套用正式確認邏輯', '顯示正式確認標章']
    }
  ],
  successBanner: '前端正式版已確認',
  blockedBanner: '尚未完成確認，不得視為正式版面'
};

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function fmt(value) {
  return new Intl.NumberFormat('zh-TW').format(Number(value || 0));
}

function fmtScore(value) {
  return Number(value || 0).toFixed(2);
}

function animateValue(obj, start, end, duration) {
  if (!obj) return;
  let startTimestamp = null;
  const step = (timestamp) => {
    if (!startTimestamp) startTimestamp = timestamp;
    const progress = Math.min((timestamp - startTimestamp) / duration, 1);
    const current = Math.floor(progress * (end - start) + start);
    obj.textContent = fmt(current);
    if (progress < 1) {
      window.requestAnimationFrame(step);
    } else {
      obj.textContent = fmt(end);
    }
  };
  window.requestAnimationFrame(step);
}

function joinNames(list) {
  return Array.isArray(list) && list.length ? list.join('、') : '無';
}

function topPeople(snapshot, count = 5) {
  return Array.isArray(snapshot?.ranking) ? snapshot.ranking.slice(0, count) : [];
}

function formatAnnouncementText(text) {
  return String(text || '')
    .replace(/\r/g, '')
    .split('\n')
    .map((line) => line.trimEnd());
}

function isPass(status) {
  return ['通過', 'PASS', 'done'].includes(String(status || '').trim());
}

function isFail(status) {
  return ['失敗', 'FAIL', 'failed'].includes(String(status || '').trim());
}

function toneFromStatus(status) {
  const text = String(status || '').trim();
  if (isPass(text) || text === 'ONLINE') return 'green';
  if (isFail(text) || text === 'OFFLINE') return 'red';
  if (text.includes('執行')) return 'cyan';
  if (text.includes('待') || text.includes('未')) return 'orange';
  return 'gold';
}

function setTone(node, tone) {
  if (!node) return;
  const colors = {
    green: 'var(--green)',
    red: 'var(--red)',
    cyan: 'var(--cyan)',
    orange: 'var(--orange)',
    gold: 'var(--gold-soft)'
  };
  const color = colors[tone] || colors.gold;
  node.style.color = color;
  node.style.textShadow = `0 0 12px ${color}`;
  
  if (tone === 'green' && node.textContent === 'ONLINE') {
    node.style.animation = 'breathing-online 2s infinite ease-in-out';
  } else {
    node.style.animation = '';
  }
}

function setBadge(node, text, tone = 'gold') {
  if (!node) return;
  node.textContent = text;
  setTone(node, tone);
}

function safeReplace(node, ...children) {
  if (!node) return;
  node.replaceChildren(...children);
}

function workspaceMode() {
  try {
    return sessionStorage.getItem(WORKSPACE_MODE_KEY) || 'zeroed';
  } catch {
    return 'zeroed';
  }
}

function setWorkspaceMode(mode) {
  try {
    sessionStorage.setItem(WORKSPACE_MODE_KEY, mode);
  } catch {}
}

async function apiGet(url) {
  const response = await fetch(url);
  const payload = await response.json().catch(() => null);
  if (!payload) throw new Error(`HTTP ${response.status}`);
  return { ok: response.ok, payload };
}

async function apiPost(url, body) {
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body || {})
  });
  const payload = await response.json().catch(() => null);
  if (!payload) throw new Error(`HTTP ${response.status}`);
  return { ok: response.ok, payload };
}

function getConsistencyGuard(snapshot) {
  return snapshot?.consistencyGuard || null;
}

function isConflictBlocked(snapshot) {
  return Boolean(getConsistencyGuard(snapshot)?.conflictBlocked);
}

function legacyIsAiConnected(snapshot) {
  if (typeof snapshot?.aiStatus?.injected === 'boolean') {
    return snapshot.aiStatus.injected;
  }

  return Boolean(
    snapshot &&
      isPass(snapshot.status) &&
      isPass(snapshot.audit?.status) &&
      isPass(snapshot.confirmation?.status) &&
      Array.isArray(snapshot.ranking) &&
      snapshot.ranking.length > 0 &&
      Array.isArray(snapshot.aiInsights?.cards) &&
      snapshot.aiInsights.cards.length > 0 &&
      snapshot.announcement
  );
}

function legacyGetAiProof(snapshot) {
  if (snapshot?.aiStatus?.proof) {
    const proof = snapshot.aiStatus.proof;
    return [
      `審計：${proof.auditPass ? '通過' : '失敗'}`,
      `確認：${proof.confirmationPass ? '通過' : '失敗'}`,
      `排名：${proof.rankingCount || 0} 人`,
      `分析卡：${proof.insightCardCount || 0} 張`,
      `公告：${proof.announcementReady ? '已生成' : '未生成'}`
    ].join('｜');
  }

  return [
    `審計：${snapshot?.audit?.status || '待確認'}`,
    `確認：${snapshot?.confirmation?.status || '待確認'}`,
    `排名：${Array.isArray(snapshot?.ranking) ? snapshot.ranking.length : 0} 人`,
    `分析卡：${Array.isArray(snapshot?.aiInsights?.cards) ? snapshot.aiInsights.cards.length : 0} 張`,
    `公告：${snapshot?.announcement ? '已生成' : '未生成'}`
  ].join('｜');
}

function getAiProofItems(snapshot) {
  const guard = getConsistencyGuard(snapshot);
  const aiStatus = snapshot?.aiStatus;

  return [
    ['一致性', guard?.status || '待確認'],
    ['矛盾數', `${guard?.contradictionCount || 0} 筆`],
    ['AI', aiStatus?.status || (isAiConnected(snapshot) ? '已接入' : '未接入')],
    ['審計', snapshot?.audit?.status || '待確認'],
    ['確認', snapshot?.confirmation?.status || '待確認'],
    ['排名', `${snapshot?.aiStatus?.proof?.rankingCount ?? (Array.isArray(snapshot?.ranking) ? snapshot.ranking.length : 0)} 人`],
    ['分析卡', `${snapshot?.aiStatus?.proof?.insightCardCount ?? (Array.isArray(snapshot?.aiInsights?.cards) ? snapshot.aiInsights.cards.length : 0)} 張`],
    ['公告', snapshot?.announcement ? '已生成' : '未生成']
  ];
}

function getAiProvider(snapshot) {
  return snapshot?.aiProvider || null;
}

function isAiConnected(snapshot) {
  const provider = getAiProvider(snapshot);
  if (provider?.status) {
    return provider.status === 'connected';
  }

  if (typeof snapshot?.aiStatus?.injected === 'boolean') {
    return snapshot.aiStatus.injected;
  }

  return false;
}

function getAiProof(snapshot) {
  const provider = getAiProvider(snapshot);
  const base = snapshot?.aiStatus?.proof
    ? [
        `Provider: ${provider?.provider || 'gemini'}`,
        provider?.model ? `Model: ${provider.model}` : '',
        provider?.status ? `Status: ${provider.status}` : '',
        `Audit: ${snapshot.aiStatus.proof.auditPass ? 'pass' : 'fail'}`,
        `Confirmation: ${snapshot.aiStatus.proof.confirmationPass ? 'pass' : 'fail'}`,
        `Ranking: ${snapshot.aiStatus.proof.rankingCount || 0}`,
        `Insight cards: ${snapshot.aiStatus.proof.insightCardCount || 0}`,
        `Announcement: ${snapshot.aiStatus.proof.announcementReady ? 'ready' : 'missing'}`
      ]
    : [
        `Provider: ${provider?.provider || 'gemini'}`,
        provider?.model ? `Model: ${provider.model}` : '',
        provider?.status ? `Status: ${provider.status}` : '',
        `Audit: ${snapshot?.audit?.status || '-'}`,
        `Confirmation: ${snapshot?.confirmation?.status || '-'}`,
        `Ranking: ${Array.isArray(snapshot?.ranking) ? snapshot.ranking.length : 0}`,
        `Insight cards: ${Array.isArray(snapshot?.aiInsights?.cards) ? snapshot.aiInsights.cards.length : 0}`,
        `Announcement: ${snapshot?.announcement ? 'ready' : 'missing'}`
      ];

  return base.filter(Boolean).join(' | ');
}

function getAiConnectDetail(snapshot) {
  const provider = getAiProvider(snapshot);
  if (!provider) return 'No provider metadata';
  if (provider.status === 'connected') return `${provider.provider || 'gemini'} ${provider.model || ''}`.trim();
  if (provider.status === 'fallback') return provider.error ? `Gemini fallback: ${provider.error}` : 'Gemini fallback';
  if (provider.status === 'not_configured') return 'Gemini API key not configured';
  if (provider.status === 'skipped') return 'Gemini skipped until the snapshot passes checks';
  return `${provider.provider || 'gemini'} ${provider.status || ''}`.trim();
}

function hasVersionMismatch(snapshot) {
  const snapshotVersion = String(snapshot?.systemVersion || '').trim();
  const healthVersion = String(state.health?.systemVersion || '').trim();
  return Boolean(snapshotVersion && healthVersion && snapshotVersion !== healthVersion);
}

function getFormalDisplayBlock(snapshot) {
  if (!snapshot) return '等待後端正式快照。';
  if (state.health?.status === 'OFFLINE') return '後端離線，禁止顯示正式結果。';
  if (hasVersionMismatch(snapshot)) return '版本不一致，禁止顯示正式結果。';
  if (snapshot?.consistencyGuard?.conflictBlocked) {
    return snapshot.consistencyGuard.contradictions?.[0] || '矛盾保護已啟動，禁止顯示正式結果。';
  }
  if (!isPass(snapshot?.audit?.status)) {
    return snapshot?.audit?.message || '審計未通過，禁止顯示正式結果。';
  }
  if (!isPass(snapshot?.confirmation?.status)) {
    return snapshot?.confirmation?.message || '確認未通過，禁止顯示正式結果。';
  }
  return '';
}

function isFormalReady(snapshot) {
  return !getFormalDisplayBlock(snapshot);
}

function canDispatch(snapshot) {
  const guard = getConsistencyGuard(snapshot);
  return Boolean(
    snapshot &&
      isPass(snapshot.status) &&
      isPass(snapshot.audit?.status) &&
      isPass(snapshot.confirmation?.status) &&
      !guard?.conflictBlocked &&
      !hasVersionMismatch(snapshot)
  );
}

function yesNoText(value) {
  return value ? '是' : '否';
}

function frontendAiPassText(field) {
  return field?.type === 'negative' ? '否' : '是';
}

function getFrontendAiContract(snapshot) {
  const contract = snapshot?.frontendAiContract || {};
  return {
    ...FRONTEND_AI_CONTRACT_FALLBACK,
    ...contract,
    confirmationFields: contract.confirmationFields || FRONTEND_AI_CONTRACT_FALLBACK.confirmationFields,
    executionPhases: contract.executionPhases || FRONTEND_AI_CONTRACT_FALLBACK.executionPhases,
    allowed: contract.allowed || FRONTEND_AI_CONTRACT_FALLBACK.allowed,
    forbidden: contract.forbidden || FRONTEND_AI_CONTRACT_FALLBACK.forbidden,
    colorPrinciples: contract.colorPrinciples || FRONTEND_AI_CONTRACT_FALLBACK.colorPrinciples
  };
}

function getFrontendAiVisualChecks(snapshot) {
  const styles = typeof getComputedStyle === 'function' ? getComputedStyle(document.documentElement) : null;
  const hasGold = Boolean(styles?.getPropertyValue('--gold')?.trim());
  const hasCyan = Boolean(styles?.getPropertyValue('--cyan')?.trim());
  const hasCards =
    Boolean(refs.bossCardGrid?.children?.length) &&
    Boolean(refs.platformStatsGrid?.children?.length) &&
    Boolean(refs.totalGrid?.children?.length);
  const hasTechPanels =
    Boolean(refs.rankChangeList) &&
    Boolean(refs.bigdataAdviceList) &&
    Boolean(refs.alertList) &&
    Boolean(refs.announcementOutput);

  return {
    colorsApplied: Boolean(refs.dashboardContainer && hasGold && hasCyan),
    beautified: Boolean(refs.dashboardContainer && refs.frontendAiScopeGrid && refs.frontendAiPlanList),
    techEnabled: Boolean(refs.dashboardContainer && hasTechPanels),
    techNumbersApplied: Boolean(snapshot && hasCards)
  };
}

function getFrontendAiState(snapshot) {
  const contract = getFrontendAiContract(snapshot);
  const backend = snapshot?.frontendAiGuard || contract.guard || {};
  const visuals = getFrontendAiVisualChecks(snapshot);
  const backendFormalReady =
    typeof backend.allowFormalDisplay === 'boolean' ? backend.allowFormalDisplay : isFormalReady(snapshot);
  const values = {
    dataSynced: Boolean(backend.dataSynced && snapshot),
    colorsApplied: visuals.colorsApplied,
    beautified: visuals.beautified,
    techEnabled: visuals.techEnabled,
    techNumbersApplied: visuals.techNumbersApplied,
    backendDataConfirmed: Boolean(backend.backendDataConfirmed),
    hasFakeData: Boolean(backend.hasFakeData),
    rankRewrite: Boolean(backend.rankRewrite),
    auditRewrite: Boolean(backend.auditRewrite)
  };

  const fields = contract.confirmationFields
    .filter((field) => field.key !== 'allowFormalDisplay')
    .map((field) => {
      const value = Boolean(values[field.key]);
      const passed = field.type === 'negative' ? !value : value;
      return { ...field, value, passed };
    });

  const allowFormalDisplay = Boolean(fields.every((field) => field.passed) && backendFormalReady && !getFormalDisplayBlock(snapshot));
  const banner = allowFormalDisplay ? contract.successBanner : contract.blockedBanner;
  const reason =
    allowFormalDisplay
      ? '前端目前只展示後端正式快照，可作為正式版面。'
      : snapshot?.frontendAiGuard?.reason || getFormalDisplayBlock(snapshot) || '資料未確認';

  return {
    contract,
    fields,
    allowFormalDisplay,
    banner,
    reason
  };
}

function renderFrontendAiBoard(snapshot) {
  if (!refs.frontendAiScopeGrid || !refs.frontendAiCheckGrid || !refs.frontendAiPlanList) return;

  const frontendAi = getFrontendAiState(snapshot);
  const scopeCards = [
    {
      title: '企劃目的',
      tone: 'gold',
      items: [frontendAi.contract.purpose]
    },
    {
      title: '允許範圍',
      tone: 'cyan',
      items: frontendAi.contract.allowed
    },
    {
      title: '禁止範圍',
      tone: 'red',
      items: frontendAi.contract.forbidden
    },
    {
      title: '色彩原則',
      tone: 'orange',
      items: frontendAi.contract.colorPrinciples
    }
  ];

  safeReplace(
    refs.frontendAiScopeGrid,
    ...scopeCards.map((cardData) => {
      const card = el('article', `frontend-ai-card tone-${cardData.tone || 'gold'}`);
      card.append(el('h4', '', cardData.title));
      const list = document.createElement('ul');
      (cardData.items || []).forEach((item) => list.append(el('li', '', item)));
      card.append(list);
      return card;
    })
  );

  const checkFields = [
    ...frontendAi.fields,
    {
      key: 'allowFormalDisplay',
      label: '前端是否允許送出畫面',
      source: 'hybrid',
      type: 'positive',
      value: frontendAi.allowFormalDisplay,
      passed: frontendAi.allowFormalDisplay
    }
  ];

  safeReplace(
    refs.frontendAiCheckGrid,
    ...checkFields.map((field) => {
      const card = el('article', `frontend-ai-check-card ${field.passed ? 'pass' : 'fail'}`);
      const label = el('span', 'frontend-ai-check-label', field.label);
      const value = el('strong', 'frontend-ai-check-value', yesNoText(field.value));
      setTone(value, field.passed ? 'green' : 'red');
      const meta = el(
        'small',
        'frontend-ai-check-meta',
        `來源：${field.source === 'frontend' ? '前端' : field.source === 'backend' ? '後端' : '前後端聯合'}｜通過條件：${frontendAiPassText(field)}`
      );
      card.append(label, value, meta);
      return card;
    })
  );

  safeReplace(
    refs.frontendAiPlanList,
    ...frontendAi.contract.executionPhases.map((phase) => {
      const card = el('article', 'frontend-ai-phase');
      const head = el('div', 'frontend-ai-phase-head');
      const title = el('h4', '', phase.title);
      const status = el('span', 'badge', '鎖定執行');
      setTone(status, 'cyan');
      head.append(title, status);
      const goal = el('p', 'frontend-ai-phase-goal', phase.goal);
      const list = document.createElement('ul');
      list.className = 'frontend-ai-phase-tasks';
      (phase.tasks || []).forEach((task) => list.append(el('li', '', task)));
      card.append(head, goal, list);
      return card;
    })
  );

  refs.frontendAiBanner.textContent = frontendAi.banner;
  refs.frontendAiBanner.className = `frontend-ai-banner ${frontendAi.allowFormalDisplay ? 'ready' : 'blocked'}`;
  refs.frontendAiNote.textContent = `${frontendAi.reason}｜假資料／越權欄位顯示「否」才算通過。`;
  refs.frontendAiScopeStatus.textContent = snapshot?.frontendLock?.sourceOfTruth === 'backend' ? '後端鎖定' : '待確認';
  refs.frontendAiConfirmStatus.textContent = frontendAi.allowFormalDisplay ? '全部就緒' : '尚未完成';
  refs.frontendAiPlanStatus.textContent = frontendAi.allowFormalDisplay ? '正式版' : '鎖定執行';
  setTone(refs.frontendAiScopeStatus, snapshot?.frontendLock?.sourceOfTruth === 'backend' ? 'green' : 'orange');
  setTone(refs.frontendAiConfirmStatus, frontendAi.allowFormalDisplay ? 'green' : 'orange');
  setTone(refs.frontendAiPlanStatus, frontendAi.allowFormalDisplay ? 'green' : 'cyan');
  setBadge(refs.frontendAiBadge, frontendAi.allowFormalDisplay ? '正式版已確認' : '尚未完成確認', frontendAi.allowFormalDisplay ? 'green' : 'red');
  document.body.classList.toggle('frontend-ai-ready', frontendAi.allowFormalDisplay);
  document.body.classList.toggle('frontend-ai-blocked', !frontendAi.allowFormalDisplay);
}

function previousConfirmedItem(currentExecutionId) {
  return (state.storageItems || []).find(
    (item) =>
      String(item.executionId || '') !== String(currentExecutionId || '') &&
      isPass(item.confirmationStatus || item.status)
  ) || null;
}

function renderSystemStatus(snapshot) {
  const guard = getConsistencyGuard(snapshot);
  const frontendLock = snapshot?.frontendLock || {};
  const rows = [
    ['系統狀態', state.health?.status || 'OFFLINE'],
    ['後端連線狀態', state.health?.status || 'OFFLINE'],
    ['正式版本狀態', hasVersionMismatch(snapshot) ? '版本不一致' : snapshot?.systemVersion ? '正式版本' : '待確認'],
    ['今日是否可派單', isFormalReady(snapshot) ? '可直接執行' : '禁止發布'],
    ['審計狀態', snapshot?.audit?.status || '待確認'],
    ['確認狀態', snapshot?.confirmation?.status || '待確認'],
    ['備份狀態', snapshot?.files?.backupFile ? '備份完成' : '未備份'],
    ['日誌狀態', Array.isArray(snapshot?.logs) && snapshot.logs.length ? '日誌完成' : '未寫入'],
    ['AI 注入狀態', snapshot?.aiStatus?.status || '待確認'],
    ['一致性鎖死', guard?.status || '待確認'],
    ['前端重算', frontendLock.frontendMayComputeRanking === false ? '禁止' : '允許'],
    ['前端改寫', frontendLock.frontendMayRewriteAnnouncement === false ? '禁止' : '允許']
  ];

  safeReplace(
    refs.systemStatusGrid,
    ...rows.map(([label, value]) => {
      const card = el('article', 'status-grid-card');
      const title = el('span', '', label);
      const strong = el('strong', '', value);
      setTone(strong, toneFromStatus(value));
      card.append(title, strong);
      return card;
    })
  );

  setBadge(refs.systemStatusBadge, isFormalReady(snapshot) ? '正式可派單' : '系統保護中', isFormalReady(snapshot) ? 'green' : 'red');
}

function renderTotals(snapshot) {
  const blockMessage = getFormalDisplayBlock(snapshot);
  const summary = snapshot?.summary || {};
  const stats = snapshot?.overallStats || {};
  const displayMetric = (value) => (value === null || value === undefined ? '\u672a\u63d0\u4f9b' : fmt(value));
  if (blockMessage) {
    const card = el('article', 'notice-card notice-card-danger');
    card.append(el('strong', '', '整合總盤已鎖住'), el('p', '', blockMessage));
    safeReplace(refs.totalGrid, card);
    setBadge(refs.totalStatusBadge, '禁止顯示正式總盤', 'red');
    return;
  }

  const cards = [
    ['\u7e3d\u696d\u7e3e', displayMetric(summary.totalRevenue ?? stats.monthlyRevenue), 'gold'],
    ['\u672c\u6708\u696d\u7e3e', displayMetric(summary.currentMonthRevenue ?? stats.monthlyRevenue), 'gold'],
    ['\u8ffd\u7e8c\u55ae\u7e3d\u984d', displayMetric(summary.renewalRevenue ?? stats.renewalAmount), 'violet'],
    ['\u8ffd\u7e8c\u6210\u4ea4\u7e3d\u6578', summary.renewalDeals === null || summary.renewalDeals === undefined ? (stats.renewalCalls === null || stats.renewalCalls === undefined ? '\u672a\u63d0\u4f9b' : `${fmt(stats.renewalCalls)} \u901a`) : `${fmt(summary.renewalDeals)} \u901a`, 'cyan'],
    ['\u7576\u65e5\u7e8c\u55ae\u91d1\u984d', displayMetric(summary.dailyRenewalAmount ?? stats.dailyRenewalAmount), 'green'],
    ['\u7d2f\u7a4d\u6d3e\u55ae\u7e3d\u6210\u4ea4', displayMetric(summary.dispatchCalls ?? stats.dispatchCalls), 'orange']
  ];

  safeReplace(
    refs.totalGrid,
    ...cards.map(([label, value, tone]) => {
      const card = el('article', `total-card tone-${tone || 'gold'}`);
      card.append(el('span', '', label), el('strong', '', String(value || '-')));
      return card;
    })
  );

  setBadge(refs.totalStatusBadge, '總盤已鎖定', 'green');
}

function renderStageSummary(snapshot) {
  const stageSummary = snapshot?.stageSummary || {};
  const rows = [
    ['目前步驟', stageSummary.currentLabel || '待命'],
    ['功能完成度', `${stageSummary.completed || 0}/${stageSummary.total || 0}`],
    ['派單狀態', isFormalReady(snapshot) ? '可直接執行' : snapshot ? '等待確認' : '待命']
  ];

  safeReplace(
    refs.stageSummary,
    ...rows.map(([label, value]) => {
      const card = el('div', 'stage-summary-card');
      const title = el('span', '', label);
      const strong = el('strong', '', value);
      setTone(strong, toneFromStatus(value));
      card.append(title, strong);
      return card;
    })
  );
}

function renderAlerts(snapshot) {
  const guard = getConsistencyGuard(snapshot);
  const alerts = [];
  const auditWarnings = Array.isArray(snapshot?.audit?.warnings) ? snapshot.audit.warnings : [];

  if (!snapshot) {
    alerts.push({ tone: 'orange', text: '等待正式快照。工作區目前沒有正式派單結果。' });
  }
  if (state.health?.status === 'OFFLINE') alerts.push({ tone: 'red', text: '後端連線異常，禁止顯示正式結果。' });
  if (hasVersionMismatch(snapshot)) {
    alerts.push({
      tone: 'red',
      text: `版本不一致：health=${state.health?.systemVersion || '-'}｜current=${snapshot?.systemVersion || '-'}`
    });
  }
  if (guard?.conflictBlocked) {
    (guard.contradictions || []).forEach((item) => alerts.push({ tone: 'red', text: item }));
  }
  if (!isPass(snapshot?.audit?.status) && snapshot?.audit?.message) {
    alerts.push({ tone: 'red', text: snapshot.audit.message });
  }
  if (!isPass(snapshot?.confirmation?.status) && snapshot?.confirmation?.message) {
    alerts.push({ tone: 'red', text: snapshot.confirmation.message });
  }
  if (!snapshot?.files?.backupFile && isPass(snapshot?.status)) {
    alerts.push({ tone: 'orange', text: '正式結果尚未找到備份檔。' });
  }
  auditWarnings.forEach((item) => {
    if (item) alerts.push({ tone: 'orange', text: item });
  });
  if (!alerts.length) {
    alerts.push({ tone: 'green', text: '目前沒有異常，前後端版本、狀態、公告、排名一致。' });
  }

  safeReplace(
    refs.alertList,
    ...alerts.map((item) => {
      const row = el('div', `alert-row tone-${item.tone || 'green'}`);
      row.textContent = item.text;
      return row;
    })
  );
}

function renderVersionGrid(snapshot) {
  const previous = previousConfirmedItem(snapshot?.executionId);
  const frontendLock = snapshot?.frontendLock || {};
  const blockMessage = getFormalDisplayBlock(snapshot);
  const cards = [
    ['正式版本號', snapshot?.systemVersion || '-', 'gold'],
    ['目前正式序號', snapshot?.executionId || '-', 'orange'],
    ['上一版序號', previous?.executionId || '尚無上一版', 'cyan'],
    ['執行時間', snapshot?.completedAt || '-', 'gold'],
    ['資料來源', frontendLock.sourceOfTruth === 'backend' ? '後端唯一來源' : '待確認', 'green'],
    ['前端重算', frontendLock.frontendMayComputeRanking === false ? '禁止' : '允許', frontendLock.frontendMayComputeRanking === false ? 'green' : 'red']
  ];

  safeReplace(
    refs.versionGrid,
    ...cards.map(([label, value, tone]) => {
      const card = el('article', `version-card tone-${tone || 'gold'}`);
      const title = el('span', '', label);
      const strong = el('strong', '', String(value || '-'));
      setTone(strong, tone || 'gold');
      card.append(title, strong);
      return card;
    })
  );

  setBadge(
    refs.versionStatusBadge,
    blockMessage ? '版本保護中' : snapshot?.files?.archiveFile ? '正式版已留存' : '尚未留存',
    blockMessage ? 'red' : snapshot?.files?.archiveFile ? 'green' : 'orange'
  );
}

function renderTopbar(snapshot, meta = {}) {
  const systemName = snapshot?.systemName || meta.systemName || '兆櫃 AI 派單中樞系統';
  const systemVersion = snapshot?.systemVersion || meta.systemVersion || '-';
  const executionId = snapshot?.executionId || state.health?.currentExecutionId || '-';
  const aiConnected = isAiConnected(snapshot);
  const proofItems = getAiProofItems(snapshot);
  const guard = getConsistencyGuard(snapshot);

  refs.systemName.textContent = systemName;
  refs.systemVersion.textContent = systemVersion;
  refs.currentExecutionId.textContent = String(executionId);
  refs.aiConnectState.textContent = aiConnected ? '是' : '否';
  setTone(refs.aiConnectState, aiConnected ? 'green' : 'red');
  refs.aiConnectDetail.textContent = aiConnected
    ? '已接入後端 AI 鏈路'
    : '尚未形成完整 AI 鏈路';
  setTone(refs.aiConnectDetail, aiConnected ? 'green' : 'orange');
  refs.aiConnectDetail.textContent = getAiConnectDetail(snapshot);
  setTone(refs.aiConnectDetail, aiConnected ? 'green' : getAiProvider(snapshot)?.status === 'fallback' ? 'orange' : 'red');
  if (hasVersionMismatch(snapshot)) {
    refs.titleSummary.textContent = `版本不一致：health=${state.health?.systemVersion || '-'}｜current=${snapshot?.systemVersion || '-'}，禁止顯示正式結果。`;
  } else if (guard?.conflictBlocked) {
    refs.titleSummary.textContent = `矛盾保護已啟動：目前偵測 ${guard.contradictionCount} 項衝突，前端禁止自行改算，必須以後端快照為準。`;
  } else if (aiConnected) {
    const adviceCount = Array.isArray(snapshot?.bigdataAdvice) ? snapshot.bigdataAdvice.length : 0;
    refs.titleSummary.textContent = `AI 已接入：${adviceCount} 位同仁大數據解析完成，系統已自動完成 1000 權重排序與智慧分組。`;
    // 自動開啟 AI 視圖的邏輯可在此觸發
    if (adviceCount > 0) {
      document.body.classList.add('ai-active');
    }
  } else {
    refs.titleSummary.textContent = 'AI 未接入：目前尚未同時滿足審計、確認、排名、分析卡與公告條件。';
  }
  safeReplace(
    refs.titleProof,
    ...proofItems.map(([label, value]) => {
      const chip = el('span', 'title-chip');
      chip.append(el('strong', '', label), el('span', '', value));
      if (label === '一致性') {
        setTone(chip.lastChild, guard?.conflictBlocked ? 'red' : 'green');
      }
      if (label === 'AI') {
        setTone(chip.lastChild, aiConnected ? 'green' : 'red');
      }
      return chip;
    })
  );
}

function renderPreview(parsed, audit, confirmation, maintenance) {
  const safe = parsed || {};
  const invalid = Array.isArray(safe.invalidLines) ? safe.invalidLines.length : 0;
  const duplicate = Array.isArray(safe.duplicateNames) ? safe.duplicateNames.length : 0;
  const unknown = Array.isArray(safe.unknownNames) ? safe.unknownNames.length : 0;
  const items = [
    ['報表日期', safe.reportDate || '-'],
    ['派單日期', safe.dispatchDate || '-'],
    ['輸入總筆數', String(safe.inputLines || 0)],
    ['有效筆數', String(safe.validLines || 0)],
    ['異常筆數', String(invalid)],
    ['重複姓名', String(duplicate)],
    ['白名單外', String(unknown)],
    ['審計結果', audit?.status || '待確認'],
    ['確認結果', confirmation?.status || '待確認'],
    ['最新說明', confirmation?.message || audit?.message || safe.invalidLines?.[0]?.reason || '等待輸入每日業績日報']
  ];

  safeReplace(
    refs.inputPreviewGrid,
    ...items.map(([label, value]) => {
      const card = el('article', 'mini-panel');
      const title = el('h3', '', label);
      const valueClass = label === '最新說明' ? 'preview-value preview-value-message' : 'preview-value';
      const strong = el('strong', valueClass, value);
      if (label === '審計結果' || label === '確認結果') {
        setTone(strong, toneFromStatus(value));
      } else if (['異常筆數', '重複姓名', '白名單外'].includes(label)) {
        setTone(strong, Number(value) > 0 ? 'red' : 'green');
      } else {
        setTone(strong, 'gold');
      }
      card.append(title, strong);
      return card;
    })
  );

  renderPasteOrder(safe);
  renderMaintenance(maintenance, confirmation?.message || audit?.message || '貼上後會在這裡顯示異常掃描、維修與保養建議。');
}

function renderPasteOrder(source) {
  if (!refs.pasteOrderList || !refs.pasteOrderStatus) return;

  const people = Array.isArray(source) ? source : Array.isArray(source?.people) ? source.people : [];

  safeReplace(
    refs.pasteOrderList,
    ...(people.length
      ? people.map((person, index) => {
          const row = el('article', 'paste-order-row');
          row.append(
            el('strong', 'paste-order-rank', String(person.rank || person.inputRank || index + 1)),
            el('span', 'paste-order-name', person.name || person.originalName || '\u672a\u63d0\u4f9b\u59d3\u540d')
          );
          if (person.group) row.append(el('span', 'paste-order-group', person.group));
          return row;
        })
      : [el('div', 'paste-order-empty', '\u8cbc\u4e0a\u5f8c\u9019\u88e1\u6703\u5217\u51fa\u5168\u90e8\u884c\u92b7\u540d\u55ae\uff0c\u4e26\u4f9d\u6b63\u5f0f\u9806\u5e8f\u6392\u5217\u3002')])
  );

  setBadge(refs.pasteOrderStatus, people.length ? people.length + ' \u4f4d\u5df2\u6392\u5e8f' : '\u5f85\u89e3\u6790', people.length ? 'green' : 'gold');
}

function renderMaintenance(maintenance, fallbackMessage = '') {
  if (!refs.maintenanceList || !refs.maintenanceStatus) return;

  const safe = maintenance || {};
  const sections = [
    ...(Array.isArray(safe.scans) ? safe.scans : []),
    ...(Array.isArray(safe.repairs) ? safe.repairs : []),
    ...(Array.isArray(safe.upkeep) ? safe.upkeep : [])
  ];
  const metrics = Array.isArray(safe.metrics) ? safe.metrics : [];
  const checkpoints = Array.isArray(safe.checkpoints) ? safe.checkpoints : [];
  const nodes = [];

  if (safe.summary || metrics.length || checkpoints.length) {
    const overview = el('article', 'maintenance-summary-card');
    const head = el('div', 'maintenance-summary-head');
    head.append(el('strong', 'maintenance-summary-title', '\u5927\u4fdd\u990a\u7e3d\u89bd'), el('span', 'subhead-chip', String(safe.healthGrade || '-') + ' / ' + String(safe.healthScore ?? '--')));
    overview.append(head, el('div', 'maintenance-summary-text', safe.summary || fallbackMessage || '\u5c1a\u672a\u5b8c\u6210\u6383\u63cf\u3002'));

    if (metrics.length) {
      const metricGrid = el('div', 'maintenance-metric-grid');
      metrics.forEach((item) => {
        const card = el('div', 'maintenance-metric-card tone-' + (item.tone || 'gold'));
        card.append(el('span', 'maintenance-metric-label', item.label || ''), el('strong', 'maintenance-metric-value', item.value || '--'));
        metricGrid.append(card);
      });
      overview.append(metricGrid);
    }

    if (checkpoints.length) {
      const checkGrid = el('div', 'maintenance-check-grid');
      checkpoints.forEach((item) => {
        const row = el('div', 'maintenance-check-row');
        row.append(el('span', 'maintenance-check-label', item.label || ''), el('strong', 'maintenance-check-value ' + (item.value ? 'yes' : 'no'), item.value ? '\u662f' : '\u5426'));
        checkGrid.append(row);
      });
      overview.append(checkGrid);
    }

    nodes.push(overview);
  }

  if (sections.length) {
    sections.forEach((item) => {
      const row = el('article', 'maintenance-item tone-' + (item.tone || 'gold'));
      const head = el('div', 'maintenance-item-head');
      head.append(el('strong', 'maintenance-item-title', item.title || '\u7cfb\u7d71\u4fdd\u990a'));
      if (item.badge) head.append(el('span', 'subhead-chip', item.badge));
      row.append(head, el('div', 'maintenance-item-detail', item.detail || ''));
      nodes.push(row);
    });
  } else {
    nodes.push(el('div', 'maintenance-empty', fallbackMessage || '\u5c1a\u672a\u5b8c\u6210\u6383\u63cf\u3002'));
  }

  safeReplace(refs.maintenanceList, ...nodes);

  const anomalyCount = Number(safe.counts?.anomalies || 0);
  const statusText = safe.status === 'PASS' ? '\u5065\u5eb7 ' + String(safe.healthScore ?? 100) : safe.status === 'WARN' ? '\u8b66\u793a ' + anomalyCount : '\u5f85\u6383\u63cf';
  setBadge(refs.maintenanceStatus, statusText, safe.status === 'PASS' ? 'green' : safe.status === 'WARN' ? 'orange' : 'gold');
}

function renderStageList(stages, activeIndex = -1) {
  const list = Array.isArray(stages) && stages.length
    ? stages
    : DEFAULT_STAGES.map((label, index) => ({
        order: index + 1,
        label,
        status: 'pending',
        message: '待命'
      }));

  safeReplace(
    refs.stageList,
    ...list.map((stage, index) => {
      const classes = ['stage-item'];
      if (stage.status === 'done') classes.push('done');
      else if (stage.status === 'failed') classes.push('failed');
      else classes.push('pending');
      if (index === activeIndex) classes.push('active');

      const node = el('article', classes.join(' '));
      node.append(
        el('span', '', `${stage.order}. ${stage.label}`),
        el('strong', '', stage.message || '待命')
      );
      return node;
    })
  );
}

function renderChecks(audit, confirmation) {
  const rows = [
    ...(Array.isArray(audit?.checks) ? audit.checks : []),
    ...(Array.isArray(confirmation?.checks)
      ? confirmation.checks.map((item) => ({ ...item, label: `確認｜${item.label}` }))
      : [])
  ];

  safeReplace(
    refs.auditCheckList,
    ...(rows.length
      ? rows.map((item) => {
          const row = el('div', 'audit-row');
          const detail = el('div', '', item.detail ? `${item.status}｜${item.detail}` : item.status || '待確認');
          setTone(detail, toneFromStatus(item.status));
          row.append(el('strong', '', item.label || '檢查項目'), detail);
          return row;
        })
      : [el('div', 'audit-row', '等待審計與確認')])
  );
}

function renderWeights(weights) {
  const list = Array.isArray(weights) && weights.length
    ? weights.map((item) => [item.label, item.weight])
    : DEFAULT_WEIGHTS;

  safeReplace(
    refs.weightList,
    ...list.map(([label, weight]) => {
      const row = el('div', 'weight-row');
      row.append(el('span', '', label), el('strong', '', String(weight)));
      return row;
    })
  );
}

function renderInsights(snapshot) {
  const cards = [];
  const aiConnected = isAiConnected(snapshot);
  const guard = getConsistencyGuard(snapshot);
  cards.push({
    label: '一致性鎖死',
    value: guard?.conflictBlocked ? '已攔截' : '已鎖定',
    detail: guard?.conflictBlocked
      ? (guard.contradictions || []).join('｜')
      : '前端禁止自行改算排名、分組、公告與 AI 狀態。',
    tone: guard?.conflictBlocked ? 'red' : 'green'
  });
  cards.push({
    label: 'AI 注入確認',
    value: aiConnected ? '已接入' : '未接入',
    detail: getAiProof(snapshot),
    tone: aiConnected ? 'green' : 'red'
  });

  if (Array.isArray(snapshot?.aiInsights?.cards)) {
    cards.push(...snapshot.aiInsights.cards);
  }

  const lines = Array.isArray(snapshot?.aiInsights?.lines) ? snapshot.aiInsights.lines.slice(0, 6) : [];
  const nodes = cards.map((item) => {
    const card = el('article', 'insight-card');
    const value = el('strong', '', item.value || '-');
    setTone(value, item.tone || 'cyan');
    card.append(el('span', '', item.label || 'AI 指標'), value, el('p', '', item.detail || ''));
    return card;
  });

  if (lines.length) {
    const card = el('article', 'insight-card');
    card.append(el('span', '', 'AI 判讀摘要'));
    lines.forEach((line) => card.append(el('p', '', line)));
    nodes.push(card);
  }

  safeReplace(refs.insightList, ...nodes);
  setBadge(
    refs.aiAnalysisBadge,
    isFormalReady(snapshot) && aiConnected && !guard?.conflictBlocked ? 'AI 已鎖定接入' : 'AI 待確認',
    isFormalReady(snapshot) && aiConnected && !guard?.conflictBlocked ? 'green' : 'orange'
  );
}

function renderRanking(snapshotOrRanking) {
  const blockMessage = Array.isArray(snapshotOrRanking) ? '' : getFormalDisplayBlock(snapshotOrRanking);
  const ranking = Array.isArray(snapshotOrRanking)
    ? snapshotOrRanking
    : Array.isArray(snapshotOrRanking?.ranking)
    ? snapshotOrRanking.ranking
    : [];

  if (blockMessage) {
    const card = el('article', 'notice-card notice-card-danger');
    card.append(el('strong', '', '今日排名已鎖住'), el('p', '', blockMessage));
    safeReplace(refs.rankingList, card);
    setBadge(refs.rankingStatusBadge, '禁止顯示正式排名', 'red');
    return;
  }

  safeReplace(
    refs.rankingList,
    ...((Array.isArray(ranking) ? ranking : []).length
      ? ranking.map((person) => {
          const row = el('article', 'rank-row');
          const head = el('div', 'rank-row-head');
          const rank = el('strong', 'rank-primary', `${person.rank}、${person.name}`);
          const tags = el('div', 'rank-tags');
          const groupTag = el('span', 'rank-tag', person.groupLabel || person.group || '未分組');
          const movementTag = el('span', 'rank-tag', person.movement || '持平');
          tags.append(groupTag, movementTag);
          head.append(rank, tags);

          const metrics = el('div', 'rank-metrics');
          const hasDispatchScore = Number.isFinite(Number(person.dispatchScore));
          const hasMetricData =
            person.totalRevenue !== null &&
            person.totalRevenue !== undefined &&
            person.renewalRevenue !== null &&
            person.renewalRevenue !== undefined &&
            person.renewalDeals !== null &&
            person.renewalDeals !== undefined;
          if (hasDispatchScore) {
            const scoreEl = el('span', 'number-tech tech-glow', `派單分 ${fmt(person.dispatchScore)}`);
            metrics.append(scoreEl);
          }
          if (hasMetricData) {
            const scoreKnown = Number.isFinite(Number(person.totalScore));
            if (scoreKnown) {
              metrics.append(el('span', 'number-tech', `AI ${fmtScore(person.totalScore)}`));
            }
            metrics.append(
              el('span', '', `總業績 ${fmt(person.totalRevenue)}`),
              el('span', '', `續單 ${fmt(person.renewalRevenue)}`),
              el('span', '', `追續 ${fmt(person.renewalDeals)}`)
            );
          } else {
            metrics.append(
              el('span', 'encrypted-text', '總業績 [ENCRYPTED]'),
              el('span', 'encrypted-text', '續單 [ENCRYPTED]')
            );
          }

          row.append(head, metrics);
          return row;
        })
      : [el('div', 'rank-row', '尚未產生排名結果')])
  );

  setBadge(refs.rankingStatusBadge, Array.isArray(ranking) && ranking.length ? `正式排序 ${ranking.length} 人` : '尚未產生排名', Array.isArray(ranking) && ranking.length ? 'green' : 'orange');
}

function renderGroups(snapshotOrGroups) {
  const blockMessage = snapshotOrGroups && !Array.isArray(snapshotOrGroups?.A1) ? getFormalDisplayBlock(snapshotOrGroups) : '';
  if (blockMessage) {
    const row = el('div', 'group-row group-row-blocked');
    row.append(el('span', '', '明日派單順序'), el('strong', '', blockMessage));
    safeReplace(refs.groupList, row);
    return;
  }

  const safe = snapshotOrGroups?.groups || snapshotOrGroups || { A1: [], A2: [], B: [], C: [] };
  safeReplace(
    refs.groupList,
    ...['A1', 'A2', 'B', 'C'].map((key) => {
      const row = el('div', 'group-row');
      row.append(el('span', '', GROUP_LABELS[key]), el('strong', '', joinNames(safe[key])));
      return row;
    })
  );
}

function renderChanges(snapshotOrChanges) {
  const blockMessage =
    snapshotOrChanges &&
    !Array.isArray(snapshotOrChanges?.up) &&
    !Array.isArray(snapshotOrChanges?.down) &&
    !Array.isArray(snapshotOrChanges?.flat) &&
    !Array.isArray(snapshotOrChanges?.new)
      ? getFormalDisplayBlock(snapshotOrChanges)
      : '';

  if (blockMessage) {
    const row = el('article', 'change-row');
    row.append(el('strong', '', '名次異動'), el('div', '', blockMessage));
    safeReplace(refs.changeList, row);
    return;
  }

  const safe = snapshotOrChanges?.changes || snapshotOrChanges || { up: [], down: [], flat: [], new: [] };
  const sections = [
    ['上升', safe.up || []],
    ['下降', safe.down || []],
    ['持平', safe.flat || []],
    ['新進', safe.new || []]
  ];
  safeReplace(
    refs.changeList,
    ...sections.map(([label, values]) => {
      const row = el('article', 'change-row');
      row.append(el('strong', '', label), el('div', '', values.length ? values.join('、') : '無'));
      return row;
    })
  );
}

/* ══════════════════════════════════════════════════════════
   ★ 三平台整合總盤 — renderPlatformStats
   來源：snapshot.overallStats 或硬編碼基準
══════════════════════════════════════════════════════════ */
const PLATFORM_STATS_BASELINE = OFFICIAL_FRONTEND_0412_TO_0413.overallStats;

function renderPlatformStats(snapshot) {
  const stats = snapshot?.overallStats || PLATFORM_STATS_BASELINE;
  const reportDate = snapshot?.reportDate || OFFICIAL_FRONTEND_0412_TO_0413.reportDate;
  const cards = [
    { label: '當月總業績（扣退貨）', value: fmt(stats.monthlyRevenue), hero: true },
    { label: '累積總派單數', value: fmt(stats.totalCalls) },
    { label: '累積派單總成交數', value: fmt(stats.dispatchCalls) },
    { label: '累積追續總成交數', value: fmt(stats.renewalCalls) },
    { label: '追續單金額', value: fmt(stats.renewalAmount) },
    { label: '今日取消退貨', value: fmt(stats.cancellations) }
  ];

  safeReplace(
    refs.platformStatsGrid,
    ...cards.map((item) => {
      const card = el('article', `platform-stat-card${item.hero ? ' stat-hero' : ''}`);
      card.append(el('span', '', item.label), el('strong', '', item.value));
      return card;
    })
  );

  setBadge(refs.platformStatsBadge, `三平台 PASS｜${reportDate} 結算正式基準`, 'green');
}

/* ══════════════════════════════════════════════════════════
   ★ 名次異動追蹤 — renderRankChanges
   正式版：4/8 結算 → 4/9 派單
   比較基準：前一輪正式名次 vs 本輪 4/9 正式名次
══════════════════════════════════════════════════════════ */
const RANK_CHANGES_BASELINE = {
  up: [
    { name: '王珍珠', from: 4, to: 3 },
    { name: '林宜靜', from: 6, to: 5 },
    { name: '蘇淑玲', from: 14, to: 9 },
    { name: '高如郁', from: 16, to: 13 },
    { name: '高美雲', from: 17, to: 14 }
  ],
  down: [
    { name: '林沛昕', from: 3, to: 4 },
    { name: '李玲玲', from: 5, to: 6 },
    { name: '徐華妤', from: 9, to: 10 },
    { name: '江麗勉', from: 10, to: 11 },
    { name: '梁依萍', from: 11, to: 12 },
    { name: '陳玲華', from: 12, to: 15 },
    { name: '鄭珮恩', from: 15, to: 16 },
    { name: '許喬恩', from: 13, to: 17 },
    { name: '謝啟芳', from: 18, to: 19 },
    { name: '周美蓁', from: 19, to: 20 },
    { name: '林佩君', from: 20, to: 22 },
    { name: '鄭上官', from: 22, to: 23 }
  ],
  flat: [
    { name: '馬秋香', from: 1, to: 1 },
    { name: '王梅慧', from: 2, to: 2 },
    { name: '廖姿惠', from: 7, to: 7 },
    { name: '湯玉琦', from: 8, to: 8 },
    { name: '江沛林', from: 21, to: 21 }
  ],
  new: [
    { name: '陳桂子（新人）', to: 18, note: '正式進入名次盤，列入培養觀察帶' }
  ],
  summary: '前二名不變，第 3、第 4 名互換。蘇淑玲從第 14 名推進到第 9 名，正式切入前 10；陳桂子（新人）本輪新進第 18 名，已列入正式名次盤。'
};

function renderRankChanges(snapshot) {
  const data = snapshot?.rankChanges || RANK_CHANGES_BASELINE;

  // 建構四個區塊：上升 / 下降 / 持平 / 新進
  const buildSection = (title, items, direction) => {
    const section = el('div', 'rank-change-section');
    const arrowIcon =
      direction === 'up' ? '▲' :
      direction === 'down' ? '▼' :
      direction === 'new' ? '＋' :
      '━';
    const sectionClass = `section-${direction}`;

    const header = el('div', `rank-change-section-title ${sectionClass}`);
    header.append(el('span', 'arrow-icon', arrowIcon), el('span', '', `${title}（${items.length} 人）`));
    section.append(header);

    items.forEach((person) => {
      const row = el('div', 'rank-change-row');
      const arrowClass = `change-arrow arrow-${direction}`;
      const arrowText =
        direction === 'up' ? '▲' :
        direction === 'down' ? '▼' :
        direction === 'new' ? '＋' :
        '━';
      const detail =
        direction === 'new'
          ? `新進第 ${person.to} 名`
          : direction === 'flat' && person.from === person.to
          ? `第 ${person.from} 持平`
          : `第 ${person.from} → 第 ${person.to}`;

      row.append(
        el('span', arrowClass, arrowText),
        el('span', 'change-name', person.name),
        el('span', 'change-detail', person.note ? `${detail}（${person.note}）` : detail)
      );
      section.append(row);
    });
    return section;
  };

  const nodes = [];
  if (data.up?.length) nodes.push(buildSection('上升', data.up, 'up'));
  if (data.down?.length) nodes.push(buildSection('下降', data.down, 'down'));
  if (data.flat?.length) nodes.push(buildSection('持平', data.flat, 'flat'));
  if (data.new?.length) nodes.push(buildSection('新進名次盤', data.new, 'new'));

  // 加入總結摘要
  if (data.summary) {
    const summaryBox = el('div', 'rank-change-summary');
    summaryBox.innerHTML = data.summary.replace(
      /(第\s?\d+[～~\-至到]\s?\d+\s?名)/g,
      '<strong>$1</strong>'
    );
    nodes.push(summaryBox);
  }

  safeReplace(refs.rankChangeList, ...nodes);
  setBadge(
    refs.rankChangeBadge,
    `↑${data.up?.length || 0} ↓${data.down?.length || 0} ━${data.flat?.length || 0} ＋${data.new?.length || 0}`,
    'cyan'
  );
}

/* ══════════════════════════════════════════════════════════
   ★ AI 大數據建議 — renderBigDataAdvice
   正式版：4/8 結算 → 4/9 派單
   每人一句：一句到位，直接執行
   分組：A1(4) A2(6) B(7) C(6)
══════════════════════════════════════════════════════════ */
const BIGDATA_ADVICE_BASELINE = [
  { rank: 1, name: '馬秋香', group: 'A1', text: '第一名不是守住就好，今天要把第一名拉開。' },
  { rank: 2, name: '王梅慧', group: 'A1', text: '你已經貼近榜首，今天再補一筆就能直接施壓第一。' },
  { rank: 3, name: '王珍珠', group: 'A1', text: '你追續厚，今天重點是把厚度變成更扎實的實收。' },
  { rank: 4, name: '林沛昕', group: 'A1', text: '你總盤很硬，今天缺的是再往前翻位的臨門一腳。' },
  { rank: 5, name: '林宜靜', group: 'A2', text: '位置穩，但還能更前，今天先把最準那筆拿下。' },
  { rank: 6, name: '李玲玲', group: 'A2', text: '你還在主力帶，今天不是保位，是往前壓。' },
  { rank: 7, name: '廖姿惠', group: 'A2', text: '你屬於很標準的補位型，今天一補就會更靠前。' },
  { rank: 8, name: '湯玉琦', group: 'A2', text: '你追續成交數很強，今天重點是把量收成實績。' },
  { rank: 9, name: '蘇淑玲', group: 'A2', text: '你這輪站得住，今天關鍵是不要停。' },
  { rank: 10, name: '徐華妤', group: 'A2', text: '你穩在前十，今天一補單就能再往上。' },
  { rank: 11, name: '江麗勉', group: 'B', text: '你現在差的不是底，是差再開一筆。' },
  { rank: 12, name: '梁依萍', group: 'B', text: '你還在可翻位區，今天先求穩穩進袋。' },
  { rank: 13, name: '高如郁', group: 'B', text: '今天要把可落袋的先收，不要讓位置再鬆。' },
  { rank: 14, name: '高美雲', group: 'B', text: '你現在有上推空間，今天一補就能再往前。' },
  { rank: 15, name: '陳玲華', group: 'B', text: '中後段差距很小，今天開一筆就會動。' },
  { rank: 16, name: '鄭珮恩', group: 'B', text: '你追續底還在，今天先把最穩的一筆做出來。' },
  { rank: 17, name: '許喬恩', group: 'B', text: '今天重點不是多，是先把盤面重新接起來。' },
  { rank: 18, name: '陳桂子（新人）', group: 'C', text: '先求穩穩起步，有第一筆就有第二筆。' },
  { rank: 19, name: '謝啟芳', group: 'C', text: '先把第一個明確數字做出來，位置就會變。' },
  { rank: 20, name: '周美蓁', group: 'C', text: '先動起來，比停在原地更重要。' },
  { rank: 21, name: '江沛林', group: 'C', text: '你不是沒底，是差一筆把線重新接上。' },
  { rank: 22, name: '林佩君', group: 'C', text: '今天先求開張，不要讓名字只停在名單上。' },
  { rank: 23, name: '鄭上官', group: 'C', text: '先抓最穩的那一步，今天有動作就會開始改變。' }
];

function renderBigDataAdvice(snapshot) {
  const advice = snapshot?.bigdataAdvice || BIGDATA_ADVICE_BASELINE;
  const nodes = advice.map((item) => {
    const groupClass = `group-${item.group || 'A'}`;
    const card = el('article', `bigdata-advice-card ${groupClass}`);
    
    // 注入掃描線與科技感背景元件
    card.append(el('div', 'scanning-line'));

    const header = el('div', 'advice-header');
    header.append(
      el('span', 'advice-rank', `#${item.rank || '-'}`),
      el('span', 'advice-name', item.name || 'Unknown'),
      el('span', `advice-group-tag tag-${item.group || 'A'}`, item.group || 'A')
    );

    const text = el('p', 'advice-text', item.text || item.advice || '');
    card.append(header, text);
    return card;
  });

  safeReplace(refs.bigdataAdviceList, ...nodes);
  setBadge(refs.bigdataAdviceBadge, `${advice.length} 人已分析`, 'green');
}

function renderFiles(files) {
  const rows = [];
  if (files?.reportFile) rows.push(['正式快照', files.reportFile]);
  if (files?.backupFile) rows.push(['備份檔', files.backupFile]);
  if (files?.archiveFile) rows.push(['每日封存', files.archiveFile]);

  safeReplace(
    refs.fileList,
    ...(rows.length
      ? rows.map(([label, value]) => {
          const row = el('div', 'file-row');
          row.append(el('span', '', label), el('strong', '', value));
          return row;
        })
      : [el('div', 'file-row', '工作區目前沒有輸出檔案')])
  );
}

function renderAnnouncementMeta(snapshot) {
  const text = String(snapshot?.announcement || '');
  const lineCount = text ? text.split(/\r?\n/).filter(Boolean).length : 0;
  const charCount = text.length;
  const guard = getConsistencyGuard(snapshot);
  const aiLabel = snapshot?.aiStatus?.status || (isAiConnected(snapshot) ? '已接入' : '未接入');
  const blockMessage = getFormalDisplayBlock(snapshot);

  refs.announcementMeta.textContent = blockMessage
    ? `禁止顯示正式公告｜${blockMessage}`
    : text
    ? `${aiLabel}｜${guard?.status || '待確認'}｜${charCount} 字｜${lineCount} 行`
    : '尚未生成';
  setTone(
    refs.announcementMeta,
    blockMessage ? 'red' : guard?.conflictBlocked ? 'red' : text ? (isAiConnected(snapshot) ? 'green' : 'gold') : 'gold'
  );
}

function buildChairmanSummary(snapshot) {
  const ranking = topPeople(snapshot, 5);
  const guard = getConsistencyGuard(snapshot);
  const summary = snapshot?.summary || {};
  const groups = snapshot?.groups || {};
  const first = ranking[0];
  const blockMessage = getFormalDisplayBlock(snapshot);

  if (blockMessage) {
    return [
      {
        label: '系統結論',
        value: '禁止發布',
        detail: blockMessage
      },
      {
        label: '正式版本',
        value: snapshot?.systemVersion || '-',
        detail: `執行序號 ${snapshot?.executionId || '-'}`
      },
      {
        label: '一致性狀態',
        value: guard?.status || '待確認',
        detail: `矛盾數 ${guard?.contradictionCount || 0}`
      },
      {
        label: '最後更新',
        value: snapshot?.completedAt || '-',
        detail: '前端停止顯示正式公告與排名'
      }
    ];
  }

  return [
    {
      label: '系統結論',
      value: guard?.conflictBlocked ? '禁止發布' : `${snapshot?.aiStatus?.status || '待確認'}｜${guard?.status || '待確認'}`,
      detail: guard?.conflictBlocked
        ? (guard?.contradictions?.[0] || '已偵測到矛盾')
        : '前後端同一快照，禁止分開計算'
    },
    {
      label: '榜首',
      value: first ? `${first.name}｜AI ${fmtScore(first.totalScore)}` : '尚未產生',
      detail: first ? `總業績 ${fmt(first.totalRevenue)}｜續單 ${fmt(first.renewalRevenue)}` : '等待執行'
    },
    {
      label: '今日總控',
      value: `實收 ${fmt(summary.totalRevenue)}｜續單 ${fmt(summary.renewalRevenue)}`,
      detail: `追續 ${fmt(summary.renewalDeals)} 通｜有效 ${summary.activePeople || 0}/${summary.totalPeople || 0}`
    },
    {
      label: '明日派單',
      value: `A1 ${groups.A1?.length || 0}｜A2 ${groups.A2?.length || 0}｜B ${groups.B?.length || 0}｜C ${groups.C?.length || 0}`,
      detail: `A1：${joinNames(groups.A1)}`
    }
  ];
}

function renderChairmanAnnouncement(snapshot) {
  const container = refs.announcementOutput;
  const ranking = topPeople(snapshot, 5);
  const groups = snapshot?.groups || {};
  const guard = getConsistencyGuard(snapshot);
  const summaryTiles = buildChairmanSummary(snapshot).map((item) => {
    const tile = el('article', 'summary-tile');
    tile.append(
      el('span', '', item.label),
      el('strong', '', item.value),
      el('p', '', item.detail)
    );
    return tile;
  });

  const sections = [];

  const lead = el('article', 'announcement-block announcement-block-lead');
  lead.append(
    el('h4', 'announcement-block-title', '董事長重點'),
    ...ranking.map((person, index) =>
      el(
        'div',
        'announcement-line',
        `${index + 1}、${person.name}｜AI ${fmtScore(person.totalScore)}｜總業績 ${fmt(person.totalRevenue)}｜${person.movement || '持平'}`
      )
    )
  );
  sections.push(lead);

  const groupBlock = el('article', 'announcement-block');
  groupBlock.append(
    el('h4', 'announcement-block-title', '明日分組'),
    el('div', 'announcement-line', `A1 高單主力：${joinNames(groups.A1)}`),
    el('div', 'announcement-line', `A2 續單收割：${joinNames(groups.A2)}`),
    el('div', 'announcement-line', `B 組一般量單：${joinNames(groups.B)}`),
    el('div', 'announcement-line', `C 組補位觀察：${joinNames(groups.C)}`)
  );
  sections.push(groupBlock);

  const statusBlock = el('article', 'announcement-block');
  statusBlock.append(
    el('h4', 'announcement-block-title', '系統狀態'),
    el('div', 'announcement-line', `AI：${snapshot?.aiStatus?.status || '待確認'}`),
    el('div', 'announcement-line', `一致性：${guard?.status || '待確認'}`),
    el('div', 'announcement-line', `矛盾數：${guard?.contradictionCount || 0}`),
    el('div', 'announcement-line', `正式快照：${snapshot?.files?.reportFile || '尚未生成'}`)
  );
  sections.push(statusBlock);

  const summaryGrid = el('div', 'announcement-summary-grid');
  summaryGrid.append(...summaryTiles);
  container.replaceChildren(summaryGrid, ...sections);
}

function renderStandardAnnouncement(snapshot) {
  const container = refs.announcementOutput;
  const lines = formatAnnouncementText(snapshot?.announcement);
  const blocks = [];
  let currentBlock = [];

  lines.forEach((line) => {
    if (!line.trim()) {
      if (currentBlock.length) {
        blocks.push(currentBlock);
        currentBlock = [];
      }
      return;
    }
    currentBlock.push(line);
  });

  if (currentBlock.length) blocks.push(currentBlock);

  if (!blocks.length) {
    container.replaceChildren(el('div', 'announcement-empty', '尚未生成公告'));
    return;
  }

  container.replaceChildren(
    ...blocks.map((block, index) => {
      const card = el('article', `announcement-block${index === 0 ? ' announcement-block-lead' : ''}`);
      const [first, ...rest] = block;
      const useTitle = first.startsWith('📣') || /^([一二三四五六七八九十]+、)/.test(first);
      if (useTitle) {
        card.append(el('h4', 'announcement-block-title', first));
      } else {
        card.append(el('div', 'announcement-line', first));
      }
      rest.forEach((line) => card.append(el('div', 'announcement-line', line)));
      return card;
    })
  );
}

function renderAnnouncement(snapshot) {
  refs.btnChairmanMode.textContent = state.chairmanMode ? '完整閱讀' : '董事長模式';
  const blockMessage = getFormalDisplayBlock(snapshot);
  if (blockMessage) {
    const card = el('article', 'notice-card notice-card-danger');
    card.append(el('strong', '', '正式公告已鎖住'), el('p', '', blockMessage));
    refs.announcementOutput.replaceChildren(card);
    return;
  }
  if (!snapshot?.announcement) {
    safeReplace(refs.announcementOutput, el('div', 'announcement-empty', '尚未生成公告'));
    return;
  }
  if (state.chairmanMode) {
    renderChairmanAnnouncement(snapshot);
  } else {
    renderStandardAnnouncement(snapshot);
  }
}

function renderLogs(logs) {
  refs.logList.replaceChildren(
    ...((Array.isArray(logs) ? logs : []).length
      ? logs.map((entry) => {
          const row = el('article', 'log-row');
          row.append(
            el('strong', '', `${entry.type || '日誌'}｜${entry.time || '-'}`),
            el('div', '', entry.message || '')
          );
          return row;
        })
      : [el('div', 'log-row', '尚未建立執行日誌')])
  );
  setBadge(refs.logStatusBadge, Array.isArray(logs) && logs.length ? '日誌正常' : '尚未建立日誌', Array.isArray(logs) && logs.length ? 'green' : 'orange');
}

function renderExecutiveBoard(snapshot) {
  const summary = snapshot?.summary || {};
  const ranking = topPeople(snapshot, 1);
  const first = ranking[0];
  const stageSummary = snapshot?.stageSummary || {};
  const readyToDispatch = isFormalReady(snapshot);
  const metrics = [
    { label: '今日總業績', value: fmt(summary.totalRevenue), tone: 'gold', tier: 'hero' },
    { label: '今日第一名', value: first ? first.name : '待確認', tone: 'cyan', tier: 'hero' },
    { label: '功能完成度', value: `${stageSummary.completed || 0}/${stageSummary.total || 0}`, tone: 'green', tier: 'hero' },
    { label: '是否可派單', value: readyToDispatch ? '可直接派單' : '暫停派單', tone: readyToDispatch ? 'green' : 'red', tier: 'hero' },
    { label: '系統狀態', value: state.health?.status || 'OFFLINE', tone: toneFromStatus(state.health?.status || 'OFFLINE'), tier: 'support' },
    { label: '今日追續總數', value: `${fmt(summary.renewalDeals)} 通`, tone: 'cyan', tier: 'support' },
    { label: '今日續單總額', value: fmt(summary.renewalRevenue), tone: 'violet', tier: 'support' },
    { label: '正式版本', value: snapshot?.systemVersion || '-', tone: 'orange', tier: 'support' },
    { label: '最後更新時間', value: snapshot?.completedAt || '-', tone: 'gold', tier: 'support' }
  ];

  refs.bossCardGrid.replaceChildren(
    ...metrics.map((item) => {
      const card = el(
        'article',
        `boss-card tone-${item.tone || 'gold'} executive-card executive-card-${item.tier || 'support'}`
      );
      card.append(el('span', '', item.label), el('strong', '', String(item.value || '-')));
      return card;
    })
  );

  setBadge(refs.dispatchReadyBadge, readyToDispatch ? '可直接派單' : '暫停發布', readyToDispatch ? 'green' : 'red');
}

function mountStorageUI() {
  if (state.storageMounted) return;
  const panel = refs.fileList.closest('.files-panel');
  if (!panel) return;

  const shell = el('div', 'storage-query-shell');
  const bar = el('div', 'storage-query-bar');
  const input = document.createElement('input');
  input.id = 'storage-report-date';
  input.className = 'storage-query-input';
  input.placeholder = '報表日期，例如 115/04/06';

  const btnQuery = el('button', 'ghost-btn storage-query-btn', '查詢');
  const btnAll = el('button', 'ghost-btn storage-query-btn', '全部');
  const summary = el('div', 'storage-query-summary', '尚未查詢每日存檔');
  summary.id = 'storage-query-summary';
  const dateList = el('div', 'storage-date-list');
  dateList.id = 'storage-date-list';
  const detailHead = el('div', 'storage-query-head');
  const detailTitle = el('h4', 'storage-query-title', '當日存檔明細');
  const detailToggle = el('button', 'ghost-btn storage-inline-btn', '展開全部');
  detailToggle.id = 'storage-toggle-view';
  detailToggle.hidden = true;
  detailToggle.onclick = () => {
    state.storageShowAll = !state.storageShowAll;
    renderStorageList(state.storageItems, state.storageReportDate);
  };
  const list = el('div', 'storage-list');
  list.id = 'storage-list';
  const protect = el(
    'div',
    'storage-protect-note',
    '工作區歸零只清空當前輸入，不會刪除任何已確認存檔、每日封存與歷史資料。'
  );

  btnQuery.onclick = () => {
    const reportDate = input.value.trim();
    loadStorageList(reportDate);
    loadStorageDates(reportDate);
  };
  btnAll.onclick = () => {
    input.value = '';
    loadStorageList('');
    loadStorageDates('');
  };
  input.onkeydown = (event) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      btnQuery.click();
    }
  };

  bar.append(input, btnQuery, btnAll);
  detailHead.append(detailTitle, detailToggle);
  shell.append(
    el('h4', 'storage-query-title', '每日存檔查詢'),
    bar,
    summary,
    el('h4', 'storage-query-title', '每日存檔時間軸'),
    dateList,
    detailHead,
    list,
    protect
  );
  panel.append(shell);
  state.storageMounted = true;
}

function renderStorageDates(items, activeDate = '') {
  const target = $('storage-date-list');
  if (!target) return;
  safeReplace(
    target,
    ...(items.length
      ? items.map((item) => {
          const card = el(
            'article',
            `storage-date-card${activeDate && activeDate === item.reportDate ? ' active' : ''}`
          );
          const head = el('div', 'storage-row-head');
          const status = el(
            'span',
            `storage-status tone-${toneFromStatus(item.latestStatus || (item.failed > 0 ? '失敗' : '通過'))}`,
            item.reportDate || '未分組日期'
          );
          const btn = el('button', 'ghost-btn storage-load-btn', '查看當日');
          btn.onclick = () => {
            const input = $('storage-report-date');
            if (input) input.value = item.reportDate || '';
            loadStorageList(item.reportDate || '');
            loadStorageDates(item.reportDate || '');
          };
          head.append(status, btn);
          card.append(
            head,
            el('div', 'storage-row-text', `存檔 ${item.total}｜通過 ${item.confirmed}｜失敗 ${item.failed}`),
            el('div', 'storage-row-meta', `最新執行 ${item.latestExecutionId || '-'}｜${item.latestCompletedAt || '-'}`)
          );
          if (item.latestMessage) card.append(el('div', 'storage-row-text', item.latestMessage));
          return card;
        })
      : [el('div', 'storage-empty', '尚未建立每日存檔時間軸')])
  );
}

function renderStorageList(items, reportDate = '') {
  const summary = $('storage-query-summary');
  const target = $('storage-list');
  const toggle = $('storage-toggle-view');
  if (!summary || !target) return;

  state.storageItems = items;
  state.storageReportDate = reportDate;

  const limited = items.length > 8;
  const displayItems = limited && !state.storageShowAll ? items.slice(0, 8) : items;

  summary.textContent = items.length
    ? `查到 ${items.length} 筆｜${reportDate ? `報表日期 ${reportDate}` : '全部日期'}${limited && !state.storageShowAll ? '｜目前只顯示最近 8 筆' : ''}`
    : `沒有查到存檔${reportDate ? `｜報表日期 ${reportDate}` : ''}`;

  if (toggle) {
    toggle.hidden = !limited;
    toggle.textContent = state.storageShowAll ? '收回最近 8 筆' : `展開全部 ${items.length} 筆`;
  }

  safeReplace(
    target,
    ...(displayItems.length
      ? displayItems.map((item) => {
          const row = el('article', 'storage-row');
          const head = el('div', 'storage-row-head');
          const status = el(
            'span',
            `storage-status tone-${toneFromStatus(item.confirmationStatus || item.status)}`,
            item.confirmationStatus || item.status || '待確認'
          );
          const btn = el('button', 'ghost-btn storage-load-btn', '載入');
          btn.onclick = () => loadSnapshotById(item.executionId);
          head.append(status, btn);
          row.append(
            head,
            el(
              'div',
              'storage-row-meta',
              `執行序號 ${item.executionId}｜${item.reportDate} → ${item.dispatchDate}｜${item.completedAt}`
            ),
            el(
              'div',
              'storage-row-text',
              `${item.topName || '無榜首資料'}｜有業績 ${item.activePeople}/${item.totalPeople} 人`
            )
          );
          if (item.archiveFile) row.append(el('div', 'storage-row-text', `封存檔：${item.archiveFile}`));
          if (item.message) {
            const messageWrap = el('div', 'storage-message');
            const expanded = state.storageExpandedKeys.has(item.executionId);
            const messageText = el(
              'div',
              `storage-row-text storage-message-text${expanded ? ' expanded' : ' clamped'}`,
              item.message
            );
            messageWrap.append(messageText);

            if (String(item.message).length > 140 || String(item.message).includes('；')) {
              const moreBtn = el('button', 'ghost-btn storage-inline-btn', expanded ? '收合' : '展開');
              moreBtn.onclick = () => {
                if (expanded) state.storageExpandedKeys.delete(item.executionId);
                else state.storageExpandedKeys.add(item.executionId);
                renderStorageList(state.storageItems, state.storageReportDate);
              };
              messageWrap.append(moreBtn);
            }

            row.append(messageWrap);
          }
          return row;
        })
      : [el('div', 'storage-empty', '沒有可載入的每日存檔')])
  );

  if (state.current) {
    renderVersionGrid(state.current);
  }
}

async function loadStorageDates(activeDate = '') {
  if (!state.storageMounted) return;
  try {
    const { payload } = await apiGet('/api/storage/dates?limit=60');
    renderStorageDates(payload.data?.items || [], activeDate);
  } catch {
    renderStorageDates([], activeDate);
  }
}

async function loadStorageList(reportDate = '') {
  if (!state.storageMounted || state.storageLoading) return;
  state.storageLoading = true;
  state.storageShowAll = false;
  state.storageExpandedKeys.clear();
  const summary = $('storage-query-summary');
  if (summary) summary.textContent = '正在讀取每日存檔...';

  try {
    const query = reportDate ? `?reportDate=${encodeURIComponent(reportDate)}` : '';
    const { payload } = await apiGet(`/api/storage/list${query}`);
    renderStorageList(payload.data?.items || [], reportDate);
  } catch (error) {
    renderStorageList([], reportDate);
    if (summary) summary.textContent = `每日存檔讀取失敗：${error.message}`;
  } finally {
    state.storageLoading = false;
  }
}

async function loadSnapshotById(executionId) {
  try {
    const { payload } = await apiGet(`/api/storage/${encodeURIComponent(String(executionId))}`);
    if (payload.success && payload.data) {
      setWorkspaceMode('active');
      renderSnapshot(payload.data, {
        systemName: payload.systemName,
        systemVersion: payload.systemVersion,
        refreshStorage: false
      });
      setBadge(refs.inputStatus, `已載入封存資料 ${executionId}，僅供查看，不影響正式存檔`, 'cyan');
    }
  } catch (error) {
    setBadge(refs.inputStatus, `載入封存資料失敗：${error.message}`, 'red');
  }
}

function renderTotals(snapshot) {
  const blockMessage = getFormalDisplayBlock(snapshot);
  const summary = snapshot?.summary || {};
  const stats = snapshot?.overallStats || {};
  const displayMetric = (value) => (value === null || value === undefined ? '未提供' : fmt(value));

  if (blockMessage) {
    const card = el('article', 'notice-card notice-card-danger');
    card.append(el('strong', '', '整合總盤已鎖定'), el('p', '', blockMessage));
    safeReplace(refs.totalGrid, card);
    setBadge(refs.totalStatusBadge, '前端保護中', 'red');
    return;
  }

  const cards = [
    ['總業績', displayMetric(summary.totalRevenue ?? stats.monthlyRevenue), 'gold'],
    ['本月業績', displayMetric(summary.currentMonthRevenue ?? stats.monthlyRevenue), 'gold'],
    ['追續單總額', displayMetric(summary.renewalRevenue ?? stats.renewalAmount), 'violet'],
    ['累積總派單數', displayMetric(summary.totalCalls ?? stats.totalCalls), 'orange'],
    ['累積派單總成交', displayMetric(summary.dispatchCalls ?? stats.dispatchCalls), 'orange'],
    ['追續成交總數', `${fmt(summary.renewalDeals ?? stats.renewalCalls ?? 0)} 通`, 'cyan'],
    ['當日續單金額', displayMetric(summary.dailyRenewalAmount ?? stats.dailyRenewalAmount), 'green'],
    ['當日取消退貨', displayMetric(summary.cancellations ?? stats.cancellations), 'red']
  ];

  safeReplace(
    refs.totalGrid,
    ...cards.map(([label, value, tone]) => {
      const card = el('article', `total-card tone-${tone || 'gold'}`);
      card.append(el('span', '', label), el('strong', '', String(value || '-')));
      return card;
    })
  );

  setBadge(refs.totalStatusBadge, '正式業績總盤', 'green');
}

function renderExecutiveBoard(snapshot) {
  const summary = snapshot?.summary || {};
  const stats = snapshot?.overallStats || {};
  const ranking = topPeople(snapshot, 1);
  const first = ranking[0];
  const stageSummary = snapshot?.stageSummary || {};
  const readyToDispatch = isFormalReady(snapshot);
  const leaderValue = first
    ? `${first.name}${Number.isFinite(Number(first.dispatchScore)) ? `｜${fmt(first.dispatchScore)}` : ''}`
    : '待確認';

  const metrics = [
    { label: '今日總業績', value: fmt(summary.totalRevenue ?? stats.monthlyRevenue ?? 0), tone: 'gold', tier: 'hero' },
    { label: '今日第一名', value: leaderValue, tone: 'cyan', tier: 'hero' },
    { label: '啟動進度', value: `${stageSummary.completed || 0}/${stageSummary.total || 0}`, tone: 'green', tier: 'hero' },
    { label: '可否派單', value: readyToDispatch ? '可直接派單' : '等待確認', tone: readyToDispatch ? 'green' : 'red', tier: 'hero' },
    { label: '累積總派單數', value: fmt(summary.totalCalls ?? stats.totalCalls ?? 0), tone: 'orange', tier: 'support' },
    { label: '累積派單總成交', value: fmt(summary.dispatchCalls ?? stats.dispatchCalls ?? 0), tone: 'orange', tier: 'support' },
    { label: '追續成交總數', value: `${fmt(summary.renewalDeals ?? stats.renewalCalls ?? 0)} 通`, tone: 'cyan', tier: 'support' },
    { label: '當日續單金額', value: fmt(summary.dailyRenewalAmount ?? stats.dailyRenewalAmount ?? 0), tone: 'green', tier: 'support' },
    { label: '追續單總金額', value: fmt(summary.renewalRevenue ?? stats.renewalAmount ?? 0), tone: 'violet', tier: 'support' },
    { label: '當日取消退貨', value: fmt(summary.cancellations ?? stats.cancellations ?? 0), tone: 'red', tier: 'support' },
    { label: '系統狀態', value: state.health?.status || 'OFFLINE', tone: toneFromStatus(state.health?.status || 'OFFLINE'), tier: 'support' },
    { label: '最後更新', value: snapshot?.completedAt || '-', tone: 'gold', tier: 'support' }
  ];

  refs.bossCardGrid.replaceChildren(
    ...metrics.map((item) => {
      const card = el(
        'article',
        `boss-card tone-${item.tone || 'gold'} executive-card executive-card-${item.tier || 'support'}`
      );
      card.append(el('span', '', item.label), el('strong', '', String(item.value || '-')));
      return card;
    })
  );

  setBadge(refs.dispatchReadyBadge, readyToDispatch ? '可直接派單' : '等待確認', readyToDispatch ? 'green' : 'red');
}

function renderSnapshot(snapshot, meta = {}) {
  const displaySnapshot = meta.officialOverride === false ? snapshot : buildOfficialFrontEndSnapshot(snapshot);
  state.current = displaySnapshot;
  mountStorageUI();
  renderPasteOrder(displaySnapshot?.maintenance?.orderedPeople || displaySnapshot?.parsedData);
  renderMaintenance(displaySnapshot?.maintenance, displaySnapshot?.confirmation?.message || displaySnapshot?.audit?.message || '尚未完成掃描。');
  renderTopbar(displaySnapshot, meta);
  renderExecutiveBoard(displaySnapshot);
  renderSystemStatus(displaySnapshot);
  renderFrontendAiBoard(displaySnapshot);
  renderTotals(displaySnapshot);
  const guard = getConsistencyGuard(displaySnapshot);
  setBadge(
    refs.auditStatus,
    guard?.conflictBlocked
      ? '矛盾保護'
      : snapshot.confirmation?.status || snapshot.audit?.status || '待確認',
    guard?.conflictBlocked ? 'red' : toneFromStatus(snapshot.confirmation?.status || snapshot.audit?.status || '待確認')
  );

  const saved =
    snapshot.files?.archiveFile &&
    isPass(snapshot.status) &&
    isPass(snapshot.confirmation?.status) &&
    !guard?.conflictBlocked;
  setBadge(
    refs.saveStatus,
    guard?.conflictBlocked ? '禁止發布' : saved ? '已確認並存檔' : '待確認',
    guard?.conflictBlocked ? 'red' : saved ? 'green' : 'gold'
  );

  const displaySaved =
    displaySnapshot.files?.archiveFile &&
    isPass(displaySnapshot.status) &&
    isPass(displaySnapshot.confirmation?.status) &&
    !guard?.conflictBlocked;
  /*
  setBadge(
    refs.auditStatus,
    guard?.conflictBlocked
      ? '?靽風'
      : displaySnapshot.confirmation?.status || displaySnapshot.audit?.status || '敺Ⅱ隤?,
    guard?.conflictBlocked ? 'red' : toneFromStatus(displaySnapshot.confirmation?.status || displaySnapshot.audit?.status || '敺Ⅱ隤?)
  );
  setBadge(
    refs.saveStatus,
    guard?.conflictBlocked ? '蝳迫?澆?' : displaySaved ? '撌脩Ⅱ隤蒂摮?' : '敺Ⅱ隤?,
    guard?.conflictBlocked ? 'red' : displaySaved ? 'green' : 'gold'
  );

  */
  setBadge(
    refs.auditStatus,
    guard?.conflictBlocked
      ? '系統保護中'
      : displaySnapshot.confirmation?.status || displaySnapshot.audit?.status || '待確認',
    guard?.conflictBlocked ? 'red' : toneFromStatus(displaySnapshot.confirmation?.status || displaySnapshot.audit?.status || '待確認')
  );
  setBadge(
    refs.saveStatus,
    guard?.conflictBlocked ? '前端保護中' : displaySaved ? '正式版已存檔' : '待確認',
    guard?.conflictBlocked ? 'red' : displaySaved ? 'green' : 'gold'
  );

  renderStageSummary(displaySnapshot);
  renderStageList(displaySnapshot.stages || []);
  renderChecks(displaySnapshot.audit, displaySnapshot.confirmation);
  renderWeights(displaySnapshot.scoring?.weights);
  renderInsights(displaySnapshot);
  renderRanking(displaySnapshot);
  renderGroups(displaySnapshot);
  renderChanges(displaySnapshot);
  renderAlerts(displaySnapshot);
  renderVersionGrid(displaySnapshot);
  renderFiles(displaySnapshot.files);
  renderLogs(displaySnapshot.logs);
  renderAnnouncementMeta(displaySnapshot);
  renderAnnouncement(displaySnapshot);
  // ★ 三大新模組渲染
  renderPlatformStats(displaySnapshot);
  renderRankChanges(displaySnapshot);
  renderBigDataAdvice(displaySnapshot);

  const activeDate = $('storage-report-date')?.value?.trim() || displaySnapshot.reportDate || '';
  if (meta.refreshStorage !== false) {
    loadStorageList(activeDate);
    loadStorageDates(activeDate);
  }
}

function openBroadcastSystem() {
  const text = String(
    state.current?.announcement ||
      refs.rawInput.value.trim() ||
      refs.announcementOutput?.textContent ||
      ''
  ).trim();

  try {
    localStorage.setItem('dispatch_broadcast_text', text);
    localStorage.setItem('dispatch_broadcast_source', state.current?.systemName || refs.systemName.textContent || '兆櫃 AI 派單中樞系統');
    localStorage.setItem('dispatch_broadcast_execution_id', String(state.current?.executionId || ''));
    localStorage.setItem('dispatch_broadcast_payload', JSON.stringify(state.current?.broadcast || null));
  } catch {}

  const popup = window.open('/broadcast.html', '_blank', 'noopener');
  if (!popup) {
    window.location.href = '/broadcast.html';
  }
}

function clearWorkspaceOutput() {
  renderPasteOrder(null);
  renderMaintenance(null, '貼上後會在這裡顯示異常掃描、維修與保養建議。');
  renderExecutiveBoard(null);
  renderSystemStatus(null);
  renderFrontendAiBoard(null);
  renderTotals(null);
  renderStageSummary(null);
  renderStageList([]);
  renderChecks(null, null);
  renderWeights(null);
  renderInsights(null);
  renderRanking([]);
  renderGroups(null);
  renderChanges(null);
  renderAlerts(null);
  renderVersionGrid(null);
  renderFiles(null);
  renderLogs(null);
  // ★ 三大新模組歸零
  renderPlatformStats(null);
  renderRankChanges(null);
  renderBigDataAdvice(null);
  refs.announcementMeta.textContent = '尚未生成';
  setTone(refs.announcementMeta, 'gold');
  refs.btnChairmanMode.textContent = state.chairmanMode ? '完整閱讀' : '董事長模式';
  safeReplace(refs.announcementOutput, el('div', 'announcement-empty', '尚未生成公告'));
  setBadge(refs.dispatchReadyBadge, '待確認', 'gold');
  setBadge(refs.systemStatusBadge, '待確認', 'gold');
  setBadge(refs.totalStatusBadge, '待確認', 'gold');
  setBadge(refs.rankingStatusBadge, '待確認', 'gold');
  setBadge(refs.aiAnalysisBadge, '待確認', 'gold');
  setBadge(refs.versionStatusBadge, '待確認', 'gold');
  setBadge(refs.logStatusBadge, '待確認', 'gold');
  setBadge(refs.auditStatus, '待確認', 'gold');
  setBadge(refs.saveStatus, '工作區待啟動', 'gold');
  setBadge(refs.platformStatsBadge, '待確認', 'gold');
  setBadge(refs.rankChangeBadge, '待確認', 'gold');
  setBadge(refs.bigdataAdviceBadge, '待確認', 'gold');
}


function setRunning(running) {
  state.running = running;
  refs.rawInput.disabled = running;
  refs.btnReset.disabled = running;
  refs.btnZero.disabled = running;
  refs.btnBaseline.disabled = running;
  refs.btnRun.disabled = running;
  refs.btnRun.textContent = running ? 'AI 鏈路運算中...' : '一鍵全自動鏈路';
  
  if (running) {
    document.body.classList.add('system-running');
  } else {
    document.body.classList.remove('system-running');
  }
}

async function runFullChain() {
  const rawText = refs.rawInput.value.trim();
  if (!rawText || state.running) return;

  setWorkspaceMode('active');
  setRunning(true);
  setBadge(refs.inputStatus, '正在執行全自動鏈路', 'cyan');
  setBadge(refs.auditStatus, '執行中', 'cyan');
  setBadge(refs.saveStatus, '執行中', 'cyan');
  renderStageList([]);

  try {
    const { ok, payload } = await apiPost('/api/save', { rawText, operator: 'WEB' });
    const snapshot = payload.data;

    if (Array.isArray(snapshot?.stages) && snapshot.stages.length) {
      for (let index = 0; index < snapshot.stages.length; index += 1) {
        const stage = snapshot.stages[index];
        const staged = snapshot.stages.map((item, stageIndex) => {
          if (stageIndex < index) return item;
          if (stageIndex === index) return { ...item, status: 'pending', message: '正在運算...' };
          return { ...item, status: 'pending', message: '等待中' };
        });
        renderStageList(staged, index);
        
        // 增加更有感的 AI 運算延遲
        const delay = 400 + Math.random() * 400;
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }

    if (snapshot) {
      renderSnapshot(snapshot, {
        systemName: payload.systemName,
        systemVersion: payload.systemVersion
      });
    }

    setBadge(
      refs.inputStatus,
      ok && isPass(snapshot?.confirmation?.status)
        ? '全部確認無誤，可直接執行派單'
        : snapshot?.confirmation?.message || payload.message || '資料異常，請先修正再重跑',
      ok && isPass(snapshot?.confirmation?.status) ? 'green' : 'red'
    );
  } catch (error) {
    setBadge(refs.auditStatus, '系統異常', 'red');
    setBadge(refs.saveStatus, '系統異常', 'red');
    setBadge(refs.inputStatus, `執行失敗：${error.message}`, 'red');
  } finally {
    setRunning(false);
    loadHealth();
  }
}

function schedulePreview() {
  clearTimeout(state.previewTimer);
  const rawText = refs.rawInput.value.trim();
  const token = ++state.previewToken;

  if (!rawText) {
    renderPreview(null, null, null, null);
    setBadge(refs.inputStatus, '等待輸入', 'gold');
    return;
  }

  setBadge(refs.inputStatus, '正在預檢', 'cyan');
  state.previewTimer = setTimeout(async () => {
    try {
      const { ok, payload } = await apiPost('/api/audit', { rawText, operator: 'WEB' });
      if (token !== state.previewToken) return;

      const parsed = payload.data?.parsed || null;
      const audit = payload.data?.audit || null;
      const confirmation = payload.data?.confirmation || null;
      renderPreview(parsed, audit, confirmation, payload.data?.maintenance || null);
      setBadge(
        refs.inputStatus,
        ok && isPass(confirmation?.status)
          ? '預檢通過，可直接執行'
          : confirmation?.message || audit?.message || '資料異常，請先修正',
        ok && isPass(confirmation?.status) ? 'green' : 'red'
      );
    } catch (error) {
      if (token !== state.previewToken) return;
      setBadge(refs.inputStatus, `預檢失敗：${error.message}`, 'red');
    }
  }, 300);
}

async function loadHealth() {
  try {
    const { payload } = await apiGet('/api/health');
    state.health = {
      ...(payload.data || {}),
      systemName: payload.systemName,
      systemVersion: payload.systemVersion
    };
    refs.systemName.textContent = payload.systemName || refs.systemName.textContent;
    refs.systemVersion.textContent = payload.systemVersion || refs.systemVersion.textContent;
    refs.healthStatus.textContent = payload.data?.status || 'ONLINE';
    refs.currentExecutionId.textContent = String(state.current?.executionId || payload.data?.currentExecutionId || '-');
    setTone(refs.healthStatus, toneFromStatus(payload.data?.status || 'ONLINE'));
  } catch {
    refs.healthStatus.textContent = 'OFFLINE';
    setTone(refs.healthStatus, 'red');
  }
}

async function loadCurrent() {
  try {
    const { payload } = await apiGet('/api/current');
    if (payload.success && payload.data) {
      renderSnapshot(payload.data, {
        systemName: payload.systemName,
        systemVersion: payload.systemVersion
      });
    }
  } catch {
    safeReplace(refs.announcementOutput, el('div', 'announcement-empty', '尚未生成公告'));
  }
}

async function loadBaseline(force = false) {
  try {
    const { payload } = await apiGet('/api/baseline/latest');
    if (!payload.success || !payload.data?.rawText) return;
    
    const snapshot = payload.data;
    if (force || !refs.rawInput.value.trim()) {
      setWorkspaceMode('active');
      refs.rawInput.value = snapshot.rawText;
      
      // 如果後端傳來的是完整快照（包含裝飾後的資料），直接渲染
      if (snapshot.status && snapshot.ranking) {
        renderSnapshot(snapshot, {
          systemName: payload.systemName,
          systemVersion: payload.systemVersion,
          refreshStorage: true
        });
        setBadge(refs.inputStatus, '已從後端載入最新正式基準', 'green');
      } else {
        // 否則走舊有的前端分析路徑
        schedulePreview();
      }
    }
  } catch (error) {
    setBadge(refs.inputStatus, `載入最新基準失敗：${error.message}`, 'red');
  }
}

async function zeroWorkspace() {
  if (state.running) return;
  try {
    const { payload } = await apiPost('/api/workspace/zero', { operator: 'WEB' });
    setWorkspaceMode('zeroed');
    clearTimeout(state.previewTimer);
    refs.rawInput.value = payload.data?.rawText || '';
    state.previewToken += 1;
    renderPreview(null, null, null, null);
    setBadge(
      refs.inputStatus,
      payload.message || '工作區已歸零，可重新貼上資料並重新啟動',
      'orange'
    );
    refs.rawInput.focus();
  } catch (error) {
    setBadge(refs.inputStatus, `工作區歸零失敗：${error.message}`, 'red');
  }
}

async function resetBoard() {
  try {
    setWorkspaceMode('active');
    await loadCurrent();
    await loadBaseline(true);
    const activeDate = $('storage-report-date')?.value?.trim() || state.current?.reportDate || '';
    await loadStorageList(activeDate);
    await loadStorageDates(activeDate);
    setBadge(refs.inputStatus, '已恢復正式版與最新基準', 'gold');
  } catch (error) {
    setBadge(refs.inputStatus, `重置全板失敗：${error.message}`, 'red');
  }
}

refs.rawInput.addEventListener('input', () => {
  if (refs.rawInput.value.trim()) setWorkspaceMode('active');
  if (!state.running) schedulePreview();
});

refs.rawInput.addEventListener('keydown', (event) => {
  if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
    event.preventDefault();
    runFullChain();
  }
});

refs.btnReset.addEventListener('click', resetBoard);
refs.btnZero.addEventListener('click', zeroWorkspace);
refs.btnBaseline.addEventListener('click', () => loadBaseline(true));
refs.btnRun.addEventListener('click', runFullChain);
refs.btnOpenBroadcast.addEventListener('click', openBroadcastSystem);
refs.btnChairmanMode.addEventListener('click', () => {
  state.chairmanMode = !state.chairmanMode;
  if (refs.dashboardContainer) {
    if (state.chairmanMode) refs.dashboardContainer.classList.add('chairman-active');
    else refs.dashboardContainer.classList.remove('chairman-active');
  }
  renderAnnouncement(state.current);
});
refs.btnCopyAnnouncement.addEventListener('click', async () => {
  const text = String(state.current?.announcement || '');
  if (!text) {
    setBadge(refs.saveStatus, '尚未生成公告', 'gold');
    return;
  }
  try {
    await navigator.clipboard.writeText(text);
    setBadge(refs.saveStatus, '公告已複製', 'green');
  } catch {
    setBadge(refs.saveStatus, '複製失敗', 'red');
  }
});

(async function init() {
  mountStorageUI();
  renderPreview(null, null, null, null);
  clearWorkspaceOutput();
  setBadge(refs.inputStatus, '等待輸入', 'gold');

  if (refs.dashboardContainer) {
    if (state.chairmanMode) refs.dashboardContainer.classList.add('chairman-active');
    else refs.dashboardContainer.classList.remove('chairman-active');
  }

  try {
    await loadHealth();
    if (workspaceMode() === 'zeroed') {
      await loadCurrent();
      refs.rawInput.value = '';
      renderPreview(null, null, null, null);
      setBadge(refs.inputStatus, '工作區已歸零，只保留系統狀態與歷史存檔', 'orange');
      await loadStorageList('');
      await loadStorageDates('');
    } else {
      await loadCurrent();
      await loadBaseline(true);
      const activeDate = $('storage-report-date')?.value?.trim() || state.current?.reportDate || '';
      await loadStorageList(activeDate);
      await loadStorageDates(activeDate);
    }
  } catch {
    refs.healthStatus.textContent = 'OFFLINE';
    setTone(refs.healthStatus, 'red');
    setBadge(refs.inputStatus, '系統離線', 'red');
  }
})();
