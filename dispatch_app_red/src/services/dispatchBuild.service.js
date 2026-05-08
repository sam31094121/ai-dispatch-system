const {
  AUDIT_METRICS,
  DEFAULT_AUDIT_RULE,
  FRONTEND_LOCK_RULES,
  GROUP_KEYS,
  GROUP_RANK_POLICY,
  PLATFORM_NAME_TO_KEY,
  RANKING_METRICS,
  RESERVED_AUDIT_KEYS,
  SERVICE_NAME,
  API_VERSION,
  SUMMARY_METRICS,
  WEIGHTING_POLICY
} = require('../constants/dispatchRules');
const { buildReportId, createDispatchReport, createEmptyGroups } = require('../models/DispatchReport');
const {
  buildExecutionId,
  extractDatesFromTitle,
  formatMonthDay,
  formatTaipeiTimestamp,
  normalizeDateInput
} = require('../utils/date.util');
const {
  cleanText,
  normalizeName,
  normalizeStringArray,
  splitNameTags,
  toNumber
} = require('../utils/name.util');
const fs = require('fs');
const path = require('path');

const numberFormatter = new Intl.NumberFormat('zh-TW');
const cloneValue = typeof globalThis.structuredClone === 'function'
  ? (value) => globalThis.structuredClone(value)
  : (value) => JSON.parse(JSON.stringify(value));

const DEFAULT_ANNOUNCEMENT_PATH = path.join(__dirname, '..', '..', 'shared', 'default-announcement.json');
const LATEST_REPORT_PATH = path.join(__dirname, '..', '..', 'data', 'dispatch-reports-v1', 'latest.json');

function readSeedJson(filePath) {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch {
    return null;
  }
}

function getDefaultAnnouncement() {
  const bundled = readSeedJson(DEFAULT_ANNOUNCEMENT_PATH);
  if (bundled) return bundled;

  const latest = readSeedJson(LATEST_REPORT_PATH);
  if (latest?.report?.sourceText) {
    return {
      title: latest.report.title,
      settlementDate: latest.report.settlementDate || latest.report.reportDate,
      dispatchDate: latest.report.dispatchDate,
      sourceText: latest.report.sourceText
    };
  }

  return latest?.report?.standardData || latest?.report || latest?.standardData || latest || {
    title: 'Dispatch seed',
    settlementDate: normalizeDateInput(new Date().toISOString().slice(0, 10)),
    dispatchDate: normalizeDateInput(new Date(Date.now() + 86400000).toISOString().slice(0, 10)),
    auditResult: 'PASS',
    rankings: [],
    groups: createEmptyGroups(),
    summaryBoard: {},
    adviceList: [],
    finalConfirmations: []
  };
}

const rankingMetricAliases = new Map([
  ['正式權重分數', '正式權重分數'],
  ['實收', '實收'],
  ['實收總金額', '實收'],
  ['總業績', '總業績'],
  ['全部總業績', '總業績'],
  ['業績', '總業績'],
  ['總盤', '總業績'],
  ['續單', '續單金額'],
  ['續單金額', '續單金額'],
  ['追續金額', '續單金額'],
  ['追續單金額', '續單金額'],
  ['追單', '追續成交總數'],
  ['追續', '追續成交總數'],
  ['追續成交總數', '追續成交總數'],
  ['追續總數', '追續成交總數'],
  ['追續單數', '追續成交總數'],
  ['追續客單價', '追續客單價'],
  ['派單成交', '派單成交總通數'],
  ['派單成交總數', '派單成交總通數'],
  ['派單成交總通數', '派單成交總通數']
]);

const summaryMetricAliases = new Map([
  ...SUMMARY_METRICS.map((metric) => [metric, metric]),
  ['全部總業績', '本月業績'],
  ['總業績', '本月業績'],
  ['追續單成交', '累積追續總成交數'],
  ['追續成交總數', '累積追續總成交數'],
  ['追續單金額', '追續單總金額'],
  ['追續單總金額', '追續單總金額'],
  ['實收總金額', '實收總金額'],
  ['三平台整合取消退貨', '當日取消退貨'],
  ['取消退貨', '當日取消退貨']
]);

function clone(value) {
  return cloneValue(value);
}

function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function safeArray(value) {
  return Array.isArray(value) ? value : [];
}

function uniqueTexts(values) {
  const seen = new Set();
  const result = [];

  safeArray(values).forEach((value) => {
    const text = cleanText(value);
    if (!text || seen.has(text)) return;
    seen.add(text);
    result.push(text);
  });

  return result;
}

const AUDIT_NOTE_INCLUDE_PATTERNS = [
  /未發現/u,
  /無漏算/u,
  /無多算/u,
  /無總盤衝突/u,
  /無總表衝突/u,
  /無衝突/u,
  /退貨已列入/u,
  /取消退貨/u,
  /格式異常/u,
  /不影響/u,
  /加總一致/u,
  /核對通過/u,
  /異常/u,
  /提醒/u,
  /一致/u
];

const AUDIT_NOTE_EXCLUDE_PATTERNS = [
  /^審計結果/u,
  /^本輪依鎖死規則/u,
  /^排序固定/u,
  /總表核對通過/u,
  /^(累積總派單數|累積派單總成交數|累積追續總成交數|當日續單金額|本月業績|追續單總金額|當日取消退貨)/u,
  /^已離職[:：]/u,
  /^已離職人員/u,
  /^群組超精簡版/u,
  /^📣【/u,
  /^本輪最終結論如下[:：]?$/u,
  /^\d{1,2}\/\d{1,2}\s*結算資料已核對完成/u,
  /^\d{1,2}\/\d{1,2}\s*正式派單順序，以本則公告為準/u
];

function trimTrailingPunctuation(value) {
  return cleanText(value).replace(/[。．！!？?；;]+$/u, '').trim();
}

function normalizeAuditNoteLine(value) {
  const text = cleanText(value);
  if (!text) return '';
  if (AUDIT_NOTE_EXCLUDE_PATTERNS.some((pattern) => pattern.test(text))) return '';
  if (!AUDIT_NOTE_INCLUDE_PATTERNS.some((pattern) => pattern.test(text))) return '';
  return trimTrailingPunctuation(text);
}

function collectMeaningfulAuditNotes(values = []) {
  return uniqueTexts(safeArray(values).map(normalizeAuditNoteLine).filter(Boolean));
}

function buildCompactAuditNotes(notes = []) {
  const normalized = collectMeaningfulAuditNotes(notes).map(trimTrailingPunctuation);
  return normalized.length ? normalized.join('；') : '無補充說明';
}

function normalizeMetricBag(source, metrics) {
  return Object.fromEntries(metrics.map((metric) => [metric, toNumber(source?.[metric])]));
}

function buildPlatformKey(platformName) {
  if (PLATFORM_NAME_TO_KEY[platformName]) return PLATFORM_NAME_TO_KEY[platformName];
  return normalizeName(platformName).toLowerCase() || 'platform';
}

function normalizePlatform(platformInput = {}, fallbackName = '') {
  const platformName = cleanText(platformInput.platformName || platformInput.平台名稱 || fallbackName);
  if (!platformName) return null;

  const metricsSource = platformInput.metrics || platformInput.數據 || platformInput;
  const passed =
    typeof platformInput.passed === 'boolean'
      ? platformInput.passed
      : typeof platformInput.通過 === 'boolean'
      ? platformInput.通過
      : cleanText(platformInput.passed || platformInput.通過).toUpperCase() === 'PASS';

  return {
    platformKey: cleanText(platformInput.platformKey || buildPlatformKey(platformName)),
    platformName,
    passed,
    metrics: normalizeMetricBag(metricsSource, AUDIT_METRICS)
  };
}

function normalizeOfficialPlatformMetrics(value = {}) {
  return {
    累積總派單數: toNumber(value.cumulativeDispatch ?? value.累積總派單數),
    累積派單總成交數: toNumber(value.cumulativeDispatchDeals ?? value.累積派單總成交數),
    累積追續總成交數: toNumber(value.cumulativeRenewalDeals ?? value.累積追續總成交數),
    當日續單金額: toNumber(value.dailyRenewalAmount ?? value.當日續單金額),
    本月業績: toNumber(value.monthlyRevenue ?? value.本月業績),
    追續單總金額: toNumber(value.totalRenewalAmount ?? value.追續單總金額),
    實收總金額: toNumber(value.actualRevenue ?? value.實收總金額)
  };
}

function normalizeOfficialPlatforms(rawPlatforms = {}) {
  return Object.fromEntries(
    Object.entries(rawPlatforms || {}).map(([platformName, value]) => [
      platformName,
      {
        ...normalizeOfficialPlatformMetrics(value),
        通過: true
      }
    ])
  );
}

function normalizeExcludedEmployees(value) {
  const seen = new Set();
  return safeArray(value)
    .map((item) => ({
      name: splitNameTags(item?.name || item?.姓名).name,
      reason: cleanText(item?.reason || item?.原因 || '已離職')
    }))
    .filter((item) => {
      if (!item.name || seen.has(item.name)) return false;
      seen.add(item.name);
      return true;
    });
}

function normalizeAudit(rawAudit = {}, fallbackResult = '') {
  const raw = rawAudit || {};
  const platforms = Array.isArray(raw.platforms)
    ? raw.platforms
        .map((platform) => normalizePlatform(platform))
        .filter(Boolean)
    : Object.entries(raw)
        .filter(([key, value]) => !RESERVED_AUDIT_KEYS.includes(key) && value && typeof value === 'object')
        .map(([platformName, platformValue]) => normalizePlatform(platformValue, platformName))
        .filter(Boolean);

  const explicitResult = cleanText(raw.result || raw.結果 || fallbackResult).toUpperCase();
  const result = explicitResult || (platforms.length > 0 && platforms.every((platform) => platform.passed) ? 'PASS' : 'FAIL');

  return {
    result,
    rule: cleanText(raw.rule || raw.規則 || DEFAULT_AUDIT_RULE) || DEFAULT_AUDIT_RULE,
    platforms,
    notes: normalizeStringArray(raw.notes || raw.特別說明 || raw.備註),
    excludedEmployees: normalizeExcludedEmployees(raw.excludedEmployees || raw['審計列示不入派單'])
  };
}

function normalizeSummaryBoard(rawSummary = {}) {
  return Object.fromEntries(SUMMARY_METRICS.map((metric) => [metric, toNumber(rawSummary?.[metric])]));
}

function normalizeOfficialSummaryBoard(rawStats = {}) {
  return normalizeSummaryBoard({
    累積總派單數: rawStats.totalCalls,
    累積派單總成交數: rawStats.dispatchCalls,
    累積追續總成交數: rawStats.renewalCalls,
    當日續單金額: rawStats.dailyRenewalAmount,
    本月業績: rawStats.monthlyRevenue,
    追續單總金額: rawStats.renewalAmount,
    實收總金額: rawStats.actualRevenue,
    當日取消退貨: rawStats.cancellations
  });
}

function firstDefined(source, keys) {
  for (const key of keys) {
    if (source && source[key] !== undefined && source[key] !== null && source[key] !== '') {
      return source[key];
    }
  }
  return undefined;
}

function normalizeRankingRow(row = {}, index = 0) {
  const tagged = splitNameTags(row.name || row.姓名);
  const metricsSource = row.metrics || row;
  const marker = cleanText(row.標記 || row.marker);
  const advice = cleanText(row.advice || row.建議 || row.text);

  return {
    rank: Math.max(0, Math.trunc(toNumber(firstDefined(row, ['rank', '名次']) ?? index + 1))),
    name: tagged.name,
    isNew:
      typeof row.isNew === 'boolean'
        ? row.isNew
        : tagged.isNew || marker.includes('新人'),
    group: cleanText(row.group || row.分級).toUpperCase(),
    prevRank: toNumber(firstDefined(row, ['prevRank', '上期名次', 'previousRank'])),
    movement: cleanText(row.movement || row.move || row.異動 || 'flat').toLowerCase(),
    metrics: {
      正式權重分數: toNumber(firstDefined(metricsSource, ['正式權重分數', 'weightedScore', 'totalScore'])),
      實收: toNumber(firstDefined(metricsSource, ['實收', '實收總金額', '實收總業績', 'actualRevenue'])),
      總業績: toNumber(firstDefined(metricsSource, ['總業績', 'totalRevenue', '全部總業績'])),
      續單金額: toNumber(firstDefined(metricsSource, ['續單金額', '追續金額', '追續單金額', 'renewalRevenue'])),
      追續成交總數: toNumber(firstDefined(metricsSource, ['追續成交總數', '追續單數', 'renewalDeals', '追單'])),
      追續客單價: toNumber(firstDefined(metricsSource, ['追續客單價', 'avgRenewal', 'renewalAvgPrice'])),
      派單成交總通數: toNumber(firstDefined(metricsSource, ['派單成交總通數', 'dispatchDeals', '派單成交']))
    },
    advice
  };
}

function normalizeGroups(rawGroups = {}) {
  return Object.fromEntries(
    GROUP_KEYS.map((groupKey) => [
      groupKey,
      safeArray(rawGroups?.[groupKey])
        .map((name) => splitNameTags(name).name)
        .filter(Boolean)
    ])
  );
}

function normalizeAdviceEntries(rawAdvice = []) {
  return safeArray(rawAdvice)
    .map((entry) => ({
      name: splitNameTags(entry?.name || entry?.姓名).name,
      rank: Math.max(0, Math.trunc(toNumber(entry?.rank || entry?.名次))),
      group: cleanText(entry?.group || entry?.分級).toUpperCase(),
      text: cleanText(entry?.text || entry?.建議)
    }))
    .filter((entry) => entry.name);
}

function buildExpectedGroups(rankings) {
  const groups = createEmptyGroups();
  safeArray(rankings).forEach((row) => {
    if (groups[row.group]) groups[row.group].push(row.name);
  });
  return groups;
}

function compareRankingRows(left, right) {
  for (const metric of RANKING_METRICS) {
    const delta = Number(right.metrics?.[metric] || 0) - Number(left.metrics?.[metric] || 0);
    if (delta !== 0) {
      return delta;
    }
  }
  return 0;
}

function resolveGroupByRank(rank) {
  if (rank >= GROUP_RANK_POLICY.A1.min && rank <= GROUP_RANK_POLICY.A1.max) return 'A1';
  if (rank >= GROUP_RANK_POLICY.A2.min && rank <= GROUP_RANK_POLICY.A2.max) return 'A2';
  if (rank >= GROUP_RANK_POLICY.B.min && rank <= GROUP_RANK_POLICY.B.max) return 'B';
  return 'C';
}

    }))
    .map(({ __sourceIndex, ...row }) => row);
}

function calculateWeightedScores(rankings) {
  const people = rankings.filter((r) => r.name);
  if (people.length === 0) return rankings;

  const weights = Object.fromEntries(WEIGHTING_POLICY.weights.map((item) => [item.key, item.weight]));
  const maxes = Object.fromEntries(
    WEIGHTING_POLICY.weights.map((item) => [
      item.key,
      Math.max(...people.map((row) => Number(row.metrics?.[item.key] || 0)), 0)
    ])
  );

  people.forEach((row) => {
    const m = row.metrics || {};
    m.追續客單價 = Number(m.追續成交總數 || 0) > 0
      ? Number((Number(m.續單金額 || 0) / Number(m.追續成交總數 || 0)).toFixed(2))
      : 0;
  });

  maxes.追續客單價 = Math.max(...people.map((row) => Number(row.metrics?.追續客單價 || 0)), 0);

  people.forEach((row) => {
    const m = row.metrics || {};
    const total = WEIGHTING_POLICY.weights.reduce((sum, item) => {
      const maxValue = maxes[item.key] || 0;
      if (maxValue <= 0) return sum;
      const val = Math.max(0, Number(m[item.key] || 0));
      const score = (val / maxValue) * weights[item.key];
      return sum + (Number.isFinite(score) ? score : 0);
    }, 0);
    m.正式權重分數 = Number.isFinite(total) ? Number(total.toFixed(2)) : 0;
  });

  return rankings;
}

function syncGroups(rankings, providedGroups, options = {}) {
  const updatedRankings = options.preserveRankingOrder
    ? normalizePreservedRankingOrder(rankings, providedGroups)
    : normalizeRankingOrder(calculateWeightedScores(rankings));

  return {
    rankings: updatedRankings,
    groups: buildExpectedGroups(updatedRankings)
  };
}

function syncAdvice(rankings, providedAdvice) {
  const adviceMap = new Map();
  safeArray(providedAdvice).forEach((entry) => {
    adviceMap.set(entry.name, entry);
  });

  const updatedRankings = safeArray(rankings).map((row, index) => ({
    ...row,
    advice: row.advice || adviceMap.get(row.name)?.text || buildProportionalAdvice(row, safeArray(rankings), index)
  }));

  const adviceList = updatedRankings.map((row) => ({
    name: row.name,
    rank: row.rank,
    group: row.group,
    text: row.advice
  }));

  return {
    rankings: updatedRankings,
    adviceList
  };
}

function buildProportionalAdvice(row, rankings, index) {
  const above = rankings[index - 1];
  const below = rankings[index + 1];
  const score = Number(row.metrics?.正式權重分數 || 0);
  const aboveScore = Number(above?.metrics?.正式權重分數 || 0);
  const belowScore = Number(below?.metrics?.正式權重分數 || 0);
  const gapUp = above && aboveScore > 0 ? `${((aboveScore - score) / aboveScore * 100).toFixed(1)}%` : '';
  const gapDown = below && score > 0 ? `${((score - belowScore) / score * 100).toFixed(1)}%` : '';
  const renewal = Number(row.metrics?.續單金額 || 0);
  const revenue = Number(row.metrics?.總業績 || 0);
  const renewalDeals = Number(row.metrics?.追續成交總數 || 0);
  const dispatchDeals = Number(row.metrics?.派單成交總通數 || 0);
  const mainMetric = renewal >= revenue * 0.55
    ? '追續單金額'
    : dispatchDeals >= renewalDeals
    ? '派單成交'
    : '實收業績';

  if (row.rank === 1) {
    return `目前權重分數第一，與第二名差距 ${gapDown || '0%'}。今天繼續把${mainMetric}補厚，才能穩住派單優先權。`;
  }
  if (row.rank <= GROUP_RANK_POLICY.A1.max) {
    return `你在 A1 主力區，距前一名 ${gapUp}。今天主攻${mainMetric}，一筆有效成交就能把權重分數再往前推。`;
  }
  if (row.rank <= GROUP_RANK_POLICY.A2.max) {
    return `你在 A2 主力區，距前一名 ${gapUp}，後方差距 ${gapDown || '尚穩'}。今天用${mainMetric}守位並爭取前壓。`;
  }
  if (row.rank <= GROUP_RANK_POLICY.B.max) {
    return `你在 B 組競爭帶，距前一名 ${gapUp}。今天先把${mainMetric}做出明顯增量，權重分數才會動。`;
  }
  return `你在 C 組補位區，今天先讓數字落地。從${mainMetric}補一筆開始，比例分數就會往上。`;
}

function resolveTitle(explicitTitle, fallbackTitle, settlementDate, dispatchDate) {
  const preferred = cleanText(explicitTitle || fallbackTitle);
  if (preferred) return preferred;
  if (settlementDate && dispatchDate) {
    return `AI 派單公告｜${formatMonthDay(settlementDate)} 結算 → ${formatMonthDay(dispatchDate)} 正式派單順序`;
  }
  return 'AI 派單公告';
}

function buildAuditStatusText(report) {
  const platformCount = Array.isArray(report.audit?.platforms) ? report.audit.platforms.length : 0;
  const auditStatus = cleanText(report.auditResult || report.audit?.result).toUpperCase();

  if (!platformCount) {
    return auditStatus === 'PASS' ? '審計資料已完成核對' : '審計資料待補齊';
  }

  if (auditStatus === 'PASS') {
    return `${platformCount}平台總表全數核對通過`;
  }

  return `${platformCount}平台總表已完成核對，仍有異常待處理`;
}

function buildDefaultFinalConfirmations(report) {
  const platformNote = buildAuditStatusText(report);
  const excluded = report.audit.excludedEmployees || [];
  const excludedLine = excluded.length
    ? `已離職人員${excluded.map((entry) => entry.name).join('、')}只列審計，不入正式派單`
    : '';

  return uniqueTexts([
    `${formatMonthDay(report.settlementDate)} 結算資料已核對完成`,
    platformNote,
    ...(report.audit.notes || []),
    excludedLine,
    `${formatMonthDay(report.dispatchDate)} 正式派單順序，以本則公告為準`
  ]);
}

function buildGroupShortText(report) {
  const top10Text = report.rankings
    .slice(0, 10)
    .map((row) => `${row.rank}${row.name}`)
    .join(' ');

  const noteText = buildCompactAuditNotes(report.audit.notes || []);
  const excludedEmps = report.audit.excludedEmployees || [];
  const excludedLine = excludedEmps.length
    ? `已離職：${excludedEmps.map((entry) => entry.name).join('、')}，只列審計不入派單。`
    : '本輪無離職列示。';
  const auditStatusText = buildAuditStatusText(report);

  return [
    `📣【AI 派單公告｜${formatMonthDay(report.settlementDate)} 結算 → ${formatMonthDay(report.dispatchDate)} 正式派單】`,
    `審計 ${report.auditResult}，${auditStatusText}，${noteText}。`,
    excludedLine,
    top10Text ? `正式前10名：${top10Text}。` : '',
    `A1：${report.groups.A1.join('、')}。`,
    `A2：${report.groups.A2.join('、')}。`,
    `B組：${report.groups.B.join('、')}。`,
    `C組：${report.groups.C.join('、')}。`,
    '正式派單順序以本則為準。'
  ]
    .filter(Boolean)
    .join('');
}

function syncNarrativeFields(report) {
  if (!report || typeof report !== 'object') return report;

  report.audit = report.audit || {};
  report.audit.notes = collectMeaningfulAuditNotes([
    ...safeArray(report.audit.notes),
    ...safeArray(report.finalConfirmations)
  ]);
  report.finalConfirmations = buildDefaultFinalConfirmations(report);
  report.groupShortText = buildGroupShortText(report);
  return report;
}

function extractJsonCandidates(sourceText) {
  const text = String(sourceText ?? '').trim();
  const candidates = new Set();
  if (!text) return [];

  candidates.add(text);

  for (const match of text.matchAll(/```(?:json)?\s*([\s\S]*?)```/giu)) {
    if (cleanText(match[1])) candidates.add(cleanText(match[1]));
  }

  const firstBrace = text.indexOf('{');
  const lastBrace = text.lastIndexOf('}');
  if (firstBrace >= 0 && lastBrace > firstBrace) {
    candidates.add(text.slice(firstBrace, lastBrace + 1));
  }

  return [...candidates];
}

function tryParseJsonPayload(sourceText) {
  for (const candidate of extractJsonCandidates(sourceText)) {
    try {
      return JSON.parse(candidate);
    } catch {
      continue;
    }
  }
  return null;
}

function unwrapSourcePayload(payload) {
  if (!payload || typeof payload !== 'object') return null;
  if (payload.title || payload.公告標題 || payload.rankings || payload.ranking || payload.正式名次 || payload.overallStats) return payload;
  if (payload.data) return unwrapSourcePayload(payload.data);
  if (payload.report) return unwrapSourcePayload(payload.report);
  if (payload.standardData) return unwrapSourcePayload(payload.standardData);
  return null;
}

function splitSections(sourceText) {
  const sections = new Map();
  let currentKey = '__root__';
  sections.set(currentKey, []);

  String(sourceText ?? '')
    .replace(/\r/g, '')
    .split('\n')
    .forEach((line) => {
      const trimmed = cleanText(line);
      if (!trimmed || /^[-─]{4,}$/u.test(trimmed)) return;

      if (/^【[^】]+】$/u.test(trimmed) || /^[一二三四五六七八九十]+、.+$/u.test(trimmed)) {
        currentKey = trimmed;
        if (!sections.has(currentKey)) sections.set(currentKey, []);
        return;
      }

      sections.get(currentKey).push(trimmed);
    });

  return sections;
}

function findSectionLines(sections, keywordSets) {
  for (const [title, lines] of sections.entries()) {
    if (title === '__root__') continue;
    if (keywordSets.some((keywords) => keywords.every((keyword) => title.includes(keyword)))) {
      return lines;
    }
  }
  return [];
}

function normalizeMetricLabel(label) {
  const normalized = normalizeName(String(label).replace(/[【】]/g, ''));
  return rankingMetricAliases.get(normalized) || summaryMetricAliases.get(normalized) || '';
}

function parseMetricSegment(segment) {
  const match = cleanText(segment).match(/^(?:【)?([^】:：=＝]+)(?:】)?\s*[:：=＝]?\s*(-?[\d,，.]+)/u);
  if (!match) return null;
  return {
    label: normalizeMetricLabel(match[1]),
    value: toNumber(match[2])
  };
}

function parseRankingSection(lines) {
  const rankings = [];

  safeArray(lines).forEach((line) => {
    const parts = line.split(/[｜|]/u).map((part) => cleanText(part)).filter(Boolean);
    if (!parts.length) return;

    let rank = 0;
    let rawName = '';
    let metricParts = parts.slice();

    if (/^\d+$/u.test(parts[0]) && parts[1]) {
      rank = Number(parts[0]);
      rawName = parts[1];
      metricParts = parts.slice(2);
    } else {
      const headerMatch = parts[0].match(/^(\d+)\s*[、.．]?\s*(.+)$/u);
      if (!headerMatch) return;
      rank = Number(headerMatch[1]);
      rawName = headerMatch[2];
      metricParts = parts.slice(1);
    }

    const tagged = splitNameTags(rawName);
    const metrics = {
      正式權重分數: 0,
      實收: 0,
      總業績: 0,
      續單金額: 0,
      追續成交總數: 0,
      追續客單價: 0,
      派單成交總通數: 0
    };

    metricParts.forEach((part) => {
      const metric = parseMetricSegment(part);
      if (!metric?.label || !Object.prototype.hasOwnProperty.call(metrics, metric.label)) return;
      metrics[metric.label] = metric.value;
    });

    rankings.push({
      rank,
      name: tagged.name,
      isNew: tagged.isNew,
      group: '',
      metrics,
      advice: ''
    });
  });

  return rankings;
}

function extractGroupKey(line) {
  const match = cleanText(line).match(/\b(A1|A2|B|C)\b/u);
  return match?.[1] || '';
}

function parseNamesFromText(text) {
  return cleanText(text)
    .replace(/^\d+\s*[、.．]\s*/u, '')
    .split(/[、,，]/u)
    .map((name) => splitNameTags(name).name)
    .filter(Boolean);
}

function parseGroupsSection(lines) {
  const groups = createEmptyGroups();
  let currentGroup = '';

  safeArray(lines).forEach((line) => {
    if (line.includes('審計列示')) {
      currentGroup = '';
      return;
    }

    const groupKey = extractGroupKey(line);
    if (groupKey) {
      currentGroup = groupKey;
      const inlineMatch = cleanText(line).match(/[：:](.+)$/u);
      if (inlineMatch) {
        groups[currentGroup].push(...parseNamesFromText(inlineMatch[1]));
      }
      return;
    }

    if (!currentGroup) return;
    groups[currentGroup].push(...parseNamesFromText(line));
  });

  GROUP_KEYS.forEach((groupKey) => {
    groups[groupKey] = uniqueTexts(groups[groupKey].map((name) => splitNameTags(name).name));
  });

  return groups;
}

function parseAdviceSection(lines) {
  const adviceList = [];
  let currentName = '';
  let currentRank = 0;
  let buffer = [];

  function flush() {
    if (!currentName) return;
    adviceList.push({
      name: currentName,
      rank: currentRank,
      group: '',
      text: cleanText(buffer.join(' '))
    });
    currentName = '';
    currentRank = 0;
    buffer = [];
  }

  safeArray(lines).forEach((line) => {
    const match = line.match(/^(\d+)\s*[｜|、.．]\s*(.+)$/u);
    if (match) {
      flush();
      currentRank = Number(match[1]);
      const inline = cleanText(match[2]).match(/^([^：:]+)[：:](.+)$/u);
      currentName = splitNameTags(inline?.[1] || match[2]).name;
      if (inline?.[2]) {
        buffer.push(cleanText(inline[2]));
      }
      return;
    }

    if (currentName) {
      buffer.push(line);
    }
  });

  flush();
  return adviceList;
}

function parseSummaryBoardFromText(sectionLines, fullText) {
  const source = [...safeArray(sectionLines), ...String(fullText || '').split('\n')].join('\n');
  const collected = {};

  for (const [alias, metric] of summaryMetricAliases.entries()) {
    const match = source.match(new RegExp(`${escapeRegExp(alias)}(?:】)?\\s*[：:=＝]?\\s*(-?[\\d,，]+)`, 'u'));
    if (match) collected[metric] = toNumber(match[1]);
  }

  return normalizeSummaryBoard(collected);
}

function parseAuditPlatformsFromLines(lines) {
  const platforms = [];
  let current = null;

  safeArray(lines).forEach((line) => {
    const platformName = Object.keys(PLATFORM_NAME_TO_KEY).find((name) => line.includes(name));
    if (platformName && line.includes('總表')) {
      current = {
        platformKey: PLATFORM_NAME_TO_KEY[platformName],
        platformName,
        passed: /PASS|通過/u.test(line),
        metrics: {}
      };
      platforms.push(current);
      return;
    }

    if (!current) return;

    for (const [alias, metric] of summaryMetricAliases.entries()) {
      if (!AUDIT_METRICS.includes(metric)) continue;
      const match = line.match(new RegExp(`${escapeRegExp(alias)}\\s*[：:=＝]?\\s*(-?[\\d,，]+)`, 'u'));
      if (match) current.metrics[metric] = toNumber(match[1]);
    }
  });

  return platforms.map((platform) => normalizePlatform(platform, platform.platformName)).filter(Boolean);
}

function sanitizeExcludedEmployeeSegment(segment) {
  return cleanText(segment)
    .replace(/(?:只列審計|審計列示|僅列審計).*/u, '')
    .replace(/(?:不入正式派單|不入派單).*/u, '')
    .replace(/[。；;]+$/u, '')
    .replace(/[，,]+$/u, '')
    .trim();
}

function parseExcludedEmployeesFromText(text) {
  const result = [];
  const directMatch = cleanText(text).match(/已離職[:：]\s*([^\n]+)/u);
  if (directMatch) {
    parseNamesFromText(sanitizeExcludedEmployeeSegment(directMatch[1])).forEach((name) => {
      result.push({ name, reason: '已離職' });
    });
  }

  const inlineMatch = cleanText(text).match(/已離職人員(.+?)只列審計/u);
  if (inlineMatch) {
    parseNamesFromText(sanitizeExcludedEmployeeSegment(inlineMatch[1])).forEach((name) => {
      result.push({ name, reason: '已離職' });
    });
  }

  return result;
}

function parseAuditFromText(sourceText, auditLines = [], extraNoteLines = []) {
  const resultMatch = String(sourceText || '').match(/審計結果[^A-Z]*(PASS|FAIL)/u);

  return {
    result: cleanText(resultMatch?.[1] || '').toUpperCase() || 'FAIL',
    rule: DEFAULT_AUDIT_RULE,
    platforms: parseAuditPlatformsFromLines(auditLines),
    notes: collectMeaningfulAuditNotes([
      ...safeArray(auditLines),
      ...safeArray(extraNoteLines)
    ]),
    excludedEmployees: normalizeExcludedEmployees(parseExcludedEmployeesFromText(sourceText))
  };
}

function parseTextPayload(sourceText, options = {}) {
  const sections = splitSections(sourceText);
  const auditLines = findSectionLines(sections, [['審計結論'], ['審計結果']]);
  const rankingLines = findSectionLines(sections, [['正式名次'], ['整合名次'], ['排行榜']]);
  const groupsLines = findSectionLines(sections, [['派單分級'], ['派單順序']]);
  const adviceLines = findSectionLines(sections, [['每人一句'], ['建議']]);
  const finalSectionLines = findSectionLines(sections, [['最後確認']]);
  const summaryLines = findSectionLines(sections, [['整合總盤'], ['總盤']]);
  const titleMatch = String(sourceText || '').match(/【([^】]*派單[^】]*)】/u);

  const extractedDates = extractDatesFromTitle(options.title || titleMatch?.[1] || '');
  const textSettlement = normalizeDateInput(options.settlementDate || extractedDates.settlementDate);
  const textDispatch = normalizeDateInput(options.dispatchDate || extractedDates.dispatchDate);
  const shortTextIndex = finalSectionLines.findIndex((line) => line.startsWith('群組超精簡版'));
  const shortTextLine =
    shortTextIndex >= 0
      ? cleanText(finalSectionLines[shortTextIndex].replace(/^群組超精簡版[:：]?\s*/u, '')) ||
        cleanText(finalSectionLines[shortTextIndex + 1])
      : '';
  const finalConfirmations = finalSectionLines.filter(
    (line) => !line.startsWith('群組超精簡版') && !line.startsWith('📣【')
  );

  return {
    title: cleanText(options.title || titleMatch?.[1]),
    settlementDate: textSettlement,
    dispatchDate: textDispatch,
    audit: parseAuditFromText(sourceText, auditLines, finalConfirmations),
    summaryBoard: parseSummaryBoardFromText(summaryLines, sourceText),
    rankings: parseRankingSection(rankingLines),
    groups: parseGroupsSection(groupsLines),
    adviceList: parseAdviceSection(adviceLines),
    finalConfirmations,
    groupShortText: shortTextLine,
    sourceText
  };
}

function buildReportFromPayload(payload, options = {}) {
  const source = payload || {};
  const fallbackDates = extractDatesFromTitle(cleanText(options.title || source.title || source.公告標題 || ''));
  const settlementDate = normalizeDateInput(
    options.settlementDate ||
      source.reportDate ||
      source.settlementDate ||
      source.日期資訊?.結算日 ||
      fallbackDates.settlementDate
  );
  const dispatchDate = normalizeDateInput(
    options.dispatchDate ||
      source.dispatchDate ||
      source.日期資訊?.派單日 ||
      fallbackDates.dispatchDate
  );

  const reportId = cleanText(options.reportId || source.reportId || buildReportId(settlementDate));
  const createdAt = cleanText(options.createdAt || source.createdAt || formatTaipeiTimestamp());
  const updatedAt = cleanText(options.updatedAt || source.updatedAt || createdAt);
  const title = resolveTitle(options.title, source.title || source.公告標題, settlementDate, dispatchDate);

  const auditSource = source.platforms
    ? {
        結果: source.audit?.status || 'PASS',
        規則: DEFAULT_AUDIT_RULE,
        ...normalizeOfficialPlatforms(source.platforms),
        特別說明: ['4/23 官方鎖定資料已依比例原則完成權重計分。'],
        審計列示不入派單: source.excludedEmployees || []
      }
    : source.audit || source.審計結論 || {};
  const audit = normalizeAudit(auditSource, source.auditResult);
  const summaryBoard = source.overallStats
    ? normalizeOfficialSummaryBoard(source.overallStats)
    : normalizeSummaryBoard(source.summaryBoard || source.整合總盤);
  const initialRankings = safeArray(source.rankings || source.ranking || source.正式名次)
    .map(normalizeRankingRow)
    .filter((row) => row.name);
  const normalizedGroups = normalizeGroups(source.groups || source.分級);
  const grouped = syncGroups(initialRankings, normalizedGroups, {
    preserveRankingOrder: Boolean(source.preserveRankingOrder || source.officialLock?.preserveRankingOrder)
  });
  const normalizedAdvice = normalizeAdviceEntries(source.adviceList || source.advice || source.每人一句建議 || source.建議);
  const advised = syncAdvice(grouped.rankings, normalizedAdvice);

  const report = createDispatchReport({
    reportId,
    version: Math.max(1, Math.trunc(toNumber(options.version || source.version || 1))),
    status: cleanText(options.status || source.status || 'published') || 'published',
    title,
    settlementDate,
    dispatchDate,
    auditResult: cleanText(source.auditResult || audit.result || 'FAIL').toUpperCase() || 'FAIL',
    createdAt,
    updatedAt,
    sourceText: String(options.sourceText ?? source.sourceText ?? '').replace(/\r/g, ''),
    audit,
    summaryBoard,
    rankings: advised.rankings,
    groups: grouped.groups,
    adviceList: advised.adviceList,
    finalConfirmations: normalizeStringArray(source.finalConfirmations || source.最後確認),
    groupShortText: cleanText(source.groupShortText || source.群組超精簡版)
  });

  report.auditResult = report.audit.result || report.auditResult;
  if (!report.finalConfirmations.length) {
    report.finalConfirmations = buildDefaultFinalConfirmations(report);
  }
  report.groupShortText = buildGroupShortText(report);

  return report;
}

function buildReportFromSource(input = {}) {
  const sourceText = String(input.sourceText ?? '').replace(/\r/g, '').trim();
  if (!sourceText) {
    throw new Error('sourceText 為必填');
  }

  const parsedJson = unwrapSourcePayload(tryParseJsonPayload(sourceText));
  if (parsedJson) {
    return buildReportFromPayload(parsedJson, {
      ...input,
      sourceText
    });
  }

  const textPayload = parseTextPayload(sourceText, input);
  return buildReportFromPayload(textPayload, {
    ...input,
    sourceText
  });
}

function createDefaultSeedInput() {
  const defaultAnnouncement = getDefaultAnnouncement();
  return {
    title: defaultAnnouncement.公告標題,
    settlementDate: normalizeDateInput(defaultAnnouncement.日期資訊?.結算日),
    dispatchDate: normalizeDateInput(defaultAnnouncement.日期資訊?.派單日),
    sourceText: defaultAnnouncement.sourceText || JSON.stringify(defaultAnnouncement, null, 2)
  };
}

function flattenRanking(row) {
  return {
    rank: row.rank,
    name: row.name,
    isNew: Boolean(row.isNew),
    group: row.group,
    totalRevenue: row.metrics?.總業績 || 0,
    renewalRevenue: row.metrics?.續單金額 || 0,
    renewalDeals: row.metrics?.追續成交總數 || 0,
    dispatchDeals: row.metrics?.派單成交總通數 || 0,
    weightedScore: row.metrics?.正式權重分數 || 0,
    actualRevenue: row.metrics?.實收 || 0,
    avgRenewal: row.metrics?.追續客單價 || 0,
    advice: row.advice
  };
}

function toLegacyStandardData(report) {
  const auditPlatforms = {};
  if (Array.isArray(report.audit?.platforms)) {
    report.audit.platforms.forEach((platform) => {
      auditPlatforms[platform.platformName] = {
        ...clone(platform.metrics),
        通過: platform.passed
      };
    });
  }
  
  const ranking = (report.rankings || []).map((row) => ({
    名次: row.rank,
    姓名: row.name,
    ...(row.isNew ? { 標記: '新人' } : {}),
    正式權重分數: row.metrics?.正式權重分數 || 0,
    實收: row.metrics?.實收 || 0,
    全部總業績: row.metrics?.總業績 || 0,
    總業績: row.metrics?.總業績 || 0,
    追續金額: row.metrics?.續單金額 || 0,
    續單金額: row.metrics?.續單金額 || 0,
    追續單數: row.metrics?.追續成交總數 || 0,
    追續成交總數: row.metrics?.追續成交總數 || 0,
    追續客單價: row.metrics?.追續客單價 || 0,
    派單成交總通數: row.metrics?.派單成交總通數 || 0,
    分級: row.group,
    建議: row.advice
  }));

  ranking.sort((a, b) => {
    if ((b.正式權重分數 || 0) !== (a.正式權重分數 || 0)) {
      return (b.正式權重分數 || 0) - (a.正式權重分數 || 0);
    }
    if ((b.實收 || 0) !== (a.實收 || 0)) {
      return (b.實收 || 0) - (a.實收 || 0);
    }
    if ((b.續單金額 || 0) !== (a.續單金額 || 0)) {
      return (b.續單金額 || 0) - (a.續單金額 || 0);
    }
    if ((b.總業績 || 0) !== (a.總業績 || 0)) {
      return (b.總業績 || 0) - (a.總業績 || 0);
    }
    if ((b.追續客單價 || 0) !== (a.追續客單價 || 0)) {
      return (b.追續客單價 || 0) - (a.追續客單價 || 0);
    }
    return (b.追續成交總數 || 0) - (a.追續成交總數 || 0);
  });

  return {
    公告標題: report.title,
    日期資訊: {
      結算日: formatMonthDay(report.settlementDate),
      派單日: formatMonthDay(report.dispatchDate)
    },
    審計結論: {
      結果: report.audit.result,
      規則: report.audit.rule,
      ...auditPlatforms,
      特別說明: clone(report.audit.notes),
      審計列示不入派單: (report.audit?.excludedEmployees || []).map((entry) => ({
        姓名: entry.name,
        原因: entry.reason
      }))
    },
    整合總盤: clone(report.summaryBoard),
    正式名次: ranking,
    分級: clone(report.groups),
    最後確認: clone(report.finalConfirmations),
    群組超精簡版: report.groupShortText
  };
}

function buildPresentation(report) {
  const legacyRanking = toLegacyStandardData(report).正式名次;

  return {
    top5: legacyRanking.slice(0, 5),
    top10: legacyRanking.slice(0, 10),
    compactTable: legacyRanking.slice(10),
    retired: (report.audit?.excludedEmployees || []).map((entry) => ({
      姓名: entry.name,
      原因: entry.reason
    })),
    summaryCards: report.summaryBoard['實收總金額']
      ? [
          ['實收總金額', report.summaryBoard['實收總金額']],
          ['追續單金額', report.summaryBoard['追續單總金額'] || 0],
          ['全部總業績', report.summaryBoard['本月業績'] || 0],
          ['追續單成交', report.summaryBoard['累積追續總成交數'] || 0],
          ['累積派單成交', report.summaryBoard['累積派單總成交數'] || 0],
          ['取消退貨', report.summaryBoard['當日取消退貨'] || 0]
        ]
      : [
          ['累積總派單數', report.summaryBoard['累積總派單數'] || 0],
          ['累積派單總成交數', report.summaryBoard['累積派單總成交數'] || 0],
          ['累積追續總成交數', report.summaryBoard['累積追續總成交數'] || 0],
          ['當日續單金額', report.summaryBoard['當日續單金額'] || 0],
          ['本月業績', report.summaryBoard['本月業績'] || 0],
          ['追續單總金額', report.summaryBoard['追續單總金額'] || 0]
        ],
    cancellationAmount: report.summaryBoard['當日取消退貨'] || 0
  };
}

function buildSnapshotSummary(report) {
  return {
    審計結果: report.auditResult,
    正式人數: (report.rankings || []).length,
    離職列示人數: (report.audit?.excludedEmployees || []).length,
    本月業績: report.summaryBoard['本月業績'] || 0,
    totalRevenue: report.summaryBoard['本月業績'] || 0,
    renewalRevenue: report.summaryBoard['追續單總金額'] || report.summaryBoard['當日續單金額'] || 0,
    renewalDeals: report.summaryBoard['累積追續總成交數'] || 0,
    totalPeople: (report.rankings || []).length,
    activePeople: (report.rankings || []).length
  };
}

function buildLegacyValidation(validation) {
  return {
    ok: validation.ok,
    status: validation.status,
    errors: (validation.errors || []).map((error) => error.reason),
    warnings: (validation.warnings || []).map((warning) => warning.reason),
    summary: clone(validation.summary),
    rules: {
      sourceOfTruth: 'backend',
      frontendMustNotCompute: true,
      rankingOrder: RANKING_METRICS.join(' → ')
    }
  };
}

function buildLegacySnapshot(report, validation, options = {}) {
  const snapshotReport = syncNarrativeFields(clone(report));
  const legacyStandardData = toLegacyStandardData(snapshotReport);
  const executionId = buildExecutionId(snapshotReport.updatedAt || snapshotReport.createdAt);

  return {
    executionId,
    completedAt: snapshotReport.updatedAt,
    operator: cleanText(options.operator || 'system'),
    source: cleanText(options.source || 'dispatch-report-v1'),
    persisted: Boolean(options.persisted),
    status: snapshotReport.status,
    systemName: SERVICE_NAME,
    systemVersion: API_VERSION,
    rawText: snapshotReport.sourceText,
    standardData: legacyStandardData,
    validation: buildLegacyValidation(validation),
    summary: buildSnapshotSummary(snapshotReport),
    presentation: buildPresentation(snapshotReport),
    ranking: (snapshotReport.rankings || []).map(flattenRanking),
    groups: clone(snapshotReport.groups),
    audit: {
      status: snapshotReport.audit.result,
      result: snapshotReport.audit.result,
      platforms: clone(snapshotReport.audit.platforms),
      notes: clone(snapshotReport.audit.notes),
      excludedEmployees: clone(snapshotReport.audit.excludedEmployees)
    },
    confirmation: {
      status: validation.status,
      message: validation.ok ? '正式派單資料已通過驗證' : validation.errors[0]?.reason || '資料驗證失敗',
      errors: validation.errors.map((error) => error.reason)
    },
    announcement: snapshotReport.groupShortText,
    broadcast: {
      title: snapshotReport.title,
      text: snapshotReport.groupShortText,
      scriptText: snapshotReport.groupShortText
    },
    consistencyGuard: {
      status: validation.ok ? 'PASS' : 'FAIL',
      contradictionCount: validation.errors.length,
      contradictions: validation.errors.map((error) => error.reason),
      backendSourceLocked: false,
      frontendComputationAllowed: true,
      frontendRewriteAllowed: true
    },
    frontendLock: {
      sourceOfTruth: 'hybrid',
      frontendMustUseBackendSnapshot: false,
      frontendMayComputeRanking: true,
      frontendMayComputeGroups: true,
      frontendMayRewriteAnnouncement: true,
      frontendMayRewriteAudit: true
    },
    scoringPolicy: clone(WEIGHTING_POLICY),
    rules: clone(FRONTEND_LOCK_RULES),
    reportId: snapshotReport.reportId,
    title: snapshotReport.title
  };
}

function buildTop10Data(report) {
  return {
    reportId: report.reportId,
    items: report.rankings.slice(0, 10).map((row) => ({
      rank: row.rank,
      name: row.name,
      group: row.group,
      總業績: row.metrics.總業績,
      續單金額: row.metrics.續單金額,
      追續成交總數: row.metrics.追續成交總數,
      派單成交總通數: row.metrics.派單成交總通數
    }))
  };
}

function buildGroupsData(report) {
  return {
    reportId: report.reportId,
    ...clone(report.groups)
  };
}

function buildHealthData() {
  return {
    service: SERVICE_NAME,
    version: API_VERSION,
    time: formatTaipeiTimestamp()
  };
}

function formatNumber(value) {
  return numberFormatter.format(toNumber(value));
}

module.exports = {
  buildAuditStatusText,
  buildDefaultFinalConfirmations,
  buildExpectedGroups,
  buildGroupShortText,
  buildGroupsData,
  buildHealthData,
  buildLegacySnapshot,
  collectMeaningfulAuditNotes,
  buildPresentation,
  buildReportFromSource,
  buildSnapshotSummary,
  buildTop10Data,
  calculateWeightedScores,
  clone,
  createDefaultSeedInput,
  createEmptyGroups,
  formatNumber,
  syncNarrativeFields,
  toLegacyStandardData
};
