const { normalizeDateInput } = require('../utils/date.util');

function validateParseRequestBody(body = {}) {
  const errors = [];

  if (typeof body.title !== 'string' || !body.title.trim()) {
    errors.push({ field: 'title', reason: '公告標題為必填' });
  }
  if (typeof body.sourceText !== 'string' || !body.sourceText.trim()) {
    errors.push({ field: 'sourceText', reason: '完整原始公告全文為必填' });
  }
  if (!normalizeDateInput(body.settlementDate)) {
    errors.push({ field: 'settlementDate', reason: '結算日格式錯誤或缺失' });
  }
  if (!normalizeDateInput(body.dispatchDate)) {
    errors.push({ field: 'dispatchDate', reason: '正式派單日格式錯誤或缺失' });
  }

  return errors;
}

function validateRebuildRequestBody(body = {}) {
  const errors = [];

  if (body.operator !== undefined && (typeof body.operator !== 'string' || !body.operator.trim())) {
    errors.push({ field: 'operator', reason: 'operator 格式錯誤' });
  }
  if (body.reason !== undefined && (typeof body.reason !== 'string' || !body.reason.trim())) {
    errors.push({ field: 'reason', reason: 'reason 格式錯誤' });
  }

  return errors;
}

module.exports = {
  validateParseRequestBody,
  validateRebuildRequestBody
};
