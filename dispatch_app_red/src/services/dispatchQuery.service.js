const fs = require('fs');
const path = require('path');
const errorCodes = require('../constants/errorCodes');
const {
  buildGroupsData,
  buildLegacySnapshot,
  buildReportFromSource,
  buildTop10Data,
  clone,
  createDefaultSeedInput
} = require('./dispatchBuild.service');
const { validateDispatchReport } = require('./dispatchValidate.service');
const { formatTaipeiTimestamp } = require('../utils/date.util');

const storagePaths = {
  root: path.join(__dirname, '..', '..', 'data', 'dispatch-reports-v1'),
  reportsDir: path.join(__dirname, '..', '..', 'data', 'dispatch-reports-v1', 'reports'),
  latestFile: path.join(__dirname, '..', '..', 'data', 'dispatch-reports-v1', 'latest.json')
};

function createAppError(code, status, message, errors = []) {
  const error = new Error(message);
  error.code = code;
  error.status = status;
  error.errors = errors;
  return error;
}

function ensureStorageDirs() {
  [storagePaths.root, storagePaths.reportsDir].forEach((dirPath) => {
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
  });
}

function readJson(filePath) {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch {
    return null;
  }
}

function writeJson(filePath, payload) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(payload, null, 2), 'utf8');
}

function getReportDir(reportId) {
  return path.join(storagePaths.reportsDir, reportId);
}

function getVersionFile(reportId, version) {
  return path.join(getReportDir(reportId), `v${version}.json`);
}

function wrapStoredRecord(report, meta = {}) {
  return {
    report: clone(report),
    meta: {
      operator: meta.operator || 'system',
      reason: meta.reason || '',
      savedAt: meta.savedAt || formatTaipeiTimestamp(),
      source: meta.source || 'manual'
    }
  };
}

function listAllStoredRecords() {
  ensureStorageDirs();

  return fs
    .readdirSync(storagePaths.reportsDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .flatMap((entry) => {
      const reportDir = path.join(storagePaths.reportsDir, entry.name);
      return fs
        .readdirSync(reportDir)
        .filter((fileName) => /^v\d+\.json$/u.test(fileName))
        .map((fileName) => readJson(path.join(reportDir, fileName)))
        .filter((record) => record?.report?.reportId);
    })
    .sort((left, right) => {
      const timeDelta = String(right.report.updatedAt || '').localeCompare(String(left.report.updatedAt || ''));
      if (timeDelta !== 0) return timeDelta;
      return Number(right.report.version || 0) - Number(left.report.version || 0);
    });
}

function persistStoredRecord(storedRecord, updateLatest = true) {
  ensureStorageDirs();
  const report = storedRecord.report;
  writeJson(getVersionFile(report.reportId, report.version), storedRecord);
  if (updateLatest) {
    writeJson(storagePaths.latestFile, storedRecord);
  }
  return storedRecord.report;
}

function findLatestRecordById(reportId) {
  const records = listAllStoredRecords().filter((record) => record.report.reportId === reportId);
  return records[0] || null;
}

function ensureSeededLatest() {
  ensureStorageDirs();
  const latest = readJson(storagePaths.latestFile);
  if (latest?.report?.reportId) return latest;

  const records = listAllStoredRecords();
  if (records.length > 0) {
    writeJson(storagePaths.latestFile, records[0]);
    return records[0];
  }

  const seedInput = createDefaultSeedInput();
  const seedReport = buildReportFromSource({
    ...seedInput,
    createdAt: formatTaipeiTimestamp(),
    updatedAt: formatTaipeiTimestamp(),
    status: 'published'
  });
  const validation = validateDispatchReport(seedReport);
  const storedRecord = wrapStoredRecord(seedReport, {
    operator: 'system',
    reason: 'seed',
    source: 'default'
  });

  if (!validation.ok) {
    throw createAppError(
      errorCodes.INTERNAL_ERROR,
      500,
      '預設派單資料驗證失敗，無法建立種子資料',
      validation.errors
    );
  }

  persistStoredRecord(storedRecord, true);
  return storedRecord;
}

function getLatestReport() {
  return ensureSeededLatest().report;
}

function getReportById(reportId) {
  ensureSeededLatest();
  return findLatestRecordById(reportId)?.report || null;
}

function getValidationForReport(report) {
  return validateDispatchReport(report);
}

function saveNewReport(report, meta = {}) {
  ensureStorageDirs();
  const existing = findLatestRecordById(report.reportId);
  if (existing) {
    throw createAppError(errorCodes.DUPLICATE_REPORT, 409, '重複公告', [
      { field: 'reportId', reason: `reportId ${report.reportId} 已存在` }
    ]);
  }

  const validation = validateDispatchReport(report);
  if (!validation.ok) {
    throw createAppError(errorCodes.VALIDATION_FAILED, 400, '資料驗證失敗', validation.errors);
  }

  const storedRecord = wrapStoredRecord(report, meta);
  const persisted = persistStoredRecord(storedRecord, true);
  return {
    report: persisted,
    validation
  };
}

function saveReportVersion(report, meta = {}) {
  ensureStorageDirs();
  const existing = findLatestRecordById(report.reportId);
  const nextVersion = existing ? Number(existing.report.version || 1) + 1 : 1;
  const nextReport = {
    ...clone(report),
    version: nextVersion,
    createdAt: existing?.report?.createdAt || report.createdAt,
    updatedAt: formatTaipeiTimestamp()
  };

  const validation = validateDispatchReport(nextReport);
  if (!validation.ok) {
    throw createAppError(errorCodes.VALIDATION_FAILED, 400, '資料驗證失敗', validation.errors);
  }

  const storedRecord = wrapStoredRecord(nextReport, meta);
  const persisted = persistStoredRecord(storedRecord, true);
  return {
    report: persisted,
    validation
  };
}

function rebuildReport(reportId, body = {}) {
  const current = getReportById(reportId);
  if (!current) {
    throw createAppError(errorCodes.NOT_FOUND, 404, '查無資料');
  }

  const rebuilt = buildReportFromSource({
    title: current.title,
    sourceText: current.sourceText,
    settlementDate: current.settlementDate,
    dispatchDate: current.dispatchDate,
    reportId: current.reportId,
    version: Number(current.version || 1) + 1,
    createdAt: current.createdAt,
    updatedAt: formatTaipeiTimestamp(),
    status: current.status
  });

  return saveReportVersion(rebuilt, {
    operator: body.operator || 'admin',
    reason: body.reason || 'rebuild',
    source: 'rebuild'
  });
}

function listReports(query = {}) {
  ensureSeededLatest();
  const page = Math.max(1, Number(query.page) || 1);
  const limit = Math.max(1, Math.min(200, Number(query.limit) || 20));
  const status = String(query.status || '').trim();
  const settlementDate = String(query.settlementDate || '').trim();
  const dispatchDate = String(query.dispatchDate || '').trim();
  const auditResult = String(query.auditResult || '').trim().toUpperCase();
  const keyword = String(query.keyword || '').trim();

  const latestById = new Map();
  listAllStoredRecords().forEach((record) => {
    if (!latestById.has(record.report.reportId)) {
      latestById.set(record.report.reportId, record.report);
    }
  });

  const filtered = [...latestById.values()].filter((report) => {
    if (status && report.status !== status) return false;
    if (settlementDate && report.settlementDate !== settlementDate) return false;
    if (dispatchDate && report.dispatchDate !== dispatchDate) return false;
    if (auditResult && String(report.auditResult || '').toUpperCase() !== auditResult) return false;
    if (keyword) {
      const keywordMatched = [
        report.reportId,
        report.title,
        report.sourceText,
        ...report.rankings.map((row) => row.name),
        ...report.adviceList.map((row) => row.text)
      ]
        .join('\n')
        .includes(keyword);
      if (!keywordMatched) return false;
    }
    return true;
  });

  const start = (page - 1) * limit;
  const items = filtered.slice(start, start + limit).map((report) => ({
    reportId: report.reportId,
    version: report.version,
    status: report.status,
    title: report.title,
    settlementDate: report.settlementDate,
    dispatchDate: report.dispatchDate,
    auditResult: report.auditResult,
    createdAt: report.createdAt
  }));

  return {
    items,
    pagination: {
      page,
      limit,
      total: filtered.length,
      totalPages: Math.max(1, Math.ceil(filtered.length / limit))
    }
  };
}

function getReportHistory(reportId) {
  ensureSeededLatest();
  return listAllStoredRecords()
    .filter((record) => record.report.reportId === reportId)
    .map((record) => ({
      reportId: record.report.reportId,
      version: record.report.version,
      status: record.report.status,
      auditResult: record.report.auditResult,
      title: record.report.title,
      createdAt: record.report.createdAt,
      updatedAt: record.report.updatedAt,
      operator: record.meta?.operator || ''
    }));
}

function getShortText(reportId) {
  const report = getReportById(reportId);
  if (!report) {
    throw createAppError(errorCodes.NOT_FOUND, 404, '查無資料');
  }
  return {
    reportId: report.reportId,
    text: report.groupShortText
  };
}

function getTop10(reportId) {
  const report = getReportById(reportId);
  if (!report) {
    throw createAppError(errorCodes.NOT_FOUND, 404, '查無資料');
  }
  return buildTop10Data(report);
}

function getGroups(reportId) {
  const report = getReportById(reportId);
  if (!report) {
    throw createAppError(errorCodes.NOT_FOUND, 404, '查無資料');
  }
  return buildGroupsData(report);
}

function getLegacySnapshot(report, options = {}) {
  const validation = validateDispatchReport(report);
  return buildLegacySnapshot(report, validation, options);
}

module.exports = {
  createAppError,
  errorCodes,
  getGroups,
  getLegacySnapshot,
  getLatestReport,
  getReportById,
  getReportHistory,
  getShortText,
  getTop10,
  getValidationForReport,
  listReports,
  rebuildReport,
  saveNewReport,
  saveReportVersion
};
