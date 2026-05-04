
const PREV_RANK_MAP = {
  '湯玉琦': 1, '馬秋香': 2, '王珍珠': 3, '莉莉（新人）': 4, '廖姿惠': 5,
  '林宜靜': 6, '高如郁': 7, '王梅慧': 8, '周美蓁': 9, '許喬恩': 10,
  '李玲玲': 11, '高美雲': 12, '江麗勉': 13, '鄭珮恩': 14, '梁依萍': 15,
  '陳玲華': 16, '謝啟芳': 17, '江沛林': 18, '林沛昕': 19, '徐華妤': 20,
  '林佩君': 21, '蘇淑玲': 22, '鄭上官': 23, '陳百玲（新人）': 24
};

function getMovement(name, currentRank) {
  const prevRank = PREV_RANK_MAP[name];
  if (!prevRank) return { class: 'flat', arrow: '＝' };
  if (currentRank < prevRank) return { class: 'up', arrow: '↑' };
  if (currentRank > prevRank) return { class: 'down', arrow: '↓' };
  return { class: 'flat', arrow: '＝' };
}
/**
 * 兆櫃 AI 派單終端 V2 - 全線解鎖版
 * 專為極致視覺與 AI 比例原則設計
 */

const CONFIG = {
  API_URL: '/api/current',
  TROPHY_THRESHOLD: 7000,
  MAX_SCORE: 10000,
  LABEL_MAP: {
    '正式權重分數': '權重總分',
    '實收': '實收業績',
    '總業績': '全部總額',
    '續單金額': '追續金額',
    '追續成交總數': '續單數量',
    '追續客單價': '客單價'
  }
};

const state = {
  report: null,
  matchedName: ''
};

const refs = {
  app: document.getElementById('app'),
  title: document.getElementById('main-title'),
  settlementTag: document.getElementById('settlement-date-tag'),
  dispatchTag: document.getElementById('dispatch-date-tag'),
  auditResult: document.getElementById('audit-result'),
  activeCount: document.getElementById('active-count'),
  summaryGrid: document.getElementById('summary-grid'),
  rankingList: document.getElementById('ranking-list'),
  groupsGrid: document.getElementById('groups-grid'),
  auditNotes: document.getElementById('audit-notes'),
  excludedList: document.getElementById('excluded-list'),
  broadcastOutput: document.getElementById('broadcast-output'),
  copyBroadcast: document.getElementById('copy-broadcast'),
  searchOpen: document.getElementById('search-open'),
  searchClose: document.getElementById('search-close'),
  searchModal: document.getElementById('search-modal'),
  lookupInput: document.getElementById('lookup-input'),
  lookupResults: document.getElementById('lookup-results'),
  toast: document.getElementById('toast'),
  navItems: document.querySelectorAll('.nav-item')
};

// 初始化
async function init() {
  setupEventListeners();
  await fetchData();
}

function setupEventListeners() {
  // 導航跳轉
  refs.navItems.forEach(item => {
    item.addEventListener('click', (e) => {
      refs.navItems.forEach(n => n.classList.remove('active'));
      item.classList.add('active');
    });
  });

  // 搜尋彈窗
  refs.searchOpen.addEventListener('click', () => {
    refs.searchModal.style.display = 'block';
    refs.lookupInput.focus();
  });
  
  refs.searchClose.addEventListener('click', () => {
    refs.searchModal.style.display = 'none';
  });

  refs.lookupInput.addEventListener('input', (e) => {
    handleLookup(e.target.value);
  });

  refs.lookupResults.addEventListener('click', (e) => {
    const target = e.target.closest('[data-lookup-key]');
    if (target) scrollToCard(target.dataset.lookupKey);
  });

  // 複製功能
  refs.copyBroadcast.addEventListener('click', () => {
    copyToClipboard(refs.broadcastOutput.innerText, '精簡版文字已複製');
  });

  // 滾動監聽
  window.addEventListener('scroll', handleScroll);
}

async function fetchData() {
  try {
    const res = await fetch(`${CONFIG.API_URL}?t=${Date.now()}`);
    const data = await res.json();
    if (!res.ok || data.success === false) throw new Error(data.message || '公告資料讀取失敗');
    state.report = normalizeReport(data.data || data.report || data);
    renderAll();
  } catch (err) {
    console.error('Fetch Error:', err);
    showToast('連線異常，請稍後再試');
    renderErrorState(err.message || '公告資料讀取失敗');
  }
}

function normalizeReport(source) {
  const standardData = source?.standardData || {};
  const dates = standardData?.日期資訊 || {};
  const rankingSource = standardData?.正式名次 || source?.rankings || source?.report?.rankings || [];
  const rankings = rankingSource.map((row) => {
    const metrics = row.metrics || {};
    const rank = row.rank || row.名次 || 0;
    const prevRank = row.prevRank || row.上期名次 || 0;
    let movement = row.movement || 'flat';
    if (prevRank > 0) {
      if (rank < prevRank) movement = 'up';
      else if (rank > prevRank) movement = 'down';
      else movement = 'flat';
    }

    return {
      rank,
      name: row.name || row.姓名 || '',
      group: row.group || row.分級 || '',
      movement,
      isNew: row.isNew || String(row.姓名 || row.name || '').includes('新人'),
      metrics: {
        正式權重分數: row.weightedScore || row.totalScore || row.正式權重分數 || metrics.正式權重分數 || 0,
        實收: row.actualRevenue || row.實收 || metrics.實收 || 0,
        續單金額: row.renewalRevenue || row.追續金額 || metrics.追續金額 || metrics.續單金額 || 0,
        總業績: row.totalRevenue || row.全部總業績 || metrics.全部總業績 || metrics.總業績 || 0,
        追續客單價: row.averageRenewal || row.追續客單價 || metrics.追續客單價 || 0,
        追續成交總數: row.renewalDeals || row.追續單數 || metrics.追續單數 || metrics.追續成交總數 || 0
      },
      advice: row.advice || row.建議 || ''
    };
  });

  const summary = standardData?.整合總盤 || source?.summaryBoard || source?.report?.audit?.summaryBoard || {};
  const audit = source?.audit || {
    notes: source?.auditNotes || source?.validation?.warnings || [],
    excludedEmployees: standardData?.審計結論?.['審計列示不入派單'] || []
  };

  return {
    title: source?.title || standardData?.公告標題 || 'AI 派單公告',
    settlementDate: source?.settlementDate || source?.reportDate || dates.結算日 || '--',
    dispatchDate: source?.dispatchDate || dates.派單日 || '--',
    auditResult: source?.auditResult || source?.validation?.status || source?.status || 'PASS',
    summaryBoard: {
      實收總金額: summary.實收總金額 || summary.實收 || 0,
      追續單總金額: summary.追續單總金額 || summary.追續單金額 || summary.追續金額 || 0,
      本月業績: summary.本月業績 || summary.全部總業績 || 0,
      累積追續總成交數: summary.累積追續總成交數 || summary.追續單成交 || summary.追續單數 || 0
    },
    rankings,
    groups: source?.groups || standardData?.分級 || source?.report?.groups || {},
    audit,
    groupShortText: source?.groupShortText || standardData?.群組超精簡版 || source?.broadcastText || ''
  };
}

function renderErrorState(message) {
  refs.title.innerText = 'AI 派單公告';
  refs.auditResult.innerText = 'ERROR';
  refs.activeCount.innerText = '0';
  refs.summaryGrid.innerHTML = `<div class="empty-state">${escapeHtml(message)}</div>`;
  refs.rankingList.innerHTML = `<div class="empty-state">目前無法載入排行榜。</div>`;
  refs.groupsGrid.innerHTML = '';
  refs.auditNotes.innerHTML = '';
  refs.excludedList.innerHTML = '';
}

function renderAll() {
  const r = state.report;
  if (!r) return;

  // 基礎資訊
  refs.title.innerText = r.title || 'AI 派單公告';
  refs.settlementTag.innerText = `結算 ${r.settlementDate || '--'}`;
  refs.dispatchTag.innerText = `派單 ${r.dispatchDate || '--'}`;
  refs.auditResult.innerText = r.auditResult || 'PASS';
  refs.activeCount.innerText = r.rankings?.length || 0;

  renderSummary(r.summaryBoard);
  renderRankings(r.rankings);
  renderGroups(r.groups, r.rankings);
  renderAudit(r.audit);
  renderBroadcast(r.groupShortText);
}

function renderSummary(board) {
  const b = board || {};
  const items = [
    { label: '實收總金額', value: b['實收總金額'] || 0 },
    { label: '追續單金額', value: b['追續單總金額'] || 0 },
    { label: '全部總業績', value: b['本月業績'] || 0 },
    { label: '追續單成交', value: b['累積追續總成交數'] || 0 }
  ];

  refs.summaryGrid.innerHTML = items.map(i => `
    <div class="summary-item">
      <span>${i.label}</span>
      <strong>${formatNumber(i.value)}</strong>
    </div>
  `).join('');
}

function renderRankings(rankings) {
  rankings = rankings || [];
  if (!rankings.length) {
    refs.rankingList.innerHTML = '<div class="empty-state">尚無排行榜資料。</div>';
    return;
  }
  const matchedKey = state.matchedName ? normalizeNameKey(state.matchedName) : '';

  refs.rankingList.innerHTML = (rankings || []).map(item => {
    const score = Number(item.metrics?.正式權重分數 || 0);
    const isGold = score >= CONFIG.TROPHY_THRESHOLD;
    const matchKey = normalizeNameKey(item.name);
    const isMatch = matchedKey && matchKey === matchedKey;

    return `
      <article class="ranking-card ${isGold ? 'gold-card' : ''} ${matchKey === matchedKey && matchedKey ? 'is-match' : ''}" id="card-${matchKey}">
        <div class="card-rank-wrap">
        <span class="card-rank">#${escapeHtml(item.rank)}</span>
          <span class="move-indicator move-${item.movement || 'flat'}">${item.movement === 'up' ? '↑' : item.movement === 'down' ? '↓' : '＝'}</span>
        </div>
        ${isGold ? '<span class="trophy-badge">🏆</span>' : ''}
        
        <div class="card-header">
          <p class="card-name">${escapeHtml(item.name)}</p>
          <div class="badges">
            <span class="badge group-${escapeHtml(item.group)}">${escapeHtml(item.group)}</span>
            ${item.isNew ? '<span class="badge" style="background:#fff;color:#000">新人</span>' : ''}
          </div>
        </div>

        <div class="score-area">
          <div class="score-label">
            <span>AI 權重分數</span>
            <span>RANKING SCORE</span>
          </div>
          <div class="score-value">${formatNumber(score)}</div>
          <div class="score-progress">
            <div class="progress-fill" style="width: ${Math.min(100, (score/CONFIG.MAX_SCORE)*100)}%"></div>
          </div>
        </div>

        <div class="metric-mini-grid">
          ${['實收', '續單金額', '總業績', '追續成交總數'].map(k => `
            <div class="mini-item">
              <span>${CONFIG.LABEL_MAP[k]}</span>
              <strong>${formatNumber(item.metrics?.[k] || 0)}</strong>
            </div>
          `).join('')}
        </div>

        <div class="advice-text">「 ${escapeHtml(item.advice || '保持穩定，精進業績。')} 」</div>
      </article>
    `;
  }).join('');
}

function renderGroups(groups, rankings) {
  const rankMap = new Map((rankings || []).map(r => [r.name, r.rank]));
  const keys = ['A1', 'A2', 'B', 'C'];
  
  refs.groupsGrid.innerHTML = keys.map(k => {
    const members = groups[k] || [];
    return `
      <div class="stat-pill" style="height:auto; margin-bottom:12px;">
        <label>${k} 分級 (${members.length}人)</label>
        <div style="display:flex; flex-wrap:wrap; gap:8px; margin-top:8px;">
          ${members.map(name => `
            <span style="font-size:12px; background:rgba(255,255,255,0.05); padding:2px 8px; border-radius:4px; border:1px solid rgba(255,255,255,0.1)">
              <small style="opacity:0.5; margin-right:4px;">#${escapeHtml(rankMap.get(name) || '-')}</small>${escapeHtml(name)}
            </span>
          `).join('')}
        </div>
      </div>
    `;
  }).join('');
}

function renderAudit(audit) {
  const notes = audit?.notes || [];
  refs.auditNotes.innerHTML = notes.length
    ? notes.map(n => `<div class="mini-item" style="margin-bottom:8px"><span>${escapeHtml(n)}</span></div>`).join('')
    : '<div class="mini-item"><span>目前無審計提醒。</span></div>';
  
  const excluded = audit?.excludedEmployees || [];
  refs.excludedList.innerHTML = excluded.map(e => `
    <div class="mini-item" style="border-color:var(--fail)">
      <span style="color:var(--fail)">${escapeHtml(e.name || e.姓名 || e)}</span>
      <strong>${escapeHtml(e.reason || e.原因 || '已離職')}</strong>
    </div>
  `).join('');
}

function renderBroadcast(text) {
  refs.broadcastOutput.innerText = text || '未生成精簡版文字';
}

function handleLookup(query) {
  const q = normalizeNameKey(query);
  if (!q) {
    refs.lookupResults.innerHTML = '';
    return;
  }

  const matches = (state.report?.rankings || []).filter(r => normalizeNameKey(r.name).includes(q));
  
  refs.lookupResults.innerHTML = matches.map(m => `
    <button class="mini-item lookup-result" type="button" data-lookup-key="${escapeHtml(normalizeNameKey(m.name))}">
      <span>#${escapeHtml(m.rank)} ${escapeHtml(m.name)}</span>
      <strong>${escapeHtml(m.metrics?.正式權重分數)} 分</strong>
    </button>
  `).join('') || '<div class="mini-item"><span>找不到符合的人員</span></div>';
}

window.scrollToCard = (key) => {
  state.matchedName = key;
  refs.searchModal.style.display = 'none';
  renderRankings(state.report.rankings);
  
  const el = document.getElementById(`card-${key}`);
  if (el) {
    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
};

function handleScroll() {
  // 可以在這裡處理導航欄的高亮切換
}

// Utils
function formatNumber(num) {
  return new Intl.NumberFormat('en-US').format(Math.floor(num));
}

function normalizeNameKey(name) {
  return String(name || '').trim();
}

function copyToClipboard(text, msg) {
  navigator.clipboard.writeText(text).then(() => {
    showToast(msg);
  });
}

function showToast(msg) {
  refs.toast.innerText = msg;
  refs.toast.style.opacity = '1';
  setTimeout(() => refs.toast.style.opacity = '0', 2000);
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.innerText = str;
  return div.innerHTML;
}

init();
