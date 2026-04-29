const LINE_API = 'https://api.line.me';
const RETRY_DELAYS_MS = [500, 1500, 4000];
const DEFAULT_TIMEOUT_MS = 10000;

function getToken() {
  const token = process.env.LINE_CHANNEL_ACCESS_TOKEN;
  if (!token) throw new Error('LINE_CHANNEL_ACCESS_TOKEN 未設定於環境變數');
  return token;
}

async function linePost(path, body) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS);
  try {
    const res = await fetch(`${LINE_API}${path}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getToken()}`
      },
      body: JSON.stringify(body),
      signal: controller.signal
    });
    const text = await res.text();
    if (res.ok) return text ? JSON.parse(text) : {};
    const err = new Error(`LINE API 錯誤 ${res.status}`);
    err.status = res.status;
    err.response = text;
    throw err;
  } finally {
    clearTimeout(timer);
  }
}

async function withRetry(fn) {
  let lastErr;
  for (let i = 0; i <= RETRY_DELAYS_MS.length; i++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      if (err.status !== 429 || i >= RETRY_DELAYS_MS.length) throw err;
      await new Promise(r => setTimeout(r, RETRY_DELAYS_MS[i]));
    }
  }
  throw lastErr;
}

async function sendLineMessage(userId, text) {
  return withRetry(() => linePost('/v2/bot/message/push', {
    to: userId,
    messages: [{ type: 'text', text }]
  }));
}

async function sendLineMulticast(userIds, text) {
  if (!Array.isArray(userIds) || userIds.length === 0) {
    throw new Error('userIds 必須為非空陣列');
  }
  const chunks = [];
  for (let i = 0; i < userIds.length; i += 500) {
    chunks.push(userIds.slice(i, i + 500));
  }
  return Promise.all(
    chunks.map(chunk => withRetry(() => linePost('/v2/bot/message/multicast', {
      to: chunk,
      messages: [{ type: 'text', text }]
    })))
  );
}

module.exports = { sendLineMessage, sendLineMulticast };
