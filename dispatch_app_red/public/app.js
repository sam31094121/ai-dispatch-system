
function getMovement(row) {
  const currentRank = Number(row.名次 || row.rank || 0);
  const prevRank = Number(row.上輪名次 || row.prevRank || 0);
  
  if (!prevRank || prevRank === 0) return { class: 'new', arrow: 'NEW' };
  if (currentRank < prevRank) return { class: 'up', arrow: '↑' };
  if (currentRank > prevRank) return { class: 'down', arrow: '↓' };
  return { class: 'flat', arrow: '＝' };
}
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
  btnFix: $('btn-fix'),
  btnClear: $('btn-clear'),
  btnCopyCompact: $('btn-copy-compact'),
  rulesList: $('rules-list'),
  auditResultBadge: $('audit-result-badge'),
  validationSummary: $('validation-summary'),
  validationIssues: $('validation-issues'),
  announcementTitle: $('announcement-title'),
  dateRange: $('date-range'),
  auditResult: $('audit-result'),
  officialLockPanel: $('official-lock-panel'),
  officialLockStatus: $('official-lock-status'),
  officialLockDate: $('official-lock-date'),
  officialLockTop10: $('official-lock-top10'),
  officialLockGroups: $('official-lock-groups'),
  cancellationChip: $('cancellation-chip'),
  summaryGrid: $('summary-grid'),
  spotlightGrid: $('spotlight-grid'),
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
  scoringPolicyFormula: $('scoring-policy-formula')
};

const LOCKED_RULES = [
  '後端智慧動態核算。',
  '支援多維度業績即時更新。',
  '排序邏輯：正式權重分數 → 實收總業績 → 追續金額 → 全部總額 → 追續客單價 → 追續單數。',
  'AI 計分核心：10000 分制比例原則 (3000/2500/1500/1500/1500)。',
  '智慧分級：A1 (1-4) / A2 (5-11) / B (12-18) / C (19+)。',
  '自動化審計：精準排除異動與離職列示。',
  '數據同步：支援 API 雙向存取與手動智慧修正。',
  '版本控制：所有變更均留存歷史紀錄，支援秒級還原。'
];

const state = {
  current: null,
  busy: false
};

const actionButtons = [
  refs.btnLoad,
  refs.btnAudit,
  refs.btnSave,
  refs.btnFix,
  refs.btnClear,
  refs.btnCopyCompact,
  $('btn-send-line')
].filter(Boolean);

function fmt(value) {
  return numberFormatter.format(Number(value || 0));
}

function fieldVal(row, ...keys) {
  const metricsObj = row.metrics || {};
  for (const k of keys) {
    if (row[k] !== null && row[k] !== undefined && row[k] !== '') return row[k];
    if (metricsObj[k] !== null && metricsObj[k] !== undefined && metricsObj[k] !== '') return metricsObj[k];
  }
  return 0;
}

function getMetrics(row) {
  return {
    實收:     fieldVal(row, '實收', '實收總金額', '實收總業績', 'actualRevenue'),
    追續金額: fieldVal(row, '追續金額', '續單金額', '追續單金額', 'renewalRevenue'),
    全部總業績: fieldVal(row, '全部總業績', '總業績', 'totalRevenue'),
    追續客單價: fieldVal(row, '追續客單價', 'avgRenewal'),
    追續單數:  fieldVal(row, '追續單數', '追續成交總數', 'renewalDeals'),
    AI分數:   fieldVal(row, '正式權重分數', 'AI權重分數', 'weightedScore', 'totalScore')
  };
}

function countUp(el, target, duration = 1200) {
  const numTarget = Number(target || 0);
  if (!numTarget) { el.textContent = numberFormatter.format(0); return; }
  const t0 = performance.now();
  el.style.textShadow = '0 0 15px var(--cyan)';
  el.style.transition = 'transform 0.1s ease';

  function tick(now) {
    const p = Math.min((now - t0) / duration, 1);
    const ease = p === 1 ? 1 : 1 - Math.pow(2, -10 * p);
    
    el.textContent = numberFormatter.format(Math.round(numTarget * ease));
    
    if (p < 1) {
      requestAnimationFrame(tick);
    } else {
      el.textContent = numberFormatter.format(numTarget);
      el.style.textShadow = 'none';
    }
  }
  requestAnimationFrame(tick);
}

function badgeClass(status) {
  if (status === 'PASS') return 'badge badge-pass';
  if (status === 'FAIL') return 'badge badge-fail';
  return 'badge badge-neutral';
}

function setBadge(node, status, text = status) {
  if (!node) return;
  node.className = badgeClass(status);
  node.textContent = text;
}

function setBusy(isBusy) {
  state.busy = isBusy;
  document.body.classList.toggle('is-busy', isBusy);
  actionButtons.forEach((button) => {
    button.disabled = isBusy;
    button.setAttribute('aria-busy', String(isBusy));
  });
}

async function runAction(task) {
  if (state.busy) return;
  setBusy(true);
  try {
    await task();
  } catch (error) {
    console.error('[UI Action]', error);
    setBadge(refs.inputStatus, 'FAIL', error?.message || '操作失敗，請稍後再試');
  } finally {
    setBusy(false);
  }
}

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function normalizePersonName(row) {
  return row?.姓名 || row?.name || '';
}

function renderEmpty(container, message, className = 'empty-state') {
  if (!container) return;
  const empty = document.createElement('div');
  empty.className = className;
  empty.textContent = message;
  container.replaceChildren(empty);
}

function safeHtml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

const AudioManager = {
  ctx: null,
  init() { if (!this.ctx) this.ctx = new (window.AudioContext || /** @type {any} */(window).webkitAudioContext)(); },
  play(freq, type = 'sine', duration = 0.1, vol = 0.1) {
    this.init();
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
    gain.gain.setValueAtTime(vol, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + duration);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + duration);
  },
  click() { this.play(800, 'sine', 0.05, 0.05); },
  success() { this.play(1200, 'triangle', 0.2, 0.08); },
  error() { this.play(200, 'square', 0.3, 0.05); },
  sweep() {
    this.init();
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.frequency.setValueAtTime(100, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(1000, this.ctx.currentTime + 0.5);
    gain.gain.setValueAtTime(0.05, this.ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0, this.ctx.currentTime + 0.5);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.5);
  }
};

let auditTimeout = null;
function setupLiveAudit() {
  refs.rawInput.addEventListener('input', () => {
    refs.inputStatus.textContent = '掃描中...';
    refs.inputStatus.className = 'badge badge-neutral ai-scanning-text';
    
    clearTimeout(auditTimeout);
    auditTimeout = setTimeout(async () => {
      const content = refs.rawInput.value.trim();
      if (!content) {
        refs.inputStatus.textContent = '等待輸入';
        refs.inputStatus.className = 'badge badge-neutral';
        return;
      }
      
      AudioManager.click();
      const { ok, payload } = await request('/api/audit', {
        method: 'POST',
        body: JSON.stringify({ rawText: content })
      });
      
      if (payload.data) {
        renderValidation(payload.data);
        refs.inputStatus.textContent = payload.data.validation.status === 'PASS' ? '掃描通過' : '結構異常';
        refs.inputStatus.className = badgeClass(payload.data.validation.status);
      } else if (!ok) {
        refs.inputStatus.textContent = payload.message || '即時審計失敗';
        refs.inputStatus.className = badgeClass('FAIL');
      }
    }, 800);
  });
}

async function request(url, options = {}) {
  let response;
  try {
    response = await fetch(url, {
      cache: 'no-store',
      headers: { 'Content-Type': 'application/json' },
      ...options
    });
  } catch (error) {
    return {
      ok: false,
      status: 0,
      payload: {
        success: false,
        message: '無法連線到後端服務，請確認系統是否啟動。',
        data: null
      },
      error
    };
  }

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
  const status = validation.status || 'PENDING';
  
  setBadge(refs.auditResultBadge, status, status === 'PASS' ? '審計通過' : (status === 'FAIL' ? '檢查失敗' : '待檢查'));

  refs.validationSummary.innerHTML = `
    <div class="metric-stack">
      <div class="metric-chip">
        <span>審計結果</span>
        <strong style="color: var(--${status === 'PASS' ? 'pass' : (status === 'FAIL' ? 'fail' : 'cyan')})">${safeHtml(summary.審計結果 || status)}</strong>
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
    ...(validation.errors || []).map((text) => ({ tone: 'fail', text, label: 'ERROR' })),
    ...(validation.warnings || []).map((text) => ({ tone: 'warn', text, label: 'WARN' }))
  ];

  refs.validationIssues.replaceChildren(
    ...(issues.length
      ? issues.map((item) => {
          const row = document.createElement('div');
          row.className = `issue-row ${item.tone}`;
          row.innerHTML = `<span class="issue-label">${item.label}</span> <span class="issue-text">${safeHtml(item.text)}</span>`;
          return row;
        })
      : [Object.assign(document.createElement('div'), {
          className: 'issue-row pass',
          innerHTML: '<span class="issue-label">INFO</span> <span class="issue-text">後端審計通過，未發現矛盾。</span>'
        })])
  );
}

function renderHero(data, snapshot) {
  const result = snapshot?.validation?.status || 'FAIL';
  const dates = data?.日期資訊 || {};

  refs.announcementTitle.innerHTML = `${safeHtml(data?.公告標題 || snapshot?.title || 'AI 派單公告')} <span class="integrity-badge">AI 數據審核通過</span>`;
  if (refs.pageTitle) {
    refs.pageTitle.textContent = data?.公告標題 || snapshot?.title || 'AI 派單公告';
  }
  refs.dateRange.textContent = `${dates.結算日 || '-'} 結算 → ${dates.派單日 || '-'} 正式派單`;
  refs.auditResult.textContent = result;
  refs.auditResult.className = `audit-hero ${result === 'PASS' ? 'audit-pass' : 'audit-fail'}`;
  refs.cancellationChip.textContent = `取消退貨 ${fmt(data?.整合總盤?.當日取消退貨 || 0)}`;

  refs.healthStatus.textContent = 'ONLINE';
  refs.executionId.textContent = dates.結算日 || snapshot?.executionId || '-';
  refs.persistStatus.textContent = snapshot?.persisted ? '正式版' : '預覽中';
  refs.pageSubtitle.textContent = snapshot?.persisted
    ? `數據已生效：${dates.結算日 || '5/4'} 結算，${dates.派單日 || '5/5'} 正式派單。系統正以最優化模式運行。`
    : '目前展示的是預覽結果，可直接存為正式版。';
}

function groupLine(groups, key, label) {
  const names = Array.isArray(groups?.[key]) ? groups[key] : [];
  return `${label}：${names.join('、') || '-'}`;
}

function buildPasteReadyAnnouncement(snapshot) {
  const ranking = Array.isArray(snapshot?.ranking) ? snapshot.ranking : [];
  const groups = snapshot?.groups || {};
  const dates = snapshot?.standardData?.日期資訊 || {};
  const settleDay = dates.結算日 || '-';
  const dispatchDay = dates.派單日 || '-';

  const auditStatus = (snapshot?.audit?.status || snapshot?.validation?.status || 'FAIL').toUpperCase();
  const auditNotes = Array.isArray(snapshot?.audit?.notes) ? snapshot.audit.notes : [];
  const excludedEmployees = Array.isArray(snapshot?.audit?.excludedEmployees)
    ? snapshot.audit.excludedEmployees
    : (snapshot?.standardData?.審計結論?.['審計列示不入派單'] || []).map(e => ({ name: e?.姓名 || e, reason: e?.原因 || '已離職' }));

  const auditLine = auditStatus === 'PASS'
    ? `審計結果：PASS　三平台總表核對通過${auditNotes.length ? '，' + auditNotes.join('；') : '，無漏算、無多算、無總盤衝突'}。`
    : `審計結果：${auditStatus}　${auditNotes.length ? auditNotes.join('；') : '請確認資料後重新審計'}。`;

  const retiredLine = excludedEmployees.length
    ? `已離職：${excludedEmployees.map(e => e.name || e).filter(Boolean).join('、')}，只列審計，不入正式派單。`
    : '';

  if (!ranking.length) return '';

  const top10 = ranking
    .slice(0, 10)
    .map((row) => `${row.rank}${row.name}`)
    .join(' ');

  const rankingLines = ranking.map((row) => {
    const score = Number(row.weightedScore || row.totalScore || 0).toFixed(2);
    const actual = row.actualRevenue || row.totalRevenue || 0;
    const renewal = row.renewalRevenue || 0;
    const deals = row.renewalDeals || 0;
    return `${row.rank}、${row.name}｜AI ${score}｜實收 ${fmt(actual)}｜追續金額 ${fmt(renewal)}｜追續單數 ${deals}`;
  });

  return [
    `📣【AI 派單公告｜${settleDay} 結算 → ${dispatchDay} 正式派單順序｜三平台整合比例原則版】`,
    '',
    auditLine,
    retiredLine,
    '',
    '正式前10名：',
    `${top10}。`,
    '',
    '正式名次：',
    ...rankingLines,
    '',
    'A1／A2／B／C 派單分組：',
    groupLine(groups, 'A1', 'A1｜核心主力'),
    groupLine(groups, 'A2', 'A2｜續單收割'),
    groupLine(groups, 'B', 'B組｜穩定進階'),
    groupLine(groups, 'C', 'C組｜補位觀察'),
    '',
    `${dispatchDay} 正式派單順序以本則公告為準。`,
    '今日派單請依 A1 → A2 → B → C 順序執行；前方全忙才往下派，不得跳位，不得指定。',
    '同客戶回撥，優先由原承接人服務。',
    '請全員確認後回覆「+1」。'
  ].filter(v => v !== null && v !== undefined && v !== '').join('\n');
}

function renderOfficialLock(snapshot) {
  if (!refs.officialLockPanel) return;

  const ranking = Array.isArray(snapshot?.ranking) ? snapshot.ranking : [];
  const groups = snapshot?.groups || {};
  const dates = snapshot?.standardData?.日期資訊 || {};
  const dispatchDay = dates.派單日 || snapshot?.report?.nextDispatchDisplayDate || '-';
  const top10 = ranking
    .slice(0, 10)
    .map((row) => `${row.rank}.${row.name}`)
    .join('  ');

  refs.officialLockStatus.textContent = ranking.length
    ? `${dispatchDay} 正式派單順序已確認，可直接執行`
    : '等待正式派單順序';
  refs.officialLockDate.textContent = `${dispatchDay} LOCK`;
  refs.officialLockTop10.textContent = top10 || '-';
  refs.officialLockGroups.textContent = [
    groupLine(groups, 'A1', 'A1'),
    groupLine(groups, 'A2', 'A2'),
    groupLine(groups, 'B', 'B'),
    groupLine(groups, 'C', 'C')
  ].join('｜');
}

function renderSummaryCards(cards) {
  const entries = Array.isArray(cards) ? cards : Object.entries(cards || {});
  const fallback = [
    ["實收總金額", 0],
    ["追續單金額", 0],
    ["全部總業績", 0],
    ["追續單成交", 0],
    ["累積派單成交", 0],
    ["當日取消退貨", 0]
  ];
  
  const finalEntries = [];
  fallback.forEach(([fLabel, fVal]) => {
    const found = entries.find(e => e[0].includes(fLabel) || fLabel.includes(e[0]));
    finalEntries.push(found || [fLabel, fVal]);
  });

  const items = finalEntries.map(([label, value]) => {
    const card = document.createElement('article');
    card.className = 'summary-card';
    
    let tone = '';
    if (label.includes('業績') || label.includes('金額')) tone = 'tone-gold';
    if (label.includes('成交') || label.includes('單數')) tone = 'tone-cyan';

    card.innerHTML = `
      <div class="summary-card-inner ${tone}">
        <p>${safeHtml(label)}</p>
        <strong class="count-value">0</strong>
      </div>
    `;
    return { card, value, strong: card.querySelector('.count-value') };
  });
  
  if (refs.summaryGrid) {
    refs.summaryGrid.replaceChildren(...items.map(i => i.card));
    items.forEach(({ strong, value }) => countUp(strong, value, 1000));
  }
}

function renderSpotlight(rows) {
  rows = asArray(rows);
  if (!rows.length) {
    renderEmpty(refs.spotlightGrid, '尚無前段排行榜資料');
    return;
  }
  const top1Score = getMetrics(rows[0]).AI分數 || 0;

  refs.spotlightGrid.replaceChildren(
    ...rows.map((row, index) => {
      const m = getMetrics(row);
      const rank = index + 1;
      const scoreGap = rank > 1 && top1Score > 0 ? (top1Score - (m.AI分數 || 0)) : 0;
      const card = document.createElement('article');
      card.className = `spotlight-card rank-${rank} group-${row.分級 || row.group}`;

      const championBanner = rank === 1 ? `
        <div class="spotlight-champion-banner">
          <span class="champion-icon">👑</span>
          <span class="champion-label">CHAMPION · #1</span>
          <span class="champion-ai">AI 10000 比例原則</span>
        </div>` : '';

      const gapBadge = scoreGap > 0
        ? `<span class="spotlight-gap-badge">↓ −${scoreGap.toFixed(2)} pts</span>`
        : '';

      const titles = {
        1: { text: '🏆 至尊王者 SUPREME', class: 'title-champion' },
        2: { text: '💎 鑽石戰神 ELITE', class: 'title-elite' },
        3: { text: '🥇 黃金統帥 COMMANDER', class: 'title-elite' },
        4: { text: '🥈 白銀先鋒 VANGUARD', class: 'title-striker' }
      };
      const titleData = titles[rank];
      const titleHtml = titleData ? `<div class="prestige-title-wrap"><span class="prestige-title ${titleData.class}">${titleData.text}</span></div>` : '';

      const metricsHTML = `
          <div class="spotlight-stats">
            <div><span>實收業績</span><strong>${safeHtml(fmt(m.實收))}</strong></div>
            <div><span>追續金額</span><strong>${safeHtml(fmt(m.追續金額))}</strong></div>
            <div><span>追續客單</span><strong>${safeHtml(fmt(m.追續客單價))}</strong></div>
          </div>
          <div class="spotlight-renewal-row">
            <span class="spotlight-renewal-label">追續單數 / 總業績</span>
            <span class="spotlight-renewal-value">${safeHtml(String(m.追續單數))} 單 / ${safeHtml(fmt(m.全部總業績))}</span>
          </div>`;

      const scoreHTML = m.AI分數
        ? `<div class="score-banner">
            <span class="score-label">AI 權重分數</span>
            <strong class="score-value">${safeHtml(Number(m.AI分數).toFixed(2))}</strong>
            ${rank <= 3 ? '<span class="score-max">/ 10000 · A1 TIER</span>' : ''}
          </div>`
        : '';

      const adviceHTML = rank <= 3 && (row.建議 || row.advice)
        ? `<p class="spotlight-advice-text">${safeHtml(row.建議 || row.advice)}</p>`
        : '';

      card.innerHTML = `
        <div class="spotlight-content-wrapper">
          ${championBanner}
          <div class="spotlight-meta">
            <span class="rank-no">#${safeHtml(String(row.名次 || row.rank))}</span>
            <span class="group-tag" style="background:var(--cyan); color:#000;">${safeHtml(row.分級 || row.group)}</span>
            ${gapBadge}
          </div>
          <h3>${safeHtml(row.姓名 || row.name)}${titleHtml}</h3>
          ${(row.標記 || row.isNew) ? `<span class="newbie-tag">${safeHtml(row.標記 || '新人')}</span>` : ''}
          ${metricsHTML}
          ${scoreHTML}
          ${adviceHTML}
        </div>
      `;
      return card;
    })
  );
}

function renderLeaderboard(rows) {
  rows = asArray(rows);
  if (!rows.length) {
    renderEmpty(refs.leaderboard, '尚無排行榜資料');
    return;
  }
  refs.leaderboard.replaceChildren(
    ...rows.map((row) => {
      const m = getMetrics(row);
      const item = document.createElement('article');
      item.className = `leader-row group-${row.分級 || row.group}`;
      item.innerHTML = `
        <div class="leader-left">
          <strong>#${safeHtml(String(row.名次 || row.rank))}</strong>
          <div>
            <p>${safeHtml(row.姓名 || row.name)}</p>
            <span>${safeHtml(row.分級 || row.group)}${(row.標記 || row.isNew) ? `・${safeHtml(row.標記 || '新人')}` : ''}</span>
          </div>
        </div>
        <div class="leader-right">
          <div class="leader-metrics-stack">
            <div class="m-item"><span>實收</span><strong>${safeHtml(fmt(m.實收))}</strong></div>
            <div class="m-item"><span>追續</span><strong>${safeHtml(fmt(m.追續金額))}</strong></div>
            <div class="m-score"><span>AI</span><strong>${safeHtml(Number(m.AI分數).toFixed(0))}</strong></div>
          </div>
        </div>
      `;
      return item;
    })
  );
}

const GROUP_META = {
  A1: { emoji: '🔴', label: 'A1 高優先主力' },
  A2: { emoji: '🟠', label: 'A2 次主力追進' },
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
  retired = asArray(retired);
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
  rows = asArray(rows);
  if (!rows.length) {
    refs.rankingTableBody.innerHTML = '<tr><td colspan="9" class="table-empty">尚無正式名次資料</td></tr>';
    return;
  }
  refs.rankingTableBody.innerHTML = rows.map((row) => {
    const m = getMetrics(row);
    const score = Number(m.AI分數 || 0);
    const scoreStyle = score >= 3000 ? 'style="color: var(--cyan); font-weight: bold; text-shadow: 0 0 8px var(--cyan);"' : '';
    return `
      <tr class="row-${safeHtml(row.分級 || row.group)}">
        <td class="col-rank">
          <div class="rank-box">
            <span>${safeHtml(String(row.名次 || row.rank))}</span>
            <span class="move-arrow move-${row.movement || 'flat'}">${row.movement === 'up' ? '↑' : row.movement === 'down' ? '↓' : '＝'}</span>
          </div>
        </td>
        <td>
          <div class="table-name">
            <span>${safeHtml(row.姓名 || row.name)}</span>
            ${(row.標記 || row.isNew) ? `<span class="newbie-tag">${safeHtml(row.標記 || '新人')}</span>` : ''}
          </div>
        </td>
        <td>${safeHtml(row.分級 || row.group)}</td>
        <td class="col-score" ${scoreStyle}>${score > 0 ? safeHtml(Number(score).toFixed(2)) : '—'}</td>
        <td>${safeHtml(fmt(m.實收))}</td>
        <td>${safeHtml(fmt(m.追續金額))}</td>
        <td>${safeHtml(fmt(m.全部總業績))}</td>
        <td>${safeHtml(fmt(m.追續客單價))}</td>
        <td>${safeHtml(String(m.追續單數))}</td>
      </tr>
    `;
  }).join('');
}

function renderAdvice(rows) {
  rows = asArray(rows);
  if (!rows.length) {
    renderEmpty(refs.adviceList, '尚無個人建議資料');
    return;
  }
  refs.adviceList.replaceChildren(
    ...rows.map((row) => {
      const card = document.createElement('article');
      card.className = `advice-card group-${row.分級 || row.group}`;
      card.innerHTML = `
        <div class="advice-header">
          <div class="advice-rank-name">
            <span class="advice-rank">#${safeHtml(String(row.名次 || row.rank))}</span>
            <strong class="advice-name">${safeHtml(row.姓名 || row.name)}</strong>
            ${(row.標記 || row.isNew) ? `<span class="newbie-tag">${safeHtml(row.標記 || '新人')}</span>` : ''}
          </div>
          <span class="advice-group-tag">${safeHtml(row.分級 || row.group)}</span>
        </div>
        <p class="advice-text">${safeHtml(row.建議 || row.advice)}</p>
      `;
      return card;
    })
  );
}

const GROUP_COLOR = { A1: '#FFD060', A2: '#00FFC3', B: '#0EA5E9', C: '#64748B' };

function autoProportionalAdvice(rows) {
  if (!rows.length) return rows;
  const withWs = rows.map(r => {
    const m = getMetrics(r);
    return {
      ...r,
      _m: m,
      _ws: (m.AI分數 > 0 ? m.AI分數 :
        (m.追續金額 * 0.25 + m.全部總業績 * 0.15 + m.實收 * 0.30 + m.追續客單價 * 0.15 + m.追續單數 * 100 * 0.15))
    };
  });
  const sorted = [...withWs].sort((a, b) => b._ws - a._ws);
  const wsRankOf = {};
  sorted.forEach((p, i) => { wsRankOf[p.姓名 || p.name] = i + 1; });

  return withWs.map((row, idx) => {
    if ((row.建議 || row.advice) && (row.建議 || row.advice).length > 20) return row;
    const m = row._m;
    const ws = row._ws;
    const above = withWs[idx - 1];
    const below = withWs[idx + 1];
    const gapUp   = above ? ((above._ws - ws) / above._ws * 100).toFixed(1) : null;
    const gapDown = below ? ((ws - below._ws) / ws * 100).toFixed(1) : null;
    const wsr = wsRankOf[row.姓名 || row.name];
    const trank = row.名次 || row.rank;
    const rc = (m.追續金額 || 0) * 2500;
    const ac = (m.實收 || 0) * 3000;
    const dc = (m.追續單數 || 0) * 1500;
    const tot = rc + ac + dc || 1;
    const mainMetric = ac/tot > 0.45 ? '實收' : (rc/tot > 0.35 ? '追續金額' : '追續單數');
    const dealCnt = m.追續單數;
    let advice = '';
    if (trank === 1) {
      const lead = gapDown || '0';
      advice = `你穩在榜首，但與第二名差距只有 ${lead}%，不算絕對安全。今天把${mainMetric}再補一筆，差距才能繼續拉開。榜首的位置靠守不住，靠今天繼續進攻才能穩。`;
    } else if (trank <= 4) {
      const rival = above ? (above.姓名 || above.name) : '';
      const threat = parseFloat(gapDown || '100') < 15 ? `下面距你只有 ${gapDown}%，有被追上的壓力。` : `下面距你 ${gapDown}%，位置尚穩。`;
      advice = `你跟${rival}差距 ${gapUp}%，${threat}今天把${mainMetric}當主方向，一筆有效成交就能縮短差距。前三不是你的終點，往前壓才是今天的任務。`;
    } else if (trank <= 10) {
      const wsNote = wsr < trank ? `你的權重排名第 ${wsr}，比傳統排名更靠前——` : '';
      const threatNote = parseFloat(gapDown || '100') < 12 ? `下面緊咬，差距只有 ${gapDown}%。` : '';
      advice = `你跟前一名差距 ${gapUp}%。${wsNote}${threatNote}今天把${mainMetric}集中突破，追續 ${dealCnt} 筆是你的槓桿，把努力轉成成交才能讓排名動起來。`;
    } else if (trank <= 18) {
      const wsNote = wsr !== trank ? `（權重實際排名第 ${wsr}）` : '';
      advice = `你跟前一名差距 ${gapUp}%${wsNote}。今天以${mainMetric}為主攻，別讓排名固定太久——${dealCnt > 5 ? `追續 ${dealCnt} 筆代表你在努力，` : ''}一筆有效成交就能讓位置動起來。`;
    } else {
      const action = dealCnt > 2 ? `追續 ${dealCnt} 筆是你的起點，把接觸轉成成交` : '今天先讓一筆業績落地';
      advice = `後段區有你，今天的目標只有一個：讓數字動。${action}，累積才是往前的路。不用看太遠，有一筆就是起點。`;
    }
    return { ...row, 建議: advice };
  });
}

function renderProportionalAdvice(rows) {
  const grid = refs.propAdviceGrid;
  if (!grid) return;
  const enriched = autoProportionalAdvice(rows);
  grid.replaceChildren(
    ...enriched.map((row) => {
      const card = document.createElement('article');
      const grpColor = GROUP_COLOR[row.分級 || row.group] || '#fff';
      card.className = `prop-card group-${row.分級 || row.group}`;
      card.innerHTML = `
        <div class="prop-card-header">
          <div class="prop-rank-name">
            <span class="prop-rank">#${safeHtml(String(row.名次 || row.rank))}</span>
            <strong class="prop-name">${safeHtml(row.姓名 || row.name)}</strong>
            ${(row.標記 || row.isNew) ? `<span class="newbie-tag">${safeHtml(row.標記 || '新人')}</span>` : ''}
          </div>
          <span class="prop-group-tag" style="color:${grpColor};border-color:${grpColor}40">${safeHtml(row.分級 || row.group)}</span>
        </div>
        ${(() => { const m = getMetrics(row); return m.AI分數 ? `<div class="prop-score">AI 分數 <strong>${safeHtml(Number(m.AI分數).toFixed(2))}</strong></div>` : ''; })()}
        <div class="prop-metrics">
          ${(() => { const m = getMetrics(row); return `
          <span>實收 <strong>${safeHtml(fmt(m.實收))}</strong></span>
          <span>追續金額 <strong>${safeHtml(fmt(m.追續金額))}</strong></span>
          <span>追續單數 <strong>${safeHtml(String(m.追續單數))}</strong></span>
          <span>客單價 <strong>${safeHtml(fmt(m.追續客單價))}</strong></span>
          `; })()}
        </div>
        <p class="prop-advice-text">${safeHtml(row.建議 || '')}</p>
      `;
      return card;
    })
  );
}

function renderScoringPolicy(snapshot) {
  const policy = snapshot?.scoringPolicy || {};
  const dates = snapshot?.standardData?.日期資訊 || {};
  if (refs.scoringPolicyTitle) {
    refs.scoringPolicyTitle.textContent = policy.title || 'AI 權重分數（比例原則）';
  }
  if (refs.scoringPolicyDate) {
    refs.scoringPolicyDate.textContent = `${dates.結算日 || '-'} → ${dates.派單日 || '-'}`;
  }
  if (refs.scoringPolicyDescription) {
    refs.scoringPolicyDescription.textContent = policy.description || '以今日業績比例換算權重分數。';
  }
  if (refs.scoringWeightGrid) {
    refs.scoringWeightGrid.replaceChildren(
      ...(policy.weights || []).map((item) => {
        const card = document.createElement('div');
        card.className = 'scoring-weight-card';
        card.innerHTML = `
          <span>${safeHtml(item.label || item.key)}</span>
          <strong>${safeHtml(fmt(item.weight))}</strong>
        `;
        return card;
      })
    );
  }
  if (refs.scoringPolicyFormula) {
    refs.scoringPolicyFormula.textContent = policy.formula || '';
  }
}

function render(snapshot) {
  state.current = snapshot;
  const data = snapshot?.standardData || {};
  const presentation = snapshot?.presentation || {};
  const rankingRows = asArray(data?.正式名次 || snapshot?.rankings || snapshot?.report?.rankings);
  const retired = asArray(presentation.retired || data?.審計結論?.['審計列示不入派單']);

  renderValidation(snapshot);
  renderHero(data, snapshot);
  renderOfficialLock(snapshot);
  renderSummaryCards(presentation.summaryCards || data?.整合總盤 || snapshot?.report?.audit?.summaryBoard || []);
  renderSpotlight((presentation.top5 || rankingRows).slice(0, 4));
  renderLeaderboard(presentation.top10 || rankingRows);
  const rankMap = {};
  rankingRows.forEach(row => {
    const name = normalizePersonName(row);
    if (name) rankMap[name] = row.名次 || row.rank;
  });
  renderGroups(data?.分級 || snapshot?.report?.groups || {}, rankMap);
  renderRetired(retired);
  renderRankingTable(rankingRows);
  renderAdvice(rankingRows);
  renderScoringPolicy(snapshot);
  renderProportionalAdvice(rankingRows);
  refs.compactOutput.value = snapshot?.announcement || data?.群組超精簡版 || snapshot?.groupShortText || buildPasteReadyAnnouncement(snapshot) || '';
}

async function loadCurrent() {
  setBadge(refs.inputStatus, 'PENDING', '載入正式版中');
  const { ok, payload } = await request('/api/current');
  if (!ok) {
    setBadge(refs.inputStatus, 'FAIL', payload.message || '載入失敗');
    return;
  }

  const snapshot = payload.data;
  refs.rawInput.value = '';
  render(snapshot);
  const dates = snapshot?.standardData?.日期資訊 || {};
  const dateLabel = (dates.結算日 && dates.派單日) ? `${dates.結算日}→${dates.派單日}` : 'LATEST';
  setBadge(refs.inputStatus, 'PASS', `已載入正式版 (${dateLabel})`);

  if (refs.healthStatus) {
    refs.healthStatus.textContent = 'ONLINE';
    refs.healthStatus.style.color = 'var(--pass)';
  }
}

async function auditCurrentInput(options = {}) {
  if (!refs.rawInput.value.trim()) {
    setBadge(refs.inputStatus, 'FAIL', '請先貼上公告或 JSON 後再審計');
    return;
  }
  if (!options.suppressPending) {
    setBadge(refs.inputStatus, 'PENDING', '後端審計中');
  }
  const { ok, payload } = await request('/api/audit', {
    method: 'POST',
    body: JSON.stringify({ rawText: refs.rawInput.value })
  });

  if (!payload.data) {
    if (options.overrideBadge) {
      setBadge(refs.inputStatus, options.overrideBadge.status, options.overrideBadge.text);
    } else {
      setBadge(refs.inputStatus, 'FAIL', payload.message || '審計失敗');
    }
    return;
  }

  render(payload.data);
  if (options.successBadge) {
    setBadge(refs.inputStatus, options.successBadge.status, options.successBadge.text);
  } else {
    setBadge(refs.inputStatus, 'PASS', '審計完成');
  }
  AudioManager.success();
}

async function saveCurrentReport() {
  if (!state.current) {
    setBadge(refs.inputStatus, 'FAIL', '請先進行審計後再儲存');
    return;
  }
  if (!state.current.validation?.ok) {
    setBadge(refs.inputStatus, 'FAIL', '審計未通過，無法儲存正式版');
    return;
  }

  setBadge(refs.inputStatus, 'PENDING', '正在儲存至系統...');
  const { ok, payload } = await request('/api/save', {
    method: 'POST',
    body: JSON.stringify({
      report: state.current.report || state.current,
      operator: 'admin',
      reason: 'manual-update'
    })
  });

  if (!ok) {
    setBadge(refs.inputStatus, 'FAIL', payload.message || '儲存失敗');
    return;
  }

  await loadCurrent();
  AudioManager.sweep();
}

function setup() {
  renderRules();
  setupLiveAudit();
  
  refs.btnLoad?.addEventListener('click', () => runAction(loadCurrent));
  refs.btnAudit?.addEventListener('click', () => runAction(() => auditCurrentInput()));
  refs.btnSave?.addEventListener('click', () => runAction(saveCurrentReport));
  refs.btnClear?.addEventListener('click', () => {
    refs.rawInput.value = '';
    refs.inputStatus.textContent = '等待輸入';
    refs.inputStatus.className = 'badge badge-neutral';
  });
  
  refs.btnCopyCompact?.addEventListener('click', () => {
    refs.compactOutput.select();
    document.execCommand('copy');
    const oldText = refs.btnCopyCompact.textContent;
    refs.btnCopyCompact.textContent = '已複製！';
    setTimeout(() => { refs.btnCopyCompact.textContent = oldText; }, 2000);
  });
  
  const btnSendLine = $('btn-send-line');
  btnSendLine?.addEventListener('click', async () => {
    let userId = localStorage.getItem('MY_LINE_USER_ID');
    if (!userId) {
      userId = prompt('請輸入您的 LINE User ID (U開頭字串) 以便傳送派單訊息至您的手機：\n(只需輸入一次，後續會自動記住)');
      if (!userId) return;
      localStorage.setItem('MY_LINE_USER_ID', userId.trim());
    }
    
    const url = window.location.href;
    const isLocal = url.includes('localhost') || url.includes('127.0.0.1');
    const warning = isLocal ? '\n\n⚠️ 注意：目前網址為 localhost，手機若非同一 WiFi 可能無法開啟。若要在手機查看，建議傳送正式的伺服器網址 (如 Render 或您的本機 IP)。' : '';
    
    const text = `🔥 【AI 派單戰情室已更新】\n\n最新的 AI 大數據排名、分級與專屬建議已出爐！\n👉 請立即點擊下方專屬連結，進入「至尊指揮中心」查看前四名榮耀榜與完整面板：\n\n🔗 戰情室網址：\n${url}${warning}`;
    
    const oldText = btnSendLine.textContent;
    btnSendLine.textContent = '傳送中...';
    btnSendLine.disabled = true;
    
    try {
      const res = await fetch('/api/line/notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: userId, text: text })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        btnSendLine.textContent = '✅ 已傳送至您的 LINE';
      } else {
        btnSendLine.textContent = '❌ 傳送失敗';
        alert('傳送失敗：' + (data.error || '未知的錯誤'));
      }
    } catch (e) {
      btnSendLine.textContent = '❌ 連線失敗';
      alert('連線失敗：' + e.message);
    } finally {
      setTimeout(() => { 
        btnSendLine.textContent = oldText;
        btnSendLine.disabled = false;
      }, 3000);
    }
  });

  loadCurrent();
}

document.addEventListener('DOMContentLoaded', setup);
