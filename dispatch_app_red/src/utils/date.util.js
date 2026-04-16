const { TIMEZONE } = require('../constants/dispatchRules');

const taipeiFormatter = new Intl.DateTimeFormat('en-CA', {
  timeZone: TIMEZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hour12: false
});

function getTaipeiParts(date = new Date()) {
  const parts = {};
  taipeiFormatter.formatToParts(date).forEach(({ type, value }) => {
    if (type !== 'literal') parts[type] = value;
  });
  return parts;
}

function formatTaipeiTimestamp(date = new Date()) {
  const parts = getTaipeiParts(date);
  return `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}:${parts.second}+08:00`;
}

function formatTaipeiDate(date = new Date()) {
  const parts = getTaipeiParts(date);
  return `${parts.year}-${parts.month}-${parts.day}`;
}

function pad2(value) {
  return String(value).padStart(2, '0');
}

function currentTaipeiYear() {
  return Number(getTaipeiParts().year);
}

function normalizeDateInput(value, referenceYear = currentTaipeiYear()) {
  const text = String(value ?? '')
    .trim()
    .replace(/\./g, '/')
    .replace(/年/g, '/')
    .replace(/月/g, '/')
    .replace(/日/g, '')
    .replace(/\s+/g, '');

  if (!text) return '';

  let match = text.match(/^(\d{4})[/-](\d{1,2})[/-](\d{1,2})$/);
  if (match) return `${match[1]}-${pad2(match[2])}-${pad2(match[3])}`;

  match = text.match(/^(\d{3})[/-](\d{1,2})[/-](\d{1,2})$/);
  if (match) return `${Number(match[1]) + 1911}-${pad2(match[2])}-${pad2(match[3])}`;

  match = text.match(/^(\d{1,2})[/-](\d{1,2})$/);
  if (match) return `${referenceYear}-${pad2(match[1])}-${pad2(match[2])}`;

  return '';
}

function extractDatesFromTitle(title, referenceYear = currentTaipeiYear()) {
  const text = String(title ?? '').trim();
  const match = text.match(
    /([0-9]{1,4}[/-][0-9]{1,2}(?:[/-][0-9]{1,2})?)\s*結算.*?([0-9]{1,4}[/-][0-9]{1,2}(?:[/-][0-9]{1,2})?)\s*(?:正式)?派單/u
  );

  return {
    settlementDate: normalizeDateInput(match?.[1], referenceYear),
    dispatchDate: normalizeDateInput(match?.[2], referenceYear)
  };
}

function formatMonthDay(dateString) {
  const match = String(dateString ?? '').match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return String(dateString ?? '').trim();
  return `${Number(match[2])}/${Number(match[3])}`;
}

function buildExecutionId(dateString) {
  return String(dateString ?? '').replace(/\D/g, '').slice(0, 14) || getTaipeiParts().year + getTaipeiParts().month + getTaipeiParts().day;
}

module.exports = {
  currentTaipeiYear,
  extractDatesFromTitle,
  formatMonthDay,
  formatTaipeiDate,
  formatTaipeiTimestamp,
  buildExecutionId,
  normalizeDateInput
};
