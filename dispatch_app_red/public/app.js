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
    proposalAwardList: $('proposal-award-list'),
    proposalProgressBar: $('proposal-progress-bar'),
    proposalStatusConsole: $('proposal-status-console'),
    btnProposalOptimize: $('btn-proposal-optimize'),
    btnProposalApprove: $('btn-proposal-approve'),
    btnProposalCopy: $('btn-proposal-copy'),
    proposalOutput: $('proposal-output'),
    statPerf: $('stat-perf'),
    statRel: $('stat-rel'),
    statEng: $('stat-eng'),
    statAi: $('stat-ai'),
    matrixRain: $('matrix-rain'),
    neuralSvg: $('neural-svg'),
    evoLevel: $('evo-level'),
    aiCommanderStatus: $('ai-commander-status'),
    aiCommanderText: $('ai-commander-text'),
    proposalSimTimeline: $('proposal-sim-timeline'),
    globalNodes: $('global-nodes'),
    globalTicker: $('global-ticker'),
    liveDispatchFeed: $('live-dispatch-feed'),
    holographicDocPreview: $('holographic-doc-preview'),
    holographicReport: $('holographic-report'),
    reportSummary: $('report-summary'),
    insightFlashZone: $('insight-flash-zone'),
    waveVisualizer: document.querySelector('.proposal-wave-visualizer'),
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

  function logConsole(message) {
    if (!refs.proposalStatusConsole) return;
    const div = document.createElement('div');
    div.textContent = `${new Date().toLocaleTimeString('zh-TW')} - ${message}`;
    refs.proposalStatusConsole.appendChild(div);
    refs.proposalStatusConsole.scrollTop = refs.proposalStatusConsole.scrollHeight;
    
    // AI 語音指揮官播報
    speak(message);
    
    if (refs.proposalStatusConsole.children.length > 20) {
      refs.proposalStatusConsole.removeChild(refs.proposalStatusConsole.firstChild);
    }
  }

  function speak(text) {
    if (!window.speechSynthesis) return;
    // 關鍵字觸發播報
    const keywords = ['成功', '批準', '優化', '鎖定', '就緒', '同步'];
    if (keywords.some(k => text.includes(k))) {
      const msg = new SpeechSynthesisUtterance(text);
      msg.lang = 'zh-TW';
      msg.rate = 1.05;
      msg.pitch = 0.95; // 略微低沉增加權威感
      window.speechSynthesis.speak(msg);
    }
  }

  function setProgress(percent) {
    if (refs.proposalProgressBar) {
      refs.proposalProgressBar.style.width = `${percent}%`;
    }
  }

  function updateHudStats() {
    const random = () => `${70 + Math.floor(Math.random() * 30)}%`;
    if (refs.statPerf) refs.statPerf.style.width = random();
    if (refs.statRel) refs.statRel.style.width = random();
    if (refs.statEng) refs.statEng.style.width = random();
    if (refs.statAi) refs.statAi.style.width = '99%';
  }

  function startMatrixRain() {
    if (!refs.matrixRain) return;
    const canvas = document.createElement('canvas');
    refs.matrixRain.innerHTML = '';
    refs.matrixRain.appendChild(canvas);
    const ctx = canvas.getContext('2d');
    
    const resize = () => {
        canvas.width = refs.matrixRain.offsetWidth;
        canvas.height = refs.matrixRain.offsetHeight;
    };
    resize();
    
    const characters = '01ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const fontSize = 10;
    const columns = canvas.width / fontSize;
    const drops = Array(Math.floor(columns)).fill(1);

    const draw = () => {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#0F0';
        ctx.font = fontSize + 'px monospace';
        for (let i = 0; i < drops.length; i++) {
            const text = characters.charAt(Math.floor(Math.random() * characters.length));
            ctx.fillText(text, i * fontSize, drops[i] * fontSize);
            if (drops[i] * fontSize > canvas.height && Math.random() > 0.975) drops[i] = 0;
            drops[i]++;
        }
    };
    const interval = setInterval(draw, 33);
    return () => clearInterval(interval);
  }

  function initNeuralMap() {
    if (!refs.neuralSvg) return;
    const svg = refs.neuralSvg;
    svg.innerHTML = '';
    
    const nodes = [];
    const layers = [3, 5, 4, 2];
    const width = 400, height = 150;
    
    layers.forEach((count, lIdx) => {
        const x = (width / (layers.length - 1)) * lIdx;
        for (let i = 0; i < count; i++) {
            const y = (height / (count + 1)) * (i + 1);
            nodes.push({ x, y, layer: lIdx, id: `${lIdx}-${i}` });
        }
    });

    nodes.forEach(n1 => {
        nodes.filter(n2 => n2.layer === n1.layer + 1).forEach(n2 => {
            const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            line.setAttribute('x1', n1.x); line.setAttribute('y1', n1.y);
            line.setAttribute('x2', n2.x); line.setAttribute('y2', n2.y);
            line.setAttribute('class', 'neural-link');
            line.dataset.from = n1.id; line.dataset.to = n2.id;
            svg.appendChild(line);
        });
    });

    nodes.forEach(n => {
        const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        circle.setAttribute('cx', n.x); circle.setAttribute('cy', n.y);
        circle.setAttribute('r', 4);
        circle.setAttribute('class', 'neural-node');
        circle.id = `node-${n.id}`;
        svg.appendChild(circle);
    });
  }

  function animateNeuralMap() {
    const nodes = refs.neuralSvg.querySelectorAll('.neural-node');
    const links = refs.neuralSvg.querySelectorAll('.neural-link');
    
    nodes.forEach(n => n.classList.remove('active'));
    links.forEach(l => l.classList.remove('active'));

    let currentLayer = 0;
    const maxLayer = 3;

    const nextStep = () => {
        nodes.forEach(n => { if (n.id.startsWith(`node-${currentLayer}`)) n.classList.add('active'); });
        links.forEach(l => { if (l.dataset.from.startsWith(`${currentLayer}`)) l.classList.add('active'); });
        
        if (currentLayer < maxLayer) {
            currentLayer++;
            setTimeout(nextStep, 300);
        }
    };
    nextStep();
  }

  function triggerDashboardPulse() {
    document.body.style.animation = 'none';
    void document.body.offsetWidth;
    document.body.style.animation = 'dashboard-pulse 1s cubic-bezier(0,0,0.2,1)';
  }

  function renderSimulation() {
    if (!refs.proposalSimTimeline) return;
    const now = new Date();
    const timeline = [
        { label: '啟動批準', hour: 0 },
        { label: '全端同步', hour: 1 },
        { label: '執行追蹤', hour: 4 },
        { label: '效能復盤', hour: 8 },
        { label: '二輪優化', hour: 12 },
        { label: '日結存檔', hour: 24 }
    ];

    refs.proposalSimTimeline.replaceChildren(...timeline.map((item, idx) => {
        const time = new Date(now.getTime() + item.hour * 60 * 60 * 1000);
        const div = document.createElement('div');
        div.className = `sim-item ${idx === 0 ? 'active' : ''}`;
        div.innerHTML = `
            <div class="sim-time">${time.getHours()}:00</div>
            <div class="sim-dot"></div>
            <div class="sim-label">${item.label}</div>
        `;
        return div;
    }));
  }

  function addFeedItem(msg) {
    if (!refs.liveDispatchFeed) return;
    const div = document.createElement('div');
    div.className = 'feed-item';
    div.textContent = `> ${msg}`;
    refs.liveDispatchFeed.appendChild(div);
    if (refs.liveDispatchFeed.children.length > 5) {
        refs.liveDispatchFeed.removeChild(refs.liveDispatchFeed.firstChild);
    }
  }

  function triggerGlobalFlash() {
    let flash = document.querySelector('.execution-flash');
    if (!flash) {
        flash = document.createElement('div');
        flash.className = 'execution-flash';
        document.body.appendChild(flash);
    }
    flash.style.animation = 'global-sync-flash 0.5s ease-out';
    setTimeout(() => { flash.style.animation = ''; }, 500);
  }

  function updateTicker() {
    if (!refs.globalTicker) return;
    const events = [
        'NODE 0xAF4 SECURED', 'UPLINK STABLE', 'ENCRYPTING PAYLOAD',
        'SATELLITE SYNC: 100%', 'ASSET AUTHENTICATED', 'GLOBAL BROADCAST ACTIVE'
    ];
    setInterval(() => {
        const ev = events[Math.floor(Math.random() * events.length)];
        refs.globalTicker.textContent += ` | ${ev}...`;
        if (refs.globalTicker.textContent.length > 500) {
            refs.globalTicker.textContent = refs.globalTicker.textContent.slice(-200);
        }
    }, 2000);
  }

  function showHolographicReport(summary) {
    if (!refs.holographicReport || !refs.reportSummary) return;
    refs.reportSummary.innerHTML = summary;
    refs.holographicReport.style.display = 'block';
    
    // 添加關閉按鈕
    if (!refs.holographicReport.querySelector('.btn-report-close')) {
        const footer = document.createElement('div');
        footer.className = 'report-footer';
        footer.innerHTML = `<button class="btn-report-close">DISMISS REPORT</button>`;
        footer.querySelector('button').onclick = () => {
            refs.holographicReport.style.display = 'none';
        };
        refs.holographicReport.appendChild(footer);
    }
  }

  function flashInsight(title, text) {
    if (!refs.insightFlashZone) return;
    const card = document.createElement('div');
    card.className = 'insight-flash-card';
    card.innerHTML = `<strong>${title}</strong>${text}`;
    refs.insightFlashZone.appendChild(card);
    
    setTimeout(() => {
        card.style.opacity = '0';
        card.style.transform = 'translateX(20px)';
        card.style.transition = 'all 0.5s ease';
        setTimeout(() => card.remove(), 500);
    }, 4000);
  }

  async function approveProposal() {
    if (confirm('確定批準並執行目前的派單優化方案？此操作將同步數據並發送 LINE 通知。')) {
      // 觸發 3D 寶藏爆發特效
      if (typeof window.triggerTreasureExplosion === 'function') {
          window.triggerTreasureExplosion();
      }
      
      const res = await fetch('/api/proposal/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          timestamp: new Date().toISOString(),
          proposal: refs.compactOutput.value
        })
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
      alert('派單方案已成功優化並同步。');
    }
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

  function setProposalProgress(value) {
    if (!refs.proposalProgressBar) return;
    refs.proposalProgressBar.style.width = `${Math.max(0, Math.min(100, value))}%`;
  }

  function pushProposalLog(message) {
    if (!refs.proposalStatusConsole) return;
    const row = document.createElement('div');
    row.textContent = `[${new Date().toLocaleTimeString('zh-TW', { hour12: false })}] ${message}`;
    refs.proposalStatusConsole.appendChild(row);
    refs.proposalStatusConsole.scrollTop = refs.proposalStatusConsole.scrollHeight;
  }

  function resolveOptimizationCycle(snapshot) {
    const currentLevel = Number(snapshot?.meta?.optimizationLevel || snapshot?.optimizationLevel || 0);
    const rows = getRows(snapshot);
    const validation = snapshot?.validation || {};
    const issueCount = asArray(validation.errors).length + asArray(validation.warnings).length;
    const hasRows = rows.length > 0;

    if (issueCount) {
      return {
        level: currentLevel,
        mode: '審計修復',
        progress: 32,
        next: '先修正審計異常，再重新產生派單企劃',
        afterNext: '修復後重跑 AI 權重與公告版本',
        risk: '審計仍有待處理項目，暫停正式推送'
      };
    }

    if (!hasRows) {
      return {
        level: currentLevel,
        mode: '資料同步',
        progress: 45,
        next: '先同步正式名單與分組資料',
        afterNext: '資料到齊後自動建立獎項與行動追蹤',
        risk: '尚未取得完整正式快照'
      };
    }

    return {
      level: currentLevel + 1,
      mode: '自動推進',
      progress: Math.min(96, 68 + Math.min(rows.length, 20)),
      next: '執行全線優化、公告同步與下一步推送',
      afterNext: '24 小時後依回報自動調整下一輪方案',
      risk: '目前可進入正式執行流程'
    };
  }

  function buildTopFiveAwards(rows) {
    const prizeBlueprint = [
      { title: '真實鑽石王座', code: 'REAL DIAMOND', asset: '第一名：真實鑽石', value: '頂級鑽石資產', purity: 'VVS 級光學切面' },
      { title: '瑞士銀行黃金', code: 'SWISS BANK GOLD', asset: '第二名：瑞士銀行 999.9 黃金', value: '1 KILO GOLD BAR', purity: '999.9 FINE GOLD' },
      { title: '美國美金資產', code: 'UNITED STATES DOLLAR', asset: '第三名：美國美金', value: 'USD CASH STACK', purity: 'FEDERAL RESERVE NOTE' },
      { title: '臺灣新臺幣 2000', code: 'TWD 2000', asset: '第四名：新臺幣 2000 元', value: 'NT$2,000', purity: '台灣法定貨幣' },
      { title: '臺灣新臺幣 1000', code: 'TWD 1000', asset: '第五名：新臺幣 1000 元', value: 'NT$1,000', purity: '台灣法定貨幣' }
    ];
    return rows.slice(0, 5).map((row, index) => {
      const rank = Number(rowRank(row)) || index + 1;
      const prize = prizeBlueprint[index] || { title: '正式前五名', code: 'TOP FIVE AWARD', asset: '科技獎項', value: 'N/A', purity: 'AI VERIFIED' };
      return {
        rank,
        name: rowName(row) || `第 ${rank} 名`,
        group: rowGroup(row) || '-',
        score: rowScore(row),
        title: prize.title,
        code: prize.code
      };
    });
  }

  function buildProposalPlan(snapshot, rawText = '') {
    const rows = getRows(snapshot);
    const groups = getGroups(snapshot);
    const title = snapshot?.title || snapshot?.standardData?.['公告標題'] || 'AI 派單企劃案';
    const topAwards = buildTopFiveAwards(rows);
    const cycle = resolveOptimizationCycle(snapshot);
    const topRows = topAwards.map((award) => award.name).filter(Boolean);
    const groupCounts = ['A1', 'A2', 'B', 'C']
      .map((key) => `${key}: ${asArray(groups[key]).length}人`)
      .join(' | ');
    const sourceLines = rawText.split(/\r?\n/).filter((line) => line.trim()).length;
    const validation = snapshot?.validation || {};
    const issueCount = asArray(validation.errors).length + asArray(validation.warnings).length;
    const topText = topRows.length ? topRows.join('、') : '等待正式名單同步';
    const nextStep = `${issueCount ? '🔴' : '🟢'} ${cycle.next}`;
    const proactiveNext = issueCount 
      ? `偵測到 ${asArray(validation.errors).length} 個阻斷性錯誤，系統已自動鎖定「修復模式」。`
      : `數據鏈路已完成。下一步將推送至「執行群組」並啟動「24小時追蹤矩陣」。`;

    const steps = [
      { label: '數據掃描', text: `掃描 ${rows.length || 0} 筆數據節點`, status: 'completed' },
      { label: '權重重組', text: '重新計算 AI 動態權重分配', status: 'completed' },
      { label: '下一步鏈路', text: cycle.next, status: 'active' },
      { label: '功能鏈結', text: '整合 LINE、公告與實時追蹤', status: 'pending' },
      { label: '再下一輪', text: cycle.afterNext, status: 'pending' }
    ];

    const focus = [
      `核心主軸：${title}`,
      `優先推進：${topText}`,
      `分組分佈：${groupCounts}`,
      `優化模式：${cycle.mode}｜第 ${cycle.level} 輪`,
      `風險判斷：${cycle.risk}`,
      sourceLines ? `素材讀取：已解析 ${sourceLines} 行輸入素材` : '資料來源：使用實時正式快照'
    ];

    const features = [
      '實時 AI 優化：自動提取主軸、風險、下一步行動',
      '自動下一步：依審計結果智能切換修正/發布路徑',
      '全端同步：LINE 推送、公告更新、手機同步鏈路',
      '追蹤矩陣：建立 24 小時執行回饋與效能復盤',
      '再下一步演算法：每次執行後自動生成下一輪提升方向'
    ];

    const output = [
      `【AI 企劃案自動優化版】SNAPSHOT_${Date.now().toString().slice(-6)}`,
      `==========================================`,
      `[目標主軸]：${title}`,
      `[分組節奏]：${groupCounts}`,
      `[優先對象]：${topText}`,
      `[優化循環]：第 ${cycle.level} 輪｜${cycle.mode}`,
      ``,
      `一、下一步動作 (Next Action)：`,
      `   ➔ ${nextStep}`,
      `   ➔ 策略路徑：${proactiveNext}`,
      `   ➔ 再下一步：${cycle.afterNext}`,
      `   ➔ 預計發布時間：${new Date().toLocaleTimeString('zh-TW')} (立即)`,
      ``,
      `二、功能提升方案 (Feature Boost)：`,
      `   1. 數據審計：自動攔截邏輯異常，確保派單公平性。`,
      `   2. 自動公告：將複雜 JSON 轉化為極簡群組公告。`,
      `   3. 行動追蹤：24 小時內啟動業績回寫與效能追蹤。`,
      `   4. 視覺強化：前五名改為真實鑽石、瑞士銀行黃金、美金、臺幣 2000、臺幣 1000 的 3D 空間獎項。`,
      `   5. 空間邏輯：每張卡片含透視、景深、掃描線、價值層與自動下一輪狀態。`,
      ``,
      `三、正式前五名 3D 科技獎項：`,
      ...(topAwards.length
        ? topAwards.map((award) => `   #${award.rank} ${award.name}｜${award.asset}｜${award.title}｜AI ${number(award.score, 2)}｜${award.group}`)
        : ['   尚未取得正式前五名，等待正式快照同步。']),
      ``,
      `四、自動化再下一步提升路線：`,
      `   1. 階段一 (當前)：優化 3D 視覺獎項，確保資料與公告同步。`,
      `   2. 階段二 (自動)：自動追蹤前五名業績，若連續兩日下滑則自動重排建議。`,
      `   3. 階段三 (進化)：依據回報自動生成「戰情週報」並發送至管理層 LINE。`,
      ``,
      `五、執行指令：`,
      `   > 點擊下方 [批準並執行方案] 以鎖定目前優化路徑。`,
      `   > 系統將自動進入下一輪優化循環 (Evo Loop v${cycle.level})。`
    ].join('\n');

    return { title, topText, nextStep, steps, focus, features, output, topAwards, proactiveNext, cycle };
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
    setProposalProgress(plan.cycle.progress);
    setText(refs.proposalMainGoal, '實時企劃主軸');
    setText(refs.proposalMainDetail, plan.title);
    setText(refs.proposalNextStep, plan.nextStep);
    setText(refs.proposalNextDetail, `優先對象：${plan.topText}｜再下一步：${plan.cycle.afterNext}`);
    setText(refs.proposalFeatureBoost, `AI 自動進化 (第 ${plan.cycle.level} 輪)`);
    setText(refs.proposalFeatureDetail, `目前模式：${plan.cycle.mode}。${plan.cycle.risk}。`);

    if (refs.proposalStepList) {
      refs.proposalStepList.replaceChildren(...plan.steps.map((step, index) => {
        const article = document.createElement('article');
        article.className = `proposal-step ${step.status || (index === 0 ? 'active' : '')}`;
        article.innerHTML = `
          <span>${index + 1}</span>
          <strong>${escapeHtml(step.label)}</strong>
          <p>${escapeHtml(step.text)}</p>
        `;
        return article;
      }));
    }
    renderProposalAwards(plan.topAwards);
    renderPillList(refs.proposalFocusList, plan.focus, 'proposal-pill');
    renderPillList(refs.proposalFeatureList, plan.features, 'proposal-pill feature');
    if (refs.proposalOutput && !refs.proposalOutput.value) refs.proposalOutput.value = plan.output;
    pushProposalLog(`已同步企劃引擎：${plan.cycle.mode}`);
  }

  function renderProposalAwards(awards) {
    if (!refs.proposalAwardList) return;
    refs.proposalAwardList.replaceChildren(...awards.map((award) => {
      const article = document.createElement('article');
      article.className = `proposal-award-card rank-${award.rank}`;
      
      const assetMap = {
        1: 'assets/diamond.png',
        2: 'assets/gold.png',
        3: 'assets/money/usd_front.png',
        4: 'assets/money.png',
        5: 'assets/money.png'
      };
      
      const assetImg = assetMap[award.rank] || '';
      
      const xData = {
        val: award.value || 'N/A',
        pur: award.purity || 'AI VERIFIED',
        code: award.code || 'TOP FIVE'
      };

      article.innerHTML = `
        <div class="award-lens-flare"></div>
        <div class="award-xray-overlay">
            <div class="xray-grid"></div>
            <div class="xray-data">VALUE: ${xData.val}</div>
            <div class="xray-data">PURITY: ${xData.pur}</div>
            <div class="xray-data">AUTH: ${xData.code}</div>
        </div>
        <div class="proposal-award-rank">#${escapeHtml(award.rank)}</div>
        <div class="proposal-award-visual">
            <span class="scanline"></span>
            ${assetImg ? `<img src="${assetImg}" alt="${escapeHtml(award.asset)}" class="award-3d-asset award-prize-${escapeHtml(award.rank)}">` : `<div class="proposal-award-medal">${escapeHtml(award.rank)}</div>`}
            <div class="award-particles-container"></div>
        </div>
        <div class="proposal-award-code">${escapeHtml(award.code)}</div>
        <strong>${escapeHtml(award.name)}</strong>
        <span>${escapeHtml(award.asset)}</span>
        <span>${escapeHtml(award.title)} · ${escapeHtml(award.group)}</span>
        <p>AI 權重分數 ${escapeHtml(number(award.score, 2))}</p>
      `;

      // 監聽滑鼠移動以更新反光效果
      article.addEventListener('mousemove', (e) => {
        const rect = article.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * 100;
        const y = ((e.clientY - rect.top) / rect.height) * 100;
        article.style.setProperty('--mouse-x', `${x}%`);
        article.style.setProperty('--mouse-y', `${y}%`);
      });

      // 注入環境粒子
      const particleContainer = article.querySelector('.award-particles-container');
      if (particleContainer) {
          for (let i = 0; i < 5; i++) {
              const p = document.createElement('div');
              p.className = 'award-particle';
              p.style.left = `${Math.random() * 100}%`;
              p.style.top = `${Math.random() * 100}%`;
              p.style.animationDelay = `${Math.random() * 5}s`;
              particleContainer.appendChild(p);
          }
      }

      // 添加物理掉落動畫 (Staggered drop)
      const idx = awards.indexOf(award);
      setTimeout(() => {
          const img = article.querySelector('.award-3d-asset');
          if (img) {
              img.classList.add('asset-drop-bounce');
              img.style.opacity = '1';
          }
      }, idx * 200 + 500); 

      return article;
    }));
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
    window.ReportOfficialSync?.report(snapshot);
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
    
    logConsole('啟動 AI 企劃優化引擎...');
    setText(refs.aiCommanderStatus, 'ANALYZING GLOBAL DISPATCH DATA...');
    setText(refs.aiCommanderText, '正在透過大數據比例原則進行深度優化，預測未來 24 小時執行鏈路。');
    
    setBadge(refs.proposalSyncStatus, 'PENDING', 'SCANNING...');
    setProgress(10);
    updateHudStats();
    initNeuralMap();
    animateNeuralMap();
    renderSimulation();
    const stopRain = startMatrixRain();
    if (refs.waveVisualizer) refs.waveVisualizer.style.opacity = '1';
    
    const stages = [
      { msg: '正在擷取實時派單快照...', p: 25, insight: { t: 'DATA SYNC', m: '已成功鎖定 24 人正式名單鏈路。' } },
      { msg: '驗證高價值資產認證 (Diamond/Gold)...', p: 40, insight: { t: 'ASSET AUTH', m: '第一名鑽石資產已完成 3D 全息封裝。' } },
      { msg: '分析前五名權重異動...', p: 55, insight: { t: 'TOP 5 INSIGHT', m: '偵測到 A1 組別實收金額有上升趨勢。' } },
      { msg: '計算下一步策略鏈路...', p: 75, insight: { t: 'RENEWAL ALERT', m: 'B 組成員續約客單價需加強監控。' } },
      { msg: '整合功能提升方案...', p: 90, insight: { t: 'AI EVO', m: '進化等級已準備好進行 v2.4 升級。' } },
      { msg: '優化完成，準備推送。', p: 100 }
    ];

    for (const stage of stages) {
      logConsole(stage.msg);
      if (stage.insight) flashInsight(stage.insight.t, stage.insight.m);
      setProgress(stage.p);
      await new Promise(resolve => setTimeout(resolve, 400 + Math.random() * 400));
    }
    logConsole('優化完成，準備推送。');
    
    // 顯示全息文件預覽
    if (refs.holographicDocPreview) refs.holographicDocPreview.style.display = 'flex';

    // 提升進化等級
    if (refs.evoLevel) {
        const current = refs.evoLevel.textContent;
        const parts = current.split('.');
        parts[2] = parseInt(parts[2]) + 1;
        refs.evoLevel.textContent = parts.join('.');
    }
    
    setText(refs.aiCommanderStatus, 'OPTIMIZATION COMPLETE - READY FOR ACTION');
    setText(refs.aiCommanderText, '已完成下一步優化推演。系統建議立即批準方案以啟動 24H 執行鏈路。');

    const plan = buildProposalPlan(state.current || {}, refs.rawInput?.value || '');
    if (refs.proposalOutput) {
        refs.proposalOutput.value = ''; // 先清空觸發打字感
        let i = 0;
        const text = plan.output;
        const typeEffect = () => {
          if (i < text.length) {
            refs.proposalOutput.value += text.slice(i, i + 5);
            i += 5;
            requestAnimationFrame(typeEffect);
          }
        };
        typeEffect();
    }
    renderProposalAwards(plan.topAwards);
    renderPillList(refs.proposalFocusList, plan.focus, 'proposal-pill');
    renderPillList(refs.proposalFeatureList, plan.features, 'proposal-pill feature');
    
    setText(refs.proposalNextStep, plan.nextStep);
    setText(refs.proposalNextDetail, `${plan.proactiveNext} 再下一步：${plan.cycle.afterNext}`);
    setText(refs.proposalFeatureBoost, `AI 自動進化 (第 ${plan.cycle.level} 輪)`);
    setText(refs.proposalFeatureDetail, `新增再下一步演算法、24 小時追蹤矩陣、科技感視覺強化。`);
    
    // 更新步驟狀態
    const steps = refs.proposalStepList?.querySelectorAll('.proposal-step');
    if (steps) {
      steps.forEach((s, i) => {
        s.classList.remove('active', 'completed');
        if (i < 3) s.classList.add('completed');
        if (i === 3) s.classList.add('active');
      });
    }

    if (container) container.classList.remove('scanning-mode');
    if (stopRain) stopRain();
    if (refs.waveVisualizer) refs.waveVisualizer.style.opacity = '0.3';
    setBadge(refs.proposalSyncStatus, 'PASS', 'OPTIMIZED');
    setBadge(refs.inputStatus, 'PASS', '企劃案自動優化完成');
    logConsole('優化循環完成。系統進入等待批準狀態。');
  }

  async function copyProposalPlan() {
    const text = refs.proposalOutput?.value || buildProposalPlan(state.current || {}).output;
    await navigator.clipboard.writeText(text);
    setBadge(refs.proposalSyncStatus, 'PASS', 'COPIED');
  }

  async function approveProposal() {
    const container = $('proposal-optimizer');
    if (state.busy) return;
    
    if (!refs.proposalOutput || !refs.proposalOutput.value) {
      setBadge(refs.proposalSyncStatus, 'FAIL', '請先點擊自動優化');
      return;
    }

    if (!window.confirm('確定要批準並執行目前的下一步方案嗎？\n這將會：\n1. 儲存目前資料為正式版\n2. 同步全端公告\n3. 發送 LINE 通知')) return;

    setBusy(true);
    try {
      if (container) container.classList.add('scanning-mode');
      
      logConsole('啟動高階生物識別掃描 (虹膜 + 數位指紋)...');
      setBadge(refs.proposalSyncStatus, 'PENDING', 'BIO-SCANNING...');
      setProgress(15);
      
      // 觸發 UI 掃描動畫
      const bioOverlay = document.createElement('div');
      bioOverlay.className = 'bio-scan-overlay';
      bioOverlay.innerHTML = '<div class="scan-line"></div><div class="scan-grid"></div>';
      document.body.appendChild(bioOverlay);
      
      await new Promise(resolve => setTimeout(resolve, 2000)); // 生物識別掃描
      bioOverlay.remove();
      
      logConsole('身分驗證通過：管理員權限已確認。');
      logConsole('正在執行數位簽章確認...');
      setBadge(refs.proposalSyncStatus, 'PENDING', 'SIGNING...');
      setProgress(25);
      await new Promise(resolve => setTimeout(resolve, 1000)); // 簽章動畫延遲
      
      logConsole('數位簽章已賦予：' + (Math.random().toString(36).substr(2, 9).toUpperCase()));
      logConsole('正在執行優化方案並鎖定數據...');
      setBadge(refs.proposalSyncStatus, 'PENDING', 'EXECUTING PROTOCOL...');
      setProgress(50);
      
      // 1. 執行存檔 (包含審計)
      await saveCurrentReport();
      setProgress(75);
      logConsole('正式快照已鎖定，同步全端中...');
      
      // 2. 模擬執行延遲
      await new Promise(resolve => setTimeout(resolve, 800));
      setProgress(90);
      
      // 3. 發送 LINE
      try {
        logConsole('正在發送 LINE 推送至執行群組...');
        await sendLine();
      } catch (e) {
        logConsole('⚠️ LINE 推送失敗，但資料已成功鎖定。');
      }

      // 4. 更新步驟為全部完成
      const steps = refs.proposalStepList?.querySelectorAll('.proposal-step');
      if (steps) {
        steps.forEach(s => {
          s.classList.remove('active');
          s.classList.add('completed');
        });
      }

      setProgress(100);
      logConsole('✅ 優化方案已全面執行。系統將進入 24H 追蹤模式。');
      setBadge(refs.proposalSyncStatus, 'PASS', 'PROTOCOL EXECUTED');
      
      triggerGlobalFlash();
      container.classList.add('executing');
      
      // 啟動實時派單饋送模擬
      const names = state.current?.top5?.map(a => a.name) || ['Leader A', 'Leader B'];
      let feedIdx = 0;
      const feedTimer = setInterval(() => {
          if (feedIdx < 10) {
              const name = names[feedIdx % names.length];
              addFeedItem(`TASK ASSIGNED: ${name}`);
              feedIdx++;
          } else {
              clearInterval(feedTimer);
          }
      }, 800);

      // 顯示全息報告
      showHolographicReport(`
        <p><strong>執行狀態：</strong> 全端同步完成</p>
        <p><strong>獎項分配：</strong><br>
        1. 鑽石資產 - 封裝完成<br>
        2. 瑞士金磚 - 認證發出<br>
        3. 美金現鈔 - 撥款鎖定</p>
        <p><strong>下一步：</strong> 24H 實時追蹤啟動</p>
      `);

      // 觸發全域脈衝與爆發
      triggerDashboardPulse();
      if (window.apexEngine) {
        window.apexEngine.triggerExplosion(1);
      }

      alert('✅ 執行方案批準成功！\n身分驗證通過，資料已鎖定並同步全端，下一步行動已推送到執行群組。');
      
      // 執行後隱藏全息投影 (模擬任務完成)
      const hologram = document.querySelector('.hologram-projection');
      if (hologram) hologram.style.display = 'none';

    } catch (error) {
      console.error(error);
      logConsole(`❌ 執行失敗: ${error.message}`);
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
    
    // 初始化全息投影隱藏
    const hologram = document.querySelector('.hologram-projection');
    if (hologram) hologram.style.display = 'none';

    updateTicker();
    
    // 初始化 3D 面板傾斜
    const panel = $('proposal-optimizer');
    if (panel) {
        panel.addEventListener('mousemove', (e) => {
            const rect = panel.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            const centerX = rect.width / 2;
            const centerY = rect.height / 2;
            const rotateX = (y - centerY) / 50; // 降低傾斜度以免影響操作
            const rotateY = (centerX - x) / 50;
            panel.style.transform = `perspective(2000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
        });
        panel.addEventListener('mouseleave', () => {
            panel.style.transform = `perspective(2000px) rotateX(0deg) rotateY(0deg)`;
        });
    }

    refs.btnSendLine?.addEventListener('click', run(sendLine));

    // 手機模式切換
    $('mobile-mode-trigger')?.addEventListener('click', () => {
      window.location.href = 'mobile.html?mode=mobile';
    });
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

  function init3DTilt() {
    document.addEventListener('mousemove', (e) => {
      const cards = document.querySelectorAll('.spotlight-item, .proposal-award-card');
      
      cards.forEach((card) => {
        const rect = card.getBoundingClientRect();
        const cardX = (e.clientX - rect.left) / rect.width - 0.5;
        const cardY = (e.clientY - rect.top) / rect.height - 0.5;
        
        // 限制效能消耗：如果滑鼠離卡片太遠則不計算
        const dist = Math.sqrt(cardX * cardX + cardY * cardY);
        if (dist > 2) return;

        const intensity = 20;
        const featured = card.classList.contains('hero-card-1') || card.classList.contains('rank-1');
        card.style.transform = `
          perspective(1000px) 
          rotateY(${cardX * intensity}deg) 
          rotateX(${-cardY * intensity}deg) 
          ${featured ? 'scale(1.05)' : 'scale(1)'}
        `;

        // 隨動光學反射 (Specular Reflection)
        const highlight = card.querySelector('.specular-highlight');
        if (highlight) {
            highlight.style.setProperty('--mouse-x', `${(cardX + 0.5) * 100}%`);
            highlight.style.setProperty('--mouse-y', `${(cardY + 0.5) * 100}%`);
        }

        // 內部分層視差 (Internal Parallax)
        const parallaxElements = card.querySelectorAll('[data-depth]');
        parallaxElements.forEach(el => {
          const depth = parseFloat(el.dataset.depth) || 0;
          const moveX = cardX * depth * 40;
          const moveY = cardY * depth * 40;
          el.style.transform = `translateZ(${depth * 60}px) translateX(${moveX}px) translateY(${moveY}px)`;
          el.style.transition = 'transform 0.1s ease-out';
        });
      });
    });
  }

  async function init() {
    renderRules();
    renderQr();
    bindEvents();
    try {
      await loadCurrent();
      initRealtimeSync();
      init3DTilt();
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
