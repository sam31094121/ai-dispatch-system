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
  const baseUrl = `http://127.0.0.1:${port}/api`;

  try {
    const payload = {
      title: 'AI 派單公告｜4/16 結算 → 4/17 正式派單順序',
      sourceText,
      settlementDate: '2026-04-16',
      dispatchDate: '2026-04-17',
      operator: 'test'
    };

    const parse = await requestJson(baseUrl, '/dispatch-reports/parse', {
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

    const duplicateParse = await requestJson(baseUrl, '/dispatch-reports/parse', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json; charset=utf-8'
      },
      body: JSON.stringify(payload)
    });

    assert.equal(duplicateParse.status, 409);
    assert.equal(duplicateParse.body.code, 'DUPLICATE_REPORT');

    const reportId = parse.body.data.reportId;
    const latest = await requestJson(baseUrl, '/dispatch-reports/latest');
    const report = await requestJson(baseUrl, `/dispatch-reports/${reportId}`);
    const top10 = await requestJson(baseUrl, `/dispatch-reports/${reportId}/top10`);
    const groups = await requestJson(baseUrl, `/dispatch-reports/${reportId}/groups`);
    const shortText = await requestJson(baseUrl, `/dispatch-reports/${reportId}/short-text`);
    const current = await requestJson(baseUrl, '/current');

    assert.equal(latest.status, 200);
    assert.equal(latest.body.data.reportId, reportId);

    assert.equal(report.status, 200);
    assert.equal(report.body.data.rankings[0].name, '王梅慧');
    assert.equal(report.body.data.rankings[10].name, '徐華妤');

    assert.equal(top10.status, 200);
    assert.deepEqual(
      top10.body.data.items.map((entry) => entry.name),
      ['王梅慧', '馬秋香', '王珍珠', '李玲玲', '林宜靜', '林沛昕', '湯玉琦', '鄭上官', '許喬恩', '高美雲']
    );

    assert.equal(groups.status, 200);
    assert.deepEqual(groups.body.data.A1, ['王梅慧', '馬秋香', '王珍珠', '李玲玲']);
    assert.deepEqual(groups.body.data.A2, ['林宜靜', '林沛昕', '湯玉琦', '鄭上官', '許喬恩', '高美雲']);
    assert.deepEqual(groups.body.data.B, ['徐華妤', '高如郁', '梁依萍', '蘇淑玲', '廖姿惠', '江麗勉', '陳玲華']);

    assert.equal(shortText.status, 200);
    assert.match(shortText.body.data.text, /已離職：陳旭宜，只列審計不入派單/);
    assert.match(shortText.body.data.text, /正式前10名：1王梅慧 2馬秋香 3王珍珠 4李玲玲 5林宜靜 6林沛昕 7湯玉琦 8鄭上官 9許喬恩 10高美雲/);

    assert.equal(current.status, 200);
    assert.equal(current.body.data.audit.status, 'PASS');
    assert.equal(current.body.data.ranking[0].name, '王梅慧');

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

    const smartFix = await requestJson(baseUrl, '/smart-fix', {
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
    assert.ok(smartFix.body.data.fixes.some((fix) => fix.field === 'summaryBoard'));
    assert.ok(smartFix.body.data.fixes.some((fix) => fix.field === 'adviceList'));
    assert.ok(smartFix.body.data.fixes.some((fix) => fix.field === 'groupShortText'));

    const reviewAudit = await requestJson(baseUrl, '/audit', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json; charset=utf-8'
      },
      body: JSON.stringify({
        rawText: reviewSourceText
      })
    });

    assert.equal(reviewAudit.status, 400);
    assert.equal(reviewAudit.body.data.validation.status, 'FAIL');
    assert.ok(
      reviewAudit.body.data.validation.errors.includes('群組超精簡版的 A1 / A2 / B / C 必須與正式名次一致')
    );
    assert.deepEqual(reviewAudit.body.data.standardData.分級.A2, [
      '林宜靜',
      '林沛昕',
      '鄭上官',
      '徐華妤',
      '湯玉琦',
      '許喬恩'
    ]);
    assert.equal(reviewAudit.body.data.standardData.分級.B[0], '梁依萍');
    assert.match(reviewAudit.body.data.standardData.群組超精簡版, /B組：梁依萍、高美雲、高如郁、廖姿惠、蘇淑玲、江麗勉、陳玲華。/);

    const reviewSmartFix = await requestJson(baseUrl, '/smart-fix', {
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
    assert.ok(reviewSmartFix.body.data.fixes.some((fix) => fix.field === 'groupShortText'));

    const fixedReviewPayload = JSON.parse(reviewSmartFix.body.data.fixedJson);
    assert.deepEqual(fixedReviewPayload.分級.A2, [
      '林宜靜',
      '林沛昕',
      '鄭上官',
      '徐華妤',
      '湯玉琦',
      '許喬恩'
    ]);
    assert.equal(fixedReviewPayload.分級.B[0], '梁依萍');
    assert.doesNotMatch(
      fixedReviewPayload.群組超精簡版,
      /A2：林宜靜、林沛昕、鄭上官、徐華妤、湯玉琦、許喬恩、梁依萍。/
    );
    assert.match(
      fixedReviewPayload.群組超精簡版,
      /A2：林宜靜、林沛昕、鄭上官、徐華妤、湯玉琦、許喬恩。/
    );

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
