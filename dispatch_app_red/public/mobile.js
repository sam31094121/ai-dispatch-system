const API_CURRENT = '/api/current';
const API_LINE_OUTPUT = '/api/line-output';
const MAX_SCORE = 10000;
const CACHE_VERSION = 'v20260510-production-2249';

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
  broadcastOutput: document.getElementById('broadcast-output'),
  groupShortOutput: document.getElementById('group-short-output'),
  copyLineText: document.getElementById('copy-line-text'),
  copyShortText: document.getElementById('copy-short-text'),
  shareLineText: document.getElementById('share-line-text'),
  lineShare: document.getElementById('line-share'),
  toast: document.getElementById('toast')
};

const state = {
  report: null,
  sendText: '',
  isFirstLoad: true
};

const CACHE_KEY = 'zhaogui_last_report_unified';


function get(obj, keys, fallback = '') {
  for (const key of keys) {
    if (obj && obj[key] !== undefined && obj[key] !== null && obj[key] !== '') {
      return obj[key];
    }
  }
  return fallback;
}

function asArray(value) {
  if (Array.isArray(value)) return value;
  if (value === undefined || value === null || value === '') return [];
  return [value];
}

function getDeep(obj, paths, fallback = '') {
  for (const path of paths) {
    const parts = path.split('.');
    let current = obj;
    let found = true;
    for (const part of parts) {
      if (current && Object.prototype.hasOwnProperty.call(current, part)) {
        current = current[part];
      } else {
        found = false;
        break;
      }
    }
    if (found && current !== undefined && current !== null && current !== '') return current;
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
  // 原本的過濾邏輯會切除業績數據，現已移除以確保公告完整性
  return String(text || '').trim();
}

function normalizeTitle(snapshot, standardData, report) {
  return getDeep(snapshot, ['title', 'broadcast.title'], '') ||
    get(standardData, ['公告標題'], '') ||
    get(report, ['title'], '') ||
    'AI 派單公告';
}

function normalizeExcludedEntry(entry) {
  if (entry && typeof entry === 'object') return entry;
  const text = String(entry || '').trim();
  const name = text.match(/姓名=([^;}\s]+)/u)?.[1] || text;
  const reason = text.match(/原因=([^;}\s]+)/u)?.[1] || '';
  return { name, reason };
}

function normalizeDate(value) {
  const raw = String(value || '').trim();
  if (!raw) return '--';
  // 處理 2026-05-08
  const matchIso = raw.match(/^(\d{4})-(\d{2})-(\d{2})$/u);
  if (matchIso) return `${Number(matchIso[2])}/${Number(matchIso[3])}`;
  // 處理 115/05/08
  const matchRoc = raw.match(/^(\d+)\/(\d+)\/(\d+)$/u);
  if (matchRoc) return `${Number(matchRoc[2])}/${Number(matchRoc[3])}`;
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
  const standardData = snapshot.standardData || {};
  const report = snapshot.report || {};
  const rankings =
    snapshot.ranking ||
    standardData.正式名次 ||
    report.rankings ||
    [];
  const ranking = asArray(rankings)
    .map(normalizeRanking)
    .filter((row) => row.rank && row.name)
    .sort((a, b) => a.rank - b.rank);
  const summary = {
    ...(report.summaryBoard || {}),
    ...(standardData.整合總盤 || {}),
    ...(snapshot.summary || {})
  };
  const audit = snapshot.audit || report.audit || {};
  const standardAudit = standardData.審計結論 || {};
  const standardDates = standardData.日期資訊 || {};
  const text =
    lineText ||
    getDeep(snapshot, ['broadcast.scriptText', 'broadcast.text'], '') ||
    snapshot.announcement ||
    report.announcement ||
    report.groupShortText ||
    standardData.群組超精簡版 ||
    '';

  return {
    title: normalizeTitle(snapshot, standardData, report),
    settlementDate: normalizeDate(standardDates.結算日 || report.settlementDate || report.reportDate || snapshot.settlementDate),
    dispatchDate: normalizeDate(standardDates.派單日 || report.dispatchDate || snapshot.dispatchDate),
    auditResult: audit.status || audit.result || standardAudit.結果 || report.auditResult || snapshot.validation?.status || 'PASS',
    ranking,
    groups: snapshot.groups || standardData.分級 || report.groups || {},
    summary: {
      renewalDeals: num(summary.renewalDeals || summary.追續單成交 || summary.累積追續總成交數 || summary.累積派單總成交數),
      totalRevenue: num(summary.totalRevenue || summary.全部總業績 || summary.本月業績),
      renewalRevenue: num(summary.renewalRevenue || summary.追續單金額 || summary.追續單總金額 || summary.當日續單金額),
      actualRevenue: num(summary.actualRevenue || summary.實收總金額 || summary.實收)
    },
    auditNotes: asArray(audit.notes || standardAudit.特別說明 || report.audit?.notes),
    excludedEmployees: asArray(audit.excludedEmployees || standardAudit.審計列示不入派單 || report.audit?.excludedEmployees).map(normalizeExcludedEntry),
    auditWarnings: asArray(snapshot.auditWarnings || report.auditWarnings),
    reportTotal: snapshot.reportTotal || report.reportTotal || null,
    assignmentTotal: snapshot.assignmentTotal || report.assignmentTotal || null,
    maxValues: snapshot.maxValues || report.maxValues || null,
    groupShortText: snapshot.groupShortText || report.groupShortText || standardData['群組超精簡版'] || '',
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
      if (data?.version === CACHE_VERSION && data?.report) {
        state.report = data.report;
        state.sendText = data.report.sendText || '';
        render(data.report);
      }
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
    localStorage.setItem(CACHE_KEY, JSON.stringify({ version: CACHE_VERSION, report }));
    
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
  if (!refs.a1HeroGrid) return;
  if (!a1.length) {
    refs.a1HeroGrid.innerHTML = '<div class="empty-state">目前沒有 A1 主力資料</div>';
    return;
  }

  refs.a1HeroGrid.innerHTML = a1.map((row) => {
    const pct = Math.min(100, Math.max(0, row.score / MAX_SCORE * 100));
    const rankClass = `rank-${row.rank}`;
    const crown = row.rank === 1 ? '<span class="a1-hero-crown">👑</span>' : '';
    const metricHtml = `
      <div class="a1-metric"><span>實收</span><strong>${fmt(row.actualRevenue)}</strong></div>
      <div class="a1-metric"><span>追續金額</span><strong>${fmt(row.renewalRevenue)}</strong></div>
      <div class="a1-metric"><span>總業績</span><strong>${fmt(row.totalRevenue)}</strong></div>
    `;
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
  renderAudit(report.auditNotes, report.excludedEmployees, report.auditWarnings);
  renderDualTotals(report.reportTotal, report.assignmentTotal);
  renderSendText(report.sendText, report.groupShortText);
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
  const groupMap = {
    A1: asArray(groups.A1),
    A2: asArray(groups.A2),
    B: asArray(groups.B),
    C: asArray(groups.C)
  };
  const labels = {
    A1: '高優先主力',
    A2: '次主力追進',
    B: '一般量單',
    C: '補位觀察'
  };

  refs.groupsGrid.innerHTML = ['A1', 'A2', 'B', 'C'].map((key) => {
    const members = groupMap[key] || [];
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

function renderAudit(notes, excluded, warnings = []) {
  const warningHtml = warnings.length
    ? warnings.map((w) => `<div class="audit-warning"><span class="audit-warning-icon">⚠️</span>${escapeHtml(w)}</div>`).join('')
    : '';

  const notesHtml = notes.length
    ? notes.map((note) => `<div class="audit-note">${escapeHtml(note)}</div>`).join('')
    : '<div class="empty-state">本輪無額外審計提醒</div>';

  refs.auditNotes.innerHTML = warningHtml + notesHtml;

  refs.excludedList.innerHTML = excluded.length
    ? excluded.map((item) => `<div class="audit-note">${escapeHtml(item.name || item)} ${escapeHtml(item.reason || '')}</div>`).join('')
    : '';
}

function renderDualTotals(reportTotal, assignmentTotal) {
  const container = document.getElementById('dual-totals');
  if (!container) return;
  if (!reportTotal && !assignmentTotal) { container.innerHTML = ''; return; }

  const makeRow = (label, data, cls) => {
    if (!data) return '';
    return `
      <article class="dual-total-card ${cls}">
        <h4>${escapeHtml(data.label || label)}</h4>
        <div class="dual-total-grid">
          <div><span>追續單成交</span><strong>${fmt(data.followupCount)} 單</strong></div>
          <div><span>全部總業績</span><strong>${fmt(data.totalRevenue)}</strong></div>
          <div><span>追續單金額</span><strong>${fmt(data.followupAmount)}</strong></div>
          <div><span>實收總金額</span><strong>${fmt(data.actualRevenue)}</strong></div>
        </div>
        ${data.excludedReason ? `<p class="dual-total-note">${escapeHtml(data.excludedReason)}</p>` : ''}
      </article>`;
  };

  container.innerHTML =
    makeRow('三平台報表總盤（含已離職）', reportTotal, 'total-report') +
    makeRow('正式派單運算盤（排除已離職）', assignmentTotal, 'total-assignment');
}

function renderSendText(text, shortText) {
  state.sendText = text || '';
  if (refs.broadcastOutput) refs.broadcastOutput.value = state.sendText;
  if (refs.groupShortOutput) refs.groupShortOutput.textContent = shortText || '';
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

async function copyShortTextFn() {
  const text = (state.report?.groupShortText || '').trim();
  if (!text) { showToast('沒有精簡版公告'); return; }
  try {
    await navigator.clipboard.writeText(text);
    showToast('精簡版已複製');
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
  refs.copyLineText?.addEventListener('click', copyText);
  refs.copyShortText?.addEventListener('click', copyShortTextFn);
  refs.shareLineText?.addEventListener('click', shareText);
  refs.searchOpen?.addEventListener('click', openSearch);
  refs.searchClose?.addEventListener('click', closeSearch);
  refs.searchModal.addEventListener('click', (event) => {
    if (event.target === refs.searchModal) closeSearch();
  });
  refs.lookupInput?.addEventListener('input', debouncedLookup);
  refs.lookupResults?.addEventListener('click', (event) => {
    const target = event.target.closest('[data-name]');
    if (target) scrollToPerson(target.dataset.name);
  });
}

/* ─────────────────────────────────────────────────────────────────
   瑞士楓葉金幣 ＋ 美金鈔票｜積沙成塔物理引擎
   金幣：多層鑄幣紋 + 楓葉浮雕貝塞爾曲線 + 光譜鏡面高光
   美金：格紋紙紋 + 肖像橢圓 + 安全線 + 面額文字
   ───────────────────────────────────────────────────────────────── */

// roundRect polyfill for older WebViews (Chrome < 99, Safari < 15.4)
if (typeof CanvasRenderingContext2D !== 'undefined' && !CanvasRenderingContext2D.prototype.roundRect) {
  CanvasRenderingContext2D.prototype.roundRect = function(x, y, w, h, r) {
    const rad = Array.isArray(r) ? r[0] : (r || 0);
    this.beginPath();
    this.moveTo(x + rad, y);
    this.lineTo(x + w - rad, y);
    this.quadraticCurveTo(x + w, y, x + w, y + rad);
    this.lineTo(x + w, y + h - rad);
    this.quadraticCurveTo(x + w, y + h, x + w - rad, y + h);
    this.lineTo(x + rad, y + h);
    this.quadraticCurveTo(x, y + h, x, y + h - rad);
    this.lineTo(x, y + rad);
    this.quadraticCurveTo(x, y, x + rad, y);
    this.closePath();
  };
}

function _drawMapleLeafPath(g) {
  g.beginPath();
  g.moveTo(0, -9);
  g.bezierCurveTo( 0.5, -7.6,  1.6, -6.8,  2.0, -6.2);
  g.bezierCurveTo( 3.8, -6.8,  5.2, -6.0,  4.8, -4.6);
  g.bezierCurveTo( 7.0, -3.6,  7.8, -1.8,  6.2, -0.7);
  g.bezierCurveTo( 7.3,  0.8,  6.6,  2.5,  4.9,  2.0);
  g.bezierCurveTo( 5.8,  4.2,  4.6,  5.8,  2.9,  4.8);
  g.bezierCurveTo( 2.2,  6.5,  0.8,  7.0,  0.0,  5.8);
  g.bezierCurveTo(-0.8,  7.0, -2.2,  6.5, -2.9,  4.8);
  g.bezierCurveTo(-4.6,  5.8, -5.8,  4.2, -4.9,  2.0);
  g.bezierCurveTo(-6.6,  2.5, -7.3,  0.8, -6.2, -0.7);
  g.bezierCurveTo(-7.8, -1.8, -7.0, -3.6, -4.8, -4.6);
  g.bezierCurveTo(-5.2, -6.0, -3.8, -6.8, -2.0, -6.2);
  g.bezierCurveTo(-1.6, -6.8, -0.5, -7.6,  0.0, -9.0);
  g.closePath();
}

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
    if (Math.random() < 0.32) {
      // 美金鈔票（32% 機率）
      const bw = 28 + Math.random() * 14;
      const bh = Math.round(bw * 0.44);
      const margin = bw * 0.5 + 4;
      this.coins.push({
        type: 'bill',
        x:   margin + Math.random() * Math.max(1, this.W - margin * 2),
        y:   -bh,
        vx:  (Math.random() - 0.5) * 1.6,
        vy:  0.4 + Math.random() * 1.6,
        r:   bh * 0.5,   // 碰撞半徑（用高度的一半）
        bw, bh,
        tilt:     (Math.random() - 0.5) * 0.30,
        tiltSpd:  (Math.random() - 0.5) * 0.012,
        flutter:  Math.random() * Math.PI * 2,
        flutterSpd: 0.038 + Math.random() * 0.055,
        bounces: 0, done: false,
      });
    } else {
      // 楓葉金幣（68% 機率）
      const r = 8 + Math.random() * 7;
      const margin = r + 4;
      this.coins.push({
        type: 'coin',
        x:       margin + Math.random() * Math.max(1, this.W - margin * 2),
        y:       -r,
        vx:      (Math.random() - 0.5) * 2.4,
        vy:      0.6 + Math.random() * 2.2,
        r,
        spin:    (Math.random() - 0.5) * 0.10,
        tilt:    Math.random() * Math.PI * 2,
        tiltSpd: (Math.random() - 0.5) * 0.065,
        bounces: 0, done: false,
      });
    }
  }

  _update() {
    this.frame++;
    const maxPile = Math.floor(this.W / 18);
    const interval = 16 + this.pile.length * 4;
    if (this.frame % interval === 0 && this.pile.length < maxPile) this._spawn();

    for (const c of this.coins) {
      if (c.done) continue;

      if (c.type === 'bill') {
        c.vy = Math.min(c.vy + 0.22, 7);
        c.flutter += c.flutterSpd;
        c.vx += Math.sin(c.flutter * 1.4) * 0.09;
        c.vx = Math.max(-2.8, Math.min(2.8, c.vx));
        c.vx *= 0.978;
        c.tilt += Math.sin(c.flutter * 0.8) * 0.005;
        c.tilt = Math.max(-0.42, Math.min(0.42, c.tilt));
      } else {
        c.vy = Math.min(c.vy + 0.44, 13);
        c.tilt += c.tiltSpd;
      }

      c.x += c.vx;
      c.y += c.vy;

      const hw = c.type === 'bill' ? c.bw * 0.5 : c.r;
      if (c.x - hw < 0)       { c.x = hw;          c.vx =  Math.abs(c.vx) * 0.50; }
      if (c.x + hw > this.W)  { c.x = this.W - hw; c.vx = -Math.abs(c.vx) * 0.50; }

      const floor = this._floorAt(c.x, c.r);
      if (c.y + c.r >= floor) {
        c.y   = floor - c.r;
        c.vy *= c.type === 'bill' ? -0.18 : -0.28;
        c.vx *= 0.65;
        c.bounces++;
        if (c.type === 'bill') { c.tiltSpd = 0; }
        else { c.spin = (c.spin || 0) * 0.75; }
        if (Math.abs(c.vy) < 0.75 && c.bounces >= 1) {
          c.done = true;
          c.vy = 0; c.vx = 0;
          if (c.type === 'bill') { c.tilt = 0; c.flutter = 0; }
          else { c.spin = 0; }
          this.pile.push(c);
        }
      }
    }
    this.coins = this.coins.filter(c => !c.done);
  }

  _getCoinSprite(r) {
    const key = Math.round(r);
    const cacheKey = 'coin_' + key;
    if (this._spriteCache.has(cacheKey)) return this._spriteCache.get(cacheKey);

    const pad = 10;
    const size = (key + pad) * 2;
    const off = document.createElement('canvas');
    off.width = size; off.height = size;
    const g = off.getContext('2d');
    const cx = size / 2, cy = size / 2;

    // ─ 1. 落影 ─
    g.shadowColor = 'rgba(0,0,0,0.72)';
    g.shadowBlur = key * 0.55;
    g.shadowOffsetX = key * 0.07;
    g.shadowOffsetY = key * 0.20;
    g.beginPath(); g.arc(cx, cy, key * 0.98, 0, Math.PI * 2);
    g.fillStyle = '#000'; g.fill();
    g.shadowColor = 'transparent'; g.shadowBlur = 0;
    g.shadowOffsetX = 0; g.shadowOffsetY = 0;

    // ─ 2. 鑄幣齒邊（reeding） ─
    const teeth = Math.max(20, Math.floor(key * 2.1));
    g.beginPath();
    for (let i = 0; i <= teeth * 2; i++) {
      const a = (i / (teeth * 2)) * Math.PI * 2;
      const rad = i % 2 === 0 ? key * 0.99 : key * 0.91;
      if (i === 0) g.moveTo(cx + Math.cos(a) * rad, cy + Math.sin(a) * rad);
      else g.lineTo(cx + Math.cos(a) * rad, cy + Math.sin(a) * rad);
    }
    g.closePath();
    const edgeG = g.createRadialGradient(cx - key*0.1, cy - key*0.22, key*0.65, cx, cy, key);
    edgeG.addColorStop(0,    '#D8A825'); edgeG.addColorStop(0.45, '#A07010');
    edgeG.addColorStop(0.78, '#785000'); edgeG.addColorStop(1,    '#3C2200');
    g.fillStyle = edgeG; g.fill();

    // 頂部邊緣反光
    g.beginPath(); g.arc(cx, cy, key * 0.985, Math.PI * 1.08, Math.PI * 1.92);
    g.strokeStyle = 'rgba(255,230,110,0.42)'; g.lineWidth = 0.9; g.stroke();

    // ─ 3. 正面金屬金盤 ─
    const fr = key * 0.84;
    const faceG = g.createRadialGradient(cx - key*0.23, cy - key*0.28, 0, cx + key*0.06, cy + key*0.08, fr*1.05);
    faceG.addColorStop(0.00, '#FFFCE8'); faceG.addColorStop(0.06, '#FFE84A');
    faceG.addColorStop(0.26, '#F5C000'); faceG.addColorStop(0.52, '#D49208');
    faceG.addColorStop(0.75, '#AA6800'); faceG.addColorStop(0.91, '#784800');
    faceG.addColorStop(1.00, '#4A2C00');
    g.beginPath(); g.arc(cx, cy, fr, 0, Math.PI * 2);
    g.fillStyle = faceG; g.fill();

    // ─ 4. 車削同心環紋（lathe lines） ─
    g.save();
    g.beginPath(); g.arc(cx, cy, fr, 0, Math.PI * 2); g.clip();
    const rings = Math.max(4, Math.floor(fr / 2.0));
    for (let i = 1; i <= rings; i++) {
      g.beginPath(); g.arc(cx, cy, (i / rings) * fr, 0, Math.PI * 2);
      g.strokeStyle = `rgba(70,32,0,${0.038 + (i % 4 === 0 ? 0.022 : 0)})`;
      g.lineWidth = 0.32; g.stroke();
    }
    g.restore();

    // ─ 5. 內緣浮雕環 ─
    g.beginPath(); g.arc(cx, cy, fr * 0.938, 0, Math.PI * 2);
    g.strokeStyle = 'rgba(255,215,55,0.22)'; g.lineWidth = 0.7; g.stroke();
    g.beginPath(); g.arc(cx, cy, fr * 0.915, 0, Math.PI * 2);
    g.strokeStyle = 'rgba(55,24,0,0.32)'; g.lineWidth = 0.5; g.stroke();

    // ─ 6. 楓葉浮雕 ─
    g.save();
    g.translate(cx, cy);
    const ls = key * 0.054;
    g.scale(ls, ls);

    // 陰影層（偏移模擬浮雕深度）
    g.save(); g.translate(0.55, 0.85);
    g.fillStyle = 'rgba(44,16,0,0.58)';
    _drawMapleLeafPath(g); g.fill(); g.restore();

    // 主葉面
    g.fillStyle = 'rgba(152,70,0,0.62)';
    g.strokeStyle = 'rgba(210,120,0,0.25)'; g.lineWidth = 0.5;
    _drawMapleLeafPath(g); g.fill(); g.stroke();

    // 高光層（上移以示凸起受光）
    g.save(); g.translate(-0.28, -0.50);
    g.fillStyle = 'rgba(225,128,22,0.24)';
    _drawMapleLeafPath(g); g.fill(); g.restore();

    // 葉柄
    g.strokeStyle = 'rgba(148,68,0,0.58)'; g.lineWidth = 1.35; g.lineCap = 'round';
    g.beginPath(); g.moveTo(0, 5.8);
    g.bezierCurveTo(0.3, 7.8, -0.15, 9.2, 0, 10.0); g.stroke();
    g.restore();

    // ─ 7. 主光源高光（左上） ─
    const hiG = g.createRadialGradient(
      cx - fr*0.38, cy - fr*0.42, 0,
      cx - fr*0.12, cy - fr*0.18, fr*0.62
    );
    hiG.addColorStop(0.00, 'rgba(255,255,255,0.44)');
    hiG.addColorStop(0.35, 'rgba(255,248,195,0.15)');
    hiG.addColorStop(0.70, 'rgba(255,230,90,0.04)');
    hiG.addColorStop(1.00, 'rgba(255,255,255,0)');
    g.beginPath(); g.arc(cx, cy, fr, 0, Math.PI * 2);
    g.fillStyle = hiG; g.fill();

    // ─ 8. 環境補光（右下） ─
    const fillG = g.createRadialGradient(cx + fr*0.26, cy + fr*0.32, 0, cx, cy + fr*0.55, fr*0.52);
    fillG.addColorStop(0.00, 'rgba(255,200,78,0.13)');
    fillG.addColorStop(1.00, 'rgba(255,200,78,0)');
    g.beginPath(); g.arc(cx, cy, fr, 0, Math.PI * 2);
    g.fillStyle = fillG; g.fill();

    const result = { canvas: off, pad };
    this._spriteCache.set(cacheKey, result);
    return result;
  }

  _getBillSprite(bw, bh) {
    const rw = Math.round(bw / 2) * 2;
    const rh = Math.round(bh / 2) * 2;
    const cacheKey = `bill_${rw}_${rh}`;
    if (this._spriteCache.has(cacheKey)) return this._spriteCache.get(cacheKey);

    const pad = 6;
    const sw = rw + pad * 2, sh = rh + pad * 2;
    const off = document.createElement('canvas');
    off.width = sw; off.height = sh;
    const g = off.getContext('2d');
    const bx = pad, by = pad;

    // ─ 1. 落影 ─
    g.shadowColor = 'rgba(0,0,0,0.68)'; g.shadowBlur = 5;
    g.shadowOffsetX = 1.5; g.shadowOffsetY = 3;
    g.beginPath(); g.roundRect(bx, by, rw, rh, 2);
    g.fillStyle = '#000'; g.fill();
    g.shadowColor = 'transparent'; g.shadowBlur = 0;
    g.shadowOffsetX = 0; g.shadowOffsetY = 0;

    // ─ 2. 鈔票底色（聯邦綠） ─
    const baseG = g.createLinearGradient(bx, by, bx + rw, by + rh);
    baseG.addColorStop(0.00, '#1A5C1E'); baseG.addColorStop(0.22, '#2A7A2E');
    baseG.addColorStop(0.52, '#1E6B22'); baseG.addColorStop(0.80, '#165018');
    baseG.addColorStop(1.00, '#0E3810');
    g.beginPath(); g.roundRect(bx, by, rw, rh, 2); g.fillStyle = baseG; g.fill();

    // ─ 3. 紙纖維水平微線 ─
    g.save();
    g.beginPath(); g.roundRect(bx, by, rw, rh, 2); g.clip();
    for (let yi = 0; yi < rh; yi += 2.1) {
      g.beginPath(); g.moveTo(bx, by + yi); g.lineTo(bx + rw, by + yi);
      g.strokeStyle = `rgba(${yi % 4 < 2 ? '75,155,75' : '18,78,18'},0.052)`;
      g.lineWidth = 0.32; g.stroke();
    }
    g.restore();

    // ─ 4. 內框裝飾線 ─
    g.beginPath(); g.roundRect(bx + 2.5, by + 2.5, rw - 5, rh - 5, 1);
    g.strokeStyle = 'rgba(115,215,115,0.27)'; g.lineWidth = 0.6; g.stroke();

    // ─ 5. 肖像橢圓區 ─
    const px = bx + rw * 0.5, py = by + rh * 0.5;
    g.beginPath(); g.ellipse(px, py, rw * 0.20, rh * 0.38, 0, 0, Math.PI * 2);
    g.fillStyle = 'rgba(10,56,12,0.52)'; g.fill();
    g.strokeStyle = 'rgba(115,208,115,0.18)'; g.lineWidth = 0.5; g.stroke();
    // 肖像人頭剪影
    g.beginPath(); g.ellipse(px, py - rh * 0.06, rw * 0.08, rh * 0.24, 0, 0, Math.PI * 2);
    g.fillStyle = 'rgba(25,88,25,0.50)'; g.fill();

    // ─ 6. 安全線（金屬絲） ─
    const sx = bx + rw * 0.68;
    const sgrd = g.createLinearGradient(sx - 1, 0, sx + 1, 0);
    sgrd.addColorStop(0, 'rgba(195,255,195,0)');
    sgrd.addColorStop(0.5, 'rgba(195,255,195,0.38)');
    sgrd.addColorStop(1, 'rgba(195,255,195,0)');
    g.beginPath(); g.moveTo(sx, by + 3); g.lineTo(sx, by + rh - 3);
    g.strokeStyle = sgrd; g.lineWidth = 1.6; g.stroke();

    // ─ 7. 面額文字 ─
    const fs = Math.max(4, rh * 0.30);
    g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillStyle = 'rgba(178,238,178,0.55)';
    g.font = `bold ${fs * 1.1}px Georgia,serif`; g.fillText('$', px, py);
    g.font = `bold ${fs * 0.70}px Georgia,serif`;
    g.textAlign = 'left';
    g.fillStyle = 'rgba(155,228,155,0.50)';
    g.fillText('100', bx + 3.5, by + rh * 0.22);
    g.textAlign = 'right';
    g.fillText('100', bx + rw - 3.5, by + rh * 0.80);

    // ─ 8. 紙面光澤（左上） ─
    const paperG = g.createLinearGradient(bx, by, bx + rw * 0.55, by + rh * 0.45);
    paperG.addColorStop(0, 'rgba(255,255,255,0.13)');
    paperG.addColorStop(0.4, 'rgba(255,255,255,0.045)');
    paperG.addColorStop(1, 'rgba(0,0,0,0)');
    g.beginPath(); g.roundRect(bx, by, rw, rh, 2); g.fillStyle = paperG; g.fill();

    // ─ 9. 頂部邊緣光 ─
    g.beginPath(); g.roundRect(bx, by, rw, 1.4, [2, 2, 0, 0]);
    g.fillStyle = 'rgba(195,255,195,0.17)'; g.fill();

    const result = { canvas: off, pad };
    this._spriteCache.set(cacheKey, result);
    return result;
  }

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

    // 動態鏡面閃光（鏡面反射掃過時的白點）
    const glint = (Math.sin(t * 0.0028 + x * 0.09) + 1) * 0.5;
    if (glint > 0.70 && squish > 0.30) {
      const gs = (glint - 0.70) / 0.30;
      ctx.beginPath();
      ctx.arc(-r * 0.30, -r * 0.34, r * 0.13, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255,255,240,${gs * 0.68})`;
      ctx.fill();
      ctx.beginPath();
      ctx.arc( r * 0.18, -r * 0.20, r * 0.055, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255,255,200,${gs * 0.32})`;
      ctx.fill();
    }
    ctx.restore();
  }

  _drawBill(c, t) {
    const ctx = this.cx;
    const sprite = this._getBillSprite(c.bw, c.bh);
    const sw = c.bw + sprite.pad * 2;
    const sh = c.bh + sprite.pad * 2;
    const flutter = c.done ? 0 : Math.sin(t * 0.0012 + c.flutter) * 0.14;
    const squishX = Math.cos(flutter);

    ctx.save();
    ctx.translate(c.x, c.y);
    ctx.rotate(c.tilt + flutter * 0.22);
    ctx.scale(squishX, 1);
    ctx.drawImage(sprite.canvas, -sw / 2, -sh / 2, sw, sh);
    ctx.restore();
  }

  _drawItem(c, t) {
    if (c.type === 'bill') this._drawBill(c, t);
    else this._drawCoin(c, t);
  }

  _draw() {
    const t = performance.now();
    this.cx.clearRect(0, 0, this.W, this.H);
    for (let i = this.pile.length - 1; i >= 0; i--) this._drawItem(this.pile[i], t);
    for (const c of this.coins) this._drawItem(c, t);
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
