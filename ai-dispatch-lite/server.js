import express from 'express';
import fs from 'fs';
import path from 'path';
import cors from 'cors';
import bodyParser from 'body-parser';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(cors());
app.use(bodyParser.json({ limit: '50mb' }));
app.use(express.static('public')); // 提供前端靜態檔案

// ══════════════════════════════════════════════════════
//  一、初始化資料夾與檔案
// ══════════════════════════════════════════════════════
const DATA_DIR = path.join(__dirname, 'data');
const REPORTS_DIR = path.join(DATA_DIR, 'reports');
const BACKUPS_DIR = path.join(DATA_DIR, 'backups');
const LATEST_FILE = path.join(DATA_DIR, 'latest.json');
const LOG_FILE = path.join(DATA_DIR, 'system-log.jsonl');

[DATA_DIR, REPORTS_DIR, BACKUPS_DIR].forEach(dir => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

if (!fs.existsSync(LATEST_FILE)) fs.writeFileSync(LATEST_FILE, '{}');
if (!fs.existsSync(LOG_FILE)) fs.writeFileSync(LOG_FILE, '');

// ══════════════════════════════════════════════════════
//  輔助函式：寫日誌與備份
// ══════════════════════════════════════════════════════
function writeLog(step, status, message, extra = {}) {
  const logEntry = {
    timestamp: new Date().toISOString(),
    step,
    status,
    message,
    ...extra
  };
  fs.appendFileSync(LOG_FILE, JSON.stringify(logEntry) + '\n');
}

function backupFile(srcPath, filename) {
  const destPath = path.join(BACKUPS_DIR, `${Date.now()}_${filename}`);
  fs.copyFileSync(srcPath, destPath);
  return destPath;
}

// ══════════════════════════════════════════════════════
//  二、API 路由實作
// ══════════════════════════════════════════════════════

// 1. 系統健康檢查
app.get('/api/health', (req, res) => {
  res.json({ success: true, message: '系統運行中', timestamp: new Date() });
});

// 2. 解析報告 (唯一主輸入入口調用)
app.post('/api/report/parse', (req, res) => {
  const { rawText } = req.body;
  if (!rawText) return res.status(400).json({ success: false, step: '解析', message: '原始輸入內容不可為空' });

  try {
    writeLog('接收', '成功', '接收到原始業績文字');
    
    // 正則拆解日期、平台、模式
    const dateMatch = rawText.match(/(\d{1,2}\/\d{1,2})/);
    const platformMatch = rawText.match(/(民視|奕心|公司)/);
    const reportDate = dateMatch ? dateMatch[1] : '3/21'; // 預設
    const platform = platformMatch ? platformMatch[1] : '未指定平台';

    // 此處為簡易 Regex 解析人員與金額範例，供一條龍運作
    const rows = [];
    const lines = rawText.split('\n');
    let totalRevenue = 0;

    for (const line of lines) {
      if (line.includes('｜')) { // 假設格式：李玲玲｜【追續】25｜【續單】719085｜【總業績】952675
        const parts = line.split('｜');
        const name = parts[0].replace(/^\d+、/, '').trim();
        const followCnt = parseInt(line.match(/【追續】(\d+)/)?.[1] || 0);
        const followAmt = parseInt(line.match(/【續單】([\d,]+)/)?.[1].replace(/,/g, '') || 0);
        const revTotal  = parseInt(line.match(/【總業績】([\d,]+)/)?.[1].replace(/,/g, '') || 0);
        
        // 成交率、派單成交等預設或由算法衍生
        rows.push({
          name,
          followupCount: followCnt,
          followupAmount: followAmt,
          revenueAmount: revTotal,
          dealsCount: followCnt, // 派單成交借用追續通數
          dealRate: revTotal > 0 ? ((followCnt / revTotal) * 100).toFixed(2) : '0'
        });
        totalRevenue += revTotal;
      }
    }

    const parsedData = {
      reportDate,
      platform,
      totalRevenue,
      rows
    };

    writeLog('解析', '成功', `解析成功，共 ${rows.length} 筆人員資料`);
    res.json({ success: true, step: '解析', message: '解析成功', data: parsedData });
  } catch (err) {
    writeLog('解析', '失敗', err.message);
    res.status(500).json({ success: false, step: '解析', message: `解析出錯: ${err.message}` });
  }
});

// 3. 審計檢查
app.post('/api/report/audit', (req, res) => {
  const { data } = req.body;
  if (!data || !data.rows) return res.status(400).json({ success: false, step: '審計', message: '缺少解析數據' });

  try {
    const { rows, totalRevenue } = data;
    let errors = [];

    // 規則 4：總計與個別加總比對
    const calcTotal = rows.reduce((acc, r) => acc + r.revenueAmount, 0);
    if (calcTotal !== totalRevenue) {
       errors.push(`總計金額不一致：表顯 ${totalRevenue}，明細加總 ${calcTotal}`);
    }

    // 規則 5：有成交但業績=0
    rows.forEach(r => {
      if (r.dealsCount > 0 && r.revenueAmount === 0) {
        errors.push(`${r.name} 有成交通量但總業績為零`);
      }
    });

    if (errors.length > 0) {
      writeLog('審計', '失敗', errors.join('; '));
      return res.json({ success: false, step: '審計', message: '審計未通過', errors });
    }

    writeLog('審計', '成功', '審計全數通過');
    res.json({ success: true, step: '審計', message: '審計通過' });
  } catch (err) {
    writeLog('審計', '失敗', err.message);
    res.status(500).json({ success: false, step: '審計', message: `審計出錯: ${err.message}` });
  }
});

// 4. 排名排序
app.post('/api/report/rank', (req, res) => {
  const { data } = req.body;
  if (!data || !data.rows) return res.status(400).json({ success: false, step: '排序', message: '缺少審計數據' });

  try {
    const sorted = [...data.rows].sort((a, b) => {
      // 規則 6 排序：總業績 ➔ 成交率 ➔ 派單成交 ➔ 追續單金額
      if (b.revenueAmount !== a.revenueAmount) return b.revenueAmount - a.revenueAmount;
      if (parseFloat(b.dealRate) !== parseFloat(a.dealRate)) return parseFloat(b.dealRate) - parseFloat(a.dealRate);
      if (b.dealsCount !== a.dealsCount) return b.dealsCount - a.dealsCount;
      return b.followupAmount - a.followupAmount;
    });

    // 衍生 A1, A2, B, C 分組 (測試性分組)
    const ranked = sorted.map((r, i) => {
      let group = 'C';
      if (i < 4) group = 'A1';
      else if (i < 10) group = 'A2';
      else if (i < 18) group = 'B';
      return { ...r, rank: i + 1, group };
    });

    writeLog('排序', '成功', '排名計算完成');
    res.json({ success: true, step: '排序', message: '排序成功', data: ranked });
  } catch (err) {
    writeLog('排序', '失敗', err.message);
    res.json({ success: false, step: '排序', message: `排序出錯: ${err.message}` });
  }
});

// 5. 生成公告 / 播報 / LINE (合併到一個端點處理，或可分流)
app.post('/api/report/generate_outputs', (req, res) => {
  const { rankedData, reportDate } = req.body;
  if (!rankedData) return res.json({ success: false, step: '公告', message: '缺少排名數據' });

  try {
    // 簡單生成文字
    let announce = `📣【AI 派單公告｜${reportDate}】\n\n`;
    rankedData.forEach(r => {
      announce += `${r.rank}、${r.name} (${r.group}) 業績: ${r.revenueAmount.toLocaleString()}\n`;
    });

    const broadcast = `🔊 各位夥伴請注意！${reportDate} 最新排名揭曉：第一名 ${rankedData[0]?.name || ''}，業績達 ${rankedData[0]?.revenueAmount.toLocaleString()}。`;
    const lineText = `【AI派單通知】${reportDate} 第一名 ${rankedData[0]?.name}。查看完整：網址`;

    writeLog('公告', '成功', '公告與周邊文本生成');
    res.json({
      success: true,
      data: { announce, broadcast, lineText }
    });
  } catch (err) {
    writeLog('公告', '失敗', err.message);
    res.json({ success: false, step: '公告', message: `生成出錯: ${err.message}` });
  }
});

// 6. 存檔、備份、更新 latest.json
app.post('/api/report/save', (req, res) => {
  const { fullState } = req.body;
  if (!fullState) return res.status(400).json({ success: false, step: '存檔', message: '缺少存檔狀態' });

  try {
    const filename = `report_${Date.now()}.json`;
    const reportPath = path.join(REPORTS_DIR, filename);

    // 1. 寫入正式檔案
    fs.writeFileSync(reportPath, JSON.stringify(fullState, null, 2));

    // 2. 更新 latest.json
    fs.writeFileSync(LATEST_FILE, JSON.stringify(fullState, null, 2));

    // 3. 備份
    backupFile(reportPath, filename);

    writeLog('存檔', '成功', `存檔與備份完成：${filename}`);
    res.json({ success: true, step: '存檔', message: '已輸入 / 已存入 / 已備份', path: reportPath });
  } catch (err) {
    writeLog('存檔', '失敗', err.message);
    res.status(500).json({ success: false, step: '存檔', message: `存檔出錯: ${err.message}` });
  }
});

// 7. 讀取最新、歷史、日誌
app.get('/api/report/latest', (req, res) => {
  try {
    const latest = fs.readFileSync(LATEST_FILE, 'utf-8');
    res.json({ success: true, data: JSON.parse(latest) });
  } catch (err) {
    res.json({ success: false, data: {} });
  }
});

app.get('/api/logs', (req, res) => {
  try {
    const logs = fs.readFileSync(LOG_FILE, 'utf-8').split('\n').filter(Boolean).map(JSON.parse);
    res.json({ success: true, data: logs });
  } catch (err) {
    res.json({ success: false, data: [] });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
