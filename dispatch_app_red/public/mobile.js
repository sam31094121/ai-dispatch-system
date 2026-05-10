const API_CURRENT = '/api/current';
const API_LINE_OUTPUT = '/api/line-output';
const MAX_SCORE = 10000;
const CACHE_VERSION = 'v20260510-production-forced-v2';

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

// ── 全域錯誤攔截：幫助手機端除錯 ──
window.onerror = function(msg, url, lineNo, columnNo, error) {
  const errorMsg = `[系統錯誤] ${msg} (行: ${lineNo})`;
  console.error(errorMsg, error);
  if (typeof showToast === 'function') showToast(errorMsg);
  // 確保啟動畫面一定會消失
  const s = document.getElementById('splash-screen');
  if (s) s.classList.add('fade-out');
  return false;
};

// 清除舊版不相容快取
(function() {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed.version !== CACHE_VERSION) {
        localStorage.removeItem(CACHE_KEY);
        console.log('Cleared incompatible cache');
      }
    }
  } catch(e) {}
})();


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
    hideSplashScreen();
  } catch (error) {
    renderError(error);
    hideSplashScreen();
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
    const isTopFour = row.rank <= 4;
    const rankClass = isTopFour ? `hero-card-${row.rank}` : `rank-${row.rank}`;
    const crown = row.rank === 1 ? '<span class="a1-hero-crown">👑</span>' : '';
    
    // 3D 特效容器 (前四名均享有專屬特效)
    const vfxCanvas = isTopFour ? `<div class="money-canvas-container"><canvas id="hero-${row.rank}-canvas" data-rank="${row.rank}"></canvas></div>` : '';
    const iconClass = row.rank === 2 ? 'gold-icon' : (row.rank === 3 ? 'silver-icon' : (row.rank === 4 ? 'bronze-icon' : ''));

    const metricHtml = `
      <div class="a1-metric"><span>實收</span><strong>${fmt(row.actualRevenue)}</strong></div>
      <div class="a1-metric"><span>追續金額</span><strong>${fmt(row.renewalRevenue)}</strong></div>
      <div class="a1-metric"><span>總業績</span><strong>${fmt(row.totalRevenue)}</strong></div>
    `;
    return `
      <article class="a1-hero-card ${rankClass}">
        ${vfxCanvas}
        <div class="hero-content-wrap">
          ${crown}
          <div class="a1-hero-gloss"></div>
          <div class="a1-hero-rank ${iconClass}">#${row.rank} ${row.isNew ? '新人' : ''}</div>
          <div class="a1-hero-name">${escapeHtml(row.name)}</div>
          <div class="a1-hero-score-row">
            <span class="a1-hero-score-label">AI分</span>
            <span class="a1-hero-score-value">${fmt(row.score, 2)}</span>
          </div>
          <div class="a1-hero-score-track"><div class="a1-hero-score-fill" data-pct="${pct}" style="width:0%"></div></div>
          <div class="a1-hero-metrics">${metricHtml}</div>
        </div>
      </article>`;

  }).join('');

  // 延遲啟動 3D 特效
  if (typeof window.initMoneyEffects === 'function') {
      setTimeout(window.initMoneyEffects, 100);
  }
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
    const rankClass = row.rank <= 3 ? ` rank-${row.rank}` : '';
    const rankLabel = row.rank === 1 ? '🥇' : row.rank === 2 ? '🥈' : row.rank === 3 ? '🥉' : `#${row.rank}`;
    const winnerBadge = row.rank === 1
      ? '<div class="winner-badge gold">👑 冠軍</div>'
      : row.rank === 2
      ? '<div class="winner-badge silver">亞軍</div>'
      : row.rank === 3
      ? '<div class="winner-badge bronze">季軍</div>'
      : '';
    const shineLayer = row.rank <= 3 ? '<div class="rank-shine" aria-hidden="true"></div>' : '';
    return `
      <article class="ranking-card${rankClass}" id="person-${safeId}">
        ${shineLayer}
        ${winnerBadge}
        <div class="ranking-top">
          <span class="rank-number">${rankLabel}</span>
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
  const skeleton = document.getElementById('initial-skeleton');
  if (skeleton) skeleton.style.display = 'none';

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

// 3D 物理引擎已移至 vfx-engine.js

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
      if (p.z > 0.5) continue; // 只有在背景的硬幣會堆積
      const dx = p.x - x;
      const gap = (p.r + r) * 0.92;
      if (Math.abs(dx) < gap) {
        const top = p.y - Math.sqrt(Math.max(0, gap * gap - dx * dx));
        if (top < floor) floor = top;
      }
    }
    return floor;
  }

  explode() {
    const count = 40;
    const rank = parseInt(this.cv.dataset.rank || '1');
    for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 2 + Math.random() * 8;
        const type = Math.random() < 0.5 ? 'bill' : 'coin';
        this.coins.push({
            type,
            x: this.W / 2,
            y: this.H / 2,
            z: 0.1, // 深度，0 到 2
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            vz: 0.02 + Math.random() * 0.05,
            r: 8 + Math.random() * 8,
            bw: 30, bh: 14,
            tilt: Math.random() * Math.PI,
            tiltSpd: (Math.random() - 0.5) * 0.2,
            done: false,
            isExplosion: true
        });
    }
    // 觸發畫面震動
    this.cv.classList.add('shake');
    setTimeout(() => this.cv.classList.remove('shake'), 500);
  }

  _spawn() {
    const rank = parseInt(this.cv.dataset.rank || '1');
    let type = 'coin';
    
    // 根據排名調整掉落物比例與類型
    // 第一名：美金 + 金幣混合
    // 第二名：全金幣
    // 第三名：銀幣 (透過顏色調整) + 少許美金
    // 第四名：全美金
    if (rank === 1) {
        type = Math.random() < 0.4 ? 'bill' : (Math.random() < 0.8 ? 'coin' : 'glitter');
    }
    else if (rank === 2) type = 'coin';
    else if (rank === 3) type = Math.random() < 0.3 ? 'bill' : 'silver';
    else if (rank === 4) type = 'bill';

    if (type === 'glitter') {
        const r = 2 + Math.random() * 2;
        this.coins.push({
            type: 'glitter',
            x: Math.random() * this.W,
            y: -r,
            vx: (Math.random() - 0.5) * 4,
            vy: 2 + Math.random() * 3,
            r,
            color: `hsla(${Math.random() * 60 + 40}, 100%, 70%, ${0.6 + Math.random() * 0.4})`,
            done: false
        });
    } else if (type === 'bill') {
      const bw = 32 + Math.random() * 18; // 稍微加大
      const bh = Math.round(bw * 0.44);
      const margin = bw * 0.5 + 4;
      this.coins.push({
        type: 'bill',
        x:   margin + Math.random() * Math.max(1, this.W - margin * 2),
        y:   -bh,
        vx:  (Math.random() - 0.5) * 1.8,
        vy:  0.5 + Math.random() * 1.8,
        r:   bh * 0.5,
        bw, bh,
        tilt:     (Math.random() - 0.5) * 0.4,
        tiltSpd:  (Math.random() - 0.5) * 0.015,
        flutter:  Math.random() * Math.PI * 2,
        flutterSpd: 0.04 + Math.random() * 0.06,
        bounces: 0, done: false,
      });
    } else {
      const isSilver = type === 'silver';
      const r = 9 + Math.random() * 8;
      const margin = r + 4;
      this.coins.push({
        type: isSilver ? 'silver' : 'coin',
        x:       margin + Math.random() * Math.max(1, this.W - margin * 2),
        y:       -r,
        vx:      (Math.random() - 0.5) * 2.8,
        vy:      0.8 + Math.random() * 2.5,
        r,
        spin:    (Math.random() - 0.5) * 0.12,
        tilt:    Math.random() * Math.PI * 2,
        tiltSpd: (Math.random() - 0.5) * 0.08,
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

      if (c.isExplosion) {
          c.x += c.vx;
          c.y += c.vy;
          c.z += c.vz;
          c.vx *= 0.96;
          c.vy *= 0.96;
          c.tilt += c.tiltSpd;
          if (c.z > 2 || c.y > this.H + 100) c.done = true;
          continue;
      }

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

  _getCoinSprite(r, isSilver = false) {
    const key = Math.round(r);
    const cacheKey = (isSilver ? 'silver_' : 'coin_') + key;
    if (this._spriteCache.has(cacheKey)) return this._spriteCache.get(cacheKey);

    const pad = 12; // 增加邊距以容納發光
    const size = (key + pad) * 2;
    const off = document.createElement('canvas');
    off.width = size; off.height = size;
    const g = off.getContext('2d');
    const cx = size / 2, cy = size / 2;

    // ─ 1. 落影 (增加柔和度) ─
    g.shadowColor = 'rgba(0,0,0,0.6)';
    g.shadowBlur = key * 0.6;
    g.shadowOffsetX = key * 0.1;
    g.shadowOffsetY = key * 0.25;
    g.beginPath(); g.arc(cx, cy, key * 0.98, 0, Math.PI * 2);
    g.fillStyle = '#000'; g.fill();
    g.shadowColor = 'transparent'; g.shadowBlur = 0;

    // ─ 2. 鑄幣齒邊 (增加多重層次金屬感) ─
    const teeth = Math.max(24, Math.floor(key * 2.5));
    g.beginPath();
    for (let i = 0; i <= teeth * 2; i++) {
      const a = (i / (teeth * 2)) * Math.PI * 2;
      const rad = i % 2 === 0 ? key * 1.0 : key * 0.93;
      if (i === 0) g.moveTo(cx + Math.cos(a) * rad, cy + Math.sin(a) * rad);
      else g.lineTo(cx + Math.cos(a) * rad, cy + Math.sin(a) * rad);
    }
    g.closePath();
    
    // 金/銀漸層
    const edgeG = g.createRadialGradient(cx - key*0.15, cy - key*0.25, key*0.6, cx, cy, key);
    if (isSilver) {
        edgeG.addColorStop(0, '#E0E0E0'); edgeG.addColorStop(0.5, '#A0A0A0'); edgeG.addColorStop(1, '#404040');
    } else {
        edgeG.addColorStop(0, '#FFD700'); edgeG.addColorStop(0.45, '#B8860B'); edgeG.addColorStop(0.8, '#8B4513'); edgeG.addColorStop(1, '#422400');
    }
    g.fillStyle = edgeG; g.fill();

    // 頂部高亮邊緣
    g.beginPath(); g.arc(cx, cy, key * 0.99, Math.PI * 1.1, Math.PI * 1.9);
    g.strokeStyle = isSilver ? 'rgba(255,255,255,0.5)' : 'rgba(255,255,200,0.5)'; g.lineWidth = 1.2; g.stroke();

    // ─ 3. 正面金屬面 ─
    const fr = key * 0.86;
    const faceG = g.createRadialGradient(cx - key*0.25, cy - key*0.3, 0, cx + key*0.1, cy + key*0.1, fr*1.1);
    if (isSilver) {
        faceG.addColorStop(0, '#FFFFFF'); faceG.addColorStop(0.3, '#D0D0D0'); faceG.addColorStop(0.8, '#808080'); faceG.addColorStop(1, '#404040');
    } else {
        faceG.addColorStop(0.00, '#FFFDE0'); faceG.addColorStop(0.1, '#FFEB3B'); faceG.addColorStop(0.3, '#FBC02D'); faceG.addColorStop(0.6, '#F57F17'); faceG.addColorStop(1.0, '#3E2723');
    }
    g.beginPath(); g.arc(cx, cy, fr, 0, Math.PI * 2);
    g.fillStyle = faceG; g.fill();

    // ─ 4. 髮絲紋 (更加精細) ─
    g.save();
    g.beginPath(); g.arc(cx, cy, fr, 0, Math.PI * 2); g.clip();
    const rings = Math.max(8, Math.floor(fr / 1.2));
    for (let i = 1; i <= rings; i++) {
      g.beginPath(); g.arc(cx, cy, (i / rings) * fr, 0, Math.PI * 2);
      g.strokeStyle = isSilver ? `rgba(100,100,100,${0.05 + (i%5==0?0.03:0)})` : `rgba(80,40,0,${0.06 + (i%5==0?0.04:0)})`;
      g.lineWidth = 0.25; g.stroke();
    }
    g.restore();

    // ─ 5. 楓葉浮雕 (提升寫實度) ─
    g.save();
    g.translate(cx, cy);
    const ls = key * 0.056;
    g.scale(ls, ls);
    
    // 浮雕深影
    g.save(); g.translate(0.7, 1.0);
    g.fillStyle = isSilver ? 'rgba(0,0,0,0.4)' : 'rgba(60,20,0,0.5)';
    _drawMapleLeafPath(g); g.fill(); g.restore();

    // 浮雕主體 (使用更強的對比)
    g.fillStyle = isSilver ? 'rgba(180,180,180,0.8)' : 'rgba(184,134,11,0.8)';
    _drawMapleLeafPath(g); g.fill();
    g.restore();

    // ─ 6. 鏡面反光 (加上彩虹色散微光) ─
    const hiG = g.createRadialGradient(cx - fr*0.4, cy - fr*0.45, 0, cx - fr*0.1, cy - fr*0.1, fr*0.7);
    hiG.addColorStop(0, 'rgba(255,255,255,0.6)');
    hiG.addColorStop(0.2, 'rgba(255,255,255,0.2)');
    hiG.addColorStop(0.5, 'rgba(255,255,255,0)');
    g.beginPath(); g.arc(cx, cy, fr, 0, Math.PI * 2);
    g.fillStyle = hiG; g.fill();

    const result = { canvas: off, pad };
    this._spriteCache.set(cacheKey, result);
    return result;
  }

  _getBillSprite(bw, bh) {
    const rw = Math.round(bw / 2) * 2;
    const rh = Math.round(bh / 2) * 2;
    const cacheKey = `bill_${rw}_${rh}`;
    if (this._spriteCache.has(cacheKey)) return this._spriteCache.get(cacheKey);

    const pad = 10;
    const sw = rw + pad * 2, sh = rh + pad * 2;
    const off = document.createElement('canvas');
    off.width = sw; off.height = sh;
    const g = off.getContext('2d');
    const bx = pad, by = pad;

    // ─ 1. 落影 (柔和疊加) ─
    g.shadowColor = 'rgba(0,0,0,0.45)'; g.shadowBlur = 8;
    g.shadowOffsetX = 2; g.shadowOffsetY = 4;
    g.beginPath(); g.roundRect(bx, by, rw, rh, 1.5);
    g.fillStyle = '#000'; g.fill();
    g.shadowColor = 'transparent'; g.shadowBlur = 0;

    // ─ 2. 鈔票基底 (加入紙張纖維質感) ─
    const baseG = g.createLinearGradient(bx, by, bx + rw, by + rh);
    baseG.addColorStop(0.0, '#2D5A27'); baseG.addColorStop(0.5, '#3D7A37'); baseG.addColorStop(1.0, '#244A20');
    g.beginPath(); g.roundRect(bx, by, rw, rh, 1.5); g.fillStyle = baseG; g.fill();

    // ─ 3. 微細紋理 (Noise / Intaglio texture) ─
    g.save();
    g.beginPath(); g.roundRect(bx, by, rw, rh, 1.5); g.clip();
    for(let i=0; i<300; i++) {
        g.fillStyle = `rgba(255,255,255,${Math.random()*0.05})`;
        g.fillRect(bx + Math.random()*rw, by + Math.random()*rh, 1, 1);
    }
    // 橫向印刷線
    g.strokeStyle = 'rgba(0,0,0,0.1)'; g.lineWidth = 0.3;
    for(let i=0; i<rh; i+=2) {
        g.beginPath(); g.moveTo(bx, by+i); g.lineTo(bx+rw, by+i); g.stroke();
    }
    g.restore();

    // ─ 4. 安全線與防偽浮水印 ─
    const sx = bx + rw * 0.72;
    g.fillStyle = 'rgba(200,255,200,0.25)';
    g.fillRect(sx, by + 2, 1.5, rh - 4);

    // ─ 5. 面額數字與邊框 ─
    g.strokeStyle = 'rgba(150,220,150,0.4)'; g.lineWidth = 0.8;
    g.strokeRect(bx+3, by+3, rw-6, rh-6);
    
    g.font = `bold ${rh*0.4}px Georgia, serif`;
    g.fillStyle = 'rgba(180,240,180,0.6)';
    g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillText('$ 100', bx + rw*0.5, by + rh*0.5);

    // ─ 6. 頂部高光 ─
    const gloss = g.createLinearGradient(bx, by, bx+rw*0.3, by+rh*0.3);
    gloss.addColorStop(0, 'rgba(255,255,255,0.2)'); gloss.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = gloss; g.fillRect(bx, by, rw, rh);

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

  _drawGlitter(c, t) {
    const ctx = this.cx;
    const alpha = (Math.sin(t * 0.01 + c.x) + 1) * 0.5;
    ctx.save();
    ctx.translate(c.x, c.y);
    ctx.rotate(t * 0.005);
    ctx.fillStyle = c.color;
    ctx.globalAlpha = alpha;
    ctx.fillRect(-c.r, -c.r, c.r * 2, c.r * 2);
    ctx.restore();
  }

  _drawItem(c, t) {
    const ctx = this.cx;
    const z = c.z || 0;
    const scale = 1 + z;
    const blur = z > 1 ? (z - 1) * 4 : 0;

    ctx.save();
    if (blur > 0) ctx.filter = `blur(${blur}px)`;
    ctx.translate(c.x, c.y);
    ctx.scale(scale, scale);
    ctx.translate(-c.x, -c.y);

    if (c.type === 'bill') this._drawBill(c, t);
    else if (c.type === 'glitter') this._drawGlitter(c, t);
    else this._drawItemCoin(c, t);

    ctx.restore();
  }

  _drawItemCoin(c, t) {
    const isSilver = c.type === 'silver';
    const ctx = this.cx;
    const { x, y, r, tilt } = c;
    const squish = Math.max(0.07, Math.abs(Math.cos(tilt)));
    const sprite = this._getCoinSprite(r, isSilver);
    const drawSize = (Math.round(r) + sprite.pad) * 2;

    ctx.save();
    ctx.translate(x, y);
    ctx.scale(squish, 1);
    ctx.drawImage(sprite.canvas, -drawSize / 2, -drawSize / 2, drawSize, drawSize);

    // 動態鏡面閃光 (更加閃爍)
    const glint = (Math.sin(t * 0.0035 + x * 0.12) + 1) * 0.5;
    if (glint > 0.65 && squish > 0.25) {
      const gs = (glint - 0.65) / 0.35;
      ctx.beginPath();
      ctx.arc(-r * 0.35, -r * 0.4, r * 0.15, 0, Math.PI * 2);
      ctx.fillStyle = isSilver ? `rgba(255,255,255,${gs * 0.8})` : `rgba(255,255,240,${gs * 0.8})`;
      ctx.fill();
    }
    ctx.restore();
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
    this.explode();
    this._resume();
  }

  stop() { this._pause(); }
}

let _coinRain = null;

function initMoneyEffects() {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  
  // 針對前四名卡片初始化各自的 Canvas
  const canvases = document.querySelectorAll('.money-canvas-container canvas');
  canvases.forEach(cv => {
    const rain = new MapleCoinRain(cv);
    rain.start();
  });
  
  // 原有的全域金幣雨 (若有的話)
  const globalCv = document.getElementById('mobile-coin-canvas');
  if (globalCv) {
    const globalRain = new MapleCoinRain(globalCv);
    globalRain.start();
  }
}

function initCoinRain() {
  /* 效能優化：延遲到瀏覽器空閒時初始化金幣引擎 */
  if ('requestIdleCallback' in window) {
    requestIdleCallback(() => initMoneyEffects(), { timeout: 2000 });
  } else {
    setTimeout(() => initMoneyEffects(), 800);
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

function hideSplashScreen() {
  const splash = document.getElementById('splash-screen');
  const skeleton = document.getElementById('initial-skeleton');
  
  if (skeleton) {
    skeleton.style.display = 'none';
  }

  if (!splash) return;
  
  setTimeout(() => {
    splash.classList.add('fade-out');
    setTimeout(() => splash.remove(), 800);
  }, 400);
}

// ── 全線串連：SSE 即時推播 ──
function initRealtimeSync() {
  const sync = new RealtimeSyncEngine('/api/updates/stream', (data) => {
    showToast('🔄 偵測到新派單，即時同步中...');
    loadData();
  });
  sync.connect();
}

bindEvents();
initActiveNav();
initHeroTilt();
loadData();
initRealtimeSync();
