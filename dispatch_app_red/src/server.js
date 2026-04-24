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

const server = app.listen(appConfig.port, () => {
  const address = server.address();
  const listenPort = typeof address === 'object' && address ? address.port : appConfig.port;
  const appUrl = `http://localhost:${listenPort}`;

  console.log(`Dispatch app listening at ${appUrl}`);
  scheduleBrowserOpen(appUrl);
});
