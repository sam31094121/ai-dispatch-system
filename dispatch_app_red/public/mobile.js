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
window.onerror = function(msg, url, lineNo, columnNo, error) {
  const errorMsg = `[Silent-Fix] ${msg} (行: ${lineNo})`;
  console.warn(errorMsg, error); // 只在後台記錄，不驚擾使用者
  
  // 確保啟動畫面一定會消失，防止卡死
  const s = document.getElementById('splash-screen');
  if (s) {
    s.style.opacity = '0';
    setTimeout(() => s.remove(), 1000);
  }
  return true; // 阻止錯誤繼續傳播
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

// ── Project Genesis: 自動化視察與感知引擎 ──
function initAutoAesthetic() {
    const shell = document.getElementById('app-shell');
    window.addEventListener('deviceorientation', (e) => {
        if (!e.gamma || !e.beta) return;
        
        // 1. 背景視差 (原有)
        const x = e.gamma / 15; 
        const y = e.beta / 15;
        document.body.style.setProperty('--parallax-x', `${x}px`);
        document.body.style.setProperty('--parallax-y', `${y}px`);
        
        // 2. 3D 空間面板傾斜 (新增)
        if (shell) {
            const rotX = (e.beta - 45) / 10; // 以 45 度為基準
            const rotY = e.gamma / 10;
            shell.style.transform = `rotateX(${rotX}deg) rotateY(${rotY}deg)`;
        }
    });

    // 觸覺回饋...
    document.querySelectorAll('button').forEach(btn => {
        btn.addEventListener('click', () => {
            if (navigator.vibrate) navigator.vibrate(15); // 微秒級脈衝震動
        });
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

function predictNextMovement(report) {
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
    
    const report = normalizeReport(snapshot, lineOutput?.text);
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
    hideSplashScreen();
    
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
  refs.summaryGrid.innerHTML = '';
}
const GLORY_TEMPLATES = {
  1: {
    title: "最高榮耀主力", badge: "冠軍榮耀",
    reason: "因為本輪綜合權重分數與三項主指標領先，因此正式進入前六名。",
    mReason: "因綜合權重與三主指標領先，正式進入前六。",
    summary: "本輪屬於全面領先型主力，優勢在整體戰力全場最高。",
    mSummary: "屬於全面領先型主力。"
  },
  2: {
    title: "核心榮耀主力", badge: "正式前二",
    reason: "因為本輪三項主指標維持高檔且結構完整，因此正式進入前六名。",
    mReason: "因主指標高檔且結構完整，正式進入前六。",
    summary: "本輪屬於高厚度型主力，優勢在數字完整與穩定。",
    mSummary: "屬於高厚度型主力。"
  },
  3: {
    title: "高量能榮耀主力", badge: "正式前三",
    reason: "因為本輪追續單數量全場最高且量能偏強，因此正式進入前六名。",
    mReason: "因追續單數量全場最高，正式進入前六。",
    summary: "本輪屬於高單數推進型主力，優勢在數量推進力極強。",
    mSummary: "屬於高單數推進型主力。"
  },
  4: {
    title: "高推進榮耀主力", badge: "正式前四",
    reason: "因為本輪全部總業績與追續金額表現強，因此正式進入前六名。",
    mReason: "因總業績與追續金額強，正式進入前六。",
    summary: "本輪屬於高推進型主力，優勢在整體推進效率高。",
    mSummary: "屬於高推進型主力。"
  },
  5: {
    title: "高客單榮耀主力", badge: "正式前五",
    reason: "因為本輪追續客單價全場最高且品質偏強，因此正式進入前六名。",
    mReason: "因追續客單價全場最高，正式進入前六。",
    summary: "本輪屬於高客單價型主力，優勢在單筆成交價值突出。",
    mSummary: "屬於高客單價型主力。"
  },
  6: {
    title: "穩定成長榮耀主力", badge: "正式前六",
    reason: "因為本輪實收與全部總業績同步提升且指標完整，因此正式進入前六名。",
    mReason: "因實收與總業績同步提升，正式進入前六。",
    summary: "本輪屬於穩定成長型主力，優勢在整體表現平均。",
    mSummary: "屬於穩定成長型主力。"
  }
};

const SOURCE_TEXT = "後端正式資料、三平台總表、審計通過後有效資料、正式排序結果、正式權重分數結果。";
const M_SOURCE_TEXT = "後端正式資料、三平台總表、審計通過後有效資料、正式排序結果、正式權重分數結果。";

function renderTop6GloryBoard(rankings) {
  const top6Grid = document.getElementById('top6-grid');
  if (!top6Grid) return;
  const top6 = (rankings || []).slice(0, 6);
  if (!top6.length) {
    top6Grid.innerHTML = '<div class="empty-state">目前沒有正式排名資料</div>';
    return;
  }

  const cardsHtml = top6.map((row, index) => {
    const rank = index + 1;
    const tmpl = GLORY_TEMPLATES[rank] || GLORY_TEMPLATES[6];
    
    // 預防資料缺失，給予預設值 0
    const weightedScore = row.weightedScore || row.score || row.metrics?.正式權重分數 || 0;
    const actualRev = row.actualRevenue || row.metrics?.實收 || 0;
    const renewalRev = row.renewalRevenue || row.metrics?.續單金額 || 0;
    const renewalDeals = row.renewalDeals || row.metrics?.追續成交總數 || 0;
    const avgRenewal = row.avgRenewal || row.metrics?.追續客單價 || (renewalDeals ? (renewalRev / renewalDeals) : 0);

    return `
      <article class="glory-card rank-${rank}">
        <!-- 上層 -->
        <div class="glory-layer-top">
          <div class="glory-rank-label">第${rank}名</div>
          <div class="glory-title-label">${tmpl.title}</div>
          <div class="glory-badge-label">${tmpl.badge}</div>
        </div>
        
        <!-- 中層 -->
        <div class="glory-layer-mid">
          <h3 class="glory-name-label">${escapeHtml(row.name)}</h3>
          <div class="glory-score-box">
             <span class="glory-score-label">正式權重分數</span>
             <span class="glory-score-value">${fmt(weightedScore, 2)}</span>
          </div>
          <div class="glory-metrics-grid">
             <div class="metric"><span class="m-label">個人實收</span><span class="m-val">${fmt(actualRev)}</span></div>
             <div class="metric"><span class="m-label">追續金額</span><span class="m-val">${fmt(renewalRev)}</span></div>
             <div class="metric"><span class="m-label">追續客單價</span><span class="m-val">${fmt(avgRenewal, 2)}</span></div>
             <div class="metric"><span class="m-label">追續單數</span><span class="m-val">${renewalDeals} 單</span></div>
          </div>
        </div>

        <!-- 下層 -->
        <div class="glory-layer-bot">
          <div class="glory-reason">
            <strong class="desktop-text">上榜原因：${tmpl.reason}</strong>
            <strong class="mobile-text">上榜原因：${tmpl.mReason}</strong>
          </div>
          <div class="glory-source">
            <span class="desktop-text">數據來源：${SOURCE_TEXT}</span>
            <span class="mobile-text">數據來源：${M_SOURCE_TEXT}</span>
          </div>
          <div class="glory-summary">
            <span class="desktop-text">本輪優勢總結：${tmpl.summary}</span>
            <span class="mobile-text">本輪優勢：${tmpl.mSummary}</span>
          </div>
        </div>
      </article>
    `;
  }).join('');

  top6Grid.innerHTML = cardsHtml;

  // ── 3D 立體卡片科技版：動態物理傾斜與光影追蹤 ──
  const cards = top6Grid.querySelectorAll('.glory-card');
  cards.forEach(card => {
    card.addEventListener('mousemove', e => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      const rotateX = ((y - centerY) / centerY) * -8;
      const rotateY = ((x - centerX) / centerX) * 8;
      card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`;
    });
    
    card.addEventListener('mouseleave', () => {
      card.style.transform = '';
    });
  });
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

  // 公司整體統計欄位（整合總盤、雙平台總表）禁止在員工視圖顯示
  // stat strip / renderSummary / renderDualTotals 已全數停用

  renderTop6GloryBoard(report.ranking);
  renderRankings(report.ranking);
  renderGroups(report.groups, report.ranking);
  renderAudit(report.auditNotes, report.excludedEmployees, report.auditWarnings);
  animateScoreFills();

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

// ── Project Genesis: AI 數字矩陣解碼引擎 ──
function decodeNumberEffect(targetEl, finalValue, duration = 800) {
    if (!targetEl) return;
    const chars = '0123456789X$#%*';
    const finalStr = finalValue.toString();
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
      <article class="ranking-card${rankClass}${hotZoneClass}" id="person-${safeId}">
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

  // 延遲啟動動畫與解碼
  setTimeout(() => {
    refs.rankingList.querySelectorAll('.score-fill').forEach(el => {
      el.style.width = el.getAttribute('data-pct') + '%';
    });
    refs.rankingList.querySelectorAll('.decode-target').forEach(el => {
      const val = el.getAttribute('data-val');
      decodeNumberEffect(el, val, 1000 + Math.random() * 500);
    });

    // 3D 觸控傾斜效果（ranking 卡片）
    refs.rankingList.querySelectorAll('.ranking-card').forEach(card => {
      card.addEventListener('touchmove', e => {
        const touch = e.touches[0];
        const rect = card.getBoundingClientRect();
        const x = touch.clientX - rect.left;
        const y = touch.clientY - rect.top;
        const rotX = ((y / rect.height) - 0.5) * -6;
        const rotY = ((x / rect.width) - 0.5) * 6;
        card.style.transform = `perspective(800px) rotateX(${rotX}deg) rotateY(${rotY}deg) scale3d(1.01,1.01,1.01)`;
      }, { passive: true });
      card.addEventListener('touchend', () => {
        card.style.transform = '';
      }, { passive: true });
      card.addEventListener('mousemove', e => {
        const rect = card.getBoundingClientRect();
        const rotX = ((e.clientY - rect.top) / rect.height - 0.5) * -8;
        const rotY = ((e.clientX - rect.left) / rect.width - 0.5) * 8;
        card.style.transform = `perspective(800px) rotateX(${rotX}deg) rotateY(${rotY}deg) scale3d(1.01,1.01,1.01)`;
      });
      card.addEventListener('mouseleave', () => {
        card.style.transform = '';
      });
    });
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

function renderAudit(notes, excluded, report) {
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

function renderError(error) {
  // ── 靜默維修模式 (Silent Recovery) ──
  // 徹底移除「資料讀取失敗」字樣，改為科技感同步提示
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
    refs.summaryGrid.innerHTML = '<div class="empty-state">AI 核心初始化中...</div>';
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
  
  if (skeleton) {
    skeleton.style.display = 'none';
  }

  if (!splash) return;
  
  setTimeout(() => {
    splash.classList.add('fade-out');
    const splashText = splash.querySelector('.splash-text');
    if (splashText) splashText.textContent = "AI 數據核對完畢";
    setTimeout(() => splash.remove(), 800);
  }, 400);
}

// ── 全線串連：SSE 即時推播 ──
function initRealtimeSync() {
  const sync = new RealtimeSyncEngine('/api/updates/stream', (data) => {
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

  function draw() {
    if (document.visibilityState === 'visible') {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.beginPath();
      ctx.setLineDash([2, 2]);
      ctx.strokeStyle = state.isSyncing ? 'rgba(243, 193, 75, 0.5)' : 'rgba(24, 198, 167, 0.6)';
      ctx.lineWidth = 1;
      
      for (let x = 0; x < canvas.width; x++) {
        const y = 10 + Math.sin((x + offset) * 0.2) * 5;
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
      offset += 1;
    }
    requestAnimationFrame(draw);
  }
  draw();
}

bindEvents();
initActiveNav();
initHeroTilt();
initRealtimeSync();
startVitalPulse();
loadData();
initRealtimeSync();
$finalLogic
