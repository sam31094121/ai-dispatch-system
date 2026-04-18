const path = require('path');
const express = require('express');
const cors = require('cors');
const compression = require('compression');
const helmet = require('helmet');
const healthRoutes = require('./routes/health.routes');
const dispatchReportRoutes = require('./routes/dispatchReport.routes');
const legacyRoutes = require('./routes/legacy.routes');
const { errorResponse } = require('./utils/response.util');
const errorCodes = require('./constants/errorCodes');

function createApp() {
  const app = express();
  const publicDir = path.join(__dirname, '..', 'public');

  app.disable('x-powered-by');
  app.use(helmet({
    contentSecurityPolicy: false, // Disable CSP for now to ensure Google Fonts and external links work without extensive configuration
    crossOriginEmbedderPolicy: false
  }));
  app.use(compression());
  app.use(cors());
  app.use(express.json({ limit: '10mb' }));
  app.use(express.static(publicDir, {
    etag: true,
    maxAge: '1y',
    setHeaders(res, filePath) {
      if (filePath.endsWith('.html')) {
        res.setHeader('Cache-Control', 'no-cache');
        return;
      }

      if (/\.(css|js|png|jpg|jpeg|gif|svg|webp|ico|woff2?)$/i.test(filePath)) {
        res.setHeader('Cache-Control', 'public, max-age=3600'); // Reduced to 1 hour, no immutable
      }
    }
  }));

  app.use('/api', healthRoutes);
  app.use('/api', legacyRoutes);
  app.use('/api', dispatchReportRoutes);

  app.use((error, _req, res, _next) => {
    res
      .status(error.status || 500)
      .json(errorResponse(error.code || errorCodes.INTERNAL_ERROR, error.message || '系統錯誤', error.errors));
  });

  app.get(['/mobile', '/mobile/:reportId', '/m', '/m/:reportId'], (_req, res) => {
    res.sendFile(path.join(publicDir, 'mobile.html'));
  });

  app.get('/broadcast', (_req, res) => {
    res.sendFile(path.join(publicDir, 'broadcast.html'));
  });

  app.get('*', (_req, res) => {
    res.sendFile(path.join(publicDir, 'index.html'));
  });

  return app;
}

module.exports = {
  createApp
};
