/**
 * AI Dispatch System - 5D Ultimate Cyber Screen (Final Master)
 * Optimized for High-End Visualization - 2026-05-09
 */

const $ = (id) => document.getElementById(id);
const numberFormatter = new Intl.NumberFormat('zh-TW');
const fmt = (v) => numberFormatter.format(Number(v || 0));
const safeHtml = (v) => String(v || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const state = { current: null, busy: false };

const refs = {
    pageTitle: $('page-title'),
    pageSubtitle: $('page-subtitle'),
    dateRange: $('date-range'),
    rawInput: $('raw-input'),
    inputStatus: $('input-status'),
    btnLoad: $('btn-load'),
    btnAudit: $('btn-audit'),
    btnSave: $('btn-save'),
    btnClear: $('btn-clear'),
    btnSendLine: $('btn-send-line'),
    auditResultBadge: $('audit-result-badge'),
    validationSummary: $('validation-summary'),
    validationIssues: $('validation-issues'),
    summaryGrid: $('summary-grid'),
    spotlightGrid: $('spotlight-grid'),
    leaderboard: $('leaderboard'),
    groupsGrid: $('groups-grid'),
    retiredList: $('retired-list'),
    adviceList: $('advice-list'),
    rulesList: $('rules-list'),
    clock: $('live-clock')
};

const LOCKED_RULES = [
    '後端智慧動態核算：三平台數據自動校驗。',
    'AI 10000 分制比例原則：實收、追續、總業績權重鎖定。',
    '排序邏輯：權重分數 > 實收 > 追續金額 > 客單價。',
    '分級標準：A1 (1-4) / A2 (5-11) / B (12-18) / C (19+)。'
];

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
    success() { this.play(1200, 'triangle', 0.3, 0.08); },
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

function triggerPenetrationEffect() {
    const container = document.body;
    for (let i = 0; i < 16; i++) {
        const line = document.createElement('div');
        line.className = 'data-stream-line';
        const angle = (i / 16) * Math.PI * 2;
        line.style.top = '50%'; line.style.left = '50%';
        line.style.width = '0'; line.style.opacity = '1';
        line.style.transform = `rotate(${angle}rad)`;
        container.appendChild(line);
        line.animate([
            { width: '0', opacity: 1 },
            { width: '1500px', opacity: 0 }
        ], { duration: 800, easing: 'cubic-bezier(0.2, 1, 0.3, 1)' }).onfinish = () => line.remove();
    }
    const video = $('meditation-core');
    if (video) {
        video.animate([
            { filter: 'brightness(1) saturate(1.2)' },
            { filter: 'brightness(3) saturate(2)' },
            { filter: 'brightness(0.7) saturate(1.2)' }
        ], { duration: 600, easing: 'ease-out' });
    }
}

function setup3DTilt() {
  const cards = document.querySelectorAll('.spotlight-card');
  cards.forEach(card => {
    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      const rotateX = (y - centerY) / 10;
      const rotateY = (centerX - x) / 10;
      card.style.transform = `translateZ(50px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
    });
    card.addEventListener('mouseleave', () => {
      card.style.transform = `translateZ(0) rotateX(0) rotateY(0)`;
    });
  });
}

function renderValidation(snapshot) {
    const v = snapshot?.validation || {};
    const s = v.summary || {};
    const status = v.status || 'PENDING';
    if (refs.auditResultBadge) {
        refs.auditResultBadge.textContent = status === 'PASS' ? '審計通過' : '檢查異常';
        refs.auditResultBadge.className = `badge badge-${status.toLowerCase()}`;
    }

    refs.validationSummary.innerHTML = `
        <div class="audit-stats-grid">
            <div class="stat-box"><span>結果</span><strong class="${status.toLowerCase()}">${s.審計結果 || status}</strong></div>
            <div class="stat-box"><span>人數</span><strong>${s.正式人數 || '-'}</strong></div>
            <div class="stat-box"><span>總業績</span><strong>${fmt(s.本月業績 || 0)}</strong></div>
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
    }) : [Object.assign(document.createElement('div'), { className: 'issue-item pass', innerHTML: '數據校驗無誤' })]));
}

function renderRanking(rows) {
    if (!rows || !rows.length) return;
    const maxRevenue = Math.max(...rows.map(r => r.metrics?.實收 || r.實收 || 0));
    
    refs.spotlightGrid.replaceChildren(...rows.slice(0, 4).map((r, i) => {
        const rev = r.metrics?.實收 || r.實收 || 0;
        const powerPct = (rev / maxRevenue) * 100;
        const art = document.createElement('article');
        art.className = `spotlight-card rank-${i+1}`;
        art.innerHTML = `
            <div class="hud-corner hud-tl"></div>
            <div class="hud-corner hud-br"></div>
            ${i === 0 ? '<div class="victory-badge"></div>' : ''}
            <p class="eyebrow">CHAMPION TIER</p>
            <h3>#${r.rank || r.名次} ${r.name || r.姓名}</h3>
            <div class="spotlight-stats">
                <div class="stat-main">實收 ${fmt(rev)}</div>
                <div class="stat-sub">權重分數: ${Number(r.metrics?.正式權重分數 || 0).toFixed(0)}</div>
            </div>
            <div class="power-level-container">
                <div class="power-bar" style="width: ${powerPct}%"></div>
            </div>
        `;
        return art;
    }));

    refs.leaderboard.replaceChildren(...rows.map(r => {
        const div = document.createElement('div');
        div.className = 'leader-row';
        div.innerHTML = `<strong>#${r.rank || r.名次}</strong> <span>${r.name || r.姓名}</span> <em>AI ${Number(r.metrics?.正式權重分數 || r.metrics?.weightedScore || 0).toFixed(2)}</em>`;
        return div;
    }));
}

function render(snapshot) {
    state.current = snapshot;
    const data = snapshot?.standardData || {};
    const rankings = data?.正式名次 || snapshot?.rankings || [];
    const dates = data?.日期資訊 || {};
    
    refs.pageTitle.textContent = `5/9 派單審判作業 (${dates.結算日 || '5/8'} 結算)`;
    if (refs.dateRange) refs.dateRange.textContent = `${dates.結算日 || '5/8'} → ${dates.派單日 || '5/9'}`;
    
    renderValidation(snapshot);
    renderRanking(rankings);
    
    const groups = data?.分級 || snapshot?.report?.groups || {};
    refs.groupsGrid.replaceChildren(...['A1','A2','B','C'].map(k => {
        const names = groups[k] || [];
        const art = document.createElement('article');
        art.className = `group-card group-${k}`;
        art.innerHTML = `<div class="group-head"><strong>${k}</strong><span>${names.length}人</span></div><div class="group-names">${names.join('、')}</div>`;
        return art;
    }));
    
    setTimeout(setup3DTilt, 100);
}

async function request(url, options = {}) {
    try {
        const res = await fetch(url, { cache: 'no-store', headers: { 'Content-Type': 'application/json' }, ...options });
        const payload = await res.json();
        return { ok: res.ok && payload.success !== false, payload };
    } catch (e) { return { ok: false, payload: { success: false, message: '連線異常' } }; }
}

async function runAction(task) {
    if (state.busy) return;
    state.busy = true;
    try { await task(); } finally { state.busy = false; }
}

async function loadCurrent() {
    const { ok, payload } = await request('/api/current');
    if (ok) render(payload.data);
}

async function auditCurrentInput() {
    const rawText = refs.rawInput.value.trim();
    if (!rawText) return;
    setBadge(refs.inputStatus, 'PENDING', 'SCANNING...');
    document.body.classList.add('scanning-active');
    
    const { ok, payload } = await request('/api/audit', { method: 'POST', body: JSON.stringify({ rawText }) });
    document.body.classList.remove('scanning-active');
    
    if (ok) {
        render(payload.data);
        triggerPenetrationEffect();
        AudioManager.success();
        setBadge(refs.inputStatus, 'PASS', 'SUCCESS');
    } else {
        setBadge(refs.inputStatus, 'FAIL', 'FAILED');
    }
}

async function saveCurrentReport() {
    const rawText = refs.rawInput.value.trim();
    if (!rawText) return;
    const { ok } = await request('/api/save', { method: 'POST', body: JSON.stringify({ rawText }) });
    if (ok) {
        AudioManager.sweep();
        triggerPenetrationEffect();
        await loadCurrent();
    }
}

function setup() {
    refs.rulesList.innerHTML = LOCKED_RULES.map(r => `<li>${r}</li>`).join('');
    setInterval(() => { if (refs.clock) refs.clock.textContent = new Date().toLocaleTimeString('en-GB'); }, 1000);
    
    const video = $('meditation-core');
    const unlock = () => { if (video) video.play().catch(() => {}); document.removeEventListener('click', unlock); };
    document.addEventListener('click', unlock);

    refs.btnLoad?.addEventListener('click', () => { AudioManager.click(); runAction(loadCurrent); });
    refs.btnAudit?.addEventListener('click', () => runAction(auditCurrentInput));
    refs.btnSave?.addEventListener('click', () => runAction(saveCurrentReport));
    refs.btnClear?.addEventListener('click', () => {
        refs.rawInput.value = '';
        setBadge(refs.inputStatus, 'PENDING', 'IDLE');
    });

    runAction(loadCurrent);
}

document.addEventListener('DOMContentLoaded', setup);
