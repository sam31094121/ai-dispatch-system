
function getMovement(row) {
  const currentRank = Number(row.?活 || row.rank || 0);
  const prevRank = Number(row.銝憚?活 || row.prevRank || 0);
  
  if (!prevRank || prevRank === 0) return { class: 'new', arrow: 'NEW' };
  if (currentRank < prevRank) return { class: 'up', arrow: '?? };
  if (currentRank > prevRank) return { class: 'down', arrow: '?? };
  return { class: 'flat', arrow: '嚗? };
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
  '敺垢?箸???貊???,
  '?舀憭雁摨行平蝮曉??啜?,
  '???摩嚗迤撘???????撖行蝮賣平蝮???餈賜??? ???券蝮賡? ??餈賜?摰Ｗ????餈賜??格??,
  'AI 閮??詨?嚗?0000 ?瘥??? (3000/2500/1500/1500/1500)??,
  '?箸??嚗1 (1-4) / A2 (5-11) / B (12-18) / C (19+)??,
  '?芸??祟閮?蝎暹???啣???瑕?蝷箝?,
  '?豢??郊嚗??API ??摮?????找耨甇??,
  '??批嚗????游???甇瑕蝝???舀蝘?????
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
    撖行:     fieldVal(row, '撖行', '撖行蝮賡?憿?, '撖行蝮賣平蝮?, 'actualRevenue'),
    餈賜???: fieldVal(row, '餈賜???', '蝥??', '餈賜??桅?憿?, 'renewalRevenue'),
    ?券蝮賣平蝮? fieldVal(row, '?券蝮賣平蝮?, '蝮賣平蝮?, 'totalRevenue'),
    餈賜?摰Ｗ?? fieldVal(row, '餈賜?摰Ｗ??, 'avgRenewal'),
    餈賜??格:  fieldVal(row, '餈賜??格', '餈賜??漱蝮賣', 'renewalDeals'),
    AI?:   fieldVal(row, '甇??甈??', 'AI甈??', 'weightedScore', 'totalScore')
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
    setBadge(refs.inputStatus, 'FAIL', error?.message || '??憭望?嚗?蝔??岫');
  } finally {
    setBusy(false);
  }
}

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function normalizePersonName(row) {
  return row?.憪? || row?.name || '';
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
  resume() { this.init(); if (this.ctx.state === 'suspended') this.ctx.resume(); },
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

const CoinSoundSystem = {
  enabled: false,
  timers: [],
  impactPattern: [
    { t: 0, f: 1450, v: 0.030 },
    { t: 180, f: 1220, v: 0.022 },
    { t: 420, f: 1760, v: 0.026 },
    { t: 760, f: 980, v: 0.018 },
    { t: 1060, f: 1580, v: 0.024 },
    { t: 1380, f: 1120, v: 0.020 },
    { t: 1720, f: 1880, v: 0.028 },
    { t: 2140, f: 1320, v: 0.021 },
    { t: 2540, f: 1640, v: 0.024 },
    { t: 2920, f: 1040, v: 0.018 }
  ],
  playImpact(freq = 1400, vol = 0.025) {
    AudioManager.resume();
    const ctx = AudioManager.ctx;
    const now = ctx.currentTime;
    const gain = ctx.createGain();
    const ping = ctx.createOscillator();
    const body = ctx.createOscillator();
    const filter = ctx.createBiquadFilter();

    ping.type = 'triangle';
    body.type = 'sine';
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(freq * 0.82, now);
    filter.Q.setValueAtTime(8, now);
    ping.frequency.setValueAtTime(freq, now);
    ping.frequency.exponentialRampToValueAtTime(Math.max(360, freq * 0.38), now + 0.11);
    body.frequency.setValueAtTime(freq * 0.52, now);
    body.frequency.exponentialRampToValueAtTime(Math.max(220, freq * 0.22), now + 0.16);
    gain.gain.setValueAtTime(vol, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.18);

    ping.connect(filter);
    body.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    ping.start(now);
    body.start(now + 0.008);
    ping.stop(now + 0.18);
    body.stop(now + 0.20);
  },
  start() {
    if (this.enabled) return;
    this.enabled = true;
    AudioManager.resume();
    this.scheduleLoop();
  },
  scheduleLoop() {
    if (!this.enabled) return;
    this.clear();
    this.impactPattern.forEach((item) => {
      this.timers.push(setTimeout(() => {
        if (!this.enabled) return;
        const wobble = (Math.random() - 0.5) * 140;
        this.playImpact(item.f + wobble, item.v);
      }, item.t));
    });
    this.timers.push(setTimeout(() => this.scheduleLoop(), 3300));
  },
  clear() {
    this.timers.forEach((timer) => clearTimeout(timer));
    this.timers = [];
  },
  stop() {
    this.enabled = false;
    this.clear();
  }
};

function setupOfficialLockCoins() {
  const panel = refs.officialLockPanel;
  if (!panel) return;
  setupOfficialMoneyRain(panel);
  let armed = false;
  const arm = () => {
    if (armed) return;
    armed = true;
    panel.classList.add('official-coin-sound-on');
    CoinSoundSystem.start();
  };
  panel.addEventListener('pointerenter', arm, { once: true });
  panel.addEventListener('click', arm, { once: true });
  panel.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' || event.key === ' ') arm();
  }, { once: true });
}

function setupOfficialMoneyRain(panel) {
  const canvas = $('official-money-rain');
  if (!canvas) return;
  const ctx = canvas.getContext('2d', { alpha: true });
  if (!ctx) return;

  const particles = [];
  const pile = [];
  let width = 0;
  let height = 0;
  let dpr = 1;
  let last = performance.now();
  let spawned = 0;
  const maxVisible = 840;
  const lifetimeTarget = 10000;

  function resize() {
    const rect = canvas.getBoundingClientRect();
    width = Math.max(1, rect.width);
    height = Math.max(1, rect.height);
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function makeSprite(widthPx, heightPx, painter) {
    const sprite = document.createElement('canvas');
    sprite.width = widthPx;
    sprite.height = heightPx;
    const spriteCtx = sprite.getContext('2d');
    painter(spriteCtx, widthPx, heightPx);
    return sprite;
  }

  function drawMapleRelief(targetCtx, cx, cy, scale) {
    targetCtx.save();
    targetCtx.translate(cx, cy);
    targetCtx.scale(scale, scale);
    targetCtx.beginPath();
    targetCtx.moveTo(0, -30);
    targetCtx.lineTo(7, -13);
    targetCtx.lineTo(21, -22);
    targetCtx.lineTo(17, -6);
    targetCtx.lineTo(32, -4);
    targetCtx.lineTo(18, 6);
    targetCtx.lineTo(23, 21);
    targetCtx.lineTo(7, 14);
    targetCtx.lineTo(3, 32);
    targetCtx.lineTo(-3, 32);
    targetCtx.lineTo(-7, 14);
    targetCtx.lineTo(-23, 21);
    targetCtx.lineTo(-18, 6);
    targetCtx.lineTo(-32, -4);
    targetCtx.lineTo(-17, -6);
    targetCtx.lineTo(-21, -22);
    targetCtx.lineTo(-7, -13);
    targetCtx.closePath();
    targetCtx.fill();
    targetCtx.stroke();
    targetCtx.restore();
  }

  function createCoinSprite(seed = 0) {
    return makeSprite(160, 160, (g, w, h) => {
      const cx = w / 2;
      const cy = h / 2;
      g.clearRect(0, 0, w, h);

      g.shadowColor = 'rgba(0,0,0,.46)';
      g.shadowBlur = 14;
      g.shadowOffsetY = 9;
      const side = g.createLinearGradient(cx - 58, cy + 18, cx + 58, cy + 18);
      side.addColorStop(0, '#4b2205');
      side.addColorStop(0.18, '#b86f14');
      side.addColorStop(0.48, '#f7c44a');
      side.addColorStop(0.78, '#8a4308');
      side.addColorStop(1, '#3b1a04');
      g.fillStyle = side;
      g.beginPath();
      g.ellipse(cx, cy + 12, 64, 58, 0, 0, Math.PI * 2);
      g.fill();
      g.shadowColor = 'transparent';

      const metal = g.createRadialGradient(cx - 32, cy - 34, 7, cx + 8, cy + 8, 72);
      metal.addColorStop(0, '#fffbe0');
      metal.addColorStop(0.13, '#fff0a5');
      metal.addColorStop(0.27, '#d99a22');
      metal.addColorStop(0.46, '#ffdb66');
      metal.addColorStop(0.62, '#9b520c');
      metal.addColorStop(0.82, '#f0b43b');
      metal.addColorStop(1, '#5a2605');
      g.fillStyle = metal;
      g.beginPath();
      g.ellipse(cx, cy, 62, 62, 0, 0, Math.PI * 2);
      g.fill();

      g.save();
      g.beginPath();
      g.ellipse(cx, cy, 62, 62, 0, 0, Math.PI * 2);
      g.clip();
      for (let i = 0; i < 110; i += 1) {
        const a = ((i * 137 + seed * 29) % 360) * Math.PI / 180;
        const r = 8 + ((i * 17 + seed * 11) % 54);
        const x = cx + Math.cos(a) * r;
        const y = cy + Math.sin(a) * r;
        g.save();
        g.translate(x, y);
        g.rotate(a + Math.PI / 2);
        g.globalAlpha = i % 4 === 0 ? 0.22 : 0.10;
        g.strokeStyle = i % 3 === 0 ? '#fff4ba' : '#5c2605';
        g.lineWidth = i % 5 === 0 ? 1.2 : 0.6;
        g.beginPath();
        g.moveTo(-4, 0);
        g.lineTo(4 + (i % 7), 0);
        g.stroke();
        g.restore();
      }
      g.restore();

      g.save();
      g.translate(cx, cy);
      g.rotate(seed * 0.16);
      for (let i = 0; i < 96; i += 1) {
        g.rotate(Math.PI * 2 / 96);
        g.strokeStyle = i % 2 ? 'rgba(64,26,4,.76)' : 'rgba(255,244,180,.72)';
        g.lineWidth = 1.35;
        g.beginPath();
        g.moveTo(0, -62);
        g.lineTo(0, -52.5);
        g.stroke();
      }
      g.restore();

      g.strokeStyle = 'rgba(255,248,198,.82)';
      g.lineWidth = 3.6;
      g.beginPath();
      g.ellipse(cx, cy, 50, 50, 0, 0, Math.PI * 2);
      g.stroke();
      g.strokeStyle = 'rgba(73,31,4,.62)';
      g.lineWidth = 2.2;
      g.beginPath();
      g.ellipse(cx, cy, 42, 42, 0, 0, Math.PI * 2);
      g.stroke();

      g.fillStyle = 'rgba(70,30,4,.40)';
      g.strokeStyle = 'rgba(255,244,178,.46)';
      g.lineWidth = 1.35;
      drawMapleRelief(g, cx, cy + 3, 1.08);

      g.globalAlpha = 0.42;
      g.strokeStyle = '#fff8cf';
      g.lineWidth = 6;
      g.beginPath();
      g.arc(cx - 12, cy - 15, 42, Math.PI * 1.04, Math.PI * 1.54);
      g.stroke();
      g.globalAlpha = 1;

      const glare = g.createLinearGradient(cx - 58, cy - 55, cx + 52, cy + 42);
      glare.addColorStop(0, 'rgba(255,255,255,0)');
      glare.addColorStop(0.34, 'rgba(255,255,255,.22)');
      glare.addColorStop(0.42, 'rgba(255,255,255,.05)');
      glare.addColorStop(1, 'rgba(255,255,255,0)');
      g.fillStyle = glare;
      g.beginPath();
      g.ellipse(cx, cy, 61, 61, 0, 0, Math.PI * 2);
      g.fill();
    });
  }

  function createBillSprite(seed = 0) {
    return makeSprite(240, 116, (g, w, h) => {
      g.clearRect(0, 0, w, h);
      g.save();
      g.translate(8, 8);
      g.shadowColor = 'rgba(0,0,0,.26)';
      g.shadowBlur = 9;
      g.shadowOffsetY = 5;
      const paper = g.createLinearGradient(0, 0, w - 16, h - 16);
      paper.addColorStop(0, '#f4f1d7');
      paper.addColorStop(0.34, '#c9d8b9');
      paper.addColorStop(0.62, '#edf1d8');
      paper.addColorStop(1, '#a9c7a1');
      g.fillStyle = paper;
      g.beginPath();
      g.roundRect(0, 0, w - 16, h - 16, 7);
      g.fill();
      g.shadowColor = 'transparent';
      g.strokeStyle = 'rgba(37,88,52,.76)';
      g.lineWidth = 2;
      g.stroke();

      g.save();
      g.clip();
      for (let i = 0; i < 90; i += 1) {
        const x = (i * 37 + seed * 23) % (w - 16);
        const y = (i * 19 + seed * 31) % (h - 16);
        g.fillStyle = i % 2 ? 'rgba(28,96,53,.08)' : 'rgba(255,255,230,.18)';
        g.fillRect(x, y, 1.3, 1);
      }
      g.globalAlpha = 0.13;
      g.strokeStyle = '#245f3d';
      g.lineWidth = 0.9;
      for (let i = -h; i < w + h; i += 8) {
        g.beginPath();
        g.moveTo(i, 0);
        g.lineTo(i - h * 0.8, h);
        g.stroke();
      }
      g.globalAlpha = 1;
      g.restore();

      g.strokeStyle = 'rgba(29,92,50,.56)';
      g.lineWidth = 1.4;
      g.strokeRect(12, 10, w - 40, h - 36);
      g.strokeStyle = 'rgba(29,92,50,.28)';
      g.strokeRect(20, 18, w - 56, h - 52);

      g.fillStyle = 'rgba(31,90,49,.18)';
      g.beginPath();
      g.ellipse((w - 16) / 2, (h - 16) / 2, 31, 38, 0, 0, Math.PI * 2);
      g.fill();
      g.strokeStyle = 'rgba(30,83,47,.56)';
      g.lineWidth = 1.6;
      g.stroke();
      g.beginPath();
      g.moveTo(w / 2 - 15, h / 2 + 18);
      g.quadraticCurveTo(w / 2, h / 2 - 17, w / 2 + 15, h / 2 + 18);
      g.stroke();

      g.font = '800 23px Sora, sans-serif';
      g.fillStyle = 'rgba(29,91,51,.82)';
      g.textAlign = 'center';
      g.textBaseline = 'middle';
      g.fillText('$', w / 2 - 8, h / 2 - 1);
      g.font = '800 14px Sora, sans-serif';
      g.fillText('USD', 42, 28);
      g.fillText('USD', w - 58, h - 35);
      g.font = '700 10px Sora, sans-serif';
      g.fillStyle = 'rgba(29,91,51,.48)';
      g.fillText('MOTION PROP', w / 2 - 8, h - 24);

      const fold = g.createLinearGradient(0, 0, w - 16, 0);
      fold.addColorStop(0, 'rgba(255,255,255,0)');
      fold.addColorStop(0.45, 'rgba(255,255,255,.22)');
      fold.addColorStop(0.49, 'rgba(35,75,42,.10)');
      fold.addColorStop(0.54, 'rgba(255,255,255,.12)');
      fold.addColorStop(1, 'rgba(255,255,255,0)');
      g.fillStyle = fold;
      g.fillRect(0, 0, w - 16, h - 16);
      g.restore();
    });
  }

  const sprites = {
    coins: [createCoinSprite(1), createCoinSprite(2), createCoinSprite(3), createCoinSprite(4)],
    bills: [createBillSprite(1), createBillSprite(2), createBillSprite(3)]
  };
  const photoSprites = { coins: [], bills: [] };
  let hasPhotoMoneyAssets = false;

  function loadMoneyAsset(src, target) {
    const img = new Image();
    img.decoding = 'async';
    img.onload = () => {
      target.push(img);
      hasPhotoMoneyAssets = photoSprites.coins.length > 0 || photoSprites.bills.length > 0;
      canvas.dataset.assets = hasPhotoMoneyAssets ? 'photo' : 'fallback';
    };
    img.src = src;
  }

  [
    'gold_front.png',
    'gold_edge.png'
  ].forEach((name) => loadMoneyAsset(`/assets/money/${name}`, photoSprites.coins));

  [
    'usd_front.png'
  ].forEach((name) => loadMoneyAsset(`/assets/money/${name}`, photoSprites.bills));

  function spawn(forceBill = false) {
    const isBill = forceBill || Math.random() < 0.44;
    const coinPool = photoSprites.coins.length ? photoSprites.coins : sprites.coins;
    const billPool = photoSprites.bills.length ? photoSprites.bills : sprites.bills;
    const sprite = isBill
      ? billPool[Math.floor(Math.random() * billPool.length)]
      : coinPool[Math.floor(Math.random() * coinPool.length)];
    const size = isBill ? 48 + Math.random() * 52 : 16 + Math.random() * 24;
    const z = Math.random() * 800; // 0 (near) to 800 (far)
    particles.push({
      type: isBill ? 'bill' : 'coin',
      sprite,
      x: (Math.random() - 0.5) * width * 1.5, // Center-based spawning
      y: -200 - Math.random() * 300,
      z: z,
      vx: (Math.random() - 0.5) * (isBill ? 120 : 80),
      vy: 150 + Math.random() * (isBill ? 200 : 350),
      gravity: isBill ? 380 : 850,
      drag: isBill ? 0.985 : 0.995,
      size,
      w: isBill ? size * 2.1 : size,
      h: isBill ? size * 0.98 : size,
      rot: Math.random() * Math.PI * 2,
      vr: (Math.random() - 0.5) * (isBill ? 6 : 18),
      flip: Math.random() * Math.PI * 2,
      vf: isBill ? 4 + Math.random() * 8 : 12 + Math.random() * 20,
      floor: height - (12 + Math.random() * 90),
      alpha: isBill ? 0.88 : 0.98,
      trail: Math.random() < 0.45
    });
    spawned += 1;
  }

  function addPile(p) {
    if (pile.length > 230) pile.shift();
    pile.push({
      type: p.type,
      sprite: p.sprite,
      x: Math.max(18, Math.min(width - 18, p.x)),
      y: height - (4 + Math.random() * 48 + Math.min(68, pile.length * 0.12)),
      w: p.w * (0.68 + Math.random() * 0.28),
      h: p.h * (0.48 + Math.random() * 0.24),
      rot: p.rot,
      flip: 0.04 + Math.random() * 0.24,
      alpha: 0.32 + Math.random() * 0.34
    });
  }

  function setRenderEffects(p) {
    /* 蝘駁璆萄漲????蕪?∩誑?? FPS */
    // if (hasPhotoMoneyAssets) {
    //   ctx.filter = p.z < 0.18 ? 'blur(0.4px) saturate(1.08) contrast(1.08)' : 'saturate(1.05) contrast(1.04)';
    //   return;
    // }
    // const blur = p.z < 0.18 ? 1.1 : (p.z > 0.82 ? 0.2 : 0.55);
    // const contrast = p.type === 'coin' ? 1.22 : 1.12;
    // ctx.filter = `blur(${blur}px) saturate(0.92) contrast(${contrast}) brightness(0.92)`;
  }

  function resetRenderEffects() {
    ctx.filter = 'none';
  }

  function drawSoftShadow(x, y, w, h, alpha = 0.18) {
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = '#000';
    ctx.translate(x, y + h * 0.54);
    ctx.scale(1, 0.24);
    ctx.beginPath();
    ctx.ellipse(0, 0, w * 0.50, Math.max(7, h * 0.35), 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  function drawSpriteParticle(p, alpha = p.alpha) {
    const focalLength = 800;
    const zOffset = 400;
    const scale = focalLength / (focalLength + p.z + zOffset);
    
    const screenX = width / 2 + p.x * scale;
    const screenY = p.y * scale + height * (1 - scale) * 0.5;
    
    const w = p.w * scale;
    const h = p.h * scale;
    const depthAlpha = alpha * (0.25 + (1 - p.z / 1200) * 0.75);
    
    // Euler Angles + Bill Wobble
    const yaw = p.flip + (p.type === 'bill' ? Math.sin(p.life * 4) * 0.4 : 0);
    const pitch = p.rot + (p.type === 'bill' ? Math.cos(p.life * 3) * 0.3 : 0);
    const roll = p.vr * (p.life || 0);
    
    drawSoftShadow(width / 2 + p.x * scale, height - 20, w * 1.1, h * 0.3, depthAlpha * 0.12);

    ctx.save();
    
    // 1. Dynamic Motion Blur & DOF
    const vel = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
    const motionBlur = Math.min(3, vel * 0.005);
    const dofBlur = Math.abs(p.z - 400) * 0.004; // Focused at z=400
    const totalBlur = motionBlur + dofBlur;
    
    if (totalBlur > 0.5) {
      ctx.filter = `blur(${totalBlur.toFixed(2)}px)`;
    }

    ctx.globalAlpha = depthAlpha;
    ctx.translate(screenX, screenY);
    
    const m11 = Math.cos(yaw) * scale;
    const m12 = Math.sin(yaw) * Math.sin(pitch) * scale;
    const m22 = Math.cos(pitch) * scale;
    
    ctx.transform(m11, m12, 0, m22, 0, 0);
    ctx.rotate(roll);

    // 2. Light Source Simulation
    const normalZ = Math.abs(Math.cos(yaw) * Math.cos(pitch));
    
    // Coin Edge (Photo-realistic thickness)
    if (p.type === 'coin' && Math.abs(m11) < 0.25 * scale) {
      const edgeWidth = w * 0.18;
      const edge = ctx.createLinearGradient(-edgeWidth, 0, edgeWidth, 0);
      edge.addColorStop(0, '#3a1a04');
      edge.addColorStop(0.5, '#f7c44a');
      edge.addColorStop(1, '#3a1a04');
      ctx.fillStyle = edge;
      ctx.fillRect(-edgeWidth / 2, -h / 2, edgeWidth, h);
    }

    ctx.drawImage(p.sprite, -w / 2, -h / 2, w, h);
    
    // 3. Ultra-realistic Specular Highlight
    if (normalZ > 0.65) {
      const glintAlpha = Math.pow(normalZ, 8) * 1.2 * depthAlpha;
      ctx.globalCompositeOperation = 'screen';
      ctx.globalAlpha = glintAlpha;
      const glintGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, w * 0.8);
      glintGrad.addColorStop(0, 'rgba(255,255,240,0.9)');
      glintGrad.addColorStop(0.2, 'rgba(255,245,200,0.4)');
      glintGrad.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = glintGrad;
      ctx.fillRect(-w/2, -h/2, w, h);
    }
    
    ctx.restore();
  }

  function drawPile() {
    ctx.save();
    ctx.globalAlpha = 0.74;
    for (const item of pile) drawSpriteParticle(item, item.alpha);
    ctx.restore();
  }

  /* ?遣?瞍詨惜敹怠?嚗??撟?遣 createLinearGradient嚗?*/
  let cachedShade = null;
  let cachedShadeH = 0;

  function frame(now) {
    const dt = Math.min(0.033, (now - last) / 1000);
    last = now;
    ctx.clearRect(0, 0, width, height);

    /* ?瞍詨惜?芸擃漲霈??撱?*/
    if (cachedShadeH !== height) {
      cachedShade = ctx.createLinearGradient(0, 0, 0, height);
      cachedShade.addColorStop(0, hasPhotoMoneyAssets ? 'rgba(0,0,0,0.08)' : 'rgba(0,0,0,0.18)');
      cachedShade.addColorStop(0.55, 'rgba(0,0,0,0)');
      cachedShade.addColorStop(1, 'rgba(0,0,0,0.12)');
      cachedShadeH = height;
    }
    ctx.fillStyle = cachedShade;
    ctx.fillRect(0, 0, width, height);

    /* ??瘥? spawn ?賂?????8/4嚗?摮??葬撠 400 */
    const maxVisible = 400;
    const desired = spawned < lifetimeTarget ? 8 : 4;
    for (let i = 0; i < desired && particles.length < maxVisible; i += 1) {
      spawn(i % 5 === 0);
    }

    drawPile();
    /* ??芸?嚗宏?斗?撟 sort嚗??spawn ???交?摨?雿?z ??spawn 敺?霈?摰?銝???銋?敶梢閬死嚗?*/
    for (let i = particles.length - 1; i >= 0; i -= 1) {
      const p = particles[i];
      p.life += dt;
      p.vy += p.gravity * dt;
      p.vx *= p.drag;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.rot += p.vr * dt;
      p.flip += p.vf * dt;

      if (p.y > p.floor) {
        addPile(p);
        if (CoinSoundSystem.enabled && Math.random() < 0.18) CoinSoundSystem.playImpact(900 + Math.random() * 900, 0.012);
        particles.splice(i, 1);
        continue;
      }

      drawSpriteParticle(p);
    }
    requestAnimationFrame(frame);
  }

  resize();
  for (let i = 0; i < 120; i += 1) spawn(i % 4 === 0);
  window.addEventListener('resize', resize);
  requestAnimationFrame(frame);
}

let auditTimeout = null;
function setupLiveAudit() {
  refs.rawInput.addEventListener('input', () => {
    refs.inputStatus.textContent = '??銝?..';
    refs.inputStatus.className = 'badge badge-neutral ai-scanning-text';
    
    clearTimeout(auditTimeout);
    auditTimeout = setTimeout(async () => {
      const content = refs.rawInput.value.trim();
      if (!content) {
        refs.inputStatus.textContent = '蝑?頛詨';
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
        refs.inputStatus.textContent = payload.data.validation.status === 'PASS' ? '????' : '蝯??啣虜';
        refs.inputStatus.className = badgeClass(payload.data.validation.status);
      } else if (!ok) {
        refs.inputStatus.textContent = payload.message || '?單?撖抵?憭望?';
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
        message: '?⊥?????啣?蝡舀???隢Ⅱ隤頂蝯望?血???,
        data: null
      },
      error
    };
  }

  const payload = await response.json().catch(() => ({
    success: false,
    message: '隡箸??典??撘隤?,
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
  
  setBadge(refs.auditResultBadge, status, status === 'PASS' ? '撖抵???' : (status === 'FAIL' ? '瑼Ｘ憭望?' : '敺炎??));

  refs.validationSummary.innerHTML = `
    <div class="metric-stack">
      <div class="metric-chip">
        <span>撖抵?蝯?</span>
        <strong style="color: var(--${status === 'PASS' ? 'pass' : (status === 'FAIL' ? 'fail' : 'cyan')})">${safeHtml(summary.撖抵?蝯? || status)}</strong>
      </div>
      <div class="metric-chip">
        <span>甇??鈭箸</span>
        <strong>${safeHtml(String(summary.甇??鈭箸 ?? '-'))}</strong>
      </div>
      <div class="metric-chip">
        <span>?Ｚ?內</span>
        <strong>${safeHtml(String(summary.?Ｚ?內鈭箸 ?? '-'))}</strong>
      </div>
      <div class="metric-chip">
        <span>?祆?璆剔蜀</span>
        <strong>${safeHtml(fmt(summary.?祆?璆剔蜀 || 0))}</strong>
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
          innerHTML: '<span class="issue-label">INFO</span> <span class="issue-text">敺垢撖抵???嚗?潛???/span>'
        })])
  );
}

function renderHero(data, snapshot) {
  const result = snapshot?.validation?.status || 'FAIL';
  const dates = data?.?交?鞈? || {};

  refs.announcementTitle.innerHTML = `${safeHtml(data?.?砍?璅? || snapshot?.title || 'AI 瘣曉?砍?')} <span class="integrity-badge">AI ?豢?撖拇??</span>`;
  if (refs.pageTitle) {
    refs.pageTitle.textContent = data?.?砍?璅? || snapshot?.title || 'AI 瘣曉?砍?';
  }
  refs.dateRange.textContent = `${dates.蝯???|| '-'} 蝯? ??${dates.瘣曉??|| '-'} 甇??瘣曉`;
  refs.auditResult.textContent = result;
  refs.auditResult.className = `audit-hero ${result === 'PASS' ? 'audit-pass' : 'audit-fail'}`;
  refs.cancellationChip.textContent = `???鞎?${fmt(data?.?游?蝮賜?.?嗆???鞎?|| 0)}`;

  refs.healthStatus.textContent = 'ONLINE';
  refs.executionId.textContent = dates.蝯???|| snapshot?.executionId || '-';
  refs.persistStatus.textContent = snapshot?.persisted ? '甇???? : '?汗銝?;
  refs.pageSubtitle.textContent = snapshot?.persisted
    ? `?豢?撌脩???${dates.蝯???|| '5/4'} 蝯?嚗?{dates.瘣曉??|| '5/5'} 甇??瘣曉?頂蝯望迤隞交??芸?璅∪????
    : '?桀?撅內??汗蝯?嚗?湔摮甇????;
}

function groupLine(groups, key, label) {
  const names = Array.isArray(groups?.[key]) ? groups[key] : [];
  return `${label}嚗?{names.join('??) || '-'}`;
}

function renderOfficialTop10(rows) {
  if (!Array.isArray(rows) || !rows.length) return '-';
  return rows.slice(0, 10).map((row) => `
    <span class="official-rank-chip">
      <span class="official-rank-no">${safeHtml(String(row.rank || row.?活 || '-'))}</span>
      <span class="official-rank-name">${safeHtml(row.name || row.憪? || '-')}</span>
    </span>
  `).join('');
}

function renderOfficialGroups(groups) {
  const meta = [
    ['A1', 'CORE'],
    ['A2', 'CHASE'],
    ['B', 'FLOW'],
    ['C', 'WATCH']
  ];

  return meta.map(([key, tag]) => {
    const names = Array.isArray(groups?.[key]) ? groups[key] : [];
    const people = names.length
      ? names.map((name) => `<span class="official-person-chip">${safeHtml(name)}</span>`).join('')
      : '<span class="official-person-chip official-person-empty">-</span>';

    return `
      <section class="official-group-card official-group-${safeHtml(key)}">
        <div class="official-group-title">
          <strong>${safeHtml(key)}</strong>
          <span>${safeHtml(tag)}</span>
        </div>
        <div class="official-group-people">${people}</div>
      </section>
    `;
  }).join('');
}

function buildPasteReadyAnnouncement(snapshot) {
  const ranking = Array.isArray(snapshot?.ranking) ? snapshot.ranking : [];
  const groups = snapshot?.groups || {};
  const dates = snapshot?.standardData?.?交?鞈? || {};
  const settleDay = dates.蝯???|| '-';
  const dispatchDay = dates.瘣曉??|| '-';

  const auditStatus = (snapshot?.audit?.status || snapshot?.validation?.status || 'FAIL').toUpperCase();
  const auditNotes = Array.isArray(snapshot?.audit?.notes) ? snapshot.audit.notes : [];
  const excludedEmployees = Array.isArray(snapshot?.audit?.excludedEmployees)
    ? snapshot.audit.excludedEmployees
    : (snapshot?.standardData?.撖抵?蝯??.['撖抵??內銝瘣曉'] || []).map(e => ({ name: e?.憪? || e, reason: e?.?? || '撌脤?? }));

  const auditLine = auditStatus === 'PASS'
    ? `撖抵?蝯?嚗ASS?銝像?啁蜇銵冽撠?${auditNotes.length ? '嚗? + auditNotes.join('嚗?) : '嚗瞍??憭??蝮賜銵?'}?
    : `撖抵?蝯?嚗?{auditStatus}?${auditNotes.length ? auditNotes.join('嚗?) : '隢Ⅱ隤????撖抵?'}?;

  const retiredLine = excludedEmployees.length
    ? `撌脤?瘀?${excludedEmployees.map(e => e.name || e).filter(Boolean).join('??)}嚗?祟閮?銝甇??瘣曉?
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
    return `${row.rank}??{row.name}嚚I ${score}嚚祕??${fmt(actual)}嚚蕭蝥?憿?${fmt(renewal)}嚚蕭蝥??${deals}`;
  });

  return [
    `??I 瘣曉?砍?嚚?{settleDay} 蝯? ??${dispatchDay} 甇??瘣曉??嚚?撟喳?游?瘥????,
    '',
    auditLine,
    retiredLine,
    '',
    '甇????0??',
    `${top10}?,
    '',
    '甇???活嚗?,
    ...rankingLines,
    '',
    'A1嚗2嚗嚗 瘣曉??嚗?,
    groupLine(groups, 'A1', 'A1嚚敹蜓??),
    groupLine(groups, 'A2', 'A2嚚??格??),
    groupLine(groups, 'B', 'B蝯?蝛拙??脤?'),
    groupLine(groups, 'C', 'C蝯?鋆?閫撖?),
    '',
    `${dispatchDay} 甇??瘣曉??隞交??皞,
    '隞瘣曉隢? A1 ??A2 ??B ??C ???瑁?嚗??孵敹?敺銝晷嚗?敺歲雿?銝?????,
    '?恥?嗅??伐??芸??勗??踵鈭箸???,
    '隢?∠Ⅱ隤?????1??
  ].filter(v => v !== null && v !== undefined && v !== '').join('\n');
}

function renderOfficialLock(snapshot) {
  if (!refs.officialLockPanel) return;

  const ranking = Array.isArray(snapshot?.ranking) ? snapshot.ranking : [];
  const groups = snapshot?.groups || {};
  const dates = snapshot?.standardData?.?交?鞈? || {};
  const dispatchDay = dates.瘣曉??|| snapshot?.report?.nextDispatchDisplayDate || '-';
  const top10 = ranking
    .slice(0, 10)
    .map((row) => `${row.rank}.${row.name}`)
    .join('  ');

  refs.officialLockStatus.textContent = ranking.length
    ? `${dispatchDay} 甇??瘣曉??撌脩Ⅱ隤??舐?亙銵
    : '蝑?甇??瘣曉??';
  refs.officialLockDate.textContent = `${dispatchDay} LOCK`;
  refs.officialLockTop10.innerHTML = top10 ? renderOfficialTop10(ranking) : '-';
  refs.officialLockGroups.innerHTML = renderOfficialGroups(groups);
}

function renderSummaryCards(cards) {
  const entries = Array.isArray(cards) ? cards : Object.entries(cards || {});
  const fallback = [
    ["撖行蝮賡?憿?, 0],
    ["餈賜??桅?憿?, 0],
    ["?券蝮賣平蝮?, 0],
    ["餈賜??格?鈭?, 0],
    ["蝝舐?瘣曉?漱", 0],
    ["?嗆???鞎?, 0]
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
    if (label.includes('璆剔蜀') || label.includes('??')) tone = 'tone-gold';
    if (label.includes('?漱') || label.includes('?格')) tone = 'tone-cyan';

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
    renderEmpty(refs.spotlightGrid, '撠?挾??璁???);
    return;
  }
  const top1Score = getMetrics(rows[0]).AI? || 0;

  refs.spotlightGrid.replaceChildren(
    ...rows.map((row, index) => {
      const m = getMetrics(row);
      const rank = index + 1;
      const scoreGap = rank > 1 && top1Score > 0 ? (top1Score - (m.AI? || 0)) : 0;
      const card = document.createElement('article');
      card.className = `spotlight-card rank-${rank} group-${row.?? || row.group}`;

      const championBanner = rank === 1 ? `
        <div class="spotlight-champion-banner">
          <span class="champion-icon">??</span>
          <span class="champion-label">CHAMPION 繚 #1</span>
          <span class="champion-ai">AI 10000 瘥???</span>
        </div>` : '';

      const gapBadge = scoreGap > 0
        ? `<span class="spotlight-gap-badge">????{scoreGap.toFixed(2)} pts</span>`
        : '';

      const titles = {
        1: { text: '?? ?喳???SUPREME', class: 'title-champion' },
        2: { text: '?? ?賜?啁? ELITE', class: 'title-elite' },
        3: { text: '?? 暺?蝯勗艇 COMMANDER', class: 'title-elite' },
        4: { text: '?? ?賡??? VANGUARD', class: 'title-striker' }
      };
      const titleData = titles[rank];
      const titleHtml = titleData ? `<div class="prestige-title-wrap"><span class="prestige-title ${titleData.class}">${titleData.text}</span></div>` : '';

      const metricsHTML = `
          <div class="spotlight-stats">
            <div><span>撖行璆剔蜀</span><strong>${safeHtml(fmt(m.撖行))}</strong></div>
            <div><span>餈賜???</span><strong>${safeHtml(fmt(m.餈賜???))}</strong></div>
            <div><span>餈賜?摰Ｗ</span><strong>${safeHtml(fmt(m.餈賜?摰Ｗ??)}</strong></div>
          </div>
          <div class="spotlight-renewal-row">
            <span class="spotlight-renewal-label">餈賜??格 / 蝮賣平蝮?/span>
            <span class="spotlight-renewal-value">${safeHtml(String(m.餈賜??格))} ??/ ${safeHtml(fmt(m.?券蝮賣平蝮?)}</span>
          </div>`;

      const scoreHTML = m.AI?
        ? `<div class="score-banner">
            <span class="score-label">AI 甈??</span>
            <strong class="score-value">${safeHtml(Number(m.AI?).toFixed(2))}</strong>
            ${rank <= 3 ? '<span class="score-max">/ 10000 繚 A1 TIER</span>' : ''}
          </div>`
        : '';

      const adviceHTML = rank <= 3 && (row.撱箄降 || row.advice)
        ? `<p class="spotlight-advice-text">${safeHtml(row.撱箄降 || row.advice)}</p>`
        : '';

      card.innerHTML = `
        <div class="spotlight-content-wrapper">
          ${championBanner}
          <div class="spotlight-meta">
            <span class="rank-no">#${safeHtml(String(row.?活 || row.rank))}</span>
            <span class="group-tag" style="background:var(--cyan); color:#000;">${safeHtml(row.?? || row.group)}</span>
            ${gapBadge}
          </div>
          <h3>${safeHtml(row.憪? || row.name)}${titleHtml}</h3>
          ${(row.璅? || row.isNew) ? `<span class="newbie-tag">${safeHtml(row.璅? || '?唬犖')}</span>` : ''}
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
    renderEmpty(refs.leaderboard, '撠??璁???);
    return;
  }
  refs.leaderboard.replaceChildren(
    ...rows.map((row) => {
      const m = getMetrics(row);
      const item = document.createElement('article');
      item.className = `leader-row group-${row.?? || row.group}`;
      item.innerHTML = `
        <div class="leader-left">
          <strong>#${safeHtml(String(row.?活 || row.rank))}</strong>
          <div>
            <p>${safeHtml(row.憪? || row.name)}</p>
            <span>${safeHtml(row.?? || row.group)}${(row.璅? || row.isNew) ? `??{safeHtml(row.璅? || '?唬犖')}` : ''}</span>
          </div>
        </div>
        <div class="leader-right">
          <div class="leader-metrics-stack">
            <div class="m-item"><span>撖行</span><strong>${safeHtml(fmt(m.撖行))}</strong></div>
            <div class="m-item"><span>餈賜?</span><strong>${safeHtml(fmt(m.餈賜???))}</strong></div>
            <div class="m-score"><span>AI</span><strong>${safeHtml(Number(m.AI?).toFixed(0))}</strong></div>
          </div>
        </div>
      `;
      return item;
    })
  );
}

const GROUP_META = {
  A1: { emoji: '?', label: 'A1 擃?蜓?? },
  A2: { emoji: '??', label: 'A2 甈∩蜓?蕭?? },
  B:  { emoji: '?', label: 'B 蝯?銝?祇??? },
  C:  { emoji: '?', label: 'C 蝯?鋆?閫撖? }
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
        : '<span class="member-empty">撠鞈?</span>';
      card.innerHTML = `
        <div class="group-head">
          <strong>${safeHtml(meta.emoji + '\u00a0' + meta.label)}</strong>
          <span>${safeHtml(String(names.length))} 鈭?/span>
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
            <strong>${safeHtml(entry.憪?)}</strong>
            <span>${safeHtml(entry.?? || '撌脤??)}</span>
          `;
          return row;
        })
      : [Object.assign(document.createElement('div'), {
          className: 'retired-empty',
          textContent: '?祈憚瘝??Ｚ?內??
        })])
  );
}

function renderRankingTable(rows) {
  rows = asArray(rows);
  if (!rows.length) {
    refs.rankingTableBody.innerHTML = '<tr><td colspan="9" class="table-empty">撠甇???活鞈?</td></tr>';
    return;
  }
  refs.rankingTableBody.innerHTML = rows.map((row) => {
    const m = getMetrics(row);
    const score = Number(m.AI? || 0);
    const scoreStyle = score >= 3000 ? 'style="color: var(--cyan); font-weight: bold; text-shadow: 0 0 8px var(--cyan);"' : '';
    return `
      <tr class="row-${safeHtml(row.?? || row.group)}">
        <td class="col-rank">
          <div class="rank-box">
            <span>${safeHtml(String(row.?活 || row.rank))}</span>
            <span class="move-arrow move-${row.movement || 'flat'}">${row.movement === 'up' ? '?? : row.movement === 'down' ? '?? : '嚗?}</span>
          </div>
        </td>
        <td>
          <div class="table-name">
            <span>${safeHtml(row.憪? || row.name)}</span>
            ${(row.璅? || row.isNew) ? `<span class="newbie-tag">${safeHtml(row.璅? || '?唬犖')}</span>` : ''}
          </div>
        </td>
        <td>${safeHtml(row.?? || row.group)}</td>
        <td class="col-score" ${scoreStyle}>${score > 0 ? safeHtml(Number(score).toFixed(2)) : '??}</td>
        <td>${safeHtml(fmt(m.撖行))}</td>
        <td>${safeHtml(fmt(m.餈賜???))}</td>
        <td>${safeHtml(fmt(m.?券蝮賣平蝮?)}</td>
        <td>${safeHtml(fmt(m.餈賜?摰Ｗ??)}</td>
        <td>${safeHtml(String(m.餈賜??格))}</td>
      </tr>
    `;
  }).join('');
}

function renderAdvice(rows) {
  rows = asArray(rows);
  if (!rows.length) {
    renderEmpty(refs.adviceList, '撠?犖撱箄降鞈?');
    return;
  }
  refs.adviceList.replaceChildren(
    ...rows.map((row) => {
      const card = document.createElement('article');
      card.className = `advice-card group-${row.?? || row.group}`;
      card.innerHTML = `
        <div class="advice-header">
          <div class="advice-rank-name">
            <span class="advice-rank">#${safeHtml(String(row.?活 || row.rank))}</span>
            <strong class="advice-name">${safeHtml(row.憪? || row.name)}</strong>
            ${(row.璅? || row.isNew) ? `<span class="newbie-tag">${safeHtml(row.璅? || '?唬犖')}</span>` : ''}
          </div>
          <span class="advice-group-tag">${safeHtml(row.?? || row.group)}</span>
        </div>
        <p class="advice-text">${safeHtml(row.撱箄降 || row.advice)}</p>
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
      _ws: (m.AI? > 0 ? m.AI? :
        (m.餈賜??? * 0.25 + m.?券蝮賣平蝮?* 0.15 + m.撖行 * 0.30 + m.餈賜?摰Ｗ??* 0.15 + m.餈賜??格 * 100 * 0.15))
    };
  });
  const sorted = [...withWs].sort((a, b) => b._ws - a._ws);
  const wsRankOf = {};
  sorted.forEach((p, i) => { wsRankOf[p.憪? || p.name] = i + 1; });

  return withWs.map((row, idx) => {
    if ((row.撱箄降 || row.advice) && (row.撱箄降 || row.advice).length > 20) return row;
    const m = row._m;
    const ws = row._ws;
    const above = withWs[idx - 1];
    const below = withWs[idx + 1];
    const gapUp   = above ? ((above._ws - ws) / above._ws * 100).toFixed(1) : null;
    const gapDown = below ? ((ws - below._ws) / ws * 100).toFixed(1) : null;
    const wsr = wsRankOf[row.憪? || row.name];
    const trank = row.?活 || row.rank;
    const rc = (m.餈賜??? || 0) * 2500;
    const ac = (m.撖行 || 0) * 3000;
    const dc = (m.餈賜??格 || 0) * 1500;
    const tot = rc + ac + dc || 1;
    const mainMetric = ac/tot > 0.45 ? '撖行' : (rc/tot > 0.35 ? '餈賜???' : '餈賜??格');
    const dealCnt = m.餈賜??格;
    let advice = '';
    if (trank === 1) {
      const lead = gapDown || '0';
      advice = `雿帘?冽?擐?雿?蝚砌??榆頝??${lead}%嚗?蝞?撠??具?憭拇?${mainMetric}??銝蝑?撌株??蝜潛?????擐?雿蔭??銝?嚗?隞予蝜潛??脫?蝛押;
    } else if (trank <= 4) {
      const rival = above ? (above.憪? || above.name) : '';
      const threat = parseFloat(gapDown || '100') < 15 ? `銝頝??芣? ${gapDown}%嚗?鋡怨蕭銝?憯?? : `銝頝? ${gapDown}%嚗?蝵桀?蝛押;
      advice = `雿?${rival}撌株? ${gapUp}%嚗?{threat}隞予??{mainMetric}?嗡蜓?孵?嚗?蝑???鈭文停?賜葬?剖榆頝?銝??臭???暺?敺???隞予?遙?;
    } else if (trank <= 10) {
      const wsNote = wsr < trank ? `雿?甈???蝚?${wsr}嚗??喟絞???湧?? : '';
      const threatNote = parseFloat(gapDown || '100') < 12 ? `銝蝺嚗榆頝??${gapDown}%? : '';
      advice = `雿????榆頝?${gapUp}%??{wsNote}${threatNote}隞予??{mainMetric}?葉蝒嚗蕭蝥?${dealCnt} 蝑雿?瑽▼嚗??芸?頧??漱?霈???韏瑚??;
    } else if (trank <= 18) {
      const wsNote = wsr !== trank ? `嚗??祕???洵 ${wsr}嚗 : '';
      advice = `雿????榆頝?${gapUp}%${wsNote}??憭拐誑${mainMetric}?箔蜓?鳴??亥????箏?憭芯???{dealCnt > 5 ? `餈賜? ${dealCnt} 蝑誨銵其??典??` : ''}銝蝑???鈭文停?質?雿蔭?絲靘;
    } else {
      const action = dealCnt > 2 ? `餈賜? ${dealCnt} 蝑雿?韏琿?嚗??亥孛頧??漱` : '隞予??銝蝑平蝮曇??;
      advice = `敺挾???嚗?憭拍??格??芣?銝??霈摮???{action}嚗敞蝛??臬???頝胯??函?憭芷?嚗?銝蝑停?航絲暺;
    }
    return { ...row, 撱箄降: advice };
  });
}

function renderProportionalAdvice(rows) {
  const grid = refs.propAdviceGrid;
  if (!grid) return;
  const enriched = autoProportionalAdvice(rows);
  grid.replaceChildren(
    ...enriched.map((row) => {
      const card = document.createElement('article');
      const grpColor = GROUP_COLOR[row.?? || row.group] || '#fff';
      card.className = `prop-card group-${row.?? || row.group}`;
      card.innerHTML = `
        <div class="prop-card-header">
          <div class="prop-rank-name">
            <span class="prop-rank">#${safeHtml(String(row.?活 || row.rank))}</span>
            <strong class="prop-name">${safeHtml(row.憪? || row.name)}</strong>
            ${(row.璅? || row.isNew) ? `<span class="newbie-tag">${safeHtml(row.璅? || '?唬犖')}</span>` : ''}
          </div>
          <span class="prop-group-tag" style="color:${grpColor};border-color:${grpColor}40">${safeHtml(row.?? || row.group)}</span>
        </div>
        ${(() => { const m = getMetrics(row); return m.AI? ? `<div class="prop-score">AI ? <strong>${safeHtml(Number(m.AI?).toFixed(2))}</strong></div>` : ''; })()}
        <div class="prop-metrics">
          ${(() => { const m = getMetrics(row); return `
          <span>撖行 <strong>${safeHtml(fmt(m.撖行))}</strong></span>
          <span>餈賜??? <strong>${safeHtml(fmt(m.餈賜???))}</strong></span>
          <span>餈賜??格 <strong>${safeHtml(String(m.餈賜??格))}</strong></span>
          <span>摰Ｗ??<strong>${safeHtml(fmt(m.餈賜?摰Ｗ??)}</strong></span>
          `; })()}
        </div>
        <p class="prop-advice-text">${safeHtml(row.撱箄降 || '')}</p>
      `;
      return card;
    })
  );
}

function renderScoringPolicy(snapshot) {
  const policy = snapshot?.scoringPolicy || {};
  const dates = snapshot?.standardData?.?交?鞈? || {};
  if (refs.scoringPolicyTitle) {
    refs.scoringPolicyTitle.textContent = policy.title || 'AI 甈??嚗?靘???';
  }
  if (refs.scoringPolicyDate) {
    refs.scoringPolicyDate.textContent = `${dates.蝯???|| '-'} ??${dates.瘣曉??|| '-'}`;
  }
  if (refs.scoringPolicyDescription) {
    refs.scoringPolicyDescription.textContent = policy.description || '隞乩??交平蝮暹?靘?蝞????詻?;
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
  const rankingRows = asArray(data?.甇???活 || snapshot?.rankings || snapshot?.report?.rankings);
  const retired = asArray(presentation.retired || data?.撖抵?蝯??.['撖抵??內銝瘣曉']);

  renderValidation(snapshot);
  renderHero(data, snapshot);
  renderOfficialLock(snapshot);
  renderSummaryCards(presentation.summaryCards || data?.?游?蝮賜 || snapshot?.report?.audit?.summaryBoard || []);
  renderSpotlight((presentation.top5 || rankingRows).slice(0, 4));
  renderLeaderboard(presentation.top10 || rankingRows);
  const rankMap = {};
  rankingRows.forEach(row => {
    const name = normalizePersonName(row);
    if (name) rankMap[name] = row.?活 || row.rank;
  });
  renderGroups(data?.?? || snapshot?.report?.groups || {}, rankMap);
  renderRetired(retired);
  renderRankingTable(rankingRows);
  renderAdvice(rankingRows);
  renderScoringPolicy(snapshot);
  renderProportionalAdvice(rankingRows);
  refs.compactOutput.value = snapshot?.announcement || data?.蝢斤?頞移蝪∠? || snapshot?.groupShortText || buildPasteReadyAnnouncement(snapshot) || '';
}

async function loadCurrent() {
  setBadge(refs.inputStatus, 'PENDING', '頛甇???葉');
  const { ok, payload } = await request('/api/current');
  if (!ok) {
    setBadge(refs.inputStatus, 'FAIL', payload.message || '頛憭望?');
    return;
  }

  const snapshot = payload.data;
  refs.rawInput.value = '';
  render(snapshot);
  const dates = snapshot?.standardData?.?交?鞈? || {};
  const dateLabel = (dates.蝯???&& dates.瘣曉?? ? `${dates.蝯??囚??{dates.瘣曉?囚` : 'LATEST';
  setBadge(refs.inputStatus, 'PASS', `撌脰??交迤撘? (${dateLabel})`);

  if (refs.healthStatus) {
    refs.healthStatus.textContent = 'ONLINE';
    refs.healthStatus.style.color = 'var(--pass)';
  }
}

async function auditCurrentInput(options = {}) {
  if (!refs.rawInput.value.trim()) {
    setBadge(refs.inputStatus, 'FAIL', '隢?鞎潔??砍???JSON 敺?撖抵?');
    return;
  }
  if (!options.suppressPending) {
    setBadge(refs.inputStatus, 'PENDING', '敺垢撖抵?銝?);
  }
  const { ok, payload } = await request('/api/audit', {
    method: 'POST',
    body: JSON.stringify({ rawText: refs.rawInput.value })
  });

  if (!payload.data) {
    if (options.overrideBadge) {
      setBadge(refs.inputStatus, options.overrideBadge.status, options.overrideBadge.text);
    } else {
      setBadge(refs.inputStatus, 'FAIL', payload.message || '撖抵?憭望?');
    }
    return;
  }

  render(payload.data);
  if (options.successBadge) {
    setBadge(refs.inputStatus, options.successBadge.status, options.successBadge.text);
  } else {
    setBadge(refs.inputStatus, 'PASS', '撖抵?摰?');
  }
  AudioManager.success();
}

async function saveCurrentReport() {
  if (!state.current) {
    setBadge(refs.inputStatus, 'FAIL', '隢??脰?撖抵?敺??脣?');
    return;
  }
  if (!state.current.validation?.ok) {
    setBadge(refs.inputStatus, 'FAIL', '撖抵??芷?嚗瘜摮迤撘?');
    return;
  }

  setBadge(refs.inputStatus, 'PENDING', '甇??脣??喟頂蝯?..');
  const { ok, payload } = await request('/api/save', {
    method: 'POST',
    body: JSON.stringify({
      report: state.current.report || state.current,
      operator: 'admin',
      reason: 'manual-update'
    })
  });

  if (!ok) {
    setBadge(refs.inputStatus, 'FAIL', payload.message || '?脣?憭望?');
    return;
  }

  await loadCurrent();
  AudioManager.sweep();
}

function setup() {
  renderRules();
  setupLiveAudit();
  setupOfficialLockCoins();
  
  refs.btnLoad?.addEventListener('click', () => runAction(loadCurrent));
  refs.btnAudit?.addEventListener('click', () => runAction(() => auditCurrentInput()));
  refs.btnSave?.addEventListener('click', () => runAction(saveCurrentReport));
  refs.btnClear?.addEventListener('click', () => {
    refs.rawInput.value = '';
    refs.inputStatus.textContent = '蝑?頛詨';
    refs.inputStatus.className = 'badge badge-neutral';
  });
  
  refs.btnCopyCompact?.addEventListener('click', () => {
    refs.compactOutput.select();
    document.execCommand('copy');
    const oldText = refs.btnCopyCompact.textContent;
    refs.btnCopyCompact.textContent = '撌脰?鋆踝?';
    setTimeout(() => { refs.btnCopyCompact.textContent = oldText; }, 2000);
  });
  
  const btnSendLine = $('btn-send-line');
  btnSendLine?.addEventListener('click', async () => {
    let userId = localStorage.getItem('MY_LINE_USER_ID');
    if (!userId) {
      userId = prompt('隢撓?交??LINE User ID (U?摮葡) 隞乩噶?喲晷?株??航?函???嚗n(?芷?頛詨銝甈∴?敺????雿?');
      if (!userId) return;
      localStorage.setItem('MY_LINE_USER_ID', userId.trim());
    }
    
    // ??隡箸??冽蝬脣?嚗?楝敺??孵???mobile.html嚗?
    const baseOrigin = window.location.origin;
    // 瘥予?交???v ?嚗撘?YYYYMMDD嚗?撘瑕 LINE 瘥予??? OG ?汗嚗???敹怠?
    const today = new Date();
    const vParam = `${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}${String(today.getDate()).padStart(2, '0')}`;
    const mobileUrl = `${baseOrigin}/mobile.html?v=${vParam}`;

    const isLocal = baseOrigin.includes('localhost') || baseOrigin.includes('127.0.0.1');
    const warning = isLocal ? '\n\n?? 瘜冽?嚗?雯???localhost嚗?璈??銝 WiFi ?航?⊥????遣霅唬蝙?冽璈?IP ?迤撘撩?蝬脣??? : '';
    
    const text = `? ?I 瘣曉?唳?摰文歇?湔?n\n??啁? AI 憭扳????蝝?撠惇撱箄降撌脣??\n?? 隢??喲????寥???亦?隞摰瘣曉??嚗n\n?? ${mobileUrl}${warning}`;
    
    const oldText = btnSendLine.textContent;
    btnSendLine.textContent = '?喲葉...';
    btnSendLine.disabled = true;
    
    try {
      const res = await fetch('/api/line/notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: userId, text: text })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        btnSendLine.textContent = '??撌脣??函? LINE';
      } else {
        btnSendLine.textContent = '???喲仃??;
        alert('?喲仃??' + (data.error || '?芰?隤?));
      }
    } catch (e) {
      btnSendLine.textContent = '?????憭望?';
      alert('???憭望?嚗? + e.message);
    } finally {
      setTimeout(() => { 
        btnSendLine.textContent = oldText;
        btnSendLine.disabled = false;
      }, 3000);
    }
  });

  loadCurrent();
  hideSplashScreen();
}

function hideSplashScreen() {
  const splash = document.getElementById('splash-screen');
  if (!splash) return;
  setTimeout(() => {
    splash.classList.add('fade-out');
    setTimeout(() => splash.remove(), 600);
  }, 400);
}

document.addEventListener('DOMContentLoaded', setup);

/* ── 3D Dashboard Parallax ── */
document.addEventListener('mousemove', (e) => {
  const shell = document.querySelector('.page-shell');
  if (!shell) return;
  const xAxis = (window.innerWidth / 2 - e.pageX) / 45;
  const yAxis = (window.innerHeight / 2 - e.pageY) / 45;
  shell.style.transform = \
otateY(\deg) rotateX(\deg)\;
});

