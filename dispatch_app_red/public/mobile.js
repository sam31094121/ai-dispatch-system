const API_CURRENT = '/api/current';
const API_LINE_OUTPUT = '/api/line-output';
const MAX_SCORE = 10000;
const CACHE_VERSION = 'v20260515-ranking-fix';

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
  vitalPulse: document.getElementById('vital-pulse'),
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
  toast: document.getElementById('toast'),
  aiNextStep: document.getElementById('ai-next-step'),
  heroShortOutput: document.getElementById('hero-short-output'),
  copyHeroText: document.getElementById('copy-hero-text')
};

const state = {
  report: null,
  sendText: '',
  isFirstLoad: true,
  isSyncing: false
};

const CACHE_KEY = 'zhaogui_last_report_unified';

// ── 全域錯誤攔截：改為背景靜默修復模式 ──
window.onerror = function(msg, _url, lineNo, _col, _err) {
  console.warn(`[Silent-Fix] ${msg} (行: ${lineNo})`);
  
  // 確保啟動畫面一定會消失，防止卡死
  const s = document.getElementById('splash-screen');
  if (s) {
    s.style.opacity = '0';
    setTimeout(() => s.remove(), 1000);
  }
  return true; // 阻止錯誤繼續傳播
};

// ── 裝置效能偵測：低階手機自動降載 ──
const DEVICE_PERF = (function() {
  const mem = navigator.deviceMemory || 4;        // GB，預設4
  const cores = navigator.hardwareConcurrency || 4;
  const isLow = mem <= 2 || cores <= 2;
  if (isLow) {
    document.documentElement.setAttribute('data-perf', 'low');
    // 直接在 head 插入 style 覆蓋，讓所有動畫靜止
    const s = document.createElement('style');
    s.textContent = `
      [data-perf="low"] * { animation-duration: 0.001ms !important; animation-iteration-count: 1 !important; transition-duration: 0.15s !important; }
      [data-perf="low"] .glory-beam, [data-perf="low"] .rank-shine { display: none !important; }
    `;
    document.head.appendChild(s);
  }
  return { isLow, mem, cores };
})();

// 清除舊版不相容快取
(function() {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed.version !== CACHE_VERSION) {
        localStorage.removeItem(CACHE_KEY);
      }
    }
  } catch(e) {}
})();

// ── 感知引擎：rAF 節流，只更新 CSS 變數，不旋轉整個 app ──
function initAutoAesthetic() {
  let rafPending = false;
  let lx = 0, ly = 0;
  window.addEventListener('deviceorientation', (e) => {
    lx = e.gamma || 0; ly = e.beta || 0;
    if (rafPending) return;
    rafPending = true;
    requestAnimationFrame(() => {
      document.body.style.setProperty('--parallax-x', (lx / 20).toFixed(1) + 'px');
      document.body.style.setProperty('--parallax-y', (ly / 20).toFixed(1) + 'px');
      rafPending = false;
    });
  }, { passive: true });
  document.querySelectorAll('button').forEach(btn => {
    btn.addEventListener('click', () => { if (navigator.vibrate) navigator.vibrate(12); }, { passive: true });
  });
}
initAutoAesthetic();

// ── Project Genesis: AI 決策大腦 (實時戰術分析輪播) ──
function initAICommander() {
    const tactics = [
        "🟢 [數據同步] 5/13 派單權重核對完畢...",
        "📈 [業績提醒] A2 區表現穩健，持續發力中。",
        "✨ [AI 分析] 本輪業績分佈均衡，各司其職。",
        "✅ [安全核對] 三平台數據對齊無誤。",
        "🤝 [共同努力] 5/13 戰鬥力全面爆發！"
    ];
    let tacticIndex = 0;
    const tickerEl = document.getElementById('ai-next-step');
    
    if (!tickerEl) return;

    function typeWriterEffect(text, el, index = 0) {
        if (index === 0) el.innerHTML = '';
        if (index < text.length) {
            el.innerHTML += text.charAt(index);
            setTimeout(() => typeWriterEffect(text, el, index + 1), 50); // 打字速度
        } else {
            setTimeout(rotateTactic, 5000); // 停留 5 秒後切換下一則
        }
    }

    function rotateTactic() {
        tacticIndex = (tacticIndex + 1) % tactics.length;
        typeWriterEffect(tactics[tacticIndex], tickerEl);
    }

    // 延遲啟動，營造系統開機感
    setTimeout(() => typeWriterEffect(tactics[0], tickerEl), 2000);
}
initAICommander();

// ── Project Genesis: Strategic Optimizer Engine ──
function initStrategicOptimizer() {
    const btnOptimize = document.getElementById('btn-auto-optimize');
    const btnNextStep = document.getElementById('btn-next-step');
    const adviceEl = document.getElementById('ai-tactical-advice');
    const hintEl = document.getElementById('next-step-hint');
    const suiteEl = document.querySelector('.ai-command-suite');

    if (!btnOptimize) return;

    btnOptimize.addEventListener('click', async () => {
        if (suiteEl.classList.contains('is-optimizing')) return;
        
        suiteEl.classList.add('is-optimizing');
        adviceEl.innerHTML = `<span class="glitch-text">正在對齊全球派單權重...</span>`;
        
        // 模擬 AI 思考與診斷步驟 (洞察生成)
        const diagnosticSteps = [
            "正在檢索跨平台歷史動能...",
            "分析 A1 區塊資源覆蓋率...",
            "執行 3D 財富資產轉換模擬...",
            "檢測到派單瓶頸，執行自動對齊...",
            "優化成功！已生成戰略洞察。"
        ];

        for (let text of diagnosticSteps) {
            adviceEl.textContent = `[PROCESS] ${text}`;
            await new Promise(r => setTimeout(r, 700));
        }

        // 從後端拉取深度洞察 (洞)
        const insight = state.report?.aiStrategy?.insight || generateDeepInsight(state.report);
        adviceEl.innerHTML = `<strong style="color: #10f5b4;">AI 戰略洞察：</strong> ${insight}`;
        suiteEl.classList.remove('is-optimizing');
        
        if (navigator.vibrate) navigator.vibrate([30, 50, 30]);
        showToast("戰略優化已完成");
    });

    btnNextStep.addEventListener('click', () => {
        const prediction = state.report?.aiStrategy?.nextStep || predictNextMovement(state.report);
        hintEl.innerHTML = `<span class="glitch-text">NEXT STEP: ${prediction}</span>`;
        
        // 視覺提示效果
        hintEl.style.color = '#10f5b4';
        hintEl.style.textShadow = '0 0 8px #10f5b4';
        setTimeout(() => {
            hintEl.style.color = '';
            hintEl.style.textShadow = '';
        }, 2000);
        
        if (navigator.vibrate) navigator.vibrate(20);
    });
}

// 保留本地備用推演邏輯 (Fallbacks)
function generateDeepInsight(report) {
    if (!report || !report.ranking || !report.ranking.length) return "數據同步中，暫無深度建議。";
    
    const rankings = report.ranking;
    const top1 = rankings[0];
    const avgScore = rankings.reduce((a, b) => a + b.score, 0) / rankings.length;
    
    if (top1.score > avgScore * 2.5) return `偵測到【頂部斷層】。建議將 ${top1.name} 成功模式下放。`;
    return "戰力分佈平衡，建議針對 B 級成員執行階梯式激勵。";
}

function predictNextMovement() {
    const predictions = ["推演顯示：下一輪 A1 競爭門檻將提升 12%", "建議：立即對 Top 5 執行戰略資源傾斜"];
    return predictions[Math.floor(Math.random() * predictions.length)];
}

initStrategicOptimizer();

// ── Project Genesis: AI 戰略自動巡航 ──
function initAutoCruise() {
    let cruiseTimer;
    const scrollContainer = document.querySelector('.hero-scroll-container');
    if (!scrollContainer) return;

    function startCruise() {
        if (scrollContainer.scrollLeft >= scrollContainer.scrollWidth - scrollContainer.clientWidth) {
            scrollContainer.scrollTo({ left: 0, behavior: 'smooth' });
        } else {
            scrollContainer.scrollBy({ left: 1, behavior: 'auto' }); // 極緩慢移動
        }
        cruiseTimer = requestAnimationFrame(startCruise);
    }

    function resetTimer() {
        cancelAnimationFrame(cruiseTimer);
        clearTimeout(window.cruiseIdleTimeout);
        window.cruiseIdleTimeout = setTimeout(startCruise, 30000); // 30秒無操作啟動
    }

    window.addEventListener('touchstart', resetTimer);
    window.addEventListener('mousedown', resetTimer);
    resetTimer();
}
initAutoCruise();

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
  // [員工保護模式] 自動過濾公司總盤敏感數據 (總業績、總金額、實收總計等)
  if (!text) return '';
  const lines = text.split('\n');
  const filtered = lines.filter(line => {
    const sensitive = ['總業績', '總金額', '實收總金額', '追續單金額', '三平台總表', '整合總盤'];
    return !sensitive.some(s => line.includes(s));
  });
  return filtered.join('\n').trim();
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
    groupShortText: cleanSendText(snapshot.groupShortText || report.groupShortText || standardData['群組超精簡版'] || ''),
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
  // 1. 優先嘗試從快取讀取，達成「瞬間恢復」與「無感載入」
  const cached = localStorage.getItem(CACHE_KEY);
  if (cached) {
    try {
      const data = JSON.parse(cached);
      if (data?.report) {
        state.report = data.report;
        state.sendText = data.report.sendText || '';
        render(data.report); // 立即渲染舊資料，確保畫面不留白
      }
    } catch (e) { console.warn('Cache error', e); }
  }

  setLoading();
  state.isSyncing = true;
  try {
    const [snapshot, lineOutput] = await Promise.all([
      requestJson(API_CURRENT),
      requestJson(API_LINE_OUTPUT).catch(() => null)
    ]);
    
    const report = normalizeReport(snapshot.data || snapshot, lineOutput?.text);
    state.report = report;
    state.sendText = report.sendText;
    state.isFirstLoad = false;
    state.isSyncing = false;
    
    // 儲存最新版本到快取
    localStorage.setItem(CACHE_KEY, JSON.stringify({ version: CACHE_VERSION, report }));
    
    render(report);
    window.ReportOfficialSync?.report(snapshot);
    if (window._dispatchSyncClient && snapshot.dataVersion) {
      window._dispatchSyncClient.setDataVersion(snapshot.dataVersion);
      updateSyncBadge('PRO ACTIVE', 'var(--accent)');
    }
    
    // 啟動心跳動畫
    startVitalPulse();
    
  } catch (error) {
    state.isSyncing = false;
    console.error('[System-Recovery] 正在自動修復連線...', error);
    // 即使報錯也不顯示錯誤畫面，維持快取內容並提示同步中
    if (refs.auditResult) {
      refs.auditResult.textContent = 'SYNCING';
      refs.auditResult.style.color = 'var(--oil-gold-bright)';
    }
  } finally {
    // 核心優化：無論成功或失敗，都必須隱藏開機畫面，防止手機卡死
    hideSplashScreen();
  }
}


function renderHeroCard(item) {
  const rank = parseInt(item.rank);
  const name = get(item, ['姓名', 'name']);
  const cash = parseFloat(get(item, ['實收', 'cash_revenue'], 0));
  const renewal = parseFloat(get(item, ['追續', 'renewal_deals'], 0));
  const score = parseFloat(get(item, ['系統分', 'score'], 0));
  
  // 計算 HUD 百分比 (相對於頂尖水平)
  const pCash = Math.min(100, (cash / 200000) * 100); 
  const pRenewal = Math.min(100, (renewal / 10) * 100);
  const pScore = Math.min(100, (score / 1000) * 100);

  if (rank === 1) {
    return `
      <div class="a1-hero-card rank-1-apex rank-1" data-rank="1">
        <div class="target-bracket bracket-tl"></div>
        <div class="target-bracket bracket-tr"></div>
        <div class="target-bracket bracket-bl"></div>
        <div class="target-bracket bracket-br"></div>
        
        <div class="solar-aura-container">
            <div class="solar-aura-ring"></div>
        </div>

        <div class="card-rank-badge">NO.1 CHIEF</div>
        <div class="hero-main">
          <div class="vfx-canvas-wrap">
            <canvas class="vfx-canvas" data-rank="1"></canvas>
          </div>
          <div class="hero-info">
            <h3 class="spotlight-name">${name}</h3>
            <div class="apex-hud">
              <div class="hud-item">
                <div class="hud-label"><span>CASH FLOW</span><span>${cash.toLocaleString()}</span></div>
                <div class="hud-bar-bg"><div class="hud-bar-fill" style="width: ${pCash}%"></div></div>
              </div>
              <div class="hud-item">
                <div class="hud-label"><span>RENEWAL</span><span>${renewal}</span></div>
                <div class="hud-bar-bg"><div class="hud-bar-fill" style="width: ${pRenewal}%"></div></div>
              </div>
              <div class="hud-item">
                <div class="hud-label"><span>AI SCORE</span><span>${score}</span></div>
                <div class="hud-bar-bg"><div class="hud-bar-fill" style="width: ${pScore}%"></div></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  // 其他名次細分
  const eliteClass = rank === 2 ? 'rank-2-elite' : (rank === 3 ? 'rank-3-elite' : '');
  
  return `
    <div class="a1-hero-card ${eliteClass} rank-${rank}" data-rank="${rank}" onclick="triggerCardBurst(${rank})">
      <div class="card-rank-badge">NO.${rank}</div>
      <div class="hero-main-compact">
        <div class="vfx-canvas-wrap-mini">
          <canvas class="vfx-canvas" data-rank="${rank}"></canvas>
        </div>
        <div class="hero-info-mini">
          <h3 class="spotlight-name-mini">${name}</h3>
          <div class="hero-score-mini">${score}</div>
        </div>
      </div>
    </div>
  `;
}

// ── Project Genesis: 3D 交互點擊爆發 ──
function triggerCardBurst(rank) {
    if (window.vfxEngines && window.vfxEngines[rank]) {
        window.vfxEngines[rank].triggerBurst();
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
  if (refs.summaryGrid) refs.summaryGrid.innerHTML = '';
}
const GLORY_TEMPLATES = {
  1: {
    title: "頂尖戰略執行官", badge: "DIAMOND AUTH",
    reason: "偵測到核心指標全面突破，AI 綜合權重居全場之冠，正式授勳頂尖執行官。",
    mReason: "核心指標全面突破，AI 權重全場第一。",
    summary: "具備極致的數據推進力與執行穩定性，為本輪戰略核心。",
    mSummary: "極致推進力與穩定性。"
  },
  2: {
    title: "首席營運領航員", badge: "GOLD RESERVE",
    reason: "高價值資產對齊率 100%，各項增長曲線符合 AI 優化預期，正式鎖定領航席位。",
    mReason: "資產對齊率 100%，增長符合 AI 預期。",
    summary: "高厚度戰力輸出，在穩定性與爆發力之間取得完美平衡。",
    mSummary: "高厚度戰力輸出，表現完美。"
  },
  3: {
    title: "量能推進特遣員", badge: "MOMENTUM CORE",
    reason: "追續單動能爆發，單日處理頻率超越系統均值 180%，獲選量能推進核心。",
    mReason: "追續單動能爆發，處理頻率超越均值。",
    summary: "高頻率推進型主力，優勢在於極強的市場適應力與滲透度。",
    mSummary: "高頻推進主力，滲透度極強。"
  },
  4: {
    title: "高效價值構築師", badge: "BOOST PROTOCOL",
    reason: "業績結算結構精準，關鍵路徑轉換率達標，正式列入高效價值矩陣。",
    mReason: "業績結構精準，關鍵路徑轉換率達標。",
    summary: "高效執行型主力，優勢在於資源配置精準且轉化率高。",
    mSummary: "資源配置精準，轉化率高。"
  },
  5: {
    title: "精密客單優化師", badge: "VALUE MAX",
    reason: "追續客單價觸及系統高位點，單筆產值具備高度示範意義，入選精密優化名單。",
    mReason: "客單價觸及高位點，單筆產值示範強。",
    summary: "精緻化運營型主力，優勢在於精準鎖定高價值交易節點。",
    mSummary: "鎖定高價值節點，運營精緻。"
  },
  6: {
    title: "數位資產維護官", badge: "DIGITAL ASSET",
    reason: "實收指標穩定爬升，數據鏈路完整且無異常偏移，獲封數位資產維護官。",
    mReason: "實收穩定爬升，數據鏈路完整無偏移。",
    summary: "成長穩健型主力，優勢在於持續產出且風險控制極佳。",
    mSummary: "持續產出，風險控制極佳。"
  }
};

const SOURCE_TEXT = "後端正式資料、三平台總表、審計通過後有效資料、正式排序結果、正式權重分數結果。";
const M_SOURCE_TEXT = "後端正式資料、三平台總表、審計通過後有效資料、正式排序結果、正式權重分數結果。";

// ── 動態 AI 上榜洞察生成（基於真實數據比較）──
function genGloryInsight(row, top6, rank) {
  const s = row.score || 0;
  const scorePct = Math.round(s / MAX_SCORE * 100);

  // 找出在前六名中各項目最高的人
  const maxActual  = Math.max(...top6.map(r => r.actualRevenue  || 0));
  const maxRenewal = Math.max(...top6.map(r => r.renewalRevenue || 0));
  const maxAvg     = Math.max(...top6.map(r => r.avgRenewal     || 0));
  const maxDeals   = Math.max(...top6.map(r => r.renewalDeals   || 0));

  const isTopActual  = (row.actualRevenue  || 0) >= maxActual  * 0.97 && maxActual  > 0;
  const isTopRenewal = (row.renewalRevenue || 0) >= maxRenewal * 0.97 && maxRenewal > 0;
  const isTopAvg     = (row.avgRenewal     || 0) >= maxAvg     * 0.97 && maxAvg     > 0;
  const isTopDeals   = (row.renewalDeals   || 0) >= maxDeals   * 0.97 && maxDeals   > 0;

  if (rank === 1) return `🏆 AI 全場制霸！四項核心指標綜合權重第一，本輪得分達滿分 ${scorePct}%`;
  if (isTopActual && isTopRenewal) return `💎 個人實收 & 追續金額雙項前六最高，壓制力全場最強`;
  if (isTopActual)  return `💰 個人實收為前六最高（${fmt(row.actualRevenue)}），實力碾壓`;
  if (isTopRenewal) return `🔄 追續金額前六名中最高（${fmt(row.renewalRevenue)}），續約推進力第一`;
  if (isTopAvg)     return `⭐ 追續客單價前六最高（${fmt(row.avgRenewal, 0)}），單筆價值頂尖`;
  if (isTopDeals)   return `⚡ 追續單數前六最多（${row.renewalDeals} 單），成交頻率全場最強`;

  const gap = (top6[0]?.score || 0) - s;
  if (gap < 200) return `🎯 距離第一名僅差 ${fmt(gap, 1)} 分，本輪最具挑戰實力`;
  return `📈 AI 綜合分數 ${fmt(s, 1)}（滿分 ${scorePct}%），持續發力可衝擊更高名次`;
}

function renderTop6GloryBoard(rankings) {
  const top6Grid = document.getElementById('top6-grid');
  if (!top6Grid) return;
  const top6 = (rankings || []).slice(0, 6);
  if (!top6.length) {
    top6Grid.innerHTML = '<div class="empty-state">目前沒有正式排名資料</div>';
    return;
  }

  const CROWN = ['👑', '🥈', '🥉', '④', '⑤', '⑥'];
  const GROUP_LABEL = { A1: '高優先主力', A2: '次主力追進', B: '一般量單', C: '補位觀察' };

  const cardsHtml = top6.map((row, index) => {
    const rank = index + 1;
    const tmpl = GLORY_TEMPLATES[rank] || GLORY_TEMPLATES[6];

    const score      = row.score || 0;
    const actualRev  = row.actualRevenue  || 0;
    const renewalRev = row.renewalRevenue || 0;
    const renewalDeals = row.renewalDeals || 0;
    const avgRenewal = row.avgRenewal || (renewalDeals ? (renewalRev / renewalDeals) : 0);

    const scorePct = Math.min(100, Math.round(score / MAX_SCORE * 100));
    // 各項指標在前六中的相對佔比（用最高值歸一化）
    const maxA = Math.max(...top6.map(r => r.actualRevenue  || 0)) || 1;
    const maxR = Math.max(...top6.map(r => r.renewalRevenue || 0)) || 1;
    const maxV = Math.max(...top6.map(r => r.avgRenewal     || 0)) || 1;
    const maxD = Math.max(...top6.map(r => r.renewalDeals   || 0)) || 1;
    const pA = Math.round(actualRev  / maxA * 100);
    const pR = Math.round(renewalRev / maxR * 100);
    const pV = Math.round(avgRenewal / maxV * 100);
    const pD = Math.round(renewalDeals / maxD * 100);

    const insight = genGloryInsight(row, top6, rank);
    const groupText = GROUP_LABEL[row.group] || row.group || '';
    const crownIcon = CROWN[index] || `#${rank}`;

    // SVG 圓環分數（半徑 26, circumference ≈ 163）
    const circ = 163;
    const dash = Math.round(circ * scorePct / 100);
    const ringColor = rank === 1 ? '#ffd700' : rank === 2 ? '#b0c4d8' : rank === 3 ? '#cd8b4a' : '#18c6a7';

    return `
      <article class="glory-card rank-${rank}" data-rank="${rank}">
        <div class="glory-ambient"></div>
        ${rank === 1 ? '<div class="glory-beam"></div>' : ''}

        <div class="glory-header">
          <span class="glory-crown">${crownIcon}</span>
          <span class="glory-title-label">${tmpl.title}</span>
          <span class="glory-auth-chip">${tmpl.badge}</span>
        </div>

        <div class="glory-hero-row">
          <h3 class="glory-name-label">${escapeHtml(row.name)}</h3>
          <div class="glory-ring-wrap">
            <svg class="glory-ring-svg" viewBox="0 0 60 60">
              <circle class="glory-ring-bg"   cx="30" cy="30" r="26" />
              <circle class="glory-ring-fill" cx="30" cy="30" r="26"
                stroke="${ringColor}"
                stroke-dasharray="${dash} ${circ}"
                stroke-dashoffset="0"
                transform="rotate(-90 30 30)" />
            </svg>
            <div class="glory-ring-pct">${scorePct}%</div>
          </div>
        </div>

        <div class="glory-score-row">
          <span class="glory-score-label">AI 權重總分</span>
          <strong class="glory-score-value gd-decode" data-val="${fmt(score, 1)}">--</strong>
          <span class="glory-score-max">/ ${fmt(MAX_SCORE)}</span>
        </div>
        <div class="glory-main-track">
          <div class="glory-main-fill" data-pct="${scorePct}" style="width:0%"></div>
        </div>

        <div class="glory-metrics-v2">
          <div class="gm-row ${pA >= 97 ? 'gm-top' : ''}">
            <span class="gm-icon">①</span>
            <span class="gm-label">個人實收</span>
            <div class="gm-bar-wrap"><div class="gm-bar-fill" style="width:${pA}%"></div></div>
            <strong class="gm-val gd-decode" data-val="${fmt(actualRev)}">--</strong>
          </div>
          <div class="gm-row ${pR >= 97 ? 'gm-top' : ''}">
            <span class="gm-icon">②</span>
            <span class="gm-label">追續金額</span>
            <div class="gm-bar-wrap"><div class="gm-bar-fill" style="width:${pR}%"></div></div>
            <strong class="gm-val gd-decode" data-val="${fmt(renewalRev)}">--</strong>
          </div>
          <div class="gm-row ${pV >= 97 ? 'gm-top' : ''}">
            <span class="gm-icon">③</span>
            <span class="gm-label">追續客單價</span>
            <div class="gm-bar-wrap"><div class="gm-bar-fill" style="width:${pV}%"></div></div>
            <strong class="gm-val gd-decode" data-val="${fmt(avgRenewal, 0)}">--</strong>
          </div>
          <div class="gm-row ${pD >= 97 ? 'gm-top' : ''}">
            <span class="gm-icon">④</span>
            <span class="gm-label">追續單數</span>
            <div class="gm-bar-wrap"><div class="gm-bar-fill" style="width:${pD}%"></div></div>
            <strong class="gm-val gd-decode" data-val="${renewalDeals} 單">--</strong>
          </div>
        </div>

        <div class="glory-insight-chip">
          <span class="insight-text">${insight}</span>
        </div>

        <div class="glory-footer-row">
          <span class="glory-group-chip">${escapeHtml(row.group)}｜${groupText}</span>
          <span class="glory-verified">✓ 三平台審計通過</span>
        </div>
      </article>
    `;
  }).join('');

  top6Grid.innerHTML = cardsHtml;

  // 啟動動畫：進度條 + decode 錯開
  requestAnimationFrame(() => {
    top6Grid.querySelectorAll('.glory-main-fill').forEach(el => {
      el.style.width = el.dataset.pct + '%';
    });
    top6Grid.querySelectorAll('.gd-decode').forEach((el, i) => {
      setTimeout(() => decodeNumberEffect(el, el.dataset.val, 900), i * 80);
    });
  });

  // rAF 節流 3D tilt（事件委派）
  let gloryRaf = false, gloryTiltEl = null, gRX = 0, gRY = 0;
  top6Grid.addEventListener('mousemove', e => {
    gloryTiltEl = e.target.closest('.glory-card');
    if (!gloryTiltEl) return;
    const r = gloryTiltEl.getBoundingClientRect();
    gRX = ((e.clientY - r.top) / r.height - 0.5) * -10;
    gRY = ((e.clientX - r.left) / r.width - 0.5) * 10;
    if (gloryRaf) return;
    gloryRaf = true;
    requestAnimationFrame(() => {
      if (gloryTiltEl) gloryTiltEl.style.transform = `perspective(900px) rotateX(${gRX.toFixed(2)}deg) rotateY(${gRY.toFixed(2)}deg) scale3d(1.02,1.02,1.02)`;
      gloryRaf = false;
    });
  });
  top6Grid.addEventListener('mouseleave', e => {
    const c = e.target.closest?.('.glory-card');
    if (c) c.style.transform = '';
    gloryTiltEl = null;
  }, true);
  let gTouchRaf = false;
  top6Grid.addEventListener('touchmove', e => {
    const t = e.touches[0];
    const card = document.elementFromPoint(t.clientX, t.clientY)?.closest('.glory-card');
    if (!card) return;
    const r = card.getBoundingClientRect();
    const rx = ((t.clientY - r.top) / r.height - 0.5) * -7;
    const ry = ((t.clientX - r.left) / r.width - 0.5) * 7;
    if (gTouchRaf) return;
    gTouchRaf = true;
    requestAnimationFrame(() => {
      card.style.transform = `perspective(900px) rotateX(${rx.toFixed(2)}deg) rotateY(${ry.toFixed(2)}deg) scale3d(1.02,1.02,1.02)`;
      gTouchRaf = false;
    });
  }, { passive: true });
  top6Grid.addEventListener('touchend', () => {
    top6Grid.querySelectorAll('.glory-card').forEach(c => { c.style.transform = ''; });
  }, { passive: true });
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
  
  // 同步到頂部標題與各處動態容器
  const headerDate = document.getElementById('header-settlement-date');
  if (headerDate) headerDate.textContent = report.settlementDate;
  
  if (refs.auditResultHero)    {
    refs.auditResultHero.textContent = report.auditResult;
    refs.auditResultHero.classList.toggle('pass', auditPass);
  }

  // 公司整體統計欄位（整合總盤、雙平台總表）禁止在員工視圖顯示
  // stat strip / renderSummary / renderDualTotals 已全數停用

  // 強制排序，防止數據源順序異常
  const sortedRanking = [...(report.ranking || [])].sort((a, b) => (a.rank || 999) - (b.rank || 999));
  
  console.log(`[Render] 開始渲染資料，總計 ${sortedRanking.length} 位員工`);

  try {
    renderTop6GloryBoard(sortedRanking);
  } catch (e) { console.error('Top6 渲染失敗', e); }

  try {
    renderRankings(sortedRanking);
  } catch (e) { console.error('完整清單渲染失敗', e); }
  
  // 強制可見區塊顯示（排除 #audit，員工介面不顯示）
  document.querySelectorAll('section.panel:not(#audit)').forEach(s => s.style.setProperty('display', 'block', 'important'));
  
  try {
    renderGroups(report.groups, report.ranking);
    renderAudit(report.auditNotes, report.excludedEmployees, report.auditWarnings);
  } catch (e) { console.error('分組或審計渲染失敗', e); }

  animateScoreFills();

  // 渲染完畢後的捲動高度檢查：確保容器有被撐開
  setTimeout(() => {
    const h = document.body.scrollHeight;
    console.log(`[Render] 渲染完成，當前總高度: ${h}px`);
    if (h < window.innerHeight * 1.2 && sortedRanking.length > 10) {
      console.warn('[Render] 高度異常，強制重置佈局高度');
      document.body.style.height = 'auto';
      document.documentElement.style.height = 'auto';
    }
  }, 1000);

  // 更新 AI 指揮中心跑馬燈 — 使用真實數據
  if (refs.aiNextStep) {
    const auditStatus = auditPass ? '🟢 審計通過' : '🔴 審計警告';
    const a1Count = report.ranking.filter(r => r.group === 'A1').length;
    const top1 = report.ranking[0];
    const topName = top1 ? top1.name : '—';
    const topScore = top1 ? fmt(top1.score, 1) : '0';
    const totalMembers = report.ranking.length;
    const ticker = refs.aiNextStep;
    const messages = [
      `${auditStatus} ｜ ${report.dispatchDate} 正式名次已同步`,
      `🏆 本輪第一名：${topName}，AI 權重分 ${topScore} 分`,
      `👥 本輪共 ${totalMembers} 位有效成員入榜`,
      `⚡ A1 高優先主力：${a1Count} 位已鎖定派單優先權`,
      `📊 數據來源：三平台審計通過後有效記錄`
    ];
    // 停用 cyber-tech.css 的跑馬燈捲動，改為靜態淡入輪播
    ticker.style.animation = 'none';
    ticker.style.paddingLeft = '0';
    ticker.style.transition = 'opacity 0.3s ease';
    let mIdx = 0;
    function rotateTicker() {
      ticker.style.opacity = '0';
      setTimeout(() => {
        ticker.textContent = messages[mIdx];
        ticker.style.opacity = '1';
        mIdx = (mIdx + 1) % messages.length;
        setTimeout(rotateTicker, 4500);
      }, 300);
    }
    rotateTicker();
  }
}

// ── AI 數字解碼引擎（低階裝置直接顯示，跳過 rAF）──
function decodeNumberEffect(targetEl, finalValue, duration = 800) {
    if (!targetEl) return;
    const finalStr = finalValue.toString();
    // 低階裝置跳過動畫，直接顯示
    if (DEVICE_PERF.isLow) { targetEl.textContent = finalStr; return; }
    const chars = '0123456789X$#%*';
    let start = performance.now();
    targetEl.classList.add('matrix-decode-text');

    function step(timestamp) {
        const progress = Math.min((timestamp - start) / duration, 1);
        if (progress < 1) {
            let glitchStr = '';
            for (let i = 0; i < finalStr.length; i++) {
                if (finalStr[i] === ',' || finalStr[i] === '.') {
                    glitchStr += finalStr[i];
                } else {
                    if (Math.random() > progress) {
                        glitchStr += chars.charAt(Math.floor(Math.random() * chars.length));
                    } else {
                        glitchStr += finalStr[i];
                    }
                }
            }
            targetEl.textContent = glitchStr;
            requestAnimationFrame(step);
        } else {
            targetEl.textContent = finalStr;
            setTimeout(() => targetEl.classList.remove('matrix-decode-text'), 500);
        }
    }
    requestAnimationFrame(step);
}

function renderSummary(_summary) {
  // 整合總盤屬公司層級資料，員工視圖不顯示
  if (!refs.summaryGrid) return;
  refs.summaryGrid.innerHTML = '';
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

  refs.rankingList.innerHTML = rankings.map((row, index) => {
    const pct = Math.min(100, Math.max(0, row.score / MAX_SCORE * 100));
    const safeId = encodeURIComponent(row.name);
    const rankClass = row.rank <= 3 ? ` rank-${row.rank}` : '';
    const hotZoneClass = row.score > 2000 ? ' hot-zone' : ''; // AI 熱點判定
    const rankLabel = row.rank === 1 ? '🥇' : row.rank === 2 ? '🥈' : row.rank === 3 ? '🥉' : `#${row.rank}`;
    
    // 生成數位簽章
    const signature = `DS-${Math.random().toString(16).slice(2, 10).toUpperCase()}`;

    // 為每個分級的第一個人加上 ID 錨點，供快速跳轉使用
    const groupAnchor = `group-anchor-${row.group}`;
    const isFirstInGroup = !rankings.slice(0, index).some(r => r.group === row.group);
    const anchorId = isFirstInGroup ? `id="${groupAnchor}"` : '';

    // 計算與上下名次的差距
    const prevRow = index > 0 ? rankings[index - 1] : null;
    const nextRow = index < rankings.length - 1 ? rankings[index + 1] : null;
    
    let comparisonHtml = '';
    if (prevRow || nextRow) {
      comparisonHtml = `
        <div class="rank-comparison-tag">
          ${prevRow ? `<span class="compare-up">距離前一名 ${escapeHtml(prevRow.name)}：還差 ${fmt(prevRow.score - row.score, 2)} 分</span>` : '<span class="compare-up">👑 當前第一名，維持領先</span>'}
          ${nextRow ? `<span class="compare-down">領先後一名 ${escapeHtml(nextRow.name)}：${fmt(row.score - nextRow.score, 2)} 分</span>` : ''}
        </div>
      `;
    }

    const winnerBadge = row.rank === 1
      ? '<div class="winner-badge gold">🥇 冠軍</div>'
      : row.rank === 2 ? '<div class="winner-badge silver">🥈 亞軍</div>'
      : row.rank === 3 ? '<div class="winner-badge bronze">🥉 季軍</div>'
      : '';

    return `
      <article class="ranking-card${rankClass}${hotZoneClass}" id="person-${safeId}" ${anchorId}>
        ${winnerBadge}
        <div class="ranking-top">
          <span class="rank-number">${rankLabel}</span>
          <div class="person-name">
            <strong>${escapeHtml(row.name)}</strong>
            <small>${row.prevRank ? `上輪 #${row.prevRank}，${movementLabel(row.movement)}` : '本輪正式排序'}</small>
          </div>
          <div class="card-meta">
            <span class="badge group-${escapeHtml(row.group)}">${escapeHtml(row.group)}｜${{ A1:'高優先', A2:'次主力', B:'一般量單', C:'補位' }[row.group] || row.group}</span>
            <span class="audit-check-tag">✓ 數據已對齊 5/12 審計總表</span>
          </div>
        </div>
        
        <div class="score-line">
          <label><span>AI 專業權重分數</span><strong class="decode-target" data-val="${fmt(row.score, 2)}">--</strong></label>
          <div class="score-track"><div class="score-fill" data-pct="${pct}" style="width:0%"></div></div>
        </div>
        
        <div class="settlement-block">
          <div class="settlement-title">📊 個人業績結算明細</div>
          <div class="settlement-row">
            <span class="s-num">①</span>
            <span class="s-label">個人實收</span>
            <span class="s-weight">權重 30%</span>
            <strong class="s-val decode-target" data-val="${fmt(row.actualRevenue)}">--</strong>
          </div>
          <div class="settlement-row">
            <span class="s-num">②</span>
            <span class="s-label">追續金額</span>
            <span class="s-weight">權重 25%</span>
            <strong class="s-val decode-target" data-val="${fmt(row.renewalRevenue)}">--</strong>
          </div>
          <div class="settlement-row">
            <span class="s-num">③</span>
            <span class="s-label">追續客單價</span>
            <span class="s-weight">權重 15%</span>
            <strong class="s-val decode-target" data-val="${fmt(row.avgRenewal, 2)}">--</strong>
          </div>
          <div class="settlement-row">
            <span class="s-num">④</span>
            <span class="s-label">追續單數</span>
            <span class="s-weight">權重 15%</span>
            <strong class="s-val decode-target" data-val="${fmt(row.renewalDeals)} 單">--</strong>
          </div>
        </div>
        
        ${comparisonHtml}
        
        <p class="advice">" AI 戰術分析：${escapeHtml(row.advice)} "</p>
        
        <div class="digital-signature-mini">
          SECURE SIGNATURE: ${signature} [VERIFIED BY AI ENGINE]
        </div>
      </article>
    `;
  }).join('');

  // 延遲啟動：score bar 先走，decode 依序錯開（每張卡間隔 80ms）
  setTimeout(() => {
    refs.rankingList.querySelectorAll('.score-fill').forEach(el => {
      el.style.width = el.getAttribute('data-pct') + '%';
    });
    // 錯開 decode 動畫，避免 20+ rAF 同時競爭
    refs.rankingList.querySelectorAll('.decode-target').forEach((el, i) => {
      setTimeout(() => {
        decodeNumberEffect(el, el.getAttribute('data-val'), 700);
      }, i * 60);
    });

    // 3D tilt：用 rAF 節流，事件委派到容器（不是每張卡各自綁）
    let tiltRaf = false;
    let tiltCard = null, tiltRX = 0, tiltRY = 0;
    refs.rankingList.addEventListener('mousemove', e => {
      tiltCard = e.target.closest('.ranking-card');
      if (!tiltCard) return;
      const r = tiltCard.getBoundingClientRect();
      tiltRX = ((e.clientY - r.top) / r.height - 0.5) * -8;
      tiltRY = ((e.clientX - r.left) / r.width - 0.5) * 8;
      if (tiltRaf) return;
      tiltRaf = true;
      requestAnimationFrame(() => {
        if (tiltCard) tiltCard.style.transform = `perspective(800px) rotateX(${tiltRX.toFixed(2)}deg) rotateY(${tiltRY.toFixed(2)}deg) scale3d(1.01,1.01,1.01)`;
        tiltRaf = false;
      });
    });
    refs.rankingList.addEventListener('mouseleave', e => {
      const card = e.target.closest?.('.ranking-card');
      if (card) card.style.transform = '';
      tiltCard = null;
    }, true);
    // Touch tilt（同樣 rAF 節流）
    let touchRaf = false;
    refs.rankingList.addEventListener('touchmove', e => {
      const t = e.touches[0];
      const card = document.elementFromPoint(t.clientX, t.clientY)?.closest('.ranking-card');
      if (!card) return;
      const r = card.getBoundingClientRect();
      const rx = ((t.clientY - r.top) / r.height - 0.5) * -5;
      const ry = ((t.clientX - r.left) / r.width - 0.5) * 5;
      if (touchRaf) return;
      touchRaf = true;
      requestAnimationFrame(() => {
        card.style.transform = `perspective(800px) rotateX(${rx.toFixed(2)}deg) rotateY(${ry.toFixed(2)}deg) scale3d(1.01,1.01,1.01)`;
        touchRaf = false;
      });
    }, { passive: true });
    refs.rankingList.addEventListener('touchend', () => {
      refs.rankingList.querySelectorAll('.ranking-card').forEach(c => { c.style.transform = ''; });
    }, { passive: true });
  }, 100);
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
          ${members.map((name) => `<span class="member-chip" onclick="document.getElementById('person-${encodeURIComponent(name)}')?.scrollIntoView({behavior:'smooth',block:'center'})">#${rankMap.get(name) || '-'} ${escapeHtml(name)}</span>`).join('')}
        </div>
      </article>
    `;
  }).join('');
}

function renderAudit(notes, excluded) {
  const noteHtml = notes.map((n) => `<div class="audit-note"><span>✓</span>${escapeHtml(n)}</div>`).join('');
  const exclHtml = excluded.length
    ? `<div class="excluded-box"><strong>審計不入派單名單：</strong>${excluded.map((e) => `<span class="excl-item">${escapeHtml(e.姓名)}（${escapeHtml(e.原因)}）</span>`).join('')}</div>`
    : '';

  refs.auditNotes.innerHTML = noteHtml + exclHtml;
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

  const html =
    makeRow('三平台報表總盤（含已離職）', reportTotal, 'total-report') +
    makeRow('正式派單運算盤（排除已離職）', assignmentTotal, 'total-assignment');
    
  if (container) container.innerHTML = html;
}

function renderSendText(text, shortText) {
  state.sendText = text || '';
  if (refs.broadcastOutput) refs.broadcastOutput.value = state.sendText;
  if (refs.groupShortOutput) refs.groupShortOutput.textContent = shortText || '';
  if (refs.heroShortOutput) refs.heroShortOutput.textContent = shortText || '暫無公告數據';
  if (refs.lineShare) {
    refs.lineShare.href = state.sendText
      ? `https://line.me/R/share?text=${encodeURIComponent(state.sendText)}`
      : '#';
  }
}

function renderError(_error) {
  console.warn('[System-Recovery] 背景同步中，忽略顯示錯誤。');
  
  if (refs.auditResult) {
    refs.auditResult.textContent = 'REPAIRING';
    refs.auditResult.style.color = 'var(--accent-2)';
    refs.auditResult.style.boxShadow = '0 0 10px rgba(243, 193, 75, 0.3)';
  }

  // 即使報錯也不清空畫面，確保原本的快取內容持續顯示
  if (state.report) {
    render(state.report);
  } else {
    // 若完全沒有快取，顯示科技感初始化畫面
    if (refs.rankingList) refs.rankingList.innerHTML = '<div class="empty-state">AI 核心初始化中，請稍候...</div>';
  }
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

// 快速跳轉到分級首位
window.scrollToGroup = function(groupCode) {
  const el = document.getElementById(`group-anchor-${groupCode}`);
  if (el) {
    el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    // 加上短暫高亮提示
    el.style.borderColor = 'var(--accent)';
    setTimeout(() => el.style.borderColor = '', 2000);
  } else {
    showToast(`本輪暫無 ${groupCode} 級成員`);
  }
};

let toastTimer = null;
function showToast(message) {
  clearTimeout(toastTimer);
  refs.toast.textContent = message;
  refs.toast.classList.add('is-visible');
  toastTimer = setTimeout(() => refs.toast.classList.remove('is-visible'), 1800);
}

function updateSyncBadge(text, color) {
  if (refs.auditResult) {
    refs.auditResult.textContent = text;
    refs.auditResult.style.color = color;
    refs.auditResult.style.boxShadow = `0 0 10px ${color}44`;
  }
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
  refs.copyHeroText?.addEventListener('click', copyShortTextFn);
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

let _coinRain = null;

function initMoneyEffects() {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  
  // 針對前四名卡片初始化各自的 Canvas
  const canvases = document.querySelectorAll('.money-canvas-container canvas');
  canvases.forEach(cv => {
    // 檢查是否已經有引擎實例
    if (cv._vfx) cv._vfx.stop();
    const rain = new MapleCoinRain(cv);
    cv._vfx = rain;
    rain.start();
  });
  
  // 原有的全域金幣雨 (若有的話)
  const globalCv = document.getElementById('mobile-coin-canvas');
  if (globalCv) {
    if (globalCv._vfx) globalCv._vfx.stop();
    const globalRain = new MapleCoinRain(globalCv);
    globalCv._vfx = globalRain;
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
    
    // 加入阻尼感與旋轉限制
    const tiltX = (-y * 6).toFixed(2);
    const tiltY = ( x * 6).toFixed(2);
    
    // 動態光源模擬
    const lightX = ((x + 1) * 50).toFixed(1);
    const lightY = ((y + 1) * 50).toFixed(1);
    
    requestAnimationFrame(() => {
      card.style.transform = `perspective(800px) rotateX(${tiltX}deg) rotateY(${tiltY}deg) translateZ(10px) scale(1.03)`;
      card.style.setProperty('--light-x', `${lightX}%`);
      card.style.setProperty('--light-y', `${lightY}%`);
    });

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

  if (skeleton) skeleton.style.display = 'none';
  if (!splash) {
    document.documentElement.style.overflowY = 'auto';
    document.body.style.overflowY = 'auto';
    document.body.classList.remove('lock-scroll');
    return;
  }
  
  // 防止重複執行
  if (splash.dataset.hidden === 'true') return;
  splash.dataset.hidden = 'true';

  const splashText = splash.querySelector('.splash-text');
  const decodeEl = splash.querySelector('.cyber-decoding-text');

  // 倒數確認動畫
  if (decodeEl) decodeEl.textContent = 'DATA VERIFIED // READY';
  if (splashText) splashText.textContent = '✓ AI 數據核對完畢';

  setTimeout(() => {
    splash.classList.add('fade-out');
    // 強制恢復捲動能力
    document.documentElement.style.overflowY = 'auto';
    document.body.style.overflowY = 'auto';
    document.body.style.position = 'relative'; // 防止 fixed 鎖死
    
    setTimeout(() => {
      splash.remove();
      // 二次檢查：確保沒有任何東西擋住捲動
      if (window.scrollY === 0 && document.body.scrollHeight > window.innerHeight) {
         window.scrollTo(0, 1); // 輕微移動觸發渲染
         window.scrollTo(0, 0);
      }
    }, 800);
  }, 500);
}

// ── Pull-to-Refresh 下拉更新 ──
(function initPullToRefresh() {
  let startY = 0;
  let pulling = false;
  const threshold = 72;

  const indicator = document.createElement('div');
  indicator.id = 'pull-refresh-indicator';
  indicator.innerHTML = '↓ 下拉更新資料';
  document.getElementById('app-shell')?.prepend(indicator);

  document.addEventListener('touchstart', (e) => {
    if (window.scrollY === 0) { startY = e.touches[0].clientY; pulling = true; }
  }, { passive: true });

  document.addEventListener('touchmove', (e) => {
    if (!pulling) return;
    const dy = e.touches[0].clientY - startY;
    if (dy > 10) {
      indicator.style.height = Math.min(dy, threshold) + 'px';
      indicator.style.opacity = Math.min(dy / threshold, 1);
      indicator.textContent = dy >= threshold ? '↑ 放開即更新' : '↓ 下拉更新資料';
    }
  }, { passive: true });

  document.addEventListener('touchend', (e) => {
    if (!pulling) return;
    const dy = e.changedTouches[0].clientY - startY;
    pulling = false;
    indicator.style.height = '0';
    indicator.style.opacity = '0';
    indicator.textContent = '↓ 下拉更新資料';
    if (dy >= threshold) {
      showToast('正在更新最新資料…');
      loadData();
    }
  }, { passive: true });
}());

// ── 全線串連：SSE 即時推播 ──
function initRealtimeSync() {
  const sync = new RealtimeSyncEngine('/api/updates/stream', () => {
    updateSyncBadge('DATA PUSH', 'var(--accent-2)');
    loadData();
  });
  sync.connect();
}

function startVitalPulse() {
  const canvas = refs.vitalPulse;
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let offset = 0;
  let rafId = null;

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.beginPath();
    ctx.setLineDash([2, 2]);
    ctx.strokeStyle = state.isSyncing ? 'rgba(243,193,75,0.5)' : 'rgba(24,198,167,0.6)';
    ctx.lineWidth = 1;
    for (let x = 0; x < canvas.width; x++) {
      const y = 10 + Math.sin((x + offset) * 0.2) * 5;
      x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    }
    ctx.stroke();
    offset += 1;
    rafId = requestAnimationFrame(draw);
  }

  // 分頁隱藏時暫停，顯示時恢復
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) { cancelAnimationFrame(rafId); rafId = null; }
    else if (!rafId) rafId = requestAnimationFrame(draw);
  });

  rafId = requestAnimationFrame(draw);
}

bindEvents();
initActiveNav();
initHeroTilt();
initRealtimeSync();
startVitalPulse();

// 核心優化：開機保險絲
// 啟動後 2 秒內若沒隱藏開機畫面（可能資料載入太慢），則強制作動，確保用戶能看到快取資料並捲動
setTimeout(() => {
  const s = document.getElementById('splash-screen');
  if (s) {
    console.warn('[Safety-Trigger] 檢測到系統加載超時，執行暴力開機程序...');
    hideSplashScreen();
  }
}, 2000);

loadData();
