const http = require('http');
const querystring = require('querystring');

const data = JSON.stringify({
  userId: 'U1234567890',
  text: '測試訊息 - 從 Node 執行'
});

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/line/notify',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(data)
  }
};

const req = http.request(options, (res) => {
  let body = '';
  res.on('data', (chunk) => body += chunk);
  res.on('end', () => {
    console.log('Status:', res.statusCode);
    console.log('Response:', body);
  });
});

req.on('error', (e) => {
  console.error('Request error:', e);
});

req.write(data);
req.end();
