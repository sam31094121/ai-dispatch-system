/**
 * 兆櫃 AI 派單終端 V2 - 全線解鎖版
 * 專為極致視覺與 AI 比例原則設計
 */

const CONFIG = {
  API_URL: '/api/dispatch-reports/latest',
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
    state.report = data.report || data;
    renderAll();
  } catch (err) {
    console.error('Fetch Error:', err);
    showToast('連線異常，請稍後再試');
  }
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
  const items = [
    { label: '實收總金額', value: board['實收總金額'] || 0 },
    { label: '追續單金額', value: board['追續單總金額'] || 0 },
    { label: '全部總業績', value: board['本月業績'] || 0 },
    { label: '追續單成交', value: board['累積追續總成交數'] || 0 }
  ];

  refs.summaryGrid.innerHTML = items.map(i => `
    <div class="summary-item">
      <span>${i.label}</span>
      <strong>${formatNumber(i.value)}</strong>
    </div>
  `).join('');
}

function renderRankings(rankings) {
  const matchedKey = state.matchedName ? normalizeNameKey(state.matchedName) : '';

  refs.rankingList.innerHTML = (rankings || []).map(item => {
    const score = Number(item.metrics?.正式權重分數 || 0);
    const isGold = score >= CONFIG.TROPHY_THRESHOLD;
    const matchKey = normalizeNameKey(item.name);
    const isMatch = matchedKey && matchKey === matchedKey;

    return `
      <article class="ranking-card ${isGold ? 'gold-card' : ''} ${matchKey === matchedKey && matchedKey ? 'is-match' : ''}" id="card-${matchKey}">
        <span class="card-rank">#${item.rank}</span>
        ${isGold ? '<span class="trophy-badge">🏆</span>' : ''}
        
        <div class="card-header">
          <p class="card-name">${item.name}</p>
          <div class="badges">
            <span class="badge group-${item.group}">${item.group}</span>
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

        <div class="advice-text">「 ${item.advice || '保持穩定，精進業績。'} 」</div>
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
              <small style="opacity:0.5; margin-right:4px;">#${rankMap.get(name) || '-'}</small>${name}
            </span>
          `).join('')}
        </div>
      </div>
    `;
  }).join('');
}

function renderAudit(audit) {
  const notes = audit?.notes || [];
  refs.auditNotes.innerHTML = notes.map(n => `<div class="mini-item" style="margin-bottom:8px"><span>${n}</span></div>`).join('');
  
  const excluded = audit?.excludedEmployees || [];
  refs.excludedList.innerHTML = excluded.map(e => `
    <div class="mini-item" style="border-color:var(--fail)">
      <span style="color:var(--fail)">${e.name}</span>
      <strong>${e.reason}</strong>
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

  const matches = state.report.rankings.filter(r => normalizeNameKey(r.name).includes(q));
  
  refs.lookupResults.innerHTML = matches.map(m => `
    <div class="mini-item" style="margin-bottom:8px; padding:12px; cursor:pointer;" onclick="scrollToCard('${normalizeNameKey(m.name)}')">
      <span>#${m.rank} ${m.name}</span>
      <strong>${m.metrics?.正式權重分數} 分</strong>
    </div>
  `).join('');
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
