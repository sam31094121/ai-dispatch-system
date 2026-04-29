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
  if (filePath.endsWith('.html')) {
    res.setHeader('Cache-Control', 'no-cache');
    return;
  }

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
  app.use(express.static(appConfig.publicDir, {
    etag: true,
    maxAge: 0,
    setHeaders: setStaticCacheHeaders
  }));

  app.use('/api', healthRoutes);
  app.use('/api', legacyRoutes);
  app.use('/api', dispatchReportRoutes);
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

    res.sendFile(path.join(appConfig.publicDir, 'index.html'));
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
