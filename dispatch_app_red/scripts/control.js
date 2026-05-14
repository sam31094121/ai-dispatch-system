const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

/**
 * Zhaogui AI Dispatch - 系統終極串連優化器 (Ultimate Master Connector)
 * 核心目標：同步串連、智慧修復、立此類推、全自動升級
 */

const PROJECT_ROOT = path.resolve(__dirname, '..');
const SCRATCH_DIR = path.join(PROJECT_ROOT, 'scratch');
const LOG_DIR = path.join(PROJECT_ROOT, 'logs');
const DATA_DIR = path.join(PROJECT_ROOT, 'data');

// 確保目錄存在
[LOG_DIR, DATA_DIR, SCRATCH_DIR].forEach(dir => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

function log(msg, type = 'INFO') {
  const timestamp = new Date().toLocaleString('zh-TW');
  const colors = {
    INFO: '\x1b[96m',
    SUCCESS: '\x1b[92m',
    WARN: '\x1b[93m',
    ERROR: '\x1b[91m',
    RESET: '\x1b[0m'
  };
  console.log(`${colors[type]}[${timestamp}] [Connector] ${msg}${colors.RESET}`);
}

async function runCommand(cmd, args, label) {
  return new Promise((resolve, reject) => {
    log(`正在執行 ${label}...`);
    const child = spawn(cmd, args, { cwd: PROJECT_ROOT, shell: true });

    child.stdout.on('data', (data) => {
      const text = data.toString().trim();
      if (text) console.log(`  \x1b[90m[${label}]\x1b[0m ${text}`);
    });

    child.stderr.on('data', (data) => {
      console.error(`  \x1b[31m[${label} ERROR]\x1b[0m ${data.toString()}`);
    });

    child.on('close', (code) => {
      if (code === 0) {
        log(`${label} 執行成功`, 'SUCCESS');
        resolve();
      } else {
        log(`${label} 執行失敗 (代碼: ${code})`, 'ERROR');
        reject(new Error(`${label} 失敗`));
      }
    });
  });
}

/**
 * 自動偵測並套用最新的資料修正
 */
async function syncLatestData() {
  log('正在檢查資料同步狀態...');
  const files = fs.readdirSync(PROJECT_ROOT)
    .filter(f => f.startsWith('scratch_update_') && f.endsWith('.js'))
    .sort()
    .reverse();
  
  if (files.length > 0) {
    const latest = files[0];
    log(`偵測到最新升級腳本: ${latest}`, 'SUCCESS');
    
    // 檢查是否已執行過 (透過紀錄檔)
    const syncLog = path.join(DATA_DIR, 'sync_history.json');
    let history = {};
    if (fs.existsSync(syncLog)) history = JSON.parse(fs.readFileSync(syncLog, 'utf8'));

    if (history.lastExecuted !== latest) {
      log(`正在套用資料同步升級...`);
      try {
        await runCommand('node', [latest], '資料同步');
        history.lastExecuted = latest;
        history.lastSync = new Date().toISOString();
        fs.writeFileSync(syncLog, JSON.stringify(history, null, 2));
        log('資料同步升級完成', 'SUCCESS');
      } catch (e) {
        log(`資料同步失敗: ${e.message}`, 'ERROR');
      }
    } else {
      log('資料已是最新版本，無需重複同步。');
    }
  }
}

/**
 * 核心：智慧修復與立此類推
 */
async function performSmartFix() {
  log('正在執行立此類推智慧檢查...');
  // 這裡可以呼叫 smartFix.service.js 的 CLI 版本或透過一個小腳本執行
  // 假設我們有一個專用的修復腳本
  const repairScript = path.join(PROJECT_ROOT, 'scripts', 'runSmartFix.js');
  if (fs.existsSync(repairScript)) {
    await runCommand('node', [repairScript], '智慧修復');
  } else {
    log('智慧修復腳本未就緒，跳過此步驟。', 'WARN');
  }
}

async function connect() {
  log('======================================================');
  log('   兆櫃 AI 派單系統 - 全線串連優化升級 (Master v2.6)');
  log('======================================================');

  try {
    // 0. 執行總決算保護企劃 (確保 5/9 全部都不動)
    await runCommand('node', ['scripts/enforceSettlementPlan.js'], '保護企劃');

    // 1. 自動版本升級
    await runCommand('node', ['src/autoUpgrade.js'], '系統版本更新');

    // 2. 資料同步與串連
    await syncLatestData();

    // 3. 智慧修復 (立此類推)
    await performSmartFix();

    // 4. 系統自檢
    await runCommand('npm', ['run', 'check:syntax'], '系統完整性校驗');

    // 5. 啟動伺服器並自動開啟
    log('正在開啟戰情室主引擎...', 'SUCCESS');
    
    // 設定要開啟的所有頁面
    const openPages = ['index.html', 'mobile.html', 'broadcast.html'];
    
    const server = spawn('node', ['server.js'], {
      cwd: PROJECT_ROOT,
      detached: true,
      stdio: 'inherit',
      shell: true,
      env: { 
        ...process.env, 
        AUTO_OPEN_BROWSER: '1', 
        OPEN_PAGES: openPages.join(','),
        SYSTEM_CONNECTED: 'true'
      }
    });

    server.unref();
    
    log('======================================================');
    log('   全部串連成功！三大戰情室已自動開啟。', 'SUCCESS');
    log('   系統已進入「立此類推」自動巡航模式。');
    log('======================================================');

    setTimeout(() => process.exit(0), 1500);

  } catch (e) {
    log(`串連程序發生嚴重錯誤: ${e.message}`, 'ERROR');
    process.exit(1);
  }
}

connect();
