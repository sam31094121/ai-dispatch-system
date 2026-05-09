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
  UNIFIED_COMMAND_SPEC,
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
  formatDisplayName,
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
  ['甇??甈??', '甇??甈??'],
  ['撖行', '撖行'],
  ['撖行蝮賡?憿?, '撖行'],
  ['蝮賣平蝮?, '蝮賣平蝮?],
  ['?券蝮賣平蝮?, '蝮賣平蝮?],
  ['璆剔蜀', '蝮賣平蝮?],
  ['蝮賜', '蝮賣平蝮?],
  ['蝥', '蝥??'],
  ['蝥??', '蝥??'],
  ['餈賜???', '蝥??'],
  ['餈賜??桅?憿?, '蝥??'],
  ['餈賢', '餈賜??漱蝮賣'],
  ['餈賜?', '餈賜??漱蝮賣'],
  ['餈賜??漱蝮賣', '餈賜??漱蝮賣'],
  ['餈賜?蝮賣', '餈賜??漱蝮賣'],
  ['餈賜??格', '餈賜??漱蝮賣'],
  ['餈賜?摰Ｗ??, '餈賜?摰Ｗ??],
  ['瘣曉?漱', '瘣曉?漱蝮賡'],
  ['瘣曉?漱蝮賣', '瘣曉?漱蝮賡'],
  ['瘣曉?漱蝮賡', '瘣曉?漱蝮賡']
]);

const summaryMetricAliases = new Map([
  ...SUMMARY_METRICS.map((metric) => [metric, metric]),
  ['?券蝮賣平蝮?, '?祆?璆剔蜀'],
  ['蝮賣平蝮?, '?祆?璆剔蜀'],
  ['餈賜??格?鈭?, '蝝舐?餈賜?蝮賣?鈭斗'],
  ['餈賜??漱蝮賣', '蝝舐?餈賜?蝮賣?鈭斗'],
  ['餈賜??桅?憿?, '餈賜??桃蜇??'],
  ['餈賜??桃蜇??', '餈賜??桃蜇??'],
  ['撖行蝮賡?憿?, '撖行蝮賡?憿?],
  ['銝像?唳??瘨鞎?, '?嗆???鞎?],
  ['???鞎?, '?嗆???鞎?]
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
  /?芰??u,
  /?⊥?蝞?u,
  /?∪?蝞?u,
  /?∠蜇?方?蝒?u,
  /?∠蜇銵刻?蝒?u,
  /?∟?蝒?u,
  /?鞎典歇?/u,
  /???鞎?u,
  /?澆??啣虜/u,
  /銝蔣??u,
  /?蜇銝??u,
  /?詨???/u,
  /?啣虜/u,
  /??/u,
  /銝??u
];

const AUDIT_NOTE_EXCLUDE_PATTERNS = [
  /^撖抵?蝯?/u,
  /^?祈憚靘?甇餉???u,
  /^???箏?/u,
  /蝮質”?詨???/u,
  /^(蝝舐?蝮賣晷?格|蝝舐?瘣曉蝮賣?鈭斗|蝝舐?餈賜?蝮賣?鈭斗|?嗆蝥??|?祆?璆剔蜀|餈賜??桃蜇??|?嗆???鞎?/u,
  /^撌脤?愴:嚗/u,
  /^撌脤?瑚犖??u,
  /^蝢斤?頞移蝪∠?/u,
  /^???u,
  /^?祈憚?蝯?隢?銝:嚗?$/u,
  /^\d{1,2}\/\d{1,2}\s*蝯?鞈?撌脫撠???u,
  /^\d{1,2}\/\d{1,2}\s*甇??瘣曉??嚗誑?砍??砍??箸?/u
];

function trimTrailingPunctuation(value) {
  return cleanText(value).replace(/[??嚗?嚗?嚗?]+$/u, '').trim();
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
  return normalized.length ? normalized.join('嚗?) : '?∟??牧??;
}

function normalizeMetricBag(source, metrics) {
  return Object.fromEntries(metrics.map((metric) => [metric, toNumber(source?.[metric])]));
}

function buildPlatformKey(platformName) {
  if (PLATFORM_NAME_TO_KEY[platformName]) return PLATFORM_NAME_TO_KEY[platformName];
  return normalizeName(platformName).toLowerCase() || 'platform';
}

function normalizePlatform(platformInput = {}, fallbackName = '') {
  const platformName = cleanText(platformInput.platformName || platformInput.撟喳?迂 || fallbackName);
  if (!platformName) return null;

  const metricsSource = platformInput.metrics || platformInput.?豢? || platformInput;
  const passed =
    typeof platformInput.passed === 'boolean'
      ? platformInput.passed
      : typeof platformInput.?? === 'boolean'
      ? platformInput.??
      : cleanText(platformInput.passed || platformInput.??).toUpperCase() === 'PASS';

  return {
    platformKey: cleanText(platformInput.platformKey || buildPlatformKey(platformName)),
    platformName,
    passed,
    metrics: normalizeMetricBag(metricsSource, AUDIT_METRICS)
  };
}

function normalizeOfficialPlatformMetrics(value = {}) {
  return {
    蝝舐?蝮賣晷?格: toNumber(value.cumulativeDispatch ?? value.蝝舐?蝮賣晷?格),
    蝝舐?瘣曉蝮賣?鈭斗: toNumber(value.cumulativeDispatchDeals ?? value.蝝舐?瘣曉蝮賣?鈭斗),
    蝝舐?餈賜?蝮賣?鈭斗: toNumber(value.cumulativeRenewalDeals ?? value.蝝舐?餈賜?蝮賣?鈭斗),
    ?嗆蝥??: toNumber(value.dailyRenewalAmount ?? value.?嗆蝥??),
    ?祆?璆剔蜀: toNumber(value.monthlyRevenue ?? value.?祆?璆剔蜀),
    餈賜??桃蜇??: toNumber(value.totalRenewalAmount ?? value.餈賜??桃蜇??),
    撖行蝮賡?憿? toNumber(value.actualRevenue ?? value.撖行蝮賡?憿?
  };
}

function normalizeOfficialPlatforms(rawPlatforms = {}) {
  return Object.fromEntries(
    Object.entries(rawPlatforms || {}).map(([platformName, value]) => [
      platformName,
      {
        ...normalizeOfficialPlatformMetrics(value),
        ??: true
      }
    ])
  );
}

function normalizeExcludedEmployees(value) {
  const seen = new Set();
  return safeArray(value)
    .map((item) => ({
      name: splitNameTags(item?.name || item?.憪?).name,
      reason: cleanText(item?.reason || item?.?? || '撌脤??)
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

  const explicitResult = cleanText(raw.result || raw.蝯? || fallbackResult).toUpperCase();
  const result = explicitResult || (platforms.length > 0 && platforms.every((platform) => platform.passed) ? 'PASS' : 'FAIL');

  return {
    result,
    rule: cleanText(raw.rule || raw.閬? || DEFAULT_AUDIT_RULE) || DEFAULT_AUDIT_RULE,
    platforms,
    notes: normalizeStringArray(raw.notes || raw.?孵隤芣? || raw.?酉),
    excludedEmployees: normalizeExcludedEmployees(raw.excludedEmployees || raw['撖抵??內銝瘣曉'])
  };
}

function normalizeSummaryBoard(rawSummary = {}) {
  return Object.fromEntries(SUMMARY_METRICS.map((metric) => [metric, toNumber(rawSummary?.[metric])]));
}

function normalizeOfficialSummaryBoard(rawStats = {}) {
  return normalizeSummaryBoard({
    蝝舐?蝮賣晷?格: rawStats.totalCalls,
    蝝舐?瘣曉蝮賣?鈭斗: rawStats.dispatchCalls,
    蝝舐?餈賜?蝮賣?鈭斗: rawStats.renewalCalls,
    ?嗆蝥??: rawStats.dailyRenewalAmount,
    ?祆?璆剔蜀: rawStats.monthlyRevenue,
    餈賜??桃蜇??: rawStats.renewalAmount,
    撖行蝮賡?憿? rawStats.actualRevenue,
    ?嗆???鞎? rawStats.cancellations
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
  const tagged = splitNameTags(row.name || row.憪?);
  const metricsSource = row.metrics || row;
  const marker = cleanText(row.璅? || row.marker);
  const advice = cleanText(row.advice || row.撱箄降 || row.text);
  const isNew = typeof row.isNew === 'boolean' ? row.isNew : tagged.isNew || marker.includes('?唬犖');

  return {
    rank: Math.max(0, Math.trunc(toNumber(firstDefined(row, ['rank', '?活']) ?? index + 1))),
    name: formatDisplayName(tagged.name, isNew),
    isNew,
    group: cleanText(row.group || row.??).toUpperCase(),
    prevRank: toNumber(firstDefined(row, ['prevRank', '銝??活', 'previousRank'])),
    movement: cleanText(row.movement || row.move || row.?啣? || 'flat').toLowerCase(),
    metrics: {
      score: toNumber(firstDefined(metricsSource, ['甇??甈??', 'weightedScore', 'totalScore', 'score'])),
      actualRevenue: toNumber(firstDefined(metricsSource, ['撖行', '撖行蝮賡?憿?, '撖行蝮賣平蝮?, 'actualRevenue'])),
      totalRevenue: toNumber(firstDefined(metricsSource, ['蝮賣平蝮?, 'totalRevenue', '?券蝮賣平蝮?])),
      renewalRevenue: toNumber(firstDefined(metricsSource, ['蝥??', '餈賜???', '餈賜??桅?憿?, 'renewalRevenue'])),
      renewalDeals: toNumber(firstDefined(metricsSource, ['餈賜??漱蝮賣', '餈賜??格', 'renewalDeals', '餈賢'])),
      renewalAverage: toNumber(firstDefined(metricsSource, ['餈賜?摰Ｗ??, 'avgRenewal', 'renewalAvgPrice', 'renewalAverage'])),
      dispatchDeals: toNumber(firstDefined(metricsSource, ['瘣曉?漱蝮賡', 'dispatchDeals', '瘣曉?漱'])),
      
      // ?詨捆??銝剜? Key
      甇??甈??: toNumber(firstDefined(metricsSource, ['甇??甈??', 'weightedScore', 'totalScore', 'score'])),
      撖行: toNumber(firstDefined(metricsSource, ['撖行', '撖行蝮賡?憿?, '撖行蝮賣平蝮?, 'actualRevenue'])),
      蝮賣平蝮? toNumber(firstDefined(metricsSource, ['蝮賣平蝮?, 'totalRevenue', '?券蝮賣平蝮?])),
      蝥??: toNumber(firstDefined(metricsSource, ['蝥??', '餈賜???', '餈賜??桅?憿?, 'renewalRevenue'])),
      餈賜??漱蝮賣: toNumber(firstDefined(metricsSource, ['餈賜??漱蝮賣', '餈賜??格', 'renewalDeals', '餈賢'])),
      餈賜?摰Ｗ?? toNumber(firstDefined(metricsSource, ['餈賜?摰Ｗ??, 'avgRenewal', 'renewalAvgPrice'])),
      瘣曉?漱蝮賡: toNumber(firstDefined(metricsSource, ['瘣曉?漱蝮賡', 'dispatchDeals', '瘣曉?漱']))
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
      name: splitNameTags(entry?.name || entry?.憪?).name,
      rank: Math.max(0, Math.trunc(toNumber(entry?.rank || entry?.?活))),
      group: cleanText(entry?.group || entry?.??).toUpperCase(),
      text: cleanText(entry?.text || entry?.撱箄降)
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

function normalizeRankingOrder(rankings) {
  return safeArray(rankings)
    .map((row, index) => ({
      ...row,
      rank: Math.max(1, Math.trunc(toNumber(row.rank || index + 1)) || index + 1),
      __sourceIndex: index
    }))
    .sort((left, right) => {
      const rankingDelta = compareRankingRows(left, right);
      if (rankingDelta !== 0) return rankingDelta;
      if (left.rank !== right.rank) return left.rank - right.rank;
      return left.__sourceIndex - right.__sourceIndex;
    })
    .map((row, index) => ({
      ...row,
      rank: index + 1,
      group: resolveGroupByRank(index + 1)
    }))
    .map(({ __sourceIndex, ...row }) => row);
}

function normalizePreservedRankingOrder(rankings, providedGroups = {}) {
  const groupByName = new Map();
  GROUP_KEYS.forEach((groupKey) => {
    safeArray(providedGroups?.[groupKey]).forEach((name) => {
      groupByName.set(name, groupKey);
    });
  });

  return safeArray(rankings)
    .map((row, index) => ({
      ...row,
      rank: Math.max(1, Math.trunc(toNumber(row.rank || index + 1)) || index + 1),
      __sourceIndex: index
    }))
    .sort((left, right) => {
      if (left.rank !== right.rank) return left.rank - right.rank;
      return left.__sourceIndex - right.__sourceIndex;
    })
    .map((row, index) => ({
      ...row,
      rank: index + 1,
      group: groupByName.get(row.name) || row.group || resolveGroupByRank(index + 1)
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
    m.餈賜?摰Ｗ??= Number(m.餈賜??漱蝮賣 || 0) > 0
      ? Number((Number(m.蝥?? || 0) / Number(m.餈賜??漱蝮賣 || 0)).toFixed(2))
      : 0;
  });

  maxes.餈賜?摰Ｗ??= Math.max(...people.map((row) => Number(row.metrics?.餈賜?摰Ｗ??|| 0)), 0);

  people.forEach((row) => {
    const m = row.metrics || {};
    const total = WEIGHTING_POLICY.weights.reduce((sum, item) => {
      const maxValue = maxes[item.key] || 0;
      if (maxValue <= 0) return sum;
      const val = Math.max(0, Number(m[item.key] || 0));
      const score = (val / maxValue) * weights[item.key];
      return sum + (Number.isFinite(score) ? score : 0);
    }, 0);
    m.甇??甈?? = Number.isFinite(total) ? Number(total.toFixed(2)) : 0;
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
  const score = Number(row.metrics?.甇??甈?? || 0);
  const aboveScore = Number(above?.metrics?.甇??甈?? || 0);
  const belowScore = Number(below?.metrics?.甇??甈?? || 0);
  const gapUp = above && aboveScore > 0 ? `${((aboveScore - score) / aboveScore * 100).toFixed(1)}%` : '';
  const gapDown = below && score > 0 ? `${((score - belowScore) / score * 100).toFixed(1)}%` : '';
  const renewal = Number(row.metrics?.蝥?? || 0);
  const revenue = Number(row.metrics?.蝮賣平蝮?|| 0);
  const renewalDeals = Number(row.metrics?.餈賜??漱蝮賣 || 0);
  const dispatchDeals = Number(row.metrics?.瘣曉?漱蝮賡 || 0);
  const mainMetric = renewal >= revenue * 0.55
    ? '餈賜??桅?憿?
    : dispatchDeals >= renewalDeals
    ? '瘣曉?漱'
    : '撖行璆剔蜀';

  if (row.rank === 1) {
    return `?桀?甈??蝚砌?嚗?蝚砌??榆頝?${gapDown || '0%'}??憭拍匱蝥?${mainMetric}鋆?嚗??賜帘雿晷?桀???;
  }
  if (row.rank <= GROUP_RANK_POLICY.A1.max) {
    return `雿 A1 銝餃??嚗?????${gapUp}??憭拐蜓??{mainMetric}嚗?蝑???鈭文停?賣?甈??????;
  }
  if (row.rank <= GROUP_RANK_POLICY.A2.max) {
    return `雿 A2 銝餃??嚗?????${gapUp}嚗??孵榆頝?${gapDown || '撠帘'}??憭拍${mainMetric}摰?銝衣??憯;
  }
  if (row.rank <= GROUP_RANK_POLICY.B.max) {
    return `雿 B 蝯奎?剖葆嚗?????${gapUp}??憭拙???{mainMetric}??＊憓?嚗????豢????;
  }
  return `雿 C 蝯?雿?嚗?憭拙?霈摮?啜?${mainMetric}鋆?蝑?憪?瘥??撠望?敺銝;
}

function resolveTitle(explicitTitle, fallbackTitle, settlementDate, dispatchDate) {
  const preferred = cleanText(explicitTitle || fallbackTitle);
  if (preferred) return preferred;
  if (settlementDate && dispatchDate) {
    return `AI 瘣曉?砍?嚚?{formatMonthDay(settlementDate)} 蝯? ??${formatMonthDay(dispatchDate)} 甇??瘣曉??`;
  }
  return 'AI 瘣曉?砍?';
}

function buildAuditStatusText(report) {
  const platformCount = Array.isArray(report.audit?.platforms) ? report.audit.platforms.length : 0;
  const auditStatus = cleanText(report.auditResult || report.audit?.result).toUpperCase();

  if (!platformCount) {
    return auditStatus === 'PASS' ? '撖抵?鞈?撌脣??撠? : '撖抵?鞈?敺?朣?;
  }

  if (auditStatus === 'PASS') {
    return `${platformCount}撟喳蝮質”?冽?詨???`;
  }

  return `${platformCount}撟喳蝮質”撌脣??撠?隞??啣虜敺??;
}

function buildDefaultFinalConfirmations(report) {
  const platformNote = buildAuditStatusText(report);
  const excluded = report.audit.excludedEmployees || [];
  const excludedLine = excluded.length
    ? `撌脤?瑚犖??{excluded.map((entry) => entry.name).join('??)}?芸?撖抵?嚗??交迤撘晷?害
    : '';

  return uniqueTexts([
    `${formatMonthDay(report.settlementDate)} 蝯?鞈?撌脫撠??,
    platformNote,
    ...(report.audit.notes || []),
    excludedLine,
    `${formatMonthDay(report.dispatchDate)} 甇??瘣曉??嚗誑?砍??砍??箸?`
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
    ? `撌脤?瘀?${excludedEmps.map((entry) => entry.name).join('??)}嚗?祟閮??交晷?柴
    : '?祈憚?⊿?瑕?蝷箝?;
  const auditStatusText = buildAuditStatusText(report);

  return [
    `??I 瘣曉?砍?嚚?{formatMonthDay(report.settlementDate)} 蝯? ??${formatMonthDay(report.dispatchDate)} 甇??瘣曉?,
    `撖抵? ${report.auditResult}嚗?{auditStatusText}嚗?{noteText}?,
    excludedLine,
    top10Text ? `甇????0??${top10Text}? : '',
    `A1嚗?{report.groups.A1.join('??)}?,
    `A2嚗?{report.groups.A2.join('??)}?,
    `B蝯?${report.groups.B.join('??)}?,
    `C蝯?${report.groups.C.join('??)}?,
    '甇??瘣曉??隞交?皞?
  ]
    .filter(Boolean)
    .join('');
}

function syncNewcomerLabels(report) {
  const canonicalByBaseName = new Map();

  safeArray(report.rankings).forEach((row) => {
    const tagged = splitNameTags(row.name);
    if (!tagged.name) return;
    const isNew = Boolean(row.isNew) || tagged.isNew;
    const displayName = formatDisplayName(tagged.name, isNew);
    row.name = displayName;
    row.isNew = isNew;
    canonicalByBaseName.set(tagged.name, displayName);
  });

  GROUP_KEYS.forEach((groupKey) => {
    report.groups[groupKey] = safeArray(report.groups?.[groupKey])
      .map((name) => {
        const tagged = splitNameTags(name);
        return canonicalByBaseName.get(tagged.name) || formatDisplayName(tagged.name, tagged.isNew);
      })
      .filter(Boolean);
  });

  report.adviceList = safeArray(report.adviceList).map((entry) => {
    const tagged = splitNameTags(entry.name);
    return {
      ...entry,
      name: canonicalByBaseName.get(tagged.name) || formatDisplayName(tagged.name, tagged.isNew)
    };
  });

  return report;
}

function syncAdviceListFromRankings(report) {
  if (safeArray(report.adviceList).length) return report;

  report.adviceList = safeArray(report.rankings)
    .map((row) => ({
      name: row.name,
      rank: row.rank,
      group: row.group,
      text: cleanText(row.advice)
    }))
    .filter((entry) => entry.name && entry.text);

  return report;
}

function syncNarrativeFields(report) {
  if (!report || typeof report !== 'object') return report;

  report.groups = report.groups || createEmptyGroups();
  syncNewcomerLabels(report);
  syncAdviceListFromRankings(report);
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
  if (payload.title || payload.?砍?璅? || payload.rankings || payload.ranking || payload.甇???活 || payload.overallStats) return payload;
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
      if (!trimmed || /^[-?]{4,}$/u.test(trimmed)) return;

      if (/^?^?+??/u.test(trimmed) || /^[銝鈭????凋??思??+??+$/u.test(trimmed)) {
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
  const normalized = normalizeName(String(label).replace(/[?/g, ''));
  return rankingMetricAliases.get(normalized) || summaryMetricAliases.get(normalized) || '';
}

function parseMetricSegment(segment) {
  const match = cleanText(segment).match(/^(?:???([^??嚗?嚗+)(?:???\s*[:嚗?嚗?\s*(-?[\d,嚗?]+)/u);
  if (!match) return null;
  return {
    label: normalizeMetricLabel(match[1]),
    value: toNumber(match[2])
  };
}

function parseRankingSection(lines) {
  const rankings = [];

  safeArray(lines).forEach((line) => {
    const parts = line.split(/[嚚]/u).map((part) => cleanText(part)).filter(Boolean);
    if (!parts.length) return;

    let rank = 0;
    let rawName = '';
    let metricParts = parts.slice();

    if (/^\d+$/u.test(parts[0]) && parts[1]) {
      rank = Number(parts[0]);
      rawName = parts[1];
      metricParts = parts.slice(2);
    } else {
      const headerMatch = parts[0].match(/^(\d+)\s*[??嚗?\s*(.+)$/u);
      if (!headerMatch) return;
      rank = Number(headerMatch[1]);
      rawName = headerMatch[2];
      metricParts = parts.slice(1);
    }

    const tagged = splitNameTags(rawName);
    const metrics = {
      甇??甈??: 0,
      撖行: 0,
      蝮賣平蝮? 0,
      蝥??: 0,
      餈賜??漱蝮賣: 0,
      餈賜?摰Ｗ?? 0,
      瘣曉?漱蝮賡: 0
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
    .replace(/^\d+\s*[??嚗\s*/u, '')
    .split(/[??嚗/u)
    .map((name) => splitNameTags(name).name)
    .filter(Boolean);
}

function parseGroupsSection(lines) {
  const groups = createEmptyGroups();
  let currentGroup = '';

  safeArray(lines).forEach((line) => {
    if (line.includes('撖抵??內')) {
      currentGroup = '';
      return;
    }

    const groupKey = extractGroupKey(line);
    if (groupKey) {
      currentGroup = groupKey;
      const inlineMatch = cleanText(line).match(/[嚗?](.+)$/u);
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
    const match = line.match(/^(\d+)\s*[嚚??嚗\s*(.+)$/u);
    if (match) {
      flush();
      currentRank = Number(match[1]);
      const inline = cleanText(match[2]).match(/^([^嚗?]+)[嚗?](.+)$/u);
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
    const match = source.match(new RegExp(`${escapeRegExp(alias)}(?:???\\s*[嚗?=嚗?\\s*(-?[\\d,嚗+)`, 'u'));
    if (match) collected[metric] = toNumber(match[1]);
  }

  return normalizeSummaryBoard(collected);
}

function parseAuditPlatformsFromLines(lines) {
  const platforms = [];
  let current = null;

  safeArray(lines).forEach((line) => {
    const platformName = Object.keys(PLATFORM_NAME_TO_KEY).find((name) => line.includes(name));
    if (platformName && line.includes('蝮質”')) {
      current = {
        platformKey: PLATFORM_NAME_TO_KEY[platformName],
        platformName,
        passed: /PASS|??/u.test(line),
        metrics: {}
      };
      platforms.push(current);
      return;
    }

    if (!current) return;

    for (const [alias, metric] of summaryMetricAliases.entries()) {
      if (!AUDIT_METRICS.includes(metric)) continue;
      const match = line.match(new RegExp(`${escapeRegExp(alias)}\\s*[嚗?=嚗?\\s*(-?[\\d,嚗+)`, 'u'));
      if (match) current.metrics[metric] = toNumber(match[1]);
    }
  });

  return platforms.map((platform) => normalizePlatform(platform, platform.platformName)).filter(Boolean);
}

function sanitizeExcludedEmployeeSegment(segment) {
  return cleanText(segment)
    .replace(/(?:?芸?撖抵?|撖抵??內|??撖抵?).*/u, '')
    .replace(/(?:銝甇??瘣曉|銝瘣曉).*/u, '')
    .replace(/[??;]+$/u, '')
    .replace(/[嚗?]+$/u, '')
    .trim();
}

function parseExcludedEmployeesFromText(text) {
  const result = [];
  const directMatch = cleanText(text).match(/撌脤?愴:嚗\s*([^\n]+)/u);
  if (directMatch) {
    parseNamesFromText(sanitizeExcludedEmployeeSegment(directMatch[1])).forEach((name) => {
      result.push({ name, reason: '撌脤?? });
    });
  }

  const inlineMatch = cleanText(text).match(/撌脤?瑚犖??.+?)?芸?撖抵?/u);
  if (inlineMatch) {
    parseNamesFromText(sanitizeExcludedEmployeeSegment(inlineMatch[1])).forEach((name) => {
      result.push({ name, reason: '撌脤?? });
    });
  }

  return result;
}

function parseAuditFromText(sourceText, auditLines = [], extraNoteLines = []) {
  const resultMatch = String(sourceText || '').match(/撖抵?蝯?[^A-Z]*(PASS|FAIL)/u);

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
  const auditLines = findSectionLines(sections, [['撖抵?蝯?'], ['撖抵?蝯?']]);
  const rankingLines = findSectionLines(sections, [['甇???活'], ['?游??活'], ['??璁?]]);
  const groupsLines = findSectionLines(sections, [['瘣曉??'], ['瘣曉??']]);
  const adviceLines = findSectionLines(sections, [['瘥犖銝??], ['撱箄降']]);
  const finalSectionLines = findSectionLines(sections, [['?敺Ⅱ隤?]]);
  const summaryLines = findSectionLines(sections, [['?游?蝮賜'], ['蝮賜']]);
  const titleMatch = String(sourceText || '').match(/??[^?*瘣曉[^?*)??u);

  const extractedDates = extractDatesFromTitle(options.title || titleMatch?.[1] || '');
  const textSettlement = normalizeDateInput(options.settlementDate || extractedDates.settlementDate);
  const textDispatch = normalizeDateInput(options.dispatchDate || extractedDates.dispatchDate);
  const shortTextIndex = finalSectionLines.findIndex((line) => line.startsWith('蝢斤?頞移蝪∠?'));
  const shortTextLine =
    shortTextIndex >= 0
      ? cleanText(finalSectionLines[shortTextIndex].replace(/^蝢斤?頞移蝪∠?[:嚗?\s*/u, '')) ||
        cleanText(finalSectionLines[shortTextIndex + 1])
      : '';
  const finalConfirmations = finalSectionLines.filter(
    (line) => !line.startsWith('蝢斤?頞移蝪∠?') && !line.startsWith('???)
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
  const fallbackDates = extractDatesFromTitle(cleanText(options.title || source.title || source.?砍?璅? || ''));
  const settlementDate = normalizeDateInput(
    options.settlementDate ||
      source.reportDate ||
      source.settlementDate ||
      source.?交?鞈??.蝯???||
      fallbackDates.settlementDate
  );
  const dispatchDate = normalizeDateInput(
    options.dispatchDate ||
      source.dispatchDate ||
      source.?交?鞈??.瘣曉??||
      fallbackDates.dispatchDate
  );

  const reportId = cleanText(options.reportId || source.reportId || buildReportId(settlementDate));
  const createdAt = cleanText(options.createdAt || source.createdAt || formatTaipeiTimestamp());
  const updatedAt = cleanText(options.updatedAt || source.updatedAt || createdAt);
  const title = resolveTitle(options.title, source.title || source.?砍?璅?, settlementDate, dispatchDate);

  const auditSource = source.platforms
    ? {
        蝯?: source.audit?.status || 'PASS',
        閬?: DEFAULT_AUDIT_RULE,
        ...normalizeOfficialPlatforms(source.platforms),
        ?孵隤芣?: ['4/23 摰??鞈?撌脖?瘥???摰?甈?閮???],
        撖抵??內銝瘣曉: source.excludedEmployees || []
      }
    : source.audit || source.撖抵?蝯? || {};
  const audit = normalizeAudit(auditSource, source.auditResult);
  const summaryBoard = source.overallStats
    ? normalizeOfficialSummaryBoard(source.overallStats)
    : normalizeSummaryBoard(source.summaryBoard || source.?游?蝮賜);
  const initialRankings = safeArray(source.rankings || source.ranking || source.甇???活)
    .map(normalizeRankingRow)
    .filter((row) => row.name);
  const normalizedGroups = normalizeGroups(source.groups || source.??);
  const grouped = syncGroups(initialRankings, normalizedGroups, {
    preserveRankingOrder: false
  });
  const normalizedAdvice = normalizeAdviceEntries(source.adviceList || source.advice || source.瘥犖銝?亙遣霅?|| source.撱箄降);
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
    finalConfirmations: normalizeStringArray(source.finalConfirmations || source.?敺Ⅱ隤?,
    groupShortText: cleanText(source.groupShortText || source.蝢斤?頞移蝪∠?)
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
    throw new Error('sourceText ?箏?憛?);
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
    title: defaultAnnouncement.?砍?璅?,
    settlementDate: normalizeDateInput(defaultAnnouncement.?交?鞈??.蝯???,
    dispatchDate: normalizeDateInput(defaultAnnouncement.?交?鞈??.瘣曉??,
    sourceText: defaultAnnouncement.sourceText || JSON.stringify(defaultAnnouncement, null, 2)
  };
}

function flattenRanking(row) {
  return {
    rank: row.rank,
    name: row.name,
    isNew: Boolean(row.isNew),
    group: row.group,
    totalRevenue: row.metrics?.蝮賣平蝮?|| 0,
    renewalRevenue: row.metrics?.蝥?? || 0,
    renewalDeals: row.metrics?.餈賜??漱蝮賣 || 0,
    dispatchDeals: row.metrics?.瘣曉?漱蝮賡 || 0,
    weightedScore: row.metrics?.甇??甈?? || 0,
    actualRevenue: row.metrics?.撖行 || 0,
    avgRenewal: row.metrics?.餈賜?摰Ｗ??|| 0,
    advice: row.advice
  };
}

function toLegacyStandardData(report) {
  const auditPlatforms = {};
  if (Array.isArray(report.audit?.platforms)) {
    report.audit.platforms.forEach((platform) => {
      auditPlatforms[platform.platformName] = {
        ...clone(platform.metrics),
        ??: platform.passed
      };
    });
  }
  
  const ranking = (report.rankings || []).map((row) => ({
    ?活: row.rank,
    憪?: row.name,
    ...(row.isNew ? { 璅?: '?唬犖' } : {}),
    甇??甈??: row.metrics?.甇??甈?? || 0,
    撖行: row.metrics?.撖行 || 0,
    ?券蝮賣平蝮? row.metrics?.蝮賣平蝮?|| 0,
    蝮賣平蝮? row.metrics?.蝮賣平蝮?|| 0,
    餈賜???: row.metrics?.蝥?? || 0,
    蝥??: row.metrics?.蝥?? || 0,
    餈賜??格: row.metrics?.餈賜??漱蝮賣 || 0,
    餈賜??漱蝮賣: row.metrics?.餈賜??漱蝮賣 || 0,
    餈賜?摰Ｗ?? row.metrics?.餈賜?摰Ｗ??|| 0,
    瘣曉?漱蝮賡: row.metrics?.瘣曉?漱蝮賡 || 0,
    ??: row.group,
    撱箄降: row.advice
  }));

  ranking.sort((a, b) => {
    if ((b.甇??甈?? || 0) !== (a.甇??甈?? || 0)) {
      return (b.甇??甈?? || 0) - (a.甇??甈?? || 0);
    }
    if ((b.撖行 || 0) !== (a.撖行 || 0)) {
      return (b.撖行 || 0) - (a.撖行 || 0);
    }
    if ((b.蝥?? || 0) !== (a.蝥?? || 0)) {
      return (b.蝥?? || 0) - (a.蝥?? || 0);
    }
    if ((b.蝮賣平蝮?|| 0) !== (a.蝮賣平蝮?|| 0)) {
      return (b.蝮賣平蝮?|| 0) - (a.蝮賣平蝮?|| 0);
    }
    if ((b.餈賜?摰Ｗ??|| 0) !== (a.餈賜?摰Ｗ??|| 0)) {
      return (b.餈賜?摰Ｗ??|| 0) - (a.餈賜?摰Ｗ??|| 0);
    }
    return (b.餈賜??漱蝮賣 || 0) - (a.餈賜??漱蝮賣 || 0);
  });

  return {
    ?砍?璅?: report.title,
    ?交?鞈?: {
      蝯??? formatMonthDay(report.settlementDate),
      瘣曉?? formatMonthDay(report.dispatchDate)
    },
    撖抵?蝯?: {
      蝯?: report.audit.result,
      閬?: report.audit.rule,
      ...auditPlatforms,
      ?孵隤芣?: clone(report.audit.notes),
      撖抵??內銝瘣曉: (report.audit?.excludedEmployees || []).map((entry) => ({
        憪?: entry.name,
        ??: entry.reason
      }))
    },
    ?游?蝮賜: clone(report.summaryBoard),
    甇???活: ranking,
    ??: clone(report.groups),
    ?敺Ⅱ隤? clone(report.finalConfirmations),
    蝢斤?頞移蝪∠?: report.groupShortText
  };
}

function buildPresentation(report) {
  const legacyRanking = toLegacyStandardData(report).甇???活;

  return {
    top5: legacyRanking.slice(0, 5),
    top10: legacyRanking.slice(0, 10),
    compactTable: legacyRanking.slice(10),
    retired: (report.audit?.excludedEmployees || []).map((entry) => ({
      憪?: entry.name,
      ??: entry.reason
    })),
    summaryCards: report.summaryBoard['撖行蝮賡?憿?]
      ? [
          ['撖行蝮賡?憿?, report.summaryBoard['撖行蝮賡?憿?]],
          ['餈賜??桅?憿?, report.summaryBoard['餈賜??桃蜇??'] || 0],
          ['?券蝮賣平蝮?, report.summaryBoard['?祆?璆剔蜀'] || 0],
          ['餈賜??格?鈭?, report.summaryBoard['蝝舐?餈賜?蝮賣?鈭斗'] || 0],
          ['蝝舐?瘣曉?漱', report.summaryBoard['蝝舐?瘣曉蝮賣?鈭斗'] || 0],
          ['???鞎?, report.summaryBoard['?嗆???鞎?] || 0]
        ]
      : [
          ['蝝舐?蝮賣晷?格', report.summaryBoard['蝝舐?蝮賣晷?格'] || 0],
          ['蝝舐?瘣曉蝮賣?鈭斗', report.summaryBoard['蝝舐?瘣曉蝮賣?鈭斗'] || 0],
          ['蝝舐?餈賜?蝮賣?鈭斗', report.summaryBoard['蝝舐?餈賜?蝮賣?鈭斗'] || 0],
          ['?嗆蝥??', report.summaryBoard['?嗆蝥??'] || 0],
          ['?祆?璆剔蜀', report.summaryBoard['?祆?璆剔蜀'] || 0],
          ['餈賜??桃蜇??', report.summaryBoard['餈賜??桃蜇??'] || 0]
        ],
    cancellationAmount: report.summaryBoard['?嗆???鞎?] || 0
  };
}

function buildSnapshotSummary(report) {
  return {
    撖抵?蝯?: report.auditResult,
    甇??鈭箸: (report.rankings || []).length,
    ?Ｚ?內鈭箸: (report.audit?.excludedEmployees || []).length,
    ?祆?璆剔蜀: report.summaryBoard['?祆?璆剔蜀'] || 0,
    totalRevenue: report.summaryBoard['?祆?璆剔蜀'] || 0,
    renewalRevenue: report.summaryBoard['餈賜??桃蜇??'] || report.summaryBoard['?嗆蝥??'] || 0,
    renewalDeals: report.summaryBoard['蝝舐?餈賜?蝮賣?鈭斗'] || 0,
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
      rankingOrder: RANKING_METRICS.join(' ??')
    }
  };
}

function buildLockedFrontendContract(validation, syncIssues = []) {
  const contradictions = [
    ...(validation.errors || []).map((error) => error.reason),
    ...syncIssues
  ];

  return {
    consistencyGuard: {
      status: contradictions.length === 0 ? 'PASS' : 'FAIL',
      contradictionCount: contradictions.length,
      contradictions,
      backendSourceLocked: true,
      frontendComputationAllowed: false,
      frontendRewriteAllowed: false,
      syncPolicy: 'backend_snapshot_only'
    },
    frontendLock: {
      sourceOfTruth: 'backend',
      frontendMustUseBackendSnapshot: true,
      frontendMayComputeRanking: false,
      frontendMayComputeGroups: false,
      frontendMayRewriteAnnouncement: false,
      frontendMayRewriteAudit: false
    }
  };
}

function collectSnapshotSyncIssues(snapshotReport, legacyStandardData) {
  const issues = [];
  const rankingNames = (snapshotReport.rankings || []).map((row) => row.name);
  const flatRankingNames = (snapshotReport.rankings || []).map((row) => row.name);
  const legacyRanking = Object.values(legacyStandardData).find((value) =>
    Array.isArray(value) && value.some((entry) => entry && typeof entry === 'object')
  ) || [];
  const legacyNames = legacyRanking.map((row) => Object.values(row)[1]).filter(Boolean);

  if (legacyNames.length && legacyNames.join('|') !== rankingNames.join('|')) {
    issues.push('legacy standardData ranking order differs from backend rankings');
  }
  if (flatRankingNames.join('|') !== rankingNames.join('|')) {
    issues.push('flat ranking order differs from backend rankings');
  }

  GROUP_KEYS.forEach((groupKey) => {
    const expected = (snapshotReport.rankings || [])
      .filter((row) => row.group === groupKey)
      .map((row) => row.name);
    const actual = snapshotReport.groups?.[groupKey] || [];
    if (expected.join('|') !== actual.join('|')) {
      issues.push(`${groupKey} group differs from backend rankings`);
    }
  });

  return issues;
}

function syncLegacyStandardDataOrder(legacyStandardData) {
  const ranking = Object.values(legacyStandardData).find((value) =>
    Array.isArray(value) && value.some((entry) => entry && typeof entry === 'object')
  );

  if (ranking) {
    ranking.sort((left, right) => Number(Object.values(left)[0] || 0) - Number(Object.values(right)[0] || 0));
  }

  return legacyStandardData;
}

function buildLegacySnapshot(report, validation, options = {}) {
  const snapshotReport = syncNarrativeFields(clone(report));
  const legacyStandardData = syncLegacyStandardDataOrder(toLegacyStandardData(snapshotReport));
  const syncIssues = collectSnapshotSyncIssues(snapshotReport, legacyStandardData);
  const lockedFrontendContract = buildLockedFrontendContract(validation, syncIssues);
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
      message: validation.ok ? '甇??瘣曉鞈?撌脤?撽?' : validation.errors[0]?.reason || '鞈?撽?憭望?',
      errors: validation.errors.map((error) => error.reason)
    },
    announcement: snapshotReport.groupShortText,
    broadcast: {
      title: snapshotReport.title,
      text: snapshotReport.groupShortText,
      scriptText: snapshotReport.groupShortText
    },
    ...lockedFrontendContract,
    scoringPolicy: clone(WEIGHTING_POLICY),
    commandSpec: clone(UNIFIED_COMMAND_SPEC),
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
      蝮賣平蝮? row.metrics.蝮賣平蝮?
      蝥??: row.metrics.蝥??,
      餈賜??漱蝮賣: row.metrics.餈賜??漱蝮賣,
      瘣曉?漱蝮賡: row.metrics.瘣曉?漱蝮賡
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
