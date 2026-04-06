const express = require('express');
const cors = require('cors');
const path = require('path');

const {
  SYSTEM,
  analyze,
  buildDefaultRawReport,
  createPreviewSnapshot,
  ensureDirs,
  ensureInitialized,
  listStoredSnapshots,
  summarizeStoredSnapshotsByDate,
  loadStoredSnapshot,
  loadLatestSnapshot,
  runFullPipeline,
  taipeiNow
} = require('./shared/dispatch-engine');

const app = express();
const PORT = 3000;

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
app.use(express.static(path.join(__dirname, 'public')));

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

  if (snapshot?.files?.archiveFile && !confirmationPass) {
    contradictions.push('未確認通過卻出現正式歸檔檔名');
  }

  return contradictions;
}

function decorateSnapshot(snapshot) {
  if (!snapshot) return null;

  const data = clone(snapshot);
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
  const aiInjected = Boolean(auditPass && confirmationPass && rankingCount > 0 && insightCardCount > 0 && announcementReady);
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

  data.aiStatus = {
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
    frontendRewriteAllowed: false
  };

  data.broadcast = buildBroadcastPayload(data);

  return data;
}

app.get('/api/health', (_req, res) => {
  const current = decorateSnapshot(latestSnapshot());
  res.json(
    respond(true, '系統正常', {
      status: 'ONLINE',
      currentExecutionId: current.executionId,
      lastCompletedAt: current.completedAt,
      aiInjected: current.aiStatus?.injected || false,
      consistencyStatus: current.consistencyGuard?.status || '待確認',
      contradictionCount: current.consistencyGuard?.contradictionCount || 0,
      availableApis: [
        '/api/health',
        '/api/parse-report',
        '/api/audit',
        '/api/score',
        '/api/rank',
        '/api/announcement',
        '/api/broadcast/current',
        '/api/save',
        '/api/storage/dates',
        '/api/storage/list',
        '/api/storage/:executionId',
        '/api/workspace/zero'
      ]
    })
  );
});

app.get('/api/current', (_req, res) => {
  res.json(respond(true, '取得目前資料成功', decorateSnapshot(latestSnapshot())));
});

app.get('/api/broadcast/current', (_req, res) => {
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
});

app.get('/api/baseline/latest', (_req, res) => {
  const current = latestSnapshot();
  res.json(
    respond(true, '取得最新基準成功', {
      rawText: buildDefaultRawReport(new Date(), current),
      latestExecutionId: current.executionId
    })
  );
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

app.post('/api/announcement', (req, res) => {
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
  res.json(respond(true, '公告與輸出完成', decorated));
});

app.post('/api/save', (req, res) => {
  const rawText = requireRawText(req, res);
  if (!rawText) return;

  const snapshot = runFullPipeline({
    rawText,
    operator: String(req.body?.operator || SYSTEM.defaultOperator),
    source: 'manual',
    dataPaths
  });

  const decorated = decorateSnapshot(snapshot);
  const ok = decorated.status === '通過' && !decorated.consistencyGuard?.conflictBlocked;
  res.status(ok ? 200 : 400).json(
    respond(
      ok,
      ok ? '全鏈路完成並存檔' : decorated.consistencyGuard?.contradictions?.[0] || decorated.confirmation?.message || decorated.audit.message,
      decorated
    )
  );
});

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
