const { GROUP_KEYS } = require('../constants/dispatchRules');
const { formatTaipeiTimestamp } = require('../utils/date.util');

function createEmptyGroups() {
  return Object.fromEntries(GROUP_KEYS.map((groupKey) => [groupKey, []]));
}

function buildReportId(settlementDate) {
  const safeDate = String(settlementDate || 'unknown').replace(/-/g, '_');
  return `dispatch_${safeDate}_v1`;
}

function createDispatchReport(input = {}) {
  const timestamp = input.createdAt || formatTaipeiTimestamp();

  return {
    reportId: input.reportId || buildReportId(input.settlementDate),
    version: Number.isInteger(input.version) ? input.version : 1,
    status: input.status || 'published',
    title: input.title || '',
    settlementDate: input.settlementDate || '',
    dispatchDate: input.dispatchDate || '',
    auditResult: input.auditResult || 'FAIL',
    createdAt: timestamp,
    updatedAt: input.updatedAt || timestamp,
    sourceText: input.sourceText || '',
    audit: input.audit || {
      result: 'FAIL',
      rule: '',
      platforms: [],
      notes: [],
      excludedEmployees: []
    },
    summaryBoard: input.summaryBoard || {},
    rankings: Array.isArray(input.rankings) ? input.rankings : [],
    groups: input.groups || createEmptyGroups(),
    adviceList: Array.isArray(input.adviceList) ? input.adviceList : [],
    finalConfirmations: Array.isArray(input.finalConfirmations) ? input.finalConfirmations : [],
    groupShortText: input.groupShortText || ''
  };
}

module.exports = {
  buildReportId,
  createDispatchReport,
  createEmptyGroups
};
