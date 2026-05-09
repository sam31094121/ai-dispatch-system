/**
 * AI 派單戰情室 - 視覺特效大滿貫版 (Hash: 0fe1655)
 * 特色：高擬真鈔票雨、卡片光源追蹤、高性能 Sprite 渲染
 */

const LOCAL_DATA_PATH = './data/dispatch-reports-v1/latest.json';
const MAX_SCORE = 10000;

const refs = {
  mainTitle: document.getElementById('main-title'),
  heroSettlementDate: document.getElementById('hero-settlement-date'),
  heroDispatchDate: document.getElementById('hero-dispatch-date'),
  auditResult: document.getElementById('audit-result'),
  auditResultHero: document.getElementById('audit-result-hero'),
  summaryGrid: document.getElementById('summary-grid'),
  a1HeroGrid: document.getElementById('a1-hero-grid'),
  rankingList: document.getElementById('ranking-list'),
  groupsGrid: document.getElementById('groups-grid'),
  auditNotes: document.getElementById('audit-notes'),
  excludedList: document.getElementById('excluded-list'),
  refreshData: document.getElementById('refresh-data'),
  searchOpen: document.getElementById('search-open'),
  searchClose: document.getElementById('search-close'),
  searchModal: document.getElementById('search-modal'),
  lookupInput: document.getElementById('lookup-input'),
  lookupResults: document.getElementById('lookup-results'),
  toast: document.getElementById('toast'),
  statRenewalDeals: document.getElementById('stat-renewal-deals'),
  statTotalRevenue: document.getElementById('stat-total-revenue'),
  statCashRevenue: document.getElementById('stat-cash-revenue'),
  broadcastOutput: document.getElementById('broadcast-output'),
  copyLineText: document.getElementById('copy-line-text'),
  copyShortText: document.getElementById('copy-short-text'),
  groupShortOutput: document.getElementById('group-short-output'),
};

let state = {
  report: null,
  sendText: '',
  shortText: '',
};

const fmt = (v, dec = 0) => {
  if (typeof v !== 'number') return v || '--';
  return new Intl.NumberFormat('zh-TW', {
    minimumFractionDigits: dec,
    maximumFractionDigits: dec
  }).format(v);
};

const escapeHtml = (str) => {
  if (!str) return '';
  return str.replace(/[&<>"']/g, (m) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[m]));
};

async function loadData() {
  try {
    const response = await fetch(LOCAL_DATA_PATH + '?t=' + Date.now());
    const data = await response.json();
    state.report = data.report || data;
    renderAll();
    initCoinRain();
  } catch (error) {
    showToast('讀取失敗，請重新整理');
  }
}

function renderAll() {
  const r = state.report;
  if (!r) return;

  refs.mainTitle.textContent = r.title;
  refs.heroSettlementDate.textContent = r.settlementDate;
  refs.heroDispatchDate.textContent = r.dispatchDate;
  refs.auditResult.textContent = r.auditResult;
  refs.auditResultHero.textContent = r.auditResult;

  renderA1Heroes(r.rankings || []);
  renderSummary(r.summaryBoard || {});
  renderRankings(r.rankings || []);
  renderGroups(r.groups || {}, r.rankings || []);
  renderAudit(r.auditNotes || [], r.excludedFromRanking || []);
  
  // 更新公告文字
  refs.broadcastOutput.value = r.fullText || '';
  refs.groupShortOutput.textContent = r.groupShortText || '';
  
  animateScoreFills();
}

function renderA1Heroes(rankings) {
  const top6 = rankings.slice(0, 6);
  refs.a1HeroGrid.innerHTML = top6.map((row, i) => {
    const pct = Math.min(100, Math.max(0, (row.score / (rankings[0]?.score || 1)) * 100));
    return `
      <article class="a1-hero-card rank-${i+1}">
        <div class="a1-hero-gloss"></div>
        <div class="a1-hero-rank">RANK #0${i+1}</div>
        <h3 class="a1-hero-name">${escapeHtml(row.name)}</h3>
        <div class="a1-hero-score-row">
          <span class="a1-hero-score-label">AI 分數</span>
          <span class="a1-hero-score-value">${fmt(row.score, 2)}</span>
        </div>
        <div class="a1-hero-score-track">
          <div class="a1-hero-score-fill" data-pct="${pct}" style="width:0%"></div>
        </div>
        <div class="a1-hero-metrics">
          <div class="a1-metric"><span>實收</span><strong>${fmt(row.actualRevenue)}</strong></div>
          <div class="a1-metric"><span>追續</span><strong>${fmt(row.renewalRevenue)}</strong></div>
          <div class="a1-metric"><span>單數</span><strong>${row.renewalDeals}</strong></div>
        </div>
      </article>
    `;
  }).join('');
}

function renderSummary(summary) {
  refs.statRenewalDeals.textContent = summary.renewalDeals + ' 單';
  refs.statTotalRevenue.textContent = fmt(summary.totalRevenue);
  refs.statCashRevenue.textContent = fmt(summary.actualRevenue);
  
  const items = [
    ['追續成交', summary.renewalDeals, '單'],
    ['全部總業績', summary.totalRevenue, ''],
    ['追續金額', summary.renewalRevenue, ''],
    ['實收金額', summary.actualRevenue, '']
  ];
  refs.summaryGrid.innerHTML = items.map(([l, v, s]) => `
    <div class="summary-card"><span>${l}</span><strong>${fmt(v)}${s}</strong></div>
  `).join('');
}

function renderRankings(rankings) {
  refs.rankingList.innerHTML = rankings.map(row => {
    const pct = Math.min(100, Math.max(0, (row.score / (rankings[0]?.score || 1)) * 100));
    return `
      <article class="ranking-card" id="person-${encodeURIComponent(row.name)}">
        <div class="ranking-top">
          <span class="rank-number">#${row.rank}</span>
          <div class="person-name"><strong>${escapeHtml(row.name)}</strong></div>
          <span class="badge group-${row.group}">${row.group}</span>
        </div>
        <div class="score-line">
          <label><span>權重分數</span><strong>${fmt(row.score, 2)}</strong></label>
          <div class="score-track"><div class="score-fill" data-pct="${pct}" style="width:0%"></div></div>
        </div>
      </article>
    `;
  }).join('');
}

function renderGroups(groups, rankings) {
  const rankMap = new Map(rankings.map(r => [r.name, r.rank]));
  refs.groupsGrid.innerHTML = Object.entries(groups).map(([k, members]) => `
    <div class="group-card">
      <h3>${k} 分級</h3>
      <div class="member-list">
        ${members.map(m => `<span class="member-chip">#${rankMap.get(m) || '-'} ${escapeHtml(m)}</span>`).join('')}
      </div>
    </div>
  `).join('');
}

function renderAudit(notes, excluded) {
  refs.auditNotes.innerHTML = notes.map(n => `<div class="audit-note">${escapeHtml(n)}</div>`).join('');
}

function animateScoreFills() {
  setTimeout(() => {
    document.querySelectorAll('[data-pct]').forEach(el => el.style.width = el.dataset.pct + '%');
  }, 100);
}

// ── 高擬真鈔票雨引擎 (Pro MapleCoinRain) ──
class MapleCoinRain {
  constructor(canvas) {
    this.cv = canvas; this.cx = canvas.getContext('2d');
    this.W = 0; this.H = 0; this.coins = []; this.running = false;
    this._spriteCache = new Map();
  }
  _resize() {
    this.W = this.cv.width = this.cv.offsetWidth;
    this.H = this.cv.height = this.cv.offsetHeight;
  }
  _getCoinSprite(r) {
    const cacheKey = `coin_${r}`;
    if (this._spriteCache.has(cacheKey)) return this._spriteCache.get(cacheKey);
    const off = document.createElement('canvas');
    const pad = 4; const size = (r + pad) * 2;
    off.width = off.height = size;
    const g = off.getContext('2d');
    const c = size / 2;
    // 繪製金幣
    g.beginPath(); g.arc(c, c, r, 0, Math.PI * 2);
    const grad = g.createRadialGradient(c - r * 0.3, c - r * 0.3, r * 0.1, c, c, r);
    grad.addColorStop(0, '#fff4d1'); grad.addColorStop(0.4, '#f3c14b'); grad.addColorStop(1, '#c8820a');
    g.fillStyle = grad; g.fill();
    g.strokeStyle = '#6e4505'; g.lineWidth = 0.5; g.stroke();
    const result = { canvas: off, pad };
    this._spriteCache.set(cacheKey, result);
    return result;
  }
  _getBillSprite(rw, rh) {
    const cacheKey = `bill_${rw}_${rh}`;
    if (this._spriteCache.has(cacheKey)) return this._spriteCache.get(cacheKey);
    const off = document.createElement('canvas');
    const pad = 10; off.width = rw + pad * 2; off.height = rh + pad * 2;
    const g = off.getContext('2d');
    const bx = pad, by = pad;
    // 繪製聯邦美鈔感
    g.fillStyle = '#1a5c1e'; g.beginPath(); g.roundRect(bx, by, rw, rh, 2); g.fill();
    g.strokeStyle = '#73d773'; g.lineWidth = 0.5; g.stroke();
    g.fillStyle = '#ffffff'; g.font = `bold ${rh * 0.5}px serif`; g.textAlign = 'center'; g.fillText('$', bx + rw / 2, by + rh * 0.7);
    const result = { canvas: off, pad };
    this._spriteCache.set(cacheKey, result);
    return result;
  }
  _update() {
    if (this.coins.length < 50) {
      const type = Math.random() > 0.6 ? 'bill' : 'coin';
      this.coins.push({
        type, x: Math.random() * this.W, y: -50,
        vy: Math.random() * 2 + 1, r: Math.random() * 5 + 5,
        bw: 40, bh: 20, tilt: Math.random() * Math.PI,
        vt: Math.random() * 0.05
      });
    }
    for (let i = this.coins.length - 1; i >= 0; i--) {
      const c = this.coins[i]; c.y += c.vy; c.tilt += c.vt;
      if (c.y > this.H + 50) this.coins.splice(i, 1);
    }
  }
  _draw() {
    this.cx.clearRect(0, 0, this.W, this.H);
    for (const c of this.coins) {
      this.cx.save(); this.cx.translate(c.x, c.y);
      if (c.type === 'coin') {
        const sprite = this._getCoinSprite(c.r);
        this.cx.scale(Math.cos(c.tilt), 1);
        this.cx.drawImage(sprite.canvas, -c.r, -c.r);
      } else {
        const sprite = this._getBillSprite(c.bw, c.bh);
        this.cx.rotate(c.tilt);
        this.cx.drawImage(sprite.canvas, -c.bw / 2, -c.bh / 2);
      }
      this.cx.restore();
    }
  }
  _tick() {
    if (!this.running) return;
    this._update(); this._draw();
    requestAnimationFrame(() => this._tick());
  }
  start() { this._resize(); this.running = true; this._tick(); }
}

let _coinRain = null;
function initCoinRain() {
  const cv = document.getElementById('mobile-coin-canvas');
  if (!cv) return;
  if (_coinRain) return;
  _coinRain = new MapleCoinRain(cv);
  _coinRain.start();
}

function initHeroTilt() {
  const grid = refs.a1HeroGrid;
  grid.addEventListener('touchmove', (e) => {
    const t = e.touches[0]; const card = t.target.closest('.a1-hero-card');
    if (!card) return;
    const r = card.getBoundingClientRect();
    const x = ((t.clientX - r.left) / r.width - 0.5) * 2;
    const y = ((t.clientY - r.top) / r.height - 0.5) * 2;
    card.style.transform = `perspective(600px) rotateX(${-y * 10}deg) rotateY(${x * 10}deg) scale(1.05)`;
    card.style.setProperty('--light-x', `${(x + 1) * 50}%`);
    card.style.setProperty('--light-y', `${(y + 1) * 50}%`);
  }, { passive: true });
  grid.addEventListener('touchend', () => {
    grid.querySelectorAll('.a1-hero-card').forEach(c => c.style.transform = '');
  });
}

function showToast(m) {
  refs.toast.textContent = m; refs.toast.classList.add('is-visible');
  setTimeout(() => refs.toast.classList.remove('is-visible'), 2000);
}

function bindEvents() {
  refs.refreshData.onclick = loadData;
  refs.copyLineText.onclick = () => {
    navigator.clipboard.writeText(refs.broadcastOutput.value);
    showToast('公告已複製');
  };
  refs.copyShortText.onclick = () => {
    navigator.clipboard.writeText(refs.groupShortOutput.textContent);
    showToast('精簡版已複製');
  };
}

document.addEventListener('DOMContentLoaded', () => {
  loadData(); bindEvents(); initHeroTilt();
});
