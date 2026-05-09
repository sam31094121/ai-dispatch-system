/*
  AI Dispatch War Room v7 - Solid State Controller
  Optimized for stability and clarity.
*/

const DATA_PATH = 'data/dispatch-reports-v1/latest.json';
const API_PATH = '/api/current';

const refs = {
  auditResult: document.getElementById('audit-result'),
  auditNotes: document.getElementById('audit-notes'),
  summaryGrid: document.getElementById('summary-grid'),
  a1HeroGrid: document.getElementById('a1-hero-grid'),
  rankingList: document.getElementById('ranking-list'),
  groupsGrid: document.getElementById('groups-grid'),
  adviceList: document.getElementById('advice-list'),
  broadcastOutput: document.getElementById('broadcast-output'),
  groupShortOutput: document.getElementById('group-short-output'),
  refreshBtn: document.getElementById('refresh-data'),
  searchModal: document.getElementById('search-modal'),
  lookupInput: document.getElementById('lookup-input'),
  lookupResults: document.getElementById('lookup-results')
};

let state = { report: null };

// ── 數據加載 (智慧降級方案) ──
async function loadData() {
  refs.refreshBtn.innerText = '同步中...';
  try {
    // 優先嘗試 API，若失敗則回退至本地 JSON
    let response;
    try {
      response = await fetch(API_PATH + '?t=' + Date.now());
    } catch {
      response = await fetch(DATA_PATH + '?t=' + Date.now());
    }
    
    const payload = await response.json();
    state.report = payload.report || payload.data?.report || payload;
    
    render();
    showToast('戰情室數據同步成功');
  } catch (e) {
    console.error('Load Failed', e);
    showToast('數據加載失敗，請檢查檔案');
  } finally {
    refs.refreshBtn.innerText = '同步數據';
  }
}

// ── 渲染核心 ──
function render() {
  const r = state.report;
  if (!r) return;

  // 1. 審計與狀態
  const isPass = String(r.auditResult).toUpperCase() === 'PASS';
  refs.auditResult.textContent = r.auditResult;
  refs.auditResult.style.color = isPass ? '#00ff88' : '#ff3232';
  refs.auditNotes.innerHTML = (r.audit?.notes || []).map(n => `<div>• ${n}</div>`).join('');

  // 2. 整合總盤
  const s = r.summaryBoard || {};
  const sData = [
    { k: '實收', v: s.actualRevenue },
    { k: '總額', v: s.totalRevenue },
    { k: '追續', v: s.renewalRevenue },
    { k: '單數', v: s.renewalDeals, u: '筆' }
  ];
  refs.summaryGrid.innerHTML = sData.map(d => `
    <div><span>${d.k}</span>${fmt(d.v)}${d.u || ''}</div>
  `).join('');

  // 3. 前四名英雄榜
  const top4 = (r.rankings || []).slice(0, 4);
  refs.a1HeroGrid.innerHTML = top4.map((p, i) => `
    <div class="hero-mini-card rank-${i+1}">
      <div class="rank">RANK #${i+1}</div>
      <div class="name">${p.name}</div>
      <div class="score">${fmt(p.metrics?.score || p.metrics?.正式權重分數, 1)}</div>
    </div>
  `).join('');

  // 4. 名次總表
  refs.rankingList.innerHTML = (r.rankings || []).map(p => `
    <div class="row-v3">
      <div class="r-num">${p.rank}</div>
      <div class="r-name">${p.name}</div>
      <div class="r-group">${p.group}</div>
    </div>
  `).join('');

  // 5. 分級與建議
  const g = r.groups || {};
  refs.groupsGrid.innerHTML = Object.entries(g).map(([key, list]) => `
    <div class="g-card">
      <h4>${key} 分組 (${list.length})</h4>
      <div class="g-members">${list.join('、')}</div>
    </div>
  `).join('');

  refs.adviceList.innerHTML = (r.rankings || []).slice(0, 10).map(p => `
    <div class="a-item"><strong>${p.name}：</strong>${p.advice || '維持節奏。'}</div>
  `).join('');

  // 6. 公告緩存
  refs.broadcastOutput.value = r.fullText || '';
  refs.groupShortOutput.textContent = r.groupShortText || '';
}

// ── 輔助功能 ──
function fmt(v) { return new Intl.NumberFormat().format(Math.round(v || 0)); }

function showToast(m) {
  const t = document.getElementById('toast');
  t.textContent = m; t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 2000);
}

function copy(text, msg) {
  if (!text) return;
  navigator.clipboard.writeText(text).then(() => showToast(msg));
}

// ── 事件綁定 ──
document.addEventListener('DOMContentLoaded', loadData);
refs.refreshBtn.onclick = loadData;

document.getElementById('copy-line-text').onclick = () => copy(refs.broadcastOutput.value, '正式公告已複製');
document.getElementById('copy-short-text').onclick = () => copy(refs.groupShortOutput.textContent, '精簡公告已複製');

// 搜尋
document.getElementById('search-open').onclick = () => refs.searchModal.classList.add('is-open');
document.getElementById('search-close').onclick = () => refs.searchModal.classList.remove('is-open');
refs.lookupInput.oninput = (e) => {
  const q = e.target.value.trim();
  const list = state.report?.rankings || [];
  const found = list.filter(p => p.name.includes(q));
  refs.lookupResults.innerHTML = found.map(p => `<div style="padding:10px; border-bottom:1px solid #222">#${p.rank} ${p.name} (${p.group})</div>`).join('');
};
