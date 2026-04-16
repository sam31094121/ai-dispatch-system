const { spawn } = require('child_process');
const { createApp } = require('./app');

const PORT = Number(process.env.PORT) || 3000;
const app = createApp();

let browserOpenScheduled = false;

function shouldAutoOpenBrowser() {
  return !(
    process.env.AUTO_OPEN_BROWSER === '0' ||
    process.env.NO_BROWSER === '1' ||
    process.env.CI === 'true' ||
    process.env.NODE_ENV === 'test'
  );
}

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

app.listen(PORT, () => {
  const appUrl = `http://localhost:${PORT}`;
  console.log(`AI 派單公告系統 API v1 已啟動：${appUrl}`);
  scheduleBrowserOpen(appUrl);
});
