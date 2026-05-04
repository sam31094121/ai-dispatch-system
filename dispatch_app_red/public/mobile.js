const API_CURRENT = '/api/current';
const API_LINE_OUTPUT = '/api/line-output';
const MAX_SCORE = 10000;

const refs = {
  title: document.getElementById('main-title'),
  auditResult: document.getElementById('audit-result'),
  settlementDate: document.getElementById('settlement-date-tag'),
  dispatchDate: document.getElementById('dispatch-date-tag'),
  activeCount: document.getElementById('active-count'),
  summaryGrid: document.getElementById('summary-grid'),
  rankingList: document.getElementById('ranking-list'),
  groupsGrid: document.getElementById('groups-grid'),
  auditNotes: document.getElementById('audit-notes'),
  excludedList: document.getElementById('excluded-list'),
  broadcastOutput: document.getElementById('broadcast-output'),
  copyBroadcast: document.getElementById('copy-broadcast'),
  shareBroadcast: document.getElementById('share-broadcast'),
  lineShare: document.getElementById('line-share'),
  refreshData: document.getElementById('refresh-data'),
  searchOpen: document.getElementById('search-open'),
  searchClose: document.getElementById('search-close'),
  searchModal: document.getElementById('search-modal'),
  lookupInput: document.getElementById('lookup-input'),
  lookupResults: document.getElementById('lookup-results'),
  toast: document.getElementById('toast')
};

const state = {
  report: null,
  sendText: ''
};

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
    actualRevenue: num(get(row, ['actualRevenue', '實收'], get(metrics, ['實收'], 0))),
    renewalRevenue: num(get(row, ['renewalRevenue', '追續金額'], get(metrics, ['追續金額'], 0))),
    totalRevenue: num(get(row, ['totalRevenue', '全部總業績'], get(metrics, ['全部總業績'], 0))),
    avgRenewal: num(get(row, ['avgRenewal', 'averageRenewal', '追續客單價'], get(metrics, ['追續客單價'], 0))),
    renewalDeals: num(get(row, ['renewalDeals', '追續單數'], get(metrics, ['追續單數'], 0))),
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
  setLoading();
  try {
    const [snapshot, lineOutput] = await Promise.all([
      requestJson(API_CURRENT),
      requestJson(API_LINE_OUTPUT).catch(() => null)
    ]);
    const report = normalizeReport(snapshot, lineOutput?.text);
    state.report = report;
    state.sendText = report.sendText;
    render(report);
    showToast('資料已更新');
  } catch (error) {
    renderError(error);
  }
}

function setLoading() {
  refs.rankingList.innerHTML = '<div class="empty-state">讀取最新派單資料中...</div>';
  refs.summaryGrid.innerHTML = '';
}

function render(report) {
  refs.title.textContent = report.title;
  refs.settlementDate.textContent = report.settlementDate;
  refs.dispatchDate.textContent = report.dispatchDate;
  refs.activeCount.textContent = report.ranking.length;
  refs.auditResult.textContent = report.auditResult;
  refs.auditResult.classList.toggle('pass', String(report.auditResult).toUpperCase() === 'PASS');

  renderSummary(report.summary);
  renderRankings(report.ranking);
  renderGroups(report.groups, report.ranking);
  renderAudit(report.auditNotes, report.excludedEmployees);
  renderSendText(report.sendText);
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
    const moveClass = row.movement === 'up' ? 'move-up' : row.movement === 'down' ? 'move-down' : 'move-flat';
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
          <div class="score-track"><div class="score-fill" style="width:${pct}%"></div></div>
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
  refs.broadcastOutput.value = state.sendText;
  refs.lineShare.href = state.sendText
    ? `https://line.me/R/share?text=${encodeURIComponent(state.sendText)}`
    : '#';
}

function renderError(error) {
  refs.auditResult.textContent = 'ERROR';
  refs.activeCount.textContent = '0';
  refs.summaryGrid.innerHTML = `<div class="empty-state">${escapeHtml(error.message || '資料讀取失敗')}</div>`;
  refs.rankingList.innerHTML = '<div class="empty-state">請確認伺服器已啟動並重新整理</div>';
  refs.groupsGrid.innerHTML = '';
  refs.auditNotes.innerHTML = '';
  renderSendText('');
  showToast('資料讀取失敗');
}

async function copyText() {
  const text = refs.broadcastOutput.value.trim();
  if (!text) {
    showToast('沒有可傳送的公告文字');
    return;
  }

  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
  } else {
    refs.broadcastOutput.select();
    document.execCommand('copy');
  }
  showToast('公告已複製');
}

async function shareText() {
  const text = refs.broadcastOutput.value.trim();
  if (!text) {
    showToast('沒有可分享的公告文字');
    return;
  }

  if (navigator.share) {
    await navigator.share({
      title: state.report?.title || 'AI 派單公告',
      text
    });
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
          #${row.rank} ${escapeHtml(row.name)}｜${escapeHtml(row.group)}｜${fmt(row.score, 2)}
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

function bindEvents() {
  refs.copyBroadcast.addEventListener('click', () => copyText().catch(() => showToast('複製失敗')));
  refs.shareBroadcast.addEventListener('click', () => shareText().catch(() => showToast('分享已取消')));
  refs.refreshData.addEventListener('click', loadData);
  refs.searchOpen.addEventListener('click', openSearch);
  refs.searchClose.addEventListener('click', closeSearch);
  refs.searchModal.addEventListener('click', (event) => {
    if (event.target === refs.searchModal) closeSearch();
  });
  refs.lookupInput.addEventListener('input', handleLookup);
  refs.lookupResults.addEventListener('click', (event) => {
    const target = event.target.closest('[data-name]');
    if (target) scrollToPerson(target.dataset.name);
  });
}

bindEvents();
loadData();
