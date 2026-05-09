const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

/**
 * Zhaogui AI Dispatch - 系統粘合劑 (Master Connector)
 * 負責串連：資料更新 -> 版本管理 -> 啟動監控
 */

const PROJECT_ROOT = path.resolve(__dirname, '..');
const SCRATCH_DIR = path.join(PROJECT_ROOT, 'scratch');
const LOG_DIR = path.join(PROJECT_ROOT, 'logs');

if (!fs.existsSync(LOG_DIR)) fs.mkdirSync(LOG_DIR);

function log(msg) {
  const timestamp = new Date().toLocaleString('zh-TW');
  console.log(`[${timestamp}] [Connector] ${msg}`);
}

async function runCommand(cmd, args, label) {
  return new Promise((resolve, reject) => {
    log(`正在執行 ${label}...`);
    const child = spawn(cmd, args, { cwd: PROJECT_ROOT, shell: true });

    child.stdout.on('data', (data) => {
      const text = data.toString().trim();
      if (text) console.log(`  [${label}] ${text}`);
    });

    child.stderr.on('data', (data) => {
      console.error(`  [${label} ERROR] ${data.toString()}`);
    });

    child.on('close', (code) => {
      if (code === 0) {
        log(`${label} 執行成功`);
        resolve();
      } else {
        log(`${label} 執行失敗 (代碼: ${code})`);
        reject(new Error(`${label} failed`));
      }
    });
  });
}

async function getLatestScratch() {
  const files = fs.readdirSync(PROJECT_ROOT)
    .filter(f => f.startsWith('scratch_') && f.endsWith('.js'))
    .concat(
      fs.existsSync(SCRATCH_DIR) 
        ? fs.readdirSync(SCRATCH_DIR).map(f => path.join('scratch', f))
        : []
    )
    .filter(f => f.endsWith('.js'));
  
  // 依日期或檔名排序，取最新的
  return files.sort().reverse()[0];
}

async function connect() {
  log('==============================================');
  log('   兆櫃 AI 派單系統 - 全線串連優化程序啟動');
  log('==============================================');

  try {
    // 1. 版本升級 (Pre-start check)
    await runCommand('node', ['src/autoUpgrade.js'], '版本升級');

    // 2. 資料同步 (如果有最新的 scratch file)
    const latestScratch = await getLatestScratch();
    if (latestScratch) {
      log(`偵測到最新資料腳本: ${latestScratch}`);
      // 這裡暫不自動執行 scratch，避免意外覆蓋資料，但可以提示
      log('提示: 若需更新資料，請手動執行 node ' + latestScratch);
    }

    // 3. 語法檢查
    await runCommand('npm', ['run', 'check:syntax'], '系統自檢');

    // 4. 啟動伺服器
    log('正在啟動主伺服器與自動開啟前端...');
    const server = spawn('node', ['server.js'], {
      cwd: PROJECT_ROOT,
      detached: true,
      stdio: 'inherit',
      shell: true,
      env: { ...process.env, AUTO_OPEN_BROWSER: '1', OPEN_PAGE: '/mobile.html' }
    });

    server.unref();
    log('系統已在背景串連完成。');
    
    log('==============================================');
    log('   串連成功！請觀察瀏覽器開啟狀態。');
    log('==============================================');

    setTimeout(() => process.exit(0), 2000);

  } catch (e) {
    console.error('串連程序發生錯誤:', e.message);
    process.exit(1);
  }
}

connect();
