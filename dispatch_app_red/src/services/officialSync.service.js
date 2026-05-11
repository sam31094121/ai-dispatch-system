const fs = require('fs');
const path = require('path');
const { appConfig } = require('../config/appConfig');
const logger = require('../utils/logger');
const sseService = require('./sse.service');

const SCREEN_IDS = ['desktop', 'mobile', 'broadcast'];
const LOG_DIR = path.join(appConfig.storageRoot, 'sync-logs');
const LOG_FILE = path.join(LOG_DIR, 'official-sync.jsonl');

const state = {
  mode: 'normal',
  locked: false,
  lastAction: 'boot',
  lastActionAt: new Date().toISOString(),
  endpoints: new Map()
};

function nowIso() {
  return new Date().toISOString();
}

function writeJsonLine(event, details = {}) {
  const record = {
    time: nowIso(),
    event,
    ...details
  };

  try {
    fs.mkdirSync(LOG_DIR, { recursive: true });
    fs.appendFileSync(LOG_FILE, `${JSON.stringify(record)}\n`, 'utf8');
  } catch (error) {
    logger.error('official sync log write failed', { error: error.message });
  }

  logger.info(`[official-sync] ${event}`, details);
  return record;
}

function stableStringify(value) {
  if (Array.isArray(value)) {
    return `[${value.map(stableStringify).join(',')}]`;
  }

  if (value && typeof value === 'object') {
    return `{${Object.keys(value)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${stableStringify(value[key])}`)
      .join(',')}}`;
  }

  return JSON.stringify(value);
}

function hashString(text) {
  let hash = 2166136261;
  for (let i = 0; i < text.length; i += 1) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return `fnv1a-${(hash >>> 0).toString(16).padStart(8, '0')}`;
}

function buildOfficialVersion(snapshot = {}) {
  return [
    snapshot.reportId || 'report',
    snapshot.reportVersion || snapshot.version || '1',
    snapshot.completedAt || snapshot.updatedAt || snapshot.executionId || ''
  ].join('::');
}

function buildOfficialFingerprint(snapshot = {}) {
  return hashString(stableStringify({
    version: buildOfficialVersion(snapshot),
    summary: snapshot.summary || {},
    ranking: snapshot.ranking || [],
    groups: snapshot.groups || {},
    announcement: snapshot.announcement || snapshot.broadcast?.scriptText || '',
    status: snapshot.status || '',
    validation: snapshot.validation?.status || ''
  }));
}

function stampSnapshot(snapshot = {}) {
  const officialVersion = buildOfficialVersion(snapshot);
  const officialFingerprint = buildOfficialFingerprint({
    ...snapshot,
    officialVersion
  });

  return {
    ...snapshot,
    reportVersion: snapshot.reportVersion || snapshot.version || 1,
    officialVersion,
    officialFingerprint,
    officialSource: 'backend-master',
    backendMaster: {
      sourceOfTruth: 'backend',
      frontendReadOnly: true,
      officialVersion,
      officialFingerprint,
      requiredScreens: SCREEN_IDS,
      generatedAt: nowIso()
    },
    consistencyGuard: {
      ...(snapshot.consistencyGuard || {}),
      status: snapshot.validation?.ok === false ? 'FAIL' : 'PASS',
      backendSourceLocked: true,
      frontendComputationAllowed: false,
      frontendRewriteAllowed: false,
      officialVersion,
      officialFingerprint
    },
    frontendLock: {
      ...(snapshot.frontendLock || {}),
      sourceOfTruth: 'backend-master',
      frontendMustUseBackendSnapshot: true,
      frontendMayComputeRanking: false,
      frontendMayComputeGroups: false,
      frontendMayRewriteAnnouncement: false,
      frontendMayRewriteAudit: false
    }
  };
}

function getOfficialContract(snapshot = {}) {
  const stamped = stampSnapshot(snapshot);
  return {
    officialVersion: stamped.officialVersion,
    officialFingerprint: stamped.officialFingerprint,
    sourceOfTruth: 'backend-master',
    frontendReadOnly: true,
    requiredScreens: SCREEN_IDS
  };
}

function setAction(action, details = {}) {
  state.lastAction = action;
  state.lastActionAt = nowIso();
  writeJsonLine(action, details);
}

function getEndpointList() {
  return SCREEN_IDS.map((screenId) => {
    const endpoint = state.endpoints.get(screenId) || {};
    return {
      screenId,
      officialVersion: endpoint.officialVersion || '',
      officialFingerprint: endpoint.officialFingerprint || '',
      status: endpoint.status || 'missing',
      lastSeenAt: endpoint.lastSeenAt || '',
      reason: endpoint.reason || ''
    };
  });
}

function evaluateConsistency(contract) {
  const endpoints = getEndpointList();
  const mismatches = endpoints.filter((endpoint) => {
    if (endpoint.status === 'missing') return false;
    return endpoint.officialVersion !== contract.officialVersion ||
      endpoint.officialFingerprint !== contract.officialFingerprint;
  });

  const missing = endpoints.filter((endpoint) => endpoint.status === 'missing');
  const status = mismatches.length ? 'abnormal' : 'normal';

  return {
    status,
    mode: state.mode,
    locked: state.locked,
    officialVersion: contract.officialVersion,
    officialFingerprint: contract.officialFingerprint,
    endpoints,
    mismatches,
    missing,
    lastAction: state.lastAction,
    lastActionAt: state.lastActionAt
  };
}

function notifyRepush(reason, contract) {
  sseService.broadcastUpdate({
    type: 'data_updated',
    reason,
    syncAction: 'repush',
    officialVersion: contract.officialVersion,
    officialFingerprint: contract.officialFingerprint,
    version: Date.now(),
    timestamp: nowIso()
  });
}

function startRepair(reason, contract, details = {}) {
  state.mode = 'repair';
  state.locked = true;
  setAction('repair_started', { reason, officialVersion: contract.officialVersion, ...details });
  notifyRepush(reason, contract);
}

function finishRepair(contract, details = {}) {
  if (state.mode !== 'repair' && state.locked === false) return;
  state.mode = 'normal';
  state.locked = false;
  setAction('repair_finished', { officialVersion: contract.officialVersion, ...details });
}

function recordPublish(contract, meta = {}) {
  state.mode = 'normal';
  state.locked = false;
  setAction('sync_published', {
    officialVersion: contract.officialVersion,
    officialFingerprint: contract.officialFingerprint,
    ...meta
  });
}

function reportScreen(body = {}, contract) {
  const screenId = SCREEN_IDS.includes(body.screenId) ? body.screenId : 'desktop';
  const reported = {
    screenId,
    officialVersion: String(body.officialVersion || ''),
    officialFingerprint: String(body.officialFingerprint || ''),
    status: 'reported',
    lastSeenAt: nowIso(),
    userAgent: String(body.userAgent || ''),
    reason: ''
  };

  if (
    reported.officialVersion !== contract.officialVersion ||
    reported.officialFingerprint !== contract.officialFingerprint
  ) {
    reported.status = 'mismatch';
    reported.reason = 'official_version_or_fingerprint_mismatch';
    state.endpoints.set(screenId, reported);
    setAction('sync_failed', {
      screenId,
      expectedVersion: contract.officialVersion,
      reportedVersion: reported.officialVersion,
      expectedFingerprint: contract.officialFingerprint,
      reportedFingerprint: reported.officialFingerprint
    });
    startRepair('screen_mismatch', contract, { screenId });
    return evaluateConsistency(contract);
  }

  state.endpoints.set(screenId, reported);
  setAction('sync_success', {
    screenId,
    officialVersion: contract.officialVersion,
    officialFingerprint: contract.officialFingerprint
  });

  const result = evaluateConsistency(contract);
  if (!result.mismatches.length) finishRepair(contract, { screenId });
  return result;
}

function getStatus(contract) {
  return evaluateConsistency(contract);
}

module.exports = {
  SCREEN_IDS,
  getOfficialContract,
  getStatus,
  recordPublish,
  reportScreen,
  stampSnapshot,
  writeJsonLine
};
