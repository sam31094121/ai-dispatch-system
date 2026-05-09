/**
 * AI Dispatch System - Cyber Command Center (5D Meditation Edition)
 * Optimized for high-performance data rendering and visual immersion.
 */

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
  '排序邏輯：權重分數 → 實收業績 → 追續金額 → 總額 → 客單價 → 單數。',
  'AI 計分核心：10000 分制比例原則。',
  '智慧分級：A1 (1-4) / A2 (5-11) / B (12-18) / C (19+)。',
  '自動化審計：精準排除異動與離職列示。',
  '數據同步：支援 API 雙向存取與手動智慧修正。',
  '版本控制：所有變更均留存歷史紀錄。'
];

const state = { current: null, busy: false };

const actionButtons = [
  refs.btnLoad, refs.btnAudit, refs.btnSave, refs.btnFix, 
  refs.btnClear, refs.btnCopyCompact, $('btn-send-line')
].filter(Boolean);

function fmt(value) { return numberFormatter.format(Number(value || 0)); }

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
  if (!numTarget) { el.textContent = '0'; return; }
  const t0 = performance.now();
  function tick(now) {
    const p = Math.min((now - t0) / duration, 1);
    const ease = p === 1 ? 1 : 1 - Math.pow(2, -10 * p);
    el.textContent = numberFormatter.format(Math.round(numTarget * ease));
    if (p < 1) requestAnimationFrame(tick);
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
  actionButtons.forEach(btn => btn.disabled = isBusy);
}

async function runAction(task) {
  if (state.busy) return;
  setBusy(true);
  try { await task(); } catch (error) {
    console.error('[UI Action]', error);
    setBadge(refs.inputStatus, 'FAIL', error?.message || '操作失敗');
  } finally { setBusy(false); }
}

function asArray(value) { return Array.isArray(value) ? value : []; }
function normalizePersonName(row) { return row?.姓名 || row?.name || ''; }
function safeHtml(value) { return String(value || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }

const AudioManager = {
  ctx: null,
  init() { if (!this.ctx) this.ctx = new (window.AudioContext || window.webkitAudioContext)(); },
  resume() { this.init(); if (this.ctx.state === 'suspended') this.ctx.resume(); },
  play(freq, type = 'sine', duration = 0.1, vol = 0.1) {
    this.init();
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
    gain.gain.setValueAtTime(vol, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + duration);
    osc.connect(gain); gain.connect(this.ctx.destination);
    osc.start(); osc.stop(this.ctx.currentTime + duration);
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
    osc.connect(gain); gain.connect(this.ctx.destination);
    osc.start(); osc.stop(this.ctx.currentTime + 0.5);
  }
};

const CoinSoundSystem = {
  enabled: false,
  timers: [],
  impactPattern: [
    { t: 0, f: 1450, v: 0.030 }, { t: 180, f: 1220, v: 0.022 }, { t: 420, f: 1760, v: 0.026 },
    { t: 760, f: 980, v: 0.018 }, { t: 1060, f: 1580, v: 0.024 }, { t: 2920, f: 1040, v: 0.018 }
  ],
  playImpact(freq = 1400, vol = 0.025) {
    AudioManager.resume();
    const ctx = AudioManager.ctx;
    const now = ctx.currentTime;
    const gain = ctx.createGain();
    const osc = ctx.createOscillator();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq, now);
    gain.gain.setValueAtTime(vol, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.18);
    osc.connect(gain); gain.connect(ctx.destination);
    osc.start(now); osc.stop(now + 0.18);
  },
  start() { if (this.enabled) return; this.enabled = true; AudioManager.resume(); this.scheduleLoop(); },
  scheduleLoop() {
    if (!this.enabled) return;
    this.clear();
    this.impactPattern.forEach(item => {
      this.timers.push(setTimeout(() => {
        if (this.enabled) this.playImpact(item.f + (Math.random()-0.5)*100, item.v);
      }, item.t));
    });
    this.timers.push(setTimeout(() => this.scheduleLoop(), 3300));
  },
  clear() { this.timers.forEach(clearTimeout); this.timers = []; },
  stop() { this.enabled = false; this.clear(); }
};

function setupOfficialLockCoins() {
  const panel = refs.officialLockPanel;
  if (!panel) return;
  setupOfficialMoneyRain(panel);
  let armed = false;
  const arm = () => { if (armed) return; armed = true; CoinSoundSystem.start(); };
  panel.addEventListener('pointerenter', arm, { once: true });
}

function setupOfficialMoneyRain(panel) {
  const canvas = $('official-money-rain');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let width, height, dpr;
  const particles = [];
  function resize() {
    const rect = canvas.getBoundingClientRect();
    width = rect.width; height = rect.height; dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr; canvas.height = height * dpr;
    ctx.scale(dpr, dpr);
  }
  function spawn() {
    particles.push({
      x: Math.random() * width, y: -20,
      vy: 100 + Math.random() * 200,
      size: 5 + Math.random() * 10
    });
  }
  function frame() {
    ctx.clearRect(0, 0, width, height);
    if (Math.random() < 0.1) spawn();
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.y += p.vy * 0.016;
      ctx.fillStyle = '#ffd700';
      ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI*2); ctx.fill();
      if (p.y > height) particles.splice(i, 1);
    }
    requestAnimationFrame(frame);
  }
  resize(); window.addEventListener('resize', resize); frame();
}

let auditTimeout = null;
function setupLiveAudit() {
  refs.rawInput?.addEventListener('input', () => {
    refs.inputStatus.textContent = '掃描中...';
    clearTimeout(auditTimeout);
    auditTimeout = setTimeout(async () => {
      const content = refs.rawInput.value.trim();
      if (!content) return;
      AudioManager.click();
      const { ok, payload } = await request('/api/audit', {
        method: 'POST',
        body: JSON.stringify({ rawText: content })
      });
      if (payload.data) renderValidation(payload.data);
    }, 800);
  });
}

async function request(url, options = {}) {
  try {
    const res = await fetch(url, {
      cache: 'no-store',
      headers: { 'Content-Type': 'application/json' },
      ...options
    });
    const payload = await res.json();
    return { ok: res.ok && payload.success !== false, payload };
  } catch (e) {
    return { ok: false, payload: { success: false, message: '連線失敗' } };
  }
}

function renderRules() {
  refs.rulesList.replaceChildren(...LOCKED_RULES.map(rule => {
    const li = document.createElement('li'); li.textContent = rule; return li;
  }));
}

function renderValidation(snapshot) {
  const v = snapshot?.validation || {};
  const s = v.summary || {};
  const status = v.status || 'PENDING';
  setBadge(refs.auditResultBadge, status, status === 'PASS' ? '審計通過' : '檢查失敗');

  refs.validationSummary.innerHTML = `
    <div class="audit-stats-grid">
      <div class="stat-box"><span>審計結果</span><strong class="text-${status.toLowerCase()}">${safeHtml(s.審計結果 || status)}</strong></div>
      <div class="stat-box"><span>正式人數</span><strong>${s.正式人數 || '-'}</strong></div>
      <div class="stat-box"><span>本月業績</span><strong>${fmt(s.本月業績 || 0)}</strong></div>
    </div>
  `;

  const issues = [
    ...(v.errors || []).map(t => ({ tone: 'error', text: t, label: 'ERR' })),
    ...(v.warnings || []).map(t => ({ tone: 'warn', text: t, label: 'WRN' }))
  ];
  refs.validationIssues.replaceChildren(...(issues.length ? issues.map(i => {
    const div = document.createElement('div');
    div.className = `issue-item ${i.tone}`;
    div.innerHTML = `<span class="issue-label">${i.label}</span><span class="issue-text">${safeHtml(i.text)}</span>`;
    return div;
  }) : [Object.assign(document.createElement('div'), { className: 'issue-item pass', innerHTML: '審計通過。' })]));
}

function renderHero(data, snapshot) {
  const result = snapshot?.validation?.status || 'FAIL';
  const dates = data?.日期資訊 || {};
  refs.announcementTitle.innerHTML = `${safeHtml(data?.公告標題 || 'AI 派單公告')} <span class="integrity-badge">AI 數據審核</span>`;
  refs.dateRange.textContent = `${dates.結算日 || '-'} → ${dates.派單日 || '-'}`;
  refs.auditResult.textContent = result;
  refs.auditResult.className = `audit-hero ${result === 'PASS' ? 'audit-pass' : 'audit-fail'}`;
  refs.healthStatus.textContent = 'ONLINE';
  refs.persistStatus.textContent = snapshot?.persisted ? '正式版' : '預覽中';
}

function renderOfficialLock(snapshot) {
  if (!refs.officialLockPanel) return;
  const ranking = asArray(snapshot?.ranking);
  const groups = snapshot?.groups || {};
  refs.officialLockStatus.textContent = ranking.length ? '正式派單順序已鎖定' : '等待派單';
  refs.officialLockTop10.innerHTML = ranking.slice(0, 10).map(r => `<span class="official-rank-chip">#${r.rank} ${r.name}</span>`).join('');
}

function renderSummaryCards(cards) {
  const entries = Array.isArray(cards) ? cards : Object.entries(cards || {});
  refs.summaryGrid.replaceChildren(...entries.map(([label, value]) => {
    const art = document.createElement('article');
    art.className = 'summary-card';
    art.innerHTML = `<div class="summary-card-inner"><p>${safeHtml(label)}</p><strong>${fmt(value)}</strong></div>`;
    return art;
  }));
}

function renderSpotlight(rows) {
  refs.spotlightGrid.replaceChildren(...asArray(rows).slice(0, 4).map((r, i) => {
    const m = getMetrics(r);
    const art = document.createElement('article');
    art.className = `spotlight-card rank-${i+1}`;
    art.innerHTML = `<h3>#${r.名次 || r.rank} ${r.姓名 || r.name}</h3><div class="spotlight-stats"><span>實收 ${fmt(m.實收)}</span></div>`;
    return art;
  }));
}

function renderLeaderboard(rows) {
  refs.leaderboard.replaceChildren(...asArray(rows).map(r => {
    const div = document.createElement('article');
    div.className = 'leader-row';
    div.innerHTML = `<strong>#${r.名cl || r.rank}</strong> <span>${r.姓名 || r.name}</span>`;
    return div;
  }));
}

function renderGroups(groups) {
  const order = ['A1', 'A2', 'B', 'C'];
  refs.groupsGrid.replaceChildren(...order.map(k => {
    const names = asArray(groups[k]);
    const art = document.createElement('article');
    art.className = `group-card group-${k}`;
    art.innerHTML = `<div class="group-head"><strong>${k}</strong><span>${names.length}人</span></div>`;
    return art;
  }));
}

function renderRankingTable(rows) {
  refs.rankingTableBody.innerHTML = asArray(rows).map(r => {
    const m = getMetrics(r);
    return `<tr><td>${r.名次}</td><td>${r.姓名}</td><td>${r.分級}</td><td>${fmt(m.實收)}</td></tr>`;
  }).join('');
}

function render(snapshot) {
  state.current = snapshot;
  const data = snapshot?.standardData || {};
  const rankings = asArray(data?.正式名次 || snapshot?.rankings);
  renderValidation(snapshot);
  renderHero(data, snapshot);
  renderOfficialLock(snapshot);
  renderSummaryCards(data?.整合總盤 || []);
  renderSpotlight(rankings);
  renderLeaderboard(rankings);
  renderGroups(data?.分級 || {});
  renderRankingTable(rankings);
}

async function loadCurrent() {
  const { ok, payload } = await request('/api/current');
  if (ok) render(payload.data);
}

async function auditCurrentInput() {
  const { ok, payload } = await request('/api/audit', {
    method: 'POST',
    body: JSON.stringify({ rawText: refs.rawInput.value })
  });
  if (ok) render(payload.data);
}

async function saveCurrentReport() {
  const { ok } = await request('/api/save', {
    method: 'POST',
    body: JSON.stringify({ report: state.current })
  });
  if (ok) loadCurrent();
}

function setup() {
  renderRules();
  setupLiveAudit();
  setupOfficialLockCoins();
  
  // 5D 核心影片與全局播放解鎖
  const video = document.getElementById('meditation-core');
  const unlockPlay = () => {
    if (video) video.play().catch(() => {});
    document.removeEventListener('click', unlockPlay);
    document.removeEventListener('keydown', unlockPlay);
  };
  document.addEventListener('click', unlockPlay);
  document.addEventListener('keydown', unlockPlay);
  
  if (video) video.play().catch(() => console.log('Autoplay blocked, waiting for interaction.'));

  refs.btnLoad?.addEventListener('click', () => runAction(loadCurrent));
  refs.btnAudit?.addEventListener('click', () => runAction(auditCurrentInput));
  refs.btnSave?.addEventListener('click', () => runAction(saveCurrentReport));
  refs.btnClear?.addEventListener('click', () => { refs.rawInput.value = ''; });
  
  loadCurrent();
}

document.addEventListener('DOMContentLoaded', setup);
