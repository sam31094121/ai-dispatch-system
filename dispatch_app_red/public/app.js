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
  alertList: $('alert-list')
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
  chairmanMode: true
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
}

function setBadge(node, text, tone = 'gold') {
  node.textContent = text;
  setTone(node, tone);
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

function isAiConnected(snapshot) {
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

function getAiProof(snapshot) {
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

function previousConfirmedItem(currentExecutionId) {
  return (state.storageItems || []).find(
    (item) =>
      String(item.executionId || '') !== String(currentExecutionId || '') &&
      isPass(item.confirmationStatus || item.status)
  ) || null;
}

function renderExecutiveBoard(snapshot) {
  const summary = snapshot?.summary || {};
  const ranking = topPeople(snapshot, 1);
  const first = ranking[0];
  const stageSummary = snapshot?.stageSummary || {};
  const metrics = [
    ['系統狀態', state.health?.status || 'ONLINE', toneFromStatus(state.health?.status || 'ONLINE')],
    ['今日總業績', fmt(summary.totalRevenue), 'gold'],
    ['今日第一名', first ? first.name : '尚未產生', 'cyan'],
    ['今日追續總數', `${fmt(summary.renewalDeals)} 通`, 'cyan'],
    ['今日續單總額', fmt(summary.renewalRevenue), 'violet'],
    ['功能完成度', `${stageSummary.completed || 0}/${stageSummary.total || 0}`, 'green'],
    ['目前正式版本', snapshot?.systemVersion || '-', 'orange'],
    ['最後更新時間', snapshot?.completedAt || '-', 'gold']
  ];

  refs.bossCardGrid.replaceChildren(
    ...metrics.map(([label, value, tone]) => {
      const card = el('article', `boss-card tone-${tone || 'gold'} executive-card`);
      card.append(el('span', '', label), el('strong', '', String(value || '-')));
      return card;
      })
    );

  setBadge(refs.dispatchReadyBadge, isFormalReady(snapshot) ? '可直接執行派單' : '結果保護中', isFormalReady(snapshot) ? 'green' : 'red');
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

  refs.systemStatusGrid.replaceChildren(
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
  if (blockMessage) {
    const card = el('article', 'notice-card notice-card-danger');
    card.append(el('strong', '', '整合總盤已鎖住'), el('p', '', blockMessage));
    refs.totalGrid.replaceChildren(card);
    setBadge(refs.totalStatusBadge, '禁止顯示正式總盤', 'red');
    return;
  }

  const cards = [
    ['今日總業績', fmt(summary.totalRevenue), 'gold'],
    ['本月業績', fmt(summary.currentMonthRevenue), 'gold'],
    ['續單總額', fmt(summary.renewalRevenue), 'violet'],
    ['追續成交總數', `${fmt(summary.renewalDeals)} 通`, 'cyan'],
    ['當日客單價', fmt(summary.averageDailyTicket), 'green'],
    ['整體客單價', fmt(summary.averageOverallTicket), 'orange']
  ];

  refs.totalGrid.replaceChildren(
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

  refs.stageSummary.replaceChildren(
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
  if (!alerts.length) {
    alerts.push({ tone: 'green', text: '目前沒有異常，前後端版本、狀態、公告、排名一致。' });
  }

  refs.alertList.replaceChildren(
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

  refs.versionGrid.replaceChildren(
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
  if (hasVersionMismatch(snapshot)) {
    refs.titleSummary.textContent = `版本不一致：health=${state.health?.systemVersion || '-'}｜current=${snapshot?.systemVersion || '-'}，禁止顯示正式結果。`;
  } else if (guard?.conflictBlocked) {
    refs.titleSummary.textContent = `矛盾保護已啟動：目前偵測 ${guard.contradictionCount} 項衝突，前端禁止自行改算，必須以後端快照為準。`;
  } else if (aiConnected) {
    refs.titleSummary.textContent = 'AI 已接入：後端負責審計、1000 權重計分、排序、分組、公告；前端只顯示同一份結果。';
  } else {
    refs.titleSummary.textContent = 'AI 未接入：目前尚未同時滿足審計、確認、排名、分析卡與公告條件。';
  }
  refs.titleProof.replaceChildren(
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

function renderPreview(parsed, audit, confirmation) {
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

  refs.inputPreviewGrid.replaceChildren(
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

  refs.stageList.replaceChildren(
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

  refs.auditCheckList.replaceChildren(
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

  refs.weightList.replaceChildren(
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

  refs.insightList.replaceChildren(...nodes);
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
    refs.rankingList.replaceChildren(card);
    setBadge(refs.rankingStatusBadge, '禁止顯示正式排名', 'red');
    return;
  }

  refs.rankingList.replaceChildren(
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
          metrics.append(
            el('span', '', `AI ${fmtScore(person.totalScore)}`),
            el('span', '', `總業績 ${fmt(person.totalRevenue)}`),
            el('span', '', `續單 ${fmt(person.renewalRevenue)}`),
            el('span', '', `追續 ${fmt(person.renewalDeals)}`)
          );

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
    refs.groupList.replaceChildren(row);
    return;
  }

  const safe = snapshotOrGroups?.groups || snapshotOrGroups || { A1: [], A2: [], B: [], C: [] };
  refs.groupList.replaceChildren(
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
    !Array.isArray(snapshotOrChanges?.flat)
      ? getFormalDisplayBlock(snapshotOrChanges)
      : '';

  if (blockMessage) {
    const row = el('article', 'change-row');
    row.append(el('strong', '', '名次異動'), el('div', '', blockMessage));
    refs.changeList.replaceChildren(row);
    return;
  }

  const safe = snapshotOrChanges?.changes || snapshotOrChanges || { up: [], down: [], flat: [] };
  const sections = [
    ['上升', safe.up || []],
    ['下降', safe.down || []],
    ['持平', safe.flat || []]
  ];
  refs.changeList.replaceChildren(
    ...sections.map(([label, values]) => {
      const row = el('article', 'change-row');
      row.append(el('strong', '', label), el('div', '', values.length ? values.join('、') : '無'));
      return row;
    })
  );
}

function renderBoss(snapshot) {
  renderExecutiveBoard(snapshot);
}

function renderFiles(files) {
  const rows = [];
  if (files?.reportFile) rows.push(['正式快照', files.reportFile]);
  if (files?.backupFile) rows.push(['備份檔', files.backupFile]);
  if (files?.archiveFile) rows.push(['每日封存', files.archiveFile]);

  refs.fileList.replaceChildren(
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
    refs.announcementOutput.replaceChildren(el('div', 'announcement-empty', '尚未生成公告'));
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
  target.replaceChildren(
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

  target.replaceChildren(
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

function renderSnapshot(snapshot, meta = {}) {
  state.current = snapshot;
  mountStorageUI();
  renderTopbar(snapshot, meta);
  renderExecutiveBoard(snapshot);
  renderSystemStatus(snapshot);
  renderTotals(snapshot);
  const guard = getConsistencyGuard(snapshot);
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

  renderStageSummary(snapshot);
  renderStageList(snapshot.stages || []);
  renderChecks(snapshot.audit, snapshot.confirmation);
  renderWeights(snapshot.scoring?.weights);
  renderInsights(snapshot);
  renderRanking(snapshot);
  renderGroups(snapshot);
  renderChanges(snapshot);
  renderAlerts(snapshot);
  renderVersionGrid(snapshot);
  renderFiles(snapshot.files);
  renderLogs(snapshot.logs);
  renderAnnouncementMeta(snapshot);
  renderAnnouncement(snapshot);

  const activeDate = $('storage-report-date')?.value?.trim() || snapshot.reportDate || '';
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
  renderExecutiveBoard(null);
  renderSystemStatus(null);
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
  refs.announcementMeta.textContent = '尚未生成';
  setTone(refs.announcementMeta, 'gold');
  refs.btnChairmanMode.textContent = state.chairmanMode ? '完整閱讀' : '董事長模式';
  refs.announcementOutput.replaceChildren(el('div', 'announcement-empty', '尚未生成公告'));
  setBadge(refs.dispatchReadyBadge, '待確認', 'gold');
  setBadge(refs.systemStatusBadge, '待確認', 'gold');
  setBadge(refs.totalStatusBadge, '待確認', 'gold');
  setBadge(refs.rankingStatusBadge, '待確認', 'gold');
  setBadge(refs.aiAnalysisBadge, '待確認', 'gold');
  setBadge(refs.versionStatusBadge, '待確認', 'gold');
  setBadge(refs.logStatusBadge, '待確認', 'gold');
  setBadge(refs.auditStatus, '待確認', 'gold');
  setBadge(refs.saveStatus, '工作區待啟動', 'gold');
}

function setRunning(running) {
  state.running = running;
  refs.rawInput.disabled = running;
  refs.btnReset.disabled = running;
  refs.btnZero.disabled = running;
  refs.btnBaseline.disabled = running;
  refs.btnRun.disabled = running;
  refs.btnRun.textContent = running ? '自動鏈路執行中' : '一鍵全自動鏈路';
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
        const staged = snapshot.stages.map((item, stageIndex) => {
          if (stageIndex < index) return item;
          if (stageIndex === index) return { ...item, status: 'pending', message: '執行中' };
          return { ...item, status: 'pending', message: '待命' };
        });
        renderStageList(staged, index);
        await new Promise((resolve) => setTimeout(resolve, 100));
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
    renderPreview(null, null, null);
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
      renderPreview(parsed, audit, confirmation);
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
    refs.announcementOutput.replaceChildren(el('div', 'announcement-empty', '尚未生成公告'));
  }
}

async function loadBaseline(force = false) {
  try {
    const { payload } = await apiGet('/api/baseline/latest');
    if (!payload.success || !payload.data?.rawText) return;
    if (force || !refs.rawInput.value.trim()) {
      setWorkspaceMode('active');
      refs.rawInput.value = payload.data.rawText;
      schedulePreview();
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
    renderPreview(null, null, null);
    clearWorkspaceOutput();
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
  renderPreview(null, null, null);
  clearWorkspaceOutput();
  setBadge(refs.inputStatus, '等待輸入', 'gold');

  try {
    await loadHealth();
    if (workspaceMode() === 'zeroed') {
      await loadCurrent();
      refs.rawInput.value = '';
      clearWorkspaceOutput();
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
