const fs = require('fs');
const path = require('path');
const { appConfig } = require('../config/appConfig');
const errorCodes = require('../constants/errorCodes');
const {
  buildGroupsData,
  buildLegacySnapshot,
  buildReportFromSource,
  buildTop10Data,
  clone,
  createDefaultSeedInput,
  syncNarrativeFields
} = require('./dispatchBuild.service');
const { validateDispatchReport } = require('./dispatchValidate.service');
const { formatTaipeiTimestamp } = require('../utils/date.util');

const storagePaths = {
  root: appConfig.storageRoot,
  reportsDir: path.join(appConfig.storageRoot, 'reports'),
  latestFile: path.join(appConfig.storageRoot, 'latest.json')
};

const storageCache = {
  hydrated: false,
  records: [],
  latestById: new Map(),
  latestRecord: null
};

const derivedCache = {
  normalizedReports: new Map(),
  validations: new Map(),
  legacySnapshots: new Map(),
  shortTexts: new Map(),
  top10: new Map(),
  groups: new Map(),
  searchText: new Map()
};

function resetDerivedCache() {
  Object.values(derivedCache).forEach((cache) => cache.clear());
}

function getReportCacheKey(report) {
  if (!report || typeof report !== 'object') return '';

  return [
    String(report.reportId || ''),
    String(report.version || ''),
    String(report.updatedAt || ''),
    String(report.createdAt || '')
  ].join('::');
}

function getCachedValue(cache, key, factory) {
  if (!key) return factory();
  if (cache.has(key)) return cache.get(key);

  const value = factory();
  cache.set(key, value);
  return value;
}

function getNormalizedReport(report) {
  return getCachedValue(derivedCache.normalizedReports, getReportCacheKey(report), () => syncNarrativeFields(clone(report)));
}

function isValidationResult(value) {
  return Boolean(
    value &&
    typeof value === 'object' &&
    ('ok' in value || 'status' in value || Array.isArray(value.errors) || Array.isArray(value.warnings))
  );
}

function buildValidationCacheKey(report, validation) {
  const reportKey = getReportCacheKey(report);
  const issues = Array.isArray(validation?.errors)
    ? validation.errors.map((issue) => `${issue.field}:${issue.reason}`).join('|')
    : '';

  return `${reportKey}::${validation?.status || ''}::${issues}`;
}

function buildSnapshotCacheKey(report, validation, options) {
  const normalizedOptions = {
    operator: options?.operator || '',
    source: options?.source || '',
    persisted: Boolean(options?.persisted)
  };

  return `${buildValidationCacheKey(report, validation)}::${JSON.stringify(normalizedOptions)}`;
}

function getReportSearchText(report) {
  return getCachedValue(derivedCache.searchText, getReportCacheKey(report), () =>
    [
      report.reportId,
      report.title,
      report.sourceText,
      ...(report.rankings || []).map((row) => row.name),
      ...(report.adviceList || []).map((row) => row.text)
    ]
      .filter(Boolean)
      .join('\n')
  );
}

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

function toComparableTs(str) {
  if (!str) return 0;
  const ts = Date.parse(String(str).replace(/\//g, '-').replace(' ', 'T'));
  return isNaN(ts) ? 0 : ts;
}

function sortStoredRecords(records) {
  return [...records].sort((left, right) => {
    const tsDelta = toComparableTs(right.report.updatedAt) - toComparableTs(left.report.updatedAt);
    if (tsDelta !== 0) return tsDelta;
    return Number(right.report.version || 0) - Number(left.report.version || 0);
  });
}

function buildStorageIndex(records, latestRecord = null) {
  const sortedRecords = sortStoredRecords(records);
  const latestById = new Map();

  sortedRecords.forEach((record) => {
    if (!latestById.has(record.report.reportId)) {
      latestById.set(record.report.reportId, record);
    }
  });

  return {
    hydrated: true,
    records: sortedRecords,
    latestById,
    latestRecord: latestRecord?.report?.reportId ? latestRecord : sortedRecords[0] || null
  };
}

function applyStorageIndex(index) {
  storageCache.hydrated = index.hydrated;
  storageCache.records = index.records;
  storageCache.latestById = index.latestById;
  storageCache.latestRecord = index.latestRecord;
  resetDerivedCache();
  return storageCache;
}

function resetStorageCache() {
  storageCache.hydrated = false;
  storageCache.records = [];
  storageCache.latestById = new Map();
  storageCache.latestRecord = null;
  resetDerivedCache();
}

function scanStoredRecords() {
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
    });
}

function hydrateStorageCache() {
  if (storageCache.hydrated) return storageCache;

  ensureStorageDirs();
  const latestRecord = readJson(storagePaths.latestFile);

  // [CacheGuard] 自動同步：若 official-locks 有比 latest.json 更新的資料則同步
  const officialLocks = require('../../shared/official-locks');
  const officialKeys = Object.keys(officialLocks).filter((k) => k.startsWith('OFFICIAL_'));
  const latestOfficialKey = officialKeys.sort().reverse()[0];
  const latestOfficial = latestOfficialKey ? officialLocks[latestOfficialKey] : null;

  if (latestOfficial && latestRecord) {
    // 將 ROC 日期 (115/05/01) 轉為西元 (2026-05-01) 再比較
    const rocToIso = (d) => {
      const parts = String(d || '').split('/');
      if (parts.length !== 3) return d || '';
      return `${parseInt(parts[0], 10) + 1911}-${parts[1]}-${parts[2]}`;
    };
    const officialIso = rocToIso(latestOfficial.reportDate);
    const recordIso   = latestRecord.report?.settlementDate || rocToIso(latestRecord.report?.reportDate) || '';
    if (officialIso && recordIso && officialIso > recordIso) {
      console.log(`[CacheGuard] 官方有更新版本 (${officialIso} > ${recordIso})，執行同步。`);
      const parsedReport  = buildReportFromSource({ sourceText: JSON.stringify(latestOfficial) });
      const syncValidation = validateDispatchReport(parsedReport);
      const storedRecord  = wrapStoredRecord(parsedReport, { operator: 'system_auto_sync', reason: 'official-lock', source: 'official-locks' });
      if (!syncValidation.ok) {
        console.warn(`[CacheGuard] 驗證有警告但仍同步：`, syncValidation.errors.slice(0, 3).map((e) => e.reason).join(', '));
      }
      writeJson(getVersionFile(parsedReport.reportId, parsedReport.version), storedRecord);
      writeJson(storagePaths.latestFile, storedRecord);
      return applyStorageIndex(buildStorageIndex([storedRecord, ...scanStoredRecords()], storedRecord));
    }
    console.log(`[CacheGuard] latest.json 已是最新 (${recordIso})，略過同步。`);
  } else if (latestOfficial && !latestRecord) {
    console.log(`[CacheGuard] 無 latest.json，從 official-locks 建立初始資料。`);
    const parsedReport  = buildReportFromSource({ sourceText: JSON.stringify(latestOfficial) });
    const syncValidation = validateDispatchReport(parsedReport);
    const storedRecord  = wrapStoredRecord(parsedReport, { operator: 'system_auto_sync', reason: 'official-lock', source: 'official-locks' });
    if (!syncValidation.ok) {
      console.warn(`[CacheGuard] 驗證有警告但仍建立：`, syncValidation.errors.slice(0, 3).map((e) => e.reason).join(', '));
    }
    writeJson(getVersionFile(parsedReport.reportId, parsedReport.version), storedRecord);
    writeJson(storagePaths.latestFile, storedRecord);
    return applyStorageIndex(buildStorageIndex([storedRecord], storedRecord));
  }

  return applyStorageIndex(buildStorageIndex(scanStoredRecords(), latestRecord));
}

function listAllStoredRecords() {
  return hydrateStorageCache().records;
}

function getLatestStoredRecord() {
  return hydrateStorageCache().latestRecord;
}

function persistStoredRecord(storedRecord, updateLatest = true) {
  ensureStorageDirs();
  const report = storedRecord.report;
  writeJson(getVersionFile(report.reportId, report.version), storedRecord);
  if (updateLatest) {
    writeJson(storagePaths.latestFile, storedRecord);
  }

  const nextRecords = [
    storedRecord,
    ...listAllStoredRecords().filter(
      (record) => !(record.report.reportId === report.reportId && Number(record.report.version) === Number(report.version))
    )
  ];
  const nextLatestRecord = updateLatest ? storedRecord : getLatestStoredRecord();
  applyStorageIndex(buildStorageIndex(nextRecords, nextLatestRecord));
  return storedRecord.report;
}

function findLatestRecordById(reportId) {
  return hydrateStorageCache().latestById.get(reportId) || null;
}

function ensureSeededLatest() {
  ensureStorageDirs();
  const latest = getLatestStoredRecord();
  if (latest?.report?.reportId) return latest;

  const records = listAllStoredRecords();
  if (records.length > 0) {
    writeJson(storagePaths.latestFile, records[0]);
    applyStorageIndex(buildStorageIndex(records, records[0]));
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
  return getNormalizedReport(ensureSeededLatest().report);
}

function getReportById(reportId) {
  ensureSeededLatest();
  const report = findLatestRecordById(reportId)?.report || null;
  return report ? getNormalizedReport(report) : null;
}

function getValidationForReport(report) {
  const normalizedReport = getNormalizedReport(report);
  return getCachedValue(derivedCache.validations, getReportCacheKey(normalizedReport), () => validateDispatchReport(normalizedReport));
}

function saveNewReport(report, meta = {}) {
  ensureStorageDirs();
  const normalizedReport = getNormalizedReport(report);
  const existing = findLatestRecordById(normalizedReport.reportId);
  if (existing) {
    throw createAppError(errorCodes.DUPLICATE_REPORT, 409, '重複公告', [
      { field: 'reportId', reason: `reportId ${normalizedReport.reportId} 已存在` }
    ]);
  }

  const validation = validateDispatchReport(normalizedReport);
  if (!validation.ok) {
    throw createAppError(errorCodes.VALIDATION_FAILED, 400, '資料驗證失敗', validation.errors);
  }

  const storedRecord = wrapStoredRecord(normalizedReport, meta);
  const persisted = persistStoredRecord(storedRecord, true);
  return {
    report: persisted,
    validation
  };
}

function saveReportVersion(report, meta = {}) {
  ensureStorageDirs();
  const normalizedReport = getNormalizedReport(report);
  const existing = findLatestRecordById(normalizedReport.reportId);
  const nextVersion = existing ? Number(existing.report.version || 1) + 1 : 1;
  const nextReport = {
    ...normalizedReport,
    version: nextVersion,
    createdAt: existing?.report?.createdAt || normalizedReport.createdAt,
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

  const filtered = [...hydrateStorageCache().latestById.values()].map((record) => record.report).filter((report) => {
    if (status && report.status !== status) return false;
    if (settlementDate && report.settlementDate !== settlementDate) return false;
    if (dispatchDate && report.dispatchDate !== dispatchDate) return false;
    if (auditResult && String(report.auditResult || '').toUpperCase() !== auditResult) return false;
    if (keyword) {
      const keywordMatched = getReportSearchText(report).includes(keyword);
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
  return getCachedValue(derivedCache.shortTexts, getReportCacheKey(report), () => ({
    reportId: report.reportId,
    text: report.groupShortText
  }));
}

function getTop10(reportId) {
  const report = getReportById(reportId);
  if (!report) {
    throw createAppError(errorCodes.NOT_FOUND, 404, '查無資料');
  }
  return getCachedValue(derivedCache.top10, getReportCacheKey(report), () => buildTop10Data(report));
}

function getGroups(reportId) {
  const report = getReportById(reportId);
  if (!report) {
    throw createAppError(errorCodes.NOT_FOUND, 404, '查無資料');
  }
  return getCachedValue(derivedCache.groups, getReportCacheKey(report), () => buildGroupsData(report));
}

function getLegacySnapshot(report, validationOrOptions = {}, options = {}) {
  const normalizedReport = getNormalizedReport(report);
  const explicitValidation = isValidationResult(validationOrOptions) ? validationOrOptions : null;
  const resolvedOptions = options && Object.keys(options).length > 0
    ? options
    : explicitValidation
      ? {}
      : validationOrOptions;
  const validation = explicitValidation || getValidationForReport(normalizedReport);

  return getCachedValue(
    derivedCache.legacySnapshots,
    buildSnapshotCacheKey(normalizedReport, validation, resolvedOptions),
    () => buildLegacySnapshot(normalizedReport, validation, resolvedOptions)
  );
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
  resetStorageCache,
  rebuildReport,
  saveNewReport,
  saveReportVersion
};
