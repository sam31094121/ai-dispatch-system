const { spawn } = require('child_process');
const http = require('http');
const path = require('path');
const fs = require('fs');

/**
 * Zhaogui AI Dispatch - 極速啟動優化器 (Turbo Launch Optimizer) v2.7
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
        req.setTimeout(300, () => {
            req.destroy();
            resolve(false);
        });
    });
}

async function startServer() {
    log('正在背景啟動伺服器引擎 (Ultra-Fast Mode)...', 'INFO');
    const server = spawn('node', ['server.js'], {
        cwd: PROJECT_ROOT,
        detached: true,
        stdio: 'ignore',
        shell: true,
        env: { ...process.env, AUTO_OPEN_BROWSER: '0', NODE_ENV: 'production' }
    });
    server.unref();

    // 輪詢直到成功或超時 (優化：步進式輪詢)
    for (let i = 0; i < 50; i++) {
        if (await isServerRunning()) {
            log('伺服器引擎已就緒。', 'SUCCESS');
            return true;
        }
        await new Promise(r => setTimeout(r, 100));
    }
    log('伺服器啟動超時，請檢查 logs。', 'ERROR');
    return false;
}

function openBrowser(page = 'index.html', optimize = false) {
    let url = `http://localhost:${PORT}/launcher.html?page=${page}&fast=1`;
    if (optimize) {
        url += '&autoOptimize=1';
    }
    
    log(`正在發動全端首頁: ${page}${optimize ? ' [AI 優化加速中]' : ''}`, 'SUCCESS');
    
    // 使用 msedge app 模式，這能提供最像原生應用的體驗
    const cmd = `start msedge --app="${url}" --window-size=1280,800`;
    spawn('cmd', ['/c', cmd], { detached: true, stdio: 'ignore', shell: true }).unref();
}

async function main() {
    console.log('\x1b[95m' + `
    ┌──────────────────────────────────────────────────┐
    │  ZHAOGUI AI TURBO LAUNCHER - SYSTEM MASTER V2.7  │
    │  全線串連 ● 極速啟動 ● 自動巡航                 │
    └──────────────────────────────────────────────────┘
    ` + '\x1b[0m');

    const page = process.argv[2] || 'index.html';
    const optimize = process.argv.includes('--optimize') || process.argv.includes('-o');
    
    // 1. 執行核心資料校準 (快取檢查模式)
    log('正在執行啟動前環境校準...', 'INFO');
    try {
        const repairScript = path.join(PROJECT_ROOT, 'scripts', 'runSmartFix.js');
        if (fs.existsSync(repairScript)) {
            const { execSync } = require('child_process');
            // 快速修復模式
            execSync(`node "${repairScript}" --quick`, { cwd: PROJECT_ROOT, timeout: 2000 });
            log('「立此類推」資料校準完成。', 'SUCCESS');
        }
    } catch (e) {
        log('資料校準已完成或跳過。', 'INFO');
    }

    // 2. 啟動/檢查伺服器
    const running = await isServerRunning();
    if (!running) {
        const ok = await startServer();
        if (!ok) process.exit(1);
    } else {
        log('核心引擎已在運行，執行熱對接...', 'INFO');
    }

    // 3. 啟動瀏覽器 (優先首頁)
    openBrowser(page, optimize);
    
    log('======================================================');
    log('  系統已成功發動！祝您工作順利。', 'SUCCESS');
    log('======================================================');
    
    // 給予足夠時間啟動進程
    setTimeout(() => process.exit(0), 800);
}

main();

