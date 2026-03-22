// app.js — 紅色科技整合版 · 前端邏輯
// 前端只負責：輸入、顯示、播報、複製。所有運算在後端。

// ═══════════════════════════════════════════════════════
//  全域狀態
// ═══════════════════════════════════════════════════════
const S = {
  parsedData: null,
  rankedData: null,
  outputs: null,
  suggestions: null
};

const FLOW_NODES = ['接收','解析','審計','排序','公告','播報','LINE','存檔','備份','日誌'];

// 啟動序列 10 色（紅色科技風格）
const SEQ_COLORS = [
  { num:'1', name:'接收', color:'#ff1e3c', rgb:'255,30,60'   },
  { num:'2', name:'解析', color:'#ff6622', rgb:'255,102,34'  },
  { num:'3', name:'審計', color:'#ffaa00', rgb:'255,170,0'   },
  { num:'4', name:'排序', color:'#00ff88', rgb:'0,255,136'   },
  { num:'5', name:'公告', color:'#00ffd5', rgb:'0,255,213'   },
  { num:'6', name:'播報', color:'#0088ff', rgb:'0,136,255'   },
  { num:'7', name:'LINE', color:'#5544ff', rgb:'85,68,255'   },
  { num:'8', name:'存檔', color:'#aa33ff', rgb:'170,51,255'  },
  { num:'9', name:'備份', color:'#ff33aa', rgb:'255,51,170'  },
  { num:'0', name:'日誌', color:'#ffffff', rgb:'255,255,255' },
];

// ═══════════════════════════════════════════════════════
//  工具函式
// ═══════════════════════════════════════════════════════
async function api(url, body) {
  const opts = { headers: { 'Content-Type': 'application/json' } };
  if (body !== undefined) {
    opts.method = 'POST';
    opts.body = JSON.stringify(body);
  }
  const r = await fetch(url, opts);
  return r.json();
}

function delay(ms) { return new Promise(r => setTimeout(r, ms)); }

function toast(msg) {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(el._t);
  el._t = setTimeout(() => el.classList.remove('show'), 2500);
}

function copyText(text, label) {
  if (!text || text === '尚無數據') { toast('尚無資料'); return; }
  navigator.clipboard.writeText(text).then(() => toast('已複製：' + label));
}

function copyEl(id, label) {
  const el = document.getElementById(id);
  if (!el || !el.value.trim()) { toast('尚無內容'); return; }
  navigator.clipboard.writeText(el.value).then(() => toast('已複製：' + label));
}

function escAttr(s) { return s.replace(/'/g, "\\'").replace(/\n/g, '\\n'); }
function escHtml(s) { return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

// ═══════════════════════════════════════════════════════
//  時鐘
// ═══════════════════════════════════════════════════════
function updateClock() {
  const t = new Date().toLocaleTimeString('zh-TW', { hour12: false, timeZone: 'Asia/Taipei' });
  document.getElementById('sys-clock').textContent = t;
}
updateClock();
setInterval(updateClock, 1000);

// ═══════════════════════════════════════════════════════
//  頁籤切換
// ═══════════════════════════════════════════════════════
document.querySelectorAll('.tab-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const tab = btn.dataset.tab;
    ['dash','announce','syslog'].forEach(t => {
      document.getElementById('tab-' + t).style.display = t === tab ? 'block' : 'none';
    });
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.toggle('active', b === btn));
    if (tab === 'syslog') fetchLogs();
  });
});

// ═══════════════════════════════════════════════════════
//  LED 流程管線
// ═══════════════════════════════════════════════════════
function initFlow() {
  const el = document.getElementById('flow-display');
  el.innerHTML = FLOW_NODES.map((name, i) => {
    const arrow = i ? '<span class="flow-arrow">›</span>' : '';
    return `${arrow}<div class="flow-node-wrap"><div class="flow-node" id="fnode-${name}">
      <div class="flow-dot"><div class="flow-dot-inner"></div></div>
      <span>${name}</span>
    </div></div>`;
  }).join('');
}

function setFlowNode(name, state) {
  const el = document.getElementById('fnode-' + name);
  if (el) el.className = 'flow-node ' + state;
}

// ═══════════════════════════════════════════════════════
//  功能性啟動序列
// ═══════════════════════════════════════════════════════
function initSeqGrid() {
  const grid = document.getElementById('seq-grid');
  grid.innerHTML = SEQ_COLORS.map((s, i) => `
    <div class="seq-cell" id="seq-${i}" style="--seq-color:${s.color};--seq-rgb:${s.rgb};">
      <div class="seq-dot-s"></div>
      <div class="seq-num">${s.num}</div>
      <div class="seq-label">${s.name}</div>
    </div>
  `).join('');
}

function activateSeq(idx) {
  const cell = document.getElementById('seq-' + idx);
  if (!cell) return;
  if (idx > 0) {
    const prev = document.getElementById('seq-' + (idx - 1));
    if (prev) { prev.classList.remove('active'); prev.classList.add('done'); }
  }
  cell.classList.add('active');

  const pct = Math.round(((idx + 1) / 10) * 100);
  document.getElementById('seq-counter').textContent = `${idx + 1} / 10`;
  document.getElementById('seq-pct').textContent = pct + '%';
  const fill = document.getElementById('seq-progress-fill');
  fill.style.width = pct + '%';
  fill.style.background = SEQ_COLORS[idx].color;
  fill.style.boxShadow = `0 0 10px ${SEQ_COLORS[idx].color}`;
  const st = document.getElementById('seq-status-text');
  st.textContent = `啟動中：${SEQ_COLORS[idx].name}`;
  st.style.color = SEQ_COLORS[idx].color;

  // 全螢幕閃爍
  const flash = document.getElementById('seq-flash');
  flash.style.boxShadow = `inset 0 0 100px ${SEQ_COLORS[idx].color}`;
  flash.classList.remove('flash');
  void flash.offsetWidth;
  flash.classList.add('flash');
}

function completeSeq(idx) {
  const cell = document.getElementById('seq-' + idx);
  if (cell) { cell.classList.remove('active'); cell.classList.add('done'); }
}

function resetSeqGrid() {
  for (let i = 0; i < 10; i++) {
    const cell = document.getElementById('seq-' + i);
    if (cell) cell.classList.remove('active', 'done');
  }
  document.getElementById('seq-progress-fill').style.width = '0%';
  document.getElementById('seq-counter').textContent = '0 / 10';
  document.getElementById('seq-pct').textContent = '0%';
  const st = document.getElementById('seq-status-text');
  st.textContent = '待命'; st.style.color = '';
}

function finishSeqGrid() {
  const st = document.getElementById('seq-status-text');
  st.textContent = '全模組上線'; st.style.color = '#00ff88';
}

// ═══════════════════════════════════════════════════════
//  預載 3/22
// ═══════════════════════════════════════════════════════
async function preload322() {
  try {
    toast('正在載入 3/22 業績⋯');
    const res = await api('/api/preload/322');
    if (res.success && res.data) {
      document.getElementById('raw-input').value = res.data;
      toast('✅ 已載入 3/22 完整 21 人業績');
    } else {
      toast('⚠️ 預載失敗');
    }
  } catch (err) {
    toast('❌ 預載連線失敗');
    console.error(err);
  }
}

// ═══════════════════════════════════════════════════════
//  主工作流程（全鏈路）
// ═══════════════════════════════════════════════════════
async function startWorkflow() {
  const btn = document.getElementById('btn-execute');
  if (btn.disabled) return;
  btn.disabled = true;

  const input = document.getElementById('raw-input').value.trim();
  if (!input) { toast('請先貼上業績數據'); btn.disabled = false; return; }

  initFlow();
  resetSeqGrid();
  document.getElementById('terminal-status').textContent = '處理中⋯';

  try {
    // ① 接收
    activateSeq(0); setFlowNode('接收','running');
    await delay(350);
    setFlowNode('接收','success'); completeSeq(0);

    // ② 解析
    activateSeq(1); setFlowNode('解析','running');
    const pr = await api('/api/report/parse', { rawText: input });
    if (!pr.success) throw { step: '解析', msg: pr.message };
    S.parsedData = pr.data;
    setFlowNode('解析','success'); completeSeq(1);

    // ③ 審計
    activateSeq(2); setFlowNode('審計','running');
    const ar = await api('/api/report/audit', { data: S.parsedData });
    if (!ar.success) {
      setFlowNode('審計','failed');
      setBadge('審計失敗', false);
      throw { step: '審計', msg: (ar.errors || [ar.message]).join('\n') };
    }
    setFlowNode('審計','success'); completeSeq(2);
    setBadge('審計通過', true);

    // ④ 排序
    activateSeq(3); setFlowNode('排序','running');
    const rr = await api('/api/report/rank', { data: S.parsedData });
    if (!rr.success) throw { step: '排序', msg: rr.message };
    S.rankedData = rr.data;
    setFlowNode('排序','success'); completeSeq(3);

    updateDashboard();

    // ⑤ 公告
    activateSeq(4); setFlowNode('公告','running'); await delay(180);
    // ⑥ 播報
    activateSeq(5); setFlowNode('播報','running'); await delay(180);
    // ⑦ LINE
    activateSeq(6); setFlowNode('LINE','running'); await delay(180);

    const or = await api('/api/report/generate_outputs', { rankedData: S.rankedData, reportDate: S.parsedData.reportDate });
    S.outputs = or.data;
    renderOutputs();

    setFlowNode('公告','success'); completeSeq(4); await delay(150);
    setFlowNode('播報','success'); completeSeq(5); await delay(150);
    setFlowNode('LINE','success'); completeSeq(6); await delay(150);

    // ⑧ 存檔
    activateSeq(7); setFlowNode('存檔','running'); await delay(180);
    // ⑨ 備份
    activateSeq(8); setFlowNode('備份','running'); await delay(180);
    // ⓪ 日誌
    activateSeq(9); setFlowNode('日誌','running'); await delay(180);

    await api('/api/report/save', { fullState: S });
    setFlowNode('存檔','success'); completeSeq(7); await delay(120);
    setFlowNode('備份','success'); completeSeq(8); await delay(120);
    setFlowNode('日誌','success'); completeSeq(9);

    finishSeqGrid();

    // AI 建議
    try {
      const sg = await api('/api/suggestions', { rankedData: S.rankedData });
      if (sg.success) { S.suggestions = sg.data; renderAdvice(sg.data); }
    } catch (e) { console.warn('建議取得失敗', e); }

    document.getElementById('terminal-status').textContent = '全鏈路完成';
    document.getElementById('hero-status').textContent = '運行';
    document.querySelector('.hero-card:nth-child(3) .hero-unit').textContent = 'ONLINE';
    toast('✅ 全鏈路執行成功！');
    fetchLogs();

  } catch (e) {
    toast('❌ 故障於【' + (e.step || '未知') + '】：' + (e.msg || e.message || e));
    document.getElementById('terminal-status').textContent = '故障';
    console.error(e);
  } finally {
    btn.disabled = false;
  }
}

function setBadge(text, pass) {
  const b = document.getElementById('audit-badge');
  b.textContent = text;
  if (pass) {
    b.style.background = 'rgba(0,255,136,0.12)'; b.style.color = '#00ff88'; b.style.borderColor = 'rgba(0,255,136,0.25)';
  } else {
    b.style.background = 'rgba(255,68,102,0.15)'; b.style.color = '#ff4466'; b.style.borderColor = 'rgba(255,68,102,0.25)';
  }
}

// ═══════════════════════════════════════════════════════
//  儀表板更新
// ═══════════════════════════════════════════════════════
function updateDashboard() {
  const d = S.parsedData;
  const avg = d.rows.length ? Math.round(d.totalRevenue / d.rows.length) : 0;
  const rating = avg > 80000 ? 'S+ MAX' : avg > 40000 ? 'S 強勢' : 'A 穩定';

  document.getElementById('hero-revenue').textContent = '$' + d.totalRevenue.toLocaleString();
  document.getElementById('hero-people').textContent = d.rows.length;

  document.getElementById('stat-grid').innerHTML = `
    <div class="dm-cell" onclick="copyText('總業績: $${d.totalRevenue.toLocaleString()}','總結算')">
      <div class="dm-lbl">總業績</div><div class="dm-val">$${d.totalRevenue.toLocaleString()}</div><div class="dm-sub">動能 MAX</div>
    </div>
    <div class="dm-cell" onclick="copyText('人數: ${d.rows.length}','活躍人數')">
      <div class="dm-lbl">活躍人數</div><div class="dm-val">${d.rows.length}</div><div class="dm-sub">全員在線</div>
    </div>
    <div class="dm-cell" onclick="copyText('均值: $${avg.toLocaleString()}','人均業績')">
      <div class="dm-lbl">人均業績</div><div class="dm-val">$${avg.toLocaleString()}</div><div class="dm-sub">評級 ${rating}</div>
    </div>
    <div class="dm-cell" onclick="copyText('${d.reportDate}','資料週期')">
      <div class="dm-lbl">資料週期</div><div class="dm-val">${d.reportDate}</div><div class="dm-sub">同步完成</div>
    </div>`;

  renderRankTable();
}

// ═══════════════════════════════════════════════════════
//  排名表
// ═══════════════════════════════════════════════════════
function renderRankTable() {
  const ranked = S.rankedData;
  if (!ranked?.length) { document.getElementById('rank-container').innerHTML = '<p class="empty">無排名資料</p>'; return; }

  const d = S.parsedData;
  const avg = d.rows.length ? d.totalRevenue / d.rows.length : 1;
  const groups = { A1: [], A2: [], B: [], C: [] };
  ranked.forEach(r => { if (groups[r.group]) groups[r.group].push(r); });

  const gLabel = { A1: '🔴 A1 高單主力', A2: '🟠 A2 續單收割', B: '🔵 B 一般量單', C: '⚪ C 補位觀察' };
  const gColor = { A1: '#ff1e3c', A2: '#ffaa00', B: '#0088ff', C: '#94a3b8' };

  let html = '';
  for (const [g, members] of Object.entries(groups)) {
    if (!members.length) continue;

    const gTotal = members.reduce((s, r) => s + (r.totalRevenue || 0), 0);
    const gPct = ((gTotal / d.totalRevenue) * 100).toFixed(1);
    const roster = members.map(r => r.name).join('、');

    html += `
    <div class="group-header" onclick="copyText('【${escAttr(gLabel[g])}】${escAttr(roster)}（共 ${members.length} 人）','${g}組名單')"
         style="color:${gColor[g]}; border-left:3px solid currentColor; padding-left:.7rem;" title="點擊複製全員">
      <strong style="text-shadow:0 0 6px currentColor;">${gLabel[g]} [${gPct}%]</strong>
      <span>▸ ${members.length}人</span>
    </div>
    <table style="margin-bottom:1.2rem;">
      <thead><tr>
        <th>名次</th><th>組別</th><th>姓名</th><th>追續</th><th>續單</th><th>總業績</th>
      </tr></thead>
      <tbody>`;

    members.forEach(r => {
      const isTop = r.rank <= 3;
      const dm = `【${r.name} 數據分析】\n名次：第 ${r.rank} 名\n追續：${r.renewDeals}\n續單：$${(r.renewRevenue||0).toLocaleString()}\n總業績：$${(r.totalRevenue||0).toLocaleString()}`;

      html += `<tr>
        <td class="${isTop ? 'rank-top' : ''}">#${r.rank}</td>
        <td><span class="badge badge-${r.group}">${r.group}</span></td>
        <td><span class="click-name" onclick="copyText('${escAttr(dm)}','${r.name} 數據')" title="點擊複製">${r.name}</span></td>
        <td>${r.renewDeals || 0}</td>
        <td style="font-family:var(--font-mono);font-weight:700;">$${(r.renewRevenue||0).toLocaleString()}</td>
        <td style="font-family:var(--font-mono);font-weight:800;color:${isTop?'var(--gold)':'#fff'};">$${(r.totalRevenue||0).toLocaleString()}</td>
      </tr>`;
    });
    html += '</tbody></table>';
  }
  document.getElementById('rank-container').innerHTML = html;
}

// ═══════════════════════════════════════════════════════
//  AI 建議
// ═══════════════════════════════════════════════════════
function renderAdvice(suggestions) {
  const el = document.getElementById('advice-container');
  if (!el || !suggestions?.length) return;

  const gc = { A1: '#ff1e3c', A2: '#ffaa00', B: '#0088ff', C: '#94a3b8' };

  el.innerHTML = suggestions.map(s => {
    const c = gc[s.group] || '#94a3b8';
    const full = `【${s.name}・第${s.rank}名・${s.group}組】\n${s.advice}`;
    return `
      <div class="advice-card" onclick="copyText('${escAttr(full)}','${s.name} 建議')" title="點擊複製">
        <div class="advice-rank" style="background:${c}18;color:${c};border:1px solid ${c}44;">#${s.rank}</div>
        <div style="flex:1;">
          <div class="advice-name" style="color:${c};">${s.name} <span class="badge badge-${s.group}" style="font-size:.5rem;padding:.08rem .3rem;">${s.group}</span></div>
          <div class="advice-text">${escHtml(s.advice)}</div>
          <div class="advice-copy-hint">▸ 點擊複製</div>
        </div>
      </div>`;
  }).join('');
}

function copyAllAdvice() {
  if (!S.suggestions?.length) { toast('⚠️ 尚無建議'); return; }
  const text = S.suggestions.map(s =>
    `【${s.rank}、${s.name}（${s.group}）】\n${s.advice}`
  ).join('\n\n────────────────\n\n');
  copyText('📣 AI 大數據建議・完整版\n\n' + text, '全部建議');
}

// ═══════════════════════════════════════════════════════
//  公告 / 播報 / LINE
// ═══════════════════════════════════════════════════════
function renderOutputs() {
  if (!S.outputs) return;
  const { announce, broadcast, lineMessages } = S.outputs;

  ['announce-box','ann2'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = announce || '';
  });
  ['broadcast-box','bc2'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = broadcast || '';
  });

  // LINE 分組
  const container = document.getElementById('line-blocks');
  if (!lineMessages || !container) return;

  const gBg = { A1:'rgba(255,30,60,0.08)', A2:'rgba(255,170,0,0.08)', B:'rgba(0,136,255,0.08)', C:'rgba(100,116,139,0.06)' };
  const gBd = { A1:'rgba(255,30,60,0.2)', A2:'rgba(255,170,0,0.2)', B:'rgba(0,136,255,0.2)', C:'rgba(100,116,139,0.15)' };

  container.innerHTML = Object.entries(lineMessages).map(([g, msg]) => `
    <div style="margin-bottom:.7rem;background:${gBg[g]||''};border-radius:8px;padding:.8rem;border:1px solid ${gBd[g]||''};">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:.4rem;">
        <span style="font-weight:700;font-size:.75rem;"><span class="badge badge-${g}">${g}</span> 組</span>
        <button class="btn-copy btn-sm" onclick="copyText('${escAttr(msg)}','LINE ${g}組訊息')">複製此組</button>
      </div>
      <pre style="font-size:.7rem;color:#cbd5e1;white-space:pre-wrap;font-family:var(--font-mono);line-height:1.5;">${escHtml(msg)}</pre>
    </div>
  `).join('');
}

function copyAllLineMessages() {
  if (!S.outputs?.lineMessages) { toast('⚠️ 尚無分組訊息'); return; }
  const all = Object.values(S.outputs.lineMessages).join('\n\n━━━━━━━━━━━━━━━━\n\n');
  copyText(all, '全部 LINE 訊息');
}

function copyTopN(n) {
  if (!S.rankedData?.length) { toast('⚠️ 尚無排名'); return; }
  const top = S.rankedData.slice(0, n).map((r, i) =>
    `第${i+1}名：${r.name}｜$${(r.totalRevenue||0).toLocaleString()}`
  ).join('\n');
  copyText(`【前${n}名速報】\n${top}`, `前${n}名`);
}

// ═══════════════════════════════════════════════════════
//  語音播報
// ═══════════════════════════════════════════════════════
let speaking = false;
function toggleSpeak() {
  const text = document.getElementById('bc2')?.value || document.getElementById('broadcast-box')?.value || '';
  if (!text) { toast('⚠️ 尚無播報稿'); return; }
  if (speaking) {
    speechSynthesis.cancel();
    speaking = false;
    document.getElementById('btn-speak').textContent = '🔊 語音播報';
    toast('⏹ 播報已停止');
    return;
  }
  const u = new SpeechSynthesisUtterance(text);
  u.lang = 'zh-TW'; u.rate = 0.9;
  u.onend = () => { speaking = false; document.getElementById('btn-speak').textContent = '🔊 語音播報'; };
  speechSynthesis.speak(u);
  speaking = true;
  document.getElementById('btn-speak').textContent = '⏹ 停止播報';
  toast('🎙 播報中⋯');
}

// ═══════════════════════════════════════════════════════
//  日誌
// ═══════════════════════════════════════════════════════
let _logs = [];

async function fetchLogs() {
  try {
    const j = await api('/api/logs');
    if (!j.success || !j.data.length) {
      document.getElementById('log-monitor').innerHTML = '<p class="empty">暫無日誌</p>';
      document.getElementById('log-stats').innerHTML = '';
      return;
    }
    _logs = j.data.slice().reverse();

    // 統計
    const steps = {}, ok = { ok: 0, fail: 0 };
    _logs.forEach(l => {
      steps[l.step] = (steps[l.step] || 0) + 1;
      l.status === '成功' ? ok.ok++ : ok.fail++;
    });

    document.getElementById('log-stats').innerHTML = [
      `<span class="log-pill" style="background:rgba(0,255,136,.08);color:#00ff88;border:1px solid rgba(0,255,136,.15);" onclick="filterLogs('成功')">✓ ${ok.ok}</span>`,
      ok.fail > 0 ? `<span class="log-pill" style="background:rgba(255,68,102,.08);color:#ff4466;border:1px solid rgba(255,68,102,.15);" onclick="filterLogs('失敗')">✗ ${ok.fail}</span>` : '',
      ...Object.entries(steps).map(([s, c]) => `<span class="log-pill" style="background:rgba(255,30,60,.06);color:var(--red);border:1px solid rgba(255,30,60,.12);" onclick="filterLogs('${s}')">${s} ×${c}</span>`),
      `<span class="log-pill" style="background:rgba(255,255,255,.02);color:var(--muted);border:1px solid rgba(255,255,255,.05);" onclick="fetchLogs()">全部 ${_logs.length}</span>`
    ].join('');

    renderLogs(_logs);
  } catch { document.getElementById('log-monitor').innerHTML = '<p class="empty">日誌讀取失敗</p>'; }
}

function renderLogs(logs) {
  document.getElementById('log-monitor').innerHTML = logs.map((l, i) => {
    const ts = (l.timestamp || '').slice(11, 19);
    const isOk = l.status === '成功';
    const full = `[${ts}] ${l.step} ${l.status} — ${l.message || ''}`;
    return `<div class="log-line" onclick="copyText('${escAttr(full)}','日誌第${i+1}筆')">
      <span class="log-ts">[${ts}]</span>
      <span class="log-step">${l.step || ''}</span>
      <span class="${isOk ? 'log-ok' : 'log-fail'}">${l.status || ''}</span>
      <span class="log-msg">${escHtml(l.message || '')}</span>
    </div>`;
  }).join('');
}

function filterLogs(kw) {
  if (!_logs.length) return;
  const f = _logs.filter(l => l.step === kw || l.status === kw || (l.message || '').includes(kw));
  if (!f.length) { toast('⚠️ 無「' + kw + '」日誌'); return; }
  renderLogs(f);
  toast('🔍 篩選：' + kw + '（' + f.length + '筆）');
}

function exportLogs() {
  if (!_logs.length) { toast('⚠️ 尚無日誌'); return; }
  const txt = _logs.map(l => `[${(l.timestamp||'').slice(11,19)}] [${l.step||''}] ${l.status||''} — ${l.message||''}`).join('\n');
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([txt], { type: 'text/plain' }));
  a.download = `系統日誌-${new Date().toISOString().slice(0,10)}.txt`;
  a.click();
  toast('📥 已匯出');
}

async function checkHealth() {
  try {
    const j = await (await fetch('/api/health')).json();
    const msg = j.success ? `💚 系統健康｜${j.message}` : '❌ 健康檢查失敗';
    toast(msg);
  } catch { toast('❌ 無法連線後端'); }
}

// ═══════════════════════════════════════════════════════
//  事件綁定
// ═══════════════════════════════════════════════════════
document.getElementById('btn-clear').addEventListener('click', () => { document.getElementById('raw-input').value = ''; });
document.getElementById('btn-preload').addEventListener('click', preload322);
document.getElementById('btn-execute').addEventListener('click', startWorkflow);
document.getElementById('btn-copy-announce').addEventListener('click', () => copyEl('announce-box', '公告'));
document.getElementById('btn-copy-broadcast').addEventListener('click', () => copyEl('broadcast-box', '播報稿'));
document.getElementById('btn-speak').addEventListener('click', toggleSpeak);
document.getElementById('btn-copy-all-advice').addEventListener('click', copyAllAdvice);
document.getElementById('btn-copy-advice').addEventListener('click', copyAllAdvice);
document.getElementById('btn-copy-ann2').addEventListener('click', () => copyEl('ann2', '完整公告'));
document.getElementById('btn-copy-top3').addEventListener('click', () => copyTopN(3));
document.getElementById('btn-copy-top10').addEventListener('click', () => copyTopN(10));
document.getElementById('btn-copy-bc2').addEventListener('click', () => copyEl('bc2', '播報稿'));
document.getElementById('btn-copy-all-line').addEventListener('click', copyAllLineMessages);
document.getElementById('btn-copy-line-all').addEventListener('click', copyAllLineMessages);
document.getElementById('btn-refresh-logs').addEventListener('click', fetchLogs);
document.getElementById('btn-export-logs').addEventListener('click', exportLogs);
document.getElementById('btn-health').addEventListener('click', checkHealth);
document.getElementById('btn-clear-logs').addEventListener('click', () => {
  document.getElementById('log-monitor').innerHTML = '<p class="empty">畫面已清除（後端日誌保留）</p>';
  document.getElementById('log-stats').innerHTML = '';
  _logs = [];
});

// ═══════════════════════════════════════════════════════
//  初始化
// ═══════════════════════════════════════════════════════
initFlow();
initSeqGrid();
fetchLogs();
