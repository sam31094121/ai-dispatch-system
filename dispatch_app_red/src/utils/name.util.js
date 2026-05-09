const { BANNED_NAME_PATTERNS } = require('../constants/dispatchRules');

const NEWCOMER_SUFFIX = '\uFF08\u65B0\u4EBA\uFF09';
const NEWCOMER_TAG_PATTERN = /(?:\uFF08\u65B0\u4EBA\uFF09|\(\u65B0\u4EBA\)|\u65B0\u4EBA)$/u;

function cleanText(value) {
  return String(value ?? '')
    .replace(/\u3000/g, ' ')
    .replace(/\r/g, '')
    .trim();
}

function toNumber(value) {
  const numeric = Number(String(value ?? '').replace(/[,，]/g, '').trim());
  return Number.isFinite(numeric) ? numeric : 0;
}

function normalizeName(value) {
  return cleanText(value).replace(/\s+/g, '');
}

function splitNameTags(value) {
  const source = normalizeName(value);
  const isNew = NEWCOMER_TAG_PATTERN.test(source);
  const name = source.replace(NEWCOMER_TAG_PATTERN, '');
  return {
    name: normalizeName(name),
    isNew
  };
}

function formatDisplayName(name, isNew = false) {
  const tagged = splitNameTags(name);
  const baseName = tagged.name;
  return baseName && (isNew || tagged.isNew) ? `${baseName}${NEWCOMER_SUFFIX}` : baseName;
}

function normalizeStringArray(value) {
  return Array.isArray(value) ? value.map((item) => cleanText(item)).filter(Boolean) : [];
}

function getBannedNameViolation(value) {
  const text = String(value ?? '');
  return BANNED_NAME_PATTERNS.find((rule) => rule.pattern.test(text)) || null;
}

function applyAutoFix(value) {
  return cleanText(value).replace(/\uff0c/g, ',').replace(/\uff1a/g, ':');
}

module.exports = {
  cleanText,
  getBannedNameViolation,
  applyAutoFix,
  formatDisplayName,
  normalizeName,
  normalizeStringArray,
  splitNameTags,
  toNumber
};
