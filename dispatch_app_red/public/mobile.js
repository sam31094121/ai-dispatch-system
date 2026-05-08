const API_CURRENT = '/api/current';
const API_LINE_OUTPUT = '/api/line-output';
const MAX_SCORE = 10000;

const refs = {
  title: document.getElementById('main-title'),
  auditResult: document.getElementById('audit-result'),
  auditResultHero: document.getElementById('audit-result-hero'),
  heroSettlementDate: document.getElementById('hero-settlement-date'),
  heroDispatchDate: document.getElementById('hero-dispatch-date'),
  statRenewalDeals: document.getElementById('stat-renewal-deals'),
  statTotalRevenue: document.getElementById('stat-total-revenue'),
  statCashRevenue: document.getElementById('stat-cash-revenue'),
  a1HeroGrid: document.getElementById('a1-hero-grid'),
  summaryGrid: document.getElementById('summary-grid'),
  rankingList: document.getElementById('ranking-list'),
  groupsGrid: document.getElementById('groups-grid'),
  auditNotes: document.getElementById('audit-notes'),
  excludedList: document.getElementById('excluded-list'),
  refreshData: document.getElementById('refresh-data') || document.body,
  searchOpen: document.getElementById('search-open'),
  searchClose: document.getElementById('search-close'),
  searchModal: document.getElementById('search-modal'),
  lookupInput: document.getElementById('lookup-input'),
  lookupResults: document.getElementById('lookup-results'),
  toast: document.getElementById('toast')
};

const state = {
  report: null,
  sendText: '',
  isFirstLoad: true
};

const CACHE_KEY = 'zhaogui_last_report';


function get(obj, keys, fallback = '') {
  for (const key of keys) {
    if (obj && obj[key] !== undefined && obj[key] !== null && obj[key] !== '') {
      return obj[key];
    }
  }
  return fallback;
}

function num(value) {
  const parsed = Number(String(value ?? '').replace(/,/g, ''));
  return Number.isFinite(parsed) ? parsed : 0;
}

function fmt(value, digits = 0) {
  const parsed = num(value);
  return new Intl.NumberFormat('zh-TW', {
    maximumFractionDigits: digits,
    minimumFractionDigits: digits
  }).format(parsed);
}

function escapeHtml(value) {
  const div = document.createElement('div');
  div.textContent = String(value ?? '');
  return div.innerHTML;
}

function highlightText(text, query) {
  if (!query) return escapeHtml(text);
  const escapedText = escapeHtml(text);
  const escapedQuery = escapeHtml(query);
  const regex = new RegExp(`(${escapedQuery})`, 'gi');
  return escapedText.replace(regex, '<mark>$1</mark>');
}


function cleanSendText(text) {
  return String(text || '')
    .replace(/\n正式前10名：[\s\S]*$/u, '')
    .trim();
}

function normalizeDate(value) {
  const raw = String(value || '').trim();
  if (!raw) return '--';
  const match = raw.match(/^(\d{4})-(\d{2})-(\d{2})$/u);
  if (match) return `${Number(match[2])}/${Number(match[3])}`;
  return raw;
}

function normalizeRanking(row) {
  const metrics = row.metrics || {};
  const rank = num(get(row, ['rank', '名次'], 0));
  const name = get(row, ['name', '姓名'], '');
  const prevRank = num(get(row, ['prevRank', '上輪名次'], 0));
  let movement = get(row, ['movement', '異動'], 'flat');
  if (prevRank > 0) {
    if (rank < prevRank) movement = 'up';
    else if (rank > prevRank) movement = 'down';
    else movement = 'flat';
  }

  return {
    rank,
    name,
    group: get(row, ['group', '分級'], ''),
    prevRank,
    movement,
    isNew: Boolean(row.isNew) || name.includes('新人'),
    score: num(get(row, ['weightedScore', 'totalScore', '正式權重分數'], get(metrics, ['正式權重分數'], 0))),
    actualRevenue: num(get(row, ['actualRevenue', '實收', '實收總金額'], get(metrics, ['實收', '實收總金額'], 0))),
    renewalRevenue: num(get(row, ['renewalRevenue', '續單金額', '追續金額', '追續單金額'], get(metrics, ['續單金額', '追續金額', '追續單金額'], 0))),
    totalRevenue: num(get(row, ['totalRevenue', '總業績', '全部總業績'], get(metrics, ['總業績', '全部總業績'], 0))),
    avgRenewal: num(get(row, ['avgRenewal', 'averageRenewal', '追續客單價'], get(metrics, ['追續客單價'], 0))),
    renewalDeals: num(get(row, ['renewalDeals', '追續成交總數', '追續單數'], get(metrics, ['追續成交總數', '追續單數'], 0))),
    advice: get(row, ['advice', '建議'], '')
  };
}

function normalizeReport(snapshot, lineText) {
  const report = snapshot.report || {};
  const ranking = (snapshot.ranking || report.rankings || []).map(normalizeRanking);
  const summary = snapshot.summary || {};
  const audit = snapshot.audit || report.audit || {};
  const text = lineText || snapshot.announcement || snapshot.groupShortText || report.groupShortText || '';

  return {
    title: snapshot.title || report.title || 'AI 派單公告',
    settlementDate: normalizeDate(report.settlementDate || snapshot.settlementDate),
    dispatchDate: normalizeDate(report.dispatchDate || snapshot.dispatchDate),
    auditResult: audit.status || audit.result || report.auditResult || snapshot.validation?.status || 'PASS',
    ranking,
    groups: snapshot.groups || report.groups || {},
    summary: {
      renewalDeals: num(summary.renewalDeals || report.summaryBoard?.追續單成交 || report.summaryBoard?.累積追續總成交數),
      totalRevenue: num(summary.totalRevenue || report.summaryBoard?.全部總業績 || report.summaryBoard?.本月業績),
      renewalRevenue: num(summary.renewalRevenue || report.summaryBoard?.追續單金額 || report.summaryBoard?.追續單總金額),
      actualRevenue: num(report.summaryBoard?.實收總金額 || summary.actualRevenue)
    },
    auditNotes: audit.notes || report.audit?.notes || [],
    excludedEmployees: audit.excludedEmployees || report.audit?.excludedEmployees || [],
    sendText: cleanSendText(text)
  };
}

async function requestJson(url) {
  const response = await fetch(`${url}${url.includes('?') ? '&' : '?'}t=${Date.now()}`, { cache: 'no-store' });
  const payload = await response.json();
  if (!response.ok || payload.success === false) {
    throw new Error(payload.message || '資料讀取失敗');
  }
  return payload.data || payload;
}

async function loadData() {
  // 優先嘗試從快取讀取，達成「瞬間渲染」
  const cached = localStorage.getItem(CACHE_KEY);
  if (cached && state.isFirstLoad) {
    try {
      const data = JSON.parse(cached);
      state.report = data;
      render(data);
    } catch (e) {
      console.warn('Cache corrupted', e);
    }
  }

  setLoading();
  try {
    const [snapshot, lineOutput] = await Promise.all([
      requestJson(API_CURRENT),
      requestJson(API_LINE_OUTPUT).catch(() => null)
    ]);
    const report = normalizeReport(snapshot, lineOutput?.text);
    state.report = report;
    state.sendText = report.sendText;
    state.isFirstLoad = false;
    
    // 儲存到快取
    localStorage.setItem(CACHE_KEY, JSON.stringify(report));
    
    render(report);
    showToast('資料已同步');
    initCoinRain();
  } catch (error) {
    renderError(error);
  }
}


function setLoading() {
  if (!state.isFirstLoad) return; // 非首次加載不顯示骨架屏，避免閃爍
  
  const skeletonCard = `
    <article class="ranking-card skeleton">
      <div class="ranking-top">
        <div class="rank-number"></div>
        <div class="person-name"><div class="sk-line w60"></div><div class="sk-line w40"></div></div>
      </div>
      <div class="score-line"><div class="sk-line w100"></div></div>
      <div class="metrics-grid">
        <div class="metric"></div><div class="metric"></div>
      </div>
    </article>
  `;
  refs.rankingList.innerHTML = skeletonCard.repeat(5);
  refs.summaryGrid.innerHTML = '';
}


function renderA1Hero(rankings) {
  const a1 = rankings.filter((r) => r.group === 'A1');
  if (!a1.length || !refs.a1HeroGrid) return;

  refs.a1HeroGrid.innerHTML = a1.map((row) => {
    const pct = Math.min(100, Math.max(0, row.score / MAX_SCORE * 100));
    const rankClass = `rank-${row.rank}`;
    const crown = row.rank === 1 ? '<span class="a1-hero-crown">👑</span>' : '';
    const isFirst = row.rank === 1;
    const metricHtml = isFirst
      ? `<div class="a1-metric"><span>實收</span><strong>${fmt(row.actualRevenue)}</strong></div>
         <div class="a1-metric"><span>追續金額</span><strong>${fmt(row.renewalRevenue)}</strong></div>
         <div class="a1-metric"><span>總業績</span><strong>${fmt(row.totalRevenue)}</strong></div>`
      : `<div class="a1-metric"><span>實收</span><strong>${fmt(row.actualRevenue)}</strong></div>
         <div class="a1-metric"><span>追續金額</span><strong>${fmt(row.renewalRevenue)}</strong></div>`;
    return `
      <article class="a1-hero-card ${rankClass}">
        ${crown}
        <div class="a1-hero-gloss"></div>
        <div class="a1-hero-rank">#${row.rank} ${row.isNew ? '新人' : ''}</div>
        <div class="a1-hero-name">${escapeHtml(row.name)}</div>
        <div class="a1-hero-score-row">
          <span class="a1-hero-score-label">AI分</span>
          <span class="a1-hero-score-value">${fmt(row.score, 2)}</span>
        </div>
        <div class="a1-hero-score-track"><div class="a1-hero-score-fill" data-pct="${pct}" style="width:0%"></div></div>
        <div class="a1-hero-metrics">${metricHtml}</div>
      </article>`;

  }).join('');
}

function render(report) {
  refs.title.textContent = report.title;
  const auditPass = String(report.auditResult).toUpperCase() === 'PASS';

  // topbar badge
  refs.auditResult.textContent = report.auditResult;
  refs.auditResult.classList.toggle('pass', auditPass);

  // hero section dates + badge
  if (refs.heroSettlementDate) refs.heroSettlementDate.textContent = report.settlementDate;
  if (refs.heroDispatchDate)   refs.heroDispatchDate.textContent   = report.dispatchDate;
  if (refs.auditResultHero)    {
    refs.auditResultHero.textContent = report.auditResult;
    refs.auditResultHero.classList.toggle('pass', auditPass);
  }

  // quick-stat strip below hero
  if (refs.statRenewalDeals)  refs.statRenewalDeals.textContent  = fmt(report.summary.renewalDeals) + ' 單';
  if (refs.statTotalRevenue)  refs.statTotalRevenue.textContent  = fmt(report.summary.totalRevenue);
  if (refs.statCashRevenue)   refs.statCashRevenue.textContent   = fmt(report.summary.actualRevenue);

  renderA1Hero(report.ranking);
  renderSummary(report.summary);
  renderRankings(report.ranking);
  renderGroups(report.groups, report.ranking);
  renderAudit(report.auditNotes, report.excludedEmployees);
  animateScoreFills();
}

function renderSummary(summary) {
  const items = [
    ['追續單成交', summary.renewalDeals, '單'],
    ['全部總業績', summary.totalRevenue, ''],
    ['追續單金額', summary.renewalRevenue, ''],
    ['實收總金額', summary.actualRevenue, '']
  ];

  refs.summaryGrid.innerHTML = items.map(([label, value, suffix]) => `
    <article class="summary-card">
      <span>${escapeHtml(label)}</span>
      <strong>${fmt(value)}${suffix}</strong>
    </article>
  `).join('');
}

function movementLabel(movement) {
  if (movement === 'up') return '上升';
  if (movement === 'down') return '下降';
  return '持平';
}

function renderRankings(rankings) {
  if (!rankings.length) {
    refs.rankingList.innerHTML = '<div class="empty-state">目前沒有正式名次資料</div>';
    return;
  }

  refs.rankingList.innerHTML = rankings.map((row) => {
    const pct = Math.min(100, Math.max(0, row.score / MAX_SCORE * 100));
    const safeId = encodeURIComponent(row.name);
    return `
      <article class="ranking-card" id="person-${safeId}">
        <div class="ranking-top">
          <span class="rank-number">#${row.rank}</span>
          <div class="person-name">
            <strong>${escapeHtml(row.name)}</strong>
            <small>${row.prevRank ? `上輪 #${row.prevRank}，${movementLabel(row.movement)}` : '本輪正式排序'}</small>
          </div>
          <span class="badge group-${escapeHtml(row.group)}">${escapeHtml(row.group)}</span>
        </div>
        <div class="score-line">
          <label><span>正式權重分數</span><strong>${fmt(row.score, 2)}</strong></label>
          <div class="score-track"><div class="score-fill" data-pct="${pct}" style="width:0%"></div></div>
        </div>
        <div class="metrics-grid">
          <div class="metric"><span>實收</span><strong>${fmt(row.actualRevenue)}</strong></div>
          <div class="metric"><span>追續金額</span><strong>${fmt(row.renewalRevenue)}</strong></div>
          <div class="metric"><span>全部總業績</span><strong>${fmt(row.totalRevenue)}</strong></div>
          <div class="metric"><span>追續單數</span><strong>${fmt(row.renewalDeals)} 單</strong></div>
        </div>
        <p class="advice">${escapeHtml(row.advice)}</p>
      </article>
    `;
  }).join('');
}

function renderGroups(groups, rankings) {
  const rankMap = new Map(rankings.map((row) => [row.name, row.rank]));
  const labels = {
    A1: '高優先主力',
    A2: '次主力追進',
    B: '一般量單',
    C: '補位觀察'
  };

  refs.groupsGrid.innerHTML = ['A1', 'A2', 'B', 'C'].map((key) => {
    const members = groups[key] || [];
    return `
      <article class="group-card">
        <h3>${key}｜${labels[key]}（${members.length}）</h3>
        <div class="member-list">
          ${members.map((name) => `<span class="member-chip">#${rankMap.get(name) || '-'} ${escapeHtml(name)}</span>`).join('')}
        </div>
      </article>
    `;
  }).join('');
}

function renderAudit(notes, excluded) {
  refs.auditNotes.innerHTML = notes.length
    ? notes.map((note) => `<div class="audit-note">${escapeHtml(note)}</div>`).join('')
    : '<div class="empty-state">本輪無額外審計提醒</div>';

  refs.excludedList.innerHTML = excluded.length
    ? excluded.map((item) => `<div class="audit-note">${escapeHtml(item.name || item)} ${escapeHtml(item.reason || '')}</div>`).join('')
    : '';
}

function renderSendText(text) {
  state.sendText = text || '';
  if (refs.broadcastOutput) refs.broadcastOutput.value = state.sendText;
  if (refs.lineShare) {
    refs.lineShare.href = state.sendText
      ? `https://line.me/R/share?text=${encodeURIComponent(state.sendText)}`
      : '#';
  }
}

function renderError(error) {
  refs.auditResult.textContent = 'ERROR';
  refs.summaryGrid.innerHTML = `<div class="empty-state">${escapeHtml(error.message || '資料讀取失敗')}</div>`;
  refs.rankingList.innerHTML = '<div class="empty-state">請確認伺服器已啟動並重新整理</div>';
  refs.groupsGrid.innerHTML = '';
  refs.auditNotes.innerHTML = '';
  renderSendText('');
  showToast('資料讀取失敗');
}

async function copyText() {
  const text = state.sendText.trim();
  if (!text) { showToast('沒有可傳送的公告文字'); return; }
  try {
    await navigator.clipboard.writeText(text);
    showToast('公告已複製');
  } catch {
    showToast('複製失敗，請長按文字手動複製');
  }
}

function animateScoreFills() {
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      document.querySelectorAll('[data-pct]').forEach((el) => {
        el.style.width = el.dataset.pct + '%';
      });
    });
  });
}

async function shareText() {
  const text = state.sendText.trim();
  if (!text) { showToast('沒有可分享的公告文字'); return; }
  if (navigator.share) {
    await navigator.share({ title: state.report?.title || 'AI 派單公告', text });
    return;
  }
  await copyText();
}

function openSearch() {
  refs.searchModal.classList.add('is-open');
  refs.lookupInput.value = '';
  refs.lookupResults.innerHTML = '';
  setTimeout(() => refs.lookupInput.focus(), 0);
}

function closeSearch() {
  refs.searchModal.classList.remove('is-open');
}

function handleLookup() {
  const query = refs.lookupInput.value.trim();
  if (!query) {
    refs.lookupResults.innerHTML = '';
    return;
  }

  const matches = (state.report?.ranking || []).filter((row) => row.name.includes(query));
  refs.lookupResults.innerHTML = matches.length
    ? matches.map((row) => `
        <button class="lookup-result" type="button" data-name="${escapeHtml(row.name)}">
          #${row.rank} ${highlightText(row.name, query)}｜${escapeHtml(row.group)}｜${fmt(row.score, 2)}
        </button>
      `).join('')
    : '<div class="empty-state">找不到符合的姓名</div>';

}

function scrollToPerson(name) {
  const el = document.getElementById(`person-${encodeURIComponent(name)}`);
  closeSearch();
  if (!el) return;
  document.querySelectorAll('.ranking-card.is-highlight').forEach((card) => card.classList.remove('is-highlight'));
  el.classList.add('is-highlight');
  el.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

let toastTimer = null;
function showToast(message) {
  clearTimeout(toastTimer);
  refs.toast.textContent = message;
  refs.toast.classList.add('is-visible');
  toastTimer = setTimeout(() => refs.toast.classList.remove('is-visible'), 1800);
}

function debounce(fn, delay) {
  let timer = null;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), delay);
  };
}

const debouncedLookup = debounce(handleLookup, 180);
const debouncedLoadData = debounce(loadData, 300);

function bindEvents() {
  refs.refreshData.addEventListener('click', debouncedLoadData);
  refs.searchOpen.addEventListener('click', openSearch);
  refs.searchClose.addEventListener('click', closeSearch);
  refs.searchModal.addEventListener('click', (event) => {
    if (event.target === refs.searchModal) closeSearch();
  });
  refs.lookupInput.addEventListener('input', debouncedLookup);
  refs.lookupResults.addEventListener('click', (event) => {
    const target = event.target.closest('[data-name]');
    if (target) scrollToPerson(target.dataset.name);
  });
}

/* ─────────────────────────────────────────────────────────────────
   瑞士楓葉金幣｜積沙成塔物理引擎
   - 真實重力 + 反彈衰減 + 堆積高度圖
   - 楓葉浮雕 + 放射紋 + 雙層光暈 + 活動閃光
   ───────────────────────────────────────────────────────────────── */

class MapleCoinRain {
  constructor(canvas) {
    this.cv = canvas;
    this.cx = canvas.getContext('2d', { alpha: true });
    this.coins  = [];   // 飛行中
    this.pile   = [];   // 已落定
    this.frame  = 0;
    this.running = false;
    this.raf    = null;
    /* 效能核心：預渲染 sprite cache，避免每幀重繪放射紋與楓葉 */
    this._spriteCache = new Map();
    this._resize();
    window.addEventListener('resize', () => this._resize(), { passive: true });
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) this._pause();
      else this._resume();
    });
  }

  _resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.W = this.cv.offsetWidth  || 320;
    this.H = this.cv.offsetHeight || 220;
    this.cv.width  = Math.round(this.W * dpr);
    this.cv.height = Math.round(this.H * dpr);
    this.cx.setTransform(dpr, 0, 0, dpr, 0, 0);
    this._spriteCache.clear(); // resize 後需重建 sprite
  }

  /* 查詢 x 位置的最高堆積 y（碰到哪個落定硬幣最高） */
  _floorAt(x, r) {
    let floor = this.H;
    for (const p of this.pile) {
      const dx = p.x - x;
      const gap = p.r + r;
      if (Math.abs(dx) < gap) {
        const top = p.y - Math.sqrt(Math.max(0, gap * gap - dx * dx));
        if (top < floor) floor = top;
      }
    }
    return floor;
  }

  _spawn() {
    const r  = 8 + Math.random() * 6;
    const margin = r + 4;
    this.coins.push({
      x:       margin + Math.random() * Math.max(1, this.W - margin * 2),
      y:       -r,
      vx:      (Math.random() - 0.5) * 2.4,
      vy:      0.6 + Math.random() * 2.2,
      r,
      spin:    (Math.random() - 0.5) * 0.10,
      tilt:    Math.random() * Math.PI * 2,
      tiltSpd: (Math.random() - 0.5) * 0.065,
      bounces: 0,
      done:    false,
    });
  }

  _update() {
    this.frame++;
    const maxPile = Math.floor(this.W / 20);
    /* 效能優化：降低 spawn 頻率，堆積愈多愈慢 */
    const interval = 16 + this.pile.length * 4;
    if (this.frame % interval === 0 && this.pile.length < maxPile) {
      this._spawn();
    }

    for (const c of this.coins) {
      if (c.done) continue;
      c.vy   = Math.min(c.vy + 0.44, 13);
      c.x   += c.vx;
      c.y   += c.vy;
      c.tilt += c.tiltSpd;

      if (c.x - c.r < 0)       { c.x = c.r;        c.vx = Math.abs(c.vx) * 0.52; }
      if (c.x + c.r > this.W)  { c.x = this.W - c.r; c.vx = -Math.abs(c.vx) * 0.52; }

      const floor = this._floorAt(c.x, c.r);
      if (c.y + c.r >= floor) {
        c.y    = floor - c.r;
        c.vy  *= -0.28;
        c.vx  *= 0.68;
        c.spin *= 0.78;
        c.bounces++;
        if (Math.abs(c.vy) < 0.85 && c.bounces >= 1) {
          c.done = true;
          c.vy = 0; c.vx = 0; c.spin = 0;
          this.pile.push(c);
        }
      }
    }
    this.coins = this.coins.filter(c => !c.done);
  }

  /**
   * 預渲染金幣 sprite（按半徑快取）
   * 將所有昂貴的漸層、放射紋、楓葉路徑一次繪入離線 canvas，
   * 後續每幀只需 drawImage，大幅降低 GPU 繪製指令數。
   */
  _getCoinSprite(r) {
    const key = Math.round(r); // 依整數半徑快取
    if (this._spriteCache.has(key)) return this._spriteCache.get(key);

    const pad = 8; // shadow 溢出空間
    const size = (key + pad) * 2;
    const offscreen = document.createElement('canvas');
    offscreen.width = size;
    offscreen.height = size;
    const g = offscreen.getContext('2d');
    const cx = size / 2;
    const cy = size / 2;

    // 落影
    g.shadowColor = 'rgba(0,0,0,0.55)';
    g.shadowBlur = 7;
    g.shadowOffsetY = 3;

    // 外緣
    const rim = g.createRadialGradient(cx - key * .13, cy - key * .20, key * .04, cx, cy, key);
    rim.addColorStop(0, '#FFE96E');
    rim.addColorStop(0.76, '#C8960C');
    rim.addColorStop(0.88, '#7A5200');
    rim.addColorStop(1, '#4E3400');
    g.beginPath();
    g.arc(cx, cy, key, 0, Math.PI * 2);
    g.fillStyle = rim;
    g.fill();
    g.shadowColor = 'transparent';

    // 正面
    const fr = key * 0.83;
    const face = g.createRadialGradient(cx - key * .24, cy - key * .28, 0, cx, cy, fr);
    face.addColorStop(0, '#FFFAC8');
    face.addColorStop(0.22, '#FFD700');
    face.addColorStop(0.60, '#E8A800');
    face.addColorStop(1, '#A87000');
    g.beginPath();
    g.arc(cx, cy, fr, 0, Math.PI * 2);
    g.fillStyle = face;
    g.fill();

    // 放射紋（已從 40 條減為 16 條，視覺差異極小但效能翻倍）
    g.save();
    g.beginPath();
    g.arc(cx, cy, fr, 0, Math.PI * 2);
    g.clip();
    g.strokeStyle = 'rgba(110,60,0,0.13)';
    g.lineWidth = 0.55;
    for (let i = 0; i < 16; i++) {
      g.save();
      g.translate(cx, cy);
      g.rotate((i / 16) * Math.PI * 2);
      g.beginPath();
      g.moveTo(0, 0);
      g.lineTo(0, -fr);
      g.stroke();
      g.restore();
    }
    g.restore();

    // 楓葉浮雕
    g.save();
    g.translate(cx, cy);
    const ls = key * 0.052;
    g.scale(ls, ls);
    g.fillStyle = 'rgba(130,65,0,0.50)';
    g.strokeStyle = 'rgba(90,42,0,0.22)';
    g.lineWidth = 0.6;
    const lf = [
      [0,-9],[1.3,-5.4],[4.6,-6.3],[3.3,-3.1],
      [7.2,-1.6],[5.6,0.3],[6.3,3.9],[3.1,2.6],
      [2.1,6.8],[0,5.4],[-2.1,6.8],[-3.1,2.6],
      [-6.3,3.9],[-5.6,0.3],[-7.2,-1.6],[-3.3,-3.1],
      [-4.6,-6.3],[-1.3,-5.4],
    ];
    g.beginPath();
    g.moveTo(lf[0][0], lf[0][1]);
    for (let i = 1; i < lf.length; i++) g.lineTo(lf[i][0], lf[i][1]);
    g.closePath();
    g.fill();
    g.stroke();
    // 葉柄
    g.strokeStyle = 'rgba(130,65,0,0.50)';
    g.lineWidth = 1.4;
    g.beginPath();
    g.moveTo(0, 6.8);
    g.lineTo(0, 10.2);
    g.stroke();
    g.restore();

    // 頂部高光
    const hi = g.createLinearGradient(cx - key * .28, cy - key, cx + key * .12, cy - key * .12);
    hi.addColorStop(0, 'rgba(255,255,255,0.30)');
    hi.addColorStop(1, 'rgba(255,255,255,0)');
    g.beginPath();
    g.arc(cx, cy, fr, 0, Math.PI * 2);
    g.fillStyle = hi;
    g.fill();

    this._spriteCache.set(key, { canvas: offscreen, pad });
    return { canvas: offscreen, pad };
  }

  /* ── 繪製單枚金幣（使用快取 sprite） ── */
  _drawCoin(c, t) {
    const ctx = this.cx;
    const { x, y, r, tilt } = c;
    const squish = Math.max(0.07, Math.abs(Math.cos(tilt)));
    const sprite = this._getCoinSprite(r);
    const drawSize = (Math.round(r) + sprite.pad) * 2;

    ctx.save();
    ctx.translate(x, y);
    ctx.scale(squish, 1);
    ctx.drawImage(sprite.canvas, -drawSize / 2, -drawSize / 2, drawSize, drawSize);

    /* 動態閃光（極低開銷：只有 2 個圓弧） */
    const glint = (Math.sin(t * 0.0028 + x * 0.09) + 1) * 0.5;
    if (glint > 0.72 && squish > 0.32) {
      const gs = (glint - 0.72) / 0.28;
      ctx.beginPath();
      ctx.arc(-r * .30, -r * .34, r * .15, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255,255,255,${gs * 0.60})`;
      ctx.fill();
      ctx.beginPath();
      ctx.arc(r * .20, -r * .18, r * .07, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255,255,255,${gs * 0.30})`;
      ctx.fill();
    }
    ctx.restore();
  }

  _draw() {
    const t = performance.now();
    this.cx.clearRect(0, 0, this.W, this.H);
    /* 堆積金幣先畫（底層） */
    for (let i = this.pile.length - 1; i >= 0; i--) this._drawCoin(this.pile[i], t);
    /* 飛行中金幣疊在上方 */
    for (const c of this.coins) this._drawCoin(c, t);
  }

  _tick() {
    if (!this.running) return;
    this._update();
    this._draw();
    this.raf = requestAnimationFrame(() => this._tick());
  }

  _pause() {
    this.running = false;
    if (this.raf) cancelAnimationFrame(this.raf);
    this.raf = null;
  }

  _resume() {
    if (this.running) return;
    this.running = true;
    this._tick();
  }

  start() {
    this._resize();
    this._resume();
  }

  stop() { this._pause(); }
}

let _coinRain = null;

function initCoinRain() {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const cv = document.getElementById('mobile-coin-canvas');
  if (!cv) return;
  if (_coinRain) { _coinRain.stop(); _coinRain = null; }
  /* 效能優化：延遲到瀏覽器空閒時初始化金幣引擎，確保首屏資料渲染不受阻塞 */
  const startRain = () => {
    _coinRain = new MapleCoinRain(cv);
    _coinRain.start();
  };
  if ('requestIdleCallback' in window) {
    requestIdleCallback(startRain, { timeout: 2000 });
  } else {
    setTimeout(startRain, 800);
  }
}

function initHeroTilt() {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const grid = refs.a1HeroGrid;
  if (!grid) return;

  grid.addEventListener('touchmove', (e) => {
    const touch = e.touches[0];
    const card = touch.target.closest('.a1-hero-card');
    if (!card) return;
    const rect = card.getBoundingClientRect();
    const x = ((touch.clientX - rect.left) / rect.width - 0.5) * 2;
    const y = ((touch.clientY - rect.top)  / rect.height - 0.5) * 2;
    const tiltX = (-y * 8).toFixed(2);
    const tiltY = ( x * 8).toFixed(2);
    
    // 動態光源模擬：根據觸控位置調整 gloss 與內陰影
    const lightX = ((x + 1) * 50).toFixed(1);
    const lightY = ((y + 1) * 50).toFixed(1);
    
    card.style.transform = `perspective(600px) rotateX(${tiltX}deg) rotateY(${tiltY}deg) translateZ(8px) scale(1.02)`;
    card.style.setProperty('--light-x', `${lightX}%`);
    card.style.setProperty('--light-y', `${lightY}%`);

  }, { passive: true });

  grid.addEventListener('touchend', () => {
    grid.querySelectorAll('.a1-hero-card').forEach((card) => {
      card.style.transform = '';
    });
  }, { passive: true });

  grid.addEventListener('touchcancel', () => {
    grid.querySelectorAll('.a1-hero-card').forEach((card) => {
      card.style.transform = '';
    });
  }, { passive: true });
}

function initActiveNav() {
  const navLinks = document.querySelectorAll('.bottom-nav a[href^="#"]');
  if (!navLinks.length || !('IntersectionObserver' in window)) return;

  const sectionIds = [...navLinks].map((a) => a.getAttribute('href').slice(1));
  const visible = new Set();

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) visible.add(entry.target.id);
      else visible.delete(entry.target.id);
    });
    const active = sectionIds.find((id) => visible.has(id));
    navLinks.forEach((a) => {
      a.classList.toggle('is-active', a.getAttribute('href') === `#${active}`);
    });
  }, { threshold: 0.25 });

  sectionIds.forEach((id) => {
    const el = document.getElementById(id);
    if (el) observer.observe(el);
  });
}

bindEvents();
initActiveNav();
initHeroTilt();
loadData();
