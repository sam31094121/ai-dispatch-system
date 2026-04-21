const {
  AUDIT_METRICS,
  GROUP_KEYS,
  RANKING_METRICS,
  SORT_RULE_TEXT,
  SUMMARY_METRICS
} = require('../constants/dispatchRules');
const { buildExpectedGroups } = require('./dispatchBuild.service');
const { cleanText, getBannedNameViolation } = require('../utils/name.util');

function compareRankingRows(left, right) {
  const leftScore =
    Number(left.metrics?.總業績 || 0) +
    Number(left.metrics?.續單金額 || 0) +
    Number(left.metrics?.追續成交總數 || 0);
  const rightScore =
    Number(right.metrics?.總業績 || 0) +
    Number(right.metrics?.續單金額 || 0) +
    Number(right.metrics?.追續成交總數 || 0);

  if (rightScore !== leftScore) {
    return rightScore - leftScore;
  }

  // 二次排序：派單成交總通數
  if ((right.metrics?.派單成交總通數 || 0) !== (left.metrics?.派單成交總通數 || 0)) {
    return (right.metrics?.派單成交總通數 || 0) - (left.metrics?.派單成交總通數 || 0);
  }

  return 0;
}

function collectAllStrings(value, bucket = []) {
  if (typeof value === 'string') {
    bucket.push(value);
    return bucket;
  }
  if (Array.isArray(value)) {
    value.forEach((entry) => collectAllStrings(entry, bucket));
    return bucket;
  }
  if (value && typeof value === 'object') {
    Object.values(value).forEach((entry) => collectAllStrings(entry, bucket));
  }
  return bucket;
}

function createSummary(report) {
  return {
    審計結果: report.auditResult || 'FAIL',
    正式人數: Array.isArray(report.rankings) ? report.rankings.length : 0,
    離職列示人數: Array.isArray(report.audit?.excludedEmployees) ? report.audit.excludedEmployees.length : 0,
    本月業績: report.summaryBoard?.['本月業績'] || 0
  };
}

function dedupeIssues(issues) {
  const seen = new Set();
  return issues.filter((issue) => {
    const key = `${issue.field}::${issue.reason}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function validateDispatchReport(report) {
  const errors = [];
  const warnings = [];
  const pushError = (field, reason) => errors.push({ field, reason });
  const pushWarning = (field, reason) => warnings.push({ field, reason });

  if (!cleanText(report.title)) pushError('title', '缺少公告標題');
  if (!cleanText(report.audit?.result)) pushError('audit', '缺少審計結論');
  if (!cleanText(report.audit?.rule)) pushError('audit.rule', '缺少審計規則');
  if (!Array.isArray(report.audit?.platforms) || report.audit.platforms.length === 0) {
    pushError('audit.platforms', '缺少三平台總表');
  }
  if (Array.isArray(report.audit?.platforms) && report.audit.platforms.length !== 3) {
    pushError('audit.platforms', `三平台總表必須為 3 筆，目前為 ${report.audit.platforms.length} 筆`);
  }

  const summaryBoard = report.summaryBoard || {};
  const hasSummarySignal = SUMMARY_METRICS.some((metric) => Number(summaryBoard?.[metric]) !== 0);
  if (!hasSummarySignal) {
    pushError('summaryBoard', '缺少整合總盤');
  }

  if (!Array.isArray(report.rankings) || report.rankings.length === 0) {
    pushError('rankings', '缺少正式名次');
  }

  const hasGroups =
    report.groups &&
    GROUP_KEYS.every((groupKey) => Array.isArray(report.groups[groupKey])) &&
    GROUP_KEYS.some((groupKey) => report.groups[groupKey].length > 0);
  if (!hasGroups) {
    pushError('groups', '缺少 A1 / A2 / B / C 分級資料');
  }

  if (!Array.isArray(report.adviceList) || report.adviceList.length === 0) {
    pushError('adviceList', '缺少每人一句建議');
  }
  if (!Array.isArray(report.finalConfirmations) || report.finalConfirmations.length === 0) {
    pushError('finalConfirmations', '缺少最後確認');
  }
  if (!cleanText(report.groupShortText)) {
    pushError('groupShortText', '缺少群組超精簡版');
  }

  const platformNameSet = new Set();
  (report.audit?.platforms || []).forEach((platform, index) => {
    const platformName = cleanText(platform.platformName);
    if (!platformName) {
      pushError('audit.platforms', `三平台總表第 ${index + 1} 筆缺少平台名稱`);
      return;
    }
    if (platformNameSet.has(platformName)) {
      pushError('audit.platforms', `三平台總表存在重複平台名稱：${platformName}`);
    }
    platformNameSet.add(platformName);

    if (typeof platform.passed !== 'boolean') {
      pushError('audit.platforms', `${platformName} 缺少 passed`);
    }

    AUDIT_METRICS.forEach((metric) => {
      if (!Number.isFinite(Number(platform.metrics?.[metric]))) {
        pushError('audit.platforms', `${platformName} 缺少 ${metric}`);
      }
    });
  });

  if ((report.audit?.platforms || []).length > 0) {
    const aggregate = Object.fromEntries(AUDIT_METRICS.map((metric) => [metric, 0]));
    report.audit.platforms.forEach((platform) => {
      AUDIT_METRICS.forEach((metric) => {
        aggregate[metric] += Number(platform.metrics?.[metric] || 0);
      });
    });

    AUDIT_METRICS.forEach((metric) => {
      if (Number(summaryBoard?.[metric] || 0) !== aggregate[metric]) {
        pushError('summaryBoard', `${metric} 與三平台總表加總不一致`);
      }
    });
  }

  const rankingNames = [];
  const rankSet = new Set();
  (report.rankings || []).forEach((row, index) => {
    const displayName = cleanText(row.name) || `第 ${index + 1} 筆`;
    if (!row.rank) pushError('rankings', `正式名次第 ${index + 1} 筆缺少名次`);
    if (row.rank !== index + 1) {
      pushError('rankings', `名次必須連號 1 ~ N，第 ${index + 1} 筆目前為 ${row.rank}`);
    }
    if (rankSet.has(row.rank)) {
      pushError('rankings', `正式名次出現重複名次：${row.rank}`);
    }
    rankSet.add(row.rank);

    if (!cleanText(row.name)) {
      pushError('rankings', `正式名次第 ${index + 1} 筆姓名不可為空`);
    } else if (rankingNames.includes(row.name)) {
      pushError('rankings', `正式名次出現重複姓名：${row.name}`);
    }
    rankingNames.push(cleanText(row.name));

    if (!GROUP_KEYS.includes(row.group)) {
      pushError('rankings', `${displayName} 缺少有效分級`);
    }

    RANKING_METRICS.forEach((metric) => {
      if (!Number.isFinite(Number(row.metrics?.[metric]))) {
        pushError('rankings', `${displayName} 缺少 ${metric}`);
      }
    });
  });

  for (let index = 0; index < (report.rankings || []).length - 1; index += 1) {
    const current = report.rankings[index];
    const next = report.rankings[index + 1];
    if (compareRankingRows(current, next) > 0) {
      pushError('rankings', `正式名次未依固定排序規則排序：${SORT_RULE_TEXT}`);
      break;
    }
  }

  const expectedGroups = buildExpectedGroups(report.rankings || []);
  const groupedNames = [];
  const groupedNameSet = new Set();

  GROUP_KEYS.forEach((groupKey) => {
    const names = Array.isArray(report.groups?.[groupKey]) ? report.groups[groupKey] : [];
    if (!Array.isArray(report.groups?.[groupKey])) {
      pushError('groups', `${groupKey} 分級缺失`);
      return;
    }

    names.forEach((name) => {
      if (groupedNameSet.has(name)) {
        pushError('groups', `分級名單重複分配：${name}`);
      }
      groupedNameSet.add(name);
      groupedNames.push(name);
    });

    if (
      names.length !== expectedGroups[groupKey].length ||
      names.some((name, index) => name !== expectedGroups[groupKey][index])
    ) {
      pushError('groups', `${groupKey} 人名順序必須與正式名次一致`);
    }
  });

  const rankingNameSet = new Set(rankingNames.filter(Boolean));
  rankingNames.forEach((name) => {
    if (!groupedNameSet.has(name)) pushError('groups', `分級名單缺少正式派單人員：${name}`);
  });
  groupedNames.forEach((name) => {
    if (!rankingNameSet.has(name)) pushError('groups', `分級名單多出非正式派單人員：${name}`);
  });

  const adviceNames = [];
  const adviceNameSet = new Set();
  (report.adviceList || []).forEach((entry, index) => {
    const displayName = cleanText(entry.name) || `第 ${index + 1} 筆`;
    if (!cleanText(entry.name)) pushError('adviceList', `第 ${index + 1} 筆建議缺少姓名`);
    if (adviceNameSet.has(entry.name)) pushError('adviceList', `建議名單重複：${entry.name}`);
    adviceNameSet.add(entry.name);
    adviceNames.push(cleanText(entry.name));

    if (!cleanText(entry.text)) pushError('adviceList', `${displayName} 缺少建議內容`);

    const rankingRow = (report.rankings || []).find((row) => row.name === entry.name);
    if (!rankingRow) {
      pushError('adviceList', `建議姓名與正式名次不一致：${entry.name}`);
      return;
    }
    if (entry.rank && entry.rank !== rankingRow.rank) {
      pushError('adviceList', `${entry.name} 的建議名次與正式名次不一致`);
    }
    if (entry.group && entry.group !== rankingRow.group) {
      pushError('adviceList', `${entry.name} 的建議分級與正式名次不一致`);
    }
  });
  rankingNames.forEach((name) => {
    if (!adviceNameSet.has(name)) pushError('adviceList', `正式派單人員缺少建議：${name}`);
  });

  const excludedNameSet = new Set();
  (report.audit?.excludedEmployees || []).forEach((entry) => {
    if (!cleanText(entry.name)) pushError('audit.excludedEmployees', '已離職名單姓名不可為空');
    if (excludedNameSet.has(entry.name)) pushError('audit.excludedEmployees', `已離職名單重複：${entry.name}`);
    excludedNameSet.add(entry.name);
  });

  excludedNameSet.forEach((name) => {
    if (rankingNameSet.has(name)) pushError('excludedEmployees', `已離職名單不得進入正式名次：${name}`);
    GROUP_KEYS.forEach((groupKey) => {
      if ((report.groups?.[groupKey] || []).includes(name)) {
        pushError('excludedEmployees', `已離職名單不得進入 ${groupKey}：${name}`);
      }
    });
  });

  const allStrings = collectAllStrings(report);
  const bannedViolation = [report.sourceText, ...allStrings]
    .map((value) => getBannedNameViolation(value))
    .find(Boolean);
  if (bannedViolation) {
    pushError('name', bannedViolation.reason);
  }

  if (cleanText(report.auditResult) !== cleanText(report.audit?.result)) {
    pushError('auditResult', 'auditResult 必須與 audit.result 完全一致');
  }

  if (!(report.audit?.excludedEmployees || []).length) {
    pushWarning('audit.excludedEmployees', '本輪未提供已離職列示資料');
  }

  return {
    ok: errors.length === 0,
    status: errors.length === 0 ? 'PASS' : 'FAIL',
    errors: dedupeIssues(errors),
    warnings: dedupeIssues(warnings),
    summary: createSummary(report)
  };
}

module.exports = {
  validateDispatchReport
};
