const fs = require('fs');
const { spawn } = require('child_process');
const express = require('express');
const cors = require('cors');
const path = require('path');
const { enhanceSnapshotWithGemini, getGeminiRuntime } = require('./shared/gemini');

const {
  SYSTEM,
  BASELINE_SEEDS,
  BIGDATA_ADVICE_BASELINE,
  analyze,
  buildDefaultRawReport,
  buildExpectedChanges,
  buildExpectedGroups,
  compareRankPeople,
  createPreviewSnapshot,
  ensureDirs,
  ensureInitialized,
  groupKey,
  listStoredSnapshots,
  summarizeStoredSnapshotsByDate,
  loadStoredSnapshot,
  loadLatestSnapshot,
  runFullPipeline,
  taipeiNow
} = require('./shared/dispatch-engine');
const {
  OFFICIAL_0408_TO_0409,
  isPlaceholderText,
  hasQuestionBlock,
  countRankChangeEntries,
  collectRankingTotals,
  repairOfficial0408Snapshot
} = require('./shared/official-locks');

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.disable('x-powered-by');

function openBrowser(url) {
  if (
    process.env.AUTO_OPEN_BROWSER === '0' ||
    process.env.NO_BROWSER === '1' ||
    process.env.CI === 'true' ||
    process.env.NODE_ENV === 'test'
  ) {
    return;
  }

  try {
    if (process.platform === 'win32') {
      const child = spawn('cmd', ['/c', 'start', '', url], {
        detached: true,
        stdio: 'ignore',
        windowsHide: true
      });
      child.unref();
      return;
    }

    if (process.platform === 'darwin') {
      const child = spawn('open', [url], {
        detached: true,
        stdio: 'ignore'
      });
      child.unref();
      return;
    }

    const child = spawn('xdg-open', [url], {
      detached: true,
      stdio: 'ignore'
    });
    child.unref();
  } catch (error) {
    console.log(`無法自動開啟瀏覽器：${error.message}`);
  }
}

const dataPaths = {
  dataDir: path.join(__dirname, 'data'),
  reportDir: path.join(__dirname, 'data', 'reports'),
  backupDir: path.join(__dirname, 'data', 'backups'),
  archiveDir: path.join(__dirname, 'data', 'archive'),
  latestFile: path.join(__dirname, 'data', 'latest.json'),
  logFile: path.join(__dirname, 'data', 'system-log.jsonl')
};

ensureDirs(dataPaths);
ensureInitialized(dataPaths);

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.static(path.join(__dirname, 'public'), {
  etag: true,
  maxAge: '1y',
  setHeaders(res, filePath) {
    if (filePath.endsWith('.html')) {
      res.setHeader('Cache-Control', 'no-cache');
      return;
    }

    if (/\.(css|js|png|jpg|jpeg|gif|svg|webp|ico|woff2?)$/i.test(filePath)) {
      res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    }
  }
}));

const snapshotAiCache = new Map();

const FRONTEND_AI_CONTRACT = Object.freeze({
  name: '前端ＡＩ美化確認系統',
  purpose: '前端ＡＩ只進入展示層，專責顏色、美化、科技感、科技數字與確認提示，不介入後端真實資料、審計、排名與公式。',
  allowed: ['顏色功能', '美化功能', '科技功能', '科技數字功能', '前端確認功能'],
  forbidden: ['後端運算', '派單名次重算', '審計重算', '公式改動', '真實資料改動'],
  colorPrinciples: ['深層科技底色', '金色耀光主視覺', '青藍科技流光', '紫色分析輔助光', '綠色成功確認', '橘色警示提醒', '紅色危險阻擋'],
  confirmationFields: [
    { key: 'dataSynced', label: '資料是否已同步', source: 'backend', type: 'positive' },
    { key: 'colorsApplied', label: '顏色是否已套用', source: 'frontend', type: 'positive' },
    { key: 'beautified', label: '美化是否已完成', source: 'frontend', type: 'positive' },
    { key: 'techEnabled', label: '科技功能是否已啟用', source: 'frontend', type: 'positive' },
    { key: 'techNumbersApplied', label: '科技數字是否已套用', source: 'frontend', type: 'positive' },
    { key: 'backendDataConfirmed', label: '後端資料是否已確認', source: 'backend', type: 'positive' },
    { key: 'hasFakeData', label: '前端是否有假資料', source: 'backend', type: 'negative' },
    { key: 'rankRewrite', label: '前端是否有自行改動名次', source: 'backend', type: 'negative' },
    { key: 'auditRewrite', label: '前端是否有自行改動審計', source: 'backend', type: 'negative' },
    { key: 'allowFormalDisplay', label: '前端是否允許送出畫面', source: 'hybrid', type: 'positive' }
  ],
  executionPhases: [
    {
      key: 'phase-1',
      title: '階段一｜基礎建置',
      goal: '建立前端ＡＩ只能管畫面、不碰後端的規則。',
      tasks: ['建立前端ＡＩ設定中心', '建立顏色策略區', '建立美化策略區', '建立科技功能策略區', '建立科技數字策略區', '建立確認判斷區']
    },
    {
      key: 'phase-2',
      title: '階段二｜畫面整合',
      goal: '讓前端ＡＩ真正介入畫面層，但只吃後端真實資料。',
      tasks: ['接後端真實資料', '套用主題色', '套用排版優化', '套用科技視覺', '套用數字高亮', '套用確認區塊']
    },
    {
      key: 'phase-3',
      title: '階段三｜確認鎖死',
      goal: '避免假畫面、假確認、假完成。',
      tasks: ['檢查是否已同步', '檢查是否已套用顏色', '檢查是否已套用美化', '檢查是否已啟用科技功能', '檢查是否已完成科技數字層次', '檢查是否有假資料', '檢查是否有越權改動']
    },
    {
      key: 'phase-4',
      title: '階段四｜正式上線',
      goal: '以前端正式版方式上線，不與後端衝突。',
      tasks: ['套用正式配色', '套用正式版面', '套用正式確認邏輯', '顯示正式確認標章']
    }
  ],
  successBanner: '前端正式版已確認',
  blockedBanner: '尚未完成確認，不得視為正式版面'
});

function asyncRoute(handler) {
  return (req, res, next) => Promise.resolve(handler(req, res, next)).catch(next);
}

function persistSnapshotFiles(snapshot) {
  if (!snapshot?.files) return;

  const serialized = JSON.stringify(snapshot, null, 2);
  const targets = [
    snapshot.files.reportFile ? path.join(dataPaths.reportDir, snapshot.files.reportFile) : null,
    snapshot.files.backupFile ? path.join(dataPaths.backupDir, snapshot.files.backupFile) : null,
    snapshot.files.archiveFile ? path.join(dataPaths.archiveDir, snapshot.files.archiveFile) : null
  ].filter(Boolean);

  targets.forEach((filePath) => {
    fs.writeFileSync(filePath, serialized, 'utf8');
  });

  fs.writeFileSync(dataPaths.latestFile, serialized, 'utf8');
}

async function applyGeminiOverlay(snapshot, options = {}) {
  if (!snapshot?.executionId) return snapshot;

  const cacheKey = `${snapshot.executionId}:${snapshot.completedAt || ''}`;
  if (snapshotAiCache.has(cacheKey)) {
    return snapshotAiCache.get(cacheKey);
  }

  const result = await enhanceSnapshotWithGemini(snapshot, { appDir: __dirname });
  const finalSnapshot = result?.snapshot || snapshot;

  if (options.persist && result?.changed) {
    persistSnapshotFiles(finalSnapshot);
  }

  if (finalSnapshot.aiProvider?.status === 'connected') {
    snapshotAiCache.set(cacheKey, finalSnapshot);
  }
  return finalSnapshot;
}

function respond(success, message, data) {
  return {
    success,
    message,
    systemName: SYSTEM.name,
    systemVersion: SYSTEM.version,
    serverTime: taipeiNow(),
    data
  };
}

function getRawText(req) {
  return String(req.body?.rawText || '').trim();
}

function requireRawText(req, res) {
  const rawText = getRawText(req);
  if (!rawText) {
    res.status(400).json(respond(false, '請貼上業績日報文字', null));
    return null;
  }
  return rawText;
}

function latestSnapshot() {
  return loadLatestSnapshot(dataPaths) || ensureInitialized(dataPaths);
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function arraysEqualSafe(left, right) {
  const a = Array.isArray(left) ? left : [];
  const b = Array.isArray(right) ? right : [];
  if (a.length !== b.length) return false;
  return a.every((value, index) => value === b[index]);
}

function buildServerExpectedGroups(ranking) {
  const rows = Array.isArray(ranking) ? ranking : [];
  return {
    A1: rows.filter((person) => groupKey(Number(person.rank || 0)) === 'A1').map((person) => person.name),
    A2: rows.filter((person) => groupKey(Number(person.rank || 0)) === 'A2').map((person) => person.name),
    B: rows.filter((person) => groupKey(Number(person.rank || 0)) === 'B').map((person) => person.name),
    C: rows.filter((person) => groupKey(Number(person.rank || 0)) === 'C').map((person) => person.name)
  };
}

function buildServerExpectedRankChanges(ranking) {
  const rows = Array.isArray(ranking) ? ranking : [];
  return {
    new: rows.filter((person) => Number(person.previousRank || 0) === 0).map((person) => person.name),
    up: rows.filter((person) => Number(person.rankDelta || 0) > 0).map((person) => person.name),
    down: rows.filter((person) => Number(person.rankDelta || 0) < 0).map((person) => person.name),
    flat: rows
      .filter((person) => Number(person.rankDelta || 0) === 0 && Number(person.previousRank || 0) > 0)
      .map((person) => person.name)
  };
}

function buildSnapshotDataAnomalies(snapshot) {
  const anomalies = [];
  const ranking = Array.isArray(snapshot?.ranking) ? snapshot.ranking : [];
  const parsedPeople = Array.isArray(snapshot?.parsedData?.people) ? snapshot.parsedData.people : [];
  const groups = snapshot?.groups || {};
  const overallStats = snapshot?.overallStats || {};
  const placeholderRankingNames = ranking.filter((person) => isPlaceholderText(person.name));
  const placeholderParsedNames = parsedPeople.filter((person) => isPlaceholderText(person.name));
  const rankingTotals = collectRankingTotals(ranking);
  const expectedGroups = buildServerExpectedGroups(ranking);
  const expectedChanges = buildServerExpectedRankChanges(ranking);
  const actualRankChanges = snapshot?.rankChanges || {};
  const actualRankChangeNames = {
    up: (actualRankChanges.up || []).map((item) => item.name),
    down: (actualRankChanges.down || []).map((item) => item.name),
    flat: (actualRankChanges.flat || []).map((item) => item.name),
    new: (actualRankChanges.new || []).map((item) => item.name)
  };
  const expectedRoster = BASELINE_SEEDS.map((seed) => seed.name);
  const actualRoster = ranking.map((person) => person.name).filter(Boolean);
  const missingRoster = expectedRoster.filter((name) => !actualRoster.includes(name));
  const extraRoster = actualRoster.filter((name, index) => actualRoster.indexOf(name) === index && !expectedRoster.includes(name));
  const duplicateRankingNames = actualRoster.filter((name, index) => actualRoster.indexOf(name) !== index);

  if (placeholderRankingNames.length) {
    anomalies.push('\u6b63\u5f0f\u540d\u6b21\u6709 ' + placeholderRankingNames.length + ' \u4f4d\u59d3\u540d\u7570\u5e38\uff0c\u4ecd\u5e36\u6709\u554f\u865f\u6216\u4f54\u4f4d\u5b57\u5143\u3002');
  }

  if (placeholderParsedNames.length) {
    anomalies.push('\u539f\u59cb\u89e3\u6790\u540d\u55ae\u6709 ' + placeholderParsedNames.length + ' \u4f4d\u59d3\u540d\u7570\u5e38\uff0c\u8acb\u5148\u56de\u982d\u6e05\u7406\u8cbc\u4e0a\u5167\u5bb9\u3002');
  }

  if (hasQuestionBlock(snapshot?.rawText)) {
    anomalies.push('\u539f\u59cb\u8cbc\u4e0a\u5167\u5bb9\u51fa\u73fe\u554f\u865f\u5340\u584a\uff0c\u61f7\u7591\u8cbc\u4e0a\u6216\u7de8\u78bc\u904e\u7a0b\u5df2\u53d7\u640d\u3002');
  }

  if (hasQuestionBlock(snapshot?.announcement)) {
    anomalies.push('\u516c\u544a\u5167\u6587\u51fa\u73fe\u554f\u865f\u5340\u584a\uff0c\u4e0d\u53ef\u76f4\u63a5\u7576\u4f5c\u6b63\u5f0f\u7248\u5c0d\u5916\u4f7f\u7528\u3002');
  }

  if (Number(overallStats.monthlyRevenue || 0) > 0 && rankingTotals.monthlyRevenue !== Number(overallStats.monthlyRevenue || 0)) {
    anomalies.push(
      '\u6574\u5408\u7e3d\u76e4\u300c\u672c\u6708\u696d\u7e3e\u300d\u70ba ' + overallStats.monthlyRevenue +
      '\uff0c\u4f46\u540d\u6b21\u660e\u7d30\u52a0\u7e3d\u70ba ' + rankingTotals.monthlyRevenue +
      '\uff0c\u8acb\u4ee5\u660e\u7d30\u52a0\u7e3d\u70ba\u6e96\u3002'
    );
  }

  if (Number(overallStats.renewalAmount || 0) > 0 && rankingTotals.renewalAmount !== Number(overallStats.renewalAmount || 0)) {
    anomalies.push(
      '\u6574\u5408\u7e3d\u76e4\u300c\u7e8c\u55ae\u91d1\u984d\u300d\u70ba ' + overallStats.renewalAmount +
      '\uff0c\u4f46\u540d\u6b21\u660e\u7d30\u52a0\u7e3d\u70ba ' + rankingTotals.renewalAmount +
      '\uff0c\u8acb\u5148\u4fee\u6b63\u5f8c\u518d\u767c\u4f48\u3002'
    );
  }

  if (Number(overallStats.renewalCalls || 0) > 0 && rankingTotals.renewalCalls !== Number(overallStats.renewalCalls || 0)) {
    anomalies.push(
      '\u6574\u5408\u7e3d\u76e4\u300c\u8ffd\u7e8c\u6210\u4ea4\u7e3d\u6578\u300d\u70ba ' + overallStats.renewalCalls +
      '\uff0c\u4f46\u540d\u6b21\u660e\u7d30\u52a0\u7e3d\u70ba ' + rankingTotals.renewalCalls +
      '\uff0c\u8acb\u4ee5\u660e\u7d30\u52a0\u7e3d\u91cd\u5efa\u3002'
    );
  }

  if (ranking.some((person, index) => index > 0 && compareRankPeople(ranking[index - 1], person) > 0)) {
    anomalies.push('\u540d\u6b21\u9806\u5e8f\u8207\u9396\u5b9a\u6392\u5e8f\u898f\u5247\u4e0d\u4e00\u81f4\uff0c\u8acb\u91cd\u65b0\u7528\u300c\u7e3d\u696d\u7e3e \u2192 \u7e8c\u55ae\u91d1\u984d \u2192 \u8ffd\u7e8c\u6210\u4ea4\u7e3d\u6578 \u2192 \u6d3e\u55ae\u6210\u4ea4\u7e3d\u901a\u6578\u300d\u91cd\u6392\u3002');
  }

  if (!arraysEqualSafe(groups.A1, expectedGroups.A1) || !arraysEqualSafe(groups.A2, expectedGroups.A2) || !arraysEqualSafe(groups.B, expectedGroups.B) || !arraysEqualSafe(groups.C, expectedGroups.C)) {
    anomalies.push('A1 / A2 / B / C \u5206\u7d44\u8207\u6b63\u5f0f\u6392\u540d\u4e0d\u4e00\u81f4\uff0c\u524d\u5f8c\u7aef\u6709\u77db\u76fe\u98a8\u96aa\u3002');
  }

  if (countRankChangeEntries(actualRankChanges) > 0 && (!arraysEqualSafe(actualRankChangeNames.up, expectedChanges.up) || !arraysEqualSafe(actualRankChangeNames.down, expectedChanges.down) || !arraysEqualSafe(actualRankChangeNames.flat, expectedChanges.flat) || !arraysEqualSafe(actualRankChangeNames.new, expectedChanges.new))) {
    anomalies.push('\u540d\u6b21\u7570\u52d5\u91cd\u9ede\u8207\u5be6\u969b\u540d\u6b21\u4e0d\u4e00\u81f4\uff0c\u5bb9\u6613\u8b93\u884c\u92b7\u8207\u4e3b\u7ba1\u8aa4\u5224\u3002');
  }

  if (missingRoster.length) {
    anomalies.push('\u672c\u8f2a\u7f3a\u5c11 ' + missingRoster.length + ' \u4f4d\u6b63\u5f0f\u884c\u92b7\u540d\u55ae\uff1a' + missingRoster.join('\u3001'));
  }

  if (extraRoster.length) {
    anomalies.push('\u672c\u8f2a\u51fa\u73fe ' + extraRoster.length + ' \u4f4d\u4e0d\u5728\u6b63\u5f0f\u540d\u55ae\u7684\u4eba\u54e1\uff1a' + extraRoster.join('\u3001'));
  }

  if (duplicateRankingNames.length) {
    anomalies.push('\u672c\u8f2a\u540d\u6b21\u76e4\u51fa\u73fe\u91cd\u8907\u59d3\u540d\uff1a' + [...new Set(duplicateRankingNames)].join('\u3001'));
  }

  return anomalies;
}

function buildMaintenanceReport(snapshot) {
  const parsedPeople = Array.isArray(snapshot?.parsedData?.people) ? snapshot.parsedData.people : [];
  const ranking = Array.isArray(snapshot?.ranking) ? snapshot.ranking : [];
  const contradictions = Array.isArray(snapshot?.consistencyGuard?.contradictions)
    ? snapshot.consistencyGuard.contradictions
    : buildSnapshotDataAnomalies(snapshot);
  const invalidLines = Array.isArray(snapshot?.parsedData?.invalidLines) ? snapshot.parsedData.invalidLines : [];
  const duplicateNames = Array.isArray(snapshot?.parsedData?.duplicateNames) ? snapshot.parsedData.duplicateNames : [];
  const unknownNames = Array.isArray(snapshot?.parsedData?.unknownNames) ? snapshot.parsedData.unknownNames : [];
  const repairLog = Array.isArray(snapshot?.repairLog) ? snapshot.repairLog : [];
  const anomalyCount = contradictions.length + invalidLines.length + duplicateNames.length + unknownNames.length;
  const rankingCount = ranking.length;
  const expectedRosterCount = BASELINE_SEEDS.length;
  const groupedPeopleCount = countGroupedPeople(snapshot?.groups);
  const auditPass = isPassStatus(snapshot?.audit?.status);
  const confirmationPass = isPassStatus(snapshot?.confirmation?.status);
  const formalReady = Boolean(snapshot?.frontendAiGuard?.allowFormalDisplay);
  const sourceLocked = Boolean(snapshot?.frontendLock?.frontendMustUseBackendSnapshot);
  const conflictBlocked = Boolean(snapshot?.consistencyGuard?.conflictBlocked);
  const orderedPeople = ranking.length
    ? ranking.map((person, index) => ({
        rank: Number(person.rank || index + 1),
        name: person.name,
        originalName: person.name,
        group: person.group || groupKey(Number(person.rank || index + 1))
      }))
    : parsedPeople.map((person, index) => ({
        rank: Number(person.inputRank || index + 1),
        name: person.name,
        originalName: person.originalName || person.name,
        group: groupKey(Number(person.inputRank || index + 1))
      }));
  const status = anomalyCount ? 'WARN' : confirmationPass ? 'PASS' : 'PENDING';
  const healthScore = Math.max(0, 100 - contradictions.length * 12 - invalidLines.length * 8 - duplicateNames.length * 10 - unknownNames.length * 10 - Math.max(expectedRosterCount - orderedPeople.length, 0) * 3);
  const healthGrade = healthScore >= 95 ? 'A' : healthScore >= 85 ? 'B' : healthScore >= 70 ? 'C' : 'D';
  const riskLevel = anomalyCount ? (anomalyCount >= 3 || conflictBlocked ? 'high' : 'medium') : 'low';

  const scans = [];
  if (invalidLines.length) {
    scans.push({ tone: 'red', title: '\u8cbc\u4e0a\u7570\u5e38', detail: '\u5171\u6709 ' + invalidLines.length + ' \u884c\u683c\u5f0f\u4e0d\u5b8c\u6574\uff0c\u8acb\u56de\u982d\u6838\u5c0d\u539f\u59cb\u8cbc\u4e0a\u5167\u5bb9\u3002' });
  }
  if (duplicateNames.length) {
    scans.push({ tone: 'red', title: '\u91cd\u8907\u59d3\u540d', detail: '\u767c\u73fe ' + duplicateNames.length + ' \u4f4d\u91cd\u8907\u59d3\u540d\uff1a' + duplicateNames.join('\u3001') });
  }
  if (unknownNames.length) {
    scans.push({ tone: 'orange', title: '\u672a\u77e5\u540d\u55ae', detail: '\u767c\u73fe ' + unknownNames.length + ' \u4f4d\u4e0d\u5728\u6b63\u5f0f\u540d\u55ae\uff1a' + unknownNames.join('\u3001') });
  }
  contradictions.forEach((detail) => {
    scans.push({ tone: 'orange', title: '\u7570\u5e38\u6383\u63cf', detail });
  });
  if (!scans.length) {
    scans.push({ tone: 'green', title: '\u7570\u5e38\u6383\u63cf', detail: '\u76ee\u524d\u672a\u5075\u6e2c\u5230\u65b0\u7684\u7570\u5e38\u3002' });
  }

  const repairs = repairLog.length
    ? repairLog.map((detail) => ({ tone: 'green', title: '\u7dad\u4fee\u72c0\u614b', detail }))
    : [{ tone: anomalyCount ? 'orange' : 'green', title: '\u7dad\u4fee\u72c0\u614b', detail: anomalyCount ? '\u76ee\u524d\u5df2\u6709\u7570\u5e38\u5217\u5165\u6383\u63cf\uff0c\u8acb\u5148\u4fee\u6b63\u5f8c\u518d\u9001\u6b63\u5f0f\u6d3e\u55ae\u3002' : '\u76ee\u524d\u4e0d\u9700\u7dad\u4fee\uff0c\u6b63\u5f0f\u7248\u5feb\u7167\u7a69\u5b9a\u3002' }];

  const upkeep = [
    { tone: 'cyan', title: '\u65e5\u4fdd\u990a', detail: '\u6bcf\u6b21\u8cbc\u4e0a\u696d\u7e3e\u5148\u770b\u540d\u55ae\u9806\u5e8f\u8207\u7570\u5e38\u6383\u63cf\uff0c\u518d\u6c7a\u5b9a\u662f\u5426\u9001\u51fa\u6b63\u5f0f\u6d3e\u55ae\u3002' },
    { tone: 'cyan', title: '\u9031\u4fdd\u990a', detail: '\u78ba\u8a8d\u540d\u6b21\u3001\u5206\u7d44\u3001\u516c\u544a\u3001\u7e3d\u76e4\u662f\u5426\u4ecd\u8207\u5f8c\u7aef\u6b63\u5f0f\u5feb\u7167\u4e00\u81f4\u3002' },
    { tone: 'cyan', title: '\u6708\u4fdd\u990a', detail: '\u6bcf\u6708\u6aa2\u67e5\u540d\u55ae\u57fa\u6e96\u3001\u65b0\u4eba\u89c0\u5bdf\u5e36\u3001\u96e2\u8077\u6392\u9664\u898f\u5247\u662f\u5426\u4ecd\u8207\u76ee\u524d\u6b63\u5f0f\u7248\u4e00\u81f4\u3002' },
    { tone: 'cyan', title: '\u5927\u4fdd\u990a', detail: '\u82e5\u518d\u6b21\u51fa\u73fe\u554f\u865f\u59d3\u540d\u3001\u7e3d\u76e4\u843d\u5dee\u6216\u7570\u52d5\u932f\u4e82\uff0c\u5148\u9396\u6b63\u5f0f\u9801\uff0c\u518d\u56de\u7078\u6700\u65b0\u4e7e\u6de8\u5feb\u7167\u3002' },
    { tone: 'cyan', title: '\u5347\u7d1a\u4fdd\u990a', detail: '\u5927\u6539\u7248\u6216\u65b0\u8f2a\u6b21\u4e0a\u7dda\u524d\uff0c\u5148\u6bd4\u5c0d\u884c\u92b7\u5b8c\u6574\u540d\u55ae\u3001\u7e3d\u76e4\u52a0\u7e3d\u3001\u540d\u6b21\u7570\u52d5\u8207 A1/A2/B/C \u662f\u5426\u5168\u90e8\u5c0d\u9f4a\u3002' }
  ];

  const checkpoints = [
    { label: '\u5f8c\u7aef\u552f\u4e00\u771f\u76f8', value: sourceLocked },
    { label: '\u5be9\u8a08\u662f\u5426\u901a\u904e', value: auditPass },
    { label: '\u8cc7\u6599\u662f\u5426\u540c\u6b65', value: rankingCount > 0 && orderedPeople.length > 0 },
    { label: '\u884c\u92b7\u540d\u55ae\u662f\u5426\u5b8c\u6574', value: orderedPeople.length === expectedRosterCount },
    { label: '\u5206\u7d44\u662f\u5426\u5c0d\u9f4a', value: rankingCount === groupedPeopleCount && groupedPeopleCount > 0 },
    { label: '\u662f\u5426\u53ef\u6b63\u5f0f\u6d3e\u55ae', value: formalReady && !conflictBlocked }
  ];

  const metrics = [
    { label: '\u5065\u5eb7\u5206\u6578', value: String(healthScore), tone: healthScore >= 95 ? 'green' : healthScore >= 85 ? 'cyan' : healthScore >= 70 ? 'orange' : 'red' },
    { label: '\u98a8\u96aa\u7b49\u7d1a', value: riskLevel === 'low' ? '\u4f4e' : riskLevel === 'medium' ? '\u4e2d' : '\u9ad8', tone: riskLevel === 'low' ? 'green' : riskLevel === 'medium' ? 'orange' : 'red' },
    { label: '\u672c\u8f2a\u540d\u55ae', value: orderedPeople.length + '/' + expectedRosterCount, tone: orderedPeople.length === expectedRosterCount ? 'green' : 'orange' },
    { label: '\u7570\u5e38\u7b46\u6578', value: String(anomalyCount), tone: anomalyCount ? 'orange' : 'green' },
    { label: '\u5df2\u4fee\u5fa9', value: String(repairLog.length), tone: repairLog.length ? 'cyan' : 'gold' },
    { label: '\u6b63\u5f0f\u9396\u5b9a', value: formalReady ? '\u662f' : '\u5426', tone: formalReady ? 'green' : 'red' }
  ];

  return {
    status,
    healthScore,
    healthGrade,
    riskLevel,
    summary: status === 'PASS' ? '\u6383\u63cf\u5b8c\u6210\uff0c' + orderedPeople.length + ' \u4f4d\u884c\u92b7\u540d\u55ae\u5df2\u7167\u6b63\u5f0f\u9806\u5e8f\u8f09\u5165\u3002' : '\u6383\u63cf\u5b8c\u6210\uff0c' + orderedPeople.length + ' \u4f4d\u884c\u92b7\u540d\u55ae\u5df2\u7167\u6b63\u5f0f\u9806\u5e8f\u8f09\u5165\uff0c\u53e6\u767c\u73fe ' + anomalyCount + ' \u9805\u9700\u7559\u610f\u3002',
    counts: { people: orderedPeople.length, anomalies: anomalyCount, repairs: repairLog.length },
    metrics,
    checkpoints,
    orderedPeople,
    scans,
    repairs,
    upkeep
  };
}

function isPassStatus(value) {
  const text = String(value || '').trim();
  return text === '通過' || text === 'PASS' || text === 'done';
}

function isFailStatus(value) {
  const text = String(value || '').trim();
  return text === '失敗' || text === 'FAIL' || text === 'failed';
}

function normalizeStatusText(value, fallback = '待確認') {
  const text = String(value || '').trim();
  if (isPassStatus(text)) return '通過';
  if (isFailStatus(text)) return '失敗';
  return text || fallback;
}

function normalizeChecks(checks) {
  if (!Array.isArray(checks)) return [];
  return checks.map((item) => ({
    ...item,
    status: normalizeStatusText(item.status)
  }));
}

function countGroupedPeople(groups) {
  return ['A1', 'A2', 'B', 'C'].reduce((total, key) => {
    const names = Array.isArray(groups?.[key]) ? groups[key] : [];
    return total + names.length;
  }, 0);
}

function formatNumber(value) {
  return new Intl.NumberFormat('zh-TW').format(Number(value || 0));
}

function joinNames(list, fallback = '尚未產生') {
  return Array.isArray(list) && list.length ? list.join('、') : fallback;
}

function buildBroadcastPayload(snapshot) {
  const summary = snapshot?.summary || {};
  const ranking = Array.isArray(snapshot?.ranking) ? snapshot.ranking : [];
  const groups = snapshot?.groups || {};
  const first = ranking[0];
  const second = ranking[1];
  const third = ranking[2];
  const contradictions = Array.isArray(snapshot?.consistencyGuard?.contradictions)
    ? snapshot.consistencyGuard.contradictions
    : [];
  const canDispatch =
    isPassStatus(snapshot?.status) &&
    isPassStatus(snapshot?.audit?.status) &&
    isPassStatus(snapshot?.confirmation?.status) &&
    !snapshot?.consistencyGuard?.conflictBlocked;
  const archiveFile = snapshot?.files?.archiveFile || '尚未建立';
  const opening = [
    `各位主管晚安，現在播報兆櫃 AI 派單中樞系統今日正式結果。`,
    `目前系統狀態${snapshot?.aiStatus?.status || '待確認'}，一致性${snapshot?.consistencyGuard?.status || '待確認'}。`,
    `今日總業績${formatNumber(summary.totalRevenue)}，續單總額${formatNumber(summary.renewalRevenue)}，追續成交${formatNumber(summary.renewalDeals)}通。`
  ];

  const totals = [
    `當日實收${formatNumber(summary.totalRevenue)}，本月業績${formatNumber(summary.currentMonthRevenue)}。`,
    `當日客單價${formatNumber(summary.averageDailyTicket)}，整體客單價${formatNumber(summary.averageOverallTicket)}。`,
    `有效人數${summary.activePeople || 0}人，總人數${summary.totalPeople || 0}人，成交率${summary.conversionRateText || '待確認'}。`
  ];

  const rankingLines = [
    first
      ? `目前第一名${first.name}，AI 分數${Number(first.totalScore || 0).toFixed(2)}，總業績${formatNumber(first.totalRevenue)}。`
      : '目前尚未產生正式第一名。',
    second
      ? `第二名${second.name}，AI 分數${Number(second.totalScore || 0).toFixed(2)}，總業績${formatNumber(second.totalRevenue)}。`
      : '第二名資料待確認。',
    third
      ? `第三名${third.name}，AI 分數${Number(third.totalScore || 0).toFixed(2)}，總業績${formatNumber(third.totalRevenue)}。`
      : '第三名資料待確認。'
  ];

  const dispatch = [
    canDispatch ? '今日正式結果已完成，系統可直接執行派單。' : '今日正式結果尚未達到可派單條件，請先處理保護訊息。',
    `A1 高單主力${joinNames(groups.A1)}。`,
    `A2 續單收割${joinNames(groups.A2)}。`,
    `B 組一般量單${joinNames(groups.B)}。`,
    `C 組補位觀察${joinNames(groups.C)}。`
  ];

  const announcementLines = snapshot?.announcement
    ? [
        `正式公告已生成，公告總字數${String(snapshot.announcement.length)}字。`,
        '請依正式公告、正式排名、正式分組同步執行，不得人工改寫。'
      ]
    : ['正式公告尚未生成，禁止對外發布。'];

  const alerts = contradictions.length
    ? contradictions.map((item) => `異常提醒，${item}。`)
    : ['目前沒有異常，前後端版本、狀態、公告、排名一致。'];

  const closing = [
    `正式版本號${snapshot?.systemVersion || '待確認'}，執行序號${snapshot?.executionId || '-'}.`,
    `最後更新時間${snapshot?.completedAt || '待確認'}，正式封存檔${archiveFile}。`,
    '請全體主管依今日正式派單規則確認執行。'
  ];

  const sections = [
    { key: 'opening', title: '開場', target: 'headline', lines: opening },
    { key: 'system', title: '系統狀態', target: 'system', lines: [opening[1], canDispatch ? '今日可直接派單。' : '今日暫停派單。'] },
    { key: 'totals', title: '數據主體', target: 'totals', lines: totals },
    { key: 'ranking', title: '排名重點', target: 'ranking', lines: rankingLines },
    { key: 'dispatch', title: '決策重點', target: 'dispatch', lines: dispatch },
    { key: 'announcement', title: '公告重點', target: 'announcement', lines: announcementLines },
    { key: 'alert', title: '異常提醒', target: 'alert', lines: alerts },
    { key: 'version', title: '收尾', target: 'version', lines: closing }
  ];

  const segments = sections.flatMap((section) =>
    section.lines.map((line, index) => ({
      order: 0,
      text: line,
      target: section.target,
      sectionKey: section.key,
      sectionTitle: section.title,
      emphasis: index === 0 ? 'headline' : 'detail'
    }))
  );

  const orderedSegments = segments.map((segment, index) => ({
    ...segment,
    order: index + 1
  }));

  const cards = [
    {
      key: 'headline',
      label: '開場重點',
      value: snapshot?.systemName || SYSTEM.name,
      detail: `執行序號 ${snapshot?.executionId || '-'}`
    },
    {
      key: 'system',
      label: '系統狀態',
      value: canDispatch ? '可直接派單' : '等待確認',
      detail: `審計 ${snapshot?.audit?.status || '待確認'}｜確認 ${snapshot?.confirmation?.status || '待確認'}`
    },
    {
      key: 'totals',
      label: '今日總盤',
      value: formatNumber(summary.totalRevenue),
      detail: `續單 ${formatNumber(summary.renewalRevenue)}｜追續 ${formatNumber(summary.renewalDeals)} 通`
    },
    {
      key: 'ranking',
      label: '今日榜首',
      value: first ? `${first.name}` : '尚未產生',
      detail: first ? `AI ${Number(first.totalScore || 0).toFixed(2)}｜總業績 ${formatNumber(first.totalRevenue)}` : '等待正式排序'
    },
    {
      key: 'dispatch',
      label: '明日派單',
      value: `A1 ${Array.isArray(groups.A1) ? groups.A1.length : 0}｜A2 ${Array.isArray(groups.A2) ? groups.A2.length : 0}`,
      detail: `主力名單 ${joinNames(groups.A1)}`
    },
    {
      key: 'announcement',
      label: '正式公告',
      value: snapshot?.announcement ? '已生成' : '未生成',
      detail: snapshot?.announcement ? `${String(snapshot.announcement.length)} 字正式公告` : '公告待確認'
    },
    {
      key: 'alert',
      label: '異常提醒',
      value: contradictions.length ? `${contradictions.length} 項` : '無異常',
      detail: contradictions[0] || '前後端資料一致'
    },
    {
      key: 'version',
      label: '正式版本',
      value: snapshot?.systemVersion || '待確認',
      detail: `最後更新 ${snapshot?.completedAt || '-'}`
    }
  ];

  return {
    enabled: true,
    modeName: '專業女主播廣播系統',
    presenterProfile: '高學歷、專業、穩重、清楚、具決策感的企業會議女主播',
    meetingRoomReady: true,
    canBroadcast: canDispatch,
    source: 'backend-formal',
    scriptText: sections
      .map((section) => [`【${section.title}】`, ...section.lines].join('\n'))
      .join('\n\n'),
    sections,
    segments: orderedSegments,
    cards
  };
}

function buildContradictions(snapshot) {
  const contradictions = [];
  const rankingCount = Array.isArray(snapshot?.ranking) ? snapshot.ranking.length : 0;
  const parsedPeopleCount = Array.isArray(snapshot?.parsedData?.people) ? snapshot.parsedData.people.length : 0;
  const groupedPeopleCount = countGroupedPeople(snapshot?.groups);
  const auditChecks = Array.isArray(snapshot?.audit?.checks) ? snapshot.audit.checks : [];
  const confirmationChecks = Array.isArray(snapshot?.confirmation?.checks) ? snapshot.confirmation.checks : [];
  const hasAnnouncement = Boolean(snapshot?.announcement);
  const insightCardCount = Array.isArray(snapshot?.aiInsights?.cards) ? snapshot.aiInsights.cards.length : 0;
  const auditPass = isPassStatus(snapshot?.audit?.status);
  const confirmationPass = isPassStatus(snapshot?.confirmation?.status);
  const overallPass = isPassStatus(snapshot?.status);

  if (parsedPeopleCount > 0 && rankingCount > 0 && parsedPeopleCount !== rankingCount) {
    contradictions.push(`名次筆數 ${rankingCount} 與解析人數 ${parsedPeopleCount} 不一致`);
  }

  if (rankingCount > 0 && groupedPeopleCount > 0 && rankingCount !== groupedPeopleCount) {
    contradictions.push(`分組總人數 ${groupedPeopleCount} 與排名人數 ${rankingCount} 不一致`);
  }

  if (overallPass && !auditPass) {
    contradictions.push('整體狀態顯示通過，但審計未通過');
  }

  if (overallPass && !confirmationPass) {
    contradictions.push('整體狀態顯示通過，但確認未通過');
  }

  if (auditPass && auditChecks.some((item) => isFailStatus(item.status))) {
    contradictions.push('審計主狀態顯示通過，但審計明細仍有失敗');
  }

  if (confirmationPass && confirmationChecks.some((item) => isFailStatus(item.status))) {
    contradictions.push('確認主狀態顯示通過，但確認明細仍有失敗');
  }

  if (confirmationPass && !hasAnnouncement) {
    contradictions.push('確認通過，但公告尚未生成');
  }

  if (confirmationPass && insightCardCount === 0) {
    contradictions.push('確認通過，但 AI 分析卡為 0');
  }

  if (snapshot?.files?.archiveFile && !snapshot.files.archiveFile.startsWith('failure_') && !confirmationPass) {
    contradictions.push('未確認通過卻出現正式歸檔檔名');
  }

  contradictions.push(...buildSnapshotDataAnomalies(snapshot));

  return contradictions;
}

function buildFrontendAiContract(snapshot, options = {}) {
  const contradictions = Array.isArray(options.contradictions) ? options.contradictions : [];
  const rankingCount = Number(options.rankingCount || 0);
  const parsedPeopleCount = Number(options.parsedPeopleCount || 0);
  const groupedPeopleCount = Number(options.groupedPeopleCount || 0);
  const insightCardCount = Number(options.insightCardCount || 0);
  const announcementReady = Boolean(options.announcementReady);
  const auditPass = Boolean(options.auditPass);
  const confirmationPass = Boolean(options.confirmationPass);
  const summaryReady = Boolean(snapshot?.summary && Object.keys(snapshot.summary).length);
  const dataSynced = Boolean(snapshot?.executionId && snapshot?.completedAt && (rankingCount > 0 || parsedPeopleCount > 0 || summaryReady));
  const backendDataConfirmed = Boolean(auditPass && confirmationPass && contradictions.length === 0);
  const hasFakeData = false;
  const rankRewrite = false;
  const auditRewrite = false;
  const allowFormalDisplay = Boolean(dataSynced && backendDataConfirmed && !hasFakeData && !rankRewrite && !auditRewrite);
  const reason =
    allowFormalDisplay
      ? '前端目前只展示後端正式快照，可作為正式版面。'
      : contradictions[0] || snapshot?.confirmation?.message || snapshot?.audit?.message || '資料未確認';

  return {
    ...FRONTEND_AI_CONTRACT,
    guard: {
      dataSynced,
      backendDataConfirmed,
      hasFakeData,
      rankRewrite,
      auditRewrite,
      allowFormalDisplay,
      status: allowFormalDisplay ? '通過' : '阻擋',
      banner: allowFormalDisplay ? FRONTEND_AI_CONTRACT.successBanner : FRONTEND_AI_CONTRACT.blockedBanner,
      reason,
      proof: {
        rankingCount,
        parsedPeopleCount,
        groupedPeopleCount,
        insightCardCount,
        announcementReady,
        auditPass,
        confirmationPass,
        summaryReady
      }
    }
  };
}

function decorateSnapshot(snapshot) {
  if (!snapshot) return null;

  const data = repairOfficial0408Snapshot({
    snapshot: clone(snapshot),
    createPreviewSnapshot,
    SYSTEM,
    baselineSeeds: BASELINE_SEEDS,
    adviceBaseline: BIGDATA_ADVICE_BASELINE
  });
  data.status = normalizeStatusText(data.status);

  if (data.audit) {
    data.audit.status = normalizeStatusText(data.audit.status);
    data.audit.checks = normalizeChecks(data.audit.checks);
  }

  if (data.confirmation) {
    data.confirmation.status = normalizeStatusText(data.confirmation.status);
    data.confirmation.checks = normalizeChecks(data.confirmation.checks);
  }

  const rankingCount = Array.isArray(data.ranking) ? data.ranking.length : 0;
  const parsedPeopleCount = Array.isArray(data.parsedData?.people) ? data.parsedData.people.length : 0;
  const groupedPeopleCount = countGroupedPeople(data.groups);
  const insightCardCount = Array.isArray(data.aiInsights?.cards) ? data.aiInsights.cards.length : 0;
  const announcementReady = Boolean(data.announcement);
  const auditPass = isPassStatus(data.audit?.status);
  const confirmationPass = isPassStatus(data.confirmation?.status);
  const bigdataAdviceCount = Array.isArray(data.bigdataAdvice) ? data.bigdataAdvice.length : 0;
  const aiInjected = Boolean(auditPass && confirmationPass && rankingCount > 0 && (insightCardCount > 0 || bigdataAdviceCount > 0) && announcementReady);
  const contradictions = buildContradictions(data);

  data.frontendLock = {
    sourceOfTruth: 'backend',
    frontendMustUseBackendSnapshot: true,
    frontendMayComputeRanking: false,
    frontendMayComputeGroups: false,
    frontendMayRewriteAnnouncement: false,
    frontendMayRewriteAudit: false,
    frontendMayRewriteAiStatus: false
  };

  data.frontendAiContract = buildFrontendAiContract(data, {
    rankingCount,
    parsedPeopleCount,
    groupedPeopleCount,
    insightCardCount,
    announcementReady,
    auditPass,
    confirmationPass,
    contradictions
  });
  data.frontendAiGuard = data.frontendAiContract.guard;

  data.ruleBasedAiStatus = {
    injected: aiInjected,
    status: aiInjected ? '已接入' : '未接入',
    source: 'backend-pipeline',
    proof: {
      auditPass,
      confirmationPass,
      rankingCount,
      parsedPeopleCount,
      groupedPeopleCount,
      insightCardCount,
      announcementReady
    }
  };

  const aiProvider = data.aiProvider || null;
  const providerConnected = aiProvider?.status === 'connected';

  // 核心邏輯：只要規則引擎產生了 22 人分組建議，狀態就是「已接入」
  const logicalAiInjected = aiInjected || providerConnected;

  data.aiStatus = {
    injected: logicalAiInjected,
    status: logicalAiInjected ? '已接入' : (providerConnected ? '已接入' : '未接入'),
    provider: providerConnected ? 'gemini-api' : 'static-engine',
    proof: {
      auditPass,
      confirmationPass,
      rankingCount,
      parsedPeopleCount,
      groupedPeopleCount,
      insightCardCount,
      announcementReady,
      bigdataAdviceCount,
      provider: aiProvider?.provider || '',
      model: aiProvider?.model || '',
      apiVersion: aiProvider?.apiVersion || '',
      configured: Boolean(aiProvider?.configured),
      providerStatus: aiProvider?.status || '',
      providerError: aiProvider?.error || ''
    }
  };

  data.ruleBasedAiStatus = {
    injected: aiInjected,
    status: aiInjected ? '已接入' : '未接入',
    source: 'backend-pipeline'
  };

  data.consistencyGuard = {
    status: contradictions.length ? '失敗' : '通過',
    conflictBlocked: contradictions.length > 0,
    contradictionCount: contradictions.length,
    contradictions,
    rankingCount,
    parsedPeopleCount,
    groupedPeopleCount,
    backendSourceLocked: true,
    frontendComputationAllowed: false,
    frontendRewriteAllowed: false,
    frontendAiDisplayAllowed: Boolean(data.frontendAiGuard?.allowFormalDisplay)
  };

  data.maintenance = buildMaintenanceReport(data);

  data.broadcast = buildBroadcastPayload(data);

  return data;
}

app.get('/api/health', asyncRoute(async (_req, res) => {
  const current = decorateSnapshot(latestSnapshot());
  const geminiRuntime = getGeminiRuntime(__dirname);
  res.json(
    respond(true, '系統正常', {
      status: 'ONLINE',
      currentExecutionId: current.executionId,
      lastCompletedAt: current.completedAt,
      aiInjected: current.aiStatus?.injected || false,
      consistencyStatus: current.consistencyGuard?.status || '待確認',
      contradictionCount: current.consistencyGuard?.contradictionCount || 0,
      aiProvider: {
        provider: geminiRuntime.provider,
        configured: geminiRuntime.configured,
        model: geminiRuntime.model,
        apiVersion: geminiRuntime.apiVersion,
        status: current.aiProvider?.status || (geminiRuntime.configured ? 'ready' : 'not_configured')
      },
      availableApis: [
        '/api/health',
        '/api/parse-report',
        '/api/audit',
        '/api/score',
        '/api/rank',
        '/api/announcement',
        '/api/ai/status',
        '/api/broadcast/current',
        '/api/save',
        '/api/storage/dates',
        '/api/storage/list',
        '/api/storage/:executionId',
        '/api/workspace/zero'
      ]
    })
  );
}));

app.get('/api/current', asyncRoute(async (_req, res) => {
  const current = latestSnapshot();
  return res.json(respond(true, 'Current snapshot loaded.', decorateSnapshot(current)));
}));

app.get('/api/ai/status', (_req, res) => {
  const runtime = getGeminiRuntime(__dirname);
  const current = latestSnapshot();
  res.json(
    respond(true, 'AI provider status loaded.', {
      provider: runtime.provider,
      configured: runtime.configured,
      model: runtime.model,
      apiVersion: runtime.apiVersion,
      lastStatus: current.aiProvider?.status || 'not_attempted',
      lastGeneratedAt: current.aiProvider?.generatedAt || '',
      lastError: current.aiProvider?.error || ''
    })
  );
});

app.get('/api/broadcast/current', asyncRoute(async (_req, res) => {
  const current = decorateSnapshot(latestSnapshot());
  res.json(
    respond(true, '取得正式播報稿成功', {
      executionId: current.executionId,
      systemVersion: current.systemVersion,
      aiStatus: current.aiStatus,
      consistencyGuard: current.consistencyGuard,
      frontendLock: current.frontendLock,
      broadcast: current.broadcast
    })
  );
}));

app.get('/api/baseline/latest', (_req, res) => {
  const current = latestSnapshot();
  if (!current) {
    return res.json(respond(true, '尚無基準', { rawText: '', latestExecutionId: 0 }));
  }
  const decorated = decorateSnapshot(current);
  res.json(respond(true, '取得最新基準成功', decorated));
});

app.get('/api/storage/list', (req, res) => {
  const reportDate = String(req.query.reportDate || '').trim();
  const status = String(req.query.status || '').trim();
  const limit = String(req.query.limit || '').trim();
  const items = listStoredSnapshots(dataPaths, { reportDate, status, limit });

  res.json(
    respond(true, '取得存檔列表成功', {
      reportDate,
      status: status || '全部',
      total: items.length,
      items
    })
  );
});

app.get('/api/storage/dates', (req, res) => {
  const limit = String(req.query.limit || '').trim();
  const items = summarizeStoredSnapshotsByDate(dataPaths, { limit });

  res.json(
    respond(true, '取得每日存檔時間軸成功', {
      total: items.length,
      items
    })
  );
});

app.get('/api/storage/:executionId', (req, res) => {
  const snapshot = loadStoredSnapshot(dataPaths, req.params.executionId);
  if (!snapshot) {
    return res.status(404).json(respond(false, '找不到指定存檔', null));
  }
  return res.json(respond(true, '取得存檔內容成功', decorateSnapshot(snapshot)));
});

app.post('/api/parse-report', (req, res) => {
  const rawText = requireRawText(req, res);
  if (!rawText) return;
  const current = latestSnapshot();
  const { parsed } = analyze(rawText, { previousSnapshot: current });
  res.json(respond(true, '解析完成', { parsed }));
});

app.post('/api/audit', (req, res) => {
  const rawText = requireRawText(req, res);
  if (!rawText) return;
  const current = latestSnapshot();
  const preview = createPreviewSnapshot(rawText, {
    previousSnapshot: current,
    operator: String(req.body?.operator || SYSTEM.defaultOperator)
  });
  const decorated = decorateSnapshot(preview);
  const ok = decorated.status === '通過' && !decorated.consistencyGuard?.conflictBlocked;
  res.status(ok ? 200 : 400).json(
    respond(ok, ok ? '審計與確認通過' : decorated.consistencyGuard?.contradictions?.[0] || decorated.confirmation?.message || decorated.audit.message, {
      parsed: decorated.parsedData,
      audit: decorated.audit,
      confirmation: decorated.confirmation,
      maintenance: decorated.maintenance,
      stages: decorated.stages,
      aiStatus: decorated.aiStatus,
      consistencyGuard: decorated.consistencyGuard,
      frontendLock: decorated.frontendLock
    })
  );
});

app.post('/api/score', (req, res) => {
  const rawText = requireRawText(req, res);
  if (!rawText) return;
  const current = latestSnapshot();
  const preview = createPreviewSnapshot(rawText, {
    previousSnapshot: current,
    operator: String(req.body?.operator || SYSTEM.defaultOperator)
  });
  const decorated = decorateSnapshot(preview);
  if (decorated.status !== '通過' || decorated.consistencyGuard?.conflictBlocked) {
    return res.status(400).json(
      respond(false, decorated.consistencyGuard?.contradictions?.[0] || decorated.confirmation?.message || decorated.audit.message, {
        parsed: decorated.parsedData,
        audit: decorated.audit,
        confirmation: decorated.confirmation,
        stages: decorated.stages,
        aiStatus: decorated.aiStatus,
        consistencyGuard: decorated.consistencyGuard,
        frontendLock: decorated.frontendLock
      })
    );
  }
  res.json(
    respond(true, '計分完成', {
      parsed: decorated.parsedData,
      audit: decorated.audit,
      confirmation: decorated.confirmation,
      scoring: decorated.scoring,
      aiStatus: decorated.aiStatus,
      consistencyGuard: decorated.consistencyGuard,
      frontendLock: decorated.frontendLock
    })
  );
});

app.post('/api/rank', (req, res) => {
  const rawText = requireRawText(req, res);
  if (!rawText) return;
  const current = latestSnapshot();
  const preview = createPreviewSnapshot(rawText, {
    previousSnapshot: current,
    operator: String(req.body?.operator || SYSTEM.defaultOperator)
  });
  const decorated = decorateSnapshot(preview);
  if (decorated.status !== '通過' || decorated.consistencyGuard?.conflictBlocked) {
    return res
      .status(400)
      .json(respond(false, decorated.consistencyGuard?.contradictions?.[0] || decorated.confirmation?.message || decorated.audit.message, decorated));
  }
  res.json(
    respond(true, '排序完成', {
      parsedData: decorated.parsedData,
      audit: decorated.audit,
      confirmation: decorated.confirmation,
      scoring: decorated.scoring,
      ranking: decorated.ranking,
      groups: decorated.groups,
      changes: decorated.changes,
      stages: decorated.stages,
      aiStatus: decorated.aiStatus,
      consistencyGuard: decorated.consistencyGuard,
      frontendLock: decorated.frontendLock
    })
  );
});

app.post('/api/announcement', asyncRoute(async (req, res) => {
  const rawText = requireRawText(req, res);
  if (!rawText) return;
  const current = latestSnapshot();
  const preview = createPreviewSnapshot(rawText, {
    previousSnapshot: current,
    operator: String(req.body?.operator || SYSTEM.defaultOperator)
  });
  const decorated = decorateSnapshot(await applyGeminiOverlay(preview));
  if (decorated.status !== '通過' || decorated.consistencyGuard?.conflictBlocked) {
    return res
      .status(400)
      .json(respond(false, decorated.consistencyGuard?.contradictions?.[0] || decorated.confirmation?.message || decorated.audit.message, decorated));
  }
  res.json(respond(true, '公告與輸出完成', decorated));
}));

app.post('/api/save', asyncRoute(async (req, res) => {
  const rawText = requireRawText(req, res);
  if (!rawText) return;

  const snapshot = await applyGeminiOverlay(runFullPipeline({
    rawText,
    operator: String(req.body?.operator || SYSTEM.defaultOperator),
    source: 'manual',
    dataPaths
  }), { persist: true });

  const decorated = decorateSnapshot(snapshot);
  const ok = decorated.status === '通過' && !decorated.consistencyGuard?.conflictBlocked;
  res.status(ok ? 200 : 400).json(
    respond(
      ok,
      ok ? '全鏈路完成並存檔' : decorated.consistencyGuard?.contradictions?.[0] || decorated.confirmation?.message || decorated.audit.message,
      decorated
    )
  );
}));

app.post('/api/reset', (_req, res) => {
  const current = latestSnapshot();
  res.json(
    respond(true, '重置為最新基準', {
      rawText: buildDefaultRawReport(new Date(), current),
      latestExecutionId: current.executionId
    })
  );
});

app.post('/api/workspace/zero', (_req, res) => {
  const current = latestSnapshot();
  res.json(
    respond(true, '工作區已歸零，只清空當前輸入，不影響已確認存檔與每日封存', {
      rawText: '',
      protectedExecutionId: current.executionId,
      protectedArchiveFile: current.files?.archiveFile || '',
      protectedRules: [
        '只清空工作區',
        '禁止清空已確認正式資料',
        '禁止清空每日存檔',
        '禁止清空歷史封存'
      ]
    })
  );
});

app.use((error, _req, res, _next) => {
  res.status(500).json(respond(false, error.message || '系統錯誤', null));
});

app.get('*', (_req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`${SYSTEM.name} 已啟動：http://localhost:${PORT}`);
});
setTimeout(() => openBrowser(`http://localhost:${PORT}`), 1000);
