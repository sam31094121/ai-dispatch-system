const { spawn } = require('child_process');
const http = require('http');
const path = require('path');
const fs = require('fs');

/**
 * Zhaogui AI Dispatch - 極速啟動優化器 (Turbo Launch Optimizer)
 * 目標：零延遲啟動、背景預熱、智慧偵測
 */

const PORT = 3001;
const PROJECT_ROOT = path.resolve(__dirname, '..');

function log(msg, type = 'INFO') {
    const colors = { INFO: '\x1b[96m', SUCCESS: '\x1b[92m', ERROR: '\x1b[91m', RESET: '\x1b[0m' };
    console.log(`${colors[type] || ''}[TurboLaunch] ${msg}${colors.RESET}`);
}

async function isServerRunning() {
    return new Promise((resolve) => {
        const req = http.get(`http://localhost:${PORT}/api/health`, (res) => {
            resolve(res.statusCode === 200);
        });
        req.on('error', () => resolve(false));
        req.setTimeout(500, () => {
            req.destroy();
            resolve(false);
        });
    });
}

async function startServer() {
    log('正在背景啟動伺服器引擎...', 'INFO');
    const server = spawn('node', ['server.js'], {
        cwd: PROJECT_ROOT,
        detached: true,
        stdio: 'ignore',
        shell: true,
        env: { ...process.env, AUTO_OPEN_BROWSER: '0' }
    });
    server.unref();

    // 輪詢直到成功或超時 (最大 5 秒)
    for (let i = 0; i < 50; i++) {
        if (await isServerRunning()) {
            log('伺服器已就緒。', 'SUCCESS');
            return true;
        }
        await new Promise(r => setTimeout(r, 100));
    }
    log('伺服器啟動超時，請檢查 logs。', 'ERROR');
    return false;
}

function openBrowser(page = 'mobile.html') {
    const url = `http://localhost:${PORT}/launcher.html?page=${page}&fast=1`;
    log(`正在開啟戰情室: ${page}`, 'SUCCESS');
    
    // 使用 msedge app 模式以獲得最優體驗
    const cmd = `start msedge --app="${url}"`;
    spawn('cmd', ['/c', cmd], { detached: true, stdio: 'ignore', shell: true }).unref();
}

async function main() {
    const page = process.argv[2] || 'mobile.html';
    
    // 1. 檢查是否已經運行
    if (!(await isServerRunning())) {
        const ok = await startServer();
        if (!ok) process.exit(1);
    } else {
        log('伺服器已在運行中，直接連結。', 'INFO');
    }

    // 2. 啟動瀏覽器
    openBrowser(page);
    
    log('優化啟動程序完成。', 'SUCCESS');
    setTimeout(() => process.exit(0), 500);
}

main();
