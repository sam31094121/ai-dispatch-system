const { BANNED_NAME_PATTERNS } = require('../constants/dispatchRules');

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
  const isNew = /(?:（新人）|\(新人\)|新人)$/u.test(source);
  const name = source.replace(/(?:（新人）|\(新人\)|新人)$/u, '');
  return {
    name: normalizeName(name),
    isNew
  };
}

function normalizeStringArray(value) {
  return Array.isArray(value) ? value.map((item) => cleanText(item)).filter(Boolean) : [];
}

function getBannedNameViolation(value) {
  const text = String(value ?? '');
  return BANNED_NAME_PATTERNS.find((rule) => rule.pattern.test(text)) || null;
}

function applyAutoFix(value) {
  let text = cleanText(value);
  if (!text) return '';

  // 基於 BANNED_NAME_PATTERNS 的自動修正
  // 例如：將所有符合 /徐華(?!妤)/ 的字串替換為「徐華妤」
  text = text.replace(/徐華(?!妤)/gu, '徐華妤');

  // 其他常見格式清理（全形空格轉半形、移除不可見字元）
  text = text.replace(/\uff0c/g, ',').replace(/\uff1a/g, ':');
  
  return text;
}

module.exports = {
  cleanText,
  getBannedNameViolation,
  applyAutoFix,
  normalizeName,
  normalizeStringArray,
  splitNameTags,
  toNumber
};
