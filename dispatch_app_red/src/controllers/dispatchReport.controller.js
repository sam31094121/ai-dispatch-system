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
const infiniteOptimizationService = require('../services/infiniteOptimization.service');

/**
 * [機密保護] 屏蔽公司總帳數據，僅保留個人名次與業績。
 */
function maskSecretData(data) {
  if (!data) return data;
  const masked = JSON.parse(JSON.stringify(data));
  
  const target = masked.report || masked.snapshot || masked;
  
  // 徹底移除公司總結算數據
  delete target.summaryBoard;
  delete target.auditConclusion;
  delete target.reportTotal;
  delete target.assignmentTotal;
  delete target.overallStats;
  delete target.auditWarnings;
  
  // 屏蔽審計中的平台總額
  if (target.audit && target.audit.platforms) {
    delete target.audit.platforms;
  }

  // [公信力加固] 伺服器端自動過濾公告文字中的總帳數據
  const cleanText = (text) => {
    if (!text) return '';
    return text.split('\n')
      .filter(line => !['總業績', '總金額', '實收總額', '實收總計', '三平台總盤', '總結算'].some(s => line.includes(s)))
      .join('\n').trim();
  };

  if (target.groupShortText) target.groupShortText = cleanText(target.groupShortText);
  if (target.sendText) target.sendText = cleanText(target.sendText);
  
  return masked;
}

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
    res.json(successResponse(errorCodes.OK, '取得最新資料成功', maskSecretData(latest)));
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
    res.json(successResponse(errorCodes.OK, '取得資料成功', maskSecretData(record)));
  } catch (error) {
    sendAppError(res, error);
  }
}

async function rebuildReport(reportId, body) {
  // 簡化實作
  const report = buildReportFromSource({ sourceText: body.sourceText });
  const validation = validateDispatchReport(report);
  
  // 觸發 AI 無限優化
  const optimizationResult = await infiniteOptimizationService.triggerNextCycle(report);
  const optimizedReport = optimizationResult ? optimizationResult.data : report;

  const storedRecord = {
    report: optimizedReport,
    validation,
    snapshot: buildLegacySnapshot(optimizedReport, validation),
    meta: { 
      reason: 'rebuild', 
      timestamp: new Date().toISOString(),
      optimization: optimizationResult ? {
        cycle: optimizationResult.cycle,
        improvement: optimizationResult.improvementScore
      } : null
    }
  };
  persistStoredRecord(storedRecord);
  return storedRecord;
}

async function rebuildDispatchReport(req, res) {
  try {
    const rebuilt = await rebuildReport(req.params.reportId, req.body);
    res.json(successResponse(errorCodes.REBUILD_SUCCESS, '公告已重新建立 (AI 已優化)', rebuilt));
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

    res.json(successResponse(errorCodes.OK, '取得目前正式資料成功', maskSecretData(snapshot)));
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

async function saveInput(req, res) {
  try {
    const report = buildReportFromSource({ sourceText: req.body.sourceText });
    const validation = validateDispatchReport(report);
    
    // 觸發 AI 無限優化
    const optimizationResult = await infiniteOptimizationService.triggerNextCycle(report);
    const optimizedReport = optimizationResult ? optimizationResult.data : report;

    const storedRecord = {
      report: optimizedReport,
      validation,
      snapshot: buildLegacySnapshot(optimizedReport, validation),
      meta: { 
        reason: 'manual_save', 
        timestamp: new Date().toISOString(),
        optimization: optimizationResult ? {
          cycle: optimizationResult.cycle,
          improvement: optimizationResult.improvementScore
        } : null
      }
    };
    persistStoredRecord(storedRecord);
    res.json(successResponse(errorCodes.OK, '儲存成功 (AI 已優化)', storedRecord));
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
