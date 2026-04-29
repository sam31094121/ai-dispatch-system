const express = require('express');
const {
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
  getPerformanceAnalysis,
  parseReport,
  rebuildDispatchReport,
  saveInput,
  zeroWorkspace
} = require('../controllers/dispatchReport.controller');

const router = express.Router();

router.post('/dispatch-reports/parse', parseReport);
router.get('/dispatch-reports', getDispatchReports);
router.get('/dispatch-reports/latest', getLatestDispatchReport);
router.get('/dispatch-reports/:reportId/history', getDispatchReportHistory);
router.get('/dispatch-reports/:reportId/short-text', getDispatchShortText);
router.get('/dispatch-reports/:reportId/top10', getDispatchTop10);
router.get('/dispatch-reports/:reportId/groups', getDispatchGroups);
router.post('/dispatch-reports/:reportId/rebuild', rebuildDispatchReport);
router.get('/dispatch-reports/:reportId', getDispatchReport);

router.get('/current', getCurrentSnapshot);
router.get('/broadcast/current', getCurrentBroadcast);
router.get('/baseline/latest', getBaselineLatest);
router.post('/audit', auditInput);
router.post('/save', saveInput);
router.post('/workspace/zero', zeroWorkspace);
router.get('/performance/2026-04-29', getPerformanceAnalysis);
router.get('/performance/current', getPerformanceAnalysis);

module.exports = router;
