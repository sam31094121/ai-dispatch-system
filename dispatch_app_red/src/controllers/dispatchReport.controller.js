const { errorResponse, successResponse } = require('../utils/response.util');
const errorCodes = require('../constants/errorCodes');
const {
  buildReportFromSource,
  buildLegacySnapshot,
  createDefaultSeedInput,
  toLegacyStandardData
} = require('../services/dispatchBuild.service');
const {
  getLatestStoredRecord,
  persistStoredRecord,
  getStoredRecordById,
  listAllStoredRecords
} = require('../services/dispatchQuery.service');
const { validateDispatchReport } = require('../services/dispatchValidate.service');
const officialSync = require('../services/officialSync.service');
const masterCommander = require('../services/masterCommander.service');

/**
 * 取得最新正式資料 (用於 /api/current)
 */
function getLatestReport() {
  const latest = getLatestStoredRecord();
  if (!latest) {
    throw new Error('找不到任何正式資料');
  }
  return latest;
}

function sendAppError(res, error) {
  res.status(500).json(errorResponse(errorCodes.INTERNAL_SERVER_ERROR, error.message));
}

function parseReport(req, res) {
  try {
    const report = buildReportFromSource({ sourceText: req.body.sourceText });
    res.json(successResponse(errorCodes.OK, '解析成功', report));
  } catch (error) {
    sendAppError(res, error);
  }
}

function getDispatchReports(req, res) {
  try {
    const records = listAllStoredRecords();
    res.json(successResponse(errorCodes.OK, '取得列表成功', records));
  } catch (error) {
    sendAppError(res, error);
  }
}

function getLatestDispatchReport(req, res) {
  try {
    const latest = getLatestReport();
    res.json(successResponse(errorCodes.OK, '取得最新資料成功', latest));
  } catch (error) {
    sendAppError(res, error);
  }
}

function getDispatchReportHistory(req, res) {
  try {
    const records = listAllStoredRecords().filter(r => r.report.reportId === req.params.reportId);
    res.json(successResponse(errorCodes.OK, '取得歷史成功', records));
  } catch (error) {
    sendAppError(res, error);
  }
}

function getDispatchReport(req, res) {
  try {
    const record = getStoredRecordById(req.params.reportId);
    if (!record) {
      res.status(404).json(errorResponse(errorCodes.NOT_FOUND, '找不到該筆資料'));
      return;
    }
    res.json(successResponse(errorCodes.OK, '取得資料成功', record));
  } catch (error) {
    sendAppError(res, error);
  }
}

function rebuildReport(reportId, body) {
  // 簡化實作
  const report = buildReportFromSource({ sourceText: body.sourceText });
  const validation = validateDispatchReport(report);
  const storedRecord = {
    report,
    validation,
    snapshot: buildLegacySnapshot(report, validation),
    meta: { reason: 'rebuild', timestamp: new Date().toISOString() }
  };
  persistStoredRecord(storedRecord);
  return storedRecord;
}

function rebuildDispatchReport(req, res) {
  try {
    const rebuilt = rebuildReport(req.params.reportId, req.body);
    res.json(successResponse(errorCodes.REBUILD_SUCCESS, '公告已重新建立', rebuilt));
  } catch (error) {
    sendAppError(res, error);
  }
}

function getCurrentSnapshot(_req, res) {
  try {
    const latest = getLatestReport();
    const snapshot = officialSync.stampSnapshot(buildLegacySnapshot(latest.report, latest.validation, {
      persisted: true,
      source: 'saved',
      operator: 'system'
    }));
    
    // 注入 MasterCommander 權威狀態
    const commanderStatus = masterCommander.getCommanderStatus();
    snapshot.officialVersion = commanderStatus.currentVersion;
    snapshot.officialFingerprint = commanderStatus.currentFingerprint;
    snapshot.dataVersion = snapshot.reportVersion || 0;

    res.json(successResponse(errorCodes.OK, '取得目前正式資料成功', snapshot));
  } catch (error) {
    sendAppError(res, error);
  }
}

function getCurrentBroadcast(_req, res) {
  try {
    const latest = getLatestReport();
    const snapshot = officialSync.stampSnapshot(buildLegacySnapshot(latest.report, latest.validation, {
      persisted: true,
      source: 'saved',
      operator: 'system'
    }));
    
    const commanderStatus = masterCommander.getCommanderStatus();
    snapshot.officialVersion = commanderStatus.currentVersion;
    snapshot.officialFingerprint = commanderStatus.currentFingerprint;
    snapshot.dataVersion = snapshot.reportVersion || 0;

    res.json(successResponse(errorCodes.OK, '正式播報稿讀取成功', snapshot));
  } catch (error) {
    sendAppError(res, error);
  }
}

function getBaselineLatest(_req, res) {
  try {
    const latest = getLatestReport();
    res.json(successResponse(errorCodes.OK, '取得最新基準成功', {
      rawText: latest.report.sourceText,
      reportId: latest.report.reportId,
      version: latest.report.version
    }));
  } catch (error) {
    sendAppError(res, error);
  }
}

function auditInput(req, res) {
  try {
    const report = buildReportFromSource({ sourceText: req.body.sourceText });
    const validation = validateDispatchReport(report);
    res.json(successResponse(errorCodes.OK, '審計完成', { report, validation }));
  } catch (error) {
    sendAppError(res, error);
  }
}

function saveInput(req, res) {
  try {
    const report = buildReportFromSource({ sourceText: req.body.sourceText });
    const validation = validateDispatchReport(report);
    const storedRecord = {
      report,
      validation,
      snapshot: buildLegacySnapshot(report, validation),
      meta: { reason: 'manual_save', timestamp: new Date().toISOString() }
    };
    persistStoredRecord(storedRecord);
    res.json(successResponse(errorCodes.OK, '儲存成功', storedRecord));
  } catch (error) {
    sendAppError(res, error);
  }
}

function handleUnifiedUpdate(req, res) {
  // 簡化實作
  return saveInput(req, res);
}

function zeroWorkspace(req, res) {
  res.json(successResponse(errorCodes.OK, '工作區已清空'));
}

function getDispatchGroups(req, res) {
  try {
    const latest = getLatestReport();
    res.json(successResponse(errorCodes.OK, '取得分組成功', latest.report.groups));
  } catch (error) {
    sendAppError(res, error);
  }
}

function getDispatchShortText(req, res) {
  try {
    const latest = getLatestReport();
    res.json(successResponse(errorCodes.OK, '取得精簡版成功', latest.report.groupShortText));
  } catch (error) {
    sendAppError(res, error);
  }
}

function getDispatchTop10(req, res) {
  try {
    const latest = getLatestReport();
    res.json(successResponse(errorCodes.OK, '取得前10名成功', latest.report.rankings.slice(0, 10)));
  } catch (error) {
    sendAppError(res, error);
  }
}

function getPerformanceAnalysis(req, res) {
  res.json(successResponse(errorCodes.OK, '績效分析成功', {}));
}

function getLineOutput(req, res) {
  try {
    const latest = getLatestReport();
    res.json(successResponse(errorCodes.OK, '取得 LINE 輸出成功', latest.report.groupShortText));
  } catch (error) {
    sendAppError(res, error);
  }
}

module.exports = {
  parseReport,
  getDispatchReports,
  getLatestDispatchReport,
  getDispatchReportHistory,
  getDispatchReport,
  rebuildDispatchReport,
  getCurrentSnapshot,
  getCurrentBroadcast,
  getBaselineLatest,
  auditInput,
  saveInput,
  handleUnifiedUpdate,
  zeroWorkspace,
  getDispatchGroups,
  getDispatchShortText,
  getDispatchTop10,
  getPerformanceAnalysis,
  getLineOutput
};
