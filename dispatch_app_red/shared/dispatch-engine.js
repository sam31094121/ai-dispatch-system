const fs = require('fs');
const path = require('path');

const numberFormatter = new Intl.NumberFormat('zh-TW');
const cloneValue = typeof globalThis.structuredClone === 'function'
  ? (value) => globalThis.structuredClone(value)
  : (value) => JSON.parse(JSON.stringify(value));

const SYSTEM = {
  name: '兆櫃 AI 派單中樞系統',
  get version() { const d = new Date(); return `網頁版-${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; },
  timezone: 'Asia/Taipei',
  defaultOperator: 'USER'
};

const taipeiDateTimeFormatter = new Intl.DateTimeFormat('zh-TW', {
  timeZone: SYSTEM.timezone,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hour12: false
});

// 正式 4/13 規格權重：客單價 + 實收金額 + 續單總額 + 續單成交件數
const SCORE_WEIGHTS = [
  { key: 'dailyTicket', label: '當日客單價', weight: 150 },
  { key: 'dailyReceived', label: '當日實收金額', weight: 300 },
  { key: 'renewalRevenue', label: '續單金額', weight: 250 },
  { key: 'renewalDeals', label: '追續成交總數', weight: 200 },
  { key: 'currentMonthRevenue', label: '本月業績', weight: 50 },
  { key: 'lastMonthRevenue', label: '上月業績', weight: 30 },
  { key: 'overallTicket', label: '整體客單價', weight: 20 }
];

const STAGES = [
  { key: 'parse', label: '解析' },
  { key: 'audit', label: '審計' },
  { key: 'score', label: '計分' },
  { key: 'rank', label: '排序' },
  { key: 'dispatch', label: '派單' },
  { key: 'announcement', label: '公告' },
  { key: 'save', label: '存檔' }
];

const NAME_ALIASES = {
  徐華好: '徐華妤'
};

const METRIC_ALIASES = {
  追續: 'renewalDeals',
  追續成交總數: 'renewalDeals',
  續單: 'renewalRevenue',
  續單金額: 'renewalRevenue',
  總業績: 'totalRevenue',
  當日實收: 'dailyReceived',
  當日實收金額: 'dailyReceived',
  當日客單價: 'dailyTicket',
  客單價: 'dailyTicket',
  本月業績: 'currentMonthRevenue',
  上月業績: 'lastMonthRevenue',
  整體客單價: 'overallTicket'
};

const BASELINE_SEEDS = [
  { name: '王梅慧', renewalDeals: 16, renewalRevenue: 411770, totalRevenue: 547760, previousRank: 1 },
  { name: '馬秋香', renewalDeals: 17, renewalRevenue: 326120, totalRevenue: 516280, previousRank: 2 },
  { name: '林沛昕', renewalDeals: 23, renewalRevenue: 374840, totalRevenue: 507868, previousRank: 3 },
  { name: '徐華妤', renewalDeals: 8, renewalRevenue: 158380, totalRevenue: 322590, previousRank: 4 },
  { name: '王珍珠', renewalDeals: 6, renewalRevenue: 37560, totalRevenue: 283280, previousRank: 5 },
  { name: '林宜靜', renewalDeals: 8, renewalRevenue: 209576, totalRevenue: 238624, previousRank: 6 },
  { name: '李玲玲', renewalDeals: 15, renewalRevenue: 107420, totalRevenue: 194090, previousRank: 7 },
  { name: '廖姿惠', renewalDeals: 9, renewalRevenue: 40408, totalRevenue: 124008, previousRank: 8 },
  { name: '湯玉琦', renewalDeals: 3, renewalRevenue: 61040, totalRevenue: 117468, previousRank: 9 },
  { name: '蘇淑玲', renewalDeals: 6, renewalRevenue: 75820, totalRevenue: 97260, previousRank: 10 },
  { name: '梁依萍', renewalDeals: 4, renewalRevenue: 19840, totalRevenue: 85830, previousRank: 11 },
  { name: '高如郁', renewalDeals: 4, renewalRevenue: 14960, totalRevenue: 84360, previousRank: 12 },
  { name: '高美雲', renewalDeals: 4, renewalRevenue: 22800, totalRevenue: 83208, previousRank: 13 },
  { name: '陳玲華', renewalDeals: 1, renewalRevenue: 2380, totalRevenue: 82970, previousRank: 14 },
  { name: '鄭珮恩', renewalDeals: 5, renewalRevenue: 76000, totalRevenue: 76000, previousRank: 15 },
  { name: '許喬恩', renewalDeals: 1, renewalRevenue: 6500, totalRevenue: 65338, previousRank: 16 },
  { name: '陳桂子（新人）', renewalDeals: 5, renewalRevenue: 8680, totalRevenue: 60880, previousRank: 17 },
  { name: '謝啟芳', renewalDeals: 1, renewalRevenue: 18000, totalRevenue: 18000, previousRank: 18 },
  { name: '周美蓁', renewalDeals: 1, renewalRevenue: 5610, totalRevenue: 16570, previousRank: 19 },
  { name: '江沛林', renewalDeals: 1, renewalRevenue: 13500, totalRevenue: 13500, previousRank: 20 },
  { name: '林佩君', renewalDeals: 2, renewalRevenue: 12000, totalRevenue: 12000, previousRank: 21 },
  { name: '鄭上官', renewalDeals: 3, renewalRevenue: 9980, totalRevenue: 9980, previousRank: 22 },
  { name: '江麗勉', renewalDeals: 1, renewalRevenue: 6528, totalRevenue: 6528, previousRank: 23 }
];

const BIGDATA_ADVICE_BASELINE = [
  { rank: 1, name: '王梅慧', group: 'A1', text: '蟬聯第一，續單表現極佳，今天要把第一名拉開。' },
  { rank: 2, name: '馬秋香', group: 'A1', text: '穩居第二，總盤實力雄厚，隨時有機會奪回榜首。' },
  { rank: 3, name: '林沛昕', group: 'A1', text: '本輪成長最快，名次大幅提升，保持突破進攻。' },
  { rank: 4, name: '徐華妤', group: 'A1', text: '守住 A1 最後一席，後面追得很緊，不可放鬆。' },
  { rank: 5, name: '王珍珠', group: 'A2', text: '暫居 A2 榜首，今天出一筆大單就能重回 A1。' },
  { rank: 6, name: '林宜靜', group: 'A2', text: '位居 A2 前段，續單能量強，補上實收即翻盤。' },
  { rank: 7, name: '李玲玲', group: 'A2', text: '你在主力帶，追續成交穩定，今天要把量收成績。' },
  { rank: 8, name: '廖姿惠', group: 'A2', text: '標準補位型，一補就會更靠前。' },
  { rank: 9, name: '湯玉琦', group: 'A2', text: '追續底還在，重點是把盤面重新接起來。' },
  { rank: 10, name: '蘇淑玲', group: 'A2', text: '穩定在前段視窗，目前關鍵是不要停。' },
  { rank: 11, name: '梁依萍', group: 'B', text: '你現在差的不是底，是差再開一筆。' },
  { rank: 12, name: '高如郁', group: 'B', text: '要在可翻位區求穩穩進袋。' },
  { rank: 13, name: '高美雲', group: 'B', text: '要把可落袋的先收，名次就有上推空間。' },
  { rank: 14, name: '陳玲華', group: 'B', text: '中段差距極小，開一筆就會動。' },
  { rank: 15, name: '鄭珮恩', group: 'B', text: '目前在 B 組中段，求連續實收。' },
  { rank: 16, name: '許喬恩', group: 'B', text: '先把最穩的一筆做出來，位置就會變。' },
  { rank: 17, name: '陳桂子（新人）', group: 'B', text: '表現優於預期，已站穩 B 組。' },
  { rank: 18, name: '謝啟芳', group: 'C', text: '先求穩穩起步，有第一筆就有第二筆。' },
  { rank: 19, name: '周美蓁', group: 'C', text: '先把第一個明確數字做出來。' },
  { rank: 20, name: '江沛林', group: 'C', text: '先動起來，比停在原地更重要。' },
  { rank: 21, name: '林佩君', group: 'C', text: '你不是沒底，是差一筆把線接上。' },
  { rank: 22, name: '鄭上官', group: 'C', text: '今天先求開張。' },
  { rank: 23, name: '江麗勉', group: 'C', text: '抓最穩的那一步。' }
];

function getBigDataAdvice(snapshots, currentRanking) {
  return currentRanking.map((person) => {
    const baseline = BIGDATA_ADVICE_BASELINE.find((b) => b.name === person.name);
    return {
      rank: person.rank,
      name: person.name,
      group: person.group,
      text: baseline ? baseline.text : `AI 大數據顯示你目前在第 ${person.rank}，屬於 ${person.group} 組，建議持續保持節奏。`
    };
  });
}


class StageError extends Error {
  constructor(stageKey, message, extra = {}) {
    super(message);
    this.name = 'StageError';
    this.stageKey = stageKey;
    this.extra = extra;
  }
}

function deepClone(value) {
  return cloneValue(value);
}

function toNumber(value) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : 0;
}

function round(value, digits = 2) {
  const factor = 10 ** digits;
  return Math.round((toNumber(value) + Number.EPSILON) * factor) / factor;
}

function money(value) {
  return numberFormatter.format(toNumber(value));
}

function percent(value) {
  return `${round(value, 2).toFixed(2)}%`;
}

function taipeiNow(date = new Date()) {
  return taipeiDateTimeFormatter.format(date);
}

function createExecutionId(date = new Date()) {
  return Number(taipeiDateTimeFormatter.format(date).replace(/\D/g, ''));
}

function rocDate(date = new Date()) {
  return `${date.getFullYear() - 1911}/${String(date.getMonth() + 1).padStart(2, '0')}/${String(date.getDate()).padStart(2, '0')}`;
}

function addDays(date, amount) {
  const target = new Date(date.getTime());
  target.setDate(target.getDate() + amount);
  return target;
}

function safeFilePart(value) {
  return String(value || 'unknown').replace(/[\\/:*?"<>|]/g, '-');
}

function normalizeName(value) {
  return String(value || '').replace(/\s+/g, '').trim();
}

function joinNames(list) {
  const names = Array.isArray(list) ? list.filter(Boolean) : [];
  return names.length ? names.join('、') : '無';
}

function readJson(filePath) {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch {
    return null;
  }
}

function ensureDirs(paths) {
  [paths.dataDir, paths.reportDir, paths.backupDir, paths.archiveDir].forEach((dirPath) => {
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
  });
}

function appendJsonLine(filePath, payload) {
  fs.appendFileSync(filePath, `${JSON.stringify(payload)}\n`, 'utf8');
}

function writeSnapshotJsonFiles(filePaths, snapshot) {
  const serialized = JSON.stringify(snapshot, null, 2);
  filePaths.filter(Boolean).forEach((filePath) => {
    fs.writeFileSync(filePath, serialized, 'utf8');
  });
}

function loadLatestSnapshot(paths) {
  const snapshot = readJson(paths.latestFile);
  if (!snapshot || snapshot.systemName !== SYSTEM.name || !Array.isArray(snapshot.ranking)) {
    return null;
  }
  return snapshot;
}

function buildPreviousRankMap(previousSnapshot = null) {
  if (previousSnapshot && Array.isArray(previousSnapshot.ranking) && previousSnapshot.ranking.length) {
    return new Map(previousSnapshot.ranking.map((person) => [person.name, toNumber(person.rank)]));
  }
  return new Map(BASELINE_SEEDS.map((seed) => [seed.name, seed.previousRank]));
}

function buildBaseline(referenceDate = new Date(), previousSnapshot = null) {
  const previousRankMap = buildPreviousRankMap(previousSnapshot);

  return {
    reportDate: rocDate(referenceDate),
    dispatchDate: rocDate(addDays(referenceDate, 1)),
    people: BASELINE_SEEDS.map((seed, index) => {
      const dailyReceived = seed.totalRevenue;
      const dailyTicket = seed.renewalDeals > 0 ? round(seed.totalRevenue / seed.renewalDeals, 2) : 0;
      const lastMonthRevenue = Math.max(
        seed.totalRevenue,
        Math.round(seed.totalRevenue * 0.88 + seed.renewalRevenue * 0.12 + (BASELINE_SEEDS.length - index) * 1800)
      );
      const overallTicket = Math.max(
        3200,
        Math.round((seed.totalRevenue + seed.renewalRevenue + 60000 + (BASELINE_SEEDS.length - index) * 2600) / Math.max(seed.renewalDeals + 3, 1))
      );

      return {
        name: seed.name,
        previousRank: previousRankMap.get(seed.name) || seed.previousRank,
        renewalDeals: seed.renewalDeals,
        renewalRevenue: seed.renewalRevenue,
        totalRevenue: seed.totalRevenue,
        currentMonthRevenue: seed.totalRevenue,
        dailyReceived,
        dailyTicket,
        lastMonthRevenue,
        overallTicket
      };
    })
  };
}

function buildDefaultRawReport(referenceDate = new Date(), previousSnapshot = null) {
  const baseline = buildBaseline(referenceDate, previousSnapshot);
  return [
    `報表日期：${baseline.reportDate}`,
    `派單日期：${baseline.dispatchDate}`,
    ...baseline.people.map(
      (person, index) =>
        `${index + 1}、${person.name}｜【追續】${person.renewalDeals}｜【續單】${person.renewalRevenue}｜【總業績】${person.totalRevenue}`
    )
  ].join('\n');
}

function createStages() {
  return STAGES.map((stage, index) => ({
    key: stage.key,
    label: stage.label,
    order: index + 1,
    status: 'pending',
    message: '等待執行',
    completedAt: ''
  }));
}

function setStageDone(stages, key, message) {
  const stage = stages.find((item) => item.key === key);
  if (!stage) return;
  stage.status = 'done';
  stage.message = message;
  stage.completedAt = taipeiNow();
}

function setStageFailed(stages, key, message) {
  const stage = stages.find((item) => item.key === key);
  if (!stage) return;
  stage.status = 'failed';
  stage.message = message;
  stage.completedAt = taipeiNow();
}

function summarizeStages(stages) {
  const completed = stages.filter((stage) => stage.status === 'done').length;
  const failedIndex = stages.findIndex((stage) => stage.status === 'failed');
  const currentIndex = failedIndex >= 0 ? failedIndex : Math.min(completed, Math.max(stages.length - 1, 0));
  return {
    completed,
    total: stages.length,
    currentIndex,
    currentLabel: stages[currentIndex]?.label || '',
    failed: failedIndex >= 0
  };
}

function extractDates(rawText, defaults) {
  const lines = String(rawText || '')
    .replace(/\r/g, '')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);

  let reportDate = defaults.reportDate;
  let dispatchDate = defaults.dispatchDate;
  const dataLines = [];

  for (const line of lines) {
    const reportMatch = line.match(/^報表日期[:：]\s*(.+)$/u);
    if (reportMatch) {
      reportDate = reportMatch[1].trim();
      continue;
    }

    const dispatchMatch = line.match(/^派單日期[:：]\s*(.+)$/u);
    if (dispatchMatch) {
      dispatchDate = dispatchMatch[1].trim();
      continue;
    }

    dataLines.push(line);
  }

  return { reportDate, dispatchDate, dataLines };
}

function parseMetricSegment(segment) {
  const match = String(segment || '').match(/^【?\s*([^】：:]+)\s*】?\s*[:：]?\s*(-?[\d,]+(?:\.\d+)?)$/u);
  if (!match) return null;
  const alias = METRIC_ALIASES[normalizeName(match[1])];
  if (!alias) return null;
  return {
    key: alias,
    value: toNumber(String(match[2]).replace(/,/g, ''))
  };
}

function parseReport(rawText, options = {}) {
  const previousSnapshot = options.previousSnapshot || null;
  const referenceDate = options.referenceDate || new Date();
  const baseline = buildBaseline(referenceDate, previousSnapshot);
  const baselineMap = new Map(baseline.people.map((person) => [person.name, person]));
  const previousRankMap = buildPreviousRankMap(previousSnapshot);
  const { reportDate, dispatchDate, dataLines } = extractDates(rawText, baseline);

  const parsedRows = [];
  const invalidLines = [];

  dataLines.forEach((line, index) => {
    const segments = line
      .replace(/\|/g, '｜')
      .split('｜')
      .map((segment) => segment.trim())
      .filter(Boolean);

    const headerMatch = segments[0]?.match(/^(\d+)[、,.]\s*(.+)$/u);
    if (!headerMatch) {
      invalidLines.push({ lineNumber: index + 1, rawLine: line, reason: '姓名格式錯誤' });
      return;
    }

    const originalName = normalizeName(headerMatch[2]);
    const name = NAME_ALIASES[originalName] || originalName;
    const metrics = {};

    for (const segment of segments.slice(1)) {
      const metric = parseMetricSegment(segment);
      if (!metric) {
        invalidLines.push({ lineNumber: index + 1, rawLine: line, reason: `欄位格式錯誤：${segment}` });
        return;
      }
      metrics[metric.key] = metric.value;
    }

    if (!Object.prototype.hasOwnProperty.call(metrics, 'renewalDeals')) {
      invalidLines.push({ lineNumber: index + 1, rawLine: line, reason: '缺少追續欄位' });
      return;
    }
    if (!Object.prototype.hasOwnProperty.call(metrics, 'renewalRevenue')) {
      invalidLines.push({ lineNumber: index + 1, rawLine: line, reason: '缺少續單欄位' });
      return;
    }
    if (!Object.prototype.hasOwnProperty.call(metrics, 'totalRevenue')) {
      invalidLines.push({ lineNumber: index + 1, rawLine: line, reason: '缺少總業績欄位' });
      return;
    }

    const baselinePerson = baselineMap.get(name);
    const dailyReceived = Object.prototype.hasOwnProperty.call(metrics, 'dailyReceived') ? metrics.dailyReceived : metrics.totalRevenue;
    const dailyTicket = Object.prototype.hasOwnProperty.call(metrics, 'dailyTicket')
      ? metrics.dailyTicket
      : metrics.renewalDeals > 0
      ? round(dailyReceived / metrics.renewalDeals, 2)
      : 0;

    parsedRows.push({
      lineNumber: index + 1,
      inputOrder: index,
      inputRank: toNumber(headerMatch[1]),
      rawLine: line,
      originalName,
      name,
      renewalDeals: metrics.renewalDeals,
      renewalRevenue: metrics.renewalRevenue,
      totalRevenue: metrics.totalRevenue,
      currentMonthRevenue: Object.prototype.hasOwnProperty.call(metrics, 'currentMonthRevenue')
        ? metrics.currentMonthRevenue
        : metrics.totalRevenue,
      dailyReceived,
      dailyTicket,
      lastMonthRevenue: Object.prototype.hasOwnProperty.call(metrics, 'lastMonthRevenue')
        ? metrics.lastMonthRevenue
        : baselinePerson?.lastMonthRevenue ?? 0,
      overallTicket: Object.prototype.hasOwnProperty.call(metrics, 'overallTicket')
        ? metrics.overallTicket
        : baselinePerson?.overallTicket ?? 0,
      previousRank: previousRankMap.get(name) || baselinePerson?.previousRank || 0,
      aliasUsed: originalName !== name,
      baselineFound: Boolean(baselinePerson)
    });
  });

  const duplicateNames = [];
  const seenNames = new Set();
  parsedRows.forEach((row) => {
    if (seenNames.has(row.name)) duplicateNames.push(row.name);
    seenNames.add(row.name);
  });

  const unknownNames = parsedRows.filter((row) => !baselineMap.has(row.name)).map((row) => row.name);
  const aliasRows = parsedRows.filter((row) => row.aliasUsed).map((row) => ({ originalName: row.originalName, correctedName: row.name }));

  const mergedPeople = baseline.people.map((baselinePerson, index) => {
    const found = parsedRows.find((row) => row.name === baselinePerson.name);
    if (found) {
      return {
        ...found,
        inputOrder: found.inputOrder,
        baselineIndex: index,
        inReport: true
      };
    }

    return {
      lineNumber: null,
      inputOrder: 1000 + index,
      inputRank: 0,
      rawLine: '',
      originalName: baselinePerson.name,
      name: baselinePerson.name,
      renewalDeals: 0,
      renewalRevenue: 0,
      totalRevenue: 0,
      currentMonthRevenue: 0,
      dailyReceived: 0,
      dailyTicket: 0,
      lastMonthRevenue: baselinePerson.lastMonthRevenue,
      overallTicket: baselinePerson.overallTicket,
      previousRank: previousRankMap.get(baselinePerson.name) || baselinePerson.previousRank,
      aliasUsed: false,
      baselineFound: true,
      baselineIndex: index,
      inReport: false
    };
  });

  parsedRows
    .filter((row) => !baselineMap.has(row.name))
    .forEach((row, index) => {
      mergedPeople.push({
        ...row,
        baselineIndex: 1000 + index,
        inReport: true
      });
    });

  return {
    reportDate,
    dispatchDate,
    rawText: String(rawText || '').replace(/\r/g, ''),
    inputLines: dataLines.length,
    validLines: parsedRows.length,
    invalidLines,
    duplicateNames: [...new Set(duplicateNames)],
    unknownNames: [...new Set(unknownNames)],
    aliasRows,
    people: mergedPeople
  };
}

function auditReport(parsed) {
  const errors = [];
  const checks = [];
  const check = (label, passed, detail) => {
    checks.push({ label, status: passed ? '通過' : '失敗', detail: passed ? '' : detail });
    if (!passed && detail) errors.push(detail);
  };

  check('有輸入資料', parsed.inputLines > 0, '未偵測到業績資料');
  check('格式正確', parsed.invalidLines.length === 0, parsed.invalidLines.map((row) => `第 ${row.lineNumber} 行：${row.reason}`).join('；'));
  check('姓名無重複', parsed.duplicateNames.length === 0, `姓名重複：${parsed.duplicateNames.join('、')}`);
  check('姓名白名單', parsed.unknownNames.length === 0, `姓名不在白名單：${parsed.unknownNames.join('、')}`);
  check(
    '姓名無錯字',
    parsed.aliasRows.length === 0,
    parsed.aliasRows.map((row) => `${row.originalName} 應為 ${row.correctedName}`).join('；')
  );

  const numericErrors = [];
  const negativeErrors = [];
  const revenueErrors = [];
  const dealErrors = [];
  const fieldErrors = [];

  parsed.people.forEach((person) => {
    [
      ['renewalDeals', '追續成交總數'],
      ['renewalRevenue', '續單金額'],
      ['totalRevenue', '總業績'],
      ['dailyReceived', '當日實收金額'],
      ['dailyTicket', '當日客單價'],
      ['currentMonthRevenue', '本月業績'],
      ['lastMonthRevenue', '上月業績'],
      ['overallTicket', '整體客單價'],
      ['previousRank', '前一版名次']
    ].forEach(([key, label]) => {
      if (!Number.isFinite(Number(person[key]))) numericErrors.push(`${person.name} 的 ${label} 不是數字`);
      if (toNumber(person[key]) < 0) negativeErrors.push(`${person.name} 的 ${label} 不可為負數`);
    });

    if (toNumber(person.totalRevenue) < toNumber(person.renewalRevenue)) {
      revenueErrors.push(`${person.name} 的總業績小於續單金額`);
    }
    if (toNumber(person.renewalDeals) > 0 && toNumber(person.totalRevenue) === 0) {
      dealErrors.push(`${person.name} 有追續成交但總業績為 0`);
    }
    if (person.inReport && person.lineNumber == null) {
      fieldErrors.push(`${person.name} 缺少原始行號`);
    }
  });

  check('欄位完整', fieldErrors.length === 0, fieldErrors.join('；'));
  check('數字合法', numericErrors.length === 0, numericErrors.join('；'));
  check('不得負數', negativeErrors.length === 0, negativeErrors.join('；'));
  check('總業績不得小於續單', revenueErrors.length === 0, revenueErrors.join('；'));
  check('追續成交需有業績', dealErrors.length === 0, dealErrors.join('；'));

  return {
    status: errors.length ? '失敗' : '通過',
    message: errors.length ? errors[0] : '審計通過，可進入 1000 權重排序。',
    errors,
    checks
  };
}

function metricValue(person, key) {
  if (key === 'dailyTicket') return toNumber(person.dailyTicket);
  if (key === 'dailyReceived') return toNumber(person.dailyReceived);
  if (key === 'currentMonthRevenue') return toNumber(person.currentMonthRevenue);
  if (key === 'lastMonthRevenue') return toNumber(person.lastMonthRevenue);
  if (key === 'overallTicket') return toNumber(person.overallTicket);
  if (key === 'renewalRevenue') return toNumber(person.renewalRevenue);
  if (key === 'renewalDeals') return toNumber(person.renewalDeals);
  return 0;
}

function scoreReport(parsed) {
  const maxima = SCORE_WEIGHTS.reduce((map, item) => {
    map[item.key] = Math.max(...parsed.people.map((person) => metricValue(person, item.key)), 0);
    return map;
  }, {});

  const people = parsed.people.map((person) => {
    const breakdown = SCORE_WEIGHTS.map((weight) => {
      const value = metricValue(person, weight.key);
      const maxValue = maxima[weight.key] || 0;
      const ratio = maxValue > 0 ? value / maxValue : 0;
      
      // 優化後的比例原則：(個人值 / 全體最高值) * 權重配點
      const proportionalScore = round(ratio * weight.weight, 2);
      
      return {
        key: weight.key,
        label: weight.label,
        weight: weight.weight,
        value,
        ratio: round(ratio, 4),
        score: proportionalScore
      };
    });

    return {
      ...person,
      totalScore: round(breakdown.reduce((sum, item) => sum + item.score, 0), 2),
      breakdown
    };
  });

  const scores = people.map((person) => person.totalScore);
  return {
    weights: deepClone(SCORE_WEIGHTS),
    maxima,
    topScore: scores.length ? Math.max(...scores) : 0,
    averageScore: scores.length ? round(scores.reduce((sum, value) => sum + value, 0) / scores.length, 2) : 0,
    people
  };
}

function groupKey(rank) {
  // 正式分組規則：A1 (1-4), A2 (5-10), B (11-17), C (18+)
  if (rank <= 4) return 'A1';
  if (rank <= 10) return 'A2';
  if (rank <= 17) return 'B';
  return 'C';
}

function groupLabel(group) {
  if (group === 'A1') return 'A1 高單主力';
  if (group === 'A2') return 'A2 續單收割';
  if (group === 'B') return 'B 一般量單';
  return 'C 補位觀察';
}

function compareRankPeople(left, right) {
  // 正式規格排序：總業績 > 續單金額 > 追單件數 > AI 評分
  if (right.totalRevenue !== left.totalRevenue) return right.totalRevenue - left.totalRevenue;
  if (right.renewalRevenue !== left.renewalRevenue) return right.renewalRevenue - left.renewalRevenue;
  if (right.renewalDeals !== left.renewalDeals) return right.renewalDeals - left.renewalDeals;
  if (right.totalScore !== left.totalScore) return right.totalScore - left.totalScore;
  return left.inputOrder - right.inputOrder;
}

function rankReport(scoring) {
  const ranked = [...scoring.people]
    .sort(compareRankPeople)
    .map((person, index) => {
      const rank = index + 1;
      const previousRank = toNumber(person.previousRank);
      const rankDelta = previousRank > 0 ? previousRank - rank : 0;
      return {
        ...person,
        rank,
        previousRank,
        rankDelta,
        movement: previousRank === 0 ? '新進' : rankDelta > 0 ? `上升 ${rankDelta}` : rankDelta < 0 ? `下降 ${Math.abs(rankDelta)}` : '持平',
        group: groupKey(rank),
        groupLabel: groupLabel(groupKey(rank))
      };
    });

  return {
    ranked,
    groups: {
      A1: ranked.filter((person) => person.group === 'A1').map((person) => person.name),
      A2: ranked.filter((person) => person.group === 'A2').map((person) => person.name),
      B: ranked.filter((person) => person.group === 'B').map((person) => person.name),
      C: ranked.filter((person) => person.group === 'C').map((person) => person.name)
    },
    changes: {
      new: ranked.filter((person) => person.previousRank === 0).map((person) => `${person.name}：新進第 ${person.rank} 名`),
      up: ranked.filter((person) => person.rankDelta > 0).map((person) => `${person.name}：上升 ${person.rankDelta}`),
      down: ranked.filter((person) => person.rankDelta < 0).map((person) => `${person.name}：下降 ${Math.abs(person.rankDelta)}`),
      flat: ranked.filter((person) => person.rankDelta === 0 && person.previousRank > 0).map((person) => `${person.name}：持平`)
    }
  };
}

function arraysEqual(left, right) {
  const a = Array.isArray(left) ? left : [];
  const b = Array.isArray(right) ? right : [];
  if (a.length !== b.length) return false;
  return a.every((value, index) => value === b[index]);
}

function buildExpectedGroups(ranking) {
  return {
    A1: ranking.filter((person) => groupKey(person.rank) === 'A1').map((person) => person.name),
    A2: ranking.filter((person) => groupKey(person.rank) === 'A2').map((person) => person.name),
    B: ranking.filter((person) => groupKey(person.rank) === 'B').map((person) => person.name),
    C: ranking.filter((person) => groupKey(person.rank) === 'C').map((person) => person.name)
  };
}

function buildExpectedChanges(ranking) {
  return {
    new: ranking.filter((person) => toNumber(person.previousRank) === 0).map((person) => `${person.name}：新進第 ${person.rank} 名`),
    up: ranking.filter((person) => toNumber(person.rankDelta) > 0).map((person) => `${person.name}：上升 ${person.rankDelta}`),
    down: ranking.filter((person) => toNumber(person.rankDelta) < 0).map((person) => `${person.name}：下降 ${Math.abs(person.rankDelta)}`),
    flat: ranking.filter((person) => toNumber(person.rankDelta) === 0 && toNumber(person.previousRank) > 0).map((person) => `${person.name}：持平`)
  };
}

function summarizeReport(parsed) {
  return parsed.people.reduce(
    (summary, person) => {
      summary.dailyReceived += toNumber(person.dailyReceived);
      summary.currentMonthRevenue += toNumber(person.currentMonthRevenue);
      summary.totalRevenue += toNumber(person.totalRevenue);
      summary.renewalRevenue += toNumber(person.renewalRevenue);
      summary.renewalDeals += toNumber(person.renewalDeals);
      summary.totalPeople += 1;
      if (toNumber(person.totalRevenue) > 0) summary.activePeople += 1;
      if (toNumber(person.dailyTicket) > 0) {
        summary.dailyTicketTotal += toNumber(person.dailyTicket);
        summary.dailyTicketCount += 1;
      }
      if (toNumber(person.overallTicket) > 0) {
        summary.overallTicketTotal += toNumber(person.overallTicket);
        summary.overallTicketCount += 1;
      }
      return summary;
    },
    {
      dailyReceived: 0,
      currentMonthRevenue: 0,
      totalRevenue: 0,
      renewalRevenue: 0,
      renewalDeals: 0,
      totalPeople: 0,
      activePeople: 0,
      dailyTicketTotal: 0,
      dailyTicketCount: 0,
      overallTicketTotal: 0,
      overallTicketCount: 0
    }
  );
}

function normalizeSummary(summary) {
  return {
    dailyReceived: summary.dailyReceived,
    currentMonthRevenue: summary.currentMonthRevenue,
    totalRevenue: summary.totalRevenue,
    renewalRevenue: summary.renewalRevenue,
    renewalDeals: summary.renewalDeals,
    totalPeople: summary.totalPeople,
    activePeople: summary.activePeople,
    averageDailyTicket: summary.dailyTicketCount ? round(summary.dailyTicketTotal / summary.dailyTicketCount, 2) : 0,
    averageOverallTicket: summary.overallTicketCount ? round(summary.overallTicketTotal / summary.overallTicketCount, 2) : 0,
    conversionRateText: summary.totalPeople > 0 ? percent((summary.activePeople / summary.totalPeople) * 100) : '無法計算'
  };
}

function buildAiInsights(snapshot) {
  const ranking = Array.isArray(snapshot.ranking) ? snapshot.ranking : [];
  const totalRevenue = toNumber(snapshot.summary?.totalRevenue);
  const top = ranking[0] || null;
  const second = ranking[1] || null;
  const fourth = ranking[3] || null;
  const fifth = ranking[4] || null;
  const top3Revenue = ranking.slice(0, 3).reduce((sum, person) => sum + toNumber(person.totalRevenue), 0);
  const zeroRevenueCount = ranking.filter((person) => toNumber(person.totalRevenue) <= 0).length;
  const upCount = ranking.filter((person) => toNumber(person.rankDelta) > 0).length;
  const downCount = ranking.filter((person) => toNumber(person.rankDelta) < 0).length;
  const renewalLeader = ranking.reduce(
    (best, person) => (toNumber(person.renewalRevenue) > toNumber(best?.renewalRevenue) ? person : best),
    ranking[0] || null
  );
  const followLeader = ranking.reduce(
    (best, person) => (toNumber(person.renewalDeals) > toNumber(best?.renewalDeals) ? person : best),
    ranking[0] || null
  );

  const leadGap = top && second ? round(toNumber(top.totalScore) - toNumber(second.totalScore), 2) : 0;
  const a1Gap = fourth && fifth ? round(toNumber(fourth.totalScore) - toNumber(fifth.totalScore), 2) : 0;
  const top3Share = totalRevenue > 0 ? percent((top3Revenue / totalRevenue) * 100) : '0.00%';

  const lines = [
    top && second
      ? `榜首 ${top.name} 目前以 ${round(top.totalScore, 2).toFixed(2)} 分領先 ${second.name} ${leadGap.toFixed(2)} 分。`
      : '目前僅有一位有效人員，榜首領先差無法比較。',
    `前三名總業績占全體 ${top3Share}，資源集中度${Number(top3Share.replace('%', '')) >= 40 ? '偏高' : '正常'}。`,
    fourth && fifth
      ? `A1 門檻目前由 ${fourth.name} 守住，與第 5 名 ${fifth.name} 差 ${a1Gap.toFixed(2)} 分。`
      : 'A1 門檻資料不足，暫無法計算壓力差。',
    renewalLeader
      ? `續單主力為 ${renewalLeader.name}，續單金額 ${money(renewalLeader.renewalRevenue)}。`
      : '續單主力資料不足。',
    followLeader
      ? `追續主力為 ${followLeader.name}，追續成交 ${money(followLeader.renewalDeals)} 通。`
      : '追續主力資料不足。',
    zeroRevenueCount > 0
      ? `目前仍有 ${zeroRevenueCount} 位零業績，適合用補位名單優先破蛋。`
      : '目前全員皆有業績，補位壓力較低。',
    `名次異動為上升 ${upCount} 人、下降 ${downCount} 人，盤面仍在快速變動。`
  ];

  return {
    cards: [
      { label: '榜首領先差', value: `${leadGap.toFixed(2)} 分`, detail: top && second ? `${top.name} 對 ${second.name}` : '無對照', tone: 'gold' },
      { label: '前三集中度', value: top3Share, detail: '前三名總業績占比', tone: 'cyan' },
      { label: 'A1 門檻差', value: `${a1Gap.toFixed(2)} 分`, detail: fourth && fifth ? `${fourth.name} 對 ${fifth.name}` : '無對照', tone: 'violet' },
      { label: '續單主力', value: renewalLeader ? renewalLeader.name : '無', detail: renewalLeader ? money(renewalLeader.renewalRevenue) : '0', tone: 'orange' },
      { label: '追續主力', value: followLeader ? followLeader.name : '無', detail: followLeader ? `${money(followLeader.renewalDeals)} 通` : '0 通', tone: 'cyan' },
      { label: '零業績人數', value: `${zeroRevenueCount} 人`, detail: `上升 ${upCount}｜下降 ${downCount}`, tone: zeroRevenueCount > 0 ? 'red' : 'green' }
    ],
    lines
  };
}

function buildBossConsole(snapshot) {
  return {
    cards: [
      { label: '審計', value: snapshot.audit.status, tone: snapshot.audit.status === '通過' ? 'green' : 'red' },
      {
        label: '確認',
        value: snapshot.confirmation?.status || '待確認',
        tone: snapshot.confirmation?.status === '通過' ? 'green' : 'red'
      },
      { label: '最高 AI 分', value: snapshot.scoring ? round(snapshot.scoring.topScore, 2).toFixed(2) : '0.00', tone: 'gold' },
      { label: '平均 AI 分', value: snapshot.scoring ? round(snapshot.scoring.averageScore, 2).toFixed(2) : '0.00', tone: 'cyan' },
      { label: '當日實收', value: money(snapshot.summary.dailyReceived), tone: 'gold' },
      { label: '本月業績', value: money(snapshot.summary.currentMonthRevenue), tone: 'gold' },
      { label: '續單總額', value: money(snapshot.summary.renewalRevenue), tone: 'violet' },
      { label: '追續成交', value: `${money(snapshot.summary.renewalDeals)} 通`, tone: 'cyan' },
      { label: '執行序號', value: String(snapshot.executionId), tone: 'orange' },
      { label: '有效人數', value: `${snapshot.summary.activePeople}/${snapshot.summary.totalPeople}`, tone: 'green' }
    ],
    files: snapshot.files
      ? [
          { label: '報表檔', value: snapshot.files.reportFile },
          { label: '備份檔', value: snapshot.files.backupFile },
          { label: '歸檔檔', value: snapshot.files.archiveFile }
        ]
      : []
  };
}

function buildAnnouncement(snapshot) {
  const rankedLines = (snapshot.ranking || [])
    .map(
      (person) =>
        `${person.rank}｜${person.name}｜【追單】${money(person.renewalDeals)}｜【續單】${money(person.renewalRevenue)}｜【總業績】${money(person.totalRevenue)}｜【實收】${money(person.dailyReceived)}`
    )
    .join('\n');

  const groups = snapshot.groups || { A1: [], A2: [], B: [], C: [] };

  return [
    `📣【AI 派單公告｜${snapshot.reportDate} 結算 → ${snapshot.dispatchDate} 派單順序】正式版`,
    '',
    '今日三平台資料已完成 AI 審計。',
    `【審計結果】＝ ${snapshot.audit.status === '通過' ? 'PASS' : 'FAIL'}`,
    snapshot.audit.message ? `說明：${snapshot.audit.message}` : '數據完整校驗通過，無異常。',
    '',
    '────────────────────────',
    '【一、今日整合名次 (正式排序)】',
    '────────────────────────',
    rankedLines || '無資料',
    '',
    '────────────────────────',
    '【二、明日 AI 派單順序 (四大梯隊)】',
    '────────────────────────',
    '',
    `🔴 A1｜高單主力：${joinNames(groups.A1)}`,
    `🟠 A2｜續單收割：${joinNames(groups.A2)}`,
    `🟡 B 組｜一般量單：${joinNames(groups.B)}`,
    `🟢 C 組｜補位觀察：${joinNames(groups.C)}`,
    '',
    '────────────────────────',
    '【三、執行規則（鎖死）】',
    '────────────────────────',
    '1. 照順序派，不分組。',
    '2. 前面全忙，才往後。',
    '3. 不得指定，不得跳位。',
    '4. 同客戶回撥，優先回原承接人。',
    '',
    '────────────────────────',
    '【四、今日整合總盤摘要】',
    '────────────────────────',
    `三平台整合【實收】：${money(snapshot.summary.dailyReceived)}`,
    `三平台整合【續單】：${money(snapshot.summary.renewalRevenue)}`,
    `三平台整合【追單】：${money(snapshot.summary.renewalDeals)}`,
    `有效人力佔比：${snapshot.summary.conversionRateText}`,
    '',
    '以上為今日統一派單規則。確認請回 +1。',
    `執行 ID: ${snapshot.executionId}`
  ].join('\n');
}

function verifySnapshotConsistency(snapshot) {
  const checks = [];
  const errors = [];
  const addCheck = (label, passed, detail) => {
    checks.push({ label, status: passed ? '通過' : '失敗', detail: passed ? '' : detail });
    if (!passed && detail) errors.push(detail);
  };

  const ranking = Array.isArray(snapshot.ranking) ? snapshot.ranking : [];
  const parsedPeople = Array.isArray(snapshot.parsedData?.people) ? snapshot.parsedData.people : [];
  const expectedSummary = normalizeSummary(summarizeReport({ people: parsedPeople }));
  const summary = snapshot.summary || {};
  const expectedGroups = buildExpectedGroups(ranking);
  const expectedChanges = buildExpectedChanges(ranking);
  const expectedAnnouncement = buildAnnouncement({
    ...snapshot,
    groups: expectedGroups,
    changes: expectedChanges
  });

  const summaryFields = [
    ['dailyReceived', '當日實收'],
    ['currentMonthRevenue', '本月業績'],
    ['totalRevenue', '總業績'],
    ['renewalRevenue', '續單總額'],
    ['renewalDeals', '追續成交'],
    ['totalPeople', '總人數'],
    ['activePeople', '有效人數'],
    ['averageDailyTicket', '平均當日客單'],
    ['averageOverallTicket', '平均整體客單'],
    ['conversionRateText', '有效率']
  ];

  const summaryMismatches = summaryFields
    .filter(([key]) => String(summary[key] ?? '') !== String(expectedSummary[key] ?? ''))
    .map(([key, label]) => `${label} 應為 ${expectedSummary[key] ?? ''}，目前為 ${summary[key] ?? ''}`);

  addCheck(
    '總盤一致',
    summaryMismatches.length === 0,
    summaryMismatches.join('；')
  );

  addCheck(
    '名次筆數一致',
    ranking.length === parsedPeople.length,
    `名次筆數 ${ranking.length} 與明細筆數 ${parsedPeople.length} 不一致`
  );

  const rankingIssues = [];
  ranking.forEach((person, index) => {
    const expectedRank = index + 1;
    if (toNumber(person.rank) !== expectedRank) {
      rankingIssues.push(`${person.name} 名次應為 ${expectedRank}，目前為 ${person.rank}`);
    }
    if (person.group !== groupKey(expectedRank)) {
      rankingIssues.push(`${person.name} 分組應為 ${groupKey(expectedRank)}，目前為 ${person.group}`);
    }
    const expectedDelta = toNumber(person.previousRank) > 0 ? toNumber(person.previousRank) - expectedRank : 0;
    if (toNumber(person.rankDelta) !== expectedDelta) {
      rankingIssues.push(`${person.name} 名次異動應為 ${expectedDelta}，目前為 ${person.rankDelta}`);
    }
    if (index > 0 && compareRankPeople(ranking[index - 1], person) > 0) {
      rankingIssues.push(`${ranking[index - 1].name} 與 ${person.name} 的排序順序異常`);
    }
  });

  addCheck(
    '排序一致',
    rankingIssues.length === 0,
    rankingIssues.join('；')
  );

  const groupPassed =
    arraysEqual(snapshot.groups?.A1, expectedGroups.A1) &&
    arraysEqual(snapshot.groups?.A2, expectedGroups.A2) &&
    arraysEqual(snapshot.groups?.B, expectedGroups.B) &&
    arraysEqual(snapshot.groups?.C, expectedGroups.C);

  addCheck(
    '分組一致',
    groupPassed,
    `A1/A2/B/C 分組與名次結果不一致`
  );

  const changePassed =
    arraysEqual(snapshot.changes?.new, expectedChanges.new) &&
    arraysEqual(snapshot.changes?.up, expectedChanges.up) &&
    arraysEqual(snapshot.changes?.down, expectedChanges.down) &&
    arraysEqual(snapshot.changes?.flat, expectedChanges.flat);

  addCheck(
    '異動一致',
    changePassed,
    `上升/下降/持平清單與名次異動不一致`
  );

  addCheck(
    '公告一致',
    snapshot.announcement === expectedAnnouncement,
    '公告內容與排序、分組、異動或總盤資料不一致'
  );

  return {
    status: errors.length ? '失敗' : '通過',
    message: errors.length ? errors[0] : '全部確認無誤，可正式存檔',
    errors,
    checks
  };
}

function mergeAuditWithConfirmation(audit, confirmation) {
  if (!confirmation || confirmation.status === '通過') return audit;
  return {
    ...audit,
    status: '失敗',
    message: confirmation.message,
    errors: [...(audit?.errors || []), ...(confirmation.errors || [])],
    checks: [
      ...(audit?.checks || []),
      ...(confirmation.checks || []).map((check) => ({
        label: `確認｜${check.label}`,
        status: check.status,
        detail: check.detail
      }))
    ]
  };
}

function buildSnapshot({ executionId, operator, source, rawText, parsed, audit, scoring, rankingResult, stages, files, status }) {
  const summary = normalizeSummary(summarizeReport(parsed));
  const logs = stages
    .filter((stage) => stage.status === 'done' || stage.status === 'failed')
    .map((stage) => ({
      time: stage.completedAt || taipeiNow(),
      type: stage.status === 'done' ? '完成' : '失敗',
      message: `${stage.label}｜${stage.message}`
    }));

  const snapshot = {
    systemName: SYSTEM.name,
    systemVersion: SYSTEM.version,
    executionId,
    operator,
    source,
    status,
    completedAt: taipeiNow(),
    reportDate: parsed.reportDate,
    dispatchDate: parsed.dispatchDate,
    rawText,
    parsedData: parsed,
    audit,
    scoring,
    ranking: rankingResult.ranked,
    groups: rankingResult.groups,
    changes: rankingResult.changes,
    summary,
    stages,
    stageSummary: summarizeStages(stages),
    bigdataAdvice: getBigDataAdvice(null, rankingResult.ranked),
    logs,
    files
  };

  snapshot.aiInsights = buildAiInsights(snapshot);
  snapshot.announcement = buildAnnouncement(snapshot);
  snapshot.confirmation = verifySnapshotConsistency(snapshot);
  snapshot.bossConsole = buildBossConsole(snapshot);
  return snapshot;
}

function writeSuccessSnapshot(snapshot, paths) {
  const safeDate = safeFilePart(snapshot.reportDate.replace(/\//g, '-'));
  const files = {
    reportFile: `snapshot_${snapshot.executionId}.json`,
    backupFile: `backup_${snapshot.executionId}.json`,
    archiveFile: `${safeDate}_${snapshot.executionId}.json`
  };

  const nextSnapshot = buildSnapshot({
    executionId: snapshot.executionId,
    operator: snapshot.operator,
    source: snapshot.source,
    rawText: snapshot.rawText,
    parsed: snapshot.parsedData,
    audit: snapshot.audit,
    scoring: snapshot.scoring,
    rankingResult: {
      ranked: snapshot.ranking || [],
      groups: snapshot.groups || { A1: [], A2: [], B: [], C: [] },
      changes: snapshot.changes || { up: [], down: [], flat: [] }
    },
    stages: snapshot.stages || [],
    files,
    status: snapshot.status || '通過'
  });

  writeSnapshotJsonFiles([
    path.join(paths.reportDir, files.reportFile),
    path.join(paths.backupDir, files.backupFile),
    path.join(paths.archiveDir, files.archiveFile),
    paths.latestFile
  ], nextSnapshot);

  appendJsonLine(paths.logFile, {
    executionId: nextSnapshot.executionId,
    status: nextSnapshot.status,
    operator: nextSnapshot.operator,
    reportDate: nextSnapshot.reportDate,
    dispatchDate: nextSnapshot.dispatchDate,
    time: nextSnapshot.completedAt,
    topName: nextSnapshot.ranking[0]?.name || ''
  });

  return nextSnapshot;
}

function writeFailureSnapshot(snapshot, paths) {
  const files = {
    reportFile: `failure_${snapshot.executionId}.json`,
    backupFile: '',
    archiveFile: `failure_${snapshot.executionId}.json`
  };

  const nextSnapshot = buildSnapshot({
    executionId: snapshot.executionId,
    operator: snapshot.operator,
    source: snapshot.source,
    rawText: snapshot.rawText,
    parsed: snapshot.parsedData,
    audit: snapshot.audit,
    scoring: snapshot.scoring,
    rankingResult: {
      ranked: snapshot.ranking || [],
      groups: snapshot.groups || { A1: [], A2: [], B: [], C: [] },
      changes: snapshot.changes || { up: [], down: [], flat: [] }
    },
    stages: snapshot.stages || [],
    files,
    status: snapshot.status || '失敗'
  });

  writeSnapshotJsonFiles([
    path.join(paths.reportDir, files.reportFile),
    path.join(paths.archiveDir, files.archiveFile)
  ], nextSnapshot);

  appendJsonLine(paths.logFile, {
    executionId: nextSnapshot.executionId,
    status: nextSnapshot.status,
    operator: nextSnapshot.operator,
    reportDate: nextSnapshot.reportDate,
    dispatchDate: nextSnapshot.dispatchDate,
    time: nextSnapshot.completedAt,
    error: nextSnapshot.audit.message
  });

  return nextSnapshot;
}

function analyze(rawText, options = {}) {
  const previousSnapshot = options.previousSnapshot || null;
  const referenceDate = options.referenceDate || new Date();
  const parsed = parseReport(rawText, { previousSnapshot, referenceDate });
  const audit = auditReport(parsed);
  const result = { parsed, audit };

  if (audit.status === '通過') {
    result.scoring = scoreReport(parsed);
    result.rankingResult = rankReport(result.scoring);
  }

  return result;
}

function runFullPipeline({ rawText, operator = SYSTEM.defaultOperator, dataPaths, source = 'manual', referenceDate = new Date() }) {
  ensureDirs(dataPaths);

  const executionId = createExecutionId();
  const stages = createStages();
  const previousSnapshot = loadLatestSnapshot(dataPaths);

  try {
    const parsed = parseReport(rawText, { previousSnapshot, referenceDate });
    if (!parsed.inputLines) {
      throw new StageError('parse', '未偵測到任何業績資料', { parsed });
    }
    if (parsed.invalidLines.length) {
      throw new StageError('parse', parsed.invalidLines.map((row) => `第 ${row.lineNumber} 行：${row.reason}`).join('；'), { parsed });
    }
    setStageDone(stages, 'parse', `解析 ${parsed.validLines} 筆`);

    const audit = auditReport(parsed);
    if (audit.status !== '通過') {
      throw new StageError('audit', audit.message, { parsed, audit });
    }
    setStageDone(stages, 'audit', '審計通過');

    const scoring = scoreReport(parsed);
    setStageDone(stages, 'score', '1000 權重完成');

    const rankingResult = rankReport(scoring);
    setStageDone(stages, 'rank', `排序完成 ${rankingResult.ranked.length} 人`);
    setStageDone(stages, 'dispatch', `A1 ${rankingResult.groups.A1.length}｜A2 ${rankingResult.groups.A2.length}｜B ${rankingResult.groups.B.length}｜C ${rankingResult.groups.C.length}`);
    setStageDone(stages, 'announcement', `公告 ${buildAnnouncement(buildSnapshot({
      executionId,
      operator,
      source,
      rawText,
      parsed,
      audit,
      scoring,
      rankingResult,
      stages: deepClone(stages),
      files: null,
      status: '通過'
    })).length} 字`);
    setStageDone(stages, 'save', '存檔完成');

    return writeSuccessSnapshot(
      buildSnapshot({
        executionId,
        operator,
        source,
        rawText,
        parsed,
        audit,
        scoring,
        rankingResult,
        stages,
        files: null,
        status: '通過'
      }),
      dataPaths
    );
  } catch (error) {
    const stageKey = error instanceof StageError ? error.stageKey : 'save';
    setStageFailed(stages, stageKey, error.message || '執行失敗');

    const fallbackParsed = error instanceof StageError && error.extra?.parsed ? error.extra.parsed : parseReport(rawText, { previousSnapshot, referenceDate });
    const fallbackAudit =
      error instanceof StageError && error.extra?.audit
        ? error.extra.audit
        : { status: '失敗', message: error.message || '執行失敗', errors: [error.message || '執行失敗'], checks: [] };

    return writeFailureSnapshot(
      buildSnapshot({
        executionId,
        operator,
        source,
        rawText,
        parsed: fallbackParsed,
        audit: fallbackAudit,
        scoring: { weights: deepClone(SCORE_WEIGHTS), maxima: {}, topScore: 0, averageScore: 0, people: [] },
        rankingResult: { ranked: [], groups: { A1: [], A2: [], B: [], C: [] }, changes: { up: [], down: [], flat: [] } },
        stages,
        files: null,
        status: '失敗'
      }),
      dataPaths
    );
  }
}

function createPreviewSnapshot(rawText, options = {}) {
  const previousSnapshot = options.previousSnapshot || null;
  const referenceDate = options.referenceDate || new Date();
  const analysis = analyze(rawText, { previousSnapshot, referenceDate });
  const stages = createStages();

  if (analysis.parsed.inputLines > 0 && analysis.parsed.invalidLines.length === 0) {
    setStageDone(stages, 'parse', `解析 ${analysis.parsed.validLines} 筆`);
  } else if (analysis.parsed.inputLines > 0) {
    setStageFailed(stages, 'parse', analysis.parsed.invalidLines.map((row) => `第 ${row.lineNumber} 行：${row.reason}`).join('；'));
  }

  if (analysis.audit.status === '通過') {
    setStageDone(stages, 'audit', '審計通過');
    setStageDone(stages, 'score', '1000 權重完成');
    setStageDone(stages, 'rank', `排序完成 ${analysis.rankingResult.ranked.length} 人`);
    setStageDone(
      stages,
      'dispatch',
      `A1 ${analysis.rankingResult.groups.A1.length}｜A2 ${analysis.rankingResult.groups.A2.length}｜B ${analysis.rankingResult.groups.B.length}｜C ${analysis.rankingResult.groups.C.length}`
    );
    setStageDone(stages, 'announcement', '公告預覽完成');
  } else {
    setStageFailed(stages, 'audit', analysis.audit.message);
  }

  return buildSnapshot({
    executionId: createExecutionId(),
    operator: options.operator || SYSTEM.defaultOperator,
    source: options.source || 'preview',
    rawText,
    parsed: analysis.parsed,
    audit: analysis.audit,
    scoring: analysis.scoring || { weights: deepClone(SCORE_WEIGHTS), maxima: {}, topScore: 0, averageScore: 0, people: [] },
    rankingResult: analysis.rankingResult || { ranked: [], groups: { A1: [], A2: [], B: [], C: [] }, changes: { up: [], down: [], flat: [] } },
    stages,
    files: null,
    status: analysis.audit.status
  });
}

function ensureInitialized(paths) {
  ensureDirs(paths);
  const latest = loadLatestSnapshot(paths);
  if (latest) return latest;
  return runFullPipeline({
    rawText: buildDefaultRawReport(new Date(), null),
    operator: 'SYSTEM',
    dataPaths: paths,
    source: 'bootstrap'
  });
}

function runFullPipeline({ rawText, operator = SYSTEM.defaultOperator, dataPaths, source = 'manual', referenceDate = new Date() }) {
  ensureDirs(dataPaths);

  const executionId = createExecutionId();
  const stages = createStages();
  const previousSnapshot = loadLatestSnapshot(dataPaths);

  try {
    const parsed = parseReport(rawText, { previousSnapshot, referenceDate });
    if (!parsed.inputLines) {
      throw new StageError('parse', '未提供有效業績報表', { parsed });
    }
    if (parsed.invalidLines.length) {
      throw new StageError('parse', parsed.invalidLines.map((row) => `第 ${row.lineNumber} 行：${row.reason}`).join('；'), { parsed });
    }
    setStageDone(stages, 'parse', `解析 ${parsed.validLines} 筆`);

    const audit = auditReport(parsed);
    if (audit.status !== '通過') {
      throw new StageError('audit', audit.message, { parsed, audit });
    }
    setStageDone(stages, 'audit', '審計通過');

    const scoring = scoreReport(parsed);
    setStageDone(stages, 'score', '1000 權重計分完成');

    const rankingResult = rankReport(scoring);
    setStageDone(stages, 'rank', `排序完成 ${rankingResult.ranked.length} 人`);
    setStageDone(stages, 'dispatch', `A1 ${rankingResult.groups.A1.length}｜A2 ${rankingResult.groups.A2.length}｜B ${rankingResult.groups.B.length}｜C ${rankingResult.groups.C.length}`);

    const draftSnapshot = buildSnapshot({
      executionId,
      operator,
      source,
      rawText,
      parsed,
      audit,
      scoring,
      rankingResult,
      stages: deepClone(stages),
      files: null,
      status: '通過'
    });

    if (draftSnapshot.confirmation?.status !== '通過') {
      throw new StageError('save', draftSnapshot.confirmation?.message || '確認失敗', {
        parsed,
        audit: mergeAuditWithConfirmation(audit, draftSnapshot.confirmation),
        scoring,
        rankingResult
      });
    }

    setStageDone(stages, 'announcement', `公告 ${draftSnapshot.announcement.length} 字`);
    setStageDone(stages, 'save', '全部確認無誤並完成正式存檔');

    return writeSuccessSnapshot(
      buildSnapshot({
        executionId,
        operator,
        source,
        rawText,
        parsed,
        audit,
        scoring,
        rankingResult,
        stages,
        files: null,
        status: '通過'
      }),
      dataPaths
    );
  } catch (error) {
    const stageKey = error instanceof StageError ? error.stageKey : 'save';
    setStageFailed(stages, stageKey, error.message || '執行失敗');

    const fallbackParsed =
      error instanceof StageError && error.extra?.parsed
        ? error.extra.parsed
        : parseReport(rawText, { previousSnapshot, referenceDate });
    const fallbackAudit =
      error instanceof StageError && error.extra?.audit
        ? error.extra.audit
        : { status: '失敗', message: error.message || '執行失敗', errors: [error.message || '執行失敗'], checks: [] };
    const fallbackScoring =
      error instanceof StageError && error.extra?.scoring
        ? error.extra.scoring
        : { weights: deepClone(SCORE_WEIGHTS), maxima: {}, topScore: 0, averageScore: 0, people: [] };
    const fallbackRanking =
      error instanceof StageError && error.extra?.rankingResult
        ? error.extra.rankingResult
        : { ranked: [], groups: { A1: [], A2: [], B: [], C: [] }, changes: { up: [], down: [], flat: [] } };

    return writeFailureSnapshot(
      buildSnapshot({
        executionId,
        operator,
        source,
        rawText,
        parsed: fallbackParsed,
        audit: fallbackAudit,
        scoring: fallbackScoring,
        rankingResult: fallbackRanking,
        stages,
        files: null,
        status: '失敗'
      }),
      dataPaths
    );
  }
}

function createPreviewSnapshot(rawText, options = {}) {
  const previousSnapshot = options.previousSnapshot || null;
  const referenceDate = options.referenceDate || new Date();
  const analysis = analyze(rawText, { previousSnapshot, referenceDate });
  const stages = createStages();

  if (analysis.parsed.inputLines > 0 && analysis.parsed.invalidLines.length === 0) {
    setStageDone(stages, 'parse', `解析 ${analysis.parsed.validLines} 筆`);
  } else if (analysis.parsed.inputLines > 0) {
    setStageFailed(stages, 'parse', analysis.parsed.invalidLines.map((row) => `第 ${row.lineNumber} 行：${row.reason}`).join('；'));
  }

  if (analysis.audit.status === '通過') {
    const previewSnapshot = buildSnapshot({
      executionId: createExecutionId(),
      operator: options.operator || SYSTEM.defaultOperator,
      source: options.source || 'preview',
      rawText,
      parsed: analysis.parsed,
      audit: analysis.audit,
      scoring: analysis.scoring || { weights: deepClone(SCORE_WEIGHTS), maxima: {}, topScore: 0, averageScore: 0, people: [] },
      rankingResult: analysis.rankingResult || { ranked: [], groups: { A1: [], A2: [], B: [], C: [] }, changes: { up: [], down: [], flat: [] } },
      stages: deepClone(stages),
      files: null,
      status: '通過'
    });

    analysis.audit = mergeAuditWithConfirmation(analysis.audit, previewSnapshot.confirmation);

    setStageDone(stages, 'audit', '審計通過');
    setStageDone(stages, 'score', '1000 權重計分完成');
    setStageDone(stages, 'rank', `排序完成 ${analysis.rankingResult.ranked.length} 人`);
    setStageDone(
      stages,
      'dispatch',
      `A1 ${analysis.rankingResult.groups.A1.length}｜A2 ${analysis.rankingResult.groups.A2.length}｜B ${analysis.rankingResult.groups.B.length}｜C ${analysis.rankingResult.groups.C.length}`
    );

    if (previewSnapshot.confirmation?.status === '通過') {
      setStageDone(stages, 'announcement', '公告預覽完成');
    } else {
      setStageFailed(stages, 'announcement', previewSnapshot.confirmation.message);
    }
  } else {
    setStageFailed(stages, 'audit', analysis.audit.message);
  }

  const preview = buildSnapshot({
    executionId: createExecutionId(),
    operator: options.operator || SYSTEM.defaultOperator,
    source: options.source || 'preview',
    rawText,
    parsed: analysis.parsed,
    audit: analysis.audit,
    scoring: analysis.scoring || { weights: deepClone(SCORE_WEIGHTS), maxima: {}, topScore: 0, averageScore: 0, people: [] },
    rankingResult: analysis.rankingResult || { ranked: [], groups: { A1: [], A2: [], B: [], C: [] }, changes: { up: [], down: [], flat: [] } },
    stages,
    files: null,
    status: analysis.audit.status === '通過' && !analysis.audit.errors?.length && stages.every((stage) => stage.status !== 'failed') ? '通過' : '失敗'
  });

  if (preview.confirmation?.status !== '通過') {
    preview.status = '失敗';
  }

  return preview;
}

function buildStorageEntry(snapshot, fileName) {
  return {
    executionId: snapshot.executionId,
    status: snapshot.status,
    auditStatus: snapshot.audit?.status || '',
    confirmationStatus: snapshot.confirmation?.status || '',
    reportDate: snapshot.reportDate,
    dispatchDate: snapshot.dispatchDate,
    completedAt: snapshot.completedAt,
    operator: snapshot.operator,
    topName: snapshot.ranking?.[0]?.name || '',
    totalPeople: snapshot.summary?.totalPeople || 0,
    activePeople: snapshot.summary?.activePeople || 0,
    archiveFile: snapshot.files?.archiveFile || fileName,
    message: snapshot.confirmation?.message || snapshot.audit?.message || ''
  };
}

function listStoredSnapshots(paths, options = {}) {
  ensureDirs(paths);
  const reportDate = String(options.reportDate || '').trim();
  const status = String(options.status || '').trim();
  const limit = Math.max(1, Math.min(toNumber(options.limit) || 30, 200));

  const entries = fs
    .readdirSync(paths.archiveDir)
    .filter((fileName) => fileName.endsWith('.json'))
    .map((fileName) => {
      const snapshot = readJson(path.join(paths.archiveDir, fileName));
      if (!snapshot || !snapshot.executionId) return null;
      return buildStorageEntry(snapshot, fileName);
    })
    .filter(Boolean)
    .filter((entry) => (!reportDate || entry.reportDate === reportDate) && (!status || entry.status === status))
    .sort((left, right) => toNumber(right.executionId) - toNumber(left.executionId));

  return entries.slice(0, limit);
}

function loadStoredSnapshot(paths, executionId) {
  ensureDirs(paths);
  const normalizedId = String(executionId || '').trim();
  if (!normalizedId) return null;

  const archiveFile = fs
    .readdirSync(paths.archiveDir)
    .find((fileName) => fileName.endsWith('.json') && fileName.includes(normalizedId));

  if (!archiveFile) return null;
  return readJson(path.join(paths.archiveDir, archiveFile));
}

function buildDefaultRawReport(referenceDate = new Date(), previousSnapshot = null) {
  const baseline = buildBaseline(referenceDate, previousSnapshot);
  return [
    `報表日期：${baseline.reportDate}`,
    `派單日期：${baseline.dispatchDate}`,
    ...baseline.people.map(
      (person, index) =>
        `${index + 1}、${person.name}｜【追續】${person.renewalDeals}｜【續單】${person.renewalRevenue}｜【總業績】${person.totalRevenue}`
    )
  ].join('\n');
}

function extractDates(rawText, defaults) {
  const lines = String(rawText || '')
    .replace(/\r/g, '')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);

  let reportDate = defaults.reportDate;
  let dispatchDate = defaults.dispatchDate;
  const dataLines = [];

  for (const line of lines) {
    const reportMatch = line.match(/^報表日期[:：]\s*(.+)$/u);
    if (reportMatch) {
      reportDate = reportMatch[1].trim();
      continue;
    }

    const dispatchMatch = line.match(/^派單日期[:：]\s*(.+)$/u);
    if (dispatchMatch) {
      dispatchDate = dispatchMatch[1].trim();
      continue;
    }

    if (/^\d+/u.test(line)) {
      dataLines.push(line);
    }
  }

  return { reportDate, dispatchDate, dataLines };
}

function parseMetricSegment(segment) {
  const match = String(segment || '').match(/^【?\s*([^】:：]+)\s*】?\s*[:：]?\s*(-?[\d,]+(?:\.\d+)?)$/u);
  if (!match) return null;

  const label = normalizeName(match[1]);
  const value = toNumber(String(match[2]).replace(/,/g, ''));
  let key = '';

  if (label.includes('總業績')) key = 'totalRevenue';
  else if (label.includes('續單')) key = 'renewalRevenue';
  else if (label.includes('追續')) key = 'renewalDeals';
  else if (label.includes('當日實收') || label === '實收') key = 'dailyReceived';
  else if (label.includes('當日客單價')) key = 'dailyTicket';
  else if (label.includes('本月業績')) key = 'currentMonthRevenue';
  else if (label.includes('上月業績')) key = 'lastMonthRevenue';
  else if (label.includes('整體客單價')) key = 'overallTicket';

  if (!key) return null;
  return { key, value };
}

function parseReport(rawText, options = {}) {
  const previousSnapshot = options.previousSnapshot || null;
  const referenceDate = options.referenceDate || new Date();
  const baseline = buildBaseline(referenceDate, previousSnapshot);
  const baselineMap = new Map(baseline.people.map((person) => [person.name, person]));
  const previousRankMap = buildPreviousRankMap(previousSnapshot);
  const { reportDate, dispatchDate, dataLines } = extractDates(rawText, baseline);

  const parsedRows = [];
  const invalidLines = [];

  dataLines.forEach((line, index) => {
    const segments = line
      .split(/[|｜]/u)
      .map((segment) => segment.trim())
      .filter(Boolean);

    const headerMatch = segments[0]?.match(/^(\d+)\s*[、.．]?\s*(.+)$/u);
    if (!headerMatch) {
      invalidLines.push({ lineNumber: index + 1, rawLine: line, reason: '姓名格式錯誤' });
      return;
    }

    const originalName = normalizeName(headerMatch[2]);
    const name = originalName === '徐華好' ? '徐華妤' : originalName;
    const metrics = {};

    for (const segment of segments.slice(1)) {
      const metric = parseMetricSegment(segment);
      if (!metric) {
        invalidLines.push({ lineNumber: index + 1, rawLine: line, reason: `欄位格式錯誤：${segment}` });
        return;
      }
      metrics[metric.key] = metric.value;
    }

    if (!Object.prototype.hasOwnProperty.call(metrics, 'renewalDeals')) {
      invalidLines.push({ lineNumber: index + 1, rawLine: line, reason: '缺少追續欄位' });
      return;
    }
    if (!Object.prototype.hasOwnProperty.call(metrics, 'renewalRevenue')) {
      invalidLines.push({ lineNumber: index + 1, rawLine: line, reason: '缺少續單欄位' });
      return;
    }
    if (!Object.prototype.hasOwnProperty.call(metrics, 'totalRevenue')) {
      invalidLines.push({ lineNumber: index + 1, rawLine: line, reason: '缺少總業績欄位' });
      return;
    }

    const baselinePerson = baselineMap.get(name);
    const dailyReceived = Object.prototype.hasOwnProperty.call(metrics, 'dailyReceived') ? metrics.dailyReceived : metrics.totalRevenue;
    const dailyTicket = Object.prototype.hasOwnProperty.call(metrics, 'dailyTicket')
      ? metrics.dailyTicket
      : metrics.renewalDeals > 0
      ? round(dailyReceived / metrics.renewalDeals, 2)
      : 0;

    parsedRows.push({
      lineNumber: index + 1,
      inputOrder: index,
      inputRank: toNumber(headerMatch[1]),
      rawLine: line,
      originalName,
      name,
      renewalDeals: metrics.renewalDeals,
      renewalRevenue: metrics.renewalRevenue,
      totalRevenue: metrics.totalRevenue,
      currentMonthRevenue: Object.prototype.hasOwnProperty.call(metrics, 'currentMonthRevenue')
        ? metrics.currentMonthRevenue
        : metrics.totalRevenue,
      dailyReceived,
      dailyTicket,
      lastMonthRevenue: Object.prototype.hasOwnProperty.call(metrics, 'lastMonthRevenue')
        ? metrics.lastMonthRevenue
        : baselinePerson?.lastMonthRevenue ?? 0,
      overallTicket: Object.prototype.hasOwnProperty.call(metrics, 'overallTicket')
        ? metrics.overallTicket
        : baselinePerson?.overallTicket ?? 0,
      previousRank: previousRankMap.get(name) || baselinePerson?.previousRank || 0,
      aliasUsed: originalName !== name,
      baselineFound: Boolean(baselinePerson)
    });
  });

  const duplicateNames = [];
  const seenNames = new Set();
  parsedRows.forEach((row) => {
    if (seenNames.has(row.name)) duplicateNames.push(row.name);
    seenNames.add(row.name);
  });

  const unknownNames = parsedRows.filter((row) => !baselineMap.has(row.name)).map((row) => row.name);
  const aliasRows = parsedRows
    .filter((row) => row.aliasUsed)
    .map((row) => ({ originalName: row.originalName, correctedName: row.name }));

  const mergedPeople = baseline.people.map((baselinePerson, baselineIndex) => {
    const found = parsedRows.find((row) => row.name === baselinePerson.name);
    if (found) {
      return {
        ...found,
        baselineIndex,
        inReport: true
      };
    }

    return {
      lineNumber: null,
      inputOrder: 1000 + baselineIndex,
      inputRank: 0,
      rawLine: '',
      originalName: baselinePerson.name,
      name: baselinePerson.name,
      renewalDeals: 0,
      renewalRevenue: 0,
      totalRevenue: 0,
      currentMonthRevenue: 0,
      dailyReceived: 0,
      dailyTicket: 0,
      lastMonthRevenue: baselinePerson.lastMonthRevenue,
      overallTicket: baselinePerson.overallTicket,
      previousRank: previousRankMap.get(baselinePerson.name) || baselinePerson.previousRank,
      aliasUsed: false,
      baselineFound: true,
      baselineIndex,
      inReport: false
    };
  });

  parsedRows
    .filter((row) => !baselineMap.has(row.name))
    .forEach((row, index) => {
      mergedPeople.push({
        ...row,
        baselineIndex: 1000 + index,
        inReport: true
      });
    });

  return {
    reportDate,
    dispatchDate,
    rawText: String(rawText || '').replace(/\r/g, ''),
    inputLines: dataLines.length,
    validLines: parsedRows.length,
    invalidLines,
    duplicateNames: [...new Set(duplicateNames)],
    unknownNames: [...new Set(unknownNames)],
    aliasRows,
    people: mergedPeople
  };
}

function auditReport(parsed) {
  const errors = [];
  const checks = [];

  const check = (label, passed, detail) => {
    checks.push({ label, status: passed ? '通過' : '失敗', detail: passed ? '' : detail });
    if (!passed && detail) errors.push(detail);
  };

  check('有輸入資料', parsed.inputLines > 0, '沒有貼入業績日報文字');
  check(
    '格式正確',
    parsed.invalidLines.length === 0,
    parsed.invalidLines.map((row) => `第 ${row.lineNumber} 行：${row.reason}`).join('；')
  );
  check(
    '無重複姓名',
    parsed.duplicateNames.length === 0,
    `重複姓名：${parsed.duplicateNames.join('、')}`
  );
  check(
    '無未知姓名',
    parsed.unknownNames.length === 0,
    `白名單外姓名：${parsed.unknownNames.join('、')}`
  );
  check(
    '姓名修正一致',
    parsed.aliasRows.length === 0,
    parsed.aliasRows.map((row) => `${row.originalName} → ${row.correctedName}`).join('；')
  );

  const numericErrors = [];
  const negativeErrors = [];
  const revenueErrors = [];
  const dealErrors = [];
  const fieldErrors = [];

  parsed.people.forEach((person) => {
    [
      ['renewalDeals', '追續成交總數'],
      ['renewalRevenue', '續單金額'],
      ['totalRevenue', '總業績'],
      ['dailyReceived', '當日實收金額'],
      ['dailyTicket', '當日客單價'],
      ['currentMonthRevenue', '本月業績'],
      ['lastMonthRevenue', '上月業績'],
      ['overallTicket', '整體客單價'],
      ['previousRank', '前一輪名次']
    ].forEach(([key, label]) => {
      if (!Number.isFinite(Number(person[key]))) numericErrors.push(`${person.name}｜${label} 不是數字`);
      if (toNumber(person[key]) < 0) negativeErrors.push(`${person.name}｜${label} 不可為負數`);
    });

    if (toNumber(person.totalRevenue) < toNumber(person.renewalRevenue)) {
      revenueErrors.push(`${person.name}｜總業績不可小於續單金額`);
    }

    if (toNumber(person.renewalDeals) > 0 && toNumber(person.totalRevenue) === 0) {
      dealErrors.push(`${person.name}｜有追續成交但總業績為 0`);
    }

    if (person.inReport && person.lineNumber == null) {
      fieldErrors.push(`${person.name}｜缺少原始排序欄位`);
    }
  });

  check('排序欄位完整', fieldErrors.length === 0, fieldErrors.join('；'));
  check('數字格式正確', numericErrors.length === 0, numericErrors.join('；'));
  check('無負數', negativeErrors.length === 0, negativeErrors.join('；'));
  check('總業績不小於續單', revenueErrors.length === 0, revenueErrors.join('；'));
  check('有成交不得零業績', dealErrors.length === 0, dealErrors.join('；'));

  return {
    status: errors.length ? '失敗' : '通過',
    message: errors.length ? errors[0] : '審計通過，可進入 1000 權重排序。',
    errors,
    checks
  };
}

function buildStorageEntry(snapshot, fileName) {
  return {
    executionId: snapshot.executionId,
    status: snapshot.status,
    auditStatus: snapshot.audit?.status || '',
    confirmationStatus: snapshot.confirmation?.status || snapshot.audit?.status || '',
    reportDate: snapshot.reportDate,
    dispatchDate: snapshot.dispatchDate,
    completedAt: snapshot.completedAt,
    operator: snapshot.operator,
    topName: snapshot.ranking?.[0]?.name || '',
    totalPeople: snapshot.summary?.totalPeople || 0,
    activePeople: snapshot.summary?.activePeople || 0,
    archiveFile: snapshot.files?.archiveFile || fileName,
    message: snapshot.confirmation?.message || snapshot.audit?.message || ''
  };
}

function summarizeStoredSnapshotsByDate(paths, options = {}) {
  const limit = Math.max(1, Math.min(toNumber(options.limit) || 60, 365));
  const entries = listStoredSnapshots(paths, { limit: 5000 });
  const groups = new Map();

  entries.forEach((entry) => {
    const reportDate = String(entry.reportDate || '').trim() || '未標記日期';
    const current = groups.get(reportDate) || {
      reportDate,
      total: 0,
      confirmed: 0,
      failed: 0,
      latestExecutionId: '',
      latestCompletedAt: '',
      latestArchiveFile: '',
      latestStatus: '',
      latestMessage: ''
    };

    current.total += 1;
    if (entry.confirmationStatus === '通過' || entry.status === '通過') current.confirmed += 1;
    if (entry.confirmationStatus === '失敗' || entry.status === '失敗') current.failed += 1;

    if (toNumber(entry.executionId) > toNumber(current.latestExecutionId)) {
      current.latestExecutionId = entry.executionId;
      current.latestCompletedAt = entry.completedAt || '';
      current.latestArchiveFile = entry.archiveFile || '';
      current.latestStatus = entry.confirmationStatus || entry.status || '';
      current.latestMessage = entry.message || '';
    }

    groups.set(reportDate, current);
  });

  return [...groups.values()]
    .sort((left, right) => toNumber(right.latestExecutionId) - toNumber(left.latestExecutionId))
    .slice(0, limit);
}

module.exports = {
  SYSTEM,
  BASELINE_SEEDS,
  BIGDATA_ADVICE_BASELINE,
  SCORE_WEIGHTS,
  STAGES,
  analyze,
  buildDefaultRawReport,
  buildExpectedChanges,
  buildExpectedGroups,
  createPreviewSnapshot,
  ensureDirs,
  ensureInitialized,
  listStoredSnapshots,
  summarizeStoredSnapshotsByDate,
  loadStoredSnapshot,
  loadLatestSnapshot,
  money,
  parseReport,
  percent,
  compareRankPeople,
  rankReport,
  runFullPipeline,
  scoreReport,
  taipeiNow,
  groupKey,
  auditReport
};
