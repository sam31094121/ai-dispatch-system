const { buildReportFromSource } = require('./dispatchBuild.service');
const { validateDispatchReport } = require('./dispatchValidate.service');

function extractSourceText(body = {}) {
  if (typeof body.sourceText === 'string' && body.sourceText.trim()) return body.sourceText;
  if (typeof body.rawText === 'string' && body.rawText.trim()) return body.rawText;
  if (body.standardData && typeof body.standardData === 'object') {
    return JSON.stringify(body.standardData, null, 2);
  }
  if (body.data && typeof body.data === 'object') {
    return JSON.stringify(body.data, null, 2);
  }
  return '';
}

function parseDispatchDraft(body = {}, options = {}) {
  const sourceText = extractSourceText(body);
  const report = buildReportFromSource({
    title: body.title,
    sourceText,
    settlementDate: body.settlementDate,
    dispatchDate: body.dispatchDate,
    operator: body.operator,
    reportId: options.reportId,
    version: options.version,
    createdAt: options.createdAt,
    updatedAt: options.updatedAt,
    status: options.status
  });

  const validation = validateDispatchReport(report);
  return {
    sourceText,
    report,
    validation
  };
}

module.exports = {
  extractSourceText,
  parseDispatchDraft
};
