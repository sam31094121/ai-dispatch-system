const DEFAULT_ANNOUNCEMENT = require('./default-announcement.json');

const AUDIT_META_KEYS = new Set(['結果', '規則', '特別說明', '審計列示不入派單']);
const GROUP_KEYS = ['A1', 'A2', 'B', 'C'];
const PLATFORM_METRICS = [
  '累積總派單數',
  '累積派單總成交數',
  '累積追續總成交數',
  '當日續單金額',
  '本月業績',
  '追續單總金額'
];
const RANKING_METRICS = ['總業績', '續單金額', '追續成交總數', '派單成交總通數'];

const cloneValue = typeof globalThis.structuredClone === 'function'
  ? (value) => globalThis.structuredClone(value)
  : (value) => JSON.parse(JSON.stringify(value));

function clone(value) {
  return cloneValue(value);
}

function cleanText(value) {
  return String(value ?? '')
    .replace(/\u3000/g, ' ')
    .replace(/\r/g, '')
    .trim();
}

function toNumber(value) {
  const numeric = Number(String(value ?? '').replace(/,/g, '').trim());
  return Number.isFinite(numeric) ? numeric : 0;
}

function normalizeName(value) {
  return cleanText(value).replace(/\s+/g, '');
}

function normalizeStringArray(value) {
  return Array.isArray(value)
    ? value.map((item) => cleanText(item)).filter(Boolean)
    : [];
}

function normalizeRetiredList(value) {
  return Array.isArray(value)
    ? value
      .map((item) => ({
        姓名: normalizeName(item?.姓名),
        原因: cleanText(item?.原因)
      }))
      .filter((item) => item.姓名)
    : [];
}

function splitNewbieTag(name, explicitTag) {
  const source = normalizeName(name);
  const newbieMatch = source.match(/^(.*?)(?:（新人）|\(新人\)|新人)$/u);
  if (!newbieMatch) {
    return {
      姓名: source,
      標記: cleanText(explicitTag)
    };
  }

  return {
    姓名: normalizeName(newbieMatch[1]),
    標記: cleanText(explicitTag) || '新人'
  };
}

function normalizeRankingRow(row) {
  const tagged = splitNewbieTag(row?.姓名, row?.標記);
  const normalized = {
    名次: toNumber(row?.名次),
    姓名: tagged.姓名,
    總業績: toNumber(row?.總業績),
    續單金額: toNumber(row?.續單金額),
    追續成交總數: toNumber(row?.追續成交總數),
    派單成交總通數: toNumber(row?.派單成交總通數),
    分級: cleanText(row?.分級).toUpperCase(),
    建議: cleanText(row?.建議)
  };

  if (tagged.標記) normalized.標記 = tagged.標記;
  return normalized;
}

function normalizeAuditSection(auditInput = {}) {
  const normalized = {
    結果: cleanText(auditInput?.結果).toUpperCase(),
    規則: cleanText(auditInput?.規則),
    特別說明: normalizeStringArray(auditInput?.特別說明),
    審計列示不入派單: normalizeRetiredList(auditInput?.['審計列示不入派單'])
  };

  Object.entries(auditInput).forEach(([key, value]) => {
    const label = cleanText(key);
    if (!label || AUDIT_META_KEYS.has(label)) return;
    normalized[label] = {
      累積總派單數: toNumber(value?.累積總派單數),
      累積派單總成交數: toNumber(value?.累積派單總成交數),
      累積追續總成交數: toNumber(value?.累積追續總成交總數 ?? value?.累積追續總成交數),
      當日續單金額: toNumber(value?.當日續單金額),
      本月業績: toNumber(value?.本月業績),
      追續單總金額: toNumber(value?.追續單總金額),
      通過: Boolean(value?.通過)
    };
  });

  return normalized;
}

function normalizeAggregateTotals(input = {}) {
  return {
    累積總派單數: toNumber(input?.累積總派單數),
    累積派單總成交數: toNumber(input?.累積派單總成交數),
    累積追續總成交數: toNumber(input?.累積追續總成交總數 ?? input?.累積追續總成交數),
    當日續單金額: toNumber(input?.當日續單金額),
    本月業績: toNumber(input?.本月業績),
    追續單總金額: toNumber(input?.追續單總金額),
    當日取消退貨: toNumber(input?.當日取消退貨)
  };
}

function normalizeGroups(groups = {}) {
  return Object.fromEntries(
    GROUP_KEYS.map((key) => [
      key,
      normalizeStringArray(groups?.[key]).map((name) => splitNewbieTag(name).姓名)
    ])
  );
}

function normalizeAnnouncementData(input) {
  const source = clone(input || {});
  return {
    公告標題: cleanText(source?.公告標題),
    日期資訊: {
      結算日: cleanText(source?.日期資訊?.結算日),
      派單日: cleanText(source?.日期資訊?.派單日)
    },
    審計結論: normalizeAuditSection(source?.審計結論),
    整合總盤: normalizeAggregateTotals(source?.整合總盤),
    正式名次: Array.isArray(source?.正式名次) ? source.正式名次.map(normalizeRankingRow) : [],
    分級: normalizeGroups(source?.分級),
    最後確認: normalizeStringArray(source?.最後確認),
    群組超精簡版: cleanText(source?.群組超精簡版)
  };
}

function extractCandidates(rawText) {
  const source = String(rawText ?? '').trim();
  const candidates = new Set();
  if (!source) return [];

  candidates.add(source);

  const fenced = source.match(/```(?:json)?\s*([\s\S]*?)```/iu);
  if (fenced?.[1]) candidates.add(fenced[1].trim());

  const firstBrace = source.indexOf('{');
  const lastBrace = source.lastIndexOf('}');
  if (firstBrace >= 0 && lastBrace > firstBrace) {
    candidates.add(source.slice(firstBrace, lastBrace + 1).trim());
  }

  return [...candidates];
}

function unwrapStandardPayload(parsed) {
  if (parsed && typeof parsed === 'object') {
    if (parsed.公告標題) return parsed;
    if (parsed.standardData?.公告標題) return parsed.standardData;
    if (parsed.data?.standardData?.公告標題) return parsed.data.standardData;
    if (parsed.data?.公告標題) return parsed.data;
  }
  return null;
}

function parseAnnouncementText(rawText) {
  const text = cleanText(rawText);
  if (!text) {
    throw new Error('請貼上完整公告文字或標準 JSON。');
  }

  const candidates = extractCandidates(text);
  for (const candidate of candidates) {
    try {
      const parsed = JSON.parse(candidate);
      const unwrapped = unwrapStandardPayload(parsed);
      if (unwrapped) return normalizeAnnouncementData(unwrapped);
    } catch {
      continue;
    }
  }

  throw new Error('目前只接受可解析的標準 JSON 公告內容，請直接貼上完整 JSON 區塊。');
}

function getAuditPlatformEntries(audit = {}) {
  return Object.entries(audit).filter(([key]) => !AUDIT_META_KEYS.has(key));
}

function compareOfficialRows(left, right) {
  if (right.總業績 !== left.總業績) return right.總業績 - left.總業績;
  if (right.續單金額 !== left.續單金額) return right.續單金額 - left.續單金額;
  if (right.追續成交總數 !== left.追續成交總數) return right.追續成交總數 - left.追續成交總數;
  if (right.派單成交總通數 !== left.派單成交總通數) return right.派單成交總通數 - left.派單成交總通數;
  return 0;
}

function collectExpectedGroups(ranking) {
  const grouped = { A1: [], A2: [], B: [], C: [] };
  ranking.forEach((row) => {
    if (grouped[row.分級]) grouped[row.分級].push(row.姓名);
  });
  return grouped;
}

function arraysEqual(left, right) {
  if (left.length !== right.length) return false;
  return left.every((value, index) => value === right[index]);
}

function collectAllStrings(value, bucket = []) {
  if (typeof value === 'string') {
    bucket.push(value);
    return bucket;
  }
  if (Array.isArray(value)) {
    value.forEach((item) => collectAllStrings(item, bucket));
    return bucket;
  }
  if (value && typeof value === 'object') {
    Object.values(value).forEach((item) => collectAllStrings(item, bucket));
  }
  return bucket;
}

function buildSummary(data) {
  const ranking = Array.isArray(data?.正式名次) ? data.正式名次 : [];
  const groups = data?.分級 || {};
  const retired = Array.isArray(data?.審計結論?.['審計列示不入派單'])
    ? data.審計結論['審計列示不入派單']
    : [];

  return {
    結算日: data?.日期資訊?.結算日 || '',
    派單日: data?.日期資訊?.派單日 || '',
    審計結果: data?.審計結論?.結果 || 'FAIL',
    正式人數: ranking.length,
    前十人數: Math.min(ranking.length, 10),
    離職列示人數: retired.length,
    本月業績: data?.整合總盤?.本月業績 || 0,
    當日續單金額: data?.整合總盤?.當日續單金額 || 0,
    當日取消退貨: data?.整合總盤?.當日取消退貨 || 0,
    A1人數: Array.isArray(groups.A1) ? groups.A1.length : 0,
    A2人數: Array.isArray(groups.A2) ? groups.A2.length : 0,
    B人數: Array.isArray(groups.B) ? groups.B.length : 0,
    C人數: Array.isArray(groups.C) ? groups.C.length : 0
  };
}

function validateAnnouncementData(data) {
  const errors = [];
  const warnings = [];

  if (!data?.公告標題) errors.push('缺少「公告標題」。');
  if (!data?.日期資訊?.結算日) errors.push('缺少「日期資訊.結算日」。');
  if (!data?.日期資訊?.派單日) errors.push('缺少「日期資訊.派單日」。');

  const audit = data?.審計結論 || {};
  if (!audit.結果) errors.push('缺少「審計結論.結果」。');
  if (!audit.規則) errors.push('缺少「審計結論.規則」。');

  const platformEntries = getAuditPlatformEntries(audit);
  if (platformEntries.length !== 3) {
    errors.push(`三平台總表必須剛好 3 個，目前為 ${platformEntries.length} 個。`);
  }

  const aggregatePlatforms = {
    累積總派單數: 0,
    累積派單總成交數: 0,
    累積追續總成交數: 0,
    當日續單金額: 0,
    本月業績: 0,
    追續單總金額: 0
  };

  platformEntries.forEach(([platformName, platform]) => {
    PLATFORM_METRICS.forEach((metric) => {
      if (!Number.isFinite(Number(platform?.[metric]))) {
        errors.push(`平台「${platformName}」缺少完整欄位：${metric}。`);
      }
      aggregatePlatforms[metric] += toNumber(platform?.[metric]);
    });

    if (typeof platform?.通過 !== 'boolean') {
      errors.push(`平台「${platformName}」缺少布林欄位「通過」。`);
    }
  });

  const totals = data?.整合總盤 || {};
  PLATFORM_METRICS.forEach((metric) => {
    if (toNumber(totals?.[metric]) !== aggregatePlatforms[metric]) {
      errors.push(`整合總盤「${metric}」與三平台加總不一致。`);
    }
  });

  const ranking = Array.isArray(data?.正式名次) ? data.正式名次 : [];
  if (!ranking.length) errors.push('正式名次不得為空。');

  const rankSet = new Set();
  const nameSet = new Set();

  ranking.forEach((row, index) => {
    if (row.名次 !== index + 1) {
      errors.push(`正式名次第 ${index + 1} 列不是連續名次。`);
    }
    if (rankSet.has(row.名次)) {
      errors.push(`正式名次重複：第 ${row.名次} 名重複。`);
    }
    rankSet.add(row.名次);

    if (!row.姓名) {
      errors.push(`正式名次第 ${index + 1} 列缺少姓名。`);
    } else if (nameSet.has(row.姓名)) {
      errors.push(`正式名次姓名重複：${row.姓名}。`);
    }
    nameSet.add(row.姓名);

    RANKING_METRICS.forEach((metric) => {
      if (!Number.isFinite(Number(row?.[metric]))) {
        errors.push(`正式名次 ${row.姓名 || `第 ${index + 1} 列`} 缺少欄位：${metric}。`);
      }
    });

    if (!GROUP_KEYS.includes(row.分級)) {
      errors.push(`正式名次 ${row.姓名 || `第 ${index + 1} 列`} 的分級無效：${row.分級 || '空值'}。`);
    }
    if (!row.建議) {
      errors.push(`正式名次 ${row.姓名 || `第 ${index + 1} 列`} 缺少一對一建議。`);
    }
  });

  for (let index = 0; index < ranking.length - 1; index += 1) {
    if (compareOfficialRows(ranking[index], ranking[index + 1]) > 0) {
      errors.push(`正式名次排序不符合規則，${ranking[index + 1].姓名} 應排在 ${ranking[index].姓名} 前面。`);
      break;
    }
  }

  const expectedGroups = collectExpectedGroups(ranking);
  const groups = data?.分級 || {};

  GROUP_KEYS.forEach((groupKey) => {
    const groupNames = Array.isArray(groups[groupKey]) ? groups[groupKey] : [];
    if (!arraysEqual(groupNames, expectedGroups[groupKey])) {
      errors.push(`分級 ${groupKey} 與正式名次不一致。`);
    }
  });

  const retiredList = Array.isArray(audit?.['審計列示不入派單']) ? audit['審計列示不入派單'] : [];
  const retiredNames = retiredList.map((item) => item.姓名).filter(Boolean);

  retiredNames.forEach((name) => {
    if (nameSet.has(name)) {
      errors.push(`已離職人員 ${name} 不得進入正式名次。`);
    }
    GROUP_KEYS.forEach((groupKey) => {
      if ((groups[groupKey] || []).includes(name)) {
        errors.push(`已離職人員 ${name} 不得進入 ${groupKey} 分級。`);
      }
    });
  });

  if (nameSet.has('陳旭宜')) {
    errors.push('已離職人員陳旭宜只可列在審計區，不得進入正式派單。');
  }

  if (!retiredNames.includes('陳旭宜')) {
    warnings.push('本輪建議在審計列示中保留「陳旭宜／已離職」。');
  }

  if (!data?.最後確認?.length) errors.push('缺少「最後確認」內容。');
  if (!data?.群組超精簡版) errors.push('缺少「群組超精簡版」。');

  const allStrings = collectAllStrings(data);
  if (allStrings.some((text) => /徐華(?!妤)/u.test(String(text)))) {
    errors.push('姓名必須使用正名「徐華妤」，不得出現其他錯寫。');
  }

  return {
    ok: errors.length === 0,
    status: errors.length === 0 ? 'PASS' : 'FAIL',
    errors,
    warnings,
    summary: buildSummary(data),
    rules: {
      sourceOfTruth: 'backend',
      frontendMustNotCompute: true,
      rankingOrder: '總業績 → 續單金額 → 追續成交總數 → 派單成交總通數'
    }
  };
}

module.exports = {
  DEFAULT_ANNOUNCEMENT,
  GROUP_KEYS,
  clone,
  normalizeAnnouncementData,
  parseAnnouncementText,
  validateAnnouncementData,
  buildSummary
};
