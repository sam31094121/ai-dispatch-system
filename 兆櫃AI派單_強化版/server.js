import express from 'express';
import fs from 'fs';
import path from 'path';
import cors from 'cors';
import bodyParser from 'body-parser';
import { fileURLToPath } from 'url';
import { sortEmployees } from './shared/contract.mjs';

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

    const rows = [];
    const lines = rawText.split('\n');
    let totalRevenue = 0;

    for (const line of lines) {
      if (line.includes('｜')) { 
        const parts = line.split('｜');
        const name = parts[0].replace(/^\d+、/, '').trim();
        const followCnt = parseInt(line.match(/【追續】(\d+)/)?.[1] || 0);
        const followAmt = parseInt(line.match(/【續單】([\d,]+)/)?.[1].replace(/,/g, '') || 0);
        const revTotal  = parseInt(line.match(/【總業績】([\d,]+)/)?.[1].replace(/,/g, '') || 0);
        
        rows.push({
          name,
          followupCount: followCnt,
          followupAmount: followAmt,
          revenueAmount: revTotal,
          dealsCount: followCnt, 
          dealRate: revTotal > 0 ? ((followCnt / revTotal) * 100).toFixed(2) : '0'
        });
        totalRevenue += revTotal;
      }
    }

    const parsedData = { reportDate, platform, totalRevenue, rows };

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

    const calcTotal = rows.reduce((acc, r) => acc + r.revenueAmount, 0);
    if (calcTotal !== totalRevenue) {
       errors.push(`總計金額不一致：表顯 ${totalRevenue}，明細加總 ${calcTotal}`);
    }

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

// 4. 排名排序（使用 shared/contract.mjs 共用排序契約）
app.post('/api/report/rank', (req, res) => {
  const { data } = req.body;
  if (!data || !data.rows) return res.status(400).json({ success: false, step: '排序', message: '缺少審計數據' });

  try {
    // 欄位映射：內部名 → 契約名
    const contractRows = data.rows.map(r => ({
      ...r,
      totalRevenue: r.revenueAmount,
      renewRevenue: r.followupAmount,
      renewDeals:   r.followupCount ?? r.dealsCount ?? 0
    }));

    // 使用共用契約排序（唯一真理來源）
    const sorted = sortEmployees(contractRows);

    // 分組 + 保留原始欄位名供前端使用
    const ranked = sorted.map(r => {
      const idx = r.rank - 1;
      let group = 'C';
      if (idx < 4) group = 'A1';
      else if (idx < 10) group = 'A2';
      else if (idx < 18) group = 'B';
      return { ...r, group };
    });

    writeLog('排序', '成功', '排名計算完成（共用契約）');
    res.json({ success: true, step: '排序', message: '排序成功', data: ranked });
  } catch (err) {
    writeLog('排序', '失敗', err.message);
    res.json({ success: false, step: '排序', message: `排序出錯: ${err.message}` });
  }
});

// 5. 生成輸出
app.post('/api/report/generate_outputs', (req, res) => {
  const { rankedData, reportDate } = req.body;
  if (!rankedData) return res.json({ success: false, step: '公告', message: '缺少排名數據' });

  try {
    let announce = `📣【AI 派單公告｜${reportDate}】\n\n`;
    rankedData.forEach(r => {
      announce += `${r.rank}、${r.name} (${r.group}) 業績: ${r.revenueAmount.toLocaleString()}\n`;
    });

    const broadcast = `🔊 各位夥伴請注意！${reportDate} 最新排名揭曉：第一名 ${rankedData[0]?.name || ''}，業績達 ${rankedData[0]?.revenueAmount.toLocaleString()}。`;
    const lineText = `【AI派單通知】${reportDate} 第一名 ${rankedData[0]?.name}。`;

    writeLog('公告', '成功', '公告與周邊文本生成');
    res.json({ success: true, data: { announce, broadcast, lineText } });
  } catch (err) {
    writeLog('公告', '失敗', err.message);
    res.json({ success: false, step: '公告', message: `生成出錯: ${err.message}` });
  }
});

// 6. 存檔與備份
app.post('/api/report/save', (req, res) => {
  const { fullState } = req.body;
  if (!fullState) return res.status(400).json({ success: false, step: '存檔', message: '缺少存檔狀態' });

  try {
    const filename = `report_${Date.now()}.json`;
    const reportPath = path.join(REPORTS_DIR, filename);

    const tmpReport = reportPath + '.tmp';
    const tmpLatest = LATEST_FILE + '.tmp';

    fs.writeFileSync(tmpReport, JSON.stringify(fullState, null, 2));
    fs.renameSync(tmpReport, reportPath);

    fs.writeFileSync(tmpLatest, JSON.stringify(fullState, null, 2));
    fs.renameSync(tmpLatest, LATEST_FILE);

    backupFile(reportPath, filename);

    writeLog('存檔', '成功', `存檔與備份完成：${filename}`);
    res.json({ success: true, step: '存檔', message: '已輸入 / 已存入 / 已備份', path: reportPath });
  } catch (err) {
    writeLog('存檔', '失敗', err.message);
    res.status(500).json({ success: false, step: '存檔', message: `存檔出錯: ${err.message}` });
  }
});

app.get('/api/report/latest', (req, res) => {
  try {
    const latest = fs.readFileSync(LATEST_FILE, 'utf-8');
    res.json({ success: true, data: JSON.parse(latest) });
  } catch (err) { res.json({ success: false, data: {} }); }
});

// ══════════════════════════════════════════════════════
//  7. 預載 3/22 業績資料（完整 21 人三平台整合）
// ══════════════════════════════════════════════════════
app.get('/api/preload/322', (req, res) => {
  const preloadText = `1、李玲玲｜【追續】29｜【續單】739,535｜【總業績】1,051,935
2、馬秋香｜【追續】40｜【續單】684,380｜【總業績】869,578
3、王珍珠｜【追續】46｜【續單】548,410｜【總業績】825,800
4、王梅慧｜【追續】27｜【續單】420,440｜【總業績】563,148
5、林沛昕｜【追續】13｜【續單】337,195｜【總業績】523,111
6、林宜靜｜【追續】20｜【續單】316,380｜【總業績】465,088
7、徐華妤｜【追續】14｜【續單】270,240｜【總業績】401,330
8、江麗勉｜【追續】7｜【續單】264,812｜【總業績】394,880
9、高如郁｜【追續】15｜【續單】206,355｜【總業績】350,289
10、廖姿惠｜【追續】15｜【續單】98,748｜【總業績】314,714
11、湯玉琦｜【追續】16｜【續單】77,680｜【總業績】299,304
12、高美雲｜【追續】11｜【續單】60,718｜【總業績】223,268
13、蘇淑玲｜【追續】11｜【續單】79,550｜【總業績】181,376
14、陳玲華｜【追續】11｜【續單】91,470｜【總業績】176,988
15、梁依萍｜【追續】13｜【續單】74,990｜【總業績】152,660
16、鄭珮恩｜【追續】23｜【續單】67,815｜【總業績】92,275
17、江沛林｜【追續】8｜【續單】29,930｜【總業績】70,150
18、董昭蘭｜【追續】6｜【續單】29,345｜【總業績】29,345
19、謝啟芳（新人）｜【追續】3｜【續單】15,144｜【總業績】15,144
20、陳旭宜（新人）｜【追續】1｜【續單】3,960｜【總業績】3,960
21、林佩君｜【追續】1｜【續單】2,490｜【總業績】2,490`;

  writeLog('預載', '成功', '載入 3/22 業績預設資料');
  res.json({ success: true, data: preloadText, reportDate: '3/22' });
});

// ══════════════════════════════════════════════════════
//  8. AI 建議生成（每人一句：建議＋激勵＋壓力）
// ══════════════════════════════════════════════════════
app.post('/api/suggestions', (req, res) => {
  const { rankedData } = req.body;
  if (!rankedData || !rankedData.length) {
    return res.status(400).json({ success: false, message: '缺少排名資料' });
  }

  try {
    // 預定義 AI 建議庫：依排名區間給出不同力道的建議
    const suggestions = rankedData.map((person, idx) => {
      const rank = idx + 1;
      const followAmt = (person.followupAmount || 0).toLocaleString();
      const followCnt = person.followupCount || person.dealsCount || 0;
      const revenue = (person.revenueAmount || 0).toLocaleString();

      let advice = '';
      if (rank === 1) {
        advice = `AI 大數據顯示你已正式站上最高級距，建議把【續單】${followAmt} 持續往深處收，優先鎖定高命中率客戶；你現在就是整隊最明顯的壓力中心，前面沒人擋、後面全在追；你今天再補一筆大單，第一名不只是守住，而是再把差距拉大。`;
      } else if (rank <= 3) {
        advice = `AI 大數據顯示你穩住第 ${rank}，建議把【續單】${followAmt} 做滿，優先把高價值名單轉成真正實收；你現在位置很關鍵，守得住就是前段核心，守不住就會被後面追上；你今天只要再補一筆，位置就會更穩。`;
      } else if (rank <= 7) {
        advice = `AI 大數據判讀你仍在主力核心帶，建議把【續單】${followAmt} 和【追續】${followCnt} 做出更高兌現率；你現在與前面差距不大，但若停住容易被後面貼近；你今天只要補一筆，前面會開始感受到壓力。`;
      } else if (rank <= 10) {
        advice = `AI 大數據顯示你目前穩住前十，建議把【追續】${followCnt} 打密，讓【續單】${followAmt} 變成真正成績；你現在不是只守前十，而是已正式踏進前段區；你今天再補一筆像樣實收，前面都會開始看到你。`;
      } else if (rank <= 15) {
        advice = `AI 大數據判讀你目前位於中段衝刺區，建議把【續單】${followAmt} 和【追續】${followCnt} 一起收穩，別讓零散單拖慢節奏；你不是沒能力，而是節奏還能更長、更穩；你今天多補一筆，順位很快就能換回來。`;
      } else if (rank <= 18) {
        advice = `AI 大數據判讀你目前最大優勢仍是量夠，建議把【追續】${followCnt} 先轉現金，不要讓數字停在紙上；你現在不是缺量，是缺真正兌現；你只要把這波收回來，名次會直接往上跳。`;
      } else {
        advice = `AI 大數據判讀你目前屬於起步期，建議先把節奏穩住，不要急、不要空轉，先把可收的單收回來；現在最重要的不是一次衝太快，而是先破第一筆再建立節奏；你只要開張，後面就會越來越順。`;
      }

      return {
        name: person.name,
        rank,
        group: person.group,
        advice
      };
    });

    writeLog('建議', '成功', `已為 ${suggestions.length} 位人員生成 AI 建議`);
    res.json({ success: true, data: suggestions });
  } catch (err) {
    writeLog('建議', '失敗', err.message);
    res.status(500).json({ success: false, message: `建議生成出錯: ${err.message}` });
  }
});

app.get('/api/logs', (req, res) => {
  try {
    const logs = fs.readFileSync(LOG_FILE, 'utf-8').split('\n').filter(Boolean).map(JSON.parse);
    res.json({ success: true, data: logs });
  } catch (err) { res.json({ success: false, data: [] }); }
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
