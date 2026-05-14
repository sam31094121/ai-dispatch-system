const path = require('path');
const express = require('express');
const cors = require('cors');
const compression = require('compression');
const helmet = require('helmet');
const { appConfig } = require('./config/appConfig');
const healthRoutes = require('./routes/health.routes');
const lineNotifyRoutes = require('./routes/lineNotify.routes');
const dispatchReportRoutes = require('./routes/dispatchReport.routes');
const legacyRoutes = require('./routes/legacy.routes');
const syncRoutes = require('./routes/sync.routes');
const versionRoutes = require('./routes/version.routes');
const sseService = require('./services/sse.service');
const masterCommander = require('./services/masterCommander.service');
const { errorResponse } = require('./utils/response.util');
const errorCodes = require('./constants/errorCodes');

const STATIC_ASSET_PATTERN = /\.(css|js|png|jpg|jpeg|gif|svg|webp|ico|woff2?)$/i;
const API_ROUTE_PATTERN = /^\/api(?:\/|$)/;

function isApiRequestPath(pathname) {
  return API_ROUTE_PATTERN.test(pathname);
}

function wantsHtmlDocument(req) {
  const accept = req.headers.accept || '';
  return req.method === 'GET' && accept.includes('text/html');
}

function setStaticCacheHeaders(res, filePath) {
  // HTML：no-cache（每次驗證，確保取得最新版本）
  if (filePath.endsWith('.html')) {
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Vary', 'Accept-Encoding');
    return;
  }
  // JS / CSS：有版本號 query → 長期快取 7 天（瀏覽器端）
  // Service Worker 會用 stale-while-revalidate 在背景更新
  if (filePath.endsWith('.js') || filePath.endsWith('.css')) {
    res.setHeader('Cache-Control', 'public, max-age=604800, stale-while-revalidate=86400');
    res.setHeader('Vary', 'Accept-Encoding');
    return;
  }
  // 其他靜態資源（圖片、字型）
  if (STATIC_ASSET_PATTERN.test(filePath)) {
    res.setHeader('Cache-Control', `public, max-age=${appConfig.staticAssetMaxAgeSeconds}`);
  }
}

function createApp() {
  const app = express();

  app.disable('x-powered-by');
  app.use(helmet({
    contentSecurityPolicy: false, // Disable CSP for now to ensure Google Fonts and external links work without extensive configuration
    crossOriginEmbedderPolicy: false
  }));
  app.use(compression());
  app.use(cors());
  app.use(express.json({ limit: appConfig.jsonBodyLimit }));
  app.use('/api', (_req, res, next) => {
    res.setHeader('Cache-Control', 'no-store');
    next();
  });
  app.use(express.static(appConfig.publicDir, {
    etag: true,
    maxAge: 0,
    setHeaders: setStaticCacheHeaders
  }));

  app.use('/api', healthRoutes);
  app.use('/api/line', lineNotifyRoutes);
  app.use('/api', legacyRoutes);
  app.use('/api', dispatchReportRoutes);
  app.use('/api/sync', syncRoutes);
  app.use('/api/version', versionRoutes);

  // SSE 即時推播路由
  app.get('/api/updates/stream', (req, res) => {
    const clientId = sseService.addClient(res);
    req.on('close', () => {
      sseService.removeClient(clientId);
    });
  });

  // 啟動資料監看器
  sseService.initDataWatcher(appConfig.storageRoot);

  // 啟動 Master Supreme Commander (永久鎖死版)
  masterCommander.start();

  app.use('/api', (_req, res) => {
    res
      .status(404)
      .json(errorResponse(errorCodes.NOT_FOUND, 'API route not found'));
  });

  app.get(['/mobile', '/mobile/:reportId', '/m', '/m/:reportId'], (_req, res) => {
    res.sendFile(path.join(appConfig.publicDir, 'mobile.html'));
  });

  app.get('/broadcast', (_req, res) => {
    res.sendFile(path.join(appConfig.publicDir, 'broadcast.html'));
  });

  app.get(/^(?!\/api(?:\/|$)).*/, (req, res, next) => {
    if (!wantsHtmlDocument(req)) {
      next();
      return;
    }

    // 已修改：統一前端預設為手機版
    res.sendFile(path.join(appConfig.publicDir, 'mobile.html'));
  });

  app.use((req, res, next) => {
    if (isApiRequestPath(req.path)) {
      next();
      return;
    }

    res.status(404).send('Not Found');
  });

  app.use((error, _req, res, next) => {
    if (res.headersSent) {
      next(error);
      return;
    }

    res
      .status(error.status || 500)
      .json(errorResponse(error.code || errorCodes.INTERNAL_ERROR, error.message || 'Internal server error', error.errors));
  });

  return app;
}

module.exports = {
  createApp
};
