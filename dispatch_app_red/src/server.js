const { spawn } = require('child_process');
const { createApp } = require('./app');
const { appConfig, shouldAutoOpenBrowser } = require('./config/appConfig');

const app = createApp();

let browserOpenScheduled = false;

function openBrowser(url) {
  if (!shouldAutoOpenBrowser()) return;

  try {
    if (process.platform === 'win32') {
      const child = spawn('cmd', ['/c', 'start', '', url], {
        detached: true,
        stdio: 'ignore',
        windowsHide: true
      });
      child.unref();
      return;
    }

    const command = process.platform === 'darwin' ? 'open' : 'xdg-open';
    const child = spawn(command, [url], {
      detached: true,
      stdio: 'ignore'
    });
    child.unref();
  } catch {
    // ignore browser failures
  }
}

function scheduleBrowserOpen(url) {
  if (browserOpenScheduled || !shouldAutoOpenBrowser()) return;
  browserOpenScheduled = true;
  setTimeout(() => openBrowser(url), 300);
}

const server = app.listen(appConfig.port, async () => {
  const address = server.address();
  const listenPort = typeof address === 'object' && address ? address.port : appConfig.port;
  const appUrl = `http://localhost:${listenPort}`;
  const openPagesStr = process.env.OPEN_PAGES || process.env.OPEN_PAGE || 'mobile.html';
  const openPages = openPagesStr.split(',').map(p => p.trim());

  console.log(`Dispatch app listening at ${appUrl}`);
  
  openPages.forEach((page, index) => {
    setTimeout(() => {
      const targetUrl = page.startsWith('http') ? page : `${appUrl}/${page}`;
      scheduleBrowserOpen(targetUrl);
    }, index * 500);
  });

  // 若設定自動通知環境變數，發送 LINE 訊息
  const { sendLineMessage } = require('./services/lineNotify.service');
  const autoUser = process.env.LINE_AUTO_NOTIFY_USER;
  const autoText = process.env.LINE_AUTO_NOTIFY_TEXT || '系統已啟動';
  if (autoUser) {
    try {
      await sendLineMessage(autoUser, autoText);
      console.log('自動 LINE 訊息已發送');
    } catch (e) {
      console.error('自動 LINE 訊息失敗:', e.message);
    }
  }


});
// Trigger nodemon restart
