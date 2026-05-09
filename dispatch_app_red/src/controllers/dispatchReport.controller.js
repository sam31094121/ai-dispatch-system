const errorCodes = require('../constants/errorCodes');
const { SERVICE_NAME, API_VERSION, UNIFIED_COMMAND_SPEC } = require('../constants/dispatchRules');
const { parseDispatchDraft } = require('../services/dispatchParse.service');
const {
  getLegacySnapshot,
  getLatestReport,
  getReportById,
  getReportHistory,
  getShortText,
  getTop10,
  getGroups,
  listReports,
  rebuildReport,
  saveNewReport,
  saveReportVersion
} = require('../services/dispatchQuery.service');
const { processUnifiedUpdate } = require('../services/unifiedDispatch.service');
const { buildPerformanceAnalysis } = require('../services/performanceAnalysis.service');
const { errorResponse, successResponse } = require('../utils/response.util');
const { validateParseRequestBody, validateRebuildRequestBody } = require('../validators/dispatchReport.validator');

function sendAppError(res, error, fallbackCode = errorCodes.INTERNAL_ERROR, fallbackMessage = '系統錯誤') {
  const code = error.code || fallbackCode;
  const status = error.status || (code === errorCodes.INTERNAL_ERROR ? 500 : 400);
  res.status(status).json(errorResponse(code, error.message || fallbackMessage, error.errors));
}

function parseReport(req, res) {
  const requestErrors = validateParseRequestBody(req.body);
  if (requestErrors.length) {
    res.status(400).json(errorResponse(errorCodes.BAD_REQUEST, '請求格式錯誤', requestErrors));
    return;
  }

  try {
    const draft = parseDispatchDraft(req.body);
    if (!draft.validation.ok) {
      res.status(400).json(errorResponse(errorCodes.PARSE_FAILED, '公告解析失敗', draft.validation.errors));
      return;
    }

    const stored = saveNewReport(draft.report, {
      operator: req.body.operator || 'system',
      reason: 'parse',
      source: 'parse'
    });

    res.json(successResponse(errorCodes.PARSE_SUCCESS, '公告解析並建立成功', stored.report));
  } catch (error) {
    sendAppError(res, error, errorCodes.PARSE_FAILED, '公告解析失敗');
  }
}

function getDispatchReports(req, res) {
  try {
    res.json(successResponse(errorCodes.OK, '公告列表讀取成功', listReports(req.query)));
  } catch (error) {
    sendAppError(res, error);
  }
}

function getLatestDispatchReport(_req, res) {
  try {
    res.json(successResponse(errorCodes.OK, '公告資料讀取成功', getLatestReport()));
  } catch (error) {
    sendAppError(res, error);
  }
}

function getDispatchReport(req, res) {
  const report = getReportById(req.params.reportId);
  if (!report) {
    res.status(404).json(errorResponse(errorCodes.NOT_FOUND, '查無資料'));
    return;
  }

  res.json(successResponse(errorCodes.OK, '公告資料讀取成功', report));
}

function getDispatchReportHistory(req, res) {
  const report = getReportById(req.params.reportId);
  if (!report) {
    res.status(404).json(errorResponse(errorCodes.NOT_FOUND, '查無資料'));
    return;
  }

  res.json(
    successResponse(errorCodes.OK, '歷史版本讀取成功', {
      reportId: req.params.reportId,
      items: getReportHistory(req.params.reportId)
    })
  );
}

function getDispatchShortText(req, res) {
  try {
    res.json(successResponse(errorCodes.OK, '群組精簡版讀取成功', getShortText(req.params.reportId)));
  } catch (error) {
    sendAppError(res, error);
  }
}

function getDispatchTop10(req, res) {
  try {
    res.json(successResponse(errorCodes.OK, '前10名讀取成功', getTop10(req.params.reportId)));
  } catch (error) {
    sendAppError(res, error);
  }
}

function getDispatchGroups(req, res) {
  try {
    res.json(successResponse(errorCodes.OK, '分級資料讀取成功', getGroups(req.params.reportId)));
  } catch (error) {
    sendAppError(res, error);
  }
}

function rebuildDispatchReport(req, res) {
  const requestErrors = validateRebuildRequestBody(req.body);
  if (requestErrors.length) {
    res.status(400).json(errorResponse(errorCodes.BAD_REQUEST, '請求格式錯誤', requestErrors));
    return;
  }

  try {
    const rebuilt = rebuildReport(req.params.reportId, req.body);
    res.json(
      successResponse(errorCodes.REBUILD_SUCCESS, '公告已重新建立', {
        reportId: rebuilt.report.reportId,
        version: rebuilt.report.version
      })
    );
  } catch (error) {
    sendAppError(res, error);
  }
}

function getCurrentSnapshot(_req, res) {
  try {
    const latest = getLatestReport();
    const snapshot = getLegacySnapshot(latest, {
      persisted: true,
      source: 'saved',
      operator: 'system'
    });
    res.json(successResponse(errorCodes.OK, '取得目前正式資料成功', snapshot));
  } catch (error) {
    sendAppError(res, error);
  }
}

function getCurrentBroadcast(_req, res) {
  try {
    const latest = getLatestReport();
    const snapshot = getLegacySnapshot(latest, {
      persisted: true,
      source: 'saved',
      operator: 'system'
    });
    res.json(successResponse(errorCodes.OK, '正式播報稿讀取成功', snapshot));
  } catch (error) {
    sendAppError(res, error);
  }
}

function getBaselineLatest(_req, res) {
  try {
    const latest = getLatestReport();
    const snapshot = getLegacySnapshot(latest, {
      persisted: true,
      source: 'saved',
      operator: 'system'
    });
    res.json(
      successResponse(errorCodes.OK, '取得最新基準成功', {
        rawText: latest.sourceText,
        latestExecutionId: snapshot.executionId
      })
    );
  } catch (error) {
    sendAppError(res, error);
  }
}

function auditInput(req, res) {
  try {
    const draft = parseDispatchDraft(req.body);
    const snapshot = getLegacySnapshot(draft.report, {
      persisted: false,
      source: 'preview',
      operator: req.body.operator || 'system'
    });
    res
      .status(draft.validation.ok ? 200 : 400)
      .json(
        successResponse(
          draft.validation.ok ? errorCodes.OK : errorCodes.VALIDATION_FAILED,
          draft.validation.ok ? '審計通過' : '資料驗證失敗',
          snapshot
        )
      );
  } catch (error) {
    sendAppError(res, error, errorCodes.BAD_REQUEST, '審計失敗');
  }
}

async function saveInput(req, res) {
  try {
    const result = await processUnifiedUpdate(req.body, {
      appDir: req.app.get('projectRoot') || process.cwd()
    });

    const snapshot = getLegacySnapshot(result.snapshot, {
      persisted: true,
      source: 'saved',
      operator: req.body.operator || 'system'
    });

    res.json(successResponse(errorCodes.OK, '正式版已鎖定儲存 (經 AI 專業處理)', snapshot));
  } catch (error) {
    sendAppError(res, error);
  }
}

async function handleUnifiedUpdate(req, res) {
  try {
    const result = await processUnifiedUpdate(req.body, {
      appDir: req.app.get('projectRoot') || process.cwd()
    });
    res.json(successResponse(errorCodes.OK, 'AI 統一指令更新完成', result));
  } catch (error) {
    sendAppError(res, error);
  }
}

function zeroWorkspace(_req, res) {
  try {
    const latest = getLatestReport();
    const snapshot = getLegacySnapshot(latest, {
      persisted: true,
      source: 'saved',
      operator: 'system'
    });
    res.json(
      successResponse(errorCodes.OK, '工作區已清空', {
        rawText: '',
        current: snapshot
      })
    );
  } catch (error) {
    sendAppError(res, error);
  }
}

function getSystemMeta(_req, res) {
  res.json(
    successResponse(errorCodes.OK, '系統資訊讀取成功', {
      service: SERVICE_NAME,
      version: API_VERSION,
      commandSpec: UNIFIED_COMMAND_SPEC
    })
  );
}

function getCommandSpec(_req, res) {
  res.json(successResponse(errorCodes.OK, '統一指令規格讀取成功', UNIFIED_COMMAND_SPEC));
}

function getPerformanceAnalysis(_req, res) {
  try {
    res.json(successResponse(errorCodes.OK, 'performance analysis loaded', buildPerformanceAnalysis()));
  } catch (error) {
    sendAppError(res, error);
  }
}

function getLineOutput(_req, res) {
  try {
    const latest = getLatestReport();
    // 優化規格一體化：強制優先使用 AI 核心精簡版文字
    const lineText = latest.groupShortText || '';
    
    res.json(successResponse(errorCodes.OK, 'LINE 輸出稿讀取成功', {
      text: lineText,
      reportId: latest.reportId,
      title: latest.title
    }));
  } catch (error) {
    sendAppError(res, error);
  }
}

module.exports = {
  auditInput,
  getBaselineLatest,
  getCurrentBroadcast,
  getCurrentSnapshot,
  getDispatchGroups,
  getDispatchReport,
  getDispatchReportHistory,
  getDispatchReports,
  getDispatchShortText,
  getDispatchTop10,
  getLatestDispatchReport,
  getLineOutput,
  getPerformanceAnalysis,
  getCommandSpec,
  getSystemMeta,
  parseReport,
  rebuildDispatchReport,
  handleUnifiedUpdate,
  saveInput,
  zeroWorkspace
};
