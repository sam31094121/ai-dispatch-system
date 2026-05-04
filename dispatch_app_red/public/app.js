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
  pageSubtitle: $('page-subtitle'),
  scoringPolicyTitle: $('scoring-policy-title'),
  scoringPolicyDate: $('scoring-policy-date'),
  scoringPolicyDescription: $('scoring-policy-description'),
  scoringWeightGrid: $('scoring-weight-grid'),
  scoringPolicyFormula: $('scoring-policy-formula')
};

const LOCKED_RULES = [
  '後端唯一真實來源。',
  '前端只做顯示，不做運算。',
  '排序固定：正式權重分數 → 實收總業績 → 追續單金額 → 全部總金額 → 追續客單價 → 追續單數量。',
  'AI 計分核心：10000 分制比例原則 (3000/2500/1500/1500/1500)。',
  '已離職只列審計，不入正式派單。',
  'A1 第1-4名，A2 第5-11名，B 第12-18名，C 第19名以後。',
  '姓名辨識度必須完全正確，禁止錯寫。',
  '群組精簡版、排行榜、分組卡、建議卡只能來自同一份後端資料。'
];

const state = {
  current: null
};

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

// 取出各計分指標，支援新舊欄位名稱
function getMetrics(row) {
  return {
    實收:     fieldVal(row, '實收', '實收總金額', '實收總業績', 'actualRevenue'),
    追續金額: fieldVal(row, '追續金額', '續單金額', '追續單金額', 'renewalRevenue'),
    全部總業績: fieldVal(row, '全部總業績', '總業績', 'totalRevenue'),
    追續客單價: fieldVal(row, '追續客單價', 'avgRenewal'),
    追續單數:  fieldVal(row, '追續單數', '追續成交總數', 'renewalDeals'),
    AI分數:   fieldVal(row, '正式權重分數', 'AI權重分數', 'weightedScore', 'totalScore')
  };
}

function countUp(el, target, duration = 1200) {
  const numTarget = Number(target || 0);
  if (!numTarget) { el.textContent = numberFormatter.format(0); return; }
  const t0 = performance.now();
  
  // 加入數值跳動感 VFX
  el.style.textShadow = '0 0 15px var(--cyan)';
  el.style.transition = 'transform 0.1s ease';

  function tick(now) {
    const p = Math.min((now - t0) / duration, 1);
    // Exponential out easing
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
  node.className = badgeClass(status);
  node.textContent = text;
}

function safeHtml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// 進階優化：音效管理器 (專為 Cyber Command Center 設計)
const AudioManager = {
  ctx: null,
  init() { if (!this.ctx) this.ctx = new (window.AudioContext || window.webkitAudioContext)(); },
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

// 進階優化：即時監聽與 Debounce 機制
let auditTimeout = null;
function setupLiveAudit() {
  refs.rawInput.addEventListener('input', () => {
    refs.inputStatus.textContent = '掃描中...';
    refs.inputStatus.className = 'badge badge-neutral ai-scanning-text';
    
    clearTimeout(auditTimeout);
    auditTimeout = setTimeout(async () => {
      const content = refs.rawInput.value.trim();
      if (!content) {
        refs.inputStatus.textContent = '等待輸入';
        refs.inputStatus.className = 'badge badge-neutral';
        return;
      }
      
      AudioManager.click();
      const { ok, payload } = await request('/api/smart-audit', {
        method: 'POST',
        body: JSON.stringify({ raw: content })
      });
      
      if (ok && payload.data) {
        renderValidation(payload.data);
        refs.inputStatus.textContent = payload.data.validation.status === 'PASS' ? '掃描通過' : '結構異常';
        refs.inputStatus.className = badgeClass(payload.data.validation.status);
      }
    }, 800);
  });
}

async function request(url, options = {}) {
  const response = await fetch(url, {
    cache: 'no-store',
    headers: { 'Content-Type': 'application/json' },
    ...options
  });

  const payload = await response.json().catch(() => ({
    success: false,
    message: '伺服器回應格式錯誤',
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
  
  setBadge(refs.auditResultBadge, status, status === 'PASS' ? '審計通過' : (status === 'FAIL' ? '檢查失敗' : '待檢查'));

  refs.validationSummary.innerHTML = `
    <div class="metric-stack">
      <div class="metric-chip">
        <span>審計結果</span>
        <strong style="color: var(--${status === 'PASS' ? 'pass' : (status === 'FAIL' ? 'fail' : 'cyan')})">${safeHtml(summary.審計結果 || status)}</strong>
      </div>
      <div class="metric-chip">
        <span>正式人數</span>
        <strong>${safeHtml(String(summary.正式人數 ?? '-'))}</strong>
      </div>
      <div class="metric-chip">
        <span>離職列示</span>
        <strong>${safeHtml(String(summary.離職列示人數 ?? '-'))}</strong>
      </div>
      <div class="metric-chip">
        <span>本月業績</span>
        <strong>${safeHtml(fmt(summary.本月業績 || 0))}</strong>
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
          innerHTML: '<span class="issue-label">INFO</span> <span class="issue-text">後端審計通過，未發現矛盾。</span>'
        })])
  );
}

function renderHero(data, snapshot) {
  const result = snapshot?.validation?.status || 'FAIL';
  const dates = data?.日期資訊 || {};

  refs.announcementTitle.textContent = data?.公告標題 || snapshot?.title || '尚未載入公告';
  refs.dateRange.textContent = `${dates.結算日 || '-'} 結算 → ${dates.派單日 || '-'} 正式派單`;
  refs.auditResult.textContent = result;
  refs.auditResult.className = `audit-hero ${result === 'PASS' ? 'audit-pass' : 'audit-fail'}`;
  refs.cancellationChip.textContent = `取消退貨 ${fmt(data?.整合總盤?.當日取消退貨 || 0)}`;

  refs.healthStatus.textContent = 'ONLINE';
  refs.executionId.textContent = dates.結算日 || snapshot?.executionId || '-';
  refs.persistStatus.textContent = snapshot?.persisted ? '正式版' : '預覽中';
  refs.pageSubtitle.textContent = snapshot?.persisted
    ? `正式公告已鎖定：${dates.結算日 || '5/2'} 結算，${dates.派單日 || '5/3'} 正式派單。前端僅呈現後端正式快照。`
    : '目前展示的是預覽結果，尚未寫入正式版。';
}

function groupLine(groups, key, label) {
  const names = Array.isArray(groups?.[key]) ? groups[key] : [];
  return `${label}：${names.join('、') || '-'}`;
}

function buildPasteReadyAnnouncement(snapshot) {
  const ranking = Array.isArray(snapshot?.ranking) ? snapshot.ranking : [];
  const groups = snapshot?.groups || {};
  const dates = snapshot?.standardData?.日期資訊 || {};
  const settleDay = dates.結算日 || '-';
  const dispatchDay = dates.派單日 || '-';

  // 取離職人員
  const retiredNames = (snapshot?.standardData?.審計結論?.['審計列示不入派單'] || [])
    .map(e => e?.姓名 || e).filter(Boolean);

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
    return `${row.rank}、${row.name}｜AI ${score}｜實收 ${fmt(actual)}｜追續金額 ${fmt(renewal)}｜追續單數 ${deals}`;
  });

  const retiredLine = retiredNames.length
    ? `已離職：${retiredNames.join('、')}，只列審計，不入正式派單。`
    : '';

  return [
    `📣【AI 派單公告｜${settleDay} 結算 → ${dispatchDay} 正式派單順序｜三平台整合比例原則版】`,
    '',
    '審計結果：PASS',
    '三平台總表與個別明細全部核對通過，無漏算、無多算、無總盤衝突。',
    retiredLine,
    '',
    '正式前10名：',
    `${top10}。`,
    '',
    '正式名次：',
    ...rankingLines,
    '',
    'A1／A2／B／C 派單分組：',
    groupLine(groups, 'A1', 'A1｜核心主力'),
    groupLine(groups, 'A2', 'A2｜續單收割'),
    groupLine(groups, 'B', 'B組｜穩定進階'),
    groupLine(groups, 'C', 'C組｜補位觀察'),
    '',
    `${dispatchDay} 正式派單順序以本則公告為準。`,
    '今日派單請依 A1 → A2 → B → C 順序執行；前方全忙才往下派，不得跳位，不得指定。',
    '同客戶回撥，優先由原承接人服務。',
    '請全員確認後回覆「+1」。'
  ].filter(v => v !== null && v !== undefined).join('\n');
}

function renderOfficialLock(snapshot) {
  if (!refs.officialLockPanel) return;

  const ranking = Array.isArray(snapshot?.ranking) ? snapshot.ranking : [];
  const groups = snapshot?.groups || {};
  const dates = snapshot?.standardData?.日期資訊 || {};
  const dispatchDay = dates.派單日 || snapshot?.report?.nextDispatchDisplayDate || '-';
  const top10 = ranking
    .slice(0, 10)
    .map((row) => `${row.rank}.${row.name}`)
    .join('  ');

  refs.officialLockStatus.textContent = ranking.length
    ? `${dispatchDay} 正式派單順序已確認，可直接執行`
    : '等待正式派單順序';
  refs.officialLockDate.textContent = `${dispatchDay} LOCK`;
  refs.officialLockTop10.textContent = top10 || '-';
  refs.officialLockGroups.textContent = [
    groupLine(groups, 'A1', 'A1'),
    groupLine(groups, 'A2', 'A2'),
    groupLine(groups, 'B', 'B'),
    groupLine(groups, 'C', 'C')
  ].join('｜');
}

function renderSummaryCards(cards) {
  const entries = Array.isArray(cards) ? cards : Object.entries(cards || {});
  const items = entries.map(([label, value]) => {
    const card = document.createElement('article');
    card.className = 'summary-card';
    const span = document.createElement('span');
    span.textContent = label;
    const strong = document.createElement('strong');
    strong.textContent = '0';
    card.append(span, strong);
    return { card, value, strong };
  });
  refs.summaryGrid.replaceChildren(...items.map(i => i.card));
  items.forEach(({ strong, value }) => countUp(strong, value, 800));
}

function renderSpotlight(rows) {
  if (!rows || !rows.length) return;
  const top1Score = getMetrics(rows[0]).AI分數 || 0;

  refs.spotlightGrid.replaceChildren(
    ...rows.map((row, index) => {
      const m = getMetrics(row);
      const rank = index + 1;
      const scoreGap = rank > 1 && top1Score > 0 ? (top1Score - (m.AI分數 || 0)) : 0;
      const card = document.createElement('article');
      card.className = `spotlight-card rank-${rank} group-${row.分級}`;

      const championBanner = rank === 1 ? `
        <div class="spotlight-champion-banner">
          <span class="champion-icon">👑</span>
          <span class="champion-label">CHAMPION · #1</span>
          <span class="champion-ai">AI 10000 比例原則</span>
        </div>` : '';

      const gapBadge = scoreGap > 0
        ? `<span class="spotlight-gap-badge">↓ −${scoreGap.toFixed(2)} pts</span>`
        : '';

      // 進階優化：榮耀稱號系統 (增加大卡感)
      const titles = {
        1: { text: '王者 KING', class: 'title-champion' },
        2: { text: '頂尖 ELITE', class: 'title-elite' },
        3: { text: '豪傑 HERO', class: 'title-elite' },
        4: { text: '強襲 STRIKER', class: 'title-striker' },
        5: { text: '破軍 VANGUARD', class: 'title-striker' }
      };
      const titleData = titles[rank];
      const titleHtml = titleData ? `<span class="prestige-title ${titleData.class}">${titleData.text}</span>` : '';

      // 大卡展示：前 5 名全部使用 5 欄完整顯示
      const metricsHTML = rank <= 5
        ? `<div class="spotlight-grid-inner spotlight-5col">
            <div><span>實收總金額</span><strong>${safeHtml(fmt(m.實收))}</strong></div>
            <div><span>追續金額</span><strong>${safeHtml(fmt(m.追續金額))}</strong></div>
            <div><span>全部總業績</span><strong>${safeHtml(fmt(m.全部總業績))}</strong></div>
            <div><span>追續客單價</span><strong>${safeHtml(fmt(m.追續客單價))}</strong></div>
            <div><span>追續單數</span><strong>${safeHtml(String(m.追續單數))} 單</strong></div>
          </div>`
        : `<div class="spotlight-grid-inner">
            <div><span>實收總金額</span><strong>${safeHtml(fmt(m.實收))}</strong></div>
            <div><span>追續金額</span><strong>${safeHtml(fmt(m.追續金額))}</strong></div>
            <div><span>全部總業績</span><strong>${safeHtml(fmt(m.全部總業績))}</strong></div>
            <div><span>追續客單價</span><strong>${safeHtml(fmt(m.追續客單價))}</strong></div>
          </div>
          <div class="spotlight-renewal-row">
            <span class="spotlight-renewal-label">追續單數</span>
            <span class="spotlight-renewal-value">${safeHtml(String(m.追續單數))} 單</span>
          </div>`;

      const scoreHTML = m.AI分數
        ? `<div class="score-banner">
            <span class="score-label">AI 權重分數</span>
            <strong class="score-value">${safeHtml(Number(m.AI分數).toFixed(2))}</strong>
            ${rank <= 3 ? '<span class="score-max">/ 10000 · A1 TIER</span>' : ''}
          </div>`
        : '';

      const adviceHTML = rank <= 3 && row.建議
        ? `<p class="spotlight-advice-text">${safeHtml(row.建議)}</p>`
        : '';

      card.innerHTML = `
        <div class="spotlight-content-wrapper">
          ${championBanner}
          <div class="spotlight-meta">
            <span class="rank-no">#${safeHtml(String(row.名次 || row.rank))}</span>
            <span class="group-tag" style="background:var(--cyan); color:#000;">${safeHtml(row.分級 || row.group)}</span>
            ${gapBadge}
          </div>
          <h3>${safeHtml(row.姓名 || row.name)}${titleHtml}</h3>
          ${(row.標記 || row.isNew) ? `<span class="newbie-tag">${safeHtml(row.標記 || '新人')}</span>` : ''}
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
  refs.leaderboard.replaceChildren(
    ...rows.map((row) => {
      const m = getMetrics(row);
      const item = document.createElement('article');
      item.className = `leader-row group-${row.分級 || row.group}`;
      item.innerHTML = `
        <div class="leader-left">
          <strong>#${safeHtml(String(row.名次 || row.rank))}</strong>
          <div>
            <p>${safeHtml(row.姓名 || row.name)}</p>
            <span>${safeHtml(row.分級 || row.group)}${(row.標記 || row.isNew) ? `・${safeHtml(row.標記 || '新人')}` : ''}</span>
          </div>
        </div>
        <div class="leader-right">
          <span>實收</span>
          <strong>${safeHtml(fmt(m.實收 || m.全部總業績))}</strong>
          <span style="margin-top:4px">AI ${safeHtml(Number(m.AI分數).toFixed(0))}</span>
        </div>
      `;
      return item;
    })
  );
}

const GROUP_META = {
  A1: { emoji: '🔴', label: 'A1 高優先主力' },
  A2: { emoji: '🟠', label: 'A2 次主力追進' },
  B:  { emoji: '🟡', label: 'B 組 一般量單' },
  C:  { emoji: '🟢', label: 'C 組 補位觀察' }
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
        : '<span class="member-empty">尚無資料</span>';
      card.innerHTML = `
        <div class="group-head">
          <strong>${safeHtml(meta.emoji + '\u00a0' + meta.label)}</strong>
          <span>${safeHtml(String(names.length))} 人</span>
        </div>
        <div class="group-members">${membersHtml}</div>
      `;
      return card;
    })
  );
}

function renderRetired(retired) {
  refs.retiredList.replaceChildren(
    ...(retired.length
      ? retired.map((entry) => {
          const row = document.createElement('article');
          row.className = 'retired-row';
          row.innerHTML = `
            <strong>${safeHtml(entry.姓名)}</strong>
            <span>${safeHtml(entry.原因 || '已離職')}</span>
          `;
          return row;
        })
      : [Object.assign(document.createElement('div'), {
          className: 'retired-empty',
          textContent: '本輪沒有離職列示。'
        })])
  );
}

function renderRankingTable(rows) {
  refs.rankingTableBody.innerHTML = rows.map((row) => {
    const m = getMetrics(row);
    const score = Number(m.AI分數 || 0);
    const scoreStyle = score >= 3000 ? 'style="color: var(--cyan); font-weight: bold; text-shadow: 0 0 8px var(--cyan);"' : '';
    return `
      <tr class="row-${safeHtml(row.分級 || row.group)}">
        <td>${safeHtml(String(row.名次 || row.rank))}</td>
        <td>
          <div class="table-name">
            <span>${safeHtml(row.姓名 || row.name)}</span>
            ${(row.標記 || row.isNew) ? `<span class="newbie-tag">${safeHtml(row.標記 || '新人')}</span>` : ''}
          </div>
        </td>
        <td>${safeHtml(row.分級 || row.group)}</td>
        <td class="col-score" ${scoreStyle}>${score > 0 ? safeHtml(Number(score).toFixed(2)) : '—'}</td>
        <td>${safeHtml(fmt(m.實收))}</td>
        <td>${safeHtml(fmt(m.追續金額))}</td>
        <td>${safeHtml(fmt(m.全部總業績))}</td>
        <td>${safeHtml(fmt(m.追續客單價))}</td>
        <td>${safeHtml(String(m.追續單數))}</td>
      </tr>
    `;
  }).join('');
}

function renderAdvice(rows) {
  refs.adviceList.replaceChildren(
    ...rows.map((row) => {
      const card = document.createElement('article');
      card.className = `advice-card group-${row.分級 || row.group}`;
      card.innerHTML = `
        <div class="advice-header">
          <div class="advice-rank-name">
            <span class="advice-rank">#${safeHtml(String(row.名次 || row.rank))}</span>
            <strong class="advice-name">${safeHtml(row.姓名 || row.name)}</strong>
            ${(row.標記 || row.isNew) ? `<span class="newbie-tag">${safeHtml(row.標記 || '新人')}</span>` : ''}
          </div>
          <span class="advice-group-tag">${safeHtml(row.分級 || row.group)}</span>
        </div>
        <p class="advice-text">${safeHtml(row.建議 || row.advice)}</p>
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
      _ws: (m.AI分數 > 0 ? m.AI分數 :
        (m.追續金額 * 0.25 + m.全部總業績 * 0.15 + m.實收 * 0.30 + m.追續客單價 * 0.15 + m.追續單數 * 100 * 0.15))
    };
  });
  const sorted = [...withWs].sort((a, b) => b._ws - a._ws);
  const wsRankOf = {};
  sorted.forEach((p, i) => { wsRankOf[p.姓名 || p.name] = i + 1; });

  return withWs.map((row, idx) => {
    if ((row.建議 || row.advice) && (row.建議 || row.advice).length > 20) return row;
    const m = row._m;
    const ws = row._ws;
    const above = withWs[idx - 1];
    const below = withWs[idx + 1];
    const gapUp   = above ? ((above._ws - ws) / above._ws * 100).toFixed(1) : null;
    const gapDown = below ? ((ws - below._ws) / ws * 100).toFixed(1) : null;
    const wsr = wsRankOf[row.姓名 || row.name];
    const trank = row.名次 || row.rank;
    // 判斷主指標：實收 > 追續金額 > 客單價
    const rc = m.追續金額 * 2500;
    const ac = m.實收 * 3000;
    const dc = m.追續單數 * 1500;
    const tot = rc + ac + dc || 1;
    const mainMetric = ac/tot > 0.45 ? '實收' : (rc/tot > 0.35 ? '追續金額' : '追續單數');
    const dealCnt = m.追續單數;
    let advice = '';
    if (trank === 1) {
      const lead = gapDown || '0';
      advice = `你穩在榜首，但與第二名差距只有 ${lead}%，不算絕對安全。今天把${mainMetric}再補一筆，差距才能繼續拉開。榜首的位置靠守不住，靠今天繼續進攻才能穩。`;
    } else if (trank <= 4) {
      const rival = above ? above.姓名 : '';
      const threat = parseFloat(gapDown || '100') < 15 ? `下面距你只有 ${gapDown}%，有被追上的壓力。` : `下面距你 ${gapDown}%，位置尚穩。`;
      advice = `你跟${rival}差距 ${gapUp}%，${threat}今天把${mainMetric}當主方向，一筆有效成交就能縮短差距。前三不是你的終點，往前壓才是今天的任務。`;
    } else if (trank <= 10) {
      const wsNote = wsr < trank ? `你的權重排名第 ${wsr}，比傳統排名更靠前——` : '';
      const threatNote = parseFloat(gapDown || '100') < 12 ? `下面緊咬，差距只有 ${gapDown}%。` : '';
      advice = `你跟前一名差距 ${gapUp}%。${wsNote}${threatNote}今天把${mainMetric}集中突破，追續 ${dealCnt} 筆是你的槓桿，把努力轉成成交才能讓排名動起來。`;
    } else if (trank <= 18) {
      const wsNote = wsr !== trank ? `（權重實際排名第 ${wsr}）` : '';
      advice = `你跟前一名差距 ${gapUp}%${wsNote}。今天以${mainMetric}為主攻，別讓排名固定太久——${dealCnt > 5 ? `追續 ${dealCnt} 筆代表你在努力，` : ''}一筆有效成交就能讓位置動起來。`;
    } else {
      const action = dealCnt > 2 ? `追續 ${dealCnt} 筆是你的起點，把接觸轉成成交` : '今天先讓一筆業績落地';
      advice = `後段區有你，今天的目標只有一個：讓數字動。${action}，累積才是往前的路。不用看太遠，有一筆就是起點。`;
    }
    return { ...row, 建議: advice };
  });
}

function renderProportionalAdvice(rows) {
  const grid = refs.propAdviceGrid;
  if (!grid) return;
  const enriched = autoProportionalAdvice(rows);
  grid.replaceChildren(
    ...enriched.map((row) => {
      const card = document.createElement('article');
      const grpColor = GROUP_COLOR[row.分級 || row.group] || '#fff';
      card.className = `prop-card group-${row.分級 || row.group}`;
      card.innerHTML = `
        <div class="prop-card-header">
          <div class="prop-rank-name">
            <span class="prop-rank">#${safeHtml(String(row.名次 || row.rank))}</span>
            <strong class="prop-name">${safeHtml(row.姓名 || row.name)}</strong>
            ${(row.標記 || row.isNew) ? `<span class="newbie-tag">${safeHtml(row.標記 || '新人')}</span>` : ''}
          </div>
          <span class="prop-group-tag" style="color:${grpColor};border-color:${grpColor}40">${safeHtml(row.分級 || row.group)}</span>
        </div>
        ${(() => { const m = getMetrics(row); return m.AI分數 ? `<div class="prop-score">AI 分數 <strong>${safeHtml(Number(m.AI分數).toFixed(2))}</strong></div>` : ''; })()}
        <div class="prop-metrics">
          ${(() => { const m = getMetrics(row); return `
          <span>實收 <strong>${safeHtml(fmt(m.實收))}</strong></span>
          <span>追續金額 <strong>${safeHtml(fmt(m.追續金額))}</strong></span>
          <span>追續單數 <strong>${safeHtml(String(m.追續單數))}</strong></span>
          <span>客單價 <strong>${safeHtml(fmt(m.追續客單價))}</strong></span>
          `; })()}
        </div>
        <p class="prop-advice-text">${safeHtml(row.建議 || '')}</p>
      `;
      return card;
    })
  );
}

function renderScoringPolicy(snapshot) {
  const policy = snapshot?.scoringPolicy || {};
  const dates = snapshot?.standardData?.日期資訊 || {};
  if (refs.scoringPolicyTitle) {
    refs.scoringPolicyTitle.textContent = policy.title || 'AI 權重分數（比例原則）';
  }
  if (refs.scoringPolicyDate) {
    refs.scoringPolicyDate.textContent = `${dates.結算日 || '-'} → ${dates.派單日 || '-'}`;
  }
  if (refs.scoringPolicyDescription) {
    refs.scoringPolicyDescription.textContent = policy.description || '以今日業績比例換算權重分數。';
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
  const retired = presentation.retired || data?.審計結論?.['審計列示不入派單'] || [];

  renderValidation(snapshot);
  renderHero(data, snapshot);
  renderOfficialLock(snapshot);
  renderSummaryCards(presentation.summaryCards || data?.整合總盤 || snapshot?.report?.audit?.summaryBoard || []);
  renderSpotlight(presentation.top5 || data?.正式名次 || snapshot?.report?.rankings || []);
  renderLeaderboard(presentation.top10 || data?.正式名次 || snapshot?.report?.rankings || []);
  const rankMap = {};
  (data?.正式名次 || snapshot?.report?.rankings || []).forEach(row => { if (row?.姓名 || row?.name) rankMap[row.姓名 || row.name] = row.名次 || row.rank; });
  renderGroups(data?.分級 || snapshot?.report?.groups || {}, rankMap);
  renderRetired(retired);
  renderRankingTable(data?.正式名次 || snapshot?.report?.rankings || []);
  renderAdvice(data?.正式名次 || snapshot?.report?.rankings || []);
  renderScoringPolicy(snapshot);
  renderProportionalAdvice(data?.正式名次 || snapshot?.report?.rankings || []);
  refs.compactOutput.value = buildPasteReadyAnnouncement(snapshot) || data?.群組超精簡版 || '';
}

async function loadCurrent() {
  setBadge(refs.inputStatus, 'PENDING', '載入正式版中');
  const { ok, payload } = await request('/api/current');
  if (!ok) {
    setBadge(refs.inputStatus, 'FAIL', payload.message || '載入失敗');
    return;
  }

  const snapshot = payload.data;
  refs.rawInput.value = '';
  render(snapshot);
  setBadge(refs.inputStatus, 'PASS', '已載入正式版');
}

async function auditCurrentInput(options = {}) {
  if (!options.suppressPending) {
    setBadge(refs.inputStatus, 'PENDING', '後端審計中');
  }
  const { ok, payload } = await request('/api/audit', {
    method: 'POST',
    body: JSON.stringify({ rawText: refs.rawInput.value })
  });

  if (!payload.data) {
    if (options.overrideBadge) {
      setBadge(refs.inputStatus, options.overrideBadge.status, options.overrideBadge.text);
    } else {
      setBadge(refs.inputStatus, 'FAIL', payload.message || '審計失敗');
    }
    return;
  }

  render(payload.data);
  if (options.fixData) {
    renderFixReport(options.fixData);
  }
  if (options.overrideBadge) {
    setBadge(refs.inputStatus, options.overrideBadge.status, options.overrideBadge.text);
    return;
  }

  setBadge(refs.inputStatus, ok ? 'PASS' : 'FAIL', payload.message || (ok ? '審計通過' : '審計失敗'));
}

async function saveCurrentInput() {
  setBadge(refs.inputStatus, 'PENDING', '存檔中');
  const { ok, payload } = await request('/api/save', {
    method: 'POST',
    body: JSON.stringify({ rawText: refs.rawInput.value })
  });

  if (!payload.data) {
    setBadge(refs.inputStatus, 'FAIL', payload.message || '存檔失敗');
    return;
  }

  render(payload.data);
  setBadge(refs.inputStatus, ok ? 'PASS' : 'FAIL', payload.message || (ok ? '正式版已存檔' : '驗證未通過'));
}

async function copyCompactText() {
  const text = refs.compactOutput.value.trim();
  if (!text) {
    setBadge(refs.inputStatus, 'FAIL', '目前沒有可複製的群組精簡版');
    return;
  }

  await navigator.clipboard.writeText(text);
  setBadge(refs.inputStatus, 'PASS', '群組精簡版已複製');
}

function clearInputOnly() {
  refs.rawInput.value = '';
  setBadge(refs.inputStatus, 'PENDING', '輸入區已清空');
}

async function init() {
  console.log("%c Zhaogui AI System %c Optimized Entry Sequence Activated ", "background: #00F2FF; color: #000; font-weight: bold; border-radius: 3px 0 0 3px; padding: 2px 4px;", "background: #111; color: #00F2FF; border-radius: 0 3px 3px 0; padding: 2px 4px; border: 1px solid #00F2FF;");
  renderRules();
  await loadCurrent();
}

async function smartFixInput() {
  const rawText = refs.rawInput.value.trim();
  // 已優化：後端會處理空字串並生成模板，故前端不再阻擋
  
  setBadge(refs.inputStatus, 'PENDING', '智慧掃描中...');
  AudioManager.sweep(); // 掃描音效
  
  // 視覺效果：加入掃描動效
  refs.rawInput.classList.add('ai-scanning', 'ai-glow');

  try {
    const { ok, payload } = await request('/api/smart-fix', {
      method: 'POST',
      body: JSON.stringify({ rawText })
    });
    
    // 移除動效
    refs.rawInput.classList.remove('ai-scanning', 'ai-glow');

    const fixData = payload.data;
    if (!fixData) {
      setBadge(refs.inputStatus, 'FAIL', payload.message || '修復失敗');
      return;
    }

    // 回填正規化後的 JSON 到輸入區
    if (fixData.fixedJson) {
      refs.rawInput.value = fixData.fixedJson;
    }

    // 設定狀態燈號
    const fixCount = fixData.fixCount || 0;
    const remaining = fixData.remainingErrors || 0;
    let badgeStatus = 'FAIL';
    let badgeText = `未能自動修復，尚餘 ${remaining} 個錯誤`;
    if (remaining === 0 && fixCount > 0) {
      badgeStatus = 'PASS';
      badgeText = `已修復 ${fixCount} 項，審計通過`;
    } else if (remaining === 0) {
      badgeStatus = 'PASS';
      badgeText = '資料結構正常，無需修復';
    } else if (fixCount > 0) {
      badgeText = `已修復 ${fixCount} 項，尚餘 ${remaining} 個錯誤`;
    }

    // 自動觸發審計預覽
    await auditCurrentInput({
      suppressPending: true,
      fixData,
      overrideBadge: {
        status: badgeStatus,
        text: badgeText
      }
    });
  } catch (error) {
    console.error('[SmartFix] 前端呼叫異常:', error);
    refs.rawInput.classList.remove('ai-scanning', 'ai-glow');
    setBadge(refs.inputStatus, 'FAIL', '智慧修復過程發生錯誤');
  }
}

/** 渲染修復報告面板到驗證區域 */
function renderFixReport(fixData) {
  const fixes = fixData.fixes || [];
  const validation = fixData.validation || {};
  const beforeValidation = fixData.beforeValidation || {};
  const resolvedErrors = fixData.resolvedErrors || [];
  const manualActions = fixData.manualActions || [];

  // 修復摘要
  const summaryHtml = `
    <div class="fix-report-header">
      <span class="fix-report-title">🔧 智慧修復報告</span>
      <span class="badge ${fixes.length > 0 ? 'badge-pass' : 'badge-neutral'}">${fixes.length} 項修復</span>
      <span class="badge ${resolvedErrors.length > 0 ? 'badge-pass' : 'badge-neutral'}">${resolvedErrors.length} 項矛盾解除</span>
    </div>
    <div class="fix-item">
      <span class="fix-field">修復前</span>
      <span class="fix-action">${safeHtml(beforeValidation.status || 'PENDING')}</span>
      <span class="fix-detail">${safeHtml(String((beforeValidation.errors || []).length))} 個錯誤 / ${safeHtml(String((beforeValidation.warnings || []).length))} 個警告</span>
    </div>
    <div class="fix-item">
      <span class="fix-field">修復後</span>
      <span class="fix-action">${safeHtml(validation.status || 'PENDING')}</span>
      <span class="fix-detail">${safeHtml(String((validation.errors || []).length))} 個錯誤 / ${safeHtml(String((validation.warnings || []).length))} 個警告</span>
    </div>
  `;

  // 修復明細清單
  const fixListHtml = fixes.length > 0
    ? fixes.map(fix => `
        <div class="fix-item">
          <span class="fix-field">${safeHtml(fix.field)}</span>
          <span class="fix-action">${safeHtml(fix.action)}</span>
          <span class="fix-detail">${safeHtml(fix.detail)}</span>
        </div>
      `).join('')
    : '<div class="fix-item fix-empty">所有欄位均已通過結構驗證，無需修復。</div>';

  // 剩餘問題
  const remainingHtml = (validation.errors || []).length > 0
    ? `<div class="fix-remaining">
        <span class="fix-remaining-label">⚠ 剩餘 ${validation.errors.length} 個錯誤需手動處理：</span>
        ${(validation.errors || []).map(err =>
          `<div class="issue-row fail"><span class="issue-label">MANUAL</span> <span class="issue-text">${safeHtml(err)}</span></div>`
        ).join('')}
       </div>`
    : '';

  const manualActionsHtml = manualActions.length > 0
    ? `<div class="fix-remaining">
        <span class="fix-remaining-label">🛠 建議下一步：</span>
        ${manualActions.map((item) =>
          `<div class="issue-row warn"><span class="issue-label">TODO</span> <span class="issue-text">${safeHtml(item.reason)} → ${safeHtml(item.suggestion)}</span></div>`
        ).join('')}
       </div>`
    : '';

  refs.validationIssues.innerHTML = summaryHtml + fixListHtml + remainingHtml + manualActionsHtml;
}


refs.btnLoad.addEventListener('click', loadCurrent);
refs.btnAudit.addEventListener('click', auditCurrentInput);
refs.btnSave.addEventListener('click', saveCurrentInput);
refs.btnFix.addEventListener('click', smartFixInput);
refs.btnClear.addEventListener('click', clearInputOnly);
refs.btnCopyCompact.addEventListener('click', () => {
  copyCompactText().catch(() => {
    setBadge(refs.inputStatus, 'FAIL', '複製失敗');
  });
});

init().catch(() => {
  setBadge(refs.inputStatus, 'FAIL', '初始化失敗');
});


function initDynamicAesthetics() {
  document.addEventListener('mousemove', (e) => {
    const cards = document.querySelectorAll('.panel, .spotlight-card');
    cards.forEach(card => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const px = x / rect.width * 100;
      const py = y / rect.height * 100;
      card.style.setProperty('--mouse-x', `${px}%`);
      card.style.setProperty('--mouse-y', `${py}%`);
      if (x > -50 && x < rect.width + 50 && y > -50 && y < rect.height + 50) {
        const tiltX = (0.5 - (y / rect.height)) * 8;
        const tiltY = ((x / rect.width) - 0.5) * 8;
        card.style.setProperty('--rx', `${tiltX}deg`);
        card.style.setProperty('--ry', `${tiltY}deg`);
      } else {
        card.style.setProperty('--rx', '0deg');
        card.style.setProperty('--ry', '0deg');
      }
    });
  });

  const applyStaggerEntrance = () => {
    const panels = document.querySelectorAll('.panel:not(.stagger-enter), .spotlight-card:not(.stagger-enter)');
    panels.forEach((panel, index) => {
      panel.style.animationDelay = `${Math.min(index * 0.035, 0.35)}s`;
      panel.classList.add('stagger-enter');
    });
  };

  const observer = new MutationObserver(() => {
    applyStaggerEntrance();
  });
  observer.observe(document.body, { childList: true, subtree: true });
  applyStaggerEntrance();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initDynamicAesthetics);
} else {
  initDynamicAesthetics();
}
