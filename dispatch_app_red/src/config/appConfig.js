const path = require('path');

const PROJECT_ROOT = path.join(__dirname, '..', '..');

function readString(value, fallback = '') {
  if (typeof value !== 'string') return fallback;
  const trimmed = value.trim();
  return trimmed || fallback;
}

function readInteger(value, fallback, { allowZero = false } = {}) {
  if (value === undefined || value === null || value === '') return fallback;

  const parsed = Number.parseInt(String(value), 10);
  if (!Number.isFinite(parsed)) return fallback;
  if (allowZero ? parsed >= 0 : parsed > 0) return parsed;
  return fallback;
}

function readBooleanFlag(value) {
  if (value === undefined || value === null || value === '') return null;

  const normalized = String(value).trim().toLowerCase();
  if (['1', 'true', 'yes', 'on'].includes(normalized)) return true;
  if (['0', 'false', 'no', 'off'].includes(normalized)) return false;
  return null;
}

function isCiEnvironment() {
  return readBooleanFlag(process.env.CI) === true;
}

function shouldAutoOpenBrowser() {
  if (readBooleanFlag(process.env.AUTO_OPEN_BROWSER) === false) return false;
  if (readBooleanFlag(process.env.NO_BROWSER) === true) return false;
  if (isCiEnvironment()) return false;
  if (readString(process.env.NODE_ENV, 'development') === 'test') return false;
  return true;
}

function resolveStorageRoot() {
  const configuredRoot = readString(process.env.DISPATCH_REPORT_STORAGE_ROOT);
  if (configuredRoot) {
    return path.resolve(configuredRoot);
  }

  return path.join(PROJECT_ROOT, 'data', 'dispatch-reports-v1');
}

const appConfig = Object.freeze({
  environment: readString(process.env.NODE_ENV, 'development'),
  jsonBodyLimit: readString(process.env.API_BODY_LIMIT, '10mb'),
  port: readInteger(process.env.PORT, 3001, { allowZero: true }),
  projectRoot: PROJECT_ROOT,
  publicDir: path.join(PROJECT_ROOT, 'public'),
  staticAssetMaxAgeSeconds: readInteger(process.env.STATIC_ASSET_MAX_AGE_SECONDS, 3600),
  storageRoot: resolveStorageRoot()
});

module.exports = {
  appConfig,
  shouldAutoOpenBrowser
};
