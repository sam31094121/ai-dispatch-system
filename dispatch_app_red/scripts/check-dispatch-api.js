const assert = require('assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');

const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'dispatch-api-check-'));

process.env.DISPATCH_REPORT_STORAGE_ROOT = path.join(tempRoot, 'storage');
process.env.AUTO_OPEN_BROWSER = '0';
process.env.NODE_ENV = 'test';

const { createApp } = require('../src/app');
const sseService = require('../src/services/sse.service');
const syncGuard = require('../src/services/syncGuard.service');

function closeServer(server) {
  return new Promise((resolve, reject) => {
    server.close((error) => {
      if (error) reject(error);
      else resolve();
    });
  });
}

async function request(baseUrl, endpoint, init = {}) {
  const response = await fetch(`${baseUrl}${endpoint}`, init);
  const text = await response.text();

  let body = null;
  try {
    body = JSON.parse(text);
  } catch {
    body = text;
  }

  return {
    body,
    headers: response.headers,
    status: response.status
  };
}

async function main() {
  const app = createApp();
  const server = await new Promise((resolve) => {
    const instance = app.listen(0, '127.0.0.1', () => resolve(instance));
  });
  const { port } = server.address();
  const appBaseUrl = `http://127.0.0.1:${port}`;
  const apiBaseUrl = `${appBaseUrl}/api`;

  try {
    const health = await request(apiBaseUrl, '/health');
    assert.equal(health.status, 200);
    assert.equal(health.body.success, true);

    const latest = await request(apiBaseUrl, '/dispatch-reports/latest');
    assert.equal(latest.status, 200);
    assert.ok(latest.body.data.reportId);
    assert.ok(Array.isArray(latest.body.data.rankings));

    const current = await request(apiBaseUrl, '/current');
    assert.equal(current.status, 200);
    assert.equal(current.body.success, true);
    assert.ok(current.body.data);
    assert.equal(current.body.data.frontendLock.sourceOfTruth, 'backend-master');
    assert.equal(current.body.data.frontendLock.frontendMayComputeRanking, false);
    assert.ok(current.body.data.officialVersion);
    assert.ok(current.body.data.officialFingerprint);

    const syncReport = await request(apiBaseUrl, '/sync/report', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        screenId: 'mobile',
        officialVersion: current.body.data.officialVersion,
        officialFingerprint: current.body.data.officialFingerprint
      })
    });
    assert.equal(syncReport.status, 200);
    assert.equal(syncReport.body.success, true);
    assert.equal(syncReport.body.data.officialVersion, current.body.data.officialVersion);

    const syncStatus = await request(apiBaseUrl, '/sync/status');
    assert.equal(syncStatus.status, 200);
    assert.equal(syncStatus.body.success, true);
    assert.ok(Array.isArray(syncStatus.body.data.endpoints));

    const performance = await request(apiBaseUrl, '/performance/current');
    assert.equal(performance.status, 200);
    assert.ok(performance.body.data);
    assert.ok(Array.isArray(performance.body.data.dispatchOrder));

    const missingApiRoute = await request(apiBaseUrl, '/does-not-exist');
    assert.equal(missingApiRoute.status, 404);
    assert.equal(missingApiRoute.body.code, 'NOT_FOUND');

    const spaFallback = await request(appBaseUrl, '/some/deep/link', {
      headers: {
        Accept: 'text/html'
      }
    });
    assert.equal(spaFallback.status, 200);
    assert.match(spaFallback.headers.get('content-type') || '', /text\/html/i);
    assert.match(String(spaFallback.body), /<!DOCTYPE html>/i);

    const nonHtmlFallback = await request(appBaseUrl, '/missing.json', {
      headers: {
        Accept: 'application/json'
      }
    });
    assert.equal(nonHtmlFallback.status, 404);
    assert.doesNotMatch(String(nonHtmlFallback.body), /<!DOCTYPE html>/i);

    console.log('Dispatch API smoke check passed.');
  } finally {
    sseService.stopDataWatcher();
    syncGuard.stopSyncGuard();
    await closeServer(server);
    fs.rmSync(tempRoot, { recursive: true, force: true });
  }
}

main().catch((error) => {
  console.error(error.stack || error.message);
  fs.rmSync(tempRoot, { recursive: true, force: true });
  process.exitCode = 1;
});
