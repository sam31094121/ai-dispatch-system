const path = require('path');
const express = require('express');
const cors = require('cors');
const healthRoutes = require('./routes/health.routes');
const dispatchReportRoutes = require('./routes/dispatchReport.routes');
const { errorResponse } = require('./utils/response.util');
const errorCodes = require('./constants/errorCodes');

function createApp() {
  const app = express();

  app.disable('x-powered-by');
  app.use(cors());
  app.use(express.json({ limit: '10mb' }));
  app.use(express.static(path.join(__dirname, '..', 'public'), {
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

  app.use('/api', healthRoutes);
  app.use('/api', dispatchReportRoutes);

  app.use((error, _req, res, _next) => {
    res
      .status(error.status || 500)
      .json(errorResponse(error.code || errorCodes.INTERNAL_ERROR, error.message || '系統錯誤', error.errors));
  });

  app.get('*', (_req, res) => {
    res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
  });

  return app;
}

module.exports = {
  createApp
};
