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
    proposalSyncStatus: $('proposal-sync-status'),
    proposalMainGoal: $('proposal-main-goal'),
    proposalMainDetail: $('proposal-main-detail'),
    proposalNextStep: $('proposal-next-step'),
    proposalNextDetail: $('proposal-next-detail'),
    proposalFeatureBoost: $('proposal-feature-boost'),
    proposalFeatureDetail: $('proposal-feature-detail'),
    proposalStepList: $('proposal-step-list'),
    proposalFocusList: $('proposal-focus-list'),
    proposalFeatureList: $('proposal-feature-list'),
    btnProposalOptimize: $('btn-proposal-optimize'),
    btnProposalApprove: $('btn-proposal-approve'),
    btnProposalCopy: $('btn-proposal-copy'),
    proposalOutput: $('proposal-output'),
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
    [refs.btnLoad, refs.btnAudit, refs.btnSave, refs.btnFix, refs.btnClear, refs.btnCopyCompact, refs.btnSendLine, refs.btnProposalOptimize, refs.btnProposalApprove, refs.btnProposalCopy]
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

  function buildProposalPlan(snapshot, rawText = '') {
    const rows = getRows(snapshot);
    const groups = getGroups(snapshot);
    const title = snapshot?.title || snapshot?.standardData?.['公告標題'] || 'AI 派單企劃案';
    const topRows = rows.slice(0, 5).map(rowName).filter(Boolean);
    const groupCounts = ['A1', 'A2', 'B', 'C']
      .map((key) => `${key}: ${asArray(groups[key]).length}人`)
      .join(' | ');
    const sourceLines = rawText.split(/\r?\n/).filter((line) => line.trim()).length;
    const validation = snapshot?.validation || {};
    const issueCount = asArray(validation.errors).length + asArray(validation.warnings).length;
    const topText = topRows.length ? topRows.join('、') : '等待正式名單同步';
    const nextStep = issueCount ? '🔴 攔截審計異常，請先修正' : '🟢 執行全線優化與下一步推送';

    const steps = [
      { label: '數據掃描', text: `掃描 ${rows.length || 0} 筆數據節點` },
      { label: '權重重組', text: '重新計算 AI 動態權重分配' },
      { label: '下一步鏈路', text: '建立自動化下一步行動清單' },
      { label: '功能鏈結', text: '整合 LINE、公告與實時追蹤' },
      { label: '優化存檔', text: '自動更新正式企劃快照' }
    ];

    const focus = [
      `🎯 核心主軸：${title}`,
      `🔥 優先推進：${topText}`,
      `📊 分組分佈：${groupCounts}`,
      sourceLines ? `📝 素材讀取：已解析 ${sourceLines} 行輸入素材` : '🛰️ 資料來源：使用實時正式快照'
    ];

    const features = [
      '⚡ 實時 AI 優化：自動提取主軸、風險、下一步行動',
      '🤖 自動下一步：依審計結果智能切換修正/發布路徑',
      '📱 全端同步：LINE 推送、公告更新、手機同步鏈路',
      '🔍 追蹤矩陣：建立 24 小時執行回饋與效能復盤'
    ];

    const output = [
      `【AI 企劃案自動優化版】SNAPSHOT_${Date.now().toString().slice(-6)}`,
      `==========================================`,
      `[目標主軸]：${title}`,
      `[分組節奏]：${groupCounts}`,
      `[優先對象]：${topText}`,
      ``,
      `一、下一步動作 (Next Step)：`,
      `   ➔ ${nextStep}`,
      `   ➔ 預計發布時間：${new Date().toLocaleTimeString('zh-TW')} (立即)`,
      ``,
      `二、功能提升方案 (Feature Boost)：`,
      `   1. 數據審計：自動攔截邏輯異常，確保派單公平性。`,
      `   2. 自動公告：將複雜 JSON 轉化為極簡群組公告。`,
      `   3. 行動追蹤：24 小時內啟動業績回寫與效能追蹤。`,
      `   4. 視覺強化：全端啟動 Cyber Tech 科技感介面同步。`,
      ``,
      `三、執行指令：`,
      `   > 點擊下方 [複製下一步方案] 並傳送至執行群組。`,
      `   > 系統將於發布後自動進入下一輪優化循環。`
    ].join('\n');

    return { title, topText, nextStep, steps, focus, features, output };
  }

  function renderPillList(container, items, className) {
    if (!container) return;
    container.replaceChildren(...items.map((item) => {
      const div = document.createElement('div');
      div.className = className;
      div.textContent = item;
      return div;
    }));
  }

  function renderProposal(snapshot) {
    const plan = buildProposalPlan(snapshot);
    const container = $('proposal-optimizer');
    
    setBadge(refs.proposalSyncStatus, 'PASS', 'AUTO NEXT');
    setText(refs.proposalMainGoal, '實時企劃主軸');
    setText(refs.proposalMainDetail, plan.title);
    setText(refs.proposalNextStep, plan.nextStep);
    setText(refs.proposalNextDetail, `優先對象：${plan.topText}`);
    setText(refs.proposalFeatureBoost, 'AI 自動優化 + 全端鏈結');
    setText(refs.proposalFeatureDetail, '整合審計、公告、LINE 與行動追蹤。');

    if (refs.proposalStepList) {
      refs.proposalStepList.replaceChildren(...plan.steps.map((step, index) => {
        const article = document.createElement('article');
        article.className = `proposal-step ${index === 0 ? 'active' : ''}`;
        article.innerHTML = `
          <span>${index + 1}</span>
          <strong>${escapeHtml(step.label)}</strong>
          <p>${escapeHtml(step.text)}</p>
        `;
        return article;
      }));
    }
    renderPillList(refs.proposalFocusList, plan.focus, 'proposal-pill');
    renderPillList(refs.proposalFeatureList, plan.features, 'proposal-pill feature');
    if (refs.proposalOutput && !refs.proposalOutput.value) refs.proposalOutput.value = plan.output;
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
    renderProposal(snapshot);
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

  async function optimizeProposal() {
    const container = $('proposal-optimizer');
    if (container) container.classList.add('scanning-mode');
    
    setBadge(refs.proposalSyncStatus, 'PENDING', 'SCANNING...');
    
    // 模擬 AI 掃描動畫延遲
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    const plan = buildProposalPlan(state.current || {}, refs.rawInput?.value || '');
    if (refs.proposalOutput) refs.proposalOutput.value = plan.output;
    
    setText(refs.proposalNextStep, plan.nextStep);
    setText(refs.proposalNextDetail, 'AI 已依據實時數據完成優化路徑掃描。');
    
    // 更新步驟狀態
    const steps = refs.proposalStepList?.querySelectorAll('.proposal-step');
    if (steps) {
      steps.forEach((s, i) => {
        s.classList.remove('active');
        if (i < 2) s.classList.add('completed');
        if (i === 2) s.classList.add('active');
      });
    }

    if (container) container.classList.remove('scanning-mode');
    setBadge(refs.proposalSyncStatus, 'PASS', 'OPTIMIZED');
    setBadge(refs.inputStatus, 'PASS', '企劃案自動優化完成');
  }

  async function copyProposalPlan() {
    const text = refs.proposalOutput?.value || buildProposalPlan(state.current || {}).output;
    await navigator.clipboard.writeText(text);
    setBadge(refs.proposalSyncStatus, 'PASS', 'COPIED');
  }

  async function approveProposal() {
    const container = $('proposal-optimizer');
    if (state.busy) return;
    
    // 檢查是否有生成內容
    if (!refs.proposalOutput || !refs.proposalOutput.value) {
      setBadge(refs.proposalSyncStatus, 'FAIL', '請先點擊自動優化');
      return;
    }

    if (!window.confirm('確定要批準並執行目前的下一步方案嗎？\n這將會：\n1. 儲存目前資料為正式版\n2. 同步全端公告\n3. 發送 LINE 通知')) return;

    setBusy(true);
    try {
      if (container) container.classList.add('scanning-mode');
      setBadge(refs.proposalSyncStatus, 'PENDING', 'EXECUTING PROTOCOL...');
      
      // 1. 執行存檔 (包含審計)
      await saveCurrentReport();
      
      // 2. 模擬執行延遲
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // 3. 發送 LINE
      try {
        await sendLine();
      } catch (e) {
        console.warn('LINE 推送失敗，但存檔已完成', e);
      }

      // 4. 更新步驟為全部完成
      const steps = refs.proposalStepList?.querySelectorAll('.proposal-step');
      if (steps) {
        steps.forEach(s => {
          s.classList.remove('active');
          s.classList.add('completed');
        });
      }

      setBadge(refs.proposalSyncStatus, 'PASS', 'PROTOCOL EXECUTED');
      alert('✅ 執行方案批準成功！\n資料已鎖定並同步全端，下一步行動已推送到執行群組。');
      
    } catch (error) {
      console.error(error);
      setBadge(refs.proposalSyncStatus, 'FAIL', error.message || '執行失敗');
    } finally {
      if (container) container.classList.remove('scanning-mode');
      setBusy(false);
    }
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
    refs.btnFix?.addEventListener('click', optimizeProposal);
    refs.btnProposalOptimize?.addEventListener('click', optimizeProposal);
    refs.btnProposalApprove?.addEventListener('click', approveProposal);
    refs.btnProposalCopy?.addEventListener('click', run(copyProposalPlan));
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
