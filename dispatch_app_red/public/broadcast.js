const $ = (id) => document.getElementById(id);
const numberFormatter = new Intl.NumberFormat('zh-TW');

const refs = {
  shell: $('broadcast-shell'),
  summary: $('broadcast-summary'),
  proof: $('broadcast-proof'),
  speechState: $('speech-state'),
  speechDetail: $('speech-detail'),
  aiState: $('ai-state'),
  aiDetail: $('ai-detail'),
  voiceMode: $('voice-mode'),
  voiceName: $('voice-name'),
  segmentProgress: $('segment-progress'),
  segmentDetail: $('segment-detail'),
  sourceChip: $('broadcast-source'),
  input: $('broadcast-input'),
  btnLoadSystem: $('btn-load-system'),
  btnPasteClipboard: $('btn-paste-clipboard'),
  btnClearText: $('btn-clear-text'),
  voiceSelect: $('voice-select'),
  rateRange: $('rate-range'),
  pitchRange: $('pitch-range'),
  volumeRange: $('volume-range'),
  fontRange: $('font-range'),
  rateValue: $('rate-value'),
  pitchValue: $('pitch-value'),
  volumeValue: $('volume-value'),
  fontValue: $('font-value'),
  btnStart: $('btn-start-broadcast'),
  btnPause: $('btn-pause-broadcast'),
  btnStop: $('btn-stop-broadcast'),
  btnMeetingMode: $('btn-meeting-mode'),
  btnCopyText: $('btn-copy-text'),
  btnFullscreen: $('btn-fullscreen'),
  btnBackHome: $('btn-back-home'),
  teleprompterMode: $('teleprompter-mode'),
  heroLabel: $('hero-label'),
  heroLine: $('hero-line'),
  segmentCount: $('segment-count'),
  segmentIndex: $('segment-index'),
  charCount: $('char-count'),
  sourceExecutionId: $('source-execution-id'),
  meetingFocusStatus: $('meeting-focus-status'),
  meetingFocusGrid: $('meeting-focus-grid'),
  teleprompterList: $('teleprompter-list')
};

const STORAGE_KEYS = {
  text: 'dispatch_broadcast_text',
  source: 'dispatch_broadcast_source',
  executionId: 'dispatch_broadcast_execution_id',
  payload: 'dispatch_broadcast_payload'
};

const TARGET_LABELS = {
  headline: '主標題',
  system: '系統狀態',
  totals: '重點數字',
  ranking: '排名區',
  dispatch: '派單分組',
  announcement: '公告區',
  alert: '異常警示',
  version: '版本留存',
  manual: '手動稿件'
};

const state = {
  snapshot: null,
  broadcast: null,
  segments: [],
  currentIndex: 0,
  speaking: false,
  paused: false,
  playToken: 0,
  voices: [],
  manualVoice: false,
  meetingMode: true,
  speechSupported:
    typeof window !== 'undefined' &&
    'speechSynthesis' in window &&
    'SpeechSynthesisUtterance' in window
};

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function safeText(value) {
  return String(value || '').trim();
}

function formatNumber(value) {
  return numberFormatter.format(Number(value || 0));
}

function formatScore(value) {
  return Number(value || 0).toFixed(2);
}

function joinNames(list, fallback = '待確認') {
  return Array.isArray(list) && list.length ? list.join('、') : fallback;
}

function isPassStatus(value) {
  return ['通過', 'PASS', 'done'].includes(String(value || '').trim());
}

function toneColor(tone) {
  const map = {
    green: '#75f5b5',
    red: '#ff6488',
    cyan: '#52ebff',
    gold: '#fff2c0',
    orange: '#ffb35f'
  };
  return map[tone] || map.gold;
}

function setTone(node, tone) {
  const color = toneColor(tone);
  node.style.color = color;
  node.style.textShadow = `0 0 12px ${color}`;
}

function setStatus(primary, detail, tone = 'gold') {
  refs.speechState.textContent = primary;
  refs.speechDetail.textContent = detail;
  setTone(refs.speechState, tone);
  setTone(refs.speechDetail, tone);
}

function setAiStatus(primary, detail, tone = 'gold') {
  refs.aiState.textContent = primary;
  refs.aiDetail.textContent = detail;
  setTone(refs.aiState, tone);
  setTone(refs.aiDetail, tone);
}

function normalizeText(rawText) {
  const source = String(rawText || '').replace(/\r/g, '');
  const lines = source.split('\n');
  const cleaned = [];
  let blankCount = 0;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) {
      blankCount += 1;
      if (blankCount <= 1) cleaned.push('');
      continue;
    }

    blankCount = 0;
    cleaned.push(trimmed.replace(/\s+/g, ' '));
  }

  return cleaned.join('\n').trim();
}

function splitLine(line) {
  const text = safeText(line);
  if (!text) return [];

  const result = [];
  let buffer = '';

  for (const char of text) {
    buffer += char;
    const hardBreak = /[。！？!?；;：:]/u.test(char);
    const softBreak = /[，,、]/u.test(char) && buffer.length >= 16;
    const forcedBreak = buffer.length >= 30;

    if (hardBreak || softBreak || forcedBreak) {
      result.push(buffer.trim());
      buffer = '';
    }
  }

  if (buffer.trim()) result.push(buffer.trim());
  return result.filter(Boolean);
}

function buildSegmentsFromText(text) {
  return normalizeText(text)
    .split('\n')
    .flatMap((line) => splitLine(line))
    .filter(Boolean)
    .map((segment, index) => ({
      order: index + 1,
      text: segment,
      target: 'manual',
      sectionKey: 'manual',
      sectionTitle: '手動稿件',
      emphasis: index === 0 ? 'headline' : 'detail'
    }));
}

function speechText(text) {
  return String(text || '')
    .replace(/\bAI\b/gi, 'A I')
    .replace(/\s+/g, ' ')
    .trim();
}

function currentVoice() {
  const selectedUri = refs.voiceSelect.value;
  if (selectedUri) {
    return state.voices.find((voice) => voice.voiceURI === selectedUri) || null;
  }
  return preferredVoice(state.voices);
}

function femaleScore(voice) {
  const name = `${voice.name} ${voice.voiceURI}`.toLowerCase();
  const femaleHints = [
    'female',
    'hanhan',
    'hsiaoyu',
    'mei-jia',
    'mei',
    'yating',
    'huihui',
    'xiaoxiao',
    'xiaoyi',
    'jiayi',
    'ting',
    'ying'
  ];
  const maleHints = ['male', 'david', 'yunjhe', 'yunyang', 'kangkang'];

  let score = 0;
  for (const hint of femaleHints) {
    if (name.includes(hint)) score += 140;
  }
  for (const hint of maleHints) {
    if (name.includes(hint)) score -= 90;
  }
  return score;
}

function voicePriority(voice) {
  const lang = String(voice.lang || '').toLowerCase();
  let score = femaleScore(voice);

  if (lang.startsWith('zh-tw')) score += 420;
  else if (lang.startsWith('zh-hk')) score += 360;
  else if (lang.startsWith('zh-cn')) score += 330;
  else if (lang.startsWith('zh')) score += 300;
  else if (lang.startsWith('ja')) score += 90;

  if (voice.localService) score += 24;
  if (voice.default) score += 12;

  return score;
}

function preferredVoice(voices) {
  if (!Array.isArray(voices) || !voices.length) return null;
  return [...voices].sort((left, right) => voicePriority(right) - voicePriority(left))[0] || null;
}

function updateVoiceSummary() {
  const voice = currentVoice();
  refs.voiceMode.textContent = refs.voiceSelect.value ? '指定女聲' : '女聲優先';
  refs.voiceName.textContent = voice ? `${voice.name}｜${voice.lang}` : '等待可用語音';
  setTone(refs.voiceMode, voice ? 'green' : 'orange');
  setTone(refs.voiceName, voice ? 'cyan' : 'orange');
}

function populateVoices() {
  if (!state.speechSupported) {
    refs.voiceSelect.innerHTML = '<option value="">此瀏覽器不支援語音播報</option>';
    refs.voiceSelect.disabled = true;
    updateVoiceSummary();
    return;
  }

  state.voices = window.speechSynthesis.getVoices();
  const preferred = preferredVoice(state.voices);
  const previous = refs.voiceSelect.value;

  refs.voiceSelect.replaceChildren(
    (() => {
      const option = document.createElement('option');
      option.value = '';
      option.textContent = preferred ? `女聲優先｜${preferred.name}` : '女聲優先';
      return option;
    })(),
    ...state.voices.map((voice) => {
      const option = document.createElement('option');
      option.value = voice.voiceURI;
      option.textContent = `${voice.name}｜${voice.lang}`;
      return option;
    })
  );

  if (state.manualVoice && previous) {
    refs.voiceSelect.value = previous;
  } else {
    refs.voiceSelect.value = '';
  }

  updateVoiceSummary();
}

function safeParsePayload(raw) {
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function buildFallbackCards(snapshot, text = '') {
  const summary = snapshot?.summary || snapshot?.整合總盤 || snapshot?.report?.audit?.summaryBoard || {};
  const ranking = Array.isArray(snapshot?.ranking) ? snapshot.ranking : Array.isArray(snapshot?.正式名次) ? snapshot.正式名次 : Array.isArray(snapshot?.report?.rankings) ? snapshot.report.rankings : [];
  const groups = snapshot?.groups || snapshot?.分級 || snapshot?.report?.groups || {};
  const first = ranking[0];
  const firstMetrics = first?.metrics || {};
  
  const totalRev = summary.totalRevenue || summary.全部總業績 || summary.總業績 || 0;
  const renewalRev = summary.renewalRevenue || summary.追續單金額 || summary.續單金額 || 0;
  const renewalDeals = summary.renewalDeals || summary.追續單成交 || summary.追續成交總數 || 0;
  
  const firstScore = first?.totalScore || first?.weightedScore || firstMetrics['正式權重分數'] || firstMetrics['AI權重分數'] || 0;
  const firstRev = first?.totalRevenue || first?.actualRevenue || firstMetrics['實收'] || firstMetrics['全部總業績'] || 0;

  const contradictionCount = snapshot?.consistencyGuard?.contradictionCount || 0;
  const firstContradiction = snapshot?.consistencyGuard?.contradictions?.[0];

  return [
    {
      key: 'headline',
      label: '主控標題',
      value: snapshot?.systemName || '專業女主播廣播系統',
      detail: `執行序號 ${snapshot?.executionId || '-'}`
    },
    {
      key: 'system',
      label: '系統狀態',
      value: snapshot?.status || '待確認',
      detail: `審計 ${snapshot?.audit?.status || 'PASS'}｜確認 ${snapshot?.confirmation?.status || 'PASS'}`
    },
    {
      key: 'totals',
      label: '重點數字',
      value: formatNumber(totalRev),
      detail: `追續額 ${formatNumber(renewalRev)}｜單數 ${formatNumber(renewalDeals)} 通`
    },
    {
      key: 'ranking',
      label: '今日第一名',
      value: first ? (first.name || first.姓名) : '待確認',
      detail: first ? `AI ${formatScore(firstScore)}｜實收/總績 ${formatNumber(firstRev)}` : '尚無正式排名'
    },
    {
      key: 'dispatch',
      label: '派單分組',
      value: `A1 ${Array.isArray(groups.A1) ? groups.A1.length : 0}｜A2 ${Array.isArray(groups.A2) ? groups.A2.length : 0}`,
      detail: `A1 ${joinNames(groups.A1)}`
    },
    {
      key: 'announcement',
      label: '播報稿狀態',
      value: text ? '已載入' : '待載入',
      detail: text ? `${normalizeText(text).length} 字` : '尚無正式播報稿'
    },
    {
      key: 'alert',
      label: '異常警示',
      value: contradictionCount ? `${contradictionCount} 項` : '無異常',
      detail: firstContradiction || '前後端一致'
    },
    {
      key: 'version',
      label: '正式版本',
      value: snapshot?.systemVersion || '-',
      detail: `最後更新 ${snapshot?.completedAt || '-'}`
    }
  ];
}

function normalizeSegments(segments, text) {
  if (Array.isArray(segments) && segments.length) {
    return segments
      .map((segment, index) => ({
        order: Number(segment.order || index + 1),
        text: safeText(segment.text),
        target: safeText(segment.target) || 'announcement',
        sectionKey: safeText(segment.sectionKey) || 'broadcast',
        sectionTitle: safeText(segment.sectionTitle) || TARGET_LABELS[safeText(segment.target)] || '正式播報',
        emphasis: safeText(segment.emphasis) || (index === 0 ? 'headline' : 'detail')
      }))
      .filter((segment) => segment.text);
  }

  return buildSegmentsFromText(text);
}

function normalizeCards(cards, snapshot, text) {
  if (Array.isArray(cards) && cards.length) {
    return cards.map((card) => ({
      key: safeText(card.key) || 'announcement',
      label: safeText(card.label) || '播報焦點',
      value: safeText(card.value) || '-',
      detail: safeText(card.detail) || ''
    }));
  }

  return buildFallbackCards(snapshot, text);
}

function normalizeBroadcastPayload(payload, snapshot, fallbackText = '') {
  const text = normalizeText(payload?.scriptText || fallbackText || snapshot?.announcement || '');
  return {
    enabled: payload?.enabled !== false,
    modeName: safeText(payload?.modeName) || '專業女主播廣播系統',
    presenterProfile:
      safeText(payload?.presenterProfile) ||
      '高學歷、專業、穩重、清楚、有權威感的正式商業女主播',
    meetingRoomReady: payload?.meetingRoomReady !== false,
    canBroadcast: payload?.canBroadcast !== false && Boolean(text),
    source: safeText(payload?.source) || 'backend-formal',
    scriptText: text,
    sections: Array.isArray(payload?.sections) ? payload.sections : [],
    segments: normalizeSegments(payload?.segments, text),
    cards: normalizeCards(payload?.cards, snapshot, text)
  };
}

function buildManualPayload(text, snapshot) {
  const scriptText = normalizeText(text);
  const payload = {
    enabled: Boolean(scriptText),
    modeName: '專業女主播廣播系統',
    presenterProfile: '前端手動稿件模式',
    meetingRoomReady: true,
    canBroadcast: Boolean(scriptText),
    source: 'manual',
    scriptText,
    sections: [],
    segments: buildSegmentsFromText(scriptText),
    cards: buildFallbackCards(snapshot, scriptText).map((card) =>
      card.key === 'announcement'
        ? {
            ...card,
            label: '手動稿件',
            value: scriptText ? '已貼上' : '待貼上',
            detail: scriptText ? `${scriptText.length} 字` : '尚未輸入內容'
          }
        : card
    )
  };

  return normalizeBroadcastPayload(payload, snapshot, scriptText);
}

function summaryTextForSource(sourceLabel) {
  if (sourceLabel === '後端正式播報稿') {
    return '目前使用後端唯一正式播報稿。前端只負責播報展示、字體放大、區塊高亮與會議室刊登，不改動任何正式數據。';
  }

  if (sourceLabel === '手動稿件') {
    return '目前使用手動稿件。畫面會明確標示為手動內容，不冒充正式結果，避免前後端矛盾。';
  }

  return '目前可同時用於首頁與會議室大螢幕。聲音、字幕、重點數字、排名焦點與公告焦點會同步呼應。';
}

function persistBroadcastDraft() {
  try {
    localStorage.setItem(STORAGE_KEYS.text, refs.input.value);
    localStorage.setItem(STORAGE_KEYS.source, refs.sourceChip.textContent || '手動稿件');
    localStorage.setItem(STORAGE_KEYS.executionId, refs.sourceExecutionId.textContent || '-');
    localStorage.setItem(STORAGE_KEYS.payload, JSON.stringify(state.broadcast || null));
  } catch {}
}

function renderProof(sourceLabel = '等待資料') {
  const aiInjected = Boolean(state.snapshot?.aiStatus?.injected);
  const consistency = state.snapshot?.consistencyGuard?.status || '待確認';
  const contradictionCount = state.snapshot?.consistencyGuard?.contradictionCount || 0;
  const voice = currentVoice();
  const items = [
    ['AI 狀態', aiInjected ? '已接入' : '未接入'],
    ['一致性', contradictionCount > 0 ? `${consistency}｜${contradictionCount} 項` : consistency],
    ['播報來源', sourceLabel],
    ['播報模式', state.meetingMode ? '會議室刊登' : '首頁同步'],
    ['女聲語音', voice ? `${voice.name}` : '等待語音'],
    ['正式版本', state.snapshot?.systemVersion || '-']
  ];

  refs.proof.replaceChildren(
    ...items.map(([label, value]) => {
      const chip = el('div', 'proof-chip');
      const labelNode = el('span', '', label);
      const valueNode = el('strong', '', value);
      if (label === 'AI 狀態') setTone(valueNode, aiInjected ? 'green' : 'red');
      if (label === '一致性') setTone(valueNode, contradictionCount > 0 ? 'red' : 'green');
      chip.append(labelNode, valueNode);
      return chip;
    })
  );
}

function updateAiProof(sourceLabel) {
  const aiInjected = Boolean(state.snapshot?.aiStatus?.injected);
  const contradictionCount = state.snapshot?.consistencyGuard?.contradictionCount || 0;
  const canBroadcast = Boolean(state.broadcast?.canBroadcast);

  if (!aiInjected) {
    setAiStatus('未接入', '後端尚未提供 AI 正式播報鏈路。', 'red');
  } else if (!canBroadcast) {
    setAiStatus('已接入', '後端已有正式資料，但播報稿尚未就緒。', 'orange');
  } else if (contradictionCount > 0) {
    setAiStatus('已接入', `後端發現 ${contradictionCount} 項矛盾，前端只展示，不冒充正式結論。`, 'red');
  } else {
    setAiStatus('已接入', '後端正式播報稿已同步，前端只做展示、高亮與會議室刊登。', 'green');
  }

  refs.sourceChip.textContent = sourceLabel;
  refs.teleprompterMode.textContent = state.meetingMode ? '會議室刊登模式' : '首頁同步模式';
  refs.meetingFocusStatus.textContent = state.meetingMode ? '專業女主播廣播模式' : '首頁同步播報模式';
  setTone(refs.teleprompterMode, state.meetingMode ? 'cyan' : 'gold');
  renderProof(sourceLabel);
}

function renderMeetingFocus(activeTarget = '') {
  const cards = Array.isArray(state.broadcast?.cards) ? state.broadcast.cards : [];
  refs.meetingFocusGrid.replaceChildren(
    ...(cards.length
      ? cards.map((card) => {
          const node = el('article', 'focus-card');
          node.dataset.target = card.key;
          if (activeTarget && card.key === activeTarget) node.classList.add('active');

          const label = el('span', 'focus-card-label', card.label);
          const value = el('strong', 'focus-card-value', card.value);
          const detail = el('small', 'focus-card-detail', card.detail);
          const target = el('span', 'focus-card-target', TARGET_LABELS[card.key] || card.key);

          node.append(label, value, detail, target);
          return node;
        })
      : [el('div', 'teleprompter-empty', '等待載入重點卡片')])
  );
}

function renderSegments() {
  const normalized = normalizeText(refs.input.value);
  const safeIndex = state.segments.length ? Math.min(state.currentIndex, state.segments.length - 1) : 0;
  const activeSegment = state.segments[safeIndex] || null;

  refs.charCount.textContent = String(normalized.length);
  refs.segmentCount.textContent = String(state.segments.length);
  refs.segmentIndex.textContent = state.segments.length ? String(safeIndex + 1) : '0';
  refs.segmentProgress.textContent = state.segments.length ? `${safeIndex + 1} / ${state.segments.length}` : '0 / 0';
  refs.segmentDetail.textContent = activeSegment
    ? `${activeSegment.sectionTitle || TARGET_LABELS[activeSegment.target] || '目前朗讀'}｜${activeSegment.text}`
    : '等待載入播報段落';
  refs.heroLabel.textContent = activeSegment
    ? activeSegment.sectionTitle || TARGET_LABELS[activeSegment.target] || '目前朗讀'
    : '目前朗讀';
  refs.heroLine.textContent = activeSegment ? activeSegment.text : '等待載入正式播報稿';

  refs.teleprompterList.replaceChildren(
    ...(state.segments.length
      ? state.segments.map((segment, index) => {
          const row = el('button', 'teleprompter-line');
          row.type = 'button';
          row.dataset.target = segment.target;
          row.classList.add(index < safeIndex ? 'completed' : 'pending');
          if (index === safeIndex) row.classList.add('active');
          row.addEventListener('click', () => jumpToSegment(index));

          const indexNode = el('span', 'line-index', String(index + 1).padStart(2, '0'));
          const wrap = el('div', 'line-text-wrap');
          const title = el(
            'div',
            'line-title',
            segment.sectionTitle || TARGET_LABELS[segment.target] || '正式播報'
          );
          const textNode = el('div', 'line-text', segment.text);
          const cue = el('div', 'line-cue', TARGET_LABELS[segment.target] || segment.target || '播報焦點');
          wrap.append(title, textNode, cue);
          row.append(indexNode, wrap);
          return row;
        })
      : [el('div', 'teleprompter-empty', '等待載入正式播報稿或貼上要播報的內容。')])
  );

  renderMeetingFocus(activeSegment?.target || '');

  const activeButton = refs.teleprompterList.querySelector('.teleprompter-line.active');
  if (activeButton) {
    activeButton.scrollIntoView({ block: 'center', behavior: 'smooth' });
  }
}

function applyBroadcastPayload(broadcast, sourceLabel, executionId = '-') {
  state.broadcast = broadcast;
  state.segments = Array.isArray(broadcast?.segments) ? broadcast.segments : [];
  state.currentIndex = Math.min(state.currentIndex, Math.max(state.segments.length - 1, 0));
  if (!state.segments.length) state.currentIndex = 0;

  refs.input.value = broadcast?.scriptText || '';
  refs.sourceChip.textContent = sourceLabel;
  refs.sourceExecutionId.textContent = executionId || '-';
  refs.summary.textContent = summaryTextForSource(sourceLabel);

  updateAiProof(sourceLabel);
  renderSegments();
  persistBroadcastDraft();
}

async function fetchOfficialBroadcast() {
  const response = await fetch('/api/broadcast/current');
  const payload = await response.json();
  if (payload?.success && payload.data) {
    return {
      snapshot: payload.data,
      broadcast: normalizeBroadcastPayload(payload.data.broadcast, payload.data, payload.data.announcement)
    };
  }

  throw new Error('後端正式播報資料讀取失敗');
}

async function fetchFallbackCurrent() {
  const response = await fetch('/api/current');
  const payload = await response.json();
  if (payload?.success && payload.data) {
    return {
      snapshot: payload.data,
      broadcast: normalizeBroadcastPayload(payload.data.broadcast, payload.data, payload.data.announcement)
    };
  }

  throw new Error('後端正式結果讀取失敗');
}

async function loadSystemAnnouncement(preferStored = false) {
  const storedText = localStorage.getItem(STORAGE_KEYS.text) || '';
  const storedSource = localStorage.getItem(STORAGE_KEYS.source) || '手動稿件';
  const storedExecutionId = localStorage.getItem(STORAGE_KEYS.executionId) || '-';
  const storedPayload = safeParsePayload(localStorage.getItem(STORAGE_KEYS.payload));

  if (preferStored && safeText(storedText)) {
    const storedBroadcast =
      storedPayload && typeof storedPayload === 'object'
        ? normalizeBroadcastPayload(storedPayload, state.snapshot, storedText)
        : buildManualPayload(storedText, state.snapshot);
    applyBroadcastPayload(storedBroadcast, storedSource, storedExecutionId);
  }

  try {
    const result = await fetchOfficialBroadcast().catch(fetchFallbackCurrent);
    state.snapshot = result.snapshot;

    const keepManualDraft =
      preferStored &&
      safeText(storedText) &&
      safeText(storedSource) === '手動稿件';

    if (keepManualDraft) {
      updateAiProof(storedSource);
      return;
    }

    applyBroadcastPayload(result.broadcast, '後端正式播報稿', String(result.snapshot.executionId || '-'));
    setStatus('播報就緒', '後端正式播報稿已同步，可直接進入首頁或會議室播報。', 'green');
  } catch {
    if (!safeText(storedText)) {
      const manual = buildManualPayload('', state.snapshot);
      applyBroadcastPayload(manual, '等待資料', '-');
    }
    setStatus('等待資料', '目前未取得後端正式播報稿，可先貼上手動稿件。', 'orange');
    updateAiProof(refs.sourceChip.textContent || '等待資料');
  }
}

function syncManualPayload() {
  const manual = buildManualPayload(refs.input.value, state.snapshot);
  applyBroadcastPayload(manual, '手動稿件', state.snapshot?.executionId || '-');
}

function updateRangeLabels() {
  refs.rateValue.textContent = `${Number(refs.rateRange.value).toFixed(2)}x`;
  refs.pitchValue.textContent = Number(refs.pitchRange.value).toFixed(2);
  refs.volumeValue.textContent = `${Math.round(Number(refs.volumeRange.value) * 100)}%`;
  refs.fontValue.textContent = `${Math.round(Number(refs.fontRange.value) * 100)}%`;

  const scale = Number(refs.fontRange.value);
  document.documentElement.style.setProperty('--hero-font', `${Math.round(56 * scale)}px`);
  document.documentElement.style.setProperty('--teleprompter-font', `${Math.round(30 * scale)}px`);
  document.documentElement.style.setProperty('--teleprompter-active-font', `${Math.round(40 * scale)}px`);
}

function stopSpeech(resetIndex = true, statusText = '播報已停止') {
  state.playToken += 1;
  state.speaking = false;
  state.paused = false;
  document.body.classList.remove('broadcast-live');

  if (state.speechSupported) {
    window.speechSynthesis.cancel();
  }

  if (resetIndex) {
    state.currentIndex = 0;
  }

  refs.btnPause.textContent = '暫停';
  refs.btnStart.textContent = '開始播報';
  renderSegments();
  setStatus(statusText, resetIndex ? '播報流程已結束，等待重新啟動。' : '目前停在既有段落。', 'orange');
}

function updateSpeechProgress() {
  const total = state.segments.length;
  const idx   = state.currentIndex;
  const bar   = document.getElementById('speech-progress-bar');
  const label = document.getElementById('speech-progress-label');
  const eta   = document.getElementById('speech-progress-eta');
  if (!bar) return;

  const pct = total > 0 ? ((idx + (state.speaking ? 0.5 : 0)) / total * 100) : 0;
  bar.style.width = Math.min(100, pct).toFixed(1) + '%';

  if (label) label.textContent = `${Math.min(idx + 1, total)} / ${total} 段`;

  if (eta && total > 0) {
    const rate      = Number(refs.rateRange?.value || 0.95);
    const remaining = state.segments.slice(idx).reduce((sum, s) => sum + (s.text || '').length, 0);
    const secLeft   = Math.round(remaining / (rate * 4.5));
    eta.textContent = state.speaking && secLeft > 0 ? `約 ${secLeft} 秒` : '';
  }
}

function finishSpeech() {
  state.speaking = false;
  state.paused = false;
  document.body.classList.remove('broadcast-live');
  refs.btnPause.textContent = '暫停';
  refs.btnStart.textContent = '重新播報';
  setStatus('播報完成', '所有段落已完成播報。', 'green');
  renderSegments();
  updateSpeechProgress();
}

function speakFrom(index) {
  if (!state.speechSupported) {
    setStatus('語音不支援', '目前瀏覽器不支援 speechSynthesis。', 'red');
    return;
  }

  if (!state.segments.length) {
    renderSegments();
  }

  if (!state.segments.length) {
    setStatus('沒有播報稿', '請先載入正式播報稿或貼上要播報的內容。', 'orange');
    return;
  }

  const safeIndex = Math.max(0, Math.min(index, state.segments.length - 1));
  const voice = currentVoice();
  const segment = state.segments[safeIndex];
  const text = speechText(segment.text);

  if (!text) {
    finishSpeech();
    return;
  }

  state.playToken += 1;
  const token = state.playToken;
  state.currentIndex = safeIndex;
  state.speaking = true;
  state.paused = false;
  refs.btnPause.textContent = '暫停';
  refs.btnStart.textContent = '重新播報';
  document.body.classList.add('broadcast-live');
  renderSegments();
  setStatus('播報中', `目前正在播報第 ${safeIndex + 1} 段。`, 'green');

  const utterance = new SpeechSynthesisUtterance(text);
  if (voice) {
    utterance.voice = voice;
    utterance.lang = voice.lang;
  } else {
    utterance.lang = 'zh-TW';
  }
  utterance.rate = Number(refs.rateRange.value);
  utterance.pitch = Number(refs.pitchRange.value);
  utterance.volume = Number(refs.volumeRange.value);

  utterance.onstart = () => {
    if (token !== state.playToken) return;
    state.currentIndex = safeIndex;
    renderSegments();
    updateSpeechProgress();
  };

  utterance.onend = () => {
    if (token !== state.playToken) return;
    if (state.paused) return;

    const nextIndex = safeIndex + 1;
    if (nextIndex >= state.segments.length) {
      finishSpeech();
      return;
    }

    state.currentIndex = nextIndex;
    speakFrom(nextIndex);
  };

  utterance.onerror = () => {
    if (token !== state.playToken) return;
    stopSpeech(false, '語音播報失敗');
    setStatus('語音播報失敗', '請重新選擇語音或重新啟動播報。', 'red');
  };

  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(utterance);
}

function jumpToSegment(index) {
  state.currentIndex = index;
  renderSegments();

  if (state.speaking || state.paused) {
    speakFrom(index);
  } else {
    setStatus('已切換段落', `目前停在第 ${index + 1} 段。`, 'cyan');
  }
}

function togglePause() {
  if (!state.speechSupported || !state.speaking) return;

  if (state.paused) {
    window.speechSynthesis.resume();
    state.paused = false;
    refs.btnPause.textContent = '暫停';
    document.body.classList.add('broadcast-live');
    setStatus('播報中', `目前正在播報第 ${state.currentIndex + 1} 段。`, 'green');
    return;
  }

  window.speechSynthesis.pause();
  state.paused = true;
  refs.btnPause.textContent = '繼續';
  document.body.classList.remove('broadcast-live');
  setStatus('播報暫停', `目前停在第 ${state.currentIndex + 1} 段。`, 'orange');
}

async function pasteClipboard() {
  try {
    const text = await navigator.clipboard.readText();
    if (!safeText(text)) {
      setStatus('貼上內容為空', '剪貼簿目前沒有可用文字。', 'orange');
      return;
    }

    refs.input.value = text;
    syncManualPayload();
    setStatus('手動稿件已載入', `已切成 ${state.segments.length} 段。`, 'green');
  } catch {
    setStatus('貼上失敗', '瀏覽器不允許讀取剪貼簿。', 'red');
  }
}

function clearText() {
  stopSpeech(true, '稿件已清空');
  refs.input.value = '';
  const manual = buildManualPayload('', state.snapshot);
  applyBroadcastPayload(manual, '等待資料', '-');
}

async function copyCurrentText() {
  const text = refs.input.value.trim();
  if (!text) {
    setStatus('沒有可複製稿件', '請先載入正式播報稿或貼上內容。', 'orange');
    return;
  }

  try {
    await navigator.clipboard.writeText(text);
    setStatus('複製完成', '目前播報稿已複製到剪貼簿。', 'green');
  } catch {
    setStatus('複製失敗', '瀏覽器不允許寫入剪貼簿。', 'red');
  }
}

async function toggleFullscreen() {
  try {
    if (document.fullscreenElement) {
      await document.exitFullscreen();
      refs.btnFullscreen.textContent = '全螢幕';
      setStatus('已退出全螢幕', '目前回到一般頁面模式。', 'cyan');
      return;
    }

    await refs.shell.requestFullscreen();
    refs.btnFullscreen.textContent = '退出全螢幕';
    setStatus('會議室模式啟動', '目前為全螢幕會議室刊登模式。', 'green');
  } catch {
    setStatus('全螢幕失敗', '目前瀏覽器無法切換全螢幕。', 'red');
  }
}

function applyMeetingMode() {
  document.body.classList.toggle('meeting-mode', state.meetingMode);
  refs.btnMeetingMode.textContent = state.meetingMode ? '關閉會議室模式' : '會議室刊登模式';
  refs.teleprompterMode.textContent = state.meetingMode ? '會議室刊登模式' : '首頁同步模式';
  refs.meetingFocusStatus.textContent = state.meetingMode ? '專業女主播廣播模式' : '首頁同步播報模式';
  setTone(refs.teleprompterMode, state.meetingMode ? 'cyan' : 'gold');
  setTone(refs.meetingFocusStatus, state.meetingMode ? 'cyan' : 'gold');
}

function toggleMeetingMode() {
  state.meetingMode = !state.meetingMode;
  applyMeetingMode();
  renderSegments();
  setStatus(
    state.meetingMode ? '會議室模式開啟' : '會議室模式關閉',
    state.meetingMode ? '目前適合大螢幕會議播報。' : '目前回到首頁同步播報版。',
    'cyan'
  );
}

function handleInputChange() {
  if (state.speaking || state.paused) {
    stopSpeech(false, '稿件已更新');
    setStatus('稿件已更新', '請重新啟動播報，避免聲音與字幕不同步。', 'orange');
  }

  syncManualPayload();
}

function bindEvents() {
  refs.voiceSelect.addEventListener('change', () => {
    state.manualVoice = Boolean(refs.voiceSelect.value);
    updateVoiceSummary();
    renderProof(refs.sourceChip.textContent || '等待資料');
  });

  refs.rateRange.addEventListener('input', updateRangeLabels);
  refs.pitchRange.addEventListener('input', updateRangeLabels);
  refs.volumeRange.addEventListener('input', updateRangeLabels);
  refs.fontRange.addEventListener('input', updateRangeLabels);

  refs.input.addEventListener('input', handleInputChange);
  refs.btnLoadSystem.addEventListener('click', () => loadSystemAnnouncement(false));
  refs.btnPasteClipboard.addEventListener('click', pasteClipboard);
  refs.btnClearText.addEventListener('click', clearText);
  refs.btnMeetingMode.addEventListener('click', toggleMeetingMode);
  refs.btnStart.addEventListener('click', () => {
    if (state.paused) {
      togglePause();
      return;
    }
    speakFrom(state.currentIndex || 0);
  });
  refs.btnPause.addEventListener('click', togglePause);
  refs.btnStop.addEventListener('click', () => stopSpeech(true));
  refs.btnCopyText.addEventListener('click', copyCurrentText);
  refs.btnFullscreen.addEventListener('click', toggleFullscreen);
  refs.btnBackHome.addEventListener('click', () => {
    window.location.href = '/';
  });

  document.addEventListener('fullscreenchange', () => {
    refs.btnFullscreen.textContent = document.fullscreenElement ? '退出全螢幕' : '全螢幕';
  });

  document.addEventListener('keydown', (event) => {
    if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
      event.preventDefault();
      speakFrom(state.currentIndex || 0);
      return;
    }

    if (event.code === 'Space' && event.target !== refs.input) {
      event.preventDefault();
      if (state.speaking) togglePause();
      return;
    }

    if (event.key === 'Escape' && state.speaking) {
      stopSpeech(true);
    }
  });
}

function initSpeech() {
  if (!state.speechSupported) {
    setStatus('語音不支援', '目前瀏覽器不支援 speechSynthesis。', 'red');
    setAiStatus('待確認', '可先使用字幕與會議室刊登模式。', 'orange');
    refs.btnStart.disabled = true;
    refs.btnPause.disabled = true;
    return;
  }

  populateVoices();
  if (typeof window.speechSynthesis.addEventListener === 'function') {
    window.speechSynthesis.addEventListener('voiceschanged', populateVoices);
  } else {
    window.speechSynthesis.onvoiceschanged = populateVoices;
  }
}

(async function init() {
  updateRangeLabels();
  bindEvents();
  initSpeech();
  applyMeetingMode();
  renderMeetingFocus();
  renderSegments();
  setStatus('待命', '等待載入正式播報稿', 'gold');
  await loadSystemAnnouncement(true);
})();
