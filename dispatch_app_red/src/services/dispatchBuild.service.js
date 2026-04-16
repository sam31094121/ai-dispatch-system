const defaultAnnouncement = require('../../shared/default-announcement.json');
const {
  AUDIT_METRICS,
  DEFAULT_AUDIT_RULE,
  FRONTEND_LOCK_RULES,
  GROUP_KEYS,
  PLATFORM_NAME_TO_KEY,
  RANKING_METRICS,
  RESERVED_AUDIT_KEYS,
  SERVICE_NAME,
  API_VERSION,
  SUMMARY_METRICS
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

const numberFormatter = new Intl.NumberFormat('zh-TW');
const cloneValue = typeof globalThis.structuredClone === 'function'
  ? (value) => globalThis.structuredClone(value)
  : (value) => JSON.parse(JSON.stringify(value));

const rankingMetricAliases = new Map([
  ['總業績', '總業績'],
  ['業績', '總業績'],
  ['總盤', '總業績'],
  ['續單', '續單金額'],
  ['續單金額', '續單金額'],
  ['追單', '追續成交總數'],
  ['追續', '追續成交總數'],
  ['追續成交總數', '追續成交總數'],
  ['追續總數', '追續成交總數'],
  ['派單成交', '派單成交總通數'],
  ['派單成交總數', '派單成交總通數'],
  ['派單成交總通數', '派單成交總通數']
]);

const summaryMetricAliases = new Map([
  ...SUMMARY_METRICS.map((metric) => [metric, metric]),
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

function normalizeExcludedEmployees(value) {
  return safeArray(value)
    .map((item) => ({
      name: splitNameTags(item?.name || item?.姓名).name,
      reason: cleanText(item?.reason || item?.原因 || '已離職')
    }))
    .filter((item) => item.name);
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
    metrics: {
      總業績: toNumber(firstDefined(metricsSource, ['總業績', 'totalRevenue'])),
      續單金額: toNumber(firstDefined(metricsSource, ['續單金額', 'renewalRevenue'])),
      追續成交總數: toNumber(firstDefined(metricsSource, ['追續成交總數', 'renewalDeals', '追單'])),
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

function hasProvidedGroups(groups) {
  return GROUP_KEYS.some((groupKey) => (groups[groupKey] || []).length > 0);
}

function buildExpectedGroups(rankings) {
  const groups = createEmptyGroups();
  safeArray(rankings).forEach((row) => {
    if (groups[row.group]) groups[row.group].push(row.name);
  });
  return groups;
}

function syncGroups(rankings, providedGroups) {
  const membership = new Map();
  GROUP_KEYS.forEach((groupKey) => {
    safeArray(providedGroups[groupKey]).forEach((name) => {
      membership.set(name, groupKey);
    });
  });

  const updatedRankings = safeArray(rankings).map((row) => ({
    ...row,
    group: row.group || membership.get(row.name) || ''
  }));

  return {
    rankings: updatedRankings,
    groups: hasProvidedGroups(providedGroups) ? providedGroups : buildExpectedGroups(updatedRankings)
  };
}

function syncAdvice(rankings, providedAdvice) {
  const adviceMap = new Map();
  safeArray(providedAdvice).forEach((entry) => {
    adviceMap.set(entry.name, entry);
  });

  const updatedRankings = safeArray(rankings).map((row) => ({
    ...row,
    advice: row.advice || adviceMap.get(row.name)?.text || ''
  }));

  const adviceList = safeArray(providedAdvice).length
    ? safeArray(providedAdvice).map((entry) => ({
        name: entry.name,
        rank: entry.rank || updatedRankings.find((row) => row.name === entry.name)?.rank || 0,
        group: entry.group || updatedRankings.find((row) => row.name === entry.name)?.group || '',
        text: entry.text
      }))
    : updatedRankings.map((row) => ({
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

function resolveTitle(explicitTitle, fallbackTitle, settlementDate, dispatchDate) {
  const preferred = cleanText(explicitTitle || fallbackTitle);
  if (preferred) return preferred;
  if (settlementDate && dispatchDate) {
    return `AI 派單公告｜${formatMonthDay(settlementDate)} 結算 → ${formatMonthDay(dispatchDate)} 正式派單順序`;
  }
  return 'AI 派單公告';
}

function buildDefaultFinalConfirmations(report) {
  const platformNote = report.audit.platforms.length
    ? `${report.audit.platforms.length}平台總表全部通過`
    : '審計資料已核對完成';
  const excludedLine = report.audit.excludedEmployees.length
    ? `已離職人員${report.audit.excludedEmployees.map((entry) => entry.name).join('、')}只列審計，不入正式派單`
    : '';

  return uniqueTexts([
    `${formatMonthDay(report.settlementDate)} 結算資料已核對完成`,
    platformNote,
    ...report.audit.notes,
    excludedLine,
    `${formatMonthDay(report.dispatchDate)} 正式派單順序，以本則公告為準`
  ]);
}

function buildGroupShortText(report) {
  const top10Text = report.rankings
    .slice(0, 10)
    .map((row) => `${row.rank}${row.name}`)
    .join(' ');

  const noteText = report.audit.notes.length ? report.audit.notes.join('、') : '無補充說明';
  const excluded = report.audit.excludedEmployees.length
    ? `已離職：${report.audit.excludedEmployees.map((entry) => entry.name).join('、')}，只列審計不入派單。`
    : '本輪無離職列示。';

  return [
    `📣【AI 派單公告｜${formatMonthDay(report.settlementDate)} 結算 → ${formatMonthDay(report.dispatchDate)} 正式派單】`,
    `審計 ${report.auditResult}，${report.audit.platforms.length}平台總表全數核對通過，${noteText}。`,
    excluded,
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
  if (payload.title || payload.公告標題 || payload.rankings || payload.正式名次) return payload;
  if (payload.data) return unwrapSourcePayload(payload.data);
  if (payload.report) return unwrapSourcePayload(payload.report);
  if (payload.standardData) return unwrapSourcePayload(payload.standardData);
  return null;
}

function looksLikeLegacyPayload(payload) {
  return Boolean(payload?.公告標題 || payload?.正式名次 || payload?.整合總盤 || payload?.審計結論);
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

      if (/^【[^】]+】$/u.test(trimmed)) {
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
  const match = cleanText(segment).match(/^(?:【)?([^】:：=＝]+)(?:】)?\s*[:：=＝]?\s*(-?[\d,，]+)$/u);
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
      總業績: 0,
      續單金額: 0,
      追續成交總數: 0,
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
      currentName = splitNameTags(match[2]).name;
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
    const match = source.match(new RegExp(`${escapeRegExp(alias)}\\s*[：:=＝]?\\s*(-?[\\d,，]+)`, 'u'));
    if (match) collected[metric] = toNumber(match[1]);
  }

  return normalizeSummaryBoard(collected);
}

function parsePlatformsFromText(text) {
  const lines = String(text || '')
    .replace(/\r/g, '')
    .split('\n')
    .map((line) => cleanText(line))
    .filter(Boolean);

  return Object.entries(PLATFORM_NAME_TO_KEY)
    .map(([platformName, platformKey]) => {
      const lineIndex = lines.findIndex((line) => line.includes(platformName));
      if (lineIndex < 0) return null;

      const block = lines.slice(lineIndex, lineIndex + 8).join('\n');
      const metrics = {};
      AUDIT_METRICS.forEach((metric) => {
        const match = block.match(new RegExp(`${escapeRegExp(metric)}\\s*[：:=＝]?\\s*(-?[\\d,，]+)`, 'u'));
        if (match) metrics[metric] = toNumber(match[1]);
      });

      if (!Object.keys(metrics).length) return null;

      return normalizePlatform(
        {
          platformKey,
          platformName,
          passed: /PASS|通過/u.test(block),
          metrics
        },
        platformName
      );
    })
    .filter(Boolean);
}

function parseExcludedEmployeesFromText(text) {
  const result = [];
  const directMatch = cleanText(text).match(/已離職[:：]\s*([^\n。]+)/u);
  if (directMatch) {
    parseNamesFromText(directMatch[1]).forEach((name) => {
      result.push({ name, reason: '已離職' });
    });
  }

  const inlineMatch = cleanText(text).match(/已離職人員(.+?)只列審計/u);
  if (inlineMatch) {
    parseNamesFromText(inlineMatch[1]).forEach((name) => {
      result.push({ name, reason: '已離職' });
    });
  }

  return result;
}

function parseAuditFromText(sourceText) {
  const resultMatch = String(sourceText || '').match(/審計結果[^A-Z]*(PASS|FAIL)/u);
  const noteMatches = [
    ...String(sourceText || '').matchAll(/無漏算|無多算|無總盤衝突|無衝突|核對完成/gu)
  ];

  return {
    result: cleanText(resultMatch?.[1] || '').toUpperCase() || 'FAIL',
    rule: DEFAULT_AUDIT_RULE,
    platforms: parsePlatformsFromText(sourceText),
    notes: uniqueTexts(noteMatches.map((match) => match[0])),
    excludedEmployees: normalizeExcludedEmployees(parseExcludedEmployeesFromText(sourceText))
  };
}

function parseTextPayload(sourceText, options = {}) {
  const sections = splitSections(sourceText);
  const sectionTitle = findSectionLines(sections, [['五'], ['派單順序']]);
  const rankingLines = findSectionLines(sections, [['整合名次'], ['正式名次'], ['排行榜']]);
  const adviceLines = findSectionLines(sections, [['每人一句'], ['建議']]);
  const finalConfirmations = findSectionLines(sections, [['最後確認']]);
  const summaryLines = findSectionLines(sections, [['整合總盤'], ['總盤']]);
  const titleMatch = String(sourceText || '').match(/【([^】]*派單[^】]*)】/u);

  const extractedDates = extractDatesFromTitle(options.title || titleMatch?.[1] || '');
  const textSettlement = normalizeDateInput(options.settlementDate || extractedDates.settlementDate);
  const textDispatch = normalizeDateInput(options.dispatchDate || extractedDates.dispatchDate);

  return {
    title: cleanText(options.title || titleMatch?.[1]),
    settlementDate: textSettlement,
    dispatchDate: textDispatch,
    audit: parseAuditFromText(sourceText),
    summaryBoard: parseSummaryBoardFromText(summaryLines, sourceText),
    rankings: parseRankingSection(rankingLines),
    groups: parseGroupsSection(sectionTitle),
    adviceList: parseAdviceSection(adviceLines),
    finalConfirmations,
    groupShortText: '',
    sourceText
  };
}

function buildReportFromPayload(payload, options = {}) {
  const source = payload || {};
  const fallbackDates = extractDatesFromTitle(cleanText(options.title || source.title || source.公告標題 || ''));
  const settlementDate = normalizeDateInput(
    options.settlementDate ||
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

  const audit = normalizeAudit(source.audit || source.審計結論, source.auditResult);
  const summaryBoard = normalizeSummaryBoard(source.summaryBoard || source.整合總盤);
  const initialRankings = safeArray(source.rankings || source.正式名次).map(normalizeRankingRow).filter((row) => row.name);
  const normalizedGroups = normalizeGroups(source.groups || source.分級);
  const grouped = syncGroups(initialRankings, normalizedGroups);
  const normalizedAdvice = normalizeAdviceEntries(source.adviceList || source.每人一句建議 || source.建議);
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
  if (!report.groupShortText) {
    report.groupShortText = buildGroupShortText(report);
  }

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
  return {
    title: defaultAnnouncement.公告標題,
    settlementDate: normalizeDateInput(defaultAnnouncement.日期資訊?.結算日),
    dispatchDate: normalizeDateInput(defaultAnnouncement.日期資訊?.派單日),
    sourceText: JSON.stringify(defaultAnnouncement, null, 2)
  };
}

function flattenRanking(row) {
  return {
    rank: row.rank,
    name: row.name,
    isNew: Boolean(row.isNew),
    group: row.group,
    totalRevenue: row.metrics.總業績,
    renewalRevenue: row.metrics.續單金額,
    renewalDeals: row.metrics.追續成交總數,
    dispatchDeals: row.metrics.派單成交總通數,
    totalScore: row.metrics.總業績,
    advice: row.advice
  };
}

function toLegacyStandardData(report) {
  const auditPlatforms = {};
  report.audit.platforms.forEach((platform) => {
    auditPlatforms[platform.platformName] = {
      ...clone(platform.metrics),
      通過: platform.passed
    };
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
      審計列示不入派單: report.audit.excludedEmployees.map((entry) => ({
        姓名: entry.name,
        原因: entry.reason
      }))
    },
    整合總盤: clone(report.summaryBoard),
    正式名次: report.rankings.map((row) => ({
      名次: row.rank,
      姓名: row.name,
      ...(row.isNew ? { 標記: '新人' } : {}),
      總業績: row.metrics.總業績,
      續單金額: row.metrics.續單金額,
      追續成交總數: row.metrics.追續成交總數,
      派單成交總通數: row.metrics.派單成交總通數,
      分級: row.group,
      建議: row.advice
    })),
    分級: clone(report.groups),
    最後確認: clone(report.finalConfirmations),
    群組超精簡版: report.groupShortText
  };
}

function buildPresentation(report) {
  const legacyRanking = toLegacyStandardData(report).正式名次;

  return {
    top4: legacyRanking.slice(0, 4),
    top10: legacyRanking.slice(0, 10),
    compactTable: legacyRanking.slice(10),
    retired: report.audit.excludedEmployees.map((entry) => ({
      姓名: entry.name,
      原因: entry.reason
    })),
    summaryCards: [
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
    正式人數: report.rankings.length,
    離職列示人數: report.audit.excludedEmployees.length,
    本月業績: report.summaryBoard['本月業績'] || 0,
    totalRevenue: report.summaryBoard['本月業績'] || 0,
    renewalRevenue: report.summaryBoard['追續單總金額'] || report.summaryBoard['當日續單金額'] || 0,
    renewalDeals: report.summaryBoard['累積追續總成交數'] || 0,
    totalPeople: report.rankings.length,
    activePeople: report.rankings.length
  };
}

function buildLegacyValidation(validation) {
  return {
    ok: validation.ok,
    status: validation.status,
    errors: validation.errors.map((error) => error.reason),
    warnings: validation.warnings.map((warning) => warning.reason),
    summary: clone(validation.summary),
    rules: {
      sourceOfTruth: 'backend',
      frontendMustNotCompute: true,
      rankingOrder: RANKING_METRICS.join(' → ')
    }
  };
}

function buildLegacySnapshot(report, validation, options = {}) {
  const legacyStandardData = toLegacyStandardData(report);
  const executionId = buildExecutionId(report.updatedAt || report.createdAt);

  return {
    executionId,
    completedAt: report.updatedAt,
    operator: cleanText(options.operator || 'system'),
    source: cleanText(options.source || 'dispatch-report-v1'),
    persisted: Boolean(options.persisted),
    status: report.status,
    systemName: SERVICE_NAME,
    systemVersion: API_VERSION,
    rawText: report.sourceText,
    standardData: legacyStandardData,
    validation: buildLegacyValidation(validation),
    summary: buildSnapshotSummary(report),
    presentation: buildPresentation(report),
    ranking: report.rankings.map(flattenRanking),
    groups: clone(report.groups),
    audit: {
      status: report.audit.result,
      result: report.audit.result,
      platforms: clone(report.audit.platforms),
      notes: clone(report.audit.notes),
      excludedEmployees: clone(report.audit.excludedEmployees)
    },
    confirmation: {
      status: validation.status,
      message: validation.ok ? '正式派單資料已通過驗證' : validation.errors[0]?.reason || '資料驗證失敗',
      errors: validation.errors.map((error) => error.reason)
    },
    announcement: report.groupShortText,
    broadcast: {
      title: report.title,
      text: report.groupShortText,
      scriptText: report.groupShortText
    },
    consistencyGuard: {
      status: validation.ok ? 'PASS' : 'FAIL',
      contradictionCount: validation.errors.length,
      contradictions: validation.errors.map((error) => error.reason),
      backendSourceLocked: true,
      frontendComputationAllowed: false,
      frontendRewriteAllowed: false
    },
    frontendLock: {
      sourceOfTruth: 'backend',
      frontendMustUseBackendSnapshot: true,
      frontendMayComputeRanking: false,
      frontendMayComputeGroups: false,
      frontendMayRewriteAnnouncement: false,
      frontendMayRewriteAudit: false
    },
    rules: clone(FRONTEND_LOCK_RULES),
    reportId: report.reportId,
    title: report.title
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
  buildExpectedGroups,
  buildGroupShortText,
  buildGroupsData,
  buildHealthData,
  buildLegacySnapshot,
  buildPresentation,
  buildReportFromSource,
  buildSnapshotSummary,
  buildTop10Data,
  clone,
  createDefaultSeedInput,
  createEmptyGroups,
  formatNumber,
  toLegacyStandardData
};
