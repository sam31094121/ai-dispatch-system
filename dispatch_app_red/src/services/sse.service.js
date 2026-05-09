const fs = require('fs');
const path = require('path');

/**
 * SSE Service - 實現全線即時串連
 * 監聽資料檔案變動，並即時推送到所有連接的前端。
 */

let clients = [];

function addClient(res) {
  const clientId = Date.now();
  const newClient = {
    id: clientId,
    res
  };
  clients.push(newClient);

  // 設置 SSE 標頭
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive'
  });

  // 發送初始成功訊息
  res.write(`data: ${JSON.stringify({ type: 'connected', clientId })}\n\n`);

  return clientId;
}

function removeClient(clientId) {
  clients = clients.filter(c => c.id !== clientId);
}

function broadcastUpdate(data) {
  const payload = JSON.stringify(data);
  clients.forEach(client => {
    client.res.write(`data: ${payload}\n\n`);
  });
}

/**
 * 監聽資料目錄
 */
function initDataWatcher(storageRoot) {
  const latestJson = path.join(storageRoot, 'latest.json');
  
  if (fs.existsSync(latestJson)) {
    console.log(`[SSE] 開始監聽資料變動: ${latestJson}`);
    
    // 使用 watchFile 較穩定（適用於某些網路硬碟或環境）
    fs.watchFile(latestJson, (curr, prev) => {
      if (curr.mtime > prev.mtime) {
        console.log('[SSE] 偵測到資料更新，正在推送到全端...');
        broadcastUpdate({ 
          type: 'data_updated', 
          timestamp: new Date().toISOString(),
          version: Date.now() 
        });
      }
    });
  }
}

module.exports = {
  addClient,
  removeClient,
  broadcastUpdate,
  initDataWatcher
};
