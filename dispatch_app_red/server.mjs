// server.mjs — 兆櫃ＡＩ派單中樞 ESM 入口
// 透過 createRequire 橋接 CommonJS dispatch-engine，保持完整功能
import express from 'express';
import cors    from 'cors';
import path    from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
import { createRequire } from 'module';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ── 載入 CommonJS 引擎（完整功能） ──
const engine = createRequire(pathToFileURL(__dirname + '/').href)('./shared/dispatch-engine');
const {
  SYSTEM,
  analyze,
  buildDefaultRawReport,
  createPreviewSnapshot,
  ensureDirs,
  ensureInitialized,
  loadLatestSnapshot,
  runFullPipeline,
  taipeiNow,
} = engine;

const app  = express();
const PORT = 3000;

const dataPaths = {
  dataDir:    path.join(__dirname, 'data'),
  reportDir:  path.join(__dirname, 'data', 'reports'),
  backupDir:  path.join(__dirname, 'data', 'backups'),
  archiveDir: path.join(__dirname, 'data', 'archive'),
  latestFile: path.join(__dirname, 'data', 'latest.json'),
  logFile:    path.join(__dirname, 'data', 'system-log.jsonl'),
};

ensureDirs(dataPaths);
ensureInitialized(dataPaths);

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.static(path.join(__dirname, 'public')));

// ── 統一回應格式（與 server.js 完全對齊） ──
function respond(success, message, data) {
  return {
    success,
    message,
    systemName:    SYSTEM.name,
    systemVersion: SYSTEM.version,
    serverTime:    taipeiNow(),
    data,
  };
}

function getRawText(req) {
  return String(req.body?.rawText || '').trim();
}

function requireRawText(req, res) {
  const rawText = getRawText(req);
  if (!rawText) {
    res.status(400).json(respond(false, '缺少業績日報文字', null));
    return null;
  }
  return rawText;
}

function latestSnapshot() {
  return loadLatestSnapshot(dataPaths) || ensureInitialized(dataPaths);
}

// ══════════════════════════════════════════════════════════
//  路由（與 server.js 完全一致）
// ══════════════════════════════════════════════════════════

app.get('/api/health', (_req, res) => {
  const current = latestSnapshot();
  res.json(respond(true, '系統正常', {
    status:           'ONLINE',
    currentExecutionId: current.executionId,
    lastCompletedAt:  current.completedAt,
    availableApis: [
      '/api/health', '/api/parse-report', '/api/audit',
      '/api/score',  '/api/rank',         '/api/announcement', '/api/save',
    ],
  }));
});

app.get('/api/current', (_req, res) => {
  res.json(respond(true, '取得目前資料成功', latestSnapshot()));
});

app.get('/api/baseline/latest', (_req, res) => {
  const current = latestSnapshot();
  res.json(respond(true, '取得最新基準成功', {
    rawText:            buildDefaultRawReport(new Date(), current),
    latestExecutionId:  current.executionId,
  }));
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
  const result  = analyze(rawText, { previousSnapshot: current });
  const ok      = result.audit.status === '通過';
  res.status(ok ? 200 : 400).json(
    respond(ok, ok ? '審計通過' : result.audit.message, { parsed: result.parsed, audit: result.audit })
  );
});

app.post('/api/score', (req, res) => {
  const rawText = requireRawText(req, res);
  if (!rawText) return;
  const current = latestSnapshot();
  const result  = analyze(rawText, { previousSnapshot: current });
  if (result.audit.status !== '通過') {
    return res.status(400).json(respond(false, result.audit.message, { parsed: result.parsed, audit: result.audit }));
  }
  res.json(respond(true, '計分完成', { parsed: result.parsed, audit: result.audit, scoring: result.scoring }));
});

app.post('/api/rank', (req, res) => {
  const rawText = requireRawText(req, res);
  if (!rawText) return;
  const current  = latestSnapshot();
  const preview  = createPreviewSnapshot(rawText, {
    previousSnapshot: current,
    operator: String(req.body?.operator || SYSTEM.defaultOperator),
  });
  if (preview.audit.status !== '通過') {
    return res.status(400).json(respond(false, preview.audit.message, preview));
  }
  res.json(respond(true, '排序完成', {
    parsedData: preview.parsedData,
    audit:      preview.audit,
    scoring:    preview.scoring,
    ranking:    preview.ranking,
    groups:     preview.groups,
    changes:    preview.changes,
    stages:     preview.stages,
  }));
});

app.post('/api/announcement', (req, res) => {
  const rawText = requireRawText(req, res);
  if (!rawText) return;
  const current  = latestSnapshot();
  const preview  = createPreviewSnapshot(rawText, {
    previousSnapshot: current,
    operator: String(req.body?.operator || SYSTEM.defaultOperator),
  });
  if (preview.audit.status !== '通過') {
    return res.status(400).json(respond(false, preview.audit.message, preview));
  }
  res.json(respond(true, '公告產生完成', preview));
});

app.post('/api/save', (req, res) => {
  const rawText = requireRawText(req, res);
  if (!rawText) return;
  const snapshot = runFullPipeline({
    rawText,
    operator: String(req.body?.operator || SYSTEM.defaultOperator),
    source:   'manual',
    dataPaths,
  });
  const ok = snapshot.audit.status === '通過';
  res.status(ok ? 200 : 400).json(
    respond(ok, ok ? '全鏈路完成並存檔' : snapshot.audit.message, snapshot)
  );
});

app.post('/api/reset', (_req, res) => {
  const current = latestSnapshot();
  res.json(respond(true, '已回到最新基準', {
    rawText:           buildDefaultRawReport(new Date(), current),
    latestExecutionId: current.executionId,
  }));
});

// 錯誤處理
app.use((error, _req, res, _next) => {
  res.status(500).json(respond(false, error.message || '系統錯誤', null));
});

// SPA fallback
app.get('*', (_req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`\n  ⚡ ${SYSTEM.name} [ESM]\n  🌐 http://localhost:${PORT}\n`);
});
