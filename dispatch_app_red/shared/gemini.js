const fs = require('fs');
const path = require('path');

const cloneValue = typeof globalThis.structuredClone === 'function'
  ? (value) => globalThis.structuredClone(value)
  : (value) => JSON.parse(JSON.stringify(value));
const envCache = new Map();

const DEFAULT_MODEL = 'gemini-2.0-flash';
const DEFAULT_API_VERSION = 'v1beta';
const DEFAULT_BASE_URL = 'https://generativelanguage.googleapis.com';
const PASS_STATUSES = new Set(['通過', 'PASS', 'done', 'published', '??']);
const VALID_TONES = new Set(['green', 'red', 'cyan', 'orange', 'gold', 'violet']);

function deepClone(value) {
  return cloneValue(value);
}

function parseEnvFile(appDir) {
  const envFile = path.join(appDir, '.env');
  if (!fs.existsSync(envFile)) {
    envCache.delete(envFile);
    return {};
  }

  const stats = fs.statSync(envFile);
  const cached = envCache.get(envFile);
  if (cached && cached.mtimeMs === stats.mtimeMs) {
    return cached.values;
  }

  const values = {};
  const source = fs.readFileSync(envFile, 'utf8').replace(/^\uFEFF/, '');
  source.split(/\r?\n/).forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return;

    const separatorIndex = trimmed.indexOf('=');
    if (separatorIndex <= 0) return;

    const key = trimmed.slice(0, separatorIndex).trim();
    let value = trimmed.slice(separatorIndex + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    values[key] = value;
  });

  envCache.set(envFile, { mtimeMs: stats.mtimeMs, values });
  return values;
}

function getGeminiRuntime(appDir) {
  const fileEnv = parseEnvFile(appDir);
  const read = (key, fallback = '') => process.env[key] || fileEnv[key] || fallback;
  const apiKey = read('GEMINI_API_KEY');

  return {
    provider: 'gemini',
    configured: Boolean(apiKey),
    apiKey,
    model: read('GEMINI_MODEL', DEFAULT_MODEL),
    apiVersion: read('GEMINI_API_VERSION', DEFAULT_API_VERSION),
    baseUrl: read('GEMINI_BASE_URL', DEFAULT_BASE_URL)
  };
}

function isPassStatus(value) {
  return PASS_STATUSES.has(String(value || '').trim());
}

function normalizeTone(value) {
  const tone = String(value || '').trim().toLowerCase();
  return VALID_TONES.has(tone) ? tone : 'gold';
}

function normalizeCards(cards) {
  if (!Array.isArray(cards)) return [];

  return cards
    .map((card) => ({
      label: String(card?.label || '').trim(),
      value: String(card?.value || '').trim(),
      detail: String(card?.detail || '').trim(),
      tone: normalizeTone(card?.tone)
    }))
    .filter((card) => card.label && card.value)
    .slice(0, 4);
}

function normalizeLines(lines) {
  if (!Array.isArray(lines)) return [];

  return lines
    .map((line) => String(line || '').replace(/\r/g, '').trim())
    .filter(Boolean)
    .slice(0, 6);
}

function buildFacts(snapshot) {
  return {
    executionId: snapshot.executionId,
    reportDate: snapshot.reportDate,
    dispatchDate: snapshot.dispatchDate,
    summary: snapshot.summary,
    audit: {
      status: snapshot.audit?.status || '',
      message: snapshot.audit?.message || ''
    },
    confirmation: {
      status: snapshot.confirmation?.status || '',
      message: snapshot.confirmation?.message || ''
    },
    ranking: Array.isArray(snapshot.ranking || snapshot.rankings)
      ? (snapshot.ranking || snapshot.rankings).map((person) => ({
          rank: person.rank,
          name: person.name,
          totalScore: person.totalScore,
          totalRevenue: person.totalRevenue,
          renewalRevenue: person.renewalRevenue,
          renewalDeals: person.renewalDeals,
          group: person.group,
          movement: person.movement
        }))
      : [],
    groups: snapshot.groups || { A1: [], A2: [], B: [], C: [] },
    changes: snapshot.changes || { up: [], down: [], flat: [] },
    ruleBasedInsights: snapshot.aiInsights || { cards: [], lines: [] },
    ruleBasedAnnouncement: String(snapshot.announcement || '')
  };
}

function stripCodeFence(text) {
  const value = String(text || '').trim();
  if (!value.startsWith('```')) return value;

  return value
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/, '')
    .trim();
}

function extractResponseText(payload) {
  const parts = payload?.candidates?.[0]?.content?.parts;
  if (!Array.isArray(parts)) return '';
  return parts
    .map((part) => part?.text || '')
    .join('\n')
    .trim();
}

function parseOverlay(text) {
  const cleaned = stripCodeFence(text);
  const firstBrace = cleaned.indexOf('{');
  const lastBrace = cleaned.lastIndexOf('}');
  const jsonText =
    firstBrace >= 0 && lastBrace > firstBrace ? cleaned.slice(firstBrace, lastBrace + 1) : cleaned;

  return JSON.parse(jsonText);
}

function buildRequest(snapshot) {
  const facts = buildFacts(snapshot);
  const schemaHint = {
    cards: [{ label: 'string', value: 'string', detail: 'string', tone: 'gold' }],
    lines: ['string'],
    announcement: 'string'
  };

  const prompt = [
    'Generate a complete AI dispatch announcement and dashboard insights.',
    'Write all user-facing text in Traditional Chinese used in Taiwan.',
    'Use an executive, motivational, pressure-aware sales-operations tone.',
    'Do not invent or modify names, rankings, groups, scores, counts, money, audit results, or platform names.',
    'Use only the supplied facts. If a platform name or platform-specific audit result is absent, do not mention that platform.',
    'Return JSON only.',
    'cards: maximum 4 items.',
    'lines: maximum 6 items.',
    'tone must be one of green, red, cyan, orange, gold, violet.',
    'announcement must be a polished multi-line internal announcement with preserved factual accuracy.',
    'announcement must follow this structure:',
    '1. 【AI 派單公告｜reportDate 結算 → dispatchDate 派單順序】',
    '2. 審計結論: use the supplied audit and confirmation statuses only.',
    '3. 整合總盤: summarize available totals from summary only.',
    '4. 今日整合名次: list every ranked person in exact supplied order.',
    '5. 名次異動重點: summarize supplied changes only.',
    '6. 明日 AI 派單順序: list A1/A2/B/C from supplied groups only.',
    '7. 執行規則（鎖死）: include order-first, no jump, no override, callback-to-original-owner rules.',
    '8. 每人一句：建議＋激勵＋壓力: include every ranked person once, based only on their supplied metrics.',
    '9. 最後確認: ask everyone to reply +1.',
    '',
    'JSON shape:',
    JSON.stringify(schemaHint, null, 2),
    '',
    'Facts:',
    JSON.stringify(facts, null, 2)
  ].join('\n');

  return {
    systemInstruction: {
      parts: [
        {
          text: 'You are a careful dispatch-writing assistant. Preserve business facts exactly, and output valid JSON only.'
        }
      ]
    },
    contents: [
      {
        role: 'user',
        parts: [{ text: prompt }]
      }
    ],
    generationConfig: {
      responseMimeType: 'application/json',
      temperature: 0.35,
      maxOutputTokens: 5000
    },
    store: false
  };
}

async function requestGemini(snapshot, runtime) {
  const controller = new AbortController();
  const timeoutMs = 8000;
  let timeout;
  const timeoutPromise = new Promise((_, reject) => {
    timeout = setTimeout(() => {
      controller.abort();
      reject(new Error(`Gemini request timed out after ${timeoutMs}ms.`));
    }, timeoutMs);
  });

  try {
    const fetchPromise = fetch(
      `${runtime.baseUrl}/${runtime.apiVersion}/models/${runtime.model}:generateContent`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': runtime.apiKey
        },
        body: JSON.stringify(buildRequest(snapshot)),
        signal: controller.signal
      }
    );

    const response = await Promise.race([fetchPromise, timeoutPromise]);

    const payload = await response.json().catch(() => null);

    if (!response.ok) {
      const message =
        payload?.error?.message ||
        payload?.message ||
        `Gemini request failed with HTTP ${response.status}`;
      throw new Error(message);
    }

    if (payload?.promptFeedback?.blockReason) {
      throw new Error(`Gemini blocked the request: ${payload.promptFeedback.blockReason}`);
    }

    const text = extractResponseText(payload);
    if (!text) {
      throw new Error('Gemini returned an empty response.');
    }

    return parseOverlay(text);
  } finally {
    clearTimeout(timeout);
  }
}

function buildProviderMeta(runtime, overrides = {}) {
  return {
    provider: runtime.provider,
    configured: runtime.configured,
    model: runtime.model,
    apiVersion: runtime.apiVersion,
    mode: 'overlay',
    source: 'backend',
    ...overrides
  };
}

function cloneSnapshotWithProvider(snapshot, providerMeta) {
  return {
    ...deepClone(snapshot),
    aiProvider: providerMeta
  };
}

async function enhanceSnapshotWithGemini(snapshot, options = {}) {
  if (!snapshot) {
    return { snapshot, changed: false };
  }

  const runtime = getGeminiRuntime(options.appDir || process.cwd());

  if (snapshot?.aiProvider?.status === 'connected') {
    return { snapshot, changed: false };
  }

  if (!runtime.configured) {
    return {
      snapshot: cloneSnapshotWithProvider(snapshot, buildProviderMeta(runtime, { status: 'not_configured' })),
      changed: Boolean(!snapshot?.aiProvider)
    };
  }

  const ready =
    isPassStatus(snapshot.status) &&
    isPassStatus(snapshot.audit?.status) &&
    isPassStatus(snapshot.confirmation?.status) &&
    Array.isArray(snapshot.ranking || snapshot.rankings) &&
    (snapshot.ranking || snapshot.rankings).length > 0;

  if (!ready) {
    return {
      snapshot: cloneSnapshotWithProvider(snapshot, buildProviderMeta(runtime, { status: 'skipped' })),
      changed: true
    };
  }

  try {
    const overlay = await requestGemini(snapshot, runtime);
    const cards = normalizeCards(overlay?.cards);
    const lines = normalizeLines(overlay?.lines);
    const announcement = String(overlay?.announcement || '').replace(/\r/g, '').trim();

    if (!cards.length && !lines.length && !announcement) {
      throw new Error('Gemini returned no usable overlay content.');
    }

    const nextSnapshot = deepClone(snapshot);
    nextSnapshot.ruleBasedAiInsights = nextSnapshot.ruleBasedAiInsights || deepClone(nextSnapshot.aiInsights);
    nextSnapshot.ruleBasedAnnouncement = nextSnapshot.ruleBasedAnnouncement || String(nextSnapshot.announcement || '');
    nextSnapshot.aiInsights = {
      cards: cards.length ? cards : deepClone(nextSnapshot.ruleBasedAiInsights?.cards || []),
      lines: lines.length ? lines : deepClone(nextSnapshot.ruleBasedAiInsights?.lines || [])
    };
    nextSnapshot.announcement = announcement || nextSnapshot.ruleBasedAnnouncement;
    nextSnapshot.aiProvider = buildProviderMeta(runtime, {
      status: 'connected',
      generatedAt: new Date().toISOString(),
      usedFallbackCards: !cards.length,
      usedFallbackLines: !lines.length,
      usedFallbackAnnouncement: !announcement
    });

    return { snapshot: nextSnapshot, changed: true };
  } catch (error) {
    return {
      snapshot: cloneSnapshotWithProvider(
        snapshot,
        buildProviderMeta(runtime, {
          status: 'fallback',
          error: error.message || 'Gemini request failed.'
        })
      ),
      changed: true
    };
  }
}

module.exports = {
  enhanceSnapshotWithGemini,
  getGeminiRuntime
};
