const https = require('https');
const { LINE_CHANNEL_ACCESS_TOKEN } = process.env;

/**
 * 發送文字訊息至 LINE 使用者 (push)
 * @param {string} userId LINE 使用者 ID (或 roomId/groupId)
 * @param {string} text 要傳送的文字訊息
 * @returns {Promise<object>} 成功回應或拋出錯誤
 */
function sendLineMessage(userId, text) {
  return new Promise((resolve, reject) => {
    if (!LINE_CHANNEL_ACCESS_TOKEN) {
      return reject(new Error('LINE_CHANNEL_ACCESS_TOKEN 未設定於環境變數'));
    }
    const data = JSON.stringify({
      to: userId,
      messages: [{ type: 'text', text }]
    });
    const options = {
      hostname: 'api.line.me',
      path: '/v2/bot/message/push',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${LINE_CHANNEL_ACCESS_TOKEN}`,
        'Content-Length': Buffer.byteLength(data)
      }
    };
    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(JSON.parse(body || '{}'));
        } else {
          const err = new Error(`LINE API 錯誤 ${res.statusCode}`);
          err.response = body;
          reject(err);
        }
      });
    });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

module.exports = { sendLineMessage };
