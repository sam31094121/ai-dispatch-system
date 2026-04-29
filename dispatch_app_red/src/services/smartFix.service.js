const { AUDIT_METRICS, GROUP_KEYS, SUMMARY_METRICS } = require('../constants/dispatchRules');
const {
  buildDefaultFinalConfirmations,
  buildExpectedGroups,
  buildGroupShortText,
  clone,
  toLegacyStandardData
} = require('./dispatchBuild.service');
const { parseDispatchDraft } = require('./dispatchParse.service');
const { compareRankingRows, validateDispatchReport } = require('./dispatchValidate.service');
const { extractDatesFromTitle } = require('../utils/date.util');
const { applyAutoFix, cleanText, normalizeStringArray, splitNameTags, toNumber } = require('../utils/name.util');

function safeArray(value) {
  return Array.isArray(value) ? value : [];
}

function arraysEqual(left, right) {
  if (left.length !== right.length) return false;
  return left.every((value, index) => value === right[index]);
}

function extractJsonCandidates(sourceText) {
  const text = String(sourceText ?? '').trim();
  const candidates = new Set();
  if (!text) return [];

  candidates.add(text);

  for (const match of text.matchAll(/```(?:json)?\s*([\s\S]*?)```/giu)) {
    const candidate = cleanText(match[1]);
    if (candidate) candidates.add(candidate);
  }

  const firstBrace = text.indexOf('{');
  const lastBrace = text.lastIndexOf('}');
  if (firstBrace >= 0 && lastBrace > firstBrace) {
    candidates.add(text.slice(firstBrace, lastBrace + 1));
  }

  return [...candidates];
}

function unwrapSourcePayload(payload) {
  if (!payload || typeof payload !== 'object') return null;
  if (payload.title || payload.公告標題 || payload.rankings || payload.正式名次) return payload;
  if (payload.data) return unwrapSourcePayload(payload.data);
  if (payload.report) return unwrapSourcePayload(payload.report);
  if (payload.standardData) return unwrapSourcePayload(payload.standardData);
  return null;
}

function parseSourcePayload(rawText) {
  for (const candidate of extractJsonCandidates(rawText)) {
    try {
      return unwrapSourcePayload(JSON.parse(candidate));
    } catch {
      continue;
    }
  }

  return null;
}

function appendFix(fixes, field, action, detail) {
  const normalizedDetail = cleanText(detail);
  if (!normalizedDetail) return;

  const alreadyExists = fixes.some(
    (fix) => fix.field === field && fix.action === action && fix.detail === normalizedDetail
  );

  if (!alreadyExists) {
    fixes.push({ field, action, detail: normalizedDetail });
  }
}

function compactFixes(fixes = []) {
  const seen = new Set();
  return safeArray(fixes).filter((fix) => {
    const key = `${fix.field}::${fix.action}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function buildSummaryBoardFromPlatforms(platforms, previousSummaryBoard = {}) {
  const summaryBoard = Object.fromEntries(SUMMARY_METRICS.map((metric) => [metric, 0]));

  AUDIT_METRICS.forEach((metric) => {
    summaryBoard[metric] = safeArray(platforms).reduce(
      (total, platform) => total + Number(platform?.metrics?.[metric] || 0),
      0
    );
  });

  summaryBoard['當日取消退貨'] = toNumber(previousSummaryBoard?.['當日取消退貨']);
  return summaryBoard;
}

function resolveGroupByRank(rank) {
  if (rank <= 4) return 'A1';
  if (rank <= 10) return 'A2';
  if (rank <= 17) return 'B';
  return 'C';
}

function buildResolvedErrors(beforeValidation, afterValidation) {
  const afterSet = new Set(safeArray(afterValidation?.errors));
  return safeArray(beforeValidation?.errors).filter((reason) => !afterSet.has(reason));
}

function buildManualActions(errors = []) {
  const suggestionRules = [
    {
      pattern: /三平台總表必須為 3 筆/u,
      suggestion: '補齊缺少的平台總表資料，再重新執行智慧修復。'
    },
    {
      pattern: /重複平台名稱/u,
      suggestion: '請確認是否重複貼上同一平台，保留三立奕心、民視、公司產品各一筆。'
    },
    {
      pattern: /缺少整合總盤/u,
      suggestion: '若原始資料沒有三平台完整數值，請先補齊平台總表，系統才能重建整合總盤。'
    },
    {
      pattern: /缺少正式名次|缺少有效分級/u,
      suggestion: '請先補齊正式名次資料，至少要有姓名與四個核心指標。'
    },
    {
      pattern: /缺少 .*建議內容|建議名單重複|建議名次與正式名次不一致/u,
      suggestion: '若仍有建議欄位問題，請確認是否有重複姓名或空白建議文。'
    },
    {
      pattern: /重複姓名|分級名單重複分配/u,
      suggestion: '請確認是否有同名人員重複出現在正式名次或多個分組。'
    },
    {
      pattern: /姓名必須使用正名|禁止錯寫/u,
      suggestion: '請把姓名修成正式正名後再重新修復。'
    }
  ];

  const actions = [];
  safeArray(errors).forEach((reason) => {
    const suggestion =
      suggestionRules.find((rule) => rule.pattern.test(reason))?.suggestion ||
      '這項錯誤仍需要人工確認原始資料後再重新修復。';

    if (!actions.some((item) => item.reason === reason && item.suggestion === suggestion)) {
      actions.push({ reason, suggestion });
    }
  });

  return actions;
}

function buildFallbackAdvice(row, totalCount) {
  if (row.rank <= 3) {
    return '維持領先節奏，優先放大高轉換與續單優勢。';
  }

  if (row.group === 'A1') {
    return '穩住核心梯隊節奏，優先鞏固高價值名單與續單表現。';
  }

  if (row.group === 'A2') {
    return '距離 A1 不遠，先補強續單與追續成交，就有機會再往前推進。';
  }

  if (row.group === 'B') {
    return '先把成交密度拉穩，再放大續單表現，會更容易往 A2 推進。';
  }

  if (row.isNew) {
    return '先把基本成交節奏拉起來，穩定累積有效名單與跟進紀律。';
  }

  if (row.rank === totalCount) {
    return '先把基本盤補齊，優先追回成交與續單指標，避免持續落後。';
  }

  return '維持穩定出單節奏，優先補強續單與成交效率。';
}

function repairReport(report) {
  const repairedReport = clone(report);
  const fixes = [];
  const addFix = (field, action, detail) => appendFix(fixes, field, action, detail);
  const originalSummaryBoard = clone(repairedReport.summaryBoard || {});
  const originalAdviceList = clone(repairedReport.adviceList || []);
  const originalFinalConfirmations = normalizeStringArray(repairedReport.finalConfirmations);
  const originalGroupShortText = cleanText(repairedReport.groupShortText);
  let nameFixedCount = 0;

  const fixName = (value) => {
    const originalName = splitNameTags(value).name;
    const fixedName = splitNameTags(applyAutoFix(value)).name;
    if (fixedName && fixedName !== originalName) {
      nameFixedCount += 1;
    }
    return fixedName || originalName;
  };

  repairedReport.rankings = safeArray(repairedReport.rankings).map((row) => ({
    ...row,
    name: fixName(row.name)
  }));
  repairedReport.groups = Object.fromEntries(
    GROUP_KEYS.map((groupKey) => [
      groupKey,
      safeArray(repairedReport.groups?.[groupKey]).map(fixName).filter(Boolean)
    ])
  );
  repairedReport.adviceList = safeArray(repairedReport.adviceList).map((row) => ({
    ...row,
    name: fixName(row.name)
  }));
  repairedReport.audit.excludedEmployees = safeArray(repairedReport.audit?.excludedEmployees).map((entry) => ({
    ...entry,
    name: fixName(entry.name)
  })).filter((entry) => entry.name);

  if (nameFixedCount > 0) {
    addFix('name', '名稱正名', `已自動修正 ${nameFixedCount} 處常見姓名錯寫。`);
  }

  const extractedDates = extractDatesFromTitle(repairedReport.title);
  
  // 進階優化：日期自動推導邏輯 (Today -> Tomorrow)
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  const day = now.getDate();
  const todayROC = `${year - 1911}/${String(month).padStart(2, '0')}/${String(day).padStart(2, '0')}`;
  
  const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const tomorrowROC = `${tomorrow.getFullYear() - 1911}/${String(tomorrow.getMonth() + 1).padStart(2, '0')}/${String(tomorrow.getDate()).padStart(2, '0')}`;

  if (!repairedReport.settlementDate || repairedReport.settlementDate === '115/04/27') {
    repairedReport.settlementDate = todayROC;
    addFix('settlementDate', '日期自動推導', `檢測到今日為 ${todayROC}，已自動將結算日更新。`);
  }
  if (!repairedReport.dispatchDate || repairedReport.dispatchDate === '115/04/28') {
    repairedReport.dispatchDate = tomorrowROC;
    addFix('dispatchDate', '日期自動推導', `檢測到派單需求，已自動將派單日推導為明日 ${tomorrowROC}。`);
  }

  if (extractedDates.settlementDate && extractedDates.settlementDate !== repairedReport.settlementDate) {
    const previousDate = repairedReport.settlementDate || '空白';
    repairedReport.settlementDate = extractedDates.settlementDate;
    addFix('settlementDate', '日期同步', `依公告標題將結算日從「${previousDate}」修正為「${repairedReport.settlementDate}」。`);
  }
  if (extractedDates.dispatchDate && extractedDates.dispatchDate !== repairedReport.dispatchDate) {
    const previousDate = repairedReport.dispatchDate || '空白';
    repairedReport.dispatchDate = extractedDates.dispatchDate;
    addFix('dispatchDate', '日期同步', `依公告標題將派單日從「${previousDate}」修正為「${repairedReport.dispatchDate}」。`);
  }

  const originalOrder = JSON.stringify(safeArray(repairedReport.rankings).map((row) => row.name));
  repairedReport.rankings.sort(compareRankingRows);
  if (originalOrder !== JSON.stringify(repairedReport.rankings.map((row) => row.name))) {
    addFix('rankings', '正式排序重建', '已依正式排序規則重新排列正式名次。');
  }

  const excludedNameSet = new Set(
    safeArray(repairedReport.audit?.excludedEmployees).map((entry) => entry.name).filter(Boolean)
  );
  if (excludedNameSet.size > 0) {
    const removedCount = repairedReport.rankings.filter((row) => excludedNameSet.has(row.name)).length;
    if (removedCount > 0) {
      repairedReport.rankings = repairedReport.rankings.filter((row) => !excludedNameSet.has(row.name));
      addFix('rankings', '離職移除', `已從正式名次移除 ${removedCount} 位已離職人員。`);
    }
  }

  let rankOrGroupChanged = false;
  repairedReport.rankings = safeArray(repairedReport.rankings).map((row, index) => {
    const nextRank = index + 1;
    const nextGroup = resolveGroupByRank(nextRank);
    if (row.rank !== nextRank || row.group !== nextGroup) {
      rankOrGroupChanged = true;
    }
    return {
      ...row,
      rank: nextRank,
      group: nextGroup
    };
  });
  if (rankOrGroupChanged) {
    addFix('rankings', '名次與分級對齊', '已將名次重編為 1 ~ N，並同步更新 A1 / A2 / B / C 分級。');
  }

  const rebuiltGroups = buildExpectedGroups(repairedReport.rankings);
  if (!GROUP_KEYS.every((groupKey) => arraysEqual(safeArray(repairedReport.groups?.[groupKey]), rebuiltGroups[groupKey]))) {
    repairedReport.groups = rebuiltGroups;
    addFix('groups', '分組重建', '已依修復後的正式名次重建分組名單。');
  } else {
    repairedReport.groups = rebuiltGroups;
  }

  if (safeArray(repairedReport.audit?.platforms).length > 0) {
    repairedReport.summaryBoard = buildSummaryBoardFromPlatforms(
      repairedReport.audit.platforms,
      repairedReport.summaryBoard
    );
    const summaryChanged = SUMMARY_METRICS.some(
      (metric) => toNumber(originalSummaryBoard?.[metric]) !== toNumber(repairedReport.summaryBoard?.[metric])
    );
    if (summaryChanged) {
      addFix('summaryBoard', '總盤重算', `已依 ${repairedReport.audit.platforms.length} 平台數據重建整合總盤。`);
    }
  }

  const rankingCount = safeArray(repairedReport.rankings).length;
  repairedReport.rankings = safeArray(repairedReport.rankings).map((row) => {
    const advice = cleanText(row.advice) || buildFallbackAdvice(row, rankingCount);
    return {
      ...row,
      advice
    };
  });

  repairedReport.adviceList = repairedReport.rankings.map((row) => ({
    name: row.name,
    rank: row.rank,
    group: row.group,
    text: row.advice
  }));

  if (JSON.stringify(originalAdviceList) !== JSON.stringify(repairedReport.adviceList)) {
    addFix('adviceList', '建議同步', `已依修復後的正式名次重建 ${repairedReport.adviceList.length} 筆建議資料。`);
  }

  repairedReport.finalConfirmations = buildDefaultFinalConfirmations(repairedReport);
  repairedReport.groupShortText = buildGroupShortText(repairedReport);

  let validation = validateDispatchReport(repairedReport);

  repairedReport.audit.result = validation.status;
  repairedReport.auditResult = validation.status;
  repairedReport.finalConfirmations = buildDefaultFinalConfirmations(repairedReport);
  repairedReport.groupShortText = buildGroupShortText(repairedReport);
  if (!arraysEqual(originalFinalConfirmations, normalizeStringArray(repairedReport.finalConfirmations))) {
    addFix('finalConfirmations', '最後確認重建', '已依最新審計狀態重建最後確認內容。');
  }
  if (originalGroupShortText !== cleanText(repairedReport.groupShortText)) {
    addFix('groupShortText', '精簡版重建', '已依修復後的資料重建群組超精簡版。');
  }

  validation = validateDispatchReport(repairedReport);

  return {
    fixes,
    report: repairedReport,
    validation
  };
}

function normalizeSourceRankingRows(sourcePayload) {
  return safeArray(sourcePayload?.rankings || sourcePayload?.正式名次)
    .map((row, index) => ({
      rank: Math.max(1, Math.trunc(toNumber(row?.rank || row?.名次) || index + 1)),
      name: splitNameTags(row?.name || row?.姓名).name,
      group: cleanText(row?.group || row?.分級).toUpperCase(),
      advice: cleanText(row?.advice || row?.建議 || row?.text)
    }))
    .filter((row) => row.name);
}

function collectPayloadFixes(sourcePayload, fixedStandardData, fixes) {
  if (!sourcePayload) return;

  const sourceRankings = normalizeSourceRankingRows(sourcePayload);
  const fixedRankings = safeArray(fixedStandardData?.正式名次);

  if (sourceRankings.length > 0) {
    const sourceNames = sourceRankings.map((row) => row.name);
    const fixedNames = fixedRankings.map((row) => row.姓名);

    if (!arraysEqual(sourceNames, fixedNames)) {
      appendFix(
        fixes,
        'rankings',
        '正式排序重建',
        `已依正式規則重新排序 ${fixedRankings.length} 人名次，消除原始輸入的順位衝突。`
      );
    }

    const sourceRanks = sourceRankings.map((row) => row.rank);
    const fixedRanksOnly = fixedRankings.map((row) => Number(row.名次 || 0));
    if (!arraysEqual(sourceRanks, fixedRanksOnly)) {
      appendFix(
        fixes,
        'rankings',
        '名次連號重編',
        '已將正式名次重編為連續 1 ~ N，避免順位斷號或重複。'
      );
    }

    const sourceGroupMismatchCount = sourceRankings.filter((row) => {
      const fixedRow = fixedRankings.find((candidate) => candidate.姓名 === row.name);
      return fixedRow && row.group && row.group !== fixedRow.分級;
    }).length;

    if (sourceGroupMismatchCount > 0) {
      appendFix(
        fixes,
        'groups',
        '分級同步',
        `${sourceGroupMismatchCount} 筆名次與分級衝突已依正式名次重新對齊。`
      );
    }
  }

  const sourceGroups = sourcePayload?.groups || sourcePayload?.分級 || {};
  const changedGroups = GROUP_KEYS.filter((groupKey) => {
    const sourceNames = safeArray(sourceGroups?.[groupKey]).map((name) => splitNameTags(name).name).filter(Boolean);
    const fixedNames = safeArray(fixedStandardData?.分級?.[groupKey]);
    return sourceNames.length > 0 && !arraysEqual(sourceNames, fixedNames);
  });

  if (changedGroups.length > 0) {
    appendFix(
      fixes,
      'groups',
      '群組重建',
      `已重建 ${changedGroups.join(' / ')} 分組內容，確保與正式名次完全一致。`
    );
  }

  const sourceAdvice = safeArray(sourcePayload?.adviceList || sourcePayload?.每人一句建議 || sourcePayload?.建議);
  const fixedAdvice = safeArray(fixedStandardData?.每人一句建議);
  if (sourceAdvice.length > 0 || fixedAdvice.length > 0) {
    const fixedAdviceMap = new Map(fixedAdvice.map((entry) => [entry.姓名, entry]));
    const missingAdviceCount = sourceAdvice.filter((entry) => !cleanText(entry?.text || entry?.建議)).length;
    const adviceMismatchCount = sourceAdvice.filter((entry) => {
      const name = splitNameTags(entry?.name || entry?.姓名).name;
      const fixedEntry = fixedAdviceMap.get(name);
      if (!fixedEntry) return false;
      const sourceRank = Math.max(1, Math.trunc(toNumber(entry?.rank || entry?.名次) || 0));
      const sourceGroup = cleanText(entry?.group || entry?.分級).toUpperCase();
      return (
        (sourceRank && sourceRank !== Number(fixedEntry.名次 || 0)) ||
        (sourceGroup && sourceGroup !== fixedEntry.分級)
      );
    }).length;

    if (missingAdviceCount > 0 || adviceMismatchCount > 0 || sourceAdvice.length !== fixedAdvice.length) {
      appendFix(
        fixes,
        'adviceList',
        '建議補齊與同步',
        `已補齊缺漏建議並同步 ${fixedAdvice.length} 筆建議的名次與分級。`
      );
    }
  }

  const sourceSummaryBoard = sourcePayload?.summaryBoard || sourcePayload?.整合總盤;
  if (sourceSummaryBoard) {
    const changedMetrics = SUMMARY_METRICS.filter(
      (metric) => toNumber(sourceSummaryBoard?.[metric]) !== toNumber(fixedStandardData?.整合總盤?.[metric])
    );

    if (changedMetrics.length > 0) {
      appendFix(
        fixes,
        'summaryBoard',
        '總盤重算',
        `已依審計平台資料重算 ${changedMetrics.length} 個總盤欄位，消除加總衝突。`
      );
    }
  }

  const sourceAudit = sourcePayload?.audit || sourcePayload?.審計結論 || {};
  const sourceAuditResult = cleanText(sourcePayload?.auditResult || sourceAudit?.result || sourceAudit?.結果).toUpperCase();
  const fixedAuditResult = cleanText(fixedStandardData?.審計結論?.結果).toUpperCase();
  if (sourceAuditResult && sourceAuditResult !== fixedAuditResult) {
    appendFix(
      fixes,
      'auditResult',
      '審計狀態同步',
      `已將審計狀態同步為 ${fixedAuditResult}，避免文案與實際驗證結果互相矛盾。`
    );
  }

  const sourceFinalConfirmations = normalizeStringArray(sourcePayload?.finalConfirmations || sourcePayload?.最後確認);
  const fixedFinalConfirmations = normalizeStringArray(fixedStandardData?.最後確認);
  if (sourceFinalConfirmations.length > 0 && !arraysEqual(sourceFinalConfirmations, fixedFinalConfirmations)) {
    appendFix(
      fixes,
      'finalConfirmations',
      '最後確認重建',
      '已依最新審計狀態、離職列示與派單日期重建最後確認內容。'
    );
  }

  const sourceShortText = cleanText(sourcePayload?.groupShortText || sourcePayload?.群組超精簡版);
  const fixedShortText = cleanText(fixedStandardData?.群組超精簡版);
  if (sourceShortText && sourceShortText !== fixedShortText) {
    appendFix(
      fixes,
      'groupShortText',
      '精簡版重建',
      '已依修復後的審計、名次與分組資料重寫群組超精簡版。'
    );
  }
}

function collectReportFixes(originalReport, repairedReport, fixes) {
  const changedSummaryMetrics = SUMMARY_METRICS.filter(
    (metric) => toNumber(originalReport?.summaryBoard?.[metric]) !== toNumber(repairedReport?.summaryBoard?.[metric])
  );
  if (changedSummaryMetrics.length > 0) {
    appendFix(
      fixes,
      'summaryBoard',
      '總盤重算',
      `已重新整合 ${changedSummaryMetrics.length} 個總盤指標，讓數值與審計平台資料一致。`
    );
  }

  const generatedAdviceCount = safeArray(repairedReport.rankings).filter((row) => {
    const originalRow = safeArray(originalReport.rankings).find((candidate) => candidate.name === row.name);
    return !cleanText(originalRow?.advice) && cleanText(row.advice);
  }).length;
  if (generatedAdviceCount > 0) {
    appendFix(
      fixes,
      'adviceList',
      '缺漏建議補齊',
      `已自動補齊 ${generatedAdviceCount} 筆缺漏建議，避免建議區塊與正式名次脫鉤。`
    );
  }

  if (cleanText(originalReport.auditResult).toUpperCase() !== cleanText(repairedReport.auditResult).toUpperCase()) {
    appendFix(
      fixes,
      'auditResult',
      '審計狀態同步',
      `已將審計結果改為 ${repairedReport.auditResult}，讓文案與驗證狀態一致。`
    );
  }

  const originalFinalConfirmations = normalizeStringArray(originalReport.finalConfirmations);
  const repairedFinalConfirmations = normalizeStringArray(repairedReport.finalConfirmations);
  if (!arraysEqual(originalFinalConfirmations, repairedFinalConfirmations)) {
    appendFix(
      fixes,
      'finalConfirmations',
      '最後確認重建',
      '已用最新修復結果重建最後確認，避免保留過時結論。'
    );
  }

  if (cleanText(originalReport.groupShortText) !== cleanText(repairedReport.groupShortText)) {
    appendFix(
      fixes,
      'groupShortText',
      '精簡版重建',
      '已讓群組超精簡版與修復後的正式資料完全同步。'
    );
  }
}

function smartFixRawInput(rawText) {
  const originalDraft = parseDispatchDraft({
    rawText,
    operator: 'SMART_FIX',
    source: 'smart-fix'
  });
  const sourcePayload = parseSourcePayload(rawText);
  const repaired = repairReport(originalDraft.report);
  const fixedStandardData = toLegacyStandardData(repaired.report);
  const fixedJson = JSON.stringify(fixedStandardData, null, 2);
  const fixedDraft = parseDispatchDraft({
    rawText: fixedJson,
    operator: 'SMART_FIX',
    source: 'smart-fix-fixed'
  });

  const fixes = [...safeArray(repaired.fixes)];
  collectPayloadFixes(sourcePayload, fixedStandardData, fixes);
  collectReportFixes(originalDraft.report, fixedDraft.report, fixes);
  const compactedFixes = compactFixes(fixes);
  const resolvedErrors = buildResolvedErrors(originalDraft.validation, fixedDraft.validation);
  const manualActions = buildManualActions(fixedDraft.validation.errors.map((item) => item.reason));

  return {
    fixedJson,
    fixes: compactedFixes,
    fixCount: compactedFixes.length,
    resolvedErrorCount: resolvedErrors.length,
    resolvedErrors,
    manualActions,
    remainingErrors: fixedDraft.validation.errors.length,
    remainingWarnings: fixedDraft.validation.warnings.length,
    validation: {
      status: fixedDraft.validation.status,
      errors: fixedDraft.validation.errors.map((item) => item.reason),
      warnings: fixedDraft.validation.warnings.map((item) => item.reason)
    },
    beforeValidation: {
      status: originalDraft.validation.status,
      errors: originalDraft.validation.errors.map((item) => item.reason),
      warnings: originalDraft.validation.warnings.map((item) => item.reason)
    }
  };
}

module.exports = {
  smartFixRawInput
};
