(function () {
  const fmt = new Intl.NumberFormat('zh-TW');
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
    btnFix: $('btn-fix'),
    btnClear: $('btn-clear'),
    btnCopyCompact: $('btn-copy-compact'),
    btnSendLine: $('btn-send-line'),
    rulesList: $('rules-list'),
    auditResultBadge: $('audit-result-badge'),
    validationSummary: $('validation-summary'),
    validationIssues: $('validation-issues'),
    announcementTitle: $('announcement-title'),
    dateRange: $('date-range'),
    auditResult: $('audit-result'),
    officialLockStatus: $('official-lock-status'),
    officialLockDate: $('official-lock-date'),
    officialLockTop10: $('official-lock-top10'),
    officialLockGroups: $('official-lock-groups'),
    cancellationChip: $('cancellation-chip'),
    summaryGrid: $('summary-grid'),
    leaderboard: $('leaderboard'),
    groupsGrid: $('groups-grid'),
    retiredList: $('retired-list'),
    rankingTableBody: $('ranking-table-body'),
    adviceList: $('advice-list'),
    propAdviceGrid: $('prop-advice-grid'),
    compactOutput: $('compact-output'),
    pageTitle: $('page-title'),
    pageSubtitle: $('page-subtitle'),
    scoringPolicyTitle: $('scoring-policy-title'),
    scoringPolicyDate: $('scoring-policy-date'),
    scoringPolicyDescription: $('scoring-policy-description'),
    scoringWeightGrid: $('scoring-weight-grid'),
    scoringPolicyFormula: $('scoring-policy-formula'),
    qrContainer: $('qr-container')
  };

  const rules = [
    '後端快照為唯一資料源，桌機、手機、廣播同步使用同一份 latest.json。',
    '正式名次、分級、總盤與公告文字都由 API 回傳，不在前端私自重算。',
    '儲存前先審計，通過後才寫入正式版本並觸發即時同步。',
    'SSE 中斷時自動重連，舊瀏覽器退回定時同步。'
  ];

  const state = {
    current: null,
    busy: false
  };

  function escapeHtml(value) {
    return String(value ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function number(value, digits = 0) {
    const parsed = Number(String(value ?? '').replace(/,/g, ''));
    if (!Number.isFinite(parsed)) return digits ? Number(0).toFixed(digits) : '0';
    return fmt.format(Number(parsed.toFixed(digits)));
  }

  function asArray(value) {
    return Array.isArray(value) ? value : [];
  }

  function setText(node, value) {
    if (node) node.textContent = value ?? '';
  }

  function setBadge(node, status, text) {
    if (!node) return;
    node.className = `badge ${status === 'PASS' ? 'badge-pass' : status === 'FAIL' ? 'badge-fail' : 'badge-neutral'}`;
    node.textContent = text || status;
  }

  function setBusy(isBusy) {
    state.busy = isBusy;
    [refs.btnLoad, refs.btnAudit, refs.btnSave, refs.btnFix, refs.btnClear, refs.btnCopyCompact, refs.btnSendLine]
      .filter(Boolean)
      .forEach((button) => {
        button.disabled = isBusy;
        button.setAttribute('aria-busy', String(isBusy));
      });
  }

  async function requestJson(url, options = {}) {
    const response = await fetch(`${url}${url.includes('?') ? '&' : '?'}t=${Date.now()}`, {
      cache: 'no-store',
      headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
      ...options
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok || payload.success === false) {
      throw new Error(payload.message || payload.error || `HTTP ${response.status}`);
    }
    return payload.data ?? payload;
  }

  function getRows(snapshot) {
    return asArray(snapshot?.standardData?.['正式名次'] || snapshot?.ranking || snapshot?.rankings || snapshot?.rows);
  }

  function getGroups(snapshot) {
    return snapshot?.standardData?.['分級'] || snapshot?.groups || {};
  }

  function getSummaryCards(snapshot) {
    const cards = asArray(snapshot?.presentation?.summaryCards);
    if (cards.length) return cards;
    const summary = snapshot?.standardData?.['整合總盤'] || snapshot?.summary || {};
    return Object.entries(summary).slice(0, 8);
  }

  function getMetric(row, keys) {
    for (const key of keys) {
      if (row?.[key] !== undefined && row?.[key] !== null && row?.[key] !== '') return row[key];
      if (row?.metrics?.[key] !== undefined && row?.metrics?.[key] !== null && row?.metrics?.[key] !== '') return row.metrics[key];
    }
    return 0;
  }

  function rowName(row) {
    return row?.姓名 || row?.name || '';
  }

  function rowRank(row) {
    return row?.名次 || row?.rank || '';
  }

  function rowGroup(row) {
    return row?.組別 || row?.group || '';
  }

  function rowScore(row) {
    return getMetric(row, ['正式權重分數', 'weightedScore', 'totalScore', 'score']);
  }

  function rowAdvice(row) {
    return row?.建議 || row?.advice || row?.text || '';
  }

  function renderRules() {
    if (!refs.rulesList) return;
    refs.rulesList.replaceChildren(...rules.map((rule) => {
      const li = document.createElement('li');
      li.textContent = rule;
      return li;
    }));
  }

  function renderValidation(snapshot) {
    const validation = snapshot?.validation || {};
    const audit = snapshot?.audit || {};
    const status = validation.status || audit.status || audit.result || 'PASS';
    setBadge(refs.auditResultBadge, String(status).toUpperCase() === 'PASS' ? 'PASS' : 'FAIL', status);
    if (refs.validationSummary) {
      refs.validationSummary.innerHTML = `
        <div><strong>${escapeHtml(status)}</strong></div>
        <div>正式人數：${escapeHtml(snapshot?.summary?.totalPeople || getRows(snapshot).length || 0)}</div>
        <div>資料來源：${escapeHtml(snapshot?.source || 'saved')}</div>
      `;
    }
    const issues = [...asArray(validation.errors), ...asArray(validation.warnings)];
    if (refs.validationIssues) {
      refs.validationIssues.replaceChildren(...(issues.length ? issues : ['目前沒有阻斷性問題']).map((issue) => {
        const div = document.createElement('div');
        div.className = 'issue-item';
        div.textContent = typeof issue === 'string' ? issue : issue.reason || issue.message || JSON.stringify(issue);
        return div;
      }));
    }
  }

  function renderHero(snapshot) {
    const standard = snapshot?.standardData || {};
    const dates = standard['日期資訊'] || {};
    const title = snapshot?.title || standard['公告標題'] || 'AI 派單戰情室';
    const settlement = dates['結算日'] || snapshot?.settlementDate || '-';
    const dispatch = dates['派單日'] || snapshot?.dispatchDate || '-';
    const auditResult = snapshot?.audit?.result || snapshot?.audit?.status || snapshot?.validation?.status || 'PASS';

    setText(refs.pageTitle, title);
    setText(refs.pageSubtitle, `${settlement} 結算，${dispatch} 正式派單。全端資料已連到後端最新快照。`);
    setText(refs.announcementTitle, title);
    setText(refs.dateRange, `${settlement} → ${dispatch}`);
    setText(refs.auditResult, auditResult);
    setText(refs.executionId, snapshot?.executionId || '-');
    setText(refs.persistStatus, snapshot?.persisted ? '已同步' : '預覽');
    setText(refs.healthStatus, 'ONLINE');
    setBadge(refs.inputStatus, 'PASS', '已載入最新正式版');
  }

  function renderSummary(snapshot) {
    if (!refs.summaryGrid) return;
    refs.summaryGrid.replaceChildren(...getSummaryCards(snapshot).map(([label, value]) => {
      const card = document.createElement('article');
      card.className = 'summary-card';
      card.innerHTML = `<span>${escapeHtml(label)}</span><strong>${escapeHtml(number(value))}</strong>`;
      return card;
    }));

    const cancellation = snapshot?.presentation?.cancellationAmount || snapshot?.standardData?.['整合總盤']?.['當日取消退貨'] || 0;
    setText(refs.cancellationChip, `取消退貨 ${number(cancellation)}`);
  }

  function renderOfficialLock(snapshot) {
    const rows = getRows(snapshot);
    const groups = getGroups(snapshot);
    const dates = snapshot?.standardData?.['日期資訊'] || {};
    setText(refs.officialLockStatus, '今日正式派單順序已鎖定');
    setText(refs.officialLockDate, dates['派單日'] || snapshot?.completedAt || '已同步');
    setText(refs.officialLockTop10, rows.slice(0, 10).map((row) => `${rowRank(row)}.${rowName(row)}`).join('  '));
    setText(refs.officialLockGroups, ['A1', 'A2', 'B', 'C'].map((key) => `${key}: ${asArray(groups[key]).join('、') || '-'}`).join(' ｜ '));
  }

  function renderLeaderboard(snapshot) {
    const rows = getRows(snapshot);
    if (!refs.leaderboard) return;
    refs.leaderboard.replaceChildren(...(rows.slice(0, 10).length ? rows.slice(0, 10) : []).map((row) => {
      const article = document.createElement('article');
      article.className = `leader-row group-${escapeHtml(rowGroup(row))}`;
      article.innerHTML = `
        <span class="leader-rank">#${escapeHtml(rowRank(row))}</span>
        <strong>${escapeHtml(rowName(row))}</strong>
        <span>${escapeHtml(rowGroup(row))}</span>
        <b>${escapeHtml(number(rowScore(row), 2))}</b>
      `;
      return article;
    }));
  }

  function renderGroups(snapshot) {
    if (!refs.groupsGrid) return;
    const rows = getRows(snapshot);
    const rankMap = new Map(rows.map((row) => [rowName(row), rowRank(row)]));
    const groups = getGroups(snapshot);
    refs.groupsGrid.replaceChildren(...['A1', 'A2', 'B', 'C'].map((key) => {
      const names = asArray(groups[key]);
      const article = document.createElement('article');
      article.className = `group-card group-${key}`;
      article.innerHTML = `
        <div class="group-head"><strong>${key}</strong><span>${names.length} 人</span></div>
        <div class="group-members">
          ${names.length ? names.map((name) => `<span class="member-chip">#${escapeHtml(rankMap.get(name) || '-')} ${escapeHtml(name)}</span>`).join('') : '<span class="member-empty">尚無名單</span>'}
        </div>
      `;
      return article;
    }));
  }

  function renderRetired(snapshot) {
    if (!refs.retiredList) return;
    const retired = asArray(snapshot?.presentation?.retired || snapshot?.audit?.excludedEmployees);
    refs.retiredList.replaceChildren(...(retired.length ? retired : [{ 姓名: '本輪無離職列示', 原因: '' }]).map((entry) => {
      const article = document.createElement('article');
      article.className = 'retired-row';
      const name = entry.姓名 || entry.name || String(entry);
      const reason = entry.原因 || entry.reason || '';
      article.innerHTML = `<strong>${escapeHtml(name)}</strong><span>${escapeHtml(reason)}</span>`;
      return article;
    }));
  }

  function renderRankingTable(snapshot) {
    if (!refs.rankingTableBody) return;
    const rows = getRows(snapshot);
    refs.rankingTableBody.innerHTML = rows.length ? rows.map((row) => `
      <tr class="row-${escapeHtml(rowGroup(row))}">
        <td>${escapeHtml(rowRank(row))}</td>
        <td>${escapeHtml(rowName(row))}</td>
        <td>${escapeHtml(rowGroup(row))}</td>
        <td>${escapeHtml(number(rowScore(row), 2))}</td>
        <td>${escapeHtml(number(getMetric(row, ['實收', 'actualRevenue', '實收總金額'])))}</td>
        <td>${escapeHtml(number(getMetric(row, ['追續單總金額', 'renewalRevenue', '續約業績'])))}</td>
        <td>${escapeHtml(number(getMetric(row, ['總業績', 'totalRevenue', '本月業績'])))}</td>
        <td>${escapeHtml(number(getMetric(row, ['平均續約', 'avgRenewal', '追續平均單價'])))}</td>
        <td>${escapeHtml(number(getMetric(row, ['追續單成交', 'renewalDeals', '累積追續總成交數'])))}</td>
      </tr>
    `).join('') : '<tr><td colspan="9" class="table-empty">尚無正式名次資料</td></tr>';
  }

  function renderAdvice(snapshot) {
    const rows = getRows(snapshot);
    if (refs.adviceList) {
      refs.adviceList.replaceChildren(...rows.map((row) => {
        const article = document.createElement('article');
        article.className = `advice-card group-${escapeHtml(rowGroup(row))}`;
        article.innerHTML = `
          <div class="advice-header">
            <div class="advice-rank-name"><span class="advice-rank">#${escapeHtml(rowRank(row))}</span><strong>${escapeHtml(rowName(row))}</strong></div>
            <span class="advice-group-tag">${escapeHtml(rowGroup(row))}</span>
          </div>
          <p class="advice-text">${escapeHtml(rowAdvice(row) || '依後端正式比例規則執行。')}</p>
        `;
        return article;
      }));
    }

    if (refs.propAdviceGrid) {
      refs.propAdviceGrid.replaceChildren(...rows.map((row) => {
        const article = document.createElement('article');
        article.className = `prop-card group-${escapeHtml(rowGroup(row))}`;
        article.innerHTML = `
          <div class="prop-card-header">
            <div class="prop-rank-name"><span class="prop-rank">#${escapeHtml(rowRank(row))}</span><strong>${escapeHtml(rowName(row))}</strong></div>
            <span class="prop-group-tag">${escapeHtml(rowGroup(row))}</span>
          </div>
          <div class="prop-score">AI <strong>${escapeHtml(number(rowScore(row), 2))}</strong></div>
          <p class="prop-advice-text">${escapeHtml(rowAdvice(row) || '保持正式派單節奏。')}</p>
        `;
        return article;
      }));
    }
  }

  function renderScoringPolicy(snapshot) {
    const policy = snapshot?.scoringPolicy || {};
    const dates = snapshot?.standardData?.['日期資訊'] || {};
    setText(refs.scoringPolicyTitle, policy.title || 'AI 權重分數');
    setText(refs.scoringPolicyDate, dates['派單日'] || '最新');
    setText(refs.scoringPolicyDescription, policy.description || '權重由後端統一維護，前端只呈現正式結果。');
    if (refs.scoringWeightGrid) {
      refs.scoringWeightGrid.replaceChildren(...asArray(policy.weights).map((item) => {
        const card = document.createElement('div');
        card.className = 'scoring-weight-card';
        card.innerHTML = `<span>${escapeHtml(item.label || item.key)}</span><strong>${escapeHtml(number(item.weight))}</strong>`;
        return card;
      }));
    }
    setText(refs.scoringPolicyFormula, policy.formula || '');
  }

  function renderCompactOutput(snapshot) {
    const text = snapshot?.standardData?.['群組超精簡版'] || snapshot?.announcement || snapshot?.groupShortText || '';
    if (refs.compactOutput) refs.compactOutput.value = text;
  }

  function renderQr() {
    if (!refs.qrContainer) return;
    const url = `${window.location.origin}/mobile.html`;
    refs.qrContainer.innerHTML = `<img alt="手機版 QR Code" src="https://chart.googleapis.com/chart?chs=150x150&cht=qr&chl=${encodeURIComponent(url)}&choe=UTF-8">`;
  }

  function render(snapshot) {
    state.current = snapshot;
    renderHero(snapshot);
    renderValidation(snapshot);
    renderSummary(snapshot);
    renderOfficialLock(snapshot);
    renderLeaderboard(snapshot);
    renderGroups(snapshot);
    renderRetired(snapshot);
    renderRankingTable(snapshot);
    renderAdvice(snapshot);
    renderScoringPolicy(snapshot);
    renderCompactOutput(snapshot);
  }

  async function loadCurrent() {
    setBadge(refs.inputStatus, 'PENDING', '正在載入');
    const snapshot = await requestJson('/api/current');
    render(snapshot);
  }

  async function auditCurrentInput() {
    const rawText = refs.rawInput?.value.trim();
    if (!rawText) {
      setBadge(refs.inputStatus, 'FAIL', '請先貼上公告或 JSON');
      return;
    }
    const snapshot = await requestJson('/api/audit', {
      method: 'POST',
      body: JSON.stringify({ rawText })
    });
    render(snapshot);
    setBadge(refs.inputStatus, snapshot?.validation?.ok === false ? 'FAIL' : 'PASS', '審計完成');
  }

  async function saveCurrentReport() {
    const rawText = refs.rawInput?.value.trim();
    const body = rawText
      ? { rawText, operator: 'admin', reason: 'desktop-save' }
      : { report: state.current, operator: 'admin', reason: 'desktop-save' };
    await requestJson('/api/save', {
      method: 'POST',
      body: JSON.stringify(body)
    });
    await loadCurrent();
    setBadge(refs.inputStatus, 'PASS', '已存正式版並同步');
  }

  async function sendLine() {
    const userId = localStorage.getItem('MY_LINE_USER_ID') || window.prompt('請輸入 LINE User ID');
    if (!userId) return;
    localStorage.setItem('MY_LINE_USER_ID', userId.trim());
    const text = refs.compactOutput?.value || state.current?.announcement || '';
    await requestJson('/api/line/notify', {
      method: 'POST',
      body: JSON.stringify({ userId: userId.trim(), text })
    });
    setBadge(refs.inputStatus, 'PASS', 'LINE 已送出');
  }

  function bindEvents() {
    const run = (task) => async () => {
      if (state.busy) return;
      setBusy(true);
      try {
        await task();
      } catch (error) {
        console.error(error);
        setBadge(refs.inputStatus, 'FAIL', error.message || '操作失敗');
      } finally {
        setBusy(false);
      }
    };

    refs.btnLoad?.addEventListener('click', run(loadCurrent));
    refs.btnAudit?.addEventListener('click', run(auditCurrentInput));
    refs.btnSave?.addEventListener('click', run(saveCurrentReport));
    refs.btnFix?.addEventListener('click', run(auditCurrentInput));
    refs.btnClear?.addEventListener('click', () => {
      if (refs.rawInput) refs.rawInput.value = '';
      setBadge(refs.inputStatus, 'PENDING', '已清空輸入');
    });
    refs.btnCopyCompact?.addEventListener('click', async () => {
      const text = refs.compactOutput?.value || '';
      await navigator.clipboard.writeText(text);
      setBadge(refs.inputStatus, 'PASS', '已複製精簡版');
    });
    refs.btnSendLine?.addEventListener('click', run(sendLine));
  }

  function hideSplashScreen() {
    const splash = $('splash-screen');
    if (!splash) return;
    window.setTimeout(() => {
      splash.classList.add('fade-out');
      window.setTimeout(() => splash.remove(), 600);
    }, 250);
  }

  function initRealtimeSync() {
    const sync = new window.RealtimeSyncEngine('/api/updates/stream', () => {
      loadCurrent().catch((error) => console.error('[RealtimeSync]', error));
    });
    sync.connect();
  }

  async function init() {
    renderRules();
    renderQr();
    bindEvents();
    try {
      await loadCurrent();
      initRealtimeSync();
    } finally {
      hideSplashScreen();
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
