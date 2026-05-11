const errorCodes = require('../constants/errorCodes');
const { getLegacySnapshot, getLatestReport } = require('../services/dispatchQuery.service');
const officialSync = require('../services/officialSync.service');
const { errorResponse, successResponse } = require('../utils/response.util');

function buildContract() {
  const latest = getLatestReport();
  const snapshot = officialSync.stampSnapshot(getLegacySnapshot(latest, {
    persisted: true,
    source: 'backend-master',
    operator: 'system'
  }));
  return officialSync.getOfficialContract(snapshot);
}

function getSyncStatus(_req, res) {
  try {
    res.json(successResponse(errorCodes.OK, 'official sync status loaded', officialSync.getStatus(buildContract())));
  } catch (error) {
    res.status(500).json(errorResponse(errorCodes.INTERNAL_ERROR, error.message || 'sync status failed'));
  }
}

function reportSyncScreen(req, res) {
  try {
    const status = officialSync.reportScreen(req.body || {}, buildContract());
    res.json(successResponse(errorCodes.OK, 'screen sync report accepted', status));
  } catch (error) {
    res.status(500).json(errorResponse(errorCodes.INTERNAL_ERROR, error.message || 'sync report failed'));
  }
}

module.exports = {
  getSyncStatus,
  reportSyncScreen
};
