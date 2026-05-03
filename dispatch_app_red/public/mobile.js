const $ = (id) => document.getElementById(id);
const numberFormatter = new Intl.NumberFormat('zh-TW');

const refs = {
  title: $('report-title'),
  range: $('report-range'),
  auditResult: $('audit-result'),
  reportVersion: $('report-version'),
  heroNote: $('hero-note-text'),
  updatedAt: $('updated-at'),
  employeeSearch: $('employee-search'),
  saveSearchButton: $('save-search-button'),
  jumpRankingButton: $('jump-ranking-button'),
  clearSearchButton: $('clear-search-button'),
  lookupResult: $('lookup-result'),
  summaryGrid: $('summary-grid'),
  podiumGrid: $('podium-grid'),
  top10List: $('top10-list'),
  groupsGrid: $('groups-grid'),
  rankingList: $('ranking-list'),
  auditNotes: $('audit-notes'),
  excludedEmployees: $('excluded-employees'),
  shortText: $('short-text-output'),
  copyShortButton: $('copy-short-button'),
  lineOutputText: $('line-output-text'),
  copyLineButton: $('copy-line-button'),
  lineOpenLink: $('line-open-link'),
  shareButton: $('share-button'),
  copyButton: $('copy-button'),
  topButton: $('top-button'),
  toast: $('toast')
};

const STORAGE_KEYS = {
  employeeName: 'dispatch_mobile_employee_name'
};

const GOLD_SCORE_THRESHOLD = 7000;

const SUMMARY_ORDER = [
  '累積總派單數',
  '累積派單總成交數',
  '累積追續總成交數',
  '當日續單金額',
  '本月業績',
  '追續單總金額',
  '當日取消退貨'
];

const METRIC_ORDER = [
  '正式權重分數',
  '實收',
  '續單金額',
  '總業績',
  '追續客單價',
  '追續成交總數'
];

const GROUP_META = {
  A1: { title: 'A1', description: '高單主力' },
  A2: { title: 'A2', description: '續單收割' },
  B: { title: 'B', description: '一般量單' },
  C: { title: 'C', description: '補位／觀察培養' }
};
const LABEL_MAP = {
  '正式權重分數': '正式權重分數',
  '實收': '實收總業績',
  '續單金額': '追續單金額',
  '總業績': '全部總金額',
  '追續客單價': '追續客單價',
  '追續成交總數': '追續單數量'
};

let toastTimer = null;
let currentReportId = '';
let currentReport = null;

function safeText(value) {
  return String(value ?? '').trim();
}

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function normalizeNameKey(value) {
  return safeText(value).replace(/\s+/g, '');
}

function formatNumber(value) {
  return numberFormatter.format(Number(value || 0));
}

function formatDate(dateText) {
  const source = safeText(dateText);
  if (!/^\d{4}-\d{2}-\d{2}$/u.test(source)) return source || '-';

  const [, month, day] = source.split('-');
  return `${Number(month)}/${Number(day)}`;
}

function formatTime(dateText) {
  const source = safeText(dateText);
  if (!source) return '未提供時間';

  const normalized = source.replace(/([+-]\d{2})(\d{2})$/u, '$1:$2');
  const parsed = new Date(normalized);
  if (Number.isNaN(parsed.getTime())) return source;

  return new Intl.DateTimeFormat('zh-TW', {
    month: 'numeric',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(parsed);
}

function buildReportApiPath() {
  const query = new URLSearchParams(window.location.search);
  const queryReportId = safeText(query.get('reportId'));
  const pathParts = window.location.pathname.split('/').filter(Boolean);
  const pathReportId =
    pathParts[0] === 'mobile' || pathParts[0] === 'm'
      ? safeText(pathParts[1])
      : '';

  const reportId = queryReportId || pathReportId;
  const base = reportId ? `/api/dispatch-reports/${encodeURIComponent(reportId)}` : '/api/dispatch-reports/latest';
  // 加上時間戳記避免快取舊資料
  return `${base}?t=${Date.now()}`;
}

function canonicalMobileUrl(reportId) {
  if (!reportId) return `${window.location.origin}/mobile`;
  return `${window.location.origin}/mobile/${encodeURIComponent(reportId)}`;
}

function readStoredEmployeeName() {
  try {
    return safeText(localStorage.getItem(STORAGE_KEYS.employeeName));
  } catch {
    return '';
  }
}

function writeStoredEmployeeName(name) {
  try {
    if (!name) {
      localStorage.removeItem(STORAGE_KEYS.employeeName);
      return;
    }

    localStorage.setItem(STORAGE_KEYS.employeeName, name);
  } catch {
    // ignore storage failures in embedded browsers
  }
}

function initialEmployeeName() {
  const query = new URLSearchParams(window.location.search);
  return safeText(query.get('name')) || readStoredEmployeeName();
}

async function requestJson(url) {
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json'
    },
    cache: 'no-store' // 強制不使用快取，確保每次取得最新官方鎖資料
  });

  const payload = await response.json().catch(() => ({
    success: false,
    message: '系統回傳格式錯誤'
  }));

  if (!response.ok || payload.success === false) {
    throw new Error(payload.message || '資料讀取失敗');
  }

  return payload.data;
}

function showToast(message) {
  refs.toast.textContent = message;
  refs.toast.classList.add('is-visible');

  if (toastTimer) {
    clearTimeout(toastTimer);
  }

  toastTimer = window.setTimeout(() => {
    refs.toast.classList.remove('is-visible');
  }, 1800);
}

function activeLookupName() {
  return safeText(refs.employeeSearch?.value);
}

function activeLookupKey() {
  return normalizeNameKey(activeLookupName());
}

function findMatchedRanking(rankings, name) {
  const lookupKey = normalizeNameKey(name);
  if (!lookupKey || !Array.isArray(rankings)) return null;

  return (
    rankings.find((item) => normalizeNameKey(item.name) === lookupKey) ||
    rankings.find((item) => normalizeNameKey(item.name).includes(lookupKey)) ||
    null
  );
}

function renderSummary(summaryBoard) {
  refs.summaryGrid.innerHTML = SUMMARY_ORDER.map((key) => `
    <article class="summary-card">
      <span>${escapeHtml(key)}</span>
      <strong>${escapeHtml(formatNumber(summaryBoard?.[key] || 0))}</strong>
    </article>
  `).join('');
}

function renderPodium(rankings, matchedKey) {
  const top5 = Array.isArray(rankings) ? rankings.slice(0, 5) : [];

  if (!top5.length) {
    refs.podiumGrid.innerHTML = '<div class="empty-state">目前沒有前五名資料。</div>';
    return;
  }

  refs.podiumGrid.innerHTML = top5.map((item, index) => {
    const isMatch = matchedKey && normalizeNameKey(item.name) === matchedKey;

    return `
      <article class="podium-card podium-${index + 1}${isMatch ? ' is-match' : ''}">
        <div class="card-topline">
          <span class="rank-badge">#${escapeHtml(item.rank)}</span>
          <span class="group-badge group-${escapeHtml(item.group)}">${escapeHtml(item.group)}</span>
        </div>
        <h3 class="person-name">${escapeHtml(item.name)}</h3>
        <p class="sub-meta">${item.isNew ? '新人角標已生效' : '正式派單名次'}</p>
        <div class="metric-grid">
          ${METRIC_ORDER.map((key) => {
            const val = Number(item.metrics?.[key] || 0);
            const isScore = key === '正式權重分數';
            const isGold = isScore && val >= GOLD_SCORE_THRESHOLD;
            return `
              <div class="metric-item ${isScore ? 'score-highlight' : ''} ${isGold ? 'score-trophy-gold' : ''}">
                <span>${escapeHtml(LABEL_MAP[key] || key)} ${isGold ? '🏆' : ''}</span>
                <strong>${escapeHtml(formatNumber(val))}</strong>
              </div>
            `;
          }).join('')}
        </div>
      </article>
    `;
  }).join('');
}

function renderTop10(rankings, matchedKey) {
  const top10 = Array.isArray(rankings) ? rankings.slice(0, 10) : [];

  if (!top10.length) {
    refs.top10List.innerHTML = '<div class="empty-state">目前沒有前 10 名資料。</div>';
    return;
  }

  refs.top10List.innerHTML = top10.map((item) => {
    const isMatch = matchedKey && normalizeNameKey(item.name) === matchedKey;

    return `
      <article class="rank-card${isMatch ? ' is-match' : ''}">
        <div class="rank-card-topline">
          <span class="rank-badge">#${escapeHtml(item.rank)}</span>
          <span class="group-badge group-${escapeHtml(item.group)}">${escapeHtml(item.group)}</span>
        </div>
        <p class="rank-card-name">${escapeHtml(item.name)}</p>
        <div class="metric-grid">
          ${(() => {
            const val = Number(item.metrics?.['正式權重分數'] || 0);
            const isGold = val >= GOLD_SCORE_THRESHOLD;
            return `
              <div class="metric-item score-highlight ${isGold ? 'score-trophy-gold' : ''}">
                <span>正式權重分數 ${isGold ? '🏆' : ''}</span>
                <strong>${escapeHtml(formatNumber(val))}</strong>
              </div>
            `;
          })()}
          <div class="metric-item">
            <span>實收總業績</span>
            <strong>${escapeHtml(formatNumber(item.metrics?.['實收'] || 0))}</strong>
          </div>
          <div class="metric-item">
            <span>追續單金額</span>
            <strong>${escapeHtml(formatNumber(item.metrics?.['續單金額'] || 0))}</strong>
          </div>
        </div>
      </article>
    `;
  }).join('');
}

function renderGroups(groups, rankings, matchedKey) {
  const rankMap = new Map((rankings || []).map((item) => [item.name, item.rank]));

  refs.groupsGrid.innerHTML = Object.keys(GROUP_META).map((groupKey) => {
    const members = Array.isArray(groups?.[groupKey]) ? groups[groupKey] : [];
    const meta = GROUP_META[groupKey];
    const hasMatch = matchedKey && members.some((name) => normalizeNameKey(name) === matchedKey);

    return `
      <article class="group-card group-${escapeHtml(groupKey)}${hasMatch ? ' is-match' : ''}">
        <h3>${escapeHtml(meta.title)}</h3>
        <p>${escapeHtml(meta.description)}．共 ${escapeHtml(members.length)} 人</p>
        <div class="member-list">
          ${members.length
            ? members.map((name) => {
                const isMatch = matchedKey && normalizeNameKey(name) === matchedKey;
                return `
                  <span class="member-chip${isMatch ? ' is-match' : ''}">
                    <span class="member-rank">#${escapeHtml(rankMap.get(name) || '-')}</span>
                    <span>${escapeHtml(name)}</span>
                  </span>
                `;
              }).join('')
            : '<span class="member-chip">目前無資料</span>'}
        </div>
      </article>
    `;
  }).join('');
}

function renderRanking(rankings, matchedKey) {
  if (!Array.isArray(rankings) || !rankings.length) {
    refs.rankingList.innerHTML = '<div class="empty-state">目前沒有完整名次資料。</div>';
    return;
  }

  refs.rankingList.innerHTML = rankings.map((item) => {
    const matchKey = normalizeNameKey(item.name);
    const isMatch = matchedKey && matchKey === matchedKey;

    return `
      <article class="ranking-card${isMatch ? ' is-match' : ''}" data-match-key="${escapeHtml(matchKey)}">
        <div class="ranking-card-topline">
          <span class="rank-badge">#${escapeHtml(item.rank)}</span>
          <div>
            <span class="group-badge group-${escapeHtml(item.group)}">${escapeHtml(item.group)}</span>
            ${item.isNew ? '<span class="new-badge">新人</span>' : ''}
          </div>
        </div>
        <p class="ranking-card-name">${escapeHtml(item.name)}</p>
        <div class="metric-grid">
          ${METRIC_ORDER.map((key) => {
            const val = Number(item.metrics?.[key] || 0);
            const isScore = key === '正式權重分數';
            const isGold = isScore && val >= GOLD_SCORE_THRESHOLD;
            return `
              <div class="metric-item ${isScore ? 'score-highlight' : ''} ${isGold ? 'score-trophy-gold' : ''}">
                <span>${escapeHtml(LABEL_MAP[key] || key)} ${isGold ? '🏆' : ''}</span>
                <strong>${escapeHtml(formatNumber(val))}</strong>
              </div>
            `;
          }).join('')}
        </div>
        <div class="advice-box">${escapeHtml(item.advice || '本次未提供建議')}</div>
      </article>
    `;
  }).join('');
}

function renderAudit(audit) {
  const notes = Array.isArray(audit?.notes) ? audit.notes : [];
  const excluded = Array.isArray(audit?.excludedEmployees) ? audit.excludedEmployees : [];

  refs.auditNotes.innerHTML = notes.length
    ? notes.map((text) => `<article class="note-card">${escapeHtml(text)}</article>`).join('')
    : '<div class="empty-state">目前沒有審計說明。</div>';

  refs.excludedEmployees.innerHTML = excluded.length
    ? excluded.map((item) => `
        <article class="excluded-card">
          <strong>${escapeHtml(item.name)}</strong>
          <span>${escapeHtml(item.reason || '已離職')}</span>
        </article>
      `).join('')
    : '<div class="empty-state">本次沒有列示離職人員。</div>';
}

function renderLookup(report) {
  const name = activeLookupName();
  const match = findMatchedRanking(report?.rankings || [], name);
  const groupMembers = match ? (report?.groups?.[match.group] || []) : [];
  const lookupKey = activeLookupKey();

  refs.jumpRankingButton.disabled = !match;

  if (!name) {
    refs.lookupResult.innerHTML = `
      <div class="lookup-empty">
        輸入姓名後，手機會直接幫你找到自己的正式名次、所在分級和今天建議。
        你也可以按「記住姓名」，下次打開手機就會直接看到自己的位置。
      </div>
    `;
    return;
  }

  if (!match) {
    refs.lookupResult.innerHTML = `
      <div class="lookup-miss">
        目前找不到「${escapeHtml(name)}」。
        請確認姓名是否和正式公告完全一致，例如徐華妤不能寫錯。
      </div>
    `;
    return;
  }

  refs.lookupResult.innerHTML = `
    <article class="lookup-card">
      <div class="card-topline">
        <span class="rank-badge">#${escapeHtml(match.rank)}</span>
        <span class="group-badge group-${escapeHtml(match.group)}">${escapeHtml(match.group)}</span>
      </div>
      <h3>${escapeHtml(match.name)}</h3>
      <p class="lookup-meta">你目前在 ${escapeHtml(match.group)} 組，正式派單名次第 ${escapeHtml(match.rank)} 名。</p>

      <div class="metric-grid">
        ${METRIC_ORDER.map((key) => {
          const val = Number(match.metrics?.[key] || 0);
          const isScore = key === '正式權重分數';
          const isGold = isScore && val >= GOLD_SCORE_THRESHOLD;
          return `
            <div class="metric-item ${isScore ? 'score-highlight' : ''} ${isGold ? 'score-trophy-gold' : ''}">
              <span>${escapeHtml(LABEL_MAP[key] || key)} ${isGold ? '🏆' : ''}</span>
              <strong>${escapeHtml(formatNumber(val))}</strong>
            </div>
          `;
        }).join('')}
      </div>

      <div class="lookup-group-line">
        ${groupMembers.map((memberName) => {
          const isMatch = normalizeNameKey(memberName) === lookupKey;
          return `
            <span class="member-chip${isMatch ? ' is-match' : ''}">
              <span class="member-rank">#${escapeHtml(
                report.rankings.find((item) => item.name === memberName)?.rank || '-'
              )}</span>
              <span>${escapeHtml(memberName)}</span>
            </span>
          `;
        }).join('')}
      </div>

      <div class="advice-box">${escapeHtml(match.advice || '本次未提供建議')}</div>
      <span class="lookup-helper">按「定位名次」可直接跳到完整排行榜中的你。</span>
    </article>
  `;
}

function renderInteractiveSections() {
  if (!currentReport) return;

  const matchedKey = activeLookupKey();
  renderLookup(currentReport);
  renderPodium(currentReport.rankings || [], matchedKey);
  renderTop10(currentReport.rankings || [], matchedKey);
  renderGroups(currentReport.groups || {}, currentReport.rankings || [], matchedKey);
  renderRanking(currentReport.rankings || [], matchedKey);
}

function persistEmployeeName() {
  const name = activeLookupName();
  if (!name) {
    writeStoredEmployeeName('');
    showToast('已清除記住的姓名');
    return;
  }

  writeStoredEmployeeName(name);
  showToast('已記住這支手機的姓名');
}

function scrollToMatchedRanking() {
  const match = findMatchedRanking(currentReport?.rankings || [], activeLookupName());
  if (!match) {
    showToast('先輸入正確姓名才能定位');
    return;
  }

  const target = [...document.querySelectorAll('.ranking-card[data-match-key]')].find(
    (element) => element.dataset.matchKey === normalizeNameKey(match.name)
  );

  if (!target) {
    showToast('目前找不到對應名次卡片');
    return;
  }

  target.scrollIntoView({ behavior: 'smooth', block: 'center' });
  target.classList.remove('is-match');
  void target.offsetWidth;
  target.classList.add('is-match');
  showToast(`已定位到 ${match.name} 的正式名次`);
}

function renderReport(report) {
  currentReport = report;
  currentReportId = safeText(report.reportId);

  document.title = `${report.title}｜手機版`;
  refs.title.textContent = report.title || 'AI 派單公告手機版';
  refs.range.textContent = `${formatDate(report.settlementDate)} 結算 → ${formatDate(report.dispatchDate)} 正式派單`;
  refs.auditResult.textContent = safeText(report.auditResult) || '-';
  refs.reportVersion.textContent = `v${safeText(report.version) || '1'}`;
  refs.auditResult.parentElement.dataset.status = safeText(report.auditResult);
  refs.heroNote.textContent = '【AI 比例原則：10,000 滿分制】\n實收(3000)+追續金額(2500)+總額(1500)\n+客單價(1500)+單數(1500)\n空間已優化，滑動到底部可完整查看。';
  refs.updatedAt.textContent = `更新 ${formatTime(report.updatedAt || report.createdAt)}`;
  refs.shortText.value = report.groupShortText || '';

  const lineText = report.groupShortText || '';
  if (refs.lineOutputText) refs.lineOutputText.value = lineText;
  if (refs.lineOpenLink) refs.lineOpenLink.href = lineText ? buildLineUrl(lineText) : '#';

  const canonicalPath = `/mobile/${encodeURIComponent(currentReportId)}`;
  if (currentReportId && window.location.pathname !== canonicalPath) {
    window.history.replaceState({}, '', canonicalPath);
  }

  renderSummary(report.summaryBoard || {});
  renderAudit(report.audit || {});
  renderInteractiveSections();
}

function renderError(message) {
  currentReport = null;
  refs.jumpRankingButton.disabled = true;
  refs.lookupResult.innerHTML = '';
  refs.summaryGrid.innerHTML = `<div class="error-state">${escapeHtml(message)}</div>`;
  refs.podiumGrid.innerHTML = '';
  refs.top10List.innerHTML = '';
  refs.groupsGrid.innerHTML = '';
  refs.rankingList.innerHTML = '';
  refs.auditNotes.innerHTML = '';
  refs.excludedEmployees.innerHTML = '';
  refs.shortText.value = '';
  if (refs.lineOutputText) refs.lineOutputText.value = '';
  if (refs.lineOpenLink) refs.lineOpenLink.href = '#';
}

function buildLineUrl(text) {
  return `https://line.me/R/msg/text/?${encodeURIComponent(text)}`;
}

async function copyLineText() {
  const text = safeText(refs.lineOutputText?.value);
  if (!text) {
    showToast('目前沒有可複製的 LINE 稿');
    return;
  }

  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      showToast('LINE 稿已複製，可直接貼到 LINE');
    } else {
      refs.lineOutputText.select();
      refs.lineOutputText.setSelectionRange(0, 99999);
      document.execCommand('copy');
      window.getSelection()?.removeAllRanges();
      showToast('LINE 稿已複製，可直接貼到 LINE');
    }
  } catch {
    showToast('複製失敗，請手動全選複製');
  }
}

async function copyShortText() {
  const text = safeText(refs.shortText.value);
  if (!text) {
    showToast('目前沒有可複製的群組版');
    return;
  }

  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      showToast('群組精簡版已複製');
    } else {
      refs.shortText.select();
      refs.shortText.setSelectionRange(0, 99999);
      document.execCommand('copy');
      window.getSelection()?.removeAllRanges();
      showToast('群組精簡版已複製');
    }
  } catch (err) {
    showToast('複製失敗，請手動全選複製');
  }
}

async function shareLink() {
  const url = canonicalMobileUrl(currentReportId);
  const title = document.title;

  if (navigator.share) {
    await navigator.share({
      title,
      text: title,
      url
    });
    return;
  }

  await navigator.clipboard.writeText(url);
  showToast('連結已複製');
}

function bindEvents() {
  refs.employeeSearch.addEventListener('input', () => {
    renderInteractiveSections();
  });

  refs.saveSearchButton.addEventListener('click', () => {
    persistEmployeeName();
  });

  refs.jumpRankingButton.addEventListener('click', () => {
    scrollToMatchedRanking();
  });

  refs.clearSearchButton.addEventListener('click', () => {
    refs.employeeSearch.value = '';
    writeStoredEmployeeName('');
    renderInteractiveSections();
    showToast('已清除姓名定位');
  });

  refs.copyShortButton.addEventListener('click', () => {
    copyShortText().catch(() => showToast('複製失敗'));
  });

  refs.copyLineButton?.addEventListener('click', () => {
    copyLineText().catch(() => showToast('複製失敗'));
  });

  refs.copyButton.addEventListener('click', () => {
    copyShortText().catch(() => showToast('複製失敗'));
  });

  refs.shareButton.addEventListener('click', () => {
    shareLink().catch(() => showToast('分享失敗'));
  });

  refs.topButton.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  if (!navigator.share) {
    refs.shareButton.textContent = '複製連結';
  }
}

async function init() {
  bindEvents();
  refs.employeeSearch.value = initialEmployeeName();

  try {
    const report = await requestJson(buildReportApiPath());
    renderReport(report);
  } catch (error) {
    refs.title.textContent = '公告載入失敗';
    refs.range.textContent = '請稍後再試，或確認分享連結是否正確。';
    refs.auditResult.textContent = 'FAIL';
    refs.reportVersion.textContent = '-';
    renderError(error.message || '資料讀取失敗');
  }
}

init();
