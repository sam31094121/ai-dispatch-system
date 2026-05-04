const assert = require('assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');

const fixturePath = path.join(__dirname, '..', 'fixtures', 'dispatch-report-2026-04-16.txt');
const reviewFixturePath = path.join(__dirname, '..', 'fixtures', 'dispatch-report-2026-04-20-review.txt');
const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'dispatch-api-check-'));

process.env.DISPATCH_REPORT_STORAGE_ROOT = path.join(tempRoot, 'storage');
process.env.AUTO_OPEN_BROWSER = '0';
process.env.NODE_ENV = 'test';

const { createApp } = require('../src/app');

function deepClone(value) {
  return JSON.parse(JSON.stringify(value));
}

function closeServer(server) {
  return new Promise((resolve, reject) => {
    server.close((error) => {
      if (error) {
        reject(error);
        return;
      }
      resolve();
    });
  });
}

function metric(row, key) {
  return Number(row?.metrics?.[key] ?? row?.[key] ?? 0);
}

function sortedByPermanentAiPolicy(rows) {
  return [...rows].sort((left, right) => {
    const keys = ['正式權重分數', '實收', '續單金額', '總業績', '追續客單價', '追續成交總數'];
    for (const key of keys) {
      const delta = metric(right, key) - metric(left, key);
      if (delta !== 0) return delta;
    }
    return Number(left.rank ?? left.名次 ?? 0) - Number(right.rank ?? right.名次 ?? 0);
  });
}

function expectedGroupsFromNames(names) {
  return {
    A1: names.slice(0, 4),
    A2: names.slice(4, 11),
    B: names.slice(11, 18),
    C: names.slice(18)
  };
}

async function requestJson(baseUrl, endpoint, init = {}) {
  const response = await fetch(`${baseUrl}${endpoint}`, init);
  const text = await response.text();
  let body = null;

  try {
    body = JSON.parse(text);
  } catch (error) {
    throw new Error(`Expected JSON from ${endpoint}, received: ${text}`);
  }

  return {
    status: response.status,
    body
  };
}

async function requestText(baseUrl, endpoint, init = {}) {
  const response = await fetch(`${baseUrl}${endpoint}`, init);

  return {
    headers: response.headers,
    status: response.status,
    text: await response.text()
  };
}

async function main() {
  const sourceText = fs.readFileSync(fixturePath, 'utf8');
  const reviewSourceText = fs.readFileSync(reviewFixturePath, 'utf8');
  const defaultAnnouncement = JSON.parse(
    fs.readFileSync(path.join(__dirname, '..', 'shared', 'default-announcement.json'), 'utf8')
  );
  const app = createApp();
  const server = await new Promise((resolve) => {
    const instance = app.listen(0, '127.0.0.1', () => resolve(instance));
  });
  const { port } = server.address();
  const appBaseUrl = `http://127.0.0.1:${port}`;
  const apiBaseUrl = `${appBaseUrl}/api`;

  try {
    const payload = {
      title: 'AI 派單公告｜4/16 結算 → 4/17 正式派單順序',
      sourceText,
      settlementDate: '2026-04-16',
      dispatchDate: '2026-04-17',
      operator: 'test'
    };

    const parse = await requestJson(apiBaseUrl, '/dispatch-reports/parse', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json; charset=utf-8'
      },
      body: JSON.stringify(payload)
    });

    assert.equal(parse.status, 200);
    assert.equal(parse.body.code, 'PARSE_SUCCESS');
    assert.equal(parse.body.data.reportId, 'dispatch_2026_04_16_v1');
    assert.equal(parse.body.data.auditResult, 'PASS');
    assert.equal(parse.body.data.rankings.length, 23);
    assert.deepEqual(
      parse.body.data.audit.excludedEmployees.map((entry) => entry.name),
      ['陳旭宜']
    );

    const duplicateParse = await requestJson(apiBaseUrl, '/dispatch-reports/parse', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json; charset=utf-8'
      },
      body: JSON.stringify(payload)
    });

    assert.equal(duplicateParse.status, 409);
    assert.equal(duplicateParse.body.code, 'DUPLICATE_REPORT');

    const reportId = parse.body.data.reportId;
    const latest = await requestJson(apiBaseUrl, '/dispatch-reports/latest');
    const report = await requestJson(apiBaseUrl, `/dispatch-reports/${reportId}`);
    const top10 = await requestJson(apiBaseUrl, `/dispatch-reports/${reportId}/top10`);
    const groups = await requestJson(apiBaseUrl, `/dispatch-reports/${reportId}/groups`);
    const shortText = await requestJson(apiBaseUrl, `/dispatch-reports/${reportId}/short-text`);
    const current = await requestJson(apiBaseUrl, '/current');

    assert.equal(latest.status, 200);
    assert.equal(latest.body.data.reportId, reportId);

    assert.equal(report.status, 200);
    assert.equal(report.body.data.rankings[0].name, '王梅慧');
    assert.deepEqual(
      report.body.data.rankings.map((entry) => entry.name),
      sortedByPermanentAiPolicy(report.body.data.rankings).map((entry) => entry.name)
    );
    assert.ok(report.body.data.rankings.every((entry) => Number.isFinite(metric(entry, '正式權重分數'))));

    assert.equal(top10.status, 200);
    assert.deepEqual(
      top10.body.data.items.map((entry) => entry.name),
      report.body.data.rankings.slice(0, 10).map((entry) => entry.name)
    );

    assert.equal(groups.status, 200);
    assert.deepEqual(groups.body.data, {
      reportId,
      ...expectedGroupsFromNames(report.body.data.rankings.map((entry) => entry.name))
    });

    assert.equal(shortText.status, 200);
    assert.match(shortText.body.data.text, /已離職：陳旭宜，只列審計不入派單/);
    const top10ShortText = report.body.data.rankings.slice(0, 10).map((entry) => `${entry.rank}${entry.name}`).join(' ');
    assert.match(shortText.body.data.text, new RegExp(`正式前10名：${top10ShortText}`));

    assert.equal(current.status, 200);
    assert.equal(current.body.data.audit.status, 'PASS');
    assert.equal(current.body.data.ranking[0].name, '王梅慧');
    assert.equal(current.body.data.scoringPolicy.title, 'AI比例原則永久鎖死版');

    const missingApiRoute = await requestJson(apiBaseUrl, '/does-not-exist');
    assert.equal(missingApiRoute.status, 404);
    assert.equal(missingApiRoute.body.code, 'NOT_FOUND');
    assert.equal(missingApiRoute.body.message, 'API route not found');

    const missingApiPostRoute = await requestJson(apiBaseUrl, '/does-not-exist', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json; charset=utf-8'
      },
      body: JSON.stringify({ test: true })
    });
    assert.equal(missingApiPostRoute.status, 404);
    assert.equal(missingApiPostRoute.body.code, 'NOT_FOUND');

    const spaFallback = await requestText(appBaseUrl, '/some/deep/link', {
      headers: {
        Accept: 'text/html'
      }
    });
    assert.equal(spaFallback.status, 200);
    assert.match(spaFallback.headers.get('content-type') || '', /text\/html/i);
    assert.match(spaFallback.text, /<!DOCTYPE html>/i);

    const nonHtmlFallback = await requestText(appBaseUrl, '/missing.json', {
      headers: {
        Accept: 'application/json'
      }
    });
    assert.equal(nonHtmlFallback.status, 404);
    assert.doesNotMatch(nonHtmlFallback.text, /<!DOCTYPE html>/i);

    const conflictedAnnouncement = deepClone(defaultAnnouncement);
    conflictedAnnouncement.審計結論.結果 = 'FAIL';
    conflictedAnnouncement.整合總盤.本月業績 = 1;
    conflictedAnnouncement.群組超精簡版 = '舊版錯誤摘要';
    conflictedAnnouncement.最後確認 = ['三平台總表全部通過', '正式派單順序以舊版為準'];
    conflictedAnnouncement.正式名次[0].名次 = 9;
    conflictedAnnouncement.正式名次[0].分級 = 'C';
    conflictedAnnouncement.正式名次[0].建議 = '';
    [conflictedAnnouncement.正式名次[1], conflictedAnnouncement.正式名次[2]] = [
      conflictedAnnouncement.正式名次[2],
      conflictedAnnouncement.正式名次[1]
    ];
    conflictedAnnouncement.分級.A2.push(conflictedAnnouncement.分級.B[0]);

    const smartFix = await requestJson(apiBaseUrl, '/smart-fix', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json; charset=utf-8'
      },
      body: JSON.stringify({
        rawText: JSON.stringify(conflictedAnnouncement, null, 2)
      })
    });

    assert.equal(smartFix.status, 200);
    assert.equal(smartFix.body.success, true);
    assert.equal(smartFix.body.data.validation.status, 'PASS');
    assert.equal(smartFix.body.data.remainingErrors, 0);
    assert.ok(smartFix.body.data.fixCount >= 5);

    const fixedPayload = JSON.parse(smartFix.body.data.fixedJson);
    assert.equal(fixedPayload.審計結論.結果, 'PASS');
    assert.equal(fixedPayload.正式名次[0].名次, 1);
    assert.equal(fixedPayload.正式名次[0].分級, 'A1');
    assert.ok(fixedPayload.正式名次.every((row) => typeof row.建議 === 'string' && row.建議.trim()));

    const aggregateMonthlyRevenue = Object.entries(fixedPayload.審計結論)
      .filter(([key, value]) => !['結果', '規則', '特別說明', '審計列示不入派單'].includes(key) && value && typeof value === 'object')
      .reduce((sum, [, platform]) => sum + Number(platform.本月業績 || 0), 0);
    assert.equal(fixedPayload.整合總盤.本月業績, aggregateMonthlyRevenue);

    const groupedNames = ['A1', 'A2', 'B', 'C'].flatMap((groupKey) => fixedPayload.分級[groupKey] || []);
    assert.equal(new Set(groupedNames).size, fixedPayload.正式名次.length);
    assert.ok(smartFix.body.data.fixes.some((fix) => fix.field === 'finalConfirmations'));

    const reviewAudit = await requestJson(apiBaseUrl, '/audit', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json; charset=utf-8'
      },
      body: JSON.stringify({
        rawText: reviewSourceText
      })
    });

    assert.equal(reviewAudit.status, 200);
    assert.equal(reviewAudit.body.data.validation.status, 'PASS');
    assert.equal(reviewAudit.body.data.validation.errors.length, 0);
    const reviewNames = reviewAudit.body.data.standardData.正式名次.map((entry) => entry.姓名);
    assert.deepEqual(reviewNames, sortedByPermanentAiPolicy(reviewAudit.body.data.standardData.正式名次).map((entry) => entry.姓名));
    assert.deepEqual(reviewAudit.body.data.standardData.分級, expectedGroupsFromNames(reviewNames));

    const reviewSmartFix = await requestJson(apiBaseUrl, '/smart-fix', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json; charset=utf-8'
      },
      body: JSON.stringify({
        rawText: reviewSourceText
      })
    });

    assert.equal(reviewSmartFix.status, 200);
    assert.equal(reviewSmartFix.body.data.validation.status, 'PASS');
    assert.equal(reviewSmartFix.body.data.remainingErrors, 0);
    assert.ok(reviewSmartFix.body.data.fixes.some((fix) => fix.field === 'finalConfirmations'));

    const fixedReviewPayload = JSON.parse(reviewSmartFix.body.data.fixedJson);
    const fixedReviewNames = fixedReviewPayload.正式名次.map((entry) => entry.姓名);
    assert.deepEqual(fixedReviewNames, sortedByPermanentAiPolicy(fixedReviewPayload.正式名次).map((entry) => entry.姓名));
    assert.deepEqual(fixedReviewPayload.分級, expectedGroupsFromNames(fixedReviewNames));
    assert.match(fixedReviewPayload.群組超精簡版, new RegExp(`A2：${fixedReviewPayload.分級.A2.join('、')}。`));

    console.log('Dispatch API regression check passed.');
  } finally {
    await closeServer(server);
    fs.rmSync(tempRoot, { recursive: true, force: true });
  }
}

main().catch((error) => {
  console.error(error.stack || error.message);
  fs.rmSync(tempRoot, { recursive: true, force: true });
  process.exitCode = 1;
});
