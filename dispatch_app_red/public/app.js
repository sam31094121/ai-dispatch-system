const numberFormatter = new Intl.NumberFormat('zh-TW');
const $ = (id) => document.getElementById(id);

const refs = {
  healthStatus: $('health-status'),
  executionId: $('execution-id'),
  persistStatus: $('persist-status'),
  inputStatus: $('input-status'),
  rawInput: $('raw-input'),
  btnLoad: $('btn-load'),
  btnAudit: $('btn-audit'),
  btnSave: $('btn-save'),
  btnClear: $('btn-clear'),
  btnCopyCompact: $('btn-copy-compact'),
  rulesList: $('rules-list'),
  auditResultBadge: $('audit-result-badge'),
  validationSummary: $('validation-summary'),
  validationIssues: $('validation-issues'),
  announcementTitle: $('announcement-title'),
  dateRange: $('date-range'),
  auditResult: $('audit-result'),
  cancellationChip: $('cancellation-chip'),
  summaryGrid: $('summary-grid'),
  spotlightGrid: $('spotlight-grid'),
  leaderboard: $('leaderboard'),
  groupsGrid: $('groups-grid'),
  retiredList: $('retired-list'),
  rankingTableBody: $('ranking-table-body'),
  adviceList: $('adviceList'),
  compactOutput: $('compact-output'),
  pageSubtitle: $('page-subtitle')
};

refs.adviceList = $('advice-list');

const LOCKED_RULES = [
  '後端唯一真實來源。',
  '前端只做顯示，不做運算。',
  '排序固定：總業績 → 續單金額 → 追續成交總數 → 派單成交總通數。',
  '已離職只列審計，不入正式派單。',
  'A1 / A2 / B / C 必須與正式名次完全一致。',
  '姓名必須完全正確，尤其禁止錯寫「徐華妤」。',
  '群組精簡版、排行榜、分組卡、建議卡只能來自同一份後端資料。'
];

const state = {
  current: null
};

function fmt(value) {
  return numberFormatter.format(Number(value || 0));
}

function countUp(el, target, duration = 800) {
  const numTarget = Number(target || 0);
  if (!numTarget) { el.textContent = numberFormatter.format(0); return; }
  const t0 = performance.now();
  
  function tick(now) {
    const p = Math.min((now - t0) / duration, 1);
    // Quintic out easing for a much smoother feel
    const ease = 1 - Math.pow(1 - p, 5);
    el.textContent = numberFormatter.format(Math.round(numTarget * ease));
    if (p < 1) requestAnimationFrame(tick);
    else el.textContent = numberFormatter.format(numTarget);
  }
  requestAnimationFrame(tick);
}

function badgeClass(status) {
  if (status === 'PASS') return 'badge badge-pass';
  if (status === 'FAIL') return 'badge badge-fail';
  return 'badge badge-neutral';
}

function setBadge(node, status, text = status) {
  node.className = badgeClass(status);
  node.textContent = text;
}

function safeHtml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

async function request(url, options = {}) {
  const response = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    ...options
  });

  const payload = await response.json().catch(() => ({
    success: false,
    message: '伺服器回應格式錯誤',
    data: null
  }));

  return {
    ok: response.ok && payload.success !== false,
    status: response.status,
    payload
  };
}

function renderRules() {
  refs.rulesList.replaceChildren(
    ...LOCKED_RULES.map((rule) => {
      const item = document.createElement('li');
      item.textContent = rule;
      return item;
    })
  );
}

function renderValidation(snapshot) {
  const validation = snapshot?.validation || {};
  const summary = validation.summary || {};
  setBadge(refs.auditResultBadge, validation.status || 'PENDING', validation.status || '待檢查');

  refs.validationSummary.innerHTML = `
    <div class="metric-stack">
      <div class="metric-chip">
        <span>審計結果</span>
        <strong>${safeHtml(summary.審計結果 || validation.status || '-')}</strong>
      </div>
      <div class="metric-chip">
        <span>正式人數</span>
        <strong>${safeHtml(String(summary.正式人數 ?? '-'))}</strong>
      </div>
      <div class="metric-chip">
        <span>離職列示</span>
        <strong>${safeHtml(String(summary.離職列示人數 ?? '-'))}</strong>
      </div>
      <div class="metric-chip">
        <span>本月業績</span>
        <strong>${safeHtml(fmt(summary.本月業績 || 0))}</strong>
      </div>
    </div>
  `;

  const issues = [
    ...(validation.errors || []).map((text) => ({ tone: 'fail', text })),
    ...(validation.warnings || []).map((text) => ({ tone: 'warn', text }))
  ];

  refs.validationIssues.replaceChildren(
    ...(issues.length
      ? issues.map((item) => {
          const row = document.createElement('div');
          row.className = `issue-row ${item.tone}`;
          row.textContent = item.text;
          return row;
        })
      : [Object.assign(document.createElement('div'), {
          className: 'issue-row pass',
          textContent: '後端審計通過，未發現矛盾。'
        })])
  );
}

function renderHero(data, snapshot) {
  const result = data?.審計結論?.結果 || 'FAIL';
  const dates = data?.日期資訊 || {};

  refs.announcementTitle.textContent = data?.公告標題 || '尚未載入公告';
  refs.dateRange.textContent = `${dates.結算日 || '-'} 結算 → ${dates.派單日 || '-'} 正式派單`;
  refs.auditResult.textContent = result;
  refs.auditResult.className = `audit-hero ${result === 'PASS' ? 'audit-pass' : 'audit-fail'}`;
  refs.cancellationChip.textContent = `取消退貨 ${fmt(data?.整合總盤?.當日取消退貨 || 0)}`;

  refs.healthStatus.textContent = 'ONLINE';
  refs.executionId.textContent = snapshot?.executionId || '-';
  refs.persistStatus.textContent = snapshot?.persisted ? '正式版' : '預覽中';
  refs.pageSubtitle.textContent = snapshot?.persisted
    ? `目前展示的是後端正式版資料，完成時間 ${snapshot.completedAt || '-'}。`
    : '目前展示的是預覽結果，尚未寫入正式版。';
}

function renderSummaryCards(cards) {
  const items = cards.map(([label, value]) => {
    const card = document.createElement('article');
    card.className = 'summary-card';
    const span = document.createElement('span');
    span.textContent = label;
    const strong = document.createElement('strong');
    strong.textContent = '0';
    card.append(span, strong);
    return { card, value, strong };
  });
  refs.summaryGrid.replaceChildren(...items.map(i => i.card));
  items.forEach(({ strong, value }) => countUp(strong, value, 800));
}

function renderSpotlight(rows) {
  refs.spotlightGrid.replaceChildren(
    ...rows.map((row, index) => {
      const card = document.createElement('article');
      card.className = `spotlight-card rank-${index + 1} group-${row.分級}`;
      card.innerHTML = `
        <div class="spotlight-meta">
          <span class="rank-no">#${safeHtml(String(row.名次))}</span>
          <span class="group-tag">${safeHtml(row.分級)}</span>
        </div>
        <h3>${safeHtml(row.姓名)}</h3>
        ${row.標記 ? `<span class="newbie-tag">${safeHtml(row.標記)}</span>` : ''}
        <div class="spotlight-grid-inner">
          <div><span>總業績</span><strong>${safeHtml(fmt(row.總業績))}</strong></div>
          <div><span>續單金額</span><strong>${safeHtml(fmt(row.續單金額))}</strong></div>
          <div><span>追續成交</span><strong>${safeHtml(fmt(row.追續成交總數))}</strong></div>
          <div><span>派單成交</span><strong>${safeHtml(fmt(row.派單成交總通數))}</strong></div>
        </div>
      `;
      return card;
    })
  );
}

function renderLeaderboard(rows) {
  refs.leaderboard.replaceChildren(
    ...rows.map((row) => {
      const item = document.createElement('article');
      item.className = `leader-row group-${row.分級}`;
      item.innerHTML = `
        <div class="leader-left">
          <strong>#${safeHtml(String(row.名次))}</strong>
          <div>
            <p>${safeHtml(row.姓名)}</p>
            <span>${safeHtml(row.分級)}${row.標記 ? `・${safeHtml(row.標記)}` : ''}</span>
          </div>
        </div>
        <div class="leader-right">
          <span>總業績</span>
          <strong>${safeHtml(fmt(row.總業績))}</strong>
        </div>
      `;
      return item;
    })
  );
}

const GROUP_META = {
  A1: { emoji: '🔴', label: 'A1 高單主力' },
  A2: { emoji: '🟠', label: 'A2 續單收割' },
  B:  { emoji: '🟡', label: 'B 組 一般量單' },
  C:  { emoji: '🟢', label: 'C 組 補位觀察' }
};

function renderGroups(groups, rankMap = {}) {
  const order = ['A1', 'A2', 'B', 'C'];
  refs.groupsGrid.replaceChildren(
    ...order.map((groupKey) => {
      const names = Array.isArray(groups?.[groupKey]) ? groups[groupKey] : [];
      const meta = GROUP_META[groupKey];
      const card = document.createElement('article');
      card.className = `group-card group-${groupKey}`;
      const membersHtml = names.length
        ? names.map(name => {
            const rank = rankMap[name];
            const rankStr = rank ? `<span class="member-rank">#${safeHtml(String(rank))}</span>` : '';
            return `<span class="member-chip">${rankStr}<span class="member-name">${safeHtml(name)}</span></span>`;
          }).join('')
        : '<span class="member-empty">尚無資料</span>';
      card.innerHTML = `
        <div class="group-head">
          <strong>${safeHtml(meta.emoji + '\u00a0' + meta.label)}</strong>
          <span>${safeHtml(String(names.length))} 人</span>
        </div>
        <div class="group-members">${membersHtml}</div>
      `;
      return card;
    })
  );
}

function renderRetired(retired) {
  refs.retiredList.replaceChildren(
    ...(retired.length
      ? retired.map((entry) => {
          const row = document.createElement('article');
          row.className = 'retired-row';
          row.innerHTML = `
            <strong>${safeHtml(entry.姓名)}</strong>
            <span>${safeHtml(entry.原因 || '已離職')}</span>
          `;
          return row;
        })
      : [Object.assign(document.createElement('div'), {
          className: 'retired-empty',
          textContent: '本輪沒有離職列示。'
        })])
  );
}

function renderRankingTable(rows) {
  refs.rankingTableBody.innerHTML = rows.map((row) => `
    <tr class="row-${safeHtml(row.分級)}">
      <td>${safeHtml(String(row.名次))}</td>
      <td>
        <div class="table-name">
          <span>${safeHtml(row.姓名)}</span>
          ${row.標記 ? `<span class="newbie-tag">${safeHtml(row.標記)}</span>` : ''}
        </div>
      </td>
      <td>${safeHtml(row.分級)}</td>
      <td>${safeHtml(fmt(row.總業績))}</td>
      <td>${safeHtml(fmt(row.續單金額))}</td>
      <td>${safeHtml(fmt(row.追續成交總數))}</td>
      <td>${safeHtml(fmt(row.派單成交總通數))}</td>
    </tr>
  `).join('');
}

function renderAdvice(rows) {
  refs.adviceList.replaceChildren(
    ...rows.map((row, index) => {
      const detail = document.createElement('details');
      detail.className = `advice-card group-${row.分級}`;
      if (index < 4) detail.open = true;
      detail.innerHTML = `
        <summary>
          <span>#${safeHtml(String(row.名次))} ${safeHtml(row.姓名)}</span>
          <span>${safeHtml(row.分級)}</span>
        </summary>
        <p>${safeHtml(row.建議)}</p>
      `;
      return detail;
    })
  );
}

function render(snapshot) {
  state.current = snapshot;
  const data = snapshot?.standardData || {};
  const presentation = snapshot?.presentation || {};
  const retired = presentation.retired || data?.審計結論?.['審計列示不入派單'] || [];

  renderValidation(snapshot);
  renderHero(data, snapshot);
  renderSummaryCards(presentation.summaryCards || []);
  renderSpotlight(presentation.top4 || []);
  renderLeaderboard(presentation.top10 || []);
  const rankMap = {};
  (data?.正式名次 || []).forEach(row => { if (row?.姓名) rankMap[row.姓名] = row.名次; });
  renderGroups(data?.分級 || {}, rankMap);
  renderRetired(retired);
  renderRankingTable(data?.正式名次 || []);
  renderAdvice(data?.正式名次 || []);
  refs.compactOutput.value = data?.群組超精簡版 || '';
}

async function loadCurrent() {
  setBadge(refs.inputStatus, 'PENDING', '載入正式版中');
  const { ok, payload } = await request('/api/current');
  if (!ok) {
    setBadge(refs.inputStatus, 'FAIL', payload.message || '載入失敗');
    return;
  }

  const snapshot = payload.data;
  refs.rawInput.value = snapshot?.rawText || '';
  render(snapshot);
  setBadge(refs.inputStatus, 'PASS', '已載入正式版');
}

async function auditCurrentInput() {
  setBadge(refs.inputStatus, 'PENDING', '後端審計中');
  const { ok, payload } = await request('/api/audit', {
    method: 'POST',
    body: JSON.stringify({ rawText: refs.rawInput.value })
  });

  if (!payload.data) {
    setBadge(refs.inputStatus, 'FAIL', payload.message || '審計失敗');
    return;
  }

  render(payload.data);
  setBadge(refs.inputStatus, ok ? 'PASS' : 'FAIL', payload.message || (ok ? '審計通過' : '審計失敗'));
}

async function saveCurrentInput() {
  setBadge(refs.inputStatus, 'PENDING', '存檔中');
  const { ok, payload } = await request('/api/save', {
    method: 'POST',
    body: JSON.stringify({ rawText: refs.rawInput.value })
  });

  if (!payload.data) {
    setBadge(refs.inputStatus, 'FAIL', payload.message || '存檔失敗');
    return;
  }

  render(payload.data);
  setBadge(refs.inputStatus, ok ? 'PASS' : 'FAIL', payload.message || (ok ? '正式版已存檔' : '驗證未通過'));
}

async function copyCompactText() {
  const text = refs.compactOutput.value.trim();
  if (!text) {
    setBadge(refs.inputStatus, 'FAIL', '目前沒有可複製的群組精簡版');
    return;
  }

  await navigator.clipboard.writeText(text);
  setBadge(refs.inputStatus, 'PASS', '群組精簡版已複製');
}

function clearInputOnly() {
  refs.rawInput.value = '';
  setBadge(refs.inputStatus, 'PENDING', '輸入區已清空');
}

async function init() {
  console.log("%c Zhaogui AI System %c Optimized Entry Sequence Activated ", "background: #00F2FF; color: #000; font-weight: bold; border-radius: 3px 0 0 3px; padding: 2px 4px;", "background: #111; color: #00F2FF; border-radius: 0 3px 3px 0; padding: 2px 4px; border: 1px solid #00F2FF;");
  renderRules();
  await loadCurrent();
}

refs.btnLoad.addEventListener('click', loadCurrent);
refs.btnAudit.addEventListener('click', auditCurrentInput);
refs.btnSave.addEventListener('click', saveCurrentInput);
refs.btnClear.addEventListener('click', clearInputOnly);
refs.btnCopyCompact.addEventListener('click', () => {
  copyCompactText().catch(() => {
    setBadge(refs.inputStatus, 'FAIL', '複製失敗');
  });
});

init().catch(() => {
  setBadge(refs.inputStatus, 'FAIL', '初始化失敗');
});
