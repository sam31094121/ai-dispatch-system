const fs = require('fs');
const path = require('path');

const HEARTBEAT_INTERVAL_MS = 25000;
const FILE_EVENT_DEBOUNCE_MS = 250;

let clients = [];
let nextClientId = 1;
let heartbeatTimer = null;
let activeWatcher = null;
let activeWatchFile = null;
let lastBroadcastAt = 0;
let lastKnownMtimeMs = 0;

function writeEvent(client, data) {
  try {
    client.res.write(`data: ${JSON.stringify(data)}\n\n`);
    return true;
  } catch {
    return false;
  }
}

function ensureHeartbeat() {
  if (heartbeatTimer || clients.length === 0) return;

  heartbeatTimer = setInterval(() => {
    clients = clients.filter((client) => writeEvent(client, {
      type: 'heartbeat',
      timestamp: new Date().toISOString()
    }));

    if (clients.length === 0) {
      clearInterval(heartbeatTimer);
      heartbeatTimer = null;
    }
  }, HEARTBEAT_INTERVAL_MS);

  heartbeatTimer.unref?.();
}

function addClient(res) {
  const clientId = nextClientId++;
  const newClient = { id: clientId, res };
  clients.push(newClient);

  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache, no-transform',
    'Connection': 'keep-alive',
    'X-Accel-Buffering': 'no'
  });
  res.flushHeaders?.();

  writeEvent(newClient, {
    type: 'connected',
    clientId,
    timestamp: new Date().toISOString()
  });
  ensureHeartbeat();

  return clientId;
}

function removeClient(clientId) {
  clients = clients.filter((client) => client.id !== clientId);

  if (clients.length === 0 && heartbeatTimer) {
    clearInterval(heartbeatTimer);
    heartbeatTimer = null;
  }
}

function broadcastUpdate(data) {
  if (clients.length === 0) return;
  clients = clients.filter((client) => writeEvent(client, data));
}

function notifyDataUpdated(meta = {}) {
  const now = Date.now();
  if (now - lastBroadcastAt < FILE_EVENT_DEBOUNCE_MS) return;
  lastBroadcastAt = now;

  broadcastUpdate({
    type: 'data_updated',
    timestamp: new Date().toISOString(),
    ...meta,
    version: now
  });
}

function stopDataWatcher() {
  if (activeWatcher) {
    activeWatcher.close();
    activeWatcher = null;
  }

  if (activeWatchFile) {
    fs.unwatchFile(activeWatchFile);
    activeWatchFile = null;
  }
}

function readMtimeMs(filePath) {
  try {
    return fs.statSync(filePath).mtimeMs;
  } catch {
    return 0;
  }
}

function handleFileChange(filePath) {
  const nextMtimeMs = readMtimeMs(filePath);
  if (nextMtimeMs <= lastKnownMtimeMs) return;

  lastKnownMtimeMs = nextMtimeMs;
  console.log('[SSE] latest.json updated, broadcasting sync event.');
  notifyDataUpdated({ source: 'file-watch' });
}

function initPollingWatcher(latestJson) {
  activeWatchFile = latestJson;
  fs.watchFile(latestJson, { interval: 1000 }, (curr, prev) => {
    if (curr.mtimeMs > prev.mtimeMs) handleFileChange(latestJson);
  });
}

function initDataWatcher(storageRoot) {
  const latestJson = path.join(storageRoot, 'latest.json');

  stopDataWatcher();
  fs.mkdirSync(storageRoot, { recursive: true });
  lastKnownMtimeMs = readMtimeMs(latestJson);
  console.log(`[SSE] watching dispatch data: ${latestJson}`);

  try {
    activeWatcher = fs.watch(storageRoot, (eventType, fileName) => {
      if (eventType === 'rename' && !fs.existsSync(latestJson)) return;
      if (!fileName || path.basename(String(fileName)) === 'latest.json') {
        setTimeout(() => handleFileChange(latestJson), FILE_EVENT_DEBOUNCE_MS);
      }
    });
    activeWatcher.on('error', () => {
      stopDataWatcher();
      initPollingWatcher(latestJson);
    });
    activeWatcher.unref?.();
  } catch {
    initPollingWatcher(latestJson);
  }
}

module.exports = {
  addClient,
  removeClient,
  broadcastUpdate,
  initDataWatcher,
  notifyDataUpdated,
  stopDataWatcher
};
